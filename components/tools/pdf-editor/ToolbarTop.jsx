'use client';
// ═══════════════════════════════════════════════════════
// ToolbarTop.jsx v2
// NEW: Comment tab, Form Fill tab, text alignment + bg
//      color controls in text mode, compact right panel
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { ANNOTATION_TOOLS } from './AnnotationLayer';

export const EDITOR_MODES = {
  TEXT:      'text',
  ANNOTATE:  'annotate',
  DRAW:      'draw',
  SIGN:      'sign',
  IMAGES:    'images',
  LINKS:     'links',
  REDACT:    'redact',
  PAGES:     'pages',
  WATERMARK: 'watermark',
  COMMENTS:  'comments',   // NEW
  FORM:      'form',       // NEW
};

const TABS = [
  { id: EDITOR_MODES.TEXT,      icon: '✏️',  label: 'Edit Text' },
  { id: EDITOR_MODES.ANNOTATE,  icon: '🖊️',  label: 'Annotate' },
  { id: EDITOR_MODES.DRAW,      icon: '🖌️',  label: 'Draw' },
  { id: EDITOR_MODES.SIGN,      icon: '✍️',  label: 'Sign' },
  { id: EDITOR_MODES.IMAGES,    icon: '🖼️',  label: 'Images' },
  { id: EDITOR_MODES.LINKS,     icon: '🔗',  label: 'Links' },
  { id: EDITOR_MODES.REDACT,    icon: '⬛',  label: 'Redact' },
  { id: EDITOR_MODES.FORM,      icon: '📋',  label: 'Form Fill' },
  { id: EDITOR_MODES.COMMENTS,  icon: '💬',  label: 'Comments' },
  { id: EDITOR_MODES.PAGES,     icon: '📄',  label: 'Pages' },
  { id: EDITOR_MODES.WATERMARK, icon: '🔖',  label: 'Watermark' },
];

const FONTS = [
  'sans-serif','serif','monospace','Arial','Georgia','Verdana',
  'Times New Roman','Courier New','Impact','Trebuchet MS',
];
const SIZES = [7,8,9,10,11,12,14,16,18,20,24,28,32,36,42,48,56,64,72];
const ALIGN_OPTIONS = [
  { value: 'left',    icon: '⬱', title: 'Align left'    },
  { value: 'center',  icon: '☰', title: 'Align center'  },
  { value: 'right',   icon: '⬲', title: 'Align right'   },
  { value: 'justify', icon: '▤', title: 'Justify'        },
];
const LINE_HEIGHTS = [1, 1.15, 1.3, 1.5, 1.75, 2];

const ANNOTATE_TOOLS = [
  { id: ANNOTATION_TOOLS.HIGHLIGHT,     icon: '🟡', label: 'Highlight' },
  { id: ANNOTATION_TOOLS.STRIKETHROUGH, icon: 'S̶', label: 'Strikethrough' },
  { id: ANNOTATION_TOOLS.UNDERLINE,     icon: 'U̲',  label: 'Underline' },
  { id: ANNOTATION_TOOLS.STICKY,        icon: '📌', label: 'Sticky Note' },
  { id: ANNOTATION_TOOLS.TEXT_ANN,      icon: '📝', label: 'Text Note' },
];
const DRAW_TOOLS = [
  { id: ANNOTATION_TOOLS.FREEHAND, icon: '✏️', label: 'Freehand' },
  { id: ANNOTATION_TOOLS.RECT,     icon: '▭',  label: 'Rectangle' },
  { id: ANNOTATION_TOOLS.CIRCLE,   icon: '○',  label: 'Circle' },
  { id: ANNOTATION_TOOLS.LINE,     icon: '╱',  label: 'Line' },
  { id: ANNOTATION_TOOLS.ARROW,    icon: '→',  label: 'Arrow' },
  { id: ANNOTATION_TOOLS.ERASER,   icon: '◻',  label: 'Eraser' },
];
const HIGHLIGHT_COLORS = ['#fde047','#86efac','#93c5fd','#f9a8d4','#fca5a5','#c4b5fd','#fdba74','#6ee7b7'];

function Sep() {
  return <div style={{ width:1, height:24, background:'var(--border-light)', margin:'0 3px', flexShrink:0 }} />;
}

function Btn({ children, onClick, active, disabled, title, danger, accent, style: extraStyle }) {
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
      ...extraStyle,
    }}>{children}</button>
  );
}

