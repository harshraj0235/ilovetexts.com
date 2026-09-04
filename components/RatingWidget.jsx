'use client';
// ═══════════════════════════════════════════════════════
// RatingWidget.jsx — Real star rating stored in localStorage
//
// HOW IT WORKS:
//  • Every tool has a key `ilt_rating_{slug}` in localStorage
//  • Value: { myRating: 4, count: 23, total: 94 }
//    - myRating: what THIS user gave (0 = not rated yet)
//    - count: total ratings from this browser (starts at 0)
//    - total: sum of all stars from this browser
//
//  • On first load, if no local data exists we show an unrated
//    state — no fake numbers are ever shown in the schema.
//
//  • Once the user rates, we persist it and the RatingSchema
//    component picks it up and injects real JSON-LD.
//
//  • "Crowd" baseline: we seed count=1/total=5 only AFTER
//    the user rates, so first-party data is always real.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';

const LS_PREFIX = 'ilt_rating_';

function getRatingData(slug) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRatingData(slug, data) {
  try {
    localStorage.setItem(LS_PREFIX + slug, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

export function getRatingForSchema(slug) {
  // Called by RatingSchema.jsx to read current rating data
  const data = getRatingData(slug);
  if (!data || data.count < 1) return null;
  return {
    ratingValue: (data.total / data.count).toFixed(1),
    ratingCount: String(data.count),
    bestRating: '5',
    worstRating: '1',
  };
}

export default function RatingWidget({ toolSlug, toolName, lang = 'en' }) {
  const [hovered,   setHovered]   = useState(0);
  const [myRating,  setMyRating]  = useState(0);   // 0 = not yet rated
  const [ratingData,setRatingData]= useState(null); // {myRating, count, total}
  const [showThanks,setShowThanks]= useState(false);
  const [mounted,   setMounted]   = useState(false);

  // Hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const data = getRatingData(toolSlug);
    if (data) {
      setRatingData(data);
      setMyRating(data.myRating || 0);
    }
  }, [toolSlug]);

  const handleRate = useCallback((stars) => {
    if (!mounted) return;

    const existing = getRatingData(toolSlug) || { myRating: 0, count: 0, total: 0 };

    let newCount = existing.count;
    let newTotal = existing.total;

    if (existing.myRating > 0) {
      // User is changing their existing rating — adjust totals
      newTotal = newTotal - existing.myRating + stars;
    } else {
      // First time rating — add to count
      newCount += 1;
      newTotal += stars;
    }

    const updated = { myRating: stars, count: newCount, total: newTotal };
    saveRatingData(toolSlug, updated);
    setRatingData(updated);
    setMyRating(stars);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2500);

    // Dispatch event so RatingSchema picks up the new data
    window.dispatchEvent(new CustomEvent('ilt-rating-updated', { detail: { slug: toolSlug, ...updated } }));
  }, [mounted, toolSlug]);

  const avgRating = ratingData && ratingData.count > 0
    ? (ratingData.total / ratingData.count)
    : 0;

  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : null;
  const displayCount  = ratingData?.count || 0;

  // Labels per star count
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const activeStars = hovered || myRating;

  if (!mounted) return null; // Don't render during SSR

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', padding: '20px 24px',
      background: 'var(--bg-section)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      textAlign: 'center',
    }}>
      {/* Header */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
        {myRating > 0 ? '✅ Your rating' : `Rate ${toolName}`}
      </div>

      {/* Stars row */}
      <div
        style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}
        onMouseLeave={() => setHovered(0)}
        role="group"
        aria-label={`Rate ${toolName} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= activeStars;
          return (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHovered(star)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              title={LABELS[star]}
              style={{
                background: 'none', border: 'none', padding: '2px',
                cursor: 'pointer', fontSize: '1.75rem', lineHeight: 1,
                color: filled ? '#f59e0b' : 'var(--border-light)',
                transform: hovered === star ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.1s, color 0.1s',
                filter: filled ? 'drop-shadow(0 1px 3px rgba(245,158,11,0.5))' : 'none',
              }}
            >
              ★
            </button>
          );
        })}
      </div>

      {/* Hover label */}
      {hovered > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, minHeight: '1.2em' }}>
          {LABELS[hovered]}
        </div>
      )}

      {/* Thank you flash */}
      {showThanks && (
        <div style={{
          fontSize: '0.82rem', color: '#16a34a', fontWeight: 600,
          padding: '4px 12px', background: 'rgba(22,163,74,0.1)',
          borderRadius: '20px', border: '1px solid rgba(22,163,74,0.25)',
        }}>
          ✓ Thanks for rating!
        </div>
      )}

      {/* Aggregate display (only when real data exists) */}
      {displayRating && !showThanks && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>{displayRating}</span>
          <span>/ 5</span>
          {displayCount > 1 && (
            <span>· {displayCount} rating{displayCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* Prompt when not yet rated */}
      {!myRating && !showThanks && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Click a star to rate this tool
        </div>
      )}
    </div>
  );
}
