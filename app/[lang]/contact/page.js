import { SITE } from '@/lib/tools-config';

import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: `Contact Us | ${SITE.name}`,
    description: `Get in touch with the ${SITE.name} team for support, feedback, or inquiries.`,
    alternates: generateAlternates(lang, '/contact'),
  };
}

export default function ContactPage() {
  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '24px', fontWeight: '800' }}>Contact Us</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.1rem' }}>
        We would love to hear from you. Whether you have a question about a tool, want to report a bug, 
        or have a feature request, feel free to reach out.
      </p>

      <div style={{ 
        background: 'var(--bg-white)', 
        border: '1px solid var(--border-light)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '40px',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'var(--brand-light)', 
          color: 'var(--brand-color)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2rem',
          margin: '0 auto 24px'
        }}>
          ✉️
        </div>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Email Us Directly</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          For all inquiries, support requests, and feedback, please send us an email. 
          We strive to respond to all messages within 24-48 hours.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="mailto:Contact@ilovetexts.com" 
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '16px 32px', borderRadius: 'var(--radius-full)' }}
          >
            Contact@ilovetexts.com
          </a>

          <a 
            href="mailto:harshraj0235@gmail.com" 
            className="btn btn-secondary"
            style={{ fontSize: '1.1rem', padding: '16px 32px', borderRadius: 'var(--radius-full)' }}
          >
            harshraj0235@gmail.com
          </a>
        </div>
      </div>

      <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Bug Reports</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Include steps to reproduce the issue and your browser version.</p>
        </div>
        
        <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Feature Requests</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Have an idea for a new tool? We're always adding to our toolkit.</p>
        </div>
        
        <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Business Inquiries</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>For partnerships or other business-related matters.</p>
        </div>
      </div>
    </div>
  );
}
