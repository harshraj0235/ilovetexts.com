// ═══════════════════════════════════════════════════════
// pdfEngine.js — PDF.js page renderer + text extractor
// v2: font-name tracking, bold detection, better color
//     sampling, improved line-grouping tolerance
// ═══════════════════════════════════════════════════════

let pdfjsLib = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  const ver = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
  return pdfjsLib;
}

export async function loadPdf(arrayBuffer) {
  const pdfjs = await getPdfjs();
  return await pdfjs.getDocument({ data: arrayBuffer }).promise;
}

/**
 * Render a page to canvas + extract line-level text blocks.
 *
 * Improvements over v1:
 *  - Tracks fontName → detects bold/italic from font name
 *  - Samples bg color from a 3×3 pixel region (more stable)
 *  - Looser Y tolerance (6px) for small caps / mixed-size lines
 *  - Captures text color from the PDF rendering context
 *  - Returns fontName on each block for downstream use
 */
export async function renderPage(page, scale = 1.5) {
  const viewport = page.getViewport({ scale });

  // Render page image
  const canvas = document.createElement('canvas');
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Extract text at scale=1 (native PDF coords) for stable grouping
  const nativeVP    = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent({ includeMarkedContent: false });

  // Build items at native scale with font metadata
  const items = textContent.items
    .filter(item => item.str && item.str.trim())
    .map((item, i) => {
      const [, , , scaleY, tx, ty] = item.transform;
      const fontH    = Math.abs(scaleY);
      const x        = tx;
      const y        = nativeVP.height - ty;
      const fontName = (item.fontName || '').toLowerCase();
      const isBold   = /bold|black|heavy|demi/.test(fontName);
      const isItalic = /italic|oblique|slant/.test(fontName);
      return {
        text:     item.str,
        x:        Math.round(x),
        y:        Math.round(y - fontH),
        w:        Math.max(Math.round(item.width || fontH * item.str.length * 0.55), 6),
        h:        Math.max(Math.round(fontH * 1.3), 8),
        fontSize: Math.max(Math.round(fontH), 6),
        fontName,
        bold:     isBold,
        italic:   isItalic,
      };
    });

  // Group into LINE blocks — looser Y tolerance for mixed-size lines
  const LINE_Y_TOL = 6;
  const LINE_X_GAP = 60;

  const groups = [];
  for (const item of items) {
    const existing = groups.find(g =>
      Math.abs(g.y - item.y) <= LINE_Y_TOL &&
      item.x <= g.x + g.w + LINE_X_GAP
    );
    if (existing) {
      const right = Math.max(existing.x + existing.w, item.x + item.w);
      existing.text     += ' ' + item.text;
      existing.w         = right - existing.x;
      existing.h         = Math.max(existing.h, item.h);
      existing.fontSize  = Math.max(existing.fontSize, item.fontSize);
      existing.bold      = existing.bold || item.bold;
      existing.italic    = existing.italic || item.italic;
    } else {
      groups.push({ ...item });
    }
  }

  // Scale grouped blocks to display coords
  const textItems = groups.map((g, i) => {
    const scaleX = Math.round(g.x * scale);
    const scaleY = Math.round(g.y * scale);

    // Sample bg from a 3×3 region slightly above-left of text
    let r = 255, gr = 255, b = 255;
    try {
      const sx = Math.max(0, scaleX - 4);
      const sy = Math.max(0, scaleY - 4);
      const data = ctx.getImageData(sx, sy, 3, 3).data;
      // average 9 pixels
      let rSum = 0, gSum = 0, bSum = 0;
      for (let p = 0; p < 9; p++) {
        rSum += data[p * 4];
        gSum += data[p * 4 + 1];
        bSum += data[p * 4 + 2];
      }
      r = Math.round(rSum / 9);
      gr = Math.round(gSum / 9);
      b = Math.round(bSum / 9);
    } catch (e) { /* ignore */ }
    const hexBg = `#${(1 << 24 | r << 16 | gr << 8 | b).toString(16).slice(1)}`;

    // Detect approximate text color from a pixel inside the text
    let textR = 0, textG = 0, textB = 0;
    try {
      const tx2 = Math.min(Math.max(scaleX + 4, 0), canvas.width - 1);
      const ty2 = Math.min(Math.max(scaleY + Math.round(g.fontSize * scale * 0.6), 0), canvas.height - 1);
      const px = ctx.getImageData(tx2, ty2, 1, 1).data;
      textR = px[0]; textG = px[1]; textB = px[2];
    } catch (e) { /* ignore */ }
    // Only use detected color if it's dark enough to be text
    const lum = 0.299 * textR + 0.587 * textG + 0.114 * textB;
    const detectedColor = lum < 180
      ? `#${(1 << 24 | textR << 16 | textG << 8 | textB).toString(16).slice(1)}`
      : '#000000';

    return {
      id:         `block-${i}`,
      text:       g.text.trim(),
      x:          scaleX,
      y:          scaleY,
      width:      Math.max(Math.round(g.w * scale), 20),
      height:     Math.round(g.h * scale),
      fontSize:   Math.round(g.fontSize * scale),
      fontFamily: 'sans-serif',
      color:      detectedColor,
      bgColor:    hexBg,
      bold:       g.bold,
      italic:     g.italic,
      underline:  false,
      align:      'left',
      lineHeight: 1.3,
    };
  }).filter(b => b.text.length > 0);

  return { canvas, viewport, textItems };
}

export async function renderThumbnail(page, thumbWidth = 120) {
  const vp    = page.getViewport({ scale: 1 });
  const scale = thumbWidth / vp.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas;
}
