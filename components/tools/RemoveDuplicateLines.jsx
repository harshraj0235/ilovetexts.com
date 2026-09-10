'use client';

import { useState, useMemo, useEffect } from 'react';

export default function RemoveDuplicateLines({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  const [sortOrder, setSortOrder] = useState('none');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_remove_duplicates_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_remove_duplicates_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const processedData = useMemo(() => {
    if (!input) return { lines: [], removedCount: 0, originalCount: 0 };

    let lines = input.split('\n');
    const originalCount = lines.length;
    const seen = new Set();
    const result = [];
    let removedCount = 0;

    let emptyRemovedCount = 0;

    for (let line of lines) {
      let processedLine = line;
      
      if (trimWhitespace) {
        processedLine = processedLine.trim();
      }
      
      if (ignoreEmpty && processedLine === '') {
        emptyRemovedCount++;
        continue;
      }
      
      let comparisonLine = caseSensitive ? processedLine : processedLine.toLowerCase();
      
      if (!seen.has(comparisonLine)) {
        seen.add(comparisonLine);
        result.push(line);
      } else {
        removedCount++;
      }
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.localeCompare(b));
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.localeCompare(a));
    }

    return {
      lines: result,
      removedCount,
      originalCount,
      emptyRemovedCount,
      finalCount: result.length
    };
  }, [input, caseSensitive, trimWhitespace, ignoreEmpty, sortOrder]);

  const getOutputText = () => {
    return processedData.lines.join('\n');
  };

  const handleCopy = async () => {
    const text = getOutputText();
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
    if (processedData.lines.length === 0) return;
    const txtContent = "data:text/plain;charset=utf-8," + processedData.lines.join("\n");
    const encodedUri = encodeURI(txtContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cleaned_list_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File downloaded!');
  };

  return (
    <div className="tool-workspace">
      <div className="tool-controls-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={caseSensitive} 
              onChange={(e) => setCaseSensitive(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Case Sensitive
          </label>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={trimWhitespace} 
              onChange={(e) => setTrimWhitespace(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Trim Whitespace
          </label>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={ignoreEmpty} 
              onChange={(e) => setIgnoreEmpty(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Remove Empty Lines
          </label>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: '0 8px' }}></div>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Sort:
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
            >
              <option value="none">None</option>
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
          </label>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{processedData.originalCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Original Lines</div>
        </div>
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{processedData.removedCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duplicates Removed</div>
        </div>
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>{processedData.emptyRemovedCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Empty Lines Removed</div>
        </div>
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{processedData.finalCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Final Lines</div>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Original List</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your list here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Cleaned List</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDownload} className="action-btn" title="Download TXT">⬇️ TXT</button>
              <button onClick={handleCopy} className="action-btn primary">📋 Copy</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={getOutputText()}
            readOnly
            placeholder="Cleaned list will appear here..."
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
