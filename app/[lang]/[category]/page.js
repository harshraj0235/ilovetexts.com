import { CATEGORIES, getCategory } from '@/lib/tools-config';
import { generateCategoryMeta, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const params = [];
  // Only statically generate the 'en' language to prevent Cloudflare Pages ENOSPC error.
  for (const category of CATEGORIES) {
    params.push({ lang: 'en', category: category.id });
  }
  return params;
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

  return (
    <div className="hub-page">
      <script id="schema-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script id="schema-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
    </div>
  );
}
