'use client';
import { useState, useMemo } from 'react';
import { ScoreRing, Sev } from '../components.jsx';

export default function HealthTab({ analysis, onApplyFix, onJumpToCell }) {
  const { issues, summary } = analysis;
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const filtered = filter === 'all' ? issues : issues.filter(i => i.severity === filter);

  return (
    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      {/* Left sidebar */}
      <div style={{ width:204, flexShrink:0 }}>
        <div className="xd-card" style={{ textAlign:'center', marginBottom:12 }}>
          <ScoreRing score={summary.score} />
          <div style={{ marginTop:10, fontSize:'.78rem', color:'var(--text-secondary)' }}>Workbook Health Score</div>
        </div>
        <div className="xd-card" style={{ marginBottom:12 }}>
          {[
            { label:'🔴 Critical', val:summary.critical, color:'#dc2626' },
            { label:'🟠 Warnings', val:summary.warnings, color:'#d97706' },
            { label:'ℹ️ Info', val:summary.infos, color:'#2563eb' },
            { label:'📦 Total cells', val:summary.total.toLocaleString(), color:'var(--text-secondary)' },
            { label:'❌ Formula errors', val:summary.errors, color:summary.errors?'#dc2626':'#16a34a' },
            { label:'🔢 Num-as-text', val:summary.numericStr, color:'var(--text-secondary)' },
            { label:'🗓️ Date-as-text', val:summary.dateText, color:'var(--text-secondary)' },
            { label:'↔️ Space issues', val:summary.spaces, color:'var(--text-secondary)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:'.79rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontWeight:700, color:r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {['all','critical','warning','info'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 10px', borderRadius:6, border:'1px solid var(--border-light)',
                background:filter===f?'#16a34a':'var(--bg-main)', color:filter===f?'#fff':'var(--text-primary)',
                cursor:'pointer', fontSize:'.82rem', textAlign:'left', fontFamily:'inherit' }}>
              {f==='all'?'All issues':f[0].toUpperCase()+f.slice(1)}
              <span style={{ float:'right', opacity:.7 }}>{f==='all'?issues.length:issues.filter(i=>i.severity===f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Issues list */}
      <div style={{ flex:1, minWidth:0 }}>
        {filtered.length === 0 && (
          <div className="xd-card" style={{ textAlign:'center', padding:40, color:'#16a34a', fontWeight:700 }}>
            ✅ No {filter!=='all'?filter:''} issues found!
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.slice(0,200).map(issue => (
            <div key={issue.id} className={`xd-issue-row ${issue.severity}`}
              onClick={() => setExpanded(expanded===issue.id?null:issue.id)}>
              <div style={{ fontSize:'1.1rem', flexShrink:0 }}>
                {issue.severity==='critical'?'🔴':issue.severity==='warning'?'🟠':issue.severity==='success'?'🟢':'🔵'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:600, fontSize:'.87rem' }}>{issue.title}</span>
                  <Sev level={issue.severity}/>
                  {issue.fixable && <span className="xd-badge" style={{ background:'#dcfce7', color:'#15803d' }}>Auto-fixable</span>}
                </div>
                {issue.sheet && (
                  <span style={{ fontSize:'.75rem', color:'var(--text-tertiary)', display:'block', marginTop:2 }}>
                    Sheet: {issue.sheet}{issue.cell?` · Cell: ${issue.cell}`:''}
                  </span>
                )}
                {expanded === issue.id && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'var(--bg-secondary)', borderRadius:6, fontSize:'.83rem', lineHeight:1.6 }}>
                    <pre style={{ margin:0, fontFamily:'var(--font-mono)', fontSize:'.79rem', whiteSpace:'pre-wrap', color:'var(--text-secondary)' }}>{issue.detail}</pre>
                    <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                      {issue.fixable && (
                        <button className="xd-btn primary" style={{ fontSize:'.8rem', padding:'4px 12px' }}
                          onClick={e=>{e.stopPropagation();onApplyFix(issue);}}>✓ Apply Fix</button>
                      )}
                      {issue.row>=0 && issue.col>=0 && (
                        <button className="xd-btn" style={{ fontSize:'.8rem', padding:'4px 12px' }}
                          onClick={e=>{e.stopPropagation();onJumpToCell(issue.sheet,issue.row,issue.col);}}>→ Go to Cell</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length > 200 && (
            <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'.85rem' }}>
              Showing 200 of {filtered.length} issues. Apply fixes to reduce the list.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
