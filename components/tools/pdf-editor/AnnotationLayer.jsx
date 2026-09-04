'use client';
// ═══════════════════════════════════════════════════════
// AnnotationLayer.jsx v2
// Canvas overlay for: highlight, strikethrough, underline,
// freehand draw, shapes (rect/circle/line/arrow), eraser.
// NEW: sticky-note (comment) annotations rendered as icons.
// ═══════════════════════════════════════════════════════
import { useRef, useEffect, useCallback, useState } from 'react';

export const ANNOTATION_TOOLS = {
  HIGHLIGHT:     'highlight',
  STRIKETHROUGH: 'strikethrough',
  UNDERLINE:     'underline',
  FREEHAND:      'freehand',
  RECT:          'rect',
  CIRCLE:        'circle',
  LINE:          'line',
  ARROW:         'arrow',
  ERASER:        'eraser',
  STICKY:        'sticky',       // NEW: sticky note pin
  TEXT_ANN:      'text-ann',     // NEW: text annotation box
};

function drawArrow(ctx, x1, y1, x2, y2) {
  const headLen = 14;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function redrawAll(ctx, annotations, zoom) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const ann of annotations) {
    // Sticky notes and text annotations are rendered as DOM overlays, not canvas
    if (ann.tool === ANNOTATION_TOOLS.STICKY || ann.tool === ANNOTATION_TOOLS.TEXT_ANN) continue;

    ctx.save();
    ctx.strokeStyle = ann.color || '#f59e0b';
    ctx.fillStyle   = ann.color || '#f59e0b';
    ctx.lineWidth   = (ann.lineWidth || 2) * zoom;
    ctx.globalAlpha = ann.opacity ?? 1;

    const z = zoom;
    switch (ann.tool) {
      case ANNOTATION_TOOLS.HIGHLIGHT: {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = ann.color || '#fde047';
        ctx.fillRect(ann.x * z, ann.y * z, ann.w * z, ann.h * z);
        break;
      }
      case ANNOTATION_TOOLS.STRIKETHROUGH: {
        ctx.lineWidth = (ann.lineWidth || 2) * zoom;
        ctx.beginPath();
        ctx.moveTo(ann.x * z, (ann.y + ann.h / 2) * z);
        ctx.lineTo((ann.x + ann.w) * z, (ann.y + ann.h / 2) * z);
        ctx.stroke();
        break;
      }
      case ANNOTATION_TOOLS.UNDERLINE: {
        ctx.lineWidth = (ann.lineWidth || 2) * zoom;
        ctx.beginPath();
        ctx.moveTo(ann.x * z, (ann.y + ann.h) * z);
        ctx.lineTo((ann.x + ann.w) * z, (ann.y + ann.h) * z);
        ctx.stroke();
        break;
      }
      case ANNOTATION_TOOLS.FREEHAND: {
        if (!ann.points?.length) break;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x * z, ann.points[0].y * z);
        for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x * z, ann.points[i].y * z);
        ctx.stroke();
        break;
      }
      case ANNOTATION_TOOLS.RECT: {
        ctx.strokeRect(ann.x * z, ann.y * z, ann.w * z, ann.h * z);
        if (ann.fill) { ctx.globalAlpha = 0.15; ctx.fillRect(ann.x * z, ann.y * z, ann.w * z, ann.h * z); }
        break;
      }
      case ANNOTATION_TOOLS.CIRCLE: {
        ctx.beginPath();
        ctx.ellipse((ann.x + ann.w / 2) * z, (ann.y + ann.h / 2) * z, Math.abs(ann.w / 2) * z, Math.abs(ann.h / 2) * z, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (ann.fill) { ctx.globalAlpha = 0.15; ctx.fill(); }
        break;
      }
      case ANNOTATION_TOOLS.LINE: {
        ctx.beginPath();
        ctx.moveTo(ann.x * z, ann.y * z);
        ctx.lineTo((ann.x + ann.w) * z, (ann.y + ann.h) * z);
        ctx.stroke();
        break;
      }
      case ANNOTATION_TOOLS.ARROW: {
        drawArrow(ctx, ann.x * z, ann.y * z, (ann.x + ann.w) * z, (ann.y + ann.h) * z);
        break;
      }
      default: break;
    }
    ctx.restore();
  }
}

