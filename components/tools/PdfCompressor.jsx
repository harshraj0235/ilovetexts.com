'use client';
// ═══════════════════════════════════════════════════════
// PdfCompressor.jsx — Reduce PDF file size
// Removes metadata, optimizes objects, re-renders pages
// at adjustable quality. Batch mode for multiple files.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize } from '@/lib/subscription';

const TOOL_ID = 'pdf-compressor';

const QUALITY_LEVELS = [
  { id: 'low', label: 'Low Compression', desc: 'Best quality, smaller reduction', icon: '🟢', jpegQuality: 0.92, scale: 2 },
  { id: 'medium', label: 'Medium', desc: 'Good balance of quality & size', icon: '🟡', jpegQuality: 0.75, scale: 1.5 },
  { id: 'high', label: 'High Compression', desc: 'Smallest file, lower quality', icon: '🔴', jpegQuality: 0.5, scale: 1.2 },
];

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#10b981' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(16,185,129,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  qualityBtn: (active) => ({ flex: 1, padding: '14px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${active ? '#10b981' : 'var(--border-light)'}`, background: active ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }),
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function PdfCompressor({ t, lang }) {
  const [files, setFiles] = useState([]); // [{ file, status, originalSize, compressedSize, url }]
  const [quality, setQuality] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFiles = (fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfs.length) { showToast('Please upload PDF files', 'warning'); return; }
    for (const f of pdfs) {
      const sizeCheck = checkFileSize(f.size);
      if (!sizeCheck.allowed) { showToast(`${f.name} exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    }
    setFiles(pdfs.map(f => ({ file: f, status: 'pending', originalSize: f.size, compressedSize: 0, url: null })));
  };

  const compress = useCallback(async () => {
    if (!files.length || processing) return;
    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setProcessing(true); setProgress(0);
    const settings = QUALITY_LEVELS.find(q => q.id === quality);
    const updated = [...files];

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const { PDFDocument } = await import('pdf-lib');

      for (let fi = 0; fi < updated.length; fi++) {
        const entry = updated[fi];
        entry.status = 'compressing';
        setFiles([...updated]);

        const ab = await entry.file.arrayBuffer();
        const srcDoc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
        const newPdf = await PDFDocument.create();

        // Remove metadata
        newPdf.setTitle('');
        newPdf.setAuthor('');
        newPdf.setSubject('');
        newPdf.setKeywords([]);
        newPdf.setProducer('ilovetexts.com');

        for (let i = 1; i <= srcDoc.numPages; i++) {
          const page = await srcDoc.getPage(i);
          const vp = page.getViewport({ scale: settings.scale });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport: vp }).promise;

          // Convert to JPEG at specified quality
          const dataUrl = canvas.toDataURL('image/jpeg', settings.jpegQuality);
          const base64 = dataUrl.split(',')[1];
          const jpgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const img = await newPdf.embedJpg(jpgBytes);

          // Use original page dimensions
          const origDoc = await PDFDocument.load(ab);
          const origPage = origDoc.getPage(i - 1);
          const { width, height } = origPage.getSize();
          const newPage = newPdf.addPage([width, height]);
          newPage.drawImage(img, { x: 0, y: 0, width, height });

          setProgress(Math.round(((fi * srcDoc.numPages + i) / (updated.length * srcDoc.numPages)) * 90));
        }

        const bytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([bytes], { type: 'application/pdf' });

        entry.compressedSize = blob.size;
        entry.url = URL.createObjectURL(blob);
        entry.status = 'done';
        entry.saved = Math.max(0, entry.originalSize - blob.size);
        entry.savedPct = entry.originalSize > 0 ? Math.round((entry.saved / entry.originalSize) * 100) : 0;
        setFiles([...updated]);
      }

      recordUsage(TOOL_ID);
      setProgress(100);

      const totalSaved = updated.reduce((s, f) => s + (f.saved || 0), 0);
      showToast(`✅ Compressed! Total saved: ${formatSize(totalSaved)}`);
    } catch (err) {
      console.error(err);
      showToast('Compression failed: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [files, quality]);

  const downloadAll = async () => {
    const doneFiles = files.filter(f => f.url);
    if (doneFiles.length === 1) {
      const a = document.createElement('a');
      a.href = doneFiles[0].url;
      a.download = doneFiles[0].file.name.replace('.pdf', '-compressed.pdf');
      a.click();
      return;
    }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const f of doneFiles) {
      const resp = await fetch(f.url);
      const blob = await resp.blob();
      zip.file(f.file.name.replace('.pdf', '-compressed.pdf'), blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'compressed-pdfs.zip';
    a.click();
  };

  const totalOriginal = files.reduce((s, f) => s + f.originalSize, 0);
  const totalCompressed = files.reduce((s, f) => s + (f.compressedSize || 0), 0);
  const totalSaved = files.reduce((s, f) => s + (f.saved || 0), 0);
  const allDone = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['📦 Reduce PDF file size', '🎚️ 3 quality levels', '📑 Batch compress'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
        <UsageBadge toolId={TOOL_ID} />
      </div>

      {/* Upload */}
      {files.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={S.dropzone(dragOver)}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop PDFs to compress</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Reduce file size for email, uploads, or storage — choose your quality level
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDFs</button>
          <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {files.length > 0 && (
        <div style={S.card}>
          {/* Quality picker */}
          {!allDone && !processing && (
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Compression Level</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {QUALITY_LEVELS.map(q => (
                  <button key={q.id} onClick={() => setQuality(q.id)} style={S.qualityBtn(quality === q.id)}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{q.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{q.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File list */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={S.label}>{files.length} file{files.length > 1 ? 's' : ''}</span>
              {!processing && (
                <button onClick={() => { setFiles([]); setProgress(0); }}
                  style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ✕ Clear
                </button>
              )}
            </div>

            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file.name}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: 'var(--text-tertiary)', alignItems: 'center' }}>
                    <span>{formatSize(f.originalSize)}</span>
                    {f.status === 'done' && (
                      <>
                        <span>→</span>
                        <span style={{ color: '#059669', fontWeight: 700 }}>{formatSize(f.compressedSize)}</span>
                        <span style={{ padding: '1px 8px', borderRadius: 10, background: f.savedPct > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: f.savedPct > 0 ? '#059669' : '#d97706', fontWeight: 700 }}>
                          {f.savedPct > 0 ? `↓ ${f.savedPct}%` : 'No change'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {f.status === 'compressing' && (
                  <div style={{ width: 24, height: 24, border: '3px solid var(--bg-tertiary)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                )}
                {f.status === 'done' && f.url && (
                  <a href={f.url} download={f.file.name.replace('.pdf', '-compressed.pdf')}
                    style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none' }}>
                    ⬇
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Progress */}
          {processing && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>📦 Compressing...</span><span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: 6, borderRadius: 3, background: '#10b981', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Summary + download */}
          {allDone && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>ORIGINAL</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatSize(totalOriginal)}</div>
                </div>
                <div style={{ fontSize: 24, color: '#10b981', alignSelf: 'center' }}>→</div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>COMPRESSED</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>{formatSize(totalCompressed)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>SAVED</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                    {totalSaved > 0 ? formatSize(totalSaved) : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!processing && !allDone && (
            <button onClick={compress} className="btn-primary" style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
              📦 Compress {files.length} PDF{files.length > 1 ? 's' : ''}
            </button>
          )}

          {allDone && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadAll} className="btn-primary" style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.9rem' }}>
                📥 {files.length > 1 ? 'Download All (ZIP)' : 'Download Compressed PDF'}
              </button>
              <button onClick={() => { setFiles([]); setProgress(0); }}
                style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                🔄 New
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a', color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)' }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
