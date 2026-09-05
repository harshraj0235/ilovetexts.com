'use client';
import { useState, useRef, useCallback } from 'react';

const SIZES = [
  { id: 'india-passport', label: '🇮🇳 India Passport', w: 35, h: 45, desc: '35×45mm' },
  { id: 'india-visa', label: '🇮🇳 India Visa', w: 51, h: 51, desc: '51×51mm' },
  { id: 'us-passport', label: '🇺🇸 US Passport', w: 51, h: 51, desc: '2×2 inch' },
  { id: 'uk-passport', label: '🇬🇧 UK Passport', w: 35, h: 45, desc: '35×45mm' },
  { id: 'schengen', label: '🇪🇺 Schengen Visa', w: 35, h: 45, desc: '35×45mm' },
  { id: 'uae', label: '🇦🇪 UAE Visa', w: 43, h: 55, desc: '43×55mm' },
  { id: 'australia', label: '🇦🇺 Australia', w: 35, h: 45, desc: '35×45mm' },
  { id: 'custom', label: '✏️ Custom', w: 35, h: 45, desc: 'Set size' },
];

const PPI = 300;
const MM_PX = PPI / 25.4;

const S = {
  wrap: { maxWidth: 960, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  sizeBtn: (active) => ({ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: `2px solid ${active ? 'var(--highlight)' : 'var(--border-light)'}`, background: active ? 'rgba(0,112,243,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }),
  dropzone: (over) => ({ border: `2px dashed ${over ? 'var(--highlight)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-md)', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  swatch: (active, color) => ({ width: 26, height: 26, borderRadius: '50%', background: color, border: active ? '3px solid var(--highlight)' : '2px solid var(--border-light)', cursor: 'pointer', outline: active ? '2px solid var(--highlight)' : 'none', outlineOffset: 2 }),
};

export default function PassportPhotoMaker({ t, lang }) {
  const [image, setImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('india-passport');
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [printLayout, setPrintLayout] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const fileRef = useRef();

  const size = SIZES.find(s => s.id === selectedSize) || SIZES[0];
  const photoW = selectedSize === 'custom' ? customW : size.w;
  const photoH = selectedSize === 'custom' ? customH : size.h;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage({ url: URL.createObjectURL(file), name: file.name });
    setResult(null); setZoom(1); setPanX(0); setPanY(0);
  };

  const generate = useCallback(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const pxW = Math.round(photoW * MM_PX), pxH = Math.round(photoH * MM_PX);
      const canvas = document.createElement('canvas');
      canvas.width = pxW; canvas.height = pxH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, pxW, pxH);
      const iA = img.width / img.height, cA = pxW / pxH;
      let dW, dH;
      if (iA > cA) { dH = pxH * zoom; dW = dH * iA; }
      else { dW = pxW * zoom; dH = dW / iA; }
      const dX = (pxW - dW) / 2 + panX * zoom;
      const dY = (pxH - dH) / 2 + panY * zoom;
      ctx.save(); ctx.rect(0, 0, pxW, pxH); ctx.clip();
      ctx.drawImage(img, dX, dY, dW, dH); ctx.restore();

      if (printLayout) {
        const pW = Math.round(4 * PPI), pH = Math.round(6 * PPI);
        const pCanvas = document.createElement('canvas');
        pCanvas.width = pW; pCanvas.height = pH;
        const pCtx = pCanvas.getContext('2d');
        pCtx.fillStyle = '#fff'; pCtx.fillRect(0, 0, pW, pH);
        const cols = 3, rows = 2, margin = Math.round(0.1 * PPI);
        const spX = Math.round((pW - margin * 2 - cols * pxW) / (cols - 1));
        const spY = Math.round((pH - margin * 2 - rows * pxH) / (rows - 1));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = margin + c * (pxW + spX), y = margin + r * (pxH + spY);
          pCtx.drawImage(canvas, x, y, pxW, pxH);
          pCtx.strokeStyle = '#ccc'; pCtx.lineWidth = 1; pCtx.strokeRect(x, y, pxW, pxH);
        }
        setResult({ url: pCanvas.toDataURL('image/jpeg', 0.95), type: 'print', name: `passport-print-4x6.jpg` });
      } else {
        setResult({ url: canvas.toDataURL('image/jpeg', 0.95), type: 'single', name: `passport-${photoW}x${photoH}mm.jpg` });
      }
    };
    img.src = image.url;
  }, [image, photoW, photoH, bgColor, zoom, panX, panY, printLayout]);

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🌍 8 country standards', '🖨️ Print-ready 4×6', '🎯 300 DPI quality', '🔒 No signup'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Size selector */}
          <div style={S.card}>
            <div style={S.label}>Photo Standard</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {SIZES.map(s => (
                <button key={s.id} onClick={() => setSelectedSize(s.id)} style={S.sizeBtn(selectedSize === s.id)}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{s.desc}</div>
                </button>
              ))}
            </div>
            {selectedSize === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {[['Width (mm)', customW, setCustomW], ['Height (mm)', customH, setCustomH]].map(([lbl, val, setter]) => (
                  <div key={lbl}>
                    <div style={S.label}>{lbl}</div>
                    <input type="number" value={val} onChange={e => setter(Number(e.target.value))} min={10} max={100}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BG color */}
          <div style={S.card}>
            <div style={S.label}>Background</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {['#ffffff', '#f0f0e8', '#87ceeb', '#000000'].map(c => (
                <button key={c} onClick={() => setBgColor(c)} style={S.swatch(bgColor === c, c)} />
              ))}
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                style={{ width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', border: '2px solid var(--border-light)', padding: 0 }} />
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!image ? (
            <div onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
              <div style={{fontSize:44,marginBottom:12}}>📷</div>
              <p style={{fontWeight:700,fontSize:'1.05rem',marginBottom:8}}>Upload your photo</p>
              <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginBottom:14}}>JPG, PNG — face clearly visible</p>
              <button className="btn-primary" style={{padding:'10px 24px',cursor:'pointer'}} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Choose Photo</button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={S.card}>
              {/* Source preview */}
              <div style={{position:'relative',marginBottom:14,background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',overflow:'hidden',maxHeight:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src={image.url} alt="Source" style={{maxHeight:200,maxWidth:'100%',objectFit:'contain',display:'block'}} />
                <button onClick={()=>{setImage(null);setResult(null);}}
                  style={{position:'absolute',top:6,right:6,background:'#ef4444',color:'#fff',border:'none',borderRadius:'50%',width:24,height:24,cursor:'pointer',fontSize:'0.75rem',fontWeight:700}}>✕</button>
              </div>

              {/* Adjustments */}
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'start',marginBottom:14}}>
                <div>
                  <label style={S.label}>Zoom: {zoom.toFixed(1)}x</label>
                  <input type="range" min={0.5} max={3} step={0.1} value={zoom} onChange={e=>setZoom(Number(e.target.value))}
                    style={{width:'100%',accentColor:'var(--highlight)'}} />
                </div>
                <div>
                  <label style={S.label}>Position</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:3,width:76}}>
                    <div />
                    <button onClick={()=>setPanY(p=>p-8)} style={{padding:'4px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',cursor:'pointer',background:'var(--bg-secondary)',fontSize:'0.7rem'}}>▲</button>
                    <div />
                    <button onClick={()=>setPanX(p=>p-8)} style={{padding:'4px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',cursor:'pointer',background:'var(--bg-secondary)',fontSize:'0.7rem'}}>◀</button>
                    <div style={{width:24,height:24}} />
                    <button onClick={()=>setPanX(p=>p+8)} style={{padding:'4px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',cursor:'pointer',background:'var(--bg-secondary)',fontSize:'0.7rem'}}>▶</button>
                    <div />
                    <button onClick={()=>setPanY(p=>p+8)} style={{padding:'4px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',cursor:'pointer',background:'var(--bg-secondary)',fontSize:'0.7rem'}}>▼</button>
                    <div />
                  </div>
                </div>
              </div>

              {/* Print layout toggle */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,cursor:'pointer'}} onClick={()=>setPrintLayout(p=>!p)}>
                <div style={{width:38,height:20,borderRadius:10,background:printLayout?'var(--highlight)':'var(--bg-tertiary)',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                  <div style={{width:16,height:16,background:'#fff',borderRadius:'50%',position:'absolute',top:2,left:printLayout?19:2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
                </div>
                <span style={{fontSize:'0.85rem',color:'var(--text-primary)'}}>Print layout (6 photos on 4×6 sheet)</span>
              </div>

              <button onClick={generate} className="btn-primary" style={{width:'100%',padding:'11px',cursor:'pointer',fontSize:'0.95rem'}}>
                📸 Generate {photoW}×{photoH}mm Photo
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={S.card}>
              <div style={S.label}>Result — {photoW}×{photoH}mm</div>
              <div style={{background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,maxHeight:320}}>
                <img src={result.url} alt="Passport photo" style={{maxHeight:320,maxWidth:'100%',objectFit:'contain',display:'block'}} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{const a=document.createElement('a');a.href=result.url;a.download=result.name;a.click();}}
                  style={{flex:1,padding:'11px',background:'#16a34a',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer'}}>
                  ⬇️ Download {result.type==='print'?'Print Sheet':'Photo'}
                </button>
                <button onClick={()=>setResult(null)}
                  style={{padding:'11px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.85rem'}}>
                  🔄 Adjust
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'var(--radius-md)',padding:16,marginTop:8}}>
        <div style={{fontWeight:700,color:'#1e40af',marginBottom:10,fontSize:'0.9rem'}}>📋 India Passport Photo Requirements (MEA 2021)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:6,fontSize:'0.8rem',color:'#1d4ed8'}}>
          {['35×45mm, white background','Face: 70-80% of frame height','No glasses (MEA 2021 rule)','Neutral expression, mouth closed','Taken within last 6 months','No shadows on face or background','Plain clothes, no uniform','Print on matte photo paper'].map(req=>(
            <div key={req} style={{display:'flex',gap:6}}>✅ {req}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
