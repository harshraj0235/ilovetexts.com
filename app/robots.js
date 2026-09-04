import { SITE } from '@/lib/tools-config';
import { LANG_CODES } from '@/lib/i18n';

export default function robots() {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        // Block pages that waste crawl budget — not real content
        disallow: ['/api/', '/private/', '/embed/', '/_next/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/embed/', '/_next/'],
      },
      // Allow AI search crawlers — critical for GEO (Generative Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        // All other bots — allow everything except API and private routes
        userAgent: '*',
        allow: ['/', '/_next/static/', '/sitemap-api/'],
        disallow: ['/api/', '/private/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap_index.xml`,
    host: SITE.url,
  };
}
