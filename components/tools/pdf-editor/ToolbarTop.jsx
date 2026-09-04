'use client';
// ═══════════════════════════════════════════════════════
// ToolbarTop.jsx — Advanced Sejda-style tabbed toolbar
// 8 mode tabs + tool-specific sub-controls per tab
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { ANNOTATION_TOOLS } from './AnnotationLayer';

export const EDITOR_MODES = {
  TEXT:       'text',
  ANNOTATE:   'annotate',
  DRAW:       'draw',
  SIGN:       'sign',
  IMAGES:     'images',
  LINKS:      'links',
  REDACT:     'redact',
  PAGES:      'pages',
  WATERMARK:  'watermark',
};

const TABS = [
  { id: EDITOR_MODES.TEXT,      icon: '✏️',  label: 'Edit Text' },
  { id: EDITOR_MODES.ANNOTATE,  icon: '🖊️',  label: 'Annotate' },
  { id: EDITOR_MODES.DRAW,      icon: '🖌️',  label: 'Draw' },
  { id: EDITOR_MODES.SIGN,      icon: '✍️',  label: 'Sign' },
  { id: EDITOR_MODES.IMAGES,    icon: '🖼️',  label: 'Images' },
  { id: EDITOR_MODES.LINKS,     icon: '🔗',  label: 'Links' },
  { id: EDITOR_MODES.REDACT,    icon: '⬛',  label: 'Redact' },
  { id: EDITOR_MODES.PAGES,     icon: '📄',  label: 'Pages' },
  { id: EDITOR_MODES.WATERMARK, icon: '🔖',  label: 'Watermark' },
];

const FONTS = ['sans-serif','serif','monospace','Arial','Georgia','Verdana','Times New Roman','Courier New','Impact'];
const SIZES = [7,8,9,10,11,12,14,16,18,20,24,28,32,36,42,48,56,64];

const ANNOTATE_TOOLS = [
  { id: ANNOTATION_TOOLS.HIGHLIGHT,     icon: '🟡', label: 'Highlight' },
  { id: ANNOTATION_TOOLS.STRIKETHROUGH, icon: '~~', label: 'Strikethrough' },
  { id: ANNOTATION_TOOLS.UNDERLINE,     icon: 'U̲',  label: 'Underline' },
];
const DRAW_TOOLS = [
  { id: ANNOTATION_TOOLS.FREEHAND, icon: '✏️', label: 'Freehand' },
  { id: ANNOTATION_TOOLS.RECT,     icon: '▭',  label: 'Rectangle' },
  { id: ANNOTATION_TOOLS.CIRCLE,   icon: '○',  label: 'Circle' },
  { id: ANNOTATION_TOOLS.LINE,     icon: '╱',  label: 'Line' },
  { id: ANNOTATION_TOOLS.ARROW,    icon: '→',  label: 'Arrow' },
  { id: ANNOTATION_TOOLS.ERASER,   icon: '◻',  label: 'Eraser' },
];

const HIGHLIGHT_COLORS = ['#fde047','#86efac','#93c5fd','#f9a8d4','#fca5a5','#c4b5fd','#fdba74'];

function Sep() {
  return <div style={{ width:1, height:24, background:'var(--border-light)', margin:'0 3px', flexShrink:0 }} />;
}

function Btn({ children, onClick, active, disabled, title, danger, accent }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      padding:'5px 9px', borderRadius:'var(--radius-sm)',
      border:`1px solid ${active ? '#0070F3' : danger ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`,
      background: active ? 'rgba(0,112,243,0.1)' : accent ? '#0070F3' : danger ? 'rgba(239,68,68,0.07)' : 'var(--bg-main)',
      color: active ? '#0070F3' : accent ? '#fff' : danger ? '#ef4444' : 'var(--text-primary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize:'0.82rem', fontWeight:600, opacity: disabled ? 0.4 : 1,
      display:'flex', alignItems:'center', gap:4,
      whiteSpace:'nowrap', flexShrink:0, transition:'all 0.12s',
    }}>{children}</button>
  );
}

