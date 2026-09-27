'use client';
// ═══════════════════════════════════════════════════════
// SignaturePad.jsx v2
// NEW: image upload signature, saved signatures library
//      (localStorage), 5 typed font styles, clear/undo
// ═══════════════════════════════════════════════════════
import { useRef, useEffect, useState, useCallback } from 'react';

const TYPED_FONTS = [
  { label: 'Cursive',     style: 'italic 32px Georgia, serif' },
  { label: 'Print',       style: '28px Arial, sans-serif' },
  { label: 'Monospace',   style: '26px Courier New, monospace' },
  { label: 'Elegant',     style: 'italic 30px "Times New Roman", serif' },
  { label: 'Bold Script', style: 'bold italic 32px Georgia, serif' },
];

const LS_KEY = 'ilt_saved_sigs';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveSig(dataUrl, label) {
  const sigs = loadSaved();
  sigs.unshift({ id: Date.now(), dataUrl, label: label || 'Signature', savedAt: Date.now() });
  localStorage.setItem(LS_KEY, JSON.stringify(sigs.slice(0, 10)));
}
function deleteSavedSig(id) {
  const sigs = loadSaved().filter(s => s.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(sigs));
}

function TypedSig({ text, fontIdx, color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font      = TYPED_FONTS[fontIdx].style;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text || 'Signature');
    c.width  = Math.max(metrics.width + 24, 120);
    c.height = 54;
    ctx.font      = TYPED_FONTS[fontIdx].style;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text || 'Signature', 12, 27);
  }, [text, fontIdx, color]);
  return <canvas ref={canvasRef} height={54} style={{ maxWidth: '100%' }} />;
}

