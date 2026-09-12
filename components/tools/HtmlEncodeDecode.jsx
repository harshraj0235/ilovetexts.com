'use client';

import { useState, useMemo } from 'react';

// Encode specific sets
function encodeBasicHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
}

function encodeAllAscii(str) {
  return str.split('').map(c => {
    const code = c.charCodeAt(0);
    if (code > 127) return c; // keep unicode as is
    return `&#${code};`;
  }).join('');
}

function encodeAllUnicode(str) {
  return Array.from(str).map(c => `&#${c.codePointAt(0)};`).join('');
}

function decodeHtmlEntities(str) {
  // We use a DOM parser to decode all entities safely in browser
  if (typeof window === 'undefined') return str;
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return doc.documentElement.textContent;
}

export default function HtmlEncodeDecode({ t, lang }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode'); // encode | decode
  const [encodeLevel, setEncodeLevel] = useState('basic'); // basic | ascii | all
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        if (encodeLevel === 'basic') return encodeBasicHtml(input);
        if (encodeLevel === 'ascii') return encodeAllAscii(input);
        return encodeAllUnicode(input);
      } else {
        return decodeHtmlEntities(input);
      }
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  }, [input, mode, encodeLevel]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      showToast('Copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      showToast('Pasted!');
    } catch { showToast('Use Ctrl+V to paste', 'warning'); }
  };

  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="tool-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Mode Toggle + Options ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-section)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button onClick={() => setMode('encode')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              background: mode === 'encode' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'encode' ? '#fff' : 'var(--text-secondary)' }}>
            🔒 Encode
          </button>
          <button onClick={() => setMode('decode')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              background: mode === 'decode' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'decode' ? '#fff' : 'var(--text-secondary)' }}>
            🔓 Decode
          </button>
        </div>

        {mode === 'encode' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Level:</label>
            <select value={encodeLevel} onChange={(e) => setEncodeLevel(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <option value="basic">Basic ( &lt; &gt; &amp; &quot; &apos; )</option>
              <option value="ascii">All ASCII to Entities</option>
              <option value="all">All Characters (incl. Unicode)</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'start', marginBottom: '24px' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '📝 Plain HTML / Text' : '🔐 HTML Entities'}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📋 Paste</button>
              <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Type HTML or text to encode...\n\nExample: <h1>Hello World & Friends!</h1>' : 'Paste encoded HTML entities...\n\nExample: &lt;h1&gt;Hello World &amp; Friends!&lt;/h1&gt;'}
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem' }}
          />
        </div>

        {/* Swap Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' }}>
          <button onClick={handleSwap}
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--border-light)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            title="Swap input/output"
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
          >
            ⇄
          </button>
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '🔐 HTML Entities' : '📝 Decoded HTML / Text'}</span>
            <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy</button>
          </div>
          <textarea
            className="code-editor"
            value={output}
            readOnly
            placeholder="Result will appear here..."
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem', background: 'var(--bg-section)' }}
          />
        </div>
      </div>

      {/* ── Rendered Preview ── */}
      {output && mode === 'decode' && (
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
            👁️ Rendered HTML Preview
          </div>
          <div 
            style={{ padding: '20px', background: '#fff', color: '#000', minHeight: '100px', overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: output }}
          />
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
