'use client';
// ═══════════════════════════════════════════════════════
// RatingSchema.jsx — Injects REAL aggregateRating JSON-LD
//
// Only adds aggregateRating to the WebApplication schema
// when the user has actually rated the tool (localStorage).
// Listens for 'ilt-rating-updated' to update schema live.
//
// Google guidelines: aggregateRating must reflect real
// user ratings. This component guarantees that — if no
// one has rated yet, we emit NO aggregateRating at all,
// which is perfectly valid schema.
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { SITE } from '@/lib/tools-config';

const LS_PREFIX = 'ilt_rating_';

function readRating(slug) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + slug);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.count < 1) return null;
    return {
      ratingValue: (data.total / data.count).toFixed(1),
      ratingCount: String(data.count),
    };
  } catch {
    return null;
  }
}

export default function RatingSchema({ tool, category }) {
  const [rating, setRating] = useState(null);

  // Read on mount
  useEffect(() => {
    setRating(readRating(tool.slug));
  }, [tool.slug]);

  // Listen for live updates from RatingWidget
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.slug !== tool.slug) return;
      const { count, total } = e.detail;
      if (count < 1) return;
      setRating({
        ratingValue: (total / count).toFixed(1),
        ratingCount: String(count),
      });
    };
    window.addEventListener('ilt-rating-updated', handler);
    return () => window.removeEventListener('ilt-rating-updated', handler);
  }, [tool.slug]);

  // No real rating yet → emit nothing (safe, no penalty)
  if (!rating) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    '@id': `${SITE.url}/${category.id}/${tool.slug}#rating`,
    itemReviewed: {
      '@type': 'WebApplication',
      name: tool.name,
      url: `${SITE.url}/${category.id}/${tool.slug}`,
    },
    ratingValue: rating.ratingValue,
    ratingCount: rating.ratingCount,
    bestRating: '5',
    worstRating: '1',
    description: `User rating for ${tool.name} on ilovetexts.com`,
  };

  return (
    <script
      id={`schema-rating-${tool.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
