// ═══════════════════════════════════════════════════════
// SEO Helper — Meta tags, Schema markup, OG generation
// Upgraded: Unique meta per tool, removed fake ratings,
// added ItemList, WebSite, Organization schemas
// Enhanced: speakable, UseAction, sameAs, dateModified
// ═══════════════════════════════════════════════════════

import { SITE } from './tools-config';
import { getToolSEO } from './tools-seo-data';
import { buildCanonical, LANG_CODES } from './i18n';

// Use a fixed build date to prevent hydration mismatches and schema spam
const BUILD_DATE = '2026-08-29';

function getLocale(lang) {
  const map = { en: 'en_US', hi: 'hi_IN', pt: 'pt_BR', es: 'es_ES', de: 'de_DE', id: 'id_ID' };
  return map[lang] || 'en_US';
}

export function generateAlternates(lang, path) {
  const cleanPath = path === '/' ? '' : path;
  const canonical = buildCanonical(lang, path);
  const languages = { 'x-default': `${SITE.url}${cleanPath}` };
  LANG_CODES.forEach(code => {
    languages[code] = buildCanonical(code, path);
  });
  return { canonical, languages };
}

export function generateToolMeta(tool, category, lang = 'en') {
  const seoData = getToolSEO(tool.slug);

  // Use unique hand-crafted meta if available, otherwise generate
  const cleanCategoryName = category.name.replace(/\bTools?\b/i, '').trim();
  const title = tool.content?.metaTitle 
    || seoData?.metaTitle
    || `${tool.name} — Fast, Free & Secure Online Tool`;
  
  const description = tool.content?.metaDescription
    || seoData?.metaDescription
    || `${tool.description} online for free with our ${tool.name}. Instant results, 100% private — your text never leaves your browser. No signup required. Try the best free ${tool.name.toLowerCase()} tool now.`;

  const keywordsArr = tool.content?.keywords || seoData?.keywords || [tool.keywords];
  const keywordsStr = Array.isArray(keywordsArr)
    ? keywordsArr.join(', ')
    : `${tool.keywords}, ${tool.name.toLowerCase()}, free ${tool.name.toLowerCase()} online, online text tool, browser-based ${tool.name.toLowerCase()}, private, fast, instant`;

  const path = `/${category.id}/${tool.slug}`;

  return {
    title,
    description,
    keywords: keywordsStr,
    openGraph: {
      title,
      description,
      url: buildCanonical(lang, path),
      siteName: SITE.name,
      type: 'website',
      locale: getLocale(lang),
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: generateAlternates(lang, path),
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
  };
}

export function generateCategoryMeta(category, t = null, lang = 'en') {
  const freeToolsText = t?.home?.heroBadge ? t.home.heroBadge.replace('{count}+ ', '').trim() : 'Free Online Tools';
  const toolsText = t?.ui?.tools ? t.ui.tools.toLowerCase() : 'tools';

  const title = `${category.name} — ${category.tools.length} ${freeToolsText}`;
  const description = `${category.description} ${category.tools.length} ${category.name.toLowerCase()} ${toolsText}. ${t?.trust?.instantTitle || 'Instant results'}, ${t?.trust?.privateTitle || '100% private'}, ${t?.ui?.noSignup || 'no signup required'}. ${category.tools.slice(0, 5).map(t => t.name).join(', ')}.`;

  const path = `/${category.id}`;

  return {
    title,
    description,
    keywords: `${category.name.toLowerCase()}, free ${category.name.toLowerCase()} tools, online text tools, ${category.tools.slice(0, 5).map(t => t.name.toLowerCase()).join(', ')}`,
    openGraph: {
      title,
      description,
      url: buildCanonical(lang, path),
      siteName: SITE.name,
      type: 'website',
      locale: getLocale(lang),
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: generateAlternates(lang, path),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
    },
  };
}

export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateToolSchema(tool, category, t) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.name} — ${SITE.name}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: t.schema.operatingSystem,
    browserRequirements: t.schema.browserRequirements,
    url: `${SITE.url}/${category.id}/${tool.slug}`,
    description: tool.description,
    datePublished: '2025-01-15',
    dateModified: BUILD_DATE,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      t.schema.feature1,
      t.schema.feature2,
      t.schema.feature3,
      t.schema.feature4,
      t.schema.feature5,
      t.schema.feature6,
    ],
    // Removed fake aggregateRating — Google penalizes fabricated reviews
    author: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    potentialAction: {
      '@type': 'UseAction',
      target: `${SITE.url}/${category.id}/${tool.slug}`,
      name: t.schema.useAction.replace('{toolName}', tool.name),
    },
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateHowToSchema(tool, steps, t) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t.schema.howToName.replace('{toolName}', tool.name),
    description: t.schema.howToDesc.replace('{toolName}', tool.name).replace('{domain}', SITE.domain),
    totalTime: 'PT1M',
    tool: {
      '@type': 'HowToTool',
      name: t.schema.howToTool,
    },
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.description,
    })),
  };
}

// ItemList schema for category pages — boosts rich snippets
export function generateItemListSchema(category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} Tools`,
    description: category.description,
    numberOfItems: category.tools.length,
    itemListElement: category.tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `${SITE.url}/${category.id}/${tool.slug}`,
      description: tool.description,
    })),
  };
}

// WebSite schema — enables sitelinks searchbox in Google
export function generateWebSiteSchema(t, lang = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: t?.siteDescription || SITE.description,
    inLanguage: getLocale(lang).replace('_', '-'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/#all-tools?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    // Speakable helps voice assistants cite your content
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.hero h1', '.hero p', '.section-header h2'],
    },
  };
}

// Organization schema — establishes brand entity
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/favicon.ico`,
    description: SITE.description,
    foundingDate: '2024',
    // sameAs helps Google connect your brand across platforms (Knowledge Graph)
    sameAs: [
      // Add your social media URLs here when available:
      // 'https://twitter.com/ilovetexts',
      // 'https://www.linkedin.com/company/ilovetexts',
      'https://github.com/harshraj0235/ilovetexts.com',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE.url}/contact`,
      availableLanguage: 'English',
    },
  };
}

// SoftwareApplication schema removed — was conflicting with WebApplication schema
// Having both on the same page caused Google to ignore structured data
