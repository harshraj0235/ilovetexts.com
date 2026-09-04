'use client';
'use client';
// ═══════════════════════════════════════════════════════
// PdfTextEditor.jsx — Advanced PDF Editor (Sejda-beating)
// Features: Edit Text · Annotate · Draw · Sign · Images
//           Links · Redact · Page Manager · Watermark
// Auto-save: localStorage + sessionStorage (dual layer)
// 100% client-side — file never leaves the browser
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from './pdf-editor/UploadZone';
import { useEditorState } from './pdf-editor/useEditorState';
import { useAutoSave } from './pdf-editor/useAutoSave';
import { EDITOR_MODES } from './pdf-editor/ToolbarTop';
import { ANNOTATION_TOOLS } from './pdf-editor/AnnotationLayer';
import SaveStatusBadge from './pdf-editor/SaveStatusBadge';
import { useSaveChanges } from './pdf-editor/useSaveChanges';

const ToolbarTop      = dynamic(() => import('./pdf-editor/ToolbarTop'),      { ssr:false });
const PageSidebar     = dynamic(() => import('./pdf-editor/PageSidebar'),     { ssr:false });
const EditorCanvas    = dynamic(() => import('./pdf-editor/EditorCanvas'),    { ssr:false });
const FindReplacePanel = dynamic(() => import('./pdf-editor/FindReplacePanel'),{ ssr:false });
const ExportModal     = dynamic(() => import('./pdf-editor/ExportModal'),     { ssr:false });
const SignaturePad    = dynamic(() => import('./pdf-editor/SignaturePad'),    { ssr:false });
const WatermarkPanel  = dynamic(() => import('./pdf-editor/WatermarkPanel'), { ssr:false });
const PageManager     = dynamic(() => import('./pdf-editor/PageManager'),     { ssr:false });
const LinkInserter    = dynamic(() => import('./pdf-editor/LinkInserter'),    { ssr:false });
const { ImagePickerButton } = { ImagePickerButton: null }; // loaded inline below

const TEXT_EXT = ['txt','csv','md','markdown','html','htm','xml','json','yaml','yml','toml','js','ts','css','sql'];
const isPdf   = (n) => n?.toLowerCase().endsWith('.pdf');
const isImage = (n) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(n || '');
const isText  = (n) => TEXT_EXT.includes(n?.split('.').pop()?.toLowerCase());

