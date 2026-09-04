'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { colLetter } from '../utils.js';

function buildRange(a, b) {
  const s = new Set();
  for (let r=Math.min(a.row,b.row);r<=Math.max(a.row,b.row);r++)
    for (let c=Math.min(a.col,b.col);c<=Math.max(a.col,b.col);c++)
      s.add(`${r}_${c}`);
  return s;
}

export default function SpreadsheetTab({ sheets, activeSheet, setSheets, setActiveSheet, analysis, updateData, showToast }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [selStart, setSelStart] = useState(null);
  const [sortCfg, setSortCfg] = useState({ col:null, dir:'asc' });
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFR, setShowFR] = useState(false);
  const [colWidths, setColWidths] = useState({});
  const editRef = useRef(null);
  const tableRef = useRef(null);

  const currentData = sheets[activeSheet]?.data ?? [];
  const headers = currentData[0] ?? [];

  const issueMap = useMemo(() => {
    const m = {};
    (analysis?.issues || []).forEach(iss => {
      if (iss.sheet === sheets[activeSheet]?.name && iss.row >= 0 && iss.col >= 0)
        m[`${iss.row}_${iss.col}`] = iss.severity;
    });
    return m;
  }, [analysis, sheets, activeSheet]);

  const displayRows = useMemo(() => {
    if (!currentData.length) return [];
    let rows = currentData.slice(1).map((r, i) => ({ row:r, oi:i+1 }));
    Object.entries(filters).forEach(([ci, fv]) => {
      if (!fv) return;
      rows = rows.filter(({ row }) => String(row[+ci]??'').toLowerCase().includes(fv.toLowerCase()));
    });
    if (sortCfg.col !== null) {
      const ci = sortCfg.col;
      rows = [...rows].sort((a, b) => {
        const av = a.row[ci]??'', bv = b.row[ci]??'';
        const an = Number(av), bn = Number(bv);
        let cmp = (!isNaN(an)&&!isNaN(bn)) ? an-bn : String(av).localeCompare(String(bv));
        return sortCfg.dir==='asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [currentData, filters, sortCfg]);

  const findCount = useMemo(() => {
    if (!findText) return 0;
    const q = findText.toLowerCase();
    return currentData.reduce((s,r) => s + r.filter(c=>String(c??'').toLowerCase().includes(q)).length, 0);
  }, [findText, currentData]);

  function startEdit(row, col) { setEditingCell({row,col}); setEditValue(String(currentData[row]?.[col]??'')); setTimeout(()=>editRef.current?.select(),0); }
  function commitEdit() {
    if (!editingCell) return;
    const { row, col } = editingCell;
    updateData(currentData.map((r,ri)=>ri===row?r.map((c,ci)=>ci===col?editValue:c):r));
    setEditingCell(null);
  }
  function handleCellKey(e, row, col) {
    if (e.key==='Enter'){e.preventDefault();commitEdit();startEdit(Math.min(row+1,currentData.length-1),col);}
    else if (e.key==='Tab'){e.preventDefault();commitEdit();startEdit(row,Math.min(col+1,headers.length-1));}
    else if (e.key==='Escape') setEditingCell(null);
  }
  useEffect(()=>{ if(editingCell) editRef.current?.focus(); },[editingCell]);
  useEffect(()=>{
    const h = e => { if((e.ctrlKey||e.metaKey)&&e.key==='h'){e.preventDefault();setShowFR(v=>!v);} };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[]);

  function addRow() { if(!currentData.length)return; updateData([...currentData,Array(headers.length).fill('')]); showToast('Row added'); }
  function delRows() {
    const idxs = new Set([...selected].map(k=>+k.split('_')[0]).filter(r=>r>0));
    if(!idxs.size){ showToast('Select rows first','warning'); return; }
    updateData(currentData.filter((_,i)=>!idxs.has(i)));
    setSelected(new Set()); showToast(`Deleted ${idxs.size} row(s)`);
  }
  function addCol() { if(!currentData.length)return; updateData(currentData.map((r,i)=>[...r,i===0?`Col${headers.length+1}`:''])); showToast('Column added'); }
  function delCol(ci) { updateData(currentData.map(r=>r.filter((_,i)=>i!==ci))); showToast('Column deleted'); }
  function execReplace() {
    if(!findText) return;
    let n=0;
    const re = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
    const nd = currentData.map(r=>r.map(c=>{ const s=String(c??''); if(re.test(s)){n++;return s.replace(re,replaceText);} return c; }));
    updateData(nd); showToast(`Replaced ${n} cell${n!==1?'s':''}`);
  }
  function getCellBg(oi, ci, isSel) {
    const sev = issueMap[`${oi}_${ci}`];
    if (sev==='critical') return isSel?'rgba(239,68,68,.2)':'rgba(239,68,68,.07)';
    if (sev==='warning')  return isSel?'rgba(245,158,11,.2)':'rgba(245,158,11,.07)';
    if (isSel) return 'rgba(22,163,74,.08)';
    return oi%2===0?'var(--bg-main)':'var(--bg-secondary)';
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border-light)' }}>
        <button className="xd-btn" onClick={addRow}>➕ Row</button>
        <button className="xd-btn" onClick={addCol}>➕ Col</button>
        <button className="xd-btn danger" onClick={delRows}>🗑 Del Rows</button>
        <div style={{ width:1, height:24, background:'var(--border-light)', margin:'0 4px', alignSelf:'center' }}/>
        <button className={`xd-btn${showFR?' blue':''}`} onClick={()=>setShowFR(v=>!v)}>🔄 Find &amp; Replace</button>
        <button className={`xd-btn${showFilters?' blue':''}`} onClick={()=>setShowFilters(v=>!v)}>🔍 Filter</button>
        <div style={{ flex:1 }}/>
        {sheets.map((s,i)=>(
          <button key={i} className={`xd-tab${i===activeSheet?' active':''}`}
            onDoubleClick={()=>{ const n=window.prompt('Rename sheet:',s.name); if(n) setSheets(p=>p.map((sh,j)=>j===i?{...sh,name:n}:sh)); }}
            onClick={()=>{ setActiveSheet(i); setSortCfg({col:null,dir:'asc'}); setFilters({}); }}>
            📋 {s.name}
          </button>
        ))}
        <button className="xd-btn ghost" onClick={()=>{ setSheets(p=>[...p,{name:`Sheet${p.length+1}`,data:[['Col1','Col2','Col3'],['','','']]}]); setActiveSheet(sheets.length); }}>＋</button>
      </div>

      {/* Find & Replace */}
      {showFR && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', background:'var(--bg-secondary)', padding:'8px 12px', borderRadius:8, marginBottom:8 }}>
          <input className="xd-input" style={{ width:180 }} placeholder="Find…" value={findText} onChange={e=>setFindText(e.target.value)}/>
          <input className="xd-input" style={{ width:180 }} placeholder="Replace with…" value={replaceText} onChange={e=>setReplaceText(e.target.value)}/>
          {findText && <span style={{ fontSize:'.8rem', color:'var(--text-secondary)' }}>{findCount} match{findCount!==1?'es':''}</span>}
          <button className="xd-btn primary" onClick={execReplace} disabled={!findText}>Replace All</button>
          <button className="xd-btn ghost" onClick={()=>setShowFR(false)}>✕</button>
        </div>
      )}

      {/* Table */}
      <div className="xd-table-container" ref={tableRef}
        style={{ overflowX:'auto', overflowY:'auto', maxHeight:'52vh', border:'1px solid var(--border-light)', borderRadius:6 }}>
        <table style={{ borderCollapse:'collapse', tableLayout:'fixed', width:'100%', minWidth:`${Math.max(headers.length,4)*140}px` }}>
          <colgroup>
            <col style={{ width:44 }}/>
            {headers.map((_,ci)=><col key={ci} style={{ width:`${colWidths[ci]||140}px` }}/>)}
          </colgroup>
          <thead style={{ position:'sticky', top:0, zIndex:10 }}>
            <tr>
              <th style={{ background:'var(--bg-tertiary)', border:'1px solid var(--border-light)', width:44, fontSize:'.72rem', color:'var(--text-tertiary)', userSelect:'none' }}>#</th>
              {headers.map((h,ci)=>(
                <th key={ci} style={{ background:'var(--bg-tertiary)', border:'1px solid var(--border-light)', padding:0, position:'relative', userSelect:'none' }}>
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <button className="xd-hdr-btn" onClick={()=>setSortCfg(c=>({col:ci,dir:c.col===ci&&c.dir==='asc'?'desc':'asc'}))}
                      style={{ flex:1, padding:'6px 6px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontWeight:700, fontSize:'.8rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:3, overflow:'hidden', fontFamily:'inherit' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{h||`Col ${ci+1}`}</span>
                      <span style={{ fontSize:'.65rem', opacity:sortCfg.col===ci?1:.3 }}>{sortCfg.col===ci?(sortCfg.dir==='asc'?'↑':'↓'):'↕'}</span>
                    </button>
                    <span style={{ fontSize:'.62rem', color:'var(--text-tertiary)', paddingRight:3 }}>{colLetter(ci)}</span>
                    <button onClick={()=>delCol(ci)} style={{ padding:'2px 5px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', opacity:.4, fontSize:'.75rem', lineHeight:1, fontFamily:'inherit' }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.4'}>×</button>
                  </div>
                  <div onMouseDown={e=>{e.preventDefault();const sx=e.clientX,sw=colWidths[ci]||140;const mv=ev=>setColWidths(w=>({...w,[ci]:Math.max(60,sw+ev.clientX-sx)}));const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}} style={{ position:'absolute', right:0, top:0, bottom:0, width:4, cursor:'col-resize', zIndex:1 }}/>
                </th>
              ))}
            </tr>
            {showFilters && (
              <tr>
                <td style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', padding:'2px 4px', textAlign:'center', fontSize:'.72rem' }}>🔍</td>
                {headers.map((_,ci)=>(
                  <td key={ci} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', padding:'2px 4px' }}>
                    <input className="xd-input" style={{ padding:'3px 6px', fontSize:'.75rem', width:'100%' }} placeholder="Filter…" value={filters[ci]??''} onChange={e=>setFilters(f=>({...f,[ci]:e.target.value}))}/>
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {displayRows.map(({row,oi})=>(
              <tr key={oi}>
                <td onClick={()=>setSelected(new Set(headers.map((_,ci)=>`${oi}_${ci}`)))}
                  style={{ background:'var(--bg-tertiary)', border:'1px solid var(--border-light)', textAlign:'center', fontSize:'.72rem', color:'var(--text-tertiary)', cursor:'pointer', userSelect:'none', width:44 }}>{oi}</td>
                {headers.map((_,ci)=>{
                  const isEd = editingCell?.row===oi && editingCell?.col===ci;
                  const isSel = selected.has(`${oi}_${ci}`);
                  const sev = issueMap[`${oi}_${ci}`];
                  return (
                    <td key={ci} className={`xd-cell${isSel?' selected':''}${sev==='critical'?' error-cell':sev==='warning'?' warn-cell':''}`}
                      style={{ padding:0, height:30, border:'1px solid var(--border-light)', background:getCellBg(oi,ci,isSel), position:'relative', cursor:'cell', overflow:'hidden' }}
                      onClick={e=>{ if(!isEd){ setSelStart({row:oi,col:ci}); setSelected(e.shiftKey&&selStart?buildRange(selStart,{row:oi,col:ci}):new Set([`${oi}_${ci}`])); } }}
                      onDoubleClick={()=>startEdit(oi,ci)} title={String(row[ci]??'')}>
                      {isEd ? (
                        <input ref={editRef} value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={e=>handleCellKey(e,oi,ci)}
                          style={{ width:'100%', height:'100%', padding:'0 6px', border:'none', outline:'2px solid #16a34a', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'.83rem', fontFamily:'inherit' }}/>
                      ) : (
                        <span style={{ display:'block', padding:'0 6px', lineHeight:'30px', fontSize:'.83rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {sev && <span style={{ marginRight:4, fontSize:'.7rem' }}>{sev==='critical'?'🔴':'🟠'}</span>}
                          {String(row[ci]??'')}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {displayRows.length===0 && (
              <tr><td colSpan={headers.length+1} style={{ textAlign:'center', padding:32, color:'var(--text-secondary)', border:'1px solid var(--border-light)' }}>
                {Object.values(filters).some(Boolean)?'No rows match filters.':'No data rows.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div style={{ display:'flex', gap:14, padding:'5px 0', fontSize:'.76rem', color:'var(--text-secondary)', flexWrap:'wrap', borderTop:'1px solid var(--border-light)', marginTop:4 }}>
        <span>📊 <b>{displayRows.length}</b> row{displayRows.length!==1?'s':''}{Object.values(filters).some(Boolean)?` (filtered)`:''}</span>
        <span>📋 <b>{headers.length}</b> col{headers.length!==1?'s':''}</span>
        {selected.size>0 && <span>☑ <b>{selected.size}</b> selected</span>}
        {sortCfg.col!==null && <span>↕ Sorted by <b>{headers[sortCfg.col]}</b> ({sortCfg.dir})</span>}
        <span style={{ marginLeft:'auto', opacity:.7 }}>Double-click to edit · Ctrl+H find &amp; replace</span>
      </div>
    </div>
  );
}
