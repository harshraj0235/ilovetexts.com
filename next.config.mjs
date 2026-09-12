/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Turbopack config
  turbopack: {},

  trailingSlash: false,

  // ── Image optimization — serves WebP/AVIF automatically ──
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Package import optimization — tree-shake large libs ──
  // Prevents entire library loading when only one function is used
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },

  // ── Webpack optimizations ────────────────────────────
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large vendor chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...(config.optimization.splitChunks?.cacheGroups || {}),
          // Keep pdfjs in its own chunk — only loaded on PDF tool pages
          pdfjs: {
            test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
            name: 'pdfjs',
            chunks: 'async',
            priority: 30,
          },
          // Keep tesseract in its own chunk — only loaded on OCR tool pages
          tesseract: {
            test: /[\\/]node_modules[\\/]tesseract\.js[\\/]/,
            name: 'tesseract',
            chunks: 'async',
            priority: 30,
          },
          // Keep xlsx in its own chunk
          xlsx: {
            test: /[\\/]node_modules[\\/]xlsx[\\/]/,
            name: 'xlsx',
            chunks: 'async',
            priority: 30,
          },
          // Keep pdf-lib in its own chunk
          pdflib: {
            test: /[\\/]node_modules[\\/]pdf-lib[\\/]/,
            name: 'pdf-lib',
            chunks: 'async',
            priority: 30,
          },
          // Keep @ffmpeg/ffmpeg in its own chunk — only loaded on video tool pages
          ffmpeg: {
            test: /[\\/]node_modules[\\/]@ffmpeg[\\/]/,
            name: 'ffmpeg',
            chunks: 'async',
            priority: 30,
          },
        },
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        // Security headers for all pages
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // COOP + COEP: required for SharedArrayBuffer which FFmpeg.wasm needs
          // for multi-threaded video processing. Applied to all pages — harmless
          // for non-video pages, critical for video converter tools.
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'credentialless' },
          // CSP: allow same-origin scripts + Google Analytics + GTM only.
          // unsafe-inline is required for Next.js inline scripts (theme FOUC fix, JSON-LD).
          // Note: frame-ancestors is set separately per route below.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://api.producthunt.com https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://api.producthunt.com https://www.google-analytics.com https://www.googletagmanager.com",
              "media-src 'self' blob:",
              "connect-src 'self' blob: https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://translate.googleapis.com https://texttospeech.googleapis.com https://unpkg.com",
              "worker-src 'self' blob:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        // Non-embed pages: block framing (prevents clickjacking)
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Embed pages: allow cross-origin framing so third-party sites can embed tools
        source: '/embed/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          // Override CSP frame-ancestors to allow all origins for embeds
          { key: 'Content-Security-Policy', value: "frame-ancestors *; upgrade-insecure-requests" },
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
        // PDF.js worker — cache aggressively, serve as JS module
        source: '/pdf.worker.min.mjs',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
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

      // ── favicon.ico mis-crawled paths ──────────────────────────────────────
      // Malformed crawler URLs like /favicon.ico/category/tool — strip the
      // leading /favicon.ico segment and redirect to the real page.
      {
        source: '/favicon.ico/:rest*',
        destination: '/:rest*',
        permanent: true,
      },

      // ── word-counter → word-counting-tools (category rename) ──────────────
      {
        source: '/word-counter/:slug*',
        destination: '/word-counting-tools/:slug*',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/word-counter/:slug*',
        destination: '/:lang/word-counting-tools/:slug*',
        permanent: true,
      },

      // ── Self-referencing slug typo ─────────────────────────────────────────
      {
        source: '/word-counting-tools/word-counting-tools',
        destination: '/word-counting-tools/word-counter',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/word-counting-tools/word-counting-tools',
        destination: '/:lang/word-counting-tools/word-counter',
        permanent: true,
      },

      // ── Old /word-counter/ category pages (no tool slug) ──────────────────
      // Google has indexed /word-counter, /de/word-counter etc from old sitemaps.
      // The :slug* above covers /word-counter/anything; these cover bare /word-counter.
      {
        source: '/word-counter',
        destination: '/word-counting-tools',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/word-counter',
        destination: '/:lang/word-counting-tools',
        permanent: true,
      },

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
