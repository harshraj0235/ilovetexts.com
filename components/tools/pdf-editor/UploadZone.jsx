'use client';
// ═══════════════════════════════════════════════════════
// UploadZone.jsx v3
// IMPROVEMENTS:
//  - Auto-switch to merge mode when 2+ PDFs dropped
//  - File size display in merge queue
//  - Better UX guidance
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,.md,.html,.xml,.json';

export default function UploadZone({ onFile, onMergeFiles, loading }) {
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeQueue, setMergeQueue] = useState([]); // [{name, file, size}]
  const inputRef = useRef(null);

  const handleSingleFile = useCallback((file) => {
    if (!file) return;
    onFile(file);
  }, [onFile]);

  const handleMergeAdd = useCallback((files) => {
    const pdfs = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setMergeQueue(prev => [...prev, ...pdfs.map(f => ({ name: f.name, file: f, size: f.size || 0 }))]);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;

    // Auto-switch to merge mode if user drops 2+ PDFs in single mode
    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!mergeMode && pdfFiles.length >= 2) {
      setMergeMode(true);
      handleMergeAdd(files);
      return;
    }

    if (mergeMode) {
      handleMergeAdd(files);
    } else {
      handleSingleFile(files[0]);
    }
  }, [handleSingleFile, handleMergeAdd, mergeMode]);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    // Auto-switch to merge mode if user selects 2+ PDFs in single mode
    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!mergeMode && pdfFiles.length >= 2) {
      setMergeMode(true);
      handleMergeAdd(files);
      e.target.value = '';
      return;
    }

    if (mergeMode) {
      handleMergeAdd(files);
    } else {
      handleSingleFile(files[0]);
    }
    e.target.value = '';
  };

  const handleUrlImport = async () => {
    setUrlError('');
    if (!urlInput.trim()) return;
    try {
      const url = urlInput.trim();
      // Validate URL
      new URL(url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      const blob = await res.blob();
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf';
      const name = url.split('/').pop()?.split('?')[0] || `imported.${ext}`;
      const file = new File([blob], name, { type: blob.type || contentType });
      onFile(file);
    } catch (e) {
      setUrlError('Could not fetch that URL. Make sure it is publicly accessible and not blocked by CORS.');
    }
  };

  const removeMergeItem = (idx) => setMergeQueue(prev => prev.filter((_, i) => i !== idx));
  const moveMergeItem   = (idx, dir) => {
    setMergeQueue(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleMergeStart = () => {
    if (mergeQueue.length < 1) return;
    onMergeFiles?.(mergeQueue.map(q => q.file));
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
        {[
          { id: false, label: '📄 Open / Edit' },
          { id: true,  label: '🔗 Merge PDFs' },
        ].map(m => (
          <button key={String(m.id)} onClick={() => setMergeMode(m.id)}
            style={{
              padding: '7px 18px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${mergeMode === m.id ? '#0070F3' : 'var(--border-light)'}`,
              background: mergeMode === m.id ? 'rgba(0,112,243,0.09)' : 'var(--bg-secondary)',
              color: mergeMode === m.id ? '#0070F3' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}>{m.label}</button>
        ))}
      </div>

      {/* ── Single / Edit mode ── */}
      {!mergeMode && (
        <>
          <div
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => !loading && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#0070F3' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-lg)', padding: '50px 40px',
              textAlign: 'center', cursor: loading ? 'default' : 'pointer',
              background: dragging ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onInputChange} style={{ display: 'none' }} />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, border: '3px solid var(--border-light)', borderTopColor: '#0070F3', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>Loading file and extracting text…</p>
                <style>{`@keyframes ilt-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>📄</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Drop your file here, or click to browse
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 18 }}>
                  PDF, JPG, PNG, WEBP, TXT, CSV, HTML, JSON and more
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                  {['PDF', 'JPG', 'PNG', 'WEBP', 'TXT', 'CSV', 'HTML', 'JSON'].map(t => (
                    <span key={t} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t}</span>
                  ))}
                </div>
                <button
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px 28px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                >Choose File</button>
                <p style={{ marginTop: 18, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  🔒 Your file never leaves your browser — 100% private
                </p>
              </>
            )}
          </div>

          {/* URL import */}
          {!loading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                  placeholder="Or paste a PDF / image URL…"
                  style={{
                    flex: 1, padding: '9px 12px',
                    border: `1px solid ${urlError ? '#ef4444' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
                <button onClick={handleUrlImport} disabled={!urlInput.trim()}
                  style={{
                    padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                    background: '#0070F3', color: '#fff', border: 'none',
                    cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.88rem', fontWeight: 600,
                    opacity: urlInput.trim() ? 1 : 0.5,
                  }}>Import URL</button>
              </div>
              {urlError && <p style={{ marginTop: 6, fontSize: '0.78rem', color: '#ef4444' }}>{urlError}</p>}
            </div>
          )}
        </>
      )}

      {/* ── Merge mode ── */}
      {mergeMode && (
        <div>
          <div
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#0070F3' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-lg)', padding: '30px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf" multiple onChange={onInputChange} style={{ display: 'none' }} />
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              Drop PDF files here or click to add
            </p>
            <p style={{ color: 'var(--text-tertiary)', margin: '6px 0 0', fontSize: '0.8rem' }}>
              Add multiple PDFs — drag to reorder, then merge
            </p>
          </div>

          {mergeQueue.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                {mergeQueue.length} file{mergeQueue.length !== 1 ? 's' : ''} queued:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mergeQueue.map((q, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)',
                  }}>
                    <span style={{ fontSize: '1rem' }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{q.name}</span>
                      {q.size > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{formatSize(q.size)}</span>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>#{idx + 1}</span>
                    <button onClick={() => moveMergeItem(idx, -1)} disabled={idx === 0}
                      style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveMergeItem(idx, 1)} disabled={idx === mergeQueue.length - 1}
                      style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem', opacity: idx === mergeQueue.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeMergeItem(idx)}
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => setMergeQueue([])}
                  style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Clear All
                </button>
                <button onClick={handleMergeStart} disabled={mergeQueue.length < 2}
                  style={{
                    flex: 1, padding: '9px 16px', borderRadius: 'var(--radius-sm)',
                    background: mergeQueue.length >= 2 ? '#0070F3' : 'var(--border-light)',
                    color: '#fff', border: 'none', cursor: mergeQueue.length >= 2 ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem', fontWeight: 700,
                  }}>
                  🔗 Merge {mergeQueue.length} PDFs
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
