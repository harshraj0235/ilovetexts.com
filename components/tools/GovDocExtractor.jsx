'use client';
import { useState, useRef, useCallback } from 'react';

const FIELD_PATTERNS = {
  name: [/(?:name|नाम)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{3,50})/gi],
  dob: [/(?:date of birth|d\.o\.b|dob|जन्म\s*तिथि)\s*[:\-]\s*([\d]{1,2}[-\/\.][\d]{1,2}[-\/\.][\d]{2,4})/gi],
  fatherName: [/(?:father'?s?\s*name|पिता\s*का\s*नाम|s\/o)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,50})/gi],
  address: [/(?:address|पता)\s*[:\-]\s*([A-Za-z0-9\u0900-\u097F\s,\-\.]{10,120})/gi],
  village: [/(?:village|gram|गाँव|गांव)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{2,40})/gi],
  district: [/(?:district|जिला|zila)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{2,40})/gi],
  state: [/(?:state|राज्य)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{2,30})/gi],
  pincode: [/\b(\d{6})\b/g],
  mobile: [/(?:mobile|phone|mob)\s*[:\-]?\s*(\+?91[-\s]?[6-9]\d{9}|\b[6-9]\d{9}\b)/gi],
  aadhaar: [/(?:aadhaar|aadhar|आधार)\s*(?:no|number)?\s*[:\-]?\s*(\d{4}\s?\d{4}\s?\d{4})/gi],
  pan: [/\b([A-Z]{5}\d{4}[A-Z])\b/g],
  certificateNo: [/(?:certificate\s*(?:no|number)|cert\s*no|ref\s*no|application\s*no)\s*[:\-]\s*([A-Za-z0-9\-\/]{3,30})/gi],
  income: [/(?:income|आय)\s*[:\-]\s*(?:rs\.?|₹)?\s*([\d,]{3,12})/gi],
  gender: [/(?:gender|sex|लिंग)\s*[:\-]\s*(male|female|other|पुरुष|महिला)/gi],
  age: [/(?:age|आयु)\s*[:\-]\s*(\d{1,3})\s*(?:years|yrs|वर्ष)?/gi],
};

const FIELD_LABELS = {
  name: 'Full Name', dob: 'Date of Birth', fatherName: "Father's Name",
  address: 'Address', village: 'Village/Gram', district: 'District', state: 'State',
  pincode: 'PIN Code', mobile: 'Mobile', aadhaar: 'Aadhaar No.', pan: 'PAN',
  certificateNo: 'Certificate/Ref No.', income: 'Income (₹)', gender: 'Gender', age: 'Age',
};

function extractFields(text) {
  const result = {};
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      const match = re.exec(text);
      if (match?.[1]) { result[field] = match[1].trim().replace(/\s+/g, ' ').slice(0, 100); break; }
    }
  }
  return result;
}

function detectDuplicates(records) {
  const seen = new Map();
  return records.map((rec, idx) => {
    const key = [rec.name, rec.dob, rec.aadhaar, rec.pan].filter(Boolean).join('|').toLowerCase();
    if (key && seen.has(key)) return { ...rec, _duplicate: true, _duplicateOf: seen.get(key) + 1 };
    if (key) seen.set(key, idx);
    return { ...rec, _duplicate: false };
  });
}

