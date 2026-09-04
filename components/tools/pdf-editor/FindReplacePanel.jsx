'use client';
// ═══════════════════════════════════════════════════════
// FindReplacePanel.jsx — Find & replace across all pages
// ═══════════════════════════════════════════════════════
import { useState, useCallback } from 'react';

export default function FindReplacePanel({ pages, onReplaceAll, onClose }) {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchCount, setMatchCount] = useState(null);

  const countMatches = useCallback(() => {
    if (!find) return 0;
    let count = 0;
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      for (const page of pages) {
        for (const block of page.textBlocks) {
          const m = block.text.match(re);
          if (m) count += m.length;
        }
      }
    } catch (e) { /* invalid regex */ }
    return count;
  }, [find, pages, caseSensitive]);

  const handleReplaceAll = useCallback(() => {
    if (!find) return;
    const flags = caseSensitive ? 'g' : 'gi';
    let count = 0;
    try {
      const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const newPages = pages.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((block) => {
          const matches = block.text.match(re);
          if (matches) {
            count += matches.length;
            return { ...block, text: block.text.replace(re, replace) };
          }
          return block;
        }),
      }));
      setMatchCount(count);
      onReplaceAll(newPages);
    } catch (e) { /* invalid */ }
  }, [find, replace, pages, caseSensitive, onReplaceAll]);

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 8,
      background: 'var(--bg-main)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-float)',
      padding: '16px',
      zIndex: 100,
      width: 320,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔎 Find & Replace</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>×</button>
      </div>

      <input
        value={find}
        onChange={(e) => { setFind(e.target.value); setMatchCount(null); }}
        placeholder="Find text…"
        style={{
          width: '100%', padding: '8px 10px', marginBottom: 8,
          border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          fontSize: '0.9rem',
        }}
      />
      <input
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        placeholder="Replace with…"
        style={{
          width: '100%', padding: '8px 10px', marginBottom: 10,
          border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          fontSize: '0.9rem',
        }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
        Case sensitive
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setMatchCount(countMatches())}
          style={{
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          Count
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={!find}
          style={{
            flex: 2, padding: '8px', borderRadius: 'var(--radius-sm)',
            background: '#0070F3', color: '#fff',
            border: 'none', cursor: find ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem', fontWeight: 600,
            opacity: find ? 1 : 0.5,
          }}
        >
          Replace All
        </button>
      </div>

      {matchCount !== null && (
        <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          {matchCount === 0 ? 'No matches found.' : `✅ Replaced ${matchCount} occurrence${matchCount !== 1 ? 's' : ''}.`}
        </p>
      )}
    </div>
  );
}
