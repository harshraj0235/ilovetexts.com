'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export default function RemoveWhitespace({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  
  const [mode, setMode] = useState('all'); // 'all', 'trim', 'condense'

  const processedData = useMemo(() => {
    if (!input) return { text: '', diff: 0 };
    const startLength = input.length;
    let result = input;
    
    if (mode === 'all') {
      result = input.replace(/\s+/g, '');
    } else if (mode === 'trim') {
      result = input.split('\n').map(l => l.trim()).join('\n');
    } else if (mode === 'condense') {
      result = input.replace(/[ \t]+/g, ' ');
    }
    
    return { text: result, diff: startLength - result.length };
  }, [input, mode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_tc_removewhitespace_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_tc_removewhitespace_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = async () => {
    const text = processedData.text;
    if (!text) {
      showToast('Nothing to copy!', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  const handleDownload = () => {
    if (!processedData.text) return;
    const txtContent = "data:text/plain;charset=utf-8," + encodeURIComponent(processedData.text);
    const link = document.createElement("a");
    link.setAttribute("href", txtContent);
    link.setAttribute("download", "ilovetexts_removewhitespace.txt");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setInput(e.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="tool-workspace">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : toast.type === 'warning' ? 'toast-warning' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
      
      <div className="tc-controls" style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="radio" name="wsmode" value="all" checked={mode === 'all'} onChange={() => setMode('all')} />
          Remove all whitespace
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="radio" name="wsmode" value="condense" checked={mode === 'condense'} onChange={() => setMode('condense')} />
          Condense multiple spaces to one
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="radio" name="wsmode" value="trim" checked={mode === 'trim'} onChange={() => setMode('trim')} />
          Trim leading/trailing only
        </label>
      </div>

      <div className="tc-grid">
        <div className="tc-panel">
          <div className="tc-panel-header">
            <span className="tc-panel-title">Original Text</span>
            <div className="tc-panel-actions">
              <label className="tc-btn tc-btn-secondary">
                Upload File
                <input type="file" accept=".txt,.csv,.md" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
              <button className="tc-btn tc-btn-secondary" onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setInput(text);
                } catch (e) {
                  showToast('Clipboard access denied', 'error');
                }
              }}>Paste</button>
              <button className="tc-btn tc-btn-secondary" onClick={() => setInput('')}>Clear</button>
            </div>
          </div>
          <textarea
            className="tc-textarea"
            placeholder="Type or paste your text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="tc-panel">
          <div className="tc-panel-header">
            <span className="tc-panel-title">Result <span style={{fontSize: '0.8rem', opacity: 0.7}}>({processedData.diff} chars removed)</span></span>
            <div className="tc-panel-actions">
              <button className="tc-btn tc-btn-primary" onClick={handleCopy}>Copy</button>
              <button className="tc-btn tc-btn-secondary" onClick={handleDownload}>Download TXT</button>
            </div>
          </div>
          <textarea
            className="tc-textarea"
            readOnly
            value={processedData.text}
            placeholder="Processed text will appear here..."
          />
        </div>
      </div>
      
      <nav className="tc-links" aria-label="Related tools">
        <Link href={`/${lang || 'en'}/text-cleaner/remove-line-breaks`}>Remove Line Breaks</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/remove-extra-spaces`}>Remove Extra Spaces</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/remove-duplicate-lines`}>Remove Duplicate Lines</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/remove-empty-lines`}>Remove Empty Lines</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/remove-whitespace`}>Remove All Whitespace</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/add-line-numbers`}>Add Line Numbers</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/add-prefix-suffix`}>Add Prefix / Suffix</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/sort-lines`}>Sort Lines</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/reverse-text`}>Reverse Text</Link>
        <Link href={`/${lang || 'en'}/text-cleaner/reverse-lines`}>Reverse Lines Order</Link>
      </nav>
    </div>
  );
}
