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
          '/_next/image',   // Block image optimization API only (CSS/JS must be accessible)
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/embed/', '/_next/image'],
      },
      // Allow AI search crawlers — critical for GEO (Generative Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/_next/image'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/_next/image'],
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
        disallow: ['/api/', '/private/', '/_next/image'],
      },
    ],
    sitemap: [
      // Only reference the sitemap index — it already lists all per-language sitemaps.
      // Listing individual sitemaps here too causes Google to process them twice.
      `${SITE.url}/sitemap_index.xml`,
    ],
    host: SITE.url,
  };
}
