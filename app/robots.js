import { SITE } from '@/lib/tools-config';

export default function robots() {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: [
          '/api/',
          '/private/',
          '/embed/',          // Embed pages are UI-only, not indexable content
          '/_next/image',
          '/*?*',             // Block ALL query-string URLs — saves crawl budget,
                              // prevents ?ref=, ?utm_*, ?fbclid= from being crawled
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/embed/', '/_next/image', '/*?*'],
      },
      // AI search crawlers — allow content, block embed widgets and API
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/_next/image', '/embed/', '/*?*'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/_next/image', '/embed/', '/*?*'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/embed/', '/*?*'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/embed/', '/*?*'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/', '/embed/', '/*?*'],
      },
      {
        // All other bots — same restrictions
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/private/', '/embed/', '/_next/image', '/*?*'],
      },
    ],
    sitemap: [
      // Only reference the sitemap index — it already lists all per-language sitemaps.
      `${SITE.url}/sitemap_index.xml`,
    ],
    host: SITE.url,
  };
}
