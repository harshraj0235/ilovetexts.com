import { getAllTools, CATEGORIES, SITE } from '@/lib/tools-config';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';
import { INDEXABLE_TOOL_LOCALES, isPublishedDate } from '@/lib/search-indexing';

// ─── English-only blog post slugs (only include slugs that actually exist in BLOG_POSTS) ───
// These are served at /blog/[slug] in English only.
// Non-English URLs for blog are canonicalized to English in generateMetadata.
const EN_BLOG_SLUGS = [
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
  { slug: 'best-free-sejda-alternative', date: '2026-10-05' },
  { slug: 'best-free-grammarly-alternative', date: '2026-10-08' },
  { slug: 'best-free-ilovepdf-alternative', date: '2026-10-10' },
  { slug: 'best-free-chatgpt-text-humanizer', date: '2026-10-12' },
  { slug: 'best-free-smallpdf-alternative', date: '2026-10-14' },
  // Multilingual blog posts — only served at their language URL, canonical → /blog/[slug]
  { slug: 'como-unir-pdf-gratis', date: '2026-10-16', lang: 'es' },
  { slug: 'mejor-alternativa-grammarly-gratis', date: '2026-10-17', lang: 'es' },
  { slug: 'comprimir-pdf-gratis-online', date: '2026-10-18', lang: 'es' },
  { slug: 'contador-palabras-online-gratis', date: '2026-10-19', lang: 'es' },
  { slug: 'convertir-texto-mayusculas-minusculas', date: '2026-10-20', lang: 'es' },
  { slug: 'como-juntar-pdf-gratis', date: '2026-10-16', lang: 'pt' },
  { slug: 'melhor-alternativa-grammarly-gratis', date: '2026-10-17', lang: 'pt' },
  { slug: 'comprimir-pdf-gratis-online-pt', date: '2026-10-18', lang: 'pt' },
  { slug: 'contador-palavras-online-gratis', date: '2026-10-19', lang: 'pt' },
  { slug: 'converter-texto-maiusculas-minusculas', date: '2026-10-20', lang: 'pt' },
  { slug: 'pdf-merge-kaise-kare-free', date: '2026-10-16', lang: 'hi' },
  { slug: 'muft-typing-speed-test-hindi', date: '2026-10-17', lang: 'hi' },
  { slug: 'pdf-compress-kaise-kare', date: '2026-10-18', lang: 'hi' },
  { slug: 'shabd-ginti-online-muft', date: '2026-10-19', lang: 'hi' },
  { slug: 'grammarly-ka-muft-alternative', date: '2026-10-20', lang: 'hi' },
];

// Stable dates — only update when content actually changes
// Using a fixed deploy date prevents "everything changed today" signal to Google
const SITE_LAUNCH = '2025-08-01';
const TOOLS_LAST_UPDATED = '2026-09-06';  // Update this when you add/update tools
const CONTENT_LAST_UPDATED = '2026-09-06'; // Update this when you update content

function getAlternatesXml(path, locales = LANG_CODES) {
  let xml = `  <xhtml:link rel="alternate" hreflang="x-default" href="${buildCanonical('en', path)}" />\n`;
  locales.forEach(code => {
    xml += `  <xhtml:link rel="alternate" hreflang="${code}" href="${buildCanonical(code, path)}" />\n`;
  });
  return xml;
}

export const dynamic = 'force-static'; // Cache sitemap — only regenerate on redeploy

export async function GET(request, { params }) {
  const { lang } = await params;
  if (!LANG_CODES.includes(lang)) {
    return new Response('Not Found', { status: 404 });
  }

  const allTools = getAllTools();
  let urlsXml = '';

  const addUrl = (path, priority, changefreq, date, locales = LANG_CODES) => {
    urlsXml += `<url>\n  <loc>${buildCanonical(lang, path)}</loc>\n${getAlternatesXml(path, locales)}  <lastmod>${date}</lastmod>\n  <changefreq>${changefreq}</changefreq>\n  <priority>${priority}</priority>\n</url>\n`;
  };

  // Home
  addUrl('/', '1.0', 'daily', CONTENT_LAST_UPDATED);

  // Tool, category, directory, and editorial URLs are only discoverable in
  // locales that have a complete, reviewable experience. Do not place a
  // non-canonical translation or an unpublished article in a sitemap.
  if (INDEXABLE_TOOL_LOCALES.includes(lang)) {
    CATEGORIES.forEach((cat) => addUrl(`/${cat.id}`, '0.9', 'weekly', TOOLS_LAST_UPDATED, INDEXABLE_TOOL_LOCALES));
    allTools.forEach((tool) => addUrl(`/${tool.categoryId}/${tool.slug}`, '0.85', 'weekly', tool.content?.updatedAt || TOOLS_LAST_UPDATED, INDEXABLE_TOOL_LOCALES));

    addUrl('/blog', '0.7', 'weekly', CONTENT_LAST_UPDATED, ['en']);
    EN_BLOG_SLUGS
      .filter((post) => !post.lang && isPublishedDate(post.date))
      .forEach((post) => addUrl(`/blog/${post.slug}`, '0.7', 'monthly', post.date, ['en']));

    ['about', 'privacy', 'terms', 'contact', 'tools', 'resources'].forEach((page) =>
      addUrl(`/${page}`,
        page === 'tools' ? '0.8' : '0.4',
        page === 'tools' ? 'weekly' : 'yearly',
        page === 'tools' ? TOOLS_LAST_UPDATED : SITE_LAUNCH,
        ['en']
      )
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
