'use client';

import { useState, useMemo, useEffect } from 'react';

export default function JsonToMarkdown({ t, lang }) {
  const [input, setInput] = useState('');
  
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_json_md_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_json_md_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { markdown, headers, rows } = useMemo(() => {
    if (!input.trim()) {
      setError(null);
      return { markdown: '', headers: [], rows: [] };
    }

    try {
      const data = JSON.parse(input);
      
      let arr = data;
      // If it's an object with a single array property, extract it (common API pattern)
      if (!Array.isArray(data) && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 1 && Array.isArray(data[keys[0]])) {
          arr = data[keys[0]];
        } else {
          arr = [data]; // Wrap single object in array
        }
      }

      if (!Array.isArray(arr) || arr.length === 0) {
        setError("JSON must be an array of objects.");
        return { markdown: '', headers: [], rows: [] };
      }

      // Flatten objects (1 level deep) and extract all unique headers
      const allHeaders = new Set();
      const flatRows = arr.map(item => {
        const flatItem = {};
        if (typeof item !== 'object' || item === null) {
          allHeaders.add('Value');
          flatItem['Value'] = String(item);
          return flatItem;
        }

        for (const [key, val] of Object.entries(item)) {
          allHeaders.add(key);
          if (typeof val === 'object' && val !== null) {
            flatItem[key] = JSON.stringify(val);
          } else {
            flatItem[key] = String(val).replace(/\n/g, '<br>');
          }
        }
        return flatItem;
      });

      const headerArr = Array.from(allHeaders);
      
      let md = `| ${headerArr.join(' | ')} |\n`;
      md += `| ${headerArr.map(() => '---').join(' | ')} |\n`;
      
      const rowData = flatRows.map(row => {
        const rowValues = headerArr.map(h => row[h] || '');
        md += `| ${rowValues.join(' | ')} |\n`;
        return rowValues;
      });

      setError(null);
      return { markdown: md, headers: headerArr, rows: rowData };
    } catch (e) {
      setError("Invalid JSON format.");
      return { markdown: '', headers: [], rows: [] };
    }
  }, [input]);

  const handleCopy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('Copied to clipboard (Ready for Notion/GitHub)!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace">
      
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* INPUT */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw JSON Array</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[\n  {\n    "id": 1,\n    "name": "John Doe",\n    "role": "Developer"\n  }\n]'
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', border: error ? '2px solid #ef4444' : '1px solid var(--border-light)' }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '8px', fontWeight: 'bold' }}>⚠️ {error}</div>}
        </div>

        {/* OUTPUT */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Markdown Table Output</span>
            <button 
              onClick={handleCopy} 
              className="action-btn primary" 
              style={{ background: '#000', borderColor: '#000', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
            >
              📝 1-Click Copy to Notion
            </button>
          </div>
          <textarea
            className="code-editor"
            value={markdown}
            readOnly
            placeholder="Markdown table will appear here..."
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', background: 'var(--bg-section)' }}
          />
        </div>

      </div>

      {/* VISUAL SPREADSHEET PREVIEW */}
      {headers.length > 0 && (
        <div 
          style={{ background: 'var(--bg-white)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: 'all 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.12)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'}
        >
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-color)' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span> Data Preview (Spreadsheet View)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--bg-white)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--bg-section)', borderBottom: '2px solid var(--border-strong)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '16px 12px', fontWeight: '600', color: 'var(--text-primary)', borderRight: '1px solid var(--border-light)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {row.map((val, j) => (
                    <td key={j} style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem', borderRight: '1px solid var(--border-light)' }}>
                      {val.length > 50 ? val.substring(0, 50) + '...' : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-section)', marginTop: '8px', borderRadius: 'var(--radius-sm)' }}>
              Showing first 50 rows of {rows.length} total.
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
