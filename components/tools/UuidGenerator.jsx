'use client';

import { useState } from 'react';

export default function UuidGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState('v4'); // Currently only supporting v4 for simplicity and speed
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [uuids, setUuids] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateUuids = () => {
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 1 || num > 50000) {
      showToast('Please enter a valid number between 1 and 50,000', 'warning');
      return;
    }

    const results = [];
    for (let i = 0; i < num; i++) {
      let uuid = crypto.randomUUID();
      if (uppercase) uuid = uuid.toUpperCase();
      if (noHyphens) uuid = uuid.replace(/-/g, '');
      results.push(uuid);
    }
    setUuids(results);
  };

  const handleCopy = async () => {
    if (uuids.length === 0) return;
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  const handleDownload = () => {
    if (uuids.length === 0) return;
    const txtContent = "data:text/plain;charset=utf-8," + uuids.join("\n");
    const encodedUri = encodeURI(txtContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `uuids_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('TXT downloaded!');
  };

  return (
    <div className="tool-workspace uuid-workspace" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>🆔</span> Bulk UUID (v4) Generator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>How many to generate?</label>
            <input 
              type="number" 
              min="1" 
              max="50000"
              value={count} 
              onChange={(e) => setCount(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Max: 50,000</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Formatting Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={uppercase} 
                  onChange={(e) => setUppercase(e.target.checked)} 
                  style={{ width: '18px', height: '18px' }}
                />
                Uppercase (A-F)
              </label>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={noHyphens} 
                  onChange={(e) => setNoHyphens(e.target.checked)} 
                  style={{ width: '18px', height: '18px' }}
                />
                Remove Hyphens
              </label>
            </div>
          </div>
        </div>

        <button 
          onClick={generateUuids}
          className="action-btn primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          🚀 Generate UUIDs
        </button>
      </div>

      <div className="editor-pane" style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="pane-header" style={{ padding: '16px 24px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Generated Output</span>
            {uuids.length > 0 && (
              <span style={{ fontSize: '0.85rem', background: 'var(--brand-color)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                {uuids.length.toLocaleString()} UUIDs
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDownload} className="action-btn" title="Download TXT">⬇️ Download</button>
            <button onClick={handleCopy} className="action-btn primary">📋 Copy All</button>
          </div>
        </div>
        <textarea
          className="code-editor"
          value={uuids.join('\n')}
          readOnly
          placeholder="Your UUIDs will appear here..."
          spellCheck="false"
          style={{ width: '100%', height: '400px', padding: '24px', fontSize: '1.1rem', fontFamily: 'monospace', border: 'none', background: 'transparent', resize: 'vertical' }}
        />
      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
