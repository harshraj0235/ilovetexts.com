'use client';
// ═══════════════════════════════════════════════════════
// LinkInserter.jsx — Draw a rectangle on the page to
// define a clickable link region with a URL.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

export function LinkOverlay({ link, zoom, isSelected, onSelect, onUpdate, onDelete }) {
  const s = (v) => v * zoom;
  const onMouseDown = useCallback((e) => {
    e.stopPropagation();
    onSelect(link.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = link.x, oy = link.y;
    const onMove = (me) => { onUpdate({ x: Math.max(0, ox + (me.clientX - startX) / zoom), y: Math.max(0, oy + (me.clientY - startY) / zoom) }); };
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [link, zoom, onSelect, onUpdate]);

  return (
    <div onMouseDown={onMouseDown} style={{
      position:'absolute', left:s(link.x), top:s(link.y), width:s(link.w), height:s(link.h),
      cursor:'move', zIndex:9,
      border:`2px dashed ${isSelected ? '#0070F3' : '#22c55e'}`,
      background:'rgba(34,197,94,0.08)',
      borderRadius:3,
    }}>
      <span style={{ fontSize:'0.6rem', background:'#22c55e', color:'#fff', padding:'1px 5px', borderRadius:3, pointerEvents:'none' }}>
        🔗 {link.url?.slice(0, 22)}{(link.url?.length || 0) > 22 ? '…' : ''}
      </span>
      {isSelected && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
          style={{ position:'absolute', top:-10, right:-10, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:10, padding:0, zIndex:20 }}>
          ×
        </button>
      )}
    </div>
  );
}

export default function LinkInserter({ onClose, onInsert }) {
  const [url, setUrl]   = useState('https://');
  const [label, setLabel] = useState('');

  const handleInsert = () => {
    if (!url.trim()) return;
    onInsert({ id: `link-${Date.now()}`, type: 'link', url: url.trim(), label, x: 60, y: 60, w: 160, h: 24 });
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-main)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-float)', padding:28, width:400, maxWidth:'100%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ fontWeight:700, fontSize:'1.05rem', margin:0 }}>🔗 Insert Link</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-secondary)' }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}>
          <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>URL</span>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
            style={{ width:'100%', padding:'8px 12px', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
        </div>
        <div style={{ marginBottom:18 }}>
          <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Display Label (optional)</span>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Click here…"
            style={{ width:'100%', padding:'8px 12px', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'0.9rem' }} />
        </div>
        <p style={{ fontSize:'0.78rem', color:'var(--text-tertiary)', marginBottom:16 }}>
          After inserting, drag the green region on the page to position the link.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.88rem' }}>Cancel</button>
          <button onClick={handleInsert} style={{ padding:'8px 22px', borderRadius:'var(--radius-sm)', background:'#0070F3', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:700 }}>Insert</button>
        </div>
      </div>
    </div>
  );
}
