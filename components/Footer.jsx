import Link from 'next/link';
import { CATEGORIES, SITE } from '@/lib/tools-config';

export default function Footer({ lang, allToolsCount }) {
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const BUILD_DATE = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container" style={{ paddingTop: '64px', paddingBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>❤️ ilovetexts.com</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Free online text tools, formatters, and generators. 100% private. Your text never leaves your browser.
            </p>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href={lp('/tools')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover-text-primary">
                🔧 All {allToolsCount}+ Tools
              </Link>
              <Link href={lp('/resources')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover-text-primary">
                📚 Free Cheat Sheets
              </Link>
            </div>
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
              <li><Link href={lp('/tools')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">All Tools Directory</Link></li>
              <li><Link href={lp('/resources')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Free Cheat Sheets</Link></li>
              <li><Link href={lp('/blog')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Blog &amp; Guides</Link></li>
              <li><a href="/feed.xml" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">RSS Feed</a></li>
              <li><Link href={lp('/about')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">About Us</Link></li>
              <li><Link href={lp('/contact')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Contact</Link></li>
              <li><Link href={lp('/privacy')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Privacy Policy</Link></li>
              <li><Link href={lp('/terms')} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-inner" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="footer-copyright" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            © {BUILD_DATE} ilovetexts.com — {allToolsCount}+ Free Online Tools. Built by{' '}
            <a href="https://www.linkedin.com/in/harshitpatel9/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)' }}>Harsh Raj</a>.
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Product Hunt Badge — real backlink from DR90 domain */}
            <a
              href="https://www.producthunt.com/products/ilovetexts?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-ilovetexts"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', flexShrink: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="ilovetexts - 250+ free browser-based text utilities &amp; developer tools | Product Hunt"
                width="200"
                height="43"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1236340&theme=light&t=1788539834184"
                style={{ display: 'block' }}
              />
            </a>
            <Link href={lp('/privacy')} style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">Privacy</Link>
            <Link href={lp('/terms')} style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">Terms</Link>
            {/* Sitemap link — crawl signal for Googlebot */}
            <a href="/sitemap_index.xml" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">Sitemap</a>
            <a href="https://github.com/harshraj0235/ilovetexts.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }} className="hover-text-primary">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
