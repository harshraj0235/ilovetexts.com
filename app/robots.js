import { SITE } from '@/lib/tools-config';

export default function robots() {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        // Block pages that waste crawl budget — not real content
        disallow: [
          '/api/',
          '/private/',
          '/embed/',
          '/*?*',           // Block query string URLs — prevents duplicate crawling
          '/_next/',        // Block Next.js internals
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/embed/', '/*?*', '/_next/'],
      },
      // Allow AI search crawlers — critical for GEO (Generative Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        // All other bots — allow everything except API and private routes
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/_next/'],
      },
    ],
    sitemap: [
      `${SITE.url}/sitemap_index.xml`,
      `${SITE.url}/sitemap/en.xml`,
      `${SITE.url}/sitemap/hi.xml`,
      `${SITE.url}/sitemap/es.xml`,
      `${SITE.url}/sitemap/pt.xml`,
      `${SITE.url}/sitemap/de.xml`,
      `${SITE.url}/sitemap/id.xml`,
    ],
    host: SITE.url,
  };
}
