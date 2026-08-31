'use client';

import { useState, useMemo, useEffect } from 'react';

export default function ExtractPhones({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [format, setFormat] = useState('all'); // all, international, local
  const [separator, setSeparator] = useState('newline'); // newline, comma

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_phones_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_phones_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { uniquePhones: [], uniqueCount: 0, totalCount: 0 };

    // Standard phone number regex (matches international and local)
    const regex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    
    const matches = input.match(regex) || [];
    
    // Clean whitespace
    let cleaned = matches.map(phone => phone.trim());

    if (format === 'international') {
      cleaned = cleaned.filter(phone => phone.startsWith('+'));
    } else if (format === 'local') {
      cleaned = cleaned.filter(phone => !phone.startsWith('+'));
    }

    const uniquePhones = [...new Set(cleaned)].sort();

    return {
      uniquePhones,
      uniqueCount: uniquePhones.length,
      totalCount: cleaned.length
    };
  }, [input, format]);

  const getOutputText = () => {
    if (extractedData.uniqueCount === 0) return '';
    const sepChar = separator === 'comma' ? ', ' : '\n';
    return extractedData.uniquePhones.join(sepChar);
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
    if (extractedData.uniqueCount === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,Phone Number\n" + extractedData.uniquePhones.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_phones_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded!');
  };

  return (
    <div className="tool-workspace">
      <div className="tool-controls-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="separator" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Output:</label>
          <select 
            id="separator"
            value={separator} 
            onChange={(e) => setSeparator(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
          >
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="format" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filter:</label>
          <select 
            id="format"
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Numbers</option>
            <option value="international">International (+ only)</option>
            <option value="local">Local (No +)</option>
          </select>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Text</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw text, resumes, or documents containing phone numbers..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Extracted Phones</span>
              {extractedData.uniqueCount > 0 && (
                <span style={{ fontSize: '0.8rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                  {extractedData.uniqueCount} Unique ({extractedData.totalCount} Total)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDownload} className="action-btn" title="Download CSV">⬇️ CSV</button>
              <button onClick={handleCopy} className="action-btn primary">📋 Copy</button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={getOutputText()}
            readOnly
            placeholder="Extracted phone numbers will appear here..."
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
