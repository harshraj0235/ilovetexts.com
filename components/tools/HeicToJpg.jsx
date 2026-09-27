'use client';
import { useState, useRef } from 'react';

const S = {
  wrap: { maxWidth: 720, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#f97316' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(249,115,22,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  fmtBtn: (active) => ({ flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${active ? '#f97316' : 'var(--border-light)'}`, background: active ? 'rgba(249,115,22,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600, fontSize: '0.85rem', color: active ? '#f97316' : 'var(--text-primary)' }),
  progressBar: (pct) => ({ height: 6, borderRadius: 3, background: '#f97316', width: `${pct}%`, transition: 'width 0.3s' }),
  fileRow: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem' },
};

export default function HeicToJpg({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [quality, setQuality] = useState(92);
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.name.toLowerCase().match(/\.(heic|heif)$/) || f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
    setResults([]);
  };

  const convertAll = async () => {
    if (!files.length) return;
    setConverting(true); setResults([]);
    const output = [];
    for (const { file, id } of files) {
      try {
        const blob = await convertFile(file, outputFormat, quality);
        const url = URL.createObjectURL(blob);
        const name = file.name.replace(/\.(heic|heif)$/i, `.${outputFormat}`);
        output.push({ id, url, name, size: blob.size, success: true });
      } catch (err) { output.push({ id, name: file.name, success: false }); }
    }
    setResults(output); setConverting(false);
  };

  const convertFile = (file, fmt, qual) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800; canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        if (fmt === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed')), fmt === 'jpg' ? 'image/jpeg' : 'image/png', qual / 100);
      };
      img.onerror = () => reject(new Error('Cannot decode'));
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const downloadAll = async () => {
    const ok = results.filter(r => r.success);
    if (ok.length === 1) {
      const a = document.createElement('a'); a.href = ok[0].url; a.download = ok[0].name; a.click();
    } else {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const r of ok) { const res = await fetch(r.url); zip.file(r.name, await res.blob()); }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'converted-images.zip'; a.click();
    }
  };

  const successCount = results.filter(r => r.success).length;

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['📱 iPhone HEIC photos', '📦 Bulk convert', '🔒 No upload', '⚡ Free forever'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Settings */}
      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={S.label}>Output Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['jpg', '🖼️ JPG (smaller)'], ['png', '🖼️ PNG (lossless)']].map(([val, label]) => (
                <button key={val} onClick={() => setOutputFormat(val)} style={S.fmtBtn(outputFormat === val)}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={S.label}>Quality: {quality}%</label>
            <input type="range" min={60} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f97316', marginTop: 4 }} />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
        onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
        <div style={{fontSize:48,marginBottom:12}}>📱</div>
        <h2 style={{fontSize:'1.2rem',fontWeight:700,marginBottom:8}}>Drop HEIC files here or click to select</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:16,fontSize:'0.88rem'}}>Supports .heic .heif — multiple files at once</p>
        <button className="btn-primary" style={{padding:'10px 24px',cursor:'pointer',background:'#f97316',borderColor:'#f97316'}} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Choose Files</button>
        <input ref={fileRef} type="file" accept=".heic,.heif,image/*" multiple style={{display:'none'}} onChange={e=>addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:'0.95rem'}}>{files.length} file{files.length>1?'s':''} selected</span>
            <button onClick={()=>{setFiles([]);setResults([]);}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.82rem',fontWeight:600}}>Clear all</button>
          </div>

          <div style={{maxHeight:240,overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
            {files.map(({file,id})=>{
              const res = results.find(r=>r.id===id);
              return (
                <div key={id} style={S.fileRow}>
                  <span style={{fontSize:20}}>{file.name.endsWith('.pdf')?'📑':'📷'}</span>
                  <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</span>
                  <span style={{color:'var(--text-tertiary)',fontSize:'0.78rem',flexShrink:0}}>{(file.size/1024).toFixed(0)} KB</span>
                  {res&&(res.success
                    ? <span style={{color:'#16a34a',fontWeight:600,fontSize:'0.78rem',flexShrink:0}}>✅ {(res.size/1024).toFixed(0)} KB</span>
                    : <span style={{color:'#dc2626',fontSize:'0.78rem',flexShrink:0}}>❌ Failed</span>)}
                  {!res&&<button onClick={()=>setFiles(f=>f.filter(x=>x.id!==id))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:'1rem',flexShrink:0}}>✕</button>}
                </div>
              );
            })}
          </div>

          {converting && (
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:6}}>
                <span>⚙️ Converting...</span>
              </div>
              <div style={{height:6,background:'var(--bg-tertiary)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',background:'#f97316',borderRadius:3,animation:'ilt-pulse 1s ease-in-out infinite'}} />
              </div>
            </div>
          )}

          {!results.length && !converting && (
            <button onClick={convertAll} style={{width:'100%',padding:'12px',background:'#f97316',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer',fontSize:'1rem'}}>
              🔄 Convert {files.length} File{files.length>1?'s':''} to {outputFormat.toUpperCase()}
            </button>
          )}

          {successCount > 0 && (
            <>
              <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'var(--radius-md)',padding:14,textAlign:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#15803d'}}>✅ {successCount} file{successCount>1?'s':''} converted!</div>
              </div>
              <button onClick={downloadAll} style={{width:'100%',padding:'12px',background:'#16a34a',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer',marginBottom:8,fontSize:'0.95rem'}}>
                ⬇️ Download {successCount>1?'All as ZIP':outputFormat.toUpperCase()}
              </button>
              <button onClick={()=>{setFiles([]);setResults([]);}} style={{width:'100%',padding:'10px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.85rem'}}>
                🔄 Convert More Files
              </button>
            </>
          )}
        </div>
      )}

      <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'var(--radius-md)',padding:14,fontSize:'0.83rem',color:'#92400e'}}>
        <strong>📱 iPhone users:</strong> HEIC is the default iPhone photo format since iOS 11. Convert to JPG so photos work on Windows, WhatsApp, websites, and forms.
      </div>
    </div>
  );
}
