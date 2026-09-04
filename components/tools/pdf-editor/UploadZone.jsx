'use client';
// ═══════════════════════════════════════════════════════
// UploadZone.jsx — Drag-and-drop + click file upload
// Accepts: PDF, JPG, PNG, WEBP, TXT, DOCX etc.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,.md,.html,.xml,.json';

export default function UploadZone({ onFile, loading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#0070F3' : 'var(--border-light)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '60px 40px',
        textAlign: 'center',
        cursor: loading ? 'default' : 'pointer',
        background: dragging
          ? 'rgba(0,112,243,0.04)'
          : 'var(--bg-secondary)',
        transition: 'all 0.2s ease',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid var(--border-light)',
            borderTopColor: '#0070F3',
            borderRadius: '50%',
            animation: 'ilt-spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
            Loading file and extracting text…
          </p>
          <style>{`@keyframes ilt-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Big upload icon */}
          <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>📄</div>
          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            Drop your file here, or click to browse
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 20 }}>
            PDF, JPG, PNG, WEBP, TXT, CSV, HTML, JSON and more
          </p>

          {/* File type badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {['PDF', 'JPG', 'PNG', 'WEBP', 'TXT', 'CSV', 'HTML', 'JSON'].map((t) => (
              <span key={t} style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>{t}</span>
            ))}
          </div>

          <button
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Choose File
          </button>

          <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            🔒 Your file never leaves your browser — 100% private
          </p>
        </>
      )}
    </div>
  );
}
