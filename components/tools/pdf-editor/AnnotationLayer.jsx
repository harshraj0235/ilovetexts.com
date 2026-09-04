'use client';
// ═══════════════════════════════════════════════════════
// AnnotationLayer.jsx
// Canvas overlay for: highlight, strikethrough, underline,
// freehand draw, shapes (rect/circle/line/arrow), eraser.
// Renders on top of the PDF page image.
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
};

function drawArrow(ctx, x1, y1, x2, y2) {
  const headLen = 14;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
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
        ctx.lineJoin = 'round';
        ctx.lineCap  = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x * z, ann.points[0].y * z);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x * z, ann.points[i].y * z);
        }
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
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top)  / zoom,
    };
  };

  const onPointerDown = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    startPos.current = pos;

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
  }, [enabled, activeTool, activeColor, activeLineWidth]); // eslint-disable-line

  const onPointerMove = useCallback((e) => {
    if (!drawing.current || !enabled) return;
    e.preventDefault();
    const pos = getPos(e);

    if (activeTool === ANNOTATION_TOOLS.ERASER) {
      // Remove annotations whose bounding box contains the cursor
      const eraseR = 20 / zoom;
      const filtered = annotations.filter(a => {
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
      const dx = pos.x - startPos.current.x;
      const dy = pos.y - startPos.current.y;
      currentAnn.current.w = dx;
      currentAnn.current.h = dy;
    }

    // Live preview
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
        }
        ctx.restore();
      }
    }
  }, [enabled, activeTool, activeColor, activeLineWidth, annotations, onAnnotationsChange, zoom]); // eslint-disable-line

  const onPointerUp = useCallback((e) => {
    if (!drawing.current || !enabled) return;
    drawing.current = false;
    if (currentAnn.current && activeTool !== ANNOTATION_TOOLS.ERASER) {
      // Only save if the annotation has some size
      const a = currentAnn.current;
      const hasSize = a.tool === ANNOTATION_TOOLS.FREEHAND
        ? a.points.length > 2
        : (Math.abs(a.w || 0) > 3 || Math.abs(a.h || 0) > 3);
      if (hasSize) {
        onAnnotationsChange([...annotations, currentAnn.current]);
      }
    }
    currentAnn.current = null;
    startPos.current   = null;
  }, [enabled, activeTool, annotations, onAnnotationsChange]); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        width: W,
        height: H,
        cursor: enabled
          ? activeTool === ANNOTATION_TOOLS.ERASER ? 'cell'
          : activeTool === ANNOTATION_TOOLS.FREEHAND ? 'crosshair'
          : 'crosshair'
          : 'default',
        zIndex: 6,
        touchAction: 'none',
        pointerEvents: enabled ? 'all' : 'none',
      }}
    />
  );
}
