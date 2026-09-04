'use client';
// ═══════════════════════════════════════════════════════
// ExportModal.jsx — Export with filename preview labels
// ═══════════════════════════════════════════════════════
import { useState } from 'react';

export default function ExportModal({ pages, fileName, onClose, onExportPdf, onExportPng, onExportTxt }) {
  const [exporting, setExporting] = useState(null);

  const base = fileName?.replace(/\.[^.]+$/, '') || 'document';
  const pageCount = pages?.length || 1;

  const handle = async (type, fn) => {
    setExporting(type);
    try { await fn(); } finally { setExporting(null); }
  };

  const formats = [
    {
      id: 'pdf',
      icon: '📄',
      label: 'Download as PDF',
      filename: `${base}-edited.pdf`,
      badge: 'PDF',
      badgeColor: '#ef4444',
      desc: 'Full document with all edits, annotations, signatures and redactions baked in',
      action: () => handle('pdf', onExportPdf),
    },
    {
      id: 'png',
      icon: '🖼️',
      label: pageCount > 1 ? `Download as PNG (${pageCount} files)` : 'Download as PNG',
      filename: pageCount > 1
        ? `${base}-1.png … ${base}-${pageCount}.png`
        : `${base}-edited.png`,
      badge: 'PNG',
      badgeColor: '#0070F3',
      desc: pageCount > 1
        ? `Exports each page as a separate lossless PNG image — ${pageCount} file${pageCount !== 1 ? 's' : ''} total`
        : 'Exports the page as a lossless PNG image',
      action: () => handle('png', onExportPng),
    },
    {
      id: 'txt',
      icon: '📝',
      label: 'Download as TXT',
      filename: `${base}-edited.txt`,
      badge: 'TXT',
      badgeColor: '#6b7280',
      desc: 'Plain text — all extracted and edited text, one page per paragraph',
      action: () => handle('txt', onExportTxt),
    },
    {
      id: 'copy',
      icon: '📋',
      label: 'Copy All Text',
      filename: 'Copied to clipboard',
      badge: 'COPY',
      badgeColor: '#8b5cf6',
      desc: 'Copies all text to clipboard — paste into Word, Google Docs, or ChatGPT',
      action: () => handle('copy', async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) return;
        const allText = pages.map(p => p.textBlocks.map(b => b.text).join(' ')).join('\n\n');
        await navigator.clipboard.writeText(allText);
      }),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)', padding: 28, maxWidth: 480, width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>💾 Export Document</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>×</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>
          Source file: <strong style={{ color: 'var(--text-secondary)' }}>{fileName || 'untitled'}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {formats.map(f => (
            <button
              key={f.id}
              onClick={f.action}
              disabled={!!exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${exporting === f.id ? '#0070F3' : 'var(--border-light)'}`,
                background: exporting === f.id ? 'rgba(0,112,243,0.05)' : 'var(--bg-secondary)',
                cursor: exporting ? 'default' : 'pointer', textAlign: 'left',
                opacity: exporting && exporting !== f.id ? 0.45 : 1,
                transition: 'all 0.15s',
              }}
            >
              {/* File type icon */}
              <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Label + badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {exporting === f.id ? 'Processing…' : f.label}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px',
                    borderRadius: 4, background: f.badgeColor, color: '#fff',
                    letterSpacing: '0.04em', flexShrink: 0,
                  }}>
                    {f.badge}
                  </span>
                </div>
                {/* Output filename */}
                <div style={{
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                  color: '#0070F3', marginBottom: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {exporting === f.id ? '…' : `→ ${f.filename}`}
                </div>
                {/* Description */}
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>

              {exporting === f.id ? (
                <div style={{
                  width: 18, height: 18, border: '2px solid #0070F3',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'ilt-spin 0.7s linear infinite', flexShrink: 0,
                }} />
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 18, flexShrink: 0 }}>↓</span>
              )}
            </button>
          ))}
        </div>

        <p style={{ marginTop: 16, fontSize: '0.76rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          🔒 All exports happen 100% locally — your file never leaves your browser
        </p>
      </div>
    </div>
  );
}
