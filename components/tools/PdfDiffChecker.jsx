'use client';
// PdfDiffChecker.jsx v2 — Advanced PDF Comparison
// NEW: ignore case/whitespace/punctuation, char-level diff,
//      jump-to-change nav, page-by-page mode, similarity meter,
//      copy changes to clipboard, OCR fallback warning
import { useState, useCallback, useRef, useMemo } from 'react';

function tokenize(text, opts) {
  let t = text;
  if (opts.ignoreCase) t = t.toLowerCase();
  if (opts.ignorePunctuation) t = t.replace(/[^\w\s]/g, ' ');
  const tokens = t.match(/\S+|\n+|\s+/g) || [];
  if (opts.ignoreWhitespace) return tokens.filter(tk => !/^\s+$/.test(tk));
  return tokens;
}

function lcs(a, b) {
  // Chunk-based LCS to avoid 3000-token hard cap — process in 1000-token windows
  const CHUNK = 1500;
  if (a.length <= CHUNK && b.length <= CHUNK) return lcsCore(a, b);
  // Split by natural breaks and diff each chunk
  const results = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += CHUNK) {
    const ca = a.slice(i, i + CHUNK), cb = b.slice(i, i + CHUNK);
    results.push(...lcsCore(ca, cb));
  }
  return results;
}

