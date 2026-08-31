import { SITE } from '@/lib/tools-config';
import { LANG_CODES } from '@/lib/i18n';

export async function GET() {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sitemaps = LANG_CODES.map(lang => `${SITE.url}/sitemap/${lang}.xml`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (const sitemapUrl of sitemaps) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${sitemapUrl}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
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

