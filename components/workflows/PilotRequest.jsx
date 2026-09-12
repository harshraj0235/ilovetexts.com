'use client';

import { useState } from 'react';
import s from './Workflows.module.css';

export default function PilotRequest() {
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  function prepare(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `Assisted pilot enquiry\n\nName: ${data.get('name')}\nTeam: ${data.get('team')}\nMonthly statement volume: ${data.get('volume')}\nInput: ${data.get('format')}\nDesired result: ${data.get('result')}\n\nPlease confirm fit, scope, availability and a written price before starting any paid work. No statement files are attached.`;
    setDraft(text);
    setMessage('Your draft is ready. Open it in your email app and send it, or copy it and email Contact@ilovetexts.com. Nothing has been sent yet.');
  }
  async function copyDraft() {
    try { await navigator.clipboard.writeText(draft); setMessage('Draft copied. Send it to Contact@ilovetexts.com when ready.'); }
    catch { setMessage('Clipboard unavailable. Select and copy the draft below instead.'); }
  }
  return <form className={s.form} onSubmit={prepare}>
    <label>Your name<input name="name" autoComplete="name" required maxLength={80} /></label>
    <label>Team or business<input name="team" autoComplete="organization" required maxLength={120} /></label>
    <label>Statement files per month<select name="volume"><option>1–20</option><option>21–100</option><option>101–500</option><option>More than 500</option></select></label>
    <label>Usual file format<select name="format"><option>Text-based PDF</option><option>CSV export</option><option>Scanned PDF — needs a feasibility review</option><option>A mix of formats</option></select></label>
    <label>What would a useful result look like?<textarea name="result" rows={3} required maxLength={600} placeholder="For example: one reviewed spreadsheet per account, with a duplicate-check checklist." /></label>
    <p className={s.small}>Do not include bank credentials, account numbers or financial records. This form prepares an email draft on your device. We will receive only what you choose to send.</p>
    <label className={s.check}><input type="checkbox" required />I understand this is an enquiry, not a purchase or a confirmed service booking.</label>
    <button className={s.primary} type="submit">Prepare my enquiry →</button>
    {message && <p role="status" className={s.note}>{message}</p>}
    {draft && <><label>Email draft<textarea readOnly rows={10} value={draft} /></label><div className={s.actions}><a className={s.primary} href={`mailto:Contact@ilovetexts.com?subject=${encodeURIComponent('Office statement workflow pilot enquiry')}&body=${encodeURIComponent(draft)}`}>Open email app</a><button type="button" className={s.secondary} onClick={copyDraft}>Copy draft</button></div></>}
  </form>;
}
