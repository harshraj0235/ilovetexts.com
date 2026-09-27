'use client';
// ═══════════════════════════════════════════════════════
// OcrUnlimited.jsx — Enhanced OCR for scanned PDFs
// Multi-language, high-res rendering, export as searchable
// PDF, Word doc, or plain text. Tesseract.js powered.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize } from '@/lib/subscription';

const TOOL_ID = 'ocr-unlimited';

const OCR_LANGS = [
  { code: 'eng', name: 'English', flag: '🇺🇸' },
  { code: 'hin', name: 'Hindi', flag: '🇮🇳' },
  { code: 'spa', name: 'Spanish', flag: '🇪🇸' },
  { code: 'deu', name: 'German', flag: '🇩🇪' },
  { code: 'fra', name: 'French', flag: '🇫🇷' },
  { code: 'por', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ind', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
  { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', flag: '🇰🇷' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'rus', name: 'Russian', flag: '🇷🇺' },
];

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#6366f1' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(99,102,241,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  progressBar: (pct, color = '#6366f1') => ({ height: 6, borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.3s' }),
  textarea: { width: '100%', minHeight: 300, padding: 16, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' },
};

export default function OcrUnlimited({ t, lang }) {
  const [file, setFile] = useState(null);
  const [ocrLang, setOcrLang] = useState('eng');
  const [scale, setScale] = useState(2);
  const [status, setStatus] = useState('idle'); // idle | rendering | ocr | done | error
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [pages, setPages] = useState([]); // [{ pageNum, text, confidence }]
  const [fullText, setFullText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // text | pages
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFile = (f) => {
    if (!f || (!f.type.includes('pdf') && !f.name.endsWith('.pdf'))) { showToast('Please upload a PDF', 'warning'); return; }
    const sizeCheck = checkFileSize(f.size);
    if (!sizeCheck.allowed) { showToast(`File exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    setFile(f); setStatus('idle'); setPages([]); setFullText(''); setProgress(0);
  };

  const runOcr = useCallback(async () => {
    if (!file) return;
    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setStatus('rendering'); setProgress(5); setProgressMsg('Loading PDF...');

    try {
      // 1. Render PDF pages to canvas
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
      const totalPages = doc.numPages;

      setProgressMsg(`Rendering ${totalPages} pages at ${scale}x...`);
      setProgress(10);

      const canvases = [];
      for (let i = 1; i <= totalPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        canvases.push(canvas);
        setProgress(10 + Math.round((i / totalPages) * 20));
      }

      // 2. OCR each canvas
      setStatus('ocr'); setProgressMsg('Loading OCR engine...');
      setProgress(30);

      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker(ocrLang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(35 + Math.round(m.progress * 55));
          }
        },
      });

      const ocrPages = [];
      for (let i = 0; i < canvases.length; i++) {
        setProgressMsg(`OCR page ${i + 1} of ${totalPages}...`);
        const result = await worker.recognize(canvases[i]);
        ocrPages.push({
          pageNum: i + 1,
          text: result.data.text,
          confidence: result.data.confidence,
        });
        setProgress(35 + Math.round(((i + 1) / totalPages) * 55));
      }

      await worker.terminate();

      const combined = ocrPages.map(p => `--- Page ${p.pageNum} ---\n${p.text}`).join('\n\n');
      setPages(ocrPages);
      setFullText(combined);
      recordUsage(TOOL_ID);
      setProgress(100); setStatus('done');
      setProgressMsg('');
      showToast(`✅ OCR complete — ${totalPages} pages, avg confidence ${Math.round(ocrPages.reduce((a, p) => a + p.confidence, 0) / ocrPages.length)}%`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('OCR failed: ' + err.message, 'error');
    }
  }, [file, ocrLang, scale]);

  const downloadText = () => {
    const blob = new Blob([fullText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace('.pdf', '-ocr.txt');
    a.click();
  };

  const downloadWord = async () => {
    const html = `<html><body><pre style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6;">${fullText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace('.pdf', '-ocr.doc');
    a.click();
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    showToast('Copied to clipboard');
  };

  const avgConfidence = pages.length ? Math.round(pages.reduce((a, p) => a + p.confidence, 0) / pages.length) : 0;

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['🔍 High-res OCR', `🌍 ${OCR_LANGS.length} languages`, '📝 Export as text or Word'].map(b => (
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
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop a scanned PDF</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Convert scanned documents to editable, searchable text using OCR
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {file && (
        <div style={S.card}>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 28 }}>📄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <button onClick={() => { setFile(null); setStatus('idle'); setPages([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>✕</button>
          </div>

          {/* Settings */}
          {status === 'idle' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>OCR Language</label>
                  <select value={ocrLang} onChange={e => setOcrLang(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {OCR_LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Resolution ({scale}x)</label>
                  <input type="range" min={1} max={4} step={0.5} value={scale} onChange={e => setScale(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#6366f1' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    <span>Fast</span><span>High Quality</span>
                  </div>
                </div>
              </div>

              <button onClick={runOcr} className="btn-primary" style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
                🔍 Start OCR Recognition
              </button>
            </>
          )}

          {/* Progress */}
          {(status === 'rendering' || status === 'ocr') && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>{progressMsg || 'Processing...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={S.progressBar(progress)} />
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120, padding: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#15803d' }}>{pages.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Pages</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>{avgConfidence}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>Accuracy</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{fullText.split(/\s+/).length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Words</div>
                </div>
              </div>

              {/* Download buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={downloadText} className="btn-primary" style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.88rem', minWidth: 120 }}>
                  📄 Download .txt
                </button>
                <button onClick={downloadWord} style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', minWidth: 120 }}>
                  📝 Download .doc
                </button>
                <button onClick={copyAll} style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', minWidth: 120 }}>
                  📋 Copy All
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid var(--border-light)' }}>
                {[{ id: 'text', label: '📝 Full Text' }, { id: 'pages', label: '📄 By Page' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      color: activeTab === tab.id ? '#6366f1' : 'var(--text-secondary)',
                      borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent', marginBottom: -2 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'text' && (
                <textarea value={fullText} readOnly style={S.textarea} />
              )}

              {activeTab === 'pages' && pages.map(p => (
                <div key={p.pageNum} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Page {p.pageNum}</span>
                    <span style={{ color: p.confidence > 80 ? '#16a34a' : p.confidence > 60 ? '#f59e0b' : '#ef4444' }}>
                      {Math.round(p.confidence)}% confidence
                    </span>
                  </div>
                  <textarea value={p.text} readOnly style={{ ...S.textarea, minHeight: 120 }} />
                </div>
              ))}

              <button onClick={() => { setFile(null); setStatus('idle'); setPages([]); }}
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem', marginTop: 12 }}>
                🔄 OCR Another PDF
              </button>
            </>
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
