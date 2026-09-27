'use client';
import { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';
import { js2xml, xml2js } from 'xml-js';
import * as XLSX from 'xlsx';

// ═══════════════════════════════════════════════════════
// UniversalDataConverter.jsx
// Handles conversions between JSON, XML, YAML, and CSV.
// ═══════════════════════════════════════════════════════

const parseInput = (input, format) => {
  if (!input.trim()) return null;
  switch (format) {
    case 'json':
      return JSON.parse(input);
    case 'yaml':
      return yaml.load(input);
    case 'xml': {
      const obj = xml2js(input, { compact: true, ignoreDeclaration: true });
      // Simplify simple structures if needed, but xml2js compact is usually enough
      return obj;
    }
    case 'csv': {
      const workbook = XLSX.read(input, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet);
    }
    default:
      throw new Error('Unsupported input format');
  }
};

const formatOutput = (data, format) => {
  if (!data) return '';
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return yaml.dump(data);
    case 'xml': {
      // If data is an array, wrap it in a root element
      const xmlData = Array.isArray(data) ? { root: { item: data } } : (data.root ? data : { root: data });
      return js2xml(xmlData, { compact: true, spaces: 2 });
    }
    case 'csv': {
      // Data must be an array of objects for CSV
      const arr = Array.isArray(data) ? data : (data.root && data.root.item ? data.root.item : [data]);
      const worksheet = XLSX.utils.json_to_sheet(arr.length ? arr : [arr]);
      return XLSX.utils.sheet_to_csv(worksheet);
    }
    default:
      throw new Error('Unsupported output format');
  }
};

const LABELS = {
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  csv: 'CSV'
};

export default function UniversalDataConverter({ from = 'json', to = 'xml' }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  
  const [fromFormat, setFromFormat] = useState(from);
  const [toFormat, setToFormat] = useState(to);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const parsed = parseInput(input, fromFormat);
      const formatted = formatOutput(parsed, toFormat);
      setOutput(formatted);
      setError(null);
    } catch (err) {
      setError(`Failed to convert ${LABELS[fromFormat]}: ${err.message}`);
    }
  }, [input, fromFormat, toFormat]);

  const handleSwap = () => {
    const tempFormat = fromFormat;
    setFromFormat(toFormat);
    setToFormat(tempFormat);
    
    // Only swap text if output is valid and there's no error
    if (output && !error) {
      setInput(output);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${toFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Auto-detect from format based on extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') setFromFormat('json');
    else if (ext === 'xml') setFromFormat('xml');
    else if (ext === 'yaml' || ext === 'yml') setFromFormat('yaml');
    else if (ext === 'csv') setFromFormat('csv');

    const reader = new FileReader();
    reader.onload = (event) => setInput(event.target.result);
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select 
              value={fromFormat} 
              onChange={e => setFromFormat(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="yaml">YAML</option>
              <option value="csv">CSV</option>
            </select>

            <button 
              onClick={handleSwap}
              style={{ padding: '8px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Swap formats"
            >
              ⇄
            </button>

            <select 
              value={toFormat} 
              onChange={e => setToFormat(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="yaml">YAML</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ cursor: 'pointer', padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
              Upload File
              <input type="file" style={{ display: 'none' }} accept=".json,.xml,.yaml,.yml,.csv" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Editors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderBottom: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Input ({LABELS[fromFormat]})
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Paste your ${LABELS[fromFormat]} here...`}
              style={{ width: '100%', height: 400, padding: 16, fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--border-light)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical' }}
              spellCheck="false"
            />
            {error && (
              <div style={{ marginTop: 8, color: '#ef4444', fontSize: '0.85rem', padding: '8px 12px', background: '#fef2f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Output */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderBottom: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Output ({LABELS[toFormat]})</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopy} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Copy</button>
                <button onClick={handleDownload} style={{ padding: '4px 10px', background: '#0ea5e9', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', color: '#fff' }}>Download</button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Conversion result will appear here..."
              style={{ width: '100%', height: 400, padding: 16, fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--border-light)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical' }}
              spellCheck="false"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
