import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════
// MIDDLEWARE — URL Rewriting for Internationalization
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
// ═══════════════════════════════════════════════════════

const LANG_CODES = new Set(['hi', 'pt', 'es', 'de', 'id']);

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

  // If first segment is a supported non-English language → pass through
  if (LANG_CODES.has(firstSegment)) {
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
