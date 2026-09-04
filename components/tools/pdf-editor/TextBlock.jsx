'use client';
// ═══════════════════════════════════════════════════════
// TextBlock.jsx — Ghost overlay, robust save
//
// ARCHITECTURE (simple & reliable):
//
//   • The contentEditable div is the ONLY source of truth
//     while the user is typing. We do NOT touch React state
//     on every keystroke — that causes the revert bug.
//
//   • On BLUR (click away): read el.textContent → call
//     onUpdate({text}) → saved to state with undo entry.
//
//   • On SAVE CHANGES button: useSaveChanges reads all
//     [data-block-id] elements directly from DOM → commits.
//
//   • Visual: text is color:transparent (invisible) when
//     not selected, so the PDF image shows clean.
//     When selected: white background + visible text.
//
//   • We NEVER call setTextContent while focused.
//     We NEVER re-render the contentEditable from state
//     while focused (isFocusedRef guards this).
// ═══════════════════════════════════════════════════════
import { useRef, useCallback, useEffect, useState } from 'react';

export default function TextBlock({
  block, isSelected, zoom,
  onSelect, onUpdate, onUpdateText, onDelete,
}) {
  const containerRef = useRef(null);
  const elRef        = useRef(null);   // the contentEditable div
  const isFocused    = useRef(false);  // true while user is typing
  const [hovered, setHovered] = useState(false);

  // Always-fresh ref to callbacks — zero stale closure risk
  const onUpdateRef     = useRef(onUpdate);
  const onUpdateTextRef = useRef(onUpdateText);
  useEffect(() => { onUpdateRef.current     = onUpdate;     }, [onUpdate]);
  useEffect(() => { onUpdateTextRef.current = onUpdateText; }, [onUpdateText]);

  const s = v => v * zoom;

  // ── Set initial DOM text on mount ─────────────────────
  useEffect(() => {
    if (elRef.current) elRef.current.textContent = block.text;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync text FROM state → DOM only when NOT focused ──
  // e.g. after Find & Replace, undo/redo, Save Changes
  useEffect(() => {
    if (!isFocused.current && elRef.current) {
      if (elRef.current.textContent !== block.text) {
        elRef.current.textContent = block.text;
      }
    }
  }, [block.text]);

  // ── Auto-focus + cursor-to-end when block is selected ─
  useEffect(() => {
    if (!isSelected) return;
    const t = setTimeout(() => {
      const el = elRef.current;
      if (!el || isFocused.current) return;
      el.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // cursor at end
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) { /* ignore */ }
    }, 20);
    return () => clearTimeout(t);
  }, [isSelected]);

  // ── Drag to move ──────────────────────────────────────
  const onMouseDownBlock = useCallback((e) => {
    if (e.target.classList.contains('tb-resize')) return;
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
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isSelected, onDelete]);

  // ── contentEditable events ────────────────────────────
  const onFocus = useCallback(() => {
    isFocused.current = true;
    onSelect(block.id);
  }, [block.id, onSelect]);

  // onBlur: THE authoritative save — reads live DOM text
  const onBlur = useCallback(() => {
    isFocused.current = false;
    const el = elRef.current;
    if (!el) return;
    const newText = el.innerText || el.textContent;
    // Only commit if text actually changed
    if (newText !== block.text) {
      onUpdateRef.current({ text: newText, isEdited: true });
    }
  }, [block.text]); // block.text dep is intentional — compare against last known

  // onInput: SILENT live update so other components can
  // read current text (e.g. word count) without history spam.
  // Does NOT update state — DOM is source of truth while typing.
  const onInputHandler = useCallback((e) => {
    // Optional: notify parent silently (no undo entry)
    // onUpdateTextRef.current(e.currentTarget.textContent);
    // Disabled: keeping DOM-only during typing is most reliable.
    // The Save Changes button + onBlur handle persistence.
  }, []);

  // ── Styles ────────────────────────────────────────────
  const isEditing = isSelected;
  const isEdited = block.isEdited === true;

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDownBlock}
      onClick={e => { e.stopPropagation(); onSelect(block.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!isEditing
        ? `Click to edit: "${block.text.slice(0, 50)}${block.text.length > 50 ? '…' : ''}"`
        : undefined}
      style={{
        position: 'absolute',
        left:     s(block.x),
        top:      s(block.y),
        width:    s(block.width),
        minHeight: s(block.height),
        boxSizing: 'border-box',
        borderRadius: 3,
        zIndex: isEditing ? 12 : hovered ? 8 : 4,
        cursor: isEditing ? 'text' : 'pointer',
        userSelect: 'none',
        background: isEditing
          ? (block.bgColor || 'rgba(255,255,255,0.97)')  // use sampled bg or white covers original PDF text
          : isEdited
            ? (block.bgColor || '#ffffff')               // solid sampled color to hide original canvas text
            : hovered
              ? 'rgba(0,112,243,0.04)'
              : 'transparent',          // invisible: PDF shows clean
        border: isEditing
          ? '2px solid #0070F3'
          : hovered
            ? '1.5px dashed rgba(0,112,243,0.55)'
            : '1px dashed transparent',
        boxShadow: isEditing ? '0 2px 14px rgba(0,112,243,0.18)' : 'none',
        transition: 'background 0.1s, border-color 0.1s, box-shadow 0.1s',
        padding: isEditing ? '3px 5px' : '1px 2px',
      }}
    >
      {/* contentEditable — always mounted, never toggled */}
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
          fontFamily:     block.fontFamily || 'sans-serif',
          fontWeight:     block.bold      ? 'bold'      : 'normal',
          fontStyle:      block.italic    ? 'italic'    : 'normal',
          textDecoration: block.underline ? 'underline' : 'none',
          lineHeight:     1.3,
          whiteSpace:     'pre-wrap',
          wordBreak:      'break-word',
          outline:        'none',
          minWidth:       4,
          cursor:         'text',
          userSelect:     'text',
          // GHOST: transparent when not editing — PDF clean underneath
          // BUT if edited, it must be visible so user can see changes!
          color:      isEditing || isEdited ? (block.color || '#000000') : 'transparent',
          caretColor: block.color || '#000000',
        }}
      />

      {/* Controls shown only when selected */}
      {isEditing && (
        <>
          <div className="tb-resize" onMouseDown={onResizeDown} style={{
            position:'absolute', bottom:-5, right:-5,
            width:11, height:11, background:'#0070F3', borderRadius:'50%',
            cursor:'nwse-resize', zIndex:20, boxShadow:'0 1px 3px rgba(0,0,0,0.25)',
          }} />
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              position:'absolute', top:-10, right:-10, width:18, height:18,
              borderRadius:'50%', background:'#ef4444', color:'#fff',
              border:'1.5px solid #fff', cursor:'pointer', fontSize:12,
              fontWeight:700, display:'flex', alignItems:'center',
              justifyContent:'center', zIndex:20, padding:0, lineHeight:1,
            }}
            title="Delete"
          >×</button>
          <div style={{
            position:'absolute', top:-20, left:0,
            background:'#0070F3', color:'#fff',
            fontSize:'0.58rem', fontWeight:700,
            padding:'1px 6px', borderRadius:'3px 3px 0 0',
            whiteSpace:'nowrap', pointerEvents:'none', lineHeight:1.6,
          }}>✏️ Editing</div>
        </>
      )}

      {hovered && !isEditing && (
        <div style={{
          position:'absolute', top:-1, right:-1,
          background:'rgba(0,112,243,0.8)', color:'#fff',
          fontSize:'0.58rem', padding:'1px 4px',
          borderRadius:'0 3px 0 3px', pointerEvents:'none', lineHeight:1.6,
        }}>✏️</div>
      )}
    </div>
  );
}
