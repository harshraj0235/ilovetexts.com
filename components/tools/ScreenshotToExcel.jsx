'use client';
// ═══════════════════════════════════════════════════════
// ScreenshotToExcel.jsx — Extract tables from images to Excel
//
// BEATS imagetoexcel.app:
//  ✅ Free unlimited (they charge after 3 uses)
//  ✅ No upload — Tesseract.js runs in browser
//  ✅ Table structure detection with column alignment
//  ✅ Edit extracted data before downloading
//  ✅ Export to CSV, XLSX, TSV, JSON
//  ✅ Works on screenshots, photos, scanned docs
//
// Targets: "screenshot to excel free" 40K/mo
//          "image to excel converter" 50K/mo
//          "table from image to csv" 20K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

// ─── Parse OCR text into table rows ──────────────────────────────────────────
function parseTable(ocrText) {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  // Detect columns by consistent spacing or | separators
  const rows = lines.map(line => {
    if (line.includes('|')) {
      return line.split('|').map(c => c.trim()).filter((c, i, a) => i === 0 || i === a.length - 1 ? c : true);
    }
    // Split by 2+ spaces (common in tables)
    return line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
  });

  // Find max columns
  const maxCols = Math.max(...rows.map(r => r.length));
  // Pad all rows to same length
  return rows.map(row => {
    while (row.length < maxCols) row.push('');
    return row;
  });
}

