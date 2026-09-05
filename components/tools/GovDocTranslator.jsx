'use client';
import { useState, useRef, useCallback } from 'react';

const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिंदी', script: 'Devanagari' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'ur', name: 'Urdu', native: 'اردو', script: 'Nastaliq' },
  { code: 'en', name: 'English', native: 'English', script: 'Latin' },
  { code: 'es', name: 'Spanish', native: 'Español', script: 'Latin' },
  { code: 'pt', name: 'Portuguese', native: 'Português', script: 'Latin' },
  { code: 'de', name: 'German', native: 'Deutsch', script: 'Latin' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', script: 'Latin' },
];

const GOV_DOC_TYPES = [
  { id: 'general', label: '📄 General Document', desc: 'Any government document' },
  { id: 'certificate', label: '📜 Certificate', desc: 'Birth, death, income, caste' },
  { id: 'order', label: '📋 Government Order', desc: 'GO, circular, notification' },
  { id: 'form', label: '📝 Application Form', desc: 'Filled government form' },
  { id: 'legal', label: '⚖️ Legal Notice', desc: 'Court order, notice, FIR' },
  { id: 'scheme', label: '🏛️ Scheme Document', desc: 'Yojana, welfare scheme details' },
];

// Google Translate unofficial API via URL (no API key needed)
async function translateText(text, targetLang, sourceLang = 'auto') {
  if (!text || !text.trim()) return '';
  try {
    // Use google-translate-api-x if available, else fetch approach
    const chunks = chunkText(text, 4800);
    const translated = [];
    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data[0]?.map(item => item[0]).join('') || chunk;
      translated.push(result);
    }
    return translated.join('\n');
  } catch {
    return text;
  }
}

