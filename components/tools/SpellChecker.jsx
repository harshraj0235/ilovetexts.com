'use client';

import { useState, useRef, useEffect } from 'react';

// LanguageTool API endpoint for grammar checking
const API_URL = 'https://api.languagetoolplus.com/v2/check';

export default function SpellChecker({ t = {} }) {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Ref for the editable div and highlight layer
  const editorRef = useRef(null);
  const highlightLayerRef = useRef(null);

  // Sync scrolling between textarea and highlight layer
  const handleScroll = (e) => {
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = e.target.scrollTop;
      highlightLayerRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Map our app languages to LanguageTool language codes
  // We use auto-detect for simplicity but can hardcode if needed
  const langCode = 'auto'; 

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const checkSpelling = async () => {
    if (!text.trim()) {
      setToast({ message: 'Please enter some text to check.', type: 'warning' });
      return;
    }

    setIsChecking(true);
    setError(null);
    setMatches([]);

    try {
      const params = new URLSearchParams({
        text: text,
        language: langCode,
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to reach spell checking service. Please try again later.');
      }

      const data = await response.json();
      // Filter to only include spelling errors
      const spellMatches = (data.matches || []).filter(m => m.rule.issueType === 'misspelling');
      setMatches(spellMatches);
      
      if (spellMatches.length === 0) {
        setToast({ message: 'No spelling errors found!', type: 'success' });
      } else {
        setToast({ message: `Found ${spellMatches.length} spelling issues.`, type: 'warning' });
      }

    } catch (err) {
      console.error('Spell check error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsChecking(false);
    }
  };

  const applyFix = (matchIndex, replacementIndex) => {
    const match = matches[matchIndex];
    const replacement = match.replacements[replacementIndex].value;
    
    // Replace text in the string based on offset and length
    const newText = text.substring(0, match.offset) + replacement + text.substring(match.offset + match.length);
    
    setText(newText);
    
    // Remove the match from the list
    const newMatches = [...matches];
    newMatches.splice(matchIndex, 1);
    
    // We also need to adjust offsets for remaining matches that come AFTER this fix
    const lengthDifference = replacement.length - match.length;
    for (let i = 0; i < newMatches.length; i++) {
      if (newMatches[i].offset > match.offset) {
        newMatches[i].offset += lengthDifference;
      }
    }
    
    setMatches(newMatches);
  };

  const handleClear = () => {
    setText('');
    setMatches([]);
    setError(null);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      setToast({ message: 'Pasted from clipboard!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Could not access clipboard. Try Ctrl+V.', type: 'error' });
    }
  };

  // Generate highlighted HTML based on matches
  const renderHighlightedText = () => {
    if (matches.length === 0) return null;
    
    let lastIndex = 0;
    const elements = [];
    
    // Ensure matches are sorted by offset
    const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);

    sortedMatches.forEach((match, idx) => {
      // Add text before the match
      if (match.offset > lastIndex) {
        elements.push(<span key={`text-${idx}`} style={{ color: 'transparent' }}>{text.substring(lastIndex, match.offset)}</span>);
      }
      
      // Add the matched (erroneous) text with highlighting
      const matchWord = text.substring(match.offset, match.offset + match.length);
      const isSpelling = match.rule.issueType === 'misspelling';
      
      elements.push(
        <span 
          key={`match-${idx}`} 
          className={`grammar-highlight ${isSpelling ? 'spelling-error' : 'grammar-error'}`}
          style={{ color: 'transparent' }}
          title={match.message}
          onClick={() => {
            // Scroll to the corresponding card in the sidebar
            const el = document.getElementById(`issue-${idx}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {matchWord}
        </span>
      );
      
      lastIndex = match.offset + match.length;
    });
    
    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`} style={{ color: 'transparent' }}>{text.substring(lastIndex)}</span>);
    }
    
    return <div ref={highlightLayerRef} className="grammar-highlight-layer">{elements}</div>;
  };

  return (
    <div className="grammar-checker-container">
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅ ' : '⚠️ '}{toast.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="tool-toolbar" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={handlePaste} className="btn-secondary" title="Paste text">
          📋 Paste
        </button>
        <button onClick={handleCopy} className="btn-secondary" title="Copy text">
          📄 Copy
        </button>
        <button onClick={handleClear} className="btn-secondary" title="Clear text">
          🗑️ Clear
        </button>
        <button 
          onClick={checkSpelling} 
          className="btn-primary" 
          disabled={isChecking || !text.trim()}
          style={{ marginLeft: 'auto', padding: '8px 24px', fontWeight: 'bold' }}
        >
          {isChecking ? '⏳ Checking...' : '📝 Check Spelling'}
        </button>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="grammar-layout">
        {/* Editor Area */}
        <div className="grammar-editor-wrapper">
          <div className="editor-container">
            {/* The transparent highlight layer sits exactly behind the textarea */}
            {renderHighlightedText()}
            
            <textarea
              ref={editorRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Clear matches on typing to avoid highlight desync
                if (matches.length > 0) {
                  setMatches([]);
                }
              }}
              onScroll={handleScroll}
              placeholder="Type or paste your text here to check for spelling errors..."
              className="grammar-textarea"
              spellCheck="false"
            />
          </div>
          
          <div className="editor-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>{text.length} characters</span>
            <span>{text.split(/\s+/).filter(w => w.length > 0).length} words</span>
          </div>
        </div>

        {/* Sidebar for Errors */}
        <div className="grammar-sidebar">
          <h3 style={{ marginBottom: '16px', color: '#202124', borderBottom: '1px solid #E8EAED', paddingBottom: '8px' }}>
            Issues Found {matches.length > 0 && <span className="badge">{matches.length}</span>}
          </h3>
          
          <div className="issues-list">
            {matches.length === 0 ? (
              <div className="no-issues">
                {isChecking ? 'Analyzing text...' : 'No issues found! Your text looks good.'}
              </div>
            ) : (
              matches.map((match, index) => (
                <div key={index} id={`issue-${index}`} className="issue-card">
                  <div className="issue-header">
                    <span className="issue-type-badge spelling">
                      Spelling
                    </span>
                    <span className="issue-category">{match.rule.category.name}</span>
                  </div>
                  
                  <p className="issue-message">{match.message}</p>
                  
                  {match.replacements && match.replacements.length > 0 && (
                    <div className="replacements-container">
                      <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Suggestions:</p>
                      <div className="replacements-list">
                        {match.replacements.slice(0, 5).map((rep, rIndex) => (
                          <button 
                            key={rIndex} 
                            onClick={() => applyFix(index, rIndex)}
                            className="replacement-btn"
                          >
                            {rep.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .grammar-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          min-height: 500px;
        }
        
        @media (max-width: 900px) {
          .grammar-layout {
            grid-template-columns: 1fr;
          }
        }

        .grammar-editor-wrapper {
          display: flex;
          flex-direction: column;
        }

        .editor-container {
          position: relative;
          flex-grow: 1;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 12px;
          overflow: hidden;
          min-height: 400px;
        }

        .grammar-textarea {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 20px;
          font-family: inherit;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #202124;
          background: transparent; /* Transparent so highlight layer shows through */
          border: none;
          resize: none;
          outline: none;
          z-index: 2;
        }

        /* 
         * The highlight layer is tricky. It needs to exactly match 
         * the textarea's padding, font, and line-height.
         */
        .grammar-highlight-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 20px;
          font-family: inherit;
          font-size: 1.1rem;
          line-height: 1.6;
          color: transparent !important; /* Text is invisible, only borders/backgrounds show */
          -webkit-text-fill-color: transparent !important;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 1;
          pointer-events: none; /* Let clicks pass through to textarea */
        }

        .grammar-highlight-layer * {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }

        .grammar-highlight-text {
          color: transparent !important;
        }

        .grammar-highlight {
          border-bottom: 2px solid;
          border-radius: 2px;
          cursor: pointer;
          pointer-events: auto; /* Allow clicks on highlights */
        }

        .grammar-highlight.spelling-error {
          border-color: #ef4444; /* Red */
          background-color: rgba(239, 68, 68, 0.1);
        }

        .grammar-highlight.grammar-error {
          border-color: #f59e0b; /* Yellow/Orange */
          background-color: rgba(245, 158, 11, 0.1);
        }

        .grammar-sidebar {
          background: #FFFFFF;
          border: 1px solid #E8EAED;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
        }

        .issues-list {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 8px;
        }

        .no-issues {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
          font-style: italic;
        }

        .issue-card {
          background: #F0F2F5;
          border: 1px solid #E8EAED;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .issue-card:hover {
          border-color: #E5322D;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .issue-type-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .issue-type-badge.spelling {
          background: #fee2e2;
          color: #991b1b;
        }

        .issue-type-badge.grammar {
          background: #fef3c7;
          color: #92400e;
        }

        .issue-category {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .issue-message {
          font-size: 0.95rem;
          color: #202124;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .replacements-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .replacement-btn {
          background: #E5322D;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .replacement-btn:hover {
          background: #D42621;
          transform: translateY(-1px);
        }
        
        .badge {
          background: #ef4444;
          color: white;
          font-size: 0.8rem;
          padding: 2px 8px;
          border-radius: 12px;
          vertical-align: middle;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}
