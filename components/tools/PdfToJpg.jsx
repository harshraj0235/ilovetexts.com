'use client';
// ═══════════════════════════════════════════════════════
// PdfToJpg.jsx — Convert PDF pages to JPG/PNG images
// Uses pdfjs-dist to render each page to canvas
// Zero upload, 100% private
// Targets: "pdf to jpg" 800K/mo, "pdf to image" 400K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

function formatBytes(b) {
  if (!b) return '0 B';
  const k=1024,s=['B','KB','MB'];
  const i=Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
}

export default function PdfToJpg({ t, lang }) {
  const [pages, setPages]        = useState([]); // [{pageNum, url, width, height, size}]
  const [fileName, setFileName]  = useState('');
  const [outputFmt, setOutputFmt] = useState('image/jpeg'); // jpeg | png
  const [scale, setScale]        = useState(2.0); // render quality (1=72dpi, 2=144dpi, 3=216dpi)
  const [loading, setLoading]    = useState(false);
  const [progress, setProgress]  = useState(0);
  const [dragging, setDragging]  = useState(false);
  const [selected, setSelected]  = useState(new Set()); // selected page indices
  const [toast, setToast]        = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),3000); };

  const loadPdf = useCallback(async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { showToast('Please upload a PDF file','warning'); return; }
    setLoading(true); setPages([]); setSelected(new Set()); setProgress(0); setFileName(file.name);
    try {
      const ab = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
      const total = doc.numPages;
      const rendered = [];
      for (let i = 1; i <= total; i++) {
        setProgress(Math.round((i / total) * 100));
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        const ext = outputFmt === 'image/png' ? 'png' : 'jpg';
        const q = outputFmt === 'image/png' ? 1 : 0.92;
        await new Promise(res => {
          canvas.toBlob(blob => {
            rendered.push({ pageNum: i, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, size: blob.size, ext });
            res();
          }, outputFmt, q);
        });
      }
      setPages(rendered);
      setSelected(new Set(rendered.map((_,i) => i)));
      showToast(`${total} page${total!==1?'s':''} converted!`);
    } catch(e) {
      console.error(e);
      showToast('Failed to load PDF: ' + e.message, 'error');
    } finally {
      setLoading(false); setProgress(0);
    }
  }, [outputFmt, scale]);

  const downloadPage = (page) => {
    const a = document.createElement('a');
    a.href = page.url;
    a.download = fileName.replace('.pdf','') + `-page-${page.pageNum}.${page.ext}`;
    a.click();
  };

  const downloadSelected = async () => {
    const toDownload = pages.filter((_,i) => selected.has(i));
    if (!toDownload.length) { showToast('Select at least one page','warning'); return; }
    if (toDownload.length === 1) { downloadPage(toDownload[0]); showToast('Page downloaded!'); return; }
    // Download as ZIP
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const p of toDownload) {
        const res = await fetch(p.url);
        const blob = await res.blob();
        zip.file(`${fileName.replace('.pdf','')}-page-${p.pageNum}.${p.ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = fileName.replace('.pdf','') + '-images.zip';
      a.click();
      showToast(`${toDownload.length} images downloaded as ZIP!`);
    } catch(e) {
      // Fallback: download one by one
      toDownload.forEach(p => downloadPage(p));
    }
  };

  const toggleSelect = (i) => setSelected(prev => { const n=new Set(prev); n.has(i)?n.delete(i):n.add(i); return n; });
  const selectAll = () => setSelected(new Set(pages.map((_,i)=>i)));
  const deselectAll = () => setSelected(new Set());

  const DPI_LABELS = { 1: '72 DPI (Fast)', 1.5: '108 DPI', 2: '144 DPI (Recommended)', 3: '216 DPI (High quality)' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {/* Settings */}
      <div className="trust-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Output Format</label>
            <div style={{ display:'flex', gap:6 }}>
              {[['image/jpeg','JPG'],['image/png','PNG']].map(([v,l]) => (
                <button key={v} onClick={() => setOutputFmt(v)} style={{ padding:'7px 14px', borderRadius:'var(--radius-sm)', border:`1px solid ${outputFmt===v?'#0ea5e9':'var(--border-light)'}`, background:outputFmt===v?'rgba(14,165,233,0.1)':'var(--bg-section)', color:outputFmt===v?'#0ea5e9':'var(--text-secondary)', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Image Quality</label>
            <select value={scale} onChange={e => setScale(+e.target.value)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
              {Object.entries(DPI_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      {pages.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); loadPdf(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => !loading && inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'60px 24px', textAlign:'center', cursor:loading?'default':'pointer', background:dragging?'rgba(14,165,233,0.04)':'var(--bg-section)', transition:'all 0.2s' }}
        >
          <input ref={inputRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e => { loadPdf(e.target.files[0]); e.target.value=''; }} />
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <div style={{ width:48, height:48, border:'4px solid #0ea5e9', borderTopColor:'transparent', borderRadius:'50%', animation:'ilt-spin 0.8s linear infinite' }} />
              <p style={{ margin:0, fontWeight:600 }}>Converting pages… {progress}%</p>
              <div style={{ width:200, height:6, background:'var(--border-light)', borderRadius:3 }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'#0ea5e9', borderRadius:3, transition:'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:52, marginBottom:12 }}>🖼️</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>Drop a PDF to convert to images</h2>
              <p style={{ color:'var(--text-secondary)', marginBottom:20, fontSize:'0.9rem' }}>Each PDF page becomes a separate JPG or PNG image</p>
              <button style={{ padding:'11px 28px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.95rem', boxShadow:'0 4px 16px rgba(14,165,233,0.35)' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choose PDF File
              </button>
              <p style={{ marginTop:14, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>🔒 Your PDF never leaves your browser — 100% private</p>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <>
          {/* Actions bar */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <button onClick={downloadSelected} className="btn-primary" style={{ padding:'10px 20px', fontSize:'0.9rem' }}>
              ⬇ Download Selected ({selected.size})
            </button>
            <button onClick={selectAll} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>Select All</button>
            <button onClick={deselectAll} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>Deselect All</button>
            <button onClick={() => { setPages([]); setFileName(''); }} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>🗑 New PDF</button>
            <span style={{ fontSize:'0.8rem', color:'var(--text-tertiary)', marginLeft:'auto' }}>
              {pages.length} pages · {fileName}
            </span>
          </div>

          {/* Page Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {pages.map((page, i) => (
              <div key={i} onClick={() => toggleSelect(i)}
                style={{ cursor:'pointer', borderRadius:'var(--radius-md)', overflow:'hidden', border:`2px solid ${selected.has(i)?'#0ea5e9':'var(--border-light)'}`, background:'var(--bg-main)', boxShadow:selected.has(i)?'0 0 0 2px rgba(14,165,233,0.2)':'none', transition:'all 0.15s' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={page.url} alt={`Page ${page.pageNum}`} style={{ width:'100%', display:'block' }} />
                <div style={{ padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'0.78rem', fontWeight:700 }}>Page {page.pageNum}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-tertiary)' }}>{page.width}×{page.height} · {formatBytes(page.size)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${selected.has(i)?'#0ea5e9':'var(--border-light)'}`, background:selected.has(i)?'#0ea5e9':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {selected.has(i) && <span style={{ color:'#fff', fontSize:'0.6rem', fontWeight:800 }}>✓</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); downloadPage(page); }}
                      style={{ padding:'3px 7px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.72rem', fontWeight:700 }}>
                      ⬇
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
