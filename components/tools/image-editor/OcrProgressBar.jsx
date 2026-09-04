'use client';
// ═══════════════════════════════════════════════════════
// OcrProgressBar.jsx — Animated OCR progress indicator
// ═══════════════════════════════════════════════════════

export default function OcrProgressBar({ progress, wordCount, fileName }) {
  const messages = [
    'Loading image…',
    'Initialising OCR engine…',
    'Scanning text regions…',
    'Recognising words…',
    'Building text blocks…',
    'Almost done…',
  ];
  const msgIdx = Math.min(Math.floor(progress / 18), messages.length - 1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '48px 32px',
      maxWidth: 480,
      margin: '0 auto',
      textAlign: 'center',
    }}>
      {/* Spinner ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-light)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke="#0070F3"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.1rem', color: '#0070F3',
        }}>
          {progress}%
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          {fileName ? `Reading "${fileName}"` : 'Processing image…'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {messages[msgIdx]}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #0070F3, #00c2ff)',
          borderRadius: 3,
          transition: 'width 0.35s ease',
        }} />
      </div>

      {wordCount > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {wordCount} words detected so far
        </div>
      )}

      <div style={{
        fontSize: '0.78rem', color: 'var(--text-tertiary)',
        padding: '8px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-full)',
      }}>
        🔒 Image never leaves your browser
      </div>
    </div>
  );
}
