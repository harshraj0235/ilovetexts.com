'use client';
// ScreenshotToDocument.jsx — Convert screenshots/images to editable documents
// Tesseract.js OCR → DOCX/TXT/PDF output
import { useState, useCallback, useRef } from 'react';

export default function ScreenshotToDocument({ t, lang }) {
  const [image, setImage]       = useState(null);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [outputFmt, setOutputFmt] = useState('txt');
  const [dragging, setDragging] = useState(false);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2500); };

  const loadImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => { setImage({ url: e.target.result, name: file.name }); setText(''); };
    reader.readAsDataURL(file);
  }, []);

  const runOCR = useCallback(async () => {
    if (!image) return;
    setLoading(true); setOcrProgress(0);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(image.url, 'eng', {
        logger: m => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); }
      });
      setText(result.data.text);
      showToast('Text extracted!');
    } catch (e) { showToast('OCR failed: ' + e.message, 'error'); }
    finally { setLoading(false); setOcrProgress(0); }
  }, [image]);

  const download = useCallback(async () => {
    if (!text.trim()) { showToast('No text to download', 'warning'); return; }
    const baseName = image?.name.replace(/\.[^.]+$/, '') || 'document';

    if (outputFmt === 'txt') {
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.txt'; a.click();
    } else if (outputFmt === 'html') {
      const html = `<!DOCTYPE html><html><head><title>${baseName}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;line-height:1.7}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.html'; a.click();
    } else if (outputFmt === 'docx') {
      // Simple DOCX via HTML+Word trick
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${baseName}</title></head><body><p style="white-space:pre-wrap;font-family:Calibri,sans-serif;font-size:11pt">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'</p><p>')}</p></body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName + '.doc'; a.click();
    }
    showToast('Downloaded!');
  }, [text, outputFmt, image]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t === 'success' ? '✅ ' : '⚠️ '}{toast.m}</div>}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📄</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Screenshot to Editable Document</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload any screenshot or image → OCR extracts text → Edit → Download as TXT, DOC or HTML</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: image ? '320px 1fr' : '1fr', gap: 20 }}>
        <div>
          {!image ? (
            <div onDrop={e => { e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(124,58,237,0.04)' : 'var(--bg-section)' }}>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { loadImage(e.target.files[0]); e.target.value = ''; }} />
              <div style={{ fontSize: 52, marginBottom: 12 }}>📄</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop image to convert to document</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>JPG, PNG, WebP, GIF — screenshots, photos, scans</p>
              <button style={{ padding: '11px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>Choose Image</button>
              <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🔒 OCR runs in your browser — never uploaded</p>
            </div>
          ) : (
            <div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="preview" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', background: '#f8f8f8' }} />
              </div>
              <button onClick={runOCR} disabled={loading}
                style={{ width: '100%', padding: '10px', marginBottom: 8, background: loading ? 'var(--border-light)' : 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}>
                {loading ? (<><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ilt-spin 0.7s linear infinite' }} />Recognizing… {ocrProgress}%</>) : '🔍 Extract Text with OCR'}
              </button>
              {loading && <div style={{ height: 5, background: 'var(--bg-section)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}><div style={{ height: '100%', width: `${ocrProgress}%`, background: '#7c3aed', borderRadius: 3, transition: 'width 0.3s' }} /></div>}
              <button onClick={() => { setImage(null); setText(''); }} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }}>🔄 Change Image</button>
            </div>
          )}
        </div>

        {text && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['txt', 'TXT'], ['docx', 'DOC'], ['html', 'HTML']].map(([v, l]) => (
                  <button key={v} onClick={() => setOutputFmt(v)} style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${outputFmt === v ? '#7c3aed' : 'var(--border-light)'}`, background: outputFmt === v ? 'rgba(124,58,237,0.1)' : 'var(--bg-section)', color: outputFmt === v ? '#7c3aed' : 'var(--text-secondary)', fontWeight: outputFmt === v ? 700 : 400, fontSize: '0.78rem', cursor: 'pointer' }}>{l}</button>
                ))}
              </div>
              <button onClick={download} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>⬇ Download</button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{wordCount} words · {text.length} chars</span>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)}
              style={{ width: '100%', minHeight: 360, fontFamily: 'system-ui', fontSize: '0.88rem', lineHeight: 1.7, padding: 14, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
