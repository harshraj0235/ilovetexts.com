'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { convertToLowercase, convertToUppercase, getUppercaseStats } from '@/lib/case-conversion';

const LIMIT = 250000;
const LOCALES = [
  ['', 'Automatic'], ['en', 'English'], ['tr', 'Turkish'], ['az', 'Azerbaijani'],
  ['lt', 'Lithuanian'], ['de', 'German'],
];

export default function UppercaseConverter({ lang = 'en', mode = 'uppercase' }) {
  const isLowercase = mode === 'lowercase';
  const caseLabel = isLowercase ? 'lowercase' : 'UPPERCASE';
  const [input, setInput] = useState('');
  const [locale, setLocale] = useState('');
  const [preserveUrls, setPreserveUrls] = useState(true);
  const [preserveEmails, setPreserveEmails] = useState(true);
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);
  const output = useMemo(() => {
    const convert = isLowercase ? convertToLowercase : convertToUppercase;
    return convert(input, { locale, preserveUrls, preserveEmails });
  }, [input, isLowercase, locale, preserveUrls, preserveEmails]);
  const stats = useMemo(() => getUppercaseStats(input, output), [input, output]);

  const updateInput = (value) => {
    if (value.length > LIMIT) {
      setNotice(`Only the first ${LIMIT.toLocaleString()} characters were kept.`);
      setInput(value.slice(0, LIMIT));
      return;
    }
    setNotice('');
    setInput(value);
  };

  const paste = async () => {
    try { updateInput(await navigator.clipboard.readText()); }
    catch { setNotice('Clipboard access was blocked. Paste with Ctrl+V or ⌘V.'); }
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setNotice(`${caseLabel} text copied.`);
    } catch { setNotice('Copy was blocked. Select the result and copy it manually.'); }
  };

  const openFile = async (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNotice('Choose a UTF-8 text file smaller than 1 MB.');
      return;
    }
    try { updateInput(await file.text()); }
    catch { setNotice('This file could not be read as text.'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${isLowercase ? 'lowercase' : 'uppercase'}-text.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <section className="uppercase-studio" data-case-mode={mode}>
    <style>{`
      .uppercase-studio{--uc:#4f46e5;display:grid;gap:18px}.uc-shell{overflow:hidden;border:1px solid var(--border-light);border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}
      .uc-head{display:flex;justify-content:space-between;gap:20px;padding:25px 27px;background:linear-gradient(135deg,#1e1b4b,#4338ca);color:white}.uc-head span{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#c7d2fe}.uc-head h2{margin:6px 0;font-size:clamp(1.45rem,4vw,2rem)}.uc-head p{max-width:720px;margin:0;color:#e0e7ff;line-height:1.55}.uc-badge{align-self:center;min-width:140px;padding:13px;border:1px solid #6366f1;border-radius:13px;background:#ffffff10;text-align:center}.uc-badge strong{display:block;font-size:1.45rem}.uc-badge small{color:#c7d2fe}
      .uc-controls{display:grid;grid-template-columns:190px 1fr 1fr;gap:14px;padding:18px 22px;border-bottom:1px solid var(--border-light);background:var(--bg-section)}.uc-controls label{display:grid;gap:6px;font-size:.78rem;font-weight:800}.uc-controls select{min-height:43px;padding:0 10px;border:1px solid var(--border-dark);border-radius:9px;background:var(--bg-white);color:var(--text-main);font:inherit}.uc-check{display:flex!important;align-items:center;gap:9px!important;align-self:end;min-height:43px;padding:0 12px;border:1px solid var(--border-light);border-radius:9px;background:var(--bg-white)}.uc-check input{width:18px;height:18px;accent-color:var(--uc)}
      .uc-workspace{display:grid;grid-template-columns:1fr 1fr}.uc-pane{display:grid;grid-template-rows:auto 1fr;border-right:1px solid var(--border-light)}.uc-pane:last-child{border:0}.uc-pane header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-light);background:var(--bg-white)}.uc-pane header strong{font-size:.8rem;letter-spacing:.06em}.uc-actions{display:flex;gap:6px}.uc-actions button,.uc-footer button{min-height:38px;padding:0 12px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);color:var(--text-main);font-weight:800;cursor:pointer}.uc-actions .primary,.uc-footer .primary{border-color:var(--uc);background:var(--uc);color:white}.uc-actions button:disabled{opacity:.45;cursor:not-allowed}.uc-pane textarea{width:100%;min-height:330px;padding:18px;border:0;outline:0;resize:vertical;background:var(--bg-white);color:var(--text-main);font:500 1rem/1.7 var(--font-sans)}.uc-pane textarea:focus{box-shadow:inset 0 0 0 3px #c7d2fe}.uc-pane textarea[readonly]{background:color-mix(in srgb,var(--uc) 3%,var(--bg-white))}
      .uc-status{display:flex;flex-wrap:wrap;gap:8px;padding:13px 20px;border-top:1px solid var(--border-light)}.uc-status span{padding:6px 9px;border-radius:999px;background:var(--bg-section);color:var(--text-secondary);font-size:.76rem;font-weight:750}.uc-notice{margin:0;padding:11px 14px;border-radius:10px;background:#eef2ff;color:#3730a3;font-size:.84rem}.uc-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 20px;border-top:1px solid var(--border-light)}.uc-footer p{margin:0;color:var(--text-secondary);font-size:.78rem}.uc-links{display:flex;flex-wrap:wrap;gap:8px}.uc-links a{padding:8px 11px;border:1px solid var(--border-light);border-radius:999px;background:var(--bg-white);color:var(--text-secondary);font-size:.76rem;font-weight:750;text-decoration:none}
      @media(max-width:800px){.uc-head{flex-direction:column}.uc-badge{align-self:flex-start}.uc-controls{grid-template-columns:1fr 1fr}.uc-controls>label:first-child{grid-column:1/-1}.uc-workspace{grid-template-columns:1fr}.uc-pane{border-right:0;border-bottom:1px solid var(--border-light)}.uc-pane textarea{min-height:240px}.uc-footer{align-items:stretch;flex-direction:column}}
      @media(max-width:520px){.uc-head{padding:20px}.uc-controls{grid-template-columns:1fr;padding:14px}.uc-controls>label:first-child{grid-column:auto}.uc-actions{display:grid;grid-template-columns:1fr 1fr}.uc-actions button{min-height:44px}.uc-pane textarea{min-height:210px;padding:14px}.uc-status{padding:12px 14px}}
    `}</style>
    <div className="uc-shell">
      <div className="uc-head">
        <div><span>Private case studio</span><h2>{isLowercase ? 'Turn capital letters into lowercase without retyping' : 'Turn text into UPPERCASE without retyping'}</h2><p>Keep spacing and line breaks intact, choose language-aware casing, and optionally leave URLs or email addresses unchanged.</p></div>
        <div className="uc-badge"><strong>{stats.changed.toLocaleString()}</strong><small>characters changed</small></div>
      </div>
      <div className="uc-controls">
        <label>{isLowercase ? 'Lowercase' : 'Uppercase'} language rules<select value={locale} onChange={e => setLocale(e.target.value)}>{LOCALES.map(([value, label]) => <option key={label} value={value}>{label}</option>)}</select></label>
        <label className="uc-check"><input type="checkbox" checked={preserveUrls} onChange={e => setPreserveUrls(e.target.checked)} />Keep URLs unchanged</label>
        <label className="uc-check"><input type="checkbox" checked={preserveEmails} onChange={e => setPreserveEmails(e.target.checked)} />Keep email addresses unchanged</label>
      </div>
      <div className="uc-workspace">
        <div className="uc-pane"><header><strong>ORIGINAL TEXT</strong><div className="uc-actions"><button onClick={paste}>Paste</button><button onClick={() => fileRef.current?.click()}>Open file</button><input ref={fileRef} hidden type="file" accept=".txt,.md,.csv,.json,.html,.xml,text/plain" onChange={e => openFile(e.target.files?.[0])} /></div></header><textarea value={input} onChange={e => updateInput(e.target.value)} placeholder={isLowercase ? 'Type or paste uppercase or mixed-case text…' : 'Type or paste lowercase or mixed-case text…'} aria-label={`Text to convert to ${isLowercase ? 'lowercase' : 'uppercase'}`} spellCheck="true" /></div>
        <div className="uc-pane"><header><strong>{isLowercase ? 'LOWERCASE' : 'UPPERCASE'} RESULT</strong><div className="uc-actions"><button className="primary" disabled={!output} onClick={copy}>Copy</button><button disabled={!output} onClick={download}>Download</button></div></header><textarea value={output} readOnly placeholder={isLowercase ? 'your lowercase result appears here' : 'YOUR UPPERCASE RESULT APPEARS HERE'} aria-label={`${isLowercase ? 'Lowercase' : 'Uppercase'} result`} /></div>
      </div>
      <div className="uc-status" aria-live="polite"><span>{stats.words.toLocaleString()} words</span><span>{stats.characters.toLocaleString()} characters</span><span>{stats.lines.toLocaleString()} lines</span><span>{Math.max(0, LIMIT - input.length).toLocaleString()} characters available</span></div>
      <div className="uc-footer"><p>Runs locally in this browser. Review brand names, acronyms, code, URLs, and email addresses before publishing.</p><div><button onClick={() => { setInput(''); setNotice(''); }} disabled={!input}>Clear both</button></div></div>
    </div>
    {notice && <p className="uc-notice" role="status">{notice}</p>}
    <nav className="uc-links" aria-label="Other text case converters">{isLowercase ? <Link href={`/${lang}/text-case-converter/uppercase`}>UPPERCASE</Link> : <Link href={`/${lang}/text-case-converter/lowercase`}>lowercase</Link>}<Link href={`/${lang}/text-case-converter/title-case`}>Title Case</Link><Link href={`/${lang}/text-case-converter/sentence-case`}>Sentence case</Link><Link href={`/${lang}/text-case-converter/toggle-case`}>tOGGLE cASE</Link></nav>
  </section>;
}
