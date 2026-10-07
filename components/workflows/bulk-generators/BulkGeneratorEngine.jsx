'use client';
import { useState, useCallback, useRef, useMemo } from 'react';
import s from './BulkGenerator.module.css';

/* ─────────────────────────────────────────────
   SHARED UTILITY: Parse Excel via SheetJS (xlsx)
   ───────────────────────────────────────────── */
async function parseExcel(file) {
  const XLSX = (await import('xlsx')).default;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

/* ─────────────────────────────────────────────
   SHARED UTILITY: Generate PDF via jsPDF
   ───────────────────────────────────────────── */
async function generatePDF(canvas) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/png');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(imgData, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h);
  return pdf.output('arraybuffer');
}

/* ─────────────────────────────────────────────
   SHARED UTILITY: Create ZIP of files
   ───────────────────────────────────────────── */
async function createZip(files) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  files.forEach(f => zip.file(f.name, f.data));
  return zip.generateAsync({ type: 'blob' });
}

/* ─────────────────────────────────────────────
   MISSING DATA CHECK
   ───────────────────────────────────────────── */
function validateRows(rows, requiredFields) {
  const issues = [];
  rows.forEach((row, idx) => {
    requiredFields.forEach(f => {
      const val = row[f.mappedTo];
      if (val === undefined || val === null || String(val).trim() === '') {
        issues.push({ row: idx + 1, field: f.label, column: f.mappedTo });
      }
    });
  });
  return issues;
}

/* ═══════════════════════════════════════════════════════════
   MAIN BULK GENERATOR ENGINE — PREMIUM UI v2
   ═══════════════════════════════════════════════════════════ */
