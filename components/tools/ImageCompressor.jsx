'use client';
// ═══════════════════════════════════════════════════════
// ImageCompressor.jsx — Compress JPG/PNG/WebP in browser
// Uses Canvas API — zero upload, 100% private
// Targets: "compress image online free" 500K+/mo
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';

const FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const FORMAT_LABELS = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP' };

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getReduction(orig, comp) {
  if (!orig || !comp) return 0;
  return Math.round((1 - comp / orig) * 100);
}

export default function ImageCompressor({ t, lang }) {
  const [files, setFiles]       = useState([]); // [{name, origSize, origUrl, compUrl, compSize, format}]
  const [quality, setQuality]   = useState(80);
  const [outputFmt, setOutputFmt] = useState('same'); // same | image/jpeg | image/png | image/webp
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]       = useState(null);
  const inputRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const compressImage = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const fmt = outputFmt === 'same'
            ? (file.type || 'image/jpeg')
            : outputFmt;
          const q = fmt === 'image/png' ? 1 : quality / 100;
          canvas.toBlob((blob) => {
            if (!blob) { resolve(null); return; }
            resolve({
              name: file.name,
              origSize: file.size,
              origUrl: e.target.result,
              compUrl: URL.createObjectURL(blob),
              compBlob: blob,
              compSize: blob.size,
              format: fmt,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          }, fmt, q);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, [quality, outputFmt]);

  const processFiles = useCallback(async (fileList) => {
    const imgs = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please upload image files (JPG, PNG, WebP)', 'warning'); return; }
    setProcessing(true);
    const results = await Promise.all(imgs.map(compressImage));
    setFiles(results.filter(Boolean));
    setProcessing(false);
    showToast(`${results.length} image${results.length !== 1 ? 's' : ''} compressed!`);
  }, [compressImage]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const downloadAll = () => {
    files.forEach(f => {
      const a = document.createElement('a');
      a.href = f.compUrl;
      const ext = f.format.split('/')[1].replace('jpeg','jpg');
      a.download = f.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext;
      a.click();
    });
    showToast('All images downloaded!');
  };

  const totalOrig = files.reduce((s, f) => s + f.origSize, 0);
  const totalComp = files.reduce((s, f) => s + f.compSize, 0);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? '✅ ' : '⚠️ '}{toast.msg}</div>}

      {/* Controls */}
      <div className="trust-card" style={{ padding: 20, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Quality: {quality}% {quality >= 85 ? '(High)' : quality >= 60 ? '(Medium)' : '(Low)'}
          </label>
          <input type="range" min={10} max={100} step={5} value={quality} onChange={e => setQuality(+e.target.value)}
            style={{ width: '100%', accentColor: '#0ea5e9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            <span>Smaller file</span><span>Better quality</span>
          </div>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Output Format</label>
          <select value={outputFmt} onChange={e => setOutputFmt(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
            <option value="same">Same as input</option>
            <option value="image/jpeg">Convert to JPG</option>
            <option value="image/png">Convert to PNG</option>
            <option value="image/webp">Convert to WebP</option>
          </select>
        </div>
        {files.length > 0 && (
          <button onClick={() => processFiles(files.map(f => ({ name: f.name, size: f.origSize, type: f.format })))}
            className="btn-primary" style={{ padding: '8px 18px', alignSelf: 'flex-end', fontSize: '0.85rem' }}>
            🔄 Re-compress
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#0ea5e9' : 'var(--border-light)'}`,
          borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center',
          cursor: 'pointer', background: dragging ? 'rgba(14,165,233,0.04)' : 'var(--bg-section)',
          marginBottom: 20, transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => { processFiles(e.target.files); e.target.value = ''; }} />
        {processing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Compressing images…</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop images here or click to upload</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>JPG, PNG, WebP — batch compress multiple images at once</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {['JPG', 'PNG', 'WebP', 'GIF', 'AVIF'].map(f => (
                <span key={f} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg-main)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f}</span>
              ))}
            </div>
            <button style={{ padding: '10px 26px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
              Choose Images
            </button>
            <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>🔒 Images never leave your browser — 100% private</p>
          </>
        )}
      </div>

      {/* Results */}
      {files.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { icon: '📁', label: 'Original Size', value: formatBytes(totalOrig), color: 'var(--text-primary)' },
              { icon: '📦', label: 'Compressed Size', value: formatBytes(totalComp), color: '#0ea5e9' },
              { icon: '📉', label: 'Reduction', value: getReduction(totalOrig, totalComp) + '%', color: '#10b981' },
              { icon: '🖼️', label: 'Images', value: files.length, color: 'var(--text-primary)' },
            ].map(s => (
              <div key={s.label} className="trust-card" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={downloadAll} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
              ⬇ Download All ({files.length})
            </button>
            <button onClick={() => setFiles([])} className="btn btn-secondary">🗑 Clear</button>
          </div>

          {/* Image Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {files.map((file, i) => {
              const reduction = getReduction(file.origSize, file.compSize);
              const ext = file.format.split('/')[1].replace('jpeg','jpg');
              return (
                <div key={i} className="trust-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Preview */}
                  <div style={{ position: 'relative', height: 160, background: '#f0f0f0', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.compUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {reduction > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                        -{reduction}%
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{file.name}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      <span>{file.width}×{file.height}</span>
                      <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{formatBytes(file.origSize)}</span>
                      <span style={{ color: '#0ea5e9', fontWeight: 700 }}>{formatBytes(file.compSize)}</span>
                    </div>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = file.compUrl;
                        a.download = file.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext;
                        a.click();
                      }}
                      style={{ width: '100%', padding: '7px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                      ⬇ Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
