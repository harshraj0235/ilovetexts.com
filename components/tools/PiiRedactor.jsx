'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// ─── PII detection patterns ───────────────────────────────────────────────────
const PII_CATEGORIES = {
  emails:  { label: 'Emails',       icon: '📧', color: '#ef4444', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  phones:  { label: 'Phone Numbers', icon: '📱', color: '#f59e0b', regex: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g },
  ips:     { label: 'IP Addresses',  icon: '🌐', color: '#3b82f6', regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g },
  cards:   { label: 'Credit Cards',  icon: '💳', color: '#8b5cf6', regex: /\b(?:\d[ -]*?){13,16}\b/g },
  urls:    { label: 'URLs',          icon: '🔗', color: '#0ea5e9', regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g },
  ssn:     { label: 'SSN',           icon: '🔒', color: '#ec4899', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  apiKeys: { label: 'API Keys',      icon: '🔑', color: '#10b981', regex: /\b(?:sk|pk|api|key|token|secret|bearer)[_-]?[a-zA-Z0-9]{20,}\b/gi },
};

export default function PiiRedactor({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [replacementChar, setReplacementChar] = useState('block'); // block, asterisk, tag, custom
  const [customReplacement, setCustomReplacement] = useState('[REDACTED]');
  const fileInputRef = useRef(null);

  // Per-category toggles
  const [enabled, setEnabled] = useState({
    emails: true, phones: true, ips: true, cards: true, urls: false, ssn: true, apiKeys: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_pii_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_pii_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Compute redacted output + per-category counts
  const { redactedText, totalCount, categoryCounts } = useMemo(() => {
    if (!input) return { redactedText: '', totalCount: 0, categoryCounts: {} };

    let text = input;
    let total = 0;
    const counts = {};

    const getReplacement = (type, original) => {
      total++;
      if (!counts[type]) counts[type] = 0;
      counts[type]++;
      if (replacementChar === 'tag') return `[REDACTED_${type.toUpperCase()}]`;
      if (replacementChar === 'asterisk') return '*'.repeat(original.length);
      if (replacementChar === 'custom') return customReplacement;
      return '█'.repeat(original.length);
    };

    // Process in order: cards first (longer patterns), then others
    const order = ['cards', 'ssn', 'apiKeys', 'emails', 'ips', 'phones', 'urls'];
    for (const key of order) {
      if (!enabled[key]) continue;
      const cat = PII_CATEGORIES[key];
      // Reset lastIndex for global regex
      const regex = new RegExp(cat.regex.source, cat.regex.flags);
      text = text.replace(regex, (match) => getReplacement(key, match));
    }

    return { redactedText: text, totalCount: total, categoryCounts: counts };
  }, [input, enabled, replacementChar, customReplacement]);

  const handleCopy = async () => {
    if (!redactedText) return;
    try {
      await navigator.clipboard.writeText(redactedText);
      showToast('Copied safe text to clipboard!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleDownload = () => {
    if (!redactedText) return;
    const blob = new Blob([redactedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `redacted_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast('Redacted file downloaded!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInput(ev.target.result);
      showToast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleCategory = (key) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="tool-workspace">
      
      {/* ── Stats Dashboard ── */}
      {totalCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(16,185,129,0.08)', padding: '16px', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>🛡️</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{totalCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Redacted</div>
          </div>
          {Object.entries(categoryCounts).map(([key, count]) => {
            const cat = PII_CATEGORIES[key];
            return (
              <div key={key} style={{
                background: `${cat.color}10`, padding: '16px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${cat.color}40`, textAlign: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: cat.color }}>{count}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Settings Panel ── */}
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Types to Redact</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(PII_CATEGORIES).map(([key, cat]) => (
                <button key={key} onClick={() => toggleCategory(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                    border: enabled[key] ? `2px solid ${cat.color}` : '1px solid var(--border-light)',
                    background: enabled[key] ? `${cat.color}15` : 'var(--bg-white)',
                    color: enabled[key] ? cat.color : 'var(--text-tertiary)',
                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                  }}>
                  <span>{cat.icon}</span> {cat.label}
                  {categoryCounts[key] > 0 && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({categoryCounts[key]})</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Replacement Style</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { id: 'block', label: '████████', desc: 'Solid Blocks' },
                { id: 'asterisk', label: '********', desc: 'Asterisks' },
                { id: 'tag', label: '[REDACTED_...]', desc: 'Labels' },
                { id: 'custom', label: 'Custom', desc: 'Custom text' },
              ].map(style => (
                <button key={style.id} onClick={() => setReplacementChar(style.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: replacementChar === style.id ? '2px solid var(--brand-color)' : '1px solid var(--border-light)',
                    background: replacementChar === style.id ? 'rgba(139,92,246,0.1)' : 'var(--bg-white)',
                    color: replacementChar === style.id ? 'var(--brand-color)' : 'var(--text-secondary)',
                    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                  }}>
                  {style.desc}
                </button>
              ))}
            </div>
            {replacementChar === 'custom' && (
              <input type="text" value={customReplacement} onChange={(e) => setCustomReplacement(e.target.value)}
                placeholder="Enter replacement text..." 
                style={{ marginTop: '10px', width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', fontSize: '0.9rem' }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Dual Pane UI ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span> 
              Original Text (Unsafe)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => fileInputRef.current?.click()} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📁 File</button>
              <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
              <input ref={fileInputRef} type="file" accept=".txt,.csv,.log,.json,.md,.html" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste your logs, emails, or code here…\n\nExample:\nContact john@example.com or call +1 (555) 123-4567\nServer IP: 192.168.1.100\nAPI Key: generic_api_key_xyz123"}
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', border: '2px dashed #ef4444', background: 'var(--bg-white)' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> 
                Redacted Text (Safe)
              </span>
              {totalCount > 0 && (
                <span style={{ fontSize: '0.8rem', background: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {totalCount} Redacted
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleDownload} className="action-btn" style={{ fontSize: '0.82rem' }}>⬇️ Download</button>
              <button onClick={handleCopy} className="action-btn primary" style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.82rem' }}>📋 Copy Safe</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={redactedText}
            readOnly
            placeholder="Redacted output will appear here. Safe to paste into ChatGPT, Slack, or emails."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', background: '#f8fafc', border: '2px solid #10b981' }}
          />
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
