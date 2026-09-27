import PricingCards from '@/components/PricingCards';
import { LANG_CODES } from '@/lib/i18n';
import { SITE } from '@/lib/tools-config';

export async function generateStaticParams() {
  return LANG_CODES.map(lang => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const title = 'Pricing — ilovetexts.com Pro';
  const description = 'Upgrade to Pro for unlimited PDF tools — batch processing, OCR, table extraction, redaction, AI summarizer & more. Just ₹199/month. 100% private, no data on servers.';
  return {
    title,
    description,
    openGraph: { title, description, url: `https://ilovetexts.com/${lang}/pricing` },
    alternates: {
      canonical: `https://ilovetexts.com/${lang}/pricing`,
    },
  };
}

export default async function PricingPage({ params }) {
  const { lang } = await params;
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: 40, paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 48px', padding: '0 16px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          borderRadius: 999,
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.15)',
          marginBottom: 20,
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#7c3aed',
        }}>
          ⚡ Pro Tools — Unlimited Access
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 16,
          color: 'var(--text-primary)',
        }}>
          Unlock the full power of
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            PDF Processing
          </span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 520,
          margin: '0 auto',
        }}>
          Batch processing, OCR, table extraction, redaction, AI summarizer — all the advanced tools you need. 100% private, processed in your browser.
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingCards lang={lang} />

      {/* FAQ Section */}
      <div style={{ maxWidth: 700, margin: '64px auto 0', padding: '0 16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>

        {[
          {
            q: 'Is my data safe?',
            a: 'Absolutely. All processing happens locally in your browser. Your files are never uploaded to any server. Even we cannot see your documents.',
          },
          {
            q: 'What happens when my free uses run out?',
            a: 'You can continue using all basic tools for free. Premium tools have daily limits (3-5 free uses per day). Your limits reset at midnight. Upgrade to Pro for unlimited access.',
          },
          {
            q: 'Can I cancel anytime?',
            a: 'Yes! There are no contracts or lock-in periods. Cancel anytime and your Pro access remains until the end of your billing period.',
          },
          {
            q: 'How does payment work?',
            a: 'We use Razorpay for Indian payments and Stripe for international cards. Both are PCI-compliant and secure. We never store your card details.',
          },
          {
            q: 'What if the tool doesn\'t work for my PDF?',
            a: 'Contact us within 7 days for a full refund. We want you to be completely satisfied with Pro.',
          },
          {
            q: 'Is there a student discount?',
            a: 'Yes! Students get 50% off with a valid .edu email address. Contact us after subscribing to apply the discount.',
          },
        ].map((faq, i) => (
          <details key={i} style={{
            marginBottom: 12,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
          }}>
            <summary style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              listStyle: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {faq.q}
              <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>+</span>
            </summary>
            <p style={{
              marginTop: 12,
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </main>
  );
}