export default function BulkGeneratorEngine({
  toolName,
  toolIcon,
  toolDescription,
  requiredFields = [],
  optionalFields = [],
  renderPreview,
  renderCard,
  sampleData = [],
  templateSettings: defaultTemplateSettings = {},
  templateEditor: TemplateEditor = null,
  maxRows = 500,
  filePrefix = 'output',
}) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [issues, setIssues] = useState([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [templateSettings, setTemplateSettings] = useState(defaultTemplateSettings);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const allFields = useMemo(() => [...requiredFields, ...optionalFields], [requiredFields, optionalFields]);
  const requiredMapped = useMemo(() => requiredFields.filter(f => f.required !== false), [requiredFields]);

  /* ── UPLOAD ────────────────────────────── */
  const handleFile = useCallback(async (f) => {
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10 MB.');
      return;
    }
    try {
      setFile(f);
      const { headers: h, rows: r } = await parseExcel(f);
      if (r.length === 0) { setError('The file is empty — no data rows found.'); return; }
      if (r.length > maxRows) { setError(`Too many rows (${r.length}). Maximum ${maxRows} rows.`); return; }
      setHeaders(h);
      setRows(r);
      const auto = {};
      allFields.forEach(field => {
        const match = h.find(col => col.toLowerCase().replace(/[_\s]/g, '') === field.key.toLowerCase().replace(/[_\s]/g, ''));
        if (match) auto[field.key] = match;
      });
      setMapping(auto);
      setStep(1);
    } catch (e) {
      setError('Could not parse file. Ensure it is a valid Excel or CSV.');
    }
  }, [allFields, maxRows]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  /* ── MAPPING ───────────────────────────── */
  const updateMapping = (fieldKey, headerCol) => {
    setMapping(prev => ({ ...prev, [fieldKey]: headerCol }));
  };

  const canProceedToValidate = requiredMapped.every(f => mapping[f.key]);

  const runValidation = () => {
    const mapped = requiredMapped.map(f => ({ ...f, mappedTo: mapping[f.key] }));
    const found = validateRows(rows, mapped);
    setIssues(found);
    setStep(2);
  };

  /* ── PREVIEW ───────────────────────────── */
  const getMappedRow = (row) => {
    const out = {};
    allFields.forEach(f => {
      out[f.key] = row[mapping[f.key]] ?? '';
    });
    return out;
  };

  /* ── GENERATE ──────────────────────────── */
  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    setProgress(0);
    setStep(4);
    try {
      const files = [];
      for (let i = 0; i < rows.length; i++) {
        const mappedRow = getMappedRow(rows[i]);
        const canvas = await renderPreview(mappedRow, mapping, templateSettings, i);
        const pdfBytes = await generatePDF(canvas);
        const safeName = String(mappedRow[requiredFields[0]?.key] || `item-${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        files.push({
          name: `${filePrefix}_${String(i + 1).padStart(3, '0')}_${safeName}.pdf`,
          data: pdfBytes,
        });
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }
      const blob = await createZip(files);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filePrefix}_${rows.length}_files.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(`Generation failed: ${e.message}`);
    }
    setGenerating(false);
  };

  /* ── DOWNLOAD SAMPLE ───────────────────── */
  const downloadSample = async () => {
    const XLSX = (await import('xlsx')).default;
    const ws = XLSX.utils.json_to_sheet(sampleData.length ? sampleData : [
      allFields.reduce((o, f) => { o[f.label] = f.sample || ''; return o; }, {})
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, `${filePrefix}_sample.xlsx`);
  };

  /* ── RESET ─────────────────────────────── */
  const resetAll = () => {
    setStep(0); setFile(null); setRows([]); setHeaders([]); setMapping({});
    setIssues([]); setPreviewIdx(0); setDone(false); setProgress(0); setError('');
  };

  /* ── STEP INDICATOR ─────────────────────── */
  const steps = [
    { label: 'Upload', icon: '📂' },
    { label: 'Map Columns', icon: '🔗' },
    { label: 'Validate', icon: '✅' },
    { label: 'Preview', icon: '👁️' },
    { label: 'Download', icon: '📦' },
  ];

  const mappedCount = allFields.filter(f => mapping[f.key]).length;

  return (
    <div className={s.engine}>
      {/* ── Progress Steps ── */}
      <nav className={s.stepsBar} aria-label="Generation progress">
        {steps.map((st, i) => (
          <button
            key={i}
            className={`${s.stepDot} ${i === step ? s.stepActive : ''} ${i < step ? s.stepDone : ''}`}
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className={s.stepNum}>{i < step ? '✓' : i + 1}</span>
            <span className={s.stepLabel}>{st.label}</span>
          </button>
        ))}
      </nav>

      {error && (
        <div className={s.errorBanner} role="alert">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* ════════════════════════════════════════
         STEP 0: UPLOAD
         ════════════════════════════════════════ */}
      {step === 0 && (
        <div className={s.uploadStep}>
          <div
            className={`${s.dropzone} ${dragOver ? s.dropzoneActive : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload your Excel or CSV file"
          >
            <div className={s.dropIcon}>{toolIcon || '📄'}</div>
            <h3>Drop your Excel or CSV here</h3>
            <p>or click to browse — .xlsx, .xls, .csv supported (up to {maxRows} rows)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => handleFile(e.target.files[0])}
              className={s.hiddenInput}
              aria-label="Choose file"
            />
          </div>

          <div className={s.uploadActions}>
            <button className={s.secondaryBtn} onClick={downloadSample}>
              ⬇ Download sample template
            </button>
          </div>

          <div className={s.featureGrid}>
            <div className={s.featureCard}>
              <span className={s.featureIcon}>🔒</span>
              <strong>100% Private & Secure</strong>
              <p>Everything runs in your browser. Your data never leaves your device — nothing is uploaded to any server.</p>
            </div>
            <div className={s.featureCard}>
              <span className={s.featureIcon}>⚡</span>
              <strong>Lightning-Fast Bulk Output</strong>
              <p>Generate hundreds of personalised PDFs from a single spreadsheet in just seconds.</p>
            </div>
            <div className={s.featureCard}>
              <span className={s.featureIcon}>📦</span>
              <strong>One-Click ZIP Download</strong>
              <p>Every file neatly named and packaged into one ZIP archive — ready to print or share.</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
         STEP 1: COLUMN MAPPING
         ════════════════════════════════════════ */}
      {step === 1 && (
        <div className={s.mapStep}>
          <div className={s.mapHeader}>
            <div>
              <h3>Map your spreadsheet columns</h3>
              <p>
                Found <strong>{rows.length}</strong> rows and <strong>{headers.length}</strong> columns in <em>{file?.name}</em>.
                {mappedCount > 0 && <> — <strong>{mappedCount}</strong> of {allFields.length} fields mapped</>}
              </p>
            </div>
            <span className={s.rowBadge}>📊 {rows.length} rows</span>
          </div>

          <div className={s.mapGrid}>
            {allFields.map(field => (
              <label key={field.key} className={s.mapField}>
                <span>
                  {field.label}
                  {field.required !== false && <span className={s.reqStar}>*</span>}
                  {mapping[field.key] && <span style={{ color: 'var(--success)', marginLeft: 4 }}>✓</span>}
                </span>
                <select
                  value={mapping[field.key] || ''}
                  onChange={e => updateMapping(field.key, e.target.value)}
                >
                  <option value="">— Select column —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>

          {/* Data Preview Table */}
          <div className={s.dataPreview}>
            <h4>📋 Data preview — first 5 rows</h4>
            <div className={s.tableWrap}>
              <table className={s.previewTable}>
                <thead>
                  <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>{headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={s.stepActions}>
            <button className={s.secondaryBtn} onClick={resetAll}>← Start Over</button>
            <button className={s.primaryBtn} onClick={runValidation} disabled={!canProceedToValidate}>
              Validate Data →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
         STEP 2: VALIDATE
         ════════════════════════════════════════ */}
      {step === 2 && (
        <div className={s.validateStep}>
          <div className={s.validateHeader}>
            {issues.length === 0 ? (
              <div className={s.validatePass}>
                <span>🎉</span>
                <div>
                  <strong>Perfect! All data looks great.</strong>
                  <p>{rows.length} rows validated — every required field is filled. You are ready to preview and generate.</p>
                </div>
              </div>
            ) : (
              <div className={s.validateWarn}>
                <span>⚠️</span>
                <div>
                  <strong>{issues.length} missing value{issues.length > 1 ? 's' : ''} detected</strong>
                  <p>Some rows have empty required fields. You can still proceed — empty fields will appear blank in the output.</p>
                </div>
              </div>
            )}
          </div>

          {issues.length > 0 && (
            <div className={s.issueList}>
              <h4>Missing data details</h4>
              <div className={s.tableWrap}>
                <table className={s.previewTable}>
                  <thead><tr><th>Row #</th><th>Missing Field</th><th>Mapped Column</th></tr></thead>
                  <tbody>
                    {issues.slice(0, 50).map((iss, i) => (
                      <tr key={i}>
                        <td><strong>{iss.row}</strong></td>
                        <td>{iss.field}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{iss.column}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {issues.length > 50 && <p className={s.muted}>Showing first 50 of {issues.length} issues.</p>}
            </div>
          )}

          <div className={s.stepActions}>
            <button className={s.secondaryBtn} onClick={() => setStep(1)}>← Fix Mapping</button>
            <button className={s.primaryBtn} onClick={() => setStep(3)}>
              Preview & Customise →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
         STEP 3: PREVIEW & TEMPLATE EDITOR
         ════════════════════════════════════════ */}
      {step === 3 && (
        <div className={s.previewStep}>
          <div className={s.previewLayout}>
            {/* Template Settings Panel */}
            {TemplateEditor && (
              <div className={s.templatePanel}>
                <h4>🎨 Design Settings</h4>
                <TemplateEditor settings={templateSettings} onChange={setTemplateSettings} />
              </div>
            )}

            {/* Preview Area */}
            <div className={s.previewPanel}>
              <div className={s.previewNav}>
                <button
                  disabled={previewIdx === 0}
                  onClick={() => setPreviewIdx(p => p - 1)}
                  className={s.secondaryBtn}
                >
                  ← Prev
                </button>
                <span className={s.previewCounter}>
                  Previewing <strong>{previewIdx + 1}</strong> of <strong>{rows.length}</strong>
                </span>
                <button
                  disabled={previewIdx >= rows.length - 1}
                  onClick={() => setPreviewIdx(p => p + 1)}
                  className={s.secondaryBtn}
                >
                  Next →
                </button>
              </div>

              <div className={s.previewCanvas}>
                {renderCard && renderCard(getMappedRow(rows[previewIdx]), mapping, templateSettings, previewIdx)}
              </div>

              <div className={s.previewJump}>
                <label>
                  Jump to row:
                  <input
                    type="number"
                    min={1}
                    max={rows.length}
                    value={previewIdx + 1}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      if (v >= 1 && v <= rows.length) setPreviewIdx(v - 1);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={s.stepActions}>
            <button className={s.secondaryBtn} onClick={() => setStep(2)}>← Back</button>
            <button className={s.generateBtn} onClick={handleGenerate}>
              🚀 Generate {rows.length} PDF{rows.length !== 1 ? 's' : ''} & Download ZIP
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
         STEP 4: GENERATING / DONE
         ════════════════════════════════════════ */}
      {step === 4 && (
        <div className={s.generateStep}>
          <div className={s.generateCard}>
            {generating ? (
              <>
                <div className={s.spinner} />
                <h3>Creating your files…</h3>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <p className={s.progressText}>
                  {progress}% complete — {Math.round(rows.length * progress / 100)} of {rows.length} files
                </p>
              </>
            ) : done ? (
              <>
                <div className={s.successIcon}>🎉</div>
                <h3>All done — your ZIP is ready!</h3>
                <p className={s.muted}>
                  {rows.length} PDF file{rows.length !== 1 ? 's' : ''} generated and downloaded as a ZIP archive.
                </p>
                <div className={s.stepActions} style={{ justifyContent: 'center' }}>
                  <button className={s.primaryBtn} onClick={handleGenerate}>⬇ Download Again</button>
                  <button className={s.secondaryBtn} onClick={() => setStep(3)}>← Edit & Preview</button>
                  <button className={s.secondaryBtn} onClick={resetAll}>🔄 New Batch</button>
                </div>
              </>
            ) : (
              <>
                <div className={s.successIcon}>⚠️</div>
                <h3>Something went wrong</h3>
                <p className={s.muted}>Please check the error message and try again.</p>
                <div className={s.stepActions} style={{ justifyContent: 'center' }}>
                  <button className={s.secondaryBtn} onClick={() => setStep(3)}>← Back to Preview</button>
                  <button className={s.primaryBtn} onClick={handleGenerate}>🔄 Retry</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
