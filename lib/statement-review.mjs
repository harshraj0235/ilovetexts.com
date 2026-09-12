// All statement processing is local. Amounts use integer minor units.
export const STATEMENT_LIMITS = { files: 10, bytes: 20 * 1024 * 1024, pages: 100, rows: 10000 };

const aliases = {
  date: ['date', 'transactiondate', 'txndate', 'valuedate', 'postingdate'],
  description: ['description', 'narration', 'particulars', 'details', 'transactiondetails'],
  debit: ['debit', 'debitamount', 'withdrawal', 'withdrawals', 'withdrawalamt', 'paidout', 'moneyout'],
  credit: ['credit', 'creditamount', 'deposit', 'deposits', 'depositamt', 'paidin', 'moneyin'],
  amount: ['amount', 'signedamount', 'transactionamount'],
  balance: ['balance', 'runningbalance', 'closingbalance', 'availablebalance'],
};
const normalize = value => String(value).toLowerCase().replace(/[^a-z]/g, '');
export function fieldForHeader(value) {
  return Object.keys(aliases).find(key => aliases[key].includes(normalize(value))) || '';
}

export function parseMoney(value) {
  let text = String(value ?? '').trim();
  if (text.length > 64) throw new Error('Amount is too large or malformed.');
  if (!text || text === '-' || text === '—') return null;
  const negative = /^\(.*\)$/.test(text) || /^-/.test(text) || /\s?DR$/i.test(text);
  text = text.replace(/^\((.*)\)$/, '$1').replace(/(?:DR|CR)$/i, '').replace(/^[+-]/, '').replace(/^(?:INR|USD|GBP|EUR|Rs\.?|[₹$£€])\s*/i, '').trim();
  // Accept ungrouped, western-grouped and Indian-grouped decimal-dot amounts.
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(text)) throw new Error('Use an amount such as 1234.50 or 1,234.50.');
  const [whole, fraction = ''] = text.replaceAll(',', '').split('.');
  const exact = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (exact > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large to represent exactly.');
  const cents = Number(exact);
  return negative ? -cents : cents;
}

export const moneyText = cents => cents === null || cents === undefined ? '' : `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)}.${String(Math.abs(cents) % 100).padStart(2, '0')}`;

export function normalizeDate(value, order = 'DMY') {
  const text = String(value).trim();
  let year, month, day;
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) [, year, month, day] = match;
  else {
    match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (match) {
      year = match[3];
      [day, month] = order === 'MDY' ? [match[2], match[1]] : [match[1], match[2]];
    } else {
      match = text.match(/^(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s-]+(\d{4})$/);
      if (!match) throw new Error('Date needs a full year, for example 2026-09-12 or 12/09/2026.');
      day = match[1]; year = match[3];
      month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    }
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number(year) < 1900 || date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) throw new Error('Check the date and day/month setting.');
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function readCsv(text, delimiter = ',') {
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === '"') {
      if (field || closed) throw new Error('CSV contains a misplaced quote.');
      quoted = true;
    } else if (ch === delimiter) { row.push(field); field = ''; closed = false; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
      row = []; field = ''; closed = false;
      if (rows.length > STATEMENT_LIMITS.rows + 1) throw new Error('Limit: 10,000 transaction rows per file.');
    } else {
      if (closed && ch.trim()) throw new Error('CSV contains text after a closing quote.');
      if (!closed) field += ch;
    }
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
  if (rows.length > STATEMENT_LIMITS.rows + 1) throw new Error('Limit: 10,000 transaction rows per file.');
  return rows;
}

function makeRow(values, source, order) {
  const notes = []; let date = String(values.date || '').trim();
  try { date = normalizeDate(date, order); } catch (error) { notes.push(error.message); }
  const parse = key => {
    try { return parseMoney(values[key]); } catch { notes.push(`Check ${key}: invalid amount.`); return null; }
  };
  let debit = parse('debit'), credit = parse('credit');
  const balance = parse('balance');
  if (debit !== null && debit < 0) { notes.push('Debit column should use a positive amount.'); debit = null; }
  if (credit !== null && credit < 0) { notes.push('Credit column should use a positive amount.'); credit = null; }
  if (debit === null && credit === null && values.amount !== undefined) {
    const amount = parse('amount');
    if (amount !== null) { debit = amount < 0 ? -amount : 0; credit = amount >= 0 ? amount : 0; }
  }
  if (debit === null && credit === null) notes.push('Amount or debit/credit columns could not be read.');
  if (debit > 0 && credit > 0) notes.push('Both debit and credit are filled. Verify this row.');
  const description = String(values.description || '').trim();
  if (!description) notes.push('Description is missing.');
  return { ...source, date, description, debit, credit, balance, notes, reviewed: false, excluded: false };
}