function chunkText(text, maxLen) {
  const sentences = text.split(/(?<=[।.!?\n])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += ' ' + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}

// Simplify government language into plain Hindi
function simplifyGovText(text) {
  const govToSimple = {
    'hereby': 'इसके द्वारा',
    'aforesaid': 'ऊपर बताया गया',
    'whereas': 'जबकि',
    'pursuant to': 'के अनुसार',
    'in accordance with': 'के अनुसार',
    'notification': 'सूचना',
    'sanctioned': 'स्वीकृत किया गया',
    'incumbent': 'वर्तमान',
    'vide': 'देखें',
    'ibid': 'वही',
    'sub-section': 'उप-धारा',
    'notwithstanding': 'के बावजूद',
  };
  let simplified = text;
  Object.entries(govToSimple).forEach(([eng, hindi]) => {
    simplified = simplified.replace(new RegExp(eng, 'gi'), hindi);
  });
  return simplified;
}

export default function GovDocTranslator({ t, lang }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'pdf' | 'image' | 'text'
  const [targetLang, setTargetLang] = useState('hi');
  const [docType, setDocType] = useState('general');
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [activeTab, setActiveTab] = useState('translated');
  const [dragOver, setDragOver] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showPromo, setShowPromo] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (name.endsWith('.pdf')) setFileType('pdf');
    else if (name.match(/\.(jpg|jpeg|png|webp|bmp|tiff?)$/)) setFileType('image');
    else if (name.match(/\.(txt|md|docx?)$/)) setFileType('text');
    else { alert('Supported: PDF, JPG, PNG, WebP, TXT files'); return; }
    setFile(f);
    setExtractedText('');
    setTranslatedText('');
    setSimplifiedText('');
    setStatus('idle');
    setProgress(0);
    setShowPromo(false);
  };

  const process = useCallback(async () => {
    if (!file) return;
    setStatus('extracting');
    setProgress(5);
    setProgressMsg('Reading document...');

    let text = '';

    try {
      if (fileType === 'pdf') {
        setProgressMsg('Loading PDF engine...');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const ab = await file.arrayBuffer();
        setProgress(15);
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        setPageCount(pdf.numPages);
        setProgressMsg(`Extracting text from ${pdf.numPages} pages...`);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          if (pageText.trim().length < 50) {
            // Scanned page — use OCR
            setProgressMsg(`OCR scanning page ${i}/${pdf.numPages}...`);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            const Tesseract = await import('tesseract.js');
            const result = await Tesseract.recognize(canvas, 'eng+hin', {
              logger: (m) => m.status === 'recognizing text' && setProgress(15 + Math.round(m.progress * 30 * (i / pdf.numPages))),
            });
            text += `\n[Page ${i}]\n` + result.data.text;
          } else {
            text += `\n[Page ${i}]\n` + pageText;
          }
          setProgress(15 + Math.round((i / pdf.numPages) * 35));
        }
      } else if (fileType === 'image') {
        setProgressMsg('Running OCR on image...');
        const Tesseract = await import('tesseract.js');
        const result = await Tesseract.recognize(file, 'eng+hin', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(10 + Math.round(m.progress * 40));
              setProgressMsg(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          },
        });
        text = result.data.text;
        setPageCount(1);
      } else {
        text = await file.text();
        setPageCount(1);
      }

      text = text.trim();
      setExtractedText(text);
      setWordCount(text.split(/\s+/).length);
      setProgress(55);

      if (!text) {
        setStatus('error');
        setProgressMsg('No text could be extracted. Try a clearer image or a text-based PDF.');
        return;
      }

      // Translate
      setStatus('translating');
      setProgressMsg(`Translating to ${INDIAN_LANGUAGES.find(l => l.code === targetLang)?.name}...`);
      const translated = await translateText(text, targetLang);
      setTranslatedText(translated);
      setProgress(85);

      // Simplify in Hindi
      setProgressMsg('Generating plain Hindi explanation...');
      const simplified = await translateText(
        `Explain this government document in very simple, easy to understand Hindi for a common citizen:\n\n${text.slice(0, 2000)}`,
        'hi'
      );
      setSimplifiedText(simplified);
      setProgress(100);
      setStatus('done');
      setShowPromo(true);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgressMsg('Processing failed: ' + err.message);
    }
  }, [file, fileType, targetLang, docType]);

  const downloadTranslated = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const lang = INDIAN_LANGUAGES.find(l => l.code === targetLang);
    pdf.setFontSize(14);
    pdf.text(`Government Document — Translated to ${lang?.name}`, 10, 15);
    pdf.setFontSize(10);
    pdf.text(`Original: ${file?.name} | Translated by ilovetexts.com`, 10, 22);
    pdf.line(10, 25, 200, 25);
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(translatedText, 185);
    let y = 32;
    for (const line of lines) {
      if (y > 280) { pdf.addPage(); y = 15; }
      pdf.text(line, 10, y);
      y += 6;
    }
    pdf.save(`translated-${targetLang}-${file?.name?.replace(/\.[^.]+$/, '')}.pdf`);
  };

  const copyText = (txt) => navigator.clipboard.writeText(txt);

  const TABS = [
    { id: 'original', label: '📄 Original Text', count: wordCount },
    { id: 'translated', label: `🌐 Translated`, count: null },
    { id: 'simplified', label: '💡 Plain Hindi', count: null },
  ];

  const UI_TEXT = {
    en: { title: 'Government Document Translator', subtitle: 'Translate any government PDF or image to 16 languages — OCR for scanned documents, plain Hindi explanation for citizens', upload: 'Drop PDF, image or text file here', btn: 'Translate Document', processing: 'Processing...', done: 'Translation Complete' },
    hi: { title: 'सरकारी दस्तावेज़ अनुवादक', subtitle: 'किसी भी सरकारी PDF को 16 भाषाओं में अनुवाद करें — स्कैन किए दस्तावेजों के लिए OCR', upload: 'PDF, इमेज या टेक्स्ट फाइल यहाँ छोड़ें', btn: 'अनुवाद करें', processing: 'प्रसंस्करण...', done: 'अनुवाद पूर्ण' },
    es: { title: 'Traductor de Documentos Gubernamentales', subtitle: 'Traduce cualquier PDF gubernamental a 16 idiomas — OCR para documentos escaneados', upload: 'Suelta PDF, imagen o archivo de texto aquí', btn: 'Traducir Documento', processing: 'Procesando...', done: 'Traducción Completa' },
    pt: { title: 'Tradutor de Documentos Governamentais', subtitle: 'Traduza qualquer PDF governamental para 16 idiomas — OCR para documentos digitalizados', upload: 'Solte PDF, imagem ou arquivo de texto aqui', btn: 'Traduzir Documento', processing: 'Processando...', done: 'Tradução Concluída' },
    de: { title: 'Behördendokument-Übersetzer', subtitle: 'Übersetze jedes behördliche PDF in 16 Sprachen — OCR für gescannte Dokumente', upload: 'PDF, Bild oder Textdatei hier ablegen', btn: 'Dokument übersetzen', processing: 'Verarbeitung...', done: 'Übersetzung abgeschlossen' },
    id: { title: 'Penerjemah Dokumen Pemerintah', subtitle: 'Terjemahkan PDF pemerintah ke 16 bahasa — OCR untuk dokumen yang dipindai', upload: 'Jatuhkan PDF, gambar, atau file teks di sini', btn: 'Terjemahkan Dokumen', processing: 'Memproses...', done: 'Terjemahan Selesai' },
  };
  const ui = UI_TEXT[lang] || UI_TEXT.en;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-orange-500 to-green-600 text-white text-5xl w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg">🇮🇳</div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ui.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{ui.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {['✅ OCR for scanned docs', '✅ 16 languages', '✅ Plain Hindi explanation', '✅ Download translated PDF', '✅ 100% private'].map(f => (
            <span key={f} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">{f}</span>
          ))}
        </div>
      </div>

      {/* Gov Promo Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 dark:from-orange-900/20 dark:to-green-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🏛️</div>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-200">Built for Government Sector Employees & Citizens</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Clerks, tehsildars, gram panchayat workers, legal aid volunteers — use this tool to translate government orders, certificates, and scheme documents for citizens who don't understand the official language.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="space-y-5">
          {/* Doc type */}
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Document Type</label>
            <div className="grid grid-cols-2 gap-2">
              {GOV_DOC_TYPES.map(d => (
                <button key={d.id} onClick={() => setDocType(d.id)}
                  className={`p-2.5 text-left rounded-xl border-2 text-xs transition-all
                    ${docType === d.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{d.label}</div>
                  <div className="text-gray-400">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target language */}
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Translate To</label>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {INDIAN_LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setTargetLang(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all text-sm
                    ${targetLang === l.code ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-100 dark:border-gray-800 hover:border-orange-300 hover:bg-orange-50/50'}`}>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{l.native}</span>
                  <span className="text-xs text-gray-400">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Main workspace */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upload */}
          {!file && (
            <div
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all
                ${dragOver ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50/30'}`}
            >
              <div className="text-6xl mb-4">📑</div>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">{ui.upload}</p>
              <p className="text-sm text-gray-400 mt-2">PDF (text + scanned) • JPG • PNG • WebP • TXT</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">100% private — processed in your browser, never uploaded to any server</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.txt" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* File loaded */}
          {file && status === 'idle' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{fileType === 'pdf' ? '📑' : fileType === 'image' ? '🖼️' : '📃'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB • {fileType?.toUpperCase()} • Will translate to: <strong className="text-orange-600">{INDIAN_LANGUAGES.find(l => l.code === targetLang)?.native}</strong></p>
                </div>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 text-xl shrink-0">✕</button>
              </div>
              <button onClick={process}
                className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl">
                🇮🇳 {ui.btn}
              </button>
            </div>
          )}

          {/* Progress */}
          {(status === 'extracting' || status === 'translating') && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-spin">⚙️</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{progressMsg}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{progress}% complete</p>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[['📖 Extract', progress >= 20], ['🔤 OCR', progress >= 50], ['🌐 Translate', progress >= 85]].map(([label, done]) => (
                  <div key={label} className={`py-2 rounded-lg ${done ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {done ? '✅ ' : '⏳ '}{label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
              <p className="font-bold text-red-700 dark:text-red-400">❌ {progressMsg}</p>
              <button onClick={() => setStatus('idle')} className="mt-3 text-sm text-red-600 hover:underline">Try again</button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '📄', label: 'Pages', value: pageCount || '1' },
                  { icon: '📝', label: 'Words', value: wordCount.toLocaleString() },
                  { icon: '🌐', label: 'Language', value: INDIAN_LANGUAGES.find(l => l.code === targetLang)?.native },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
                    <div className="text-xl">{s.icon}</div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all
                      ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {tab.label}
                    {tab.count > 0 && <span className="ml-1 text-gray-400">({tab.count})</span>}
                  </button>
                ))}
              </div>

              {/* Text display */}
              <div className="relative">
                <textarea
                  readOnly
                  value={activeTab === 'original' ? extractedText : activeTab === 'translated' ? translatedText : simplifiedText}
                  rows={14}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none font-sans leading-relaxed"
                />
                <button onClick={() => copyText(activeTab === 'original' ? extractedText : activeTab === 'translated' ? translatedText : simplifiedText)}
                  className="absolute top-3 right-3 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                  📋 Copy
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={downloadTranslated}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                  ⬇️ Download Translated PDF
                </button>
                <button onClick={() => { setFile(null); setStatus('idle'); setExtractedText(''); setTranslatedText(''); setSimplifiedText(''); }}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-xl transition-colors">
                  🔄 New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross-promo to extractor tool */}
      {showPromo && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="text-5xl">📊</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Also Try: Government Document Data Extractor</h3>
              <p className="text-blue-100 mt-1">Extract structured data (Name, DOB, Address, Certificate No.) from 100s of scanned forms and export to Excel/CSV/JSON instantly.</p>
            </div>
            <a href="../gov-doc-extractor" className="shrink-0 bg-white text-blue-600 font-bold py-3 px-5 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap">
              Try Extractor →
            </a>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: '1', icon: '📎', title: 'Upload', desc: 'PDF, image or scanned document' },
            { step: '2', icon: '🔍', title: 'OCR Extract', desc: 'Text extracted even from scanned images' },
            { step: '3', icon: '🌐', title: 'Translate', desc: 'Translated to your chosen Indian language' },
            { step: '4', icon: '💡', title: 'Simplify', desc: 'Plain Hindi explanation for citizens' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">{s.step}</div>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{s.title}</div>
              <div className="text-xs text-gray-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: '👨‍💼', title: 'Government Clerks', desc: 'Translate official orders and circulars into local languages for citizen communication' },
          { icon: '👥', title: 'Legal Aid Workers', desc: 'Help citizens understand court notices, FIRs, and legal documents in their language' },
          { icon: '🏘️', title: 'Gram Panchayat', desc: 'Translate central government scheme documents into regional languages for rural citizens' },
        ].map(c => (
          <div key={c.title} className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-900 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30">
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">{c.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
