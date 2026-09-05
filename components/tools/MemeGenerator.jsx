'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const TEMPLATES = [
  { id: 'drake', name: 'Drake', emoji: '🦆', topY: 0.15, bottomY: 0.65 },
  { id: 'distracted', name: 'Distracted BF', emoji: '👀', topY: 0.12, bottomY: 0.85 },
  { id: 'success', name: 'Success Kid', emoji: '✊', topY: 0.12, bottomY: 0.85 },
  { id: 'fine', name: 'This Is Fine 🔥', emoji: '🐶', topY: 0.1, bottomY: 0.85 },
  { id: 'buttons', name: 'Two Buttons', emoji: '🔴', topY: 0.1, bottomY: 0.85 },
  { id: 'blank', name: 'Blank / Upload', emoji: '🖼️', topY: 0.12, bottomY: 0.88 },
];

const BG_COLORS = {
  drake: ['#1a1a2e', '#16213e'],
  distracted: ['#2d3561', '#c05c7e'],
  success: ['#1a6b3c', '#2d8a56'],
  fine: ['#d35400', '#e67e22'],
  buttons: ['#c0392b', '#e74c3c'],
  blank: ['#374151', '#4b5563'],
};

const S = {
  wrap: { maxWidth: 960, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', outline: 'none', letterSpacing: '0.03em', boxSizing: 'border-box' },
  tmplBtn: (active) => ({ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: `2px solid ${active ? '#eab308' : 'var(--border-light)'}`, background: active ? 'rgba(234,179,8,0.08)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }),
  dropzone: (over) => ({ border: `2px dashed ${over ? '#eab308' : 'var(--border-light)'}`, borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(234,179,8,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s', fontSize: '0.85rem', color: 'var(--text-secondary)' }),
};

export default function MemeGenerator({ t, lang }) {
  const [selected, setSelected] = useState('blank');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [fontSize, setFontSize] = useState(42);
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [customImage, setCustomImage] = useState(null);
  const [templateImg, setTemplateImg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef();
  const fileRef = useRef();

  const buildTemplateBg = useCallback((id) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const [c1, c2] = BG_COLORS[id] || ['#374151', '#4b5563'];
    const g = ctx.createLinearGradient(0, 0, 600, 600);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 600);
    const tmpl = TEMPLATES.find(t => t.id === id);
    if (tmpl) {
      ctx.font = 'bold 72px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillText(tmpl.emoji, 300, 310);
      ctx.font = 'bold 16px sans-serif'; ctx.fillText(tmpl.name, 300, 360);
    }
    const img = new Image();
    img.onload = () => setTemplateImg(img);
    img.src = canvas.toDataURL();
  }, []);

  useEffect(() => { if (!customImage) buildTemplateBg(selected); }, [selected, customImage, buildTemplateBg]);

  useEffect(() => { drawMeme(); }, [topText, bottomText, fontSize, textColor, strokeColor, templateImg, customImage]);

  const drawMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = customImage || templateImg;
    if (!img) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.width || 600; canvas.height = img.height || 600;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const tmpl = TEMPLATES.find(t => t.id === selected);
    const topY = canvas.height * (tmpl?.topY || 0.12);
    const bottomY = canvas.height * (tmpl?.bottomY || 0.88);
    drawText(ctx, topText, canvas.width / 2, topY + fontSize, canvas.width - 32);
    drawText(ctx, bottomText, canvas.width / 2, bottomY, canvas.width - 32);
  };

  const drawText = (ctx, text, x, y, maxW) => {
    if (!text?.trim()) return;
    ctx.font = `900 ${fontSize}px Impact, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center'; ctx.lineWidth = fontSize / 8;
    ctx.strokeStyle = strokeColor; ctx.fillStyle = textColor;
    const words = text.toUpperCase().split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    const lh = fontSize * 1.15;
    let sy = y > canvas.height / 2 ? y - (lines.length - 1) * lh : y;
    lines.forEach((line, i) => {
      ctx.strokeText(line, x, sy + i * lh);
      ctx.fillText(line, x, sy + i * lh);
    });
  };

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => setCustomImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const download = () => {
    const a = document.createElement('a'); a.href = canvasRef.current.toDataURL('image/png'); a.download = 'meme.png'; a.click();
  };

  const copyMeme = async () => {
    canvasRef.current.toBlob(async blob => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); alert('Copied!'); }
      catch { alert('Copy not supported in this browser. Use Download instead.'); }
    });
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🚫 No watermark', '🖼️ Any image', '🎨 Full control', '⚡ Live preview'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Templates */}
          <div style={S.card}>
            <div style={S.label}>Template</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {TEMPLATES.map(tmpl => (
                <button key={tmpl.id} onClick={() => { setSelected(tmpl.id); setCustomImage(null); }} style={S.tmplBtn(selected === tmpl.id && !customImage)}>
                  <div style={{ fontSize: 24 }}>{tmpl.emoji}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tmpl.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div style={S.card}>
            <div style={S.label}>Upload Your Own Image</div>
            <div onDrop={e=>{e.preventDefault();setDragOver(false);handleImage(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
              {customImage
                ? <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{color:'#16a34a',fontWeight:600}}>✅ Custom image loaded</span>
                    <button onClick={e=>{e.stopPropagation();setCustomImage(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.8rem'}}>✕ Remove</button>
                  </div>
                : <span>📁 Drop image or click to upload</span>
              }
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleImage(e.target.files[0])} />
            </div>
          </div>

          {/* Text inputs */}
          <div style={S.card}>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Top Text</label>
              <input value={topText} onChange={e => setTopText(e.target.value)} placeholder="TOP TEXT" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Bottom Text</label>
              <input value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" style={S.input} />
            </div>
          </div>

          {/* Style */}
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'end' }}>
              <div>
                <label style={S.label}>Font Size: {fontSize}px</label>
                <input type="range" min={20} max={80} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#eab308' }} />
              </div>
              <div>
                <label style={S.label}>Text</label>
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  style={{ width: 36, height: 32, borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-light)', padding: 2 }} />
              </div>
              <div>
                <label style={S.label}>Outline</label>
                <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)}
                  style={{ width: 36, height: 32, borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-light)', padding: 2 }} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={download} style={{ flex: 1, padding: '11px', background: '#eab308', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              ⬇️ Download PNG
            </button>
            <button onClick={copyMeme} style={{ padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
              📋 Copy
            </button>
          </div>
        </div>

        {/* Canvas preview */}
        <div>
          <div style={S.label}>Live Preview</div>
          <div style={{ border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: 440, objectFit: 'contain', display: 'block' }} />
          </div>
          <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Changes update in real-time • Download is full resolution PNG</p>
        </div>
      </div>
    </div>
  );
}
