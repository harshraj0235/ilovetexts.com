// ═══════════════════════════════════════════════════════
// imageEngine.js — Image load + Tesseract OCR helpers
// Returns word-level bounding boxes as TextBlock objects
// ═══════════════════════════════════════════════════════

/**
 * Load an image File/Blob and return:
 *   { dataUrl, naturalWidth, naturalHeight }
 */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () =>
        resolve({ dataUrl, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Run Tesseract OCR on a dataUrl or File.
 * onProgress(0-100) is called during recognition.
 * Returns an array of TextBlock-shaped objects with word bounding boxes.
 */
export async function runOCR(source, onProgress = () => {}) {
  // Dynamic import keeps Tesseract out of the initial bundle
  let Tesseract;
  try {
    Tesseract = (await import('tesseract.js')).default;
  } catch {
    // Tesseract not installed — return empty
    return [];
  }

  onProgress(5);

  const result = await Tesseract.recognize(source, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(10 + m.progress * 88));
      }
    },
  });

  onProgress(100);

  // Build TextBlock array from word-level data
  const blocks = [];
  let idx = 0;

  for (const block of result.data.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        for (const word of line.words || []) {
          if (!word.text.trim()) continue;
          const { x0, y0, x1, y1 } = word.bbox;
          const h = Math.max(y1 - y0, 10);
          const w = Math.max(x1 - x0, 10);
          blocks.push({
            id: `ocr-${idx++}`,
            text: word.text,
            x: x0,
            y: y0,
            width: w,
            height: h,
            fontSize: Math.max(Math.round(h * 0.82), 8),
            fontFamily: 'sans-serif',
            color: '#000000',
            bgColor: 'transparent',
            bold: false,
            italic: false,
            underline: false,
            confidence: word.confidence,
          });
        }
      }
    }
  }

  return blocks;
}

/**
 * Flatten image + text blocks onto a canvas and return a blob.
 * format: 'image/png' | 'image/jpeg'
 */
export async function flattenToCanvas(dataUrl, blocks, naturalWidth, naturalHeight, format = 'image/png', quality = 0.95) {
  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext('2d');

  // Draw original image
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl;
  });
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

  // Draw each text block at ORIGINAL (un-zoomed) coordinates
  for (const block of blocks) {
    ctx.save();

    // Background paint (erase/cover original text)
    if (block.bgColor && block.bgColor !== 'transparent') {
      ctx.fillStyle = block.bgColor;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }

    // Text
    const fs = block.fontSize || 12;
    let fontStr = '';
    if (block.italic) fontStr += 'italic ';
    if (block.bold) fontStr += 'bold ';
    fontStr += `${fs}px ${block.fontFamily || 'sans-serif'}`;
    ctx.font = fontStr;
    ctx.fillStyle = block.color || '#000000';
    ctx.textBaseline = 'top';
    ctx.fillText(block.text, block.x, block.y);

    if (block.underline) {
      const tw = ctx.measureText(block.text).width;
      ctx.strokeStyle = block.color || '#000000';
      ctx.lineWidth = Math.max(1, fs * 0.06);
      ctx.beginPath();
      ctx.moveTo(block.x, block.y + fs + 2);
      ctx.lineTo(block.x + tw, block.y + fs + 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  return new Promise((resolve) => canvas.toBlob(resolve, format, quality));
}
