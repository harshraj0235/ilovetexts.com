import Link from 'next/link';
import { CATEGORIES } from '@/lib/tools-config';

export default function Footer({ lang, allToolsCount }) {
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  return (
    <footer className="app-footer">
      <div className="container" style={{ paddingTop: '64px', paddingBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>❤️ ilovetexts.com</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Free online text tools, formatters, and generators. 100% private. Your text never leaves your browser.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Top Categories</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.id}>
                  <Link href={lp(`/${cat.id}`)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>More Categories</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CATEGORIES.slice(5, 10).map(cat => (
                <li key={cat.id}>
                  <Link href={lp(`/${cat.id}`)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href={lp('/about')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">About Us</Link></li>
              <li><Link href={lp('/privacy')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Privacy Policy</Link></li>
              <li><Link href={lp('/terms')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Terms of Service</Link></li>
              <li><Link href={lp('/blog')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Blog</Link></li>
              <li><Link href={lp('/contact')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-inner" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="footer-copyright" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} ilovetexts.com — {allToolsCount}+ Tools for Text.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href={lp('/privacy')} style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">Privacy</Link>
            <Link href={lp('/terms')} style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
