'use client';
// ═══════════════════════════════════════════════════════
// ImageInserter.jsx — Draggable/resizable image overlay
// on the PDF page. User uploads an image, it appears
// as a positioned overlay that can be moved/resized.
// ═══════════════════════════════════════════════════════
import { useRef, useCallback } from 'react';

export function ImageOverlay({ overlay, zoom, isSelected, onSelect, onUpdate, onDelete }) {
  const s = (v) => v * zoom;

  const onMouseDown = useCallback((e) => {
    if (e.target.classList.contains('io-resize')) return;
    e.stopPropagation();
    onSelect(overlay.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = overlay.x, oy = overlay.y;
    const onMove = (me) => {
      onUpdate({ x: Math.max(0, ox + (me.clientX - startX) / zoom), y: Math.max(0, oy + (me.clientY - startY) / zoom) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [overlay, zoom, onSelect, onUpdate]);

  const onResizeDown = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const ow = overlay.width, oh = overlay.height;
    const onMove = (me) => {
      onUpdate({ width: Math.max(20, ow + (me.clientX - startX) / zoom), height: Math.max(20, oh + (me.clientY - startY) / zoom) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [overlay, zoom, onUpdate]);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: s(overlay.x), top: s(overlay.y),
        width: s(overlay.width), height: s(overlay.height),
        cursor: 'move',
        outline: isSelected ? '2px solid #0070F3' : '1px dashed transparent',
        outlineOffset: 2,
        zIndex: isSelected ? 12 : 8,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={overlay.dataUrl}
        alt="inserted"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
      />
      {isSelected && (
        <>
          <div className="io-resize" onMouseDown={onResizeDown}
            style={{ position:'absolute', bottom:-5, right:-5, width:11, height:11, background:'#0070F3', borderRadius:'50%', cursor:'nwse-resize', zIndex:20 }} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(overlay.id); }}
            style={{ position:'absolute', top:-10, right:-10, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', zIndex:20, padding:0 }}>
            ×
          </button>
        </>
      )}
    </div>
  );
}

export function ImagePickerButton({ onImageReady }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageReady({
          id: `img-${Date.now()}`,
          type: 'image',
          dataUrl: e.target.result,
          x: 40, y: 40,
          width: Math.min(img.naturalWidth, 200),
          height: Math.min(img.naturalHeight, 200),
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value=''; }} />
      <button
        onClick={() => inputRef.current?.click()}
        title="Insert image into PDF"
        style={{
          padding:'5px 10px', borderRadius:'var(--radius-sm)',
          border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
          color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
          display:'flex', alignItems:'center', gap:4,
        }}
      >
        🖼️ Image
      </button>
    </>
  );
}
