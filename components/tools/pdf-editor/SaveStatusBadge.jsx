'use client';
// ═══════════════════════════════════════════════════════
// SaveStatusBadge.jsx — Visual auto-save indicator
// Shows: idle (nothing) | saving (spinner) | saved ✓ | error ⚠
// ═══════════════════════════════════════════════════════

export default function SaveStatusBadge({ status, lastSavedAt }) {
  if (status === 'idle' && !lastSavedAt) return null;

  const timeStr = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const configs = {
    saving: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: null, text: 'Saving…', spin: true },
    saved:  { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  icon: '✓',  text: `Saved ${timeStr || ''}`, spin: false },
    error:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '⚠', text: 'Save failed',             spin: false },
    idle:   { color: '#6b7280', bg: 'transparent',           icon: '✓',  text: `Last saved ${timeStr}`,  spin: false },
  };

  const cfg = configs[status] || configs.idle;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      transition: 'all 0.3s',
    }}>
      {cfg.spin ? (
        <span style={{
          width: 9, height: 9,
          border: `1.5px solid ${cfg.color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'ilt-spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
      ) : (
        <span>{cfg.icon}</span>
      )}
      {cfg.text}
    </span>
  );
}
