import { LANGUAGES, LANG_CODES, getTranslations, buildCanonical } from '@/lib/i18n';
import { SITE } from '@/lib/tools-config';

// ═══════════════════════════════════════════════════════
// generateStaticParams — tells Next.js which [lang] values to build
// This generates pages for ALL languages at build time
// ═══════════════════════════════════════════════════════
export async function generateStaticParams() {
  return LANG_CODES.map(code => ({ lang: code }));
}

// ═══════════════════════════════════════════════════════
// generateMetadata — localized metadata for each language
// Like ilovepdf.com: translated title, description, keywords, OG, canonical
// ═══════════════════════════════════════════════════════
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const langConfig = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const canonical = buildCanonical(lang, '/');

  return {
    title: {
      default: t.siteTitle,
      template: `%s | ${SITE.name}`,
    },
    description: t.siteDescription,
    keywords: t.siteKeywords,
    metadataBase: new URL(SITE.url),
    manifest: '/manifest.json',
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.name,
    category: 'technology',
    classification: 'Free Online Tools',
    openGraph: {
      title: t.siteTitle,
      description: t.siteDescription,
      url: canonical,
      siteName: SITE.name,
      type: 'website',
      locale: { en: 'en_US', hi: 'hi_IN', pt: 'pt_BR', es: 'es_ES', de: 'de_DE', id: 'id_ID' }[lang] || 'en_US',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: t.siteTitle,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.siteTitle,
      description: t.siteDescription,
      images: ['/og-image.png'],
      creator: '@ilovetexts',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: canonical,
      languages: {
        'x-default': `${SITE.url}/`,
        en: buildCanonical('en', '/'),
        hi: buildCanonical('hi', '/'),
        pt: buildCanonical('pt', '/'),
        es: buildCanonical('es', '/'),
        de: buildCanonical('de', '/'),
        id: buildCanonical('id', '/'),
      }
    },
    verification: {
      google: '65jWt9Q3M5QH-VLidXzWHfk0RGTeq_t70bJTnKShmOw',
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E17' },
  ],
};

import { CATEGORIES, getCategory, getAllTools } from '@/lib/tools-config';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import InstallPrompt from '@/components/InstallPrompt';
import RecentTools from '@/components/RecentTools';
import Script from 'next/script';
import Link from 'next/link';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'optional',  // 'optional' = never blocks rendering, uses system font as fallback
  variable: '--font-sans',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'optional',  // code blocks use system monospace instantly
  variable: '--font-mono',
  preload: false,        // only loaded when actually needed
  fallback: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
});

export default async function LangLayout({ children, params }) {
  const { lang } = await params;

  // Compute translated tools server-side and pass down
  const navCategories = CATEGORIES.slice(0, 5).map(c => getCategory(c.id, lang));
  const allLocalizedCategories = CATEGORIES.map(c => getCategory(c.id, lang));
  const allTools = getAllTools(lang);
  const t = getTranslations(lang);

  return (
    <html lang={lang} suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <head>
        {/* Preconnect for analytics — non-blocking */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="ilovetexts.com Blog" href="/feed.xml" />
        {/* Blocking script to prevent dark mode FOUC — kept small and inline */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('theme');if(s==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body suppressHydrationWarning={true}>
        {/* Google Analytics — deferred, never blocks paint */}
        <Script strategy="lazyOnload" src="https://www.googletagmanager.com/gtag/js?id=G-V7J7BMEGCR" />
        <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-V7J7BMEGCR',{send_page_view:true});` }} />

        <NavBar lang={lang} />
        <div className="app-layout">
          {/* Sidebar — hidden on mobile via CSS, only rendered on desktop */}
          <aside className="app-sidebar" aria-label="Tool categories">
            <nav className="app-sidebar-nav">
              {allLocalizedCategories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '24px' }}>
                  <h4>{cat.name}</h4>
                  <div>
                    {cat.tools.map(tool => (
                      <Link
                        key={tool.slug}
                        href={lang === 'en' ? `/${cat.id}/${tool.slug}` : `/${lang}/${cat.id}/${tool.slug}`}
                        prefetch={false}
                        className="app-sidebar-link"
                      >
                        <span role="img" aria-hidden="true" style={{ fontSize: '1.1rem', opacity: 0.8 }}>{tool.icon}</span>
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
          <main className="app-main">
            {children}
          </main>
        </div>
        <Footer lang={lang} allToolsCount={allTools.length} />
        <InstallPrompt t={t} />
        <RecentTools />
      </body>
    </html>
  );
}
