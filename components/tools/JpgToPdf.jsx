'use client';
// ═══════════════════════════════════════════════════════
// JpgToPdf.jsx — Convert images to PDF in browser
// Uses jsPDF + Canvas — zero upload, 100% private
// Targets: "jpg to pdf" 600K/mo, "image to pdf" 400K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

function formatBytes(b) {
  if (!b) return '0 B';
  const k=1024, s=['B','KB','MB'];
  const i=Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
}

export default function JpgToPdf({ t, lang }) {
  const [images, setImages]     = useState([]); // [{name, url, size, w, h}]
  const [pageSize, setPageSize]  = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [fitMode, setFitMode]   = useState('fit'); // fit | fill | original
  const [margin, setMargin]     = useState(10);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone]         = useState(false);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const loadImages = useCallback((fileList) => {
    const imgs = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please upload image files','warning'); return; }
    const promises = imgs.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => resolve({ name: file.name, url: e.target.result, size: file.size, w: img.naturalWidth, h: img.naturalHeight });
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(loaded => {
      setImages(prev => [...prev, ...loaded]);
      setDone(false);
      showToast(`${loaded.length} image${loaded.length!==1?'s':''} added!`);
    });
  }, []);

  const removeImage = (idx) => setImages(prev => prev.filter((_,i) => i !== idx));
  const moveImage = (idx, dir) => {
    setImages(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const convert = useCallback(async () => {
    if (!images.length) { showToast('Add at least one image first','warning'); return; }
    setProcessing(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const PAGE_SIZES = {
        'A4':     { w: 210, h: 297 },
        'A3':     { w: 297, h: 420 },
        'Letter': { w: 215.9, h: 279.4 },
        'Legal':  { w: 215.9, h: 355.6 },
      };
      const ps = PAGE_SIZES[pageSize] || PAGE_SIZES['A4'];
      const isLandscape = orientation === 'landscape';
      const pW = isLandscape ? ps.h : ps.w;
      const pH = isLandscape ? ps.w : ps.h;

      const pdf = new jsPDF({ orientation, unit: 'mm', format: [pW, pH] });
      const m = margin;
      const usableW = pW - m * 2;
      const usableH = pH - m * 2;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage([pW, pH], orientation);
        const img = images[i];
        let drawW = usableW, drawH = (img.h / img.w) * usableW;

        if (fitMode === 'fill') {
          // Fill page
          drawW = usableW; drawH = usableH;
        } else if (fitMode === 'fit') {
          // Fit proportionally
          if (drawH > usableH) { drawH = usableH; drawW = (img.w / img.h) * usableH; }
        } else {
          // Original size (capped)
          const pxPerMm = 3.7795;
          drawW = Math.min(img.w / pxPerMm, usableW);
          drawH = (img.h / img.w) * drawW;
          if (drawH > usableH) { drawH = usableH; drawW = (img.w / img.h) * drawH; }
        }

        const x = m + (usableW - drawW) / 2;
        const y = m + (usableH - drawH) / 2;
        const fmt = img.url.includes('image/png') ? 'PNG' : img.url.includes('image/webp') ? 'WEBP' : 'JPEG';
        pdf.addImage(img.url, fmt, x, y, drawW, drawH);
      }

      pdf.save('images-converted.pdf');
      setDone(true);
      showToast('PDF downloaded!');
    } catch(e) {
      console.error(e);
      showToast('Conversion failed: ' + e.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [images, pageSize, orientation, fitMode, margin]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {/* Settings */}
      <div className="trust-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Page Size</label>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
              {['A4','A3','Letter','Legal'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Orientation</label>
            <select value={orientation} onChange={e => setOrientation(e.target.value)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Image Fit</label>
            <select value={fitMode} onChange={e => setFitMode(e.target.value)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
              <option value="fit">Fit (keep ratio)</option>
              <option value="fill">Fill page</option>
              <option value="original">Original size</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Margin: {margin}mm</label>
            <input type="range" min={0} max={30} value={margin} onChange={e => setMargin(+e.target.value)} style={{ width:100, accentColor:'#0ea5e9' }} />
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={e => { e.preventDefault(); setDragging(false); loadImages(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'32px 24px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(14,165,233,0.04)':'var(--bg-section)', marginBottom:16, transition:'all 0.2s' }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => { loadImages(e.target.files); e.target.value=''; }} />
        <div style={{ fontSize:40, marginBottom:8 }}>📄</div>
        <p style={{ fontWeight:700, margin:'0 0 4px', fontSize:'1.05rem' }}>{images.length > 0 ? '+ Add More Images' : 'Drop images here or click to upload'}</p>
        <p style={{ color:'var(--text-secondary)', margin:0, fontSize:'0.85rem' }}>JPG, PNG, WebP, GIF — each image becomes one PDF page</p>
        <p style={{ marginTop:10, fontSize:'0.75rem', color:'var(--text-tertiary)' }}>🔒 Files never leave your browser</p>
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:8 }}>{images.length} image{images.length!==1?'s':''} — drag to reorder (order = PDF page order)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {images.map((img, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg-section)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} style={{ width:40, height:40, objectFit:'cover', borderRadius:4, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{img.name}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-tertiary)' }}>{img.w}×{img.h} · {formatBytes(img.size)}</div>
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-tertiary)', fontWeight:700, minWidth:20, textAlign:'center' }}>#{i+1}</span>
                  <button onClick={() => moveImage(i,-1)} disabled={i===0} style={{ background:'none', border:'1px solid var(--border-light)', borderRadius:4, cursor:'pointer', padding:'2px 7px', opacity:i===0?.3:1 }}>↑</button>
                  <button onClick={() => moveImage(i,1)} disabled={i===images.length-1} style={{ background:'none', border:'1px solid var(--border-light)', borderRadius:4, cursor:'pointer', padding:'2px 7px', opacity:i===images.length-1?.3:1 }}>↓</button>
                  <button onClick={() => removeImage(i)} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:4, cursor:'pointer', padding:'2px 8px', fontSize:'0.85rem' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={convert} disabled={processing}
            style={{ width:'100%', padding:'13px', background:processing?'var(--border-light)':'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'1rem', cursor:processing?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:processing?'none':'0 4px 16px rgba(14,165,233,0.35)' }}>
            {processing ? (<><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'ilt-spin 0.7s linear infinite' }} /> Converting…</>) : `📄 Convert ${images.length} Image${images.length!==1?'s':''} to PDF`}
          </button>
          {done && <p style={{ textAlign:'center', marginTop:10, color:'#10b981', fontWeight:600, fontSize:'0.88rem' }}>✅ PDF downloaded! Check your Downloads folder.</p>}
        </>
      )}
    </div>
  );
}
