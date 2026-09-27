'use client';
// ═══════════════════════════════════════════════════════
// ImageResizer.jsx — Resize images in browser
// Canvas API — zero upload, 100% private
// Targets: "resize image online free" 400K+/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB'];
  const i = Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
}

export default function ImageResizer({ t, lang }) {
  const [origImg, setOrigImg] = useState(null); // {url, name, w, h, size, type}
  const [width, setWidth]     = useState('');
  const [height, setHeight]   = useState('');
  const [lockAR, setLockAR]   = useState(true);
  const [mode, setMode]       = useState('px'); // px | percent
  const [outputFmt, setOutputFmt] = useState('same');
  const [quality, setQuality]  = useState(90);
  const [result, setResult]   = useState(null); // {url, blob, w, h, size}
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]     = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const loadImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file','warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOrigImg({ url: e.target.result, name: file.name, w: img.naturalWidth, h: img.naturalHeight, size: file.size, type: file.type });
        setWidth(String(img.naturalWidth));
        setHeight(String(img.naturalHeight));
        setResult(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleWidthChange = (v) => {
    setWidth(v);
    if (lockAR && origImg && v) {
      const ar = origImg.h / origImg.w;
      setHeight(String(Math.round(+v * ar)));
    }
  };
  const handleHeightChange = (v) => {
    setHeight(v);
    if (lockAR && origImg && v) {
      const ar = origImg.w / origImg.h;
      setWidth(String(Math.round(+v * ar)));
    }
  };

  const handleResize = useCallback(() => {
    if (!origImg || !width || !height) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      let newW = +width, newH = +height;
      if (mode === 'percent') {
        newW = Math.round(origImg.w * newW / 100);
        newH = Math.round(origImg.h * newH / 100);
      }
      const canvas = document.createElement('canvas');
      canvas.width = newW; canvas.height = newH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newW, newH);
      const fmt = outputFmt === 'same' ? (origImg.type || 'image/jpeg') : outputFmt;
      const q = fmt === 'image/png' ? 1 : quality / 100;
      canvas.toBlob((blob) => {
        setResult({ url: URL.createObjectURL(blob), blob, w: newW, h: newH, size: blob.size, fmt });
        setProcessing(false);
        showToast('Image resized successfully!');
      }, fmt, q);
    };
    img.src = origImg.url;
  }, [origImg, width, height, mode, outputFmt, quality]);

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    const ext = result.fmt.split('/')[1].replace('jpeg','jpg');
    a.download = origImg.name.replace(/\.[^.]+$/,'') + `-${result.w}x${result.h}.${ext}`;
    a.click();
    showToast('Image downloaded!');
  };

  const PRESETS = [
    { label: 'HD (1280×720)', w: 1280, h: 720 },
    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
    { label: 'Square (1080×1080)', w: 1080, h: 1080 },
    { label: 'Twitter header', w: 1500, h: 500 },
    { label: 'Instagram post', w: 1080, h: 1080 },
    { label: 'Facebook cover', w: 851, h: 315 },
    { label: 'Thumbnail (320×180)', w: 320, h: 180 },
    { label: 'Avatar (256×256)', w: 256, h: 256 },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {!origImg ? (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center', cursor: 'pointer', background: dragging?'rgba(14,165,233,0.04)':'var(--bg-section)' }}
        >
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { loadImage(e.target.files[0]); e.target.value=''; }} />
          <div style={{ fontSize: 52, marginBottom: 12 }}>↔️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop an image to resize</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>JPG, PNG, WebP, GIF — resize by pixels or percentage</p>
          <button style={{ padding: '10px 26px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose Image
          </button>
          <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>🔒 Your image never leaves your browser</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Preview */}
          <div>
            <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result?.url || origImg.url} alt="preview" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Original: {origImg.w}×{origImg.h} · {formatBytes(origImg.size)}</span>
              {result && <span style={{ color: '#0ea5e9', fontWeight: 700 }}>→ {result.w}×{result.h} · {formatBytes(result.size)}</span>}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['px','percent'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'6px', borderRadius: 'var(--radius-sm)', border:`1px solid ${mode===m?'#0ea5e9':'var(--border-light)'}`, background:mode===m?'rgba(14,165,233,0.1)':'var(--bg-section)', color:mode===m?'#0ea5e9':'var(--text-secondary)', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
                  {m==='px'?'Pixels':'Percent'}
                </button>
              ))}
            </div>

            {/* Dimensions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 6, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Width {mode==='px'?'(px)':'(%)'}</label>
                <input type="number" value={width} onChange={e => handleWidthChange(e.target.value)} min={1}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
              </div>
              <button onClick={() => setLockAR(v => !v)} title={lockAR?'Unlock aspect ratio':'Lock aspect ratio'}
                style={{ height:34, background:lockAR?'rgba(14,165,233,0.1)':'var(--bg-section)', border:`1px solid ${lockAR?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:'0.9rem' }}>
                {lockAR?'🔗':'🔓'}
              </button>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Height {mode==='px'?'(px)':'(%)'}</label>
                <input type="number" value={height} onChange={e => handleHeightChange(e.target.value)} min={1}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
              </div>
            </div>

            {/* Presets */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quick Presets</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => { setMode('px'); setWidth(String(p.w)); setHeight(String(p.h)); setLockAR(false); }}
                    style={{ padding:'5px 10px', textAlign:'left', borderRadius:4, border:'1px solid var(--border-light)', background:'var(--bg-section)', cursor:'pointer', fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                    {p.label} ({p.w}×{p.h})
                  </button>
                ))}
              </div>
            </div>

            {/* Format + Quality */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Output Format</label>
                <select value={outputFmt} onChange={e => setOutputFmt(e.target.value)}
                  style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem' }}>
                  <option value="same">Same</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Quality: {quality}%</label>
                <input type="range" min={20} max={100} step={5} value={quality} onChange={e => setQuality(+e.target.value)} style={{ width:'100%', accentColor:'#0ea5e9' }} />
              </div>
            </div>

            {/* Actions */}
            <button onClick={handleResize} disabled={processing} style={{ padding:'11px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {processing ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'ilt-spin 0.7s linear infinite' }} />Resizing…</> : '↔️ Resize Image'}
            </button>
            {result && (
              <button onClick={download} className="btn-primary" style={{ padding:'10px' }}>⬇ Download Resized Image</button>
            )}
            <button onClick={() => { setOrigImg(null); setResult(null); }} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>Upload Different Image</button>
          </div>
        </div>
      )}
    </div>
  );
}
