'use client';

import { useState, useMemo, useEffect } from 'react';

export default function PromptMinifier({ t, lang }) {
  const [input, setInput] = useState('');
  
  const [removeNewlines, setRemoveNewlines] = useState(true);
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [removeFillerWords, setRemoveFillerWords] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_prompt_minifier_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_prompt_minifier_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { minifiedText, originalTokens, newTokens, savingsPct } = useMemo(() => {
    if (!input) return { minifiedText: '', originalTokens: 0, newTokens: 0, savingsPct: 0 };

    let text = input;

    if (removeComments) {
      // Remove // comments and # comments (rough approximation for prompts containing code)
      text = text.replace(/^\s*\/\/.*$/gm, '');
      text = text.replace(/^\s*#.*$/gm, '');
      text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    if (removeNewlines) {
      // Replace all newlines with a single space
      text = text.replace(/\r?\n|\r/g, ' ');
    }

    if (removeExtraSpaces) {
      // Replace multiple spaces/tabs with a single space
      text = text.replace(/\s+/g, ' ');
    }

    if (removeFillerWords) {
      // Very basic filler word removal (can affect semantics, hence optional)
      const fillers = /\b(please|kindly|could you|would you|can you|help me|i want to|i need to|just|simply)\b/gi;
      text = text.replace(fillers, '');
      text = text.replace(/\s+/g, ' '); // cleanup spaces again
    }

    text = text.trim();

    // Approximate token count (1 token ≈ 4 chars for English text)
    const origTokens = Math.max(1, Math.ceil(input.length / 4));
    const finalTokens = Math.ceil(text.length / 4);
    
    let pct = 0;
    if (origTokens > 0) {
      pct = (((origTokens - finalTokens) / origTokens) * 100).toFixed(1);
    }

    return { 
      minifiedText: text, 
      originalTokens: origTokens, 
      newTokens: finalTokens, 
      savingsPct: pct > 0 ? pct : 0 
    };
  }, [input, removeNewlines, removeExtraSpaces, removeComments, removeFillerWords]);

  const handleCopy = async () => {
    if (!minifiedText) return;
    try {
      await navigator.clipboard.writeText(minifiedText);
      showToast('Copied minified prompt!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace">
      
      {/* SAVINGS DASHBOARD */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        <div 
          className="settings-panel" 
          style={{ flex: '1', background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--brand-color)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
        >
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span> Minifier Settings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
              <input type="checkbox" checked={removeExtraSpaces} onChange={e => setRemoveExtraSpaces(e.target.checked)} /> 
              Remove Extra Spaces
            </label>
            <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
              <input type="checkbox" checked={removeNewlines} onChange={e => setRemoveNewlines(e.target.checked)} /> 
              Remove Line Breaks
            </label>
            <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
              <input type="checkbox" checked={removeComments} onChange={e => setRemoveComments(e.target.checked)} /> 
              Strip Code Comments
            </label>
            <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
              <input type="checkbox" checked={removeFillerWords} onChange={e => setRemoveFillerWords(e.target.checked)} /> 
              Strip Filler Words (Beta)
            </label>
          </div>
        </div>

        <div 
          style={{ width: '300px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'; }}
        >
          <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>API Tokens Saved</div>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: 1, marginBottom: '8px', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            {savingsPct}%
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>
            {originalTokens} ➔ {newTokens} tokens
          </div>
        </div>

      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Original Prompt</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your giant prompt, system instructions, or code context here..."
            spellCheck="false"
            style={{ height: '400px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Minified Prompt</span>
            <button onClick={handleCopy} className="action-btn primary">
              📋 Copy Minified
            </button>
          </div>
          <textarea
            className="code-editor"
            value={minifiedText}
            readOnly
            placeholder="Minified output ready for ChatGPT, Claude, or API..."
            spellCheck="false"
            style={{ height: '400px', resize: 'vertical', background: 'var(--bg-section)' }}
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
