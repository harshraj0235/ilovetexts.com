'use client';
import { useState, useMemo } from 'react';
import { hasError } from '../utils.js';
import { Sev } from '../components.jsx';

// ─── Formula plain-English explainer ─────────────────────────────────────────
const FUNC_DOCS = {
  SUM:     { emoji:'➕', what:'Adds all numbers in a range.', syntax:'=SUM(range)', tip:'Use SUM(A:A) to sum a whole column, or SUM(A2:A100) for a fixed range.' },
  SUMIF:   { emoji:'➕', what:'Adds numbers that match one condition.', syntax:'=SUMIF(range, criteria, sum_range)', tip:'Use "*text*" for partial match. Use ">100" for numeric comparisons.' },
  SUMIFS:  { emoji:'➕', what:'Adds numbers matching multiple conditions.', syntax:'=SUMIFS(sum_range, range1, crit1, range2, crit2)', tip:'All conditions must be met. More flexible than SUMIF.' },
  VLOOKUP: { emoji:'🔍', what:'Looks up a value in the leftmost column of a range and returns a value in the same row.', syntax:'=VLOOKUP(lookup_value, table_array, col_index, [exact_match])', tip:'⚠️ Always use FALSE for exact match. TRUE (approximate) causes silent wrong answers. Consider XLOOKUP instead.' },
  HLOOKUP: { emoji:'🔍', what:'Like VLOOKUP but looks across rows instead of down columns.', syntax:'=HLOOKUP(lookup_value, table_array, row_index, [exact_match])', tip:'Rarely used. XLOOKUP handles both directions.' },
  XLOOKUP: { emoji:'🔍', what:'Modern replacement for VLOOKUP/HLOOKUP. Looks in any direction.', syntax:'=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])', tip:'✅ Best practice. Set 4th argument to "Not Found" to handle missing values gracefully.' },
  INDEX:   { emoji:'📍', what:'Returns the value at a specific row and column intersection of a range.', syntax:'=INDEX(array, row_num, [col_num])', tip:'Combine with MATCH for flexible lookups: =INDEX(A:A, MATCH(val, B:B, 0))' },
  MATCH:   { emoji:'🎯', what:'Returns the position of a value within a range.', syntax:'=MATCH(lookup_value, lookup_array, [match_type])', tip:'Use 0 for exact match. Returns a number (position), not the value itself.' },
  IF:      { emoji:'🔀', what:'Returns one value if a condition is true, another if false.', syntax:'=IF(condition, value_if_true, value_if_false)', tip:'Avoid nesting more than 3 IFs. Use IFS() for multiple conditions in Excel 2019+.' },
  IFS:     { emoji:'🔀', what:'Tests multiple conditions and returns a value for the first true one.', syntax:'=IFS(cond1, val1, cond2, val2, ...)', tip:'Add TRUE as the last condition for a default/catch-all value.' },
  IFERROR: { emoji:'🛡️', what:'Returns a custom value if a formula throws an error, otherwise returns the formula result.', syntax:'=IFERROR(formula, value_if_error)', tip:'⚠️ Using "" as the error value hides bugs silently. Use "Not Found" or "Error" so you know when something breaks.' },
  COUNTIF: { emoji:'🔢', what:'Counts cells that match one condition.', syntax:'=COUNTIF(range, criteria)', tip:'Use COUNTIFS for multiple conditions. Case-insensitive.' },
  COUNTIFS:{ emoji:'🔢', what:'Counts cells matching multiple conditions.', syntax:'=COUNTIFS(range1, crit1, range2, crit2)', tip:'All criteria must be met for a cell to be counted.' },
  AVERAGEIF:{ emoji:'📊', what:'Averages numbers matching a condition.', syntax:'=AVERAGEIF(range, criteria, [average_range])', tip:'If average_range is omitted, averages the range itself.' },
  AVERAGE: { emoji:'📊', what:'Calculates the arithmetic mean of numbers.', syntax:'=AVERAGE(range)', tip:'Ignores empty cells and text. Use AVERAGEIF to exclude specific values.' },
  MIN:     { emoji:'⬇️', what:'Returns the smallest number in a range.', syntax:'=MIN(range)', tip:'Use MINIFS (Excel 2019+) to find minimum with conditions.' },
  MAX:     { emoji:'⬆️', what:'Returns the largest number in a range.', syntax:'=MAX(range)', tip:'Use MAXIFS (Excel 2019+) to find maximum with conditions.' },
  TRIM:    { emoji:'✂️', what:'Removes all extra spaces from text, leaving only single spaces between words.', syntax:'=TRIM(text)', tip:'Use TRIM on lookup keys to fix "value not found" errors caused by invisible spaces.' },
  CLEAN:   { emoji:'🧹', what:'Removes all non-printable characters from text.', syntax:'=CLEAN(text)', tip:'Combine with TRIM: =TRIM(CLEAN(A2)) to fix text imported from external systems.' },
  LEN:     { emoji:'📏', what:'Returns the number of characters in a text string.', syntax:'=LEN(text)', tip:'LEN(TRIM(A2)) < LEN(A2) tells you if there are extra spaces.' },
  LEFT:    { emoji:'◀️', what:'Returns the leftmost N characters from a string.', syntax:'=LEFT(text, num_chars)', tip:'Use to extract prefixes, country codes, or category codes.' },
  RIGHT:   { emoji:'▶️', what:'Returns the rightmost N characters from a string.', syntax:'=RIGHT(text, num_chars)', tip:'Useful for extracting file extensions or year from a date string.' },
  MID:     { emoji:'🎯', what:'Returns N characters from the middle of a string, starting at a given position.', syntax:'=MID(text, start_num, num_chars)', tip:'Combine with FIND to extract text between two delimiters.' },
  FIND:    { emoji:'🔎', what:'Returns the position of a character or substring within a text (case-sensitive).', syntax:'=FIND(find_text, within_text, [start_num])', tip:'Use SEARCH for case-insensitive version. Returns #VALUE! if not found.' },
  SUBSTITUTE:{ emoji:'🔄', what:'Replaces specific text within a string.', syntax:'=SUBSTITUTE(text, old_text, new_text, [instance_num])', tip:'To remove characters: =SUBSTITUTE(A2,"$",""). Use instance_num to replace only the Nth occurrence.' },
  TEXT:    { emoji:'🔤', what:'Converts a number to text with a specified format.', syntax:'=TEXT(value, format_text)', tip:'=TEXT(A2,"DD/MM/YYYY") formats a date. =TEXT(A2,"#,##0.00") formats a number as currency.' },
  DATE:    { emoji:'📅', what:'Creates a date from separate year, month, and day values.', syntax:'=DATE(year, month, day)', tip:'Use DATE to build dates from text: =DATE(LEFT(A2,4),MID(A2,5,2),RIGHT(A2,2))' },
  TODAY:   { emoji:'📅', what:'Returns today\'s date (updates every day automatically).', syntax:'=TODAY()', tip:'⚠️ Volatile function — recalculates on every change. For a fixed date, paste-as-values.' },
  NOW:     { emoji:'🕐', what:'Returns the current date and time (updates constantly).', syntax:'=NOW()', tip:'⚠️ Highly volatile. Only use when you need a live timestamp. Paste-as-values to freeze.' },
  DATEDIF: { emoji:'📅', what:'Calculates the difference between two dates in days, months, or years.', syntax:'=DATEDIF(start_date, end_date, unit)', tip:'Units: "D"=days, "M"=months, "Y"=years. Hidden function — not in autocomplete.' },
  UNIQUE:  { emoji:'🎲', what:'Returns a list of unique values from a range (Excel 365/2021+).', syntax:'=UNIQUE(array, [by_col], [exactly_once])', tip:'Dynamic array function — spills results automatically. No Ctrl+Shift+Enter needed.' },
  FILTER:  { emoji:'🔽', what:'Filters a range based on a condition (Excel 365/2021+).', syntax:'=FILTER(array, include, [if_empty])', tip:'=FILTER(A:B, C:C="Active") returns only active rows. Dynamic — auto-updates.' },
  SORT:    { emoji:'🔤', what:'Sorts a range (Excel 365/2021+).', syntax:'=SORT(array, [sort_index], [sort_order])', tip:'sort_order: 1=ascending, -1=descending. Combine with FILTER for powerful dynamic reports.' },
  SEQUENCE:{ emoji:'🔢', what:'Generates a sequence of numbers (Excel 365/2021+).', syntax:'=SEQUENCE(rows, [cols], [start], [step])', tip:'=SEQUENCE(12,1,1) generates 1 through 12 — useful for month lists.' },
  PIVOT:   { emoji:'📊', what:'Not a formula — PivotTables summarise data without formulas.', syntax:'Insert → PivotTable', tip:'Refresh a PivotTable: right-click → Refresh, or use Data → Refresh All.' },
  SUBTOTAL:{ emoji:'➕', what:'Performs a calculation that ignores hidden/filtered rows (unlike SUM).', syntax:'=SUBTOTAL(function_num, range)', tip:'Use 9 for SUM, 1 for AVERAGE, 2 for COUNT. This is the correct function to use in filtered reports.' },
  OFFSET:  { emoji:'📍', what:'Returns a range offset from a starting cell by a given number of rows and columns.', syntax:'=OFFSET(reference, rows, cols, [height], [width])', tip:'⚠️ Volatile function — slows recalculation. Prefer INDEX for static offsets.' },
  INDIRECT:{ emoji:'📍', what:'Returns a cell reference specified as text.', syntax:'=INDIRECT(ref_text)', tip:'⚠️ Highly volatile. =INDIRECT("Sheet"&A1&"!B2") is fragile. Use structured references where possible.' },
  CONCATENATE:{ emoji:'🔗', what:'Joins text strings together (legacy — use & or CONCAT instead).', syntax:'=CONCATENATE(text1, text2, ...)', tip:'Modern alternative: =A2&" "&B2 or =CONCAT(A2:D2). TEXTJOIN is even better for ranges.' },
  TEXTJOIN:{ emoji:'🔗', what:'Joins text from a range with a delimiter, ignoring empty cells.', syntax:'=TEXTJOIN(delimiter, ignore_empty, range)', tip:'=TEXTJOIN(", ", TRUE, A2:A10) joins non-blank values with commas.' },
};

