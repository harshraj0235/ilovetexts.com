/**
 * Centralized PDF.js initialization helper.
 * 
 * ALL components that use pdfjs-dist MUST use this module instead of
 * importing pdfjs-dist directly and setting workerSrc manually.
 * 
 * This ensures:
 *  1. The worker is always loaded from our own /public folder (no CDN).
 *  2. The workerSrc is set exactly once, preventing race conditions.
 *  3. Future pdfjs-dist upgrades only need a change in ONE place.
 */

let _pdfjs = null;

/**
 * Returns the pdfjs-dist module with workerSrc already configured.
 * Safe to call multiple times — the worker source is set only once.
 *
 * @returns {Promise<typeof import('pdfjs-dist')>}
 *
 * @example
 *   import { getPdfjs } from '@/lib/pdf-worker';
 *   const pdfjs = await getPdfjs();
 *   const doc = await pdfjs.getDocument({ data: buffer }).promise;
 */
export async function getPdfjs() {
  if (_pdfjs) return _pdfjs;

  const pdfjs = await import('pdfjs-dist');

  // Always use our self-hosted worker — never rely on external CDNs.
  // The file lives at public/pdf.worker.min.mjs and is copied from
  // node_modules/pdfjs-dist/build/pdf.worker.min.mjs during setup.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  _pdfjs = pdfjs;
  return pdfjs;
}
