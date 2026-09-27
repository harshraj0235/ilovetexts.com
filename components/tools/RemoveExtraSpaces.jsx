'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { removeExtraSpaces } from '@/lib/text-processors';

const LIMIT = 500000;

export default function RemoveExtraSpaces({ lang = 'en' }) {
  const [input, setInput] = useState('');
  const [preserveIndentation, setPreserveIndentation] = useState(false);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [removeTabs, setRemoveTabs] = useState(true);
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  const options = useMemo(() => ({ preserveIndentation, collapseSpaces, removeTabs }), [preserveIndentation, collapseSpaces, removeTabs]);
  const output = useMemo(() => removeExtraSpaces(input, options), [input, options]);

  const stats = useMemo(() => {
    const inputChars = input.length;
    const outputChars = output.length;
    return {
      inputChars,
      outputChars,
      spacesRemoved: Math.max(0, inputChars - outputChars),
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
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cleaned-spaces.txt'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <section className="tc-studio">
      <style>{`
        .tc-studio{--tc:#10b981;display:grid;gap:18px}.tc-shell{overflow:hidden;border:1px solid var(--border-light);border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}.tc-head{display:flex;justify-content:space-between;gap:22px;padding:27px;background:linear-gradient(135deg,#064e3b,#059669);color:white}.tc-head span{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#a7f3d0}.tc-head h2{margin:7px 0;font-size:clamp(1.5rem,4vw,2.1rem)}.tc-head p{max-width:750px;margin:0;color:#ecfdf5;line-height:1.55}.tc-metric{align-self:center;min-width:145px;padding:13px;border:1px solid #34d399;border-radius:13px;background:#ffffff12;text-align:center}.tc-metric strong{display:block;font-size:1.5rem}.tc-metric small{color:#a7f3d0}
        .tc-options{display:flex;flex-wrap:wrap;gap:25px;padding:20px;border-bottom:1px solid var(--border-light);background:var(--bg-section)}.tc-options label{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:700;color:var(--text-main)}.tc-options input[type=checkbox]{width:18px;height:18px;accent-color:var(--tc)}
        .tc-workspace{display:grid;grid-template-columns:1fr 1fr}.tc-pane{display:grid;grid-template-rows:auto 1fr;border-right:1px solid var(--border-light)}.tc-pane:last-child{border:0}.tc-pane header{display:flex;justify-content:space-between;align-items:center;padding:12px 15px;border-bottom:1px solid var(--border-light)}.tc-pane header strong{font-size:.78rem;letter-spacing:.06em}.tc-actions{display:flex;gap:6px}.tc-actions button,.tc-footer button{min-height:38px;padding:0 12px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);color:var(--text-main);font-weight:800;cursor:pointer}.tc-actions .primary{border:0;background:var(--tc);color:white}.tc-actions button:disabled,.tc-footer button:disabled{opacity:.45;cursor:not-allowed}.tc-pane textarea{width:100%;min-height:300px;padding:17px;border:0;outline:0;resize:vertical;background:var(--bg-white);color:var(--text-main);font:400 1rem/1.6 var(--font-sans)}.tc-pane textarea:focus{box-shadow:inset 0 0 0 3px #a7f3d0}.tc-pane textarea[readonly]{background:#f8fafc}
        .tc-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 19px;border-top:1px solid var(--border-light)}.tc-stats{display:flex;flex-wrap:wrap;gap:7px}.tc-stats span{padding:6px 9px;border-radius:999px;background:var(--bg-section);color:var(--text-secondary);font-size:.74rem;font-weight:750}.tc-note{margin:0;padding:11px 14px;border-radius:9px;background:#ecfdf5;color:#064e3b;font-size:.83rem}
        .tc-links{display:flex;flex-wrap:wrap;gap:8px}.tc-links a{padding:8px 11px;border:1px solid var(--border-light);border-radius:999px;color:var(--text-secondary);font-size:.76rem;font-weight:750;text-decoration:none}
        @media(max-width:900px){.tc-workspace{grid-template-columns:1fr}.tc-pane{border-right:0;border-bottom:1px solid var(--border-light)}.tc-pane textarea{min-height:230px}}
        @media(max-width:560px){.tc-head{padding:20px;flex-direction:column}.tc-metric{align-self:flex-start}.tc-pane header{align-items:stretch;flex-direction:column;gap:9px}.tc-actions{display:grid;grid-template-columns:1fr 1fr}.tc-footer{align-items:stretch;flex-direction:column}}
      `}</style>

      <div className="tc-shell">
        <div className="tc-head">
          <div>
            <span>Format & Clean</span>
            <h2>Remove Extra Spaces Online</h2>
            <p>Clean up messy text formatting by removing double spaces, trailing spaces, and unwanted tabs. Perfect for cleaning up OCR text, PDFs, or code blocks.</p>
          </div>
          <div className="tc-metric">
            <strong>{stats.spacesRemoved.toLocaleString()}</strong>
            <small>spaces removed</small>
          </div>
        </div>

        <div className="tc-options">
          <label title="Keep leading spaces at the start of a line (useful for code)">
            <input type="checkbox" checked={preserveIndentation} onChange={e => setPreserveIndentation(e.target.checked)} /> 
            Preserve Line Indentation
          </label>
          <label title="Replace multiple consecutive spaces with a single space">
            <input type="checkbox" checked={collapseSpaces} onChange={e => setCollapseSpaces(e.target.checked)} /> 
            Collapse Double Spaces
          </label>
          <label title="Replace tab characters with spaces before cleaning">
            <input type="checkbox" checked={removeTabs} onChange={e => setRemoveTabs(e.target.checked)} /> 
            Convert Tabs to Spaces
          </label>
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
            <textarea value={input} onChange={e => updateInput(e.target.value)} placeholder="Paste text with messy spacing here..." aria-label="Text to clean" spellCheck="false" />
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
            <span>{stats.inputChars} Input Chars</span>
            <span>{stats.outputChars} Output Chars</span>
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
