'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
}) {
  const [toast, setToast] = useState(null);

  const handleShare = async () => {
    const url = `https://ilovetexts.com/${category.id}/${tool.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: tool.name, text: tool.description, url });
      } catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
    }
  };

  return (
    <>
      {/* ═══ Colored Hero Banner ═══ */}
      <div className="tool-hero" style={{ '--tool-color': category.color }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator" aria-hidden="true">/</span>
            <Link href={`/${category.id}`}>{category.name}</Link>
            <span className="separator" aria-hidden="true">/</span>
            <span>{tool.name}</span>
          </nav>
          <h1>{tool.name}</h1>
          <p className="tool-hero-desc">{tool.description} — free, instant, and 100% private.</p>
          
          <div className="tool-hero-badges">
            <span className="tool-hero-badge">🔒 100% Private</span>
            <span className="tool-hero-badge">⚡ Instant Results</span>
            <span className="tool-hero-badge">🆓 Free Forever</span>
            <span className="tool-hero-badge">📱 All Devices</span>
          </div>
        </div>
      </div>

      {/* ═══ Tool Workspace ═══ */}
      <div className="tool-workspace">
        {children}
      </div>

      {/* ═══ Share Tool Bar ═══ */}
      <div className="tool-share-bar">
        <div className="container" style={{ textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={handleShare} style={{ gap: '8px' }}>
            📤 Share This Tool
          </button>
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
                  <div className="why-card-icon">{item.icon}</div>
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

        {/* NEW: Related Searches — SEO internal links */}
        {relatedSearches && relatedSearches.length > 0 && (
          <section className="related-searches-section">
            <h2>Related Searches</h2>
            <div className="related-searches-tags">
              {relatedSearches.map((term, idx) => (
                <Link key={idx} href={`/${category.id}`} className="related-search-tag">
                  {term}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Tools (Same Category) — Show ALL siblings */}
        {relatedTools && relatedTools.length > 0 && (
          <section className="related-tools">
            <h2>More {category.name} Tools</h2>
            <div className="related-tools-grid">
              {relatedTools.map(t => (
                <Link key={t.slug} href={`/${t.categoryId}/${t.slug}`} className="related-tool-card">
                  <div className="related-tool-icon">{t.icon}</div>
                  <div className="related-tool-info">
                    <h4>{t.name}</h4>
                    <p>{t.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross Links (Other Categories) */}
        {crossLinks && crossLinks.length > 0 && (
          <section className="related-tools">
            <h2>You Might Also Need</h2>
            <div className="related-tools-grid">
              {crossLinks.map(t => (
                <Link key={`${t.categoryId}-${t.slug}`} href={`/${t.categoryId}/${t.slug}`} className="related-tool-card">
                  <div className="related-tool-icon">{t.icon}</div>
                  <div className="related-tool-info">
                    <h4>{t.name}</h4>
                    <p>{t.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* NEW: Explore All Categories — Power internal linking */}
        {allCategories && allCategories.length > 0 && (
          <section className="explore-categories-section">
            <h2>Explore All Text Tool Categories</h2>
            <div className="explore-categories-grid">
              {allCategories.map(cat => (
                <Link key={cat.id} href={`/${cat.id}`} className="explore-category-card">
                  <span className="explore-cat-icon">{cat.icon}</span>
                  <div>
                    <h4>{cat.name}</h4>
                    <p>{cat.tools.length} free tools</p>
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
