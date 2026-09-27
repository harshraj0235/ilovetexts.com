'use client';
import { useState, useMemo } from 'react';
import { isBlankRow, looksLikeDate } from '../utils.js';
import { Sev } from '../components.jsx';

export default function FormatFixerTab({ sheets, activeSheet, updateData, showToast }) {
  const sheetData = sheets[activeSheet]?.data ?? [];
  const headers = sheetData[0] ?? [];
  const body = sheetData.slice(1);
  const [fixLog, setFixLog] = useState([]);

  // ── Auto-detect formatting issues ────────────────────────────────────────
  const detectedIssues = useMemo(() => {
    const issues = [];
    if (!sheetData.length) return issues;

    // 1. Mixed date formats in same column
    headers.forEach((h, ci) => {
      const vals = body.map(r => String(r[ci]??'').trim()).filter(v=>v);
      const dateVals = vals.filter(v => looksLikeDate(v));
      if (dateVals.length > 0 && dateVals.length < vals.length * 0.9 && dateVals.length > 2) {
        // Some look like dates, some don't — inconsistent
        const formats = new Set(dateVals.map(v => {
          if (/^\d{4}-\d{2}-\d{2}/.test(v)) return 'ISO (2024-01-15)';
          if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v)) return 'US (01/15/2024)';
          if (/^\d{1,2}-\d{1,2}-\d{2,4}/.test(v)) return 'Dashed (01-15-2024)';
          if (/^\d{1,2}\s+\w+/.test(v)) return 'Long (15 Jan 2024)';
          return 'Other';
        }));
        if (formats.size > 1) {
          issues.push({ id:`date_${ci}`, severity:'warning', icon:'📅',
            title:`Mixed date formats in column "${h}"`,
            detail:`Found ${formats.size} different date formats: ${[...formats].join(', ')}. This breaks date sorting and calculations.`,
            fix:'Standardise' });
        }
      }
    });

    // 2. Phone numbers that may have lost leading zeros
    headers.forEach((h, ci) => {
      const hLow = String(h).toLowerCase();
      if (!hLow.includes('phone') && !hLow.includes('mobile') && !hLow.includes('tel')) return;
      const vals = body.map(r => r[ci]).filter(v => v !== '');
      const shortNums = vals.filter(v => !isNaN(Number(v)) && String(Number(v)).length < String(v).length);
      if (shortNums.length > 0) {
        issues.push({ id:`phone_${ci}`, severity:'warning', icon:'📱',
          title:`Phone numbers may have lost leading zeros in "${h}"`,
          detail:`${shortNums.length} phone number(s) look like they may have been stored as numbers, losing leading zeros (e.g. 07700 becomes 7700).`,
          fix:'prefix' });
      }
    });

    // 3. Inconsistent category values (likely dropdown field)
    headers.forEach((h, ci) => {
      const vals = body.map(r => String(r[ci]??'').trim()).filter(v=>v);
      if (vals.length < 3) return;
      const unique = new Set(vals.map(v=>v.toLowerCase()));
      // If few unique values but varied capitalisation
      const uniqueOrig = new Set(vals);
      if (unique.size < 15 && uniqueOrig.size > unique.size) {
        const examples = [...vals].filter((v,i,a) => a.findIndex(x=>x.toLowerCase()===v.toLowerCase()&&x!==v)>=0).slice(0,3);
        if (examples.length > 0) {
          issues.push({ id:`case_${ci}`, severity:'info', icon:'Aa',
            title:`Inconsistent capitalisation in "${h}"`,
            detail:`Same values appear with different capitalisation: ${examples.join(', ')}. This makes COUNTIF/SUMIF give wrong totals.`,
            fix:'title' });
        }
      }
    });

    // 4. Currency symbols in numeric columns
    headers.forEach((h, ci) => {
      const vals = body.map(r => String(r[ci]??'').trim()).filter(v=>v);
      const withSymbols = vals.filter(v => /^[$£€¥₹]/.test(v));
      if (withSymbols.length > 2) {
        const symbols = new Set(withSymbols.map(v=>v[0]));
        issues.push({ id:`currency_${ci}`, severity:'warning', icon:'💰',
          title:`Currency symbols in column "${h}" — ${symbols.size > 1 ? 'MIXED currencies' : 'strip symbols'}`,
          detail:`${withSymbols.length} cells start with currency symbols (${[...symbols].join(', ')}). SUM works but mixing currencies ($ and £) is a serious data error.`,
          fix:'stripSymbol' });
      }
    });

    // 5. Trailing special characters
    headers.forEach((h, ci) => {
      const vals = body.map(r => String(r[ci]??''));
      const withTrail = vals.filter(v => /[,;:\s]+$/.test(v) && v.trim());
      if (withTrail.length > 2) {
        issues.push({ id:`trail_${ci}`, severity:'info', icon:'✂️',
          title:`${withTrail.length} cells in "${h}" have trailing punctuation`,
          detail:`Values like "Sales," or "London;" have trailing commas/semicolons. These break exact matches.`,
          fix:'trimPunct' });
      }
    });

    if (issues.length === 0) {
      issues.push({ id:'ok', severity:'success', icon:'✅',
        title:'No formatting issues detected', detail:'Column types look consistent and values appear clean.', fix:null });
    }

    return issues;
  }, [sheetData]);

  // ── Apply a formatting fix ────────────────────────────────────────────────
  const applyFix = (issue) => {
    if (!issue.fix) return;
    const ci = parseInt(issue.id.split('_')[1]);
    let newData;
    switch (issue.fix) {
      case 'title':
        newData = sheetData.map((row, ri) => ri===0 ? row : row.map((c,i) => i===ci&&typeof c==='string' ? c.split(' ').map(w=>w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join(' ') : c));
        break;
      case 'stripSymbol':
        newData = sheetData.map((row, ri) => ri===0 ? row : row.map((c,i) => i===ci ? String(c).replace(/^[$£€¥₹]/, '').replace(/,/g,'') : c));
        break;
      case 'trimPunct':
        newData = sheetData.map((row, ri) => ri===0 ? row : row.map((c,i) => i===ci&&typeof c==='string' ? c.replace(/[,;:\s]+$/, '') : c));
        break;
      default: return;
    }
    updateData(newData);
    setFixLog(l => [...l, { title:issue.title, col:headers[ci] }]);
    showToast('Fix applied — Ctrl+Z to undo');
  };

  // ── Manual clean operations ───────────────────────────────────────────────
  const manualOps = [
    {
      icon:'🔀', title:'Unmerge All Cells',
      desc:'Merged cells break sort, filter, and PivotTables. This tool cannot unmerge (requires the native Excel app), but it flags merged-cell indicators.',
      action: null,
      note:'⚠️ Merged cell detection requires the native .xlsx format. Open the file in Excel and use Home → Merge & Center → Unmerge Cells, then re-upload here.',
    },
    {
      icon:'🧹', title:'Remove Rogue Formatting Characters',
      desc:'Strip tab characters (\\t), carriage returns (\\r), and non-breaking spaces from all cells.',
      action: () => {
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map(c => typeof c==='string' ? c.replace(/[\t\r\u00A0\u200B]/g,' ').trim() : c));
        updateData(nd); showToast('Removed rogue characters');
      },
    },
    {
      icon:'📱', title:'Fix Phone Numbers (Restore Leading Zeros)',
      desc:'Add a leading zero to phone numbers that look too short (7-9 digits, like UK mobiles without the leading 0).',
      action: () => {
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map((c, ci) => {
          const hLow = String(headers[ci]||'').toLowerCase();
          if (!hLow.includes('phone')&&!hLow.includes('mobile')&&!hLow.includes('tel')) return c;
          const s = String(c??'').trim();
          if (/^\d{9,10}$/.test(s) && !s.startsWith('0')) return '0'+s;
          return c;
        }));
        updateData(nd); showToast('Fixed phone numbers');
      },
    },
    {
      icon:'💱', title:'Standardise Number Format (Remove Currency Symbols)',
      desc:'Strip $, £, €, ¥, ₹ and thousands commas from all cells so SUM/AVERAGE work correctly.',
      action: () => {
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map(c => {
          const s = String(c??'');
          const cleaned = s.replace(/[$£€¥₹]/g,'').replace(/,/g,'');
          return !isNaN(Number(cleaned)) && cleaned.trim() ? Number(cleaned) : c;
        }));
        updateData(nd); showToast('Stripped currency symbols');
      },
    },
    {
      icon:'🔡', title:'Standardise to Title Case',
      desc:'Capitalise the first letter of each word in all text cells (names, categories, titles).',
      action: () => {
        const toTitle = s => s.replace(/\w\S*/g, w => w[0]?.toUpperCase()+w.slice(1).toLowerCase());
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map(c => typeof c==='string' ? toTitle(c) : c));
        updateData(nd); showToast('Applied Title Case');
      },
    },
    {
      icon:'📅', title:'Standardise Dates to ISO Format (YYYY-MM-DD)',
      desc:'Convert common date formats (DD/MM/YYYY, MM-DD-YYYY) to the unambiguous ISO standard.',
      action: () => {
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map(c => {
          const s = String(c??'').trim();
          if (!s) return c;
          const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
          const m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
          return c;
        }));
        updateData(nd); showToast('Dates standardised to ISO format (YYYY-MM-DD)');
      },
    },
    {
      icon:'🔢', title:'Pad IDs / Codes with Leading Zeros',
      desc:'Ensure ID columns have consistent digit counts (e.g. "42" → "00042" for 5-digit IDs).',
      action: null,
      note:'Select an ID column in the Edit tab and use Find & Replace to add leading zeros, or use the formula =TEXT(A2,"00000") to pad to 5 digits.',
    },
    {
      icon:'🧽', title:'Remove HTML Tags from Cells',
      desc:'Strip HTML tags like <b>, <br/>, <span> from cells pasted from web pages.',
      action: () => {
        const nd = sheetData.map((row, ri) => ri===0 ? row : row.map(c => typeof c==='string' ? c.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim() : c));
        updateData(nd); showToast('Removed HTML tags');
      },
    },
  ];

  return (
    <div>
      {/* Auto-detected issues */}
      <h3 style={{ fontWeight:700, marginBottom:12, fontSize:'.95rem' }}>🔬 Auto-Detected Formatting Issues</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
        {detectedIssues.map(iss => (
          <div key={iss.id} className="xd-card"
            style={{ borderLeft:`3px solid ${iss.severity==='critical'?'#ef4444':iss.severity==='warning'?'#f59e0b':iss.severity==='success'?'#16a34a':'#3b82f6'}` }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{iss.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, fontSize:'.88rem' }}>{iss.title}</span>
                  <Sev level={iss.severity}/>
                </div>
                <p style={{ fontSize:'.83rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{iss.detail}</p>
              </div>
              {iss.fix && (
                <button className="xd-btn primary" style={{ flexShrink:0, fontSize:'.8rem' }}
                  onClick={() => applyFix(iss)}>Fix ✓</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual operations */}
      <h3 style={{ fontWeight:700, marginBottom:12, fontSize:'.95rem' }}>🔧 Manual Formatting Operations</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
        {manualOps.map(op => (
          <div key={op.title} className="xd-card">
            <div style={{ display:'flex', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:'1.3rem', flexShrink:0 }}>{op.icon}</span>
              <span style={{ fontWeight:700, fontSize:'.88rem' }}>{op.title}</span>
            </div>
            <p style={{ fontSize:'.8rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:10 }}>{op.desc}</p>
            {op.note && <p style={{ fontSize:'.78rem', color:'#854d0e', background:'#fef9c3', padding:'6px 10px', borderRadius:5, marginBottom:8, lineHeight:1.4 }}>{op.note}</p>}
            {op.action && (
              <button className="xd-btn primary" style={{ fontSize:'.82rem' }} onClick={op.action}>Apply</button>
            )}
          </div>
        ))}
      </div>

      {/* Fix log */}
      {fixLog.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h4 style={{ fontWeight:700, marginBottom:8, fontSize:'.88rem' }}>📋 Applied Fixes ({fixLog.length})</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {fixLog.map((f,i) => (
              <div key={i} style={{ fontSize:'.82rem', padding:'6px 10px', background:'#dcfce7', color:'#15803d', borderRadius:6 }}>
                ✓ {f.title}
              </div>
            ))}
          </div>
          <p style={{ fontSize:'.78rem', color:'var(--text-tertiary)', marginTop:6 }}>All fixes are undoable with Ctrl+Z.</p>
        </div>
      )}
    </div>
  );
}
