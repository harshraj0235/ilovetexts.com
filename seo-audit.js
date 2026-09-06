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
  if (r.includes('/*?*')) {
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

// ── 8. Blog slug list in sitemap matches BLOG_POSTS ───────
try {
  const blogPage = fs.readFileSync('app/[lang]/blog/page.js', 'utf8');
  const blogSlugs = (blogPage.match(/slug:\s*['"]([^'"]+)['"]/g) || []).map(m => m.match(/['"]([^'"]+)['"]/)[1]);
  
  const sitemapContent = fs.readFileSync('app/sitemap-api/[lang]/route.js', 'utf8');
  const sitemapSlugs = (sitemapContent.match(/slug:\s*['"]([^'"]+)['"]/g) || []).map(m => m.match(/['"]([^'"]+)['"]/)[1]);
  
  const missingFromBlog = sitemapSlugs.filter(s => !blogSlugs.includes(s));
  if (missingFromBlog.length > 0) {
    error(`Sitemap lists blog slugs that don't exist in BLOG_POSTS (will return 404): ${missingFromBlog.slice(0, 5).join(', ')}${missingFromBlog.length > 5 ? '...' : ''}`);
  } else {
    ok(`All ${sitemapSlugs.length} sitemap blog slugs exist in BLOG_POSTS`);
  }
} catch (e) {
  warn('Could not verify blog slug consistency: ' + e.message);
}

// ── 9. Check generateStaticParams returns [] not full list ─
// (prevents ENOSPC on Cloudflare — this is intentional for this project)
[
  'app/[lang]/[category]/page.js',
  'app/[lang]/[category]/[tool]/page.js',
].forEach(f => {
  if (!fs.existsSync(f)) return;
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('generateStaticParams') && c.includes('return []')) {
    ok(`${f}: dynamic rendering (intentional for Cloudflare edge)`);
  }
});

// ── 10. Verify X-Robots-Tag header set in next.config ────
const nextConfig = fs.existsSync('next.config.mjs') ? fs.readFileSync('next.config.mjs', 'utf8') : '';
if (nextConfig.includes('X-Robots-Tag')) {
  ok('next.config.mjs: X-Robots-Tag header set for all pages');
} else {
  warn('next.config.mjs: X-Robots-Tag header not set — add { key: "X-Robots-Tag", value: "index, follow" } to headers');
}

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
