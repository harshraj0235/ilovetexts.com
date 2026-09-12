'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { ALPHABET_TOOLS, referenceRows, translateAlphabet } from '@/lib/alphabet-translator.mjs';
import styles from './AlphabetTranslator.module.css';

function downloadText(text, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export default function AlphabetTranslator({ toolSlug }) {
  const config = ALPHABET_TOOLS[toolSlug];
  const [direction, setDirection] = useState('encode');
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [allReference, setAllReference] = useState(false);
  const inputId = useId();
  const outputId = useId();
  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => translateAlphabet(toolSlug, deferredInput, direction), [toolSlug, deferredInput, direction]);
  const rows = useMemo(() => referenceRows(toolSlug), [toolSlug]);
  const canSwitch = toolSlug !== 'rot13';
  const isEncoding = direction === 'encode';
  const inputLabel = isEncoding ? config.inputLabel : config.outputLabel;
  const outputLabel = isEncoding ? config.outputLabel : config.inputLabel;
  const encodeButton = toolSlug === 'braille-translator' ? 'Text to Braille'
    : toolSlug === 'nato-phonetic-translator' ? 'Text to NATO'
      : 'Text to symbols';
  const directionLabel = toolSlug === 'braille-translator'
    ? (isEncoding ? 'Text to Grade 1 Braille' : 'Grade 1 Braille to text')
    : toolSlug === 'nato-phonetic-translator'
      ? (isEncoding ? 'Text to NATO words' : 'NATO words to text')
      : toolSlug === 'wingdings-translator'
        ? (isEncoding ? 'Text to symbols' : 'Symbols to text')
        : 'Apply ROT13';

  const copyResult = async () => {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setNotice('Copied to clipboard.');
    } catch {
      setNotice('Copy was blocked by the browser. Select the result and copy it manually.');
    }
  };

  const swap = () => {
    if (!result.output || !canSwitch) return;
    setInput(result.output);
    setDirection((current) => current === 'encode' ? 'decode' : 'encode');
    setNotice('Result moved to the other direction.');
  };

  return (
    <section className={styles.studio} style={{ '--alphabet-accent': config.color }} aria-label={`${config.label} translator`}>
      <div className={styles.topline}>
        <span className={styles.eyebrow}>THE LANGUAGE STUDIO / {config.label}</span>
        <span className={styles.local}>◉ Local processing</span>
      </div>
      <h2>{config.heading}</h2>
      <p className={styles.intro}>{config.intro}</p>

      {canSwitch && (
        <div className={styles.direction} aria-label={config.modeLabel}>
          <button className={isEncoding ? styles.active : ''} onClick={() => setDirection('encode')} type="button">{encodeButton}</button>
          <button className={!isEncoding ? styles.active : ''} onClick={() => setDirection('decode')} type="button">
            {toolSlug === 'braille-translator' ? 'Braille to text' : toolSlug === 'nato-phonetic-translator' ? 'NATO to text' : 'Symbols to text'}
          </button>
        </div>
      )}

      <div className={styles.workspace}>
        <div className={styles.editor}>
          <div className={styles.editorHead}>
            <label htmlFor={inputId}>1&nbsp; {inputLabel}</label>
            <div className={styles.actions}>
              <button type="button" onClick={() => { setInput(config.sample); setDirection('encode'); setNotice('Example loaded.'); }}>Try example</button>
              <button type="button" onClick={() => { setInput(''); setNotice(''); }} disabled={!input}>Clear</button>
            </div>
          </div>
          <textarea id={inputId} value={input} onChange={(event) => setInput(event.target.value)} placeholder={isEncoding ? `Type or paste ${config.inputLabel.toLowerCase()}…` : `Paste ${config.outputLabel.toLowerCase()}…`} spellCheck={false} />
          <div className={styles.meta}><span>{[...input].length.toLocaleString()} characters</span><span>{directionLabel}</span></div>
        </div>

        <div className={styles.arrow} aria-hidden="true">→</div>

        <div className={styles.editor}>
          <div className={styles.editorHead}>
            <label htmlFor={outputId}>2&nbsp; {outputLabel}</label>
            <div className={styles.actions}>
              <button type="button" onClick={copyResult} disabled={!result.output}>Copy</button>
              <button type="button" onClick={() => result.output && downloadText(result.output, `${toolSlug}-${direction}.txt`)} disabled={!result.output}>Download</button>
            </div>
          </div>
          <textarea id={outputId} value={result.output} readOnly placeholder="Your result appears here." spellCheck={false} />
          <div className={styles.meta}><span>{[...result.output].length.toLocaleString()} characters</span>{canSwitch && <button type="button" onClick={swap} disabled={!result.output}>⇄ Use as input</button>}</div>
        </div>
      </div>

      {toolSlug === 'wingdings-translator' && isEncoding && input && (
        <div className={styles.fontTip}><strong>For Microsoft Word or PowerPoint:</strong> copy your original plain text, choose the Wingdings font there, and keep this preview for a portable Unicode-style version.</div>
      )}
      {(notice || result.warnings.length > 0) && <div className={styles.feedback} role="status">{notice || result.warnings[0]}{result.warnings.length > 1 ? ` +${result.warnings.length - 1} more` : ''}</div>}
      <p className={styles.helper}>{config.helper}</p>

      <div className={styles.reference}>
        <div>
          <span className={styles.eyebrow}>QUICK REFERENCE</span>
          <h3>See the mapping before you send it.</h3>
        </div>
        <button type="button" onClick={() => setAllReference((show) => !show)}>{allReference ? 'Show fewer' : `Show all ${rows.length}`}</button>
      </div>
      <div className={styles.referenceGrid} aria-label={`${config.label} reference table`}>
        {rows.slice(0, allReference ? rows.length : 12).map((row) => (
          <div className={styles.referenceCell} key={`${row.from}-${row.to}`}>
            <b>{row.from}</b><span>{row.to}</span><small>{row.note}</small>
          </div>
        ))}
      </div>
      <noscript>This translator needs JavaScript to convert text in your browser.</noscript>
    </section>
  );
}
