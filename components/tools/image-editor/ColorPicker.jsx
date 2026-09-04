'use client';
'use client';
// ═══════════════════════════════════════════════════════
// ColorPicker.jsx — Compact swatch + native input color picker
// ═══════════════════════════════════════════════════════

const PRESETS = [
  '#000000', '#ffffff', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#0070F3', '#8b5cf6',
  '#ec4899', '#6b7280',
];

export default function ColorPicker({ value, onChange, label, allowTransparent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {/* Transparent option */}
        {allowTransparent && (
          <button
            onClick={() => onChange('transparent')}
            title="Transparent"
            style={{
              width: 22, height: 22, borderRadius: 4,
              border: value === 'transparent' ? '2px solid #0070F3' : '1px solid var(--border-light)',
              background: 'linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)',
              cursor: 'pointer', flexShrink: 0, padding: 0,
            }}
          />
        )}
        {/* Preset swatches */}
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: c,
              border: value === c ? '2px solid #0070F3' : '1px solid var(--border-light)',
              cursor: 'pointer', flexShrink: 0, padding: 0,
            }}
          />
        ))}
        {/* Custom color input */}
        <label title="Custom color" style={{
          width: 22, height: 22, borderRadius: 4,
          border: '1px dashed var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0,
          background: !PRESETS.includes(value) && value !== 'transparent' ? value : 'var(--bg-secondary)',
        }}>
          <span style={{ fontSize: 10, pointerEvents: 'none', color: 'var(--text-tertiary)' }}>+</span>
          <input
            type="color"
            value={value === 'transparent' ? '#ffffff' : (value || '#000000')}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </label>
      </div>
    </div>
  );
}
