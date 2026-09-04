'use client';
// ═══════════════════════════════════════════════════════
// PdfMergePanel.jsx v3 — Merge multiple PDFs into one
//
// FIXES vs v2:
//  1. Removed double-close: onMerged() in parent already
//     calls setShowMergePanel(false) — calling onClose()
//     here caused a race condition where the modal would
//     close before the merged file was fully loaded.
//
//  2. Fixed stale closure: handleMerge used to depend on
//     `files` state but was invoked from useEffect during
//     init with `loaded` — files was still empty. Now we
//     use a filesRef so handleMerge always sees latest.
//
//  3. Added drag-and-drop reorder via HTML5 drag API.
//
//  4. Added file size display + total size.
//
//  5. Better progress reporting with page counts.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef } from 'react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfMergePanel({ initialFiles = [], autoStart = false, onMerged, onClose }) {
  // Store File objects — never pre-read the buffers
  const [files,    setFiles]    = useState([]); // [{name, file, pageCount, size}]
  const [merging,  setMerging]  = useState(false);
  const [progress, setProgress] = useState('');
  const [error,    setError]    = useState('');
  const [dragIdx,  setDragIdx]  = useState(null); // drag-and-drop reorder
  const addInputRef = useRef(null);

  // Always-fresh ref so handleMerge never sees stale files
  const filesRef = useRef([]);
  filesRef.current = files;

  const handleMerge = useCallback(async (filesToMerge) => {
    // Use passed argument or fall back to ref (never stale state)
    const list = filesToMerge || filesRef.current;
    if (list.length < 2) { setError('Add at least 2 PDFs to merge.'); return; }
    setMerging(true);
    setError('');
    setProgress('Initialising…');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      let totalPagesCopied = 0;

      for (let i = 0; i < list.length; i++) {
        const { name, file } = list[i];
        setProgress(`Reading ${name} (${i + 1}/${list.length})…`);

        // Fresh read at merge time — guaranteed non-detached
        const ab = await file.arrayBuffer();

        let src;
        try {
          src = await PDFDocument.load(ab, { ignoreEncryption: true });
        } catch (loadErr) {
          const msg = loadErr.message || '';
          if (msg.toLowerCase().includes('encrypt')) {
            throw new Error(
              `"${name}" is password-protected. Remove the password first, then retry.`
            );
          }
          throw new Error(`Failed to read "${name}": ${msg}`);
        }

        const pageCount = src.getPageCount();
        setProgress(`Copying ${pageCount} page${pageCount !== 1 ? 's' : ''} from ${name}…`);
        const indices = src.getPageIndices();
        const copied  = await merged.copyPages(src, indices);
        copied.forEach(p => merged.addPage(p));
        totalPagesCopied += pageCount;
      }

      setProgress(`Building merged PDF (${totalPagesCopied} pages)…`);
      const bytes = await merged.save();
      const blob  = new Blob([bytes], { type: 'application/pdf' });

      // Download immediately
      const a = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);

      setProgress(`Done! ${totalPagesCopied} pages merged. Loading into editor…`);

      // Load into editor — parent's onMerged already handles closing the modal
      const mergedFile = new File([blob], 'merged-document.pdf', { type: 'application/pdf' });
      await onMerged(mergedFile);
      // NOTE: Do NOT call onClose() here — parent handles it in onMerged callback

    } catch (e) {
      console.error('PDF merge error:', e);
      setError(e.message || 'Merge failed. Please make sure the PDFs are not encrypted.');
    } finally {
      setMerging(false);
      setProgress('');
    }
  }, [onMerged]);

  // Handle initialization on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && initialFiles && initialFiles.length > 0) {
      initialized.current = true;
      const loaded = initialFiles.map(file => ({
        name: file.name,
        file,
        pageCount: '?',
        size: file.size || 0,
      }));
      setFiles(loaded);
      filesRef.current = loaded;
      
      // Compute page counts in background without blocking
      Promise.all(initialFiles.map(async (file, idx) => {
        try {
          const ab = await file.arrayBuffer();
          const pdfjs = await import('pdfjs-dist');
          const ver = pdfjs.version;
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
          const count = doc.numPages;
          doc.destroy();
          setFiles(prev => {
            const next = [...prev];
            if (next[idx]) next[idx] = { ...next[idx], pageCount: count };
            return next;
          });
        } catch { /* ignore */ }
      }));

      if (autoStart && loaded.length >= 2) {
        // Pass loaded directly — avoids stale state
        handleMerge(loaded);
      }
    }
  }, [initialFiles, autoStart, handleMerge]);

  // Add files: read buffer only for page-count preview, keep the File
  const addFiles = useCallback(async (fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) return;

    const loaded = await Promise.all(pdfs.map(async (file) => {
      let pageCount = '?';
      try {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        const ver = pdfjs.version;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        pageCount = doc.numPages;
        doc.destroy();
      } catch { /* page count stays '?' */ }
      return { name: file.name, file, pageCount, size: file.size || 0 };
    }));

    setFiles(prev => [...prev, ...loaded]);
    setError('');
  }, []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const moveFile = (idx, dir) => {
    setFiles(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // Drag-and-drop reorder handlers
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setFiles(prev => {
      const next = [...prev];
      const [dragged] = next.splice(dragIdx, 1);
      next.splice(idx, 0, dragged);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const totalPages = files.reduce(
    (s, f) => s + (typeof f.pageCount === 'number' ? f.pageCount : 0),
    0
  );
  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.22)', padding: 28,
        width: 580, maxWidth: '100%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>🔗 Merge PDFs</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Combine multiple PDFs into one — all processing in your browser
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-secondary)', lineHeight: 1 }}>×</button>
        </div>

        {/* Drop zone */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)',
          padding: '22px 20px', cursor: 'pointer',
          background: 'var(--bg-secondary)', marginBottom: 14,
          transition: 'border-color 0.2s',
        }}>
          <input
            type="file" accept=".pdf" multiple style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
          />
          <span style={{ fontSize: '2.2rem' }}>🔗</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Click to add PDFs
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Add multiple PDFs — drag to reorder, then merge
          </span>
        </label>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-tertiary)',
            }}>
              <span>
                {files.length} file{files.length !== 1 ? 's' : ''}
                {totalPages > 0 ? ` · ${totalPages} pages` : ''}
                {totalSize > 0 ? ` · ${formatSize(totalSize)}` : ''}
              </span>
              <span>Drag to reorder · ↑↓ arrows</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((f, idx) => (
                <div
                  key={f.name + idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    border: `1px solid ${dragIdx === idx ? '#0070F3' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: dragIdx === idx ? 'rgba(0,112,243,0.05)' : 'var(--bg-section)',
                    transition: 'all 0.15s',
                    cursor: 'grab',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, cursor: 'grab' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: 'var(--text-primary)',
                    }}>{f.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 1, display: 'flex', gap: 8 }}>
                      <span>{f.pageCount === '?' ? 'Counting…' : `${f.pageCount} page${f.pageCount !== 1 ? 's' : ''}`}</span>
                      {f.size > 0 && <span>{formatSize(f.size)}</span>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--text-tertiary)',
                    fontWeight: 700, flexShrink: 0, minWidth: 20, textAlign: 'center',
                  }}>#{idx + 1}</span>
                  <button
                    onClick={() => moveFile(idx, -1)}
                    disabled={idx === 0}
                    title="Move up"
                    style={{
                      background: 'none', border: '1px solid var(--border-light)',
                      borderRadius: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      padding: '3px 8px', fontSize: '0.85rem',
                      opacity: idx === 0 ? 0.25 : 1,
                      color: 'var(--text-secondary)',
                    }}>↑</button>
                  <button
                    onClick={() => moveFile(idx, 1)}
                    disabled={idx === files.length - 1}
                    title="Move down"
                    style={{
                      background: 'none', border: '1px solid var(--border-light)',
                      borderRadius: 4, cursor: idx === files.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '3px 8px', fontSize: '0.85rem',
                      opacity: idx === files.length - 1 ? 0.25 : 1,
                      color: 'var(--text-secondary)',
                    }}>↓</button>
                  <button
                    onClick={() => removeFile(idx)}
                    title="Remove"
                    style={{
                      background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 4, cursor: 'pointer',
                      padding: '3px 9px', fontSize: '0.85rem', fontWeight: 700,
                    }}>✕</button>
                </div>
              ))}
            </div>

            {/* Add more button */}
            <button
              onClick={() => addInputRef.current?.click()}
              style={{
                marginTop: 8, width: '100%', padding: '8px 14px',
                border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)',
                background: 'transparent', cursor: 'pointer',
                fontSize: '0.82rem', color: '#0070F3', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
            >
              + Add more PDFs
            </button>
            <input
              ref={addInputRef}
              type="file" accept=".pdf" multiple
              style={{ display: 'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
        )}

        {/* Empty state spacer */}
        {files.length === 0 && <div style={{ flex: 1 }} />}

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.83rem', color: '#dc2626', marginBottom: 12,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Progress */}
        {merging && progress && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(0,112,243,0.06)',
            border: '1px solid rgba(0,112,243,0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.83rem', color: '#0070F3', marginBottom: 12,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <div style={{
              width: 14, height: 14, flexShrink: 0,
              border: '2px solid #0070F3', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'ilt-spin 0.7s linear infinite',
            }} />
            {progress}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={merging}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              cursor: merging ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem', color: 'var(--text-primary)',
              opacity: merging ? 0.5 : 1,
            }}>
            Cancel
          </button>
          <button
            onClick={() => handleMerge()}
            disabled={files.length < 2 || merging}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              background: files.length >= 2 && !merging
                ? 'linear-gradient(135deg,#0070F3,#3b82f6)'
                : 'var(--border-light)',
              color: '#fff', border: 'none',
              cursor: files.length >= 2 && !merging ? 'pointer' : 'not-allowed',
              fontSize: '0.92rem', fontWeight: 700,
              boxShadow: files.length >= 2 && !merging
                ? '0 2px 8px rgba(0,112,243,0.3)' : 'none',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {merging
              ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.5)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite' }} /> Merging…</>
              : `🔗 Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>

        {/* Tip */}
        {!merging && files.length === 0 && (
          <p style={{ marginTop: 12, fontSize: '0.74rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            🔒 Your PDFs never leave your browser — all merging happens locally
          </p>
        )}
      </div>
    </div>
  );
}
