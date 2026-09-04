'use client';
// ScannedPdfToData.jsx v2 — UPGRADED
// NEW: field type inference (date/currency/email/phone),
//      OCR scale control, canvas preview of scanned pages,
//      maxPages slider, better KV parser
import { useState, useCallback, useRef } from 'react';

function inferType(value) {
  const v = String(value).trim();
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(v)) return 'date';
  if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(v)) return 'date';
  if (/^[\$£€₹]?[\d,]+\.?\d{0,2}$/.test(v) && v.length > 1) return 'currency';
  if (/^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$/i.test(v)) return 'email';
  if (/^[\+\d\s\-\(\)]{7,15}$/.test(v) && /\d{5,}/.test(v)) return 'phone';
  if (/^\d+$/.test(v)) return 'number';
  return 'text';
}

const TYPE_ICONS = { date:'📅', currency:'💰', email:'📧', phone:'📞', number:'🔢', text:'📝' };
const TYPE_COLORS = { date:'#0ea5e9', currency:'#10b981', email:'#8b5cf6', phone:'#f59e0b', number:'#6366f1', text:'var(--text-secondary)' };

function parseStructured(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const kvPairs = [], tableRows = [], listItems = [];
  lines.forEach(line => {
    // Improved KV regex: handles "1. Name:", "Name:", "Name -", numeric prefix keys
    const kvMatch = line.match(/^(?:\d+[.)]\s*)?([A-Za-z][A-Za-z\s\/\-]{1,35}?)[\s:–\-]+(.{2,120})$/);
    if (kvMatch && !line.match(/\s{3,}/) && line.split(/\s+/).length < 15) {
      const val = kvMatch[2].trim();
      kvPairs.push({ key:kvMatch[1].trim(), value:val, type:inferType(val) });
      return;
    }
    if (line.includes('|') || line.match(/\s{3,}/)) {
      const cols = line.includes('|')
        ? line.split('|').map(c=>c.trim()).filter(c=>c&&!/^[-=:]+$/.test(c))
        : line.split(/\s{3,}/).map(c=>c.trim()).filter(Boolean);
      if (cols.length >= 2 && !cols.every(c=>/^[-=:]+$/.test(c))) { tableRows.push(cols); return; }
    }
    if (line.match(/^[-•*●▸]\s+/)) { listItems.push(line.replace(/^[-•*●▸]\s+/,'')); return; }
  });
  return { kvPairs, tableRows, listItems, rawText:text };
}