export default function SignaturePad({ onInsert, onClose }) {
  const [mode,      setMode]      = useState('draw'); // draw | type | image | saved
  const [typedText, setTyped]     = useState('');
  const [fontIdx,   setFontIdx]   = useState(0);
  const [color,     setColor]     = useState('#000000');
  const [lineW,     setLineW]     = useState(2);
  const [savedSigs, setSavedSigs] = useState([]);
  const [saveLabel, setSaveLabel] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const drawCanvasRef  = useRef(null);
  const drawing        = useRef(false);
  const lastPos        = useRef(null);
  const pointsRef      = useRef([]);
  const imageInputRef  = useRef(null);
  const [uploadedImg, setUploadedImg] = useState(null);

  useEffect(() => {
    setSavedSigs(loadSaved());
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onDown = (e) => {
    drawing.current = true;
    const pos = getPos(e, drawCanvasRef.current);
    lastPos.current = pos;
    pointsRef.current = [pos];
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineW;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    pointsRef.current.push(pos);
  };
  const onUp = () => { drawing.current = false; };

  const clearDraw = () => {
    const c   = drawCanvasRef.current;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    pointsRef.current = [];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImg(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getCurrentDataUrl = useCallback(() => {
    if (mode === 'draw') {
      return drawCanvasRef.current?.toDataURL('image/png');
    }
    if (mode === 'type') {
      const c   = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font  = TYPED_FONTS[fontIdx].style;
      const metrics = ctx.measureText(typedText || 'Signature');
      c.width   = metrics.width + 24;
      c.height  = 54;
      ctx.font  = TYPED_FONTS[fontIdx].style;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText || 'Signature', 12, 27);
      return c.toDataURL('image/png');
    }
    if (mode === 'image') return uploadedImg;
    return null;
  }, [mode, fontIdx, typedText, color, uploadedImg]);

  const handleInsert = useCallback(() => {
    const dataUrl = getCurrentDataUrl();
    if (!dataUrl) return;
    if (mode === 'draw') {
      const c = drawCanvasRef.current;
      onInsert({ type: 'signature', dataUrl, width: c.width / 1.5, height: c.height / 1.5 });
    } else if (mode === 'type') {
      onInsert({ type: 'signature', dataUrl, width: 180, height: 40 });
    } else if (mode === 'image') {
      onInsert({ type: 'signature', dataUrl, width: 160, height: 60 });
    }
  }, [getCurrentDataUrl, mode, onInsert]);

  const handleSave = useCallback(() => {
    const dataUrl = getCurrentDataUrl();
    if (!dataUrl) return;
    saveSig(dataUrl, saveLabel || 'Signature');
    setSavedSigs(loadSaved());
    setShowSaveInput(false);
    setSaveLabel('');
  }, [getCurrentDataUrl, saveLabel]);

  const handleInsertSaved = (sig) => {
    onInsert({ type: 'signature', dataUrl: sig.dataUrl, width: 160, height: 50 });
  };

  const handleDeleteSaved = (id) => {
    deleteSavedSig(id);
    setSavedSigs(loadSaved());
  };

  const TABS = [
    { id: 'draw',  label: '✏️ Draw' },
    { id: 'type',  label: '⌨️ Type' },
    { id: 'image', label: '🖼️ Upload' },
    { id: 'saved', label: `📂 Saved (${savedSigs.length})` },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)', padding: 28, width: 520, maxWidth: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>✍️ Add Signature</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>×</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
              border: `1px solid ${mode === t.id ? '#0070F3' : 'var(--border-light)'}`,
              background: mode === t.id ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
              color: mode === t.id ? '#0070F3' : 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── DRAW mode ── */}
        {mode === 'draw' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                Ink:
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 30, height: 28, cursor: 'pointer', border: 'none' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                Width:
                <input type="range" min={1} max={8} value={lineW} onChange={e => setLineW(+e.target.value)} style={{ width: 80 }} />
                <span style={{ minWidth: 14 }}>{lineW}</span>
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <canvas
                ref={drawCanvasRef} width={460} height={170}
                onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
                style={{
                  border: '1px solid var(--border-light)', borderRadius: 8,
                  cursor: 'crosshair', display: 'block', width: '100%',
                  background: '#fafafa', touchAction: 'none',
                }}
              />
              <button onClick={clearDraw} style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                padding: '3px 10px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
              }}>Clear</button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '4px 0 0', textAlign: 'center' }}>
              Sign with your mouse or touchscreen
            </p>
          </div>
        )}

        {/* ── TYPE mode ── */}
        {mode === 'type' && (
          <div>
            <input value={typedText} onChange={e => setTyped(e.target.value)} placeholder="Type your name…"
              style={{ width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }} />
            {/* Font picker */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {TYPED_FONTS.map((f, i) => (
                <button key={i} onClick={() => setFontIdx(i)} style={{
                  padding: '5px 10px', borderRadius: 4, fontSize: '0.78rem',
                  border: `1px solid ${fontIdx === i ? '#0070F3' : 'var(--border-light)'}`,
                  background: fontIdx === i ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
                  color: fontIdx === i ? '#0070F3' : 'var(--text-primary)', cursor: 'pointer',
                }}>{f.label}</button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                Color:
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 28, height: 24, cursor: 'pointer', border: 'none' }} />
              </label>
            </div>
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, background: '#fafafa', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TypedSig text={typedText} fontIdx={fontIdx} color={color} />
            </div>
          </div>
        )}

        {/* ── IMAGE mode ── */}
        {mode === 'image' && (
          <div>
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            {uploadedImg ? (
              <div style={{ textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedImg} alt="Signature" style={{ maxWidth: '100%', maxHeight: 160, border: '1px solid var(--border-light)', borderRadius: 8 }} />
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setUploadedImg(null)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: '0.82rem' }}>Remove</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-light)', borderRadius: 10,
                  padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🖼️</div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Click to upload your signature image
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                  PNG with transparent background works best
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SAVED mode ── */}
        {mode === 'saved' && (
          <div>
            {savedSigs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📂</div>
                No saved signatures yet.<br />Draw, type, or upload a signature and save it for reuse.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savedSigs.map(sig => (
                  <div key={sig.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid var(--border-light)', borderRadius: 8,
                    padding: '8px 12px', background: 'var(--bg-secondary)',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.dataUrl} alt={sig.label} style={{ height: 40, maxWidth: 120, objectFit: 'contain', background: '#fff', borderRadius: 4, border: '1px solid var(--border-light)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{new Date(sig.savedAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleInsertSaved(sig)} style={{ padding: '5px 12px', borderRadius: 6, background: '#0070F3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Use</button>
                    <button onClick={() => handleDeleteSaved(sig.id)} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save to library row (not for saved tab) */}
        {mode !== 'saved' && (
          <div style={{ marginTop: 14 }}>
            {showSaveInput ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={saveLabel} onChange={e => setSaveLabel(e.target.value)} placeholder="Label…"
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem' }} />
                <button onClick={handleSave} style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Save</button>
                <button onClick={() => setShowSaveInput(false)} style={{ padding: '6px 10px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setShowSaveInput(true)} style={{ padding: '6px 14px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                💾 Save to Library
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        {mode !== 'saved' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
            <button onClick={handleInsert} disabled={mode === 'image' && !uploadedImg}
              style={{ padding: '8px 22px', borderRadius: 'var(--radius-sm)', background: '#0070F3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, opacity: mode === 'image' && !uploadedImg ? 0.5 : 1 }}>
              Insert Signature
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
