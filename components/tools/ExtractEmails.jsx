'use client';

import { useState, useMemo, useEffect } from 'react';

export default function ExtractEmails({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [groupByDomain, setGroupByDomain] = useState(false);
  const [separator, setSeparator] = useState('newline'); // newline, comma, semicolon

  // Load input on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_emails_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  // Save input on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_emails_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { all: [], uniqueEmails: [], uniqueCount: 0, totalCount: 0, domains: {} };

    // Robust email extraction regex
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = input.match(regex) || [];
    
    // Clean and lowercase
    const cleaned = matches.map(e => e.toLowerCase().trim());
    const uniqueEmails = [...new Set(cleaned)].sort();
    
    // Group by domain
    const domains = {};
    uniqueEmails.forEach(email => {
      const domain = email.split('@')[1];
      if (!domains[domain]) domains[domain] = [];
      domains[domain].push(email);
    });

    // Sort domains by count (descending)
    const sortedDomains = Object.keys(domains).sort((a, b) => domains[b].length - domains[a].length).reduce((acc, key) => {
      acc[key] = domains[key];
      return acc;
    }, {});

    return {
      all: cleaned,
      uniqueEmails,
      uniqueCount: uniqueEmails.length,
      totalCount: cleaned.length,
      domains: sortedDomains
    };
  }, [input]);

  const getOutputText = () => {
    if (extractedData.uniqueCount === 0) return '';
    
    const sepChar = separator === 'comma' ? ', ' : separator === 'semicolon' ? '; ' : '\n';
    
    if (groupByDomain) {
      let result = '';
      for (const [domain, emails] of Object.entries(extractedData.domains)) {
        result += `--- @${domain} (${emails.length}) ---\n`;
        result += emails.join(sepChar) + '\n\n';
      }
      return result.trim();
    }
    
    return extractedData.uniqueEmails.join(sepChar);
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
    const csvContent = "data:text/csv;charset=utf-8,Email\n" + extractedData.uniqueEmails.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_emails_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded!');
  };

  return (
    <div className="tool-workspace">
      {/* Settings Panel */}
      <div className="tool-controls-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="separator" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Output Separator:</label>
          <select 
            id="separator"
            value={separator} 
            onChange={(e) => setSeparator(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
          >
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
            <option value="semicolon">Semicolon (;)</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={groupByDomain} 
              onChange={(e) => setGroupByDomain(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Group by Domain
          </label>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Input */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Text</span>
            <button 
              onClick={() => setInput('')}
              className="action-btn text-btn"
              style={{ fontSize: '0.85rem' }}
            >
              Clear
            </button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your messy text here... (e.g. from a PDF, document, or webpage)"
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        {/* Output */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Extracted Emails</span>
              {extractedData.uniqueCount > 0 && (
                <span style={{ fontSize: '0.8rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                  {extractedData.uniqueCount} Unique ({extractedData.totalCount} Total)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDownload} className="action-btn" title="Download CSV">
                ⬇️ CSV
              </button>
              <button onClick={handleCopy} className="action-btn primary">
                📋 Copy
              </button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={getOutputText()}
            readOnly
            placeholder="Extracted email addresses will appear here..."
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
