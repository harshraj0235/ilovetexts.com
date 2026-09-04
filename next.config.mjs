/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Empty turbopack config silences the webpack/turbopack warning.
  // pdfjs-dist and tesseract.js are only ever imported inside
  // 'use client' components with dynamic() — they never hit the server bundle.
  turbopack: {},

  // Generate trailing slash consistent URLs
  trailingSlash: false,

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
        // X-Frame-Options to prevent clickjacking (skipped for embed routes so they can be iframed)
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Tell Google NOT to index API routes
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
        // Cache static assets aggressively (images, fonts, icons)
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|woff|woff2|ico|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // HTML pages — short cache, always revalidate
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
