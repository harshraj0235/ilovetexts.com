'use client';
// ═══════════════════════════════════════════════════════
// ImageTextBlock.jsx — Draggable text overlay (image editor)
// Same cursor/save fixes as TextBlock.jsx:
//   - contentEditable always true (no prop toggle mid-edit)
//   - DOM content only synced when NOT focused
//   - onBlur does final authoritative save
//   - onUpdateRef prevents stale closure bugs
// ═══════════════════════════════════════════════════════
import { useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';

export default function ImageTextBlock({ block, isSelected, zoom, onSelect, onUpdate, onDelete }) {
  const contentRef   = useRef(null);
  const [hovered, setHovered] = useState(false);

  const isFocusedRef = useRef(false);
  const onUpdateRef  = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const s = (v) => v * zoom;

  // Set initial content on mount only
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el && el.textContent !== block.text) {
      el.textContent = block.text;
    }
  }, []); // eslint-disable-line

  // Sync external changes only when not focused
  useEffect(() => {
    const el = contentRef.current;
    if (!el || isFocusedRef.current) return;
    if (el.textContent !== block.text) {
      el.textContent = block.text;
    }
  }, [block.text]);

  // Auto-focus when selected
  useEffect(() => {
    if (isSelected && contentRef.current && !isFocusedRef.current) {
      const t = setTimeout(() => {
        const el = contentRef.current;
        if (!el) return;
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }, 10);
      return () => clearTimeout(t);
    }
  }, [isSelected]);

  // Drag
  const onMouseDown = useCallback((e) => {
    if (e.target.classList.contains('itb-resize')) return;
    e.stopPropagation();
    onSelect(block.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = block.x, oy = block.y;
    const onMove = (me) => {
      onUpdateRef.current({
        x: Math.max(0, ox + (me.clientX - startX) / zoom),
        y: Math.max(0, oy + (me.clientY - startY) / zoom),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [block.id, block.x, block.y, zoom, onSelect]);

  // Resize
  const onResizeDown = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const ow = block.width, oh = block.height;
    const onMove = (me) => {
      onUpdateRef.current({
        width:  Math.max(24, ow + (me.clientX - startX) / zoom),
        height: Math.max(12, oh + (me.clientY - startY) / zoom),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [block.width, block.height, zoom]);

  // Delete key
  useEffect(() => {
    if (!isSelected) return;
    const h = (e) => {
      if (e.key === 'Delete' && !isFocusedRef.current) onDelete();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isSelected, onDelete]);

  const onInput  = useCallback((e) => { onUpdateRef.current({ text: e.currentTarget.textContent }); }, []);
  const onBlur   = useCallback((e) => { isFocusedRef.current = false; onUpdateRef.current({ text: e.currentTarget.textContent }); }, []);
  const onFocus  = useCallback(() => { isFocusedRef.current = true; onSelect(block.id); }, [block.id, onSelect]);

  const lowConf = block.confidence !== undefined && block.confidence < 60;

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: s(block.x), top: s(block.y),
        width: s(block.width), minHeight: s(block.height),
        cursor: 'move', userSelect: 'none',
        outline: isSelected
          ? '2px solid #0070F3'
          : hovered ? '1px dashed rgba(0,112,243,0.5)'
          : lowConf ? '1px dashed #f59e0b'
          : '1px dashed transparent',
        outlineOffset: '1px',
        background: isSelected
          ? 'rgba(255,255,255,0.95)'
          : hovered ? 'rgba(0,112,243,0.04)' : 'transparent',
        borderRadius: 2,
        zIndex: isSelected ? 10 : hovered ? 7 : 4,
        boxShadow: isSelected ? '0 2px 12px rgba(0,112,243,0.15)' : 'none',
        transition: 'outline 0.1s, background 0.1s',
        padding: isSelected ? '2px 4px' : '1px 2px',
      }}
    >
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          outline: 'none', cursor: 'text', userSelect: 'text',
          fontSize:       s(block.fontSize || 12),
          fontFamily:     block.fontFamily || 'sans-serif',
          color:          isSelected ? (block.color || '#000000') : 'transparent',
          caretColor:     block.color || '#000000',
          fontWeight:     block.bold      ? 'bold'      : 'normal',
          fontStyle:      block.italic    ? 'italic'    : 'normal',
          textDecoration: block.underline ? 'underline' : 'none',
          lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minWidth: 4,
        }}
      />

      {isSelected && (
        <>
          <div className="itb-resize" onMouseDown={onResizeDown} style={{
            position: 'absolute', bottom: -5, right: -5,
            width: 11, height: 11, background: '#0070F3', borderRadius: '50%',
            cursor: 'nwse-resize', zIndex: 20,
          }} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onMouseDown={e=>e.stopPropagation()}
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 18, height: 18, borderRadius: '50%',
              background: '#ef4444', color: '#fff', border: '1.5px solid #fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 20, padding: 0, lineHeight: 1,
            }}>×</button>
          {lowConf && (
            <div style={{
              position: 'absolute', top: -10, left: 0,
              background: '#f59e0b', color: '#fff',
              fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>{Math.round(block.confidence)}%</div>
          )}
        </>
      )}
    </div>
  );
}
