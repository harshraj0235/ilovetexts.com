'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, getAllTools } from '@/lib/tools-config';

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const megaRef = useRef(null);
  const searchRef = useRef(null);

  // Close mega menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (megaRef.current && !megaRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search tools
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const allTools = getAllTools();
    const query = q.toLowerCase();
    const results = allTools
      .filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) ||
        (t.keywords && t.keywords.toLowerCase().includes(query))
      )
      .slice(0, 8);
    setSearchResults(results);
  };

  // Show top 5 in nav bar
  const navCategories = CATEGORIES.slice(0, 5);

  return (
    <nav className="nav" role="navigation" aria-label="Main Navigation">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="ilovetexts - Home">
          <div className="nav-logo-icon">♥</div>
          <span>ilovetexts</span>
        </Link>

        {/* Desktop Search */}
        <div className="nav-search" ref={searchRef}>
          <input
            type="text"
            placeholder="Search 107+ tools..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="nav-search-input"
            aria-label="Search tools"
          />
          {searchResults.length > 0 && (
            <div className="nav-search-results">
              {searchResults.map(t => (
                <Link 
                  key={`${t.categoryId}-${t.slug}`} 
                  href={`/${t.categoryId}/${t.slug}`} 
                  className="nav-search-result"
                  onClick={() => { setSearchResults([]); setSearchQuery(''); }}
                >
                  <span className="nav-search-icon">{t.icon}</span>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          className="nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          {navCategories.map(cat => (
            <li key={cat.id}>
              <Link href={`/${cat.id}`} onClick={() => setMobileOpen(false)}>
                {cat.icon} {cat.name.split('&')[0].trim()}
              </Link>
            </li>
          ))}
          <li className="nav-mega-trigger" ref={megaRef}>
            <button 
              className="nav-mega-btn"
              onClick={() => setMegaOpen(!megaOpen)}
              aria-expanded={megaOpen}
              aria-haspopup="true"
            >
              All Categories ▾
            </button>
            {megaOpen && (
              <div className="nav-mega-menu">
                <div className="mega-menu-grid">
                  {CATEGORIES.map(cat => (
                    <Link 
                      key={cat.id} 
                      href={`/${cat.id}`} 
                      className="mega-menu-item"
                      onClick={() => { setMegaOpen(false); setMobileOpen(false); }}
                    >
                      <span className="mega-icon">{cat.icon}</span>
                      <div>
                        <strong>{cat.name}</strong>
                        <span>{cat.tools.length} tools</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
          <li>
            <Link
              href="/#all-tools"
              onClick={() => setMobileOpen(false)}
              style={{ color: 'var(--brand-color)', fontWeight: 700 }}
            >
              All Tools →
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
