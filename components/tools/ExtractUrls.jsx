'use client';

import { useState, useMemo, useEffect } from 'react';

export default function ExtractUrls({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [groupByDomain, setGroupByDomain] = useState(false);
  const [removeTracking, setRemoveTracking] = useState(true);
  const [separator, setSeparator] = useState('newline'); // newline, comma

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_urls_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_urls_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { uniqueUrls: [], uniqueCount: 0, totalCount: 0, domains: {} };

    // Regex to match HTTP/HTTPS URLs
    const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = input.match(regex) || [];
    
    let cleaned = matches;
    if (removeTracking) {
      cleaned = cleaned.map(url => {
        try {
          const parsed = new URL(url);
          // Common tracking params
          const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
          trackingParams.forEach(param => parsed.searchParams.delete(param));
          return parsed.href;
        } catch (e) {
          return url;
        }
      });
    }

    const uniqueUrls = [...new Set(cleaned)].sort();
    
    const domains = {};
    uniqueUrls.forEach(url => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        if (!domains[domain]) domains[domain] = [];
        domains[domain].push(url);
      } catch (e) {
        // Fallback for invalid URLs
      }
    });

    const sortedDomains = Object.keys(domains).sort((a, b) => domains[b].length - domains[a].length).reduce((acc, key) => {
      acc[key] = domains[key];
      return acc;
    }, {});

    return {
      uniqueUrls,
      uniqueCount: uniqueUrls.length,
      totalCount: cleaned.length,
      domains: sortedDomains
    };
  }, [input, removeTracking]);

  const getOutputText = () => {
    if (extractedData.uniqueCount === 0) return '';
    
    const sepChar = separator === 'comma' ? ', ' : '\n';
    
    if (groupByDomain) {
      let result = '';
      for (const [domain, urls] of Object.entries(extractedData.domains)) {
        result += `--- ${domain} (${urls.length}) ---\n`;
        result += urls.join(sepChar) + '\n\n';
      }
      return result.trim();
    }
    
    return extractedData.uniqueUrls.join(sepChar);
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
    const csvContent = "data:text/csv;charset=utf-8,URL\n" + extractedData.uniqueUrls.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_urls_${Date.now()}.csv`);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={groupByDomain} 
              onChange={(e) => setGroupByDomain(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Group by Domain
          </label>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={removeTracking} 
              onChange={(e) => setRemoveTracking(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Remove UTM Tracking Params
          </label>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Text or HTML</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw HTML, messy text, or document content here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600' }}>Extracted URLs</span>
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
            placeholder="Extracted URLs will appear here..."
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
