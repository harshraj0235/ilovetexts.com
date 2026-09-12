'use client';
// ═══════════════════════════════════════════════════════
// PdfWatermarkRemover.jsx — Detect & remove text watermarks
// Scans PDF text layers for watermark patterns (diagonal,
// repeated, low-opacity text) and removes them.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize } from '@/lib/subscription';

const TOOL_ID = 'pdf-watermark-remover';

// Common watermark text patterns
const WATERMARK_KEYWORDS = [
  'draft', 'confidential', 'sample', 'copy', 'watermark',
  'do not copy', 'do not distribute', 'internal', 'restricted',
  'preliminary', 'for review', 'not for distribution', 'proof',
  'specimen', 'unofficial', 'uncontrolled', 'evaluation copy',
];

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#0ea5e9' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(14,165,233,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
};

export default function PdfWatermarkRemover({ t, lang }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [watermarks, setWatermarks] = useState([]); // detected watermark items
  const [previewBefore, setPreviewBefore] = useState(null);
  const [previewAfter, setPreviewAfter] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [customText, setCustomText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.pdf')) { showToast('Please upload a PDF', 'warning'); return; }
    const sizeCheck = checkFileSize(f.size);
    if (!sizeCheck.allowed) { showToast(`File exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    setFile(f); setStatus('idle'); setWatermarks([]); setPreviewBefore(null); setPreviewAfter(null);
  };

  const detect = useCallback(async () => {
    if (!file) return;
    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setStatus('detecting'); setProgress(10);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
      setPageCount(doc.numPages);

      // Render "before" preview
      const page1 = await doc.getPage(1);
      const vp = page1.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      await page1.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      setPreviewBefore(canvas.toDataURL());
      setProgress(30);

      // Scan all pages for watermark text
      const found = [];
      const searchTerms = [...WATERMARK_KEYWORDS];
      if (customText.trim()) searchTerms.push(customText.trim().toLowerCase());

      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i);
        const content = await pg.getTextContent();
        content.items.forEach(item => {
          const text = (item.str || '').trim().toLowerCase();
          if (!text) return;

          // Check against known watermark patterns
          const isKnownWatermark = searchTerms.some(kw => text.includes(kw));

          // Heuristic: text that's very large (>40pt), rotated, or repeated across pages
          const [a, b, , , ,] = item.transform;
          const rotation = Math.abs(Math.atan2(b, a) * 180 / Math.PI);
          const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]);
          const isLargeRotated = fontSize > 30 && rotation > 10;

          if (isKnownWatermark || isLargeRotated) {
            found.push({
              page: i,
              text: item.str,
              fontSize: Math.round(fontSize),
              rotation: Math.round(rotation),
              reason: isKnownWatermark ? 'Known watermark text' : 'Large rotated text',
            });
          }
        });
        setProgress(30 + Math.round((i / doc.numPages) * 40));
      }

      setWatermarks(found);
      setProgress(80);
      setStatus('detected');

      if (found.length === 0) {
        showToast('No text watermarks detected. The PDF may have image-based watermarks.', 'warning');
      } else {
        showToast(`🔍 Found ${found.length} watermark elements across ${doc.numPages} pages`);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('Detection failed: ' + err.message, 'error');
    }
  }, [file, customText]);

  const removeWatermarks = async () => {
    if (!file || !watermarks.length) return;
    setStatus('removing'); setProgress(0);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);

      // For text watermarks, we recreate pages with the watermark text removed
      // by rendering to image and creating a new PDF (simple but effective approach)
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const srcDoc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;

      const newPdf = await PDFDocument.create();
      const searchTerms = [...WATERMARK_KEYWORDS];
      if (customText.trim()) searchTerms.push(customText.trim().toLowerCase());

      for (let i = 1; i <= srcDoc.numPages; i++) {
        const page = await srcDoc.getPage(i);
        const scale = 2;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext('2d');

        // Custom text rendering that skips watermark items
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Get text content and white-out watermark areas
        const content = await page.getTextContent();
        content.items.forEach(item => {
          const text = (item.str || '').trim().toLowerCase();
          if (!text) return;
          const isWatermark = searchTerms.some(kw => text.includes(kw));
          const [a, b, , d, tx, ty] = item.transform;
          const rotation = Math.abs(Math.atan2(b, a) * 180 / Math.PI);
          const fontSize = Math.abs(a) || Math.abs(d);
          const isLargeRotated = fontSize > 30 && rotation > 10;

          if (isWatermark || isLargeRotated) {
            // White-out the watermark area
            ctx.save();
            ctx.translate(tx * scale, (vp.height / scale - ty) * scale);
            ctx.rotate(-Math.atan2(b, a));
            const w = (item.width || text.length * fontSize * 0.6) * scale;
            const h = fontSize * scale * 1.5;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-4, -h + 4, w + 8, h + 8);
            ctx.restore();
          }
        });

        // Add cleaned page to new PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const jpgBytes = Uint8Array.from(atob(imgData.split(',')[1]), c => c.charCodeAt(0));
        const img = await newPdf.embedJpg(jpgBytes);
        const origPage = pdfDoc.getPage(i - 1);
        const { width, height } = origPage.getSize();
        const newPage = newPdf.addPage([width, height]);
        newPage.drawImage(img, { x: 0, y: 0, width, height });

        setProgress(Math.round((i / srcDoc.numPages) * 90));
      }

      // Generate "after" preview
      const afterBytes = await newPdf.save();
      const afterDoc = await pdfjs.getDocument({ data: new Uint8Array(afterBytes.slice(0)) }).promise;
      const afterPage = await afterDoc.getPage(1);
      const afterVp = afterPage.getViewport({ scale: 1.5 });
      const afterCanvas = document.createElement('canvas');
      afterCanvas.width = afterVp.width; afterCanvas.height = afterVp.height;
      await afterPage.render({ canvasContext: afterCanvas.getContext('2d'), viewport: afterVp }).promise;
      setPreviewAfter(afterCanvas.toDataURL());

      // Download
      const blob = new Blob([afterBytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace('.pdf', '-no-watermark.pdf');
      a.click();

      recordUsage(TOOL_ID);
      setProgress(100); setStatus('done');
      showToast('✅ Watermarks removed and PDF downloaded!');
    } catch (err) {
      console.error(err);
      setStatus('detected');
      showToast('Removal failed: ' + err.message, 'error');
    }
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['💧 Remove text watermarks', '🔍 Auto-detection', '📄 Clean PDF output'].map(b => (
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
          <div style={{ fontSize: 52, marginBottom: 16 }}>💧</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop watermarked PDF</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Remove &quot;DRAFT&quot;, &quot;CONFIDENTIAL&quot;, &quot;SAMPLE&quot; and other text watermarks
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {file && (
        <div style={S.card}>
          {/* File info + custom text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 28 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB{pageCount > 0 && ` • ${pageCount} pages`}</div>
            </div>
            <button onClick={() => { setFile(null); setStatus('idle'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>✕</button>
          </div>

          {status === 'idle' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Custom watermark text (optional)</label>
                <input value={customText} onChange={e => setCustomText(e.target.value)} placeholder="e.g. Company Name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem' }} />
              </div>
              <button onClick={detect} className="btn-primary" style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
                🔍 Scan for Watermarks
              </button>
            </>
          )}

          {/* Progress */}
          {(status === 'detecting' || status === 'removing') && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>{status === 'detecting' ? '🔍 Scanning...' : '🧹 Removing watermarks...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: 6, borderRadius: 3, background: '#0ea5e9', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Detection results */}
          {status === 'detected' && (
            <>
              {watermarks.length > 0 ? (
                <>
                  <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
                      💧 Found {watermarks.length} watermark elements
                    </div>
                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                      {watermarks.slice(0, 10).map((w, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #fde68a', display: 'flex', gap: 8 }}>
                          <span style={{ color: '#92400e' }}>Page {w.page}</span>
                          <span style={{ fontWeight: 600 }}>&quot;{w.text}&quot;</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>{w.fontSize}pt {w.rotation > 0 ? `${w.rotation}° rotated` : ''}</span>
                        </div>
                      ))}
                      {watermarks.length > 10 && <div style={{ fontSize: '0.75rem', color: '#92400e', paddingTop: 4 }}>...and {watermarks.length - 10} more</div>}
                    </div>
                  </div>

                  {/* Before preview */}
                  {previewBefore && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={S.label}>Preview (page 1 — before)</label>
                      <img src={previewBefore} alt="Before" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }} />
                    </div>
                  )}

                  <button onClick={removeWatermarks} className="btn-primary"
                    style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
                    🧹 Remove All Watermarks & Download
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>No text watermarks found</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    This PDF may have image-based watermarks which require OCR-level processing.
                  </p>
                  <button onClick={() => { setFile(null); setStatus('idle'); }}
                    style={{ marginTop: 12, padding: '8px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    Try another PDF
                  </button>
                </div>
              )}
            </>
          )}

          {/* Done */}
          {status === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Watermarks removed!</p>

              {previewBefore && previewAfter && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>BEFORE</div>
                    <img src={previewBefore} alt="Before" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '2px solid #fca5a5' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>AFTER</div>
                    <img src={previewAfter} alt="After" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '2px solid #86efac' }} />
                  </div>
                </div>
              )}

              <button onClick={() => { setFile(null); setStatus('idle'); setWatermarks([]); setPreviewBefore(null); setPreviewAfter(null); }}
                style={{ padding: '10px 28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                🔄 Process Another PDF
              </button>
            </div>
          )}
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
