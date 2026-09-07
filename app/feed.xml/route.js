// ═══════════════════════════════════════════════════════
// /feed.xml — RSS 2.0 feed for blog posts
// Enables blog aggregators, Feedly, Google News, and
// AI citation engines to discover and syndicate content.
// Each syndication = a backlink.
// ═══════════════════════════════════════════════════════
import { SITE } from '@/lib/tools-config';
import { BLOG_POSTS } from '@/app/[lang]/blog/page';

export async function GET() {
  const siteUrl = SITE.url;
  const now = new Date().toUTCString();

  // Sort newest first
  const sorted = [...BLOG_POSTS].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  const items = sorted.map(post => {
    const url = `${siteUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();
    // Escape XML special chars
    const escapeXml = (str) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    const title   = escapeXml(post.title);
    const desc    = escapeXml(post.description);
    // Full article content in <content:encoded> — required by Google News,
    // feed aggregators (Feedly, Inoreader), and AI citation engines.
    // Strip markdown syntax for clean HTML in the feed.
    const fullContent = post.content
      ? `<![CDATA[${post.content
          .replace(/#{1,6}\s(.+)/g, (_, h) => `<strong>${h}</strong>`)
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .replace(/\n\n/g, '<br/><br/>')
          .trim()}]]>`
      : `<![CDATA[${post.description}]]>`;
    return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <content:encoded>${fullContent}</content:encoded>
      <pubDate>${pubDate}</pubDate>
      <category>${post.category}</category>
      <author>harshraj@ilovetexts.com (Harsh Raj)</author>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name} — Free Online Text Tools Blog</title>
    <link>${siteUrl}</link>
    <description>Guides, tutorials, and tool comparisons from ilovetexts.com — ${SITE.description}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>1440</ttl>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/og-image.png</url>
      <title>${SITE.name}</title>
      <link>${siteUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <managingEditor>harshraj@ilovetexts.com (Harsh Raj)</managingEditor>
    <webMaster>harshraj@ilovetexts.com (Harsh Raj)</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} ilovetexts.com</copyright>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
