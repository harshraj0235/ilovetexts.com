'use client';
// ═══════════════════════════════════════════════════════
// ImageToolbar.jsx — Full image editor toolbar
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import ColorPicker from './ColorPicker';

const FONTS = ['sans-serif','serif','monospace','Arial','Georgia','Verdana','Times New Roman','Courier New','Impact','Comic Sans MS'];
const SIZES = [7,8,9,10,11,12,14,16,18,20,24,28,32,36,42,48,56,64,72];

function Sep() {
  return <div style={{ width: 1, height: 26, background: 'var(--border-light)', margin: '0 3px', flexShrink: 0 }} />;
}

function Btn({ children, onClick, active, disabled, title, style: extra }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        padding: '5px 9px', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? '#0070F3' : 'var(--border-light)'}`,
        background: active ? 'rgba(0,112,243,0.1)' : 'var(--bg-main)',
        color: active ? '#0070F3' : 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.82rem', fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'all 0.12s',
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

export default function ImageToolbar({
  selectedBlock, onBlockChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  canUndo, canRedo, onUndo, onRedo,
  onRerunOcr, ocrRunning,
  onAddText,
  onFindReplace, showFindReplace,
  onExport,
  isFullscreen, onToggleFullscreen,
  fileName,
}) {
  const [panel, setPanel] = useState(null); // 'font' | 'textColor' | 'bgColor' | null

  const ff = selectedBlock?.fontFamily || 'sans-serif';
  const fs = selectedBlock?.fontSize   || 14;
  const bold      = selectedBlock?.bold      || false;
  const italic    = selectedBlock?.italic    || false;
  const underline = selectedBlock?.underline || false;
  const color     = selectedBlock?.color    || '#000000';
  const bgColor   = selectedBlock?.bgColor  || 'transparent';

  const closePanel = () => setPanel(null);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '6px 12px',
      background: 'var(--bg-main)',
      borderBottom: '1px solid var(--border-light)',
      overflowX: 'auto', flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
    }}
      onClick={closePanel}
    >
      {/* File name */}
      {fileName && (
        <span style={{
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)',
          maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          🖼️ {fileName}
        </span>
      )}

      <Sep />

      {/* Undo / Redo */}
      <Btn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</Btn>
      <Btn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</Btn>

      <Sep />

      {/* Font family dropdown */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          disabled={!selectedBlock}
          onClick={() => setPanel(panel === 'font' ? null : 'font')}
          style={{
            padding: '5px 8px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${panel === 'font' ? '#0070F3' : 'var(--border-light)'}`,
            background: 'var(--bg-main)', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontFamily: ff,
            cursor: selectedBlock ? 'pointer' : 'not-allowed',
            opacity: selectedBlock ? 1 : 0.4, minWidth: 110, flexShrink: 0,
          }}
        >
          {ff} ▾
        </button>
        {panel === 'font' && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 300,
            background: 'var(--bg-main)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)',
            minWidth: 170, overflow: 'hidden',
          }}>
            {FONTS.map((f) => (
              <button key={f}
                onClick={() => { onBlockChange({ fontFamily: f }); closePanel(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 12px', border: 'none', cursor: 'pointer',
                  fontFamily: f, fontSize: '0.88rem', color: 'var(--text-primary)',
                  background: ff === f ? 'rgba(0,112,243,0.08)' : 'transparent',
                }}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font size */}
      <select
        value={fs} disabled={!selectedBlock}
        onChange={(e) => onBlockChange({ fontSize: Number(e.target.value) })}
        style={{
          padding: '5px 3px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          background: 'var(--bg-main)', color: 'var(--text-primary)',
          fontSize: '0.82rem', cursor: selectedBlock ? 'pointer' : 'not-allowed',
          opacity: selectedBlock ? 1 : 0.4, width: 54, flexShrink: 0,
        }}
      >
        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* B / I / U */}
      <Btn onClick={() => onBlockChange({ bold: !bold })} active={bold} disabled={!selectedBlock} title="Bold"><b>B</b></Btn>
      <Btn onClick={() => onBlockChange({ italic: !italic })} active={italic} disabled={!selectedBlock} title="Italic"><em>I</em></Btn>
      <Btn onClick={() => onBlockChange({ underline: !underline })} active={underline} disabled={!selectedBlock} title="Underline"><u>U</u></Btn>

      {/* Text colour */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          disabled={!selectedBlock}
          onClick={() => setPanel(panel === 'textColor' ? null : 'textColor')}
          title="Text colour"
          style={{
            padding: '5px 9px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${panel === 'textColor' ? '#0070F3' : 'var(--border-light)'}`,
            background: 'var(--bg-main)', cursor: selectedBlock ? 'pointer' : 'not-allowed',
            opacity: selectedBlock ? 1 : 0.4, fontSize: '0.82rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}
        >
          <span style={{ width: 13, height: 13, borderRadius: 3, background: color, border: '1px solid var(--border-light)', display: 'inline-block' }} />
          A
        </button>
        {panel === 'textColor' && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 300,
            background: 'var(--bg-main)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)',
            padding: 12, minWidth: 210,
          }}>
            <ColorPicker value={color} onChange={(c) => { onBlockChange({ color: c }); }} label="Text Color" />
          </div>
        )}
      </div>

      {/* Background / erase colour */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          disabled={!selectedBlock}
          onClick={() => setPanel(panel === 'bgColor' ? null : 'bgColor')}
          title="Background colour (paint over original text)"
          style={{
            padding: '5px 9px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${panel === 'bgColor' ? '#0070F3' : 'var(--border-light)'}`,
            background: 'var(--bg-main)', cursor: selectedBlock ? 'pointer' : 'not-allowed',
            opacity: selectedBlock ? 1 : 0.4, fontSize: '0.82rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}
        >
          <span style={{
            width: 13, height: 13, borderRadius: 3,
            background: bgColor === 'transparent'
              ? 'linear-gradient(135deg,#fff 45%,#f00 45%,#f00 55%,#fff 55%)'
              : bgColor,
            border: '1px solid var(--border-light)', display: 'inline-block',
          }} />
          BG
        </button>
        {panel === 'bgColor' && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 300,
            background: 'var(--bg-main)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)',
            padding: 12, minWidth: 210,
          }}>
            <ColorPicker value={bgColor} onChange={(c) => { onBlockChange({ bgColor: c }); }} label="Background / Erase Color" allowTransparent />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
              Tip: match the image background colour to "erase" the original text
            </p>
          </div>
        )}
      </div>

      <Sep />

      {/* Add text */}
      <Btn onClick={onAddText} title="Add new text block (or double-click canvas)">＋ Text</Btn>

      {/* Re-run OCR */}
      <Btn onClick={onRerunOcr} disabled={ocrRunning} title="Re-run OCR scan on original image">
        {ocrRunning ? '⏳ OCR…' : '🔍 Re-OCR'}
      </Btn>

      <Sep />

      {/* Zoom */}
      <Btn onClick={onZoomOut} title="Zoom out">−</Btn>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 42, textAlign: 'center', flexShrink: 0 }}>
        {Math.round(zoom * 100)}%
      </span>
      <Btn onClick={onZoomIn} title="Zoom in">＋</Btn>
      <Btn onClick={onZoomReset} title="Reset zoom (100%)">↺</Btn>

      <Sep />

      {/* Find & Replace */}
      <Btn onClick={onFindReplace} active={showFindReplace} title="Find & Replace (Ctrl+H)">🔎</Btn>

      {/* Export */}
      <Btn onClick={onExport} title="Export image (Ctrl+S)" style={{ background: '#0070F3', color: '#fff', border: 'none' }}>
        💾 Export
      </Btn>

      {/* Fullscreen */}
      <Btn onClick={onToggleFullscreen} active={isFullscreen} title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
        {isFullscreen ? '⊡' : '⛶'}
      </Btn>
    </div>
  );
}
