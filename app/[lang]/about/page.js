import Link from 'next/link';
import { SITE, CATEGORIES, getAllTools } from '@/lib/tools-config';

const allToolsCount = getAllTools().length;

import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: `About ilovetexts — Free Online Text Tools | ${SITE.name}`,
    description: `ilovetexts.com is a free, privacy-first online text processing platform with ${allToolsCount}+ tools. Learn about our mission, our commitment to privacy, and why millions of users trust us for text processing.`,
    alternates: generateAlternates(lang, '/about'),
  };
}

export default async function AboutPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800' }}>
        About ilovetexts.com
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.1rem', lineHeight: '1.8' }}>
        The most comprehensive free online text processing toolkit — {allToolsCount}+ tools, 
        100% private, zero signup, free forever.
      </p>

      {/* Mission */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '16px' }}>
          We believe essential text processing tools should be <strong>free</strong>, <strong>private</strong>, 
          and <strong>instantly accessible</strong> to everyone. No signup walls, no hidden fees, no data harvesting.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          ilovetexts.com was built because we were frustrated with existing text tools that either
          required sign-ups, had usage limits, or uploaded your sensitive text to servers. We decided
          to build a platform where <strong>every single tool processes text 100% in your browser</strong> — 
          your data literally never leaves your device.
        </p>
      </section>

      {/* Why Trust Us */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Why Trust ilovetexts?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>100% Client-Side Processing</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Every tool runs JavaScript in your browser. We have zero server-side text processing. 
              Your passwords, code, personal data — none of it ever touches our servers.
              You can verify this by checking your browser&apos;s Network tab.
            </p>
          </div>
          <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📖</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Open Source Transparency</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Our codebase is available on{' '}
              <a href="https://github.com/harshraj0235/ilovetexts.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-color)' }}>
                GitHub
              </a>. 
              Anyone can audit the code to verify we don&apos;t collect, store, or transmit your text data.
            </p>
          </div>
          <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🆓</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Free Forever — No Catches</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              No premium tiers. No &quot;unlock more features&quot; paywalls. No daily usage limits.
              Every tool is free to use unlimited times, forever. We sustain this through minimal, 
              non-intrusive advertising.
            </p>
          </div>
          <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Built for Speed</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Built with Next.js and optimized for Core Web Vitals. Tools load instantly, 
              process text in real-time as you type, and even work offline via our Progressive Web App.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ marginBottom: '48px', padding: '32px', background: 'linear-gradient(135deg, var(--brand-color), #c0392b)', borderRadius: 'var(--radius-lg)', color: '#fff' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '24px', color: '#fff' }}>ilovetexts by the Numbers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{allToolsCount}+</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Free Tools</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{CATEGORIES.length}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Categories</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>0</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Data Stored</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>50+</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>TTS Languages</div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>What Tools Do We Offer?</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '24px' }}>
          Our {allToolsCount}+ tools span {CATEGORIES.length} categories, covering everything from basic text 
          formatting to advanced cryptography:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              href={lp(`/${cat.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-section)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{cat.name}</strong>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cat.tools.length} tools</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Our Technology</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '24px' }}>
          <li><strong>Frontend:</strong> Next.js with React — server-side rendered for SEO, client-side for interactivity</li>
          <li><strong>Text Processing:</strong> 100% client-side JavaScript — no server round-trips</li>
          <li><strong>Privacy:</strong> Zero server-side text storage. No cookies for tracking text data.</li>
          <li><strong>PWA:</strong> Progressive Web App with offline support via Service Worker</li>
          <li><strong>Performance:</strong> Static site generation for instant page loads across all {allToolsCount}+ pages</li>
          <li><strong>Accessibility:</strong> Semantic HTML, keyboard shortcuts (Ctrl+Enter, Ctrl+S, Ctrl+K), responsive design</li>
          <li><strong>Open Source:</strong> <a href="https://github.com/harshraj0235/ilovetexts.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-color)' }}>View source on GitHub</a></li>
        </ul>
      </section>

      {/* Contact CTA */}
      <section style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Have Questions or Feedback?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          We&apos;d love to hear from you. Report bugs, suggest new tools, or just say hi.
        </p>
        <Link href={lp('/contact')} className="btn btn-primary" style={{ padding: '14px 32px', borderRadius: 'var(--radius-full)' }}>
          Contact Us →
        </Link>
      </section>
    </div>
  );
}