export function editStatementRow(row, values) {
  const updated = makeRow(values, row, 'DMY');
  if (updated.notes.length) throw new Error(updated.notes.join(' '));
  return { ...updated, reviewed: true, excluded: row.excluded };
}

export function parseStatementCsv(text, { sourceId = 'csv', sourceName = 'statement.csv', order = 'DMY', delimiter = ',' } = {}) {
  const table = readCsv(text.replace(/^\uFEFF/, ''), delimiter);
  if (!table.length) throw new Error('This file is empty.');
  const fields = table[0].map(fieldForHeader);
  if (!fields.includes('date') || !fields.includes('description') || (!fields.includes('amount') && !fields.includes('debit') && !fields.includes('credit'))) throw new Error('CSV headers must include Date, Description, and either Amount or Debit/Credit. Download the sample for the supported format.');
  if (fields.filter(Boolean).some((key, index, all) => all.indexOf(key) !== index)) throw new Error('Two CSV headers map to the same field. Keep one Date, Description, Debit, Credit, Amount or Balance column.');
  return table.slice(1).map((cells, index) => {
    const values = Object.fromEntries(fields.map((key, cellIndex) => [key, cells[cellIndex]]));
    const row = makeRow(values, { id: `${sourceId}:${index}`, sourceId, sourceName, page: null, line: index + 2, rawText: cells.join(' | ') }, order);
    if (cells.length !== fields.length) row.notes.push('Column count differs from the header. Review CSV quoting.');
    return row;
  });
}

