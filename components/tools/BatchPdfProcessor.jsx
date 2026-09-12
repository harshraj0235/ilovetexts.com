'use client';
// ═══════════════════════════════════════════════════════
// BatchPdfProcessor.jsx — Upload 50+ PDFs, batch process
// Operations: extract text, merge, convert to JPG, compress
// 100% client-side — zero upload
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize, getPlan } from '@/lib/subscription';

const TOOL_ID = 'batch-pdf-processor';

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#7c3aed' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(124,58,237,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  opBtn: (active) => ({ flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${active ? '#7c3aed' : 'var(--border-light)'}`, background: active ? 'rgba(124,58,237,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }),
  progressBar: (pct) => ({ height: 4, borderRadius: 2, background: '#7c3aed', width: `${pct}%`, transition: 'width 0.3s' }),
  fileRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 8 },
};

export default function BatchPdfProcessor({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [operation, setOperation] = useState('extract'); // extract | merge | jpg | compress
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({}); // { fileName: percent }
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFiles = useCallback((fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfs.length) { showToast('Please upload PDF files', 'warning'); return; }

    const plan = getPlan();
    const usage = checkUsage(TOOL_ID);
    const maxFiles = plan === 'free' ? 3 : 50;
    if (pdfs.length > maxFiles) {
      showToast(`Free plan allows ${maxFiles} files per batch. Upgrade to Pro for 50+`, 'warning');
      return;
    }

    // Check file sizes
    for (const f of pdfs) {
      const sizeCheck = checkFileSize(f.size);
      if (!sizeCheck.allowed) {
        showToast(`${f.name} exceeds ${sizeCheck.maxMB}MB limit. Upgrade for larger files.`, 'warning');
        return;
      }
    }

    setFiles(pdfs);
    setResults([]);
    setProgress({});
    showToast(`${pdfs.length} PDFs loaded`);
  }, []);

  const process = async () => {
    if (!files.length || processing) return;

    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) {
      showToast('Daily limit reached. Upgrade to Pro for unlimited.', 'warning');
      return;
    }

    setProcessing(true);
    setResults([]);
    const newProgress = {};
    const newResults = [];

    try {
      if (operation === 'extract') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newProgress[file.name] = 10;
          setProgress({ ...newProgress });

          const ab = await file.arrayBuffer();
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
          let fullText = '';
          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n\n';
            newProgress[file.name] = 10 + Math.round((p / doc.numPages) * 80);
            setProgress({ ...newProgress });
          }
          const blob = new Blob([fullText.trim()], { type: 'text/plain' });
          newResults.push({ name: file.name.replace('.pdf', '.txt'), url: URL.createObjectURL(blob), size: blob.size, type: 'text' });
          newProgress[file.name] = 100;
          setProgress({ ...newProgress });
        }

      } else if (operation === 'merge') {
        const { PDFDocument } = await import('pdf-lib');
        const merged = await PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newProgress[file.name] = 20;
          setProgress({ ...newProgress });
          const ab = await file.arrayBuffer();
          const src = await PDFDocument.load(ab);
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach(p => merged.addPage(p));
          newProgress[file.name] = 100;
          setProgress({ ...newProgress });
        }

        const bytes = await merged.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        newResults.push({ name: 'merged.pdf', url: URL.createObjectURL(blob), size: blob.size, type: 'pdf' });

      } else if (operation === 'jpg') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newProgress[file.name] = 10;
          setProgress({ ...newProgress });
          const ab = await file.arrayBuffer();
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;

          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const base64 = dataUrl.split(',')[1];
            zip.file(`${file.name.replace('.pdf', '')}-page-${p}.jpg`, base64, { base64: true });
            newProgress[file.name] = 10 + Math.round((p / doc.numPages) * 80);
            setProgress({ ...newProgress });
          }
          newProgress[file.name] = 100;
          setProgress({ ...newProgress });
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        newResults.push({ name: 'pdf-images.zip', url: URL.createObjectURL(zipBlob), size: zipBlob.size, type: 'zip' });

      } else if (operation === 'compress') {
        const { PDFDocument } = await import('pdf-lib');
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newProgress[file.name] = 20;
          setProgress({ ...newProgress });
          const ab = await file.arrayBuffer();
          const doc = await PDFDocument.load(ab);
          // Remove metadata to reduce size
          doc.setTitle('');
          doc.setAuthor('');
          doc.setSubject('');
          doc.setKeywords([]);
          doc.setProducer('ilovetexts.com');
          doc.setCreator('ilovetexts.com');
          const bytes = await doc.save({ useObjectStreams: true });
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const saved = Math.max(0, file.size - blob.size);
          newResults.push({
            name: file.name.replace('.pdf', '-compressed.pdf'),
            url: URL.createObjectURL(blob),
            size: blob.size,
            originalSize: file.size,
            saved,
            type: 'pdf',
          });
          newProgress[file.name] = 100;
          setProgress({ ...newProgress });
        }
      }

      recordUsage(TOOL_ID);
      setResults(newResults);
      showToast(`✅ Done — ${newResults.length} files processed`);
    } catch (err) {
      console.error(err);
      showToast('Processing failed: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
      const a = document.createElement('a');
      a.href = results[0].url;
      a.download = results[0].name;
      a.click();
      return;
    }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const r of results) {
      const resp = await fetch(r.url);
      const blob = await resp.blob();
      zip.file(r.name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'batch-results.zip';
    a.click();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const operations = [
    { id: 'extract', icon: '📝', label: 'Extract Text', desc: 'Get text from all PDFs' },
    { id: 'merge', icon: '📎', label: 'Merge All', desc: 'Combine into one PDF' },
    { id: 'jpg', icon: '🖼️', label: 'Convert to JPG', desc: 'Every page as image' },
    { id: 'compress', icon: '📦', label: 'Compress', desc: 'Reduce file sizes' },
  ];

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['⚡ Batch process up to 50 PDFs', '🔒 100% private', '📦 ZIP download'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
        <UsageBadge toolId={TOOL_ID} />
      </div>

      {/* Upload Zone */}
      {files.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={S.dropzone(dragOver)}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📑</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop multiple PDFs here</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Select up to {getPlan() === 'free' ? '3' : '50'} PDF files for batch processing
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>
            Choose PDFs
          </button>
          <input ref={inputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {/* File list + operation picker */}
      {files.length > 0 && (
        <div style={S.card}>
          {/* File list */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={S.label}>{files.length} PDFs loaded</span>
              <button onClick={() => { setFiles([]); setResults([]); setProgress({}); }}
                style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕ Clear all
              </button>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {files.map(f => (
                <div key={f.name} style={S.fileRow}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{formatSize(f.size)}</div>
                  </div>
                  {progress[f.name] !== undefined && (
                    <div style={{ width: 60 }}>
                      <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={S.progressBar(progress[f.name])} />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'right', marginTop: 2 }}>
                        {progress[f.name]}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operation picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Choose Operation</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {operations.map(op => (
                <button key={op.id} onClick={() => setOperation(op.id)} style={S.opBtn(operation === op.id)}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{op.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{op.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Process button */}
          {results.length === 0 && (
            <button
              onClick={process}
              disabled={processing}
              className="btn-primary"
              style={{ width: '100%', padding: 14, cursor: processing ? 'wait' : 'pointer', fontSize: '1rem', opacity: processing ? 0.7 : 1 }}
            >
              {processing ? '⏳ Processing...' : `🚀 Process ${files.length} PDFs — ${operations.find(o => o.id === operation)?.label}`}
            </button>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
                <div style={{ fontWeight: 700, color: '#15803d' }}>
                  {results.length} file{results.length > 1 ? 's' : ''} ready!
                </div>
              </div>

              {results.map(r => (
                <div key={r.name} style={{ ...S.fileRow, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{r.type === 'pdf' ? '📄' : r.type === 'zip' ? '📦' : '📝'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {formatSize(r.size)}
                      {r.saved > 0 && ` — saved ${formatSize(r.saved)} (${Math.round(r.saved / r.originalSize * 100)}%)`}
                    </div>
                  </div>
                  <a href={r.url} download={r.name}
                    style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', background: '#7c3aed', color: '#fff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                    ⬇ Download
                  </a>
                </div>
              ))}

              {results.length > 1 && (
                <button onClick={downloadAll}
                  className="btn-primary"
                  style={{ width: '100%', padding: 12, cursor: 'pointer', marginTop: 8, fontSize: '0.9rem' }}>
                  📦 Download All as ZIP
                </button>
              )}

              <button onClick={() => { setFiles([]); setResults([]); setProgress({}); }}
                style={{ width: '100%', padding: 10, marginTop: 8, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                🔄 Process More PDFs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
        {[
          { icon: '📑', title: 'Multi-file upload', desc: 'Drag & drop up to 50 PDFs at once' },
          { icon: '⚡', title: '4 operations', desc: 'Extract text, merge, convert to JPG, or compress' },
          { icon: '📦', title: 'ZIP download', desc: 'All results packaged in one download' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{c.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a', color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)' }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
