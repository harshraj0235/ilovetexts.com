'use client';
import { useState, useEffect } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to Excel Doctor',
    body: 'The most powerful free Excel tool on the internet. Upload any .xlsx, .xls, .csv, .tsv, or .ods file — your data never leaves your browser.',
    highlight: null,
    tab: null,
  },
  {
    id: 'upload',
    title: '📂 Step 1 — Upload Your File',
    body: 'Drag and drop your Excel file onto the landing screen, or click Browse File. The tool instantly reads all sheets, formulas, and cell values.',
    highlight: null,
    tab: null,
  },
  {
    id: 'scan',
    title: '🔍 Step 2 — Health Scan',
    body: 'The Health Scan tab runs automatically after upload. It gives your workbook a score out of 100 and lists every problem — formula errors, duplicates, whitespace, date-as-text, and inconsistent formulas — with the exact cell address.',
    highlight: 'scan',
    tab: 'scan',
  },
  {
    id: 'fix',
    title: '✅ Step 3 — Fix Issues',
    body: 'Click any issue in the Health Scan to expand it. Issues marked "Auto-fixable" have a green "Apply Fix" button — one click repairs that cell. Use "Fix All Automatically" in the Clean tab to batch-fix everything at once.',
    highlight: 'scan',
    tab: 'scan',
  },
  {
    id: 'edit',
    title: '✏️ Step 4 — Edit Your Spreadsheet',
    body: 'The Edit tab gives you a full spreadsheet editor. Double-click any cell to edit. Tab moves right, Enter moves down. Cells flagged with issues are highlighted 🔴 or 🟠. Sort any column by clicking its header.',
    highlight: 'edit',
    tab: 'edit',
  },
  {
    id: 'clean',
    title: '🧹 Step 5 — Clean Your Data',
    body: 'The Clean tab has one-click operations: trim whitespace, remove duplicates, fix numbers stored as text, fill down blanks, and convert casing. Every operation is undoable with Ctrl+Z.',
    highlight: 'clean',
    tab: 'clean',
  },
  {
    id: 'formula',
    title: '🧠 Step 6 — Formula Lab',
    body: 'Paste any formula into the Formula Explainer to get a plain-English breakdown. The Formula Detective scans your sheet for risky patterns like VLOOKUP approximate match and IFERROR hiding errors. The Function Reference covers 35+ Excel functions.',
    highlight: 'formula',
    tab: 'formula',
  },
  {
    id: 'templates',
    title: '📋 Step 7 — BA Templates',
    body: 'Business Analysts: one-click download professional templates — SRS, BRD, RTM, MIS Report, Issue Log, Effort Estimation, and Change Log. Open directly in the editor or download as .xlsx.',
    highlight: 'templates',
    tab: 'templates',
  },
  {
    id: 'compare',
    title: '🔄 Step 8 — Compare Files',
    body: 'Upload a second file in the Compare tab to see a cell-by-cell diff. Perfect for auditing report versions or finding accidental changes.',
    highlight: 'compare',
    tab: 'compare',
  },
  {
    id: 'ask',
    title: '💬 Step 9 — Ask Your Spreadsheet',
    body: 'Type any question about your data — "Why is my total wrong?", "Find duplicates", "How many rows?" — and get instant answers based on your actual workbook.',
    highlight: 'ask',
    tab: 'ask',
  },
  {
    id: 'save',
    title: '💾 Step 10 — Auto-Save & Export',
    body: 'Every edit is automatically saved to your browser cache — reopen the page and your work is restored. Export your edited file as .xlsx (all sheets), .csv (current sheet), or .json at any time.',
    highlight: null,
    tab: null,
  },
  {
    id: 'done',
    title: '🎉 You\'re Ready!',
    body: 'That\'s everything! Use the search bar at the top to quickly find any feature by name. Enjoy Excel Doctor — the most comprehensive free spreadsheet tool available.',
    highlight: null,
    tab: null,
  },
];

export default function Tour({ onClose, onTabChange }) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (current.tab && onTabChange) onTabChange(current.tab);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="xd-tour-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="xd-tour-box">
        {/* Progress dots */}
        <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:20 }}>
          {TOUR_STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              style={{ width:i===step?20:8, height:8, borderRadius:4, border:'none', cursor:'pointer', padding:0,
                background:i===step?'#16a34a':i<step?'#86efac':'var(--border-light)', transition:'all .25s' }}/>
          ))}
        </div>

        {/* Step counter */}
        <div style={{ fontSize:'.75rem', color:'var(--text-tertiary)', textAlign:'center', marginBottom:6 }}>
          Step {step+1} of {TOUR_STEPS.length}
        </div>

        {/* Content */}
        <h2 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:12, textAlign:'center' }}>{current.title}</h2>
        <p style={{ fontSize:'.9rem', lineHeight:1.7, color:'var(--text-secondary)', textAlign:'center', marginBottom:24 }}>{current.body}</p>

        {/* Buttons */}
        <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
          <button className="xd-btn ghost" onClick={onClose} style={{ fontSize:'.82rem' }}>Skip Tour</button>
          <div style={{ display:'flex', gap:8 }}>
            {step > 0 && (
              <button className="xd-btn" onClick={() => setStep(s => s-1)}>← Back</button>
            )}
            <button className="xd-btn primary"
              onClick={() => isLast ? onClose() : setStep(s => s+1)}
              style={{ minWidth:100 }}>
              {isLast ? '✓ Get Started' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
