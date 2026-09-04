'use client';
// ═══════════════════════════════════════════════════════
// TextBlock.jsx v2 — Ghost overlay, robust save
//
// NEW in v2:
//  • Text alignment (left / center / right / justify)
//  • Line-height control (stored on block)
//  • Background color picker (block.bgColorCustom)
//  • Multi-line auto-grow height
//  • Mini floating toolbar when selected (align, bg)
//  • Comment/sticky-note badge on blocks that have a note
// ═══════════════════════════════════════════════════════
import { useRef, useCallback, useEffect, useState } from 'react';

export default function TextBlock({
  block, isSelected, zoom,
  onSelect, onUpdate, onUpdateText, onDelete,
}) {
  const containerRef = useRef(null);
  const elRef        = useRef(null);
  const isFocused    = useRef(false);
  const [hovered, setHovered] = useState(false);

  const onUpdateRef     = useRef(onUpdate);
  const onUpdateTextRef = useRef(onUpdateText);
  useEffect(() => { onUpdateRef.current     = onUpdate;     }, [onUpdate]);
  useEffect(() => { onUpdateTextRef.current = onUpdateText; }, [onUpdateText]);

  const s = v => v * zoom;

  // ── Mount: set DOM text ───────────────────────────────
  useEffect(() => {
    if (elRef.current) elRef.current.textContent = block.text;
  }, []); // eslint-disable-line

  // ── Sync text FROM state → DOM only when NOT focused ──
  useEffect(() => {
    if (!isFocused.current && elRef.current) {
      if (elRef.current.textContent !== block.text) {
        elRef.current.textContent = block.text;
      }
    }
  }, [block.text]);

  // ── Auto-focus on select ──────────────────────────────
  useEffect(() => {
    if (!isSelected) return;
    const t = setTimeout(() => {
      const el = elRef.current;
      if (!el || isFocused.current) return;
      el.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}
    }, 20);
    return () => clearTimeout(t);
  }, [isSelected]);

  // ── Drag to move ──────────────────────────────────────
  const onMouseDownBlock = useCallback((e) => {
    if (e.target.classList.contains('tb-resize') || e.target.classList.contains('tb-ctrl')) return;
    e.stopPropagation();
    onSelect(block.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = block.x, oy = block.y;
    const onMove = me => {
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

  // ── Resize ────────────────────────────────────────────
  const onResizeDown = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const ow = block.width, oh = block.height;
    const onMove = me => {
      onUpdateRef.current({
        width:  Math.max(40, ow + (me.clientX - startX) / zoom),
        height: Math.max(16, oh + (me.clientY - startY) / zoom),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [block.width, block.height, zoom]);

  // ── Keyboard delete ───────────────────────────────────
  useEffect(() => {
    if (!isSelected) return;
    const h = e => {
      if (e.key === 'Delete' && !isFocused.current) onDelete();
      if (e.key === 'Escape' && isFocused.current) elRef.current?.blur();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isSelected, onDelete]);

  // ── contentEditable events ────────────────────────────
  const onFocus = useCallback(() => {
    isFocused.current = true;
    onSelect(block.id);
  }, [block.id, onSelect]);

  const onBlur = useCallback(() => {
    isFocused.current = false;
    const el = elRef.current;
    if (!el) return;
    const newText = el.innerText || el.textContent;
    if (newText !== block.text) {
      onUpdateRef.current({ text: newText, isEdited: true });
    }
  }, [block.text]);

  // ── Auto-grow height on input ─────────────────────────
  const onInputHandler = useCallback(() => {
    const el = elRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    // Measure natural scroll height, update block height
    const natural = el.scrollHeight;
    if (natural > 0 && natural / zoom > block.height + 4) {
      onUpdateRef.current({ height: natural / zoom + 4 });
    }
  }, [zoom, block.height]);

  // ── Alignment shortcut ────────────────────────────────
  const cycleAlign = useCallback((e) => {
    e.stopPropagation();
    const order = ['left', 'center', 'right', 'justify'];
    const cur = block.align || 'left';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    onUpdateRef.current({ align: next });
  }, [block.align]);

  const isEditing = isSelected;
  const isEdited  = block.isEdited === true;
  const align     = block.align || 'left';
  const lh        = block.lineHeight || 1.3;
  const hasNote   = !!block.note;

  // Effective background
  const effectiveBg = block.bgColorCustom || block.bgColor || '#ffffff';

  const ALIGN_ICONS = { left: '⬱', center: '☰', right: '⬲', justify: '▤' };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDownBlock}
      onClick={e => { e.stopPropagation(); onSelect(block.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!isEditing ? `Click to edit: "${block.text.slice(0, 60)}${block.text.length > 60 ? '…' : ''}"` : undefined}
      style={{
        position:  'absolute',
        left:      s(block.x),
        top:       s(block.y),
        width:     s(block.width),
        minHeight: s(block.height),
        boxSizing: 'border-box',
        borderRadius: 3,
        zIndex:  isEditing ? 12 : hovered ? 8 : 4,
        cursor:  isEditing ? 'text' : 'pointer',
        userSelect: 'none',
        background: isEditing
          ? effectiveBg
          : isEdited
            ? effectiveBg
            : hovered
              ? 'rgba(0,112,243,0.04)'
              : 'transparent',
        border: isEditing
          ? '2px solid #0070F3'
          : hovered
            ? '1.5px dashed rgba(0,112,243,0.55)'
            : '1px dashed transparent',
        boxShadow:  isEditing ? '0 2px 14px rgba(0,112,243,0.18)' : 'none',
        transition: 'background 0.1s, border-color 0.1s, box-shadow 0.1s',
        padding:    isEditing ? '3px 5px' : '1px 2px',
      }}
    >
      {/* ── Mini floating toolbar (visible when selected) ── */}
      {isEditing && (
        <div
          className="tb-ctrl"
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -34,
            left: 0,
            display: 'flex',
            gap: 3,
            background: '#1e293b',
            borderRadius: 6,
            padding: '3px 6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 30,
            whiteSpace: 'nowrap',
            alignItems: 'center',
          }}
        >
          {/* Alignment cycle */}
          <button
            className="tb-ctrl"
            onClick={cycleAlign}
            title={`Alignment: ${align}`}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#fff', cursor: 'pointer', borderRadius: 4,
              padding: '2px 6px', fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            {ALIGN_ICONS[align]}
          </button>

          {/* BG color */}
          <label
            className="tb-ctrl"
            title="Background color"
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
          >
            <input
              type="color"
              defaultValue={effectiveBg}
              onChange={e => onUpdateRef.current({ bgColorCustom: e.target.value, isEdited: true })}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                width: 14, height: 14, borderRadius: 3,
                background: effectiveBg,
                border: '1.5px solid rgba(255,255,255,0.5)',
                display: 'inline-block',
              }}
            />
          </label>

          {/* Line-height */}
          <select
            className="tb-ctrl"
            value={lh}
            onChange={e => onUpdateRef.current({ lineHeight: +e.target.value })}
            style={{
              fontSize: '0.72rem', padding: '1px 2px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {[1, 1.15, 1.3, 1.5, 1.75, 2].map(v => (
              <option key={v} value={v}>{v}×</option>
            ))}
          </select>

          {/* Clear bg */}
          <button
            className="tb-ctrl"
            onClick={() => onUpdateRef.current({ bgColorCustom: null })}
            title="Clear background"
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#aaa', cursor: 'pointer', borderRadius: 4,
              padding: '2px 5px', fontSize: '0.7rem',
            }}
          >✕bg</button>
        </div>
      )}

      {/* ── contentEditable ── */}
      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        onFocus={onFocus}
        onBlur={onBlur}
        onInput={onInputHandler}
        onKeyDown={e => e.stopPropagation()}
        style={{
          fontSize:       s(block.fontSize || 12),
          fontFamily:     block.fontFamily  || 'sans-serif',
          fontWeight:     block.bold        ? 'bold'      : 'normal',
          fontStyle:      block.italic      ? 'italic'    : 'normal',
          textDecoration: block.underline   ? 'underline' : 'none',
          textAlign:      align,
          lineHeight:     lh,
          whiteSpace:     'pre-wrap',
          wordBreak:      'break-word',
          outline:        'none',
          minWidth:       4,
          cursor:         'text',
          userSelect:     'text',
          color:          isEditing || isEdited ? (block.color || '#000000') : 'transparent',
          caretColor:     block.color || '#000000',
        }}
      />

      {/* ── Controls when selected ── */}
      {isEditing && (
        <>
          <div
            className="tb-resize"
            onMouseDown={onResizeDown}
            style={{
              position: 'absolute', bottom: -5, right: -5,
              width: 11, height: 11,
              background: '#0070F3', borderRadius: '50%',
              cursor: 'nwse-resize', zIndex: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
          <button
            className="tb-ctrl"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 18, height: 18,
              borderRadius: '50%', background: '#ef4444', color: '#fff',
              border: '1.5px solid #fff', cursor: 'pointer', fontSize: 11,
              fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 20, padding: 0, lineHeight: 1,
            }}
            title="Delete block"
          >×</button>
          {/* Editing label */}
          <div style={{
            position: 'absolute', top: -20, left: 0,
            background: '#0070F3', color: '#fff',
            fontSize: '0.58rem', fontWeight: 700,
            padding: '1px 6px', borderRadius: '3px 3px 0 0',
            whiteSpace: 'nowrap', pointerEvents: 'none', lineHeight: 1.6,
          }}>✏️ Editing</div>
        </>
      )}

      {/* ── Hover badge ── */}
      {hovered && !isEditing && (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          background: 'rgba(0,112,243,0.8)', color: '#fff',
          fontSize: '0.58rem', padding: '1px 4px',
          borderRadius: '0 3px 0 3px', pointerEvents: 'none', lineHeight: 1.6,
        }}>✏️</div>
      )}

      {/* ── Sticky note badge ── */}
      {hasNote && !isEditing && (
        <div
          title={block.note}
          style={{
            position: 'absolute', top: -8, left: -8,
            width: 16, height: 16, borderRadius: '50%',
            background: '#f59e0b', color: '#fff',
            fontSize: '0.6rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 15,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >💬</div>
      )}
    </div>
  );
}
