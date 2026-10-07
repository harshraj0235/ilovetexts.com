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
              "img-src 'self' data: blob: https://tile.openstreetmap.org https://api.producthunt.com https://www.google-analytics.com https://www.googletagmanager.com",
              "media-src 'self' blob:",
              "connect-src 'self' blob: https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://translate.googleapis.com https://texttospeech.googleapis.com https://api.datamuse.com https://inputtools.google.com https://unpkg.com",
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

      // ── /workflow → /workflows (singular to plural fix) ────────────────────
      {
        source: '/workflow',
        destination: '/workflows',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/workflow',
        destination: '/:lang/workflows',
        permanent: true,
      },
      {
        source: '/workflow/:slug*',
        destination: '/workflows/:slug*',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/workflow/:slug*',
        destination: '/:lang/workflows/:slug*',
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

      // ── Removed/moved tools — prevent 404s in GSC ─────────────────────────
      // gov-doc-translator was removed — redirect to homepage
      {
        source: '/gov-doc-translator',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/gov-doc-translator',
        destination: '/:lang',
        permanent: true,
      },
      // writing-grammar-tools/word-counter is an old slug — redirect to correct category
      {
        source: '/writing-grammar-tools/word-counter',
        destination: '/word-counting-tools/word-counter',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/writing-grammar-tools/word-counter',
        destination: '/:lang/word-counting-tools/word-counter',
        permanent: true,
      },
      // text-converter/pdf-to-text → pdf-text-tools category
      {
        source: '/text-converter/pdf-to-text',
        destination: '/pdf-text-tools/pdf-to-text',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/text-converter/pdf-to-text',
        destination: '/:lang/pdf-text-tools/pdf-to-text',
        permanent: true,
      },
      // image-tools/pdf-to-jpg → pdf-text-tools
      {
        source: '/image-tools/pdf-to-jpg',
        destination: '/pdf-text-tools/pdf-to-text',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/image-tools/pdf-to-jpg',
        destination: '/:lang/pdf-text-tools/pdf-to-text',
        permanent: true,
      },

      // ── /ai-tools/ category never existed — blog had wrong links ────────
      // ai-text-humanizer lives in productivity-tools
      {
        source: '/ai-tools/ai-text-humanizer',
        destination: '/productivity-tools/ai-text-humanizer',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/ai-tools/ai-text-humanizer',
        destination: '/:lang/productivity-tools/ai-text-humanizer',
        permanent: true,
      },
      // prompt-minifier lives in text-converter
      {
        source: '/ai-tools/prompt-minifier',
        destination: '/text-converter/prompt-minifier',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/ai-tools/prompt-minifier',
        destination: '/:lang/text-converter/prompt-minifier',
        permanent: true,
      },
      // Generic catch-all for any /ai-tools/ path → homepage
      {
        source: '/ai-tools/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:lang(hi|pt|es|de|id)/ai-tools/:slug*',
        destination: '/:lang',
        permanent: true,
      },

      // ── Phantom / stale blog slugs — Google crawled these from old ──────
      // sitemaps or hreflang tags. Redirect to the correct current slug.
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/how-to-convert-text-to-uppercase-online',
        destination: '/:lang/blog/convert-text-case-uppercase-lowercase-title-case',
        permanent: true,
      },
      {
        source: '/blog/how-to-convert-text-to-uppercase-online',
        destination: '/blog/convert-text-case-uppercase-lowercase-title-case',
        permanent: true,
      },
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/text-to-speech-online-guide',
        destination: '/:lang/blog/text-to-speech-online-free-guide',
        permanent: true,
      },
      {
        source: '/blog/text-to-speech-online-guide',
        destination: '/blog/text-to-speech-online-free-guide',
        permanent: true,
      },
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/base64-encode-decode-guide',
        destination: '/:lang/blog/base64-encoding-decoding-explained',
        permanent: true,
      },
      {
        source: '/blog/base64-encode-decode-guide',
        destination: '/blog/base64-encoding-decoding-explained',
        permanent: true,
      },
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/json-formatter-online-guide',
        destination: '/:lang/blog/format-json-online-beautify-validate-minify',
        permanent: true,
      },
      {
        source: '/blog/json-formatter-online-guide',
        destination: '/blog/format-json-online-beautify-validate-minify',
        permanent: true,
      },
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/free-password-generator-guide',
        destination: '/:lang/blog/generate-strong-password-guide',
        permanent: true,
      },
      {
        source: '/blog/free-password-generator-guide',
        destination: '/blog/generate-strong-password-guide',
        permanent: true,
      },
      {
        source: '/:lang(en|hi|pt|es|de|id)/blog/instagram-caption-spacer-guide',
        destination: '/:lang/blog/instagram-caption-formatting-tips',
        permanent: true,
      },
      {
        source: '/blog/instagram-caption-spacer-guide',
        destination: '/blog/instagram-caption-formatting-tips',
        permanent: true,
      },

      // ── Cross-language blog 404s from GSC ───────────────────────────────
      // Google crawled these invalid language combinations. Redirect them to their true canonicals.
      {
        source: '/es/blog/comprimir-pdf-gratis-online-pt',
        destination: '/pt/blog/comprimir-pdf-gratis-online-pt',
        permanent: true,
      },
      {
        source: '/hi/blog/comprimir-pdf-gratis-online',
        destination: '/es/blog/comprimir-pdf-gratis-online',
        permanent: true,
      },
      {
        source: '/de/blog/csv-to-json-converter-guide',
        destination: '/blog/csv-to-json-converter-guide',
        permanent: true,
      },
      {
        source: '/de/blog/mejor-alternativa-grammarly-gratis',
        destination: '/es/blog/mejor-alternativa-grammarly-gratis',
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
