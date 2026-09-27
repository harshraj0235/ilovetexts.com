'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { STATEMENT_LIMITS, SAMPLE_STATEMENT_CSV, parseStatementCsv, parseStatementPdf, analyzeStatementRows, editStatementRow, moneyText, exportStatementCsv, statementExportRows } from '@/lib/statement-review.mjs';
import s from './Workflows.module.css';

function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function RowEditor({ row, warnings, source, onSave, onExclude, onNext }) {
  const [values, setValues] = useState({ date: row.date, description: row.description, debit: moneyText(row.debit), credit: moneyText(row.credit), balance: moneyText(row.balance) });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  function save(event) {
    event.preventDefault();
    try { onSave(editStatementRow(row, values)); setError(''); setSaved(true); }
    catch (issue) { setError(issue.message); setSaved(false); }
  }
  return <form className={s.editor} onSubmit={save} aria-label="Review selected transaction">
    <div className={s.sectionHeading}><h3>Review this transaction</h3><span className={s.badge}>{row.excluded ? 'Excluded from export' : row.reviewed ? 'Reviewed' : 'Awaiting review'}</span></div>
    <p className={s.small}>{row.sourceName} · {row.page ? `PDF page ${row.page}` : `CSV record ${row.line}`}</p>
    {source?.url && <a href={`${source.url}#page=${row.page}`} target="_blank" rel="noopener noreferrer">Open original PDF at page {row.page} ↗</a>}
    <pre className={s.raw} aria-label="Original extracted source text">{row.rawText}</pre>
    {!!warnings.length && <ul className={s.issues}>{[...new Set(warnings)].map(note => <li key={note}>{note}</li>)}</ul>}
    <div className={s.editorFields}>
      <label>Date<input type="date" required value={values.date} onChange={e => { setSaved(false); setValues({ ...values, date: e.target.value }); }} /></label>
      <label className={s.wide}>Description<textarea rows={2} required maxLength={2000} value={values.description} onChange={e => { setSaved(false); setValues({ ...values, description: e.target.value }); }} /></label>
      {['debit', 'credit', 'balance'].map(field => <label key={field}>{field[0].toUpperCase() + field.slice(1)}<input inputMode="decimal" autoComplete="off" value={values[field]} onChange={e => { setSaved(false); setValues({ ...values, [field]: e.target.value }); }} /></label>)}
    </div>
    <p className={s.small}>Saving confirms you checked this row against the original. Use positive debit/credit values; a balance may be negative. A blank balance means unknown, not zero.</p>
    {error && <p role="alert" className={s.error}>{error}</p>}
    {saved && <p role="status">Saved and marked reviewed. Duplicate and balance alerts may still need attention.</p>}
    <div className={s.actions}><button className={s.primary} type="submit" disabled={row.excluded}>Save & mark reviewed</button><button type="button" className={s.secondary} onClick={onNext}>Next unreviewed row</button><button type="button" className={s.textButton} onClick={onExclude}>{row.excluded ? 'Restore row' : 'Exclude row'}</button></div>
  </form>;
}

