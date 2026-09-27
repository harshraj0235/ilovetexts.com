'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Google Fonts for handwriting (loaded dynamically) ────────────────────────
const HANDWRITING_FONTS = [
  { id: 'caveat', name: 'Casual Hand', family: 'Caveat', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap', preview: 'Hello World' },
  { id: 'dancing', name: 'Elegant Cursive', family: 'Dancing Script', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap', preview: 'Hello World' },
  { id: 'pacifico', name: 'Rounded Fun', family: 'Pacifico', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap', preview: 'Hello World' },
  { id: 'shadows', name: 'Hurried Scrawl', family: 'Shadows Into Light', url: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap', preview: 'Hello World' },
  { id: 'amatic', name: 'Neat Print', family: 'Amatic SC', url: 'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap', preview: 'Hello World' },
  { id: 'satisfy', name: 'Classic Cursive', family: 'Satisfy', url: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap', preview: 'Hello World' },
];

const PAPER_STYLES = [
  { id: 'lined', name: '📓 Lined Notebook', bgColor: '#fafafa', lineColor: '#b8d4f0', marginColor: '#f87171' },
  { id: 'blank', name: '⬜ Blank White', bgColor: '#ffffff', lineColor: null, marginColor: null },
  { id: 'graph', name: '📐 Graph Paper', bgColor: '#f8f9fa', lineColor: '#c3dafe', marginColor: null },
  { id: 'parchment', name: '📜 Parchment', bgColor: '#f5e6c8', lineColor: '#d4b896', marginColor: null },
  { id: 'dark', name: '🌙 Dark Notebook', bgColor: '#1e1e2e', lineColor: '#374151', marginColor: '#6d28d9' },
];

const PAGE_W = 794;  // A4 at 96dpi ≈ this width
const PAGE_H = 1123; // A4 height
const MARGIN_LEFT = 80;
const MARGIN_RIGHT = 40;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const LINE_HEIGHT_PX = 48;

// ─── Draw one page onto a canvas ─────────────────────────────────────────────
function drawPage(canvas, lines, fontFamily, inkColor, fontSize, paperStyle, pageNum, totalPages) {
  const ctx = canvas.getContext('2d');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;

  const paper = PAPER_STYLES.find(p => p.id === paperStyle) || PAPER_STYLES[0];

  // Background
  ctx.fillStyle = paper.bgColor;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // Draw paper lines / grid
  if (paper.id === 'lined') {
    // Margin line
    ctx.strokeStyle = paper.marginColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN_LEFT - 10, 0);
    ctx.lineTo(MARGIN_LEFT - 10, PAGE_H);
    ctx.stroke();
    // Ruled lines
    ctx.strokeStyle = paper.lineColor;
    ctx.lineWidth = 0.8;
    for (let y = MARGIN_TOP; y < PAGE_H - MARGIN_BOTTOM; y += LINE_HEIGHT_PX) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(PAGE_W, y);
      ctx.stroke();
    }
  } else if (paper.id === 'graph') {
    const grid = 20;
    ctx.strokeStyle = paper.lineColor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < PAGE_W; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PAGE_H); ctx.stroke();
    }
    for (let y = 0; y < PAGE_H; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke();
    }
  } else if (paper.id === 'parchment') {
    // Faint horizontal lines
    ctx.strokeStyle = paper.lineColor;
    ctx.lineWidth = 0.6;
    for (let y = MARGIN_TOP; y < PAGE_H - MARGIN_BOTTOM; y += LINE_HEIGHT_PX) {
      ctx.beginPath(); ctx.moveTo(MARGIN_LEFT - 10, y); ctx.lineTo(PAGE_W - MARGIN_RIGHT, y); ctx.stroke();
    }
  } else if (paper.id === 'dark') {
    // Margin
    ctx.strokeStyle = paper.marginColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN_LEFT - 10, 0);
    ctx.lineTo(MARGIN_LEFT - 10, PAGE_H);
    ctx.stroke();
    // Ruled
    ctx.strokeStyle = paper.lineColor;
    ctx.lineWidth = 0.7;
    for (let y = MARGIN_TOP; y < PAGE_H - MARGIN_BOTTOM; y += LINE_HEIGHT_PX) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke();
    }
  }

  // Spiral binding holes (for lined / dark)
  if (paper.id === 'lined' || paper.id === 'dark') {
    ctx.fillStyle = paper.id === 'dark' ? '#111' : '#e5e7eb';
    for (let y = 80; y < PAGE_H - 80; y += 80) {
      ctx.beginPath();
      ctx.arc(20, y, 7, 0, Math.PI * 2);
      ctx.fill();
      if (paper.id === 'lined') {
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Draw text
  ctx.font = `${fontSize}px '${fontFamily}', cursive`;
  ctx.fillStyle = inkColor;
  ctx.textBaseline = 'alphabetic';

  let y = MARGIN_TOP + fontSize;
  const maxWidth = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

  for (const line of lines) {
    if (y > PAGE_H - MARGIN_BOTTOM) break;
    if (line === '') {
      y += LINE_HEIGHT_PX * 0.6;
      continue;
    }
    // Add natural jitter per character for realism
    let x = MARGIN_LEFT;
    for (const char of line) {
      const jitterY = (Math.random() - 0.5) * 2.5;
      const jitterX = (Math.random() - 0.5) * 0.5;
      const jitterAngle = (Math.random() - 0.5) * 0.015;
      ctx.save();
      ctx.translate(x + jitterX, y + jitterY);
      ctx.rotate(jitterAngle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
      x += ctx.measureText(char).width;
    }
    y += LINE_HEIGHT_PX;
  }

  // Page number
  if (totalPages > 1) {
    ctx.font = `14px system-ui, sans-serif`;
    ctx.fillStyle = paper.id === 'dark' ? '#6b7280' : '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText(`${pageNum} / ${totalPages}`, PAGE_W / 2, PAGE_H - 20);
    ctx.textAlign = 'left';
  }
}

// ─── Word-wrap lines for canvas ───────────────────────────────────────────────
function wrapLines(ctx, text, fontFamily, fontSize, maxWidth) {
  ctx.font = `${fontSize}px '${fontFamily}', cursive`;
  const paragraphs = text.split('\n');
  const allLines = [];
  for (const para of paragraphs) {
    if (!para.trim()) { allLines.push(''); continue; }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (current) allLines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) allLines.push(current);
  }
  return allLines;
}

// Lines per page
function paginateLines(lines) {
  const usableH = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM - 30;
  const linesPerPage = Math.floor(usableH / LINE_HEIGHT_PX);
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages.length ? pages : [[]];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TextToHandwriting({ t, lang }) {
  const [text, setText] = useState('');
  const [selectedFont, setSelectedFont] = useState(HANDWRITING_FONTS[0].id);
  const [inkColor, setInkColor] = useState('#1a237e');
  const [paperStyle, setPaperStyle] = useState('lined');
  const [fontSize, setFontSize] = useState(26);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [toast, setToast] = useState(null);
  const [allPageLines, setAllPageLines] = useState([[]]);

  const canvasRef = useRef(null);
  const offscreenRef = useRef(null); // For measuring

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Load Google Fonts ──
  useEffect(() => {
    const fontToLoad = HANDWRITING_FONTS.find(f => f.id === selectedFont);
    if (!fontToLoad) return;

    setFontsLoaded(false);
    // Inject link if not already present
    const linkId = `gfont-${fontToLoad.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = fontToLoad.url;
      document.head.appendChild(link);
    }
    // Wait for font to actually load using FontFace observer trick
    const check = () => {
      if (document.fonts.check(`16px '${fontToLoad.family}'`)) {
        setFontsLoaded(true);
      } else {
        setTimeout(check, 100);
      }
    };
    // Start checking after a short delay for link to parse
    setTimeout(check, 300);
  }, [selectedFont]);

  // ── Render to canvas whenever inputs change ──
  const renderCanvas = useCallback(() => {
    if (!fontsLoaded || !canvasRef.current) return;
    setIsRendering(true);

    const fontFamily = HANDWRITING_FONTS.find(f => f.id === selectedFont)?.family || 'Caveat';

    // Create offscreen canvas for measuring
    const offscreen = document.createElement('canvas');
    offscreen.width = PAGE_W;
    offscreen.height = PAGE_H;
    const offCtx = offscreen.getContext('2d');

    const maxWidth = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
    const wrappedLines = text.trim()
      ? wrapLines(offCtx, text, fontFamily, fontSize, maxWidth)
      : ['Your handwritten text will appear here...'];

    const pages = paginateLines(wrappedLines);
    setAllPageLines(pages);
    setTotalPages(pages.length);
    if (currentPage >= pages.length) setCurrentPage(0);

    const pageIdx = Math.min(currentPage, pages.length - 1);
    drawPage(canvasRef.current, pages[pageIdx], fontFamily, inkColor, fontSize, paperStyle, pageIdx + 1, pages.length);
    setIsRendering(false);
  }, [text, selectedFont, inkColor, paperStyle, fontSize, fontsLoaded, currentPage]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  // ── Navigate pages ──
  const goPage = (dir) => {
    const next = currentPage + dir;
    if (next < 0 || next >= totalPages) return;
    setCurrentPage(next);
  };

  // ── Download PNG ──
  const downloadPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `handwriting-page-${currentPage + 1}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    showToast('PNG downloaded!');
  };

  // ── Download PDF (all pages) ──
  const downloadPdf = async () => {
    if (!fontsLoaded) { showToast('Fonts still loading, try again in a moment', 'warning'); return; }
    showToast('Generating PDF…', 'success');

    const fontFamily = HANDWRITING_FONTS.find(f => f.id === selectedFont)?.family || 'Caveat';

    // Render each page to a temp canvas and collect data URLs
    const dataUrls = [];
    for (let i = 0; i < allPageLines.length; i++) {
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = PAGE_W;
      tmpCanvas.height = PAGE_H;
      drawPage(tmpCanvas, allPageLines[i], fontFamily, inkColor, fontSize, paperStyle, i + 1, allPageLines.length);
      dataUrls.push(tmpCanvas.toDataURL('image/jpeg', 0.92));
    }

    // Build a minimal PDF manually (no external dependency)
    // We'll create an HTML page with all images and trigger print
    const printWin = window.open('', '_blank');
    if (!printWin) { showToast('Pop-up blocked. Allow pop-ups and try again.', 'warning'); return; }

    const html = `<!DOCTYPE html><html><head><title>Handwriting</title>
<style>
  body{margin:0;padding:0;background:#fff}
  img{display:block;width:100%;page-break-after:always;max-width:794px;margin:0 auto}
  @media print{img{page-break-after:always;width:100%;height:auto}}
</style></head><body>
${dataUrls.map(url => `<img src="${url}" />`).join('')}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    printWin.document.write(html);
    printWin.document.close();
    showToast('Print dialog opened — save as PDF!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    showToast('Text copied!');
  };

  const currentFontFamily = HANDWRITING_FONTS.find(f => f.id === selectedFont)?.family || 'Caveat';

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>

        {/* ── Left: Settings panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Text input */}
          <div className="trust-card" style={{ padding: '18px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>✏️ Your Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or paste your text here…&#10;&#10;Long texts are automatically paginated across multiple pages."
              style={{
                width: '100%', height: '180px', fontFamily: 'system-ui, sans-serif',
                fontSize: '0.9rem', lineHeight: 1.6, padding: '12px',
                border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button onClick={async () => { try { const t = await navigator.clipboard.readText(); setText(t); } catch {} }} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>📋 Paste</button>
              <button onClick={() => setText('')} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>🗑 Clear</button>
              {text && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'center', marginLeft: 'auto' }}>{text.length} chars</span>}
            </div>
          </div>

          {/* Handwriting font */}
          <div className="trust-card" style={{ padding: '18px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block', marginBottom: '10px' }}>✍️ Handwriting Style</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {HANDWRITING_FONTS.map(font => (
                <button key={font.id} onClick={() => setSelectedFont(font.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `2px solid ${selectedFont === font.id ? '#8b5cf6' : 'var(--border-light)'}`,
                    background: selectedFont === font.id ? 'rgba(139,92,246,0.08)' : 'var(--bg-section)',
                    textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: selectedFont === font.id ? '#8b5cf6' : 'var(--text-secondary)' }}>{font.name}</span>
                  <span style={{ fontFamily: `'${font.family}', cursive`, fontSize: '1.1rem', color: '#1a237e' }}>Hello</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paper style */}
          <div className="trust-card" style={{ padding: '18px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block', marginBottom: '10px' }}>📄 Paper Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {PAPER_STYLES.map(p => (
                <button key={p.id} onClick={() => setPaperStyle(p.id)}
                  style={{
                    padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.78rem',
                    border: `2px solid ${paperStyle === p.id ? '#8b5cf6' : 'var(--border-light)'}`,
                    background: paperStyle === p.id ? 'rgba(139,92,246,0.08)' : p.bgColor,
                    color: p.id === 'dark' ? '#e2e8f0' : (paperStyle === p.id ? '#8b5cf6' : 'var(--text-secondary)'),
                    fontWeight: paperStyle === p.id ? 700 : 400,
                  }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Ink color + font size */}
          <div className="trust-card" style={{ padding: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>🖊️ Ink Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={inkColor} onChange={e => setInkColor(e.target.value)}
                    style={{ width: '48px', height: '36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', cursor: 'pointer', padding: '2px' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{inkColor}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {['#1a237e', '#1565c0', '#1b5e20', '#4a0000', '#37474f', '#000000', '#b71c1c', '#6a1b9a'].map(c => (
                    <div key={c} onClick={() => setInkColor(c)}
                      style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, cursor: 'pointer', border: inkColor === c ? '2px solid #8b5cf6' : '2px solid transparent', transition: 'border 0.15s' }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>📏 Font Size</label>
                <input type="range" min="18" max="40" step="1" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8b5cf6' }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>{fontSize}px</div>
              </div>
            </div>
          </div>

          {/* Download actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={downloadPng} className="btn-primary" style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}>
              📷 PNG
            </button>
            <button onClick={downloadPdf} className="btn btn-secondary" style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}>
              📄 PDF
            </button>
          </div>
        </div>

        {/* ── Right: Canvas preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Preview {!fontsLoaded && <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⏳ Loading font…</span>}
            </h3>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <button onClick={() => goPage(-1)} disabled={currentPage === 0}
                  style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-section)', cursor: 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>◀</button>
                <span style={{ color: 'var(--text-secondary)' }}>Page {currentPage + 1} / {totalPages}</span>
                <button onClick={() => goPage(1)} disabled={currentPage >= totalPages - 1}
                  style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-section)', cursor: 'pointer', opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}>▶</button>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div style={{
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: '#e5e7eb',
            padding: '12px', display: 'flex', justifyContent: 'center',
          }}>
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%', height: 'auto', display: 'block',
                borderRadius: '4px',
                opacity: isRendering ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            />
          </div>

          {/* Quick stats */}
          {text && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'Characters', value: text.length },
                { label: 'Words', value: text.trim().split(/\s+/).length },
                { label: 'Pages', value: totalPages },
                { label: 'Font', value: HANDWRITING_FONTS.find(f => f.id === selectedFont)?.name },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-section)', border: '1px solid var(--border-light)',
                  fontSize: '0.8rem', color: 'var(--text-secondary)',
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{s.value}</strong> {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Responsive: stack on mobile ── */}
      <style>{`
        @media (max-width: 720px) {
          [data-handwriting-grid] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
