import { CATEGORIES, getCategory } from '@/lib/tools-config';
import { generateCategoryMeta, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return []; // Dynamic rendering at edge to prevent ENOSPC on Cloudflare
}


export async function generateMetadata({ params }) {
  const { lang, category: categoryId } = await params;
  const category = getCategory(categoryId, lang);
  if (!category) return {};
  const t = (await import('@/lib/i18n')).getTranslations(lang);
  return generateCategoryMeta(category, t, lang);
}

import { getTranslations } from '@/lib/i18n';

export default async function CategoryPage({ params }) {
  const { lang, category: categoryId } = await params;
  const category = getCategory(categoryId, lang);
  const t = getTranslations(lang);
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  
  if (!category) {
    notFound();
  }

  const catSEO = category.content || {};
  const otherCategories = CATEGORIES.filter(c => c.id !== category.id);

  // Schema markup
  const itemListSchema = generateItemListSchema(category);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.nav.home, url: buildCanonical(lang, '/') },
    { name: category.name, url: buildCanonical(lang, `/${category.id}`) },
  ]);

  // FAQ schema for category — boosts featured snippets
  const faqItems = [
    {
      question: `Are all ${category.name} tools free?`,
      answer: `Yes. Every tool in the ${category.name} collection is 100% free with no signup, no limits, and no premium tier. All processing happens in your browser.`,
    },
    {
      question: `Do ${category.name} tools work without uploading files?`,
      answer: `Yes. All ${category.name} tools process your text or files entirely in your browser using JavaScript. Nothing is uploaded to any server.`,
    },
    {
      question: `How many ${category.name} tools are available?`,
      answer: `There are ${category.tools.length} tools in the ${category.name} category: ${category.tools.slice(0, 5).map(t => t.name).join(', ')}${category.tools.length > 5 ? ` and ${category.tools.length - 5} more` : ''}.`,
    },
    {
      question: `Do I need to create an account to use ${category.name} tools?`,
      answer: `No. All tools on ilovetexts.com work instantly without any registration, login, or email address. Open the tool and start using it immediately.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="hub-page">
      <script id="schema-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script id="schema-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Banner */}
      <div className="hub-hero" style={{ '--tool-color': category.color }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href={lp('/')}>{t.nav.home}</Link>
            <span className="separator" aria-hidden="true">/</span>
            <span>{category.name}</span>
          </nav>
          
          <div className="hub-header">
            <div className="category-card-icon" role="img" aria-label={category.name}>
              {category.icon}
            </div>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="tools-grid animate-in">
        {category.tools.map((tool) => (
          <Link key={tool.slug} href={lp(`/${category.id}/${tool.slug}`)} className="tool-card">
            <div className="tool-card-icon" role="img" aria-label={tool.name}>{tool.icon}</div>
            <div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Unique SEO Content for Category */}
      <div className="seo-block container" style={{ marginTop: 'var(--space-12)' }}>
        <div className="seo-block-inner">
          <h2>About {category.name} {t.ui.tools}</h2>
          <p>{catSEO.longDesc || `Our ${category.name.toLowerCase()} collection includes ${category.tools.length} powerful free online tools designed for speed, accuracy, and privacy.`}</p>
          
          {catSEO.useCases && (
            <>
              <h3 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>What You Can Do</h3>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
                {catSEO.useCases.map((uc, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary)' }}>{uc}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Related Categories */}
      <div className="explore-categories-section" style={{ margin: 'var(--space-12) auto', maxWidth: 'var(--max-width)', padding: 'var(--space-12) var(--space-6)' }}>
        <h2>{t.home.allCategoriesTitle}</h2>
        <div className="explore-categories-grid">
          {otherCategories.map(c => {
            const cat = getCategory(c.id, lang);
            return (
              <Link key={cat.id} href={lp(`/${cat.id}`)} className="explore-category-card">
                <span className="explore-cat-icon" role="img" aria-label={cat.name}>{cat.icon}</span>
                <div>
                  <h4>{cat.name}</h4>
                  <p>{cat.tools.length} {t.ui.tools}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQ Section — Visible + Schema */}
      <div className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
          Frequently Asked Questions — {category.name}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqItems.map((faq, i) => (
            <details key={i} style={{
              background: 'var(--bg-section)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)', padding: '0',
              overflow: 'hidden',
            }}>
              <summary style={{
                padding: '14px 18px', fontWeight: 600, fontSize: '0.92rem',
                cursor: 'pointer', listStyle: 'none', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                color: 'var(--text-primary)',
              }}>
                {faq.question}
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginLeft: 12, opacity: 0.5 }}>+</span>
              </summary>
              <div style={{ padding: '0 18px 14px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