const S = {
  wrap: { maxWidth: 1200, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropzone: (over) => ({ border: `2px dashed ${over ? 'var(--highlight)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  progressBar: (pct) => ({ height: 5, borderRadius: 3, background: 'linear-gradient(90deg,#3b82f6,#7c3aed)', width: `${pct}%`, transition: 'width 0.3s' }),
  exBtn: (color) => ({ padding: '8px 12px', background: color, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }),
  checkbox: { accentColor: 'var(--highlight)', width: 14, height: 14, flexShrink: 0 },
  input: { width: '100%', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '5px 7px', fontSize: '0.78rem', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' },
  searchInput: { width: '100%', padding: '7px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
};

export default function GovDocExtractor({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [status, setStatus] = useState('idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFields, setSelectedFields] = useState(Object.keys(FIELD_LABELS));
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const fileRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png|webp|bmp)$/));
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
  };

  const processAll = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true); setStatus('processing'); setProgress(0);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const { file, id } = files[i];
      setProgressMsg(`Processing ${i + 1}/${files.length}: ${file.name}`);
      setProgress(Math.round((i / files.length) * 90));
      try {
        let text = '';
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          const ab = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
          for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            const pageText = content.items.map(it => it.str).join(' ');
            if (pageText.trim().length < 50) {
              const vp = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              canvas.width = vp.width; canvas.height = vp.height;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
              const Tesseract = await import('tesseract.js');
              const r = await Tesseract.recognize(canvas, 'eng+hin');
              text += r.data.text + '\n';
            } else text += pageText + '\n';
          }
        } else {
          const Tesseract = await import('tesseract.js');
          const r = await Tesseract.recognize(file, 'eng+hin');
          text = r.data.text;
        }
        results.push({ id, _fileName: file.name, ...extractFields(text) });
      } catch (err) { results.push({ id, _fileName: file.name, _error: err.message }); }
    }
    setRecords(detectDuplicates(results)); setProgress(100); setProcessing(false); setStatus('done'); setProgressMsg('');
  }, [files]);

  const updateRecord = (idx, field, value) => setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const removeRecord = (idx) => setRecords(prev => prev.filter((_, i) => i !== idx));

  const exportData = async (format) => {
    const rows = records.filter(r => !r._error);
    const { utils, writeFile } = await import('xlsx');
    const data = rows.map(r => {
      const row = {};
      selectedFields.forEach(f => { row[FIELD_LABELS[f] || f] = r[f] || ''; });
      row['Source File'] = r._fileName;
      if (r._duplicate) row['⚠️ Duplicate'] = `Duplicate of row ${r._duplicateOf}`;
      return row;
    });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Extracted Data');
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(rows.map(r => { const o = { sourceFile: r._fileName }; selectedFields.forEach(f => { if (r[f]) o[f] = r[f]; }); return o; }), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'extracted.json'; a.click();
    } else {
      writeFile(wb, `extracted.${format}`, { bookType: format });
    }
  };

  const filtered = records.filter(r => {
    if (showDuplicates && !r._duplicate) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(q));
  });

  const dupeCount = records.filter(r => r._duplicate).length;
  const successCount = records.filter(r => !r._error).length;

  return (
    <div style={S.wrap}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🔍 OCR for scanned forms', '📋 15 field types', '⚠️ Duplicate detection', '📊 Excel/CSV/JSON', '📦 Bulk 100 files', '🔒 100% private'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Gov promo */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🏛️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 3 }}>Built for Government Offices — Digitization Made Easy</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Data entry clerks, block development officers, panchayat staff — upload 100s of scanned application forms and get a structured Excel sheet in minutes instead of days.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        {/* Sidebar: Field selector */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={S.label}>Fields to Extract</div>
            <button onClick={() => setSelectedFields(prev => prev.length === Object.keys(FIELD_LABELS).length ? [] : Object.keys(FIELD_LABELS))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--highlight)', fontSize: '0.72rem', fontWeight: 600 }}>
              {selectedFields.length === Object.keys(FIELD_LABELS).length ? 'Clear' : 'All'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto' }}>
            {Object.entries(FIELD_LABELS).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 6px', borderRadius: 'var(--radius-sm)', background: selectedFields.includes(key) ? 'rgba(0,112,243,0.06)' : 'transparent' }}>
                <input type="checkbox" checked={selectedFields.includes(key)} style={S.checkbox}
                  onChange={e => setSelectedFields(prev => e.target.checked ? [...prev, key] : prev.filter(f => f !== key))} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Upload */}
          <div onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
            onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop PDFs and images — up to 100 files at once</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 14, fontSize: '0.85rem' }}>Application forms, certificates, beneficiary lists, survey documents</p>
            <button className="btn-primary" style={{ padding: '10px 24px', cursor: 'pointer' }} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Choose Files</button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} onChange={e=>addFiles(e.target.files)} />
          </div>

          {/* File list + process button */}
          {files.length > 0 && status !== 'done' && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>{files.length} file{files.length > 1 ? 's' : ''} ready</div>
                <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>Clear all</button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {files.map(({ file, id }) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 16 }}>{file.name.endsWith('.pdf') ? '📑' : '🖼️'}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{file.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{(file.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => setFiles(f => f.filter(x => x.id !== id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
              {processing && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <span>⚙️ {progressMsg}</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={S.progressBar(progress)} />
                  </div>
                </div>
              )}
              {!processing && (
                <button onClick={processAll} className="btn-primary" style={{ width: '100%', padding: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                  📊 Extract Data from {files.length} File{files.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {status === 'done' && records.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ padding: '5px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>✅ {successCount} extracted</span>
                  {dupeCount > 0 && (
                    <button onClick={() => setShowDuplicates(p => !p)}
                      style={{ padding: '5px 10px', background: showDuplicates ? '#ef4444' : '#fef2f2', border: `1px solid ${showDuplicates ? '#ef4444' : '#fca5a5'}`, borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 700, color: showDuplicates ? '#fff' : '#dc2626', cursor: 'pointer' }}>
                      ⚠️ {dupeCount} duplicate{dupeCount > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search records..."
                  style={{ ...S.searchInput, flex: 1, minWidth: 140, maxWidth: 260 }} />
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button onClick={() => exportData('xlsx')} style={S.exBtn('#2563eb')}>⬇️ Excel</button>
                  <button onClick={() => exportData('csv')} style={S.exBtn('#0891b2')}>⬇️ CSV</button>
                  <button onClick={() => exportData('json')} style={S.exBtn('#7c3aed')}>⬇️ JSON</button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>File</th>
                      {selectedFields.map(f => <th key={f} style={thStyle}>{FIELD_LABELS[f]}</th>)}
                      <th style={thStyle}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rec, idx) => (
                      <tr key={rec.id} style={{ background: rec._duplicate ? '#fef9c3' : rec._error ? '#fef2f2' : 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                        <td style={tdStyle}><span style={{ color: 'var(--text-tertiary)' }}>{idx + 1}</span></td>
                        <td style={tdStyle}>
                          <div style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec._fileName}>{rec._fileName}</div>
                          {rec._duplicate && <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>⚠️ Duplicate</div>}
                          {rec._error && <div style={{ fontSize: '0.68rem', color: '#dc2626' }}>❌ OCR failed</div>}
                        </td>
                        {selectedFields.map(f => (
                          <td key={f} style={tdStyle}>
                            {editingId === rec.id
                              ? <input value={rec[f] || ''} onChange={e => updateRecord(idx, f, e.target.value)} style={{ ...S.input, minWidth: 70 }} />
                              : <span style={{ color: rec[f] ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{rec[f] || '—'}</span>
                            }
                          </td>
                        ))}
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setEditingId(editingId === rec.id ? null : rec.id)}
                              style={{ padding: '3px 7px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: editingId === rec.id ? '#16a34a' : 'var(--bg-secondary)', color: editingId === rec.id ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.72rem' }}>
                              {editingId === rec.id ? '✅' : '✏️'}
                            </button>
                            <button onClick={() => removeRecord(idx)}
                              style={{ padding: '3px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={() => { setFiles([]); setRecords([]); setStatus('idle'); }}
                style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                + Process More Documents
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cross-promo */}
      <div style={{ marginTop: 16, background: 'linear-gradient(135deg,#f97316,#16a34a)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 40 }}>🇮🇳</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Also Try: Government Document Translator</div>
          <div style={{ color: '#dcfce7', fontSize: '0.83rem' }}>Translate extracted documents to Hindi, Marathi, Tamil, Telugu and 12 more languages. Plain Hindi explanation for citizens.</div>
        </div>
        <a href="../gov-doc-translator" style={{ padding: '10px 18px', background: '#fff', color: '#f97316', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Try Translator →
        </a>
      </div>

      {/* Use cases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 14 }}>
        {[
          { icon: '📋', title: 'Application Forms', desc: 'Ration card, pension, scholarship applications' },
          { icon: '🏥', title: 'Health Records', desc: 'Patient registration, PMJAY beneficiary lists' },
          { icon: '🌾', title: 'Agriculture Data', desc: 'Kisan registration, PM-KISAN beneficiary forms' },
          { icon: '🏘️', title: 'Survey Documents', desc: 'Census data, SECC, land survey records' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const thStyle = { padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '8px 12px', verticalAlign: 'middle', borderBottom: '1px solid var(--border-light)' };