export default function ScannedPdfToData({ t, lang }) {
  const [pages,setPages]           = useState([]);
  const [fileName,setFileName]     = useState('');
  const [loading,setLoading]       = useState(false);
  const [progress,setProgress]     = useState('');
  const [outputFmt,setOutputFmt]   = useState('json');
  const [ocrScale,setOcrScale]     = useState(2);
  const [maxPages,setMaxPages]     = useState(10);
  const [totalPdfPages,setTotalPdfPages] = useState(0);
  const [activeTab,setActiveTab]   = useState('structured'); // structured|raw
  const [dragging,setDragging]     = useState(false);
  const [toast,setToast]           = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),3000); };

  const processFile = useCallback(async (file) => {
    setLoading(true); setPages([]); setFileName(file.name);
    const ext = file.name.toLowerCase().split('.').pop();
    try {
      if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        setTotalPdfPages(doc.numPages);
        const limit = Math.min(doc.numPages, maxPages);
        const results = [];
        for (let i=1; i<=limit; i++) {
          setProgress(`Page ${i}/${limit}…`);
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          let text = content.items.map(item=>item.str).join(' ');
          let thumbUrl = null;
          // Render thumbnail regardless
          const vp = page.getViewport({ scale: Math.min(ocrScale, 1.5) });
          const canvas = document.createElement('canvas');
          canvas.width=Math.floor(vp.width); canvas.height=Math.floor(vp.height);
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext:ctx, viewport:vp }).promise;
          thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
          // OCR if text is sparse
          if (text.trim().split(/\s+/).length < 15) {
            setProgress(`OCR page ${i} (scanned)…`);
            const Tesseract = (await import('tesseract.js')).default;
            const hiVp = page.getViewport({ scale: ocrScale });
            const hiCanvas = document.createElement('canvas');
            hiCanvas.width=Math.floor(hiVp.width); hiCanvas.height=Math.floor(hiVp.height);
            await page.render({ canvasContext:hiCanvas.getContext('2d'), viewport:hiVp }).promise;
            const result = await Tesseract.recognize(hiCanvas.toDataURL(),'eng');
            text = result.data.text;
          }
          results.push({ page:i, text, structured:parseStructured(text), thumbUrl });
        }
        setPages(results);
        showToast(`Extracted data from ${results.length} page${results.length!==1?'s':''}!`);
      } else if (['png','jpg','jpeg','webp'].includes(ext)) {
        setProgress('Running OCR…');
        const url = URL.createObjectURL(file);
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(url,'eng',{logger:m=>{if(m.status==='recognizing text')setProgress(`OCR: ${Math.round(m.progress*100)}%`);}});
        const text = result.data.text;
        setPages([{ page:1, text, structured:parseStructured(text), thumbUrl:url }]);
        showToast('Data extracted!');
      }
    } catch(e) { showToast('Failed: '+e.message,'error'); }
    finally { setLoading(false); setProgress(''); }
  }, [maxPages, ocrScale]);

  const exportData = () => {
    if (!pages.length) return;
    const allData = pages.map(p => ({ page:p.page, keyValuePairs:p.structured.kvPairs, tableData:p.structured.tableRows, listItems:p.structured.listItems }));
    let content, mime, ext;
    if (outputFmt==='json') { content=JSON.stringify(allData,null,2); mime='application/json'; ext='json'; }
    else if (outputFmt==='csv') {
      const rows = [['Page','Key','Value','Type']];
      allData.forEach(p => p.keyValuePairs.forEach(kv=>rows.push([p.page,kv.key,kv.value,kv.type])));
      content = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      mime='text/csv'; ext='csv';
    } else { content=pages.map(p=>`--- Page ${p.page} ---\n${p.text}`).join('\n\n'); mime='text/plain'; ext='txt'; }
    const blob=new Blob([content],{type:mime});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fileName.replace(/\.[^.]+$/,'')+'-data.'+ext; a.click();
    showToast('Downloaded!');
  };

  const totalKV = pages.reduce((s,p)=>s+p.structured.kvPairs.length,0);
  const totalTables = pages.reduce((s,p)=>s+(p.structured.tableRows.length>0?1:0),0);

  return (
    <div style={{maxWidth:900,margin:'0 auto',width:'100%'}}>
      {toast&&<div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}
      <div style={{textAlign:'center',marginBottom:22}}>
        <div style={{fontSize:'2.5rem',marginBottom:8}}>📊</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 6px'}}>Scanned PDF to Structured Data</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>Upload scanned PDF or image → OCR + type inference → Export key-value pairs, tables → JSON / CSV / TXT</p>
      </div>

      {!pages.length ? (
        <>
          {/* Settings */}
          <div className="trust-card" style={{padding:16,marginBottom:14,display:'flex',flexWrap:'wrap',gap:16,alignItems:'flex-end'}}>
            <div>
              <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>OCR Quality</label>
              <select value={ocrScale} onChange={e=>setOcrScale(+e.target.value)} style={{padding:'6px 8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.85rem'}}>
                <option value={1.5}>Fast (72 DPI)</option>
                <option value={2}>Standard (144 DPI)</option>
                <option value={3}>High (216 DPI)</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Max pages: {maxPages}</label>
              <input type="range" min={1} max={50} value={maxPages} onChange={e=>setMaxPages(+e.target.value)} style={{width:120,accentColor:'#7c3aed'}}/>
            </div>
          </div>
          <div onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>!loading&&inputRef.current?.click()}
            style={{border:`2px dashed ${dragging?'#7c3aed':'var(--border-light)'}`,borderRadius:'var(--radius-lg)',padding:'55px 24px',textAlign:'center',cursor:loading?'default':'pointer',background:dragging?'rgba(124,58,237,0.04)':'var(--bg-section)'}}>
            <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{display:'none'}} onChange={e=>{processFile(e.target.files[0]);e.target.value='';}} />
            {loading?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                <div style={{width:48,height:48,border:'4px solid #7c3aed',borderTopColor:'transparent',borderRadius:'50%',animation:'ilt-spin 0.8s linear infinite'}}/>
                <p style={{margin:0,fontWeight:600}}>{progress}</p>
              </div>
            ):(
              <>
                <div style={{fontSize:52,marginBottom:12}}>📊</div>
                <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:8}}>Drop scanned PDF or image</h3>
                <p style={{color:'var(--text-secondary)',marginBottom:16}}>Auto-detects text vs scanned — uses Tesseract OCR when needed</p>
                <button style={{padding:'11px 28px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer'}} onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>Choose File</button>
                <p style={{marginTop:12,fontSize:'0.75rem',color:'var(--text-tertiary)'}}>🔒 OCR runs in your browser — nothing uploaded</p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Summary */}
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[{l:'Pages',v:pages.length,c:'#7c3aed'},{l:'KV Pairs',v:totalKV,c:'#10b981'},{l:'Tables',v:totalTables,c:'#0ea5e9'}].map(s=>(
                <div key={s.l} style={{padding:'6px 12px',background:'var(--bg-section)',border:'1px solid var(--border-light)',borderRadius:'var(--radius-sm)',textAlign:'center'}}>
                  <div style={{fontSize:'1.1rem',fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)'}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
              {['json','csv','txt'].map(f=>(
                <button key={f} onClick={()=>setOutputFmt(f)} style={{padding:'5px 10px',borderRadius:'var(--radius-sm)',border:`1px solid ${outputFmt===f?'#7c3aed':'var(--border-light)'}`,background:outputFmt===f?'rgba(124,58,237,0.1)':'var(--bg-section)',color:outputFmt===f?'#7c3aed':'var(--text-secondary)',fontWeight:outputFmt===f?700:400,fontSize:'0.75rem',cursor:'pointer',textTransform:'uppercase'}}>{f}</button>
              ))}
              <button onClick={exportData} className="btn-primary" style={{padding:'5px 14px',fontSize:'0.82rem'}}>⬇ Export</button>
              <button onClick={()=>{setPages([]);setFileName('');}} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>🔄 New</button>
            </div>
          </div>

          {/* View tabs */}
          <div style={{display:'flex',borderBottom:'1px solid var(--border-light)',marginBottom:14}}>
            {[['structured','🗂 Structured'],['raw','📄 Raw Text']].map(([v,l])=>(
              <button key={v} onClick={()=>setActiveTab(v)} style={{padding:'7px 14px',border:'none',background:'transparent',borderBottom:`2px solid ${activeTab===v?'#7c3aed':'transparent'}`,color:activeTab===v?'#7c3aed':'var(--text-secondary)',fontWeight:activeTab===v?700:500,cursor:'pointer',fontSize:'0.82rem',marginBottom:-1}}>{l}</button>
            ))}
          </div>

          {pages.map(p => (
            <div key={p.page} className="trust-card" style={{padding:0,overflow:'hidden',marginBottom:14}}>
              {/* Page header with thumbnail */}
              <div style={{padding:'10px 14px',background:'rgba(124,58,237,0.06)',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',gap:12}}>
                {p.thumbUrl&&<img src={p.thumbUrl} alt={`Page ${p.page}`} style={{height:50,width:38,objectFit:'cover',borderRadius:3,border:'1px solid var(--border-light)',flexShrink:0}}/>}
                <div><div style={{fontWeight:700,fontSize:'0.88rem',color:'#7c3aed'}}>Page {p.page}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-tertiary)'}}>{p.structured.kvPairs.length} KV · {p.structured.tableRows.length} table rows · {p.structured.listItems.length} list items</div>
                </div>
              </div>
              <div style={{padding:14}}>
                {activeTab==='structured' && (
                  <>
                    {p.structured.kvPairs.length>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-tertiary)',textTransform:'uppercase',marginBottom:6}}>Key-Value Pairs</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:5}}>
                          {p.structured.kvPairs.slice(0,24).map((kv,i)=>(
                            <div key={i} style={{display:'flex',gap:6,padding:'5px 8px',background:'var(--bg-section)',borderRadius:4,alignItems:'flex-start'}}>
                              <span title={kv.type} style={{fontSize:'0.8rem',flexShrink:0}}>{TYPE_ICONS[kv.type]||'📝'}</span>
                              <span style={{fontWeight:600,color:TYPE_COLORS[kv.type]||'#7c3aed',fontSize:'0.75rem',whiteSpace:'nowrap'}}>{kv.key}:</span>
                              <span style={{fontSize:'0.75rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{kv.value}</span>
                              <span style={{fontSize:'0.6rem',color:'var(--text-tertiary)',marginLeft:'auto',flexShrink:0,fontStyle:'italic'}}>{kv.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.structured.tableRows.length>0&&(
                      <div style={{marginBottom:12,overflowX:'auto'}}>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-tertiary)',textTransform:'uppercase',marginBottom:5}}>Table Data</div>
                        <table style={{borderCollapse:'collapse',fontSize:'0.78rem',width:'100%'}}>
                          {p.structured.tableRows.slice(0,15).map((row,ri)=>(
                            <tr key={ri} style={{borderBottom:'1px solid var(--border-light)',background:ri%2?'var(--bg-section)':'transparent'}}>
                              {row.map((cell,ci)=><td key={ci} style={{padding:'4px 8px',fontWeight:ri===0?700:400,color:ri===0?'var(--text-primary)':'var(--text-secondary)'}}>{cell}</td>)}
                            </tr>
                          ))}
                        </table>
                      </div>
                    )}
                  </>
                )}
                {activeTab==='raw'&&<pre style={{fontSize:'0.75rem',color:'var(--text-secondary)',maxHeight:150,overflowY:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word',background:'var(--bg-section)',padding:8,borderRadius:4,margin:0}}>{p.text.slice(0,800)}{p.text.length>800?'…':''}</pre>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}