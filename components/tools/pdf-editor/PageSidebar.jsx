'use client';
// ═══════════════════════════════════════════════════════
// PageSidebar.jsx — PDF page thumbnail strip
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react';

export default function PageSidebar({ pages, currentPage, onSelectPage }) {
  const refs = useRef({});

  // Auto-scroll active thumb into view
  useEffect(() => {
    refs.current[currentPage]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentPage]);

  if (!pages || pages.length <= 1) return null;

  return (
    <div style={{
      width: 100,
      flexShrink: 0,
      overflowY: 'auto',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '8px 6px',
    }}>
      {pages.map((page, idx) => (
        <div
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          onClick={() => onSelectPage(idx)}
          style={{
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: `2px solid ${currentPage === idx ? '#0070F3' : 'var(--border-light)'}`,
            background: 'var(--bg-main)',
            transition: 'border-color 0.15s ease',
            boxShadow: currentPage === idx ? '0 0 0 2px rgba(0,112,243,0.2)' : 'none',
            position: 'relative',
          }}
        >
          {/* Thumbnail canvas rendered as img */}
          {page.thumbDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.thumbDataUrl}
              alt={`Page ${idx + 1}`}
              style={{ width: '100%', display: 'block' }}
            />
          ) : (
            <div style={{
              height: 120,
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
            }}>
              Page {idx + 1}
            </div>
          )}
          {/* Page number badge */}
          <div style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: '0.65rem',
            padding: '1px 5px',
            borderRadius: 3,
            pointerEvents: 'none',
          }}>
            {idx + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
