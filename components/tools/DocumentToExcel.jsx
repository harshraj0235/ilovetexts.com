'use client';
// DocumentToExcel.jsx v2 — UPGRADED
// NEW: spatial X/Y coordinate PDF table detection,
//      DOCX HTML <table> parsing (not raw text),
//      Excel column widths + header bold,
//      merge selected tables into one sheet,
//      custom sheet names, more preview rows
import { useState, useCallback, useRef } from 'react';

// ─── Spatial PDF table extraction using X/Y coordinates ──────────────────────
function extractTablesFromPdfItems(items, pageHeight) {
  // Group items by Y-row (snap to 4px grid)
  const rows = {};
  items.forEach(item => {
    const y = Math.round((pageHeight - item.transform[5]) / 4) * 4;
    const x = Math.round(item.transform[4]);
    if (!rows[y]) rows[y] = [];
    rows[y].push({ x, text: item.str });
  });
  const sortedRows = Object.entries(rows).sort(([a],[b])=>+a-+b);

  // Detect column boundaries from rows with multiple items at distinct X positions
  const multiColRows = sortedRows.filter(([,cells])=>cells.length>=2);
  if (!multiColRows.length) return [];

  // Find X-column buckets (cluster X positions)
  const allX = multiColRows.flatMap(([,cells])=>cells.map(c=>c.x));
  allX.sort((a,b)=>a-b);
  const xBuckets = [];
  allX.forEach(x => {
    const bucket = xBuckets.find(b=>Math.abs(b-x)<30);
    if (!bucket) xBuckets.push(x);
  });
  xBuckets.sort((a,b)=>a-b);

  if (xBuckets.length < 2) return [];

  // Build table rows by assigning each cell to nearest X bucket
  const tableRows = sortedRows.map(([,cells]) => {
    const row = new Array(xBuckets.length).fill('');
    cells.forEach(cell => {
      const bucketIdx = xBuckets.reduce((bi,bx,i)=>Math.abs(bx-cell.x)<Math.abs(xBuckets[bi]-cell.x)?i:bi,0);
      row[bucketIdx] = (row[bucketIdx]?row[bucketIdx]+' ':'')+cell.text;
    });
    return row.map(c=>c.trim());
  }).filter(row=>row.some(c=>c.length>0));

  // Split on blank rows to find individual tables
  const tables = [];
  let current = [];
  tableRows.forEach(row => {
    if (row.every(c=>!c)) { if(current.length>=2) tables.push(current); current=[]; }
    else current.push(row);
  });
  if (current.length>=2) tables.push(current);
  return tables;
}

// ─── Parse HTML tables from DOCX conversion ──────────────────────────────────
function parseHtmlTables(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html,'text/html');
  const tables = [];
  doc.querySelectorAll('table').forEach(table => {
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('td,th').forEach(td => cells.push(td.textContent.trim()));
      if (cells.some(c=>c)) rows.push(cells);
    });
    if (rows.length>=2) tables.push(rows);
  });
  return tables;
}

function parseTableFromText(text) {
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  const tables = [];
  let current = [];
  lines.forEach(line => {
    const cols = line.includes('|')
      ? line.split('|').map(c=>c.trim()).filter(c=>c&&!/^[-=:]+$/.test(c))
      : line.match(/\s{2,}/) ? line.split(/\s{2,}/).map(c=>c.trim()).filter(Boolean) : null;
    if (cols&&cols.length>=2&&!cols.every(c=>/^[-=:]+$/.test(c))) { current.push(cols); }
    else { if(current.length>=2) tables.push([...current]); current=[]; }
  });
  if (current.length>=2) tables.push(current);
  return tables;
}

function formatBytes(b) { const k=1024,s=['B','KB','MB']; const i=Math.floor(Math.log(b)/Math.log(k)); return (b/Math.pow(k,i)).toFixed(1)+' '+s[i]; }

