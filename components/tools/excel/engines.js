// ═══════════════════════════════════════════════════════════════════════════════
// Excel Doctor — Analysis Engines (pure functions, no React)
// ═══════════════════════════════════════════════════════════════════════════════
import {
  hasError, isNumericStr, looksLikeDate, hasLeadingTrailingSpace,
  isBlankRow, cellAddr, EXCEL_ERRORS,
} from './utils.js';

// ─── 1. Full workbook health scan ─────────────────────────────────────────────
export function analyzeWorkbook(sheets) {
  const issues = [];
  let totalCells = 0, emptyCells = 0, errorCells = 0;
  let numericStrCells = 0, dateCells = 0, spaceCells = 0;

  sheets.forEach(({ name, data, formulas }) => {
    if (!data.length) return;
    const headers = data[0];
    const body = data.slice(1);

    data.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        totalCells++;
        const v = String(cell ?? '');
        if (v.trim() === '') emptyCells++;

        if (hasError(v)) {
          errorCells++;
          issues.push({ id:`err_${name}_${ri}_${ci}`, type:'formula_error', severity:'critical',
            sheet:name, cell:cellAddr(ri,ci), row:ri, col:ci,
            title:`Formula error ${v} in ${name}!${cellAddr(ri,ci)}`,
            detail:`Cell ${cellAddr(ri,ci)} contains ${v}. Likely a broken reference, wrong data type, or missing lookup value.`,
            fixable:false, fix:null });
        }
        if (isNumericStr(cell)) {
          numericStrCells++;
          issues.push({ id:`numstr_${name}_${ri}_${ci}`, type:'num_as_text', severity:'warning',
            sheet:name, cell:cellAddr(ri,ci), row:ri, col:ci,
            title:`Number stored as text in ${name}!${cellAddr(ri,ci)}`,
            detail:`"${v}" looks like a number but is stored as text. SUM/AVERAGE will ignore it.`,
            fixable:true, fix:{ sheet:name, row:ri, col:ci, newVal:Number(v.trim()) } });
        }
        if (looksLikeDate(cell) && ri > 0) {
          dateCells++;
          issues.push({ id:`datetext_${name}_${ri}_${ci}`, type:'date_as_text', severity:'warning',
            sheet:name, cell:cellAddr(ri,ci), row:ri, col:ci,
            title:`Date stored as text in ${name}!${cellAddr(ri,ci)}`,
            detail:`"${v}" looks like a date but is stored as text. DATEDIF, YEAR, MONTH won't work.`,
            fixable:false, fix:null });
        }
        if (hasLeadingTrailingSpace(cell) && ri > 0) {
          spaceCells++;
          issues.push({ id:`space_${name}_${ri}_${ci}`, type:'whitespace', severity:'warning',
            sheet:name, cell:cellAddr(ri,ci), row:ri, col:ci,
            title:`Leading/trailing spaces in ${name}!${cellAddr(ri,ci)}`,
            detail:`"${v}" has invisible spaces. This breaks VLOOKUP/XLOOKUP exact matches.`,
            fixable:true, fix:{ sheet:name, row:ri, col:ci, newVal:v.trim() } });
        }
      });
    });

    // Duplicate rows
    const seen = new Map();
    body.forEach((row, bi) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        const firstIdx = seen.get(key);
        issues.push({ id:`dup_${name}_${bi+1}`, type:'duplicate_row', severity:'warning',
          sheet:name, cell:`Row ${bi+2}`, row:bi+1, col:-1,
          title:`Duplicate row ${bi+2} in ${name} (matches row ${firstIdx+2})`,
          detail:`Row ${bi+2} is an exact copy of row ${firstIdx+2}. Duplicates inflate SUMIF/COUNT totals.`,
          fixable:true, fix:{ sheet:name, deleteRow:bi+1 } });
      } else { seen.set(key, bi); }
    });

    // Blank rows inside data
    body.forEach((row, bi) => {
      if (isBlankRow(row) && bi < body.length - 1) {
        issues.push({ id:`blank_${name}_${bi+1}`, type:'blank_row', severity:'info',
          sheet:name, cell:`Row ${bi+2}`, row:bi+1, col:-1,
          title:`Blank row ${bi+2} inside dataset in ${name}`,
          detail:`Blank rows inside a dataset break VLOOKUP, PivotTables and AutoFilter.`,
          fixable:true, fix:{ sheet:name, deleteRow:bi+1 } });
      }
    });

    // Blank column headers
    const hdrSet = new Set(headers.map(h => String(h ?? '').trim().toLowerCase()));
    if (hdrSet.has('')) {
      issues.push({ id:`blankhdr_${name}`, type:'blank_header', severity:'warning',
        sheet:name, cell:'Row 1', row:0, col:-1,
        title:`Blank column headers in ${name}`,
        detail:`Empty headers break structured references, PivotTables and XLOOKUP.`,
        fixable:false, fix:null });
    }

    // Inconsistent formulas (Formula Detective)
    if (formulas && headers.length > 0) {
      headers.forEach((_, ci) => {
        const colF = formulas.slice(1).map((row, ri) => ({ ri:ri+1, f:row[ci]||null })).filter(x=>x.f);
        if (colF.length < 3) return;
        const baseP = colF[0].f.replace(/\d+/g,'N');
        colF.forEach((item, idx) => {
          if (idx===0) return;
          const pat = item.f.replace(/\d+/g,'N');
          if (pat !== baseP) {
            issues.push({ id:`fmla_${name}_${item.ri}_${ci}`, type:'inconsistent_formula', severity:'critical',
              sheet:name, cell:cellAddr(item.ri,ci), row:item.ri, col:ci,
              title:`Suspicious formula in ${name}!${cellAddr(item.ri,ci)}`,
              detail:`Formula: ${item.f}\nPrevious pattern: ${colF[idx-1]?.f||'?'}\nLooks different from neighbouring cells — likely a copy-paste error.`,
              fixable:false, fix:null });
          }
        });
      });
    }

    // IFERROR masking real bugs
    if (formulas) {
      formulas.slice(1).forEach((row, ri) => {
        (row||[]).forEach((f, ci) => {
          if (!f) return;
          const fUp = f.toUpperCase();
          if (fUp.includes('IFERROR') && (fUp.includes('""') || fUp.includes("''"))) {
            issues.push({ id:`iferr_${name}_${ri+1}_${ci}`, type:'iferror_masking', severity:'warning',
              sheet:name, cell:cellAddr(ri+1,ci), row:ri+1, col:ci,
              title:`IFERROR hiding errors in ${name}!${cellAddr(ri+1,ci)}`,
              detail:`Formula: ${f}\nIFERROR with empty string ("") silently hides broken lookups. The cell shows blank instead of the real error, making bugs invisible.`,
              fixable:false, fix:null });
          }
        });
      });
    }

    // Hardcoded numbers in formulas
    if (formulas) {
      formulas.slice(1).forEach((row, ri) => {
        (row||[]).forEach((f, ci) => {
          if (!f) return;
          // Look for formulas that multiply/divide by a hardcoded constant (not 1, 0, 100)
          const hardcoded = f.match(/[*\/]\s*(\d{2,}\.?\d*|\d+\.\d{2,})/g);
          if (hardcoded && !hardcoded.every(h => ['*100','*1','*0','/100','/1'].some(ok=>h.replace(/\s/g,'').startsWith(ok)))) {
            issues.push({ id:`hcode_${name}_${ri+1}_${ci}`, type:'hardcoded_number', severity:'info',
              sheet:name, cell:cellAddr(ri+1,ci), row:ri+1, col:ci,
              title:`Hardcoded number in formula at ${name}!${cellAddr(ri+1,ci)}`,
              detail:`Formula: ${f}\nContains a hardcoded constant (${hardcoded.join(', ')}). If this is a tax rate, exchange rate, or business rule, it should be in a named cell so it can be updated in one place.`,
              fixable:false, fix:null });
          }
        });
      });
    }
  });

  const critical = issues.filter(i=>i.severity==='critical').length;
  const warnings = issues.filter(i=>i.severity==='warning').length;
  const score = Math.max(0, Math.min(100,
    100 - critical*15 - warnings*3 - Math.floor(issues.filter(i=>i.severity==='info').length/2)
  ));

  return {
    issues,
    summary:{ total:totalCells, empty:emptyCells, errors:errorCells,
      numericStr:numericStrCells, dateText:dateCells, spaces:spaceCells,
      critical, warnings, infos:issues.filter(i=>i.severity==='info').length, score },
  };
}

