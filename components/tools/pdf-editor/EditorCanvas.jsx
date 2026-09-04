'use client';
// ═══════════════════════════════════════════════════════
// EditorCanvas.jsx — Multi-layer canvas orchestrator
// Layers (bottom to top):
//  1. PDF page image (background)
//  2. Watermark overlay
//  3. Text blocks (contenteditable divs)
//  4. Image overlays (draggable imgs)
//  5. Signature overlays
//  6. Link overlays (green dashed regions)
//  7. Redaction overlays (black boxes)
//  8. Annotation canvas (highlight/draw)
//  9. Redact-draw canvas (when in redact mode)
// ═══════════════════════════════════════════════════════
import { useRef, useCallback } from 'react';
import TextBlock from './TextBlock';
import AnnotationLayer, { ANNOTATION_TOOLS } from './AnnotationLayer';
import { ImageOverlay } from './ImageInserter';
import { RedactOverlay } from './RedactPanel';
import { LinkOverlay } from './LinkInserter';
import { EDITOR_MODES } from './ToolbarTop';

// ── Watermark render helper ──────────────────────────
function WatermarkOverlay({ watermark, canvasWidth, canvasHeight, zoom }) {
  if (!watermark?.enabled || !watermark?.text) return null;
  const W = canvasWidth  * zoom;
  const H = canvasHeight * zoom;

  const posStyle = () => {
    switch (watermark.position) {
      case 'top-left':      return { top:'8%',   left:'5%',  transform:`rotate(${watermark.rotation}deg)` };
      case 'top-center':    return { top:'8%',   left:'50%', transform:`translateX(-50%) rotate(${watermark.rotation}deg)` };
      case 'top-right':     return { top:'8%',   right:'5%', transform:`rotate(${watermark.rotation}deg)` };
      case 'bottom-left':   return { bottom:'8%',left:'5%',  transform:`rotate(${watermark.rotation}deg)` };
      case 'bottom-center': return { bottom:'8%',left:'50%', transform:`translateX(-50%) rotate(${watermark.rotation}deg)` };
      case 'bottom-right':  return { bottom:'8%',right:'5%', transform:`rotate(${watermark.rotation}deg)` };
      case 'diagonal':      return { top:'50%',  left:'50%', transform:`translate(-50%,-50%) rotate(${watermark.rotation ?? -35}deg)` };
      default:              return { top:'50%',  left:'50%', transform:`translate(-50%,-50%) rotate(${watermark.rotation ?? -35}deg)` };
    }
  };

  return (
    <div style={{
      position:'absolute', inset:0, width:W, height:H,
      pointerEvents:'none', zIndex:7, overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', ...posStyle(),
        fontSize: (watermark.fontSize || 64) * zoom * 0.75,
        color: watermark.color || '#ff0000',
        opacity: watermark.opacity ?? 0.25,
        fontWeight: watermark.bold ? 700 : 400,
        whiteSpace:'nowrap', userSelect:'none',
      }}>
        {watermark.text}
      </div>
    </div>
  );
}

// ── Redact draw canvas ───────────────────────────────
function RedactDrawLayer({ canvasWidth, canvasHeight, zoom, enabled, onAdd, color }) {
  const drawRef = useRef(null);
  const startPos = useRef(null);
  const drawing  = useRef(false);
  const W = Math.round(canvasWidth * zoom);
  const H = Math.round(canvasHeight * zoom);

  const getPos = (e) => {
    const rect = drawRef.current.getBoundingClientRect();
    return { x:(e.clientX-rect.left)/zoom, y:(e.clientY-rect.top)/zoom };
  };
  const onDown = (e) => { e.stopPropagation(); drawing.current=true; startPos.current=getPos(e); };
  const onMove = (e) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = drawRef.current.getContext('2d');
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = color||'#000000';
    ctx.globalAlpha = 0.5;
    const x = Math.min(startPos.current.x, pos.x)*zoom;
    const y = Math.min(startPos.current.y, pos.y)*zoom;
    const w = Math.abs(pos.x-startPos.current.x)*zoom;
    const h = Math.abs(pos.y-startPos.current.y)*zoom;
    ctx.fillRect(x,y,w,h);
  };
  const onUp = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const pos = getPos(e);
    const x = Math.min(startPos.current.x, pos.x);
    const y = Math.min(startPos.current.y, pos.y);
    const w = Math.abs(pos.x - startPos.current.x);
    const h = Math.abs(pos.y - startPos.current.y);
    if (w > 4 && h > 4) {
      onAdd({ id:`redact-${Date.now()}`, x, y, w, h, color: color||'#000000' });
    }
    const ctx = drawRef.current.getContext('2d');
    ctx.clearRect(0,0,W,H);
    startPos.current = null;
  };

  return (
    <canvas ref={drawRef} width={W} height={H}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      style={{ position:'absolute', inset:0, width:W, height:H, cursor:enabled?'crosshair':'default', zIndex:13, pointerEvents:enabled?'all':'none' }}
    />
  );
}

