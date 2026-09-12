'use client';
// ═══════════════════════════════════════════════════════
// PricingCards.jsx — 3-tier pricing with monthly/yearly toggle
// Glassmorphism cards, feature comparison, Razorpay-ready
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { PLANS, FEATURES, activatePlan } from '@/lib/subscription';

export default function PricingCards({ lang = 'en' }) {
  const [billing, setBilling] = useState('monthly'); // monthly | yearly
  const [activating, setActivating] = useState(null);

  const plans = [
    {
      ...PLANS.free,
      tagline: 'For casual use',
      cta: 'Current Plan',
      ctaDisabled: true,
      popular: false,
    },
    {
      ...PLANS.pro,
      tagline: 'For students & professionals',
      cta: 'Get Pro',
      ctaDisabled: false,
      popular: true,
    },
    {
      ...PLANS.business,
      tagline: 'For teams & businesses',
      cta: 'Get Business',
      ctaDisabled: false,
      popular: false,
    },
  ];

  const getPrice = (plan) => {
    if (plan.price === 0) return '₹0';
    if (billing === 'yearly') {
      const monthly = Math.round(plan.priceYearly / 12);
      return `₹${monthly}`;
    }
    return `₹${plan.price}`;
  };

  const getSavings = (plan) => {
    if (plan.price === 0 || billing !== 'yearly') return null;
    const yearlyCost = plan.priceYearly;
    const monthlyCost = plan.price * 12;
    const saved = monthlyCost - yearlyCost;
    return `Save ₹${saved}/year`;
  };

  const handleActivate = (planId) => {
    setActivating(planId);
    // For now: activate directly (no payment flow)
    // TODO: Replace with Razorpay checkout
    const months = billing === 'yearly' ? 12 : 1;
    activatePlan(planId, months);
    setTimeout(() => {
      setActivating(null);
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          padding: 4,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
        }}>
          {['monthly', 'yearly'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: billing === b ? 'var(--bg-main)' : 'transparent',
                color: billing === b ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: billing === b ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: billing === b ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span style={{
                  marginLeft: 6,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#059669',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}>
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        marginBottom: 48,
      }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              position: 'relative',
              background: 'var(--bg-main)',
              border: plan.popular ? '2px solid #7c3aed' : '1px solid var(--border-light)',
              borderRadius: 16,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
              boxShadow: plan.popular ? '0 8px 32px rgba(124,58,237,0.12)' : 'var(--shadow-sm)',
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.78rem',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}>
                ⚡ Most Popular
              </div>
            )}

            {/* Plan header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 28 }}>{plan.badge}</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {plan.name}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {plan.tagline}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {getPrice(plan)}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    /month
                  </span>
                )}
              </div>
              {getSavings(plan) && (
                <div style={{
                  marginTop: 6,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16,185,129,0.08)',
                  color: '#059669',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-block',
                }}>
                  🎉 {getSavings(plan)}
                </div>
              )}
              {plan.price === 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Free forever — no credit card needed
                </div>
              )}
            </div>

            {/* CTA button */}
            <button
              onClick={() => !plan.ctaDisabled && handleActivate(plan.id)}
              disabled={plan.ctaDisabled || activating === plan.id}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 'var(--radius-full)',
                border: plan.popular ? 'none' : '1px solid var(--border-light)',
                background: plan.popular
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : plan.ctaDisabled ? 'var(--bg-secondary)' : 'var(--bg-main)',
                color: plan.popular ? '#fff' : plan.ctaDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: plan.ctaDisabled ? 'default' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: 24,
                opacity: activating === plan.id ? 0.6 : 1,
              }}
            >
              {activating === plan.id ? '⏳ Activating...' : plan.cta}
            </button>

            {/* Feature list */}
            <div style={{ flex: 1 }}>
              {FEATURES.map((f, i) => {
                const value = f[plan.id];
                const isIncluded = value === true || (typeof value === 'string');
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: i < FEATURES.length - 1 ? '1px solid var(--border-light)' : 'none',
                    opacity: value === false ? 0.4 : 1,
                  }}>
                    <span style={{ fontSize: '0.85rem', flexShrink: 0, width: 20, textAlign: 'center' }}>
                      {value === false ? '—' : value === true ? '✅' : '✅'}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>
                      {f.name}
                    </span>
                    {typeof value === 'string' && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: value === 'Unlimited' ? '#059669' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Trust section */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        flexWrap: 'wrap',
        padding: '24px 0',
        borderTop: '1px solid var(--border-light)',
      }}>
        {[
          { icon: '🔒', label: '100% Private — your files never leave your browser' },
          { icon: '🚫', label: 'No ads for Pro users' },
          { icon: '↩️', label: 'Cancel anytime — no lock-in' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
