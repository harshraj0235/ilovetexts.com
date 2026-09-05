'use client';
import { useState, useRef, useCallback } from 'react';

// Government form field patterns for India
const FIELD_PATTERNS = {
  name: [/(?:name|नाम|naam)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+)/gi, /^(?:mr|mrs|ms|dr|shri|smt|kumari|श्री|श्रीमती)\s+([A-Za-z\u0900-\u097F\s]+)/gim],
  dob: [/(?:date of birth|d\.o\.b|dob|जन्म\s*तिथि|janm\s*tithi)\s*[:\-]\s*([\d]{1,2}[-\/\.][\d]{1,2}[-\/\.][\d]{2,4})/gi, /(?:born on|born)\s*([\d]{1,2}[-\/\.][\d]{1,2}[-\/\.][\d]{2,4})/gi],
  fatherName: [/(?:father'?s?\s*name|पिता\s*का\s*नाम|pita\s*ka\s*naam|s\/o|d\/o|w\/o)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]+)/gi],
  motherName: [/(?:mother'?s?\s*name|माता\s*का\s*नाम|mata\s*ka\s*naam)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+)/gi],
  address: [/(?:address|पता|patā|permanent\s*address|residential\s*address)\s*[:\-]\s*([A-Za-z0-9\u0900-\u097F\s,\-\.\/]+(?:pin|pincode)?[\d]{6}?)/gi],
  village: [/(?:village|gram|गाँव|गांव|graam)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+)/gi],
  district: [/(?:district|जिला|zila)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+)/gi],
  state: [/(?:state|राज्य|rajya)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+)/gi],
  pincode: [/(?:pin\s*code|pincode|zip|पिन\s*कोड)\s*[:\-]?\s*(\d{6})/gi, /\b(\d{6})\b/g],
  mobile: [/(?:mobile|phone|contact|mob|फोन|मोबाइल)\s*[:\-]?\s*(\+?91[-\s]?[6-9]\d{9}|\b[6-9]\d{9}\b)/gi],
  aadhaar: [/(?:aadhaar|aadhar|uid|आधार)\s*(?:no|number|नंबर)?\s*[:\-]?\s*(\d{4}\s?\d{4}\s?\d{4})/gi],
  pan: [/(?:pan|permanent\s*account\s*number)\s*[:\-]?\s*([A-Z]{5}\d{4}[A-Z])/gi],
  certificateNo: [/(?:certificate\s*(?:no|number)|cert\s*no|registration\s*(?:no|number)|प्रमाण\s*पत्र\s*संख्या|ref\s*(?:no|number)|application\s*(?:no|number))\s*[:\-]\s*([A-Za-z0-9\-\/]+)/gi],
  income: [/(?:annual\s*income|income|आय|वार्षिक\s*आय)\s*[:\-]\s*(?:rs\.?|₹|inr)?\s*([\d,]+)/gi],
  caste: [/(?:caste|जाति|jati|category)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)/gi],
  gender: [/(?:gender|sex|लिंग)\s*[:\-]\s*(male|female|other|पुरुष|महिला|अन्य)/gi],
  age: [/(?:age|आयु|umra)\s*[:\-]\s*(\d{1,3})\s*(?:years|yrs|वर्ष)?/gi],
  issueDate: [/(?:issue\s*date|date\s*of\s*issue|issued\s*on|जारी\s*तिथि)\s*[:\-]\s*([\d]{1,2}[-\/\.][\d]{1,2}[-\/\.][\d]{2,4})/gi],
  validUpto: [/(?:valid\s*(?:up\s*to|upto|till)|expiry|validity)\s*[:\-]\s*([\d]{1,2}[-\/\.][\d]{1,2}[-\/\.][\d]{2,4})/gi],
};

const FIELD_LABELS = {
  name: 'Full Name', dob: 'Date of Birth', fatherName: "Father's Name", motherName: "Mother's Name",
  address: 'Address', village: 'Village/Gram', district: 'District', state: 'State', pincode: 'PIN Code',
  mobile: 'Mobile Number', aadhaar: 'Aadhaar Number', pan: 'PAN Number', certificateNo: 'Certificate/Ref No.',
  income: 'Income (₹)', caste: 'Caste/Category', gender: 'Gender', age: 'Age', issueDate: 'Issue Date', validUpto: 'Valid Upto',
};

function extractFields(text) {
  const result = {};
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      const match = re.exec(text);
      if (match && match[1]) {
        result[field] = match[1].trim().replace(/\s+/g, ' ').slice(0, 100);
        break;
      }
    }
  }
  return result;
}

function detectDuplicates(records) {
  const seen = new Map();
  return records.map((rec, idx) => {
    const key = [rec.name, rec.dob, rec.aadhaar, rec.pan].filter(Boolean).join('|').toLowerCase();
    if (key && seen.has(key)) {
      return { ...rec, _duplicate: true, _duplicateOf: seen.get(key) + 1 };
    }
    if (key) seen.set(key, idx);
    return { ...rec, _duplicate: false };
  });
}

