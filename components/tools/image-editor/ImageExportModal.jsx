'use client';
// ═══════════════════════════════════════════════════════
// ImageExportModal.jsx — Export with filename preview labels
// ═══════════════════════════════════════════════════════
import { useState } from 'react';

export default function ImageExportModal({ onClose, onExportPng, onExportJpg, onCopyText, fileName }) {
  const [busy, setBusy] = useState(null);

  const base = fileName?.replace(/\.[^.]+$/, '') || 'image';

  const run = async (id, fn) => {
    setBusy(id);
    try { await fn(); } finally { setBusy(null); }
  };

  const options = [
    {
      id: 'png',
      icon: '🖼️',
      label: 'Download as PNG',
      filename: `${base}-edited.png`,
      badge: 'PNG',
      badgeColor: '#0070F3',
      desc: 'Lossless quality — best for graphics, text, screenshots. Supports transparency.',
      fn: onExportPng,
    },
    {
      id: 'jpg',
      icon: '📸',
      label: 'Download as JPG',
      filename: `${base}-edited.jpg`,
      badge: 'JPG',
      badgeColor: '#f59e0b',
      desc: 'Smaller file size — best for photos. No transparency support.',
      fn: onExportJpg,
    },
    {
      id: 'copy',
      icon: '📋',
      label: 'Copy All Text',
      filename: 'Copied to clipboard',
      badge: 'COPY',
      badgeColor: '#8b5cf6',
      desc: 'Copies all OCR-extracted and edited text — paste into Word, ChatGPT, or any app.',
      fn: onCopyText,
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)', padding: 28, maxWidth: 460, width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>💾 Export Image</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>×</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>
          Source file: <strong style={{ color: 'var(--text-secondary)' }}>{fileName || 'untitled'}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(o => (
            <button
              key={o.id}
              onClick={() => run(o.id, o.fn)}
              disabled={!!busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${busy === o.id ? '#0070F3' : 'var(--border-light)'}`,
                background: busy === o.id ? 'rgba(0,112,243,0.05)' : 'var(--bg-secondary)',
                cursor: busy ? 'default' : 'pointer', textAlign: 'left',
                opacity: busy && busy !== o.id ? 0.45 : 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{o.icon}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {busy === o.id ? 'Processing…' : o.label}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px',
                    borderRadius: 4, background: o.badgeColor, color: '#fff',
                    letterSpacing: '0.04em', flexShrink: 0,
                  }}>
                    {o.badge}
                  </span>
                </div>
                {/* Output filename */}
                <div style={{
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                  color: '#0070F3', marginBottom: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {busy === o.id ? '…' : `→ ${o.filename}`}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{o.desc}</div>
              </div>

              {busy === o.id ? (
                <div style={{
                  width: 16, height: 16, border: '2px solid #0070F3',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'ilt-spin 0.7s linear infinite', flexShrink: 0,
                }} />
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 18, flexShrink: 0 }}>↓</span>
              )}
            </button>
          ))}
        </div>

        <p style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          🔒 All exports happen locally — your image never leaves your browser
        </p>
      </div>
    </div>
  );
}