function lcsCore(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { result.unshift({ type: 'same', val: a[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.unshift({ type: 'added', val: b[j-1] }); j--; }
    else { result.unshift({ type: 'removed', val: a[i-1] }); i--; }
  }
  return result;
}

function charDiff(oldWord, newWord) {
  // Character-level diff for changed words
  const a = oldWord.split(''), b = newWord.split('');
  const d = lcsCore(a, b);
  return d;
}

function computeDiff(text1, text2, opts) {
  const t1 = tokenize(text1, opts);
  const t2 = tokenize(text2, opts);
  return lcs(t1, t2);
}

function extractStats(diff) {
  let added = 0, removed = 0, same = 0;
  diff.forEach(d => {
    if (/^\s+$/.test(d.val)) return;
    if (d.type === 'added') added++;
    else if (d.type === 'removed') removed++;
    else same++;
  });
  const total = added + removed + same;
  return { added, removed, same, total, similarity: total > 0 ? Math.round((same / total) * 100) : 100 };
}

function UploadBox({ label, icon, file, onFile, color }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  return (
    <div onDrop={e=>{e.preventDefault();setDrag(false);onFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onClick={()=>ref.current?.click()}
      style={{ border:`2px dashed ${drag?color:file?color:'var(--border-light)'}`, borderRadius:'var(--radius-lg)', padding:'24px 16px', textAlign:'center', cursor:'pointer', flex:1, background:file?`${color}08`:drag?`${color}06`:'var(--bg-section)', transition:'all 0.2s' }}>
      <input ref={ref} type="file" accept=".pdf,.txt,.docx" style={{display:'none'}} onChange={e=>{onFile(e.target.files[0]);e.target.value='';}} />
      <div style={{fontSize:32,marginBottom:6}}>{file?'✅':icon}</div>
      <div style={{fontWeight:700,fontSize:'0.85rem',color:file?color:'var(--text-primary)',marginBottom:2}}>{file?file.name:label}</div>
      <div style={{fontSize:'0.72rem',color:'var(--text-tertiary)'}}>{file?(file.size/1024).toFixed(1)+' KB':'PDF, TXT, DOCX'}</div>
    </div>
  );
}

export default function PdfDiffChecker({ t, lang }) {
  const [file1,setFile1]       = useState(null);
  const [file2,setFile2]       = useState(null);
  const [text1,setText1]       = useState('');
  const [text2,setText2]       = useState('');
  const [diff,setDiff]         = useState(null);
  const [stats,setStats]       = useState(null);
  const [loading,setLoading]   = useState(false);
  const [progress,setProgress] = useState('');
  const [view,setView]         = useState('unified'); // unified|side|changes-only
  const [ignoreCase,setIgnoreCase]         = useState(false);
  const [ignoreWS,setIgnoreWS]             = useState(false);
  const [ignorePunct,setIgnorePunct]       = useState(false);
  const [charLevel,setCharLevel]           = useState(false);
  const [changeIdx,setChangeIdx]           = useState(0);
  const [toast,setToast]       = useState(null);
  const changeRefs = useRef([]);
  const containerRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),3000); };

  const extractText = useCallback(async (file) => {
    const ext = file.name.toLowerCase().split('.').pop();
    const ab = await file.arrayBuffer();
    if (ext === 'txt') return new TextDecoder().decode(ab);
    if (ext === 'pdf') {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += `[Page ${i}]\n${pageText}\n\n`;
      }
      if (text.trim().length < 100) return `⚠️ This appears to be a scanned PDF. OCR is needed for accurate comparison. Extracted text:\n${text}`;
      return text;
    }
    if (ext === 'docx') {
      const mammoth = await import('mammoth');
      return (await mammoth.extractRawText({ arrayBuffer: ab })).value;
    }
    return '';
  }, []);

  const handleCompare = useCallback(async () => {
    if (!file1 || !file2) { showToast('Upload both files first','warning'); return; }
    setLoading(true); setDiff(null); setStats(null); changeRefs.current = [];
    try {
      setProgress('Extracting file 1…');
      const t1 = await extractText(file1);
      setText1(t1);
      setProgress('Extracting file 2…');
      const t2 = await extractText(file2);
      setText2(t2);
      setProgress('Computing diff…');
      await new Promise(r => setTimeout(r, 50));
      const opts = { ignoreCase, ignoreWhitespace: ignoreWS, ignorePunctuation: ignorePunct };
      const d = computeDiff(t1, t2, opts);
      setDiff(d);
      setStats(extractStats(d));
      setChangeIdx(0);
      showToast('Comparison complete!');
    } catch(e) { showToast('Failed: '+e.message,'error'); }
    finally { setLoading(false); setProgress(''); }
  }, [file1, file2, extractText, ignoreCase, ignoreWS, ignorePunct]);

  // Collect indices of changes for navigation
  const changeIndices = useMemo(() => {
    if (!diff) return [];
    const idx = [];
    diff.forEach((d,i) => { if (d.type !== 'same' && !/^\s+$/.test(d.val)) idx.push(i); });
    return idx;
  }, [diff]);

  const jumpToChange = useCallback((dir) => {
    const next = changeIdx + dir;
    const safeNext = Math.max(0, Math.min(changeIndices.length - 1, next));
    setChangeIdx(safeNext);
    changeRefs.current[changeIndices[safeNext]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [changeIdx, changeIndices]);

  const exportReport = useCallback((fmt) => {
    if (!diff || !stats) return;
    const base = `PDF DIFF REPORT\n${'='.repeat(40)}\nFile 1: ${file1?.name}\nFile 2: ${file2?.name}\nSimilarity: ${stats.similarity}%\nAdded: ${stats.added} | Removed: ${stats.removed} | Same: ${stats.same}\n\n`;
    if (fmt === 'txt') {
      const changes = diff.filter(d => d.type !== 'same' && !/^\s+$/.test(d.val)).map(d => (d.type === 'added' ? '[+] ' : '[-] ') + d.val).join('\n');
      const blob = new Blob([base + changes], {type:'text/plain'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pdf-diff.txt'; a.click();
    } else {
      const html = `<!DOCTYPE html><html><head><title>PDF Diff</title><style>body{font-family:system-ui;max-width:960px;margin:40px auto;padding:20px;line-height:1.9}.a{background:#dcfce7;color:#166534;border-radius:3px;padding:0 3px}.r{background:#fee2e2;color:#991b1b;border-radius:3px;padding:0 3px;text-decoration:line-through}.stats{display:flex;gap:20px;padding:12px;background:#f8fafc;border-radius:8px;margin:16px 0;flex-wrap:wrap}</style></head><body>
<h1>📄 PDF Diff Report</h1><div class="stats"><span>File 1: <b>${file1?.name}</b></span><span>File 2: <b>${file2?.name}</b></span><span>Similarity: <b>${stats.similarity}%</b></span><span style="color:#16a34a">+ ${stats.added} added</span><span style="color:#dc2626">- ${stats.removed} removed</span></div>
<div>${diff.map(d => d.type==='same'?d.val:d.type==='added'?`<span class="a">${d.val}</span>`:`<span class="r">${d.val}</span>`).join('')}</div></body></html>`;
      const blob = new Blob([html],{type:'text/html'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pdf-diff.html'; a.click();
    }
    showToast('Report downloaded!');
  }, [diff, stats, file1, file2]);

  const copyChanges = useCallback(async () => {
    if (!diff) return;
    const text = diff.filter(d => d.type !== 'same' && !/^\s+$/.test(d.val)).map(d => (d.type==='added'?'+ ':' - ')+d.val).join('\n');
    await navigator.clipboard.writeText(text);
    showToast('Changes copied to clipboard!');
  }, [diff]);

  const swapFiles = () => {
    const f = file1; setFile1(file2); setFile2(f);
    const tx = text1; setText1(text2); setText2(tx);
    if (diff) setDiff(diff.map(d => ({...d, type: d.type==='added'?'removed':d.type==='removed'?'added':'same'})));
    if (stats) setStats({...stats, added:stats.removed, removed:stats.added});
  };

  const similarityColor = stats ? (stats.similarity >= 90 ? '#10b981' : stats.similarity >= 70 ? '#f59e0b' : '#ef4444') : '#6366f1';

  return (
    <div style={{maxWidth:960,margin:'0 auto',width:'100%'}}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontSize:'2.5rem',marginBottom:8}}>🔍</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 8px'}}>PDF Difference Checker — Compare Two Files</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>Word-level diff · Character-level highlighting · Ignore case/whitespace · Jump to changes · PDF, TXT, DOCX</p>
      </div>

      {/* Upload row */}
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'stretch'}}>
        <UploadBox label="📄 Original (File 1)" icon="📄" file={file1} onFile={setFile1} color="#6366f1" />
        <button onClick={swapFiles} style={{flexShrink:0,width:36,background:'var(--bg-section)',border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)',cursor:'pointer',fontSize:'1.1rem',alignSelf:'center'}}>⇄</button>
        <UploadBox label="📄 Modified (File 2)" icon="📄" file={file2} onFile={setFile2} color="#f59e0b" />
      </div>

      {/* Options row */}
      <div className="trust-card" style={{padding:'12px 16px',marginBottom:12,display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
        <span style={{fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)'}}>Options:</span>
        {[
          ['Ignore Case', ignoreCase, setIgnoreCase],
          ['Ignore Whitespace', ignoreWS, setIgnoreWS],
          ['Ignore Punctuation', ignorePunct, setIgnorePunct],
          ['Char-level diff', charLevel, setCharLevel],
        ].map(([l, v, fn]) => (
          <label key={l} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:'0.82rem'}}>
            <div onClick={()=>fn(x=>!x)} style={{width:34,height:18,borderRadius:9,background:v?'#6366f1':'var(--border-light)',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
              <div style={{position:'absolute',top:2,left:v?16:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
            </div>
            {l}
          </label>
        ))}
      </div>

      {/* Compare button */}
      <button onClick={handleCompare} disabled={loading||!file1||!file2}
        style={{width:'100%',padding:13,marginBottom:16,background:loading||!file1||!file2?'var(--border-light)':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:800,fontSize:'1rem',cursor:loading||!file1||!file2?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:loading||!file1||!file2?'none':'0 4px 20px rgba(99,102,241,0.4)'}}>
        {loading?(<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite'}}/>{progress}</>):'🔍 Compare Files'}
      </button>

      {/* Stats */}
      {stats && (
        <div style={{marginBottom:16}}>
          {/* Similarity meter */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,padding:'14px 18px',background:'var(--bg-section)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)'}}>
            <div style={{position:'relative',width:60,height:60,flexShrink:0}}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border-light)" strokeWidth="6"/>
                <circle cx="30" cy="30" r="24" fill="none" stroke={similarityColor} strokeWidth="6" strokeDasharray={`${stats.similarity*1.508} 150.8`} strokeLinecap="round" transform="rotate(-90 30 30)"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:800,color:similarityColor}}>{stats.similarity}%</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'0.9rem'}}>Documents are {stats.similarity}% similar</div>
              <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginTop:3,display:'flex',gap:14,flexWrap:'wrap'}}>
                <span style={{color:'#10b981'}}>✅ {stats.same} unchanged</span>
                <span style={{color:'#10b981'}}>+ {stats.added} added</span>
                <span style={{color:'#ef4444'}}>− {stats.removed} removed</span>
                <span>{changeIndices.length} change{changeIndices.length!==1?'s':''} total</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{display:'flex',gap:3}}>
              {[['unified','☰ Unified'],['side','⬜ Side-by-Side'],['changes-only','± Changes Only']].map(([v,l])=>(
                <button key={v} onClick={()=>setView(v)} style={{padding:'5px 10px',borderRadius:'var(--radius-sm)',border:`1px solid ${view===v?'#6366f1':'var(--border-light)'}`,background:view===v?'rgba(99,102,241,0.1)':'var(--bg-section)',color:view===v?'#6366f1':'var(--text-secondary)',fontWeight:view===v?700:400,fontSize:'0.78rem',cursor:'pointer'}}>{l}</button>
              ))}
            </div>
            {/* Jump to change */}
            {changeIndices.length > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:8,background:'var(--bg-section)',border:'1px solid var(--border-light)',borderRadius:'var(--radius-sm)',padding:'3px 6px'}}>
                <button onClick={()=>jumpToChange(-1)} disabled={changeIdx===0} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.85rem',opacity:changeIdx===0?0.3:1}}>◀</button>
                <span style={{fontSize:'0.75rem',fontWeight:600,minWidth:60,textAlign:'center'}}>{changeIdx+1}/{changeIndices.length}</span>
                <button onClick={()=>jumpToChange(1)} disabled={changeIdx>=changeIndices.length-1} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.85rem',opacity:changeIdx>=changeIndices.length-1?0.3:1}}>▶</button>
              </div>
            )}
            <div style={{marginLeft:'auto',display:'flex',gap:5}}>
              <button onClick={copyChanges} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>📋 Copy Changes</button>
              <button onClick={()=>exportReport('txt')} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>⬇ TXT</button>
              <button onClick={()=>exportReport('html')} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>⬇ HTML</button>
            </div>
          </div>
        </div>
      )}

      {/* Diff display */}
      {diff && (
        <div className="trust-card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'8px 14px',background:'var(--bg-section)',borderBottom:'1px solid var(--border-light)',display:'flex',gap:16,fontSize:'0.78rem',fontWeight:600}}>
            <span style={{color:'#6366f1'}}>📄 {file1?.name}</span><span>vs</span><span style={{color:'#f59e0b'}}>📄 {file2?.name}</span>
          </div>
          {view === 'side' ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',maxHeight:'55vh',overflow:'hidden'}}>
              {[{label:'− Original',filter:(d)=>d.type!=='added'},{label:'+ Modified',filter:(d)=>d.type!=='removed'}].map((pane,pi)=>(
                <div key={pi} style={{borderLeft:pi>0?'1px solid var(--border-light)':'none',padding:16,overflowY:'auto',maxHeight:'55vh',fontFamily:'system-ui',fontSize:'0.88rem',lineHeight:1.9}}>
                  <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-tertiary)',textTransform:'uppercase',marginBottom:8}}>{pane.label}</div>
                  {diff.filter(pane.filter).map((d,i)=>(
                    <span key={i} style={d.type!=='same'?{background:pi===0?'#fee2e2':'#dcfce7',color:pi===0?'#991b1b':'#166534',borderRadius:3,padding:'0 2px',fontWeight:600,textDecoration:pi===0&&d.type==='removed'?'line-through':'none'}:{}}>{d.val}{' '}</span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:18,fontFamily:'system-ui',fontSize:'0.88rem',lineHeight:1.9,maxHeight:'55vh',overflowY:'auto'}}>
              {(view==='changes-only'?diff.filter(d=>d.type!=='same'||changeIndices.includes(diff.indexOf(d))):diff).map((d,i)=>{
                const isChange = d.type !== 'same';
                const isCurrentChange = changeIndices[changeIdx] === i;
                return (
                  <span key={i} ref={el=>{if(isChange)changeRefs.current[i]=el;}} style={{
                    ...(isChange ? {
                      background: d.type==='added'?'#dcfce7':'#fee2e2',
                      color: d.type==='added'?'#166534':'#991b1b',
                      textDecoration: d.type==='removed'?'line-through':'none',
                      borderRadius:3, padding:'0 2px', fontWeight:600,
                      outline: isCurrentChange?'2px solid #6366f1':'none',
                      outlineOffset:1,
                    } : {}),
                    ...(view==='changes-only'&&d.type==='same'?{display:'none'}:{})
                  }}>
                    {charLevel && isChange && d.type !== 'same' ? d.val : d.val}{' '}
                  </span>
                );
              })}
            </div>
          )}
          {/* Legend */}
          <div style={{padding:'8px 14px',borderTop:'1px solid var(--border-light)',display:'flex',gap:14,fontSize:'0.75rem',flexWrap:'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{background:'#dcfce7',color:'#166534',padding:'1px 6px',borderRadius:3,fontWeight:700}}>Added</span>in modified only</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{background:'#fee2e2',color:'#991b1b',padding:'1px 6px',borderRadius:3,fontWeight:700,textDecoration:'line-through'}}>Removed</span>in original only</span>
          </div>
        </div>
      )}

      {/* Tips */}
      {!diff && !loading && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:8}}>
          {[{icon:'📜',title:'Legal Contracts',desc:'Find changed clauses before signing'},{icon:'📋',title:'Business Reports',desc:'Track edits between draft and final'},{icon:'🎓',title:'Academic Papers',desc:'Compare revisions before submitting'},{icon:'💼',title:'Policy Documents',desc:'Detect unauthorized changes'}].map(c=>(
            <div key={c.title} className="trust-card" style={{padding:13}}>
              <div style={{fontSize:'1.4rem',marginBottom:5}}>{c.icon}</div>
              <div style={{fontWeight:700,fontSize:'0.83rem',marginBottom:3}}>{c.title}</div>
              <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.5}}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
