import { generateAlternates } from './seo';

export function workflowMetadata(lang, path, title, description) {
  return {
    title, description,
    alternates: generateAlternates(lang, path, { canonicalLocale: 'en', locales: ['en'] }),
    robots: { index: lang === 'en', follow: true },
    openGraph: { title, description, url: `https://ilovetexts.com${path}`, type: 'website', images: ['/og-image.png'] },
  };
}
