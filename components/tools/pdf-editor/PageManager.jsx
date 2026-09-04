'use client';
// ═══════════════════════════════════════════════════════
// PageManager.jsx — Reorder, rotate, delete PDF pages
// Drag-and-drop reordering with thumbnail previews.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

function PageThumb({ page, index, total, isSelected, onClick, onDelete, onRotate, onDragStart, onDragOver, onDrop, isDragOver }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      onClick={() => onClick(index)}
      style={{
        position: 'relative', cursor: 'pointer', userSelect: 'none',
        border: `2px solid ${isSelected ? '#0070F3' : isDragOver ? '#22c55e' : 'var(--border-light)'}`,
        borderRadius: 8, overflow: 'visible', background: 'var(--bg-main)',
        boxShadow: isSelected ? '0 0 0 3px rgba(0,112,243,0.2)' : isDragOver ? '0 0 0 3px rgba(34,197,94,0.2)' : 'var(--shadow-sm)',
        transition: 'all 0.15s',
      }}
    >
      {/* Page preview */}
      {page.thumbDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.thumbDataUrl} alt={`Page ${index + 1}`}
          style={{ display:'block', width:'100%', transform:`rotate(${page.rotation || 0}deg)`, transition:'transform 0.2s' }} />
      ) : (
        <div style={{ height:140, background:'var(--bg-tertiary)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-tertiary)', fontSize:'0.78rem' }}>
          Page {index + 1}
        </div>
      )}

      {/* Page number */}
      <div style={{ textAlign:'center', padding:'5px 0', fontSize:'0.74rem', color:'var(--text-secondary)', fontWeight: 600 }}>
        {index + 1} / {total}
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', justifyContent:'center', gap:4, padding:'0 4px 6px' }}>
        <button onClick={(e) => { e.stopPropagation(); onRotate(index, -90); }} title="Rotate left"
          style={{ fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:4, cursor:'pointer', padding:'3px 6px' }}>↺</button>
        <button onClick={(e) => { e.stopPropagation(); onRotate(index, 90); }} title="Rotate right"
          style={{ fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:4, cursor:'pointer', padding:'3px 6px' }}>↻</button>
        {total > 1 && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(index); }} title="Delete page"
            style={{ fontSize:13, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:4, cursor:'pointer', padding:'3px 6px', color:'#ef4444' }}>🗑</button>
        )}
      </div>

      {/* Drag handle */}
      <div style={{
        position:'absolute', top:4, left:4,
        background:'rgba(0,0,0,0.4)', color:'#fff', borderRadius:4,
        fontSize:'0.65rem', padding:'1px 5px', pointerEvents:'none',
      }}>⠿</div>
    </div>
  );
}

export default function PageManager({ pages, currentPage, onPagesChange, onClose }) {
  const [localPages, setLocalPages] = useState(() => pages.map((p, i) => ({ ...p, rotation: p.rotation || 0, _origIdx: i })));
  const [selected,  setSelected]    = useState(currentPage);
  const dragIdx = useRef(null);
  const [dragOver, setDragOver]     = useState(null);

  const onDragStart = (idx) => { dragIdx.current = idx; };
  const onDragOver  = (idx) => setDragOver(idx);
  const onDrop      = useCallback((idx) => {
    if (dragIdx.current === null || dragIdx.current === idx) { setDragOver(null); return; }
    const next = [...localPages];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    setLocalPages(next);
    setSelected(idx);
    setDragOver(null);
    dragIdx.current = null;
  }, [localPages]);

  const onRotate = useCallback((idx, deg) => {
    setLocalPages(prev => prev.map((p, i) => i === idx ? { ...p, rotation: ((p.rotation || 0) + deg + 360) % 360 } : p));
  }, []);

  const onDelete = useCallback((idx) => {
    setLocalPages(prev => prev.filter((_, i) => i !== idx));
    setSelected(s => Math.min(s, localPages.length - 2));
  }, [localPages.length]);

  const apply = () => {
    onPagesChange(localPages);
    onClose();
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{
        background:'var(--bg-main)', borderRadius:'var(--radius-lg)',
        boxShadow:'var(--shadow-float)', padding:28, width:780, maxWidth:'100%', maxHeight:'90vh',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:'1.05rem', margin:0 }}>📄 Manage Pages</h3>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{localPages.length} page{localPages.length !== 1 ? 's' : ''} · drag to reorder</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-secondary)' }}>×</button>
          </div>
        </div>

        {/* Page grid */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))',
          gap:14, overflowY:'auto', flex:1, padding:4,
        }}>
          {localPages.map((page, i) => (
            <PageThumb
              key={`${page._origIdx}-${i}`}
              page={page} index={i} total={localPages.length}
              isSelected={selected === i}
              isDragOver={dragOver === i}
              onClick={setSelected}
              onDelete={onDelete}
              onRotate={onRotate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.88rem' }}>Cancel</button>
          <button onClick={apply} style={{ padding:'9px 24px', borderRadius:'var(--radius-sm)', background:'#0070F3', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.9rem', fontWeight:700 }}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
