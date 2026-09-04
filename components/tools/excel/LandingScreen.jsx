'use client';
import { useState, useRef, useMemo } from 'react';

const ALL_FEATURES = [
  { tab:'scan',      icon:'🔍', title:'Health Scan',          desc:'Full workbook audit — scores the file out of 100 and lists every issue.' },
  { tab:'edit',      icon:'✏️', title:'Edit Spreadsheet',     desc:'Inline cell editing, sort, filter, find & replace, multi-sheet tabs.' },
  { tab:'quality',   icon:'📊', title:'Data Quality',         desc:'Per-column completeness, type detection, min/max/avg stats.' },
  { tab:'clean',     icon:'🧹', title:'Clean Data',           desc:'Trim whitespace, remove duplicates, fix text numbers, fill down blanks.' },
  { tab:'compare',   icon:'🔄', title:'Compare Files',        desc:'Diff two Excel versions cell by cell. See exactly what changed.' },
  { tab:'perf',      icon:'⚡', title:'Performance Doctor',   desc:'Find volatile formulas and slow workbook patterns.' },
  { tab:'ask',       icon:'💬', title:'Ask Anything',         desc:'Chat with your data — "Why is my total wrong?" gets real answers.' },
  { tab:'limits',    icon:'📏', title:'Limits Advisor',       desc:'Live check against Excel row/column/memory/size limits.' },
  { tab:'integrity', icon:'🔗', title:'Data Integrity',       desc:'Detect duplicate IDs, mixed types, case issues, foreign key gaps.' },
  { tab:'formula',   icon:'🧠', title:'Formula Lab',          desc:'Explain any formula, detect risky patterns, browse 35+ function docs.' },
  { tab:'templates', icon:'📋', title:'BA Templates',         desc:'One-click SRS, BRD, RTM, MIS Report, Issue Log, Effort Estimation.' },
  { tab:'format',    icon:'🎨', title:'Format Fixer',         desc:'Detect mixed dates, currency symbols, phone numbers, HTML tags.' },
  { tab:'collab',    icon:'👥', title:'Collaboration Guide',  desc:'Every multi-user Excel problem with modern tool alternatives.' },
  { tab:'automate',  icon:'🤖', title:'Automation Guide',     desc:'VBA risks, cron jobs, webhooks, API limitations and replacements.' },
  { tab:'analytics', icon:'📈', title:'Analytics Guide',      desc:'ML, GIS, BI, NLP gaps and upgrade paths beyond Excel.' },
  { tab:'shortcuts', icon:'⌨️', title:'Shortcuts & Formulas', desc:'Full keyboard shortcut reference + Excel formula cheat sheet.' },
];

export default function LandingScreen({ onFile, onBlank, isDragging, setIsDragging, onCompare, onStartTour, onFeatureSelect }) {
  const fileRef = useRef(null);
  const cmpRef = useRef(null);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return ALL_FEATURES.filter(f =>
      f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div style={{ maxWidth:820, margin:'0 auto' }}>

      {/* Feature search bar */}
      <div style={{ position:'relative', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
          border:'2px solid', borderColor:searchFocused?'#16a34a':'var(--border-light)',
          borderRadius:10, background:'var(--bg-main)', transition:'border-color .15s',
          boxShadow:searchFocused?'0 0 0 3px rgba(22,163,74,.12)':'none' }}>
          <span style={{ fontSize:'1.1rem', flexShrink:0 }}>🔎</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search features — Formula Lab, BA Templates, Compare Files, Shortcuts…"
            style={{ flex:1, border:'none', background:'transparent', outline:'none',
              fontSize:'.95rem', color:'var(--text-primary)', fontFamily:'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:'1rem', lineHeight:1 }}>✕</button>
          )}
        </div>

        {/* Search dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="xd-search-drop">
            {searchResults.map(f => (
              <div key={f.tab} className="xd-search-item"
                onMouseDown={() => { onFeatureSelect(f.tab); setSearch(''); }}>
                <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:'.88rem' }}>{f.title}</div>
                  <div style={{ fontSize:'.78rem', color:'var(--text-secondary)' }}>{f.desc}</div>
                </div>
                <span style={{ marginLeft:'auto', fontSize:'.75rem', color:'var(--text-tertiary)', flexShrink:0 }}>→ Open</span>
              </div>
            ))}
          </div>
        )}
        {searchFocused && search.trim() && searchResults.length === 0 && (
          <div className="xd-search-drop" style={{ padding:'14px', textAlign:'center', color:'var(--text-secondary)', fontSize:'.85rem' }}>
            No features matching "{search}"
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f=e.dataTransfer.files[0]; if(f)onFile(f); }}
        onClick={() => fileRef.current?.click()}
        style={{ border:`2.5px dashed ${isDragging?'#16a34a':'var(--border-light)'}`,
          borderRadius:16, padding:'52px 32px', textAlign:'center', cursor:'pointer',
          background:isDragging?'rgba(22,163,74,.04)':'var(--bg-secondary)',
          transition:'all .2s', marginBottom:16 }}
      >
        <div style={{ fontSize:'3.2rem', marginBottom:12 }}>🩺</div>
        <h2 style={{ fontSize:'1.45rem', fontWeight:800, marginBottom:8 }}>Excel Doctor</h2>
        <p style={{ color:'var(--text-secondary)', marginBottom:18, fontSize:'.93rem' }}>
          Drop your Excel or CSV file — find problems, clean data, fix formulas, export
        </p>
        <p style={{ fontSize:'.78rem', color:'var(--text-tertiary)', marginBottom:18 }}>
          🔒 100% private · processed in your browser · never uploaded · .xlsx · .xls · .csv · .tsv · .ods
        </p>
        <button className="xd-btn primary" style={{ fontSize:'.98rem', padding:'10px 28px' }}
          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
          📂 Browse File
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.ods"
          onChange={e => { const f=e.target.files[0]; if(f)onFile(f); e.target.value=''; }} style={{ display:'none' }}/>
        <p style={{ marginTop:12, fontSize:'.78rem', color:'var(--text-tertiary)' }}>
          or drag and drop your file here
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28, justifyContent:'center' }}>
        <button className="xd-btn ghost" onClick={onBlank}>✨ Blank Spreadsheet</button>
        <button className="xd-btn ghost" onClick={() => cmpRef.current?.click()}>🔄 Compare Two Files</button>
        <button className="xd-btn ghost" onClick={onStartTour} style={{ background:'rgba(22,163,74,.06)', borderColor:'#16a34a', color:'#16a34a', fontWeight:600 }}>
          🎓 Take the Tour
        </button>
        <input ref={cmpRef} type="file" accept=".xlsx,.xls,.csv" multiple
          onChange={e => { onCompare(Array.from(e.target.files)); e.target.value=''; }} style={{ display:'none' }}/>
      </div>

      {/* Feature grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:10 }}>
        {ALL_FEATURES.map(f => (
          <button key={f.tab} onClick={() => onFeatureSelect(f.tab)}
            style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6,
              padding:'14px', borderRadius:10, border:'1px solid var(--border-light)',
              background:'var(--bg-main)', cursor:'pointer', textAlign:'left',
              transition:'all .15s', fontFamily:'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.background='rgba(22,163,74,.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--bg-main)'; }}>
            <div style={{ fontSize:'1.4rem' }}>{f.icon}</div>
            <div style={{ fontWeight:700, fontSize:'.85rem' }}>{f.title}</div>
            <div style={{ fontSize:'.76rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{f.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
