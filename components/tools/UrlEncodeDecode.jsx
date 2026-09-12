'use client';

import { useState, useMemo, useRef } from 'react';

export default function UrlEncodeDecode({ t, lang }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode'); // encode | decode
  const [componentOnly, setComponentOnly] = useState(true);
  const [toast, setToast] = useState(null);
  
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        return componentOnly ? encodeURIComponent(input) : encodeURI(input);
      } else {
        return componentOnly ? decodeURIComponent(input) : decodeURI(input);
      }
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  }, [input, mode, componentOnly]);

  const parsedQuery = useMemo(() => {
    try {
      const urlToParse = mode === 'decode' ? output : input;
      if (!urlToParse.includes('?')) return null;
      
      const queryString = urlToParse.split('?')[1].split('#')[0];
      const params = new URLSearchParams(queryString);
      const entries = Array.from(params.entries());
      if (entries.length === 0) return null;
      
      return entries;
    } catch {
      return null;
    }
  }, [input, output, mode]);

  const inputLooksEncoded = useMemo(() => {
    if (!input.trim()) return null;
    return /%[0-9A-Fa-f]{2}/.test(input);
  }, [input]);

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

        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${componentOnly ? 'var(--brand-color)' : 'var(--border-light)'}`, background: componentOnly ? 'rgba(139,92,246,0.08)' : 'var(--bg-white)', fontWeight: 600, color: componentOnly ? 'var(--brand-color)' : 'var(--text-secondary)' }} title="Encodes everything, including /, ?, &, =. Useful for query parameters.">
          <input type="checkbox" checked={componentOnly} onChange={(e) => setComponentOnly(e.target.checked)} style={{ display: 'none' }} />
          🧩 Encode URI Component
        </label>

        {inputLooksEncoded && mode === 'encode' && (
          <span style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
            ⚠️ Input looks encoded already — did you mean to decode?
          </span>
        )}
      </div>

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'start', marginBottom: '24px' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '📝 Plain Text / URL' : '🔐 Encoded URL'}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📋 Paste</button>
              <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Type or paste a URL to encode...\n\nExample: https://example.com/search?q=hello world' : 'Paste an encoded URL...'}
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
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '🔐 Encoded URL' : '📝 Decoded URL'}</span>
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

      {/* ── Parsed Query Parameters ── */}
      {parsedQuery && (
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔍 Parsed Query Parameters</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>{parsedQuery.length} parameter{parsedQuery.length > 1 ? 's' : ''} found</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Key</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {parsedQuery.map(([key, val], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--brand-color)', fontWeight: 600 }}>{key}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
