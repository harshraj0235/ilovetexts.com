import { getAllTools, CATEGORIES, SITE } from '@/lib/tools-config';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';

// ─── Blog post slugs ───
const BLOG_SLUGS = [
  { slug: 'how-to-count-words-in-any-document', date: '2026-08-20' },
  { slug: 'convert-text-case-uppercase-lowercase-title-case', date: '2026-08-18' },
  { slug: 'format-json-online-beautify-validate-minify', date: '2026-08-15' },
  { slug: 'base64-encoding-decoding-explained', date: '2026-08-12' },
  { slug: 'generate-strong-password-guide', date: '2026-08-10' },
  { slug: 'instagram-caption-formatting-tips', date: '2026-08-08' },
  { slug: 'text-to-speech-online-free-guide', date: '2026-09-01' },
  { slug: 'sha256-hash-generator-guide', date: '2026-09-05' },
  { slug: 'remove-line-breaks-from-pdf-text', date: '2026-09-10' },
  { slug: 'regex-tester-online-guide', date: '2026-09-15' },
  { slug: 'csv-to-json-converter-guide', date: '2026-09-20' },
  { slug: 'jwt-decoder-online-guide', date: '2026-09-25' },
  { slug: 'word-counter-online-complete-guide', date: '2026-10-01' },
];

const SITE_LAUNCH = '2025-08-01';
const BUILD_DATE = '2026-09-01';

function getAlternatesXml(path) {
  let xml = `  <xhtml:link rel="alternate" hreflang="x-default" href="${buildCanonical('en', path)}" />\n`;
  LANG_CODES.forEach(code => {
    xml += `  <xhtml:link rel="alternate" hreflang="${code}" href="${buildCanonical(code, path)}" />\n`;
  });
  return xml;
}

export async function GET(request, { params }) {
  const { lang } = await params;
  if (!LANG_CODES.includes(lang)) {
    return new Response('Not Found', { status: 404 });
  }

  const allTools = getAllTools();
  let urlsXml = '';

  const addUrl = (path, priority, changefreq, date) => {
    urlsXml += `<url>\n  <loc>${buildCanonical(lang, path)}</loc>\n${getAlternatesXml(path)}  <lastmod>${date}</lastmod>\n  <changefreq>${changefreq}</changefreq>\n  <priority>${priority}</priority>\n</url>\n`;
  };

  // Home
  addUrl('/', '1.0', 'daily', BUILD_DATE);

  // Category Pages
  CATEGORIES.forEach((cat) => addUrl(`/${cat.id}`, '0.9', 'weekly', BUILD_DATE));

  // Tool Pages
  allTools.forEach((tool) => addUrl(`/${tool.categoryId}/${tool.slug}`, '0.85', 'weekly', BUILD_DATE));

  // Blog index
  addUrl('/blog', '0.7', 'weekly', BUILD_DATE);

  // Blog Posts
  BLOG_SLUGS.forEach((post) => addUrl(`/blog/${post.slug}`, '0.7', 'monthly', post.date));

  // Static Pages
  ['about', 'privacy', 'terms', 'contact'].forEach((page) => addUrl(`/${page}`, '0.4', 'yearly', SITE_LAUNCH));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
