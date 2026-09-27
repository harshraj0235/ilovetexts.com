import { SITE } from '@/lib/tools-config';
import { LANG_CODES } from '@/lib/i18n';

export async function GET() {
  // Fixed deploy date — only update when content actually changes
  // Using new Date() causes daily lastmod changes which Google penalizes
  const lastmod = '2026-09-15';
  // Only include sitemaps for languages with indexable content (currently EN has tools, others have some blogs)
  // Even if they have blogs, they need to be in LANG_CODES
  const sitemaps = LANG_CODES.map(lang => `${SITE.url}/sitemap/${lang}.xml`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (const sitemapUrl of sitemaps) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${sitemapUrl}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }
  
  xml += `</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}

