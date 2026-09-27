import '@/app/globals.css';
import { getTranslations, LANG_CODES } from '@/lib/i18n';
import { SITE } from '@/lib/tools-config';

export async function generateStaticParams() {
  return LANG_CODES.map(code => ({ lang: code }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = getTranslations(lang);

  return {
    title: {
      default: t.siteTitle,
      template: `%s | ${SITE.name}`,
    },
    robots: {
      index: false,
      follow: false, // Embeds don't need to be indexed directly
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function EmbedLayout({ children, params }) {
  const { lang } = await params;
  
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="embed-body" style={{ background: 'transparent', padding: '16px' }}>
        {children}
      </body>
    </html>
  );
}
