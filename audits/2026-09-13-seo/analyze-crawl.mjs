import fs from 'node:fs';

const pages = JSON.parse(fs.readFileSync(new URL('./live-pages.json', import.meta.url)));
const byPath = new Map(pages.map((page) => [page.path, page]));
const locales = ['en', 'hi', 'pt', 'es', 'de', 'id'];
const localeOf = (path) => locales.slice(1).find((lang) => path === `/${lang}` || path.startsWith(`/${lang}/`)) || 'en';
const selfUrl = (path) => `https://ilovetexts.com${path === '/' ? '' : path}`;
const normalize = (url) => url.replace(/\/$/, '');

const result = {
  generatedAt: new Date().toISOString(),
  totals: {
    pages: pages.length,
    sitemapPages: pages.filter((page) => page.inSitemap).length,
    noindex: pages.filter((page) => page.noindex).length,
    sitemapNoindex: pages.filter((page) => page.inSitemap && page.noindex).length,
    nonSelfCanonical: pages.filter((page) => page.canonical.length !== 1 || normalize(page.canonical[0]) !== normalize(selfUrl(page.path))).length,
    sitemapNonSelfCanonical: pages.filter((page) => page.inSitemap && (page.canonical.length !== 1 || normalize(page.canonical[0]) !== normalize(selfUrl(page.path)))).length,
    multipleH1: pages.filter((page) => page.h1.length > 1).length,
    missingH1: pages.filter((page) => page.h1.length === 0).length,
    schemaErrors: pages.filter((page) => page.schemaParseErrors > 0).length,
    mojibake: pages.filter((page) => page.hasMojibake).length,
  },
  byLocale: {},
  noindexPaths: pages.filter((page) => page.noindex).map((page) => page.path),
  multipleH1Paths: pages.filter((page) => page.h1.length > 1).map((page) => ({ path: page.path, h1: page.h1 })),
  duplicateTitles: [],
  duplicateDescriptions: [],
  titleLengths: {},
  descriptionLengths: {},
  htmlBytes: {},
  linkCounts: {},
};

for (const lang of locales) {
  const rows = pages.filter((page) => localeOf(page.path) === lang);
  result.byLocale[lang] = {
    pages: rows.length,
    sitemapPages: rows.filter((page) => page.inSitemap).length,
    noindex: rows.filter((page) => page.noindex).length,
    sitemapNoindex: rows.filter((page) => page.inSitemap && page.noindex).length,
    nonSelfCanonical: rows.filter((page) => page.canonical.length !== 1 || normalize(page.canonical[0]) !== normalize(selfUrl(page.path))).length,
    sitemapNonSelfCanonical: rows.filter((page) => page.inSitemap && (page.canonical.length !== 1 || normalize(page.canonical[0]) !== normalize(selfUrl(page.path)))).length,
    canonicalToEnglish: rows.filter((page) => page.canonical.length === 1 && !page.canonical[0].includes(`/${lang}/`) && page.path !== `/${lang}`).length,
  };
}

for (const [field, target] of [['title', 'duplicateTitles'], ['description', 'duplicateDescriptions']]) {
  const groups = new Map();
  for (const page of pages) {
    const value = page[field]?.trim();
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(page.path);
  }
  result[target] = [...groups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => ({ value, count: paths.length, paths }))
    .sort((a, b) => b.count - a.count);
}

const quantiles = (values) => {
  values = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = (p) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))];
  return { min: at(0), p25: at(.25), median: at(.5), p75: at(.75), p90: at(.9), p95: at(.95), max: at(1) };
};
result.titleLengths = { ...quantiles(pages.map((page) => page.title.length)), over60: pages.filter((page) => page.title.length > 60).length, missing: pages.filter((page) => !page.title).length };
result.descriptionLengths = { ...quantiles(pages.map((page) => page.description.length)), over160: pages.filter((page) => page.description.length > 160).length, under70: pages.filter((page) => page.description.length > 0 && page.description.length < 70).length, missing: pages.filter((page) => !page.description).length };
result.htmlBytes = quantiles(pages.map((page) => page.htmlBytes));
result.linkCounts = quantiles(pages.map((page) => page.linkCount));

fs.writeFileSync(new URL('./crawl-analysis.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ totals: result.totals, byLocale: result.byLocale, duplicateTitleGroups: result.duplicateTitles.length, duplicateDescriptionGroups: result.duplicateDescriptions.length, titleLengths: result.titleLengths, descriptionLengths: result.descriptionLengths, htmlBytes: result.htmlBytes, linkCounts: result.linkCounts }, null, 2));
