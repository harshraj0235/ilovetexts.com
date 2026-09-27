'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

// ─── Color conversion utilities ────────────────────────────────────────────────
function hexToRgb(hex) {
  const cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (cleaned.length === 6 || cleaned.length === 8) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    const a = cleaned.length === 8 ? parseInt(cleaned.substring(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  return null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s = max === 0 ? 0 : (max - min) / max, v = max;
  if (max === min) h = 0;
  else {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToCmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b) + 0.05;
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b) + 0.05;
  return l1 > l2 ? (l1 / l2).toFixed(2) : (l2 / l1).toFixed(2);
}

function getComplementary(h) { return (h + 180) % 360; }
function getAnalogous(h) { return [(h + 30) % 360, (h - 30 + 360) % 360]; }
function getTriadic(h) { return [(h + 120) % 360, (h + 240) % 360]; }
function getSplitComplementary(h) { return [(h + 150) % 360, (h + 210) % 360]; }

export default function ColorConverter({ t, lang }) {
  const [hex, setHex] = useState('#6366f1');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const rgb = useMemo(() => hexToRgb(hex) || { r: 99, g: 102, b: 241 }, [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  const hsv = useMemo(() => rgbToHsv(rgb.r, rgb.g, rgb.b), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb.r, rgb.g, rgb.b), [rgb]);

  const contrastWhite = useMemo(() => contrastRatio(rgb, { r: 255, g: 255, b: 255 }), [rgb]);
  const contrastBlack = useMemo(() => contrastRatio(rgb, { r: 0, g: 0, b: 0 }), [rgb]);
  const textColor = parseFloat(contrastWhite) > parseFloat(contrastBlack) ? '#ffffff' : '#000000';

  // Harmonies
  const complementary = useMemo(() => {
    const ch = getComplementary(hsl.h);
    const cRgb = hslToRgb(ch, hsl.s, hsl.l);
    return rgbToHex(cRgb.r, cRgb.g, cRgb.b);
  }, [hsl]);

  const analogous = useMemo(() => {
    return getAnalogous(hsl.h).map(h => {
      const cRgb = hslToRgb(h, hsl.s, hsl.l);
      return rgbToHex(cRgb.r, cRgb.g, cRgb.b);
    });
  }, [hsl]);

  const triadic = useMemo(() => {
    return getTriadic(hsl.h).map(h => {
      const cRgb = hslToRgb(h, hsl.s, hsl.l);
      return rgbToHex(cRgb.r, cRgb.g, cRgb.b);
    });
  }, [hsl]);

  const splitComp = useMemo(() => {
    return getSplitComplementary(hsl.h).map(h => {
      const cRgb = hslToRgb(h, hsl.s, hsl.l);
      return rgbToHex(cRgb.r, cRgb.g, cRgb.b);
    });
  }, [hsl]);

  // Shades & tints
  const shades = useMemo(() => {
    return [90, 75, 60, 45, 30, 15].map(l => {
      const cRgb = hslToRgb(hsl.h, hsl.s, l);
      return rgbToHex(cRgb.r, cRgb.g, cRgb.b);
    });
  }, [hsl]);

  const handleHexInput = (val) => {
    if (!val.startsWith('#')) val = '#' + val;
    setHex(val);
  };

  const handleRgbChange = (channel, value) => {
    const v = Math.min(255, Math.max(0, parseInt(value) || 0));
    const newRgb = { ...rgb, [channel]: v };
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel, value) => {
    const newHsl = { ...hsl, [channel]: parseInt(value) || 0 };
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied!`);
    } catch { showToast('Failed to copy'); }
  };

  const formatStrings = useMemo(() => ({
    hex: hex.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    css: `--color: ${hex};`,
    tailwind: `bg-[${hex}]`,
  }), [hex, rgb, hsl, hsv, cmyk]);

  return (
    <div className="tool-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Color Preview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{
          background: hex, borderRadius: 'var(--radius-lg)', minHeight: '200px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: textColor, fontFamily: 'monospace' }}>{hex.toUpperCase()}</div>
          <div style={{ fontSize: '0.9rem', color: textColor, opacity: 0.8, marginTop: '4px' }}>
            rgb({rgb.r}, {rgb.g}, {rgb.b})
          </div>
          <input type="color" value={hex.substring(0, 7)} onChange={(e) => setHex(e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '0.75rem', color: textColor, opacity: 0.6 }}>Click to pick color</div>
        </div>

        {/* Accessibility */}
        <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>♿ Accessibility (WCAG)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: '#ffffff', textAlign: 'center' }}>
              <div style={{ color: hex, fontSize: '1.2rem', fontWeight: 700 }}>Aa</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>White BG: {contrastWhite}:1</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: parseFloat(contrastWhite) >= 4.5 ? '#10b981' : '#ef4444' }}>
                {parseFloat(contrastWhite) >= 7 ? '✅ AAA' : parseFloat(contrastWhite) >= 4.5 ? '✅ AA' : '❌ Fail'}
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: '#000000', textAlign: 'center' }}>
              <div style={{ color: hex, fontSize: '1.2rem', fontWeight: 700 }}>Aa</div>
              <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>Black BG: {contrastBlack}:1</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: parseFloat(contrastBlack) >= 4.5 ? '#10b981' : '#ef4444' }}>
                {parseFloat(contrastBlack) >= 7 ? '✅ AAA' : parseFloat(contrastBlack) >= 4.5 ? '✅ AA' : '❌ Fail'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Input Controls ── */}
      <div style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>HEX</label>
            <input type="text" value={hex} onChange={(e) => handleHexInput(e.target.value)} maxLength={9}
              style={{ width: '100%', padding: '10px 14px', fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 700, border: '2px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', color: hex }} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>RGB</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['r', 'g', 'b'].map(ch => (
                <input key={ch} type="number" min="0" max="255" value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  style={{ width: '100%', padding: '10px 8px', fontSize: '0.95rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', textAlign: 'center' }}
                  placeholder={ch.toUpperCase()} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>HSL</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ k: 'h', max: 360 }, { k: 's', max: 100 }, { k: 'l', max: 100 }].map(({ k, max }) => (
                <input key={k} type="number" min="0" max={max} value={hsl[k]}
                  onChange={(e) => handleHslChange(k, e.target.value)}
                  style={{ width: '100%', padding: '10px 8px', fontSize: '0.95rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', textAlign: 'center' }}
                  placeholder={k.toUpperCase()} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Format Outputs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {Object.entries(formatStrings).map(([key, value]) => (
          <button key={key} onClick={() => handleCopy(value, key.toUpperCase())}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
              background: 'var(--bg-section)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-section)'; }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>{key}</div>
              <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>📋</span>
          </button>
        ))}
      </div>

      {/* ── Shades ── */}
      <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>🎨 Shades & Tints</h3>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {shades.map((shade, i) => (
            <button key={i} onClick={() => { setHex(shade); showToast('Color applied!'); }}
              style={{
                flex: '1 1 60px', height: '50px', background: shade, borderRadius: 'var(--radius-sm)',
                border: shade === hex ? '3px solid var(--text-primary)' : '1px solid var(--border-light)',
                cursor: 'pointer', position: 'relative', minWidth: '50px',
              }}>
              <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: i < 3 ? '#000' : '#fff', fontFamily: 'monospace' }}>{shade}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Color Harmonies ── */}
      <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>🎯 Color Harmonies</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Complementary', colors: [hex, complementary] },
            { label: 'Analogous', colors: [analogous[0], hex, analogous[1]] },
            { label: 'Triadic', colors: [hex, ...triadic] },
            { label: 'Split Complementary', colors: [hex, ...splitComp] },
          ].map(harmony => (
            <div key={harmony.label}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>{harmony.label}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {harmony.colors.map((c, i) => (
                  <button key={i} onClick={() => { setHex(c); showToast('Color applied!'); }}
                    style={{ flex: 1, height: '40px', background: c, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', cursor: 'pointer' }}
                    title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
