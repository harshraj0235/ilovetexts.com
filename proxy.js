import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════
// PROXY — URL Rewriting for Internationalization
//
// How it works:
//   /word-counting-tools/word-counter     → rewrite to /en/word-counting-tools/word-counter (invisible)
//   /hi/word-counting-tools/word-counter  → pass through (already correct)
//   /en/word-counting-tools/word-counter  → 301 redirect to /word-counting-tools/word-counter (no /en/ in URL)
//
// This ensures:
//   ✅ All existing English URLs keep working (no broken links)
//   ✅ New language URLs work natively
//   ✅ No routing conflict between [lang] and [category]
//   ✅ Googlebot sees clean URLs
//   ✅ Tracking/referral query params stripped before Google indexes them
// ═══════════════════════════════════════════════════════

const LANG_CODES = new Set(['hi', 'pt', 'es', 'de', 'id']);

// Query parameters that are pure tracking noise and should never appear
// in Google's index. We 301-redirect to the clean URL so they are never
// crawled as separate pages, which prevents "Alternate page with proper
// canonical tag" entries in Google Search Console.
const TRACKING_PARAMS = new Set([
  'ref', 'source', 'medium', 'campaign',         // generic referral
  'utm_source', 'utm_medium', 'utm_campaign',     // UTM
  'utm_term', 'utm_content', 'utm_id',
  'fbclid', 'gclid', 'msclkid', 'ttclid',        // ad click IDs
  'mc_cid', 'mc_eid',                             // Mailchimp
  '_ga', '_gl',                                   // Google Analytics linker
]);

// Paths that should NEVER be rewritten
const SKIP_PREFIXES = ['_next', 'api', 'sitemap', 'embed'];
const SKIP_FILES = new Set([
  'favicon.ico', 'icon.svg', 'og-image.png', 'manifest.json',
  'sw.js', 'robots.txt', 'sitemap.xml',
]);

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  // Enforce HTTPS (redirect http → https) — skip on localhost for dev
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  if (proto === 'http' && !isLocalhost) {
    return NextResponse.redirect(`https://${host}${pathname}${request.nextUrl.search}`, 301);
  }

  // Enforce Domain Canonicalization (www -> non-www)
  if (host.startsWith('www.')) {
    const canonicalHost = host.replace(/^www\./, '');
    return NextResponse.redirect(`https://${canonicalHost}${pathname}${request.nextUrl.search}`, 301);
  }

  // Strip tracking/referral query parameters — 301 redirect to clean URL.
  // This prevents GSC from accumulating "Alternate page with proper canonical"
  // entries for ?ref=peerlist, ?utm_source=twitter, ?fbclid=xxx etc.
  // Only fires when at least one tracking param is present.
  const searchParams = request.nextUrl.searchParams;
  const hasTrackingParam = [...searchParams.keys()].some(k => TRACKING_PARAMS.has(k));
  if (hasTrackingParam) {
    const cleanUrl = request.nextUrl.clone();
    for (const key of TRACKING_PARAMS) {
      cleanUrl.searchParams.delete(key);
    }
    // If other (non-tracking) params remain, keep them; otherwise clear the search entirely
    if ([...cleanUrl.searchParams.keys()].length === 0) {
      cleanUrl.search = '';
    }
    return NextResponse.redirect(cleanUrl, 301);
  }

  // Skip static assets and Next.js internals
  if (SKIP_PREFIXES.some(p => pathname.startsWith(`/${p}`))) {
    return NextResponse.next();
  }

  // Skip known static files (strip query strings for matching)
  const rawFileName = pathname.split('/').pop();
  const fileName = rawFileName ? rawFileName.split('?')[0] : '';
  if (SKIP_FILES.has(fileName)) {
    return NextResponse.next();
  }

  // Skip paths that contain a known static filename anywhere in them.
  // Malformed crawler URLs like /favicon.ico/category/tool would otherwise
  // be rewritten to /en/favicon.ico/... and produce confusing 404s in GSC.
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.some(seg => SKIP_FILES.has(seg.split('?')[0]))) {
    return NextResponse.next();
  }

  // Skip file extensions (images, css, js, etc.)
  if (fileName && fileName.includes('.')) {
    return NextResponse.next();
  }

  // Remove trailing slashes (except root /) to prevent duplicate URLs
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const cleanPath = pathname.replace(/\/+$/, '');
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    return NextResponse.redirect(url, 301);
  }

  const firstSegment = pathname.split('/')[1]; // e.g., 'hi', 'word-counter', 'blog', etc.

  // If first segment is a supported non-English language → check for English-only pages first
  if (LANG_CODES.has(firstSegment)) {
    const restPath = pathname.replace(`/${firstSegment}`, '') || '/';
    const secondSegment = pathname.split('/')[2] || '';

    // ── English-only editorial pages ──────────────────────────────────────
    // Pages like /about, /contact, /resources, /tools, /privacy, /terms
    // only exist in English. Redirect /pt/about → /about, /hi/contact → /contact
    // This prevents GSC "Alternate page with proper canonical tag" issues.
    const ENGLISH_ONLY_PATHS = new Set([
      'about', 'contact', 'resources', 'tools', 'privacy', 'terms',
      'workflows', 'office',
    ]);
    if (ENGLISH_ONLY_PATHS.has(secondSegment)) {
      return NextResponse.redirect(new URL(restPath, request.url), 301);
    }

    // ── English-only blog posts ──────────────────────────────────────────
    // Non-English URLs for English-only blog posts (e.g. /pt/blog/best-free-sejda-alternative)
    // should redirect to the English canonical (/blog/best-free-sejda-alternative).
    // Language-specific blog posts (with lang field matching) are allowed through.
    // This is handled by blog page's generateStaticParams — non-English params for
    // English-only posts are no longer generated, so they'll 404 → caught by not-found.
    // The proxy redirect here is a safety net for any crawled URLs.
    if (secondSegment === 'blog') {
      const blogSlug = pathname.split('/')[3];
      // If a blog slug exists and it's not a language-specific post for this lang,
      // redirect to English. We use a known list of language-specific post prefixes.
      // Language-specific posts start with their language's words (como-, mejor-, contador-, etc.)
      // Everything else is English-only and should redirect.
      if (blogSlug) {
        // Let the page handle it — if it 404s, the not-found page handles it
        return NextResponse.next();
      }
      // /pt/blog (index page) → redirect to /blog
      return NextResponse.redirect(new URL('/blog', request.url), 301);
    }

    // All other non-English paths → pass through normally (tool pages, category pages)
    return NextResponse.next();
  }

  // If /en/... is accessed directly → 301 redirect to unprefixed URL
  // This prevents duplicate content between /en/tool and /tool
  if (firstSegment === 'en') {
    const cleanPath = pathname.replace(/^\/en/, '') || '/';
    return NextResponse.redirect(new URL(cleanPath, request.url), 301);
  }

  // Everything else → rewrite to /en/... internally
  // User sees: /word-counting-tools/word-counter
  // Next.js serves: /en/word-counting-tools/word-counter
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Match all paths except static files
  matcher: ['/((?!_next/static|_next/image).*)'],
};
