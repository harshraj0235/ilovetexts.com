'use client';
// ═══════════════════════════════════════════════════════
// SignaturePad.jsx — Draw or type a signature, then
// place it on the page as a draggable/resizable overlay.
// ═══════════════════════════════════════════════════════
import { useRef, useEffect, useState, useCallback } from 'react';

const TYPED_FONTS = [
  { label: 'Cursive',    style: 'italic 32px Georgia, serif' },
  { label: 'Print',      style: '32px Arial, sans-serif' },
  { label: 'Monospace',  style: '28px Courier New, monospace' },
];

function TypedSig({ text, fontIdx, color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font      = TYPED_FONTS[fontIdx].style;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text || 'Signature');
    c.width  = Math.max(metrics.width + 20, 100);
    c.height = 50;
    ctx.font      = TYPED_FONTS[fontIdx].style;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text || 'Signature', 10, 25);
  }, [text, fontIdx, color]);
  return <canvas ref={canvasRef} height={50} style={{ maxWidth: '100%' }} />;
}

export default function SignaturePad({ onInsert, onClose }) {
  const [mode, setMode]       = useState('draw'); // 'draw' | 'type'
  const [typedText, setTyped] = useState('');
  const [fontIdx, setFontIdx] = useState(0);
  const [color, setColor]     = useState('#000000');
  const [lineW, setLineW]     = useState(2);
  const drawCanvasRef = useRef(null);
  const drawing       = useRef(false);
  const lastPos       = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onDown = (e) => {
    drawing.current = true;
    lastPos.current = getPos(e, drawCanvasRef.current);
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineW;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };
  const onUp   = () => { drawing.current = false; };

  const clearDraw = () => {
    const canvas = drawCanvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsert = useCallback(() => {
    if (mode === 'draw') {
      const canvas = drawCanvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      onInsert({ type: 'signature', dataUrl, width: canvas.width / 2, height: canvas.height / 2 });
    } else {
      // Render typed sig to canvas
      const c   = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font  = TYPED_FONTS[fontIdx].style;
      const metrics = ctx.measureText(typedText || 'Signature');
      c.width   = metrics.width + 20;
      c.height  = 50;
      ctx.font  = TYPED_FONTS[fontIdx].style;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText || 'Signature', 10, 25);
      onInsert({ type: 'signature', dataUrl: c.toDataURL('image/png'), width: c.width / 1.5, height: 36 });
    }
  }, [mode, fontIdx, typedText, color, onInsert]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)', padding: 28, width: 480, maxWidth: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>✍️ Add Signature</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-secondary)' }}>×</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['draw','type'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 18px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${mode === m ? '#0070F3' : 'var(--border-light)'}`,
              background: mode === m ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
              color: mode === m ? '#0070F3' : 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}>{m === 'draw' ? '✏️ Draw' : '⌨️ Type'}</button>
          ))}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
            Color:
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 30, height: 28, cursor: 'pointer', border:'none', background:'none' }} />
          </label>
          {mode === 'draw' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
              Width:
              <input type="range" min={1} max={6} value={lineW} onChange={e => setLineW(+e.target.value)}
                style={{ width: 80 }} />
            </label>
          )}
          {mode === 'type' && (
            <select value={fontIdx} onChange={e => setFontIdx(+e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', fontSize: '0.82rem' }}>
              {TYPED_FONTS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
            </select>
          )}
        </div>

        {/* Draw canvas */}
        {mode === 'draw' && (
          <div style={{ position: 'relative' }}>
            <canvas
              ref={drawCanvasRef}
              width={420} height={160}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
              style={{
                border: '1px solid var(--border-light)', borderRadius: 8,
                cursor: 'crosshair', display: 'block', width: '100%',
                background: '#fafafa', touchAction: 'none',
              }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '4px 0 0', textAlign: 'center' }}>
              Sign above
            </p>
            <button onClick={clearDraw} style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
              padding: '3px 9px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
            }}>Clear</button>
          </div>
        )}

        {/* Type preview */}
        {mode === 'type' && (
          <div>
            <input
              value={typedText}
              onChange={e => setTyped(e.target.value)}
              placeholder="Type your name…"
              style={{
                width: '100%', padding: '10px 12px', marginBottom: 12,
                border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem',
              }}
            />
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, background: '#fafafa', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TypedSig text={typedText} fontIdx={fontIdx} color={color} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>
            Cancel
          </button>
          <button onClick={handleInsert} style={{
            padding: '8px 22px', borderRadius: 'var(--radius-sm)',
            background: '#0070F3', color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: '0.88rem', fontWeight: 700,
          }}>
            Insert Signature
          </button>
        </div>
      </div>
    </div>
  );
}
