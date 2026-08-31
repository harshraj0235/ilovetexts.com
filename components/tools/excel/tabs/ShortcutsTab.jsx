'use client';
import { useState } from 'react';

const SHORTCUT_SECTIONS = [
  {
    title: '⌨️ Navigation', items: [
      { keys:['Ctrl','Home'], desc:'Go to cell A1' },
      { keys:['Ctrl','End'], desc:'Go to the last used cell' },
      { keys:['Ctrl','→'], desc:'Jump to the last filled cell in a row' },
      { keys:['Ctrl','↓'], desc:'Jump to the last filled cell in a column' },
      { keys:['Ctrl','G'], desc:'Go To dialog (also F5)' },
      { keys:['Ctrl','Backspace'], desc:'Scroll back to the active cell' },
      { keys:['F5'], desc:'Open Go To dialog' },
    ],
  },
  {
    title: '✏️ Editing', items: [
      { keys:['F2'], desc:'Edit the active cell' },
      { keys:['Escape'], desc:'Cancel cell edit' },
      { keys:['Ctrl','Z'], desc:'Undo' },
      { keys:['Ctrl','Y'], desc:'Redo' },
      { keys:['Ctrl','D'], desc:'Fill Down — copy top cell to selected cells below' },
      { keys:['Ctrl','R'], desc:'Fill Right — copy left cell to selected cells' },
      { keys:['Ctrl','Enter'], desc:'Fill all selected cells with the current entry' },
      { keys:['Alt','Enter'], desc:'New line within a cell' },
      { keys:['Delete'], desc:'Clear cell contents (keeps formatting)' },
      { keys:['Ctrl','Delete'], desc:'Delete to end of line in edit mode' },
    ],
  },
  {
    title: '🔍 Selection', items: [
      { keys:['Ctrl','A'], desc:'Select all cells (press twice for entire sheet)' },
      { keys:['Ctrl','Shift','End'], desc:'Extend selection to last used cell' },
      { keys:['Shift','Space'], desc:'Select entire row' },
      { keys:['Ctrl','Space'], desc:'Select entire column' },
      { keys:['Ctrl','Shift','*'], desc:'Select the current region (data block)' },
      { keys:['Ctrl','Shift','←/→'], desc:'Extend selection to next empty cell' },
      { keys:['Ctrl','Shift','O'], desc:'Select all cells with comments' },
    ],
  },
  {
    title: '📋 Copy & Paste', items: [
      { keys:['Ctrl','C'], desc:'Copy' },
      { keys:['Ctrl','X'], desc:'Cut' },
      { keys:['Ctrl','V'], desc:'Paste' },
      { keys:['Ctrl','Alt','V'], desc:'Paste Special dialog' },
      { keys:['Ctrl','Shift','V'], desc:'Paste Values only (no formatting)' },
      { keys:["Ctrl","'"], desc:"Copy formula from the cell above" },
      { keys:['Ctrl','"'], desc:'Copy value from the cell above' },
    ],
  },
  {
    title: '🔢 Formatting', items: [
      { keys:['Ctrl','1'], desc:'Format Cells dialog' },
      { keys:['Ctrl','B'], desc:'Bold' },
      { keys:['Ctrl','I'], desc:'Italic' },
      { keys:['Ctrl','U'], desc:'Underline' },
      { keys:['Ctrl','5'], desc:'Strikethrough' },
      { keys:['Alt','H','H'], desc:'Fill color' },
      { keys:['Ctrl','Shift','$'], desc:'Apply Currency format' },
      { keys:['Ctrl','Shift','%'], desc:'Apply Percentage format' },
      { keys:['Ctrl','Shift','#'], desc:'Apply Date format' },
      { keys:['Ctrl','Shift','!'], desc:'Apply Number format (2 decimal places)' },
    ],
  },
  {
    title: '📊 Rows & Columns', items: [
      { keys:['Ctrl','+'], desc:'Insert row/column (with selection)' },
      { keys:['Ctrl','-'], desc:'Delete row/column (with selection)' },
      { keys:['Alt','H','O','I'], desc:'AutoFit column width' },
      { keys:['Alt','H','O','A'], desc:'AutoFit row height' },
      { keys:['Ctrl','9'], desc:'Hide selected rows' },
      { keys:['Ctrl','0'], desc:'Hide selected columns' },
      { keys:['Ctrl','Shift','9'], desc:'Unhide rows' },
      { keys:['Ctrl','Shift','0'], desc:'Unhide columns' },
    ],
  },
  {
    title: '📁 Workbook & Files', items: [
      { keys:['Ctrl','N'], desc:'New workbook' },
      { keys:['Ctrl','O'], desc:'Open workbook' },
      { keys:['Ctrl','S'], desc:'Save' },
      { keys:['Ctrl','Shift','S'], desc:'Save As' },
      { keys:['Ctrl','W'], desc:'Close workbook' },
      { keys:['Ctrl','F4'], desc:'Close workbook window' },
      { keys:['F12'], desc:'Save As dialog' },
      { keys:['Ctrl','P'], desc:'Print' },
      { keys:['Ctrl','Tab'], desc:'Switch to next open workbook' },
    ],
  },
  {
    title: '🔍 Find & Replace', items: [
      { keys:['Ctrl','F'], desc:'Find dialog' },
      { keys:['Ctrl','H'], desc:'Find & Replace dialog' },
      { keys:['Ctrl','Shift','F'], desc:'Find with extended options' },
      { keys:['F4'], desc:'In formulas: toggle absolute/relative reference ($A$1 → A$1 → $A1 → A1)' },
      { keys:['F3'], desc:'Paste Name dialog (use named ranges)' },
    ],
  },
  {
    title: '🧮 Formulas', items: [
      { keys:['='], desc:'Start a formula' },
      { keys:['F4'], desc:'Toggle $ in formula (absolute ↔ relative reference)' },
      { keys:['Ctrl','`'], desc:'Show/hide all formulas' },
      { keys:['Ctrl','Shift','Enter'], desc:'Enter array formula (legacy)' },
      { keys:['F9'], desc:'Recalculate all formulas' },
      { keys:['Shift','F9'], desc:'Recalculate active sheet only' },
      { keys:['Alt','='], desc:'AutoSum — inserts =SUM() for the range above' },
      { keys:['Ctrl','['], desc:'Select cells the formula refers to (precedents)' },
      { keys:['Ctrl',']'], desc:'Select cells that use this cell (dependents)' },
    ],
  },
  {
    title: '📌 Other Power Tricks', items: [
      { keys:['Ctrl','T'], desc:'Convert range to Table (best practice for data)' },
      { keys:['Alt','N','V'], desc:'Insert PivotTable' },
      { keys:['Ctrl','Shift','L'], desc:'Toggle AutoFilter on/off' },
      { keys:['Alt','A','Q'], desc:'Advanced Filter dialog' },
      { keys:['Ctrl','Shift',';'], desc:'Insert current time' },
      { keys:['Ctrl',';'], desc:'Insert today\'s date as a static value' },
      { keys:['Alt','F11'], desc:'Open VBA Editor' },
      { keys:['F8'], desc:'Toggle Extend Selection mode' },
    ],
  },
];

