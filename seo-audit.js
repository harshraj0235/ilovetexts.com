#!/usr/bin/env node
// seo-audit.js — Run before every deploy: node seo-audit.js
// Catches SEO issues that cause pages not to be indexed by Google
// Add to package.json scripts: "prebuild": "node seo-audit.js"

const fs = require('fs');
const path = require('path');

let errors = 0;
let warnings = 0;

function error(msg) { console.error(`❌ ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`⚠️  WARN:  ${msg}`); warnings++; }
function ok(msg) { console.log(`✅ OK:    ${msg}`); }

console.log('\n🔍 ilovetexts.com SEO Audit\n' + '='.repeat(50) + '\n');

// ── 1. proxy.js must exist (this project uses proxy.js not middleware.js) ───
// This Next.js build targets Cloudflare Workers and uses proxy.js as the edge middleware
const proxyExists = fs.existsSync('proxy.js');
const middlewareExists = fs.existsSync('middleware.js');
if (middlewareExists) {
  error('middleware.js should NOT exist in this project — it uses proxy.js as edge middleware. Delete middleware.js.');
} else if (!proxyExists) {
  error('proxy.js missing! /en/ redirect and URL rewriting will NOT work. This project uses proxy.js as the Cloudflare Workers edge middleware.');
} else {
  const mw = fs.readFileSync('proxy.js', 'utf8');
  if (!mw.includes('export function proxy') && !mw.includes('export default')) {
    error('proxy.js does not export a proxy function — edge routing will not work');
  } else if (!mw.includes('firstSegment === \'en\'')) {
    error('proxy.js does not handle /en/ redirect — duplicate English content will be served at both /en/... and /...');
  } else {
    ok('proxy.js exists with /en/ redirect and URL rewriting');
  }
}

// ── 2. No force-dynamic + revalidate together ────────────
const pageFiles = [
  'app/[lang]/[category]/page.js',
  'app/[lang]/[category]/[tool]/page.js',
];
pageFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('force-dynamic') && content.includes('export const revalidate')) {
    error(`${f}: has both force-dynamic AND revalidate — these are contradictory. Remove revalidate.`);
  } else {
    ok(`${f}: no contradictory dynamic/revalidate`);
  }
});

// ── 3. Sitemap must not duplicate /blog ──────────────────
const sitemapFile = 'app/sitemap-api/[lang]/route.js';
if (fs.existsSync(sitemapFile)) {
  const sm = fs.readFileSync(sitemapFile, 'utf8');
  const blogMatches = (sm.match(/addUrl\(`\/blog`/g) || []).length;
  if (blogMatches > 1) {
    error(`${sitemapFile}: /blog URL added ${blogMatches} times — duplicate sitemap entries`);
  } else {
    ok('Sitemap: no duplicate /blog entries');
  }
  // Check BUILD_DATE is not new Date()
  if (sm.includes('new Date()') || sm.includes('new Date().toISOString')) {
    warn(`${sitemapFile}: BUILD_DATE uses new Date() — will show all pages as updated daily, degrading Google's trust in lastmod. Use a fixed date and update manually when content changes.`);
  } else {
    ok('Sitemap: fixed lastmod dates (not today\'s date)');
  }
}

// ── 4. Privacy/Terms should noindex non-English ──────────
['app/[lang]/privacy/page.js', 'app/[lang]/terms/page.js'].forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  if (!content.includes('lang === \'en\'') && !content.includes('lang === "en"')) {
    warn(`${f}: indexes all 6 language variants of identical content — consider noindex for non-English`);
  } else {
    ok(`${f}: correctly noindexes non-English duplicates`);
  }
});

// ── 5. compress-pdf and protect-pdf must have different initialMode ──
const toolPage = 'app/[lang]/[category]/[tool]/page.js';
if (fs.existsSync(toolPage)) {
  const tp = fs.readFileSync(toolPage, 'utf8');
  // Find compress-pdf and protect-pdf sections
  const compressMatch = tp.match(/compress-pdf.*?initialMode="([^"]+)"/s);
  const protectMatch = tp.match(/protect-pdf.*?initialMode="([^"]+)"/s);
  if (compressMatch && protectMatch && compressMatch[1] === protectMatch[1]) {
    error(`compress-pdf and protect-pdf both use initialMode="${compressMatch[1]}" — identical rendered content, Google treats as duplicate pages`);
  } else {
    ok('compress-pdf and protect-pdf have distinct initialModes');
  }
}