export default function GovDocExtractor({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [status, setStatus] = useState('idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFields, setSelectedFields] = useState(Object.keys(FIELD_LABELS));
  const [editingIdx, setEditingIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const fileRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      f.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png|webp|bmp|tiff?)$/)
    );
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2), processed: false }))]);
  };

  const processAll = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setStatus('processing');
    setProgress(0);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const { file, id } = files[i];
      setProgressMsg(`Processing ${i + 1}/${files.length}: ${file.name}`);
      setProgress(Math.round((i / files.length) * 90));

      try {
        let text = '';
        const name = file.name.toLowerCase();

        if (name.endsWith('.pdf')) {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          const ab = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

          for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');

            if (pageText.trim().length < 50) {
              const viewport = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              await page.render({ canvasContext: ctx, viewport }).promise;
              const Tesseract = await import('tesseract.js');
              const ocrResult = await Tesseract.recognize(canvas, 'eng+hin');
              text += ocrResult.data.text + '\n';
            } else {
              text += pageText + '\n';
            }
          }
        } else {
          // Image OCR
          const Tesseract = await import('tesseract.js');
          const result = await Tesseract.recognize(file, 'eng+hin');
          text = result.data.text;
        }

        const fields = extractFields(text);
        results.push({
          id,
          _fileName: file.name,
          _rawText: text.slice(0, 500),
          ...fields,
        });
      } catch (err) {
        results.push({
          id,
          _fileName: file.name,
          _error: err.message,
        });
      }
    }

    const withDupes = detectDuplicates(results);
    setRecords(withDupes);
    setProgress(100);
    setProcessing(false);
    setStatus('done');
    setProgressMsg('');
  }, [files]);

  const updateRecord = (idx, field, value) => {
    setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRecord = (idx) => {
    setRecords(prev => prev.filter((_, i) => i !== idx));
  };

  const exportData = async (format) => {
    const exportRecords = records.filter(r => !r._error);
    const fields = selectedFields;

    if (format === 'excel' || format === 'csv') {
      const { utils, writeFile } = await import('xlsx');
      const data = exportRecords.map(r => {
        const row = {};
        fields.forEach(f => { row[FIELD_LABELS[f] || f] = r[f] || ''; });
        row['Source File'] = r._fileName;
        if (r._duplicate) row['⚠️ Duplicate'] = `Duplicate of row ${r._duplicateOf}`;
        return row;
      });
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Extracted Data');
      if (format === 'excel') {
        writeFile(wb, 'government-data-extract.xlsx');
      } else {
        writeFile(wb, 'government-data-extract.csv', { bookType: 'csv' });
      }
    } else if (format === 'json') {
      const clean = exportRecords.map(r => {
        const obj = { sourceFile: r._fileName };
        fields.forEach(f => { if (r[f]) obj[f] = r[f]; });
        if (r._duplicate) obj._warning = 'Potential duplicate';
        return obj;
      });
      const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'government-data-extract.json';
      a.click();
    }
  };

  const filteredRecords = records.filter(r => {
    if (showDuplicatesOnly && !r._duplicate) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(q));
  });

  const duplicateCount = records.filter(r => r._duplicate).length;
  const successCount = records.filter(r => !r._error).length;

  const UI_TEXT = {
    en: { title: 'Government Document Data Extractor', subtitle: 'Upload 100s of scanned government forms — extract Name, DOB, Aadhaar, District, Certificate No. automatically and export to Excel/CSV/JSON' },
    hi: { title: 'सरकारी दस्तावेज़ डेटा एक्सट्रैक्टर', subtitle: 'सैकड़ों स्कैन किए सरकारी फॉर्म अपलोड करें — नाम, जन्मतिथि, आधार, जिला अपने आप निकालें और Excel/CSV/JSON में एक्सपोर्ट करें' },
    es: { title: 'Extractor de Datos de Documentos Gubernamentales', subtitle: 'Sube cientos de formularios gubernamentales escaneados — extrae Nombre, DOB, Distrito automáticamente y exporta a Excel' },
    pt: { title: 'Extrator de Dados de Documentos Governamentais', subtitle: 'Carregue centenas de formulários digitalizados — extraia Nome, Data de Nascimento, Distrito automaticamente e exporte para Excel' },
    de: { title: 'Behördendokument-Datenextraktor', subtitle: 'Laden Sie Hunderte gescannter Behördenformulare hoch — extrahieren Sie Name, Geburtsdatum, Bezirk automatisch und exportieren Sie nach Excel' },
    id: { title: 'Ekstraktor Data Dokumen Pemerintah', subtitle: 'Unggah ratusan formulir pemerintah yang dipindai — ekstrak Nama, TTL, Kabupaten secara otomatis dan ekspor ke Excel' },
  };
  const ui = UI_TEXT[lang] || UI_TEXT.en;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-5xl w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg">📊</div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ui.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">{ui.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {['✅ OCR for scanned forms', '✅ 19 field types extracted', '✅ Duplicate detection', '✅ Excel / CSV / JSON export', '✅ Bulk 100s of files', '✅ 100% private'].map(f => (
            <span key={f} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 text-xs">{f}</span>
          ))}
        </div>
      </div>

      {/* Gov promo */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🏛️</div>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-200">Built for Government Offices — Digitization Made Easy</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Data entry clerks, digitization teams, gram panchayat staff — upload 100s of scanned application forms and get a structured Excel sheet in minutes instead of days.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar: Field selector */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Fields to Extract</h3>
              <button onClick={() => setSelectedFields(prev => prev.length === Object.keys(FIELD_LABELS).length ? [] : Object.keys(FIELD_LABELS))}
                className="text-xs text-blue-600 hover:underline">
                {selectedFields.length === Object.keys(FIELD_LABELS).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={selectedFields.includes(key)}
                    onChange={(e) => setSelectedFields(prev => e.target.checked ? [...prev, key] : prev.filter(f => f !== key))}
                    className="accent-blue-600 w-4 h-4 flex-shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Upload zone */}
          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/30'}`}
          >
            <div className="text-5xl mb-3">📂</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Drop PDF and image files here — up to 100 files at once</p>
            <p className="text-sm text-gray-400 mt-1">PDF (text + scanned) • JPG • PNG • WebP — application forms, certificates, beneficiary lists</p>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {files.length > 0 && status !== 'done' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">{files.length} file{files.length > 1 ? 's' : ''} ready</h3>
                <button onClick={() => setFiles([])} className="text-sm text-red-400 hover:text-red-500">Clear all</button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {files.map(({ file, id }) => (
                  <div key={id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-lg">{file.name.endsWith('.pdf') ? '📑' : '🖼️'}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => setFiles(f => f.filter(x => x.id !== id))} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                  </div>
                ))}
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>⚙️ {progressMsg}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {!processing && (
                <button onClick={processAll}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all text-lg shadow-lg">
                  📊 Extract Data from {files.length} File{files.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Results table */}
          {status === 'done' && records.length > 0 && (
            <div className="space-y-4">
              {/* Stats + export */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-3 flex-1 flex-wrap">
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm font-semibold">
                    ✅ {successCount} extracted
                  </div>
                  {duplicateCount > 0 && (
                    <button onClick={() => setShowDuplicatesOnly(p => !p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${showDuplicatesOnly ? 'bg-red-500 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      ⚠️ {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}
                    </button>
                  )}
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search records..."
                    className="flex-1 min-w-[160px] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex gap-2">
                  {[['excel', '📊 Excel'], ['csv', '📃 CSV'], ['json', '{ } JSON']].map(([fmt, label]) => (
                    <button key={fmt} onClick={() => exportData(fmt)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                      ⬇️ {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">#</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">File</th>
                      {selectedFields.map(f => (
                        <th key={f} className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{FIELD_LABELS[f]}</th>
                      ))}
                      <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredRecords.map((rec, idx) => (
                      <tr key={rec.id}
                        className={`${rec._duplicate ? 'bg-red-50 dark:bg-red-900/10' : rec._error ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-white dark:bg-gray-900'} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
                        <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-gray-700 dark:text-gray-300 max-w-[100px] truncate block" title={rec._fileName}>{rec._fileName}</span>
                          {rec._duplicate && <span className="text-red-500 text-xs">⚠️ Duplicate</span>}
                          {rec._error && <span className="text-yellow-600 text-xs">⚠️ OCR failed</span>}
                        </td>
                        {selectedFields.map(f => (
                          <td key={f} className="px-3 py-2.5">
                            {editingIdx === rec.id ? (
                              <input
                                value={rec[f] || ''}
                                onChange={e => updateRecord(idx, f, e.target.value)}
                                className="w-full min-w-[80px] border border-blue-300 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none"
                              />
                            ) : (
                              <span className={`${rec[f] ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600'}`}>
                                {rec[f] || '—'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => setEditingIdx(editingIdx === rec.id ? null : rec.id)}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${editingIdx === rec.id ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100'}`}>
                              {editingIdx === rec.id ? '✅' : '✏️'}
                            </button>
                            <button onClick={() => removeRecord(idx)} className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-red-400 hover:bg-red-100 transition-colors">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Process more */}
              <button onClick={() => { setFiles([]); setRecords([]); setStatus('idle'); }}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                + Process More Documents
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cross-promo to translator */}
      <div className="bg-gradient-to-r from-orange-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🇮🇳</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Also Try: Government Document Translator</h3>
            <p className="text-orange-100 mt-1">Translate extracted documents to Hindi, Marathi, Tamil, Telugu and 12 more languages. Get plain Hindi explanation for citizens.</p>
          </div>
          <a href="../gov-doc-translator" className="shrink-0 bg-white text-orange-600 font-bold py-3 px-5 rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap">
            Try Translator →
          </a>
        </div>
      </div>

      {/* Use cases */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📋', title: 'Application Forms', desc: 'Ration card, pension, scholarship applications' },
          { icon: '🏥', title: 'Health Records', desc: 'Patient registration, PMJAY beneficiary lists' },
          { icon: '🌾', title: 'Agriculture Data', desc: 'Kisan registration, PM-KISAN beneficiary forms' },
          { icon: '🏘️', title: 'Survey Documents', desc: 'Census data, SECC, land survey records' },
        ].map(c => (
          <div key={c.title} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{c.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
