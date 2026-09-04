'use client';
// ScannedPdfToData.jsx — Extract structured data from scanned PDFs
// Uses pdfjs + Tesseract.js OCR — 100% browser-based
import { useState, useCallback, useRef } from 'react';

export default function ScannedPdfToData({ t, lang }) {
  const [pages, setPages]       = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [outputFmt, setOutputFmt] = useState('json');
  const [dragging, setDragging] = useState(false);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 3000); };

  const parseStructured = (text) => {
    // Extract key-value pairs, tables, and lists from OCR text
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const kvPairs = [];
    const tableRows = [];
    const listItems = [];

    lines.forEach(line => {
      // Key: Value pattern
      const kvMatch = line.match(/^([A-Za-z][A-Za-z\s]{1,30}?)[\s:]+(.{2,100})$/);
      if (kvMatch && !line.includes('  ')) {
        kvPairs.push({ key: kvMatch[1].trim(), value: kvMatch[2].trim() });
        return;
      }
      // Table row (multiple spaces or | separators)
      if (line.includes('|') || line.match(/\s{3,}/)) {
        const cols = line.includes('|') ? line.split('|').map(c => c.trim()).filter(Boolean) : line.split(/\s{3,}/).map(c => c.trim()).filter(Boolean);
        if (cols.length >= 2) { tableRows.push(cols); return; }
      }
      // List items
      if (line.match(/^[-•*]\s+/)) { listItems.push(line.replace(/^[-•*]\s+/, '')); return; }
    });

    return { kvPairs, tableRows, listItems, rawText: text };
  };

  const processFile = useCallback(async (file) => {
    setLoading(true); setPages([]); setFileName(file.name);
    const ext = file.name.toLowerCase().split('.').pop();
    try {
      if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        const results = [];

        for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
          setProgress(`Processing page ${i}/${Math.min(doc.numPages, 10)}…`);
          const page = await doc.getPage(i);

          // Try text extraction first
          const content = await page.getTextContent();
          let text = content.items.map(item => item.str).join(' ');

          // If little text found, use OCR
          if (text.trim().length < 50) {
            setProgress(`OCR on page ${i} (scanned page detected)…`);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const Tesseract = (await import('tesseract.js')).default;
            const result = await Tesseract.recognize(canvas.toDataURL(), 'eng');
            text = result.data.text;
          }

          results.push({ page: i, text, structured: parseStructured(text) });
        }

        setPages(results);
        showToast(`Extracted data from ${results.length} page${results.length !== 1 ? 's' : ''}!`);
      } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
        setProgress('Running OCR on image…');
        const url = URL.createObjectURL(file);
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(url, 'eng', { logger: m => { if (m.status === 'recognizing text') setProgress(`OCR: ${Math.round(m.progress * 100)}%`); } });
        const text = result.data.text;
        setPages([{ page: 1, text, structured: parseStructured(text) }]);
        showToast('Data extracted!');
      }
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    finally { setLoading(false); setProgress(''); }
  }, []);

  const exportData = () => {
    if (!pages.length) return;
    const allData = pages.map(p => ({ page: p.page, ...p.structured }));
    let content, mime, ext;
    if (outputFmt === 'json') { content = JSON.stringify(allData, null, 2); mime = 'application/json'; ext = 'json'; }
    else if (outputFmt === 'csv') {
      const rows = [['Page', 'Key', 'Value']];
      allData.forEach(p => p.kvPairs.forEach(kv => rows.push([p.page, kv.key, kv.value])));
      content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      mime = 'text/csv'; ext = 'csv';
    } else {
      content = pages.map(p => `--- Page ${p.page} ---\n${p.text}`).join('\n\n');
      mime = 'text/plain'; ext = 'txt';
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName.replace(/\.[^.]+$/, '') + '-data.' + ext; a.click();
    showToast('Downloaded!');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t === 'success' ? '✅ ' : '⚠️ '}{toast.m}</div>}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📊</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Scanned PDF to Structured Data</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload scanned PDF or image → OCR extracts text → Auto-structured into key-value pairs, tables, lists → Export JSON/CSV</p>
      </div>

      {!pages.length ? (
        <div onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => !loading && inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center', cursor: loading ? 'default' : 'pointer', background: dragging ? 'rgba(124,58,237,0.04)' : 'var(--bg-section)' }}>
          <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={e => { processFile(e.target.files[0]); e.target.value = ''; }} />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>{progress}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop scanned PDF or image</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>PDF, JPG, PNG, WebP — auto-detects scanned vs text PDF</p>
              <button style={{ padding: '11px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choose File
              </button>
              <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🔒 OCR runs in your browser — nothing uploaded</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['json', 'csv', 'txt'].map(f => (
                <button key={f} onClick={() => setOutputFmt(f)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${outputFmt === f ? '#7c3aed' : 'var(--border-light)'}`, background: outputFmt === f ? 'rgba(124,58,237,0.1)' : 'var(--bg-section)', color: outputFmt === f ? '#7c3aed' : 'var(--text-secondary)', fontWeight: outputFmt === f ? 700 : 400, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase' }}>{f}</button>
              ))}
            </div>
            <button onClick={exportData} className="btn-primary" style={{ padding: '7px 18px', fontSize: '0.88rem' }}>⬇ Export {outputFmt.toUpperCase()}</button>
            <button onClick={() => { setPages([]); setFileName(''); }} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>🔄 New File</button>
          </div>

          {pages.map(p => (
            <div key={p.page} className="trust-card" style={{ padding: 18, marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>Page {p.page}</h3>
              {p.structured.kvPairs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>Key-Value Pairs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 6 }}>
                    {p.structured.kvPairs.slice(0, 20).map((kv, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 8px', background: 'var(--bg-section)', borderRadius: 4 }}>
                        <span style={{ fontWeight: 600, color: '#7c3aed', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{kv.key}:</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{kv.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {p.structured.tableRows.length > 0 && (
                <div style={{ marginBottom: 12, overflowX: 'auto' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>Table Data</div>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.8rem', width: '100%' }}>
                    {p.structured.tableRows.slice(0, 20).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)', background: ri % 2 ? 'var(--bg-section)' : 'transparent' }}>
                        {row.map((cell, ci) => <td key={ci} style={{ padding: '5px 8px', fontWeight: ri === 0 ? 700 : 400 }}>{cell}</td>)}
                      </tr>
                    ))}
                  </table>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Raw Text</div>
                <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--bg-section)', padding: 8, borderRadius: 4 }}>{p.text.slice(0, 500)}{p.text.length > 500 ? '…' : ''}</pre>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