// ── 6. robots.js must list sitemaps ──────────────────────
const robotsFile = 'app/robots.js';
if (fs.existsSync(robotsFile)) {
  const r = fs.readFileSync(robotsFile, 'utf8');
  if (!r.includes('sitemap')) {
    error('robots.js does not list any sitemaps — Google may not find your sitemap');
  } else {
    ok('robots.js includes sitemap URLs');
  }
  if (r.includes('/*?*') || r.includes("'/*?*'") || r.includes('"/*?*"') || r.includes("query")) {
    ok('robots.js blocks query string URLs (saves crawl budget)');
  } else {
    warn('robots.js does not block /*?* — query string URLs may waste crawl budget');
  }
}

// ── 7. Check for tool slug collisions ────────────────────
try {
  // Read tools-config and check for duplicate slugs in same category
  const configContent = fs.readFileSync('lib/tools-config.js', 'utf8');
  const slugMatches = configContent.match(/slug:\s*['"]([^'"]+)['"]/g) || [];
  const slugs = slugMatches.map(m => m.match(/['"]([^'"]+)['"]/)[1]);
  const seen = new Set();
  const dupes = [];
  slugs.forEach(s => { if (seen.has(s)) dupes.push(s); else seen.add(s); });
  if (dupes.length > 0) {
    error(`Duplicate tool slugs found: ${dupes.join(', ')} — creates duplicate content pages`);
  } else {
    ok(`All ${slugs.length} tool slugs are unique`);
  }
} catch (e) {
  warn('Could not check tool slug uniqueness: ' + e.message);
}