export default function ToolbarTop({
  mode, onModeChange,
  selectedBlock, onBlockChange,
  activeTool, onToolChange,
  activeColor, onColorChange,
  activeLineWidth, onLineWidthChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  canUndo, canRedo, onUndo, onRedo,
  pageCount, currentPage, onPageChange,
  onAddTextBlock, onAddSignature, onAddImage, onAddLink,
  onOpenWatermark, onOpenPages, onFindReplace, showFindReplace,
  onSaveChanges, saveStatus,
  onExport, isFullscreen, onToggleFullscreen,
  fileName,
  onOpenMerge,       // NEW
  commentCount,      // NEW — badge on Comments tab
  showCommentPanel,  // NEW
  onToggleComments,  // NEW
}) {
  const [showFontMenu, setShowFontMenu] = useState(false);

  const ff        = selectedBlock?.fontFamily  || 'sans-serif';
  const fs        = selectedBlock?.fontSize    || 14;
  const bold      = selectedBlock?.bold        || false;
  const italic    = selectedBlock?.italic      || false;
  const underline = selectedBlock?.underline   || false;
  const color     = selectedBlock?.color       || '#000000';
  const bgCustom  = selectedBlock?.bgColorCustom || null;
  const align     = selectedBlock?.align       || 'left';
  const lh        = selectedBlock?.lineHeight  || 1.3;

  return (
    <div style={{ display:'flex', flexDirection:'column', background:'var(--bg-main)', borderBottom:'1px solid var(--border-light)', flexShrink:0 }}>

      {/* ── Tab Row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'0 10px', borderBottom:'1px solid var(--border-light)', overflowX:'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => onModeChange(tab.id)}
            style={{
              padding:'9px 12px', border:'none', background:'transparent',
              borderBottom:`2px solid ${mode === tab.id ? '#0070F3' : 'transparent'}`,
              color: mode === tab.id ? '#0070F3' : 'var(--text-secondary)',
              fontWeight: mode === tab.id ? 700 : 500,
              cursor:'pointer', fontSize:'0.78rem',
              display:'flex', alignItems:'center', gap:4,
              whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
              position: 'relative',
            }}>
            <span>{tab.icon}</span>
            {tab.label}
            {/* Comment count badge */}
            {tab.id === EDITOR_MODES.COMMENTS && commentCount > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: '0.6rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{commentCount > 9 ? '9+' : commentCount}</span>
            )}
          </button>
        ))}

        {/* Right-side always-visible controls */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, paddingLeft:8 }}>
          <Btn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</Btn>
          <Btn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</Btn>
          <Sep />
          <Btn onClick={onZoomOut} title="Zoom out">−</Btn>
          <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-secondary)', minWidth:40, textAlign:'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Btn onClick={onZoomIn} title="Zoom in">+</Btn>
          <Btn onClick={onZoomReset} title="Reset zoom">↺</Btn>
          <Sep />
          {pageCount > 1 && (
            <>
              <Btn onClick={() => onPageChange(Math.max(0, currentPage-1))} disabled={currentPage===0}>‹</Btn>
              <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', flexShrink:0 }}>{currentPage+1}/{pageCount}</span>
              <Btn onClick={() => onPageChange(Math.min(pageCount-1, currentPage+1))} disabled={currentPage>=pageCount-1}>›</Btn>
              <Sep />
            </>
          )}
          <Btn onClick={onFindReplace} active={showFindReplace} title="Find & Replace (Ctrl+H)">🔎</Btn>
          <Btn onClick={onToggleComments} active={showCommentPanel} title="Toggle comment panel">💬</Btn>
          {onOpenMerge && <Btn onClick={onOpenMerge} title="Merge PDFs">🔗 Merge</Btn>}
          <Sep />
          {/* Save Changes */}
          <button onClick={onSaveChanges} title="Save all text changes (Ctrl+Shift+S)"
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: saveStatus==='saved' ? '#16a34a' : saveStatus==='saving' ? '#f59e0b' : '#0070F3',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, transition: 'background 0.25s',
            }}>
            {saveStatus==='saved' ? '✓ Saved' : saveStatus==='saving' ? '⏳' : '💾 Save'}
          </button>
          <Btn onClick={onExport} accent title="Export (Ctrl+S)">⬇ Export</Btn>
          <Btn onClick={onToggleFullscreen} active={isFullscreen} title="Fullscreen">
            {isFullscreen ? '⊡' : '⛶'}
          </Btn>
        </div>
      </div>

      {/* ── Sub-toolbar per mode ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', minHeight:42, overflowX:'auto', flexWrap:'nowrap' }}>

        {/* ── TEXT MODE ── */}
        {mode === EDITOR_MODES.TEXT && (
          <>
            {/* Font family */}
            <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowFontMenu(v=>!v)} disabled={!selectedBlock}
                style={{ padding:'4px 9px', border:`1px solid ${showFontMenu?'#0070F3':'var(--border-light)'}`, borderRadius:'var(--radius-sm)', background:'var(--bg-main)', color:'var(--text-primary)', fontFamily:ff, fontSize:'0.8rem', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4, minWidth:110 }}>
                {ff} ▾
              </button>
              {showFontMenu && selectedBlock && (
                <div style={{ position:'absolute', top:'100%', left:0, zIndex:300, background:'var(--bg-main)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', minWidth:160, overflow:'hidden' }}>
                  {FONTS.map(f=>(
                    <button key={f} onClick={()=>{onBlockChange({fontFamily:f});setShowFontMenu(false);}}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 12px', border:'none', cursor:'pointer', fontFamily:f, fontSize:'0.86rem', color:'var(--text-primary)', background:ff===f?'rgba(0,112,243,0.08)':'transparent' }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font size */}
            <select value={fs} disabled={!selectedBlock} onChange={e=>onBlockChange({fontSize:+e.target.value})}
              style={{ padding:'4px 2px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.8rem', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4, width:52, flexShrink:0 }}>
              {SIZES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>

            {/* B I U */}
            <Btn onClick={()=>onBlockChange({bold:!bold})} active={bold} disabled={!selectedBlock} title="Bold"><b>B</b></Btn>
            <Btn onClick={()=>onBlockChange({italic:!italic})} active={italic} disabled={!selectedBlock} title="Italic"><em>I</em></Btn>
            <Btn onClick={()=>onBlockChange({underline:!underline})} active={underline} disabled={!selectedBlock} title="Underline"><u>U</u></Btn>

            <Sep />

            {/* Alignment */}
            {ALIGN_OPTIONS.map(a => (
              <Btn key={a.value} onClick={()=>onBlockChange({align:a.value})} active={align===a.value} disabled={!selectedBlock} title={a.title}>
                {a.icon}
              </Btn>
            ))}

            <Sep />

            {/* Text color */}
            <label title="Text color" style={{ position:'relative', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4 }}>
              <input type="color" value={color} disabled={!selectedBlock} onChange={e=>onBlockChange({color:e.target.value})}
                style={{ position:'absolute', opacity:0, width:'100%', height:'100%', cursor:'pointer' }} />
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', fontSize:'0.8rem', fontWeight:700 }}>
                <span style={{ width:12, height:12, borderRadius:2, background:color, border:'1px solid var(--border-light)', display:'inline-block' }} />A
              </span>
            </label>

            {/* BG color */}
            <label title="Block background color" style={{ position:'relative', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4 }}>
              <input type="color" value={bgCustom||'#ffffff'} disabled={!selectedBlock}
                onChange={e=>onBlockChange({bgColorCustom:e.target.value, isEdited:true})}
                style={{ position:'absolute', opacity:0, width:'100%', height:'100%', cursor:'pointer' }} />
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', fontSize:'0.78rem', fontWeight:700 }}>
                <span style={{ width:12, height:12, borderRadius:2, background:bgCustom||'#ffffff', border:'1px solid #ccc', display:'inline-block' }} />BG
              </span>
            </label>

            {/* Clear BG */}
            {bgCustom && selectedBlock && (
              <Btn onClick={()=>onBlockChange({bgColorCustom:null})} title="Clear background" disabled={!selectedBlock}>✕bg</Btn>
            )}

            <Sep />

            {/* Line height */}
            <select value={lh} disabled={!selectedBlock} onChange={e=>onBlockChange({lineHeight:+e.target.value})}
              style={{ padding:'4px 2px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.78rem', cursor:selectedBlock?'pointer':'not-allowed', opacity:selectedBlock?1:0.4, width:58, flexShrink:0 }}>
              {LINE_HEIGHTS.map(v=><option key={v} value={v}>{v}× line</option>)}
            </select>

            <Sep />
            <Btn onClick={onAddTextBlock} title="Add text block (or double-click page)">＋ Add Text</Btn>
          </>
        )}

        {/* ── ANNOTATE MODE ── */}
        {mode === EDITOR_MODES.ANNOTATE && (
          <>
            {ANNOTATE_TOOLS.map(t=>(
              <Btn key={t.id} onClick={()=>onToolChange(t.id)} active={activeTool===t.id} title={t.label}>
                {t.icon} {t.label}
              </Btn>
            ))}
            <Sep />
            {HIGHLIGHT_COLORS.map(c=>(
              <button key={c} onClick={()=>onColorChange(c)} title={c}
                style={{ width:20, height:20, borderRadius:4, background:c, border: activeColor===c?'2px solid #0070F3':'1px solid var(--border-light)', cursor:'pointer', flexShrink:0 }} />
            ))}
            <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.78rem', cursor:'pointer', marginLeft:4 }}>
              <input type="color" value={activeColor} onChange={e=>onColorChange(e.target.value)} style={{ width:22, height:22, cursor:'pointer', border:'none' }} />
              Custom
            </label>
            <Sep />
            <Btn onClick={()=>onToolChange(ANNOTATION_TOOLS.ERASER)} active={activeTool===ANNOTATION_TOOLS.ERASER} danger title="Eraser">◻ Erase</Btn>
          </>
        )}

        {/* ── DRAW MODE ── */}
        {mode === EDITOR_MODES.DRAW && (
          <>
            {DRAW_TOOLS.map(t=>(
              <Btn key={t.id} onClick={()=>onToolChange(t.id)} active={activeTool===t.id}
                danger={t.id===ANNOTATION_TOOLS.ERASER} title={t.label}>
                {t.icon} {t.label}
              </Btn>
            ))}
            <Sep />
            <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', cursor:'pointer' }}>
              <input type="color" value={activeColor} onChange={e=>onColorChange(e.target.value)} style={{ width:22, height:22, cursor:'pointer', border:'none' }} />
              Color
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem' }}>
              Width:
              <input type="range" min={1} max={14} value={activeLineWidth} onChange={e=>onLineWidthChange(+e.target.value)} style={{ width:80 }} />
              <span style={{ minWidth:14, fontWeight:600, fontSize:'0.78rem' }}>{activeLineWidth}</span>
            </label>
          </>
        )}

        {/* ── SIGN MODE ── */}
        {mode === EDITOR_MODES.SIGN && (
          <>
            <Btn onClick={onAddSignature} accent>✍️ Add / Manage Signature</Btn>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Draw, type, upload or reuse a saved signature
            </span>
          </>
        )}

        {/* ── IMAGES MODE ── */}
        {mode === EDITOR_MODES.IMAGES && (
          <>
            <Btn onClick={onAddImage}>🖼️ Insert Image</Btn>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Upload JPG/PNG/SVG — drag to position, resize with corner handle
            </span>
          </>
        )}

        {/* ── LINKS MODE ── */}
        {mode === EDITOR_MODES.LINKS && (
          <>
            <Btn onClick={onAddLink}>🔗 Add Link</Btn>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Draw a region and attach a URL
            </span>
          </>
        )}

        {/* ── REDACT MODE ── */}
        {mode === EDITOR_MODES.REDACT && (
          <>
            <Btn onClick={()=>onToolChange('redact-draw')} active={activeTool==='redact-draw'} danger>⬛ Draw Redaction</Btn>
            <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', marginLeft:8 }}>
              Color:
              <input type="color" value={activeColor} onChange={e=>onColorChange(e.target.value)} style={{ width:22, height:22, cursor:'pointer', border:'none' }} />
            </label>
            <span style={{ fontSize:'0.78rem', color:'#ef4444', marginLeft:8, fontWeight:600 }}>⚠️ Permanent on export</span>
          </>
        )}

        {/* ── FORM FILL MODE ── */}
        {mode === EDITOR_MODES.FORM && (
          <>
            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>📋 Form Fill Mode</span>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:10 }}>
              Detected form fields are shown as fill-in boxes. Use Export → PDF to save.
            </span>
          </>
        )}

        {/* ── COMMENTS MODE ── */}
        {mode === EDITOR_MODES.COMMENTS && (
          <>
            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>💬 Comments</span>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:10 }}>
              All sticky notes and text annotations appear in the right panel
            </span>
            <Btn onClick={onToggleComments} active={showCommentPanel}>
              {showCommentPanel ? 'Hide Panel' : 'Show Panel'}
            </Btn>
          </>
        )}

        {/* ── PAGES MODE ── */}
        {mode === EDITOR_MODES.PAGES && (
          <>
            <Btn onClick={onOpenPages} accent>📄 Manage Pages</Btn>
            {onOpenMerge && <Btn onClick={onOpenMerge}>🔗 Merge PDFs</Btn>}
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Reorder, rotate or delete pages — {pageCount} page{pageCount!==1?'s':''}
            </span>
          </>
        )}

        {/* ── WATERMARK MODE ── */}
        {mode === EDITOR_MODES.WATERMARK && (
          <>
            <Btn onClick={onOpenWatermark} accent>🔖 Edit Watermark</Btn>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginLeft:8 }}>
              Add text watermark to all pages
            </span>
          </>
        )}
      </div>
    </div>
  );
}
