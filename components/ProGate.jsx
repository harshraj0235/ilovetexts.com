'use client';
// ═══════════════════════════════════════════════════════
// ProGate.jsx — Premium feature gate wrapper
// Wraps premium tool content; shows upgrade CTA when
// daily limit is reached. Renders children normally when
// usage is within limits.
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { checkUsage, recordUsage, getPlan, checkFileSize, PLANS } from '@/lib/subscription';

const S = {
  overlay: {
    position: 'relative',
    width: '100%',
  },
  gate: {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 'var(--radius-lg)',
  },
  card: {
    background: 'var(--bg-main)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 28px',
    maxWidth: 420,
    width: '90%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-float)',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
    display: 'block',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  desc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 20,
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 700,
    transition: 'all 0.2s',
  },
  badgeFree: {
    background: 'rgba(124,58,237,0.08)',
    color: '#7c3aed',
    border: '1px solid rgba(124,58,237,0.2)',
  },
  badgeWarning: {
    background: 'rgba(245,158,11,0.08)',
    color: '#d97706',
    border: '1px solid rgba(245,158,11,0.2)',
  },
  badgePro: {
    background: 'rgba(124,58,237,0.08)',
    color: '#7c3aed',
    border: '1px solid rgba(124,58,237,0.15)',
  },
};

/**
 * UsageBadge — shows remaining uses for a tool.
 * Renders inline; use above the tool.
 */
export function UsageBadge({ toolId }) {
  const [usage, setUsage] = useState(null);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    setUsage(checkUsage(toolId));
    setPlan(getPlan());
  }, [toolId]);

  if (!usage || plan !== 'free') return null;
  if (usage.limit === Infinity) return null;

  const isLow = usage.remaining <= 1;
  const badgeStyle = {
    ...S.badge,
    ...(isLow ? S.badgeWarning : S.badgeFree),
  };

  return (
    <span style={badgeStyle}>
      {isLow ? '⚠️' : '⚡'} {usage.remaining} of {usage.limit} free uses left today
    </span>
  );
}

/**
 * ProBadge — small inline badge showing "⚡ Pro" 
 * Use next to tool names in category listings.
 */
export function ProBadge() {
  return (
    <span style={{ ...S.badge, ...S.badgePro, padding: '2px 8px', fontSize: '0.68rem' }}>
      ⚡ Pro
    </span>
  );
}

/**
 * ProGate — wraps premium tool content.
 * 
 * Usage:
 *   <ProGate toolId="pdf-to-excel" lang={lang}>
 *     <PdfToExcel ... />
 *   </ProGate>
 * 
 * When limit is reached, shows upgrade overlay on top of
 * the blurred tool content.
 */
export default function ProGate({ toolId, lang = 'en', children, onUse }) {
  const [usage, setUsage] = useState(null);
  const [plan, setPlan] = useState('free');
  const [gated, setGated] = useState(false);

  useEffect(() => {
    const u = checkUsage(toolId);
    setUsage(u);
    setPlan(getPlan());
    setGated(!u.allowed && getPlan() === 'free');
  }, [toolId]);

  // Called by the tool when a premium action is used
  const handleUse = () => {
    recordUsage(toolId);
    const u = checkUsage(toolId);
    setUsage(u);
    if (!u.allowed && getPlan() === 'free') setGated(true);
    onUse?.(u);
  };

  // For file size gating
  const handleFileCheck = (sizeBytes) => {
    return checkFileSize(sizeBytes);
  };

  const pricingUrl = lang === 'en' ? '/pricing' : `/${lang}/pricing`;

  return (
    <div style={S.overlay}>
      {/* Always render children but blur if gated */}
      <div style={gated ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : undefined}>
        {typeof children === 'function'
          ? children({ usage, plan, recordUse: handleUse, checkFile: handleFileCheck })
          : children
        }
      </div>

      {/* Upgrade overlay */}
      {gated && (
        <div style={S.gate}>
          <div style={S.card}>
            <span style={S.icon}>🔒</span>
            <div style={S.title}>Daily Free Limit Reached</div>
            <div style={S.desc}>
              You&apos;ve used all {usage?.limit} free uses for today.
              Upgrade to <strong>Pro</strong> for unlimited access to all premium
              PDF tools — just ₹199/month.
            </div>
            <a href={pricingUrl} style={S.btn}>
              ⚡ Upgrade to Pro — ₹199/mo
            </a>
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Or wait until tomorrow for 
              {' '}{usage?.limit} more free uses
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
