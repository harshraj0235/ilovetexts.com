'use client';
// ═══════════════════════════════════════════════════════
// SplitPdf.jsx — Split PDF by page ranges in browser
// Uses pdf-lib — zero upload, 100% private
// Targets: "split pdf online free" 400K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react';
import { MAX_SPLIT_PDF_SIZE, parsePageSelection, parseSplitRanges, safePdfBaseName } from '@/lib/split-pdf-utils.mjs';

export default function SplitPdf({ t, lang }) {
  const [fileName, setFileName]   = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pdfBytes, setPdfBytes]   = useState(null);
  const [mode, setMode]           = useState('range'); // range | every | extract
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN]       = useState(1); // split every N pages
  const [extractPages, setExtractPages] = useState(''); // e.g. "1,3,5-7"
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults]     = useState([]); // [{name, url, pages}]
  const [toast, setToast]         = useState(null);
  const [error, setError]         = useState('');
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),3000); };

  const loadPdf = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { showToast('Please upload a PDF file','warning'); return; }
    if (!file.size) { setError('This PDF is empty. Choose a different file.'); return; }
    if (file.size > MAX_SPLIT_PDF_SIZE) { setError('This PDF is larger than 100 MB. Choose a smaller file.'); return; }
    setError('');
    setLoading(true); setResults([]); setFileName(file.name);
    let doc;
    try {
      const ab = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
      setPageCount(doc.numPages);
      setPdfBytes(ab);
      setRangeInput(`1-${Math.ceil(doc.numPages/2)},${Math.ceil(doc.numPages/2)+1}-${doc.numPages}`);
      showToast(`PDF loaded — ${doc.numPages} pages`);
    } catch(e) {
      setFileName('');
      setError('Could not read this PDF. It may be damaged or password-protected.');
    } finally { await doc?.destroy(); setLoading(false); }
  }, []);

  const revokeResults = useCallback((list) => list.forEach((result) => URL.revokeObjectURL(result.url)), []);
  useEffect(() => () => revokeResults(results), [results, revokeResults]);

  const handleSplit = useCallback(async () => {
    if (!pdfBytes || !pageCount) return;
    setProcessing(true); revokeResults(results); setResults([]); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const srcDoc = await PDFDocument.load(pdfBytes);
      const baseName = safePdfBaseName(fileName);
      const parts = [];

      if (mode === 'range') {
        const ranges = parseSplitRanges(rangeInput, pageCount);
        for (const range of ranges) {
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, range.indices);
          copied.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          const blob = new Blob([bytes], { type:'application/pdf' });
          parts.push({ name: `${baseName}-pages-${range.label}.pdf`, url: URL.createObjectURL(blob), blob, pages: range.indices.length });
        }
      } else if (mode === 'every') {
        const n = Math.max(1, everyN);
        for (let start=0; start<pageCount; start+=n) {
          const end = Math.min(start+n, pageCount);
          const indices = Array.from({length:end-start},(_,i)=>start+i);
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, indices);
          copied.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          const blob = new Blob([bytes], { type:'application/pdf' });
          parts.push({ name: `${baseName}-part-${Math.floor(start/n)+1}.pdf`, url: URL.createObjectURL(blob), blob, pages: indices.length });
        }
      } else {
        // Extract specific pages
        const indices = parsePageSelection(extractPages, pageCount);
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, indices);
        copied.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type:'application/pdf' });
        parts.push({ name: `${baseName}-extracted.pdf`, url: URL.createObjectURL(blob), blob, pages: indices.length });
      }

      setResults(parts);
      showToast(`Split into ${parts.length} PDF${parts.length!==1?'s':''}!`);
    } catch(e) {
      console.error(e);
      setError(e.message || 'The PDF could not be split. Please try again.');
    } finally { setProcessing(false); }
  }, [pdfBytes, pageCount, fileName, mode, rangeInput, everyN, extractPages, results, revokeResults]);

  const downloadAll = async () => {
    if (results.length === 1) {
      const anchor = document.createElement('a'); anchor.href = results[0].url; anchor.download = results[0].name; anchor.click();
      return;
    }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    results.forEach((result) => zip.file(result.name, result.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${safePdfBaseName(fileName)}-split-files.zip`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('ZIP downloaded!');
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}
      {error && <div role="alert" style={{ padding:'11px 14px', marginBottom:14, border:'1px solid #fecaca', borderRadius:10, background:'#fef2f2', color:'#b91c1c', fontSize:'.84rem' }}>⚠️ {error}</div>}

      {/* Upload */}
      {!pdfBytes ? (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); loadPdf(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => !loading && inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'60px 24px', textAlign:'center', cursor:loading?'default':'pointer', background:dragging?'rgba(14,165,233,0.04)':'var(--bg-section)' }}
        >
          <input ref={inputRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e => { loadPdf(e.target.files[0]); e.target.value=''; }} />
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ width:40,height:40,border:'3px solid #0ea5e9',borderTopColor:'transparent',borderRadius:'50%',animation:'ilt-spin 0.8s linear infinite' }} />
              <p style={{ margin:0 }}>Loading PDF…</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize:52, marginBottom:12 }}>✂️</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>Drop a PDF to split</h2>
              <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>Split by page range, every N pages, or extract specific pages</p>
              <button style={{ padding:'11px 28px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choose PDF
              </button>
              <p style={{ marginTop:14, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>🔒 Your PDF never leaves your browser · PDF up to 100 MB</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* File info */}
          <div className="trust-card" style={{ padding:'14px 18px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.9rem' }}>📄 {fileName}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{pageCount} pages</div>
            </div>
            <button onClick={() => { revokeResults(results); setPdfBytes(null); setFileName(''); setPageCount(0); setResults([]); setError(''); }} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>Change PDF</button>
          </div>

          {/* Mode selector */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:16 }}>
            {[['range','By Range','Split into custom ranges\ne.g. 1-3, 4-6'],['every','Every N Pages','Split every 1, 2, 3… pages'],['extract','Extract Pages','Get specific pages\ne.g. 1, 3, 5-7']].map(([v,l,d]) => (
              <button key={v} onClick={() => setMode(v)} style={{ padding:'12px 8px', borderRadius:'var(--radius-md)', border:`2px solid ${mode===v?'#0ea5e9':'var(--border-light)'}`, background:mode===v?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', color:mode===v?'#0ea5e9':'var(--text-primary)', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', lineHeight:1.4, whiteSpace:'pre-line' }}>{d}</div>
              </button>
            ))}
          </div>

          {/* Mode-specific input */}
          <div className="trust-card" style={{ padding:18, marginBottom:16 }}>
            {mode === 'range' && (
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
                  Page ranges (comma-separated) — Total: {pageCount} pages
                </label>
                <input value={rangeInput} onChange={e => setRangeInput(e.target.value)} placeholder="e.g. 1-3, 4-6, 7-10"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.9rem', boxSizing:'border-box' }} />
                <p style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', marginTop:6 }}>
                  Each range becomes a separate PDF. Example: 1-5, 6-10 creates 2 PDFs.
                </p>
              </div>
            )}
            {mode === 'every' && (
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
                  Split every <strong style={{ color:'#0ea5e9' }}>{everyN}</strong> page{everyN!==1?'s':''} → {Math.ceil(pageCount/everyN)} PDFs
                </label>
                <input type="range" min={1} max={Math.max(1,Math.floor(pageCount/2))} value={everyN} onChange={e => setEveryN(+e.target.value)} style={{ width:'100%', accentColor:'#0ea5e9' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-tertiary)', marginTop:4 }}>
                  <span>1 page per file</span><span>{Math.floor(pageCount/2)} pages per file</span>
                </div>
              </div>
            )}
            {mode === 'extract' && (
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
                  Pages to extract (1–{pageCount})
                </label>
                <input value={extractPages} onChange={e => setExtractPages(e.target.value)} placeholder={`e.g. 1, 3, 5-7 (max page: ${pageCount})`}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.9rem', boxSizing:'border-box' }} />
                <p style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', marginTop:6 }}>All specified pages are combined into one new PDF.</p>
              </div>
            )}
          </div>

          <button onClick={handleSplit} disabled={processing}
            style={{ width:'100%', padding:13, background:processing?'var(--border-light)':'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'1rem', cursor:processing?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16, boxShadow:processing?'none':'0 4px 16px rgba(14,165,233,0.35)' }}>
            {processing ? (<><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite' }} />Splitting…</>) : '✂️ Split PDF'}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                <button onClick={downloadAll} className="btn-primary" style={{ padding:'9px 20px' }}>⬇ {results.length > 1 ? `Download ZIP (${results.length})` : 'Download PDF'}</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {results.map((r,i) => (
                  <div key={i} style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-section)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)' }}>
                    <span style={{ fontSize:'1.2rem' }}>📄</span>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:'0.85rem', fontWeight:600, overflowWrap:'anywhere' }}>{r.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-tertiary)' }}>{r.pages} page{r.pages!==1?'s':''}</div>
                    </div>
                    <button onClick={() => { const a=document.createElement('a'); a.href=r.url; a.download=r.name; a.click(); }}
                      style={{ padding:'6px 14px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                      ⬇ Download
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
