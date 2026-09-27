'use client';
// ═══════════════════════════════════════════════════════════════════════════════
// Excel Doctor — Root Orchestrator
// Imports from components/tools/excel/ sub-folder for clean architecture.
// Each feature tab lives in its own file (< 300 lines each).
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Utilities & engines ───────────────────────────────────────────────────────
import { getXLSX, isBlankRow, CSS } from './excel/utils.js';
import { analyzeWorkbook, columnQuality, compareWorkbooks, performanceAnalysis, askExcel } from './excel/engines.js';

// ── Shared UI components ──────────────────────────────────────────────────────
import { Toast, Spinner, ScoreRing, Sev } from './excel/components.jsx';

// ── Feature tabs (new files) ──────────────────────────────────────────────────
import SpreadsheetTab  from './excel/tabs/SpreadsheetTab.jsx';
import FormulaLabTab   from './excel/tabs/FormulaLabTab.jsx';
import BATemplatesTab  from './excel/tabs/BATemplatesTab.jsx';
import FormatFixerTab  from './excel/tabs/FormatFixerTab.jsx';
import ShortcutsTab    from './excel/tabs/ShortcutsTab.jsx';

// ── New UX: Tour & Landing with Search ───────────────────────────────────────
import Tour            from './excel/Tour.jsx';
import LandingScreen   from './excel/LandingScreen.jsx';

// ── colLetter for the tab display ──────────────────────────────────────────────
import { colLetter } from './excel/utils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// REMAINING TABS — still inline here (small enough; future: move to excel/tabs/)
// ═══════════════════════════════════════════════════════════════════════════════

