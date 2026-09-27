'use client';
'use client';
// ═══════════════════════════════════════════════════════
// ImageTextEditor.jsx — Main entry component (Option B)
// OCR-powered inline image text editor
// Auto-save: localStorage + sessionStorage
// 100% client-side — image never leaves the browser
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef, useReducer } from 'react';
import dynamic from 'next/dynamic';
import OcrProgressBar from './image-editor/OcrProgressBar';
import SaveStatusBadge from './pdf-editor/SaveStatusBadge';

// Heavy sub-components — lazy loaded
const ImageToolbar    = dynamic(() => import('./image-editor/ImageToolbar'),     { ssr: false });
const ImageCanvas     = dynamic(() => import('./image-editor/ImageCanvas'),      { ssr: false });
const ImageExportModal = dynamic(() => import('./image-editor/ImageExportModal'), { ssr: false });
const FindReplacePanel = dynamic(() => import('./pdf-editor/FindReplacePanel'),   { ssr: false });

const IMG_SAVE_KEY = 'ilt-image-editor-autosave';
const IMG_SESSION_KEY = 'ilt-image-editor-session';

// ── Undo/redo reducer ────────────────────────────────
const MAX_HIST = 60;

function historyReducer(state, action) {
  switch (action.type) {
    case 'PUSH': {
      const past = [...state.past.slice(-MAX_HIST), state.present];
      return { past, present: action.payload, future: [] };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const past    = state.past.slice(0, -1);
      const present = state.past[state.past.length - 1];
      return { past, present, future: [state.present, ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const [present, ...future] = state.future;
      return { past: [...state.past, state.present], present, future };
    }
    case 'RESET':
      return { past: [], present: action.payload, future: [] };
    default:
      return state;
  }
}

// ── Upload zone ──────────────────────────────────────
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

function UploadZone({ onFile, loading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP, GIF or BMP image.');
      return;
    }
    onFile(file);
  };

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#0070F3' : 'var(--border-light)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '56px 40px',
        textAlign: 'center',
        cursor: loading ? 'default' : 'pointer',
        background: dragging ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
        transition: 'all 0.2s',
        maxWidth: 580,
        margin: '0 auto',
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />

      <div style={{ fontSize: 60, marginBottom: 14, lineHeight: 1 }}>🖼️</div>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
        Drop your image here, or click to browse
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 20 }}>
        JPG, PNG, WEBP, GIF, BMP — OCR extracts all text automatically
      </p>

      {/* Format badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 22 }}>
        {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP'].map((t) => (
          <span key={t} style={{
            background: 'var(--bg-main)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-full)', padding: '3px 10px',
            fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)',
          }}>{t}</span>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        style={{
          background: '#0070F3', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', padding: '11px 28px',
          fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Choose Image
      </button>

      <p style={{ marginTop: 18, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
        🔒 Image never leaves your browser — 100% private, no upload, no signup
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────
export default function ImageTextEditor({ t, lang }) {
  // Image state
  const [file, setFile]                 = useState(null);
  const [dataUrl, setDataUrl]           = useState(null);
  const [naturalWidth, setNaturalWidth]   = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // OCR state
  const [ocrState, setOcrState] = useState('idle'); // idle | running | done | error
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrWordCount, setOcrWordCount] = useState(0);

  // Text blocks — managed via undo/redo reducer
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: [], future: [] });
  const blocks   = history.present;
  const canUndo  = history.past.length   > 0;
  const canRedo  = history.future.length > 0;

  // UI state
  const [selectedId, setSelectedId]       = useState(null);
  const [zoom, setZoom]                   = useState(1.0);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [showExport, setShowExport]       = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [toast, setToast]                 = useState(null);

  const containerRef = useRef(null);

  // ── Toast ──────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      if (ctrl && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (ctrl && e.key === 'h') { e.preventDefault(); setShowFindReplace((v) => !v); }
      if (ctrl && e.key === 's') { e.preventDefault(); setShowExport(true); }
      if (e.key === 'Escape')    { setShowFindReplace(false); setShowExport(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Fullscreen ─────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Auto-fit zoom to viewport on load ─────────────
  const fitZoom = useCallback((w, h) => {
    if (!w || !h) return;
    const maxW = Math.min(window.innerWidth  - 200, 1200);
    const maxH = Math.min(window.innerHeight - 220, 900);
    const scale = Math.min(maxW / w, maxH / h, 1.5);
    setZoom(Math.max(0.25, +scale.toFixed(2)));
  }, []);

  // ── File load + OCR ────────────────────────────────
  const handleFile = useCallback(async (f) => {
    setFile(f);
    setOcrState('running');
    setOcrProgress(5);
    setOcrWordCount(0);
    setSelectedId(null);
    dispatch({ type: 'RESET', payload: [] });

    try {
      const { loadImageFile, runOCR } = await import('./image-editor/imageEngine');

      // Load image
      const { dataUrl: url, naturalWidth: nw, naturalHeight: nh } = await loadImageFile(f);
      setDataUrl(url);
      setNaturalWidth(nw);
      setNaturalHeight(nh);
      fitZoom(nw, nh);
      setOcrProgress(15);

      // Run OCR
      const textBlocks = await runOCR(url, (p) => {
        setOcrProgress(p);
        setOcrWordCount((prev) => prev + 1);
      });

      dispatch({ type: 'RESET', payload: textBlocks });
      setOcrWordCount(textBlocks.length);
      setOcrState('done');
      showToast(`✓ OCR complete — ${textBlocks.length} text blocks found`);
    } catch (err) {
      console.error(err);
      setOcrState('error');
      showToast('OCR failed. You can still add text manually.', 'error');
    }
  }, [fitZoom, showToast]);

  // ── Re-run OCR ─────────────────────────────────────
  const rerunOcr = useCallback(async () => {
    if (!dataUrl || ocrState === 'running') return;
    setOcrState('running');
    setOcrProgress(5);
    setOcrWordCount(0);
    try {
      const { runOCR } = await import('./image-editor/imageEngine');
      const textBlocks = await runOCR(dataUrl, (p) => {
        setOcrProgress(p);
        setOcrWordCount((prev) => prev + 1);
      });
      dispatch({ type: 'RESET', payload: textBlocks });
      setOcrWordCount(textBlocks.length);
      setOcrState('done');
      showToast(`✓ Re-scan complete — ${textBlocks.length} blocks`);
    } catch {
      setOcrState('error');
    }
  }, [dataUrl, ocrState, showToast]);

  // ── Block mutations ────────────────────────────────
  const pushBlocks = useCallback((newBlocks) => {
    dispatch({ type: 'PUSH', payload: newBlocks });
  }, []);

  const updateBlock = useCallback((id, changes) => {
    pushBlocks(blocks.map((b) => b.id === id ? { ...b, ...changes } : b));
  }, [blocks, pushBlocks]);

  const deleteBlock = useCallback((id) => {
    pushBlocks(blocks.filter((b) => b.id !== id));
    setSelectedId(null);
  }, [blocks, pushBlocks]);

  const addBlock = useCallback((block) => {
    pushBlocks([...blocks, block]);
    setSelectedId(block.id);
  }, [blocks, pushBlocks]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  const handleBlockChange = useCallback((changes) => {
    if (!selectedId) return;
    updateBlock(selectedId, changes);
  }, [selectedId, updateBlock]);

  // ── Find & Replace ─────────────────────────────────
  const handleFindReplaceAll = useCallback((newPages) => {
    // FindReplacePanel passes pages[] format — unwrap blocks
    const newBlocks = newPages?.[0]?.textBlocks || newPages;
    pushBlocks(Array.isArray(newBlocks) ? newBlocks : blocks);
    showToast('Replace complete!');
  }, [blocks, pushBlocks, showToast]);

  // ── Auto-save blocks to localStorage + sessionStorage ─
  const [imgSaveStatus, setImgSaveStatus] = useState('idle');
  const imgSaveTimer = useRef(null);
  const imgLastSaved = useRef(null);

  useEffect(() => {
    if (!blocks || blocks.length === 0 || !file) return;
    setImgSaveStatus('saving');
    if (imgSaveTimer.current) clearTimeout(imgSaveTimer.current);
    imgSaveTimer.current = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          fileName: file?.name || 'image',
          savedAt: Date.now(),
          blocks: blocks.map(b => ({ id:b.id, text:b.text, x:b.x, y:b.y, width:b.width, height:b.height, fontSize:b.fontSize, fontFamily:b.fontFamily, color:b.color, bold:b.bold, italic:b.italic, underline:b.underline })),
        });
        if (payload.length < 2 * 1024 * 1024) {
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(IMG_SAVE_KEY, payload); } catch(e) { /* quota */ }
            try { sessionStorage.setItem(IMG_SESSION_KEY, payload); } catch(e) { /* quota */ }
          }
        }
        imgLastSaved.current = Date.now();
        setImgSaveStatus('saved');
        setTimeout(() => setImgSaveStatus('idle'), 2000);
      } catch(e) { setImgSaveStatus('error'); }
    }, 1200);
    return () => { if (imgSaveTimer.current) clearTimeout(imgSaveTimer.current); };
  }, [blocks, file]); // eslint-disable-line

  // Wrap blocks as pages for FindReplacePanel compatibility
  const pagesForFR = [{ pageNumber: 1, textBlocks: blocks }];

  // ── Zoom ───────────────────────────────────────────
  const zoomIn    = () => setZoom((z) => Math.min(4,    +(z + 0.25).toFixed(2)));
  const zoomOut   = () => setZoom((z) => Math.max(0.1,  +(z - 0.25).toFixed(2)));
  const zoomReset = () => fitZoom(naturalWidth, naturalHeight);

  // ── Exports ────────────────────────────────────────
  const doExportPng = useCallback(async () => {
    const { flattenToCanvas } = await import('./image-editor/imageEngine');
    const blob = await flattenToCanvas(dataUrl, blocks, naturalWidth, naturalHeight, 'image/png');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name?.replace(/\.[^.]+$/, '') || 'image') + '-edited.png';
    a.click();
    showToast('PNG downloaded!');
  }, [dataUrl, blocks, naturalWidth, naturalHeight, file, showToast]);

  const doExportJpg = useCallback(async () => {
    const { flattenToCanvas } = await import('./image-editor/imageEngine');
    const blob = await flattenToCanvas(dataUrl, blocks, naturalWidth, naturalHeight, 'image/jpeg', 0.92);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name?.replace(/\.[^.]+$/, '') || 'image') + '-edited.jpg';
    a.click();
    showToast('JPG downloaded!');
  }, [dataUrl, blocks, naturalWidth, naturalHeight, file, showToast]);

  const doCopyText = useCallback(async () => {
    const text = blocks.map((b) => b.text).join(' ');
    await navigator.clipboard.writeText(text);
    showToast('Text copied to clipboard!');
  }, [blocks, showToast]);

  // ── Close / new file ───────────────────────────────
  const closeFile = () => {
    setFile(null); setDataUrl(null);
    setNaturalWidth(0); setNaturalHeight(0);
    setOcrState('idle'); setOcrProgress(0);
    dispatch({ type: 'RESET', payload: [] });
    setSelectedId(null);
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════

  // ── No file yet ────────────────────────────────────
  if (!dataUrl && ocrState === 'idle') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <UploadZone onFile={handleFile} loading={false} />

        {/* Feature highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: 14, marginTop: 28,
        }}>
          {[
            { icon: '🔍', title: 'Auto OCR Detection', desc: 'Tesseract.js scans your image and maps every word to an editable block' },
            { icon: '✏️', title: 'Click-to-Edit', desc: 'Click any detected word to change text, font, size, or colour instantly' },
            { icon: '🎨', title: 'Background Eraser', desc: 'Paint over original text with a matching colour before typing new text' },
            { icon: '💾', title: 'Export PNG / JPG', desc: 'Download the final image with all edits baked in — no watermark ever' },
          ].map((f) => (
            <div key={f.title} className="trust-card" style={{ padding: 16, gap: 8 }}>
              <div style={{ fontSize: 26 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── OCR running ────────────────────────────────────
  if (ocrState === 'running') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <OcrProgressBar
          progress={ocrProgress}
          wordCount={ocrWordCount}
          fileName={file?.name}
        />
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        minHeight: 560,
        background: 'var(--bg-main)',
        border: '1px solid var(--border-light)',
        borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toolbar */}
      <ImageToolbar
        selectedBlock={selectedBlock}
        onBlockChange={handleBlockChange}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onRerunOcr={rerunOcr}
        ocrRunning={ocrState === 'running'}
        onAddText={() => addBlock({
          id: `manual-${Date.now()}`,
          text: 'Type here',
          x: 40, y: 40, width: 140, height: 22,
          fontSize: 16, fontFamily: 'sans-serif',
          color: '#000000', bgColor: 'transparent',
          bold: false, italic: false, underline: false,
        })}
        onFindReplace={() => setShowFindReplace((v) => !v)}
        showFindReplace={showFindReplace}
        onExport={() => setShowExport(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        fileName={file?.name}
      />

      {/* Canvas scroll area */}
      <div
        style={{
          flex: 1, overflow: 'auto',
          background: 'var(--bg-tertiary)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: 28, position: 'relative',
        }}
        onClick={() => setSelectedId(null)}
      >
        <ImageCanvas
          dataUrl={dataUrl}
          naturalWidth={naturalWidth}
          naturalHeight={naturalHeight}
          textBlocks={blocks}
          selectedBlockId={selectedId}
          zoom={zoom}
          onSelectBlock={setSelectedId}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onAddBlock={addBlock}
        />

        {/* Find & Replace panel */}
        {showFindReplace && (
          <div
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            <FindReplacePanel
              pages={pagesForFR}
              onReplaceAll={handleFindReplaceAll}
              onClose={() => setShowFindReplace(false)}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: '4px 16px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex', gap: 16, flexShrink: 0,
        fontSize: '0.74rem', color: 'var(--text-secondary)',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span>🖼️ {file?.name}</span>
        <span>{naturalWidth} × {naturalHeight}px</span>
        <span>{blocks.length} text blocks</span>
        {selectedBlock && (
          <span style={{ color: '#0070F3' }}>
            Selected: "{selectedBlock.text.slice(0, 24)}{selectedBlock.text.length > 24 ? '…' : ''}"
          </span>
        )}
        {/* Auto-save badge */}
        <SaveStatusBadge status={imgSaveStatus} lastSavedAt={imgLastSaved.current} />
        <button
          onClick={closeFile}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: '0.74rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
          }}
          title="Close and open a new image"
        >
          ✕ Close
        </button>
      </div>

      {/* Export modal */}
      {showExport && (
        <ImageExportModal
          onClose={() => setShowExport(false)}
          onExportPng={doExportPng}
          onExportJpg={doExportJpg}
          onCopyText={doCopyText}
          fileName={file?.name}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : '#16a34a',
          color: '#fff', padding: '10px 22px', borderRadius: 'var(--radius-full)',
          fontSize: '0.88rem', fontWeight: 600, zIndex: 2000,
          boxShadow: 'var(--shadow-float)', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