// ─── 2. Column quality ────────────────────────────────────────────────────────
export function columnQuality(sheetData) {
  if (!sheetData || sheetData.length < 2) return [];
  const headers = sheetData[0];
  const body = sheetData.slice(1);
  return headers.map((h, ci) => {
    const vals = body.map(r => r[ci]);
    const nonEmpty = vals.filter(v => String(v??'').trim() !== '');
    const nums = nonEmpty.map(v => Number(v)).filter((n,i) => !isNaN(n) && String(nonEmpty[i]??'').trim() !== '');
    const unique = new Set(vals.map(v => String(v??'').trim().toLowerCase())).size;
    const errors = vals.filter(v => hasError(v)).length;
    const spaces = vals.filter(v => hasLeadingTrailingSpace(v)).length;
    const numStrs = vals.filter(v => isNumericStr(v)).length;
    const completeness = vals.length ? Math.round(nonEmpty.length/vals.length*100) : 100;
    return { name:h, idx:ci, count:nonEmpty.length, total:vals.length,
      unique, errors, spaces, numStrs, completeness,
      min: nums.length ? Math.min(...nums) : null,
      max: nums.length ? Math.max(...nums) : null,
      sum: nums.length ? nums.reduce((a,b)=>a+b,0) : null,
      avg: nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null };
  });
}