function HealthTab({ analysis, onApplyFix, onJumpToCell }) {
  const { issues, summary } = analysis;
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const filtered = filter === 'all' ? issues : issues.filter(i => i.severity === filter);
  return (
    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <div style={{ width:204, flexShrink:0 }}>
        <div className="xd-card" style={{ textAlign:'center', marginBottom:12 }}>
          <ScoreRing score={summary.score}/>
          <div style={{ marginTop:10, fontSize:'.78rem', color:'var(--text-secondary)' }}>Workbook Health Score</div>
        </div>
        <div className="xd-card" style={{ marginBottom:12 }}>
          {[['🔴 Critical',summary.critical,'#dc2626'],['🟠 Warnings',summary.warnings,'#d97706'],['ℹ️ Info',summary.infos,'#2563eb'],
            ['📦 Cells',summary.total.toLocaleString(),'var(--text-secondary)'],['❌ Errors',summary.errors,summary.errors?'#dc2626':'#16a34a'],
            ['🔢 Num-text',summary.numericStr,'var(--text-secondary)'],['🗓️ Date-text',summary.dateText,'var(--text-secondary)'],
            ['↔️ Spaces',summary.spaces,'var(--text-secondary)']].map(([l,v,c])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'.79rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>{l}</span><span style={{ fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {['all','critical','warning','info'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'6px 10px', borderRadius:6, border:'1px solid var(--border-light)',
                background:filter===f?'#16a34a':'var(--bg-main)', color:filter===f?'#fff':'var(--text-primary)',
                cursor:'pointer', fontSize:'.82rem', textAlign:'left', fontFamily:'inherit' }}>
              {f==='all'?'All issues':f[0].toUpperCase()+f.slice(1)}
              <span style={{ float:'right', opacity:.7 }}>{f==='all'?issues.length:issues.filter(i=>i.severity===f).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        {filtered.length===0 && <div className="xd-card" style={{ textAlign:'center', padding:40, color:'#16a34a', fontWeight:700 }}>✅ No {filter!=='all'?filter:''} issues found!</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.slice(0,200).map(issue=>(
            <div key={issue.id} className={`xd-issue-row ${issue.severity}`} onClick={()=>setExpanded(expanded===issue.id?null:issue.id)}>
              <div style={{ fontSize:'1.1rem', flexShrink:0 }}>{issue.severity==='critical'?'🔴':issue.severity==='warning'?'🟠':'🔵'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:600, fontSize:'.87rem' }}>{issue.title}</span>
                  <Sev level={issue.severity}/>
                  {issue.fixable&&<span className="xd-badge" style={{ background:'#dcfce7', color:'#15803d' }}>Auto-fixable</span>}
                </div>
                {issue.sheet&&<span style={{ fontSize:'.75rem', color:'var(--text-tertiary)', display:'block', marginTop:2 }}>Sheet: {issue.sheet}{issue.cell?` · Cell: ${issue.cell}`:''}</span>}
                {expanded===issue.id&&(
                  <div style={{ marginTop:8, padding:'8px 12px', background:'var(--bg-secondary)', borderRadius:6, fontSize:'.83rem', lineHeight:1.6 }}>
                    <pre style={{ margin:0, fontFamily:'var(--font-mono)', fontSize:'.79rem', whiteSpace:'pre-wrap', color:'var(--text-secondary)' }}>{issue.detail}</pre>
                    <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                      {issue.fixable&&<button className="xd-btn primary" style={{ fontSize:'.8rem', padding:'4px 12px' }} onClick={e=>{e.stopPropagation();onApplyFix(issue);}}>✓ Apply Fix</button>}
                      {issue.row>=0&&issue.col>=0&&<button className="xd-btn" style={{ fontSize:'.8rem', padding:'4px 12px' }} onClick={e=>{e.stopPropagation();onJumpToCell(issue.sheet,issue.row,issue.col);}}>→ Go to Cell</button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length>200&&<p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'.85rem' }}>Showing 200 of {filtered.length} issues.</p>}
        </div>
      </div>
    </div>
  );
}

function DataQualityTab({ sheets, activeSheet }) {
  const cols = useMemo(()=>columnQuality(sheets[activeSheet]?.data),[sheets,activeSheet]);
  if(!cols.length) return <div style={{ padding:32, textAlign:'center', color:'var(--text-secondary)' }}>No data on this sheet.</div>;
  return (
    <div>
      <p style={{ color:'var(--text-secondary)', fontSize:'.88rem', marginBottom:16 }}>Column quality analysis for sheet <strong>{sheets[activeSheet]?.name}</strong>.</p>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.82rem' }}>
          <thead><tr style={{ background:'var(--bg-tertiary)' }}>
            {['Col','Name','Complete','Unique','Errors','Spaces','Num-text','Min','Max','Avg'].map(h=>(
              <th key={h} style={{ padding:'8px 10px', border:'1px solid var(--border-light)', textAlign:'left', fontWeight:700, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {cols.map((c,i)=>{
              const cc=c.completeness===100?'#16a34a':c.completeness>=80?'#d97706':'#dc2626';
              return (
                <tr key={i} style={{ background:i%2===0?'var(--bg-main)':'var(--bg-secondary)' }}>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', fontFamily:'var(--font-mono)', color:'var(--text-tertiary)' }}>{colLetter(c.idx)}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', fontWeight:600, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name||<em style={{opacity:.5}}>(blank)</em>}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:48, height:6, background:'var(--bg-tertiary)', borderRadius:3, overflow:'hidden' }}><div style={{ width:`${c.completeness}%`, height:'100%', background:cc, borderRadius:3 }}/></div>
                      <span style={{ color:cc, fontWeight:700 }}>{c.completeness}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)' }}>{c.unique}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', color:c.errors?'#dc2626':'inherit', fontWeight:c.errors?700:400 }}>{c.errors||'—'}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', color:c.spaces?'#d97706':'inherit' }}>{c.spaces||'—'}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', color:c.numStrs?'#d97706':'inherit' }}>{c.numStrs||'—'}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', fontFamily:'var(--font-mono)' }}>{c.min!=null?c.min.toLocaleString():'—'}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', fontFamily:'var(--font-mono)' }}>{c.max!=null?c.max.toLocaleString():'—'}</td>
                  <td style={{ padding:'7px 10px', border:'1px solid var(--border-light)', fontFamily:'var(--font-mono)' }}>{c.avg!=null?c.avg.toFixed(2):'—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CleanTab({ analysis, onBulkFix, onCustomClean }) {
  const fixable = analysis.issues.filter(i=>i.fixable);
  const byType = useMemo(()=>{ const m={}; fixable.forEach(i=>(m[i.type]=m[i.type]||[]).push(i)); return m; },[fixable]);
  const ops=[
    {id:'trim',label:'Trim Whitespace',desc:'Remove leading/trailing spaces',icon:'✂️',fn:'trim'},
    {id:'dedup',label:'Remove Duplicate Rows',desc:'Delete 100% identical rows',icon:'🚫',fn:'dedup'},
    {id:'blank',label:'Remove Blank Rows',desc:'Delete empty rows',icon:'🗑️',fn:'blank'},
    {id:'numtext',label:'Fix Numbers as Text',desc:'Convert "42" to real numbers',icon:'🔢',fn:'numtext'},
    {id:'upper',label:'To UPPERCASE',icon:'⬆️',fn:'upper',desc:''},
    {id:'lower',label:'To lowercase',icon:'⬇️',fn:'lower',desc:''},
    {id:'title',label:'To Title Case',icon:'🔤',fn:'title',desc:''},
    {id:'filldown',label:'Fill Down Blanks',desc:'Copy value from row above',icon:'⬇️',fn:'filldown'},
  ];
  return (
    <div>
      {fixable.length>0&&(
        <div className="xd-card" style={{ marginBottom:16, borderColor:'#16a34a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ fontSize:'1.5rem' }}>🩹</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, marginBottom:2 }}>{fixable.length} auto-fixable issue{fixable.length!==1?'s':''}</div>
              <div style={{ fontSize:'.82rem', color:'var(--text-secondary)' }}>{Object.entries(byType).map(([t,a])=>`${a.length} ${t.replace(/_/g,' ')}`).join(' · ')}</div>
            </div>
            <button className="xd-btn primary" onClick={()=>onBulkFix(fixable)}>✓ Fix All Automatically</button>
          </div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
        {ops.map(op=>(
          <button key={op.id} onClick={()=>onCustomClean(op.fn)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:8, border:'1px solid var(--border-light)', background:'var(--bg-main)', cursor:'pointer', textAlign:'left', transition:'all .15s', fontFamily:'inherit' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#16a34a';e.currentTarget.style.background='rgba(22,163,74,.04)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='var(--bg-main)'}}>
            <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{op.icon}</span>
            <div><div style={{ fontWeight:600, fontSize:'.88rem' }}>{op.label}</div>{op.desc&&<div style={{ fontSize:'.77rem', color:'var(--text-secondary)', marginTop:2 }}>{op.desc}</div>}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompareTab({ sheetsA, sheetsB, fileNameA, fileNameB, onLoad }) {
  const fileRef = useRef(null);
  const changes = useMemo(()=>sheetsA&&sheetsB?compareWorkbooks(sheetsA,sheetsB):[],[sheetsA,sheetsB]);
  const critical=changes.filter(c=>c.severity==='critical').length;
  const cellChanges=changes.filter(c=>c.type==='cell_changed').length;
  if(!sheetsB) return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:'3rem', marginBottom:16 }}>🔄</div>
      <h3 style={{ fontWeight:700, marginBottom:8 }}>Compare Two Excel Files</h3>
      <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>Upload a second file to compare against <strong>{fileNameA}</strong></p>
      <button className="xd-btn blue" onClick={()=>fileRef.current?.click()}>📂 Load File B</button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e=>{onLoad(e.target.files[0]);e.target.value='';}} style={{display:'none'}}/>
    </div>
  );
  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        {[['Cell changes',cellChanges,cellChanges?'#d97706':'#16a34a'],['Critical',critical,critical?'#dc2626':'#16a34a'],
          ['Sheets added',changes.filter(c=>c.type==='sheet_added').length,'#2563eb'],
          ['Sheets removed',changes.filter(c=>c.type==='sheet_removed').length,'#dc2626']].map(([l,v,c])=>(
          <div key={l} className="xd-card" style={{ flex:'1 1 100px', textAlign:'center', padding:'12px 10px' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:'.75rem', color:'var(--text-secondary)', marginTop:2 }}>{l}</div>
          </div>
        ))}
        <button className="xd-btn" onClick={()=>fileRef.current?.click()}>Change File B</button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e=>{onLoad(e.target.files[0]);e.target.value='';}} style={{display:'none'}}/>
      </div>
      {changes.length===0
        ? <div className="xd-card" style={{ textAlign:'center', padding:32, color:'#16a34a', fontWeight:700 }}>✅ Files are identical.</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {changes.map((c,i)=>(
              <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${c.severity==='critical'?'#ef4444':c.severity==='warning'?'#f59e0b':'#3b82f6'}`, padding:'10px 14px', fontSize:'.84rem' }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ flexShrink:0 }}>{c.type==='cell_changed'?'📝':c.type==='sheet_added'?'➕':'➖'}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ fontWeight:600 }}>{c.sheet}{c.cell?`!${c.cell}`:''}</span>
                    {c.type==='cell_changed'?(
                      <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ background:'#fee2e2', color:'#dc2626', padding:'2px 6px', borderRadius:4, fontSize:'.78rem' }}>Was: {c.from||'(empty)'}</span>
                        <span style={{ color:'var(--text-tertiary)' }}>→</span>
                        <span style={{ background:'#dcfce7', color:'#15803d', padding:'2px 6px', borderRadius:4, fontSize:'.78rem' }}>Now: {c.to||'(empty)'}</span>
                      </div>
                    ):<div style={{ color:'var(--text-secondary)', marginTop:4 }}>{c.detail}</div>}
                  </div>
                  <Sev level={c.severity}/>
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
}

function PerformanceTab({ sheets }) {
  const result = useMemo(()=>performanceAnalysis(sheets),[sheets]);
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:20 }}>
        {[['🧮','Total Formulas',result.formulaCount.toLocaleString(),false],
          ['⚡','Volatile',result.volatileCount,result.volatileCount>0],
          ['📋','Sheets',sheets.length,false],
          ['📊','Total Rows',sheets.reduce((s,sh)=>s+(sh.data.length||0),0).toLocaleString(),false]].map(([icon,label,val,warn])=>(
          <div key={label} className="xd-card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.5rem' }}>{icon}</div>
            <div style={{ fontSize:'1.3rem', fontWeight:800, color:warn?'#d97706':'var(--text-primary)', marginTop:4 }}>{val}</div>
            <div style={{ fontSize:'.78rem', color:'var(--text-secondary)', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {result.issues.map((iss,i)=>(
          <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${iss.severity==='success'?'#16a34a':iss.severity==='warning'?'#f59e0b':'#3b82f6'}` }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>{iss.severity==='success'?'✅':iss.severity==='warning'?'⚠️':'ℹ️'} {iss.title}</div>
            <div style={{ fontSize:'.84rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{iss.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskTab({ sheets, analysis }) {
  const [messages, setMessages] = useState([{role:'ai',text:`👋 Hi! Health score: **${analysis.summary.score}/100**\n\nFound ${analysis.issues.length} issue${analysis.issues.length!==1?'s':''}. Ask me anything about your data!\n\nTry: *"Why is my total wrong?"* or *"Find hardcoded numbers"*`}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const presets=['Why is my total wrong?','Find duplicate rows','Why is VLOOKUP failing?','How many rows?','Find hardcoded numbers','Find IFERROR hidden errors','Workbook health summary','How can I speed this up?'];
  const send = useCallback((q)=>{
    const question = q||input.trim(); if(!question) return;
    setInput(''); setMessages(m=>[...m,{role:'user',text:question}]); setLoading(true);
    setTimeout(()=>{ setMessages(m=>[...m,{role:'ai',text:askExcel(question,sheets,analysis)}]); setLoading(false); },350);
  },[input,sheets,analysis]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,loading]);
  const renderText = t => t.split('\n').map((line,i)=>{ const parts=line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g); return(<div key={i} style={{marginBottom:line===''?6:0}}>{parts.map((p,j)=>p.startsWith('**')?<strong key={j}>{p.slice(2,-2)}</strong>:p.startsWith('*')?<em key={j}>{p.slice(1,-1)}</em>:<span key={j}>{p}</span>)}</div>); });
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'520px' }}>
      <div className="xd-chat-area" style={{ flex:1, overflowY:'auto', padding:'8px 0', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            {m.role==='ai'&&<div style={{ width:28, height:28, borderRadius:'50%', background:'#16a34a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', flexShrink:0, marginRight:8, marginTop:2 }}>🩺</div>}
            <div className={`xd-chat-bubble ${m.role}`}>{renderText(m.text)}</div>
          </div>
        ))}
        {loading&&<div style={{ display:'flex', gap:8, alignItems:'center' }}><div style={{ width:28, height:28, borderRadius:'50%', background:'#16a34a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', flexShrink:0 }}>🩺</div><div className="xd-chat-bubble ai" style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-secondary)', animation:'pulse 1s infinite' }}/><div style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-secondary)', animation:'pulse 1s .2s infinite' }}/><div style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-secondary)', animation:'pulse 1s .4s infinite' }}/></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', padding:'8px 0', borderTop:'1px solid var(--border-light)' }}>
        {presets.map(p=><button key={p} onClick={()=>send(p)} className="xd-btn ghost" style={{ fontSize:'.76rem', padding:'4px 9px' }}>{p}</button>)}
      </div>
      <div style={{ display:'flex', gap:8, paddingTop:8 }}>
        <input className="xd-input" style={{ flex:1 }} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask anything about your spreadsheet…"/>
        <button className="xd-btn primary" onClick={()=>send()} disabled={!input.trim()}>Send</button>
      </div>
    </div>
  );
}

// ── Limits / Integrity / Collab / Automate / Analytics still inline ───────────
// (copied from previous architecture — unchanged logic)
function LimitsTab({ sheets, fileName }) {
  const XL_ROW_LIMIT=1_048_576,WARN_ROWS=100_000,WARN_COLS=500,XL_COL_LIMIT=16_384;
  const fileSizeEst=useMemo(()=>Math.round(sheets.reduce((s,sh)=>s+sh.data.reduce((a,r)=>a+r.length,0),0)*20/1024),[sheets]);
  const maxRows=useMemo(()=>Math.max(...sheets.map(s=>s.data.length),0),[sheets]);
  const maxCols=useMemo(()=>Math.max(...sheets.flatMap(s=>s.data.map(r=>r.length)),0),[sheets]);
  const totalFormulas=useMemo(()=>sheets.reduce((s,sh)=>s+(sh.formulas?sh.formulas.reduce((a,r)=>a+(r||[]).filter(Boolean).length,0):0),0),[sheets]);
  const hasNestedJson=useMemo(()=>sheets.some(sh=>sh.data.some(r=>r.some(c=>{const s=String(c??'');return s.startsWith('{')||s.startsWith('[');}))),[sheets]);
  const volatileCount=useMemo(()=>sheets.reduce((s,sh)=>s+(sh.formulas?sh.formulas.reduce((a,r)=>a+(r||[]).filter(f=>f&&['NOW(','TODAY(','RAND(','INDIRECT(','OFFSET('].some(v=>f.toUpperCase().includes(v))).length,0):0),0),[sheets]);
  const pct=(v,m)=>Math.min(100,Math.round(v/m*100));
  const limits=[
    {icon:'📋',title:'Row Limit',severity:maxRows>WARN_ROWS?'warning':'success',current:`${maxRows.toLocaleString()} rows`,limit:'1,048,576',used:pct(maxRows,XL_ROW_LIMIT),desc:maxRows>WARN_ROWS?`${maxRows.toLocaleString()} rows — approaching Excel's limit.`:'Row count is within Excel\'s limit.',fix:maxRows>WARN_ROWS?'Migrate to SQL Server / PostgreSQL for unlimited rows.':null,tools:['SQL Server','PostgreSQL','BigQuery','Snowflake']},
    {icon:'📐',title:'Column Limit',severity:maxCols>WARN_COLS?'warning':'success',current:`${maxCols} cols`,limit:'16,384',used:pct(maxCols,XL_COL_LIMIT),desc:`Excel supports up to 16,384 columns. You have ${maxCols}.`,fix:maxCols>WARN_COLS?'Pivot wide data into tall format (normalisation).':null,tools:['dbt','Apache Spark','Pandas']},
    {icon:'💾',title:'File Size',severity:fileSizeEst>10_000?'warning':'success',current:fileSizeEst>1024?`~${Math.round(fileSizeEst/1024)} MB`:`~${fileSizeEst} KB`,limit:'>50 MB is very slow',used:Math.min(100,Math.round(fileSizeEst/51200*100)),desc:'Large .xlsx files load slowly and crash AutoSave.',fix:fileSizeEst>10_000?'Move data to Snowflake / BigQuery.':null,tools:['Snowflake','BigQuery','DuckDB']},
    {icon:'⚡',title:'Calculation Speed',severity:volatileCount>5||totalFormulas>10000?'warning':'success',current:`${totalFormulas.toLocaleString()} formulas, ${volatileCount} volatile`,limit:'>10k formulas or any volatile = lag',used:Math.min(100,Math.round(totalFormulas/10000*100)),desc:`${volatileCount} volatile formula${volatileCount!==1?'s':''} recalculate on every keypress.`,fix:volatileCount>0?'Replace volatile formulas. Use Python/Pandas for heavy compute.':null,tools:['Python+Pandas','Power BI','Excel LAMBDA']},
    {icon:'🧠',title:'Memory',severity:maxRows*maxCols>5_000_000?'critical':maxRows*maxCols>500_000?'warning':'success',current:`~${(maxRows*maxCols/1_000_000).toFixed(1)}M cell slots`,limit:'>5M risks OOM',used:Math.min(100,Math.round(maxRows*maxCols/5_000_000*100)),desc:`${(maxRows*maxCols).toLocaleString()} total cell slots. 32-bit Excel crashes around 2GB RAM.`,fix:maxRows*maxCols>500_000?'Delete unused rows/columns. Use a server database.':null,tools:['64-bit Excel','SQL Server','Apache Arrow']},
    {icon:'🔀',title:'Data Fragmentation',severity:sheets.length>5?'warning':'success',current:`${sheets.length} sheet${sheets.length!==1?'s':''}`,limit:'Multiple tabs = clutter',used:Math.min(100,Math.round(sheets.length/20*100)),desc:`${sheets.length} sheets. Splitting related data across tabs creates maintenance nightmares.`,fix:sheets.length>5?'Define a relational schema in PostgreSQL or Airtable.':null,tools:['PostgreSQL','Airtable','Supabase']},
    {icon:'📦',title:'JSON / Nested Data',severity:hasNestedJson?'warning':'info',current:hasNestedJson?'JSON detected':'No JSON',limit:'No native JSON type',used:hasNestedJson?60:0,desc:'Excel stores JSON as plain text. You cannot query nested fields.',fix:hasNestedJson?'Use Power Query to flatten JSON, or migrate to MongoDB.':null,tools:['MongoDB','Firestore','Power Query']},
    {icon:'📤',title:'Export Limits',severity:maxRows>500_000?'critical':maxRows>100_000?'warning':'success',current:`${maxRows.toLocaleString()} rows`,limit:'CSV export above ~1M rows fails',used:Math.min(100,Math.round(maxRows/1_000_000*100)),desc:'Exporting millions of rows to CSV via Excel often truncates silently.',fix:maxRows>100_000?'Use PostgreSQL COPY or Pandas df.to_csv() for large exports.':null,tools:['PostgreSQL COPY','BigQuery Export','Pandas','Parquet']},
  ];
  return (
    <div>
      <p style={{ color:'var(--text-secondary)', fontSize:'.88rem', marginBottom:20 }}>Live analysis of your workbook against Excel\'s known limits.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {limits.map((lim,i)=>(
          <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${lim.severity==='critical'?'#ef4444':lim.severity==='warning'?'#f59e0b':'#16a34a'}` }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <div style={{ fontSize:'1.6rem', flexShrink:0 }}>{lim.icon}</div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:'.92rem' }}>{lim.title}</span><Sev level={lim.severity}/>
                  <span style={{ fontSize:'.78rem', color:'var(--text-tertiary)' }}>{lim.current} / {lim.limit}</span>
                </div>
                <div style={{ width:'100%', height:6, background:'var(--bg-tertiary)', borderRadius:3, marginBottom:8, overflow:'hidden' }}>
                  <div style={{ width:`${lim.used}%`, height:'100%', borderRadius:3, background:lim.severity==='critical'?'#ef4444':lim.severity==='warning'?'#f59e0b':'#16a34a', transition:'width .4s' }}/>
                </div>
                <p style={{ fontSize:'.84rem', color:'var(--text-secondary)', marginBottom:lim.fix?8:0, lineHeight:1.55 }}>{lim.desc}</p>
                {lim.fix&&<div style={{ background:'rgba(22,163,74,.06)', border:'1px solid rgba(22,163,74,.2)', borderRadius:6, padding:'8px 12px', fontSize:'.82rem' }}><strong>💡</strong> {lim.fix}</div>}
              </div>
              {lim.tools&&<div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                <span style={{ fontSize:'.72rem', color:'var(--text-tertiary)', marginBottom:2 }}>Better tools:</span>
                {lim.tools.map(t=><span key={t} className="xd-badge" style={{ background:'var(--bg-secondary)', color:'var(--text-secondary)', fontSize:'.72rem' }}>{t}</span>)}
              </div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrityTab({ sheets, activeSheet }) {
  const sheetData=sheets[activeSheet]?.data??[];
  const headers=sheetData[0]??[];
  const body=sheetData.slice(1);
  const issues=useMemo(()=>{
    const r=[];
    if(!body.length) return r;
    headers.forEach((h,ci)=>{
      const vals=body.map(row=>String(row[ci]??'').trim()).filter(v=>v!=='');
      const seen=new Set();const dups=new Set();
      vals.forEach(v=>{if(seen.has(v))dups.add(v);else seen.add(v);});
      if(dups.size>0&&(String(h).toLowerCase().includes('id')||String(h).toLowerCase().includes('key')))
        r.push({severity:'critical',icon:'🔑',title:`Duplicate values in "${h}" (ID column)`,detail:`Found ${dups.size} duplicate: ${[...dups].slice(0,3).join(', ')}. ID columns should be unique.`,fix:'Use Clean tab to remove duplicates.'});
    });
    headers.forEach((h,ci)=>{
      const vals=body.map(row=>row[ci]).filter(v=>String(v??'').trim()!=='');
      if(vals.length<3) return;
      const types=vals.map(v=>isNaN(Number(v))?'text':'number');
      if(types.includes('number')&&types.includes('text'))
        r.push({severity:'warning',icon:'🔢',title:`Mixed types in "${h}"`,detail:`${types.filter(t=>t==='number').length} numbers and ${types.filter(t=>t==='text').length} text values. SUM/AVERAGE break on mixed-type columns.`,fix:'Use "Fix Numbers Stored as Text" in Clean tab.'});
    });
    headers.forEach((h,ci)=>{
      const vals=body.map(row=>String(row[ci]??'').trim()).filter(v=>v!=='');
      if(new Set(vals).size>new Set(vals.map(v=>v.toLowerCase())).size)
        r.push({severity:'info',icon:'Aa',title:`Case inconsistency in "${h}"`,detail:'Same value appears with different capitalisation (e.g. "Apple" and "apple"). COUNTIF treats them as equal but EXACT() does not.',fix:'Use "To Title Case" in Clean tab.'});
    });
    const blankHdrs=headers.filter(h=>String(h??'').trim()==='').length;
    if(blankHdrs>0) r.push({severity:'warning',icon:'📛',title:`${blankHdrs} column${blankHdrs>1?'s':''} have no header`,detail:'Unnamed columns break VLOOKUP ranges, PivotTables and structured references.',fix:'Name every column in the Edit tab.'});
    if(r.length===0) r.push({severity:'success',icon:'✅',title:'No integrity issues found',detail:'Column types look consistent and no obvious duplicate IDs detected.',fix:null});
    return r;
  },[sheetData,headers,body]);
  const rules=[
    {icon:'🔑',title:'Unique Constraints',desc:'Excel allows duplicate Order IDs. SQL PRIMARY KEY rejects them instantly.',db:'SQL PRIMARY KEY'},
    {icon:'🔗',title:'Foreign Keys',desc:'Excel lets you delete a parent row leaving orphan child rows. SQL FOREIGN KEY prevents this.',db:'SQL FOREIGN KEY + CASCADE'},
    {icon:'🛡️',title:'NOT NULL Rules',desc:'Any cell can be blank with no warning. SQL NOT NULL makes fields mandatory.',db:'SQL NOT NULL constraint'},
    {icon:'📋',title:'Type Enforcement',desc:'Excel silently accepts text in a number column. Databases reject wrong types immediately.',db:'SQL typed columns (INT, DATE)'},
    {icon:'🗑️',title:'Cascade Deletes',desc:'Deleting a parent in Excel leaves orphan rows. SQL CASCADE DELETE cleans up automatically.',db:'SQL ON DELETE CASCADE'},
    {icon:'🧩',title:'Check Constraints',desc:"Excel's data validation is bypassed by paste. SQL CHECK constraints enforce rules at the engine level.",db:'SQL CHECK constraint'},
  ];
  return (
    <div>
      <h3 style={{ fontWeight:700, marginBottom:12, fontSize:'.95rem' }}>🔬 Live Integrity Scan — {sheets[activeSheet]?.name}</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
        {issues.map((iss,i)=>(
          <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${iss.severity==='critical'?'#ef4444':iss.severity==='warning'?'#f59e0b':iss.severity==='success'?'#16a34a':'#3b82f6'}` }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{iss.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}><span style={{ fontWeight:700, fontSize:'.88rem' }}>{iss.title}</span><Sev level={iss.severity}/></div>
                <p style={{ fontSize:'.83rem', color:'var(--text-secondary)', marginBottom:iss.fix?6:0, lineHeight:1.55 }}>{iss.detail}</p>
                {iss.fix&&<div style={{ fontSize:'.8rem', color:'#15803d', background:'#dcfce7', borderRadius:5, padding:'5px 10px' }}>💡 {iss.fix}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ fontWeight:700, marginBottom:12, fontSize:'.95rem' }}>📚 Database Rules Excel Lacks</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
        {rules.map(r=>(
          <div key={r.title} className="xd-card">
            <div style={{ display:'flex', gap:8, marginBottom:6 }}><span style={{ fontSize:'1.3rem' }}>{r.icon}</span><span style={{ fontWeight:700, fontSize:'.88rem' }}>{r.title}</span></div>
            <p style={{ fontSize:'.8rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:6 }}>{r.desc}</p>
            <span className="xd-badge" style={{ background:'#dbeafe', color:'#1d4ed8', fontSize:'.72rem' }}>{r.db}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollabTab() {
  const [open,setOpen]=useState(null);
  const problems=[
    {icon:'⚔️',severity:'critical',title:'Cell Locking Conflicts',desc:'Two people editing the same cell cause save conflicts. Last save wins — the other person\'s work is lost.',detail:'Excel co-authoring helps slightly, but under heavy macro usage it breaks down. Users on shared drives overwrite each other regularly.',fix:'Use Google Sheets or Microsoft 365 Online for real-time co-authoring.',tools:['Google Sheets','M365 Online','Airtable','Coda']},
    {icon:'🔐',severity:'critical',title:'No Row-Level Permissions',desc:'You cannot show Sales team only their region\'s rows — in a single local file.',detail:'Row-level security requires a database with security roles. Excel sheet protection only hides entire sheets/columns.',fix:'Implement RLS in PostgreSQL, Supabase, or Power BI.',tools:['PostgreSQL RLS','Supabase','Power BI RLS','Metabase']},
    {icon:'📜',severity:'warning',title:'No Proper Audit Trail',desc:'Track Changes is weak — only recent edits, can be turned off, lost on Save As.',detail:'Enterprise audits need: who changed what, at what timestamp, old value, new value — stored immutably.',fix:'Use Airtable revision history or PostgreSQL audit triggers.',tools:['Airtable History','PostgreSQL triggers','Notion history']},
    {icon:'🌿',severity:'warning',title:'No Git Versioning',desc:'No branching, merging or safe experimentation — only "Save As" copies.',detail:'Report_v1, Report_FINAL, Report_FINAL_v2 proliferate. Finding what changed is impossible on binary .xlsx.',fix:'Store data as CSV in Git. Use DVC for large datasets.',tools:['Git+CSV','DVC','Flyway','Liquibase']},
    {icon:'🚫',severity:'critical',title:'Accidental Overwrites',desc:'Any user can save over the master sheet, destroying weeks of work.',detail:'Even with OneDrive versioning, cell-level recovery requires restoring the entire file.',fix:'Enforce database write permissions. Give analysts read-only access.',tools:['PostgreSQL roles','Airtable permissions','SharePoint']},
    {icon:'✅',severity:'warning',title:'No Approval Workflows',desc:'Routing data changes for sign-off requires external email chains.',detail:'Finance and compliance need Draft → Under Review → Approved states. Excel has no concept of this.',fix:'Use Power Automate approval flows or Airtable automations.',tools:['Power Automate','Airtable','Zapier','Monday.com']},
    {icon:'💬',severity:'info',title:'No In-Context Discussion',desc:'Discussing a cell requires copying its value into Slack — no threaded comments per row.',detail:'Teams waste hours in meetings saying "which row are you referring to?"',fix:'Use Airtable row comments or Google Sheets cell comments with @mentions.',tools:['Airtable comments','Google Sheets','Notion','Coda']},
    {icon:'💥',severity:'warning',title:'Broken Formulas by Peers',desc:'A colleague deletes a row your formula depends on, turning cells into #REF!.',detail:'Excel has no read-only formula columns. Any user can destroy the formula layer.',fix:'Use Protect Sheet on formula cells. Move calculations to database views.',tools:['Excel Sheet Protection','Power Query','Database views']},
    {icon:'📶',severity:'warning',title:'Offline Sync Clashes',desc:'Working offline on a shared OneDrive file creates duplicate conflicting copies.',detail:'OneDrive conflict resolution for Excel is primitive — shows two files and asks you to choose.',fix:'Use Google Sheets for transparent offline sync.',tools:['Google Sheets offline','Notion offline','CouchDB sync']},
  ];
  return (
    <div>
      <p style={{ color:'var(--text-secondary)', fontSize:'.88rem', marginBottom:20 }}>Every collaboration problem Excel has — and the modern tool that solves each one. Click to expand.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {problems.map((p,i)=>(
          <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${p.severity==='critical'?'#ef4444':p.severity==='warning'?'#f59e0b':'#3b82f6'}`, cursor:'pointer' }} onClick={()=>setOpen(open===i?null:i)}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{p.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}><span style={{ fontWeight:700, fontSize:'.9rem' }}>{p.title}</span><Sev level={p.severity}/></div>
                <p style={{ fontSize:'.84rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{p.desc}</p>
                {open===i&&(<div style={{ marginTop:10 }}>
                  <p style={{ fontSize:'.83rem', lineHeight:1.6, marginBottom:8, padding:'8px 12px', background:'var(--bg-secondary)', borderRadius:6 }}>{p.detail}</p>
                  <div style={{ background:'rgba(22,163,74,.06)', border:'1px solid rgba(22,163,74,.2)', borderRadius:6, padding:'8px 12px', fontSize:'.82rem', marginBottom:8 }}><strong>💡</strong> {p.fix}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{p.tools.map(t=><span key={t} className="xd-badge" style={{ background:'#dbeafe', color:'#1d4ed8' }}>{t}</span>)}</div>
                </div>)}
              </div>
              <span style={{ color:'var(--text-tertiary)', fontSize:'1rem', flexShrink:0 }}>{open===i?'▲':'▼'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomateTab() {
  const [open,setOpen]=useState(null);
  const problems=[
    {icon:'⏰',severity:'critical',title:'No Scheduled Jobs (Cron)',desc:'Excel cannot run a macro automatically at midnight unless a desktop machine stays on.',detail:'Businesses need daily report generation and nightly refreshes without human intervention.',fix:'Use GitHub Actions, AWS Lambda with EventBridge, or n8n/Zapier.',tools:['GitHub Actions','AWS Lambda','n8n','Zapier']},
    {icon:'💣',severity:'critical',title:'Fragile VBA Macros',desc:'VBA breaks between Excel versions, OS (Windows vs Mac), and corporate security settings.',detail:'A macro working on one machine fails on another due to Trust Center settings, 32/64-bit differences, or missing ActiveX.',fix:'Rewrite macros as Python (openpyxl, xlwings) or Office Scripts.',tools:['Python openpyxl','Office Scripts','xlwings','Power Automate']},
    {icon:'📡',severity:'warning',title:'No Real-Time Webhooks',desc:'Excel cannot listen to live events — new orders, payments, form submissions.',detail:'Power Query can poll, but cannot listen to webhook events from external systems.',fix:'Use Zapier or Make.com to receive webhooks and write to Google Sheets or a database.',tools:['Zapier Webhooks','Make.com','n8n','Flask/FastAPI']},
    {icon:'📧',severity:'warning',title:'Email Automation Limits',desc:'Sending 1,000 personalised emails from Excel requires VBA + Outlook scripting.',detail:'Excel mail merge works for basic Word documents, but HTML emails with dynamic content require proper tools.',fix:'Use Mailchimp, SendGrid, or Power Automate for bulk email.',tools:['Mailchimp','SendGrid','Brevo','Power Automate']},
    {icon:'🔌',severity:'critical',title:'Excel Cannot Be an API Server',desc:'A mobile app or web dashboard cannot call Excel directly to get live data.',detail:'Excel is a local file, not a data service. There is no way to expose it as a REST API.',fix:'Store data in PostgreSQL or Supabase and expose via REST/GraphQL API.',tools:['Supabase','Firebase','Hasura','PostgREST']},
    {icon:'🔄',severity:'warning',title:'Power Query Refresh Limits',desc:'Scheduled refresh requires a machine on, logged in, and connected.',detail:'Many teams set up Power Query, then discover it only refreshes when someone manually opens the file.',fix:'Move to Power BI Premium cloud refresh or Azure Data Factory pipelines.',tools:['Power BI Premium','Azure Data Factory','dbt','Airbyte']},
    {icon:'🦠',severity:'critical',title:'VBA Security Risks',desc:'Macro-enabled .xlsm files are a primary malware delivery vector.',detail:'Excel macros have been used in high-profile ransomware attacks. IT departments block all macros globally.',fix:'Move to Office Scripts (cloud-based, sandboxed) or Python automation.',tools:['Office Scripts','Python openpyxl','Power Automate']},
    {icon:'🛑',severity:'critical',title:'No Error Recovery / Rollback',desc:'If a macro batch-updates 10,000 rows and fails halfway, data is left half-changed.',detail:'Database transactions commit fully or roll back completely. Excel macros leave garbage data on crash.',fix:'Wrap DB operations in transactions. Always work on a copy.',tools:['SQL transactions','PostgreSQL SAVEPOINT']},
    {icon:'🌐',severity:'warning',title:'Limited Third-Party Connectors',desc:'Connecting Excel to Jira, Salesforce, Shopify requires custom Power Query code.',detail:'Many popular tools need expensive add-ins or hand-written M code to connect.',fix:'Use Airbyte or Fivetran (200+ connectors) to load into a data warehouse.',tools:['Airbyte','Fivetran','Zapier','Make.com']},
    {icon:'☁️',severity:'warning',title:'No Headless Server Execution',desc:'Running Excel formulas on a server without opening the app is not supported.',detail:'Microsoft officially states Excel should not be used as a server-side component.',fix:'Use openpyxl or XlsxWriter in Python to generate .xlsx server-side.',tools:['openpyxl (Python)','XlsxWriter','ExcelJS (Node)','SheetJS']},
  ];
  return (
    <div>
      <p style={{ color:'var(--text-secondary)', fontSize:'.88rem', marginBottom:20 }}>Every automation limitation of Excel — with the modern alternative. Click to expand.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {problems.map((p,i)=>(
          <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${p.severity==='critical'?'#ef4444':'#f59e0b'}`, cursor:'pointer' }} onClick={()=>setOpen(open===i?null:i)}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{p.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}><span style={{ fontWeight:700, fontSize:'.9rem' }}>{p.title}</span><Sev level={p.severity}/></div>
                <p style={{ fontSize:'.84rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{p.desc}</p>
                {open===i&&(<div style={{ marginTop:10 }}>
                  <p style={{ fontSize:'.83rem', lineHeight:1.6, marginBottom:8, padding:'8px 12px', background:'var(--bg-secondary)', borderRadius:6 }}>{p.detail}</p>
                  <div style={{ background:'rgba(22,163,74,.06)', border:'1px solid rgba(22,163,74,.2)', borderRadius:6, padding:'8px 12px', fontSize:'.82rem', marginBottom:8 }}><strong>💡</strong> {p.fix}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{p.tools.map(t=><span key={t} className="xd-badge" style={{ background:'#dbeafe', color:'#1d4ed8' }}>{t}</span>)}</div>
                </div>)}
              </div>
              <span style={{ color:'var(--text-tertiary)', fontSize:'1rem', flexShrink:0 }}>{open===i?'▲':'▼'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [open,setOpen]=useState(null);
  const [cat,setCat]=useState('All');
  const problems=[
    {icon:'📱',cat:'UI',severity:'critical',title:'Poor Mobile Editing',desc:'Editing complex sheets on a phone is nearly impossible.',detail:'Excel\'s mobile app is read-optimised. Data entry on 6-inch screens with formula bars is error-prone.',fix:'Use Airtable mobile, Google Forms, or AppSheet for field data collection.',tools:['Airtable Mobile','Google Forms','AppSheet','Glide Apps']},
    {icon:'🤖',cat:'AI/ML',severity:'warning',title:'No Machine Learning',desc:'FORECAST.ETS and trendlines are nowhere near real predictive analytics.',detail:'Customer churn, sales forecasting with seasonality, image classification — none are possible in Excel.',fix:'Use Python (scikit-learn, Prophet) for ML. Connect to Excel data via Pandas.',tools:['Python scikit-learn','BigML','Azure ML','Obviously.ai']},
    {icon:'🗺️',cat:'GIS',severity:'info',title:'Weak Geographic Analysis',desc:'No spatial queries, buffer analysis, routing, or polygon intersection.',detail:'Delivery routes, catchment areas, heatmaps by postcode require a proper GIS tool.',fix:'Use QGIS (free) or Kepler.gl for web-based mapping.',tools:['QGIS','ArcGIS','Kepler.gl','Mapbox']},
    {icon:'📝',cat:'UI',severity:'warning',title:'No Custom Data-Entry Forms',desc:'Non-technical staff entering data directly into Excel creates formatting chaos.',detail:'Excel\'s built-in Form is basic. No field-level validation messages, conditional fields, or branded UI.',fix:'Use Microsoft Forms → Power Automate, or Typeform/Tally.',tools:['Microsoft Forms','Typeform','Tally','Google Forms']},
    {icon:'📊',cat:'BI',severity:'warning',title:'Basic Dashboard Interactivity',desc:'Excel dashboards feel stiff — slicers are clunky, cross-filtering is limited.',detail:'Power BI and Tableau let users click a chart bar and instantly filter everything on the page.',fix:'Export to Power BI Desktop (free) or Google Looker Studio.',tools:['Power BI Desktop','Looker Studio','Tableau Public','Metabase']},
    {icon:'📈',cat:'AI/ML',severity:'warning',title:'No Time-Series Forecasting',desc:'FORECAST.ETS handles simple seasonality only.',detail:'Facebook Prophet, ARIMA, SARIMA handle complex time series Excel cannot.',fix:'Use Python (Prophet, statsmodels) for advanced forecasting.',tools:['Prophet (Python)','statsmodels','R forecast','AWS Forecast']},
    {icon:'💬',cat:'AI/ML',severity:'info',title:'No Text Mining / NLP',desc:'Analysing customer feedback at scale is not possible in Excel.',detail:'Sentiment analysis, topic modelling, entity recognition require NLP tools.',fix:'Use Python (spaCy, HuggingFace) or AWS Comprehend.',tools:['spaCy','HuggingFace','AWS Comprehend','MonkeyLearn']},
    {icon:'🕸️',cat:'Analytics',severity:'info',title:'No Network / Graph Analysis',desc:'Visualising supplier networks or fraud rings as node-edge graphs is not possible.',detail:'Graph databases (Neo4j) find shortest paths, detect communities, and identify influential nodes.',fix:'Use NetworkX in Python for analysis, Gephi for visualisation.',tools:['NetworkX','Neo4j','Gephi','Kumu']},
    {icon:'📄',cat:'UI',severity:'warning',title:'Poor Document Generation',desc:'Generating formatted PDFs or contracts from row data requires VBA mail merge.',detail:'Word mail merge is brittle. Generating 500 personalised PDF invoices needs a proper tool.',fix:'Use Carbone.io or PDFMonkey for API-driven document generation.',tools:['Carbone.io','PDFMonkey','DocxTemplater']},
    {icon:'♿',cat:'UI',severity:'warning',title:'Accessibility Gaps',desc:'Complex nested tables and merged cells make Excel hard for screen readers.',detail:'WCAG 2.1 requires proper table headers, alt text on images, and logical reading order.',fix:'Run Excel\'s Accessibility Checker (Review → Check Accessibility). Avoid merged cells.',tools:['Excel Accessibility Checker','NVDA test','axe DevTools']},
  ];
  const cats=['All','UI','AI/ML','BI','Analytics','GIS'];
  const filtered=cat==='All'?problems:problems.filter(p=>p.cat===cat);
  return (
    <div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border-light)', background:cat===c?'#16a34a':'var(--bg-main)', color:cat===c?'#fff':'var(--text-primary)', cursor:'pointer', fontSize:'.8rem', fontFamily:'inherit', transition:'all .15s' }}>{c}</button>)}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((p,i)=>(
          <div key={p.title} className="xd-card" style={{ borderLeft:`3px solid ${p.severity==='critical'?'#ef4444':p.severity==='warning'?'#f59e0b':'#3b82f6'}`, cursor:'pointer' }} onClick={()=>setOpen(open===p.title?null:p.title)}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{p.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}><span style={{ fontWeight:700, fontSize:'.9rem' }}>{p.title}</span><Sev level={p.severity}/><span className="xd-badge" style={{ background:'#f3f4f6', color:'#6b7280', fontSize:'.72rem' }}>{p.cat}</span></div>
                <p style={{ fontSize:'.84rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{p.desc}</p>
                {open===p.title&&(<div style={{ marginTop:10 }}>
                  <p style={{ fontSize:'.83rem', lineHeight:1.6, marginBottom:8, padding:'8px 12px', background:'var(--bg-secondary)', borderRadius:6 }}>{p.detail}</p>
                  <div style={{ background:'rgba(22,163,74,.06)', border:'1px solid rgba(22,163,74,.2)', borderRadius:6, padding:'8px 12px', fontSize:'.82rem', marginBottom:8 }}><strong>💡</strong> {p.fix}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{p.tools.map(t=><span key={t} className="xd-badge" style={{ background:'#dbeafe', color:'#1d4ed8' }}>{t}</span>)}</div>
                </div>)}
              </div>
              <span style={{ color:'var(--text-tertiary)', fontSize:'1rem', flexShrink:0 }}>{open===p.title?'▲':'▼'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ExcelEditor({ t, lang }) {
  const [sheets, setSheets]           = useState([]);
  const [fileName, setFileName]       = useState('');
  const [rawWB, setRawWB]             = useState(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [activeTab, setActiveTab]     = useState('scan');
  const [activeSheet, setActiveSheet] = useState(0);
  const [history, setHistory]         = useState([]);
  const [redoStack, setRedoStack]     = useState([]);
  const [toast, setToast]             = useState(null);
  const [compareSheets, setCompareSheets]   = useState(null);
  const [compareFileName, setCompareFileName] = useState('');
  const [fixLog, setFixLog]           = useState([]);
  const [showFixLog, setShowFixLog]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTour, setShowTour]       = useState(false);
  const wrapRef                       = useRef(null);
  const SAVE_KEY_DATA = 'xd_autosave_sheets';
  const SAVE_KEY_META = 'xd_autosave_meta';
  const [lastSaved, setLastSaved]     = useState(null);
  const [saveStatus, setSaveStatus]   = useState('idle');
  const saveTimerRef                  = useRef(null);
  const [restoredFromCache, setRestoredFromCache] = useState(false);

  const analysis = useMemo(() => sheets.length ? analyzeWorkbook(sheets) : null, [sheets]);

  // ── Auto-save ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sheets.length || typeof window === 'undefined') return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY_DATA, JSON.stringify(sheets.map(s=>({name:s.name,data:s.data}))));
        localStorage.setItem(SAVE_KEY_META, JSON.stringify({ fileName, savedAt:Date.now() }));
        setLastSaved(new Date()); setSaveStatus('saved');
        setTimeout(()=>setSaveStatus('idle'), 2000);
      } catch(e) { setSaveStatus('idle'); }
    }, 800);
    return () => { if(saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [sheets, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore from cache ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SAVE_KEY_DATA);
      const meta = localStorage.getItem(SAVE_KEY_META);
      if (!raw || !meta) return;
      const parsed = JSON.parse(raw);
      const { fileName:savedName, savedAt } = JSON.parse(meta);
      if (!parsed?.length || Date.now()-savedAt > 7*24*60*60*1000) return;
      setSheets(parsed); setFileName(savedName||'autosaved.xlsx');
      setLastSaved(new Date(savedAt)); setActiveTab('scan'); setRestoredFromCache(true);
    } catch(e) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((msg, type='success') => {
    setToast({ message:msg, type }); setTimeout(()=>setToast(null), 3500);
  }, []);

  const pushHistory = useCallback((prev) => {
    setHistory(h=>[...h.slice(-40),prev]); setRedoStack([]);
  }, []);

  const updateData = useCallback((newData) => {
    setSheets(prev => { const next=prev.map((s,i)=>i===activeSheet?{...s,data:newData}:s); pushHistory(prev); return next; });
  }, [activeSheet, pushHistory]);

  const handleUndo = useCallback(() => {
    if(!history.length) return;
    const prev=history[history.length-1]; setHistory(h=>h.slice(0,-1)); setRedoStack(r=>[...r,sheets]); setSheets(prev); showToast('Undone','info');
  }, [history, sheets, showToast]);

  const handleRedo = useCallback(() => {
    if(!redoStack.length) return;
    const next=redoStack[redoStack.length-1]; setRedoStack(r=>r.slice(0,-1)); setHistory(h=>[...h,sheets]); setSheets(next); showToast('Redone','info');
  }, [redoStack, sheets, showToast]);

  useEffect(() => {
    const h = e => {
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();handleUndo();}
      if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();handleRedo();}
    };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[handleUndo,handleRedo]);

  // ── Fullscreen ───────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if(!isFullscreen){ const el=wrapRef.current; if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{}); else if(el?.webkitRequestFullscreen)el.webkitRequestFullscreen(); setIsFullscreen(true); }
    else { if(document.exitFullscreen)document.exitFullscreen().catch(()=>{}); else if(document.webkitExitFullscreen)document.webkitExitFullscreen(); setIsFullscreen(false); }
  },[isFullscreen]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement||document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange',h); document.addEventListener('webkitfullscreenchange',h);
    return()=>{ document.removeEventListener('fullscreenchange',h); document.removeEventListener('webkitfullscreenchange',h); };
  },[]);

  // ── File loading ─────────────────────────────────────────────────────────────
  const loadFile = useCallback(async (file) => {
    if(!file) return;
    const ext=file.name.split('.').pop().toLowerCase();
    if(!['xlsx','xls','csv','tsv','ods'].includes(ext)){ showToast('Please upload .xlsx, .xls, .csv, .tsv or .ods','error'); return; }
    setIsLoading(true);
    try {
      const XLSX=await getXLSX(); const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array',cellDates:true,cellFormula:true});
      const parsed=wb.SheetNames.map(name=>{
        const ws=wb.Sheets[name];
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
        const maxCols=Math.max(...raw.map(r=>r.length),0);
        const data=raw.map(r=>{const a=[...r];while(a.length<maxCols)a.push('');return a;});
        let formulas=null;
        try{ formulas=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true}).map(row=>(row||[]).map(cell=>cell&&typeof cell==='object'&&cell.f?'='+cell.f:null)); }catch(e){}
        return{name,data,formulas};
      });
      setSheets(parsed); setRawWB(wb); setFileName(file.name);
      setActiveSheet(0); setActiveTab('scan'); setHistory([]); setRedoStack([]); setFixLog([]); setRestoredFromCache(false);
      setTimeout(()=>{ const el=wrapRef.current; if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{}); else if(el?.webkitRequestFullscreen)el.webkitRequestFullscreen(); setIsFullscreen(true); },100);
      showToast(`✓ Loaded "${file.name}" — ${parsed.length} sheet${parsed.length>1?'s':''}`, 'success');
    } catch(err){ showToast('Failed to parse: '+err.message,'error'); }
    finally{ setIsLoading(false); }
  },[showToast]);

  const loadCompareFile = useCallback(async (file) => {
    if(!file) return;
    try {
      const XLSX=await getXLSX(); const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array',defval:'',raw:false});
      const parsed=wb.SheetNames.map(name=>{
        const ws=wb.Sheets[name];
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
        const maxCols=Math.max(...raw.map(r=>r.length),0);
        const data=raw.map(r=>{const a=[...r];while(a.length<maxCols)a.push('');return a;});
        return{name,data};
      });
      setCompareSheets(parsed); setCompareFileName(file.name); setActiveTab('compare');
      showToast(`Loaded "${file.name}" for comparison`,'info');
    }catch(err){ showToast('Failed to parse comparison file: '+err.message,'error'); }
  },[showToast]);

  const handleCompareFiles = useCallback(async (files) => {
    if(files.length===2){ await loadFile(files[0]); await loadCompareFile(files[1]); }
    else if(files.length===1&&sheets.length) await loadCompareFile(files[0]);
  },[loadFile,loadCompareFile,sheets.length]);

  const newBlank = useCallback(() => {
    setSheets([{name:'Sheet1',data:[['Name','Email','Phone','Company','Notes'],...Array(10).fill(null).map(()=>Array(5).fill(''))]}]);
    setFileName('new-spreadsheet.xlsx'); setActiveSheet(0); setActiveTab('edit');
    setHistory([]); setRedoStack([]); setFixLog([]);
    showToast('New blank spreadsheet','info');
  },[showToast]);

  // ── Apply fix ────────────────────────────────────────────────────────────────
  const applyFix = useCallback((issue) => {
    if(!issue.fixable||!issue.fix) return;
    const fix=issue.fix;
    if(fix.deleteRow!==undefined){
      const si=sheets.findIndex(s=>s.name===fix.sheet); if(si<0) return;
      const nd=sheets[si].data.filter((_,i)=>i!==fix.deleteRow);
      pushHistory(sheets); setSheets(prev=>prev.map((s,i)=>i===si?{...s,data:nd}:s));
      setFixLog(l=>[...l,{issue:issue.title,before:JSON.stringify(sheets[si].data[fix.deleteRow]),after:'(deleted)'}]);
      showToast('Row deleted');
    } else if(fix.newVal!==undefined){
      const si=sheets.findIndex(s=>s.name===fix.sheet); if(si<0) return;
      const before=sheets[si].data[fix.row][fix.col];
      const nd=sheets[si].data.map((r,ri)=>ri===fix.row?r.map((c,ci)=>ci===fix.col?fix.newVal:c):r);
      pushHistory(sheets); setSheets(prev=>prev.map((s,i)=>i===si?{...s,data:nd}:s));
      setFixLog(l=>[...l,{issue:issue.title,before:String(before),after:String(fix.newVal)}]);
      showToast('Fix applied');
    }
  },[sheets,pushHistory,showToast]);

  const bulkFix = useCallback((issues) => {
    pushHistory(sheets);
    const newSheets=sheets.map(s=>({...s,data:s.data.map(r=>[...r])}));
    const log=[]; const toDelete={};
    issues.forEach(iss=>{
      if(!iss.fixable||!iss.fix) return;
      const fix=iss.fix; const si=newSheets.findIndex(s=>s.name===fix.sheet); if(si<0) return;
      if(fix.deleteRow!==undefined)(toDelete[si]=toDelete[si]||[]).push(fix.deleteRow);
      else if(fix.newVal!==undefined){ const before=newSheets[si].data[fix.row][fix.col]; newSheets[si].data[fix.row][fix.col]=fix.newVal; log.push({issue:iss.title,before:String(before),after:String(fix.newVal)}); }
    });
    Object.entries(toDelete).forEach(([si,rows])=>{
      [...new Set(rows)].sort((a,b)=>b-a).forEach(ri=>{ log.push({issue:`Delete row ${ri}`,before:'(row)',after:'(deleted)'}); newSheets[+si].data.splice(ri,1); });
    });
    setSheets(newSheets); setFixLog(l=>[...l,...log]); setShowFixLog(true);
    showToast(`Applied ${log.length} fix${log.length!==1?'es':''}`);
  },[sheets,pushHistory,showToast]);

  // ── Custom clean ─────────────────────────────────────────────────────────────
  const customClean = useCallback((op) => {
    const sd=sheets[activeSheet]?.data; if(!sd) return;
    const toTitle=s=>String(s).replace(/\w\S*/g,w=>w[0].toUpperCase()+w.slice(1).toLowerCase());
    let nd;
    switch(op){
      case 'trim': nd=sd.map(r=>r.map(c=>typeof c==='string'?c.trim():c)); break;
      case 'dedup':{ const seen=new Set(),hdr=sd[0]; nd=[hdr,...sd.slice(1).filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true;})]; break; }
      case 'blank':{ nd=[sd[0],...sd.slice(1).filter(r=>!isBlankRow(r))]; break; }
      case 'numtext': nd=sd.map((r,ri)=>ri===0?r:r.map(c=>isNaN(c)&&!isNaN(Number(String(c||'').trim()))&&String(c||'').trim()!==''?Number(String(c).trim()):c)); break;
      case 'upper': nd=sd.map((r,ri)=>ri===0?r:r.map(c=>typeof c==='string'?c.toUpperCase():c)); break;
      case 'lower': nd=sd.map((r,ri)=>ri===0?r:r.map(c=>typeof c==='string'?c.toLowerCase():c)); break;
      case 'title': nd=sd.map((r,ri)=>ri===0?r:r.map(c=>typeof c==='string'?toTitle(c):c)); break;
      case 'filldown':{ nd=sd.map(r=>[...r]); for(let ci=0;ci<(nd[0]||[]).length;ci++){let last='';for(let ri=1;ri<nd.length;ri++){if(String(nd[ri][ci]??'').trim()==='')nd[ri][ci]=last;else last=nd[ri][ci];}} break; }
      default: return;
    }
    updateData(nd); showToast(`${op} applied`);
  },[sheets,activeSheet,updateData,showToast]);

  // ── Jump to cell ─────────────────────────────────────────────────────────────
  const jumpToCell = useCallback((sheetName, row, col) => {
    const si=sheets.findIndex(s=>s.name===sheetName); if(si>=0) setActiveSheet(si);
    setActiveTab('edit'); showToast(`Jumped to ${sheetName}!${String.fromCharCode(65+col)}${row+1}`,'info');
  },[sheets,showToast]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportXLSX = useCallback(async()=>{
    if(!sheets.length) return;
    try{ const XLSX=await getXLSX(); const wb=XLSX.utils.book_new(); sheets.forEach(({name,data})=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),name)); XLSX.writeFile(wb,(fileName.replace(/\.[^.]+$/,'')||'spreadsheet')+'_edited.xlsx'); showToast('Downloaded as XLSX'); }catch(e){ showToast('Export failed: '+e.message,'error'); }
  },[sheets,fileName,showToast]);

  const exportCSV = useCallback(async()=>{
    if(!sheets[activeSheet]) return;
    const XLSX=await getXLSX(); const csv=XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(sheets[activeSheet].data));
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`${(fileName.replace(/\.[^.]+$/,'')||'sheet')}.csv`});
    document.body.appendChild(a);a.click();document.body.removeChild(a); showToast('Downloaded as CSV');
  },[sheets,activeSheet,fileName,showToast]);

  const exportJSON = useCallback(()=>{
    const sd=sheets[activeSheet]?.data; if(!sd||sd.length<2) return;
    const [head,...rows]=sd; const json=rows.map(r=>Object.fromEntries(head.map((h,i)=>[h||`col${i}`,r[i]??''])));
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([JSON.stringify(json,null,2)],{type:'application/json'})),download:`${(fileName.replace(/\.[^.]+$/,'')||'data')}.json`});
    document.body.appendChild(a);a.click();document.body.removeChild(a); showToast('Downloaded as JSON');
  },[sheets,activeSheet,fileName,showToast]);

  // ── Feature search: navigate to a tab even without a file ────────────────────
  const handleFeatureSelect = useCallback((tab) => {
    setActiveTab(tab);
    // If the tab requires a file and none is loaded, show a toast
    const needsFile=['scan','edit','quality','clean','compare','perf','ask','limits','integrity','formula','format'];
    if(needsFile.includes(tab)&&!sheets.length) showToast('Upload a file first to use this feature','info');
  },[sheets.length, showToast]);

  // ── TABS ──────────────────────────────────────────────────────────────────────
  const TABS = [
    { id:'scan',     label:'🔍 Health Scan',  hide:!analysis },
    { id:'edit',     label:'✏️ Edit',          hide:!sheets.length },
    { id:'quality',  label:'📊 Data Quality', hide:!sheets.length },
    { id:'clean',    label:'🧹 Clean',         hide:!sheets.length },
    { id:'compare',  label:'🔄 Compare',       hide:!sheets.length },
    { id:'perf',     label:'⚡ Performance',   hide:!sheets.length },
    { id:'ask',      label:'💬 Ask',           hide:!analysis },
    { id:'limits',   label:'📏 Limits',        hide:!sheets.length },
    { id:'integrity',label:'🔗 Integrity',     hide:!sheets.length },
    { id:'formula',  label:'🧠 Formula Lab',   hide:!sheets.length },
    { id:'templates',label:'📋 BA Templates',  hide:false },
    { id:'format',   label:'🎨 Format Fixer',  hide:!sheets.length },
    { id:'collab',   label:'👥 Collab',        hide:false },
    { id:'automate', label:'🤖 Automate',      hide:false },
    { id:'analytics',label:'📈 Analytics',     hide:false },
    { id:'shortcuts',label:'⌨️ Shortcuts',      hide:false },
  ];

  return (
    <div className={`xd-wrap${isFullscreen?' fullscreen':''}`} ref={wrapRef}>
      <style>{CSS}</style>

      {/* Tour overlay */}
      {showTour && <Tour onClose={()=>setShowTour(false)} onTabChange={t=>{ if(sheets.length) setActiveTab(t); }}/>}

      {/* Loading overlay */}
      {isLoading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg-main)', padding:'32px 48px', borderRadius:14, textAlign:'center', boxShadow:'0 12px 40px rgba(0,0,0,.3)' }}>
            <Spinner size={40}/><div style={{ marginTop:14, fontWeight:700 }}>Reading workbook…</div>
          </div>
        </div>
      )}

      {/* Top bar — shown when file is loaded */}
      {sheets.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap', paddingBottom:8, borderBottom:'1px solid var(--border-light)' }}>
          <span style={{ fontSize:'1.1rem' }}>🩺</span>
          <span style={{ fontWeight:700, fontSize:'.9rem', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fileName||'Untitled'}</span>
          {analysis && <span className="xd-badge" style={{ background:analysis.summary.score>=80?'#dcfce7':analysis.summary.score>=60?'#fef9c3':'#fee2e2', color:analysis.summary.score>=80?'#15803d':analysis.summary.score>=60?'#854d0e':'#dc2626' }}>Score {analysis.summary.score}/100</span>}
          {analysis?.summary.critical>0&&<span className="xd-badge" style={{ background:'#fee2e2', color:'#dc2626' }}>🔴 {analysis.summary.critical}</span>}
          {analysis?.summary.warnings>0&&<span className="xd-badge" style={{ background:'#fef9c3', color:'#854d0e' }}>🟠 {analysis.summary.warnings}</span>}

          {/* Save indicator */}
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'.75rem', padding:'3px 9px', borderRadius:12,
            background:saveStatus==='saving'?'#fef9c3':saveStatus==='saved'?'#dcfce7':lastSaved?'#f3f4f6':'transparent',
            color:saveStatus==='saving'?'#854d0e':saveStatus==='saved'?'#15803d':'#6b7280', transition:'all .3s' }}>
            {saveStatus==='saving'?<><span style={{ width:8, height:8, borderRadius:'50%', border:'2px solid #d97706', borderTopColor:'transparent', animation:'spin .6s linear infinite', display:'inline-block' }}/> Saving…</>
            :saveStatus==='saved'?<>✓ Saved</>
            :lastSaved?<>💾 {lastSaved.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</>:null}
          </span>

          <div style={{ flex:1 }}/>

          {/* Tour button */}
          <button className="xd-btn ghost" onClick={()=>setShowTour(true)} style={{ fontSize:'.8rem' }}>🎓 Tour</button>

          <button className="xd-btn" onClick={handleUndo} disabled={!history.length} title="Undo (Ctrl+Z)">↩ Undo</button>
          <button className="xd-btn" onClick={handleRedo} disabled={!redoStack.length} title="Redo (Ctrl+Y)">↪ Redo</button>
          {fixLog.length>0&&<button className="xd-btn" onClick={()=>setShowFixLog(v=>!v)}>📋 Fix Log ({fixLog.length})</button>}
          <button className="xd-btn primary" onClick={exportXLSX}>⬇ XLSX</button>
          <button className="xd-btn" onClick={exportCSV}>⬇ CSV</button>
          <button className="xd-btn" onClick={exportJSON}>⬇ JSON</button>
          <button className="xd-btn ghost" onClick={()=>{ setSheets([]); setFileName(''); setFixLog([]); setCompareSheets(null); if(isFullscreen)toggleFullscreen(); setLastSaved(null); setSaveStatus('idle'); try{localStorage.removeItem(SAVE_KEY_DATA);localStorage.removeItem(SAVE_KEY_META);}catch(e){} }}>📂 New</button>
          <button className="xd-btn" onClick={toggleFullscreen} title={isFullscreen?'Exit fullscreen':'Fullscreen'} style={{ fontSize:'1rem', padding:'6px 10px' }}>{isFullscreen?'⊠':'⛶'}</button>
        </div>
      )}

      {/* Restored from cache banner */}
      {restoredFromCache && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:8, marginBottom:10, fontSize:'.85rem', color:'#1d4ed8' }}>
          <span>🔄</span>
          <span style={{ flex:1 }}><strong>Session restored</strong> — your last edits to <em>{fileName}</em> were automatically saved and reloaded.{lastSaved&&<span style={{ opacity:.7, marginLeft:6 }}>Saved at {lastSaved.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} on {lastSaved.toLocaleDateString()}</span>}</span>
          <button onClick={()=>setRestoredFromCache(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#1d4ed8', fontSize:'1.1rem', lineHeight:1, padding:'0 4px' }}>✕</button>
        </div>
      )}

      {/* Fix log */}
      {showFixLog && fixLog.length > 0 && (
        <div className="xd-card" style={{ marginBottom:10, maxHeight:180, overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <strong>📋 Fix Log ({fixLog.length})</strong>
            <button className="xd-btn ghost" style={{ padding:'2px 8px' }} onClick={()=>setShowFixLog(false)}>✕</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
            <thead><tr style={{ background:'var(--bg-tertiary)' }}>
              {['Issue','Before','After'].map(h=><th key={h} style={{ padding:'4px 8px', border:'1px solid var(--border-light)', textAlign:'left' }}>{h}</th>)}
            </tr></thead>
            <tbody>{fixLog.map((l,i)=>(
              <tr key={i} style={{ background:i%2===0?'var(--bg-main)':'var(--bg-secondary)' }}>
                <td style={{ padding:'4px 8px', border:'1px solid var(--border-light)' }}>{l.issue}</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--border-light)', background:'#fee2e2', color:'#dc2626', fontFamily:'var(--font-mono)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.before}</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--border-light)', background:'#dcfce7', color:'#15803d', fontFamily:'var(--font-mono)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.after}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Tab bar */}
      {sheets.length > 0 && (
        <div style={{ position:'relative', marginBottom:16 }}>
          <div id="xd-tabbar" style={{ display:'flex', gap:0, overflowX:'auto', borderBottom:'2px solid var(--border-light)', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
            {TABS.filter(t=>!t.hide).map(tab=>(
              <button key={tab.id} className={`xd-tab${activeTab===tab.id?' active':''}`}
                onClick={()=>setActiveTab(tab.id)} style={{ flexShrink:0 }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ position:'absolute', right:0, top:0, bottom:2, width:40, pointerEvents:'none', background:'linear-gradient(to right, transparent, var(--bg-main))' }}/>
          <button onClick={()=>{const el=document.getElementById('xd-tabbar');if(el)el.scrollBy({left:200,behavior:'smooth'});}}
            style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-60%)', background:'var(--bg-main)', border:'1px solid var(--border-light)', borderRadius:'50%', width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem', color:'var(--text-secondary)', zIndex:2, boxShadow:'var(--shadow-sm)' }}>›</button>
        </div>
      )}

      {/* Content */}
      {!sheets.length ? (
        <LandingScreen onFile={loadFile} onBlank={newBlank} isDragging={isDragging} setIsDragging={setIsDragging}
          onCompare={handleCompareFiles} onStartTour={()=>setShowTour(true)} onFeatureSelect={handleFeatureSelect}/>
      ) : activeTab==='scan' && analysis ? (
        <HealthTab analysis={analysis} onApplyFix={applyFix} onJumpToCell={jumpToCell}/>
      ) : activeTab==='edit' ? (
        <SpreadsheetTab sheets={sheets} activeSheet={activeSheet} setSheets={setSheets} setActiveSheet={setActiveSheet}
          analysis={analysis} updateData={updateData} showToast={showToast}/>
      ) : activeTab==='quality' ? (
        <DataQualityTab sheets={sheets} activeSheet={activeSheet}/>
      ) : activeTab==='clean' && analysis ? (
        <CleanTab analysis={analysis} onBulkFix={bulkFix} onCustomClean={customClean}/>
      ) : activeTab==='compare' ? (
        <CompareTab sheetsA={sheets} sheetsB={compareSheets} fileNameA={fileName} fileNameB={compareFileName} onLoad={loadCompareFile}/>
      ) : activeTab==='perf' ? (
        <PerformanceTab sheets={sheets}/>
      ) : activeTab==='ask' && analysis ? (
        <AskTab sheets={sheets} analysis={analysis}/>
      ) : activeTab==='limits' ? (
        <LimitsTab sheets={sheets} fileName={fileName}/>
      ) : activeTab==='integrity' ? (
        <IntegrityTab sheets={sheets} activeSheet={activeSheet}/>
      ) : activeTab==='formula' ? (
        <FormulaLabTab sheets={sheets} activeSheet={activeSheet}/>
      ) : activeTab==='templates' ? (
        <BATemplatesTab setSheets={setSheets} setFileName={setFileName} setActiveTab={setActiveTab} setActiveSheet={setActiveSheet} showToast={showToast}/>
      ) : activeTab==='format' ? (
        <FormatFixerTab sheets={sheets} activeSheet={activeSheet} updateData={updateData} showToast={showToast}/>
      ) : activeTab==='collab' ? (
        <CollabTab/>
      ) : activeTab==='automate' ? (
        <AutomateTab/>
      ) : activeTab==='analytics' ? (
        <AnalyticsTab/>
      ) : activeTab==='shortcuts' ? (
        <ShortcutsTab/>
      ) : null}

      <Toast toast={toast}/>
    </div>
  );
}
