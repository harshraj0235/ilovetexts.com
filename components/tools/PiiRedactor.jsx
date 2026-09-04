'use client';

import { useState, useMemo, useEffect } from 'react';

export default function PiiRedactor({ t, lang }) {
  const [input, setInput] = useState('');
  
  const [redactEmails, setRedactEmails] = useState(true);
  const [redactPhones, setRedactPhones] = useState(true);
  const [redactIPs, setRedactIPs] = useState(true);
  const [redactCards, setRedactCards] = useState(true);
  const [redactUrls, setRedactUrls] = useState(false);
  const [replacementChar, setReplacementChar] = useState('block'); // 'block', 'asterisk', 'tag'

  const [toast, setToast] = useState(null);

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

  const { redactedText, redactCount } = useMemo(() => {
    if (!input) return { redactedText: '', redactCount: 0 };

    let text = input;
    let count = 0;

    const getReplacement = (type, original) => {
      count++;
      if (replacementChar === 'tag') return `[REDACTED_${type}]`;
      if (replacementChar === 'asterisk') return '*'.repeat(original.length);
      return '█'.repeat(original.length);
    };

    // 1. Credit Cards (roughly 13-19 digits, with spaces or dashes)
    if (redactCards) {
      const cardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
      text = text.replace(cardRegex, (match) => getReplacement('CARD', match));
    }

    // 2. Emails
    if (redactEmails) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      text = text.replace(emailRegex, (match) => getReplacement('EMAIL', match));
    }

    // 3. IPs (IPv4)
    if (redactIPs) {
      const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
      text = text.replace(ipRegex, (match) => getReplacement('IP', match));
    }

    // 4. Phone Numbers (US/International rough match)
    if (redactPhones) {
      const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
      text = text.replace(phoneRegex, (match) => getReplacement('PHONE', match));
    }

    // 5. URLs
    if (redactUrls) {
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      text = text.replace(urlRegex, (match) => getReplacement('URL', match));
    }

    return { redactedText: text, redactCount: count };
  }, [input, redactEmails, redactPhones, redactIPs, redactCards, redactUrls, replacementChar]);

  const handleCopy = async () => {
    if (!redactedText) return;
    try {
      await navigator.clipboard.writeText(redactedText);
      showToast('Copied safe text to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace">
      
      {/* SETTINGS PANEL */}
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>🛡️</span> PII Detection Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Data Types to Redact</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={redactEmails} onChange={e => setRedactEmails(e.target.checked)} /> 📧 Emails
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={redactPhones} onChange={e => setRedactPhones(e.target.checked)} /> 📱 Phone Numbers
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={redactIPs} onChange={e => setRedactIPs(e.target.checked)} /> 🌐 IP Addresses
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={redactCards} onChange={e => setRedactCards(e.target.checked)} /> 💳 Credit Cards
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={redactUrls} onChange={e => setRedactUrls(e.target.checked)} /> 🔗 URLs / Links
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Replacement Style</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-white)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', transition: 'border-color 0.2s, box-shadow 0.2s', ...(replacementChar === 'block' ? {borderColor: 'var(--brand-color)', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'} : {}) }}>
                <input type="radio" name="repl" value="block" checked={replacementChar === 'block'} onChange={() => setReplacementChar('block')} />
                Solid Blocks (████████)
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-white)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', transition: 'border-color 0.2s, box-shadow 0.2s', ...(replacementChar === 'asterisk' ? {borderColor: 'var(--brand-color)', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'} : {}) }}>
                <input type="radio" name="repl" value="asterisk" checked={replacementChar === 'asterisk'} onChange={() => setReplacementChar('asterisk')} />
                Asterisks (********)
              </label>
              <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-white)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', transition: 'border-color 0.2s, box-shadow 0.2s', ...(replacementChar === 'tag' ? {borderColor: 'var(--brand-color)', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'} : {}) }}>
                <input type="radio" name="repl" value="tag" checked={replacementChar === 'tag'} onChange={() => setReplacementChar('tag')} />
                Label Tags ([REDACTED_EMAIL])
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* DUAL PANE UI */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span> 
              Original Text (Unsafe)
            </span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your logs, emails, or code here. Sensitive data will be instantly redacted on the right..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', border: '2px dashed #ef4444', background: 'var(--bg-white)', transition: 'box-shadow 0.2s' }}
            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)'}
            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> 
                Redacted Text (Safe)
              </span>
              {redactCount > 0 && (
                <span style={{ fontSize: '0.85rem', background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '16px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}>
                  {redactCount} PII Found & Redacted
                </span>
              )}
            </div>
            <button 
              onClick={handleCopy} 
              className="action-btn primary" 
              style={{ background: '#10b981', borderColor: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)'; }}
            >
              📋 Copy Safe Text
            </button>
          </div>
          <textarea
            className="code-editor"
            value={redactedText}
            readOnly
            placeholder="Redacted output will appear here. Safe to paste into ChatGPT."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', background: '#f8fafc', border: '2px solid #10b981', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}
          />
        </div>

      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
