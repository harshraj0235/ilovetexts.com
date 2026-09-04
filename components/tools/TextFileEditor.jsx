'use client';
'use client';
// ═══════════════════════════════════════════════════════
// TextFileEditor.jsx — Edit TXT, CSV, JSON, HTML, XML,
// Markdown, YAML, JS, CSS, SQL and any plain-text file.
// Full-screen, line numbers, find/replace, word wrap,
// auto-save localStorage+sessionStorage, export with
// filename labels. 100% client-side.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect } from 'react';
import SaveStatusBadge from './pdf-editor/SaveStatusBadge';

const TF_LS_KEY = 'ilt-textfile-editor-autosave';
const TF_SS_KEY = 'ilt-textfile-editor-session';

// ── File type → syntax colour class (simple CSS-only) ─
const EXT_LANG = {
  json:'json', js:'js', ts:'js', jsx:'js', tsx:'js',
  html:'html', htm:'html', xml:'xml', svg:'xml',
  css:'css', scss:'css',
  md:'md', markdown:'md',
  yaml:'yaml', yml:'yaml', toml:'yaml',
  sql:'sql', py:'py', sh:'sh', bash:'sh',
  txt:'txt', csv:'csv', tsv:'csv',
};

function detectLang(name) {
  const ext = name?.split('.').pop()?.toLowerCase() || 'txt';
  return EXT_LANG[ext] || 'txt';
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// ── UploadZone ─────────────────────────────────────────
function UploadZone({ onFile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  return (
    <div
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => ref.current?.click()}
      style={{
        border: `2px dashed ${drag ? '#0070F3' : 'var(--border-light)'}`,
        borderRadius: 'var(--radius-lg)', padding: '56px 36px',
        textAlign: 'center', cursor: 'pointer',
        background: drag ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
        transition: 'all 0.2s', maxWidth: 560, margin: '0 auto',
      }}
    >
      <input ref={ref} type="file" accept="*/*" style={{ display: 'none' }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div style={{ fontSize: 52, marginBottom: 14 }}>📃</div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop any text file here</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 18 }}>
        TXT, CSV, JSON, HTML, XML, Markdown, YAML, JS, CSS, SQL and more
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
        {['TXT','CSV','JSON','HTML','XML','MD','YAML','JS','CSS','SQL'].map(t => (
          <span key={t} style={{ background:'var(--bg-main)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-full)', padding:'3px 9px', fontSize:'0.74rem', fontWeight:600, color:'var(--text-secondary)' }}>{t}</span>
        ))}
      </div>
      <button onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
        style={{ background:'#0070F3', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'11px 28px', fontSize:'0.95rem', fontWeight:600, cursor:'pointer' }}>
        Open File
      </button>
      <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        🔒 File never leaves your browser
      </p>
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────
function Toolbar({ fileName, lang, lines, chars, wordWrap, onWordWrap, onDownload, onCopy, onClose, onNew, isFullscreen, onFullscreen, saveStatus, lastSavedAt }) {
  const LANG_LABELS = { json:'JSON', js:'JavaScript', html:'HTML', xml:'XML', css:'CSS', md:'Markdown', yaml:'YAML', sql:'SQL', py:'Python', sh:'Shell', txt:'Text', csv:'CSV' };
  const base = fileName?.replace(/\.[^.]+$/, '') || 'file';
  // Derive output filename for Save button
  const ext  = fileName?.split('.').pop()?.toLowerCase() || 'txt';
  const saveFilename = `${base}-edited.${ext}`;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
      background:'var(--bg-main)', borderBottom:'1px solid var(--border-light)',
      flexShrink:0, flexWrap:'wrap', boxShadow:'var(--shadow-sm)',
    }}>
      {/* File name + lang badge */}
      <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        📃 {fileName || 'untitled'}
      </span>
      <span style={{ fontSize:'0.7rem', padding:'2px 7px', borderRadius:'var(--radius-full)', background:'rgba(0,112,243,0.1)', color:'#0070F3', fontWeight:700 }}>
        {LANG_LABELS[lang] || lang.toUpperCase()}
      </span>

      <div style={{ width:1, height:22, background:'var(--border-light)' }} />

      {/* Copy — no filename label */}
      <button onClick={onCopy} title="Copy all to clipboard" style={{
        padding:'5px 10px', borderRadius:'var(--radius-sm)',
        border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
        color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
      }}>📋 Copy</button>

      {/* Save — with filename label below */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
        <button onClick={onDownload} title={`Download as ${saveFilename} (Ctrl+S)`} style={{
          padding:'5px 10px', borderRadius:'var(--radius-sm)',
          border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
          color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
        }}>💾 Save</button>
        <span style={{ fontSize:'0.63rem', color:'#0070F3', fontFamily:'var(--font-mono)', whiteSpace:'nowrap', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>
          → {saveFilename}
        </span>
      </div>

      {/* Open another file */}
      <button onClick={onNew} title="Open another file" style={{
        padding:'5px 10px', borderRadius:'var(--radius-sm)',
        border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
        color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
      }}>📂 Open</button>

      {/* Auto-save badge */}
      <SaveStatusBadge status={saveStatus} lastSavedAt={lastSavedAt} />

      {/* Word wrap toggle */}
      <button onClick={onWordWrap} title="Toggle word wrap" style={{
        padding:'5px 10px', borderRadius:'var(--radius-sm)',
        border:`1px solid ${wordWrap ? '#0070F3' : 'var(--border-light)'}`,
        background: wordWrap ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
        color: wordWrap ? '#0070F3' : 'var(--text-primary)',
        cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
      }}>↵ Wrap</button>

      {/* Fullscreen */}
      <button onClick={onFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
        padding:'5px 9px', borderRadius:'var(--radius-sm)',
        border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
        color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem',
      }}>{isFullscreen ? '⊡' : '⛶'}</button>

      {/* Stats */}
      <span style={{ marginLeft:'auto', fontSize:'0.74rem', color:'var(--text-tertiary)', whiteSpace:'nowrap' }}>
        {lines} lines · {chars.toLocaleString()} chars
      </span>

      <button onClick={onClose} style={{
        padding:'4px 9px', borderRadius:'var(--radius-sm)',
        border:'1px solid var(--border-light)', background:'none',
        color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.8rem',
      }}>✕</button>
    </div>
  );
}

// ── Find & Replace bar (inline, no modal) ──────────────
function FindBar({ onClose, textareaRef }) {
  const [find, setFind]       = useState('');
  const [replace, setReplace] = useState('');
  const [count, setCount]     = useState(null);

  const doReplace = () => {
    if (!find || !textareaRef.current) return;
    const ta = textareaRef.current;
    const flags = 'gi';
    try {
      const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), flags);
      const newVal = ta.value.replace(re, replace);
      const matches = (ta.value.match(re) || []).length;
      // Trigger React synthetic change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeInputValueSetter.call(ta, newVal);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      setCount(matches);
    } catch {}
  };

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, padding:'6px 14px',
      background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-light)', flexShrink:0,
    }}>
      <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)' }}>🔎 Find:</span>
      <input value={find} onChange={(e)=>setFind(e.target.value)} placeholder="Search…"
        style={{ padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', width:160 }} />
      <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)' }}>Replace:</span>
      <input value={replace} onChange={(e)=>setReplace(e.target.value)} placeholder="Replace with…"
        style={{ padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', width:160 }} />
      <button onClick={doReplace} style={{ padding:'4px 12px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
        Replace All
      </button>
      {count !== null && <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{count} replaced</span>}
      <button onClick={onClose} style={{ marginLeft:4, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-secondary)' }}>×</button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function TextFileEditor({ t, lang }) {
  const [fileName, setFileName]   = useState(null);
  const [content, setContent]     = useState(null); // string
  const [origContent, setOrig]    = useState(null);
  const [langType, setLangType]   = useState('txt');
  const [wordWrap, setWordWrap]   = useState(true);
  const [showFind, setShowFind]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast]         = useState(null);
  const containerRef = useRef(null);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auto-save to localStorage + sessionStorage ───────
  const [tfSaveStatus, setTfSaveStatus] = useState('idle');
  const tfSaveTimer  = useRef(null);
  const tfLastSaved  = useRef(null);

  useEffect(() => {
    if (content === null || !fileName) return;
    setTfSaveStatus('saving');
    if (tfSaveTimer.current) clearTimeout(tfSaveTimer.current);
    tfSaveTimer.current = setTimeout(() => {
      try {
        const payload = JSON.stringify({ fileName, lang: langType, savedAt: Date.now(), content });
        if (payload.length < 4 * 1024 * 1024) {
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(TF_LS_KEY, payload); } catch(e) { /* quota */ }
            try { sessionStorage.setItem(TF_SS_KEY, payload); } catch(e) { /* quota */ }
          }
        }
        tfLastSaved.current = Date.now();
        setTfSaveStatus('saved');
        setTimeout(() => setTfSaveStatus('idle'), 2000);
      } catch(e) { setTfSaveStatus('error'); }
    }, 1200);
    return () => { if (tfSaveTimer.current) clearTimeout(tfSaveTimer.current); };
  }, [content, fileName, langType]); // eslint-disable-line

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's' && content !== null) { e.preventDefault(); doDownload(); }
      if (ctrl && e.key === 'h') { e.preventDefault(); setShowFind(v => !v); }
      if (e.key === 'Escape') setShowFind(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [content]); // eslint-disable-line

  // ── Fullscreen ──────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Load file ───────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      setFileName(file.name);
      setContent(text);
      setOrig(text);
      setLangType(detectLang(file.name));
    } catch (err) {
      showToast('Could not read file: ' + err.message);
    }
  }, [showToast]);

  // ── Download ────────────────────────────────────────
  const doDownload = useCallback(() => {
    if (content === null) return;
    const mime = langType === 'html' ? 'text/html'
      : langType === 'json' ? 'application/json'
      : langType === 'csv'  ? 'text/csv'
      : 'text/plain';
    const blob = new Blob([content], { type: mime });
    downloadBlob(blob, fileName || 'edited.txt');
    showToast('File downloaded!');
  }, [content, fileName, langType, showToast]);

  const doCopy = useCallback(async () => {
    if (content === null) return;
    await navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!');
  }, [content, showToast]);

  // ── Stats ───────────────────────────────────────────
  const lines = content !== null ? (content.match(/\n/g) || []).length + 1 : 0;
  const chars = content?.length || 0;
  const dirty = content !== origContent;

  // ── Line numbers ─────────────────────────────────────
  const lineNumbers = content !== null
    ? Array.from({ length: lines }, (_, i) => i + 1).join('\n')
    : '';

  // Sync textarea scroll with line numbers
  const gutterRef = useRef(null);
  const onScroll  = (e) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  };

  // ── Upload zone ─────────────────────────────────────
  if (content === null) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <input ref={fileInputRef} type="file" accept="*/*" style={{ display:'none' }}
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value=''; }} />
        <UploadZone onFile={handleFile} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginTop:28 }}>
          {[
            { icon:'🎨', title:'Syntax Badges',  desc:'Auto-detects JSON, HTML, XML, CSV, Markdown and more' },
            { icon:'🔢', title:'Line Numbers',   desc:'Full gutter with line count, always visible' },
            { icon:'🔎', title:'Find & Replace', desc:'Ctrl+H — instant replace across the whole file' },
            { icon:'💾', title:'Save Instantly', desc:'Ctrl+S — download back in the original format, no watermark' },
          ].map(f => (
            <div key={f.title} className="trust-card" style={{ padding:16, gap:8 }}>
              <div style={{ fontSize:26 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{f.title}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Editor ──────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display:'flex', flexDirection:'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        minHeight: 500,
        border:'1px solid var(--border-light)', borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
        overflow:'hidden', background:'var(--bg-main)', position:'relative',
      }}
    >
      <Toolbar
        fileName={`${fileName}${dirty ? ' •' : ''}`}
        lang={langType}
        lines={lines} chars={chars}
        wordWrap={wordWrap} onWordWrap={() => setWordWrap(v => !v)}
        onDownload={doDownload} onCopy={doCopy}
        onClose={() => { setContent(null); setFileName(null); }}
        onNew={() => fileInputRef.current?.click()}
        isFullscreen={isFullscreen} onFullscreen={toggleFullscreen}
        saveStatus={tfSaveStatus} lastSavedAt={tfLastSaved.current}
      />

      {showFind && <FindBar onClose={() => setShowFind(false)} textareaRef={textareaRef} />}

      {/* Editor body: gutter + textarea */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}>

        {/* Line number gutter */}
        <div
          ref={gutterRef}
          style={{
            width: 52, flexShrink:0,
            padding:'12px 8px 12px 4px',
            textAlign:'right',
            background:'var(--bg-secondary)',
            borderRight:'1px solid var(--border-light)',
            color:'var(--text-tertiary)',
            overflowY:'hidden',
            whiteSpace:'pre',
            lineHeight:'1.6',
            userSelect:'none',
            pointerEvents:'none',
            fontSize:'0.78rem',
          }}
        >
          {lineNumbers}
        </div>

        {/* Main textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onScroll={onScroll}
          spellCheck={false}
          style={{
            flex:1,
            padding:'12px 16px',
            border:'none',
            outline:'none',
            resize:'none',
            background:'var(--bg-main)',
            color:'var(--text-primary)',
            fontFamily:'var(--font-mono)',
            fontSize:'0.85rem',
            lineHeight:'1.6',
            overflowY:'auto',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            overflowX: wordWrap ? 'hidden' : 'auto',
            tabSize: 2,
          }}
        />
      </div>

      {/* Status bar */}
      <div style={{
        padding:'3px 16px', background:'var(--bg-secondary)',
        borderTop:'1px solid var(--border-light)', flexShrink:0,
        fontSize:'0.72rem', color:'var(--text-secondary)',
        display:'flex', gap:16, alignItems:'center', flexWrap:'wrap',
      }}>
        <span>{fileName}</span>
        <span>Ln {lines}</span>
        <span>{chars.toLocaleString()} chars</span>
        {dirty && <span style={{ color:'#f59e0b', fontWeight:600 }}>● Unsaved</span>}
        <SaveStatusBadge status={tfSaveStatus} lastSavedAt={tfLastSaved.current} />
        <span style={{ marginLeft:'auto', color:'var(--text-tertiary)' }}>Ctrl+S · Ctrl+H</span>
      </div>

      {/* Hidden file input for "Open" button */}
      <input ref={fileInputRef} type="file" accept="*/*" style={{ display:'none' }}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value=''; }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'#16a34a', color:'#fff', padding:'10px 22px',
          borderRadius:'var(--radius-full)', fontSize:'0.88rem', fontWeight:600,
          zIndex:2000, boxShadow:'var(--shadow-float)', pointerEvents:'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
