'use client';

import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function VoiceConverter({ t = {}, lang = 'en' }) {
  const [text, setText] = useState('');
  const [analyzedSentences, setAnalyzedSentences] = useState([]);
  const [activeTab, setActiveTab] = useState('analyze'); // analyze, rewrite
  const [toast, setToast] = useState(null);

  // English Regex to detect passive voice
  // Looks for forms of "to be" followed by a word ending in ed/en/t, often followed by "by"
  const passiveRegex = /\b(am|is|are|was|were|be|being|been)\b\s+([a-z]+(?:ed|en|t|own|ung))\b(\s+by\b)?/i;

  const analyzeText = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) {
      setToast({ message: 'Please enter some text to analyze.', type: 'warning' });
      return;
    }

    // Split text into sentences (naively by punctuation)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const analyzed = sentences.map(sentence => {
      const isPassive = passiveRegex.test(sentence);
      
      let hint = '';
      if (isPassive) {
        const match = sentence.match(passiveRegex);
        const hasBy = match && match[3];
        if (hasBy) {
           hint = "Hint: Move the noun after 'by' to the front of the sentence to make it active.";
        } else {
           hint = "Hint: Identify who is performing the action and place them at the beginning of the sentence.";
        }
      }

      return {
        original: sentence.trim(),
        isPassive,
        hint,
        rewritten: ''
      };
    });

    setAnalyzedSentences(analyzed);
    setActiveTab('rewrite');
    setToast({ message: 'Analysis complete!', type: 'success' });
    
    setTimeout(() => {
      document.getElementById('voice-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleRewrite = (index, newValue) => {
    const updated = [...analyzedSentences];
    updated[index].rewritten = newValue;
    setAnalyzedSentences(updated);
  };

  const getFinalText = () => {
    return analyzedSentences.map(s => s.rewritten || s.original).join(' ');
  };

  const copyResult = () => {
    navigator.clipboard.writeText(getFinalText());
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const clearForm = () => {
    setText('');
    setAnalyzedSentences([]);
    setActiveTab('analyze');
  };

  const passiveCount = analyzedSentences.filter(s => s.isPassive).length;

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, #EFF6FF, var(--bg-white))', padding: '24px' }}>
          <div className="tool-panel-title" style={{ color: '#2563EB', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔄</span> ACTIVE/PASSIVE VOICE CONVERTER
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
            Identify weak passive voice in your writing and instantly rewrite it into strong active sentences.
          </p>
        </div>
        
        <form onSubmit={analyzeText} style={{ padding: '32px' }}>
          
          <div style={{ marginBottom: '24px' }}>
             <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Your Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your essay, email, or article here to detect passive voice (e.g. 'The ball was thrown by the boy.')."
                style={{
                  width: '100%', padding: '20px', fontSize: '1.1rem',
                  border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-section)', outline: 'none', transition: 'border-color 0.2s', 
                  fontFamily: 'var(--font-sans)', minHeight: '200px', resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                required
              />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: '1 1 200px', padding: '16px', fontSize: '1.2rem', background: '#2563EB' }}
            >
              🔍 Analyze Sentences
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {analyzedSentences.length > 0 && (
        <div id="voice-results" style={{ marginTop: '32px' }}>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div className="tool-panel" style={{ flex: 1, padding: '24px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#3B82F6' }}>{analyzedSentences.length}</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Sentences</div>
            </div>
            <div className="tool-panel" style={{ flex: 1, padding: '24px', textAlign: 'center', border: passiveCount > 0 ? '2px solid #EF4444' : '2px solid #10B981' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: passiveCount > 0 ? '#EF4444' : '#10B981' }}>{passiveCount}</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Passive Sentences</div>
            </div>
          </div>

          <div className="tool-panel" style={{ border: '1px solid var(--border-light)' }}>
            <div style={{ background: 'var(--bg-section)', padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>
                Sentence-by-Sentence Rewrite
              </h3>
              <button onClick={copyResult} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                📋 Copy Final Text
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
              {analyzedSentences.map((sentence, idx) => (
                <div key={idx} style={{ 
                  background: sentence.isPassive ? '#FEF2F2' : '#F9FAFB', 
                  border: `1px solid ${sentence.isPassive ? '#FCA5A5' : '#E5E7EB'}`, 
                  borderRadius: '12px', padding: '20px',
                  display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: sentence.isPassive ? 600 : 400 }}>
                      {sentence.original}
                    </div>
                    {sentence.isPassive ? (
                      <span style={{ background: '#EF4444', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                        PASSIVE
                      </span>
                    ) : (
                      <span style={{ background: '#10B981', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  {sentence.isPassive && (
                    <>
                      <div style={{ color: '#B91C1C', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>💡</span> {sentence.hint}
                      </div>
                      <input
                        type="text"
                        value={sentence.rewritten}
                        onChange={(e) => handleRewrite(idx, e.target.value)}
                        placeholder="Rewrite this sentence in active voice here..."
                        style={{
                          width: '100%', padding: '12px 16px', fontSize: '1rem',
                          border: '1px solid #FCA5A5', borderRadius: '6px',
                          background: '#fff', outline: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      />
                    </>
                  )}
                  
                  {!sentence.isPassive && sentence.rewritten && (
                    <input
                      type="text"
                      value={sentence.rewritten}
                      onChange={(e) => handleRewrite(idx, e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', fontSize: '1rem',
                        border: '1px solid #E5E7EB', borderRadius: '6px',
                        background: '#fff', outline: 'none'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
