import { CATEGORIES, SITE } from '@/lib/tools-config';
import { getTranslations } from '@/lib/i18n';
import { generateWebSiteSchema, generateOrganizationSchema, generateAlternates } from '@/lib/seo';
import CommandCenter from '@/components/CommandCenter';
import HtmlDirectory from '@/components/HtmlDirectory';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const isEn = lang === 'en';

  return {
    title: t.siteTitle,
    description: t.siteDescription,
    keywords: t.siteKeywords,
    alternates: {
      canonical: isEn ? SITE.url : `${SITE.url}/${lang}`,
      languages: generateAlternates(lang, '/').languages,
    },
    openGraph: {
      title: t.siteTitle,
      description: t.siteDescription,
      url: isEn ? SITE.url : `${SITE.url}/${lang}`,
      siteName: SITE.name,
      type: 'website',
      locale: { en: 'en_US', hi: 'hi_IN', pt: 'pt_BR', es: 'es_ES', de: 'de_DE', id: 'id_ID' }[lang] || 'en_US',
      images: [
        {
          url: `${SITE.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t.siteTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.siteTitle,
      description: t.siteDescription,
      images: [`${SITE.url}/og-image.png`],
      creator: '@ilovetexts',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}

export default async function Home({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const jsonLdWebSite = generateWebSiteSchema(t, lang);
  const jsonLdOrg = generateOrganizationSchema();

  return (
    <>
      <script id="schema-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
      <script id="schema-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      <WorkspaceSwitch lang={lang} />
      
      <section style={{ textAlign: 'center', padding: '3rem 1rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: '800', marginBottom: '1rem', lineHeight: '1.2' }}>
          {t.siteTitle}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 auto', maxWidth: '650px' }}>
          {t.siteDescription} All tools run instantly in your browser with no server uploads, ensuring your data remains 100% private. No registration required.
        </p>
      </section>

      <CommandCenter 
        categories={CATEGORIES}
        lang={lang}
        t={t}
      />

      <HtmlDirectory categories={CATEGORIES} lang={lang} />
    </>
  );
}
