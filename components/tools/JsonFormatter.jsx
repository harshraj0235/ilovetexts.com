'use client';

import React, { useState, useEffect } from 'react';
import JsonView from '@uiw/react-json-view';
import { jsonrepair } from 'jsonrepair';

export default function JsonFormatter({ t, lang }) {
  const [input, setInput] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree', 'text', 'minified'

  useEffect(() => {
    if (!input.trim()) {
      setParsedJson(null);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedJson(parsed);
      setError(null);
    } catch (err) {
      setParsedJson(null);
      setError(err.message);
    }
  }, [input]);

  const handlePaste = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setInput(clipboard);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClear = () => {
    setInput('');
  };

  const handleSample = () => {
    setInput(`{
  "name": "Jane Doe",
  "age": 28,
  "developer": true,
  "skills": ["JavaScript", "React", "Next.js"],
  "address": {
    "city": "San Francisco",
    "country": "USA"
  }
}`);
  };

  const handleAutoFix = () => {
    try {
      const fixed = jsonrepair(input);
      // Auto-format it beautifully after fixing
      const formatted = JSON.stringify(JSON.parse(fixed), null, 2);
      setInput(formatted);
      setError(null);
    } catch (err) {
      setError(`Auto-fix failed: ${err.message}`);
    }
  };

  const handleCopyResult = () => {
    if (parsedJson) {
      if (viewMode === 'minified') {
        navigator.clipboard.writeText(JSON.stringify(parsedJson));
      } else {
        navigator.clipboard.writeText(JSON.stringify(parsedJson, null, 2));
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }} className="json-formatter-grid">
      
      {/* Input Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Raw JSON</h3>
          <div className="tool-actions" style={{ marginTop: 0 }}>
            <button className="btn btn-secondary" onClick={handleSample}>📝 Sample</button>
            <button className="btn btn-secondary" onClick={handlePaste}>📋 Paste</button>
            <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          </div>
        </div>
        <textarea
          className="tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your raw, compressed, or broken JSON here..."
          style={{ 
            height: '600px', 
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem', 
            lineHeight: 1.5, 
            padding: '16px',
            border: error ? '1px solid var(--error, #ef4444)' : '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-main)',
            resize: 'vertical',
            whiteSpace: 'pre',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
          }}
          spellCheck="false"
        />
        
        {/* Error State */}
        {error && (
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '8px' }}>
              ⚠️ Invalid JSON Detected
            </div>
            <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
              {error}
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleAutoFix}
              style={{ background: '#dc2626', borderColor: '#dc2626', color: 'white' }}
            >
              🔧 Auto-Fix JSON (jsonrepair)
            </button>
          </div>
        )}
      </div>

      {/* Output Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Result</h3>
          <div className="tool-actions" style={{ marginTop: 0, gap: '8px' }}>
            <button 
              className={`btn ${viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('tree')}
              disabled={!parsedJson}
            >🌳 Tree</button>
            <button 
              className={`btn ${viewMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('text')}
              disabled={!parsedJson}
            >📄 Format</button>
            <button 
              className={`btn ${viewMode === 'minified' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('minified')}
              disabled={!parsedJson}
            >📦 Minify</button>
            <button className="btn btn-secondary" onClick={handleCopyResult} disabled={!parsedJson}>📑 Copy</button>
          </div>
        </div>
        
        <div style={{ 
          height: '600px', 
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-main)',
          overflow: 'auto',
          padding: '16px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {!parsedJson && !error && (
            <div style={{ color: 'var(--text-tertiary)', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              Valid JSON will appear here...
            </div>
          )}
          {!parsedJson && error && (
            <div style={{ color: '#ef4444', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              Waiting for valid JSON...
            </div>
          )}
          
          {parsedJson && viewMode === 'tree' && (
            <JsonView value={parsedJson} displayDataTypes={false} displayObjectSize={true} style={{ background: 'transparent' }} />
          )}
          
          {parsedJson && viewMode === 'text' && (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)' }}>
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
          )}

          {parsedJson && viewMode === 'minified' && (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(parsedJson)}
            </pre>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .json-formatter-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
