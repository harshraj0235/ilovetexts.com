import { SITE } from '@/lib/tools-config';
import { buildCanonical } from '@/lib/i18n';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const alternates = generateAlternates(lang, '/privacy');
  // Privacy policy is English-only content — point all language variants to English canonical
  // prevents 6 near-duplicate thin pages from competing with each other
  if (lang !== 'en') {
    alternates.canonical = buildCanonical('en', '/privacy');
  }
  return {
    title: `Privacy Policy | ${SITE.name}`,
    description: `Privacy Policy for ${SITE.name}. Learn how browser-based tools, external processing features, and site analytics handle data.`,
    alternates,
    robots: {
      index: lang === 'en', // Only index English version
      follow: true,
      googleBot: {
        index: lang === 'en',
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '24px', fontWeight: '800' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Last updated: September 12, 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>1. Introduction</h2>
          <p>
            Welcome to {SITE.name}. We built this platform with a fundamental commitment to user privacy. 
            This Privacy Policy explains how we handle your data when you visit and use our website.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>2. Browser Processing and External Features</h2>
          <p>
            Many tools process inputs directly in your browser. Other features use external services to provide their result.
          </p>
          <p style={{ marginTop: '8px' }}>
            For example, text-to-speech sends requested text through our service to Google Translate text-to-speech; grammar, spelling, and punctuation checks send text to LanguageTool; word lookups may send a word or letters to Datamuse; and the document translator sends extracted text to Google Translate. We label these tools in the workspace before you use them. Avoid entering sensitive information into an external-processing tool.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>3. Accounts and Tool Outputs</h2>
          <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>We do not require an account to use the tools.</li>
            <li>We do not intentionally retain text or files processed by browser-only tools.</li>
            <li>External providers process data under their own policies when you use an external-processing feature.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>4. Analytics and Cookies</h2>
          <p>
            We use Google Analytics to understand aggregate site activity, such as pages visited and device information. Google Analytics may use cookies or similar identifiers according to Google&apos;s policies. We do not use analytics to read the text or files you enter into a tool.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>5. Third-Party Links</h2>
          <p>
            Our website may contain links to external sites that are not operated by us. If you click on a third-party link, 
            you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>6. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last updated" date at the top.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:Contact@ilovetexts.com" style={{ color: 'var(--brand-color)', fontWeight: '600' }}>Contact@ilovetexts.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
