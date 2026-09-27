'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { APPLICATION_RECIPE, APPLICATION_LIMITS, BASE_REQUIREMENTS, FILE_KINDS, checkBatch, safeSourceUrl, documentAlerts, requirementStatus, buildApplicationReport, buildApplicationArchive, reportText } from '@/lib/application-ready.mjs';
import { inspectApplicationPdf } from '@/lib/application-pdf.mjs';
import s from './Workflows.module.css';
import a from './ApplicationReady.module.css';

const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function saveFile(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function ApplicationReady() {
  const hydrated = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState({ university: '', programme: '', sourceUrl: '', confirmed: false });
  const [docs, setDocs] = useState([]);
  const [custom, setCustom] = useState([]);
  const [reviews, setReviews] = useState({});
  const [status, setStatus] = useState('Start with your application details. No account needed.');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ack, setAck] = useState(false);
  const task = useRef(null);
  const upload = useRef(null);
  const heading = useRef(null);
  const requirements = [...BASE_REQUIREMENTS, ...custom];
  const checked = requirements.filter(item => requirementStatus(item, reviews[item.id], docs) === 'User checked').length;
  const unlinked = requirements.filter(item => requirementStatus(item, reviews[item.id], docs) === 'No file linked').length;
  const validPlan = Boolean(plan.university.trim() && plan.programme.trim() && safeSourceUrl(plan.sourceUrl));

  useEffect(() => () => { const running = task.current; task.current = null; running?.abort(); }, []);
  useEffect(() => {
    if (!docs.length) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [docs.length]);

  function navigate(next) {
    if (busy || exporting) return;
    if (next > 1 && !validPlan) { setErrors(['Add a university, programme and HTTPS link to its official requirements first.']); return; }
    setStep(next); setErrors([]);
    setTimeout(() => heading.current?.focus(), 0);
  }
  function editPlan(key, value) {
    setPlan(previous => ({ ...previous, [key]: value, confirmed: false }));
    setReviews({}); setAck(false);
  }
  function cancel() { task.current?.abort(); setStatus('Cancelling this batch. Previously imported files are kept.'); }
  function clear() {
    if (!window.confirm('Clear the plan and all files from this workspace? Original files and previous downloads on your device are not deleted.')) return;
    const running = task.current; task.current = null; running?.abort();
    setDocs([]); setReviews({}); setCustom([]); setPlan({ university: '', programme: '', sourceUrl: '', confirmed: false });
    setStep(1); setAck(false); setBusy(false); setErrors([]); setStatus('Workspace cleared. Nothing was deleted from your device.');
  }

  async function addFiles(filesInput) {
    if (task.current || exporting) return;
    const files = Array.from(filesInput);
    if (!files.length) return;
    try { checkBatch(docs, files); } catch (error) { setErrors([error.message]); return; }
    const controller = new AbortController(); task.current = controller;
    setBusy(true); setAck(false); setErrors([]);
    const added = [], problems = [];
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${encodeURIComponent(pdfjs.version)}`;
      for (const [index, file] of files.entries()) {
        controller.signal.throwIfAborted();
        try {
          setStatus(`Checking file ${index + 1} of ${files.length} on your device…`);
          const result = await inspectApplicationPdf(file, pdfjs, { signal: controller.signal, onPage: (page, total) => setStatus(`File ${index + 1} of ${files.length}: inspecting page ${page} of ${total}…`) });
          added.push({ ...result, id: crypto.randomUUID(), name: file.name, size: file.size, kind: 'Unassigned' });
        } catch (error) {
          if (controller.signal.aborted) throw error;
          problems.push(`${file.name}: ${error.message}`);
        }
      }
      controller.signal.throwIfAborted();
      if (task.current !== controller) return;
      setDocs(previous => [...previous, ...added]); setErrors(problems);
      setStatus(`${added.length} PDF(s) added. Original bytes preserved. Categorise files and check them against the sources below.`);
    } catch {
      if (task.current === controller) setStatus(controller.signal.aborted ? 'Batch cancelled. No files from this batch were added.' : 'The PDF engine could not load. Check your connection and try again; existing files are unchanged.');
    } finally {
      if (task.current === controller) { task.current = null; setBusy(false); }
      if (upload.current) upload.current.value = '';
    }
  }

  async function example() {
    if (busy || exporting) return;
    try {
      const { PDFDocument, StandardFonts } = await import('pdf-lib');
      const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
      const page = pdf.addPage();
      page.drawText('SYNTHETIC EXAMPLE - NOT AN ACADEMIC RECORD', { x: 30, y: 760, size: 15, font });
      page.drawText('Use this file to explore categorisation, linking and unchanged export.', { x: 30, y: 720, size: 12, font });
      await addFiles([new File([await pdf.save()], 'synthetic-example.pdf', { type: 'application/pdf' })]);
    } catch { setErrors(['Could not create the example. Try selecting a small PDF instead.']); }
  }

  function removeDoc(id) {
    setDocs(previous => previous.filter(doc => doc.id !== id));
    setReviews(previous => Object.fromEntries(Object.entries(previous).map(([key, value]) => [key, { fileIds: value.fileIds.filter(fileId => fileId !== id), confirmed: false }])));
    setAck(false); setStatus('File removed from this workspace only. Your original is unchanged.');
  }
  function linkFile(requirementId, fileId, selected) {
    setReviews(previous => {
      const ids = previous[requirementId]?.fileIds || [];
      return { ...previous, [requirementId]: { fileIds: selected ? [...new Set([...ids, fileId])] : ids.filter(id => id !== fileId), confirmed: false } };
    }); setAck(false);
  }
  function addRequirement(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const source = safeSourceUrl(String(data.get('source')));
    if (!source || !String(data.get('title')).trim()) { setErrors(['Use a requirement title and a valid HTTPS source link.']); return; }
    if (custom.length >= APPLICATION_LIMITS.custom) { setErrors(['Limit: 10 additional requirements.']); return; }
    setCustom(previous => [...previous, { id: crypto.randomUUID(), title: String(data.get('title')).trim(), note: String(data.get('note')).trim(), source, custom: true }]);
    setAck(false); setPlan(previous => ({ ...previous, confirmed: false })); setErrors([]); event.currentTarget.reset();
  }
  async function exportPack(format) {
    if (!ack || busy || exporting || !validPlan) return;
    setExporting(true); setErrors([]);
    const input = { plan, docs, requirements, reviews };
    try {
      if (format === 'zip') saveFile(await buildApplicationArchive(input), 'application-ready-preparation.zip', 'application/zip');
      else saveFile(reportText(buildApplicationReport(input)), 'application-ready-report.txt', 'text/plain;charset=utf-8');
      setStatus('Download prepared. Check your browser downloads. The report records unresolved items; no application has been submitted.');
    } catch (error) { setErrors([error.message || 'Export failed. Try a smaller batch. Your original files are unchanged.']); }
    finally { setExporting(false); }
  }

  return <><noscript><p className={s.note}>Enable JavaScript to use the private document workspace. Its form controls are disabled so application details cannot be submitted to this website.</p></noscript><fieldset disabled={!hydrated} className={a.workspace} aria-label="Application preparation workspace">
    <nav className={a.nav} aria-label="Application preparation steps">{['Your application', 'Files & checks', 'Export your pack'].map((label, index) => <button type="button" key={label} onClick={() => navigate(index + 1)} disabled={busy || exporting} aria-current={step === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</button>)}</nav>
    <p className={s.note} role="status" aria-live="polite">{status}</p>
    {!!errors.length && <div className={s.error} role="alert"><ul className={s.list}>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    <h2 ref={heading} tabIndex={-1}>{step === 1 ? 'A little context. A clearer next step.' : step === 2 ? 'Keep your documents together.' : 'Your files. Your final decision.'}</h2>
    {step === 1 && <div className={a.twoColumns}>
      <form className={s.card} onSubmit={event => { event.preventDefault(); navigate(2); }}>
        <span className={s.badge}>Free · No account · No upload server</span>
        <div className={s.form}>
          <label>Preparation route<select aria-describedby="route-scope" value={APPLICATION_RECIPE.id} onChange={() => {}}><option value={APPLICATION_RECIPE.id}>{APPLICATION_RECIPE.title}</option></select></label>
          <p id="route-scope" className={s.small}>{APPLICATION_RECIPE.scope}</p>
          <label>Target university<input required maxLength={120} autoComplete="off" value={plan.university} onChange={event => editPlan('university', event.target.value)} placeholder="University name" /></label>
          <label>Target programme<input required maxLength={120} autoComplete="off" value={plan.programme} onChange={event => editPlan('programme', event.target.value)} placeholder="Programme name and intake" /></label>
          <label>Official programme requirements link<input required type="url" maxLength={1500} value={plan.sourceUrl} onChange={event => editPlan('sourceUrl', event.target.value)} placeholder="https://…" /></label>
          <p className={s.small}>You supply this link. We do not fetch it or automatically verify its requirements. Names and links stay in this workspace until you download them.</p>
          <button className={s.primary} type="submit">Continue to files →</button>
        </div>
      </form>
      <aside className={s.card}><p className={s.eyebrow}>Know exactly what this does</p><h3>Organisation, not an admission verdict.</h3><ul className={s.list}><li>Inspect PDFs and spot identical files.</li><li>Link files to a source-backed starting checklist.</li><li>Add your programme’s additional requirements.</li><li>Download unchanged originals and an honest preparation report.</li></ul><p className={s.note}>No OCR, certified translation, signature authentication or missing-page guarantee. No university, APS or visa affiliation. Paid expert review is not available in this release.</p><a href={APPLICATION_RECIPE.source} target="_blank" rel="noopener noreferrer">Read the official India guidance ↗</a><p className={s.small}>General sources checked {APPLICATION_RECIPE.checked}. Recheck them before submitting; rules and individual requirements can change.</p></aside>
    </div>}
    {step === 2 && <div className={a.panel}>
      <div className={a.drop} aria-busy={busy} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy && !exporting) void addFiles(event.dataTransfer.files); }}>
        <h3>Drop PDFs here, or choose files</h3><p className={s.small}>20 PDFs · 10 MB each · 40 MB total · 100 pages per PDF<br />Every accepted file is exported unchanged—including APS certificates.</p>
        <label>Select application PDFs<input ref={upload} type="file" accept=".pdf,application/pdf" multiple disabled={busy || exporting} onChange={event => addFiles(event.target.files)} /></label>
        <div className={s.actions}>{busy ? <button type="button" className={s.secondary} onClick={cancel}>Cancel current batch</button> : <button type="button" className={s.secondary} disabled={exporting} onClick={example}>Try a synthetic PDF</button>}</div>
      </div>
      <div className={a.files} aria-label="Imported documents">
        {docs.map(doc => <article className={a.file} key={doc.id} aria-label={doc.name}>
          <div className={a.fileHeader}><div><strong>{doc.name}</strong><p className={a.meta}>{doc.pages} page(s) · {(doc.size / 1024).toFixed(1)} KB · Original preserved</p></div><span className={s.badge}>PDF opened</span></div>
          <div className={a.fileControls}><label>Category for {doc.name}<select aria-label={`Category for ${doc.name}`} value={doc.kind} disabled={busy || exporting} onChange={event => { setDocs(previous => previous.map(file => file.id === doc.id ? { ...file, kind: event.target.value } : file)); setAck(false); }}>{FILE_KINDS.map(kind => <option key={kind}>{kind}</option>)}</select></label><button className={s.secondary} type="button" disabled={busy || exporting} onClick={() => saveFile(doc.bytes, doc.name, 'application/pdf')}>Download original</button><button type="button" className={s.textButton} disabled={busy || exporting} onClick={() => removeDoc(doc.id)}>Remove</button></div>
          {!!documentAlerts(doc, docs).length && <div className={a.issues}><ul>{documentAlerts(doc, docs).map(note => <li key={note}>{note}</li>)}</ul></div>}
          <details><summary className={s.small}>File integrity fingerprint</summary><p className={a.hash}>{doc.hash}</p><p className={s.small}>Identifies these bytes only. It does not authenticate a certificate or its issuer.</p></details>
        </article>)}
      </div>
      <div className={a.intro}><h3>Match files to the checklist.</h3><p>The four starting items come from general India guidance. They are not your university’s complete list. One file can support more than one item. Confirm only after checking the original visually and reading the source.</p></div>
      {requirements.map(requirement => <section className={a.requirement} key={requirement.id} aria-label={requirement.title}>
        <div className={s.sectionHeading}><h3>{requirement.title}</h3><span className={a.status}>{requirementStatus(requirement, reviews[requirement.id], docs)}</span></div>
        <p className={s.small}>{requirement.note}</p><a className={s.small} href={requirement.source} target="_blank" rel="noopener noreferrer">{requirement.custom ? 'User-provided source (not verified)' : 'Official general guidance'} ↗</a>
        <fieldset disabled={busy || exporting}><legend>Link supporting files</legend><div className={a.links}>{docs.length ? docs.map(doc => <label className={s.check} key={doc.id}><input type="checkbox" checked={(reviews[requirement.id]?.fileIds || []).includes(doc.id)} onChange={event => linkFile(requirement.id, doc.id, event.target.checked)} />{doc.name}</label>) : <p className={s.small}>Add PDFs above to link files.</p>}</div></fieldset>
        <label className={s.check}><input type="checkbox" disabled={busy || exporting || !(reviews[requirement.id]?.fileIds || []).length} checked={Boolean(reviews[requirement.id]?.confirmed)} onChange={event => { setReviews(previous => ({ ...previous, [requirement.id]: { ...previous[requirement.id], confirmed: event.target.checked } })); setAck(false); }} />I checked the linked originals and this requirement myself.</label>
        {requirement.custom && <button type="button" className={s.textButton} disabled={busy || exporting} onClick={() => { setCustom(previous => previous.filter(item => item.id !== requirement.id)); setAck(false); setPlan(previous => ({ ...previous, confirmed: false })); }}>Remove additional requirement</button>}
      </section>)}
      <form className={a.custom} onSubmit={addRequirement}><h3>Add a programme-specific requirement</h3><p className={s.small}>Examples may include language evidence or translations. Add only what your official programme instructions require. These entries are user-supplied, not independently verified.</p><div className={s.editorFields}><label>Requirement title<input name="title" required maxLength={100} disabled={busy || exporting} /></label><label>Requirement source link<input name="source" type="url" required maxLength={1500} placeholder="https://…" disabled={busy || exporting} /></label><label>Notes<input name="note" maxLength={240} disabled={busy || exporting} /></label></div><div><button className={s.secondary} type="submit" disabled={busy || exporting || custom.length >= APPLICATION_LIMITS.custom}>Add requirement</button></div></form>
      <div className={s.actions}><button className={s.secondary} type="button" disabled={busy || exporting} onClick={() => navigate(1)}>← Application details</button><button className={s.primary} type="button" disabled={busy || exporting} onClick={() => navigate(3)}>Review export →</button></div>
    </div>}
    {step === 3 && <div className={a.panel}>
      <div className={a.count}><div><strong>{docs.length}</strong><span>Original PDFs</span></div><div><strong>{checked}/{requirements.length}</strong><span>Items you checked</span></div><div><strong>{unlinked}</strong><span>Items without files</span></div></div>
      <div className={a.twoColumns}><div className={s.card}><h3>Before you download</h3><p>Unresolved items stay visible in the report. Even when every item is checked, this is not a complete application assessment.</p><label className={s.check}><input type="checkbox" checked={plan.confirmed} disabled={exporting} onChange={event => { setPlan(previous => ({ ...previous, confirmed: event.target.checked })); setAck(false); }} />I separately checked my programme’s current official requirements and recorded any additional items.</label><a href={safeSourceUrl(plan.sourceUrl)} target="_blank" rel="noopener noreferrer">Reopen your programme source ↗</a><label className={s.check}><input type="checkbox" checked={ack} disabled={exporting} onChange={event => setAck(event.target.checked)} />I understand this download may be incomplete. I will resolve outstanding items and use the official submission channel myself.</label><div className={s.actions}><button type="button" className={s.primary} disabled={!ack || !docs.length || exporting} onClick={() => exportPack('zip')}>{exporting ? 'Preparing…' : 'Download original-file pack'}</button><button type="button" className={s.secondary} disabled={!ack || exporting} onClick={() => exportPack('text')}>Download report only</button></div><p className={s.small}>The ZIP contains personal files and metadata. It is not encrypted. Save it securely and share only with intended recipients. ZIP is for your organisation, not necessarily accepted by an application portal.</p></div>
      <aside className={a.package}><p className={s.eyebrow}>Inside your download</p><pre>{'application-ready-preparation.zip\n├─ originals/\n│  └─ numbered PDF copies\n├─ PREPARATION-REPORT.txt\n└─ manifest.json'}</pre><p className={s.small}>Only archive file names are sanitised. File contents are never rewritten. Integrity checks run again before export.</p><p className={a.warning}>Expert review and payments are not available. No reviewer has checked this pack, and no institution has received it.</p></aside></div>
      <div><button type="button" className={s.secondary} disabled={exporting} onClick={() => navigate(2)}>← Back to files and checks</button></div>
    </div>}
    <div className={s.sectionHeading}><p className={s.small}>No document storage, account or recovery service. Download your work before leaving.</p><button className={s.textButton} type="button" disabled={exporting} onClick={clear}>Clear workspace</button></div>
  </fieldset></>;
}
