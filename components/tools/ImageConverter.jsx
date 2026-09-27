'use client';
// ═══════════════════════════════════════════════════════
// ImageConverter.jsx — Convert between JPG/PNG/WebP/GIF
// Canvas API — zero upload, 100% private, batch convert
// Targets: "jpg to png free" 200K/mo + "png to jpg" 180K/mo
//          + "webp to jpg" 150K/mo = 530K+/month
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

const FORMATS = [
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg', desc: 'Best for photos, smallest file size' },
  { value: 'image/png',  label: 'PNG', ext: 'png', desc: 'Lossless, supports transparency' },
  { value: 'image/webp', label: 'WebP', ext: 'webp', desc: 'Modern format, 30% smaller than JPG' },
];

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB'];
  const i = Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
}

function getInputFormat(type) {
  if (type.includes('png')) return 'PNG';
  if (type.includes('webp')) return 'WebP';
  if (type.includes('gif')) return 'GIF';
  return 'JPG';
}

export default function ImageConverter({ t, lang }) {
  const [files, setFiles]     = useState([]);
  const [targetFmt, setTargetFmt] = useState('image/jpeg');
  const [quality, setQuality]  = useState(90);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]     = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const convertImage = useCallback((file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        // White background for PNG→JPG (transparency removal)
        if (targetFmt === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img, 0, 0);
        const q = targetFmt === 'image/png' ? 1 : quality / 100;
        canvas.toBlob(blob => {
          if (!blob) { resolve(null); return; }
          const ext = FORMATS.find(f => f.value === targetFmt)?.ext || 'jpg';
          resolve({
            name: file.name, origType: getInputFormat(file.type),
            origSize: file.size, compSize: blob.size,
            url: URL.createObjectURL(blob), blob,
            outName: file.name.replace(/\.[^.]+$/, '') + '.' + ext,
            w: img.naturalWidth, h: img.naturalHeight,
          });
        }, targetFmt, q);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }), [targetFmt, quality]);

  const processFiles = useCallback(async (fileList) => {
    const imgs = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please upload image files','warning'); return; }
    setProcessing(true);
    const results = await Promise.all(imgs.map(convertImage));
    setFiles(results.filter(Boolean));
    setProcessing(false);
    showToast(`${results.length} image${results.length!==1?'s':''} converted to ${FORMATS.find(f=>f.value===targetFmt)?.label}!`);
  }, [convertImage]);

  const downloadAll = () => {
    files.forEach(f => {
      const a = document.createElement('a');
      a.href = f.url; a.download = f.outName; a.click();
    });
    showToast('All images downloaded!');
  };

  const targetLabel = FORMATS.find(f => f.value === targetFmt)?.label;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {/* Format selector */}
      <div className="trust-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Convert To:</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {FORMATS.map(fmt => (
            <button key={fmt.value} onClick={() => setTargetFmt(fmt.value)}
              style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: `2px solid ${targetFmt===fmt.value?'#0ea5e9':'var(--border-light)'}`, background: targetFmt===fmt.value?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: targetFmt===fmt.value?'#0ea5e9':'var(--text-primary)' }}>{fmt.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>{fmt.desc}</div>
            </button>
          ))}
        </div>
        {targetFmt !== 'image/png' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Quality: {quality}%</label>
            <input type="range" min={20} max={100} step={5} value={quality} onChange={e => setQuality(+e.target.value)} style={{ flex: 1, accentColor: '#0ea5e9' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{quality >= 85 ? 'High' : quality >= 60 ? 'Medium' : 'Low'}</span>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'40px 24px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(14,165,233,0.04)':'var(--bg-section)', marginBottom:20, transition:'all 0.2s' }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => { processFiles(e.target.files); e.target.value=''; }} />
        {processing ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, border:'3px solid #0ea5e9', borderTopColor:'transparent', borderRadius:'50%', animation:'ilt-spin 0.8s linear infinite' }} />
            <p style={{ margin:0, color:'var(--text-secondary)' }}>Converting to {targetLabel}…</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:48, marginBottom:12 }}>🔄</div>
            <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>Drop images to convert to {targetLabel}</h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:16, fontSize:'0.9rem' }}>JPG, PNG, WebP, GIF — batch convert multiple images at once</p>
            <button style={{ padding:'10px 26px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
              Choose Images
            </button>
            <p style={{ marginTop:14, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>🔒 Images never leave your browser — 100% private</p>
          </>
        )}
      </div>

      {/* Results */}
      {files.length > 0 && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <button onClick={downloadAll} className="btn-primary" style={{ padding:'10px 24px', fontSize:'0.9rem' }}>
              ⬇ Download All as {targetLabel} ({files.length})
            </button>
            <button onClick={() => setFiles([])} className="btn btn-secondary">🗑 Clear</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {files.map((f,i) => (
              <div key={i} className="trust-card" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ height:140, overflow:'hidden', background:'#f0f0f0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                <div style={{ padding:10 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{f.outName}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:8 }}>
                    {f.origType} → <strong style={{ color:'#0ea5e9' }}>{targetLabel}</strong> · {f.w}×{f.h} · {formatBytes(f.origSize)} → <strong>{formatBytes(f.compSize)}</strong>
                  </div>
                  <button onClick={() => { const a=document.createElement('a'); a.href=f.url; a.download=f.outName; a.click(); }}
                    style={{ width:'100%', padding:'6px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}>
                    ⬇ Download {targetLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
