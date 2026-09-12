// Indexing policy: only advertise pages that are complete enough to stand on
// their own in Search. Add a locale here only after its tool UI and editorial
// content have been fully translated and reviewed.
export const PRIMARY_CONTENT_LOCALE = 'en';
export const INDEXABLE_TOOL_LOCALES = [PRIMARY_CONTENT_LOCALE];

// Keep this date intentional. New posts must be published on or before this
// date before they can be shown in navigation, feeds, or sitemaps.
export const PUBLISHED_ON_OR_BEFORE = '2026-09-12';

export function isIndexableToolLocale(locale) {
  return INDEXABLE_TOOL_LOCALES.includes(locale);
}

export function isPublishedDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= PUBLISHED_ON_OR_BEFORE;
}