const FORMULAS_QUICK = [
  { cat:'Lookup', fns:[
    '=XLOOKUP(val, lookup_col, return_col, "Not Found")  → modern VLOOKUP replacement',
    '=INDEX(return_range, MATCH(val, lookup_range, 0))  → powerful bidirectional lookup',
    '=VLOOKUP(val, range, col_index, FALSE)  → classic, use FALSE for exact match',
    '=MATCH(val, range, 0)  → returns the row number of a match',
  ]},
  { cat:'Conditional', fns:[
    '=SUMIFS(sum_range, crit_range1, crit1, crit_range2, crit2)  → multi-condition SUM',
    '=COUNTIFS(range1, crit1, range2, crit2)  → multi-condition COUNT',
    '=AVERAGEIFS(avg_range, range1, crit1)  → conditional average',
    '=IF(A2>100,"High","Low")  → basic if-else',
    '=IFS(A2>100,"High", A2>50,"Medium", TRUE,"Low")  → multiple conditions',
  ]},
  { cat:'Text', fns:[
    '=TRIM(CLEAN(A2))  → remove all spaces and invisible characters',
    '=PROPER(A2)  → Title Case',
    '=UPPER(A2) / =LOWER(A2)  → uppercase / lowercase',
    '=TEXTJOIN(", ", TRUE, A2:A10)  → join range with delimiter, skip blanks',
    '=LEFT(A2, 3)  → first 3 characters',
    '=MID(A2, 5, 3)  → 3 characters starting from position 5',
    '=LEN(A2)  → character count',
    '=SUBSTITUTE(A2, "old", "new")  → find & replace within a cell',
  ]},
  { cat:'Date', fns:[
    '=TODAY()  → today\'s date (volatile — updates daily)',
    '=DATEDIF(A2, B2, "D")  → days between two dates',
    '=DATEDIF(A2, B2, "M")  → months between two dates',
    '=DATEDIF(A2, B2, "Y")  → years between two dates',
    '=TEXT(A2, "DD/MM/YYYY")  → format a date as text',
    '=EOMONTH(A2, 0)  → last day of the same month',
    '=NETWORKDAYS(A2, B2)  → working days between two dates',
  ]},
  { cat:'Dynamic Arrays (Excel 365)', fns:[
    '=UNIQUE(A2:A100)  → list of unique values (spills automatically)',
    '=FILTER(A2:C100, B2:B100="Active")  → filtered rows (dynamic)',
    '=SORT(A2:A100, 1, -1)  → sorted list descending',
    '=SEQUENCE(10)  → generates 1 to 10',
    '=SORTBY(A2:C100, C2:C100, -1)  → sort by a different column',
  ]},
  { cat:'Error Handling', fns:[
    '=IFERROR(formula, "Not Found")  → catch errors, show friendly message',
    '=IFNA(formula, "Missing")  → only catch #N/A errors',
    '=ISERROR(A2)  → TRUE if A2 contains an error',
    '=ISNUMBER(A2)  → TRUE if A2 is a number',
    '=ISBLANK(A2)  → TRUE if A2 is empty',
  ]},
];

