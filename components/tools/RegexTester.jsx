'use client';

import { useState, useMemo, useEffect } from 'react';

// ─── Common Regex Patterns Library ────────────────────────────────────────────
const COMMON_PATTERNS = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', desc: 'Match email addresses' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s]+', desc: 'Match HTTP/HTTPS URLs' },
  { label: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', desc: 'Match IPv4 addresses' },
  { label: 'Phone (US)', pattern: '(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}', desc: 'Match US phone numbers' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', desc: 'Match ISO dates' },
  { label: 'Time (HH:MM)', pattern: '\\b(?:[01]?\\d|2[0-3]):[0-5]\\d\\b', desc: 'Match 24h time' },
  { label: 'Hex Color', pattern: '#[0-9a-fA-F]{3,8}\\b', desc: 'Match HEX colors' },
  { label: 'HTML Tag', pattern: '<[^>]+>', desc: 'Match HTML tags' },
  { label: 'Credit Card', pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b', desc: 'Match credit card numbers' },
  { label: 'SSN', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', desc: 'Match US Social Security Numbers' },
  { label: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', desc: 'Match UUID v4 strings' },
  { label: 'Integer', pattern: '\\b\\d+\\b', desc: 'Match whole numbers' },
  { label: 'Decimal', pattern: '\\b\\d+\\.\\d+\\b', desc: 'Match decimal numbers' },
  { label: 'Whitespace Lines', pattern: '^\\s*$', desc: 'Match blank/whitespace-only lines' },
  { label: 'Markdown Link', pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)', desc: 'Match [text](url) links' },
];

export default function RegexTester({ t, lang }) {
  const [input, setInput] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceWith, setReplaceWith] = useState('');
  const [showPatterns, setShowPatterns] = useState(false);
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

  const { matches, error, execTimeMs } = useMemo(() => {
    if (!regexPattern) return { matches: [], error: null, execTimeMs: 0 };

    try {
      const start = performance.now();
      const regex = new RegExp(regexPattern, flags);
      const matchResults = [];
      let match;
      
      if (flags.includes('g')) {
        let safety = 0;
        while ((match = regex.exec(input)) !== null && safety < 10000) {
          if (match[0].length === 0) { regex.lastIndex++; }
          matchResults.push({ value: match[0], index: match.index, groups: match.slice(1) });
          safety++;
        }
      } else {
        match = regex.exec(input);
        if (match) {
          matchResults.push({ value: match[0], index: match.index, groups: match.slice(1) });
        }
      }
      const execTimeMs = (performance.now() - start).toFixed(2);
      return { matches: matchResults, error: null, execTimeMs };
    } catch (e) {
      return { matches: [], error: e.message, execTimeMs: 0 };
    }
  }, [input, regexPattern, flags]);

  const replacedText = useMemo(() => {
    if (!replaceMode || !regexPattern || error) return '';
    try {
      const regex = new RegExp(regexPattern, flags);
      return input.replace(regex, replaceWith);
    } catch { return ''; }
  }, [input, regexPattern, flags, replaceWith, replaceMode, error]);

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) setFlags(flags.replace(flag, ''));
    else setFlags(flags + flag);
  };

  const getHighlightedText = () => {
    if (!regexPattern || error || matches.length === 0) return input;
    
    let lastIndex = 0;
    const parts = [];
    const colors = ['#93c5fd', '#fca5a5', '#86efac', '#fcd34d', '#c4b5fd'];
    
    matches.forEach((m, i) => {
      if (m.index > lastIndex) parts.push(input.substring(lastIndex, m.index));
      parts.push(
        <mark key={i} style={{ background: colors[i % colors.length], color: '#000', borderRadius: '2px', padding: '0 2px' }}>
          {m.value}
        </mark>
      );
      lastIndex = m.index + m.value.length;
    });

    if (lastIndex < input.length) parts.push(input.substring(lastIndex));
    return parts;
  };

  const handleCopyMatches = async () => {
    if (matches.length === 0) return;
    try {
      await navigator.clipboard.writeText(matches.map(m => m.value).join('\n'));
      showToast('Matches copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleCopyReplaced = async () => {
    if (!replacedText) return;
    try {
      await navigator.clipboard.writeText(replacedText);
      showToast('Replaced text copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const applyPattern = (pattern) => {
    setRegexPattern(pattern.pattern);
    setShowPatterns(false);
    showToast(`Applied: ${pattern.label}`);
  };

  return (
    <div className="tool-workspace">
      
      {/* ── Regex Input Bar ── */}
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <label style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Regular Expression</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowPatterns(!showPatterns)} 
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: showPatterns ? 'rgba(139,92,246,0.1)' : 'var(--bg-white)', color: showPatterns ? '#8b5cf6' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              📚 Patterns Library
            </button>
            <button onClick={() => setReplaceMode(!replaceMode)}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${replaceMode ? '#10b981' : 'var(--border-light)'}`, background: replaceMode ? 'rgba(16,185,129,0.1)' : 'var(--bg-white)', color: replaceMode ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              🔄 Replace Mode
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-white)', padding: '12px', borderRadius: 'var(--radius-md)', border: `2px solid ${error ? '#ef4444' : 'var(--border-light)'}`, marginBottom: '12px' }}>
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

        {replaceMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, flexShrink: 0 }}>Replace with:</span>
            <input 
              type="text" 
              value={replaceWith} 
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="replacement text ($1, $2 for groups)"
              style={{ flex: 1, fontSize: '1rem', fontFamily: 'monospace', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <button onClick={handleCopyReplaced} className="action-btn" style={{ fontSize: '0.82rem', flexShrink: 0 }}>📋 Copy Result</button>
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { flag: 'g', label: 'Global' },
            { flag: 'i', label: 'Case Insensitive' },
            { flag: 'm', label: 'Multiline' },
            { flag: 's', label: 'Dotall' },
            { flag: 'u', label: 'Unicode' },
          ].map(f => (
            <button key={f.flag} onClick={() => toggleFlag(f.flag)}
              style={{
                padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                border: flags.includes(f.flag) ? '2px solid var(--brand-color)' : '1px solid var(--border-light)',
                background: flags.includes(f.flag) ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: flags.includes(f.flag) ? 'var(--brand-color)' : 'var(--text-tertiary)',
              }}>
              {f.flag} — {f.label}
            </button>
          ))}
          
          {matches.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{execTimeMs}ms</span>
              <span style={{ fontSize: '0.82rem', background: 'var(--brand-color)', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                {matches.length} Match{matches.length !== 1 ? 'es' : ''}
              </span>
              <button onClick={handleCopyMatches} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📋 Copy Matches</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Patterns Library ── */}
      {showPatterns && (
        <div style={{ background: 'var(--bg-section)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--border-light)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Click to Apply Pattern</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {COMMON_PATTERNS.map(p => (
              <button key={p.label} onClick={() => applyPattern(p)}
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                  background: 'var(--bg-white)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-white)'; }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Editor Grid ── */}
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
            <span style={{ fontWeight: '600' }}>{replaceMode ? 'Replace Result' : 'Match Highlighting'}</span>
          </div>
          {replaceMode ? (
            <textarea
              className="code-editor"
              value={replacedText}
              readOnly
              placeholder="Replaced result will appear here..."
              spellCheck="false"
              style={{ height: '400px', resize: 'vertical', background: 'rgba(16,185,129,0.03)' }}
            />
          ) : (
            <div style={{ 
              height: '400px', resize: 'vertical', background: 'var(--bg-section)', 
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', 
              padding: '16px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '1rem',
              lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary)'
            }}>
              {!regexPattern || error ? (
                <span style={{ color: 'var(--text-tertiary)' }}>{input || 'Waiting for input...'}</span>
              ) : getHighlightedText()}
            </div>
          )}
        </div>
      </div>

      {/* ── Match Details Table ── */}
      {matches.length > 0 && (
        <div style={{ marginTop: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Match Details</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{matches.length} total</span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', position: 'sticky', top: 0, background: 'var(--bg-section)' }}>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Match</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Position</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Length</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Groups</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 200).map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-tertiary)' }}>{i + 1}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 'bold', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.value}>{m.value}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{m.index}–{m.index + m.value.length}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{m.value.length}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--brand-color)' }}>
                      {m.groups && m.groups.length > 0 && m.groups[0] !== undefined ? m.groups.join(', ') : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Regex Cheatsheet ── */}
      <div style={{ marginTop: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: '600' }}>
          📖 Regex Cheatsheet
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', padding: '24px' }}>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Character Classes</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>.</code> any character except newline</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>\w\d\s</code> word, digit, whitespace</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>\W\D\S</code> not word, digit, whitespace</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>[abc]</code> any of a, b, or c</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>[^abc]</code> not a, b, or c</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>[a-g]</code> character between a & g</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Anchors</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>^abc$</code> start / end of the string</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>\b</code> word boundary</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>\B</code> not a word boundary</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Quantifiers</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>a*a+a?</code> 0 or more, 1 or more, 0 or 1</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>a{'{'}5{'}'}a{'{'}2,{'}'}</code> exactly five, two or more</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>a{'{'}1,3{'}'}</code> between one & three</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>a+?a{'{'}2,{'}'}?</code> match as few as possible</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Groups & Lookaround</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>(abc)</code> capture group</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>(?:abc)</code> non-capturing group</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>(?=abc)</code> positive lookahead</li>
              <li><code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>(?!abc)</code> negative lookahead</li>
            </ul>
          </div>
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