export default function FormulaLabTab({ sheets, activeSheet }) {
  const [tab, setTab] = useState('explainer');
  const [formulaInput, setFormulaInput] = useState('');
  const [search, setSearch] = useState('');

  const sheetData = sheets[activeSheet]?.data ?? [];
  const formulas = sheets[activeSheet]?.formulas ?? null;

  // ── Detect all formula issues in current sheet ────────────────────────────
  const formulaIssues = useMemo(() => {
    const issues = [];
    if (!formulas) return issues;
    formulas.slice(1).forEach((row, ri) => {
      (row||[]).forEach((f, ci) => {
        if (!f) return;
        const fu = f.toUpperCase();
        // VLOOKUP with TRUE (approximate match)
        if (fu.includes('VLOOKUP') && (fu.endsWith(',TRUE)') || fu.endsWith(',1)')))
          issues.push({ type:'vlookup_approx', cell:`Row ${ri+2} Col ${ci+1}`, formula:f, msg:'VLOOKUP using approximate match (TRUE/1). This silently returns wrong values if data is unsorted. Add FALSE for exact match.' });
        // IFERROR hiding with blank
        if (fu.includes('IFERROR') && (fu.includes('""') || fu.includes("''")))
          issues.push({ type:'iferror_blank', cell:`Row ${ri+2} Col ${ci+1}`, formula:f, msg:'IFERROR hides errors with an empty string. Change "" to "Not Found" so broken lookups are visible.' });
        // Whole-column reference (performance)
        if (/[A-Z]+:[A-Z]+/.test(f) && !fu.includes('INDIRECT'))
          issues.push({ type:'whole_col', cell:`Row ${ri+2} Col ${ci+1}`, formula:f, msg:'Whole-column reference (e.g. A:A). This forces Excel to evaluate 1M+ cells. Use a named range or a table reference instead.' });
        // TODAY/NOW volatile
        if (fu.includes('TODAY()') || fu.includes('NOW()'))
          issues.push({ type:'volatile', cell:`Row ${ri+2} Col ${ci+1}`, formula:f, msg:'Volatile function (TODAY/NOW) recalculates on every keystroke. If you only need the current date once, paste as a static value.' });
        // Hardcoded multiplier
        const hc = f.match(/[*\/]\s*(\d{2,}\.?\d*|\d+\.\d{2,})/g);
        if (hc)
          issues.push({ type:'hardcoded', cell:`Row ${ri+2} Col ${ci+1}`, formula:f, msg:`Hardcoded constant in formula: ${hc.join(', ')}. Move this to a named cell (e.g. TAX_RATE) so it can be updated in one place.` });
      });
    });
    return issues;
  }, [formulas]);

  // ── Explain a formula typed in the box ───────────────────────────────────
  const explanation = useMemo(() => {
    const f = formulaInput.trim().replace(/^=/, '').toUpperCase();
    if (!f) return null;
    const matched = Object.entries(FUNC_DOCS).filter(([fn]) => f.startsWith(fn+'(') || f === fn);
    if (!matched.length) {
      // Try to find function name inside
      const inner = Object.entries(FUNC_DOCS).filter(([fn]) => f.includes(fn+'('));
      if (inner.length) return inner.map(([fn, doc]) => ({ fn, ...doc }));
      return null;
    }
    return matched.map(([fn, doc]) => ({ fn, ...doc }));
  }, [formulaInput]);

  // ── Function reference filtered by search ────────────────────────────────
  const filteredDocs = useMemo(() => {
    if (!search) return Object.entries(FUNC_DOCS);
    const q = search.toLowerCase();
    return Object.entries(FUNC_DOCS).filter(([fn, doc]) =>
      fn.toLowerCase().includes(q) || doc.what.toLowerCase().includes(q) || doc.tip.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border-light)', marginBottom:20 }}>
        {[['explainer','🧠 Formula Explainer'],['detective','🕵️ Formula Detective'],['reference','📚 Function Reference']].map(([id,label])=>(
          <button key={id} className={`xd-tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Explainer ── */}
      {tab === 'explainer' && (
        <div>
          <p style={{ fontSize:'.88rem', color:'var(--text-secondary)', marginBottom:16 }}>
            Paste any Excel formula below and get a plain-English explanation of what it does.
          </p>
          <textarea className="xd-input" rows={3} value={formulaInput} onChange={e=>setFormulaInput(e.target.value)}
            placeholder="=VLOOKUP(A2, Sheet2!A:D, 4, FALSE)" style={{ width:'100%', resize:'vertical', fontFamily:'var(--font-mono)' }}/>

          {formulaInput.trim() && !explanation && (
            <div className="xd-card" style={{ marginTop:12, borderColor:'#f59e0b' }}>
              <p style={{ fontSize:'.88rem', color:'var(--text-secondary)' }}>
                ⚠️ Function not recognised in the library yet. Check the <strong>Function Reference</strong> tab for all supported functions.
              </p>
            </div>
          )}

          {explanation && (
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:12 }}>
              {explanation.map(doc => (
                <div key={doc.fn} className="xd-card" style={{ borderLeft:'3px solid #16a34a' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:'1.5rem' }}>{doc.emoji}</span>
                    <div>
                      <span style={{ fontWeight:800, fontSize:'1rem' }}>{doc.fn}</span>
                      <span className="xd-badge" style={{ marginLeft:8, background:'#dcfce7', color:'#15803d' }}>Function</span>
                    </div>
                  </div>
                  <p style={{ fontSize:'.88rem', marginBottom:8, lineHeight:1.6 }}><strong>What it does:</strong> {doc.what}</p>
                  <div style={{ background:'var(--bg-secondary)', borderRadius:6, padding:'8px 12px', marginBottom:8, fontFamily:'var(--font-mono)', fontSize:'.83rem' }}>{doc.syntax}</div>
                  <div style={{ background:doc.tip.startsWith('⚠️')?'#fef9c3':'#dbeafe', borderRadius:6, padding:'8px 12px', fontSize:'.83rem', lineHeight:1.6 }}>{doc.tip}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Detective ── */}
      {tab === 'detective' && (
        <div>
          <p style={{ fontSize:'.88rem', color:'var(--text-secondary)', marginBottom:16 }}>
            Automatically scans formulas in the active sheet for risky patterns.
            {!formulas && <strong> Upload a file with formulas to enable this feature.</strong>}
          </p>
          {formulaIssues.length === 0 ? (
            <div className="xd-card" style={{ textAlign:'center', padding:40, color:'#16a34a', fontWeight:700 }}>
              ✅ No formula risks detected on this sheet.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {formulaIssues.map((iss, i) => (
                <div key={i} className="xd-card" style={{ borderLeft:`3px solid ${iss.type==='vlookup_approx'||iss.type==='iferror_blank'?'#ef4444':'#f59e0b'}` }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{iss.type==='vlookup_approx'||iss.type==='iferror_blank'?'🔴':'🟠'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:4 }}>{iss.cell}</div>
                      <code style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'.79rem', background:'var(--bg-secondary)', padding:'4px 8px', borderRadius:4, marginBottom:6 }}>{iss.formula}</code>
                      <p style={{ fontSize:'.83rem', color:'var(--text-secondary)', lineHeight:1.55 }}>{iss.msg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reference ── */}
      {tab === 'reference' && (
        <div>
          <input className="xd-input" style={{ width:'100%', marginBottom:16 }} placeholder="🔍 Search functions (e.g. lookup, date, text)…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
          <p style={{ fontSize:'.78rem', color:'var(--text-tertiary)', marginBottom:16 }}>{filteredDocs.length} function{filteredDocs.length!==1?'s':''}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:10 }}>
            {filteredDocs.map(([fn, doc]) => (
              <div key={fn} className="xd-card" style={{ cursor:'default' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:'1.1rem' }}>{doc.emoji}</span>
                  <span style={{ fontWeight:800, fontSize:'.9rem' }}>{fn}</span>
                </div>
                <p style={{ fontSize:'.81rem', color:'var(--text-secondary)', marginBottom:6, lineHeight:1.5 }}>{doc.what}</p>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'.76rem', background:'var(--bg-secondary)', padding:'4px 8px', borderRadius:4, marginBottom:6 }}>{doc.syntax}</div>
                <div style={{ fontSize:'.78rem', color: doc.tip.startsWith('⚠️')?'#854d0e':'#1d4ed8', lineHeight:1.4 }}>{doc.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
