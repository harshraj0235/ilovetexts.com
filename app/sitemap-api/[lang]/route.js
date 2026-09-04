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
  // Comparison posts
  { slug: 'best-free-sejda-alternative', date: '2026-10-05' },
  { slug: 'best-free-grammarly-alternative', date: '2026-10-08' },
  { slug: 'best-free-ilovepdf-alternative', date: '2026-10-10' },
  { slug: 'best-free-chatgpt-text-humanizer', date: '2026-10-12' },
  { slug: 'best-free-smallpdf-alternative', date: '2026-10-14' },
  // Multilingual posts (es)
  { slug: 'como-unir-pdf-gratis', date: '2026-10-16' },
  { slug: 'mejor-alternativa-grammarly-gratis', date: '2026-10-17' },
  { slug: 'comprimir-pdf-gratis-online', date: '2026-10-18' },
  { slug: 'contador-palabras-online-gratis', date: '2026-10-19' },
  { slug: 'convertir-texto-mayusculas-minusculas', date: '2026-10-20' },
  // Multilingual posts (pt)
  { slug: 'como-juntar-pdf-gratis', date: '2026-10-16' },
  { slug: 'melhor-alternativa-grammarly-gratis', date: '2026-10-17' },
  { slug: 'comprimir-pdf-gratis-online-pt', date: '2026-10-18' },
  { slug: 'contador-palavras-online-gratis', date: '2026-10-19' },
  { slug: 'converter-texto-maiusculas-minusculas', date: '2026-10-20' },
  // Multilingual posts (hi)
  { slug: 'pdf-merge-kaise-kare-free', date: '2026-10-16' },
  { slug: 'muft-typing-speed-test-hindi', date: '2026-10-17' },
  { slug: 'pdf-compress-kaise-kare', date: '2026-10-18' },
  { slug: 'shabd-ginti-online-muft', date: '2026-10-19' },
  { slug: 'grammarly-ka-muft-alternative', date: '2026-10-20' },
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
  ['about', 'privacy', 'terms', 'contact', 'tools', 'resources', 'blog'].forEach((page) =>
    addUrl(`/${page}`, page === 'tools' ? '0.8' : '0.4', page === 'tools' ? 'weekly' : 'yearly', page === 'tools' ? BUILD_DATE : SITE_LAUNCH)
  );

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