export default function ToolbarTop({
  // Mode
  mode, onModeChange,
  // Text editing
  selectedBlock, onBlockChange,
  // Annotation / Draw
  activeTool, onToolChange,
  activeColor, onColorChange,
  activeLineWidth, onLineWidthChange,
  // Zoom
  zoom, onZoomIn, onZoomOut, onZoomReset,
  // History
  canUndo, canRedo, onUndo, onRedo,
  // Page nav
  pageCount, currentPage, onPageChange,
  // Actions
  onAddTextBlock, onAddSignature, onAddImage, onAddLink,
  onOpenWatermark, onOpenPages, onFindReplace, showFindReplace,
  onSaveChanges, saveStatus,
  onExport, isFullscreen, onToggleFullscreen,
  fileName,
}) {
  const [showFontMenu, setShowFontMenu] = useState(false);

  const ff   = selectedBlock?.fontFamily || 'sans-serif';
  const fs   = selectedBlock?.fontSize   || 14;
  const bold      = selectedBlock?.bold      || false;
  const italic    = selectedBlock?.italic    || false;
  const underline = selectedBlock?.underline || false;
  const color     = selectedBlock?.color    || '#000000';

  return (
    <div style={{ display:'flex', flexDirection:'column', background:'var(--bg-main)', borderBottom:'1px solid var(--border-light)', flexShrink:0 }}>

      {/* ── Tab Row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'0 10px', borderBottom:'1px solid var(--border-light)', overflowX:'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            style={{
              padding:'9px 14px', border:'none', background:'transparent',
              borderBottom:`2px solid ${mode === tab.id ? '#0070F3' : 'transparent'}`,
              color: mode === tab.id ? '#0070F3' : 'var(--text-secondary)',
              fontWeight: mode === tab.id ? 700 : 500,
              cursor:'pointer', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5,
              whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}

        {/* Right-side controls always visible */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, paddingLeft:8 }}>
          {/* Undo / Redo */}
          <Btn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</Btn>
          <Btn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</Btn>
          <Sep />
          {/* Zoom */}
          <Btn onClick={onZoomOut} title="Zoom out">−</Btn>
          <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', minWidth:42, textAlign:'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Btn onClick={onZoomIn} title="Zoom in">＋</Btn>
          <Btn onClick={onZoomReset} title="Reset zoom">↺</Btn>
          <Sep />
          {/* Page nav */}
          {pageCount > 1 && (
            <>
              <Btn onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>‹</Btn>
              <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', flexShrink:0 }}>
                {currentPage + 1}/{pageCount}
              </span>
              <Btn onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1}>›</Btn>
              <Sep />
            </>
          )}
          {/* Find */}
          <Btn onClick={onFindReplace} active={showFindReplace} title="Find & Replace (Ctrl+H)">🔎</Btn>
          {/* Save Changes — primary action */}
          <button
            onClick={onSaveChanges}
            title="Save all text changes (Ctrl+Shift+S)"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: saveStatus === 'saved'
                ? '#16a34a'
                : saveStatus === 'saving'
                  ? '#f59e0b'
                  : '#0070F3',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              transition: 'background 0.25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          >
            {saveStatus === 'saved'  ? '✓ Saved' :
             saveStatus === 'saving' ? '⏳ Saving…' :
             '💾 Save Changes'}
          </button>
          {/* Export */}
          <Btn onClick={onExport} accent title="Export (Ctrl+S)">⬇ Export</Btn>
          {/* Fullscreen */}
          <Btn onClick={onToggleFullscreen} active={isFullscreen} title="Fullscreen">
            {isFullscreen ? '⊡' : '⛶'}
          </Btn>
        </div>
      </div>

      {/* ── Sub-toolbar per mode ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', minHeight:44, overflowX:'auto', flexWrap:'nowrap' }}>

        {/* ── TEXT MODE ── */}
        {mode === EDITOR_MODES.TEXT && (
          <>
            {/* Font family */}
            <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowFontMenu(v => !v)} disabled={!selectedBlock}
                style={{ padding:'5px 9px', border:`1px solid ${showFontMenu?'#0070F3':'var(--border-light)'}`, borderRadius:'var(--radius-sm)', background:'var(--bg-main)', color:'var(--text-primary)', fontFamily:ff, fontSize:'0.82rem', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4, minWidth:120 }}>
                {ff} ▾
              </button>
              {showFontMenu && selectedBlock && (
                <div style={{ position:'absolute', top:'100%', left:0, zIndex:300, background:'var(--bg-main)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-float)', minWidth:160, overflow:'hidden' }}>
                  {FONTS.map(f => (
                    <button key={f} onClick={() => { onBlockChange({fontFamily:f}); setShowFontMenu(false); }}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', border:'none', cursor:'pointer', fontFamily:f, fontSize:'0.88rem', color:'var(--text-primary)', background:ff===f?'rgba(0,112,243,0.08)':'transparent' }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Font size */}
            <select value={fs} disabled={!selectedBlock} onChange={e => onBlockChange({fontSize:+e.target.value})}
              style={{ padding:'5px 3px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4, width:54, flexShrink:0 }}>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* B I U */}
            <Btn onClick={() => onBlockChange({bold:!bold})} active={bold} disabled={!selectedBlock} title="Bold"><b>B</b></Btn>
            <Btn onClick={() => onBlockChange({italic:!italic})} active={italic} disabled={!selectedBlock} title="Italic"><em>I</em></Btn>
            <Btn onClick={() => onBlockChange({underline:!underline})} active={underline} disabled={!selectedBlock} title="Underline"><u>U</u></Btn>
            {/* Text color */}
            <label title="Text color" style={{ position:'relative', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4 }}>
              <input type="color" value={color} disabled={!selectedBlock} onChange={e => onBlockChange({color:e.target.value})}
                style={{ position:'absolute', opacity:0, width:'100%', height:'100%', cursor:'pointer' }} />
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', fontSize:'0.82rem', fontWeight:600 }}>
                <span style={{ width:12, height:12, borderRadius:2, background:color, border:'1px solid var(--border-light)', display:'inline-block' }} /> A
              </span>
            </label>
            <Sep />
            <Btn onClick={onAddTextBlock} title="Add new text block (or double-click page)">＋ Add Text</Btn>
          </>
        )}

        {/* ── ANNOTATE MODE ── */}
        {mode === EDITOR_MODES.ANNOTATE && (
          <>
            {ANNOTATE_TOOLS.map(t => (
              <Btn key={t.id} onClick={() => onToolChange(t.id)} active={activeTool===t.id} title={t.label}>
                {t.icon} {t.label}
              </Btn>
            ))}
            <Sep />
            {/* Highlight color swatches */}
            {HIGHLIGHT_COLORS.map(c => (
              <button key={c} onClick={() => onColorChange(c)} title={c}
                style={{ width:22, height:22, borderRadius:4, background:c, border: activeColor===c?'2px solid #0070F3':'1px solid var(--border-light)', cursor:'pointer', flexShrink:0 }} />
            ))}
            <Sep />
            {/* Custom color */}
            <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', cursor:'pointer' }}>
              <input type="color" value={activeColor} onChange={e => onColorChange(e.target.value)} style={{ width:24, height:24, cursor:'pointer', border:'none' }} />
              Custom
            </label>
            <Sep />
            <Btn onClick={() => onToolChange(ANNOTATION_TOOLS.ERASER)} active={activeTool===ANNOTATION_TOOLS.ERASER} danger title="Eraser">◻ Eraser</Btn>
          </>
        )}

        {/* ── DRAW MODE ── */}
        {mode === EDITOR_MODES.DRAW && (
          <>
            {DRAW_TOOLS.map(t => (
              <Btn key={t.id} onClick={() => onToolChange(t.id)} active={activeTool===t.id} title={t.label}
                danger={t.id===ANNOTATION_TOOLS.ERASER}>
                {t.icon} {t.label}
              </Btn>
            ))}
            <Sep />
            <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', cursor:'pointer' }}>
              <input type="color" value={activeColor} onChange={e => onColorChange(e.target.value)} style={{ width:24, height:24, cursor:'pointer', border:'none' }} />
              Color
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8rem' }}>
              Width:
              <input type="range" min={1} max={12} value={activeLineWidth} onChange={e => onLineWidthChange(+e.target.value)} style={{ width:80 }} />
              <span style={{ minWidth:14, fontWeight:600, fontSize:'0.8rem' }}>{activeLineWidth}</span>
            </label>
          </>
        )}

        {/* ── SIGN MODE ── */}
        {mode === EDITOR_MODES.SIGN && (
          <>
            <Btn onClick={onAddSignature} accent title="Open signature pad">✍️ Add Signature</Btn>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Draw or type your signature, then position it on the page
            </span>
          </>
        )}

        {/* ── IMAGES MODE ── */}
        {mode === EDITOR_MODES.IMAGES && (
          <>
            <Btn onClick={onAddImage} title="Insert image from your device">🖼️ Insert Image</Btn>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Upload JPG, PNG, SVG — drag to position, resize with corner handle
            </span>
          </>
        )}

        {/* ── LINKS MODE ── */}
        {mode === EDITOR_MODES.LINKS && (
          <>
            <Btn onClick={onAddLink} title="Insert a hyperlink region">🔗 Add Link</Btn>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Draw a region and attach a URL — visible as a green dashed box
            </span>
          </>
        )}

        {/* ── REDACT MODE ── */}
        {mode === EDITOR_MODES.REDACT && (
          <>
            <Btn onClick={() => onToolChange('redact-draw')} active={activeTool==='redact-draw'} danger title="Draw a redaction box">⬛ Draw Redaction</Btn>
            <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', cursor:'pointer', marginLeft:8 }}>
              Color:
              <input type="color" value={activeColor} onChange={e => onColorChange(e.target.value)} style={{ width:24, height:24, cursor:'pointer', border:'none' }} />
            </label>
            <span style={{ fontSize:'0.8rem', color:'#ef4444', marginLeft:8, fontWeight:600 }}>
              ⚠️ Redactions are permanent when exported
            </span>
          </>
        )}

        {/* ── PAGES MODE ── */}
        {mode === EDITOR_MODES.PAGES && (
          <>
            <Btn onClick={onOpenPages} accent title="Open page manager">📄 Manage Pages</Btn>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Reorder, rotate or delete pages — {pageCount} page{pageCount !== 1 ? 's' : ''}
            </span>
          </>
        )}

        {/* ── WATERMARK MODE ── */}
        {mode === EDITOR_MODES.WATERMARK && (
          <>
            <Btn onClick={onOpenWatermark} accent title="Configure watermark">🔖 Edit Watermark</Btn>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Add text watermark to all pages — customise opacity, rotation, position
            </span>
          </>
        )}
      </div>
    </div>
  );
}
