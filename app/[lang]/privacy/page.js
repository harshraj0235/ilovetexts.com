import { SITE } from '@/lib/tools-config';

import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: `Privacy Policy | ${SITE.name}`,
    description: `Privacy Policy for ${SITE.name}. Learn how we protect your data and why our tools are 100% private.`,
    alternates: generateAlternates(lang, '/privacy'),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
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
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>1. Introduction</h2>
          <p>
            Welcome to {SITE.name}. We built this platform with a fundamental commitment to user privacy. 
            This Privacy Policy explains how we handle your data when you visit and use our website.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>2. 100% Client-Side Processing</h2>
          <p>
            <strong>We do not collect, store, or transmit your text data.</strong> 
          </p>
          <p style={{ marginTop: '8px' }}>
            Every single tool on {SITE.name} runs entirely within your web browser using client-side JavaScript. 
            When you type, paste, or process text, that data never leaves your device. We do not have servers 
            that process your inputs, meaning it is mathematically impossible for us to read, save, or share 
            the text you put into our tools.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>3. Information We Do Not Collect</h2>
          <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>We do not collect personal information (names, emails, etc.) as we do not require account registration.</li>
            <li>We do not log the text, code, passwords, or data you process using our tools.</li>
            <li>We do not store your generated outputs.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '12px' }}>4. Analytics and Cookies</h2>
          <p>
            We may use standard, privacy-focused analytics tools (like Cloudflare Web Analytics) to understand general traffic 
            patterns (e.g., how many people visit the site, which tools are most popular). This data is anonymized and aggregated. 
            It cannot be used to identify you personally, and it is never linked to the text you process.
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
