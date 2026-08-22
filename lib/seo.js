// ═══════════════════════════════════════════════════════
// SEO Helper — Meta tags, Schema markup, OG generation
// Upgraded: Unique meta per tool, removed fake ratings,
// added ItemList, WebSite, Organization schemas
// ═══════════════════════════════════════════════════════

import { SITE } from './tools-config';
import { getToolSEO } from './tools-seo-data';

export function generateToolMeta(tool, category) {
  const seoData = getToolSEO(tool.slug);

  // Use unique hand-crafted meta if available, otherwise generate
  const title = seoData?.metaTitle
    || `${tool.name} — Free Online ${category.name} Tool | ${SITE.name}`;
  
  const description = seoData?.metaDescription
    || `${tool.description} online for free with our ${tool.name}. Instant results, 100% private — your text never leaves your browser. No signup required. Try the best free ${tool.name.toLowerCase()} tool now.`;

  const keywordsArr = seoData?.keywords || [tool.keywords];
  const keywordsStr = Array.isArray(keywordsArr)
    ? keywordsArr.join(', ')
    : `${tool.keywords}, ${tool.name.toLowerCase()}, free ${tool.name.toLowerCase()} online, online text tool, free, no signup, browser-based, private, instant`;

  return {
    title,
    description,
    keywords: keywordsStr,
    openGraph: {
      title,
      description,
      url: `${SITE.url}/${category.id}/${tool.slug}`,
      siteName: SITE.name,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE.url}/${category.id}/${tool.slug}`,
    },
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

export function generateCategoryMeta(category) {
  const title = `${category.name} — ${category.tools.length} Free Online Tools | ${SITE.name}`;
  const description = `${category.description} Browse all ${category.tools.length} free ${category.name.toLowerCase()} tools. Instant results, 100% private, no signup required. ${category.tools.slice(0, 5).map(t => t.name).join(', ')} and more.`;

  return {
    title,
    description,
    keywords: `${category.name.toLowerCase()}, free ${category.name.toLowerCase()} tools, online text tools, ${category.tools.slice(0, 5).map(t => t.name.toLowerCase()).join(', ')}`,
    openGraph: {
      title,
      description,
      url: `${SITE.url}/${category.id}`,
      siteName: SITE.name,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE.url}/${category.id}`,
    },
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

export function generateToolSchema(tool, category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.name} — ${SITE.name}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    url: `${SITE.url}/${category.id}/${tool.slug}`,
    description: tool.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    // Removed fake aggregateRating — Google penalizes fabricated reviews
    author: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
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

export function generateHowToSchema(tool, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Use the ${tool.name}`,
    description: `Step-by-step guide to use the free online ${tool.name.toLowerCase()} tool on ${SITE.domain}.`,
    totalTime: 'PT1M',
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.description,
    })),
  };
}

// NEW: ItemList schema for category pages — boosts rich snippets
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

// NEW: WebSite schema — enables sitelinks searchbox in Google
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/#all-tools?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// NEW: Organization schema — establishes brand entity
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/favicon.ico`,
    description: SITE.description,
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE.url}/contact`,
    },
  };
}

// NEW: SoftwareApplication schema — alternative rich result type
export function generateSoftwareAppSchema(tool, category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    url: `${SITE.url}/${category.id}/${tool.slug}`,
    description: tool.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}