// ─── 3. Compare two workbooks ─────────────────────────────────────────────────
export function compareWorkbooks(sheetsA, sheetsB) {
  const changes = [];
  const namesA = new Set(sheetsA.map(s=>s.name));
  const namesB = new Set(sheetsB.map(s=>s.name));
  sheetsA.forEach(sa => {
    if (!namesB.has(sa.name)) {
      changes.push({ type:'sheet_removed', sheet:sa.name, detail:`Sheet "${sa.name}" was removed.`, severity:'critical' });
      return;
    }
    const sb = sheetsB.find(s=>s.name===sa.name);
    const maxRows = Math.max(sa.data.length, sb.data.length);
    const maxCols = Math.max(...[...sa.data,...sb.data].map(r=>r.length), 0);
    let cellChanges = 0;
    for (let ri=0; ri<maxRows; ri++) {
      for (let ci=0; ci<maxCols; ci++) {
        const va = String((sa.data[ri]||[])[ci]??'');
        const vb = String((sb.data[ri]||[])[ci]??'');
        if (va !== vb) {
          cellChanges++;
          if (cellChanges <= 50) {
            const severity = ri===0?'info': (hasError(vb)&&!hasError(va))?'critical':'warning';
            changes.push({ type:'cell_changed', sheet:sa.name,
              cell:cellAddr(ri,ci), from:va, to:vb, row:ri, col:ci, severity,
              detail:`${sa.name}!${cellAddr(ri,ci)}: "${va}" → "${vb}"` });
          }
        }
      }
    }
    if (cellChanges > 50)
      changes.push({ type:'summary', sheet:sa.name, detail:`...and ${cellChanges-50} more cell changes in "${sa.name}".`, severity:'info' });
  });
  sheetsB.forEach(sb => {
    if (!namesA.has(sb.name))
      changes.push({ type:'sheet_added', sheet:sb.name, detail:`Sheet "${sb.name}" was added.`, severity:'info' });
  });
  return changes;
}

