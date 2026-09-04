/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Empty turbopack config silences the webpack/turbopack warning.
  turbopack: {},

  // Generate trailing slash consistent URLs
  trailingSlash: false,

  // ── Image optimization ───────────────────────────────
  // Auto-serve WebP/AVIF — major LCP improvement on mobile
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      {
        // Security headers for all pages
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        // Aggressive cache for images/fonts — 1 year immutable
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|woff|woff2|ico|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // HTML pages — short cache + stale-while-revalidate
        source: '/((?!_next|api|static).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap_index.xml',
        permanent: true,
      },
      // Redirect old category URL structure to new category structure
      {
        source: '/word-counter/:slug*',
        destination: '/word-counting-tools/:slug*',
        permanent: true,
      },
      // Handle localized old category URLs
      {
        source: '/:lang/word-counter/:slug*',
        destination: '/:lang/word-counting-tools/:slug*',
        permanent: true,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap/:lang.xml',
        destination: '/sitemap-api/:lang',
      },
    ];
  },
};

export default nextConfig;
