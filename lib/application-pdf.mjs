import { APPLICATION_LIMITS, fingerprint, validatePdfFile } from './application-ready.mjs';

// Dependency injected for fixtures. The browser loads its own same-origin PDF worker.
export async function inspectApplicationPdf(file, pdfjs, { signal, onPage = () => {} } = {}) {
  if (file.size > APPLICATION_LIMITS.fileBytes) throw new Error('Each PDF must be at most 10 MB.');
  signal?.throwIfAborted();
  const bytes = new Uint8Array(await file.arrayBuffer());
  validatePdfFile(file, bytes);
  const hash = await fingerprint(bytes);
  signal?.throwIfAborted();
  // PDF.js transfers its input buffer to a worker: never give it the original.
  const task = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false, enableXfa: false, disableFontFace: true });
  const abort = () => { void task.destroy().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 45000);
  try {
    const pdf = await task.promise;
    signal?.throwIfAborted();
    if (pdf.numPages > APPLICATION_LIMITS.pages) throw new Error('Limit: 100 pages per PDF. Keep the original and use a smaller working set.');
    const lowTextPages = [], rotatedPages = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      signal?.throwIfAborted(); onPage(number, pdf.numPages);
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      signal?.throwIfAborted();
      const length = content.items.reduce((sum, item) => sum + (item.str || '').trim().length, 0);
      if (length < 20) lowTextPages.push(number);
      if (page.rotate % 360 !== 0) rotatedPages.push(number);
      page.cleanup();
    }
    const warnings = [];
    if (lowTextPages.length) warnings.push(`Little or no extractable text on page(s) ${lowTextPages.join(', ')}. A scan or sparse page is not necessarily blank: inspect the original visually.`);
    if (rotatedPages.length) warnings.push(`Rotation metadata on page(s) ${rotatedPages.join(', ')}. Check the displayed orientation; nothing was rotated.`);
    return { bytes, hash, pages: pdf.numPages, lowTextPages, warnings };
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (error.name === 'PasswordException') throw new Error('Password-protected PDF: use an authorised unlocked copy. This workspace does not collect passwords.');
    if (error.message?.startsWith('Limit:')) throw error;
    throw new Error('PDF inspection failed or exceeded 45 seconds. The PDF may be damaged or unsupported; no file was added.');
  } finally {
    clearTimeout(timeout); signal?.removeEventListener('abort', abort);
    await task.destroy();
  }
}