// ─── 4. Performance analysis ──────────────────────────────────────────────────
const VOLATILE = ['NOW(','TODAY(','RAND(','RANDBETWEEN(','OFFSET(','INDIRECT(','INFO(','CELL('];
export function performanceAnalysis(sheets) {
  const issues = [];
  let formulaCount = 0, volatileCount = 0, deepNest = 0;
  sheets.forEach(({ name, data, formulas }) => {
    const usedCols = Math.max(...data.map(r=>r.length), 0);
    const totalFormatted = data.length * usedCols;
    if (totalFormatted > 100_000)
      issues.push({ severity:'warning', title:`Large used range in "${name}"`,
        detail:`~${totalFormatted.toLocaleString()} formatted cells. Limit the used range to improve load and save speed.` });
    if (formulas) {
      formulas.forEach(row => {
        (row||[]).forEach(f => {
          if (!f) return;
          formulaCount++;
          if (VOLATILE.some(v=>f.toUpperCase().includes(v))) volatileCount++;
          if ((f.match(/\(/g)||[]).length > 7) deepNest++;
        });
      });
    }
  });
  if (volatileCount > 0)
    issues.push({ severity:'warning', title:`${volatileCount} volatile formula${volatileCount>1?'s':''}`,
      detail:`Volatile functions (NOW, TODAY, RAND, INDIRECT, OFFSET) recalculate on every change. Replace with static values where possible.` });
  if (formulaCount > 10_000)
    issues.push({ severity:'warning', title:`${formulaCount.toLocaleString()} formulas`,
      detail:`High formula count slows recalculation. Convert stable columns to static values.` });
  if (deepNest > 0)
    issues.push({ severity:'info', title:`${deepNest} deeply nested formula${deepNest>1?'s':''}`,
      detail:`Formulas with 8+ nested levels are hard to debug. Consider helper columns.` });
  if (issues.length === 0)
    issues.push({ severity:'success', title:'No major performance issues', detail:'The workbook looks lean and should calculate quickly.' });
  return { issues, formulaCount, volatileCount };
}

// ─── 5. Ask-my-Excel rule engine ─────────────────────────────────────────────
export function askExcel(question, sheets, analysis) {
  const q = question.toLowerCase();
  const { summary, issues } = analysis;

  if (q.includes('how many') && (q.includes('row')||q.includes('record'))) {
    const total = (sheets[0]?.data.length||1)-1;
    return `The first sheet has **${total}** data rows (excluding the header).`;
  }
  if (q.includes('error')||q.includes('broken')) {
    if (!summary.errors) return `✅ No formula errors found in the workbook.`;
    const list = issues.filter(i=>i.type==='formula_error').slice(0,5).map(i=>`• ${i.cell}: ${i.title}`).join('\n');
    return `Found **${summary.errors}** formula error${summary.errors>1?'s':''}:\n\n${list}${summary.errors>5?`\n\n...and ${summary.errors-5} more.`:''}`;
  }
  if (q.includes('duplicate')) {
    const dups = issues.filter(i=>i.type==='duplicate_row');
    if (!dups.length) return `✅ No duplicate rows detected.`;
    return `Found **${dups.length}** duplicate row${dups.length>1?'s':''}. First at ${dups[0].cell} in sheet "${dups[0].sheet}".`;
  }
  if (q.includes('slow')||q.includes('performance')||q.includes('speed')) {
    return `Performance tips:\n• Remove volatile formulas (NOW, TODAY, RAND) — ${summary.volatileCount||0} found\n• Convert stable columns to static values\n• Delete unused rows/columns beyond your data\n• Avoid whole-column references like A:A`;
  }
  if (q.includes('health')||q.includes('score')||q.includes('status')) {
    return `**Health Score: ${summary.score}/100**\n\n• 🔴 Critical: ${summary.critical}\n• 🟠 Warnings: ${summary.warnings}\n• ℹ️ Info: ${summary.infos}\n\n${summary.score>=80?'Looks healthy!':summary.score>=60?'Some issues to fix.':'Several problems found — check the Health Scan tab.'}`;
  }
  if (q.includes('vlookup')||q.includes('xlookup')||q.includes('lookup')||q.includes('not find')||q.includes('n/a')) {
    const spaces = issues.filter(i=>i.type==='whitespace').length;
    const numstrs = issues.filter(i=>i.type==='num_as_text').length;
    return `Top reasons VLOOKUP/XLOOKUP fails:\n\n${spaces?`• **${spaces} cells with spaces** — invisible spaces prevent exact matches\n`:''}${numstrs?`• **${numstrs} numbers as text** — type mismatch breaks numeric lookups\n`:''}• Approximate match (TRUE) used instead of exact match (FALSE)\n• Lookup value not in the leftmost column\n• Extra invisible characters — use CLEAN(TRIM(...))\n\nRun the **Health Scan** for exact cell locations.`;
  }
  if (q.includes('total')&&(q.includes('wrong')||q.includes('incorrect')||q.includes('different'))) {
    return `Why totals go wrong:\n\n• **${summary.numericStr} numbers stored as text** — SUM ignores them\n• **${issues.filter(i=>i.type==='duplicate_row').length} duplicate rows** — inflate SUMIF\n• Filtered/hidden rows — use SUBTOTAL(9,...) instead of SUM\n• IFERROR hiding broken cells — ${issues.filter(i=>i.type==='iferror_masking').length} found\n• Rounding — use ROUND() consistently\n\nOpen **Data Quality** tab for column-by-column breakdown.`;
  }
  if (q.includes('clean')||q.includes('fix')||q.includes('repair')) {
    const fixable = issues.filter(i=>i.fixable).length;
    return `**${fixable}** issue${fixable!==1?'s':''} can be auto-fixed:\n\n• ${summary.numericStr} numbers as text\n• ${summary.spaces} whitespace cells\n• ${issues.filter(i=>i.type==='duplicate_row').length} duplicate rows\n• ${issues.filter(i=>i.type==='blank_row').length} blank rows\n\nGo to the **🧹 Clean** tab to apply fixes safely.`;
  }
  if (q.includes('hardcoded')||q.includes('magic number')) {
    const hc = issues.filter(i=>i.type==='hardcoded_number').length;
    return `Found **${hc}** formula${hc!==1?'s':''} with hardcoded numbers.\n\nHardcoded constants (tax rates, multipliers) buried inside formulas are dangerous — one business rule change requires hunting every cell. Move constants to named cells at the top of the sheet.`;
  }
  if (q.includes('iferror')||q.includes('hidden error')) {
    const ie = issues.filter(i=>i.type==='iferror_masking').length;
    return ie>0
      ? `Found **${ie}** cell${ie!==1?'s':''} using IFERROR to hide errors with empty strings.\n\nThis is dangerous — broken lookups show as blank instead of the real error, making bugs invisible. Consider IFERROR(formula, "NOT FOUND") instead of IFERROR(formula, "") so you know when lookups fail.`
      : `✅ No IFERROR-masked errors found.`;
  }
  if (q.includes('column')) {
    const headers = sheets[0]?.data[0]||[];
    return `First sheet has **${headers.length}** columns:\n\n${headers.map((h,i)=>`${i+1}. ${h||'(blank)'}`).slice(0,20).join('\n')}${headers.length>20?`\n...and ${headers.length-20} more.`:''}`;
  }
  if (q.includes('sheet')) {
    return `Workbook has **${sheets.length}** sheet${sheets.length>1?'s':''}:\n\n${sheets.map((s,i)=>`${i+1}. ${s.name} — ${(s.data.length-1)||0} rows`).join('\n')}`;
  }
  const top = issues.slice(0,3).map(i=>`• ${i.title}`).join('\n');
  return `Health score: **${summary.score}/100**\n\nTop findings:\n${top||'• No major issues found'}\n\nTry asking:\n• "Why is my total wrong?"\n• "Find duplicates"\n• "Why is VLOOKUP failing?"\n• "Find hardcoded numbers"\n• "Find IFERROR hidden errors"`;
}