export default function DocumentToExcel({ t, lang }) {
  const [tables,setTables]          = useState([]);
  const [allText,setAllText]        = useState('');
  const [fileName,setFileName]      = useState('');
  const [loading,setLoading]        = useState(false);
  const [progress,setProgress]      = useState('');
  const [selectedTables,setSelectedTables] = useState(new Set());
  const [sheetNames,setSheetNames]  = useState({});
  const [mergeMode,setMergeMode]    = useState(false);
  const [previewRows,setPreviewRows]= useState({});
  const [dragging,setDragging]      = useState(false);
  const [toast,setToast]            = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const processFile = useCallback(async (file) => {
    setLoading(true); setTables([]); setFileName(file.name); setSheetNames({});
    const ext = file.name.toLowerCase().split('.').pop();
    try {
      let foundTables = [];
      if (ext==='pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data:new Uint8Array(ab) }).promise;
        for (let i=1; i<=doc.numPages; i++) {
          setProgress(`Extracting page ${i}/${doc.numPages}…`);
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale:1 });
          const content = await page.getTextContent();
          // Use spatial extraction for better table detection
          const spatialTables = extractTablesFromPdfItems(content.items, vp.height);
          if (spatialTables.length) {
            foundTables.push(...spatialTables.map(t=>({...t, source:`Page ${i}`})));
          } else {
            // Fallback to text-based
            const text = content.items.map(item=>item.str).join(' ');
            const textTables = parseTableFromText(text);
            foundTables.push(...textTables.map(t=>({...t, source:`Page ${i}`})));
          }
        }
        // Deduplicate identical tables
        const seen = new Set();
        foundTables = foundTables.filter(t=>{ const key=t.flat().join('|').slice(0,100); if(seen.has(key))return false; seen.add(key); return true; });
      } else if (ext==='docx'||ext==='doc') {
        setProgress('Extracting Word tables…');
        const mammoth = await import('mammoth');
        const { value:html } = await mammoth.convertToHtml({ arrayBuffer:await file.arrayBuffer() });
        const htmlTables = parseHtmlTables(html);
        if (htmlTables.length) {
          foundTables = htmlTables.map(t=>Object.assign([...t],{source:'Word table'}));
        } else {
          // Fallback to text
          const { value:rawText } = await mammoth.extractRawText({ arrayBuffer:await file.arrayBuffer() });
          setAllText(rawText);
          foundTables = parseTableFromText(rawText).map(t=>Object.assign([...t],{source:'Text'}));
        }
      } else if (['png','jpg','jpeg','webp'].includes(ext)) {
        setProgress('Running OCR…');
        const url = URL.createObjectURL(file);
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(url,'eng',{logger:m=>{if(m.status==='recognizing text')setProgress(`OCR: ${Math.round(m.progress*100)}%`);}});
        foundTables = parseTableFromText(result.data.text);
      } else if (ext==='txt'||ext==='csv') {
        const text = new TextDecoder().decode(await file.arrayBuffer());
        setAllText(text);
        foundTables = parseTableFromText(text);
      }

      // Normalize all tables to plain 2D arrays
      const normalized = foundTables.map(t=>Array.isArray(t[0])?t:t);
      setTables(normalized);
      const newSheetNames = {};
      normalized.forEach((_,i)=>{ newSheetNames[i]=`Table ${i+1}`; });
      setSheetNames(newSheetNames);
      setSelectedTables(new Set(normalized.map((_,i)=>i)));
      if (!normalized.length) showToast('No tables found. The document may not contain tabular data.','warning');
      else showToast(`Found ${normalized.length} table${normalized.length!==1?'s':''}!`);
    } catch(e) { showToast('Failed: '+e.message,'error'); console.error(e); }
    finally { setLoading(false); setProgress(''); }
  }, []);

  const exportExcel = useCallback(async () => {
    if (!tables.length) return;
    const XLSX = (await import('xlsx')).default||(await import('xlsx'));
    const wb = XLSX.utils.book_new();
    if (mergeMode) {
      const merged = tables.filter((_,i)=>selectedTables.has(i)).flatMap((t,i)=>[...(i>0?[[]]:[]),  ...t]);
      const ws = XLSX.utils.aoa_to_sheet(merged);
      const maxCols = Math.max(...merged.map(r=>r.length));
      ws['!cols'] = new Array(maxCols).fill(0).map((_,ci)=>({ wch: Math.max(...merged.map(r=>(r[ci]||'').toString().length),8) }));
      XLSX.utils.book_append_sheet(wb,'Merged Tables',ws);
    } else {
      tables.forEach((table,i) => {
        if (!selectedTables.has(i)) return;
        const ws = XLSX.utils.aoa_to_sheet(table);
        // Set column widths
        const maxCols = Math.max(...table.map(r=>r.length));
        ws['!cols'] = new Array(maxCols).fill(0).map((_,ci)=>({ wch: Math.max(...table.map(r=>(r[ci]||'').toString().length),8,20) }));
        // Bold first row
        if (table.length>0) {
          table[0].forEach((_,ci)=>{
            const cellAddr = XLSX.utils.encode_cell({r:0,c:ci});
            if (ws[cellAddr]) ws[cellAddr].s={font:{bold:true}};
          });
        }
        const name = (sheetNames[i]||`Table ${i+1}`).slice(0,31);
        XLSX.utils.book_append_sheet(wb,ws,name);
      });
    }
    XLSX.writeFile(wb,fileName.replace(/\.[^.]+$/,'')+'-tables.xlsx');
    showToast('Excel downloaded!');
  }, [tables, selectedTables, sheetNames, fileName, mergeMode]);

  const exportCSV = useCallback(() => {
    const sel = tables.filter((_,i)=>selectedTables.has(i));
    const csv = sel.map((table,i)=>`--- Table ${i+1} ---\n`+table.map(row=>row.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')).join('\n\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fileName.replace(/\.[^.]+$/,'')+'-tables.csv'; a.click();
    showToast('CSV downloaded!');
  }, [tables, selectedTables, fileName]);

  return (
    <div style={{maxWidth:900,margin:'0 auto',width:'100%'}}>
      {toast&&<div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}
      <div style={{textAlign:'center',marginBottom:22}}>
        <div style={{fontSize:'2.5rem',marginBottom:8}}>📋</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 6px'}}>Document to Excel Extractor</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>PDF (spatial table detection) · Word (HTML table parser) · Images (OCR) → Excel with column widths + merge mode</p>
      </div>

      {!tables.length?(
        <div onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>!loading&&inputRef.current?.click()}
          style={{border:`2px dashed ${dragging?'#7c3aed':'var(--border-light)'}`,borderRadius:'var(--radius-lg)',padding:'60px 24px',textAlign:'center',cursor:loading?'default':'pointer',background:dragging?'rgba(124,58,237,0.04)':'var(--bg-section)'}}>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt,.csv,.png,.jpg,.jpeg" style={{display:'none'}} onChange={e=>{processFile(e.target.files[0]);e.target.value='';}} />
          {loading?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <div style={{width:48,height:48,border:'4px solid #7c3aed',borderTopColor:'transparent',borderRadius:'50%',animation:'ilt-spin 0.8s linear infinite'}}/>
              <p style={{margin:0,fontWeight:600}}>{progress}</p>
            </div>
          ):(
            <>
              <div style={{fontSize:52,marginBottom:12}}>📋</div>
              <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:8}}>Drop any document to extract tables</h3>
              <p style={{color:'var(--text-secondary)',marginBottom:16}}>PDF (spatial detection) · Word DOCX · TXT · CSV · JPG · PNG</p>
              <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:18,flexWrap:'wrap'}}>
                {['PDF','DOCX','TXT','CSV','JPG','PNG'].map(f=><span key={f} style={{padding:'3px 10px',borderRadius:20,background:'var(--bg-main)',border:'1px solid var(--border-light)',fontSize:'0.72rem',fontWeight:600,color:'var(--text-secondary)'}}>{f}</span>)}
              </div>
              <button style={{padding:'11px 28px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer',fontSize:'0.95rem'}} onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>Choose Document</button>
              <p style={{marginTop:12,fontSize:'0.72rem',color:'var(--text-tertiary)'}}>🔒 Everything in your browser — 100% private</p>
            </>
          )}
        </div>
      ):(
        <>
          <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:'0.85rem',fontWeight:700}}>📋 {fileName} — {tables.length} table{tables.length!==1?'s':''} found</span>
            <button onClick={()=>setSelectedTables(new Set(tables.map((_,i)=>i)))} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'4px 9px'}}>All</button>
            <button onClick={()=>setSelectedTables(new Set())} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'4px 9px'}}>None</button>
            <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:'0.8rem'}}>
              <div onClick={()=>setMergeMode(v=>!v)} style={{width:32,height:17,borderRadius:8.5,background:mergeMode?'#7c3aed':'var(--border-light)',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                <div style={{position:'absolute',top:1.5,left:mergeMode?14:1.5,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
              </div>
              Merge into one sheet
            </label>
            <button onClick={exportExcel} className="btn-primary" style={{padding:'6px 14px',fontSize:'0.82rem'}}>⬇ Excel ({selectedTables.size})</button>
            <button onClick={exportCSV} className="btn btn-secondary" style={{fontSize:'0.82rem',padding:'6px 12px'}}>⬇ CSV</button>
            <button onClick={()=>{setTables([]);setFileName('');}} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'4px 9px'}}>🔄 New</button>
          </div>

          {tables.map((table,ti)=>{
            const showRows = previewRows[ti]||8;
            return (
              <div key={ti} className="trust-card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
                <div style={{padding:'9px 14px',background:selectedTables.has(ti)?'rgba(124,58,237,0.07)':'var(--bg-section)',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--border-light)',cursor:'pointer',flexWrap:'wrap'}}
                  onClick={()=>setSelectedTables(prev=>{const n=new Set(prev);n.has(ti)?n.delete(ti):n.add(ti);return n;})}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selectedTables.has(ti)?'#7c3aed':'var(--border-light)'}`,background:selectedTables.has(ti)?'#7c3aed':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {selectedTables.has(ti)&&<span style={{color:'#fff',fontSize:'0.68rem',fontWeight:800}}>✓</span>}
                  </div>
                  <span style={{fontWeight:700,fontSize:'0.85rem'}}>Table {ti+1}</span>
                  <span style={{fontSize:'0.72rem',color:'var(--text-tertiary)'}}>{table.length} rows × {table[0]?.length||0} cols</span>
                  {/* Editable sheet name */}
                  <input value={sheetNames[ti]||`Table ${ti+1}`} onChange={e=>{e.stopPropagation();setSheetNames(p=>({...p,[ti]:e.target.value}));}} onClick={e=>e.stopPropagation()}
                    style={{marginLeft:'auto',padding:'2px 7px',border:'1px solid var(--border-light)',borderRadius:4,fontSize:'0.75rem',background:'var(--bg-main)',color:'var(--text-primary)',width:110}} placeholder="Sheet name" />
                </div>
                <div style={{overflowX:'auto',maxHeight:220}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.78rem'}}>
                    <thead><tr>{(table[0]||[]).map((cell,ci)=><th key={ci} style={{padding:'6px 10px',background:'var(--bg-section)',borderBottom:'2px solid var(--border-light)',textAlign:'left',fontWeight:700,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>{cell}</th>)}</tr></thead>
                    <tbody>
                      {table.slice(1,showRows+1).map((row,ri)=>(
                        <tr key={ri} style={{borderBottom:'1px solid var(--border-light)'}}>
                          {row.map((cell,ci)=><td key={ci} style={{padding:'5px 10px',color:'var(--text-secondary)',whiteSpace:'nowrap',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {table.length>showRows+1&&(
                  <div style={{padding:'6px',textAlign:'center'}}>
                    <button onClick={()=>setPreviewRows(p=>({...p,[ti]:(showRows+10)}))} style={{background:'none',border:'none',cursor:'pointer',color:'#7c3aed',fontSize:'0.75rem',fontWeight:600}}>Show more rows ({table.length-showRows-1} remaining)</button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
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
