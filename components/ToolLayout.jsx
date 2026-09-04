'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTranslations } from '@/lib/i18n';
import EmbedWidget from './EmbedWidget';

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
