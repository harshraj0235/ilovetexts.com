'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTranslations } from '@/lib/i18n';
import EmbedWidget from './EmbedWidget';
import RatingWidget from './RatingWidget';
import RatingSchema from './RatingSchema';

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' && '✅ '}
      {message}
    </div>
  );
}

// ── Embed CTA Banner — shown below every tool, drives backlinks ──────────────
function EmbedCTA({ toolUrl, toolName }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);

  const getEmbedUrl = () => {
    try {
      const url = new URL(toolUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      const embedPath = parts.length === 2 ? `/embed/en${url.pathname}` : `/embed${url.pathname}`;
      return `${url.origin}${embedPath}`;
    } catch { return ''; }
  };

  const embedCode = `<iframe src="${getEmbedUrl()}" width="100%" height="600" style="border:1px solid #e2e8f0;border-radius:8px;" title="${toolName} — Free Online Tool by ilovetexts.com" loading="lazy"></iframe>\n<p style="font-size:12px;text-align:right;font-family:sans-serif;margin-top:4px;">Free tool by <a href="https://ilovetexts.com" style="color:#3b82f6;">ilovetexts.com</a></p>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderTop: '1px solid #bae6fd',
        borderBottom: '1px solid #bae6fd',
        padding: '16px 24px',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>📎</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0c4a6e' }}>
                Embed this tool on your website — free, no limits
              </div>
              <div style={{ fontSize: '0.8rem', color: '#075985', marginTop: '2px' }}>
                Add the fully working {toolName} to your blog or site in 30 seconds. No API key, no backend.
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 20px', borderRadius: '8px',
              background: '#0284c7', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            📎 Get Embed Code
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-main, #fff)', color: 'var(--text-primary, #111)',
            borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '620px',
            boxShadow: '0 24px 40px rgba(0,0,0,0.18)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>📎 Embed {toolName}</h3>
                <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Paste this into any HTML page. The tool is fully functional and always up-to-date.
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-secondary)', lineHeight: 1, padding: '0 0 0 12px' }}>×</button>
            </div>

            {/* Benefits row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {[
                { icon: '🆓', text: 'Always free' },
                { icon: '🔒', text: '100% private' },
                { icon: '📱', text: 'Mobile responsive' },
                { icon: '🔄', text: 'Auto-updated' },
              ].map(b => (
                <span key={b.text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '20px',
                  background: 'var(--bg-section)', border: '1px solid var(--border-light)',
                  fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500,
                }}>{b.icon} {b.text}</span>
              ))}
            </div>

            {/* Preview */}
            <div style={{
              border: '1px solid var(--border-light)', borderRadius: '8px',
              overflow: 'hidden', marginBottom: '14px', background: '#f8fafc',
            }}>
              <div style={{ padding: '6px 12px', background: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ marginLeft: 6 }}>Preview — your-site.com</span>
              </div>
              <div style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#374151', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 120, overflowY: 'auto' }}>
                {embedCode}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={{
                padding: '9px 18px', border: '1px solid var(--border-light)',
                borderRadius: '8px', background: 'transparent', cursor: 'pointer',
                fontSize: '0.88rem', color: 'var(--text-secondary)',
              }}>Cancel</button>
              <button onClick={handleCopy} style={{
                padding: '9px 22px', border: 'none', borderRadius: '8px',
                background: copied ? '#10b981' : '#0284c7', color: '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', gap: '7px',
                transition: 'background 0.2s',
              }}>
                {copied ? '✓ Copied!' : '📋 Copy Embed Code'}
              </button>
            </div>

            <p style={{ marginTop: '14px', fontSize: '0.74rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              By embedding, you help us stay free. The "Powered by ilovetexts.com" link is appreciated but not required.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function ToolLayout({ 
  tool, 
  category, 
  relatedTools = [], 
  crossLinks = [],
  children, 
  faqs = [], 
  howToSteps = [],
  whatIs = '',
  whyChoose = [],
  useCases = [],
  relatedSearches = [],
  allCategories = [],
  lang = 'en',
}) {
  const t = getTranslations(lang);
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const [toast, setToast] = useState(null);

  // Track this tool as recently used
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ilt-recent-tools') || '[]');
      const filtered = stored.filter(
        (item) => !(item.categoryId === category.id && item.slug === tool.slug)
      );
      filtered.unshift({
        categoryId: category.id,
        slug: tool.slug,
        lastUsed: Date.now(),
      });
      localStorage.setItem('ilt-recent-tools', JSON.stringify(filtered.slice(0, 10)));
    } catch (e) { /* localStorage might be full or unavailable */ }
  }, [category.id, tool.slug]);

  const toolUrl = `https://ilovetexts.com${lp(`/${category.id}/${tool.slug}`)}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: tool.name, text: tool.description, url: toolUrl });
      } catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(toolUrl);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(toolUrl);
    setToast({ message: 'Link copied to clipboard!', type: 'success' });
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just used the free ${tool.name} tool on ilovetexts.com — works instantly in the browser! 🚀`)}&url=${encodeURIComponent(toolUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(toolUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareOnReddit = () => {
    window.open(
      `https://reddit.com/submit?url=${encodeURIComponent(toolUrl)}&title=${encodeURIComponent(`Free ${tool.name} — works instantly in browser`)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out this free ${tool.name} tool: ${toolUrl}`)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <>
      {/* Real aggregateRating JSON-LD — only emits when user has actually rated */}
      <RatingSchema tool={tool} category={category} />

      {/* ═══ Colored Hero Banner ═══ */}
      <div className="tool-hero" style={{ '--tool-color': category.color }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href={lp('/')}>{t.nav.home}</Link>
            <span className="separator" aria-hidden="true">/</span>
            <Link href={lp(`/${category.id}`)}>{category.name}</Link>
            <span className="separator" aria-hidden="true">/</span>
            <span>{tool.name}</span>
          </nav>
          <h1>{tool.name}</h1>
          <p className="tool-hero-desc">{tool.description}</p>

          {/* Last Updated — freshness signal for Google */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
            marginTop: '8px', marginBottom: '2px',
          }}>
            <span>🕒</span>
            <span>Last updated: <time dateTime="2026-09-04">September 2026</time></span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>Free &amp; no signup</span>
          </div>

          <div className="tool-hero-badges">
            <span className="tool-hero-badge"><span role="img" aria-label="private">🔒</span> {t.ui.private}</span>
            <span className="tool-hero-badge"><span role="img" aria-label="fast">⚡</span> {t.ui.instantResults}</span>
            <span className="tool-hero-badge"><span role="img" aria-label="free">🆓</span> {t.ui.freeForever}</span>
            <span className="tool-hero-badge"><span role="img" aria-label="mobile">📱</span> {t.trust.devicesTitle}</span>
            <span className="tool-hero-badge"><span role="img" aria-label="keyboard">⌨️</span> {t.trust.shortcutsTitle}</span>
          </div>
        </div>
      </div>

      {/* ═══ Tool Workspace ═══ */}
      <div className="tool-workspace">
        {children}
      </div>

      {/* ═══ Share Tool Bar — Enhanced with Social Buttons ═══ */}
      <div className="tool-share-bar">
        <div className="container">
          <div className="share-bar-inner">
            <span className="share-bar-label">Share:</span>
            <div className="share-buttons">
              <button className="share-btn share-twitter" onClick={shareOnTwitter} aria-label="Share on Twitter" title="Twitter/X">
                𝕏
              </button>
              <button className="share-btn share-linkedin" onClick={shareOnLinkedIn} aria-label="Share on LinkedIn" title="LinkedIn">
                in
              </button>
              <button className="share-btn share-reddit" onClick={shareOnReddit} aria-label="Share on Reddit" title="Reddit">
                ↑
              </button>
              <button className="share-btn share-whatsapp" onClick={shareOnWhatsApp} aria-label="Share on WhatsApp" title="WhatsApp">
                💬
              </button>
              <button className="share-btn share-copy" onClick={handleCopyLink} aria-label="Copy link" title="Copy link">
                🔗
              </button>
              <button className="btn btn-secondary" onClick={handleShare} style={{ gap: '8px', marginLeft: '8px' }}>
                <span role="img" aria-label="share">📤</span>
              </button>
              <EmbedWidget toolUrl={toolUrl} toolName={tool.name} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Keyboard Shortcuts Info ═══ */}
      <div className="keyboard-shortcuts-bar">
        <div className="container">
          <div className="shortcuts-inner">
            <span className="shortcuts-label">⌨️ Shortcuts:</span>
            <span className="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> {t.ui.copyResult}</span>
            <span className="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> {t.ui.clear}</span>
            <span className="shortcut-item"><kbd>Ctrl</kbd>+<kbd>S</kbd> {t.ui.download}</span>
          </div>
        </div>
      </div>

      {/* ═══ Embed CTA Banner ═══ */}
      <EmbedCTA toolUrl={toolUrl} toolName={tool.name} />

      {/* ═══ Content Sections ═══ */}
      <div className="tool-content-sections">

        {/* Section 1: What Is */}
        {whatIs && (
          <section className="what-is-section">
            <h2>What is the {tool.name}?</h2>
            <p>{whatIs}</p>
          </section>
        )}

        {/* Section 2: How-To Steps */}
        {howToSteps && howToSteps.length > 0 && (
          <section className="howto-section">
            <h2>How to Use the {tool.name}</h2>
            <div className="howto-steps">
              {howToSteps.map((step, idx) => (
                <div key={idx} className="howto-step">
                  <div className="howto-step-number" style={{ background: category.color }}>{idx + 1}</div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Why Choose Us */}
        {whyChoose && whyChoose.length > 0 && (
          <section className="why-section">
            <h2>Why Choose Our {tool.name}?</h2>
            <div className="why-grid">
              {whyChoose.map((item, idx) => (
                <div key={idx} className="why-card">
                  <div className="why-card-icon" role="img" aria-label={item.title}>{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Use Cases */}
        {useCases && useCases.length > 0 && (
          <section className="usecases-section">
            <h2>Common Use Cases for {tool.name}</h2>
            <div className="usecases-list">
              {useCases.map((uc, idx) => (
                <div key={idx} className="usecase-item">
                  {uc}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: FAQ */}
        {faqs && faqs.length > 0 && (
          <section className="faq-section">
            <h2>Frequently Asked Questions — {tool.name}</h2>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        )}

        {/* Related Searches — Link to specific tool pages for proper internal linking */}
        {relatedSearches && relatedSearches.length > 0 && (
          <section className="related-searches-section">
            <h2>Related Searches</h2>
            <div className="related-searches-tags">
              {relatedSearches.map((term, idx) => (
                <span key={idx} className="related-search-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-white)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  🔍 {term}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Trust & Privacy Section — Boosts E-E-A-T signals */}
        <section className="trust-section">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🔒</div>
              <h3>{t.trust.privateTitle}</h3>
              <p>{t.trust.privateDesc}</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h3>{t.trust.instantTitle}</h3>
              <p>{t.trust.instantDesc}</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🆓</div>
              <h3>{t.trust.freeTitle}</h3>
              <p>{t.trust.freeDesc}</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📱</div>
              <h3>{t.trust.devicesTitle}</h3>
              <p>{t.trust.devicesDesc}</p>
            </div>
          </div>
        </section>

        {/* ═══ Real Rating Widget ═══ */}
        <section style={{ maxWidth: 320, margin: '0 auto' }}>
          <RatingWidget
            toolSlug={tool.slug}
            toolName={tool.name}
            lang={lang}
          />
        </section>



        {/* Related Tools (Same Category) — Show ALL siblings */}
        {relatedTools && relatedTools.length > 0 && (
          <section className="related-tools">
            <h2>More {category.name} {t.ui.tools}</h2>
            <div className="related-tools-grid">
              {relatedTools.map((rt, idx) => (
                <Link key={`${rt.categoryId || category.id}-${rt.slug}-${idx}`} href={lp(`/${rt.categoryId || category.id}/${rt.slug}`)} prefetch={false} className="related-tool-card">
                  <div className="related-tool-icon" role="img" aria-label={rt.name}>{rt.icon}</div>
                  <div className="related-tool-info">
                    <h4>{rt.name}</h4>
                    <p>{rt.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross Links (Other Categories) */}
        {crossLinks && crossLinks.length > 0 && (
          <section className="related-tools">
            <h2>More {t.ui.tools}</h2>
            <div className="related-tools-grid">
              {crossLinks.map((cl, idx) => (
                <Link key={`${cl.categoryId}-${cl.slug}-${idx}`} href={lp(`/${cl.categoryId}/${cl.slug}`)} prefetch={false} className="related-tool-card">
                  <div className="related-tool-icon" role="img" aria-label={cl.name}>{cl.icon}</div>
                  <div className="related-tool-info">
                    <h4>{cl.name}</h4>
                    <p>{cl.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Explore All Categories — Power internal linking */}
        {allCategories && allCategories.length > 0 && (
          <section className="explore-categories-section">
            <h2>{t.home.allCategoriesTitle}</h2>
            <div className="explore-categories-grid">
              {allCategories.map(cat => (
                <Link key={cat.id} href={lp(`/${cat.id}`)} prefetch={false} className="explore-category-card">
                  <span className="explore-cat-icon" role="img" aria-label={cat.name}>{cat.icon}</span>
                  <div>
                    <h4>{cat.name}</h4>
                    <p>{cat.tools.length} {t.ui.tools}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {question}
        <span className="chevron" aria-hidden="true">▼</span>
      </button>
      <div className="faq-answer">
        <div className="faq-answer-content">{answer}</div>
      </div>
    </div>
  );
}
