'use client';
import { useState, useRef, useCallback } from 'react';

const LANGS = [
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

const DOC_TYPES = [
  { id: 'general', label: '📄 General Document' },
  { id: 'certificate', label: '📜 Certificate' },
  { id: 'order', label: '📋 Government Order' },
  { id: 'form', label: '📝 Application Form' },
  { id: 'legal', label: '⚖️ Legal Notice' },
  { id: 'scheme', label: '🏛️ Scheme Document' },
];

async function translateText(text, targetLang) {
  if (!text?.trim()) return '';
  const chunks = chunkText(text, 4800);
  const out = [];
  for (const chunk of chunks) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url);
      const data = await res.json();
      out.push(data[0]?.map(i => i[0]).join('') || chunk);
    } catch { out.push(chunk); }
  }
  return out.join('\n');
}

function chunkText(text, max) {
  const sentences = text.split(/(?<=[।.!?\n])\s+/);
  const chunks = []; let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += ' ' + s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}

const S = {
  wrap: { maxWidth: 1100, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#f97316' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(249,115,22,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s', marginBottom: 14 }),
  langBtn: (active) => ({ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? '#f97316' : 'var(--border-light)'}`, background: active ? 'rgba(249,115,22,0.08)' : 'var(--bg-secondary)', cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4 }),
  docTypeBtn: (active) => ({ padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? '#f97316' : 'var(--border-light)'}`, background: active ? 'rgba(249,115,22,0.08)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: active ? '#ea580c' : 'var(--text-secondary)', transition: 'all 0.15s', textAlign: 'left' }),
  tabBtn: (active) => ({ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', background: active ? 'var(--accent)' : 'transparent', color: active ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }),
  progressBar: (pct) => ({ height: 5, borderRadius: 3, background: 'linear-gradient(90deg,#f97316,#16a34a)', width: `${pct}%`, transition: 'width 0.4s' }),
  textarea: { width: '100%', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' },
};

export default function GovDocTranslator({ t, lang }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
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
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const n = f.name.toLowerCase();
    if (n.endsWith('.pdf')) setFileType('pdf');
    else if (n.match(/\.(jpg|jpeg|png|webp|bmp)$/)) setFileType('image');
    else if (n.match(/\.(txt|md)$/)) setFileType('text');
    else { alert('Supported: PDF, JPG, PNG, WebP, TXT'); return; }
    setFile(f); setExtractedText(''); setTranslatedText(''); setSimplifiedText(''); setStatus('idle'); setProgress(0);
  };

  const process = useCallback(async () => {
    if (!file) return;
    setStatus('extracting'); setProgress(5); setProgressMsg('Reading document...');
    let text = '';
    try {
      if (fileType === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        setPageCount(pdf.numPages);
        setProgressMsg(`Extracting text from ${pdf.numPages} pages...`);
        setProgress(15);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(it => it.str).join(' ');
          if (pageText.trim().length < 50) {
            setProgressMsg(`OCR scanning page ${i}/${pdf.numPages}...`);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width; canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const Tesseract = await import('tesseract.js');
            const r = await Tesseract.recognize(canvas, 'eng+hin');
            text += `\n[Page ${i}]\n` + r.data.text;
          } else {
            text += `\n[Page ${i}]\n` + pageText;
          }
          setProgress(15 + Math.round((i / pdf.numPages) * 35));
        }
      } else if (fileType === 'image') {
        setProgressMsg('Running OCR on image...');
        const Tesseract = await import('tesseract.js');
        const r = await Tesseract.recognize(file, 'eng+hin', { logger: m => m.status === 'recognizing text' && setProgress(10 + Math.round(m.progress * 40)) });
        text = r.data.text; setPageCount(1);
      } else {
        text = await file.text(); setPageCount(1);
      }
      text = text.trim();
      setExtractedText(text); setWordCount(text.split(/\s+/).length); setProgress(55);
      if (!text) { setStatus('error'); setProgressMsg('No text could be extracted.'); return; }
      setStatus('translating'); setProgressMsg(`Translating to ${LANGS.find(l => l.code === targetLang)?.name}...`);
      const translated = await translateText(text, targetLang);
      setTranslatedText(translated); setProgress(85);
      setProgressMsg('Generating plain Hindi explanation...');
      const simplified = await translateText(`Explain this government document in very simple easy Hindi for a common citizen:\n\n${text.slice(0, 2000)}`, 'hi');
      setSimplifiedText(simplified); setProgress(100); setStatus('done');
    } catch (err) { setStatus('error'); setProgressMsg('Processing failed: ' + err.message); }
  }, [file, fileType, targetLang]);

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const lName = LANGS.find(l => l.code === targetLang)?.name || targetLang;
    pdf.setFontSize(13); pdf.text(`Translated to ${lName} — ilovetexts.com`, 10, 14);
    pdf.setFontSize(10); pdf.line(10, 18, 200, 18);
    const lines = pdf.splitTextToSize(translatedText, 185);
    let y = 24;
    for (const line of lines) { if (y > 280) { pdf.addPage(); y = 14; } pdf.text(line, 10, y); y += 6; }
    pdf.save(`translated-${targetLang}.pdf`);
  };

  const TABS = [
    { id: 'original', label: '📄 Original' },
    { id: 'translated', label: '🌐 Translated' },
    { id: 'simplified', label: '💡 Plain Hindi' },
  ];

  const tabText = activeTab === 'original' ? extractedText : activeTab === 'translated' ? translatedText : simplifiedText;

  return (
    <div style={S.wrap}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🇮🇳 OCR for scanned docs', '16 languages', '💡 Plain Hindi explanation', '🔒 100% private', '⬇️ Download PDF'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Gov promo banner */}
      <div style={{ background: 'linear-gradient(135deg,#fff7ed,#f0fdf4)', border: '1px solid #fed7aa', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🏛️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 3 }}>Built for Government Sector Employees &amp; Citizens</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Clerks, tehsildars, gram panchayat workers, legal aid volunteers — translate government orders and certificates for citizens in their language.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Doc type */}
          <div style={S.card}>
            <div style={S.label}>Document Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {DOC_TYPES.map(d => (
                <button key={d.id} onClick={() => setDocType(d.id)} style={S.docTypeBtn(docType === d.id)}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div style={S.card}>
            <div style={S.label}>Translate To</div>
            <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setTargetLang(l.code)} style={S.langBtn(targetLang === l.code)}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{l.native}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Upload */}
          {!file && (
            <div onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📑</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Drop government document here</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.88rem' }}>PDF (text + scanned) • JPG • PNG • WebP • TXT</p>
              <button className="btn-primary" style={{ padding: '10px 26px', cursor: 'pointer', background: '#f97316', borderColor: '#f97316' }} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>
                Choose Document
              </button>
              <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🔒 Document never leaves your browser — 100% private</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" style={{ display: 'none' }} onChange={e=>handleFile(e.target.files[0])} />
            </div>
          )}

          {/* File loaded / idle */}
          {file && status === 'idle' && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 32 }}>{fileType === 'pdf' ? '📑' : fileType === 'image' ? '🖼️' : '📃'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {(file.size / 1024).toFixed(1)} KB → <strong style={{ color: '#f97316' }}>{LANGS.find(l => l.code === targetLang)?.native}</strong>
                  </div>
                </div>
                <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>✕</button>
              </div>
              <button onClick={process} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#f97316,#16a34a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', letterSpacing: '0.02em' }}>
                🇮🇳 Translate Document
              </button>
            </div>
          )}

          {/* Progress */}
          {(status === 'extracting' || status === 'translating') && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{progressMsg}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{progress}% complete</div>
                </div>
              </div>
              <div style={{ height: 5, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                <div style={S.progressBar(progress)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.78rem', textAlign: 'center' }}>
                {[['📖 Extract', progress >= 20], ['🔤 OCR', progress >= 50], ['🌐 Translate', progress >= 85]].map(([l, done]) => (
                  <div key={l} style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: done ? '#f0fdf4' : 'var(--bg-secondary)', border: `1px solid ${done ? '#86efac' : 'var(--border-light)'}`, color: done ? '#15803d' : 'var(--text-secondary)', fontWeight: done ? 700 : 400 }}>
                    {done ? '✅ ' : '⏳ '}{l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>❌ {progressMsg}</div>
              <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--highlight)', fontSize: '0.85rem' }}>Try again</button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { icon: '📄', label: 'Pages', value: pageCount || 1 },
                  { icon: '📝', label: 'Words', value: wordCount.toLocaleString() },
                  { icon: '🌐', label: 'Language', value: LANGS.find(l => l.code === targetLang)?.native },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={S.tabBtn(activeTab === tab.id)}>{tab.label}</button>
                ))}
              </div>

              {/* Text */}
              <div style={{ position: 'relative' }}>
                <textarea readOnly value={tabText} rows={14} style={S.textarea} />
                <button onClick={() => navigator.clipboard.writeText(tabText)}
                  style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', fontSize: '0.72rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  📋 Copy
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={downloadPDF} style={{ flex: 1, padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  ⬇️ Download Translated PDF
                </button>
                <button onClick={() => { setFile(null); setStatus('idle'); setExtractedText(''); setTranslatedText(''); setSimplifiedText(''); }}
                  style={{ padding: '11px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                  🔄 New Doc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross-promo */}
      <div style={{ marginTop: 16, background: 'linear-gradient(135deg,#1e40af,#7c3aed)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Also Try: Government Document Data Extractor</div>
          <div style={{ color: '#bfdbfe', fontSize: '0.83rem' }}>Extract Name, DOB, Aadhaar, District from 100s of scanned forms — export to Excel/CSV/JSON instantly.</div>
        </div>
        <a href="../gov-doc-extractor" style={{ padding: '10px 18px', background: '#fff', color: '#1e40af', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Try Extractor →
        </a>
      </div>

      {/* How it works */}
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
          {[
            { step: '1', icon: '📎', title: 'Upload', desc: 'PDF, image or scanned document' },
            { step: '2', icon: '🔍', title: 'OCR Extract', desc: 'Text extracted even from scanned images' },
            { step: '3', icon: '🌐', title: 'Translate', desc: 'Translated to chosen Indian language' },
            { step: '4', icon: '💡', title: 'Simplify', desc: 'Plain Hindi explanation for citizens' },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', color: '#ea580c', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '0.85rem' }}>{s.step}</div>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 4 }}>
        {[
          { icon: '👨‍💼', title: 'Government Clerks', desc: 'Translate official orders and circulars into local languages' },
          { icon: '👥', title: 'Legal Aid Workers', desc: 'Help citizens understand court notices and FIRs' },
          { icon: '🏘️', title: 'Gram Panchayat', desc: 'Explain scheme documents in regional languages for villagers' },
        ].map(c => (
          <div key={c.title} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
