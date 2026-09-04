'use client';
// ═══════════════════════════════════════════════════════
// RedactPanel.jsx — Draw black/white redaction boxes.
// Permanently hides text in export (canvas-baked).
// ═══════════════════════════════════════════════════════
import { useCallback } from 'react';

export function RedactOverlay({ redact, zoom, isSelected, onSelect, onUpdate, onDelete }) {
  const s = (v) => v * zoom;
  const onMouseDown = useCallback((e) => {
    e.stopPropagation();
    onSelect(redact.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = redact.x, oy = redact.y;
    const onMove = (me) => {
      onUpdate({ x: Math.max(0, ox + (me.clientX - startX) / zoom), y: Math.max(0, oy + (me.clientY - startY) / zoom) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [redact, zoom, onSelect, onUpdate]);

  const onResizeDown = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const ow = redact.w, oh = redact.h;
    const onMove = (me) => {
      onUpdate({ w: Math.max(10, ow + (me.clientX - startX) / zoom), h: Math.max(8, oh + (me.clientY - startY) / zoom) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [redact, zoom, onUpdate]);

  return (
    <div onMouseDown={onMouseDown} style={{
      position:'absolute', left:s(redact.x), top:s(redact.y), width:s(redact.w), height:s(redact.h),
      background: redact.color || '#000000',
      cursor:'move', zIndex:11,
      outline: isSelected ? '2px solid #ef4444' : 'none',
      outlineOffset:2,
    }}>
      {isSelected && (
        <>
          <div onMouseDown={onResizeDown} style={{ position:'absolute', bottom:-5, right:-5, width:10, height:10, background:'#ef4444', borderRadius:'50%', cursor:'nwse-resize', zIndex:20 }} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(redact.id); }}
            style={{ position:'absolute', top:-10, right:-10, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:10, padding:0, zIndex:20 }}>
            ×
          </button>
        </>
      )}
    </div>
  );
}

export function RedactToolbar({ redactColor, onColorChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'rgba(239,68,68,0.06)', borderBottom:'1px solid rgba(239,68,68,0.2)', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
      <span style={{ color:'#ef4444', fontWeight:700 }}>⬛ Redact Mode</span>
      <span>— click and drag on the page to cover sensitive content</span>
      <label style={{ display:'flex', alignItems:'center', gap:4, marginLeft:'auto' }}>
        Color:
        <input type="color" value={redactColor} onChange={e => onColorChange(e.target.value)}
          style={{ width:28, height:24, cursor:'pointer', border:'none', background:'none' }} />
      </label>
    </div>
  );
}
