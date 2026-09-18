'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export default function AddLineNumbers({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  
  const [separator, setSeparator] = useState('. ');
  const [zeroPad, setZeroPad] = useState(false);
  const [skipEmpty, setSkipEmpty] = useState(false);

  const processedData = useMemo(() => {
    if (!input) return { text: '', count: 0 };
    let lines = input.split('\n');
    let result = [];
    let counter = 1;
    
    let maxLen = zeroPad ? lines.length.toString().length : 0;

    for (let line of lines) {
      if (skipEmpty && line.trim() === '') {
        result.push(line);
        continue;
      }
      let num = counter.toString();
      if (zeroPad) num = num.padStart(maxLen, '0');
      result.push(`${num}${separator}${line}`);
      counter++;
    }
    return { text: result.join('\n'), count: counter - 1 };
  }, [input, separator, zeroPad, skipEmpty]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_tc_addlinenumbers_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_tc_addlinenumbers_input', input);
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
    link.setAttribute("download", "ilovetexts_addlinenumbers.txt");
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
      
      <div className="tc-controls" style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          Separator:
          <input type="text" value={separator} onChange={e => setSeparator(e.target.value)} style={{ padding: '4px 8px', width: '60px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={zeroPad} onChange={e => setZeroPad(e.target.checked)} />
          Zero-pad (01, 02)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={skipEmpty} onChange={e => setSkipEmpty(e.target.checked)} />
          Skip empty lines
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
            <span className="tc-panel-title">Result <span style={{fontSize: '0.8rem', opacity: 0.7}}>({processedData.count} lines numbered)</span></span>
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
