import Link from 'next/link';
import Script from 'next/script';
import { SITE, CATEGORIES, getAllTools } from '@/lib/tools-config';

const allToolsCount = getAllTools().length;

import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: `About ilovetexts — Built by Harsh Raj | ${SITE.name}`,
    description: `ilovetexts.com is a free, privacy-first online text processing platform with ${allToolsCount}+ tools built by Harsh Raj, Software Engineer and IT undergraduate. Learn about our mission, privacy commitment, and the person behind the tools.`,
    alternates: generateAlternates(lang, '/about'),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    openGraph: {
      title: `About ilovetexts — Built by Harsh Raj`,
      description: `Free, privacy-first online text tools built by Harsh Raj, Software Engineer passionate about scalable tech. ${allToolsCount}+ tools, 100% private, no signup.`,
      type: 'profile',
      url: `${SITE.url}/about`,
    },
  };
}

export default async function AboutPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  // Person + Organization schema for Google E-E-A-T
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Harsh Raj',
    url: 'https://www.linkedin.com/in/harshitpatel9/',
    image: `${SITE.url}/harsh-raj.png`,
    sameAs: [
      'https://www.linkedin.com/in/harshitpatel9/',
      'https://github.com/harshraj0235',
    ],
    jobTitle: 'Software Engineer',
    description: 'Software Engineer passionate about building scalable tech solutions. Information Technology undergraduate committed to applying knowledge practically.',
    knowsAbout: ['JavaScript', 'Next.js', 'React', 'Web Development', 'Text Processing', 'SEO', 'Scalable Systems'],
    worksFor: {
      '@type': 'Organization',
      name: 'ilovetexts.com',
      url: SITE.url,
    },
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'Information Technology',
    },
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    founder: {
      '@type': 'Person',
      name: 'Harsh Raj',
      url: 'https://www.linkedin.com/in/harshitpatel9/',
    },
    foundingDate: '2026',
    sameAs: ['https://github.com/harshraj0235/ilovetexts.com'],
    logo: `${SITE.url}/favicon.ico`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE.url}/contact`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

    <div className="container" style={{ padding: '80px 24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800' }}>
        About ilovetexts.com
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.1rem', lineHeight: '1.8' }}>
        The most comprehensive free online text processing toolkit — {allToolsCount}+ tools, 
        100% private, zero signup, free forever.
      </p>

      {/* ── Founder / Author Section ── */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '24px' }}>👨‍💻 Meet the Builder</h2>
        <div style={{
          display: 'flex',
          gap: '28px',
          alignItems: 'flex-start',
          padding: '32px',
          background: 'var(--bg-section)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap',
        }}>
          {/* Avatar — real photo */}
          <div style={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            flexShrink: 0,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(99,102,246,0.35)',
            border: '3px solid rgba(139,92,246,0.4)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/harsh-raj.png"
              alt="Harsh Raj — Founder of ilovetexts.com"
              width={92}
              height={92}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Harsh Raj</h3>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: '20px', background: 'rgba(99,102,241,0.12)',
                color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)',
              }}>He / Him</span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: '20px', background: 'rgba(16,185,129,0.1)',
                color: '#059669', border: '1px solid rgba(16,185,129,0.25)',
              }}>Founder</span>
            </div>

            <p style={{
              fontSize: '0.95rem', fontWeight: 600,
              color: 'var(--text-secondary)', marginBottom: '10px',
            }}>
              Software Engineer · Passionate About Building Scalable Tech Solutions
            </p>

            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '0.92rem', marginBottom: '16px' }}>
              I&apos;m an <strong>Information Technology undergraduate</strong> committed to not just academic 
              excellence but also to applying my knowledge practically. I built ilovetexts.com to solve 
              a real problem — existing text tools were either slow, privacy-invasive, or locked behind 
              paywalls. Every tool on this platform processes your data 100% in your browser. 
              No servers. No data collection. Just fast, free tools for everyone.
            </p>

            {/* Skills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {['Next.js', 'React', 'JavaScript', 'Node.js', 'Web Performance', 'SEO', 'Scalable Systems'].map(skill => (
                <span key={skill} style={{
                  fontSize: '0.75rem', padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}>{skill}</span>
              ))}
            </div>

            {/* Social links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://www.linkedin.com/in/harshitpatel9/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px', borderRadius: '8px',
                  background: '#0a66c2', color: '#fff',
                  fontWeight: 600, fontSize: '0.85rem',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/harshraj0235"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px', borderRadius: '8px',
                  background: '#24292f', color: '#fff',
                  fontWeight: 600, fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* E-E-A-T quote */}
        <blockquote style={{
          marginTop: '20px',
          padding: '18px 24px',
          borderLeft: '4px solid #6366f1',
          background: 'rgba(99,102,241,0.05)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.7',
        }}>
          &ldquo;I believe every developer and writer deserves powerful text tools that are genuinely free, 
          load instantly, and respect their privacy. ilovetexts.com is my answer to that — 
          {allToolsCount}+ tools, zero ads in the tools, zero data sent to any server.&rdquo;
          <footer style={{ marginTop: '10px', fontStyle: 'normal', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
            — Harsh Raj, Founder of ilovetexts.com
          </footer>
        </blockquote>
      </section>

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
    </>
  );
}
