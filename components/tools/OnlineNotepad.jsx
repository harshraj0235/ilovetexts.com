'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Simple Markdown renderer (no external dep) ───────────────────────────────
function renderMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold / italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(139,92,246,0.12);padding:2px 5px;border-radius:3px;font-family:monospace;font-size:0.9em">$1</code>')
    // blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #8b5cf6;margin:8px 0;padding:4px 12px;color:var(--text-secondary);font-style:italic">$1</blockquote>')
    // unordered lists
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    // ordered lists
    .replace(/^\s*\d+\. (.+)$/gm, '<li style="list-style-type:decimal">$1</li>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#8b5cf6">$1</a>')
    // horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-light);margin:16px 0"/>')
    // line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // wrap li items in ul
  html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul style="padding-left:20px;margin:8px 0">$&</ul>');
  return '<p style="margin:0;line-height:1.7">' + html + '</p>';
}

// ─── Word / char count ────────────────────────────────────────────────────────
function getStats(text) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(words / 200));
  return { chars, words, lines, sentences, readTime };
}

const DEFAULT_TABS = [
  { id: 1, title: 'Note 1', content: '' },
];

function genId() {
  return Date.now() + Math.random();
}

const FONT_OPTIONS = [
  { label: 'Sans-serif', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: '"Courier New", monospace' },
  { label: 'Dyslexic-friendly', value: '"Comic Sans MS", cursive' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '22px'];

export default function OnlineNotepad({ t, lang }) {
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [font, setFont] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState('16px');
  const [wordWrap, setWordWrap] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState(null);
  const [renamingTab, setRenamingTab] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const textareaRef = useRef(null);
  const saveTimer = useRef(null);

  // ── Restore from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ilt_notepad_tabs');
      const savedActive = localStorage.getItem('ilt_notepad_active');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          setActiveTab(savedActive ? parseInt(savedActive) : parsed[0].id);
        }
      }
      const savedFont = localStorage.getItem('ilt_notepad_font');
      const savedSize = localStorage.getItem('ilt_notepad_size');
      const savedDark = localStorage.getItem('ilt_notepad_dark');
      const savedWrap = localStorage.getItem('ilt_notepad_wrap');
      if (savedFont) setFont(savedFont);
      if (savedSize) setFontSize(savedSize);
      if (savedDark) setDarkMode(savedDark === 'true');
      if (savedWrap) setWordWrap(savedWrap === 'true');
    } catch { /* ignore */ }
  }, []);

  // ── Auto-save with debounce ──
  const persistTabs = useCallback((updatedTabs, activeId) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem('ilt_notepad_tabs', JSON.stringify(updatedTabs));
      if (activeId !== undefined) localStorage.setItem('ilt_notepad_active', String(activeId));
    }, 300);
  }, []);

  // ── Persist preferences ──
  useEffect(() => { localStorage.setItem('ilt_notepad_font', font); }, [font]);
  useEffect(() => { localStorage.setItem('ilt_notepad_size', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('ilt_notepad_dark', String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('ilt_notepad_wrap', String(wordWrap)); }, [wordWrap]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Current tab content ──
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const content = currentTab?.content || '';
  const stats = getStats(content);

  const updateContent = (val) => {
    const updated = tabs.map(tab => tab.id === activeTab ? { ...tab, content: val } : tab);
    setTabs(updated);
    persistTabs(updated, activeTab);
  };

  // ── Tab management ──
  const addTab = () => {
    const newTab = { id: genId(), title: `Note ${tabs.length + 1}`, content: '' };
    const updated = [...tabs, newTab];
    setTabs(updated);
    setActiveTab(newTab.id);
    persistTabs(updated, newTab.id);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    if (tabs.length === 1) { showToast('Cannot close the last tab', 'warning'); return; }
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    const newActive = activeTab === id ? updated[updated.length - 1].id : activeTab;
    setActiveTab(newActive);
    persistTabs(updated, newActive);
  };

  const startRename = (tab, e) => {
    e.stopPropagation();
    setRenamingTab(tab.id);
    setRenameVal(tab.title);
  };

  const commitRename = () => {
    if (!renameVal.trim()) { setRenamingTab(null); return; }
    const updated = tabs.map(t => t.id === renamingTab ? { ...t, title: renameVal.trim() } : t);
    setTabs(updated);
    persistTabs(updated);
    setRenamingTab(null);
  };

  // ── Find & Replace ──
  const handleFind = () => {
    if (!findText) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const idx = content.indexOf(findText, ta.selectionEnd);
    if (idx === -1) {
      const fromStart = content.indexOf(findText);
      if (fromStart === -1) { showToast('Not found', 'warning'); return; }
      ta.setSelectionRange(fromStart, fromStart + findText.length);
      ta.focus();
    } else {
      ta.setSelectionRange(idx, idx + findText.length);
      ta.focus();
    }
  };

  const handleReplace = () => {
    if (!findText) return;
    const idx = content.indexOf(findText);
    if (idx === -1) { showToast('Not found', 'warning'); return; }
    const newContent = content.slice(0, idx) + replaceText + content.slice(idx + findText.length);
    updateContent(newContent);
    showToast('Replaced 1 occurrence');
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const count = (content.match(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count === 0) { showToast('Not found', 'warning'); return; }
    const newContent = content.split(findText).join(replaceText);
    updateContent(newContent);
    showToast(`Replaced ${count} occurrence${count > 1 ? 's' : ''}`);
  };

  // ── Export ──
  const downloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTab.title.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded as TXT');
  };

  const downloadHtml = () => {
    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${currentTab.title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1f2937}h1,h2,h3{color:#111827}code{background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace}blockquote{border-left:3px solid #8b5cf6;margin:8px 0;padding:4px 12px;color:#6b7280}a{color:#8b5cf6}</style></head><body>${renderMarkdown(content)}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTab.title.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded as HTML');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTab.title.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded as Markdown');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!');
  };

  const handleClear = () => {
    if (content && !confirm('Clear this note?')) return;
    updateContent('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      updateContent(content + text);
      showToast('Pasted!');
    } catch { showToast('Use Ctrl+V to paste', 'warning'); }
  };

  // ── Keyboard shortcuts ──
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      downloadTxt();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setFindOpen(true);
    }
  };

  const bgColor = darkMode ? '#1a1a2e' : 'var(--bg-main)';
  const textColor = darkMode ? '#e2e8f0' : 'var(--text-primary)';
  const borderColor = darkMode ? '#334155' : 'var(--border-light)';
  const cardBg = darkMode ? '#16213e' : 'var(--bg-section)';

  const outerStyle = fullscreen ? {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: bgColor, display: 'flex', flexDirection: 'column', padding: '0',
  } : { width: '100%' };

  return (
    <div style={outerStyle} onKeyDown={handleKeyDown}>
      {toast && (
        <div className={`toast ${toast.type}`} style={fullscreen ? { position: 'fixed', top: '16px', right: '16px', zIndex: 10000 } : {}}>
          {toast.message}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: cardBg, border: `1px solid ${borderColor}`,
        borderRadius: fullscreen ? 0 : 'var(--radius-md)',
        padding: '10px 14px', marginBottom: fullscreen ? 0 : '8px',
        display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
      }}>
        {/* Format controls */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={font} onChange={e => setFont(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: bgColor, color: textColor, cursor: 'pointer' }}>
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={fontSize} onChange={e => setFontSize(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: bgColor, color: textColor, cursor: 'pointer', width: '72px' }}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ width: '1px', height: '24px', background: borderColor, flexShrink: 0 }} />

        {/* Action buttons */}
        {[
          { icon: '📋', label: 'Paste', action: handlePaste },
          { icon: '📑', label: 'Copy', action: handleCopy },
          { icon: '🗑️', label: 'Clear', action: handleClear },
          { icon: '🔍', label: 'Find', action: () => setFindOpen(f => !f) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} title={btn.label}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {btn.icon} <span style={{ display: 'none' }}>{btn.label}</span>
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: borderColor, flexShrink: 0 }} />

        {/* Toggle buttons */}
        {[
          { icon: darkMode ? '☀️' : '🌙', label: 'Dark Mode', action: () => setDarkMode(d => !d), active: darkMode },
          { icon: showMarkdown ? '📝' : '👁️', label: showMarkdown ? 'Edit Mode' : 'Preview', action: () => setShowMarkdown(m => !m), active: showMarkdown },
          { icon: '↩️', label: 'Word Wrap', action: () => setWordWrap(w => !w), active: wordWrap },
          { icon: '📊', label: 'Stats', action: () => setShowStats(s => !s), active: showStats },
          { icon: fullscreen ? '🗗' : '⛶', label: fullscreen ? 'Exit Fullscreen' : 'Fullscreen', action: () => setFullscreen(f => !f), active: fullscreen },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} title={btn.label}
            style={{
              padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${btn.active ? '#8b5cf6' : borderColor}`,
              background: btn.active ? 'rgba(139,92,246,0.12)' : 'transparent',
              color: btn.active ? '#8b5cf6' : textColor, cursor: 'pointer', fontSize: '0.85rem',
            }}>
            {btn.icon}
          </button>
        ))}

        {/* Download group */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[
            { label: '⬇ TXT', action: downloadTxt },
            { label: '⬇ HTML', action: downloadHtml },
            { label: '⬇ MD', action: downloadMarkdown },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Find & Replace bar ── */}
      {findOpen && (
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input value={findText} onChange={e => setFindText(e.target.value)}
            placeholder="Find…" onKeyDown={e => e.key === 'Enter' && handleFind()}
            style={{ flex: '1 1 140px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: bgColor, color: textColor, fontSize: '0.85rem' }} />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
            placeholder="Replace with…" onKeyDown={e => e.key === 'Enter' && handleReplace()}
            style={{ flex: '1 1 140px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: bgColor, color: textColor, fontSize: '0.85rem' }} />
          <button onClick={handleFind} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Find</button>
          <button onClick={handleReplace} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Replace</button>
          <button onClick={handleReplaceAll} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Replace All</button>
          <button onClick={() => setFindOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textColor, fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {/* ── Tabs row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        marginBottom: '2px', overflowX: 'auto', paddingBottom: '2px',
      }}>
        {tabs.map(tab => (
          <div key={tab.id}
            onClick={() => { setActiveTab(tab.id); persistTabs(tabs, tab.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              background: tab.id === activeTab ? (darkMode ? '#1e293b' : 'var(--bg-main)') : cardBg,
              border: `1px solid ${borderColor}`,
              borderBottom: tab.id === activeTab ? `1px solid ${darkMode ? '#1e293b' : 'var(--bg-main)'}` : `1px solid ${borderColor}`,
              color: tab.id === activeTab ? (darkMode ? '#e2e8f0' : 'var(--text-primary)') : (darkMode ? '#94a3b8' : 'var(--text-secondary)'),
              fontSize: '0.82rem', fontWeight: tab.id === activeTab ? 600 : 400,
              userSelect: 'none',
            }}>
            {renamingTab === tab.id ? (
              <input
                autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                onBlur={commitRename} onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingTab(null); }}
                onClick={e => e.stopPropagation()}
                style={{ width: '90px', padding: '2px 4px', fontSize: '0.82rem', border: `1px solid #8b5cf6`, borderRadius: '3px', background: bgColor, color: textColor }}
              />
            ) : (
              <span onDoubleClick={e => startRename(tab, e)} title="Double-click to rename">{tab.title}</span>
            )}
            {tab.content.length > 0 && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} title="Unsaved changes indicator" />
            )}
            <button onClick={e => closeTab(tab.id, e)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', lineHeight: 1, padding: '0 2px', opacity: 0.6 }}>
              ✕
            </button>
          </div>
        ))}
        <button onClick={addTab} title="New Tab"
          style={{
            padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            border: `1px solid ${borderColor}`, borderBottom: 'none',
            background: cardBg, color: '#8b5cf6', fontSize: '1rem', fontWeight: 700,
          }}>+</button>
      </div>

      {/* ── Editor / Preview ── */}
      <div style={{
        display: showMarkdown ? 'grid' : 'block',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
        flex: fullscreen ? 1 : undefined,
        minHeight: fullscreen ? 0 : undefined,
      }}>
        {/* Editor pane */}
        <div style={{
          position: 'relative',
          borderRight: showMarkdown ? `1px solid ${borderColor}` : 'none',
        }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => updateContent(e.target.value)}
            placeholder="Start typing… your notes auto-save instantly."
            spellCheck
            style={{
              width: '100%',
              height: fullscreen ? 'calc(100vh - 140px)' : '520px',
              fontFamily: font,
              fontSize: fontSize,
              lineHeight: 1.75,
              padding: '20px',
              background: bgColor,
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: showMarkdown ? '0 0 0 var(--radius-md)' : '0 0 var(--radius-md) var(--radius-md)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowX: wordWrap ? 'hidden' : 'auto',
              caretColor: '#8b5cf6',
            }}
          />
          {/* Auto-save indicator */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px',
            fontSize: '0.7rem', color: darkMode ? '#475569' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Auto-saved
          </div>
        </div>

        {/* Markdown preview pane */}
        {showMarkdown && (
          <div style={{
            height: fullscreen ? 'calc(100vh - 140px)' : '520px',
            padding: '20px',
            background: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '0 0 var(--radius-md) 0',
            overflow: 'auto',
            fontFamily: font,
            fontSize: fontSize,
            lineHeight: 1.75,
            borderLeft: 'none',
          }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<p style="color: #9ca3af; font-style: italic">Markdown preview will appear here…</p>' }}
          />
        )}
      </div>

      {/* ── Stats bar ── */}
      {showStats && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '10px 16px',
          background: cardBg, border: `1px solid ${borderColor}`,
          borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          fontSize: '0.78rem', color: darkMode ? '#94a3b8' : 'var(--text-secondary)',
        }}>
          {[
            { label: 'Words', value: stats.words },
            { label: 'Characters', value: stats.chars },
            { label: 'Lines', value: stats.lines },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Read time', value: `~${stats.readTime} min` },
          ].map(s => (
            <span key={s.label}>
              <strong style={{ color: darkMode ? '#e2e8f0' : 'var(--text-primary)' }}>{s.value}</strong> {s.label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>Ctrl+S to save · Ctrl+F to find</span>
        </div>
      )}

      {/* ── Tips (when empty) ── */}
      {!content && !fullscreen && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px' }}>
          {[
            { icon: '💾', tip: 'Notes auto-save as you type. No login needed.' },
            { icon: '🌙', tip: 'Click the moon icon for dark mode.' },
            { icon: '👁️', tip: 'Toggle Markdown preview with the eye icon.' },
            { icon: '➕', tip: 'Click + to add a new tab. Double-click tabs to rename.' },
          ].map(({ icon, tip }, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${borderColor}`, background: cardBg,
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: '0.82rem', color: darkMode ? '#94a3b8' : 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
