// Run against a local server: node tests/workflows.browser.mjs http://localhost:4115
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

const base = process.argv[2] || 'http://localhost:4115';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This smoke test only runs against a local site.');
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [], posts = [];
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  return ['localhost', '127.0.0.1'].includes(url.hostname) || ['blob:', 'data:'].includes(url.protocol) ? route.continue() : route.abort();
});

try {
  await page.goto(base, { waitUntil: 'networkidle', timeout: 120000 });
  const workspaceNav = page.getByRole('navigation', { name: 'Choose your workspace' });
  assert.equal(await workspaceNav.getByRole('link', { name: 'Free Tools', exact: true }).getAttribute('aria-current'), 'page');
  await page.screenshot({ path: 'test-results/home-workspace-switch.png' });
  await workspaceNav.getByRole('link', { name: 'Workflows', exact: true }).click();
  await page.getByRole('heading', { name: 'From a pile of files to a job well done.' }).waitFor();
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://ilovetexts.com/workflows');
  await page.screenshot({ path: 'test-results/workflows-desktop.png', fullPage: true });
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Workflow hub overflows at ${width}px`);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: 'test-results/workflows-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle Theme' }).click();
  assert.ok(await page.locator('html').evaluate(el => el.classList.contains('dark')));
  await page.screenshot({ path: 'test-results/workflows-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle Theme' }).click();

  await page.goto(`${base}/workflows/statement-review`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Try a safe example' }).click();
  const table = page.getByRole('table');
  assert.equal(await table.locator('tbody tr').count(), 6);
  assert.equal(await page.getByRole('button', { name: 'Download Excel', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Save & mark reviewed', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Saved and marked reviewed' }).waitFor();
  await table.locator('tbody tr').nth(4).getByRole('button').click();
  await page.getByRole('button', { name: 'Exclude row', exact: true }).click();
  await page.getByRole('button', { name: 'Restore row', exact: true }).waitFor();
  await page.getByLabel('Export an unverified draft now.', { exact: false }).check();
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV', exact: true }).click();
  const csv = await csvDownload;
  await csv.saveAs('test-results/statement-draft.csv');
  const csvText = await readFile('test-results/statement-draft.csv', 'utf8');
  assert.ok(csvText.includes('Office supplies, receipt 1042'));
  assert.equal((csvText.match(/Internet bill/g) || []).length, 1);
  const excelDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Excel', exact: true }).click();
  await (await excelDownload).saveAs('test-results/statement-draft.xlsx');
  const workbook = XLSX.read(await readFile('test-results/statement-draft.xlsx'), { type: 'buffer' });
  assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets.Transactions).length, 5);
  assert.ok(workbook.Sheets['Read me']);
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Workbench overflows at ${width}px`);
  }
  await page.screenshot({ path: 'test-results/statement-workbench.png', fullPage: true });

  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < 2; index++) {
    const pdfPage = doc.addPage([612, 792]);
    for (const [text, x] of [['Date', 30], ['Description', 125], ['Debit', 315], ['Credit', 395], ['Balance', 475]]) pdfPage.drawText(text, { x, y: 730, size: 11, font });
    for (const [text, x] of [[`0${index + 1}/09/2026`, 30], [`Synthetic transaction ${index + 1}`, 125], ['0.00', 315], ['100.00', 395], [`${(index + 1) * 100}.00`, 475]]) pdfPage.drawText(text, { x, y: 690, size: 11, font });
  }
  await page.getByLabel('Select statement files').setInputFiles({ name: 'synthetic-two-pages.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) });
  await page.getByRole('status').filter({ hasText: '2 transaction rows imported' }).waitFor({ timeout: 60000 });
  assert.equal(await table.locator('tbody tr').count(), 2);
  assert.ok((await table.innerText()).includes('Page 2'));
  assert.ok((await table.innerText()).includes('200.00'));
  assert.ok(await page.getByRole('link', { name: 'Open original PDF at page 1' }).getAttribute('href'));
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await page.getByLabel('Select statement files').setInputFiles({ name: 'broken.csv', mimeType: 'text/csv', buffer: Buffer.from('Wrong,Headers\n1,2') });
  await page.getByRole('alert').filter({ hasText: 'CSV headers must include' }).waitFor();

  await page.goto(`${base}/office`, { waitUntil: 'networkidle' });
  await page.getByLabel('Your name', { exact: true }).fill('Test Person');
  await page.getByLabel('Team or business', { exact: true }).fill('Synthetic Demo Office');
  await page.getByLabel('What would a useful result look like?').fill('A synthetic sample workflow, not a real customer enquiry.');
  await page.getByLabel('I understand this is an enquiry', { exact: false }).check();
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();
  await page.getByRole('status').filter({ hasText: 'Nothing has been sent yet' }).waitFor();
  const mailto = await page.getByRole('link', { name: 'Open email app' }).getAttribute('href');
  assert.ok(mailto.startsWith('mailto:Contact@ilovetexts.com?'));
  assert.ok(decodeURIComponent(mailto).includes('Synthetic Demo Office'));
  assert.equal(posts.length, 0, 'No financial data or enquiry should be posted');
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Office page overflows at ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: workspace navigation, canonical, responsive/dark layouts, review/exclude, CSV/Excel exports, multi-page PDF import, invalid CSV, email draft and no POST requests.');
} finally { await browser.close(); }
