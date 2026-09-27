'use client';
import { colLetter } from './utils.js';

// ─── Toast notification ───────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null;
  const colors = { error:'#ef4444', warning:'#f59e0b', success:'#16a34a', info:'#2563eb' };
  return (
    <div style={{ position:'fixed', bottom:24, right:24, padding:'12px 18px',
      background:colors[toast.type]||colors.success, color:'#fff',
      borderRadius:8, zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.2)',
      fontSize:'.88rem', fontWeight:500, display:'flex', alignItems:'center', gap:8,
      maxWidth:380, animation:'slideUp .2s ease' }}>
      {toast.type==='error'?'❌':toast.type==='warning'?'⚠️':toast.type==='info'?'ℹ️':'✅'} {toast.message}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size=32, color='#16a34a' }) {
  return <div style={{ width:size, height:size, border:`3px solid rgba(0,0,0,.1)`,
    borderTopColor:color, borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />;
}

// ─── Workbook score ring ──────────────────────────────────────────────────────
export function ScoreRing({ score }) {
  const color = score>=80?'#16a34a':score>=60?'#f59e0b':'#ef4444';
  const label = score>=80?'Healthy':score>=60?'Fair':'Issues';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div className="xd-score-ring" style={{ border:`6px solid ${color}`, color }}>{score}</div>
      <span style={{ fontSize:'.75rem', fontWeight:700, color }}>{label}</span>
    </div>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────
export function Sev({ level }) {
  const map = {
    critical:{ bg:'#fee2e2', color:'#dc2626', label:'Critical' },
    warning: { bg:'#fef9c3', color:'#854d0e', label:'Warning' },
    info:    { bg:'#dbeafe', color:'#1d4ed8', label:'Info' },
    success: { bg:'#dcfce7', color:'#15803d', label:'OK' },
  };
  const s = map[level]||map.info;
  return <span className="xd-badge" style={{ background:s.bg, color:s.color }}>{s.label}</span>;
}

// ─── Cell range selection helper ──────────────────────────────────────────────
export function buildRange(a, b) {
  const s = new Set();
  for (let r=Math.min(a.row,b.row); r<=Math.max(a.row,b.row); r++)
    for (let c=Math.min(a.col,b.col); c<=Math.max(a.col,b.col); c++)
      s.add(`${r}_${c}`);
  return s;
}

// ─── Section heading ──────────────────────────────────────────────────────────
export function SectionHead({ children, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <h3 style={{ fontWeight:800, fontSize:'1rem', marginBottom:sub?4:0 }}>{children}</h3>
      {sub && <p style={{ fontSize:'.85rem', color:'var(--text-secondary)' }}>{sub}</p>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon='📭', title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-secondary)' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:700, marginBottom:4 }}>{title}</div>
      {sub && <div style={{ fontSize:'.85rem', opacity:.7 }}>{sub}</div>}
    </div>
  );
}

// ─── Markdown-ish text renderer (bold, italic, bullets) ───────────────────────
export function Markdown({ text }) {
  return (
    <>
      {String(text||'').split('\n').map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <div key={i} style={{ marginBottom: line===''?6:0 }}>
            {parts.map((p, j) =>
              p.startsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong>
              : p.startsWith('*') ? <em key={j}>{p.slice(1,-1)}</em>
              : <span key={j}>{p}</span>
            )}
          </div>
        );
      })}
    </>
  );
}
