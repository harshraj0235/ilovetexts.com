'use client';

import { useState, useMemo, useEffect } from 'react';

export default function RegexTester({ t, lang }) {
  const [input, setInput] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [flags, setFlags] = useState('g');
  
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_regex_input');
      const savedPattern = localStorage.getItem('ilovetexts_regex_pattern');
      if (savedInput) setInput(savedInput);
      if (savedPattern) setRegexPattern(savedPattern);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_regex_input', input);
      localStorage.setItem('ilovetexts_regex_pattern', regexPattern);
    }
  }, [input, regexPattern]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { matches, error } = useMemo(() => {
    if (!regexPattern) return { matches: [], error: null };

    try {
      const regex = new RegExp(regexPattern, flags);
      const matchResults = [];
      let match;
      
      if (flags.includes('g')) {
        while ((match = regex.exec(input)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++; // Prevent infinite loops on zero-width matches
          }
          matchResults.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      } else {
        match = regex.exec(input);
        if (match) {
          matchResults.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }
      return { matches: matchResults, error: null };
    } catch (e) {
      return { matches: [], error: e.message };
    }
  }, [input, regexPattern, flags]);

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const getHighlightedText = () => {
    if (!regexPattern || error || matches.length === 0) return input;

    // We must escape HTML in the input before injecting <mark> tags to prevent XSS
    // Actually, since we render via React dangerouslySetInnerHTML or carefully map, 
    // we can just map it safely.
    
    let lastIndex = 0;
    const parts = [];
    
    matches.forEach((m, i) => {
      // Push text before match
      if (m.index > lastIndex) {
        parts.push(input.substring(lastIndex, m.index));
      }
      // Push matched text wrapped in mark
      parts.push(
        <mark key={i} style={{ background: i % 2 === 0 ? '#93c5fd' : '#fca5a5', color: '#000', borderRadius: '2px', padding: '0 2px' }}>
          {m.value}
        </mark>
      );
      lastIndex = m.index + m.value.length;
    });

    // Push remaining text
    if (lastIndex < input.length) {
      parts.push(input.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="tool-workspace">
      
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Regular Expression</label>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-white)', padding: '12px', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)' }}>
          <span style={{ fontSize: '1.4rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>/</span>
          <input 
            type="text" 
            value={regexPattern} 
            onChange={(e) => setRegexPattern(e.target.value)}
            placeholder="[a-zA-Z0-9]+"
            style={{ flex: 1, fontSize: '1.2rem', fontFamily: 'monospace', border: 'none', outline: 'none', background: 'transparent', color: 'var(--brand-color)' }}
          />
          <span style={{ fontSize: '1.4rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>/</span>
          <input 
            type="text" 
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            style={{ width: '60px', fontSize: '1.2rem', fontFamily: 'monospace', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-secondary)' }}
          />
        </div>

        {error && (
          <div style={{ marginTop: '12px', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={flags.includes('g')} onChange={() => toggleFlag('g')} />
            Global (g)
          </label>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={flags.includes('i')} onChange={() => toggleFlag('i')} />
            Case Insensitive (i)
          </label>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={flags.includes('m')} onChange={() => toggleFlag('m')} />
            Multiline (m)
          </label>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Test String</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your test text here..."
            spellCheck="false"
            style={{ height: '400px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Match Result</span>
              {matches.length > 0 && (
                <span style={{ fontSize: '0.8rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                  {matches.length} Match{matches.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
          <div 
            style={{ 
              height: '400px', 
              resize: 'vertical', 
              background: 'var(--bg-section)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px', 
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '1rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)'
            }}
          >
            {!regexPattern || error ? (
              <span style={{ color: 'var(--text-tertiary)' }}>{input || 'Waiting for input...'}</span>
            ) : (
              getHighlightedText()
            )}
          </div>
        </div>
      </div>

      {/* MATCH DETAILS TABLE */}
      {matches.length > 0 && (
        <div style={{ marginTop: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: '600' }}>
            Match Details
          </div>
          <div style={{ overflowX: 'auto', padding: '16px 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>#</th>
                  <th style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Match</th>
                  <th style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Index</th>
                  <th style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Groups</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 0', color: 'var(--text-tertiary)' }}>{i + 1}</td>
                    <td style={{ padding: '12px 0', fontFamily: 'monospace', fontWeight: 'bold' }}>{m.value}</td>
                    <td style={{ padding: '12px 0', fontFamily: 'monospace' }}>{m.index} - {m.index + m.value.length}</td>
                    <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'var(--brand-color)' }}>
                      {m.groups && m.groups.length > 0 && m.groups[0] !== undefined ? m.groups.join(', ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
