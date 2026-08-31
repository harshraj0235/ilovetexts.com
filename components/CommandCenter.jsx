'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function CommandCenter({ allTools, categories, lang, t }) {
  const [query, setQuery] = useState('');

  const langLink = (path) => lang === 'en' ? path : `/${lang}${path}`;

  // Real-time filtering
  const filteredTools = useMemo(() => {
    if (!query) return allTools.slice(0, 24); // Show top 24 by default
    
    const q = query.toLowerCase();
    return allTools.filter(tool => 
      tool.name.toLowerCase().includes(q) || 
      tool.description.toLowerCase().includes(q)
    );
  }, [query, allTools]);

  return (
    <>
      <section className="command-center">
        <h1 className="command-title">{t.home.heroTitle || 'What do you want to do with your text?'}</h1>
        <p className="command-subtitle">{t.home.heroDesc || 'Search from 100+ free online text tools, formatters, and generators.'}</p>
        
        <div className="command-search-wrapper">
          <span className="command-icon" role="img" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="command-input"
            placeholder="Type to search tools (e.g., 'Word Counter', 'JSON', 'Hash')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
            autoFocus
          />
          <span className="command-shortcut">/</span>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: '100px' }}>
        {query && <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Search Results ({filteredTools.length})</h3>}
        
        {!query && (
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ marginBottom: '24px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🔥</span> Trending: AI & Creator Tools
            </h3>
            <div className="tools-grid">
              {allTools.filter(t => ['pii-redactor', 'prompt-minifier', 'caption-formatter', 'json-to-markdown'].includes(t.slug)).map(tool => (
                <Link 
                  key={tool.slug} 
                  href={langLink(`/${tool.categoryId}/${tool.slug}`)} 
                  className="tool-card"
                  style={{ border: '1px solid #ef4444', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)' }}
                >
                  <div className="tool-card-icon" role="img" aria-hidden="true">{tool.icon}</div>
                  <div className="tool-card-content">
                    <h3>{tool.name}</h3>
                    <p>{tool.description.length > 60 ? tool.description.substring(0, 60) + '...' : tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!query && <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>All Free Tools</h3>}
        
        {filteredTools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-tertiary)' }}>
            No tools found matching "{query}". Try a different keyword.
          </div>
        ) : (
          <div className="tools-grid">
            {filteredTools.map(tool => (
              <Link 
                key={tool.slug} 
                href={langLink(`/${tool.categoryId}/${tool.slug}`)} 
                className="tool-card"
              >
                <div className="tool-card-icon" role="img" aria-hidden="true">{tool.icon}</div>
                <div className="tool-card-content">
                  <h3>{tool.name}</h3>
                  <p>{tool.description.length > 60 ? tool.description.substring(0, 60) + '...' : tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
