'use client';
// ═══════════════════════════════════════════════════════
// PdfToExcel.jsx — PDF to Excel with smart table detection
// Detects tabular data in PDFs using position clustering,
// exports as proper .xlsx with formatted columns.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize, getPlan } from '@/lib/subscription';

const TOOL_ID = 'pdf-to-excel';

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#059669' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(5,150,105,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' },
  th: { padding: '8px 10px', textAlign: 'left', background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-light)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', position: 'sticky', top: 0 },
  td: { padding: '6px 10px', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-primary)' },
  progressBar: (pct) => ({ height: 6, borderRadius: 3, background: '#059669', width: `${pct}%`, transition: 'width 0.3s' }),
};

// Smart table parser — groups text items by Y position, detects columns by X clustering
function detectTables(textItems) {
  if (!textItems.length) return [];

  // Group by Y (same line)
  const lineMap = {};
  textItems.forEach(item => {
    const yKey = Math.round(item.y / 4) * 4;
    if (!lineMap[yKey]) lineMap[yKey] = [];
    lineMap[yKey].push(item);
  });

  const lines = Object.entries(lineMap)
    .sort((a, b) => b[0] - a[0]) // top-to-bottom
    .map(([y, items]) => ({
      y: parseFloat(y),
      items: items.sort((a, b) => a.x - b.x),
    }));

  // Detect column boundaries — cluster X positions across all lines
  const allX = [];
  lines.forEach(line => line.items.forEach(item => allX.push(Math.round(item.x / 8) * 8)));
  const xCounts = {};
  allX.forEach(x => xCounts[x] = (xCounts[x] || 0) + 1);
  const columns = Object.entries(xCounts)
    .filter(([, count]) => count >= Math.max(3, lines.length * 0.15))
    .map(([x]) => parseFloat(x))
    .sort((a, b) => a - b);

  if (columns.length < 2) {
    // No clear table structure, treat each line as single-column
    return lines.map(line => [line.items.map(i => i.text).join(' ')]);
  }

  // Assign items to columns
  const rows = [];
  lines.forEach(line => {
    const row = new Array(columns.length).fill('');
    line.items.forEach(item => {
      const ix = Math.round(item.x / 8) * 8;
      let bestCol = 0;
      let bestDist = Infinity;
      columns.forEach((col, ci) => {
        const dist = Math.abs(ix - col);
        if (dist < bestDist) { bestDist = dist; bestCol = ci; }
      });
      row[bestCol] = (row[bestCol] ? row[bestCol] + ' ' : '') + item.text;
    });
    // Only add if row has at least 2 non-empty cells
    if (row.filter(c => c.trim()).length >= 2) rows.push(row.map(c => c.trim()));
  });

  return rows;
}

