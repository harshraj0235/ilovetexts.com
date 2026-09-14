'use client';

import { useState, useRef, useEffect } from 'react';

// LanguageTool API endpoint for grammar checking
const API_URL = '/api/language-check';

export default function GrammarChecker({ t = {} }) {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [language, setLanguage] = useState('auto');
  const [issueFilter, setIssueFilter] = useState('all');
  const [undoText, setUndoText] = useState(null);
  
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

  const maxCharacters = 20000;
  const wordCount = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const issueKind = (match) => match.rule?.issueType === 'misspelling' ? 'spelling' :
    /punctuation/i.test(`${match.rule?.issueType || ''} ${match.rule?.category?.name || ''}`) ? 'punctuation' : 'grammar';
  const visibleMatches = matches.filter((match) => issueFilter === 'all' || issueKind(match) === issueFilter);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const checkGrammar = async () => {
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
        language,
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reach grammar checking service. Please try again later.');
      }
      setMatches(data.matches || []);
      
      if (data.matches && data.matches.length === 0) {
        setToast({ message: 'No grammar or spelling errors found!', type: 'success' });
      } else {
        setToast({ message: `Found ${data.matches.length} possible issues.`, type: 'warning' });
      }

    } catch (err) {
      console.error('Grammar check error:', err);
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
    
    setUndoText(text);
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

  const applyAllFixes = () => {
    const candidates = [];
    [...matches].sort((a, b) => a.offset - b.offset).forEach((match) => {
      if (!match.replacements?.[0]) return;
      const previous = candidates[candidates.length - 1];
      if (!previous || match.offset >= previous.offset + previous.length) candidates.push(match);
    });
    if (!candidates.length) return;
    setUndoText(text);
    let corrected = text;
    [...candidates].reverse().forEach((match) => {
      corrected = corrected.substring(0, match.offset) + match.replacements[0].value + corrected.substring(match.offset + match.length);
    });
    setText(corrected);
    setMatches([]);
    setToast({ message: `Applied ${candidates.length} suggested ${candidates.length === 1 ? 'fix' : 'fixes'}. Review the result before using it.`, type: 'success' });
  };

  const handleClear = () => {
    if (text) setUndoText(text);
    setText('');
    setMatches([]);
    setError(null);
  };

  const handleUndo = () => {
    if (undoText === null) return;
    const current = text;
    setText(undoText);
    setUndoText(current);
    setMatches([]);
  };

  const loadSample = () => {
    if (text) setUndoText(text);
    setText('Their going to the library tommorow, but they does not know if its open. This sentence have several error.');
    setMatches([]);
    setError(null);
  };

  const downloadText = () => {
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'checked-text.txt';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      <div className="grammar-controls">
        <label>Check language<select value={language} onChange={(event) => { setLanguage(event.target.value); setMatches([]); }}><option value="auto">Detect automatically</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="es">Spanish</option><option value="de-DE">German</option><option value="pt">Portuguese</option><option value="hi-IN">Hindi</option><option value="id">Indonesian</option></select></label>
        <span className="privacy-note">Text is sent securely to LanguageTool for this check and is not stored by iLoveTexts.</span>
      </div>
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
        <button onClick={handleUndo} className="btn-secondary" disabled={undoText === null} title="Undo last text change">↶ Undo</button>
        <button onClick={loadSample} className="btn-secondary" title="Load example text">✨ Sample</button>
        <button onClick={downloadText} className="btn-secondary" disabled={!text} title="Download checked text">⇩ Download</button>
        <button 
          onClick={checkGrammar} 
          className="btn-primary" 
          disabled={isChecking || !text.trim() || text.length > maxCharacters}
          style={{ marginLeft: 'auto', padding: '8px 24px', fontWeight: 'bold' }}
        >
          {isChecking ? '⏳ Checking...' : '✅ Check Grammar'}
        </button>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {text.length > maxCharacters && <div className="alert-error" role="alert" style={{ marginBottom: '16px', padding: '12px', background: '#fff7ed', color: '#9a3412', borderRadius: '8px' }}>Shorten the text by {(text.length - maxCharacters).toLocaleString()} characters to run this check.</div>}

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
              placeholder="Type or paste your text here to check for grammar, spelling, and punctuation errors..."
              className="grammar-textarea"
              spellCheck="false"
            />
          </div>
          
          <div className="editor-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span className={text.length > maxCharacters ? 'limit-over' : ''}>{text.length.toLocaleString()} / {maxCharacters.toLocaleString()} characters</span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
        </div>

        {/* Sidebar for Errors */}
        <div className="grammar-sidebar">
          <h3 style={{ marginBottom: '16px', color: '#202124', borderBottom: '1px solid #E8EAED', paddingBottom: '8px' }}>
            Issues Found {matches.length > 0 && <span className="badge">{matches.length}</span>}
          </h3>
          {matches.length > 0 && <><div className="issue-filters" aria-label="Filter suggestions">{['all','grammar','spelling','punctuation'].map((kind)=><button type="button" key={kind} className={issueFilter===kind?'active':''} onClick={()=>setIssueFilter(kind)}>{kind} <span>{kind==='all'?matches.length:matches.filter((match)=>issueKind(match)===kind).length}</span></button>)}</div><button type="button" className="apply-all" onClick={applyAllFixes}>Apply suggested fixes</button></>}
          
          <div className="issues-list">
            {error ? (
              <div className="no-issues" role="status">The check could not be completed. Your text has not been verified.</div>
            ) : matches.length === 0 ? (
              <div className="no-issues">
                {isChecking ? 'Analyzing text...' : text.trim() ? 'Select Check Grammar to verify this text.' : 'Enter text to begin.'}
              </div>
            ) : (
              visibleMatches.map((match) => {
                const index = matches.indexOf(match);
                const kind = issueKind(match);
                return <div key={`${match.offset}-${match.rule?.id || index}`} id={`issue-${index}`} className="issue-card">
                  <div className="issue-header">
                    <span className={`issue-type-badge ${kind}`}>
                      {kind}
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
                </div>;
              })
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .grammar-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          min-height: 500px;
        }

        .grammar-controls { display:flex; align-items:end; justify-content:space-between; gap:16px; margin-bottom:12px; padding:12px 14px; border:1px solid #dbeafe; border-radius:12px; background:#f8fbff; }
        .grammar-controls label { display:grid; gap:5px; color:#334155; font-size:.75rem; font-weight:750; }
        .grammar-controls select { min-height:40px; padding:0 36px 0 10px; border:1px solid #cbd5e1; border-radius:8px; background:white; color:#0f172a; }
        .privacy-note { max-width:520px; color:#475569; font-size:.75rem; line-height:1.45; }
        .limit-over { color:#b91c1c; font-weight:800; }
        .issue-filters { display:flex; gap:6px; overflow-x:auto; margin-bottom:9px; padding-bottom:2px; }
        .issue-filters button { min-height:34px; padding:0 9px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#475569; text-transform:capitalize; white-space:nowrap; cursor:pointer; }
        .issue-filters button.active { border-color:#7c3aed; background:#f5f3ff; color:#6d28d9; }
        .issue-filters span { font-weight:800; }
        .apply-all { width:100%; min-height:42px; margin-bottom:12px; border:0; border-radius:9px; background:#166534; color:white; font-weight:800; cursor:pointer; }
        
        @media (max-width: 900px) {
          .grammar-layout {
            grid-template-columns: 1fr;
          }
          .grammar-sidebar { max-height:none; }
        }

        @media (max-width: 560px) { .grammar-controls { align-items:stretch; flex-direction:column; } .grammar-controls select { width:100%; } .editor-container { height:340px; } .grammar-textarea,.grammar-highlight-layer { padding:16px; font-size:1rem; } .tool-toolbar .btn-primary { width:100%; margin-left:0!important; min-height:48px; } }

        .grammar-editor-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .editor-container {
          position: relative;
          width: 100%;
          height: 400px;
          background: #FFFFFF;
          border: 1px solid #E8EAED;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .grammar-textarea {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 24px;
          font-family: inherit;
          font-size: 1.1rem;
          line-height: 1.6;
          border: none;
          background: transparent;
          color: var(--text-main);
          resize: none;
          outline: none;
          z-index: 2;
        }

        .grammar-highlight-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 24px;
          font-family: inherit;
          font-size: 1.1rem;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 1;
          pointer-events: none;
        }

        .grammar-highlight-layer * {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }

        .grammar-highlight {
          border-bottom: 2px solid;
          border-radius: 2px;
          cursor: pointer;
          pointer-events: auto;
        }

        .grammar-highlight.spelling-error {
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }

        .grammar-highlight.grammar-error {
          border-color: #f59e0b;
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
        .issue-type-badge.punctuation { background:#e0f2fe; color:#075985; }

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
      `}} />
    </div>
  );
}