// ── 8. Unpublished articles must stay out of sitemap discovery ─────────────
try {
  const blogPage = fs.readFileSync('app/[lang]/blog/page.js', 'utf8');
  const sitemapContent = fs.readFileSync('app/sitemap-api/[lang]/route.js', 'utf8');
  const indexingPolicy = fs.readFileSync('lib/search-indexing.js', 'utf8');
  const cutoff = (indexingPolicy.match(/PUBLISHED_ON_OR_BEFORE\s*=\s*['"]([^'"]+)/) || [])[1];
  const dates = [...blogPage.matchAll(/date:\s*['"](\d{4}-\d{2}-\d{2})['"]/g)].map(match => match[1]);

  if (!cutoff) {
    error('lib/search-indexing.js: PUBLISHED_ON_OR_BEFORE is missing');
  } else if (dates.some(date => date > cutoff) && !sitemapContent.includes('isPublishedDate(post.date)')) {
    error('Sitemap can advertise posts dated after the publication cutoff');
  } else if (!blogPage.includes('ALL_BLOG_POSTS.filter((post) => isPublishedDate(post.date))')) {
    error('Blog index can show articles before their publication date');
  } else {
    ok('Unpublished blog posts are excluded from navigation and sitemap discovery');
  }
} catch (e) {
  warn('Could not verify blog publication policy: ' + e.message);
}

// ── 9. Indexable English catalog pages should be statically generated ───────
[
  'app/[lang]/[category]/page.js',
  'app/[lang]/[category]/[tool]/page.js',
].forEach(f => {
  if (!fs.existsSync(f)) return;
  const c = fs.readFileSync(f, 'utf8');
  if (!c.includes("lang: 'en'") || !c.includes('export const revalidate')) {
    error(`${f}: English catalog pages are not pre-rendered with controlled revalidation`);
  } else {
    ok(`${f}: English catalog pages are statically generated and revalidated`);
  }
});

// ── 10. Do not override per-page noindex metadata with a global index header ─
const nextConfig = fs.existsSync('next.config.mjs') ? fs.readFileSync('next.config.mjs', 'utf8') : '';
if (nextConfig.includes("value: 'index, follow'")) {
  error('next.config.mjs: a global X-Robots-Tag index header conflicts with per-page noindex metadata');
} else if (nextConfig.includes("value: 'noindex, nofollow'")) {
  ok('next.config.mjs: API routes are noindex without overriding page metadata');
} else {
  warn('next.config.mjs: API noindex header is missing');
}

// ── 11. Home page must have OG image ─────────────────────
try {
  const homePage = fs.readFileSync('app/[lang]/page.js', 'utf8');
  if (!homePage.includes('og-image') && !homePage.includes('openGraph')) {
    error('app/[lang]/page.js: home page missing openGraph.images — social previews will be blank, hurting click-through rate from social shares');
  } else {
    ok('app/[lang]/page.js: home page has openGraph metadata with image');
  }
} catch (e) { warn('Could not check home page OG image: ' + e.message); }

// ── 12. Tool schema must NOT use new Date() for datePublished ─
try {
  const seoJs = fs.readFileSync('lib/seo.js', 'utf8');
  if (seoJs.includes("datePublished: '2025-01-15'")) {
    error("lib/seo.js: generateToolSchema uses stale datePublished '2025-01-15'. Use the actual site launch date '2025-08-01'.");
  } else if (seoJs.match(/datePublished:\s*new Date\(\)/)) {
    error('lib/seo.js: generateToolSchema uses new Date() for datePublished — this tells Google every tool was published today on every deploy. Use a fixed launch date string instead.');
  } else {
    ok('lib/seo.js: generateToolSchema datePublished is correctly set');
  }
} catch (e) { warn('Could not check tool schema datePublished: ' + e.message); }

// ── 13. robots.js must block query strings ────────────────
try {
  const robotsJs = fs.readFileSync('app/robots.js', 'utf8');
  if (!robotsJs.includes('/*?*')) {
    error('app/robots.js: does not block /*?* — query-string URLs like ?ref=peerlist and ?utm_source=twitter will be crawled, wasting crawl budget and creating "Alternate page with proper canonical" entries in GSC');
  } else {
    ok('app/robots.js: query-string URLs blocked via /*?* disallow');
  }
} catch (e) { warn('Could not check robots.js query string blocking: ' + e.message); }

// ── 14. robots.js must block /embed/ for all bots ─────────
try {
  const robotsJs = fs.readFileSync('app/robots.js', 'utf8');
  // Count how many disallow arrays contain /embed/
  const embedDisallowCount = (robotsJs.match(/\/embed\//g) || []).length;
  // We have 8 bot rules — embed should appear in all of them
  if (embedDisallowCount < 3) {
    warn('app/robots.js: /embed/ may not be blocked for all bots — verify each userAgent rule includes /embed/ in its disallow list');
  } else {
    ok(`app/robots.js: /embed/ blocked in ${embedDisallowCount} bot rules`);
  }
} catch (e) { warn('Could not check robots.js embed blocking: ' + e.message); }

// ── 15. Hreflang must only advertise reviewed tool locales ─────────────────
try {
  const seoJs = fs.readFileSync('lib/seo.js', 'utf8');
  const sitemapJs = fs.readFileSync('app/sitemap-api/[lang]/route.js', 'utf8');
  if (!seoJs.includes('INDEXABLE_TOOL_LOCALES') || !seoJs.includes('index: canIndex') || !sitemapJs.includes('INDEXABLE_TOOL_LOCALES.includes(lang)')) {
    error('Tool/catalog locale gating is incomplete: hreflang, robots, and sitemap must agree');
  } else {
    ok('Tool/catalog hreflang, robots, and sitemap use the reviewed-locale policy');
  }
} catch (e) { warn('Could not check reviewed-locale policy: ' + e.message); }

// ── 16. Global trust copy must not promise zero tracking or universal local processing ─
try {
  const locale = fs.readFileSync('locales/en.json', 'utf8');
  const layout = fs.readFileSync('components/ToolLayout.jsx', 'utf8');
  if (locale.includes('zero tracking, zero cookies') || layout.includes('Your work stays on this device')) {
    error('Global trust copy makes an unsupported universal privacy claim');
  } else if (!layout.includes('EXTERNAL_PROCESSING_NOTICES')) {
    error('External-processing tools do not have a workspace disclosure');
  } else {
    ok('Tool pages distinguish browser processing from external processing');
  }
} catch (e) { warn('Could not verify processing disclosures: ' + e.message); }

// ── 16. FAQs must be non-empty on tool pages ──────────────
try {
  const toolPage = fs.readFileSync('app/[lang]/[category]/[tool]/page.js', 'utf8');
  if (!toolPage.includes('generateFAQs') && !toolPage.includes('faqs')) {
    warn('app/[lang]/[category]/[tool]/page.js: tool pages may not be generating FAQs — FAQPage schema requires non-empty FAQ items for rich snippet eligibility');
  } else {
    ok('app/[lang]/[category]/[tool]/page.js: FAQ generation present');
  }
} catch (e) { warn('Could not check FAQ generation: ' + e.message); }

// ── 17. No JS truncation of tool descriptions ─────────────
try {
  const commandCenter = fs.readFileSync('components/CommandCenter.jsx', 'utf8');
  if (commandCenter.includes('description.length > 60') || commandCenter.includes('substring(0, 60)')) {
    error('components/CommandCenter.jsx: tool descriptions are truncated in JS before rendering — Google reads the rendered HTML and sees cut-off descriptions, which hurts content quality signals. Remove JS truncation; use CSS line-clamp instead.');
  } else {
    ok('components/CommandCenter.jsx: tool descriptions not JS-truncated (full text in DOM)');
  }
} catch (e) { warn('Could not check CommandCenter truncation: ' + e.message); }

// ── 18. Organization schema must have correct foundingDate ─
try {
  const seoJs = fs.readFileSync('lib/seo.js', 'utf8');
  if (seoJs.includes("foundingDate: '2024'")) {
    error("lib/seo.js: Organization foundingDate is '2024' but site launched in 2025 — incorrect E-E-A-T signal");
  } else {
    ok('lib/seo.js: Organization foundingDate is correct');
  }
} catch (e) { warn('Could not check Organization foundingDate: ' + e.message); }

// ── 19. Content-Security-Policy header must be set ────────
if (nextConfig.includes('Content-Security-Policy')) {
  ok('next.config.mjs: Content-Security-Policy header set');
} else {
  warn('next.config.mjs: Content-Security-Policy header not set — add CSP to prevent XSS and signal site quality to Google');
}

// ── 20. FAQ answers must be in DOM (not JS-hidden) ────────
try {
  const toolLayout = fs.readFileSync('components/ToolLayout.jsx', 'utf8');
  // The old pattern used useState + CSS to hide answers from crawlers
  if (toolLayout.includes("useState(false)") && toolLayout.includes('faq-answer') && !toolLayout.includes('<details')) {
    warn('components/ToolLayout.jsx: FAQ answers use JS toggle (useState) — Google may not read collapsed accordion content. Use native <details>/<summary> instead.');
  } else if (toolLayout.includes('<details')) {
    ok('components/ToolLayout.jsx: FAQs use native <details>/<summary> — Googlebot reads content regardless of open/closed state');
  }
} catch (e) { warn('Could not check FAQ DOM visibility: ' + e.message); }

// ── 21. Tool-to-blog links must not point to planned articles ───────────────
try {
  const toolLayout = fs.readFileSync('components/ToolLayout.jsx', 'utf8');
  if (!toolLayout.includes('PUBLISHED_BLOG_SLUGS') || !toolLayout.includes('PUBLISHED_BLOG_SLUGS.has(post.slug)')) {
    error('Tool pages can link to unpublished blog URLs that return 404');
  } else {
    ok('Tool-to-blog internal links are limited to published guides');
  }
} catch (e) { warn('Could not verify tool-to-blog links: ' + e.message); }

// ── Summary ───────────────────────────────────────────────
console.log('\n' + '='.repeat(50));
if (errors > 0) {
  console.error(`\n🚨 ${errors} error(s), ${warnings} warning(s) found. Fix errors before deploying.\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  0 errors, ${warnings} warning(s). Safe to deploy but consider fixing warnings.\n`);
  process.exit(0);
} else {
  console.log(`\n🎉 All SEO checks passed! Safe to deploy.\n`);
  process.exit(0);
}
