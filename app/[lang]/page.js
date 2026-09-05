import { getAllTools, CATEGORIES } from '@/lib/tools-config';
import { getTranslations } from '@/lib/i18n';
import { generateWebSiteSchema, generateOrganizationSchema, generateAlternates } from '@/lib/seo';
import Script from 'next/script';
import CommandCenter from '@/components/CommandCenter';
import HtmlDirectory from '@/components/HtmlDirectory';
import PromotedTools from '@/components/PromotedTools';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  
  return {
    title: t.siteTitle,
    description: t.siteDescription,
    alternates: generateAlternates(lang, '/'),
    keywords: t.siteKeywords,
  };
}

export default async function Home({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const allTools = getAllTools(lang);
  
  const jsonLdWebSite = generateWebSiteSchema(t, lang);
  const jsonLdOrg = generateOrganizationSchema();

  return (
    <>
      <script id="schema-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
      <script id="schema-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      <CommandCenter 
        categories={CATEGORIES}
        lang={lang}
        t={t}
      />

      <PromotedTools lang={lang} />

      <HtmlDirectory categories={CATEGORIES} lang={lang} />
    </>
  );
}

