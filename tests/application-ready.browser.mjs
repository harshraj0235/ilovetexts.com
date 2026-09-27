// Run against a local production server after npm run build.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

const base = process.argv[2] || 'http://localhost:4116';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local test server required.');
await mkdir('test-results', { recursive: true });
const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
doc.addPage().drawText('SYNTHETIC APPLICATION TEST - NOT A VALID CERTIFICATE', { x: 30, y: 700, font, size: 12 });
doc.addPage(); // Intentionally sparse page: must not be called a missing/blank document.
const pdfBytes = Buffer.from(await doc.save());
const browserType = process.argv[3] === 'webkit' ? webkit : chromium;
if (browserType === webkit && new URL(base).protocol !== 'https:') throw new Error('WebKit requires the HTTPS local fixture. See docs/application-ready-release.md.');
const browser = await browserType.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, ignoreHTTPSErrors: new URL(base).protocol === 'https:' });
const page = await context.newPage();
const errors = [], posts = [], failedRequests = [];
let phase = 'workspace';
page.on('pageerror', error => errors.push({ phase, message: error.message }));
page.on('requestfailed', request => failedRequests.push({ url: request.url(), failure: request.failure() }));
page.on('dialog', dialog => dialog.accept());
page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
async function localOnly(route) {
  const url = new URL(route.request().url());
  if (!['localhost', '127.0.0.1'].includes(url.hostname) && !['blob:', 'data:'].includes(url.protocol)) return route.abort();
  return route.continue();
}
await context.route('**/*', localOnly);
const route = `${base}/workflows/application-ready`;
try {
  await page.goto(route, { waitUntil: 'networkidle', timeout: 120000 });
  await page.locator('fieldset[aria-label="Application preparation workspace"]:not([disabled])').waitFor();
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://ilovetexts.com/workflows/application-ready');
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  const storageBefore = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page.getByRole('navigation', { name: 'Application preparation steps' }).getByRole('button', { name: 'Files & checks' }).click();
  await page.getByRole('alert').filter({ hasText: 'Add a university' }).waitFor();
  await page.getByLabel('Target university', { exact: true }).fill('Synthetic University');
  await page.getByLabel('Target programme', { exact: true }).fill('Synthetic Programme');
  await page.getByLabel('Official programme requirements link').fill('https://example.edu/requirements');
  await page.screenshot({ path: `test-results/application-plan-${browserType.name()}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continue to files' }).click();
  await page.getByLabel('Select application PDFs').setInputFiles([
    { name: 'APS-original.pdf', mimeType: 'application/pdf', buffer: pdfBytes },
    { name: 'copy.pdf', mimeType: 'application/pdf', buffer: pdfBytes },
    { name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>not a PDF</html>') },
  ]);
  await page.getByRole('status').filter({ hasText: '2 PDF(s) added' }).waitFor({ timeout: 60000 });
  await page.getByRole('alert').filter({ hasText: 'does not have a PDF header' }).waitFor();
  const original = page.getByRole('article', { name: 'APS-original.pdf', exact: true });
  assert.ok((await original.innerText()).includes('Identical file bytes'));
  assert.ok((await original.innerText()).includes('not necessarily blank'));
  await page.getByLabel('Category for APS-original.pdf', { exact: true }).selectOption('APS certificate');
  const firstRequirement = page.getByRole('region', { name: 'Subjects and grades', exact: true });
  await firstRequirement.getByLabel('APS-original.pdf', { exact: true }).check();
  await firstRequirement.getByLabel('I checked the linked originals', { exact: false }).check();
  assert.ok((await firstRequirement.innerText()).includes('User checked'));
  await page.getByLabel('Requirement title', { exact: true }).fill('Example language requirement');
  await page.getByLabel('Requirement source link', { exact: true }).fill('https://example.edu/language');
  await page.getByLabel('Notes', { exact: true }).fill('Synthetic user-entered requirement, not an official rule.');
  await page.getByRole('button', { name: 'Add requirement', exact: true }).click();
  await page.getByRole('region', { name: 'Example language requirement', exact: true }).waitFor();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Step 2 overflows at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: `test-results/application-mobile-${browserType.name()}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Toggle Theme' }).click();
  await page.screenshot({ path: `test-results/application-dark-${browserType.name()}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Toggle Theme' }).click();
  await page.getByRole('button', { name: 'Review export' }).click();
  assert.equal(await page.getByRole('button', { name: 'Download original-file pack' }).isDisabled(), true);
  await page.getByLabel('I understand this download may be incomplete.', { exact: false }).check();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original-file pack' }).click();
  const download = await downloaded;
  const output = `test-results/application-${browserType.name()}.zip`;
  await download.saveAs(output);
  const zip = await JSZip.loadAsync(await readFile(output));
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.documents.length, 2);
  assert.equal(manifest.checklist.length, 5);
  assert.equal(manifest.checklist[0].status, 'User checked');
  assert.equal(manifest.plan.programmeChecklistConfirmedByUser, false);
  assert.equal(manifest.checklist[4].origin, 'User-entered requirement; not independently verified');
  for (const file of manifest.documents) assert.deepEqual(await zip.file(file.exportPath).async('nodebuffer'), pdfBytes);
  assert.ok((await zip.file('PREPARATION-REPORT.txt').async('string')).includes('No file linked'));
  assert.ok((await page.locator('body').innerText()).includes('Expert review and payments are not available'));
  await page.getByRole('button', { name: 'Back to files and checks' }).click();
  await original.getByRole('button', { name: 'Remove', exact: true }).click();
  assert.ok((await firstRequirement.innerText()).includes('No file linked'));
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Workspace cleared' }).waitFor();
  assert.equal(await page.getByLabel('Target university', { exact: true }).inputValue(), '');
  assert.equal(posts.length, 0, 'No applicant data may be POSTed');
  const storageAfter = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  assert.equal(storageAfter.replace(/"theme":"light",?/, '').replace(/,}/, '}'), storageBefore.replace(/"theme":"light",?/, '').replace(/,}/, '}'));
  assert.deepEqual(errors, [], 'The complete workspace flow must not throw browser errors');
  phase = 'locale navigation';
  // A separate page avoids cancelling pending Link prefetches in the workspace.
  // WebKit reports those deliberate hard-navigation cancellations as page errors.
  const localePage = await context.newPage();
  localePage.on('pageerror', error => errors.push({ phase: 'locale page', message: error.message }));
  await localePage.goto(`${base}/hi/workflows/application-ready`, { waitUntil: 'networkidle' });
  assert.ok((await localePage.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
  assert.equal(await localePage.locator('link[rel=canonical]').getAttribute('href'), 'https://ilovetexts.com/workflows/application-ready');
  assert.deepEqual(errors, []);
  const noJs = await browser.newContext({ javaScriptEnabled: false, ignoreHTTPSErrors: new URL(base).protocol === 'https:' });
  await noJs.route('**/*', localOnly);
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(route, { waitUntil: 'domcontentloaded' });
  assert.equal(await noJsPage.getByLabel('Target university', { exact: true }).isDisabled(), true);
  assert.equal(await noJsPage.getByRole('button', { name: 'Continue to files' }).isDisabled(), true);
  assert.ok((await noJsPage.locator('body').innerText()).includes('Enable JavaScript to use the private document workspace'));
  await noJs.close();
  console.log(`PASS (${browserType.name()}): route, canonical, form validation, real PDF inspection, damaged-file rejection, duplicates, checklist, exact ZIP preservation, removal, mobile/dark, no POSTs, no document persistence, safe no-JavaScript state.`);
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Failed requests:', failedRequests);
  await page.screenshot({ path: `test-results/application-failure-${browserType.name()}.png`, fullPage: true }).catch(() => {});
  throw error;
} finally { await browser.close(); }
