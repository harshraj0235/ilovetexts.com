'use client';

import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function TextCompare({ t, lang }) {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [splitView, setSplitView] = useState(true);

  const handlePasteOriginal = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setOriginalText(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handlePasteModified = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setModifiedText(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setIsComparing(false);
  };

  const handleSample = () => {
    setOriginalText("This is the original text.\nIt has a few lines.\nSome words will be changed.\nThis line will be deleted.\nAnd this line remains.");
    setModifiedText("This is the modified text.\nIt has a few lines.\nSome words have been changed.\nAnd this line remains.\nThis line is new.");
    setIsComparing(true);
  };

  return (
    <>
      <div className="tool-actions">
        {isComparing ? (
          <button className="btn btn-secondary" onClick={() => setIsComparing(false)}>
            ✏️ Edit Text
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setIsComparing(true)} disabled={!originalText && !modifiedText}>
            ⚖️ Compare Texts
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
        <button className="btn btn-secondary" onClick={handleSample}>📝 Sample</button>
      </div>

      <div className="tool-container">
        {!isComparing ? (
          <>
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-title">ORIGINAL TEXT</div>
                <div className="tool-helper-actions">
                  <button className="btn-helper" onClick={handlePasteOriginal} title="Paste from clipboard">📋 Paste</button>
                </div>
              </div>
              <textarea
                className="tool-textarea"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Paste original text here..."
                style={{ height: '400px', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-title">MODIFIED TEXT</div>
                <div className="tool-helper-actions">
                  <button className="btn-helper" onClick={handlePasteModified} title="Paste from clipboard">📋 Paste</button>
                </div>
              </div>
              <textarea
                className="tool-textarea"
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                placeholder="Paste modified text here..."
                style={{ height: '400px', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </>
        ) : (
          <div className="tool-panel" style={{ width: '100%', gridColumn: '1 / -1' }}>
            <div className="tool-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="tool-panel-title">COMPARISON RESULT</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={splitView} 
                  onChange={(e) => setSplitView(e.target.checked)} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }}
                />
                Split View
              </label>
            </div>
            <div style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <ReactDiffViewer
                oldValue={originalText}
                newValue={modifiedText}
                splitView={splitView}
                hideLineNumbers={false}
                useDarkTheme={false}
                leftTitle="Original"
                rightTitle="Modified"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
