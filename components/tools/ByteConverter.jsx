'use client';

import Link from 'next/link';
import { useDeferredValue, useId, useMemo, useRef, useState } from 'react';
import { BYTE_TOOLS } from '@/lib/byte-tool-config.mjs';
import { BYTE_FORMATS, MAX_TEXT_BYTES, MAX_ENCODED_LENGTH, encodeText, parseBytes, decodeBytes, formatBytes, inspectCharacters, byteReportCsv } from '@/lib/byte-converter.mjs';
import styles from './ByteConverter.module.css';

function download(content, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ByteConverter({ toolSlug = 'binary-text', lang = 'en' }) {
  const config = BYTE_TOOLS[toolSlug];
  const id = useId();
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const revision = useRef(0);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState(toolSlug === 'utf8-encode-decode' ? 'encode' : 'decode');
  const [encoding, setEncoding] = useState(config.encoding);
  const [separator, setSeparator] = useState('space');
  const [uppercase, setUppercase] = useState(true);
  const [prefix, setPrefix] = useState(false);
  const [columns, setColumns] = useState(0);
  const [notice, setNotice] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const deferredInput = useDeferredValue(input);
  const updating = input !== deferredInput || fileLoading;
  const isEncode = mode === 'encode';
  const options = useMemo(() => ({ separator, uppercase, prefix, columns }), [separator, uppercase, prefix, columns]);
  const result = useMemo(() => {
    try {
      const bytes = isEncode ? encodeText(deferredInput, encoding) : parseBytes(deferredInput, config.format);
      const text = isEncode ? deferredInput : decodeBytes(bytes, encoding);
      const output = isEncode ? formatBytes(bytes, config.format, options) : text;
      return { bytes, text, output, points: Array.from(text).length, rows: inspectCharacters(text), error: null };
    } catch (error) {
      return { bytes: new Uint8Array(), text: '', output: '', points: 0, rows: [], error };
    }
  }, [deferredInput, isEncode, encoding, config.format, options]);
  const ready = !updating && !result.error && result.bytes.length > 0;
  const exampleBytes = encodeText(config.exampleText);
  const lp = path => lang === 'en' ? path : `/${lang}${path}`;

  function changeInput(value) {
    revision.current += 1;
    setFileLoading(false);
    setNotice('');
    setInput(value);
  }

  function changeMode(next) {
    if (next === mode) return;
    // Keep the user's current work. Use the explicit swap button to transfer
    // a successful result to the other direction.
    revision.current += 1;
    setFileLoading(false);
    setMode(next);
    setNotice(input ? 'Direction changed. Use Swap result to carry a completed conversion across.' : '');
  }

  function loadSample(unicode = false) {
    const sample = unicode ? config.unicodeSample : config.sample;
    const selectedEncoding = unicode ? 'utf8' : encoding;
    if (unicode) setEncoding('utf8');
    changeInput(isEncode ? sample : formatBytes(encodeText(sample, selectedEncoding), config.format, options));
  }

  async function paste() {
    const ticket = ++revision.current;
    try {
      const value = await navigator.clipboard.readText();
      if (ticket === revision.current) changeInput(value);
    } catch {
      setNotice('Paste is unavailable here. Select the input and use Ctrl+V or your device’s paste menu.');
      inputRef.current?.focus();
    }
  }

  async function readFile(file) {
    if (!file) return;
    const max = isEncode ? MAX_TEXT_BYTES : MAX_ENCODED_LENGTH;
    if (file.size > max) {
      setNotice(`This file is too large. Choose a UTF-8 text file up to ${isEncode ? '128 KiB' : '2 MiB'}.`);
      return;
    }
    const ticket = ++revision.current;
    setFileLoading(true);
    setNotice('Reading file on this device…');
    try {
      const buffer = await file.arrayBuffer();
      const value = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer);
      if (ticket !== revision.current) return;
      setInput(value);
      setNotice(`Opened ${file.name}. File contents stay in this browser.`);
    } catch {
      if (ticket === revision.current) setNotice('Could not read that file as UTF-8 text. Export it as UTF-8 .txt and try again.');
    } finally {
      if (ticket === revision.current) setFileLoading(false);
    }
  }

  async function copy(value = result.output) {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Copied. Ready for your next step.');
    } catch {
      setNotice('Clipboard access is unavailable. Select the result and copy it manually.');
    }
  }

  function swap() {
    if (!ready) return;
    changeInput(result.output);
    setMode(isEncode ? 'decode' : 'encode');
    setNotice('Result moved to the input and direction reversed.');
  }

  function focusProblem() {
    inputRef.current?.focus();
    if (Number.isInteger(result.error?.start)) inputRef.current?.setSelectionRange(result.error.start, result.error.end);
  }

  function shortcut(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'Enter') { event.preventDefault(); copy(); }
    if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (ready) download(result.output, `${toolSlug}-${isEncode ? 'bytes' : 'text'}.txt`);
    }
  }

  return (
    <section className={styles.shell} style={{ '--byte-accent': config.color }} aria-label={`${config.label} converter`} onKeyDown={shortcut}>
      <header className={styles.intro}>
        <div className={styles.introText}>
          <p className={styles.eyebrow}>THE BYTE STUDIO <span>/ {config.label}</span></p>
          <h2>{config.heading}</h2>
          <p>{config.intro}</p>
          <div className={styles.badges}><span>↔ Both directions</span><span>✓ No uploads</span><span>✓ No account</span></div>
        </div>
        <div className={styles.art} aria-hidden="true"><span>{config.mark}</span><small>TEXT ↔ BYTES</small></div>
      </header>

      <div className={styles.controlBar}>
        <div className={styles.direction} role="group" aria-label="Conversion direction">
          <button type="button" aria-pressed={isEncode} onClick={() => changeMode('encode')}>{config.encodeLabel}</button>
          <button type="button" aria-pressed={!isEncode} onClick={() => changeMode('decode')}>{config.decodeLabel}</button>
        </div>
        <label className={styles.encoding}>Character encoding
          <select value={encoding} onChange={e => setEncoding(e.target.value)} disabled={toolSlug === 'utf8-encode-decode'}>
            <option value="utf8">UTF-8 · all languages</option><option value="ascii">ASCII · codes 0–127</option>
          </select>
        </label>
      </div>

      <div className={styles.editors}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <label htmlFor={`${id}-input`}><span className={styles.step}>1</span>{isEncode ? 'Your text' : `${config.label === 'ASCII' ? 'Decimal' : config.format === 'hex' ? 'Hex' : config.label} bytes`}</label>
            <div className={styles.actions}><button type="button" onClick={paste}>Paste</button><button type="button" onClick={() => fileRef.current?.click()}>Open file</button><button type="button" onClick={() => changeInput('')} disabled={!input}>Clear</button></div>
          </div>
          <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={e => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
          <div className={`${styles.editorWrap} ${dragging ? styles.dragging : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}>
            <textarea id={`${id}-input`} ref={inputRef} className={styles.editor} value={input} onChange={e => changeInput(e.target.value)}
              placeholder={isEncode ? `Type something here…\n\nTry: ${config.sample}` : `Paste ${config.format === 'decimal' ? 'decimal codes' : config.format + ' bytes'} here…\n\nTry: ${config.example}`}
              spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-invalid={Boolean(result.error && !updating)} aria-describedby={`${id}-hint${result.error && !updating ? ` ${id}-error` : ''}`} />
            {dragging && <div className={styles.dropHint}>Drop a UTF-8 text file here</div>}
          </div>
          <div className={styles.panelFoot}><span>Try an example</span><button type="button" onClick={() => loadSample()}>Simple text</button><button type="button" onClick={() => loadSample(true)}>Unicode + emoji</button></div>
        </div>

        <div className={`${styles.panel} ${styles.resultPanel}`} aria-busy={updating}>
          <div className={styles.panelHead}>
            <label htmlFor={`${id}-output`}><span className={styles.step}>2</span>{isEncode ? `${config.label === 'ASCII' ? 'Decimal codes' : config.label + ' result'}` : 'Decoded text'}</label>
            <button className={styles.copy} type="button" onClick={() => copy()} disabled={!ready}>Copy result</button>
          </div>
          <textarea id={`${id}-output`} className={styles.editor} readOnly value={updating ? '' : result.output} placeholder={updating ? 'Updating your result…' : result.error ? 'Fix the input to see a result.' : 'Your result appears here as you type.'} spellCheck={false} />
          <div className={styles.panelFoot}><button type="button" onClick={swap} disabled={!ready}>⇄ Swap result</button><button type="button" disabled={!ready} onClick={() => download(result.output, `${toolSlug}-${isEncode ? 'bytes' : 'text'}.txt`)}>Download .txt</button><span className={styles.live}>{updating ? 'Updating…' : result.error ? 'Check input' : ready ? '✓ Converted' : 'Ready when you are'}</span></div>
        </div>
      </div>

      <p id={`${id}-hint`} className={styles.hint}>{isEncode ? 'Spaces, line breaks, and Unicode are preserved. Text input supports up to 128 KiB of bytes.' : config.hint}</p>
      {result.error && !updating && <div id={`${id}-error`} className={styles.error} role="alert"><div><strong>Let’s fix this input</strong><p>{result.error.message}</p></div><button type="button" onClick={focusProblem}>Show problem</button></div>}
      <p className={styles.notice} role="status" aria-live="polite">{notice}</p>

      <details className={styles.options}>
        <summary>Formatting & export options <span>Make the result fit your workflow</span></summary>
        <div className={styles.optionGrid}>
          <label>Byte separator<select value={separator} onChange={e => setSeparator(e.target.value)}><option value="space">Spaces</option><option value="comma">Commas</option><option value="newline">One byte per line</option>{config.format !== 'decimal' && <option value="compact">None · compact</option>}</select></label>
          <label>Wrap byte rows<select value={columns} disabled={separator === 'newline' || separator === 'compact'} onChange={e => setColumns(Number(e.target.value))}><option value={0}>No row wrapping</option><option value={8}>8 bytes per row</option><option value={16}>16 bytes per row</option><option value={32}>32 bytes per row</option></select></label>
          {config.format !== 'decimal' && <label className={styles.checkbox}><input type="checkbox" checked={prefix} disabled={separator === 'compact'} onChange={e => setPrefix(e.target.checked)} />Add {BYTE_FORMATS[config.format].prefix} to each byte</label>}
          {config.format === 'hex' && <label className={styles.checkbox}><input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} />Uppercase hex letters</label>}
        </div>
        <p>Formatting changes encoded output. Decoding accepts the input formats listed above. Compact output uses full-width bytes without prefixes.</p>
        <div className={styles.exportRow}><button type="button" disabled={!ready} onClick={() => download(result.bytes, `${toolSlug}.bin`, 'application/octet-stream')}>Download raw bytes (.bin)</button><button type="button" disabled={!ready} onClick={() => download(byteReportCsv(result.bytes), `${toolSlug}-byte-report.csv`, 'text/csv;charset=utf-8')}>Export byte report (.csv)</button><span>Shortcuts in this tool: Ctrl/⌘+Enter to copy · Ctrl/⌘+S to download</span></div>
      </details>

      <div className={styles.stats} aria-label="Conversion statistics"><div><strong>{updating ? '…' : result.points.toLocaleString('en-US')}</strong><span>Unicode code points</span></div><div><strong>{updating ? '…' : result.bytes.length.toLocaleString('en-US')}</strong><span>{encoding === 'ascii' ? 'ASCII' : 'UTF-8'} bytes</span></div><div><strong>{updating ? '…' : (result.bytes.length * 8).toLocaleString('en-US')}</strong><span>Bits of data</span></div><div><strong>{encoding === 'ascii' ? '0–127' : '1–4'}</strong><span>{encoding === 'ascii' ? 'Allowed ASCII codes' : 'Bytes per code point'}</span></div></div>

      <section className={styles.inspector} aria-label="Character inspector">
        <div className={styles.inspectorHead}><div><p className={styles.eyebrow}>UNDERSTAND THE RESULT</p><h3>Every character, explained.</h3><p>Code points identify characters. The columns show the bytes used to store them.</p></div><span>{ready ? `${Math.min(result.points, 120)} of ${result.points} code points` : 'Example: ' + config.exampleText}</span></div>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Character bytes table, scroll horizontally for all formats">
          <table><caption className={styles.srOnly}>Characters with their Unicode code point, byte offset, and binary, hex, decimal, and octal bytes</caption><thead><tr><th scope="col">Character</th><th scope="col">Code point</th><th scope="col">Byte offset</th><th scope="col">Hex</th><th scope="col">Binary</th><th scope="col">Decimal</th><th scope="col">Octal</th></tr></thead><tbody>{(ready ? result.rows : inspectCharacters(config.exampleText)).map((row, index) => <tr key={index}><th scope="row"><span className={styles.character}>{row.label}</span></th><td>{row.codePoint}</td><td>{row.offset}</td><td>{row.hex}</td><td>{row.binary}</td><td>{row.decimal}</td><td>{row.octal}</td></tr>)}</tbody></table>
        </div>
        <p className={styles.tableNote}>Offsets start at 0. The table shows up to 120 code points; byte-report downloads include every byte. Combining marks and joined emoji can contain several code points.</p>
      </section>

      <div className={styles.learning}><div><span className={styles.lessonIcon} aria-hidden="true">{config.mark}</span><h3>A small detail that makes a big difference</h3><p>{config.tip}</p></div><div className={styles.exampleCard}><span>Try it yourself</span><code>{config.example}</code><strong>↓ {config.exampleText}</strong><button type="button" onClick={() => { setEncoding('utf8'); setMode('decode'); changeInput(formatBytes(exampleBytes, config.format)); }}>Decode this example →</button></div></div>
      <nav className={styles.related} aria-label="Related byte converters"><span>Keep exploring</span>{Object.entries(BYTE_TOOLS).filter(([slug]) => slug !== toolSlug).map(([slug, tool]) => <Link key={slug} href={lp(`/text-encoder-decoder/${slug}`)}>{tool.label} converter <span aria-hidden="true">↗</span></Link>)}</nav>
      <noscript>This tool needs JavaScript for local conversion. The examples and instructions below remain available without it.</noscript>
    </section>
  );
}
