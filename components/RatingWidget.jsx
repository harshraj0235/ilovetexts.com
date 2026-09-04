'use client';
// ═══════════════════════════════════════════════════════
// RatingWidget.jsx v2 — Real star rating + post-rating CTAs
//
// After rating, shows 3 actions Google loves most:
//  1. "Search on Google" — user searches tool name → clicks
//     your result → Google sees real organic CTR signal
//  2. "Bookmark this tool" — return visit signal
//  3. "Share link" — referral traffic signal
//
// All 3 are genuine user engagement signals that tell
// Google this tool is useful and worth ranking higher.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';

const LS_PREFIX = 'ilt_rating_';

function getRatingData(slug) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveRatingData(slug, data) {
  try {
    localStorage.setItem(LS_PREFIX + slug, JSON.stringify(data));
  } catch {}
}

export function getRatingForSchema(slug) {
  const data = getRatingData(slug);
  if (!data || data.count < 1) return null;
  return {
    ratingValue: (data.total / data.count).toFixed(1),
    ratingCount: String(data.count),
    bestRating: '5',
    worstRating: '1',
  };
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent! 🎉'];

export default function RatingWidget({ toolSlug, toolName, lang = 'en' }) {
  const [hovered,      setHovered]      = useState(0);
  const [myRating,     setMyRating]     = useState(0);
  const [ratingData,   setRatingData]   = useState(null);
  const [showActions,  setShowActions]  = useState(false);
  const [copyDone,     setCopyDone]     = useState(false);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => {
    setMounted(true);
    const data = getRatingData(toolSlug);
    if (data) { setRatingData(data); setMyRating(data.myRating || 0); }
  }, [toolSlug]);

  const handleRate = useCallback((stars) => {
    if (!mounted) return;
    const existing = getRatingData(toolSlug) || { myRating: 0, count: 0, total: 0 };
    let newCount = existing.count;
    let newTotal = existing.total;
    if (existing.myRating > 0) {
      newTotal = newTotal - existing.myRating + stars;
    } else {
      newCount += 1;
      newTotal += stars;
    }
    const updated = { myRating: stars, count: newCount, total: newTotal };
    saveRatingData(toolSlug, updated);
    setRatingData(updated);
    setMyRating(stars);
    setShowActions(true); // show the 3 Google-boosting CTAs
    window.dispatchEvent(new CustomEvent('ilt-rating-updated', { detail: { slug: toolSlug, ...updated } }));
  }, [mounted, toolSlug]);

  // CTA actions
  const handleGoogleSearch = useCallback(() => {
    // Searches Google for the tool name — when user clicks your result,
    // Google records a real organic CTR signal which boosts your ranking
    const query = encodeURIComponent(`${toolName} free online ilovetexts`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  }, [toolName]);

  const handleBookmark = useCallback(() => {
    // Triggers browser bookmark dialog — return visits = positive signal
    try {
      if (window.sidebar && window.sidebar.addPanel) {
        window.sidebar.addPanel(document.title, window.location.href, '');
      } else if (window.external && ('AddFavorite' in window.external)) {
        window.external.AddFavorite(window.location.href, document.title);
      } else {
        // Modern browsers — tell user the shortcut
        alert(`Press ${navigator.userAgent.includes('Mac') ? 'Cmd+D' : 'Ctrl+D'} to bookmark this tool!`);
      }
    } catch { alert(`Press Ctrl+D (or Cmd+D on Mac) to bookmark this tool!`); }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {}
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${toolName} — Free Online Tool`,
          text: `Check out this free ${toolName} tool — no signup, works instantly in the browser!`,
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  }, [toolName, handleCopyLink]);

  const avgRating   = ratingData?.count > 0 ? ratingData.total / ratingData.count : 0;
  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : null;
  const displayCount  = ratingData?.count || 0;
  const activeStars   = hovered || myRating;

  if (!mounted) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', padding: '20px 24px',
      background: 'var(--bg-section)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      textAlign: 'center',
      transition: 'all 0.3s',
    }}>

      {/* ── Header ── */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
        {myRating > 0 ? `⭐ You rated: ${LABELS[myRating]}` : `Rate ${toolName}`}
      </div>

      {/* ── Stars ── */}
      <div
        style={{ display: 'flex', gap: '4px' }}
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
                cursor: 'pointer', fontSize: '1.9rem', lineHeight: 1,
                color: filled ? '#f59e0b' : 'var(--border-light)',
                transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.12s, color 0.12s',
                filter: filled ? 'drop-shadow(0 1px 4px rgba(245,158,11,0.55))' : 'none',
              }}
            >★</button>
          );
        })}
      </div>

      {/* Hover label */}
      {hovered > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, minHeight: '1.2em' }}>
          {LABELS[hovered]}
        </div>
      )}

      {/* Aggregate */}
      {displayRating && !showActions && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>{displayRating}</span>
          <span>/ 5</span>
          {displayCount > 1 && <span>· {displayCount} ratings</span>}
        </div>
      )}

      {/* Prompt */}
      {!myRating && !showActions && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Click a star to rate this tool
        </div>
      )}

      {/* ── POST-RATING CTA PANEL ── */}
      {showActions && (
        <div style={{
          width: '100%',
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: 'ilt-fadein 0.35s ease',
        }}>
          {/* Thank you */}
          <div style={{
            fontSize: '0.82rem', fontWeight: 700, color: '#16a34a',
            padding: '6px 12px',
            background: 'rgba(22,163,74,0.08)',
            borderRadius: '20px',
            border: '1px solid rgba(22,163,74,0.2)',
          }}>
            ✓ Thanks! Help others find this tool:
          </div>

          {/* Primary CTA — Google search */}
          <button
            onClick={handleGoogleSearch}
            title="Search Google for this tool — your click back tells Google this tool ranks well"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg,#4285F4,#34A853)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(66,133,244,0.4)',
              transition: 'opacity 0.15s',
            }}
          >
            {/* Google G icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Search on Google
          </button>

          {/* Secondary row */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              title="Bookmark this tool to come back later"
              style={{
                flex: 1, padding: '8px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '5px',
              }}
            >
              🔖 Bookmark
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title="Share this tool"
              style={{
                flex: 1, padding: '8px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '5px',
              }}
            >
              📤 Share
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              title="Copy link to clipboard"
              style={{
                flex: 1, padding: '8px 8px',
                borderRadius: '8px',
                border: `1px solid ${copyDone ? '#16a34a' : 'var(--border-light)'}`,
                background: copyDone ? 'rgba(22,163,74,0.08)' : 'var(--bg-main)',
                color: copyDone ? '#16a34a' : 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '5px',
                transition: 'all 0.2s',
              }}
            >
              {copyDone ? '✓ Copied' : '🔗 Copy'}
            </button>
          </div>

          {/* Micro-explanation */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
            Searching &amp; clicking helps Google see this tool is useful 🚀
          </div>

          {/* Hide actions */}
          <button
            onClick={() => setShowActions(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', color: 'var(--text-tertiary)',
              textDecoration: 'underline', padding: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <style>{`
        @keyframes ilt-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
