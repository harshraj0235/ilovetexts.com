'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getAllTools } from '@/lib/tools-config';
import styles from './CommandCenter.module.css';

const FEATURED_TOOL_SLUGS = [
  'word-counter',
  'grammar-checker',
  'pdf-to-word',
  'resume-builder',
  'image-compressor',
  'json-formatter',
];

const QUICK_SEARCHES = [
  { label: 'Improve my writing', query: 'grammar' },
  { label: 'Edit a PDF', query: 'pdf' },
  { label: 'Work with images', query: 'image' },
  { label: 'Build a resume', query: 'resume' },
];

const SEARCH_ALIASES = {
  cv: 'resume',
  photo: 'image',
  jpeg: 'image',
  jpg: 'image',
  document: 'pdf',
  spelling: 'grammar',
  essay: 'writing',
  money: 'finance',
  tax: 'gst',
  legal: 'contract',
};

const STOP_WORDS = new Set(['a', 'an', 'and', 'for', 'from', 'i', 'in', 'into', 'my', 'need', 'of', 'on', 'please', 'the', 'to', 'turn', 'with']);

function getSearchTerms(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const expanded = SEARCH_ALIASES[normalized] || normalized;

  return [...new Set(expanded.split(/\s+/).filter(term => term && !STOP_WORDS.has(term)))];
}

function scoreTool(tool, terms, normalizedQuery) {
  const name = tool.name.toLowerCase();
  const category = tool.categoryName.toLowerCase();
  const description = tool.description.toLowerCase();
  const keywords = (tool.keywords || '').toLowerCase();
  const slug = tool.slug.replace(/-/g, ' ').toLowerCase();
  const searchable = `${name} ${category} ${description} ${keywords} ${slug}`;

  if (!terms.every(term => searchable.includes(term))) return 0;

  let score = 0;
  if (name === normalizedQuery || slug === normalizedQuery) score += 120;
  if (name.startsWith(normalizedQuery) || slug.startsWith(normalizedQuery)) score += 70;
  if (name.includes(normalizedQuery) || slug.includes(normalizedQuery)) score += 45;

  terms.forEach(term => {
    if (name.includes(term)) score += 24;
    if (slug.includes(term)) score += 16;
    if (category.includes(term)) score += 12;
    if (keywords.includes(term)) score += 10;
    if (description.includes(term)) score += 4;
  });

  return score;
}

function ToolCard({ tool, href, compact = false }) {
  return (
    <Link href={href} prefetch={false} className={compact ? styles.compactToolCard : styles.toolCard}>
      <span className={styles.toolIcon} role="img" aria-hidden="true">{tool.icon}</span>
      <span className={styles.toolCardContent}>
        <span className={styles.toolName}>{tool.name}</span>
        <span className={styles.toolDescription}>{tool.description}</span>
        {!compact && <span className={styles.toolCategory}>{tool.categoryName}</span>}
      </span>
      <span className={styles.cardArrow} aria-hidden="true">→</span>
    </Link>
  );
}