export default function StatementWorkbench() {
  const [rows, setRows] = useState([]);
  const [sources, setSources] = useState([]);
  const [order, setOrder] = useState('DMY');
  const [delimiter, setDelimiter] = useState(',');
  const [currency, setCurrency] = useState('INR');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [issues, setIssues] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(false);
  const [exporting, setExporting] = useState(false);
  const generation = useRef(0);
  const objectUrls = useRef([]);
  const pdfTask = useRef(null);
  const input = useRef(null);
  const editor = useRef(null);
  const summary = useMemo(() => analyzeStatementRows(rows), [rows]);
  const current = rows.find(row => row.id === selected);
  const visible = useMemo(() => rows.filter(row => {
    const matches = `${row.description} ${row.date} ${row.sourceName}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === 'all' || (filter === 'pending' && !row.reviewed && !row.excluded) || (filter === 'flagged' && !row.excluded && summary.warnings.get(row.id).length) || (filter === 'excluded' && row.excluded));
  }), [rows, query, filter, summary]);
  const maxPage = Math.max(0, Math.ceil(visible.length / 50) - 1);
  const currentPage = Math.min(page, maxPage);

  useEffect(() => () => {
    generation.current++;
    objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    pdfTask.current?.destroy();
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [rows.length]);

  function reset() {
    if ((rows.length || busy) && !window.confirm('Clear this workspace? Imported rows and unsaved edits will be removed from this page. Downloaded files are not affected.')) return false;
    generation.current++; pdfTask.current?.destroy(); pdfTask.current = null;
    objectUrls.current.forEach(url => URL.revokeObjectURL(url)); objectUrls.current = [];
    setRows([]); setSources([]); setIssues([]); setSelected(null); setQuery(''); setFilter('all'); setPage(0); setDraft(false); setBusy(false); setStatus('Workspace cleared.');
    if (input.current) input.current.value = '';
    return true;
  }

  function sample() {
    if (!reset()) return;
    const next = parseStatementCsv(SAMPLE_STATEMENT_CSV, { sourceId: 'sample', sourceName: 'Synthetic example (not real bank data)' });
    setRows(next); setSources([{ id: 'sample', name: 'Synthetic example', size: 0 }]); setSelected(next[0].id);
    setStatus('Synthetic example loaded. It deliberately includes a duplicate internet bill: compare the rows and exclude one to see the balance check update.');
  }

  async function importFiles(fileList) {
    if (busy) return;
    const files = Array.from(fileList);
    if (!files.length) return;
    if (files.length + sources.length > STATEMENT_LIMITS.files || [...sources, ...files].reduce((sum, file) => sum + (file.size || 0), 0) > STATEMENT_LIMITS.bytes) {
      setIssues(['This workspace allows up to 10 files and 20 MB total. Clear it or choose a smaller batch.']); return;
    }
    const run = ++generation.current;
    setBusy(true); setIssues([]); setDraft(false);
    const added = [], addedSources = [], errors = [];
    for (const [index, file] of files.entries()) {
      if (generation.current !== run) return;
      const id = `${run}-${index}-${Date.now()}`;
      setStatus(`Reading file ${index + 1} of ${files.length} locally…`);
      try {
        let parsed;
        if (/\.csv$/i.test(file.name)) {
          parsed = parseStatementCsv(await file.text(), { sourceId: id, sourceName: file.name, order, delimiter });
        } else if (/\.pdf$/i.test(file.name)) {
          const pdfjs = await import('pdfjs-dist');
          if (generation.current !== run) return;
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          const task = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false, enableXfa: false });
          pdfTask.current = task;
          try {
            const pdf = await task.promise;
            if (pdf.numPages > STATEMENT_LIMITS.pages) throw new Error('Limit: 100 pages per PDF. Split the document first.');
            const pages = [];
            for (let number = 1; number <= pdf.numPages; number++) {
              if (generation.current !== run) return;
              setStatus(`Reading PDF ${index + 1}: page ${number} of ${pdf.numPages}…`);
              const pdfPage = await pdf.getPage(number);
              const content = await pdfPage.getTextContent();
              pages.push({ page: number, items: content.items.filter(item => 'str' in item).map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width })) });
              pdfPage.cleanup();
            }
            const result = parseStatementPdf(pages, { sourceId: id, sourceName: file.name, order });
            parsed = result.rows;
            errors.push(...result.issues.map(issue => `${file.name}: ${issue}`));
          } finally { await task.destroy(); if (pdfTask.current === task) pdfTask.current = null; }
        } else throw new Error('Choose a .csv or .pdf file.');
        if (generation.current !== run) return;
        if (!parsed.length) { errors.push(`${file.name}: No transactions imported.`); continue; }
        if (rows.length + added.length + parsed.length > STATEMENT_LIMITS.rows) throw new Error('Limit: 10,000 total transaction rows in this workspace.');
        const url = /\.pdf$/i.test(file.name) ? URL.createObjectURL(file) : null;
        if (url) objectUrls.current.push(url);
        addedSources.push({ id, name: file.name, size: file.size, url }); added.push(...parsed);
      } catch (error) {
        errors.push(`${file.name}: ${error.name === 'PasswordException' ? 'Password-protected PDF. Open an authorized, unlocked copy before importing.' : error.message}`);
      }
    }
    if (generation.current !== run) return;
    setRows(previous => [...previous, ...added]); setSources(previous => [...previous, ...addedSources]); setIssues(errors); setBusy(false);
    if (added.length) setSelected(added[0].id);
    setStatus(`${added.length} transaction rows imported from ${addedSources.length} file(s). Review every included row before using the export.`);
    if (input.current) input.current.value = '';
  }

  function choose(id) {
    setSelected(id);
    setTimeout(() => { editor.current?.scrollIntoView({ behavior: 'instant', block: 'start' }); editor.current?.focus({ preventScroll: true }); }, 0);
  }

  async function exportFile(format) {
    if (!summary.included || (!draft && summary.pending) || exporting || busy) return;
    setExporting(true);
    try {
      const name = `statement-${draft ? 'draft' : 'reviewed'}-${currency.toLowerCase()}`;
      if (format === 'csv') download('\uFEFF' + exportStatementCsv(rows), `${name}.csv`, 'text/csv;charset=utf-8');
      else if (format === 'json') download(JSON.stringify({ currency, status: draft ? 'draft' : 'reviewed', transactions: statementExportRows(rows) }, null, 2), `${name}.json`, 'application/json');
      else {
        const XLSX = await import('xlsx');
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(statementExportRows(rows));
        sheet['!cols'] = [{ wch: 12 }, { wch: 48 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(book, sheet, 'Transactions');
        XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Currency label', currency], ['Review status', draft ? 'Draft' : 'Reviewed by user'], ['Important', 'Verify completeness and remaining alerts against the originals. Not accounting certification. Amounts exceeding 15 significant digits are exported as text.']]), 'Read me');
        download(XLSX.write(book, { bookType: 'xlsx', type: 'array' }), `${name}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      setStatus(`Export prepared: ${summary.included} included rows. Your browser handles the download; check remaining alerts before using it.`);
    } catch { setStatus('Export failed. Try CSV, or reduce the batch size. Your rows are still in the workspace.'); }
    finally { setExporting(false); }
  }

  const canExport = summary.included > 0 && (draft || !summary.pending) && !exporting && !busy;
  return <section className={s.section} aria-label="Statement review workbench">
    <ol className={s.steps}><li><strong>01</strong> Import files</li><li><strong>02</strong> Review & correct</li><li><strong>03</strong> Export spreadsheet</li></ol>
    <div className={s.card}>
      <h2>Bring your statement.</h2>
      <p>Choose the date order before importing. Keep one currency per workspace; the currency label does not convert amounts.</p>
      <div className={s.settings}>
        <label>Date order<select value={order} disabled={busy || rows.length > 0} onChange={e => setOrder(e.target.value)}><option value="DMY">Day / month / year</option><option value="MDY">Month / day / year</option></select></label>
        <label>CSV separator<select value={delimiter} disabled={busy || rows.length > 0} onChange={e => setDelimiter(e.target.value)}><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value={'\t'}>Tab</option></select></label>
        <label>Currency label<select value={currency} disabled={busy || rows.length > 0} onChange={e => setCurrency(e.target.value)}>{['INR', 'USD', 'GBP', 'EUR', 'Other'].map(code => <option key={code}>{code}</option>)}</select></label>
      </div>
      <div className={s.dropzone} style={{ width: '100%' }}><h3>Choose PDF or CSV files</h3><p className={s.small}>Up to 10 files · 20 MB total · 100 pages per PDF · 10,000 rows total<br />Text-based PDFs only. Automatic extraction is a draft.</p><label>Select statement files<input ref={input} type="file" accept=".pdf,.csv" multiple disabled={busy || exporting} onChange={e => importFiles(e.target.files)} /></label><div className={s.actions}><button className={s.secondary} type="button" onClick={sample} disabled={busy || exporting}>Try a safe example</button><button className={s.textButton} type="button" onClick={() => download(SAMPLE_STATEMENT_CSV, 'sample-statement.csv', 'text/csv')}>Download sample CSV</button></div></div>
      <p className={s.small}>Files stay in this workspace’s memory. Download your work before leaving. Clear the workspace to change import settings.</p>
    </div>
    <p role="status" aria-live="polite" className={s.note}>{status || 'Ready when you are. Start with the synthetic example if you want to look around first.'}</p>
    {!!issues.length && <div className={s.error} role="alert"><strong>Import notes</strong><ul className={s.issues}>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
    {(busy || rows.length > 0) && <div className={s.actions}><button className={s.secondary} type="button" disabled={exporting} onClick={reset}>{busy ? 'Cancel & clear workspace' : 'Clear workspace'}</button></div>}
    {!!rows.length && <>
      <div className={s.stats}><div className={s.stat}><span>Included rows</span><strong>{summary.included}</strong></div><div className={s.stat}><span>Awaiting review</span><strong>{summary.pending}</strong></div><div className={s.stat}><span>Debit · {currency}</span><strong>{summary.totalsSafe ? moneyText(summary.debit) : 'Too large'}</strong></div><div className={s.stat}><span>Credit · {currency}</span><strong>{summary.totalsSafe ? moneyText(summary.credit) : 'Too large'}</strong></div></div>
      <div className={s.sectionHeading}><h2>Check the details, keep the context.</h2><p className={s.small}>{sources.length} source file(s) · No rows auto-deleted</p></div>
      <div className={s.toolbar}><label>Search descriptions, dates or files<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Find a transaction…" /></label><label>Show rows<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">All rows</option><option value="pending">Awaiting review</option><option value="flagged">With alerts</option><option value="excluded">Excluded</option></select></label></div>
      <div className={s.tableWrap} role="region" aria-label="Transaction rows, scroll horizontally for amounts" tabIndex={0}>
        <table className={s.table}><thead><tr>{['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Review'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead><tbody>
          {visible.slice(currentPage * 50, currentPage * 50 + 50).map(row => <tr key={row.id} className={`${selected === row.id ? s.selected : ''} ${row.excluded ? s.excluded : ''}`}><td>{row.date || 'Check date'}</td><td>{row.description || 'Check source'}<br /><small>{row.page ? `Page ${row.page}` : `Record ${row.line}`}{summary.warnings.get(row.id).length > 0 ? ' · Alert' : ''}</small></td><td>{moneyText(row.debit)}</td><td>{moneyText(row.credit)}</td><td>{moneyText(row.balance)}</td><td><button type="button" className={s.secondary} disabled={busy || exporting} onClick={() => choose(row.id)} aria-label={`Review ${row.description || 'transaction'} from ${row.sourceName}, ${row.page ? `page ${row.page}` : `record ${row.line}`}`}>{row.excluded ? 'Excluded' : row.reviewed ? 'Reviewed' : 'Review'}</button></td></tr>)}
          {!visible.length && <tr><td colSpan={6}>No rows match this filter. Change the search or show all rows.</td></tr>}
        </tbody></table>
      </div>
      <div className={s.pagination}><span>{visible.length} matching rows · Page {currentPage + 1} of {maxPage + 1}</span><div className={s.actions}><button className={s.secondary} type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={s.secondary} type="button" disabled={currentPage >= maxPage} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
      <div ref={editor} tabIndex={-1} style={{ scrollMarginTop: 90 }}>{current && !busy && !exporting && <RowEditor key={current.id} row={current} warnings={summary.warnings.get(current.id)} source={sources.find(source => source.id === current.sourceId)} onSave={updated => { setRows(previous => previous.map(row => row.id === updated.id ? updated : row)); setDraft(false); }} onExclude={() => { setRows(previous => previous.map(row => row.id === current.id ? { ...row, excluded: !row.excluded } : row)); setDraft(false); }} onNext={() => { const next = rows.find(row => row.id !== selected && !row.reviewed && !row.excluded); if (next) choose(next.id); else setStatus('No other unreviewed included rows. Save this row if you have finished checking it.'); }} />}</div>
      <div className={s.card}><h2>Take your work with you.</h2><p>Exports include all {summary.included} non-excluded rows, regardless of the search or filter, plus source references and review status. Remaining alerts are not a certification of correctness.</p><label className={s.check}><input type="checkbox" checked={draft} disabled={busy || exporting} onChange={e => setDraft(e.target.checked)} />Export an unverified draft now. I will check it before using it.</label>{!draft && summary.pending > 0 && <p className={s.small}>Review the remaining {summary.pending} rows or explicitly choose draft export.</p>}<div className={s.actions}>{['xlsx', 'csv', 'json'].map(format => <button key={format} type="button" className={format === 'xlsx' ? s.primary : s.secondary} disabled={!canExport} onClick={() => exportFile(format)}>{exporting ? 'Preparing…' : `Download ${format === 'xlsx' ? 'Excel' : format.toUpperCase()}`}</button>)}</div><p className={s.small}>Need a repeatable setup for your team? <Link href="/office">Ask about an assisted pilot →</Link></p></div>
    </>}
  </section>;
}
