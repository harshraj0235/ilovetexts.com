'use client';

import { useState, useMemo, useRef } from 'react';

function isValidBase64(str) {
  try {
    return btoa(atob(str)) === str.replace(/\s/g, '');
  } catch { return false; }
}

export default function Base64EncodeDecode({ t, lang }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode'); // encode | decode
  const [urlSafe, setUrlSafe] = useState(false);
  const [lineBreaks, setLineBreaks] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        // Use TextEncoder for proper UTF-8 handling
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        let base64 = btoa(String.fromCharCode(...bytes));
        if (urlSafe) base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        if (lineBreaks) base64 = base64.match(/.{1,76}/g)?.join('\n') || base64;
        return base64;
      } else {
        let clean = input.trim();
        if (urlSafe) clean = clean.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if missing
        while (clean.length % 4 !== 0) clean += '=';
        const decoded = atob(clean);
        // Try UTF-8 decode
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  }, [input, mode, urlSafe, lineBreaks]);

  const inputIsBase64 = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const clean = input.trim().replace(/-/g, '+').replace(/_/g, '/');
      atob(clean.padEnd(clean.length + (4 - clean.length % 4) % 4, '='));
      return true;
    } catch { return false; }
  }, [input]);

  // Stats
  const stats = useMemo(() => {
    if (!input || !output) return null;
    const inputBytes = new Blob([input]).size;
    const outputBytes = new Blob([output]).size;
    const ratio = mode === 'encode' ? ((outputBytes / inputBytes) * 100).toFixed(0) : ((outputBytes / inputBytes) * 100).toFixed(0);
    return { inputBytes, outputBytes, ratio };
  }, [input, output, mode]);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    if (mode === 'encode') {
      reader.onload = (ev) => {
        // Convert file to base64
        const base64 = ev.target.result.split(',')[1];
        setInput(file.name);
        // Show the base64 directly in output by putting file content as input
        const fr2 = new FileReader();
        fr2.onload = (ev2) => setInput(ev2.target.result);
        fr2.readAsText(file);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (ev) => setInput(ev.target.result);
      reader.readAsText(file);
    }
    e.target.value = '';
    showToast(`Loaded ${file.name}`);
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

        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${urlSafe ? 'var(--brand-color)' : 'var(--border-light)'}`, background: urlSafe ? 'rgba(139,92,246,0.08)' : 'var(--bg-white)', fontWeight: 600, color: urlSafe ? 'var(--brand-color)' : 'var(--text-secondary)' }}>
          <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} style={{ display: 'none' }} />
          🌐 URL-Safe
        </label>
        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${lineBreaks ? 'var(--brand-color)' : 'var(--border-light)'}`, background: lineBreaks ? 'rgba(139,92,246,0.08)' : 'var(--bg-white)', fontWeight: 600, color: lineBreaks ? 'var(--brand-color)' : 'var(--text-secondary)' }}>
          <input type="checkbox" checked={lineBreaks} onChange={(e) => setLineBreaks(e.target.checked)} style={{ display: 'none' }} />
          ↩️ Line Breaks (76 chars)
        </label>

        {inputIsBase64 !== null && mode === 'encode' && (
          <span style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '12px', background: inputIsBase64 ? 'rgba(245,158,11,0.1)' : 'transparent', color: inputIsBase64 ? '#f59e0b' : 'transparent', fontWeight: 600 }}>
            {inputIsBase64 ? '⚠️ Input looks like Base64 — did you mean to decode?' : ''}
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-section)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Input: </span>
            <strong>{stats.inputBytes.toLocaleString()} bytes</strong>
          </div>
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-section)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Output: </span>
            <strong>{stats.outputBytes.toLocaleString()} bytes</strong>
          </div>
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: mode === 'encode' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${mode === 'encode' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Size: </span>
            <strong style={{ color: mode === 'encode' ? '#ef4444' : '#10b981' }}>{stats.ratio}%</strong>
            <span style={{ color: 'var(--text-tertiary)' }}> {mode === 'encode' ? '(+33% overhead)' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '📝 Plain Text' : '🔐 Base64 Input'}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📋 Paste</button>
              <button onClick={() => fileInputRef.current?.click()} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📁 File</button>
              <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
              <input ref={fileInputRef} type="file" accept=".txt,.json,.csv,.md,.html,.xml,.base64" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Type or paste text to encode...' : 'Paste Base64 string to decode...'}
            spellCheck="false"
            style={{ height: '450px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem' }}
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
            <span style={{ fontWeight: '600' }}>{mode === 'encode' ? '🔐 Base64 Output' : '📝 Decoded Text'}</span>
            <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy</button>
          </div>
          <textarea
            className="code-editor"
            value={output}
            readOnly
            placeholder="Result will appear here..."
            spellCheck="false"
            style={{ height: '450px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem', background: 'var(--bg-section)' }}
          />
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
