'use client';
'use client';
// ═══════════════════════════════════════════════════════
// WordDocumentEditor.jsx — Edit DOCX/DOC files in-browser
// Auto-save: localStorage + sessionStorage
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect } from 'react';
import SaveStatusBadge from './pdf-editor/SaveStatusBadge';

const WORD_LS_KEY = 'ilt-word-editor-autosave';
const WORD_SS_KEY = 'ilt-word-editor-session';

// ── helpers ───────────────────────────────────────────
const ACCEPTED = '.docx,.doc,.rtf,.txt,.odt';

function readFileAsArrayBuffer(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = (e) => res(e.target.result);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// ── UploadZone (inline) ───────────────────────────────
function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  return (
    <div
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => !loading && ref.current?.click()}
      style={{
        border: `2px dashed ${drag ? '#0070F3' : 'var(--border-light)'}`,
        borderRadius: 'var(--radius-lg)', padding: '56px 36px',
        textAlign: 'center', cursor: loading ? 'default' : 'pointer',
        background: drag ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
        transition: 'all 0.2s', maxWidth: 560, margin: '0 auto',
      }}
    >
      <input ref={ref} type="file" accept={ACCEPTED} style={{ display: 'none' }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--border-light)', borderTopColor: '#0070F3', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Parsing document…</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 56, marginBottom: 14 }}>📝</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop your Word document here</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 18 }}>
            Supports DOCX, DOC, RTF, TXT, ODT — edit without Microsoft Word
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 20 }}>
            {['DOCX','DOC','RTF','TXT'].map(t => (
              <span key={t} style={{ background:'var(--bg-main)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-full)', padding:'3px 10px', fontSize:'0.76rem', fontWeight:600, color:'var(--text-secondary)' }}>{t}</span>
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
            style={{ background:'#0070F3', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'11px 28px', fontSize:'0.95rem', fontWeight:600, cursor:'pointer' }}>
            Choose Document
          </button>
          <p style={{ marginTop: 16, fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
            🔒 Document never leaves your browser — 100% private
          </p>
        </>
      )}
    </div>
  );
}

// ── Paragraph block ───────────────────────────────────
function ParaBlock({ html, onChange, style: extraStyle }) {
  const elRef = useRef(null);

  // Set content on mount + when block switches (but NOT on every re-render while focused)
  useEffect(() => {
    const el = elRef.current;
    if (el && document.activeElement !== el) {
      el.innerHTML = html;
    }
  }, [html]);

  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      style={{
        outline: 'none',
        padding: '4px 6px',
        borderRadius: 4,
        minHeight: 24,
        lineHeight: 1.7,
        color: 'var(--text-primary)',
        cursor: 'text',
        border: '1px solid transparent',
        transition: 'border 0.15s',
        ...extraStyle,
      }}
      onFocus={(e) => { e.currentTarget.style.border = '1px solid #0070F3'; e.currentTarget.style.background = 'rgba(0,112,243,0.03)'; }}
      onBlur={(e)  => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
    />
  );
}

// ── Toolbar ───────────────────────────────────────────
function Toolbar({ onExportTxt, onExportHtml, onCopy, onClose, fileName, wordCount, saveStatus, lastSavedAt }) {
  const base = fileName?.replace(/\.[^.]+$/, '') || 'document';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
      background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)',
      flexShrink: 0, flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)',
    }}>
      {fileName && (
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📝 {fileName}
        </span>
      )}
      <div style={{ width: 1, height: 22, background: 'var(--border-light)' }} />
      {[
        { label: '📋 Copy All', fn: onCopy,       title: 'Copy all text',                filename: null },
        { label: '⬇️ TXT',      fn: onExportTxt,  title: 'Download as plain text',       filename: `${base}-edited.txt` },
        { label: '⬇️ HTML',     fn: onExportHtml, title: 'Download as HTML document',    filename: `${base}-edited.html` },
      ].map(b => (
        <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={b.fn} title={b.title} style={{
            padding: '5px 11px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
          }}>{b.label}</button>
          {b.filename && (
            <span style={{ fontSize: '0.65rem', color: '#0070F3', fontFamily: 'var(--font-mono)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              → {b.filename}
            </span>
          )}
        </div>
      ))}
      <SaveStatusBadge status={saveStatus} lastSavedAt={lastSavedAt} />
      <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
        ~{wordCount} words
      </span>
      <button onClick={onClose} style={{
        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-light)', background: 'none',
        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
      }}>✕ Close</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────
export default function WordDocumentEditor({ t, lang }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fileName, setFileName] = useState(null);
  // blocks: array of { id, html, tag }
  const [blocks, setBlocks]     = useState(null);
  const [toast, setToast]       = useState(null);
  const [wSaveStatus, setWSaveStatus] = useState('idle');
  const wSaveTimer = useRef(null);
  const wLastSaved = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auto-save blocks ────────────────────────────────
  useEffect(() => {
    if (!blocks || blocks.length === 0 || !fileName) return;
    setWSaveStatus('saving');
    if (wSaveTimer.current) clearTimeout(wSaveTimer.current);
    wSaveTimer.current = setTimeout(() => {
      try {
        const payload = JSON.stringify({ fileName, savedAt: Date.now(), blocks });
        if (payload.length < 3 * 1024 * 1024) {
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(WORD_LS_KEY, payload); } catch(e) { /* quota */ }
            try { sessionStorage.setItem(WORD_SS_KEY, payload); } catch(e) { /* quota */ }
          }
        }
        wLastSaved.current = Date.now();
        setWSaveStatus('saved');
        setTimeout(() => setWSaveStatus('idle'), 2000);
      } catch(e) { setWSaveStatus('error'); }
    }, 1500);
    return () => { if (wSaveTimer.current) clearTimeout(wSaveTimer.current); };
  }, [blocks, fileName]); // eslint-disable-line

  // ── Load file ───────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'txt') {
        // Plain text — split into lines
        const text = await file.text();
        const lines = text.split('\n');
        setBlocks(lines.map((line, i) => ({
          id: `l${i}`, html: line || '&nbsp;', tag: 'p',
        })));
        setLoading(false);
        return;
      }

      // DOCX/DOC via mammoth.js
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let mammoth;
      try {
        mammoth = await import('mammoth');
      } catch {
        // mammoth not installed — fallback to raw text hint
        setError('mammoth.js not installed. Run: npm install mammoth');
        setLoading(false);
        return;
      }

      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html   = result.value; // the HTML string

      // Parse into individual block elements
      const parser = new DOMParser();
      const doc    = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const nodes  = Array.from(doc.body.firstChild.childNodes);

      const parsed = nodes
        .filter(n => n.nodeType === 1) // only elements
        .map((n, i) => ({
          id:  `b${i}`,
          html: n.innerHTML,
          tag:  n.tagName.toLowerCase(),
        }));

      setBlocks(parsed.length ? parsed : [{ id: 'b0', html: 'Document appears empty.', tag: 'p' }]);
    } catch (err) {
      console.error(err);
      setError(`Failed to parse document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Update single block ─────────────────────────────
  const updateBlock = useCallback((id, html) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, html } : b));
  }, []);

  // ── Word count ──────────────────────────────────────
  const wordCount = blocks
    ? blocks.reduce((acc, b) => {
        const txt = b.html.replace(/<[^>]+>/g, ' ');
        return acc + (txt.trim() ? txt.trim().split(/\s+/).length : 0);
      }, 0)
    : 0;

  // ── Exports ─────────────────────────────────────────
  const getAllText = useCallback(() =>
    (blocks || []).map(b => b.html.replace(/<[^>]+>/g, '')).join('\n'), [blocks]);

  const getAllHtml = useCallback(() =>
    (blocks || []).map(b => `<${b.tag}>${b.html}</${b.tag}>`).join('\n'), [blocks]);

  const onExportTxt = useCallback(() => {
    const blob = new Blob([getAllText()], { type: 'text/plain' });
    downloadBlob(blob, (fileName?.replace(/\.[^.]+$/, '') || 'document') + '-edited.txt');
    showToast('TXT downloaded!');
  }, [getAllText, fileName, showToast]);

  const onExportHtml = useCallback(() => {
    const blob = new Blob([`<!DOCTYPE html><html><body>\n${getAllHtml()}\n</body></html>`], { type: 'text/html' });
    downloadBlob(blob, (fileName?.replace(/\.[^.]+$/, '') || 'document') + '-edited.html');
    showToast('HTML downloaded!');
  }, [getAllHtml, fileName, showToast]);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(getAllText());
    showToast('Copied to clipboard!');
  }, [getAllText, showToast]);

  // ── Tag → style mapping ─────────────────────────────
  const tagStyle = (tag) => {
    if (tag === 'h1') return { fontSize: '1.9rem', fontWeight: 800, margin: '12px 0 4px' };
    if (tag === 'h2') return { fontSize: '1.5rem', fontWeight: 700, margin: '10px 0 4px' };
    if (tag === 'h3') return { fontSize: '1.2rem', fontWeight: 700, margin: '8px 0 4px' };
    if (tag === 'li') return { paddingLeft: 20, listStyleType: 'disc' };
    return { fontSize: '1rem', margin: '4px 0' };
  };

  // ── No file yet ─────────────────────────────────────
  if (!blocks && !loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
        <UploadZone onFile={handleFile} loading={false} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 14, marginTop: 28 }}>
          {[
            { icon: '📝', title: 'No Word Needed', desc: 'Edit DOCX files without Microsoft Office' },
            { icon: '🔒', title: '100% Private',   desc: 'Document never leaves your browser' },
            { icon: '⚡', title: 'Instant',        desc: 'Opens in seconds, no upload queue' },
            { icon: '💾', title: 'Free Export',    desc: 'Download as TXT or HTML — no watermark' },
          ].map(f => (
            <div key={f.title} className="trust-card" style={{ padding: 16, gap: 8 }}>
              <div style={{ fontSize: 26 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <UploadZone onFile={() => {}} loading={true} />
      </div>
    );
  }

  // ── Editor ──────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 120px)', minHeight: 500,
      border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', background: 'var(--bg-main)',
    }}>
      <Toolbar
        fileName={fileName} wordCount={wordCount}
        onExportTxt={onExportTxt} onExportHtml={onExportHtml} onCopy={onCopy}
        saveStatus={wSaveStatus} lastSavedAt={wLastSaved.current}
        onClose={() => { setBlocks(null); setFileName(null); setError(null); }}
      />

      {/* Document body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '32px 10%',
        background: '#fff',
      }}>
        {/* Page shadow effect */}
        <div style={{
          maxWidth: 760, margin: '0 auto',
          background: '#fff',
          boxShadow: '0 0 40px rgba(0,0,0,0.08)',
          borderRadius: 4, padding: '48px 56px',
          minHeight: 500,
        }}>
          {blocks.map(block => (
            <ParaBlock
              key={block.id}
              html={block.html}
              onChange={(html) => updateBlock(block.id, html)}
              style={tagStyle(block.tag)}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '4px 16px', background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-light)', flexShrink: 0,
        fontSize: '0.74rem', color: 'var(--text-secondary)',
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        <span>📝 {fileName}</span>
        <span>{wordCount} words</span>
        <span>{blocks.length} paragraphs</span>
        <span style={{ marginLeft: 'auto', color: '#16a34a' }}>Click any text to edit</span>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : '#16a34a',
          color: '#fff', padding: '10px 22px', borderRadius: 'var(--radius-full)',
          fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