// ── Sticky Note DOM overlay ───────────────────────────
function StickyNoteOverlay({ ann, zoom, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ann.note || '');
  const [open, setOpen] = useState(false);

  const x = ann.x * zoom;
  const y = ann.y * zoom;

  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 15, pointerEvents: 'all' }}>
      {/* Pin icon */}
      <div
        onClick={() => setOpen(o => !o)}
        title="Sticky note — click to open"
        style={{
          width: 26, height: 26, borderRadius: '50% 50% 50% 0',
          background: ann.color || '#f59e0b',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transform: 'rotate(-45deg)',
          border: '2px solid rgba(255,255,255,0.7)',
        }}
      >
        <span style={{ transform: 'rotate(45deg)' }}>💬</span>
      </div>

      {/* Popup */}
      {open && (
        <div style={{
          position: 'absolute', top: 30, left: 0, zIndex: 20,
          background: ann.color || '#fef3c7',
          border: `1.5px solid ${ann.color || '#f59e0b'}`,
          borderRadius: 8, padding: 10, minWidth: 200, maxWidth: 260,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#78350f' }}>Note</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setEditing(e => !e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#92400e' }}>
                {editing ? '✓' : '✏️'}
              </button>
              <button onClick={() => onDelete(ann.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#ef4444' }}>×</button>
            </div>
          </div>
          {editing ? (
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={() => { setEditing(false); onUpdate(ann.id, { note: text }); }}
              style={{
                width: '100%', minHeight: 80, fontSize: '0.82rem',
                border: '1px solid #d97706', borderRadius: 4, padding: 6,
                background: 'rgba(255,255,255,0.7)', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <p style={{ fontSize: '0.82rem', margin: 0, color: '#451a03', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {text || <em style={{ opacity: 0.6 }}>Click ✏️ to add note…</em>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Text Annotation DOM overlay ───────────────────────
function TextAnnOverlay({ ann, zoom, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(!ann.note);
  const [text, setText] = useState(ann.note || '');

  const x = ann.x * zoom;
  const y = ann.y * zoom;

  return (
    <div style={{
      position: 'absolute', left: x, top: y, zIndex: 14, pointerEvents: 'all',
      background: 'rgba(255,253,230,0.97)',
      border: `1.5px solid ${ann.color || '#f59e0b'}`,
      borderRadius: 5, padding: '5px 8px', minWidth: 120, maxWidth: 240,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600 }}>Text note</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setEditing(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#4b5563' }}>
            {editing ? '✓' : '✏️'}
          </button>
          <button onClick={() => onDelete(ann.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#ef4444' }}>×</button>
        </div>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => { setEditing(false); onUpdate(ann.id, { note: text }); }}
          style={{
            width: '100%', minHeight: 60, fontSize: '0.8rem',
            border: '1px solid #d1d5db', borderRadius: 3, padding: 4,
            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            background: 'transparent',
          }}
        />
      ) : (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#111', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text || <em style={{ opacity: 0.5 }}>Empty note</em>}
        </p>
      )}
    </div>
  );
}

// ── Main AnnotationLayer ──────────────────────────────
export default function AnnotationLayer({
  pageIndex, canvasWidth, canvasHeight, zoom,
  activeTool, activeColor, activeLineWidth,
  annotations, onAnnotationsChange,
  enabled,
}) {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const startPos   = useRef(null);
  const currentAnn = useRef(null);

  const W = Math.round(canvasWidth  * zoom);
  const H = Math.round(canvasHeight * zoom);

  // Redraw whenever annotations or zoom changes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    redrawAll(ctx, annotations, zoom);
  }, [annotations, zoom, W, H]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };

  const onPointerDown = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    startPos.current = pos;

    // Sticky note — just place on click, no drag needed
    if (activeTool === ANNOTATION_TOOLS.STICKY) {
      const newAnn = {
        id: `ann-${Date.now()}`,
        tool: ANNOTATION_TOOLS.STICKY,
        x: pos.x, y: pos.y,
        color: activeColor || '#f59e0b',
        note: '',
      };
      onAnnotationsChange([...annotations, newAnn]);
      drawing.current = false;
      return;
    }

    if (activeTool === ANNOTATION_TOOLS.TEXT_ANN) {
      const newAnn = {
        id: `ann-${Date.now()}`,
        tool: ANNOTATION_TOOLS.TEXT_ANN,
        x: pos.x, y: pos.y,
        color: activeColor || '#f59e0b',
        note: '',
      };
      onAnnotationsChange([...annotations, newAnn]);
      drawing.current = false;
      return;
    }

    if (activeTool === ANNOTATION_TOOLS.FREEHAND) {
      currentAnn.current = {
        id: `ann-${Date.now()}`,
        tool: ANNOTATION_TOOLS.FREEHAND,
        points: [pos],
        color: activeColor,
        lineWidth: activeLineWidth,
        opacity: 1,
      };
    } else if (activeTool === ANNOTATION_TOOLS.ERASER) {
      // handled in move
    } else {
      currentAnn.current = {
        id: `ann-${Date.now()}`,
        tool: activeTool,
        x: pos.x, y: pos.y, w: 0, h: 0,
        color: activeColor,
        lineWidth: activeLineWidth,
        opacity: 1,
      };
    }
  }, [enabled, activeTool, activeColor, activeLineWidth, annotations, onAnnotationsChange]); // eslint-disable-line

  const onPointerMove = useCallback((e) => {
    if (!drawing.current || !enabled) return;
    e.preventDefault();
    const pos = getPos(e);

    if (activeTool === ANNOTATION_TOOLS.ERASER) {
      const eraseR = 20 / zoom;
      const filtered = annotations.filter(a => {
        if (a.tool === ANNOTATION_TOOLS.STICKY || a.tool === ANNOTATION_TOOLS.TEXT_ANN) return true;
        if (a.tool === ANNOTATION_TOOLS.FREEHAND) {
          return !a.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < eraseR);
        }
        const cx = a.x + (a.w || 0) / 2;
        const cy = a.y + (a.h || 0) / 2;
        return Math.hypot(cx - pos.x, cy - pos.y) > eraseR * 2;
      });
      if (filtered.length !== annotations.length) onAnnotationsChange(filtered);
      return;
    }

    if (activeTool === ANNOTATION_TOOLS.FREEHAND && currentAnn.current) {
      currentAnn.current.points.push(pos);
    } else if (currentAnn.current) {
      currentAnn.current.w = pos.x - startPos.current.x;
      currentAnn.current.h = pos.y - startPos.current.y;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      redrawAll(ctx, annotations, zoom);
      if (currentAnn.current) {
        ctx.save();
        ctx.strokeStyle = activeColor;
        ctx.fillStyle   = activeColor;
        ctx.lineWidth   = activeLineWidth * zoom;
        ctx.globalAlpha = 1;
        const a = currentAnn.current;
        const z = zoom;
        switch (activeTool) {
          case ANNOTATION_TOOLS.FREEHAND: {
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(a.points[0].x * z, a.points[0].y * z);
            a.points.forEach(p => ctx.lineTo(p.x * z, p.y * z));
            ctx.stroke(); break;
          }
          case ANNOTATION_TOOLS.RECT:
            ctx.strokeRect(a.x * z, a.y * z, a.w * z, a.h * z); break;
          case ANNOTATION_TOOLS.CIRCLE:
            ctx.beginPath();
            ctx.ellipse((a.x + a.w / 2) * z, (a.y + a.h / 2) * z, Math.abs(a.w / 2) * z, Math.abs(a.h / 2) * z, 0, 0, Math.PI * 2);
            ctx.stroke(); break;
          case ANNOTATION_TOOLS.LINE:
            ctx.beginPath(); ctx.moveTo(a.x * z, a.y * z);
            ctx.lineTo((a.x + a.w) * z, (a.y + a.h) * z); ctx.stroke(); break;
          case ANNOTATION_TOOLS.ARROW:
            drawArrow(ctx, a.x * z, a.y * z, (a.x + a.w) * z, (a.y + a.h) * z); break;
          case ANNOTATION_TOOLS.HIGHLIGHT:
            ctx.globalAlpha = 0.35; ctx.fillStyle = a.color || '#fde047';
            ctx.fillRect(a.x * z, a.y * z, a.w * z, a.h * z); break;
          case ANNOTATION_TOOLS.STRIKETHROUGH:
            ctx.beginPath(); ctx.moveTo(a.x * z, (a.y + a.h / 2) * z);
            ctx.lineTo((a.x + a.w) * z, (a.y + a.h / 2) * z); ctx.stroke(); break;
          case ANNOTATION_TOOLS.UNDERLINE:
            ctx.beginPath(); ctx.moveTo(a.x * z, (a.y + a.h) * z);
            ctx.lineTo((a.x + a.w) * z, (a.y + a.h) * z); ctx.stroke(); break;
          default: break;
        }
        ctx.restore();
      }
    }
  }, [enabled, activeTool, activeColor, activeLineWidth, annotations, onAnnotationsChange, zoom]); // eslint-disable-line

  const onPointerUp = useCallback((e) => {
    if (!drawing.current || !enabled) return;
    drawing.current = false;
    if (currentAnn.current && activeTool !== ANNOTATION_TOOLS.ERASER) {
      const a = currentAnn.current;
      const hasSize = a.tool === ANNOTATION_TOOLS.FREEHAND
        ? a.points.length > 2
        : (Math.abs(a.w || 0) > 3 || Math.abs(a.h || 0) > 3);
      if (hasSize) onAnnotationsChange([...annotations, currentAnn.current]);
    }
    currentAnn.current = null;
    startPos.current   = null;
  }, [enabled, activeTool, annotations, onAnnotationsChange]); // eslint-disable-line

  // Helpers for sticky/text-ann updates
  const handleDeleteAnn = useCallback((id) => {
    onAnnotationsChange(annotations.filter(a => a.id !== id));
  }, [annotations, onAnnotationsChange]);

  const handleUpdateAnn = useCallback((id, changes) => {
    onAnnotationsChange(annotations.map(a => a.id === id ? { ...a, ...changes } : a));
  }, [annotations, onAnnotationsChange]);

  return (
    <>
      {/* Canvas for non-DOM annotations */}
      <canvas
        ref={canvasRef}
        width={W} height={H}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        style={{
          position: 'absolute', inset: 0, width: W, height: H,
          cursor: enabled
            ? activeTool === ANNOTATION_TOOLS.ERASER ? 'cell'
            : activeTool === ANNOTATION_TOOLS.STICKY  ? 'cell'
            : 'crosshair'
            : 'default',
          zIndex: 6, touchAction: 'none',
          pointerEvents: enabled ? 'all' : 'none',
        }}
      />

      {/* DOM overlays for sticky notes and text annotations */}
      {annotations
        .filter(a => a.tool === ANNOTATION_TOOLS.STICKY)
        .map(ann => (
          <StickyNoteOverlay
            key={ann.id} ann={ann} zoom={zoom}
            onDelete={handleDeleteAnn} onUpdate={handleUpdateAnn}
          />
        ))}
      {annotations
        .filter(a => a.tool === ANNOTATION_TOOLS.TEXT_ANN)
        .map(ann => (
          <TextAnnOverlay
            key={ann.id} ann={ann} zoom={zoom}
            onDelete={handleDeleteAnn} onUpdate={handleUpdateAnn}
          />
        ))}
    </>
  );
}
