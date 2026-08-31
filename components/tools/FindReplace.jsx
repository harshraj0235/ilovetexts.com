'use client';

import { useState, useMemo, useEffect } from 'react';

export default function FindReplace({ t, lang }) {
  const [input, setInput] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_find_replace_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_find_replace_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { resultText, replaceCount } = useMemo(() => {
    if (!input || !findText) return { resultText: input, replaceCount: 0 };

    try {
      let regexPattern = findText;
      let flags = 'g'; // global replace by default
      if (!matchCase) flags += 'i';

      if (!useRegex) {
        // Escape regex characters if we are NOT using regex
        regexPattern = regexPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      if (wholeWord) {
        regexPattern = `\\b${regexPattern}\\b`;
      }

      const regex = new RegExp(regexPattern, flags);
      const matches = input.match(regex);
      const count = matches ? matches.length : 0;
      
      const newText = input.replace(regex, replaceText);
      
      return { resultText: newText, replaceCount: count };
    } catch (e) {
      // Invalid regex pattern
      return { resultText: input, replaceCount: 0 };
    }
  }, [input, findText, replaceText, useRegex, matchCase, wholeWord]);

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace">
      
      <div className="tool-controls-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Find</label>
            <input 
              type="text" 
              value={findText} 
              onChange={(e) => setFindText(e.target.value)}
              placeholder={useRegex ? "^[a-z]+$" : "Text to find..."}
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', fontFamily: useRegex ? 'monospace' : 'inherit', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Replace With</label>
            <input 
              type="text" 
              value={replaceText} 
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Search Options</label>
          <label style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
            <input 
              type="checkbox" 
              checked={matchCase} 
              onChange={(e) => setMatchCase(e.target.checked)} 
              style={{ width: '18px', height: '18px' }}
            />
            Match Case (Aa)
          </label>
          <label style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
            <input 
              type="checkbox" 
              checked={wholeWord} 
              onChange={(e) => setWholeWord(e.target.checked)} 
              style={{ width: '18px', height: '18px' }}
            />
            Whole Word Match (\b)
          </label>
          <label style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
            <input 
              type="checkbox" 
              checked={useRegex} 
              onChange={(e) => setUseRegex(e.target.checked)} 
              style={{ width: '18px', height: '18px' }}
            />
            Use Regular Expressions (Regex)
          </label>
        </div>

      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Original Text</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your original text here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Modified Text</span>
              {replaceCount > 0 && (
                <span style={{ fontSize: '0.8rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                  {replaceCount} Replacements Made
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCopy} className="action-btn primary">📋 Copy</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={resultText}
            readOnly
            placeholder="Result will appear here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', background: 'var(--bg-section)' }}
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