export default function CommandCenter({ categories, lang, t }) {
  const allTools = useMemo(() => getAllTools(lang), [lang]);
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const langLink = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const toolCount = allTools.length;
  const normalizedQuery = query.trim().toLowerCase();
  const searchTerms = useMemo(() => getSearchTerms(query), [query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedQuery = params.get('q');
    if (sharedQuery) {
      setQuery(sharedQuery);
      setHasSearched(true);
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      );

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerms.length) return [];

    return allTools
      .map(tool => ({ tool, score: scoreTool(tool, searchTerms, normalizedQuery) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .map(result => result.tool);
  }, [allTools, normalizedQuery, searchTerms]);

  const featuredTools = useMemo(() => {
    const featured = FEATURED_TOOL_SLUGS
      .map(slug => allTools.find(tool => tool.slug === slug))
      .filter(Boolean);
    return featured.length ? featured : allTools.slice(0, 6);
  }, [allTools]);

  const submitSearch = (event) => {
    event.preventDefault();
    setHasSearched(Boolean(normalizedQuery));
    if (normalizedQuery) {
      window.history.replaceState(null, '', `${window.location.pathname}?q=${encodeURIComponent(query.trim())}#tool-results`);
    }
  };

  const chooseQuickSearch = (nextQuery) => {
    setQuery(nextQuery);
    setHasSearched(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const clearSearch = () => {
    setQuery('');
    setHasSearched(false);
    window.history.replaceState(null, '', window.location.pathname);
    searchInputRef.current?.focus();
  };

  const showResults = Boolean(normalizedQuery) && hasSearched;

  return (
    <>
      <section className={styles.hero} aria-labelledby="tool-finder-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true">✦</span> {toolCount}+ free tools, made for real work
          </p>
          <h1 id="tool-finder-title" className={styles.title}>
            {t.home.heroTitle || 'Every text tool you need,'}{' '}
            <span>{t.home.heroTitleHighlight || 'in one free website.'}</span>
          </h1>
          <p className={styles.subtitle}>
            {lang === 'en' ? 'Find a free tool for the small jobs in your day. Need a guided, multi-step task? Switch to Workflows whenever you’re ready.' : t.home.heroDesc}
          </p>

          <form className={styles.searchForm} onSubmit={submitSearch} role="search">
            <label className={styles.srOnly} htmlFor="tool-search">Find the right tool</label>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input
              ref={searchInputRef}
              id="tool-search"
              type="search"
              className={styles.searchInput}
              placeholder="What would you like to do? Try “convert PDF to Word”"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHasSearched(true);
              }}
              onFocus={() => query && setHasSearched(true)}
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button type="button" className={styles.clearButton} onClick={clearSearch} aria-label="Clear search">
                Clear
              </button>
            )}
            <button className={styles.searchButton} type="submit">Find a tool</button>
            <span className={styles.shortcutHint} aria-hidden="true">Ctrl K</span>
          </form>

          <div className={styles.quickSearches} aria-label="Popular searches">
            <span>Popular:</span>
            {QUICK_SEARCHES.map(item => (
              <button key={item.query} type="button" onClick={() => chooseQuickSearch(item.query)}>
                {item.label}
              </button>
            ))}
          </div>

          <ul className={styles.trustLine} aria-label="Our promises">
            <li><span aria-hidden="true">✓</span> No account needed</li>
            <li><span aria-hidden="true">✓</span> Works on any device</li>
            <li><span aria-hidden="true">✓</span> Free tools stay free</li>
          </ul>
        </div>
      </section>

      <section id="tool-results" className={`container ${styles.toolFinder}`} aria-live="polite">
        {showResults ? (
          <>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Tool matches</p>
                <h2>{searchResults.length ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for “${query.trim()}”` : 'We could not find a close match'}</h2>
              </div>
              <button type="button" className={styles.textButton} onClick={clearSearch}>Show popular tools</button>
            </div>

            {searchResults.length ? (
              <div className={styles.resultsGrid}>
                {searchResults.map(tool => (
                  <ToolCard key={`${tool.categoryId}-${tool.slug}`} tool={tool} href={langLink(`/${tool.categoryId}/${tool.slug}`)} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon} aria-hidden="true">✦</span>
                <h3>Try a simpler word or browse by category.</h3>
                <p>For example, search “PDF”, “word count”, “image”, “resume”, or “grammar”.</p>
                <Link href={langLink('/tools')} className={styles.secondaryButton}>Browse every tool <span aria-hidden="true">→</span></Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>A helpful place to begin</p>
                <h2>Make today&apos;s task a little easier.</h2>
              </div>
              <Link href={langLink('/tools')} className={styles.allToolsLink}>View all {toolCount} tools <span aria-hidden="true">→</span></Link>
            </div>
            <div className={styles.featuredGrid}>
              {featuredTools.map(tool => (
                <ToolCard key={`${tool.categoryId}-${tool.slug}`} tool={tool} href={langLink(`/${tool.categoryId}/${tool.slug}`)} compact />
              ))}
            </div>

            <div className={styles.categoryStrip}>
              <div>
                <p className={styles.kicker}>Explore your way</p>
                <h2>Choose a category</h2>
              </div>
              <div className={styles.categoryLinks}>
                {categories.slice(0, 6).map(category => (
                  <Link key={category.id} href={langLink(`/${category.id}`)}>
                    <span aria-hidden="true">{category.icon}</span> {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
