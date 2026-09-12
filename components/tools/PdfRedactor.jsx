'use client';
// ═══════════════════════════════════════════════════════
// PdfRedactor.jsx — Visual PII redaction tool
// Draw rectangles to redact, auto-detect PII patterns,
// export permanently redacted PDF
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize } from '@/lib/subscription';

const TOOL_ID = 'pdf-redactor';

// PII detection patterns
const PII_PATTERNS = [
  { name: 'Email', icon: '📧', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, color: '#ef4444' },
  { name: 'Phone', icon: '📞', regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, color: '#f59e0b' },
  { name: 'Aadhaar', icon: '🆔', regex: /\d{4}\s?\d{4}\s?\d{4}/g, color: '#8b5cf6' },
  { name: 'PAN', icon: '🏛️', regex: /[A-Z]{5}\d{4}[A-Z]/g, color: '#0ea5e9' },
  { name: 'Credit Card', icon: '💳', regex: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, color: '#ec4899' },
  { name: 'SSN', icon: '🔐', regex: /\d{3}-\d{2}-\d{4}/g, color: '#6366f1' },
  { name: 'Date of Birth', icon: '🎂', regex: /\b(?:DOB|Date of Birth|D\.O\.B)\s*[:\-]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, color: '#14b8a6' },
  { name: 'Account No', icon: '🏦', regex: /(?:A\/C|Account|Acc)\s*(?:No|Number|#)?\s*[:\-]?\s*\d{8,18}/gi, color: '#f97316' },
];

const S = {
  wrap: { maxWidth: 900, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#ef4444' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(239,68,68,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
};

export default function PdfRedactor({ t, lang }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{ canvas, textItems, pageNum }]
  const [currentPage, setCurrentPage] = useState(0);
  const [redactions, setRedactions] = useState([]); // [{ pageIdx, x, y, w, h, source }]
  const [detected, setDetected] = useState([]); // auto-detected PII
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const canvasRef = useRef();
  const overlayRef = useRef();
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.pdf')) { showToast('Please upload a PDF', 'warning'); return; }
    const sizeCheck = checkFileSize(f.size);
    if (!sizeCheck.allowed) { showToast(`File exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    setFile(f); setStatus('idle'); setPages([]); setRedactions([]); setDetected([]);
  };

  const loadPdf = useCallback(async () => {
    if (!file) return;
    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setStatus('loading'); setProgress(10);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;

      const loadedPages = [];
      const allDetected = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const scale = 1.5;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

        // Extract text with positions for PII detection
        const content = await page.getTextContent();
        const textItems = content.items.filter(item => item.str?.trim()).map(item => {
          const [,,,scaleY, tx, ty] = item.transform;
          return {
            text: item.str,
            x: Math.round(tx * scale),
            y: Math.round((vp.height / scale - ty) * scale),
            w: Math.round((item.width || item.str.length * 6) * scale),
            h: Math.round(Math.abs(scaleY) * scale * 1.3),
          };
        });

        // Auto-detect PII
        const fullText = textItems.map(i => i.text).join(' ');
        PII_PATTERNS.forEach(pattern => {
          const matches = [...fullText.matchAll(pattern.regex)];
          matches.forEach(match => {
            // Find the text item that contains this match
            const matchText = match[0];
            for (const item of textItems) {
              if (item.text.includes(matchText) || matchText.includes(item.text)) {
                allDetected.push({
                  pageIdx: i - 1,
                  x: item.x - 4,
                  y: item.y - 4,
                  w: item.w + 8,
                  h: item.h + 8,
                  source: 'auto',
                  type: pattern.name,
                  icon: pattern.icon,
                  color: pattern.color,
                  value: matchText,
                });
                break;
              }
            }
          });
        });

        loadedPages.push({ canvas, textItems, pageNum: i });
        setProgress(10 + Math.round((i / doc.numPages) * 80));
      }

      setPages(loadedPages);
      setDetected(allDetected);
      setCurrentPage(0);
      setStatus('ready');
      setProgress(100);
      recordUsage(TOOL_ID);
      showToast(`✅ Loaded ${doc.numPages} pages — ${allDetected.length} PII items detected`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('Failed to load PDF: ' + err.message, 'error');
    }
  }, [file]);

  // Draw page on canvas
  useEffect(() => {
    if (!pages.length || !canvasRef.current) return;
    const page = pages[currentPage];
    if (!page) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = page.canvas.width;
    canvasRef.current.height = page.canvas.height;
    ctx.drawImage(page.canvas, 0, 0);

    // Draw existing redactions for this page
    const pageRedactions = redactions.filter(r => r.pageIdx === currentPage);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    pageRedactions.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

    // Draw detected PII (not yet redacted) as highlighted outlines
    const pageDetected = detected.filter(d => d.pageIdx === currentPage && !redactions.some(r => r.x === d.x && r.y === d.y));
    pageDetected.forEach(d => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.setLineDash([]);
    });
  }, [pages, currentPage, redactions, detected]);

  // Mouse drawing
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    setDrawing(true);
    setDrawStart({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY });
  };

  const handleMouseUp = (e) => {
    if (!drawing || !drawStart) { setDrawing(false); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;
    const w = Math.abs(endX - drawStart.x);
    const h = Math.abs(endY - drawStart.y);
    if (w > 5 && h > 5) {
      setRedactions(prev => [...prev, {
        pageIdx: currentPage,
        x: Math.min(drawStart.x, endX),
        y: Math.min(drawStart.y, endY),
        w, h,
        source: 'manual',
      }]);
    }
    setDrawing(false); setDrawStart(null);
  };

  const redactAllPII = () => {
    const newRedactions = detected.filter(d => !redactions.some(r => r.x === d.x && r.y === d.y));
    setRedactions(prev => [...prev, ...newRedactions.map(d => ({ pageIdx: d.pageIdx, x: d.x, y: d.y, w: d.w, h: d.h, source: 'auto' }))]);
    showToast(`🔒 ${newRedactions.length} items redacted`);
  };

  const undoLast = () => {
    setRedactions(prev => prev.slice(0, -1));
  };

  const exportRedacted = async () => {
    if (!pages.length) return;
    setStatus('exporting'); setProgress(0);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const scale = 1.5;

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const pageRedactions = redactions.filter(r => r.pageIdx === i);

        pageRedactions.forEach(r => {
          // Convert from canvas coords (scaled) back to PDF coords
          const pdfX = r.x / scale;
          const pdfY = height - (r.y / scale) - (r.h / scale);
          const pdfW = r.w / scale;
          const pdfH = r.h / scale;
          page.drawRectangle({ x: pdfX, y: pdfY, width: pdfW, height: pdfH, color: rgb(0, 0, 0) });
        });
        setProgress(Math.round(((i + 1) / pdfDoc.getPageCount()) * 80));
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace('.pdf', '-redacted.pdf');
      a.click();

      setStatus('ready'); setProgress(100);
      showToast('✅ Redacted PDF downloaded!');
    } catch (err) {
      console.error(err);
      setStatus('ready');
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const pageDetectedCount = detected.filter(d => d.pageIdx === currentPage).length;
  const pageRedactionCount = redactions.filter(r => r.pageIdx === currentPage).length;

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['🔒 Permanent redaction', '🤖 Auto-detect PII', '🖊️ Draw to redact'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
        <UsageBadge toolId={TOOL_ID} />
      </div>

      {/* Upload */}
      {!file && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={S.dropzone(dragOver)}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop PDF to redact</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Black out sensitive information — emails, phone numbers, Aadhaar, PAN, and more
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Loading */}
      {file && status === 'idle' && (
        <div style={S.card}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>📄 {file.name}</p>
            <button onClick={loadPdf} className="btn-primary" style={{ padding: '14px 40px', cursor: 'pointer', fontSize: '1rem' }}>
              🔍 Scan for sensitive data
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>🔍 Scanning for PII...</span><span>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: 6, borderRadius: 3, background: '#ef4444', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Editor */}
      {(status === 'ready' || status === 'exporting') && pages.length > 0 && (
        <div style={S.card}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {detected.length > 0 && (
              <button onClick={redactAllPII}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                🔒 Redact All PII ({detected.length})
              </button>
            )}
            {redactions.length > 0 && (
              <button onClick={undoLast}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
                ↩ Undo
              </button>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              🖊️ Draw rectangles to manually redact
            </span>
          </div>

          {/* PII summary */}
          {detected.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[...new Set(detected.map(d => d.type))].map(type => {
                const items = detected.filter(d => d.type === type);
                const pattern = PII_PATTERNS.find(p => p.name === type);
                return (
                  <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: `${pattern?.color}10`, color: pattern?.color, border: `1px solid ${pattern?.color}30` }}>
                    {pattern?.icon} {type}: {items.length}
                  </span>
                );
              })}
            </div>
          )}

          {/* Canvas */}
          <div style={{ position: 'relative', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', maxHeight: 600, marginBottom: 16 }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          </div>

          {/* Page navigation */}
          {pages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
              <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>
                ◀ Prev
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Page {currentPage + 1} of {pages.length}
                {pageRedactionCount > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>({pageRedactionCount} redacted)</span>}
              </span>
              <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', opacity: currentPage === pages.length - 1 ? 0.4 : 1 }}>
                Next ▶
              </button>
            </div>
          )}

          {/* Export */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportRedacted} disabled={redactions.length === 0 || status === 'exporting'}
              className="btn-primary"
              style={{ flex: 1, padding: 14, cursor: redactions.length === 0 ? 'default' : 'pointer', fontSize: '1rem', opacity: redactions.length === 0 ? 0.5 : 1 }}>
              {status === 'exporting' ? '⏳ Exporting...' : `📥 Download Redacted PDF (${redactions.length} redactions)`}
            </button>
            <button onClick={() => { setFile(null); setStatus('idle'); setPages([]); setRedactions([]); setDetected([]); }}
              style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a', color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)' }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
