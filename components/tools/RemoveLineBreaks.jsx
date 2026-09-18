'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { removeLineBreaks } from '@/lib/text-processors';

const LIMIT = 500000;

export default function RemoveLineBreaks({ lang = 'en' }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('all');
  const [separator, setSeparator] = useState('space');
  const [customSeparator, setCustomSeparator] = useState('');
  const [trim, setTrim] = useState(true);
  const [htmlMode, setHtmlMode] = useState('none');
  const [targetOs, setTargetOs] = useState('all');
  const [fixCapitalization, setFixCapitalization] = useState(false);
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  const options = useMemo(() => ({ mode, separator, customSeparator, trim, htmlMode, targetOs, fixCapitalization }), [mode, separator, customSeparator, trim, htmlMode, targetOs, fixCapitalization]);
  const output = useMemo(() => removeLineBreaks(input, options), [input, options]);

  const stats = useMemo(() => {
    const inputLines = input.split('\n').length;
    const outputLines = output.split('\n').length;
    return {
      inputLines: input ? inputLines : 0,
      outputLines: output ? outputLines : 0,
      linesRemoved: input ? Math.max(0, inputLines - outputLines) : 0,
    };
  }, [input, output]);

  const updateInput = value => {
    if (value.length > LIMIT) {
      setInput(value.slice(0, LIMIT));
      setNotice(`Only the first ${LIMIT.toLocaleString()} characters were kept.`);
    } else { setInput(value); setNotice(''); }
  };

  const copy = async value => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setNotice('Result copied to clipboard.'); }
    catch { setNotice('Clipboard access blocked. Copy manually.'); }
  };

  const paste = async () => {
    try { updateInput(await navigator.clipboard.readText()); }
    catch { setNotice('Clipboard access blocked. Use Ctrl+V.'); }
  };

  const openFile = async file => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setNotice('Choose a text file smaller than 2 MB.'); return; }
    try { updateInput(await file.text()); } catch { setNotice('Could not read file.'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cleaned-text.txt'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <section className="tc-studio">
      <style>{`
        .tc-studio{--tc:#2563eb;display:grid;gap:18px}.tc-shell{overflow:hidden;border:1px solid var(--border-light);border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}.tc-head{display:flex;justify-content:space-between;gap:22px;padding:27px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white}.tc-head span{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#bfdbfe}.tc-head h2{margin:7px 0;font-size:clamp(1.5rem,4vw,2.1rem)}.tc-head p{max-width:750px;margin:0;color:#eff6ff;line-height:1.55}.tc-metric{align-self:center;min-width:145px;padding:13px;border:1px solid #60a5fa;border-radius:13px;background:#ffffff12;text-align:center}.tc-metric strong{display:block;font-size:1.5rem}.tc-metric small{color:#bfdbfe}
        .tc-options{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;border-bottom:1px solid var(--border-light);background:var(--bg-section)}.tc-options fieldset{border:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}.tc-options legend{font-weight:800;font-size:.85rem;margin-bottom:8px;color:var(--text-main)}.tc-options label{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--text-secondary)}.tc-options input[type=radio]{width:16px;height:16px;accent-color:var(--tc)}.tc-options input[type=checkbox]{width:16px;height:16px;accent-color:var(--tc)}.tc-options input[type=text]{padding:6px 10px;border:1px solid var(--border-light);border-radius:6px;width:120px;background:var(--bg-white)}
        .tc-workspace{display:grid;grid-template-columns:1fr 1fr}.tc-pane{display:grid;grid-template-rows:auto 1fr;border-right:1px solid var(--border-light)}.tc-pane:last-child{border:0}.tc-pane header{display:flex;justify-content:space-between;align-items:center;padding:12px 15px;border-bottom:1px solid var(--border-light)}.tc-pane header strong{font-size:.78rem;letter-spacing:.06em}.tc-actions{display:flex;gap:6px}.tc-actions button,.tc-footer button{min-height:38px;padding:0 12px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);color:var(--text-main);font-weight:800;cursor:pointer}.tc-actions .primary{border:0;background:var(--tc);color:white}.tc-actions button:disabled,.tc-footer button:disabled{opacity:.45;cursor:not-allowed}.tc-pane textarea{width:100%;min-height:300px;padding:17px;border:0;outline:0;resize:vertical;background:var(--bg-white);color:var(--text-main);font:400 1rem/1.6 var(--font-sans)}.tc-pane textarea:focus{box-shadow:inset 0 0 0 3px #bfdbfe}.tc-pane textarea[readonly]{background:#f8fafc}
        .tc-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 19px;border-top:1px solid var(--border-light)}.tc-stats{display:flex;flex-wrap:wrap;gap:7px}.tc-stats span{padding:6px 9px;border-radius:999px;background:var(--bg-section);color:var(--text-secondary);font-size:.74rem;font-weight:750}.tc-note{margin:0;padding:11px 14px;border-radius:9px;background:#eff6ff;color:#1e3a8a;font-size:.83rem}
        .tc-links{display:flex;flex-wrap:wrap;gap:8px}.tc-links a{padding:8px 11px;border:1px solid var(--border-light);border-radius:999px;color:var(--text-secondary);font-size:.76rem;font-weight:750;text-decoration:none}
        @media(max-width:900px){.tc-workspace{grid-template-columns:1fr}.tc-pane{border-right:0;border-bottom:1px solid var(--border-light)}.tc-pane textarea{min-height:230px}}
        @media(max-width:560px){.tc-head{padding:20px;flex-direction:column}.tc-metric{align-self:flex-start}.tc-options{grid-template-columns:1fr}.tc-pane header{align-items:stretch;flex-direction:column;gap:9px}.tc-actions{display:grid;grid-template-columns:1fr 1fr}.tc-footer{align-items:stretch;flex-direction:column}}
      `}</style>

      <div className="tc-shell">
        <div className="tc-head">
          <div>
            <span>Format & Clean</span>
            <h2>Remove Line Breaks Online</h2>
            <p>Clean up text instantly. Remove all line breaks for a single block of text, or preserve paragraphs while fixing broken lines from PDFs and emails.</p>
          </div>
          <div className="tc-metric">
            <strong>{stats.linesRemoved.toLocaleString()}</strong>
            <small>line breaks removed</small>
          </div>
        </div>

        <div className="tc-options">
          <fieldset>
            <legend>Formatting Mode</legend>
            <label><input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={e => setMode(e.target.value)} /> Remove all line breaks (merge into one block)</label>
            <label><input type="radio" name="mode" value="paragraphs" checked={mode === 'paragraphs'} onChange={e => setMode(e.target.value)} /> Preserve paragraphs (keep double line breaks)</label>
            <label style={{marginTop: '8px'}}><input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)} /> Trim trailing and leading whitespace</label>
          </fieldset>
          
          <fieldset>
            <legend>Replacement Character</legend>
            <label><input type="radio" name="separator" value="space" checked={separator === 'space' && htmlMode === 'none'} onChange={e => {setSeparator(e.target.value); setHtmlMode('none')}} /> Replace with Space (Recommended)</label>
            <label><input type="radio" name="separator" value="none" checked={separator === 'none' && htmlMode === 'none'} onChange={e => {setSeparator(e.target.value); setHtmlMode('none')}} /> No Separator (Join words directly)</label>
            <label><input type="radio" name="separator" value="comma" checked={separator === 'comma' && htmlMode === 'none'} onChange={e => {setSeparator(e.target.value); setHtmlMode('none')}} /> Replace with Comma</label>
            <label style={{alignItems: 'center'}}>
              <input type="radio" name="separator" value="custom" checked={separator === 'custom' && htmlMode === 'none'} onChange={e => {setSeparator(e.target.value); setHtmlMode('none')}} /> 
              Custom: <input type="text" value={customSeparator} onChange={e => { setSeparator('custom'); setCustomSeparator(e.target.value); setHtmlMode('none'); }} placeholder="e.g. | " />
            </label>
          </fieldset>

          <fieldset>
            <legend>HTML & Advanced Formatting</legend>
            <label><input type="radio" name="htmlMode" value="br" checked={htmlMode === 'br'} onChange={e => setHtmlMode(e.target.value)} /> Replace with &lt;br /&gt; tags</label>
            <label><input type="radio" name="htmlMode" value="p" checked={htmlMode === 'p'} onChange={e => setHtmlMode(e.target.value)} /> Wrap in &lt;p&gt; tags</label>
            <label style={{marginTop: '8px'}}><input type="checkbox" checked={fixCapitalization} onChange={e => setFixCapitalization(e.target.checked)} /> Fix Capitalization (Auto-capitalize broken sentences from PDFs)</label>
          </fieldset>
          
          <fieldset>
            <legend>Target specific line breaks</legend>
            <label><input type="radio" name="targetOs" value="all" checked={targetOs === 'all'} onChange={e => setTargetOs(e.target.value)} /> All (Any operating system)</label>
            <label><input type="radio" name="targetOs" value="windows" checked={targetOs === 'windows'} onChange={e => setTargetOs(e.target.value)} /> Windows only (\r\n)</label>
            <label><input type="radio" name="targetOs" value="unix" checked={targetOs === 'unix'} onChange={e => setTargetOs(e.target.value)} /> Linux / Unix only (\n)</label>
          </fieldset>
        </div>

        <div className="tc-workspace">
          <div className="tc-pane">
            <header>
              <strong>PASTE YOUR TEXT HERE</strong>
              <div className="tc-actions">
                <button onClick={paste}>Paste</button>
                <button onClick={() => fileRef.current?.click()}>Upload</button>
                <input hidden ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain" onChange={e => openFile(e.target.files?.[0])} />
              </div>
            </header>
            <textarea value={input} onChange={e => updateInput(e.target.value)} placeholder="Paste text with broken line breaks here..." aria-label="Text to clean" spellCheck="false" />
          </div>
          
          <div className="tc-pane">
            <header>
              <strong>CLEANED TEXT RESULT</strong>
              <div className="tc-actions">
                <button className="primary" onClick={() => copy(output)} disabled={!output}>Copy text</button>
                <button onClick={download} disabled={!output}>Download .txt</button>
              </div>
            </header>
            <textarea value={output} readOnly aria-label="Cleaned text result" placeholder="Your cleaned text will appear here." />
          </div>
        </div>
        
        <div className="tc-footer">
          <div className="tc-stats">
            <span>{stats.inputLines} Input Lines</span>
            <span>{stats.outputLines} Output Lines</span>
          </div>
          <button onClick={() => { setInput(''); setNotice(''); }} disabled={!input}>Clear All</button>
        </div>
      </div>

      {notice && <p className="tc-note" role="status">{notice}</p>}

      <nav className="tc-links" aria-label="Other cleaner tools">
        <Link href={`/${lang}/text-cleaner/remove-line-breaks`}>Remove Line Breaks</Link>
        <Link href={`/${lang}/text-cleaner/remove-extra-spaces`}>Remove Extra Spaces</Link>
        <Link href={`/${lang}/text-cleaner/remove-duplicate-lines`}>Remove Duplicate Lines</Link>
        <Link href={`/${lang}/text-cleaner/remove-empty-lines`}>Remove Empty Lines</Link>
        <Link href={`/${lang}/text-cleaner/remove-whitespace`}>Remove All Whitespace</Link>
        <Link href={`/${lang}/text-cleaner/add-line-numbers`}>Add Line Numbers</Link>
        <Link href={`/${lang}/text-cleaner/add-prefix-suffix`}>Add Prefix / Suffix</Link>
        <Link href={`/${lang}/text-cleaner/sort-lines`}>Sort Lines</Link>
        <Link href={`/${lang}/text-cleaner/reverse-text`}>Reverse Text</Link>
        <Link href={`/${lang}/text-cleaner/reverse-lines`}>Reverse Lines Order</Link>
      </nav>
    </section>
  );
}
