'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export default function SortLines({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  
  const [sortMode, setSortMode] = useState('az');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(true);

  const processedData = useMemo(() => {
    if (!input) return { text: '' };
    let lines = input.split('\n');
    if (removeEmpty) lines = lines.filter(l => l.trim() !== '');

    let result = [...lines];
    
    if (sortMode === 'az' || sortMode === 'za') {
      result.sort((a, b) => {
        let strA = caseSensitive ? a : a.toLowerCase();
        let strB = caseSensitive ? b : b.toLowerCase();
        return sortMode === 'az' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    } else if (sortMode === 'len-asc') {
      result.sort((a, b) => a.length - b.length);
    } else if (sortMode === 'len-desc') {
      result.sort((a, b) => b.length - a.length);
    } else if (sortMode === 'random') {
      // Deterministic random for React hydration safety not strictly needed here since it's client-side, 
      // but let's just shuffle standardly.
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
    
    return { text: result.join('\n') };
  }, [input, sortMode, caseSensitive, removeEmpty]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_tc_sortlines_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_tc_sortlines_input', input);
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
    link.setAttribute("download", "ilovetexts_sortlines.txt");
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
          Sort by:
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ padding: '4px 8px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <option value="az">Alphabetical (A-Z)</option>
            <option value="za">Alphabetical (Z-A)</option>
            <option value="len-asc">Length (Shortest to Longest)</option>
            <option value="len-desc">Length (Longest to Shortest)</option>
            <option value="random">Randomize (Shuffle)</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', opacity: (sortMode === 'az' || sortMode === 'za') ? 1 : 0.5 }}>
          <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} disabled={sortMode !== 'az' && sortMode !== 'za'} />
          Case sensitive
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={removeEmpty} onChange={e => setRemoveEmpty(e.target.checked)} />
          Remove empty lines
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
            <span className="tc-panel-title">Result</span>
            <div className="tc-panel-actions">
              {sortMode === 'random' && (
                <button className="tc-btn tc-btn-secondary" onClick={() => setSortMode('random-trigger')} style={{marginRight: '8px'}}>Shuffle Again</button>
              )}
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
