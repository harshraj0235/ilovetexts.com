'use client';
// ═══════════════════════════════════════════════════════
// UniversalImageConverter.jsx — One component, 15+ routes
// Handles PNG↔JPG↔WebP↔SVG↔BMP↔ICO↔GIF conversions
// Canvas API — zero upload, 100% private, batch convert
//
// Usage: <UniversalImageConverter from="png" to="jpg" />
// The `from` and `to` props are set per-route in page.js
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

const FORMAT_MAP = {
  jpg:  { mime: 'image/jpeg', label: 'JPG',  ext: 'jpg',  accept: '.jpg,.jpeg', desc: 'Best for photos, smallest size', color: '#f59e0b' },
  jpeg: { mime: 'image/jpeg', label: 'JPG',  ext: 'jpg',  accept: '.jpg,.jpeg', desc: 'Best for photos, smallest size', color: '#f59e0b' },
  png:  { mime: 'image/png',  label: 'PNG',  ext: 'png',  accept: '.png',       desc: 'Lossless, supports transparency', color: '#0ea5e9' },
  webp: { mime: 'image/webp', label: 'WebP', ext: 'webp', accept: '.webp',      desc: 'Modern format, 30% smaller', color: '#10b981' },
  svg:  { mime: 'image/svg+xml', label: 'SVG', ext: 'svg', accept: '.svg',      desc: 'Scalable vector graphics', color: '#8b5cf6' },
  gif:  { mime: 'image/gif',  label: 'GIF',  ext: 'gif',  accept: '.gif',       desc: 'Animated images', color: '#ec4899' },
  bmp:  { mime: 'image/bmp',  label: 'BMP',  ext: 'bmp',  accept: '.bmp',       desc: 'Uncompressed bitmap', color: '#6366f1' },
  ico:  { mime: 'image/x-icon', label: 'ICO', ext: 'ico',  accept: '.ico',      desc: 'Icon format for websites', color: '#14b8a6' },
  base64: { mime: 'text/plain', label: 'Base64', ext: 'txt', accept: '*',       desc: 'Text-encoded image data', color: '#f97316' },
};

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
}

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over, color) => ({
    border: `2px dashed ${over ? color : 'var(--border-light)'}`,
    borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center',
    cursor: 'pointer', background: over ? `${color}08` : 'var(--bg-secondary)',
    transition: 'all 0.2s',
  }),
  resultCard: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  thumb: { height: 140, overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default function UniversalImageConverter({ t, lang, from = 'png', to = 'jpg' }) {
  const fromFmt = FORMAT_MAP[from] || FORMAT_MAP.png;
  const toFmt = FORMAT_MAP[to] || FORMAT_MAP.jpg;
  const accent = toFmt.color;

  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(90);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3000); };

  const convertImage = useCallback((file) => new Promise(resolve => {
    // Special case: Image to Base64
    if (to === 'base64') {
      const reader = new FileReader();
      reader.onload = e => {
        const base64Str = e.target.result;
        const blob = new Blob([base64Str], { type: 'text/plain' });
        resolve({
          name: file.name,
          origSize: file.size,
          compSize: blob.size,
          url: URL.createObjectURL(blob),
          outName: file.name.replace(/\.[^.]+$/, '') + '-base64.txt',
          w: '—', h: '—',
          preview: null,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Special case: Base64 to Image
    if (from === 'base64') {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target.result.trim();
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (toFmt.mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
          ctx.drawImage(img, 0, 0);
          const q = toFmt.mime === 'image/png' ? 1 : quality / 100;
          canvas.toBlob(blob => {
            if (!blob) { resolve(null); return; }
            resolve({
              name: file.name, origSize: file.size, compSize: blob.size,
              url: URL.createObjectURL(blob),
              outName: file.name.replace(/\.[^.]+$/, '') + '.' + toFmt.ext,
              w: img.naturalWidth, h: img.naturalHeight,
              preview: URL.createObjectURL(blob),
            });
          }, toFmt.mime, q);
        };
        img.onerror = () => { resolve(null); };
        img.src = text;
      };
      reader.readAsText(file);
      return;
    }

    // Standard image-to-image conversion via Canvas
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        // White background for transparent → opaque formats (JPG, BMP)
        if (toFmt.mime === 'image/jpeg' || toFmt.mime === 'image/bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const q = toFmt.mime === 'image/png' ? 1 : quality / 100;
        canvas.toBlob(blob => {
          if (!blob) { resolve(null); return; }
          resolve({
            name: file.name,
            origSize: file.size,
            compSize: blob.size,
            url: URL.createObjectURL(blob),
            outName: file.name.replace(/\.[^.]+$/, '') + '.' + toFmt.ext,
            w: img.naturalWidth,
            h: img.naturalHeight,
            preview: URL.createObjectURL(blob),
          });
        }, toFmt.mime, q);
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }), [to, from, toFmt, quality]);

  const processFiles = useCallback(async (fileList) => {
    const imgs = Array.from(fileList).filter(f =>
      f.type.startsWith('image/') || f.name.endsWith('.svg') || (from === 'base64' && f.name.endsWith('.txt'))
    );
    if (!imgs.length) { showToast('Please upload image files', 'warning'); return; }
    setProcessing(true);
    const results = await Promise.all(imgs.map(convertImage));
    setFiles(results.filter(Boolean));
    setProcessing(false);
    showToast(`${results.filter(Boolean).length} image${results.length !== 1 ? 's' : ''} converted to ${toFmt.label}!`);
  }, [convertImage, from, toFmt.label]);

  const downloadAll = async () => {
    if (files.length === 1) {
      const a = document.createElement('a');
      a.href = files[0].url; a.download = files[0].outName; a.click();
      return;
    }
    // Batch download as ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const f of files) {
      const resp = await fetch(f.url);
      const blob = await resp.blob();
      zip.file(f.outName, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `${from}-to-${to}-converted.zip`;
    a.click();
    showToast('ZIP downloaded!');
  };

  const acceptTypes = from === 'base64' ? '.txt' : (fromFmt.accept + ',image/*');
  const showQuality = toFmt.mime !== 'image/png' && to !== 'base64';

  return (
    <div style={S.wrap}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {[`🔄 ${fromFmt.label} → ${toFmt.label}`, '🔒 100% private', '📦 Batch convert', '⚡ Instant'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Quality slider */}
      {showQuality && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Quality: {quality}%
            </label>
            <input type="range" min={20} max={100} step={5} value={quality}
              onChange={e => setQuality(+e.target.value)}
              style={{ flex: 1, accentColor: accent }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
              {quality >= 85 ? '🟢 High' : quality >= 60 ? '🟡 Medium' : '🔴 Low'}
            </span>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {files.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={S.dropzone(dragging, accent)}
        >
          <input ref={inputRef} type="file" accept={acceptTypes} multiple style={{ display: 'none' }}
            onChange={e => { processFiles(e.target.files); e.target.value = ''; }} />
          {processing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Converting to {toFmt.label}…</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>
                {from === 'base64' ? '🔤' : '🖼️'}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                Drop {fromFmt.label} files to convert to {toFmt.label}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
                {from === 'base64'
                  ? 'Paste Base64 text files to decode back to images'
                  : `Select ${fromFmt.label} images — batch convert multiple files at once`
                }
              </p>
              <button style={{
                padding: '10px 28px', background: accent, color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                Choose {fromFmt.label} Files
              </button>
              <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                🔒 Files never leave your browser — 100% private
              </p>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {files.length > 0 && (
        <>
          {/* Action bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={downloadAll}
              style={{ padding: '10px 24px', background: accent, color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              ⬇ Download {files.length > 1 ? `All (${files.length}) as ZIP` : toFmt.label}
            </button>
            <button onClick={() => setFiles([])}
              style={{ padding: '10px 20px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              🔄 Convert More
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              ✅ {files.length} file{files.length > 1 ? 's' : ''} converted
            </span>
          </div>

          {/* File grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {files.map((f, i) => (
              <div key={i} style={S.resultCard}>
                <div style={S.thumb}>
                  {f.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt={f.outName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 32 }}>📄</div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {f.outName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {fromFmt.label} → <strong style={{ color: accent }}>{toFmt.label}</strong>
                    {f.w !== '—' && ` · ${f.w}×${f.h}`}
                    {` · ${formatBytes(f.origSize)} → `}<strong>{formatBytes(f.compSize)}</strong>
                  </div>
                  <button onClick={() => { const a = document.createElement('a'); a.href = f.url; a.download = f.outName; a.click(); }}
                    style={{ width: '100%', padding: 8, background: accent, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                    ⬇ Download {toFmt.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
        {[
          { icon: '⚡', title: 'Instant conversion', desc: `Convert ${fromFmt.label} to ${toFmt.label} in milliseconds` },
          { icon: '📦', title: 'Batch convert', desc: 'Upload multiple files, convert all at once' },
          { icon: '🔒', title: '100% private', desc: 'Files never leave your browser' },
          { icon: '💯', title: 'Free forever', desc: 'No signup, no watermark, no limits' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{c.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 24px', borderRadius: 'var(--radius-full)',
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a',
          color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000,
          boxShadow: 'var(--shadow-float)',
        }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
