'use client';
// DocumentToExcel.jsx — Extract all tables from documents to Excel
// Supports PDF, Word, image files — 100% browser-based
import { useState, useCallback, useRef } from 'react';

function parseTableFromText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const tables = [];
  let currentTable = [];

  lines.forEach(line => {
    const cols = line.includes('|')
      ? line.split('|').map(c => c.trim()).filter(Boolean)
      : line.match(/\s{2,}/) ? line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean) : null;

    if (cols && cols.length >= 2) {
      // Skip separator lines
      if (!cols.every(c => /^[-=:]+$/.test(c))) currentTable.push(cols);
    } else {
      if (currentTable.length >= 2) tables.push([...currentTable]);
      currentTable = [];
    }
  });
  if (currentTable.length >= 2) tables.push(currentTable);
  return tables;
}

export default function DocumentToExcel({ t, lang }) {
  const [tables, setTables]     = useState([]);
  const [allText, setAllText]   = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [dragging, setDragging] = useState(false);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2500); };

  const processFile = useCallback(async (file) => {
    setLoading(true); setTables([]); setFileName(file.name);
    const ext = file.name.toLowerCase().split('.').pop();
    try {
      let text = '';
      if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          setProgress(`Extracting page ${i}/${doc.numPages}…`);
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          // Preserve spatial layout by using Y position grouping
          const items = content.items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
          let lastY = null, line = '';
          items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 5) { text += line + '\n'; line = item.str; }
            else { line += ' ' + item.str; }
            lastY = y;
          });
          if (line) text += line + '\n';
          text += '\n';
        }
      } else if (ext === 'docx' || ext === 'doc') {
        setProgress('Extracting Word document…');
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      } else if (['png','jpg','jpeg','webp'].includes(ext)) {
        setProgress('Running OCR on image…');
        const url = URL.createObjectURL(file);
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(url, 'eng', { logger: m => { if (m.status === 'recognizing text') setProgress(`OCR: ${Math.round(m.progress * 100)}%`); } });
        text = result.data.text;
      } else if (ext === 'txt' || ext === 'csv') {
        text = new TextDecoder().decode(await file.arrayBuffer());
      }

      setAllText(text);
      setProgress('Finding tables…');
      const found = parseTableFromText(text);
      setTables(found);
      setSelectedTables(new Set(found.map((_, i) => i)));
      if (!found.length) showToast('No tables found. Try a document with tabular data.', 'warning');
      else showToast(`Found ${found.length} table${found.length !== 1 ? 's' : ''}!`);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    finally { setLoading(false); setProgress(''); }
  }, []);

  const exportExcel = useCallback(async () => {
    if (!tables.length) return;
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    const wb = XLSX.utils.book_new();
    tables.forEach((table, i) => {
      if (!selectedTables.has(i)) return;
      const ws = XLSX.utils.aoa_to_sheet(table);
      XLSX.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
    });
    XLSX.writeFile(wb, fileName.replace(/\.[^.]+$/, '') + '-tables.xlsx');
    showToast('Excel downloaded!');
  }, [tables, selectedTables, fileName]);

  const exportCSV = useCallback(() => {
    const sel = tables.filter((_, i) => selectedTables.has(i));
    const csv = sel.map((table, i) =>
      `--- Table ${i + 1} ---\n` + table.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    ).join('\n\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName.replace(/\.[^.]+$/, '') + '-tables.csv'; a.click();
    showToast('CSV downloaded!');
  }, [tables, selectedTables, fileName]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t === 'success' ? '✅ ' : '⚠️ '}{toast.m}</div>}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Document to Excel Extractor</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload PDF, Word, or image → Automatically finds all tables → Download as Excel or CSV</p>
      </div>

      {!tables.length ? (
        <div onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => !loading && inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center', cursor: loading ? 'default' : 'pointer', background: dragging ? 'rgba(124,58,237,0.04)' : 'var(--bg-section)' }}>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt,.csv,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => { processFile(e.target.files[0]); e.target.value = ''; }} />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>{progress}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop any document to extract tables</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>PDF, Word (DOCX), TXT, CSV, JPG, PNG</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                {['PDF', 'DOCX', 'TXT', 'CSV', 'JPG', 'PNG'].map(f => (
                  <span key={f} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg-main)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f}</span>
                ))}
              </div>
              <button style={{ padding: '11px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choose Document
              </button>
              <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🔒 Everything processed in your browser — 100% private</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>📋 {fileName} — {tables.length} table{tables.length !== 1 ? 's' : ''} found</span>
            <button onClick={() => setSelectedTables(new Set(tables.map((_, i) => i)))} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>Select All</button>
            <button onClick={() => setSelectedTables(new Set())} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>Deselect All</button>
            <button onClick={exportExcel} className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>⬇ Excel ({selectedTables.size})</button>
            <button onClick={exportCSV} className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>⬇ CSV</button>
            <button onClick={() => { setTables([]); setFileName(''); }} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>🔄 New File</button>
          </div>

          {tables.map((table, ti) => (
            <div key={ti} className="trust-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '10px 14px', background: selectedTables.has(ti) ? 'rgba(124,58,237,0.08)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                onClick={() => setSelectedTables(prev => { const n = new Set(prev); n.has(ti) ? n.delete(ti) : n.add(ti); return n; })}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedTables.has(ti) ? '#7c3aed' : 'var(--border-light)'}`, background: selectedTables.has(ti) ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedTables.has(ti) && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Table {ti + 1}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{table.length} rows × {table[0]?.length} cols</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 200 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      {(table[0] || []).map((cell, ci) => (
                        <th key={ci} style={{ padding: '6px 10px', background: 'var(--bg-section)', borderBottom: '2px solid var(--border-light)', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.slice(1, 8).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {row.map((cell, ci) => <td key={ci} style={{ padding: '5px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
