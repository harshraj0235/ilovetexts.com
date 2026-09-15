'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { convertToTitleCase, getUppercaseStats } from '@/lib/case-conversion';

const LIMIT = 100000;
const STYLES = [
  { id: 'common', name: 'General', note: 'A practical default for web headings.' },
  { id: 'ap', name: 'AP-style', note: 'Short prepositions; common in news writing.' },
  { id: 'chicago', name: 'Chicago-style', note: 'Lowercases listed prepositions of any length.' },
  { id: 'mla', name: 'MLA-style', note: 'Headline-style option for English academic titles.' },
  { id: 'apa', name: 'APA-style', note: 'Capitalizes listed major words of four letters or more.' },
];

export default function TitleCaseConverter({ lang = 'en' }) {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('common');
  const [preserveAcronyms, setPreserveAcronyms] = useState(true);
  const [preserveBrands, setPreserveBrands] = useState(true);
  const [protectedInput, setProtectedInput] = useState('iPhone, eBay, OpenAI');
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);
  const protectedWords = useMemo(() => protectedInput.split(',').map(item => item.trim()).filter(Boolean).slice(0, 50), [protectedInput]);
  const options = useMemo(() => ({ style, preserveAcronyms, preserveMixedCase: preserveBrands, protectedWords }), [style, preserveAcronyms, preserveBrands, protectedWords]);
  const output = useMemo(() => convertToTitleCase(input, options), [input, options]);
  const stats = useMemo(() => getUppercaseStats(input, output), [input, output]);
  const comparisons = useMemo(() => STYLES.slice(1).map(item => ({ ...item, value: convertToTitleCase(input, { ...options, style: item.id }) })), [input, options]);

  const updateInput = value => {
    if (value.length > LIMIT) {
      setInput(value.slice(0, LIMIT));
      setNotice(`Only the first ${LIMIT.toLocaleString()} characters were kept.`);
    } else { setInput(value); setNotice(''); }
  };
  const copy = async value => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setNotice('Title-case result copied.'); }
    catch { setNotice('Clipboard access was blocked. Select and copy the result manually.'); }
  };
  const paste = async () => {
    try { updateInput(await navigator.clipboard.readText()); }
    catch { setNotice('Clipboard access was blocked. Paste with Ctrl+V or ⌘V.'); }
  };
  const openFile = async file => {
    if (!file) return;
    if (file.size > 1024 * 1024) { setNotice('Choose a UTF-8 text file smaller than 1 MB.'); return; }
    try { updateInput(await file.text()); } catch { setNotice('This file could not be read as text.'); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'title-case-text.txt'; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="tc-studio">
    <style>{`
      .tc-studio{--tc:#b45309;display:grid;gap:18px}.tc-shell,.tc-compare{overflow:hidden;border:1px solid var(--border-light);border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}.tc-head{display:flex;justify-content:space-between;gap:22px;padding:27px;background:linear-gradient(135deg,#422006,#92400e);color:white}.tc-head span,.tc-section-head span{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#fde68a}.tc-head h2{margin:7px 0;font-size:clamp(1.5rem,4vw,2.1rem)}.tc-head p{max-width:750px;margin:0;color:#fef3c7;line-height:1.55}.tc-metric{align-self:center;min-width:145px;padding:13px;border:1px solid #d97706;border-radius:13px;background:#ffffff12;text-align:center}.tc-metric strong{display:block;font-size:1.5rem}.tc-metric small{color:#fde68a}
      .tc-style{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:16px 20px;border-bottom:1px solid var(--border-light);background:var(--bg-section)}.tc-style button{display:grid;gap:3px;min-height:72px;padding:10px;border:1px solid var(--border-light);border-radius:11px;background:var(--bg-white);color:var(--text-main);text-align:left;cursor:pointer}.tc-style button[aria-pressed=true]{border-color:var(--tc);background:#fffbeb;box-shadow:0 0 0 2px #fde68a}.tc-style strong{font-size:.85rem}.tc-style small{color:var(--text-secondary);font-size:.68rem;line-height:1.3}
      .tc-options{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:12px;padding:15px 20px;border-bottom:1px solid var(--border-light)}.tc-options label{display:flex;align-items:center;gap:8px;min-height:43px;font-size:.78rem;font-weight:800}.tc-options input[type=checkbox]{width:18px;height:18px;accent-color:var(--tc)}.tc-options .protected{display:grid;gap:4px}.tc-options .protected span{font-size:.7rem;color:var(--text-secondary)}.tc-options input[type=text]{min-width:0;min-height:42px;padding:0 10px;border:1px solid var(--border-dark);border-radius:9px;background:var(--bg-white);color:var(--text-main)}
      .tc-workspace{display:grid;grid-template-columns:1fr 1fr}.tc-pane{display:grid;grid-template-rows:auto 1fr;border-right:1px solid var(--border-light)}.tc-pane:last-child{border:0}.tc-pane header{display:flex;justify-content:space-between;align-items:center;padding:12px 15px;border-bottom:1px solid var(--border-light)}.tc-pane header strong{font-size:.78rem;letter-spacing:.06em}.tc-actions{display:flex;gap:6px}.tc-actions button,.tc-footer button,.tc-card button{min-height:38px;padding:0 12px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);color:var(--text-main);font-weight:800;cursor:pointer}.tc-actions .primary,.tc-card button{border:0;background:var(--tc);color:white}.tc-actions button:disabled,.tc-footer button:disabled{opacity:.45;cursor:not-allowed}.tc-pane textarea{width:100%;min-height:300px;padding:17px;border:0;outline:0;resize:vertical;background:var(--bg-white);color:var(--text-main);font:500 1rem/1.7 var(--font-sans)}.tc-pane textarea:focus{box-shadow:inset 0 0 0 3px #fde68a}.tc-pane textarea[readonly]{background:#fffcf5}
      .tc-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 19px;border-top:1px solid var(--border-light)}.tc-stats{display:flex;flex-wrap:wrap;gap:7px}.tc-stats span{padding:6px 9px;border-radius:999px;background:var(--bg-section);color:var(--text-secondary);font-size:.74rem;font-weight:750}.tc-note{margin:0;padding:11px 14px;border-radius:9px;background:#fffbeb;color:#78350f;font-size:.83rem}
      .tc-compare{padding:21px}.tc-section-head{display:flex;justify-content:space-between;gap:15px;align-items:end;margin-bottom:14px}.tc-section-head span{color:#b45309}.tc-section-head h3{margin:5px 0 0}.tc-section-head p{margin:0;max-width:550px;color:var(--text-secondary);font-size:.8rem}.tc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tc-card{display:grid;grid-template-columns:1fr auto;gap:7px;padding:14px;border:1px solid var(--border-light);border-radius:12px;background:var(--bg-section)}.tc-card strong{font-size:.82rem}.tc-card p{grid-column:1/-1;margin:0;color:var(--text-main);line-height:1.5;overflow-wrap:anywhere}.tc-card small{grid-column:1/-1;color:var(--text-secondary)}.tc-links{display:flex;flex-wrap:wrap;gap:8px}.tc-links a{padding:8px 11px;border:1px solid var(--border-light);border-radius:999px;color:var(--text-secondary);font-size:.76rem;font-weight:750;text-decoration:none}
      @media(max-width:900px){.tc-style{grid-template-columns:repeat(3,1fr)}.tc-options{grid-template-columns:1fr 1fr}.tc-options .protected{grid-column:1/-1}.tc-workspace{grid-template-columns:1fr}.tc-pane{border-right:0;border-bottom:1px solid var(--border-light)}.tc-pane textarea{min-height:230px}}
      @media(max-width:560px){.tc-head{padding:20px;flex-direction:column}.tc-metric{align-self:flex-start}.tc-style{grid-template-columns:1fr 1fr;padding:13px}.tc-options{grid-template-columns:1fr;padding:13px}.tc-options .protected{grid-column:auto}.tc-pane header{align-items:stretch;flex-direction:column;gap:9px}.tc-actions{display:grid;grid-template-columns:1fr 1fr}.tc-actions button{min-height:44px}.tc-grid{grid-template-columns:1fr}.tc-section-head{align-items:start;flex-direction:column}.tc-footer{align-items:stretch;flex-direction:column}}
    `}</style>
    <div className="tc-shell">
      <div className="tc-head"><div><span>Editorial title workspace</span><h2>Compare title capitalization before you publish</h2><p>Format one headline or one title per line, preserve acronyms and brand spelling, and compare simplified AP, APA, Chicago, and MLA rule presets.</p></div><div className="tc-metric"><strong>{stats.changed.toLocaleString()}</strong><small>characters changed</small></div></div>
      <div className="tc-style" role="group" aria-label="Title capitalization style">{STYLES.map(item => <button key={item.id} type="button" aria-pressed={style === item.id} onClick={() => setStyle(item.id)}><strong>{item.name}</strong><small>{item.note}</small></button>)}</div>
      <div className="tc-options"><label><input type="checkbox" checked={preserveAcronyms} onChange={e => setPreserveAcronyms(e.target.checked)} />Preserve ALL-CAPS acronyms</label><label><input type="checkbox" checked={preserveBrands} onChange={e => setPreserveBrands(e.target.checked)} />Preserve mixed-case brands</label><label className="protected">Protected words <input type="text" value={protectedInput} onChange={e => setProtectedInput(e.target.value)} placeholder="OpenAI, iPhone, eBay" /><span>Comma-separated; spelling and case are retained.</span></label></div>
      <div className="tc-workspace"><div className="tc-pane"><header><strong>YOUR TITLE OR LIST</strong><div className="tc-actions"><button onClick={paste}>Paste</button><button onClick={() => fileRef.current?.click()}>Open file</button><input hidden ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain" onChange={e => openFile(e.target.files?.[0])} /></div></header><textarea value={input} onChange={e => updateInput(e.target.value)} placeholder={'the art of clear writing: a practical guide\none title per line'} aria-label="Titles to capitalize" spellCheck="true" /></div><div className="tc-pane"><header><strong>{STYLES.find(item => item.id === style)?.name.toUpperCase()} RESULT</strong><div className="tc-actions"><button className="primary" onClick={() => copy(output)} disabled={!output}>Copy</button><button onClick={download} disabled={!output}>Download</button></div></header><textarea value={output} readOnly aria-label="Title case result" placeholder="Your Formatted Title Appears Here" /></div></div>
      <div className="tc-footer"><div className="tc-stats" aria-live="polite"><span>{stats.words} words</span><span>{stats.characters} characters</span><span>{stats.lines} title lines</span></div><button onClick={() => { setInput(''); setNotice(''); }} disabled={!input}>Clear</button></div>
    </div>
    {notice && <p className="tc-note" role="status">{notice}</p>}
    <section className="tc-compare"><div className="tc-section-head"><div><span>Style comparison</span><h3>See four results side by side</h3></div><p>Automated rules cannot always identify parts of speech or house-style exceptions. Use these previews as an editing aid and verify difficult titles.</p></div><div className="tc-grid">{comparisons.map(item => <article className="tc-card" key={item.id}><strong>{item.name}</strong><button onClick={() => copy(item.value)} disabled={!item.value}>Copy</button><p>{item.value || 'Your comparison appears here.'}</p><small>{item.note}</small></article>)}</div></section>
    <nav className="tc-links" aria-label="Other case tools"><Link href={`/${lang}/text-case-converter/sentence-case`}>Sentence case</Link><Link href={`/${lang}/text-case-converter/uppercase`}>UPPERCASE</Link><Link href={`/${lang}/text-case-converter/lowercase`}>lowercase</Link></nav>
  </section>;
}
