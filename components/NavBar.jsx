'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar({ lang, allCategoriesJson }) {
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const allCategories = JSON.parse(allCategoriesJson || '[]');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    let newPath = pathname;
    if (lang !== 'en' && pathname.startsWith(`/${lang}`)) {
      newPath = pathname.replace(`/${lang}`, '');
    }
    if (newPath === '') newPath = '/';
    
    if (newLang === 'en') {
      window.location.href = newPath;
    } else {
      window.location.href = `/${newLang}${newPath === '/' ? '' : newPath}`;
    }
  };

  return (
    <>
      <header className="nav-header">
        <div className="container nav-inner">
          <Link href={lp('/')} className="nav-brand">
            <span className="nav-brand-icon">❤️</span> ilovetexts
          </Link>
          
          <div className="nav-actions">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', fontSize: '0.9rem', pointerEvents: 'none' }}>🌐</span>
              <select 
                value={lang} 
                onChange={handleLanguageChange}
                className="lang-switcher"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="hi">हिन्दी</option>
                <option value="pt">Português</option>
                <option value="de">Deutsch</option>
                <option value="id">Indonesia</option>
              </select>
              <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>▼</span>
            </div>
            <button onClick={toggleTheme} aria-label="Toggle Theme" style={{ fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ fontSize: '1.2rem', display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar overlay - Always in DOM for SEO, hidden via CSS */}
      <div 
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className="mobile-sidebar-content"
          onClick={e => e.stopPropagation()}
        >
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Menu</h3>
            {allCategories.map(cat => (
              <div key={cat.id} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {cat.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cat.tools.map(tool => (
                    <Link 
                      key={tool.slug}
                      href={lp(`/${cat.id}/${tool.slug}`)}
                      style={{ padding: '6px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Add inline CSS for mobile menu btn display and lang switcher */}
      <style jsx>{`
        .lang-switcher {
          appearance: none;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-light);
          padding: 6px 28px 6px 32px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
        }
        .lang-switcher:hover, .lang-switcher:focus {
          border-color: var(--border-strong);
          background: var(--bg-white);
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 899px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
        .mobile-sidebar-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg-glass);
          backdrop-filter: blur(4px);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .mobile-sidebar-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .mobile-sidebar-content {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: var(--bg-main);
          padding: 24px;
          overflow-y: auto;
          border-right: 1px solid var(--border-light);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .mobile-sidebar-overlay.open .mobile-sidebar-content {
          transform: translateX(0);
        }
      `}</style>
    </>
  );
}