// ── Main EditorCanvas ────────────────────────────────
export default function EditorCanvas({
  page, pageIndex, zoom,
  // Text
  selectedBlockId, onSelectBlock, onUpdateBlock, onUpdateBlockText, onDeleteBlock, onAddBlock,
  // Annotations
  annotations, onAnnotationsChange,
  activeTool, activeColor, activeLineWidth,
  // Overlays
  imageOverlays, selectedOverlayId, onSelectOverlay, onUpdateOverlay, onDeleteOverlay,
  // Redactions
  redactions, onAddRedact, onUpdateRedact, onDeleteRedact,
  // Links
  links, onUpdateLink, onDeleteLink,
  // Watermark
  watermark,
  // Mode
  mode,
}) {
  const containerRef = useRef(null);

  const annotationEnabled = mode === EDITOR_MODES.ANNOTATE || mode === EDITOR_MODES.DRAW;
  const redactDrawEnabled  = mode === EDITOR_MODES.REDACT && activeTool === 'redact-draw';

  const s = (v) => v * zoom;

  // Click on blank area → deselect all
  const onCanvasClick = useCallback((e) => {
    if (e.target === containerRef.current || e.target.tagName === 'IMG') {
      onSelectBlock(null);
      onSelectOverlay(null);
    }
  }, [onSelectBlock, onSelectOverlay]);

  // Double-click blank → add text block (only in text mode)
  const onDoubleClick = useCallback((e) => {
    if (mode !== EDITOR_MODES.TEXT) return;
    if (e.target !== containerRef.current && e.target.tagName !== 'IMG') return;
    const rect = containerRef.current.getBoundingClientRect();
    onAddBlock(pageIndex, {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: 'New text',
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top)  / zoom,
      width: 120, height: 20, fontSize: 14,
      fontFamily: 'sans-serif', color: '#000000',
      bold: false, italic: false, underline: false,
    });
  }, [mode, zoom, onAddBlock, pageIndex]);

  if (!page) return null;

  const W = s(page.canvasWidth  || 794);
  const H = s(page.canvasHeight || 1123);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      onDoubleClick={onDoubleClick}
      style={{
        position:'relative', width:W, height:H,
        flexShrink:0, background:'#fff',
        boxShadow:'0 6px 32px rgba(0,0,0,0.16)',
        userSelect: annotationEnabled ? 'none' : 'auto',
      }}
    >
      {/* Layer 1: Page background */}
      {page.canvasDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.canvasDataUrl}
          alt={`Page ${pageIndex + 1}`}
          draggable={false}
          style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            display:'block', pointerEvents:'none', userSelect:'none',
            transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
          }}
        />
      )}

      {/* Layer 2: Watermark */}
      <WatermarkOverlay watermark={watermark} canvasWidth={page.canvasWidth} canvasHeight={page.canvasHeight} zoom={zoom} />

      {/* Layer 3: Text blocks */}
      {mode === EDITOR_MODES.TEXT && page.textBlocks?.map(block => (
        <TextBlock
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          zoom={zoom}
          onSelect={onSelectBlock}
          onUpdate={(changes) => onUpdateBlock(pageIndex, block.id, changes)}
          onUpdateText={(text) => onUpdateBlockText(pageIndex, block.id, text)}
          onDelete={() => onDeleteBlock(pageIndex, block.id)}
        />
      ))}

      {/* Layer 4: Image overlays */}
      {imageOverlays?.filter(o => o.pageIndex === pageIndex).map(o => (
        <ImageOverlay
          key={o.id}
          overlay={o}
          zoom={zoom}
          isSelected={selectedOverlayId === o.id}
          onSelect={onSelectOverlay}
          onUpdate={(ch) => onUpdateOverlay(o.id, ch)}
          onDelete={onDeleteOverlay}
        />
      ))}

      {/* Layer 5: Signatures (also image overlays) — already covered above */}

      {/* Layer 6: Link overlays */}
      {links?.filter(l => l.pageIndex === pageIndex).map(l => (
        <LinkOverlay
          key={l.id}
          link={l}
          zoom={zoom}
          isSelected={selectedOverlayId === l.id}
          onSelect={onSelectOverlay}
          onUpdate={(ch) => onUpdateLink(l.id, ch)}
          onDelete={() => onDeleteLink(l.id)}
        />
      ))}

      {/* Layer 7: Redaction boxes */}
      {redactions?.filter(r => r.pageIndex === pageIndex).map(r => (
        <RedactOverlay
          key={r.id}
          redact={r}
          zoom={zoom}
          isSelected={selectedOverlayId === r.id}
          onSelect={onSelectOverlay}
          onUpdate={(ch) => onUpdateRedact(r.id, ch)}
          onDelete={() => onDeleteRedact(r.id)}
        />
      ))}

      {/* Layer 8: Annotation canvas (highlight / draw) */}
      <AnnotationLayer
        pageIndex={pageIndex}
        canvasWidth={page.canvasWidth  || 794}
        canvasHeight={page.canvasHeight || 1123}
        zoom={zoom}
        activeTool={activeTool}
        activeColor={activeColor}
        activeLineWidth={activeLineWidth}
        annotations={annotations}
        onAnnotationsChange={onAnnotationsChange}
        enabled={annotationEnabled}
      />

      {/* Layer 9: Redact-draw canvas */}
      <RedactDrawLayer
        canvasWidth={page.canvasWidth  || 794}
        canvasHeight={page.canvasHeight || 1123}
        zoom={zoom}
        enabled={redactDrawEnabled}
        color={activeColor}
        onAdd={(r) => onAddRedact({ ...r, pageIndex })}
      />

      {/* Hint overlay */}
      {mode === EDITOR_MODES.TEXT && (!page.textBlocks || page.textBlocks.length === 0) && (
        <div style={{
          position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.5)', color:'#fff', padding:'6px 14px',
          borderRadius:'var(--radius-full)', fontSize:'0.78rem', pointerEvents:'none', whiteSpace:'nowrap',
        }}>
          Double-click to add text · PDF text blocks appear automatically after loading
        </div>
      )}
    </div>
  );
}
