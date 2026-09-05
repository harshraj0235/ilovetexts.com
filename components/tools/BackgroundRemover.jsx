'use client';
import { useState, useRef, useCallback } from 'react';

const S = {
  wrap: { maxWidth: 900, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  swatch: (active, bg) => ({ width: 28, height: 28, borderRadius: '50%', background: bg, border: active ? '3px solid var(--highlight)' : '2px solid var(--border-light)', cursor: 'pointer', flexShrink: 0, outline: active ? '2px solid var(--highlight)' : 'none', outlineOffset: 2, transition: 'all 0.15s' }),
  dropzone: (over) => ({ border: `2px dashed ${over ? 'var(--highlight)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '56px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  imgBox: { background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progressBar: (pct) => ({ height: 6, borderRadius: 3, background: 'var(--highlight)', width: `${pct}%`, transition: 'width 0.3s' }),
  infoTip: { background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 },
};

const BG_SWATCHES = [
  { label: 'Transparent', value: 'transparent', bg: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0/12px 12px' },
  { label: 'White', value: '#ffffff', bg: '#ffffff' },
  { label: 'Black', value: '#000000', bg: '#000000' },
  { label: 'Red', value: '#ef4444', bg: '#ef4444' },
  { label: 'Blue', value: '#3b82f6', bg: '#3b82f6' },
  { label: 'Green', value: '#22c55e', bg: '#22c55e' },
  { label: 'Yellow', value: '#eab308', bg: '#eab308' },
  { label: 'Gray', value: '#6b7280', bg: '#6b7280' },
];

export default function BackgroundRemover({ t, lang }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState('transparent');
  const [tolerance, setTolerance] = useState(30);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState('auto');
  const [pickedColor, setPickedColor] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage({ url: URL.createObjectURL(file), name: file.name });
    setResult(null); setProgress(0); setPickedColor(null);
  };

  const removeBackground = useCallback(async () => {
    if (!image) return;
    setProcessing(true); setProgress(10);
    const img = new Image();
    img.onload = () => {
      const MAX = 1200, scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale; canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setProgress(30);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data, w = canvas.width, h = canvas.height;
      const sampleBg = () => {
        if (pickedColor) return pickedColor;
        const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[Math.floor(w/2),0],[0,Math.floor(h/2)],[w-1,Math.floor(h/2)],[Math.floor(w/2),h-1]];
        let r=0,g=0,b=0;
        corners.forEach(([x,y]) => { const i=(y*w+x)*4; r+=data[i]; g+=data[i+1]; b+=data[i+2]; });
        return [r/corners.length, g/corners.length, b/corners.length];
      };
      const [bgR,bgG,bgB] = sampleBg();
      setProgress(50);
      const colorDist = (i,r,g,b) => Math.sqrt((data[i]-r)**2+(data[i+1]-g)**2+(data[i+2]-b)**2);
      const visited = new Uint8Array(w*h), queue = [];
      for (let x=0;x<w;x++){queue.push(x,0);queue.push(x,h-1);}
      for (let y=0;y<h;y++){queue.push(0,y);queue.push(w-1,y);}
      let qi=0; const tol=tolerance*2.5;
      while(qi<queue.length){
        const x=queue[qi++],y=queue[qi++];
        if(x<0||x>=w||y<0||y>=h) continue;
        const idx=y*w+x; if(visited[idx]) continue;
        if(colorDist(idx*4,bgR,bgG,bgB)>tol) continue;
        visited[idx]=1; queue.push(x+1,y,x-1,y,x,y+1,x,y-1);
      }
      setProgress(75);
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const idx=y*w+x,pi=idx*4;
        if(visited[idx]){ data[pi+3]=0; }
        else { const d=colorDist(pi,bgR,bgG,bgB),fz=tol*0.4; if(d<tol+fz) data[pi+3]=Math.max(0,Math.min(255,((d-tol)/fz)*255)); }
      }
      ctx.putImageData(imageData,0,0); setProgress(90);
      const fc=document.createElement('canvas'); fc.width=canvas.width; fc.height=canvas.height;
      const fCtx=fc.getContext('2d');
      if(bgColor!=='transparent'){fCtx.fillStyle=bgColor;fCtx.fillRect(0,0,fc.width,fc.height);}
      fCtx.drawImage(canvas,0,0);
      setProgress(100); setResult(fc.toDataURL(bgColor==='transparent'?'image/png':'image/jpeg',0.95)); setProcessing(false);
    };
    img.src = image.url;
  }, [image, tolerance, bgColor, pickedColor]);

  const download = () => {
    const a = document.createElement('a');
    a.href = result; a.download = `bg-removed.${bgColor==='transparent'?'png':'jpg'}`; a.click();
  };

  const pickColor = (e) => {
    if (mode !== 'color-pick' || !image) return;
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX-rect.left)*(e.target.naturalWidth/rect.width);
    const y = (e.clientY-rect.top)*(e.target.naturalHeight/rect.height);
    const canvas = document.createElement('canvas');
    canvas.width=e.target.naturalWidth; canvas.height=e.target.naturalHeight;
    const ctx=canvas.getContext('2d'); ctx.drawImage(e.target,0,0);
    const px=ctx.getImageData(Math.round(x),Math.round(y),1,1).data;
    setPickedColor([px[0],px[1],px[2]]); setMode('auto');
  };

  return (
    <div style={S.wrap}>
      {/* Badges */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {['🔒 No server upload','✨ Transparent PNG','🎨 Custom background','⚡ Instant & Free'].map(b=>(
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Upload */}
      {!image && (
        <div onDrop={(e)=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
          onDragOver={(e)=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
          <div style={{fontSize:52,marginBottom:16}}>🖼️</div>
          <h2 style={{fontSize:'1.3rem',fontWeight:700,marginBottom:8}}>Drop image here or click to upload</h2>
          <p style={{color:'var(--text-secondary)',marginBottom:16,fontSize:'0.9rem'}}>JPG, PNG, WebP, GIF — up to 20MB</p>
          <button className="btn-primary" style={{padding:'10px 28px',cursor:'pointer'}} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Choose Image</button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Workspace */}
      {image && (
        <>
          {/* Controls */}
          <div style={S.card}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <div>
                <label style={S.label}>Edge Sensitivity: {tolerance}</label>
                <input type="range" min={10} max={80} value={tolerance} onChange={e=>setTolerance(Number(e.target.value))}
                  style={{width:'100%',accentColor:'var(--highlight)'}} />
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',color:'var(--text-tertiary)',marginTop:4}}>
                  <span>Precise</span><span>Aggressive</span>
                </div>
              </div>
              <div>
                <label style={S.label}>New Background</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  {BG_SWATCHES.map(({label,value,bg})=>(
                    <button key={value} title={label} onClick={()=>setBgColor(value)}
                      style={{...S.swatch(bgColor===value,bg),backgroundImage:bg.includes('conic')?bg:undefined,backgroundColor:bg.includes('conic')?undefined:bg}} />
                  ))}
                  <input type="color" value={bgColor==='transparent'?'#ffffff':bgColor} onChange={e=>setBgColor(e.target.value)}
                    style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',border:'2px solid var(--border-light)',padding:0}} title="Custom" />
                </div>
              </div>
            </div>

            {pickedColor && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,fontSize:'0.82rem',color:'var(--text-secondary)'}}>
                <div style={{width:16,height:16,borderRadius:'50%',border:'1px solid var(--border-light)',backgroundColor:`rgb(${pickedColor.join(',')})`}} />
                Color picked: rgb({pickedColor.join(', ')})
                <button onClick={()=>setPickedColor(null)} style={{border:'none',background:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.8rem'}}>✕ Reset</button>
              </div>
            )}

            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>setMode(mode==='color-pick'?'auto':'color-pick')}
                style={{padding:'8px 16px',borderRadius:'var(--radius-sm)',border:`1px solid ${mode==='color-pick'?'var(--highlight)':'var(--border-light)'}`,background:mode==='color-pick'?'var(--highlight)':'var(--bg-secondary)',color:mode==='color-pick'?'#fff':'var(--text-primary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:600}}>
                🎯 {mode==='color-pick'?'Click image to pick':'Pick BG Color'}
              </button>
              <button onClick={removeBackground} disabled={processing}
                className="btn-primary" style={{padding:'8px 20px',cursor:'pointer',opacity:processing?0.6:1}}>
                {processing?`Processing... ${progress}%`:'✨ Remove Background'}
              </button>
              {result && <button onClick={download} className="btn-primary" style={{padding:'8px 20px',cursor:'pointer',background:'#10b981',borderColor:'#10b981'}}>⬇️ Download {bgColor==='transparent'?'PNG':'JPG'}</button>}
              <button onClick={()=>{setImage(null);setResult(null);setProgress(0);}} style={{padding:'8px 16px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.85rem'}}>🔄 New Image</button>
            </div>
          </div>

          {/* Progress bar */}
          {processing && (
            <div style={{...S.card,padding:16,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:8}}>
                <span>⚙️ Removing background...</span><span>{progress}%</span>
              </div>
              <div style={{height:6,background:'var(--bg-tertiary)',borderRadius:3,overflow:'hidden'}}>
                <div style={S.progressBar(progress)} />
              </div>
            </div>
          )}

          {/* Images side by side */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <div style={{fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Original</div>
              <div style={S.imgBox}>
                <img src={image.url} alt="Original" onClick={pickColor}
                  style={{maxWidth:'100%',maxHeight:320,objectFit:'contain',cursor:mode==='color-pick'?'crosshair':'default',display:'block'}} />
              </div>
              {mode==='color-pick' && <p style={{fontSize:'0.78rem',color:'var(--highlight)',marginTop:6,textAlign:'center'}}>👆 Click on the background to pick its color</p>}
            </div>
            <div>
              <div style={{fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Result</div>
              <div style={{...S.imgBox,backgroundImage:'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)',backgroundSize:'20px 20px'}}>
                {result
                  ? <img src={result} alt="Result" style={{maxWidth:'100%',maxHeight:320,objectFit:'contain',display:'block'}} />
                  : <div style={{textAlign:'center',color:'var(--text-tertiary)',padding:40}}>
                      <div style={{fontSize:36,marginBottom:8}}>✨</div>
                      <p style={{fontSize:'0.85rem'}}>Result will appear here</p>
                    </div>
                }
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tips */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
        {[
          {icon:'🎯',title:'Best results',desc:'Works best with solid or uniform backgrounds (white, blue, green)'},
          {icon:'🎨',title:'Custom color',desc:'Use the color picker to set any background color on the result'},
          {icon:'🔒',title:'100% private',desc:'Your image never leaves your browser — no server upload ever'},
        ].map(({icon,title,desc})=>(
          <div key={title} style={S.infoTip}>
            <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
            <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:4}}>{title}</div>
            <div style={{color:'var(--text-secondary)',fontSize:'0.82rem'}}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
