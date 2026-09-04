'use client';
// ═══════════════════════════════════════════════════════
// PdfPageNumbers.jsx — Add page numbers to PDF
// Uses pdf-lib — zero upload, 100% private
// Targets: "add page numbers to pdf free online" 50K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center', x: 'center', y: 'bottom' },
  { id: 'bottom-right',  label: 'Bottom Right',  x: 'right',  y: 'bottom' },
  { id: 'bottom-left',   label: 'Bottom Left',   x: 'left',   y: 'bottom' },
  { id: 'top-center',    label: 'Top Center',    x: 'center', y: 'top' },
  { id: 'top-right',     label: 'Top Right',     x: 'right',  y: 'top' },
  { id: 'top-left',      label: 'Top Left',      x: 'left',   y: 'top' },
];

export default function PdfPageNumbers({ t, lang }) {
  const [fileName, setFileName]   = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pdfBytes, setPdfBytes]   = useState(null);
  const [position, setPosition]   = useState('bottom-center');
  const [fontSize, setFontSize]   = useState(12);
  const [startNum, setStartNum]   = useState(1);
  const [prefix, setPrefix]       = useState('');
  const [suffix, setSuffix]       = useState('');
  const [format, setFormat]       = useState('n'); // n | n/total | Page n
  const [margin, setMargin]       = useState(20);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone]           = useState(false);
  const [toast, setToast]         = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),3000); };

  const loadPdf = useCallback(async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { showToast('Please upload a PDF file','warning'); return; }
    setLoading(true); setDone(false); setFileName(file.name);
    try {
      const ab = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
      setPageCount(doc.numPages);
      setPdfBytes(ab);
      showToast(`PDF loaded — ${doc.numPages} pages`);
    } catch(e) { showToast('Failed to load PDF: '+e.message,'error'); }
    finally { setLoading(false); }
  }, []);

  const formatPageNumber = (n, total) => {
    const num = n + startNum - 1;
    let text = '';
    switch(format) {
      case 'n':       text = String(num); break;
      case 'n/total': text = `${num} / ${total}`; break;
      case 'Page n':  text = `Page ${num}`; break;
      case 'n of total': text = `${num} of ${total}`; break;
      default: text = String(num);
    }
    return prefix + text + suffix;
  };

  const addNumbers = useCallback(async () => {
    if (!pdfBytes) return;
    setProcessing(true); setDone(false);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdf = await PDFDocument.load(pdfBytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const pos = POSITIONS.find(p => p.id === position) || POSITIONS[0];

      pages.forEach((page, i) => {
        const { width: W, height: H } = page.getSize();
        const text = formatPageNumber(i + 1, pages.length);
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const m = margin;

        let x, y;
        if (pos.x === 'center') x = (W - textWidth) / 2;
        else if (pos.x === 'right') x = W - textWidth - m;
        else x = m;

        if (pos.y === 'bottom') y = m;
        else y = H - m - fontSize;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName.replace('.pdf', '') + '-numbered.pdf';
      a.click();
      setDone(true);
      showToast('PDF with page numbers downloaded!');
    } catch(e) {
      console.error(e);
      showToast('Failed: ' + e.message, 'error');
    } finally { setProcessing(false); }
  }, [pdfBytes, fileName, position, fontSize, startNum, prefix, suffix, format, margin]);

  const previewText = prefix + (format === 'n' ? String(startNum) : format === 'n/total' ? `${startNum} / ${pageCount}` : format === 'Page n' ? `Page ${startNum}` : `${startNum} of ${pageCount}`) + suffix;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

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
              <div style={{ fontSize:52, marginBottom:12 }}>🔢</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>Drop a PDF to add page numbers</h2>
              <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>Choose position, format, font size and starting number</p>
              <button style={{ padding:'11px 28px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choose PDF
              </button>
              <p style={{ marginTop:14, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>🔒 Your PDF never leaves your browser</p>
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
            <button onClick={() => { setPdfBytes(null); setFileName(''); setPageCount(0); setDone(false); }} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>Change PDF</button>
          </div>

          {/* Settings */}
          <div className="trust-card" style={{ padding:20, marginBottom:16, display:'flex', flexDirection:'column', gap:16 }}>
            {/* Position */}
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Position</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                {POSITIONS.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)} style={{ padding:'7px', borderRadius:'var(--radius-sm)', border:`1px solid ${position===p.id?'#0ea5e9':'var(--border-light)'}`, background:position===p.id?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', fontSize:'0.78rem', fontWeight:position===p.id?700:400, color:position===p.id?'#0ea5e9':'var(--text-secondary)' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format row */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
              <div style={{ flex:'1 1 160px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Number Format</label>
                <select value={format} onChange={e => setFormat(e.target.value)} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
                  <option value="n">1  2  3</option>
                  <option value="n/total">1 / 10  2 / 10</option>
                  <option value="Page n">Page 1  Page 2</option>
                  <option value="n of total">1 of 10  2 of 10</option>
                </select>
              </div>
              <div style={{ flex:'1 1 80px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Start at</label>
                <input type="number" min={0} max={999} value={startNum} onChange={e => setStartNum(+e.target.value)} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }} />
              </div>
              <div style={{ flex:'1 1 60px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Font size</label>
                <input type="number" min={6} max={32} value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }} />
              </div>
              <div style={{ flex:'1 1 60px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Margin mm</label>
                <input type="number" min={5} max={60} value={margin} onChange={e => setMargin(+e.target.value)} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }} />
              </div>
            </div>

            {/* Prefix / Suffix */}
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Prefix (optional)</label>
                <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder='e.g. "Page " or "-"' style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Suffix (optional)</label>
                <input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder='e.g. "." or " -"' style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
            </div>

            {/* Preview */}
            <div style={{ padding:'10px 14px', background:'var(--bg-section)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>Preview:</span>
              <span style={{ fontFamily:'Helvetica, sans-serif', fontSize:fontSize, fontWeight:600, color:'var(--text-primary)', letterSpacing:'0.02em' }}>{previewText}</span>
            </div>
          </div>

          <button onClick={addNumbers} disabled={processing}
            style={{ width:'100%', padding:13, background:processing?'var(--border-light)':'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'1rem', cursor:processing?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:processing?'none':'0 4px 16px rgba(14,165,233,0.35)' }}>
            {processing ? (<><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite' }} />Adding page numbers…</>) : '🔢 Add Page Numbers & Download'}
          </button>
          {done && <p style={{ textAlign:'center', marginTop:10, color:'#10b981', fontWeight:600, fontSize:'0.88rem' }}>✅ PDF with page numbers downloaded!</p>}
        </>
      )}
    </div>
  );
}