export function groupPdfLines(pages) {
  return pages.flatMap(({ page, items }) => {
    const lines = [];
    [...items].filter(item => item.text.trim()).sort((a, b) => b.y - a.y || a.x - b.x).forEach(item => {
      let line = lines.find(candidate => Math.abs(candidate.y - item.y) <= 2);
      if (!line) { line = { page, y: item.y, items: [] }; lines.push(line); }
      line.items.push(item);
    });
    return lines.sort((a, b) => b.y - a.y).map(line => ({ ...line, items: line.items.sort((a, b) => a.x - b.x), text: line.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ') }));
  });
}

export function parseStatementPdf(pages, { sourceId = 'pdf', sourceName = 'statement.pdf', order = 'DMY' } = {}) {
  const rows = [], issues = []; let headers = [], previousPage = null;
  for (const line of groupPdfLines(pages)) {
    const detected = line.items.map(item => ({ field: fieldForHeader(item.text), x: item.x, right: item.x + (item.width || 0) })).filter(item => item.field);
    if (detected.some(item => item.field === 'date') && detected.some(item => ['amount','debit','credit'].includes(item.field))) { headers = detected; previousPage = line.page; continue; }
    const looksDated = /^\s*(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}[\s-]+[A-Za-z]{3,9}[\s-]+\d{4})\b/.test(line.text);
    if (!looksDated) continue;
    if (rows.length >= STATEMENT_LIMITS.rows) throw new Error('Limit: 10,000 rows. Split the file before importing.');
    if (!headers.length) {
      rows.push({ ...makeRow({}, { id: `${sourceId}:${rows.length}`, sourceId, sourceName, page: line.page, line: null, rawText: line.text }, order), notes: ['Column headings were not recognized. Enter this row manually from the source.'] });
      continue;
    }
    const values = {};
    for (const item of line.items) {
      // Compare numeric right edges, as statement amounts are commonly right aligned.
      const isDate = /^\s*(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\s*$/.test(item.text);
      const numeric = /^[\d,.$₹£€+\-()\s]+(?:DR|CR)?$/i.test(item.text) && !isDate;
      const candidates = numeric ? headers.filter(h => ['debit','credit','balance','amount'].includes(h.field)) : headers.filter(h => ['date','description'].includes(h.field));
      const nearest = [...candidates].sort((a, b) => Math.abs((numeric ? a.right : a.x) - (numeric ? item.x + (item.width || 0) : item.x)) - Math.abs((numeric ? b.right : b.x) - (numeric ? item.x + (item.width || 0) : item.x)))[0];
      if (nearest) values[nearest.field] = `${values[nearest.field] || ''} ${item.text}`.trim();
    }
    const row = makeRow(values, { id: `${sourceId}:${rows.length}`, sourceId, sourceName, page: line.page, line: null, rawText: line.text }, order);
    row.notes.push('Check this automatically extracted PDF row against the source page.');
    if (previousPage !== line.page) row.notes.push('Column positions reused from an earlier page.');
    rows.push(row);
    if (rows.length > STATEMENT_LIMITS.rows) throw new Error('Limit: 10,000 rows. Split the file before importing.');
  }
  if (!rows.length) issues.push('No dated transaction rows recognized. Scans and unsupported layouts need OCR or a CSV export from your bank.');
  issues.push('PDF extraction is a draft. Check for missing rows, wrapped descriptions and summary lines against every source page.');
  return { rows, issues };
}

export function analyzeStatementRows(rows) {
  const warnings = new Map(rows.map(row => [row.id, [...row.notes]]));
  const seen = new Map(), sourceRows = new Map(); let debit = 0, credit = 0;
  rows.filter(row => !row.excluded).forEach(row => {
    debit += row.debit || 0; credit += row.credit || 0;
    const fingerprint = JSON.stringify([row.date, row.description.toLowerCase(), row.debit, row.credit, row.balance]);
    if (seen.has(fingerprint)) {
      warnings.get(row.id).push('Possible duplicate. Compare source files before excluding.');
      warnings.get(seen.get(fingerprint)).push('Possible duplicate. Compare source files before excluding.');
    } else seen.set(fingerprint, row.id);
    if (!sourceRows.has(row.sourceId)) sourceRows.set(row.sourceId, []);
    sourceRows.get(row.sourceId).push(row);
  });
  for (const group of sourceRows.values()) {
    const ordered = [...group];
    // Preserve same-date row order; choose overall statement direction from distinct dates.
    const dated = ordered.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
    if (dated.length > 1 && dated[0].date > dated.at(-1).date) ordered.reverse();
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1], row = ordered[i];
      if (row.balance !== null && prev.balance !== null && (row.debit !== null || row.credit !== null)) {
        if (prev.balance + (row.credit || 0) - (row.debit || 0) !== row.balance) warnings.get(row.id).push('Balance does not reconcile with the preceding row. Check amounts, order and missing rows.');
      }
    }
  }
  const totalsSafe = Number.isSafeInteger(debit) && Number.isSafeInteger(credit);
  return { warnings, debit, credit, totalsSafe, included: rows.filter(row => !row.excluded).length, pending: rows.filter(row => !row.reviewed && !row.excluded).length };
}

export function statementExportRows(rows) {
  // Excel has 15 significant digits. Keep unusually large amounts as exact text.
  const amount = cents => cents === null ? '' : Math.abs(cents) >= 1e15 ? moneyText(cents) : cents / 100;
  return rows.filter(row => !row.excluded).map(row => ({ Date: row.date, Description: row.description, Debit: amount(row.debit), Credit: amount(row.credit), Balance: amount(row.balance), Source: row.sourceName, Page: row.page ?? '', 'CSV row': row.line ?? '', Reviewed: row.reviewed ? 'Yes' : 'No' }));
}

export function exportStatementCsv(rows) {
  const data = statementExportRows(rows);
  if (!data.length) return '';
  const encode = value => {
    // Untrusted strings must not become spreadsheet formulas when opened in Excel.
    const text = typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [Object.keys(data[0]), ...data.map(Object.values)].map(cells => cells.map(encode).join(',')).join('\r\n');
}

export const SAMPLE_STATEMENT_CSV = 'Date,Description,Debit,Credit,Balance\r\n2026-09-01,Opening transfer,0,10000.00,10000.00\r\n2026-09-02,"Office supplies, receipt 1042",1250.50,0,8749.50\r\n2026-09-03,Client payment INV-209,0,4500.00,13249.50\r\n2026-09-04,Internet bill,799.00,0,12450.50\r\n2026-09-04,Internet bill,799.00,0,12450.50\r\n2026-09-05,Travel reimbursement,0,500.00,12950.50';
