/**
 * postinstall script: copy pdfjs worker to public/ so it's self-hosted.
 *
 * Run automatically after `npm install` via the "postinstall" script
 * in package.json. This guarantees the worker version always matches
 * the installed pdfjs-dist version — no CDN, no version mismatch.
 */
const fs = require('fs');
const path = require('path');

const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
const dest = path.resolve(__dirname, '..', 'public', 'pdf.worker.min.mjs');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✅ Copied pdf.worker.min.mjs to public/');
} else {
  throw new Error(`pdfjs-dist worker not found at ${src}`);
}