function tableToCSV(rows, delimiter = ',') {
  return rows.map(row =>
    row.map(cell => {
      const c = String(cell);
      if (c.includes(delimiter) || c.includes('"') || c.includes('\n')) {
        return '"' + c.replace(/"/g, '""') + '"';
      }
      return c;
    }).join(delimiter)
  ).join('\n');
}

export default function ScreenshotToExcel({ t, lang }) {
  const [image, setImage]       = useState(null); // {url, name}
  const [ocrText, setOcrText]   = useState('');
  const [tableData, setTableData] = useState([]); // [[cell,...],...]
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [format, setFormat]     = useState('csv');
  const [hasHeader, setHasHeader] = useState(true);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2500); };

  const loadImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => { setImage({ url: e.target.result, name: file.name }); setTableData([]); setOcrText(''); };
    reader.readAsDataURL(file);
  }, []);

  const runOCR = useCallback(async () => {
    if (!image) return;
    setLoading(true); setOcrProgress(0);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      // Use TSV output for bounding-box based column detection
      const result = await Tesseract.recognize(image.url, 'eng', {
        logger: m => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); },
      });
      const text = result.data.text;
      setOcrText(text);

      // Use word-level bounding boxes for accurate column detection
      const words = result.data.words || [];
      if (words.length > 0) {
        // Group words by Y-row (snap to 12px grid for tolerance)
        const rowMap = {};
        words.forEach(w => {
          const yKey = Math.round(w.bbox.y0 / 12) * 12;
          if (!rowMap[yKey]) rowMap[yKey] = [];
          rowMap[yKey].push({ x: w.bbox.x0, text: w.text, conf: w.confidence });
        });

        // Find X-column buckets
        const allX = Object.values(rowMap).flatMap(cells => cells.map(c => c.x));
        allX.sort((a, b) => a - b);
        const xBuckets = [];
        allX.forEach(x => {
          const bucket = xBuckets.find(b => Math.abs(b - x) < 40);
          if (!bucket) xBuckets.push(x);
        });
        xBuckets.sort((a, b) => a - b);

        if (xBuckets.length >= 2) {
          const table = Object.entries(rowMap).sort(([a],[b])=>+a-+b).map(([,cells]) => {
            const row = new Array(xBuckets.length).fill('');
            cells.forEach(cell => {
              const bucketIdx = xBuckets.reduce((bi,bx,i)=>Math.abs(bx-cell.x)<Math.abs(xBuckets[bi]-cell.x)?i:bi,0);
              row[bucketIdx] = (row[bucketIdx]?row[bucketIdx]+' ':'')+cell.text;
            });
            return row.map(c => c.trim());
          }).filter(row => row.some(c => c.length > 0));

          // Normalize to max columns
          const maxCols = Math.max(...table.map(r => r.length));
          const normalized = table.map(r => { while(r.length < maxCols) r.push(''); return r; });
          setTableData(normalized);
          showToast(`Extracted ${normalized.length} rows × ${maxCols} columns (bbox method)`);
          return;
        }
      }

      // Fallback: text-based parsing
      const table = parseTable(text);
      setTableData(table);
      showToast(`Extracted ${table.length} rows × ${table[0]?.length || 0} columns`);
    } catch (e) {
      showToast('OCR failed: ' + e.message, 'error');
    } finally {
      setLoading(false); setOcrProgress(0);
    }
  }, [image]);

  const updateCell = (ri, ci, val) => {
    setTableData(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = val;
      return next;
    });
  };

  const addRow = () => setTableData(prev => [...prev, new Array(prev[0]?.length || 1).fill('')]);
  const addCol = () => setTableData(prev => prev.map(r => [...r, '']));
  const removeRow = (ri) => setTableData(prev => prev.filter((_, i) => i !== ri));
  const removeCol = (ci) => setTableData(prev => prev.map(r => r.filter((_, i) => i !== ci)));

  const download = useCallback(async () => {
    if (!tableData.length) { showToast('No table data to download', 'warning'); return; }
    const baseName = image?.name.replace(/\.[^.]+$/, '') || 'table';

    if (format === 'csv') {
      const csv = tableToCSV(tableData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.csv'; a.click();
    } else if (format === 'tsv') {
      const tsv = tableToCSV(tableData, '\t');
      const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.tsv'; a.click();
    } else if (format === 'json') {
      let json;
      if (hasHeader && tableData.length > 1) {
        const [headers, ...rows] = tableData;
        json = JSON.stringify(rows.map(row => Object.fromEntries(headers.map((h, i) => [h || `col${i+1}`, row[i]]))), null, 2);
      } else {
        json = JSON.stringify(tableData, null, 2);
      }
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.json'; a.click();
    } else if (format === 'xlsx') {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, baseName + '.xlsx');
    }
    showToast('Downloaded!');
  }, [tableData, format, image, hasHeader]);

  const pasteImage = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], 'pasted-image.png', { type: imgType });
          loadImage(file); showToast('Image pasted!'); return;
        }
      }
      showToast('No image found in clipboard. Copy a screenshot first.', 'warning');
    } catch (e) {
      showToast('Paste failed. Use Ctrl+V or upload the image.', 'warning');
    }
  }, [loadImage]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t === 'success' ? '✅ ' : '⚠️ '}{toast.m}</div>}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📸</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Screenshot to Excel — Extract Tables from Images</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Upload a screenshot, photo or scan containing a table → OCR extracts it → Edit → Download as Excel/CSV/JSON
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: image ? '340px 1fr' : '1fr', gap: 20 }}>

        {/* Left: Upload + Image preview */}
        <div>
          {!image ? (
            <div
              onDrop={e => { e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '50px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(124,58,237,0.04)' : 'var(--bg-section)' }}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { loadImage(e.target.files[0]); e.target.value = ''; }} />
              <div style={{ fontSize: 52, marginBottom: 12 }}>📸</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop screenshot here</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.88rem' }}>JPG, PNG, WebP, GIF — screenshot of any table</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={{ padding: '9px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                  📁 Choose Image
                </button>
                <button onClick={e => { e.stopPropagation(); pasteImage(); }}
                  style={{ padding: '9px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  📋 Paste (Ctrl+V)
                </button>
              </div>
              <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🔒 Image never leaves your browser — Tesseract.js runs locally</p>
            </div>
          ) : (
            <div>
              {/* Image preview */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="uploaded" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block', background: '#f8f8f8' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📸 {image.name}
              </div>

              {/* OCR button */}
              <button onClick={runOCR} disabled={loading}
                style={{ width: '100%', padding: '11px', marginBottom: 8, background: loading ? 'var(--border-light)' : 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ilt-spin 0.7s linear infinite' }} />
                  Recognizing text… {ocrProgress}%</>
                ) : '🔍 Extract Table with OCR'}
              </button>

              {loading && (
                <div style={{ height: 6, background: 'var(--bg-section)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ocrProgress}%`, background: '#7c3aed', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              )}

              <button onClick={() => { setImage(null); setTableData([]); setOcrText(''); }} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }}>
                🔄 Use Different Image
              </button>
            </div>
          )}

          {/* Usage tips */}
          {!tableData.length && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📊', text: 'Spreadsheet screenshots from Excel or Google Sheets' },
                { icon: '🧾', text: 'Scanned invoices, receipts or forms with tables' },
                { icon: '📱', text: 'Mobile phone photos of printed tables' },
                { icon: '🖥️', text: 'Dashboard screenshots with data tables' },
              ].map(tip => (
                <div key={tip.text} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tip.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Table editor */}
        {tableData.length > 0 && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setEditMode(e => !e)}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${editMode ? '#7c3aed' : 'var(--border-light)'}`, background: editMode ? 'rgba(124,58,237,0.1)' : 'var(--bg-section)', color: editMode ? '#7c3aed' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                {editMode ? '✏️ Editing' : '✏️ Edit Table'}
              </button>
              {editMode && (
                <>
                  <button onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>+ Row</button>
                  <button onClick={addCol} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>+ Col</button>
                </>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', cursor: 'pointer', marginLeft: 'auto' }}>
                <input type="checkbox" checked={hasHeader} onChange={e => setHasHeader(e.target.checked)} />
                First row = headers
              </label>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                {hasHeader && tableData.length > 0 && (
                  <thead>
                    <tr>
                      {editMode && <th style={{ width: 28, background: 'var(--bg-section)', border: '1px solid var(--border-light)', padding: '4px' }}></th>}
                      {tableData[0].map((cell, ci) => (
                        <th key={ci} style={{ padding: '8px 10px', background: 'var(--bg-section)', borderBottom: '2px solid var(--border-light)', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)', position: 'relative', borderRight: '1px solid var(--border-light)' }}>
                          {editMode ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input value={cell} onChange={e => updateCell(0, ci, e.target.value)}
                                style={{ flex: 1, padding: '2px 4px', border: '1px solid #7c3aed', borderRadius: 3, fontSize: '0.82rem', fontWeight: 700, width: '100%', minWidth: 60 }} />
                              <button onClick={() => removeCol(ci)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', padding: 0, flexShrink: 0 }}>✕</button>
                            </div>
                          ) : cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {(hasHeader ? tableData.slice(1) : tableData).map((row, ri) => {
                    const realRi = hasHeader ? ri + 1 : ri;
                    return (
                      <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {editMode && (
                          <td style={{ padding: '2px 4px', textAlign: 'center', width: 28, background: 'var(--bg-section)' }}>
                            <button onClick={() => removeRow(realRi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', padding: 0 }}>✕</button>
                          </td>
                        )}
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '6px 10px', borderRight: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                            {editMode ? (
                              <input value={cell} onChange={e => updateCell(realRi, ci, e.target.value)}
                                style={{ padding: '2px 4px', border: '1px solid var(--border-light)', borderRadius: 3, fontSize: '0.82rem', width: '100%', minWidth: 60, background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
                            ) : cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Stats */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              {tableData.length} rows × {tableData[0]?.length || 0} columns
            </div>

            {/* Download controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['csv', 'xlsx', 'json', 'tsv'].map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${format === f ? '#7c3aed' : 'var(--border-light)'}`, background: format === f ? 'rgba(124,58,237,0.1)' : 'var(--bg-section)', color: format === f ? '#7c3aed' : 'var(--text-secondary)', fontWeight: format === f ? 700 : 400, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={download}
                style={{ flex: 1, minWidth: 160, padding: '9px 16px', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                ⬇ Download as {format.toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
