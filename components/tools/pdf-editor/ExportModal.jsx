'use client';
// ═══════════════════════════════════════════════════════
// ExportModal.jsx v3
// IMPROVEMENTS:
//  - Real PDF compression: re-renders pages at lower JPEG
//    quality to reduce file size (not just a slider label)
//  - Estimated file size display
//  - Password protection: honest UI — pdf-lib doesn't
//    support encryption, so we clearly communicate this
//  - DOCX download, Copy, Print all work
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportModal({
  pages, fileName, onClose,
  onExportPdf, onExportPng, onExportTxt,
}) {
  const [exporting,    setExporting]    = useState(null);
  const [password,     setPassword]     = useState('');
  const [showPwInput,  setShowPwInput]  = useState(false);
  const [quality,      setQuality]      = useState(92); // JPEG quality 1-100
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [compressing,  setCompressing]  = useState(false);

  const base      = fileName?.replace(/\.[^.]+$/, '') || 'document';
  const pageCount = pages?.length || 1;

  // Estimate file size based on quality
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    // Rough estimate: sum of page data URLs sizes, scaled by quality ratio
    let totalBytes = 0;
    for (const p of pages) {
      if (p.canvasDataUrl) {
        totalBytes += p.canvasDataUrl.length * 0.75; // base64 overhead
      } else {
        totalBytes += (p.canvasWidth || 794) * (p.canvasHeight || 1123) * 0.1; // rough estimate
      }
    }
    // Quality scaling: at 92% ~ full size, at 40% ~ 30% of full size
    const scaleFactor = 0.2 + (quality / 100) * 0.8;
    setEstimatedSize(Math.round(totalBytes * scaleFactor));
  }, [pages, quality]);

  const handle = async (type, fn) => {
    setExporting(type);
    try { await fn(); } finally { setExporting(null); }
  };

  // Compress PDF — re-renders all pages at lower quality
  const doCompressPdf = async () => {
    setCompressing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const W = page.canvasWidth || 794;
        const H = page.canvasHeight || 1123;

        // Re-render page to canvas at quality setting
        const canvas = document.createElement('canvas');
        // Reduce resolution for compression
        const scaleFactor = quality >= 80 ? 1 : quality >= 60 ? 0.85 : 0.7;
        canvas.width = Math.round(W * scaleFactor);
        canvas.height = Math.round(H * scaleFactor);
        const ctx = canvas.getContext('2d');

        if (page.canvasDataUrl) {
          const img = new Image();
          img.src = page.canvasDataUrl;
          await new Promise(r => { img.onload = r; img.onerror = r; });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw text blocks on canvas
        for (const b of (page.textBlocks || [])) {
          if (!b.text?.trim()) continue;
          if (page.canvasDataUrl && !b.isEdited) continue;
          ctx.save();
          if (b.isEdited) {
            const pad = 2;
            ctx.fillStyle = b.bgColor || '#ffffff';
            ctx.fillRect(
              (b.x - pad) * scaleFactor,
              (b.y - pad) * scaleFactor,
              (b.width + pad * 2) * scaleFactor,
              (b.height + pad * 2) * scaleFactor
            );
          }
          let fStr = '';
          if (b.italic) fStr += 'italic ';
          if (b.bold) fStr += 'bold ';
          fStr += `${Math.round((b.fontSize || 12) * scaleFactor)}px ${b.fontFamily || 'sans-serif'}`;
          ctx.font = fStr;
          ctx.fillStyle = b.color || '#000';
          ctx.textBaseline = 'top';
          ctx.fillText(b.text, b.x * scaleFactor, b.y * scaleFactor);
          ctx.restore();
        }

        // Compress to JPEG at specified quality
        const jpegQuality = quality / 100;
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

        const pdfPage = pdfDoc.addPage([W * 0.75, H * 0.75]);
        const img = await pdfDoc.embedJpg(dataUrl);
        pdfPage.drawImage(img, { x: 0, y: 0, width: W * 0.75, height: H * 0.75 });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${base}-compressed.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);

      // Show actual vs estimated
      setEstimatedSize(pdfBytes.length);
    } finally {
      setCompressing(false);
    }
  };

  // Export as DOCX (text-only via simple HTML → Word)
  const doExportDocx = async () => {
    const allText = pages.map((p, i) =>
      `<h2>Page ${i + 1}</h2>` +
      (p.textBlocks || []).map(b => `<p>${b.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('')
    ).join('<hr/>');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${base}</title></head><body>${allText}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base}-edited.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doPrint = () => {
    window.print();
  };

  const formats = [
    {
      id: 'pdf',
      icon: '📄',
      label: 'Download as PDF',
      filename: `${base}-edited.pdf`,
      badge: 'PDF', badgeColor: '#ef4444',
      desc: 'Full document with all edits, annotations, signatures and redactions baked in',
      action: () => handle('pdf', () => onExportPdf({ password: showPwInput ? password : '', quality })),
      primary: true,
    },
    {
      id: 'compress',
      icon: '📦',
      label: 'Compress & Download PDF',
      filename: `${base}-compressed.pdf`,
      badge: 'COMPRESS', badgeColor: '#f59e0b',
      desc: `Re-renders at ${quality}% quality to reduce file size${estimatedSize ? ` — est. ${formatSize(estimatedSize)}` : ''}`,
      action: () => handle('compress', doCompressPdf),
    },
    {
      id: 'png',
      icon: '🖼️',
      label: pageCount > 1 ? `Download as PNG (${pageCount} files)` : 'Download as PNG',
      filename: pageCount > 1 ? `${base}-1.png … ${base}-${pageCount}.png` : `${base}-edited.png`,
      badge: 'PNG', badgeColor: '#0070F3',
      desc: `Exports each page as a lossless PNG image — ${pageCount} file${pageCount !== 1 ? 's' : ''} total`,
      action: () => handle('png', () => onExportPng({ quality })),
    },
    {
      id: 'txt',
      icon: '📝',
      label: 'Download as TXT',
      filename: `${base}-edited.txt`,
      badge: 'TXT', badgeColor: '#6b7280',
      desc: 'Plain text — all extracted and edited text, one page per paragraph',
      action: () => handle('txt', onExportTxt),
    },
    {
      id: 'doc',
      icon: '📘',
      label: 'Download as DOC',
      filename: `${base}-edited.doc`,
      badge: 'DOC', badgeColor: '#2563eb',
      desc: 'Word-compatible document with all text content (open in Word, Google Docs)',
      action: () => handle('doc', doExportDocx),
    },
    {
      id: 'copy',
      icon: '📋',
      label: 'Copy All Text',
      filename: 'Copied to clipboard',
      badge: 'COPY', badgeColor: '#8b5cf6',
      desc: 'Copies all text to clipboard — paste into Word, Google Docs, or ChatGPT',
      action: () => handle('copy', async () => {
        if (!navigator.clipboard) return;
        const allText = pages.map(p => (p.textBlocks || []).map(b => b.text).join(' ')).join('\n\n');
        await navigator.clipboard.writeText(allText);
      }),
    },
    {
      id: 'print',
      icon: '🖨️',
      label: 'Print',
      filename: 'Opens print dialog',
      badge: 'PRINT', badgeColor: '#059669',
      desc: 'Print the document or save as PDF via the browser print dialog',
      action: () => handle('print', async () => doPrint()),
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)', padding: 28,
        maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>💾 Export Document</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>×</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Source: <strong style={{ color: 'var(--text-secondary)' }}>{fileName || 'untitled'}</strong>
          &nbsp;·&nbsp;{pageCount} page{pageCount !== 1 ? 's' : ''}
          {estimatedSize ? <>&nbsp;·&nbsp;~{formatSize(estimatedSize)}</> : ''}
        </p>

        {/* Format list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {formats.map(f => (
            <button key={f.id} onClick={f.action} disabled={!!exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `${f.primary ? '2px' : '1px'} solid ${exporting === f.id ? '#0070F3' : f.primary ? '#0070F3' : 'var(--border-light)'}`,
                background: exporting === f.id ? 'rgba(0,112,243,0.05)' : f.primary ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)',
                cursor: exporting ? 'default' : 'pointer', textAlign: 'left',
                opacity: exporting && exporting !== f.id ? 0.4 : 1,
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {exporting === f.id ? 'Processing…' : f.label}
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: f.badgeColor, color: '#fff', letterSpacing: '0.04em' }}>
                    {f.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#0070F3', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exporting === f.id ? '…' : `→ ${f.filename}`}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>
              {exporting === f.id ? (
                <div style={{ width: 16, height: 16, border: '2px solid #0070F3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.7s linear infinite', flexShrink: 0 }} />
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 }}>↓</span>
              )}
            </button>
          ))}
        </div>

        {/* Advanced options toggle */}
        <button onClick={() => setShowAdvanced(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0070F3', fontSize: '0.82rem', fontWeight: 600, padding: 0, marginBottom: showAdvanced ? 12 : 0 }}>
          {showAdvanced ? '▾' : '▸'} Advanced options
        </button>

        {showAdvanced && (
          <div style={{
            border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
            padding: 16, background: 'var(--bg-secondary)', marginBottom: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* PDF quality slider */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Compression quality</span>
                <span style={{ color: 'var(--text-primary)' }}>{quality}%</span>
              </label>
              <input type="range" min={30} max={100} step={2} value={quality} onChange={e => setQuality(+e.target.value)}
                style={{ width: '100%', marginTop: 6, accentColor: '#0070F3' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                <span>Smaller file (~{Math.round(30 + (quality / 100) * 70)}%)</span>
                <span>Higher quality</span>
              </div>
              {estimatedSize && (
                <div style={{ fontSize: '0.72rem', color: '#0070F3', marginTop: 4 }}>
                  📦 Estimated compressed size: ~{formatSize(estimatedSize)}
                </div>
              )}
            </div>

            {/* Password protect */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showPwInput ? 8 : 0 }}>
                <input type="checkbox" id="pw-chk" checked={showPwInput} onChange={e => setShowPwInput(e.target.checked)}
                  style={{ cursor: 'pointer' }} />
                <label htmlFor="pw-chk" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  🔐 Password protect PDF
                </label>
              </div>
              {showPwInput && (
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter PDF password…"
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', boxSizing: 'border-box',
                  }} />
              )}
              {showPwInput && (
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '6px 0 0',
                  padding: '6px 10px', background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)',
                }}>
                  ⚠️ <strong>Limitation:</strong> PDF password encryption requires server-side processing. 
                  The password will be embedded as metadata — for maximum security, use your OS&apos;s built-in PDF encryption 
                  (Print → Save as PDF with encryption) or a desktop tool like Adobe Acrobat.
                </div>
              )}
            </div>
          </div>
        )}

        <p style={{ marginTop: 4, fontSize: '0.76rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          🔒 All exports are 100% local — your file never leaves your browser
        </p>
      </div>
    </div>
  );
}
