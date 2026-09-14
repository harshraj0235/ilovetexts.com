'use client';
/* eslint-disable @next/next/no-img-element -- PDF pages are runtime-generated data URLs. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildStandaloneFlipbook, FLIPBOOK_LIMITS, FLIPBOOK_TEMPLATES, safeFlipbookTitle, safeHtmlFileName } from '@/lib/flipbook-utils.mjs';
import styles from './FlipbookMaker.module.css';

export default function FlipbookMaker() {
  const inputRef = useRef(null);
  const stageRef = useRef(null);
  const timerRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('My flipbook');
  const [template, setTemplate] = useState('studio');
  const [speed, setSpeed] = useState(650);
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const theme = FLIPBOOK_TEMPLATES[template];
  const goTo = useCallback((next) => {
    if (!pages.length || turning) return;
    setTurning(true);
    window.setTimeout(() => {
      setPage((next + pages.length) % pages.length);
      setTurning(false);
    }, Math.max(100, speed / 3));
  }, [pages.length, speed, turning]);

  useEffect(() => {
    if (!autoplay || pages.length < 2) return undefined;
    timerRef.current = window.setInterval(() => setPage((current) => (current + 1) % pages.length), 3500);
    return () => window.clearInterval(timerRef.current);
  }, [autoplay, pages.length]);

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === 'ArrowLeft') goTo(page - 1);
      if (event.key === 'ArrowRight') goTo(page + 1);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [goTo, page]);

  async function loadPdf(file) {
    if (!file) return;
    setError('');
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) { setError('Choose a PDF file to create a flipbook.'); return; }
    if (!file.size) { setError('This PDF is empty.'); return; }
    if (file.size > FLIPBOOK_LIMITS.maxBytes) { setError('This PDF is larger than 50 MB. Choose a smaller file for reliable browser processing.'); return; }
    let document;
    try {
      setProgress('Reading your PDF…');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      if (document.numPages > FLIPBOOK_LIMITS.maxPages) throw new Error(`This free browser version supports up to ${FLIPBOOK_LIMITS.maxPages} pages.`);
      const rendered = [];
      for (let index = 1; index <= document.numPages; index += 1) {
        setProgress(`Designing page ${index} of ${document.numPages}…`);
        const pdfPage = await document.getPage(index);
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(1.6, 1200 / base.width);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        rendered.push(canvas.toDataURL('image/jpeg', .86));
        pdfPage.cleanup();
      }
      const baseTitle = file.name.replace(/\.pdf$/i, '');
      setPages(rendered); setFileName(file.name); setTitle(safeFlipbookTitle(baseTitle)); setPage(0);
    } catch (loadError) {
      setError(loadError.message?.includes('supports up to') ? loadError.message : 'Could not create a flipbook from this PDF. It may be damaged or password-protected.');
    } finally {
      await document?.destroy(); setProgress('');
    }
  }

  function downloadHtml() {
    const html = buildStandaloneFlipbook({ title, pages, template, pageDuration: speed });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = safeHtmlFileName(title); anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function copyEmbed() {
    const name = safeHtmlFileName(title);
    navigator.clipboard.writeText(`<iframe src="${name}" title="${safeFlipbookTitle(title)}" width="100%" height="650" loading="lazy" allow="fullscreen"></iframe>`)
      .then(() => setProgress('Embed code copied — upload the HTML file beside the page where you use it.'))
      .catch(() => setError('Clipboard access was blocked. Download the HTML flipbook and embed it with an iframe.'));
    window.setTimeout(() => setProgress(''), 3500);
  }

  return <section className={styles.shell} aria-label="PDF flipbook maker">
    {error && <div className={styles.error} role="alert">⚠️ {error}</div>}
    {progress && <div className={styles.progress} role="status">✦ {progress}</div>}
    {!pages.length ? <>
      <div className={styles.notice}><span aria-hidden="true">🔒</span><div><strong>Private, local conversion</strong><span>Your PDF stays on this device. No account, upload, or watermark.</span></div></div>
      <div className={`${styles.drop} ${dragging ? styles.dropActive : ''}`} onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(e)=>{e.preventDefault();setDragging(false);loadPdf(e.dataTransfer.files[0])}}>
        <div aria-hidden="true" style={{fontSize:50}}>📖</div><h2>Turn your PDF into a flipbook</h2><p>Create an interactive, branded reader you can download and host anywhere.</p>
        <button className={styles.primary} type="button" onClick={()=>inputRef.current?.click()}>Choose a PDF</button><span className={styles.hint}>PDF up to 50 MB and 40 pages · processed in your browser</span>
      </div><input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(e)=>{loadPdf(e.target.files[0]);e.target.value=''}} />
    </> : <div className={styles.editor}>
      <aside className={styles.panel} aria-label="Flipbook customization">
        <h3>Customize your flipbook</h3>
        <div className={styles.field}><label htmlFor="flip-title">Publication title</label><input id="flip-title" value={title} maxLength={100} onChange={(e)=>setTitle(e.target.value)} /></div>
        <div className={styles.field}><label>Design template</label><div className={styles.templates}>{Object.entries(FLIPBOOK_TEMPLATES).map(([id,item])=><button type="button" key={id} className={`${styles.template} ${template===id?styles.templateActive:''}`} onClick={()=>setTemplate(id)}><span className={styles.swatch} style={{background:`linear-gradient(135deg,${item.background},${item.accent})`}} />{item.name}</button>)}</div></div>
        <div className={styles.field}><label htmlFor="flip-speed">Page-turn speed</label><select id="flip-speed" value={speed} onChange={(e)=>setSpeed(Number(e.target.value))}><option value="300">Quick</option><option value="650">Natural</option><option value="1000">Cinematic</option></select></div>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:'.8rem',marginBottom:12}}><input type="checkbox" checked={autoplay} onChange={(e)=>setAutoplay(e.target.checked)} /> Auto-play every 3.5 seconds</label>
        <div className={styles.stats}><div className={styles.stat}><strong>{pages.length}</strong><span>pages</span></div><div className={styles.stat}><strong>{template}</strong><span>theme</span></div><div className={styles.stat}><strong>HTML</strong><span>portable</span></div></div>
        <div className={styles.actions}><button className={styles.primary} type="button" onClick={downloadHtml}>Download flipbook</button><button className={styles.secondary} type="button" onClick={copyEmbed}>Copy embed code</button><button className={styles.secondary} type="button" onClick={()=>{setPages([]);setFileName('');setAutoplay(false);setError('')}}>Choose another PDF</button></div>
      </aside>
      <div className={styles.stageWrap}>
        <div className={styles.toolbar}><strong title={fileName}>📖 {safeFlipbookTitle(title)}</strong><div className={styles.toolbarActions}><button className={styles.toolButton} type="button" onClick={()=>setAutoplay(v=>!v)} aria-label={autoplay?'Pause autoplay':'Start autoplay'}>{autoplay?'❚❚':'▶'}</button><button className={styles.toolButton} type="button" onClick={()=>stageRef.current?.requestFullscreen?.()} aria-label="Open fullscreen">⛶</button></div></div>
        <div ref={stageRef} className={styles.stage} style={{'--flip-bg':theme.background,'--flip-surface':theme.surface,'--flip-speed':`${speed}ms`}}>
          <button className={`${styles.nav} ${styles.prev}`} type="button" onClick={()=>goTo(page-1)} aria-label="Previous page">←</button>
          <img className={`${styles.page} ${turning?styles.turning:''}`} src={pages[page]} alt={`Page ${page+1} of ${pages.length}`} />
          <button className={`${styles.nav} ${styles.next}`} type="button" onClick={()=>goTo(page+1)} aria-label="Next page">→</button><span className={styles.counter}>{page+1} / {pages.length}</span>
        </div>
        <div className={styles.thumbs} aria-label="Page thumbnails">{pages.map((src,index)=><button type="button" className={`${styles.thumb} ${index===page?styles.thumbActive:''}`} key={index} onClick={()=>goTo(index)} aria-label={`Go to page ${index+1}`}><img src={src} alt="" /></button>)}</div>
      </div>
    </div>}
  </section>;
}
