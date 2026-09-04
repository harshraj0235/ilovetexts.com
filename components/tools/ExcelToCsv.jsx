'use client';
// ═══════════════════════════════════════════════════════
// ExcelToCsv.jsx — Convert XLSX/XLS to CSV and CSV to XLSX
// Uses xlsx library — zero upload, 100% private
// Targets: "excel to csv free online" 300K/mo
//          "csv to excel free" 200K/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

function formatBytes(b) {
  if (!b) return '0 B';
  const k=1024,s=['B','KB','MB'];
  const i=Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
}

export default function ExcelToCsv({ t, lang }) {
  const [mode, setMode]         = useState('excel-to-csv'); // excel-to-csv | csv-to-excel
  const [file, setFile]         = useState(null); // {name, size, data}
  const [sheets, setSheets]     = useState([]); // sheet names for XLSX
  const [selectedSheet, setSelectedSheet] = useState('');
  const [preview, setPreview]   = useState([]); // [[...row]] first 10 rows
  const [delimiter, setDelimiter] = useState(','); // for CSV output
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone]         = useState(null); // {rows, cols, size}
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const accept = mode === 'excel-to-csv' ? '.xlsx,.xls,.ods' : '.csv,.tsv';

  const loadFile = useCallback(async (f) => {
    setFile({ name: f.name, size: f.size }); setDone(null); setPreview([]);
    try {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const sheetNames = wb.SheetNames;
      setSheets(sheetNames); setSelectedSheet(sheetNames[0]);

      // Preview first sheet
      const ws = wb.Sheets[sheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      setPreview(data.slice(0, 8));
      setFile({ name: f.name, size: f.size, wb, ab });
      showToast(`File loaded — ${sheetNames.length} sheet${sheetNames.length!==1?'s':''}`);
    } catch(e) { showToast('Failed to read file: '+e.message,'error'); setFile(null); }
  }, []);

  const updatePreview = useCallback(async (sheetName) => {
    if (!file?.wb) return;
    try {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const ws = file.wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      setPreview(data.slice(0, 8));
    } catch{}
  }, [file]);

  const convert = useCallback(async () => {
    if (!file?.wb) { showToast('Please upload a file first','warning'); return; }
    setProcessing(true); setDone(null);
    try {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));

      if (mode === 'excel-to-csv') {
        const ws = file.wb.Sheets[selectedSheet];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: delimiter });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const outName = file.name.replace(/\.[^.]+$/, '') + (sheets.length > 1 ? `-${selectedSheet}` : '') + '.csv';
        a.download = outName;
        a.click();
        const rows = csv.split('\n').length;
        const cols = preview[0]?.length || 0;
        setDone({ rows, cols, size: blob.size });
        showToast('CSV downloaded!');
      } else {
        // CSV → Excel
        const ab = await (await fetch(URL.createObjectURL(new Blob([file.ab])))).arrayBuffer();
        const wb2 = XLSX.read(new Uint8Array(file.ab), { type: 'array' });
        const outData = XLSX.write(wb2, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([outData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name.replace('.csv','').replace('.tsv','') + '.xlsx';
        a.click();
        setDone({ rows: preview.length, cols: preview[0]?.length || 0, size: blob.size });
        showToast('Excel file downloaded!');
      }
    } catch(e) {
      console.error(e);
      showToast('Conversion failed: '+e.message,'error');
    } finally { setProcessing(false); }
  }, [file, mode, selectedSheet, delimiter, sheets, preview]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['excel-to-csv','📊 Excel → CSV','XLSX/XLS/ODS to CSV'],['csv-to-excel','📋 CSV → Excel','CSV/TSV to XLSX']].map(([v,l,d]) => (
          <button key={v} onClick={() => { setMode(v); setFile(null); setPreview([]); setDone(null); }}
            style={{ flex:1, padding:'10px 12px', borderRadius:'var(--radius-md)', border:`2px solid ${mode===v?'#0ea5e9':'var(--border-light)'}`, background:mode===v?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize:'0.88rem', color:mode===v?'#0ea5e9':'var(--text-primary)' }}>{l}</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:2 }}>{d}</div>
          </button>
        ))}
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?'#0ea5e9':'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'60px 24px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(14,165,233,0.04)':'var(--bg-section)', transition:'all 0.2s' }}
        >
          <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }} onChange={e => { loadFile(e.target.files[0]); e.target.value=''; }} />
          <div style={{ fontSize:52, marginBottom:12 }}>{mode==='excel-to-csv'?'📊':'📋'}</div>
          <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>
            {mode==='excel-to-csv' ? 'Drop an Excel file to convert to CSV' : 'Drop a CSV file to convert to Excel'}
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>
            {mode==='excel-to-csv' ? 'XLSX, XLS, ODS supported — all sheets available' : 'CSV and TSV supported'}
          </p>
          <button style={{ padding:'11px 28px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose File
          </button>
          <p style={{ marginTop:14, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>🔒 Your file never leaves your browser — 100% private</p>
        </div>
      ) : (
        <>
          {/* File info */}
          <div className="trust-card" style={{ padding:'14px 18px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.9rem' }}>📄 {file.name}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{formatBytes(file.size)}</div>
            </div>
            <button onClick={() => { setFile(null); setPreview([]); setDone(null); }} className="btn btn-secondary" style={{ fontSize:'0.82rem' }}>Change File</button>
          </div>

          {/* Sheet selector (Excel only) */}
          {mode === 'excel-to-csv' && sheets.length > 1 && (
            <div className="trust-card" style={{ padding:16, marginBottom:16 }}>
              <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Sheet to convert</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {sheets.map(s => (
                  <button key={s} onClick={() => { setSelectedSheet(s); updatePreview(s); }}
                    style={{ padding:'5px 12px', borderRadius:'var(--radius-sm)', border:`1px solid ${selectedSheet===s?'#0ea5e9':'var(--border-light)'}`, background:selectedSheet===s?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', fontSize:'0.82rem', fontWeight:selectedSheet===s?700:400, color:selectedSheet===s?'#0ea5e9':'var(--text-secondary)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CSV delimiter (Excel→CSV only) */}
          {mode === 'excel-to-csv' && (
            <div className="trust-card" style={{ padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)' }}>CSV Delimiter:</label>
              {[{v:',',l:'Comma (,)'},{v:';',l:'Semicolon (;)'},{v:'\t',l:'Tab'},{v:'|',l:'Pipe (|)'}].map(({v,l}) => (
                <button key={v} onClick={() => setDelimiter(v)}
                  style={{ padding:'5px 12px', borderRadius:'var(--radius-sm)', border:`1px solid ${delimiter===v?'#0ea5e9':'var(--border-light)'}`, background:delimiter===v?'rgba(14,165,233,0.1)':'var(--bg-section)', cursor:'pointer', fontSize:'0.8rem', fontWeight:delimiter===v?700:400, color:delimiter===v?'#0ea5e9':'var(--text-secondary)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Data preview */}
          {preview.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:8 }}>Data Preview (first {preview.length} rows):</div>
              <div style={{ overflowX:'auto', borderRadius:'var(--radius-md)', border:'1px solid var(--border-light)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
                  <thead>
                    <tr>
                      {(preview[0]||[]).map((cell,ci) => (
                        <th key={ci} style={{ padding:'6px 10px', background:'var(--bg-section)', borderBottom:'2px solid var(--border-light)', textAlign:'left', fontWeight:700, color:'var(--text-secondary)', whiteSpace:'nowrap', maxWidth:160 }}>
                          {String(cell).slice(0,40)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row,ri) => (
                      <tr key={ri} style={{ borderBottom:'1px solid var(--border-light)' }}>
                        {row.map((cell,ci) => (
                          <td key={ci} style={{ padding:'5px 10px', color:'var(--text-secondary)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {String(cell).slice(0,60)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={convert} disabled={processing}
            style={{ width:'100%', padding:13, background:processing?'var(--border-light)':'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'1rem', cursor:processing?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:processing?'none':'0 4px 16px rgba(14,165,233,0.35)' }}>
            {processing ? (<><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite' }} />Converting…</>) : mode==='excel-to-csv' ? '📋 Convert to CSV & Download' : '📊 Convert to Excel & Download'}
          </button>

          {done && (
            <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'var(--radius-md)', display:'flex', gap:16, flexWrap:'wrap', fontSize:'0.85rem' }}>
              <span>✅ <strong>Done!</strong></span>
              <span>📊 {done.rows} rows × {done.cols} columns</span>
              <span>📦 Output: {formatBytes(done.size)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
