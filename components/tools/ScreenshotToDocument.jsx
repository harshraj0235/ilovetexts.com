'use client';
// ScreenshotToDocument.jsx v2 — UPGRADED
// NEW: multi-image batch, language selector, confidence highlighting,
//      PDF export via window.print, auto-run option, clipboard paste event
import { useState, useRef, useCallback, useEffect } from 'react';

const OCR_LANGS = [
  { code:'eng', label:'English' },{ code:'hin', label:'Hindi' },{ code:'spa', label:'Spanish' },
  { code:'fra', label:'French' },{ code:'deu', label:'German' },{ code:'por', label:'Portuguese' },
  { code:'ara', label:'Arabic' },{ code:'chi_sim', label:'Chinese (Simplified)' },
  { code:'jpn', label:'Japanese' },{ code:'kor', label:'Korean' },{ code:'rus', label:'Russian' },
  { code:'ita', label:'Italian' },{ code:'nld', label:'Dutch' },
];

export default function ScreenshotToDocument({ t, lang }) {
  const [images,setImages]         = useState([]); // [{url,name,text,confidence}]
  const [currentIdx,setCurrentIdx] = useState(0);
  const [loading,setLoading]       = useState(false);
  const [ocrProgress,setOcrProgress] = useState(0);
  const [outputFmt,setOutputFmt]   = useState('txt');
  const [ocrLang,setOcrLang]       = useState('eng');
  const [autoRun,setAutoRun]       = useState(true);
  const [showLowConf,setShowLowConf] = useState(false);
  const [dragging,setDragging]     = useState(false);
  const [toast,setToast]           = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  // Clipboard paste event listener
  useEffect(() => {
    const handler = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) { loadImageFile(blob); showToast('Image pasted from clipboard!'); }
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, []);

  const loadImageFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file','warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const entry = { url:e.target.result, name:file.name, text:'', confidence:null };
      setImages(prev => [...prev, entry]);
      setCurrentIdx(prev => prev); // stay on current
      if (autoRun) {
        // Run OCR immediately after load
        runOCROn(e.target.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  }, [autoRun, ocrLang]);

  const runOCROn = useCallback(async (url, name) => {
    setLoading(true); setOcrProgress(0);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(url, ocrLang, {
        logger: m => { if(m.status==='recognizing text') setOcrProgress(Math.round(m.progress*100)); }
      });
      const text = result.data.text;
      // Calculate average confidence
      const words = result.data.words || [];
      const avgConf = words.length ? Math.round(words.reduce((s,w)=>s+w.confidence,0)/words.length) : null;
      const lowConfWords = words.filter(w=>w.confidence<60).map(w=>w.text.toLowerCase());
      setImages(prev => prev.map(img => img.name===name&&img.url===url ? {...img, text, confidence:avgConf, lowConfWords} : img));
      showToast(`Text extracted (${avgConf}% confidence)`);
    } catch(e) { showToast('OCR failed: '+e.message,'error'); }
    finally { setLoading(false); setOcrProgress(0); }
  }, [ocrLang]);

  const runOCRCurrent = useCallback(() => {
    const img = images[currentIdx];
    if (img) runOCROn(img.url, img.name);
  }, [images, currentIdx, runOCROn]);

  const currentImage = images[currentIdx];
  const text = currentImage?.text || '';
  const updateText = (val) => setImages(prev => prev.map((img,i) => i===currentIdx ? {...img, text:val} : img));

  const download = useCallback(async () => {
    if (!text.trim()) { showToast('No text to download','warning'); return; }
    const baseName = (currentImage?.name||'document').replace(/\.[^.]+$/,'');
    if (outputFmt==='txt') {
      const blob = new Blob([text],{type:'text/plain'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=baseName+'.txt'; a.click();
    } else if (outputFmt==='html'||outputFmt==='pdf') {
      const html = `<!DOCTYPE html><html><head><title>${baseName}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;line-height:1.8;font-size:14pt}@media print{body{margin:0;padding:10mm}}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;
      if (outputFmt==='pdf') {
        const win=window.open('','_blank');
        win.document.write(html); win.document.close();
        setTimeout(()=>win.print(),500);
      } else {
        const blob=new Blob([html],{type:'text/html'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=baseName+'.html'; a.click();
      }
    } else if (outputFmt==='doc') {
      const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${baseName}</title></head><body><p style="white-space:pre-wrap;font-family:Calibri;font-size:11pt">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'</p><p>')}</p></body></html>`;
      const blob=new Blob(['\ufeff',html],{type:'application/msword'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=baseName+'.doc'; a.click();
    } else if (outputFmt==='all-txt') {
      const combined = images.map((img,i)=>`=== Image ${i+1}: ${img.name} ===\n${img.text||'(not extracted)'}`).join('\n\n');
      const blob=new Blob([combined],{type:'text/plain'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='all-documents.txt'; a.click();
    }
    showToast('Downloaded!');
  }, [text, outputFmt, currentImage, images]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={{maxWidth:900,margin:'0 auto',width:'100%'}}>
      {toast&&<div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}
      <div style={{textAlign:'center',marginBottom:22}}>
        <div style={{fontSize:'2.5rem',marginBottom:8}}>📄</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 6px'}}>Screenshot to Editable Document</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>Upload multiple images → OCR in 13 languages → Edit text → Download TXT / DOC / HTML / PDF · Paste screenshots with Ctrl+V</p>
      </div>

      {/* Settings bar */}
      <div className="trust-card" style={{padding:'12px 16px',marginBottom:12,display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
        <div>
          <label style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:3}}>Language</label>
          <select value={ocrLang} onChange={e=>setOcrLang(e.target.value)} style={{padding:'5px 8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.82rem'}}>
            {OCR_LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:'0.8rem'}}>
          <div onClick={()=>setAutoRun(v=>!v)} style={{width:32,height:17,borderRadius:8.5,background:autoRun?'#7c3aed':'var(--border-light)',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
            <div style={{position:'absolute',top:1.5,left:autoRun?14:1.5,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
          </div>
          Auto-OCR on upload
        </label>
        <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:'0.8rem'}}>
          <div onClick={()=>setShowLowConf(v=>!v)} style={{width:32,height:17,borderRadius:8.5,background:showLowConf?'#f59e0b':'var(--border-light)',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
            <div style={{position:'absolute',top:1.5,left:showLowConf?14:1.5,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
          </div>
          Highlight low-confidence
        </label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:images.length>0?'280px 1fr':'1fr',gap:20}}>
        <div>
          {/* Upload area */}
          <div onDrop={e=>{e.preventDefault();setDragging(false);Array.from(e.dataTransfer.files).forEach(loadImageFile);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>inputRef.current?.click()}
            style={{border:`2px dashed ${dragging?'#7c3aed':'var(--border-light)'}`,borderRadius:'var(--radius-md)',padding:images.length?'14px':'50px 20px',textAlign:'center',cursor:'pointer',background:dragging?'rgba(124,58,237,0.04)':'var(--bg-section)',marginBottom:10}}>
            <input ref={inputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>{Array.from(e.target.files).forEach(loadImageFile);e.target.value='';}} />
            {images.length===0?(
              <>
                <div style={{fontSize:44,marginBottom:8}}>📄</div>
                <p style={{fontWeight:700,margin:'0 0 4px',fontSize:'0.95rem'}}>Drop images or click to upload</p>
                <p style={{color:'var(--text-secondary)',margin:'0 0 8px',fontSize:'0.82rem'}}>Or press Ctrl+V to paste a screenshot</p>
                <p style={{fontSize:'0.72rem',color:'var(--text-tertiary)',margin:0}}>🔒 OCR runs in your browser</p>
              </>
            ):(
              <p style={{margin:0,fontWeight:600,fontSize:'0.8rem',color:'#7c3aed'}}>+ Add More Images</p>
            )}
          </div>

          {/* Image thumbnails */}
          {images.length>0&&(
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {images.map((img,i)=>(
                <div key={i} onClick={()=>setCurrentIdx(i)} style={{display:'flex',gap:8,padding:'7px 10px',borderRadius:'var(--radius-sm)',border:`1.5px solid ${currentIdx===i?'#7c3aed':'var(--border-light)'}`,background:currentIdx===i?'rgba(124,58,237,0.07)':'var(--bg-section)',cursor:'pointer',alignItems:'center'}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} style={{width:36,height:36,objectFit:'cover',borderRadius:3,flexShrink:0}}/>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:'0.75rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img.name}</div>
                    <div style={{fontSize:'0.66rem',color:'var(--text-tertiary)'}}>
                      {img.confidence!==null?`${img.confidence}% conf`:img.text?'✓ extracted':'Not extracted'}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setImages(prev=>prev.filter((_,j)=>j!==i));if(currentIdx>=images.length-1)setCurrentIdx(Math.max(0,images.length-2));}} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.8rem',padding:0,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* OCR button for current image */}
          {currentImage&&(
            <button onClick={runOCRCurrent} disabled={loading} style={{width:'100%',padding:'9px',marginTop:8,background:loading?'var(--border-light)':'linear-gradient(135deg,#7c3aed,#8b5cf6)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontSize:'0.85rem'}}>
              {loading?(<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite'}}/>{ocrProgress}%</>):'🔍 Run OCR on This Image'}
            </button>
          )}
          {loading&&<div style={{height:4,background:'var(--bg-section)',borderRadius:2,marginTop:6,overflow:'hidden'}}><div style={{height:'100%',width:`${ocrProgress}%`,background:'#7c3aed',borderRadius:2,transition:'width 0.3s'}}/></div>}
        </div>

        {/* Text editor */}
        {currentImage&&(
          <div>
            <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {[['txt','TXT'],['doc','DOC'],['html','HTML'],['pdf','PDF'],['all-txt','All→TXT']].map(([v,l])=>(
                  <button key={v} onClick={()=>setOutputFmt(v)} style={{padding:'5px 8px',borderRadius:'var(--radius-sm)',border:`1px solid ${outputFmt===v?'#7c3aed':'var(--border-light)'}`,background:outputFmt===v?'rgba(124,58,237,0.1)':'var(--bg-section)',color:outputFmt===v?'#7c3aed':'var(--text-secondary)',fontWeight:outputFmt===v?700:400,fontSize:'0.72rem',cursor:'pointer'}}>{l}</button>
                ))}
              </div>
              <button onClick={download} className="btn-primary" style={{padding:'5px 12px',fontSize:'0.82rem'}}>⬇ Download</button>
              <span style={{fontSize:'0.72rem',color:'var(--text-tertiary)',marginLeft:'auto'}}>{wordCount}w · {text.length}c {currentImage.confidence!==null?`· ${currentImage.confidence}% conf`:''}</span>
            </div>

            {/* Low-confidence highlight legend */}
            {showLowConf&&currentImage.lowConfWords?.length>0&&(
              <div style={{padding:'8px 12px',marginBottom:8,background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'var(--radius-sm)',fontSize:'0.75rem',color:'#92400e'}}>
                ⚠️ Low-confidence words (may need correction): {currentImage.lowConfWords.slice(0,10).join(', ')}
                {currentImage.lowConfWords.length>10&&` +${currentImage.lowConfWords.length-10} more`}
              </div>
            )}

            <textarea value={text} onChange={e=>updateText(e.target.value)}
              placeholder={currentImage.text===''&&!loading?'Click "Run OCR" above to extract text, or paste text manually…':''}
              style={{width:'100%',minHeight:380,fontFamily:'system-ui',fontSize:'0.88rem',lineHeight:1.75,padding:14,border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)',background:'var(--bg-main)',color:'var(--text-primary)',resize:'vertical',outline:'none',boxSizing:'border-box'}}
            />
          </div>
        )}

        {images.length===0&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-tertiary)',padding:'40px',textAlign:'center'}}>
            <div><div style={{fontSize:'3rem',marginBottom:8}}>📸</div><p>Upload an image to get started</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
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
