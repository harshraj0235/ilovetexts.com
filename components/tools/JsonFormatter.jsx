'use client';

import { useMemo, useState } from 'react';
import JsonView from '@uiw/react-json-view';
import { jsonrepair } from 'jsonrepair';
import { JSONPath } from 'jsonpath-plus';
import styles from './JsonFormatter.module.css';

const SAMPLE_JSON = `{
  "project": "Launch checklist",
  "owner": "Avery",
  "published": false,
  "tasks": [
    { "id": 1, "title": "Write the brief", "done": true },
    { "id": 2, "title": "Review accessibility", "done": false }
  ]
}`;

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = sortJson(value[key]);
      return result;
    }, {});
  }
  return value;
}

function getLocation(message, value) {
  const positionMatch = message.match(/position\s+(\d+)/i);
  if (!positionMatch) return '';
  const position = Number(positionMatch[1]);
  const before = value.slice(0, position);
  const line = before.split('\n').length;
  const column = position - before.lastIndexOf('\n');
  return `Line ${line}, column ${column}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState('tree');
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [jsonPathQuery, setJsonPathQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const analysis = useMemo(() => {
    if (!input.trim()) return { json: null, isValid: false, error: null, location: '' };
    try {
      return { json: JSON.parse(input), isValid: true, error: null, location: '' };
    } catch (error) {
      return { json: null, isValid: false, error: error.message, location: getLocation(error.message, input) };
    }
  }, [input]);

  const filtered = useMemo(() => {
    if (!analysis.isValid) return { value: null, error: '' };
    if (!jsonPathQuery.trim()) return { value: analysis.json, error: '' };
    try {
      return { value: JSONPath({ path: jsonPathQuery, json: analysis.json }), error: '' };
    } catch (error) {
      return { value: analysis.json, error: `JSONPath: ${error.message}` };
    }
  }, [analysis.isValid, analysis.json, jsonPathQuery]);

  const outputValue = useMemo(() => (
    sortKeys ? sortJson(filtered.value) : filtered.value
  ), [filtered.value, sortKeys]);

  const outputText = useMemo(() => {
    if (!analysis.isValid) return '';
    return JSON.stringify(outputValue, null, viewMode === 'minified' ? 0 : indent);
  }, [analysis.isValid, indent, outputValue, viewMode]);

  const valid = analysis.isValid;
  const setMessage = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const replaceWithFormatted = (nextValue = analysis.json) => {
    if (!valid) return;
    setInput(JSON.stringify(sortKeys ? sortJson(nextValue) : nextValue, null, indent));
    setMessage('JSON formatted');
  };

  const handlePaste = async () => {
    try {
      setInput(await navigator.clipboard.readText());
      setMessage('Pasted from clipboard');
    } catch {
      setMessage('Clipboard access was not available');
    }
  };

  const handleAutoFix = () => {
    try {
      const repaired = JSON.parse(jsonrepair(input));
      setInput(JSON.stringify(repaired, null, indent));
      setMessage('Repaired and formatted JSON');
    } catch {
      setMessage('Could not safely repair this JSON');
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setMessage('Output copied');
    } catch {
      setMessage('Copy failed — select the output and copy it manually');
    }
  };

  const handleDownload = () => {
    if (!outputText) return;
    const url = URL.createObjectURL(new Blob([outputText], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'formatted.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Download started');
  };

  const loadFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Please choose a JSON file smaller than 5 MB');
      return;
    }
    setInput(await file.text());
    setMessage(`Loaded ${file.name}`);
  };

  return (
    <section className={styles.shell} aria-label="JSON formatter workspace">
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Private browser workspace</p>
          <h2>Format, validate, search, and export JSON</h2>
          <p>Your JSON stays in this browser. Paste text or drop a file to start.</p>
        </div>
        <div className={styles.status} aria-live="polite">
          <span className={`${styles.statusDot} ${valid ? styles.valid : input ? styles.invalid : ''}`} />
          {valid ? 'Valid JSON' : input ? 'Needs attention' : 'Waiting for JSON'}
        </div>
      </div>

      {notice && <p className={styles.notice} role="status">{notice}</p>}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Source</h3>
              <p>{formatBytes(new Blob([input]).size)} · {input.split('\n').length} lines</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => setInput(SAMPLE_JSON)}>Sample</button>
              <button type="button" className="btn btn-secondary" onClick={handlePaste}>Paste</button>
              <label className="btn btn-secondary">
                Open file
                <input type="file" accept="application/json,.json" onChange={(event) => loadFile(event.target.files?.[0])} />
              </label>
              <button type="button" className="btn btn-secondary" onClick={() => setInput('')} disabled={!input}>Clear</button>
            </div>
          </div>

          <div
            className={`${styles.editorWrap} ${isDragging ? styles.dragging : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files?.[0]); }}
          >
            <textarea
              className={styles.editor}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={'Paste JSON here…\n\nTip: Drop a .json file anywhere in this editor.'}
              spellCheck="false"
              aria-label="JSON source"
            />
            {isDragging && <span className={styles.dropHint}>Drop JSON file to open</span>}
          </div>

          {analysis.error && (
            <div className={styles.error} role="alert">
              <div><strong>Invalid JSON</strong>{analysis.location && <span>{analysis.location}</span>}</div>
              <code>{analysis.error}</code>
              <button type="button" className="btn btn-primary" onClick={handleAutoFix}>Try safe auto-fix</button>
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Result</h3>
              <p>{valid ? 'Live preview updates as you type' : 'A valid result will appear here'}</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => replaceWithFormatted()} disabled={!valid}>Format source</button>
              <button type="button" className="btn btn-secondary" onClick={() => { if (valid) { setInput(JSON.stringify(analysis.json)); setMessage('Source minified'); } }} disabled={!valid}>Minify source</button>
              <button type="button" className="btn btn-secondary" onClick={handleCopy} disabled={!valid}>Copy</button>
              <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={!valid}>Download</button>
            </div>
          </div>

          <div className={styles.controls}>
            <label>
              JSONPath query
              <input value={jsonPathQuery} onChange={(event) => setJsonPathQuery(event.target.value)} placeholder="$.tasks[?(@.done === false)]" disabled={!valid} />
            </label>
            <label>
              Indentation
              <select value={indent} onChange={(event) => setIndent(Number(event.target.value))}>
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </label>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />
              Sort object keys
            </label>
          </div>
          {filtered.error && <p className={styles.queryError} role="alert">{filtered.error}</p>}

          <div className={styles.modeTabs} role="tablist" aria-label="Result display">
            {['tree', 'formatted', 'minified'].map((mode) => (
              <button key={mode} type="button" role="tab" aria-selected={viewMode === mode} className={viewMode === mode ? styles.activeTab : ''} onClick={() => setViewMode(mode)} disabled={!valid}>
                {mode === 'tree' ? 'Tree' : mode === 'formatted' ? 'Text' : 'Minified'}
              </button>
            ))}
          </div>

          <div className={styles.output} aria-live="polite">
            {!valid && <p className={styles.empty}>Paste valid JSON to see a clean, searchable result.</p>}
            {valid && viewMode === 'tree' && <JsonView value={outputValue} displayDataTypes={false} displayObjectSize={true} style={{ background: 'transparent' }} />}
            {valid && viewMode !== 'tree' && <pre>{outputText}</pre>}
          </div>
        </div>
      </div>
    </section>
  );
}
