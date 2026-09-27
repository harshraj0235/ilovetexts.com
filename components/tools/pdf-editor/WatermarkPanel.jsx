'use client';
// ═══════════════════════════════════════════════════════
// WatermarkPanel.jsx — Add text or image watermark to
// all pages: opacity, rotation, position, font size.
// ═══════════════════════════════════════════════════════
import { useState } from 'react';

const POSITIONS = [
  { id: 'center',        label: 'Center' },
  { id: 'top-left',      label: 'Top Left' },
  { id: 'top-center',    label: 'Top Center' },
  { id: 'top-right',     label: 'Top Right' },
  { id: 'bottom-left',   label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right',  label: 'Bottom Right' },
  { id: 'diagonal',      label: 'Diagonal (Full)' },
];

export default function WatermarkPanel({ watermark, onChange, onClose }) {
  const [type, setType]     = useState(watermark?.type || 'text');
  const [text, setText]     = useState(watermark?.text || 'CONFIDENTIAL');
  const [color, setColor]   = useState(watermark?.color || '#ff0000');
  const [opacity, setOpacity]   = useState(watermark?.opacity ?? 0.25);
  const [fontSize, setFontSize] = useState(watermark?.fontSize || 64);
  const [rotation, setRotation] = useState(watermark?.rotation ?? -35);
  const [position, setPosition] = useState(watermark?.position || 'center');
  const [bold, setBold]     = useState(watermark?.bold ?? false);

  const apply = () => {
    onChange({ type, text, color, opacity, fontSize, rotation, position, bold, enabled: true });
    onClose();
  };

  const remove = () => {
    onChange({ enabled: false });
    onClose();
  };

  const label = (l) => (
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{l}</span>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)', padding: 28, width: 440, maxWidth: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>🔖 Watermark</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-secondary)' }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['text'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '6px 16px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${type === t ? '#0070F3' : 'var(--border-light)'}`,
              background: type === t ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
              color: type === t ? '#0070F3' : 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}>Text Watermark</button>
          ))}
        </div>

        {/* Watermark text */}
        <div style={{ marginBottom: 14 }}>
          {label('Watermark Text')}
          <input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL, DRAFT…"
            style={{ width:'100%', padding:'8px 12px', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
        </div>

        {/* Color + Bold row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            {label('Color')}
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width:'100%', height:36, cursor:'pointer', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)' }} />
          </div>
          <div style={{ flex: 1 }}>
            {label('Font Size')}
            <input type="number" value={fontSize} min={12} max={200} onChange={e => setFontSize(+e.target.value)}
              style={{ width:'100%', padding:'7px 10px', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
          </div>
          <div>
            {label('Bold')}
            <button onClick={() => setBold(b => !b)} style={{
              padding:'7px 14px', borderRadius:'var(--radius-sm)',
              border:`1px solid ${bold ? '#0070F3' : 'var(--border-light)'}`,
              background: bold ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
              color: bold ? '#0070F3' : 'var(--text-primary)', fontWeight:700, cursor:'pointer',
            }}>B</button>
          </div>
        </div>

        {/* Opacity */}
        <div style={{ marginBottom: 14 }}>
          {label(`Opacity: ${Math.round(opacity * 100)}%`)}
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={e => setOpacity(+e.target.value)}
            style={{ width:'100%' }} />
        </div>

        {/* Rotation */}
        <div style={{ marginBottom: 14 }}>
          {label(`Rotation: ${rotation}°`)}
          <input type="range" min={-90} max={90} step={5} value={rotation} onChange={e => setRotation(+e.target.value)}
            style={{ width:'100%' }} />
        </div>

        {/* Position */}
        <div style={{ marginBottom: 20 }}>
          {label('Position')}
          <select value={position} onChange={e => setPosition(e.target.value)}
            style={{ width:'100%', padding:'7px 10px', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'0.88rem' }}>
            {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        {/* Preview */}
        <div style={{
          border:'1px solid var(--border-light)', borderRadius:8, height:80,
          background:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden', position:'relative', marginBottom:18,
        }}>
          <span style={{
            fontSize: Math.min(fontSize * 0.3, 32),
            color, opacity, fontWeight: bold ? 700 : 400,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>{text || 'WATERMARK'}</span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={remove} style={{ padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.08)', color:'#ef4444', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
            Remove
          </button>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.85rem' }}>
            Cancel
          </button>
          <button onClick={apply} style={{ padding:'8px 22px', borderRadius:'var(--radius-sm)', background:'#0070F3', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:700 }}>
            Apply to All Pages
          </button>
        </div>
      </div>
    </div>
  );
}