export default function PdfTextEditor({ t, lang }) {
  // ── File ────────────────────────────────────────────
  const [fileName, setFileName]     = useState(null);
  const [loading,  setLoading]      = useState(false);
  const [loadError,setLoadError]    = useState(null);
  const [ocrProgress,setOcrProgress]= useState(null);

  // ── Editor mode ─────────────────────────────────────
  const [mode, setMode]             = useState(EDITOR_MODES.TEXT);

  // ── Active annotation tool ───────────────────────────
  const [activeTool, setActiveTool] = useState(ANNOTATION_TOOLS.HIGHLIGHT);
  const [activeColor,setActiveColor]= useState('#fde047');
  const [activeLineW,setActiveLineW]= useState(2);

  // ── Zoom / fullscreen ────────────────────────────────
  const [zoom,         setZoom]          = useState(1.0);
  const [isFullscreen, setIsFullscreen]  = useState(false);

  // ── UI panels ────────────────────────────────────────
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showExport,      setShowExport]      = useState(false);
  const [showSigPad,      setShowSigPad]      = useState(false);
  const [showWatermark,   setShowWatermark]   = useState(false);
  const [showPageMgr,     setShowPageMgr]     = useState(false);
  const [showLinkInserter,setShowLinkInserter]= useState(false);

  // ── Overlays (images, sigs, links, redactions) ───────
  const [imageOverlays, setImageOverlays] = useState([]);  // {id, pageIndex, dataUrl, x,y,w,h}
  const [links,         setLinks]         = useState([]);  // {id, pageIndex, url, label, x,y,w,h}
  const [redactions,    setRedactions]    = useState([]);  // {id, pageIndex, x,y,w,h, color}
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  // ── Annotations per page ─────────────────────────────
  const [annotationsMap, setAnnotationsMap] = useState({}); // { [pageIdx]: annotation[] }

  // ── Watermark ────────────────────────────────────────
  const [watermark, setWatermark]   = useState({ enabled:false });

  // ── Toast ────────────────────────────────────────────
  const [toast, setToast]           = useState(null);

  // ── Restore session banner ────────────────────────────
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [savedMeta, setSavedMeta]   = useState(null); // { fileName, savedAt, pageCount }

  const containerRef = useRef(null);
  const imagePickerRef = useRef(null);
  const originalPdfBufferRef = useRef(null);

  const {
    pages, currentPage, setCurrentPage,
    selectedBlockId, setSelectedBlockId,
    updateBlock, updateBlockText, addBlock, deleteBlock,
    replaceAllPages, undo, redo, canUndo, canRedo,
  } = useEditorState([]);

  const { lastSavedRef, saveStatus, clearSave, loadSave, hasSave } = useAutoSave(
    pages, fileName,
    { annotationsMap, imageOverlays: imageOverlays.map(o=>({...o, dataUrl: undefined})), links, redactions, watermark }
  );

  // ── Manual Save Changes button ──────────────────────
  // Check on mount if a previous session exists
  useEffect(() => {
    if (hasSave()) {
      try {
        const saved = loadSave();
        if (saved && saved.pages?.length > 0) {
          setSavedMeta({ fileName: saved.fileName, savedAt: saved.savedAt, pageCount: saved.pages.length });
          setShowRestoreBanner(true);
        }
      } catch (e) { /* corrupt save — ignore */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast helper ─────────────────────────────────────
  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Manual Save Changes button ──────────────────────
  // Reads ALL [data-block-id] DOM elements directly —
  // bypasses React state entirely, 100% reliable.
  // Ctrl+Shift+S keyboard shortcut also triggers this.
  const showToastRef = useRef(null);
  showToastRef.current = showToast;

  const { saveChanges, saveStatus: manualSaveStatus } = useSaveChanges(
    pages, replaceAllPages,
    (changed) => showToastRef.current(
      changed > 0
        ? `✓ Saved — ${changed} text change${changed !== 1 ? 's' : ''} committed`
        : '✓ All changes saved'
    )
  );

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key==='z') { e.preventDefault(); undo(); }
      if (ctrl && e.key==='y') { e.preventDefault(); redo(); }
      if (ctrl && e.key==='h') { e.preventDefault(); setShowFindReplace(v=>!v); }
      if (ctrl && e.shiftKey && e.key==='S') { e.preventDefault(); saveChanges(); } // Ctrl+Shift+S = Save Changes
      if (ctrl && e.key==='s' && !e.shiftKey) { e.preventDefault(); setShowExport(true); } // Ctrl+S = Export
      if (e.key==='1') setMode(EDITOR_MODES.TEXT);
      if (e.key==='2') setMode(EDITOR_MODES.ANNOTATE);
      if (e.key==='3') setMode(EDITOR_MODES.DRAW);
      if (e.key==='4') setMode(EDITOR_MODES.SIGN);
      if (e.key==='Escape') { setShowFindReplace(false); setShowExport(false); setShowSigPad(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo]);

  // ── Fullscreen ────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── File loading ──────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    setLoading(true); setLoadError(null); setFileName(file.name);
    setImageOverlays([]); setLinks([]); setRedactions([]); setAnnotationsMap({}); setWatermark({enabled:false});
    try {
      const ab = await file.arrayBuffer();
      originalPdfBufferRef.current = ab;
      if (isPdf(file.name))        await loadPdfFile(ab);
      else if (isImage(file.name)) await loadImageFile(ab, file);
      else if (isText(file.name))  loadTextFile(ab, file.name);
      else setLoadError('Unsupported format. Please upload a PDF, image, or text file.');
    } catch(err) {
      console.error(err);
      setLoadError('Failed to load file: ' + err.message);
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  const loadPdfFile = async (ab) => {
    const { loadPdf, renderPage, renderThumbnail } = await import('./pdf-editor/pdfEngine');
    const doc = await loadPdf(ab);
    const built = [];
    for (let i=1; i<=doc.numPages; i++) {
      const pg = await doc.getPage(i);
      const { canvas, textItems } = await renderPage(pg, 1.5);
      const th = await renderThumbnail(pg);
      built.push({ pageNumber:i, canvasDataUrl:canvas.toDataURL('image/jpeg',0.92), thumbDataUrl:th.toDataURL('image/jpeg',0.75), canvasWidth:canvas.width, canvasHeight:canvas.height, textBlocks:textItems, rotation:0 });
    }
    replaceAllPages(built);
  };

  const loadImageFile = async (ab, file) => {
    const blob = new Blob([ab], { type:file.type });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    await new Promise((res,rej) => { img.onload=res; img.onerror=rej; img.src=url; });
    let textBlocks = [];
    try {
      const T = (await import('tesseract.js')).default;
      setOcrProgress(0);
      const result = await T.recognize(url,'eng',{ logger:(m)=>{ if(m.status==='recognizing text') setOcrProgress(Math.round(m.progress*100)); } });
      setOcrProgress(null);
      textBlocks = result.data.words.map((w,i)=>({
        id:`ocr-${i}`, text:w.text, x:w.bbox.x0, y:w.bbox.y0,
        width:Math.max(w.bbox.x1-w.bbox.x0,20), height:Math.max(w.bbox.y1-w.bbox.y0,14),
        fontSize:Math.max(w.bbox.y1-w.bbox.y0-2,10), fontFamily:'sans-serif', color:'#000000',
        bold:false, italic:false, underline:false,
      })).filter(b=>b.text.trim());
    } catch(e) { console.warn('OCR failed:', e.message); }
    replaceAllPages([{ pageNumber:1, canvasDataUrl:url, thumbDataUrl:url, canvasWidth:img.naturalWidth, canvasHeight:img.naturalHeight, textBlocks, rotation:0 }]);
  };

  const loadTextFile = (ab, name) => {
    const text  = new TextDecoder().decode(ab);
    const lines = text.split('\n');
    const blocks = lines.map((line,i)=>({ id:`l${i}`, text:line, x:20, y:20+i*22, width:Math.max(line.length*7,40), height:18, fontSize:13, fontFamily:'monospace', color:'#111', bold:false, italic:false, underline:false })).filter(b=>b.text.trim());
    replaceAllPages([{ pageNumber:1, canvasDataUrl:null, thumbDataUrl:null, canvasWidth:794, canvasHeight:Math.max(lines.length*22+40,800), textBlocks:blocks, rotation:0 }]);
  };

  // ── Block mutations ───────────────────────────────────
  const currentPageData = pages[currentPage] || null;
  const selectedBlock   = currentPageData?.textBlocks?.find(b=>b.id===selectedBlockId) || null;
  const handleBlockChange = useCallback((ch) => { if (!selectedBlockId) return; updateBlock(currentPage, selectedBlockId, { ...ch, isEdited: true }); }, [selectedBlockId, currentPage, updateBlock]);
  const handleAddTextBlock = useCallback(() => {
    addBlock(currentPage, { id:`blk-${Date.now()}`, text:'New text', x:60, y:60, width:150, height:20, fontSize:14, fontFamily:'sans-serif', color:'#000', bold:false, italic:false, underline:false });
  }, [currentPage, addBlock]);

  // ── Annotation helpers ────────────────────────────────
  const getAnnotations   = (idx) => annotationsMap[idx] || [];
  const setAnnotations   = (idx, anns) => setAnnotationsMap(m=>({...m,[idx]:anns}));

  // ── Overlay helpers ───────────────────────────────────
  const handleUpdateOverlay = useCallback((id, ch) => {
    setImageOverlays(prev => prev.map(o => o.id===id ? {...o,...ch} : o));
    setLinks(prev => prev.map(l => l.id===id ? {...l,...ch} : l));
  }, []);
  const handleDeleteOverlay = useCallback((id) => {
    setImageOverlays(prev => prev.filter(o => o.id!==id));
    setLinks(prev => prev.filter(l => l.id!==id));
    setRedactions(prev => prev.filter(r => r.id!==id));
    setSelectedOverlayId(null);
  }, []);

  // ── Signature insert ──────────────────────────────────
  const handleSignatureInsert = useCallback((sig) => {
    setImageOverlays(prev => [...prev, { ...sig, id:`sig-${Date.now()}`, pageIndex:currentPage, x:60, y:60 }]);
    setShowSigPad(false);
    showToast('Signature added — drag to position it');
  }, [currentPage, showToast]);

  // ── Image insert ──────────────────────────────────────
  const handleImageReady = useCallback((img) => {
    setImageOverlays(prev => [...prev, { ...img, pageIndex:currentPage }]);
    showToast('Image inserted — drag to position it');
  }, [currentPage, showToast]);

  // ── Link insert ───────────────────────────────────────
  const handleLinkInsert = useCallback((link) => {
    setLinks(prev => [...prev, { ...link, pageIndex:currentPage }]);
    setShowLinkInserter(false);
    showToast('Link added — drag the green region to position it');
  }, [currentPage, showToast]);

  // ── Redact helpers ────────────────────────────────────
  const handleAddRedact    = useCallback((r) => setRedactions(prev=>[...prev,r]), []);
  const handleUpdateRedact = useCallback((id,ch) => setRedactions(prev=>prev.map(r=>r.id===id?{...r,...ch}:r)), []);
  const handleDeleteRedact = useCallback((id) => setRedactions(prev=>prev.filter(r=>r.id!==id)), []);

  // ── Page manager ──────────────────────────────────────
  const handlePagesChange = useCallback((newPages) => {
    replaceAllPages(newPages);
    setAnnotationsMap(m => {
      const next = {};
      newPages.forEach((p,i) => { if (m[p._origIdx] !== undefined) next[i] = m[p._origIdx]; });
      return next;
    });
  }, [replaceAllPages]);

  // ── Find & Replace ────────────────────────────────────
  const handleFindReplaceAll = useCallback((newPages) => {
    replaceAllPages(newPages);
    showToast('Replace complete!');
  }, [replaceAllPages, showToast]);

  // ── Zoom ─────────────────────────────────────────────
  const zoomIn    = () => setZoom(z=>Math.min(3,+(z+0.25).toFixed(2)));
  const zoomOut   = () => setZoom(z=>Math.max(0.25,+(z-0.25).toFixed(2)));
  const zoomReset = () => setZoom(1.0);

  // ── Export helpers ────────────────────────────────────
  const doExportTxt = useCallback(async () => {
    const text = pages.map(p=>p.textBlocks?.map(b=>b.text).join(' ')).join('\n\n');
    const blob = new Blob([text],{type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(fileName?.replace(/\.[^.]+$/,'')||'doc')+'-edited.txt'; a.click();
    showToast('TXT downloaded!');
  }, [pages, fileName, showToast]);

  const doExportPng = useCallback(async () => {
    for (let i=0; i<pages.length; i++) {
      const page = pages[i];
      const canvas = document.createElement('canvas');
      canvas.width  = page.canvasWidth  || 794;
      canvas.height = page.canvasHeight || 1123;
      const ctx = canvas.getContext('2d');

      if (page.canvasDataUrl) {
        const img = new Image(); img.src=page.canvasDataUrl;
        await new Promise(r=>{img.onload=r;});
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
      } else { ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }

      // Draw redactions
      const pRedacts = redactions.filter(r=>r.pageIndex===i);
      pRedacts.forEach(r=>{ ctx.fillStyle=r.color||'#000'; ctx.fillRect(r.x,r.y,r.w,r.h); });

      // Draw annotations
      const { default: AL } = await import('./pdf-editor/AnnotationLayer');
      // (annotations baked inline since they're already on a separate canvas — re-draw them)
      const anns = getAnnotations(i);
      for (const ann of anns) {
        ctx.save();
        ctx.strokeStyle=ann.color||'#f59e0b'; ctx.fillStyle=ann.color||'#f59e0b';
        ctx.lineWidth=ann.lineWidth||2;
        switch(ann.tool) {
          case 'highlight': ctx.globalAlpha=0.35; ctx.fillRect(ann.x,ann.y,ann.w,ann.h); break;
          case 'freehand': if(ann.points?.length>1){ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ann.points[0].x,ann.points[0].y);ann.points.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();} break;
          case 'rect': ctx.strokeRect(ann.x,ann.y,ann.w,ann.h); break;
          default: break;
        }
        ctx.restore();
      }

      // Draw text blocks
      const blocks = page.textBlocks || [];
      for (const b of blocks) {
        if (!b.text?.trim()) continue;
        // If the page has a background image, unedited text is already visible on it.
        // Drawing it again causes a double-text overlap. Skip unedited blocks.
        if (page.canvasDataUrl && !b.isEdited) continue;

        ctx.save();
        if (b.isEdited) {
          const pad = 2;
          ctx.fillStyle = b.bgColor || '#ffffff';
          ctx.fillRect(b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2);
        }
        let fStr=''; if(b.italic)fStr+='italic '; if(b.bold)fStr+='bold '; fStr+=`${b.fontSize||12}px ${b.fontFamily||'sans-serif'}`;
        ctx.font=fStr; ctx.fillStyle=b.color||'#000'; ctx.textBaseline='top';
        ctx.fillText(b.text,b.x,b.y);
        ctx.restore();
      }

      // Draw image overlays
      const pImgs = imageOverlays.filter(o=>o.pageIndex===i);
      for (const o of pImgs) {
        const img=new Image(); img.src=o.dataUrl;
        await new Promise(r=>{img.onload=r;img.onerror=r;});
        ctx.drawImage(img,o.x,o.y,o.width,o.height);
      }

      // Draw watermark
      if (watermark?.enabled && watermark?.text) {
        ctx.save();
        ctx.font=`${watermark.bold?'bold ':''}${watermark.fontSize||64}px sans-serif`;
        ctx.fillStyle=watermark.color||'#ff0000';
        ctx.globalAlpha=watermark.opacity??0.25;
        ctx.translate(canvas.width/2,canvas.height/2);
        ctx.rotate((watermark.rotation??-35)*Math.PI/180);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(watermark.text,0,0);
        ctx.restore();
      }

      const blob = await new Promise(r=>canvas.toBlob(r,'image/png'));
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download=`${fileName?.replace(/\.[^.]+$/,'')||'page'}-${i+1}.png`; a.click();
    }
    showToast('PNG exported!');
  }, [pages, redactions, imageOverlays, watermark, fileName, showToast, annotationsMap]); // eslint-disable-line

  const doExportPdf = useCallback(async () => {
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      let pdfDoc;
      let isNativePdf = false;

      // 1. Load native PDF or create new
      if (originalPdfBufferRef.current && isPdf(fileName)) {
        try {
          pdfDoc = await PDFDocument.load(originalPdfBufferRef.current);
          isNativePdf = true;
        } catch (e) {
          pdfDoc = await PDFDocument.create();
        }
      } else {
        pdfDoc = await PDFDocument.create();
      }

      // Embed standard fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

      const px2pt = (px) => px * 0.75;
      const pdfPages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let pdfPage;
        const W = page.canvasWidth || 794;
        const H = page.canvasHeight || 1123;

        if (isNativePdf && i < pdfPages.length) {
          pdfPage = pdfPages[i];
        } else {
          pdfPage = pdfDoc.addPage([px2pt(W), px2pt(H)]);
          if (page.canvasDataUrl) {
            let img;
            if (page.canvasDataUrl.startsWith('data:image/png')) img = await pdfDoc.embedPng(page.canvasDataUrl);
            else img = await pdfDoc.embedJpg(page.canvasDataUrl);
            pdfPage.drawImage(img, { x: 0, y: 0, width: px2pt(W), height: px2pt(H) });
          }
        }

        const pageHeight = pdfPage.getHeight();

        // Draw redactions
        const pRedacts = redactions.filter(r => r.pageIndex === i);
        for (const r of pRedacts) {
          pdfPage.drawRectangle({
            x: px2pt(r.x),
            y: pageHeight - px2pt(r.y) - px2pt(r.h),
            width: px2pt(r.w),
            height: px2pt(r.h),
            color: rgb(0,0,0)
          });
        }

        // Draw text blocks
        for (const b of (page.textBlocks || [])) {
          if (!b.text?.trim()) continue;
          if (isNativePdf && !b.isEdited) continue; // Skip unedited if native PDF

          if (b.isEdited) {
            const pad = 2;
            const hx = (b.bgColor || '#ffffff').replace('#','');
            const rVal = parseInt(hx.slice(0,2),16)/255;
            const gVal = parseInt(hx.slice(2,4),16)/255;
            const bVal = parseInt(hx.slice(4,6),16)/255;
            
            pdfPage.drawRectangle({
              x: px2pt(b.x - pad),
              y: pageHeight - px2pt(b.y - pad) - px2pt(b.height + pad * 2),
              width: px2pt(b.width + pad * 2),
              height: px2pt(b.height + pad * 2),
              color: rgb(rVal, gVal, bVal)
            });
          }

          let font = helveticaFont;
          if (b.bold && b.italic) font = helveticaBoldOblique;
          else if (b.bold) font = helveticaBold;
          else if (b.italic) font = helveticaOblique;

          let rCol=0, gCol=0, bCol=0;
          if (b.color && b.color !== '#000000') {
             const hx = b.color.replace('#','');
             rCol = parseInt(hx.slice(0,2),16)/255;
             gCol = parseInt(hx.slice(2,4),16)/255;
             bCol = parseInt(hx.slice(4,6),16)/255;
          }

          const fontSize = b.fontSize || 12;
          pdfPage.drawText(b.text, {
            x: px2pt(b.x),
            y: pageHeight - px2pt(b.y) - px2pt(fontSize), 
            size: px2pt(fontSize),
            font: font,
            color: rgb(rCol, gCol, bCol),
            lineHeight: px2pt(fontSize * 1.2)
          });
        }

        // Image overlays
        const pImgs = imageOverlays.filter(o => o.pageIndex === i);
        for (const o of pImgs) {
          let imgObj;
          if (o.dataUrl.startsWith('data:image/png')) imgObj = await pdfDoc.embedPng(o.dataUrl);
          else imgObj = await pdfDoc.embedJpg(o.dataUrl);
          pdfPage.drawImage(imgObj, { x: px2pt(o.x), y: pageHeight - px2pt(o.y) - px2pt(o.height), width: px2pt(o.width), height: px2pt(o.height) });
        }
        
        // Annotations
        const anns = getAnnotations(i);
        if (anns.length > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext('2d');
          for (const ann of anns) {
            ctx.save();
            ctx.strokeStyle=ann.color||'#f59e0b'; ctx.fillStyle=ann.color||'#f59e0b';
            ctx.lineWidth=ann.lineWidth||2;
            switch(ann.tool) {
              case 'highlight': ctx.globalAlpha=0.35; ctx.fillRect(ann.x,ann.y,ann.w,ann.h); break;
              case 'freehand': if(ann.points?.length>1){ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ann.points[0].x,ann.points[0].y);ann.points.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();} break;
              case 'rect': ctx.strokeRect(ann.x,ann.y,ann.w,ann.h); break;
            }
            ctx.restore();
          }
          const annImg = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
          pdfPage.drawImage(annImg, { x: 0, y: 0, width: px2pt(W), height: px2pt(H) });
        }

        // Watermark
        if (watermark?.enabled && watermark?.text) {
          const wFontSize = px2pt(watermark.fontSize || 64);
          let wr=1, wg=0, wb=0;
          if (watermark.color) {
             const hx = watermark.color.replace('#','');
             wr = parseInt(hx.slice(0,2),16)/255;
             wg = parseInt(hx.slice(2,4),16)/255;
             wb = parseInt(hx.slice(4,6),16)/255;
          }
          const textWidth = helveticaBold.widthOfTextAtSize(watermark.text, wFontSize);
          pdfPage.drawText(watermark.text, {
            x: px2pt(W/2) - (textWidth/2),
            y: pageHeight / 2,
            size: wFontSize,
            font: helveticaBold,
            color: rgb(wr,wg,wb),
            opacity: watermark.opacity ?? 0.25,
            rotate: degrees(-(watermark.rotation ?? -35))
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (fileName?.replace(/\.[^.]+$/,'') || 'document') + '-edited.pdf';
      a.click();
      showToast('PDF downloaded!');
    } catch (e) {
      console.error('PDF-lib export failed:', e); 
      await doExportPng();
    }
  }, [pages, redactions, watermark, fileName, showToast, doExportPng, imageOverlays, getAnnotations]);

  // ── Mode change → set sensible default tool ───────────
  const handleModeChange = useCallback((m) => {
    setMode(m);
    if (m===EDITOR_MODES.ANNOTATE) setActiveTool(ANNOTATION_TOOLS.HIGHLIGHT);
    if (m===EDITOR_MODES.DRAW)     setActiveTool(ANNOTATION_TOOLS.FREEHAND);
    if (m===EDITOR_MODES.REDACT)   setActiveTool('redact-draw');
    if (m===EDITOR_MODES.IMAGES) {
      // Trigger image picker via dynamic import
      import('./pdf-editor/ImageInserter').then(mod => {
        // Can't imperatively click — handled by toolbar button calling onAddImage
      });
    }
  }, []);

  const handleAddImageFromToolbar = useCallback(() => {
    if (imagePickerRef.current) imagePickerRef.current.click();
  }, []);

  // ── No file yet ──────────────────────────────────────
  if (pages.length===0 && !loading) {
    return (
      <div style={{ maxWidth:820, margin:'0 auto', width:'100%' }}>
        {loadError && (
          <div style={{ marginBottom:16, padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius-md)', color:'#ef4444', fontSize:'0.9rem' }}>
            ⚠️ {loadError}
          </div>
        )}

        {/* Restore previous session banner */}
        {showRestoreBanner && savedMeta && (
          <div style={{
            marginBottom:16, padding:'14px 18px',
            background:'rgba(0,112,243,0.06)',
            border:'1px solid rgba(0,112,243,0.25)',
            borderRadius:'var(--radius-md)',
            display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
          }}>
            <span style={{ fontSize:22 }}>🔄</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>
                Previous session found
              </div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:2 }}>
                <strong>{savedMeta.fileName}</strong> · {savedMeta.pageCount} page{savedMeta.pageCount!==1?'s':''} · saved {new Date(savedMeta.savedAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => {
                  const saved = loadSave();
                  if (saved?.pages?.length > 0) {
                    // Restore pages (without canvas images — user needs to re-upload for those,
                    // but text edits are preserved)
                    const restored = saved.pages.map(p => ({
                      ...p,
                      canvasDataUrl: null,
                      thumbDataUrl: null,
                      textBlocks: p.textBlocks || [],
                    }));
                    setFileName(saved.fileName);
                    replaceAllPages(restored);
                    if (saved.watermark) setWatermark(saved.watermark);
                    setShowRestoreBanner(false);
                    showToast('Session restored — re-upload your PDF to see the page background');
                  }
                }}
                style={{ padding:'7px 16px', borderRadius:'var(--radius-sm)', background:'#0070F3', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:700 }}
              >
                Restore
              </button>
              <button
                onClick={() => { clearSave(); setShowRestoreBanner(false); setSavedMeta(null); }}
                style={{ padding:'7px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.85rem' }}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <UploadZone onFile={handleFile} loading={false} />

        {/* Feature grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginTop:28 }}>
          {[
            { icon:'✏️', title:'Edit Any Text',      desc:'Click any word to edit it — works on scanned PDFs with OCR' },
            { icon:'🖊️', title:'Highlight & Annotate',desc:'Highlight, strikethrough, underline, add comments' },
            { icon:'🖌️', title:'Draw Freely',         desc:'Freehand pen, shapes, arrows — all on your PDF' },
            { icon:'✍️', title:'E-Sign Documents',     desc:'Draw or type your signature, place anywhere on any page' },
            { icon:'🖼️', title:'Insert Images',        desc:'Add logos, stamps, photos on top of any page' },
            { icon:'⬛', title:'Redact Sensitive Data', desc:'Permanently black out private information before sharing' },
            { icon:'📄', title:'Manage Pages',          desc:'Reorder, rotate, or delete individual pages' },
            { icon:'🔖', title:'Add Watermark',         desc:'Stamp CONFIDENTIAL, DRAFT, or any custom text across all pages' },
          ].map(f => (
            <div key={f.title} className="trust-card" style={{ padding:16, gap:8 }}>
              <div style={{ fontSize:26 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{f.title}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* vs Sejda callout */}
        <div style={{ marginTop:24, padding:'14px 18px', background:'rgba(0,112,243,0.05)', border:'1px solid rgba(0,112,243,0.2)', borderRadius:'var(--radius-md)', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
          <strong style={{ color:'#0070F3' }}>✓ Better than Sejda:</strong> No 3-task/hour limit · No 50-page limit · No file upload to servers · No signup · No watermark · Completely free forever
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth:820, margin:'0 auto' }}>
        <UploadZone onFile={handleFile} loading={true} />
        {ocrProgress!==null && (
          <div style={{ marginTop:16, textAlign:'center' }}>
            <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:6 }}>OCR: {ocrProgress}%</div>
            <div style={{ height:6, background:'var(--bg-tertiary)', borderRadius:3 }}>
              <div style={{ height:'100%', width:`${ocrProgress}%`, background:'#0070F3', borderRadius:3, transition:'width 0.3s' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Editor ───────────────────────────────────────────
  return (
    <div ref={containerRef} style={{
      display:'flex', flexDirection:'column',
      height: isFullscreen ? '100vh' : 'calc(100vh - 110px)',
      minHeight:600, background:'var(--bg-main)',
      border:'1px solid var(--border-light)',
      borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
      overflow:'hidden', position:'relative',
    }}>

      {/* Toolbar */}
      <ToolbarTop
        mode={mode} onModeChange={handleModeChange}
        selectedBlock={selectedBlock} onBlockChange={handleBlockChange}
        activeTool={activeTool} onToolChange={setActiveTool}
        activeColor={activeColor} onColorChange={setActiveColor}
        activeLineWidth={activeLineW} onLineWidthChange={setActiveLineW}
        zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={zoomReset}
        canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
        pageCount={pages.length} currentPage={currentPage} onPageChange={setCurrentPage}
        onAddTextBlock={handleAddTextBlock}
        onAddSignature={() => setShowSigPad(true)}
        onAddImage={handleAddImageFromToolbar}
        onAddLink={() => setShowLinkInserter(true)}
        onOpenWatermark={() => setShowWatermark(true)}
        onOpenPages={() => setShowPageMgr(true)}
        onFindReplace={() => setShowFindReplace(v=>!v)} showFindReplace={showFindReplace}
        onSaveChanges={saveChanges}
        saveStatus={manualSaveStatus}
        onExport={() => setShowExport(true)}
        isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
        fileName={fileName}
      />

      {/* Body */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        <PageSidebar pages={pages} currentPage={currentPage} onSelectPage={setCurrentPage} />

        <div
          style={{ flex:1, overflow:'auto', padding:24, background:'var(--bg-tertiary)', display:'flex', justifyContent:'center', alignItems:'flex-start' }}
          onClick={() => { setSelectedBlockId(null); setSelectedOverlayId(null); }}
        >
          <EditorCanvas
            page={currentPageData}
            pageIndex={currentPage}
            zoom={zoom}
            mode={mode}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onUpdateBlock={updateBlock}
            onUpdateBlockText={updateBlockText}
            onDeleteBlock={deleteBlock}
            onAddBlock={addBlock}
            annotations={getAnnotations(currentPage)}
            onAnnotationsChange={(anns) => setAnnotations(currentPage, anns)}
            activeTool={activeTool}
            activeColor={activeColor}
            activeLineWidth={activeLineW}
            imageOverlays={imageOverlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={setSelectedOverlayId}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            redactions={redactions}
            onAddRedact={handleAddRedact}
            onUpdateRedact={handleUpdateRedact}
            onDeleteRedact={handleDeleteRedact}
            links={links}
            onUpdateLink={handleUpdateOverlay}
            onDeleteLink={(id) => setLinks(prev=>prev.filter(l=>l.id!==id))}
            watermark={watermark}
          />

          {/* Find & Replace panel */}
          {showFindReplace && (
            <div style={{ position:'absolute', top:8, right:8, zIndex:100 }} onClick={e=>e.stopPropagation()}>
              <FindReplacePanel pages={pages} onReplaceAll={handleFindReplaceAll} onClose={()=>setShowFindReplace(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding:'4px 14px', background:'var(--bg-secondary)', borderTop:'1px solid var(--border-light)', display:'flex', gap:16, flexShrink:0, fontSize:'0.73rem', color:'var(--text-secondary)', alignItems:'center', flexWrap:'wrap' }}>
        <span>📄 {fileName}</span>
        <span>{pages.length} page{pages.length!==1?'s':''}</span>
        <span>Pg {currentPage+1}</span>
        <span>{currentPageData?.textBlocks?.length||0} text blocks</span>
        {watermark?.enabled && <span style={{ color:'#f59e0b' }}>🔖 Watermark</span>}
        {redactions.length>0 && <span style={{ color:'#ef4444' }}>⬛ {redactions.length} redaction{redactions.length!==1?'s':''}</span>}
        {/* Auto-save badge */}
        <SaveStatusBadge status={saveStatus} lastSavedAt={lastSavedRef.current} />
        <button onClick={() => { replaceAllPages([]); setFileName(null); setImageOverlays([]); setLinks([]); setRedactions([]); setAnnotationsMap({}); clearSave(); }}
          style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'0.73rem', padding:'2px 6px', borderRadius:'var(--radius-sm)' }}>
          ✕ Close
        </button>
      </div>

      {/* Hidden image file input */}
      <input ref={imagePickerRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]; e.target.value='';
          if (!file) return;
          const { ImagePickerButton: _, ...mod } = await import('./pdf-editor/ImageInserter');
          // Read file manually
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              handleImageReady({ id:`img-${Date.now()}`, type:'image', dataUrl:ev.target.result, x:40, y:40, width:Math.min(img.naturalWidth,200), height:Math.min(img.naturalHeight,200) });
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }}
      />

      {/* Signature modal */}
      {showSigPad && <SignaturePad onInsert={handleSignatureInsert} onClose={()=>setShowSigPad(false)} />}

      {/* Watermark modal */}
      {showWatermark && <WatermarkPanel watermark={watermark} onChange={setWatermark} onClose={()=>setShowWatermark(false)} />}

      {/* Page manager modal */}
      {showPageMgr && <PageManager pages={pages} currentPage={currentPage} onPagesChange={handlePagesChange} onClose={()=>setShowPageMgr(false)} />}

      {/* Link inserter modal */}
      {showLinkInserter && <LinkInserter onInsert={handleLinkInsert} onClose={()=>setShowLinkInserter(false)} />}

      {/* Export modal */}
      {showExport && (
        <ExportModal
          pages={pages}
          fileName={fileName}
          onClose={()=>setShowExport(false)}
          onExportPdf={doExportPdf}
          onExportPng={doExportPng}
          onExportTxt={doExportTxt}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:toast.type==='error'?'#ef4444':'#16a34a', color:'#fff', padding:'10px 22px', borderRadius:'var(--radius-full)', fontSize:'0.88rem', fontWeight:600, zIndex:2000, boxShadow:'var(--shadow-float)', pointerEvents:'none' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