export default function ShortcutsTab() {
  const [tab, setTab] = useState('shortcuts');
  const [search, setSearch] = useState('');

  const filteredSections = search
    ? SHORTCUT_SECTIONS.map(s => ({
        ...s,
        items: s.items.filter(item =>
          item.desc.toLowerCase().includes(search.toLowerCase()) ||
          item.keys.join(' ').toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.items.length > 0)
    : SHORTCUT_SECTIONS;

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border-light)', marginBottom:20 }}>
        {[['shortcuts','⌨️ Keyboard Shortcuts'],['cheatsheet','🧮 Formula Cheat Sheet']].map(([id,label])=>(
          <button key={id} className={`xd-tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'shortcuts' && (
        <>
          <input className="xd-input" style={{ width:'100%', marginBottom:20 }} placeholder="🔍 Search shortcuts (e.g. undo, paste, fill)…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
            {filteredSections.map(sec => (
              <div key={sec.title} className="xd-card">
                <h4 style={{ fontWeight:700, marginBottom:12, fontSize:'.9rem' }}>{sec.title}</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {sec.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div style={{ display:'flex', gap:3, flexShrink:0, flexWrap:'wrap', minWidth:130 }}>
                        {item.keys.map((k, ki) => (
                          <span key={ki}>
                            <kbd style={{ display:'inline-block', padding:'2px 7px', borderRadius:4, border:'1px solid var(--border-light)', background:'var(--bg-tertiary)', fontFamily:'var(--font-mono)', fontSize:'.75rem', fontWeight:600, boxShadow:'0 1px 0 var(--border-strong)' }}>{k}</kbd>
                            {ki < item.keys.length-1 && <span style={{ fontSize:'.7rem', color:'var(--text-tertiary)', padding:'0 2px' }}>+</span>}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize:'.82rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'cheatsheet' && (
        <div>
          <p style={{ fontSize:'.88rem', color:'var(--text-secondary)', marginBottom:16 }}>
            The most useful Excel formulas for daily work — copy any formula into your spreadsheet.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {FORMULAS_QUICK.map(sec => (
              <div key={sec.cat} className="xd-card">
                <h4 style={{ fontWeight:700, marginBottom:12, fontSize:'.9rem' }}>{sec.cat}</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {sec.fns.map((fn, i) => {
                    const [formula, ...rest] = fn.split('  →');
                    return (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <code style={{ fontFamily:'var(--font-mono)', fontSize:'.79rem', background:'var(--bg-secondary)', padding:'3px 7px', borderRadius:4, flexShrink:0, color:'#15803d', whiteSpace:'nowrap' }}>{formula}</code>
                        {rest[0] && <span style={{ fontSize:'.82rem', color:'var(--text-secondary)', lineHeight:1.4, paddingTop:2 }}>→ {rest[0].trim()}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
