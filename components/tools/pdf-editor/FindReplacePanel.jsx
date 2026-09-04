'use client';
// ═══════════════════════════════════════════════════════
// FindReplacePanel.jsx v2
// NEW: find-next / find-previous navigation,
//      match index display, regex mode, whole-word mode
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect } from 'react';

export default function FindReplacePanel({
  pages, onReplaceAll, onClose,
  currentPage, onGoToPage, onHighlightBlock,
}) {
  const [find,          setFind]          = useState('');
  const [replace,       setReplace]       = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord,     setWholeWord]     = useState(false);
  const [useRegex,      setUseRegex]      = useState(false);
  const [matchIdx,      setMatchIdx]      = useState(0);
  const [matches,       setMatches]       = useState([]); // [{pageIdx, blockIdx, text}]
  const [replaced,      setReplaced]      = useState(null);
  const findRef = useRef(null);

  useEffect(() => { findRef.current?.focus(); }, []);

  // Build full match list across all pages
  const buildMatches = useCallback(() => {
    if (!find) return [];
    try {
      let pattern = find.replace(/[.*+?^${}()|[\]\\]/g, useRegex ? '$&' : '\\$&');
      if (!useRegex) pattern = pattern.replace(/\\\$/g, '$');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? 'g' : 'gi';
      const re = new RegExp(pattern, flags);
      const found = [];
      pages.forEach((page, pi) => {
        (page.textBlocks || []).forEach((block, bi) => {
          const m = block.text.match(re);
          if (m) {
            for (let k = 0; k < m.length; k++) {
              found.push({ pageIdx: pi, blockIdx: bi, blockId: block.id, text: block.text });
            }
          }
        });
      });
      return found;
    } catch (e) { return []; }
  }, [find, pages, caseSensitive, wholeWord, useRegex]);

  // Re-build on find term change
  useEffect(() => {
    const m = buildMatches();
    setMatches(m);
    setMatchIdx(0);
    setReplaced(null);
    if (m.length > 0) {
      onGoToPage?.(m[0].pageIdx);
      onHighlightBlock?.(m[0].blockId);
    } else {
      onHighlightBlock?.(null);
    }
  }, [find, caseSensitive, wholeWord, useRegex]); // eslint-disable-line

  const goTo = useCallback((idx) => {
    const m = matches;
    if (!m.length) return;
    const safeIdx = ((idx % m.length) + m.length) % m.length;
    setMatchIdx(safeIdx);
    onGoToPage?.(m[safeIdx].pageIdx);
    onHighlightBlock?.(m[safeIdx].blockId);
  }, [matches, onGoToPage, onHighlightBlock]);

  const handleFindNext = useCallback(() => goTo(matchIdx + 1), [goTo, matchIdx]);
  const handleFindPrev = useCallback(() => goTo(matchIdx - 1), [goTo, matchIdx]);

  const handleReplaceOne = useCallback(() => {
    if (!find || !matches.length) return;
    const cur = matches[matchIdx];
    if (!cur) return;
    try {
      let pattern = find.replace(/[.*+?^${}()|[\]\\]/g, useRegex ? '$&' : '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? '' : 'i';
      const re = new RegExp(pattern, flags);
      const newPages = pages.map((page, pi) => {
        if (pi !== cur.pageIdx) return page;
        return {
          ...page,
          textBlocks: page.textBlocks.map((block, bi) => {
            if (bi !== cur.blockIdx) return block;
            return { ...block, text: block.text.replace(re, replace), isEdited: true };
          }),
        };
      });
      onReplaceAll(newPages);
      setReplaced(1);
      // Rebuild and advance
      setTimeout(() => {
        const m = buildMatches();
        setMatches(m);
        setMatchIdx(prev => Math.min(prev, m.length - 1));
      }, 50);
    } catch (e) { /* invalid regex */ }
  }, [find, replace, pages, matchIdx, matches, caseSensitive, wholeWord, useRegex, onReplaceAll, buildMatches]);

  const handleReplaceAll = useCallback(() => {
    if (!find) return;
    try {
      let pattern = find.replace(/[.*+?^${}()|[\]\\]/g, useRegex ? '$&' : '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? 'g' : 'gi';
      const re = new RegExp(pattern, flags);
      let count = 0;
      const newPages = pages.map(page => ({
        ...page,
        textBlocks: page.textBlocks.map(block => {
          const m = block.text.match(re);
          if (m) { count += m.length; return { ...block, text: block.text.replace(re, replace), isEdited: true }; }
          return block;
        }),
      }));
      setReplaced(count);
      setMatches([]);
      setMatchIdx(0);
      onHighlightBlock?.(null);
      onReplaceAll(newPages);
    } catch (e) { /* invalid */ }
  }, [find, replace, pages, caseSensitive, wholeWord, useRegex, onReplaceAll, onHighlightBlock]);

  const hasMatches  = matches.length > 0;
  const matchLabel  = hasMatches ? `${matchIdx + 1} / ${matches.length}` : (find ? '0 results' : '');

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8,
      background: 'var(--bg-main)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      padding: 18, zIndex: 100, width: 340,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔎 Find & Replace</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>×</button>
      </div>

      {/* Find row */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          ref={findRef}
          value={find}
          onChange={e => setFind(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleFindNext(); if (e.key === 'Escape') onClose(); }}
          placeholder="Find text…"
          style={{
            width: '100%', padding: '8px 70px 8px 10px',
            border: `1px solid ${find && !hasMatches ? '#ef4444' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: '0.9rem', boxSizing: 'border-box',
          }}
        />
        {/* Match counter badge */}
        {find && (
          <span style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.72rem', color: hasMatches ? '#0070F3' : '#ef4444',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}>{matchLabel}</span>
        )}
      </div>

      {/* Replace row */}
      <input
        value={replace}
        onChange={e => setReplace(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleReplaceOne(); }}
        placeholder="Replace with…"
        style={{
          width: '100%', padding: '8px 10px', marginBottom: 10,
          border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          fontSize: '0.9rem', boxSizing: 'border-box',
        }}
      />

      {/* Options row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Aa', title: 'Case sensitive', state: caseSensitive, set: setCaseSensitive },
          { label: '\\b', title: 'Whole word', state: wholeWord, set: setWholeWord },
          { label: '.*', title: 'Use regex', state: useRegex, set: setUseRegex },
        ].map(opt => (
          <button key={opt.label} title={opt.title} onClick={() => opt.set(v => !v)}
            style={{
              padding: '3px 9px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 700,
              border: `1px solid ${opt.state ? '#0070F3' : 'var(--border-light)'}`,
              background: opt.state ? 'rgba(0,112,243,0.1)' : 'var(--bg-secondary)',
              color: opt.state ? '#0070F3' : 'var(--text-secondary)', cursor: 'pointer',
            }}>{opt.label}</button>
        ))}
      </div>

      {/* Navigation row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button onClick={handleFindPrev} disabled={!hasMatches}
          style={{
            flex: 1, padding: '7px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: hasMatches ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem', opacity: hasMatches ? 1 : 0.4,
          }}>↑ Prev</button>
        <button onClick={handleFindNext} disabled={!hasMatches}
          style={{
            flex: 1, padding: '7px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: hasMatches ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem', opacity: hasMatches ? 1 : 0.4,
          }}>↓ Next</button>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleReplaceOne} disabled={!hasMatches}
          style={{
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: hasMatches ? 'pointer' : 'not-allowed',
            fontSize: '0.82rem', opacity: hasMatches ? 1 : 0.45,
          }}>Replace</button>
        <button onClick={handleReplaceAll} disabled={!find}
          style={{
            flex: 2, padding: '8px', borderRadius: 'var(--radius-sm)',
            background: '#0070F3', color: '#fff',
            border: 'none', cursor: find ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem', fontWeight: 600, opacity: find ? 1 : 0.5,
          }}>Replace All</button>
      </div>

      {replaced !== null && (
        <p style={{ marginTop: 10, fontSize: '0.82rem', color: replaced > 0 ? '#16a34a' : '#6b7280', textAlign: 'center' }}>
          {replaced === 0 ? 'No matches found.' : `✅ Replaced ${replaced} occurrence${replaced !== 1 ? 's' : ''}.`}
        </p>
      )}
    </div>
  );
}
