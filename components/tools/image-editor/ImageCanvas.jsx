'use client';
// ═══════════════════════════════════════════════════════
// ImageCanvas.jsx — Renders image + all text block overlays
// Double-click blank area → add new text block
// ═══════════════════════════════════════════════════════
import { useRef, useCallback } from 'react';
import ImageTextBlock from './ImageTextBlock';

export default function ImageCanvas({
  dataUrl, naturalWidth, naturalHeight,
  textBlocks, selectedBlockId, zoom,
  onSelectBlock, onUpdateBlock, onDeleteBlock, onAddBlock,
}) {
  const containerRef = useRef(null);

  const s = (v) => v * zoom;

  const onDoubleClick = useCallback((e) => {
    if (e.target !== containerRef.current && e.target.tagName !== 'IMG') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top)  / zoom;
    onAddBlock({
      id: `manual-${Date.now()}`,
      text: 'Type here',
      x, y,
      width: 120, height: 20,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000000',
      bgColor: 'transparent',
      bold: false, italic: false, underline: false,
    });
  }, [zoom, onAddBlock]);

  const onCanvasClick = useCallback((e) => {
    if (e.target === containerRef.current || e.target.tagName === 'IMG') {
      onSelectBlock(null);
    }
  }, [onSelectBlock]);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      onDoubleClick={onDoubleClick}
      style={{
        position: 'relative',
        width:  s(naturalWidth  || 800),
        height: s(naturalHeight || 600),
        minWidth: 200, minHeight: 200,
        flexShrink: 0,
        cursor: 'crosshair',
        boxShadow: '0 6px 32px rgba(0,0,0,0.18)',
        background: '#fff',
        userSelect: 'none',
      }}
    >
      {/* Base image */}
      {dataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Editable image"
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block', pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      )}

      {/* Text overlays */}
      {textBlocks.map((block) => (
        <ImageTextBlock
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          zoom={zoom}
          onSelect={onSelectBlock}
          onUpdate={(changes) => onUpdateBlock(block.id, changes)}
          onDelete={() => onDeleteBlock(block.id)}
        />
      ))}

      {/* Hint when no OCR blocks */}
      {textBlocks.length === 0 && dataUrl && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Double-click to add text • Re-run OCR to detect existing text
        </div>
      )}
    </div>
  );
}
