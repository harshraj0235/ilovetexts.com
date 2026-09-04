// ═══════════════════════════════════════════════════════
// pdfEngine.js — PDF.js page renderer + text extractor
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
 * Text block design:
 *   - Extracted at NATIVE (scale=1) coords so grouping is stable
 *   - Scaled to display coords AFTER grouping
 *   - color: transparent by default → PDF image shows perfectly
 *   - Only visible when the block is selected (CSS in TextBlock)
 */
export async function renderPage(page, scale = 1.5) {
  const viewport = page.getViewport({ scale });

  // Render page image
  const canvas = document.createElement('canvas');
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  // Extract text at scale=1 (native PDF coords) for stable grouping
  const nativeVP   = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  // Build items at native scale
  const items = textContent.items
    .filter(item => item.str && item.str.trim())
    .map((item, i) => {
      const [, , , scaleY, tx, ty] = item.transform;
      const fontH = Math.abs(scaleY);          // native font height
      const x = tx;
      const y = nativeVP.height - ty;          // flip Y (PDF = bottom-left origin)
      return {
        text:     item.str,
        x:        Math.round(x),
        y:        Math.round(y - fontH),        // top of text line
        w:        Math.max(Math.round(item.width || fontH * item.str.length * 0.55), 6),
        h:        Math.max(Math.round(fontH * 1.3), 8),
        fontSize: Math.max(Math.round(fontH), 6),
      };
    });

  // Group into LINE blocks at native coords
  // Items on the same Y band (within 3px) that don't have a big X gap → same line
  const LINE_Y_TOL  = 4;   // px
  const LINE_X_GAP  = 60;  // px — gap larger than this starts a new block

  const groups = [];
  for (const item of items) {
    const existing = groups.find(g =>
      Math.abs(g.y - item.y) <= LINE_Y_TOL &&
      item.x <= g.x + g.w + LINE_X_GAP
    );
    if (existing) {
      const right = Math.max(existing.x + existing.w, item.x + item.w);
      existing.text    += ' ' + item.text;
      existing.w        = right - existing.x;
      existing.h        = Math.max(existing.h, item.h);
      existing.fontSize = Math.max(existing.fontSize, item.fontSize);
    } else {
      groups.push({ ...item });
    }
  }

  // Scale grouped blocks to display coords
  const ctx = canvas.getContext('2d');
  const textItems = groups.map((g, i) => {
    const scaleX = Math.round(g.x * scale);
    const scaleY = Math.round(g.y * scale);
    
    // Sample background color just left/above the text to avoid hitting the text ink
    let r = 255, gr = 255, b = 255;
    try {
      const sx = Math.max(0, scaleX - 4);
      const sy = Math.max(0, scaleY - 4);
      const pixel = ctx.getImageData(sx, sy, 1, 1).data;
      r = pixel[0]; gr = pixel[1]; b = pixel[2];
    } catch(e){}
    const hexBg = `#${(1 << 24 | r << 16 | gr << 8 | b).toString(16).slice(1)}`;

    return {
      id:         `block-${i}`,
      text:       g.text.trim(),
      x:          scaleX,
      y:          scaleY,
      width:      Math.max(Math.round(g.w * scale), 20),
      height:     Math.round(g.h * scale),
      fontSize:   Math.round(g.fontSize * scale),
      fontFamily: 'sans-serif',
      color:      '#000000',
      bgColor:    hexBg,
      bold: false, italic: false, underline: false,
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
