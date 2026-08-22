import { getAllTools, CATEGORIES, SITE } from '@/lib/tools-config';

export default function sitemap() {
  const sitemapData = [];
  const now = new Date().toISOString();

  // Home — highest priority
  sitemapData.push({
    url: SITE.url,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Category Pages — high priority hub pages
  CATEGORIES.forEach((cat) => {
    sitemapData.push({
      url: `${SITE.url}/${cat.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  // Tool Pages — money pages, highest tool priority
  const allTools = getAllTools();
  allTools.forEach((tool) => {
    sitemapData.push({
      url: `${SITE.url}/${tool.categoryId}/${tool.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  // Static Pages
  const staticPages = ['privacy', 'terms', 'contact'];
  staticPages.forEach((page) => {
    sitemapData.push({
      url: `${SITE.url}/${page}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    });
  });

  return sitemapData;
}