export default function PdfToExcel({ t, lang }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [tables, setTables] = useState([]); // rows of detected table data
  const [headers, setHeaders] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [autoDetectHeaders, setAutoDetectHeaders] = useState(true);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') { showToast('Please upload a PDF file', 'warning'); return; }
    const sizeCheck = checkFileSize(f.size);
    if (!sizeCheck.allowed) { showToast(`File exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    setFile(f); setStatus('idle'); setTables([]); setHeaders([]); setProgress(0);
  };

  const extract = useCallback(async () => {
    if (!file) return;

    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setStatus('extracting'); setProgress(10);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;
      setPageCount(doc.numPages); setProgress(20);

      let allItems = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const items = content.items.filter(item => item.str?.trim()).map(item => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
        }));
        allItems.push(...items);
        setProgress(20 + Math.round((i / doc.numPages) * 50));
      }

      const rows = detectTables(allItems);
      if (!rows.length) {
        showToast('No tabular data detected in this PDF', 'warning');
        setStatus('idle');
        return;
      }

      // Auto-detect headers
      if (autoDetectHeaders && rows.length > 1) {
        const firstRow = rows[0];
        const isHeader = firstRow.every(cell => {
          const c = cell.trim();
          return c.length > 0 && c.length < 40 && !/^\d+[.,]\d+$/.test(c);
        });
        if (isHeader) {
          setHeaders(rows[0]);
          setTables(rows.slice(1));
        } else {
          setHeaders(rows[0].map((_, i) => `Column ${i + 1}`));
          setTables(rows);
        }
      } else {
        setHeaders(rows[0].map((_, i) => `Column ${i + 1}`));
        setTables(rows);
      }

      recordUsage(TOOL_ID);
      setProgress(100); setStatus('done');
      showToast(`✅ ${rows.length} rows detected across ${doc.numPages} pages`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('Extraction failed: ' + err.message, 'error');
    }
  }, [file, autoDetectHeaders]);

  const downloadExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wsData = [headers, ...tables];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-width columns
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(h.length, ...tables.map(r => (r[i] || '').length));
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, file.name.replace('.pdf', '.xlsx'));
      showToast('Excel file downloaded!');
    } catch (err) {
      showToast('Download failed: ' + err.message, 'error');
    }
  };

  const downloadCsv = () => {
    const csvRows = [headers, ...tables].map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace('.pdf', '.csv');
    a.click();
    showToast('CSV file downloaded!');
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['📊 Smart table detection', '🔒 100% private', '📥 Export as .xlsx or .csv'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
        <UsageBadge toolId={TOOL_ID} />
      </div>

      {/* Upload */}
      {!file && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={S.dropzone(dragOver)}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop PDF with tables</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Bank statements, invoices, reports — auto-detects columns and rows
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Processing */}
      {file && (
        <div style={S.card}>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 28 }}>📄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB{pageCount > 0 && ` • ${pageCount} pages`}</div>
            </div>
            <button onClick={() => { setFile(null); setStatus('idle'); setTables([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>✕</button>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoDetectHeaders} onChange={e => setAutoDetectHeaders(e.target.checked)}
                style={{ accentColor: '#059669' }} />
              Auto-detect header row
            </label>
          </div>

          {/* Progress */}
          {(status === 'extracting') && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>📊 Detecting tables...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={S.progressBar(progress)} />
              </div>
            </div>
          )}

          {/* Extract button */}
          {status === 'idle' && (
            <button onClick={extract} className="btn-primary" style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
              📊 Extract Tables to Excel
            </button>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
              <p style={{ color: '#dc2626', marginBottom: 8 }}>❌ Extraction failed</p>
              <button onClick={() => setStatus('idle')} style={{ color: 'var(--highlight)', background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && tables.length > 0 && (
            <>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#15803d' }}>✅ {tables.length} rows × {headers.length} columns detected</div>
              </div>

              {/* Download buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button onClick={downloadExcel} className="btn-primary" style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.9rem' }}>
                  📥 Download .xlsx
                </button>
                <button onClick={downloadCsv} style={{ flex: 1, padding: 12, cursor: 'pointer', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                  📄 Download .csv
                </button>
              </div>

              {/* Table preview */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Preview (first 50 rows)</label>
                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width: 40 }}>#</th>
                        {headers.map((h, i) => <th key={i} style={S.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tables.slice(0, 50).map((row, ri) => (
                        <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-secondary)' }}>
                          <td style={{ ...S.td, color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>{ri + 1}</td>
                          {row.map((cell, ci) => <td key={ci} style={S.td}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tables.length > 50 && (
                  <div style={{ textAlign: 'center', padding: 8, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    ...and {tables.length - 50} more rows (download to see all)
                  </div>
                )}
              </div>

              <button onClick={() => { setFile(null); setStatus('idle'); setTables([]); }}
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                🔄 Convert Another PDF
              </button>
            </>
          )}
        </div>
      )}

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
        {[
          { icon: '📊', title: 'Smart detection', desc: 'AI-powered column and row detection from any PDF layout' },
          { icon: '🏦', title: 'Bank statements', desc: 'Perfect for extracting transaction tables from bank PDFs' },
          { icon: '📋', title: 'Any tabular PDF', desc: 'Invoices, reports, price lists — if it has tables, we detect them' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{c.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a', color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)' }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
