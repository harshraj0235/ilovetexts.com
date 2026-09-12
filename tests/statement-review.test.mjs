import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, moneyText, normalizeDate, readCsv, parseStatementCsv, parseStatementPdf, groupPdfLines, analyzeStatementRows, editStatementRow, exportStatementCsv, statementExportRows, SAMPLE_STATEMENT_CSV } from '../lib/statement-review.mjs';

test('money: decimal cents, zero, Indian grouping and negative balances', () => {
  assert.equal(parseMoney('0'), 0);
  assert.equal(parseMoney('1,23,456.78'), 12345678);
  assert.equal(parseMoney('(500.25)'), -50025);
  assert.equal(parseMoney('100.00 DR'), -10000);
  assert.equal(parseMoney('₹ 2,300.50'), 230050);
  assert.equal(parseMoney(''), null);
  assert.equal(moneyText(-10001), '-100.01');
  assert.equal(parseMoney('0.1') + parseMoney('0.2'), 30);
  assert.throws(() => parseMoney('1.234,56'));
  assert.throws(() => parseMoney('1.234'));
  assert.throws(() => parseMoney('90071992547409.92'));
  assert.equal(parseMoney('90071992547409.91'), Number.MAX_SAFE_INTEGER);
});

test('dates: explicit order, leap dates, full years and validation', () => {
  assert.equal(normalizeDate('09/12/2026'), '2026-12-09');
  assert.equal(normalizeDate('09/12/2026', 'MDY'), '2026-09-12');
  assert.equal(normalizeDate('29 Feb 2024'), '2024-02-29');
  assert.throws(() => normalizeDate('29/02/2026'));
  assert.throws(() => normalizeDate('12/09/26'));
});

test('CSV handles quoted commas, escaped quotes, newlines, BOM and zero amounts', () => {
  const input = '\uFEFFDate,Description,Debit,Credit,Balance\r\n2026-09-01,"Invoice, \"\"A\"\"\ncontinued",0,0,-100.50';
  const [row] = parseStatementCsv(input);
  assert.equal(row.description, 'Invoice, "A"\ncontinued');
  assert.equal(row.debit, 0); assert.equal(row.credit, 0); assert.equal(row.balance, -10050);
  assert.equal(row.notes.length, 0);
  assert.equal(row.reviewed, false);
  assert.deepEqual(readCsv('a;b\r\n1;2', ';'), [['a', 'b'], ['1', '2']]);
});

test('CSV rejects broken quoting, missing and ambiguous headers, empty files', () => {
  assert.throws(() => readCsv('a,"b'));
  assert.throws(() => readCsv('a,"b"c'));
  assert.throws(() => parseStatementCsv('Date,Reference\n2026-09-01,100'));
  assert.throws(() => parseStatementCsv('Date,Value Date,Description,Amount\n2026-09-01,2026-09-01,x,1'));
  assert.throws(() => parseStatementCsv(''));
  const [row] = parseStatementCsv('Date,Description,Amount\n2026-09-01,x,1,extra');
  assert.ok(row.notes.some(note => note.includes('Column count')));
});

test('signed Amount splits debit/credit and invalid amounts remain flagged', () => {
  const rows = parseStatementCsv('Date,Description,Amount\n2026-09-01,Bill,-25.50\n2026-09-02,Refund,25.50\n2026-09-03,Unreadable,not-money');
  assert.equal(rows[0].debit, 2550); assert.equal(rows[1].credit, 2550);
  assert.ok(rows[2].notes.length > 0);
  assert.equal(rows[2].debit, null);
});

const item = (text, x, y, width = 40) => ({ text, x, y, width });
const pdfPage = (page, date, description, debit, credit, balance) => ({ page, items: [
  item('Date', 10, 700, 70), item('Description', 100, 700, 140), item('Debit', 300, 700), item('Credit', 380, 700), item('Balance', 460, 700),
  item(date, 10, 650, 70), item(description, 100, 650, 140), item(debit, 300, 650), item(credit, 380, 650), item(balance, 460, 650),
] });

test('multipage PDFs keep identical Y positions on separate source pages', () => {
  const pages = [pdfPage(1, '01.09.2026', 'Salary INV-100', '0.00', '1000.00', '1000.00'), pdfPage(2, '02.09.2026', 'Office supplies', '100.00', '0.00', '900.00')];
  assert.equal(groupPdfLines(pages).length, 4);
  const { rows } = parseStatementPdf(pages);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.page), [1, 2]);
  assert.deepEqual(rows.map(row => row.date), ['2026-09-01', '2026-09-02']);
  assert.equal(rows[0].credit, 100000); assert.equal(rows[1].debit, 10000);
  assert.equal(rows[0].description, 'Salary INV-100');
  assert.ok(rows.every(row => row.notes.some(note => note.includes('source page'))));
});

test('scans and unrecognized PDF headings give explicit limits', () => {
  assert.ok(parseStatementPdf([{ page: 1, items: [] }]).issues.some(issue => issue.includes('OCR')));
  const result = parseStatementPdf([{ page: 1, items: [item('01/09/2026 Unclear 100', 0, 0)] }]);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].credit, null);
  assert.ok(result.rows[0].notes[0].includes('manually'));
});

test('duplicates flag both rows, never auto-delete, and exclusion fixes balance check', () => {
  const rows = parseStatementCsv(SAMPLE_STATEMENT_CSV);
  const analysis = analyzeStatementRows(rows);
  assert.equal(rows.length, 6); assert.equal(analysis.included, 6); assert.equal(analysis.pending, 6);
  assert.ok(analysis.warnings.get(rows[3].id).some(note => note.includes('duplicate')));
  assert.ok(analysis.warnings.get(rows[4].id).some(note => note.includes('does not reconcile')));
  rows[4].excluded = true;
  const corrected = analyzeStatementRows(rows);
  assert.equal(corrected.included, 5);
  assert.equal(corrected.debit, 204950);
  assert.equal(corrected.credit, 1500000);
  assert.equal([...corrected.warnings.values()].flat().length, 0);
});

test('editing can save zero and cannot mark malformed values reviewed', () => {
  const [row] = parseStatementCsv(SAMPLE_STATEMENT_CSV);
  const edited = editStatementRow(row, { date: row.date, description: 'Corrected', debit: '0', credit: '0', balance: '0' });
  assert.equal(edited.credit, 0); assert.equal(edited.balance, 0); assert.equal(edited.reviewed, true);
  assert.equal(edited.rawText, row.rawText);
  assert.throws(() => editStatementRow(row, { date: row.date, description: 'Bad', debit: 'oops', credit: '0' }));
});

test('CSV export protects formula strings and keeps numeric negatives; excludes removed rows', () => {
  const rows = parseStatementCsv('Date,Description,Amount,Balance\n2026-09-01,=HYPERLINK(1),-10,-10\n2026-09-02,excluded,10,0');
  rows[1].excluded = true;
  const exported = exportStatementCsv(rows);
  assert.ok(exported.includes("'=HYPERLINK(1)"));
  assert.ok(exported.includes('"-10"'));
  assert.ok(!exported.includes('excluded'));
  assert.equal(statementExportRows(rows)[0].Reviewed, 'No');
});

test('CSV limit accepts 10,000 records and rejects one more with or without final newline', () => {
  const header = 'Date,Description,Amount\n';
  const body = '2026-09-01,example,1\n'.repeat(10000);
  assert.equal(parseStatementCsv(header + body).length, 10000);
  assert.throws(() => parseStatementCsv(header + body + '2026-09-01,extra,1'));
  assert.throws(() => parseStatementCsv(header + body + '2026-09-01,extra,1\n'));
});
