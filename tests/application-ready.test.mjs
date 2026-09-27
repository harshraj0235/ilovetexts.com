import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { APPLICATION_RECIPE, APPLICATION_LIMITS, BASE_REQUIREMENTS, safeSourceUrl, sourcesAreStale, checkBatch, validatePdfFile, fingerprint, safeArchiveName, documentAlerts, requirementStatus, buildApplicationReport, buildApplicationArchive } from '../lib/application-ready.mjs';
import { inspectApplicationPdf } from '../lib/application-pdf.mjs';

const bytes = new TextEncoder().encode('%PDF-1.7\nSynthetic unmodified test bytes');
const plan = { university: 'Synthetic university', programme: 'Demo only', sourceUrl: 'https://example.edu/requirements', confirmed: false };
async function fixture(overrides = {}) { return { id: 'one', name: 'APS.pdf', size: bytes.length, bytes: bytes.slice(), hash: await fingerprint(bytes), pages: 1, kind: 'APS certificate', warnings: [], lowTextPages: [], ...overrides }; }

test('source links reject script, credentials, insecure schemes and malformed URLs', () => {
  assert.equal(safeSourceUrl('javascript:alert(1)'), '');
  assert.equal(safeSourceUrl('http://example.edu'), '');
  assert.equal(safeSourceUrl('https://name:pass@example.edu'), '');
  assert.equal(safeSourceUrl('nonsense'), '');
  assert.equal(safeSourceUrl('https://example.edu/requirements'), 'https://example.edu/requirements');
});
test('limits bound number, aggregate size, extension, signature and per-file size', () => {
  assert.throws(() => checkBatch([], Array.from({ length: 21 }, () => ({ size: 1 }))));
  assert.throws(() => checkBatch([{ size: APPLICATION_LIMITS.totalBytes }], [{ size: 1 }])) ;
  assert.throws(() => validatePdfFile({ name: 'a.html', size: bytes.length }, bytes));
  assert.throws(() => validatePdfFile({ name: 'a.pdf', size: 10 }, new TextEncoder().encode('<html>bad')));
  assert.throws(() => validatePdfFile({ name: 'a.pdf', size: APPLICATION_LIMITS.fileBytes + 1 }, bytes));
  assert.doesNotThrow(() => validatePdfFile({ name: 'a.PDF', size: bytes.length }, bytes));
});
test('archive names prevent traversal, reserved names, bidi overrides and duplicate paths', () => {
  for (const name of ['../../x.pdf', '..\\CON.pdf', 'A\u202ebad.pdf', 'CON.pdf', 'a:b.pdf']) {
    const path = safeArchiveName(name, 0);
    assert.ok(path.startsWith('originals/01-'));
    assert.equal(path.split('/').length, 2);
    assert.ok(!/[\\:\u202e]/.test(path));
  }
  assert.notEqual(safeArchiveName('same.pdf', 0), safeArchiveName('same.pdf', 1));
});
test('duplicate alerts never discard files or authenticate APS', async () => {
  const first = await fixture(), second = await fixture({ id: 'two' });
  assert.ok(documentAlerts(first, [first, second]).some(message => message.includes('Identical')));
  assert.ok(documentAlerts(first, [first]).some(message => message.includes('authentic')));
});
test('removed evidence cannot remain checked and all-linked is not approval', async () => {
  const doc = await fixture();
  assert.equal(requirementStatus(BASE_REQUIREMENTS[0], { fileIds: [doc.id], confirmed: true }, []), 'No file linked');
  const report = buildApplicationReport({ plan, docs: [doc], requirements: BASE_REQUIREMENTS, reviews: {} });
  assert.ok(report.status.includes('not official approval'));
  assert.ok(report.checklist.every(item => item.status === 'No file linked'));
  assert.equal(report.plan.programmeChecklistConfirmedByUser, false);
});
test('source age is explicit and uses the versioned check date', () => {
  assert.equal(sourcesAreStale(new Date(`${APPLICATION_RECIPE.checked}T12:00:00Z`)), false);
  assert.equal(sourcesAreStale(new Date('2027-01-01')), true);
});
test('ZIP preserves exact original bytes, records unresolved items, prevents name collisions', async () => {
  const docs = [await fixture(), await fixture({ id: 'two' })];
  const archive = await JSZip.loadAsync(await buildApplicationArchive({ plan, docs, requirements: BASE_REQUIREMENTS, reviews: {} }));
  const manifest = JSON.parse(await archive.file('manifest.json').async('string'));
  assert.equal(manifest.documents.length, 2);
  for (const item of manifest.documents) {
    assert.deepEqual(await archive.file(item.exportPath).async('uint8array'), bytes);
    assert.equal(item.bytesModified, false);
  }
  assert.ok((await archive.file('PREPARATION-REPORT.txt').async('string')).includes('No file linked'));
});
test('tampered in-memory originals fail closed at export', async () => {
  const doc = await fixture(); doc.bytes[8] = 99;
  await assert.rejects(buildApplicationArchive({ plan, docs: [doc], requirements: BASE_REQUIREMENTS, reviews: {} }), /integrity/);
});
test('PDF inspection hands off a copy and destroys worker resources', async () => {
  let destroyed = 0;
  const pdfjs = { getDocument: ({ data }) => {
    data.fill(0); // Simulate worker ownership/mutation of its transferred copy.
    return { promise: Promise.resolve({ numPages: 1, getPage: async () => ({ rotate: 90, getTextContent: async () => ({ items: [] }), cleanup() {} }) }), destroy: async () => { destroyed++; } };
  } };
  const result = await inspectApplicationPdf(new File([bytes], 'demo.pdf'), pdfjs);
  assert.deepEqual(result.bytes, bytes);
  assert.deepEqual(result.lowTextPages, [1]);
  assert.ok(result.warnings.some(message => message.includes('not necessarily blank')));
  assert.ok(result.warnings.some(message => message.includes('Rotation')));
  assert.equal(destroyed, 1);
});
test('pre-aborted import does not start the PDF engine', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(inspectApplicationPdf(new File([bytes], 'demo.pdf'), { getDocument() { assert.fail('should not run'); } }, { signal: controller.signal }), { name: 'AbortError' });
});

test('cancellation during the final page rejects the import and releases the worker', async () => {
  const controller = new AbortController();
  let destroyed = 0;
  const pdfjs = { getDocument: () => ({
    promise: Promise.resolve({ numPages: 1, getPage: async () => ({
      rotate: 0, cleanup() {}, getTextContent: async () => {
        controller.abort();
        return { items: [{ str: 'Synthetic text that finished during cancellation' }] };
      },
    }) }),
    destroy: async () => { destroyed++; },
  }) };
  await assert.rejects(inspectApplicationPdf(new File([bytes], 'demo.pdf'), pdfjs, { signal: controller.signal }), { name: 'AbortError' });
  assert.ok(destroyed > 0);
});
test('encrypted/oversized PDF failures clean up and do not silently accept files', async () => {
  for (const failure of ['password', 'pages']) {
    let destroyed = false;
    const pdfjs = { getDocument: () => ({ promise: failure === 'password' ? Promise.reject(Object.assign(new Error('password'), { name: 'PasswordException' })) : Promise.resolve({ numPages: 101 }), destroy: async () => { destroyed = true; } }) };
    await assert.rejects(inspectApplicationPdf(new File([bytes], 'demo.pdf'), pdfjs), failure === 'password' ? /Password-protected/ : /100 pages/);
    assert.equal(destroyed, true);
  }
});
