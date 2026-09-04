'use client';
// ═══════════════════════════════════════════════════════
// PdfMergePanel.jsx — Merge multiple PDFs into one
// All client-side using pdfjs-dist + pdf-lib.
// NEW component — not in original editor.
// ═══════════════════════════════════════════════════════
import { useState, useCallback } from 'react';

export default function PdfMergePanel({ onMerged, onClose }) {
  const [files,      setFiles]      = useState([]); // [{name, buffer, pageCount}]
  const [merging,    setMerging]    = useState(false);
  const [progress,   setProgress]   = useState('');
  const [error,      setError]      = useState('');

  const addFiles = useCallback(async (fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const loaded = await Promise.all(pdfs.map(async (f) => {
      const ab = await f.arrayBuffer();
      // Quick page-count via pdfjs
      let pageCount = '?';
      try {
        const pdfjs = await import('pdfjs-dist');
        const ver = pdfjs.version;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: ab.slice() }).promise;
        pageCount = doc.numPages;
      } catch (e) { /* ignore */ }
      return { name: f.name, buffer: ab, pageCount };
    }));
    setFiles(prev => [...prev, ...loaded]);
    setError('');
  }, []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const moveFile   = (idx, dir) => {
    setFiles(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleMerge = useCallback(async () => {
    if (files.length < 2) { setError('Add at least 2 PDFs to merge.'); return; }
    setMerging(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(`Processing ${files[i].name} (${i + 1}/${files.length})…`);
        const src = await PDFDocument.load(files[i].buffer);
        const pageIds = src.getPageIndices();
        const copiedPages = await merged.copyPages(src, pageIds);
        copiedPages.forEach(p => merged.addPage(p));
      }

      setProgress('Saving merged PDF…');
      const bytes = await merged.save();
      const blob  = new Blob([bytes], { type: 'application/pdf' });

      // Trigger download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'merged-document.pdf';
      a.click();
      URL.revokeObjectURL(a.href);

      // Also load into editor
      const mergedFile = new File([blob], 'merged-document.pdf', { type: 'application/pdf' });
      onMerged(mergedFile);
      onClose();
    } catch (e) {
      setError('Merge failed: ' + e.message);
    } finally {
      setMerging(false);
      setProgress('');
    }
  }, [files, onMerged, onClose]);

  const totalPages = files.reduce((s, f) => s + (typeof f.pageCount === 'number' ? f.pageCount : 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)', padding: 28,
        width: 560, maxWidth: '100%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>🔗 Merge PDFs</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>×</button>
        </div>

        {/* Drop zone */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)',
          padding: '20px', cursor: 'pointer', background: 'var(--bg-secondary)', marginBottom: 14,
        }}>
          <input type="file" accept=".pdf" multiple style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          <span style={{ fontSize: '2rem', marginBottom: 6 }}>📄</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Click to add PDFs or drag & drop
          </span>
        </label>

        {/* File list */}
        {files.length > 0 ? (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              {files.length} file{files.length !== 1 ? 's' : ''} · {totalPages} total pages · drag rows to reorder
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((f, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--bg-section)',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{f.pageCount} page{f.pageCount !== 1 ? 's' : ''}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700, flexShrink: 0, minWidth: 24, textAlign: 'center' }}>#{idx + 1}</span>
                  <button onClick={() => moveFile(idx, -1)} disabled={idx === 0}
                    style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 4, cursor: 'pointer', padding: '2px 7px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => moveFile(idx, 1)} disabled={idx === files.length - 1}
                    style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 4, cursor: 'pointer', padding: '2px 7px', opacity: idx === files.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={() => removeFile(idx)}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, cursor: 'pointer', padding: '2px 8px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#ef4444', marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Progress */}
        {merging && (
          <div style={{ padding: '8px 12px', background: 'rgba(0,112,243,0.07)', border: '1px solid rgba(0,112,243,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#0070F3', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 14, height: 14, border: '2px solid #0070F3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.7s linear infinite', flexShrink: 0 }} />
            {progress}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>
            Cancel
          </button>
          <button onClick={handleMerge} disabled={files.length < 2 || merging}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: 'var(--radius-sm)',
              background: files.length >= 2 && !merging ? '#0070F3' : 'var(--border-light)',
              color: '#fff', border: 'none',
              cursor: files.length >= 2 && !merging ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem', fontWeight: 700,
            }}>
            {merging ? '⏳ Merging…' : `🔗 Merge ${files.length} PDFs`}
          </button>
        </div>
      </div>
    </div>
  );
}
