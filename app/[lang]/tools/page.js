import Link from 'next/link';
import { getAllTools, CATEGORIES, SITE } from '@/lib/tools-config';
import { generateAlternates } from '@/lib/seo';
import { buildCanonical } from '@/lib/i18n';

const BUILD_DATE = '2026-09-04';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const allTools = getAllTools(lang);
  const path = '/tools';
  const alternates = generateAlternates(lang, path);
  if (lang !== 'en') alternates.canonical = buildCanonical('en', path);
  return {
    title: `All ${allTools.length}+ Free Online Text Tools — Complete Directory | ilovetexts`,
    description: `Browse all ${allTools.length}+ free online text tools on ilovetexts.com. Sorted A–Z: text case converters, word counters, PDF editors, JSON formatters, grammar checkers and more. No signup, 100% private.`,
    keywords: 'all text tools online free, list of online text tools, free online tools directory, text processing tools, online utilities free no signup',
    alternates,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1 } },
  };
}

export default async function AllToolsPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const allTools = getAllTools(lang);

  // Group by category
  const byCategory = {};
  for (const tool of allTools) {
    const id = tool.categoryId;
    if (!byCategory[id]) byCategory[id] = { name: tool.categoryName, icon: tool.categoryIcon, id, tools: [] };
    byCategory[id].tools.push(tool);
  }
  const sortedCats = Object.values(byCategory).sort((a, b) => a.name.localeCompare(b.name));
  const allSorted  = [...allTools].sort((a, b) => a.name.localeCompare(b.name));
  const letters    = [...new Set(allSorted.map(t => t.name[0].toUpperCase()))].sort();

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All Free Online Text Tools — ilovetexts.com',
    numberOfItems: allTools.length,
    dateModified: BUILD_DATE,
    itemListElement: allSorted.map((tool, i) => ({
      '@type': 'ListItem', position: i + 1,
      name: tool.name,
      url: `${SITE.url}/${tool.categoryId}/${tool.slug}`,
      description: tool.description,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <div className="container" style={{ padding: '60px 24px', maxWidth: '1100px' }}>

        {/* Hero */}
        <nav style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          <Link href={lp('/')} style={{ color: 'var(--text-tertiary)' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span>All Tools</span>
        </nav>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px' }}>
          🔧 All {allTools.length}+ Free Online Tools
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 680, marginBottom: '24px' }}>
          Every free tool on ilovetexts.com — {CATEGORIES.length} categories, 100% browser-based, no signup, no uploads.
          Updated {new Date(BUILD_DATE).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {[
            { n: allTools.length + '+', l: 'Free Tools' },
            { n: CATEGORIES.length, l: 'Categories' },
            { n: '6', l: 'Languages' },
            { n: '0', l: 'Data Uploaded' },
          ].map(s => (
            <div key={s.l} style={{ padding: '10px 18px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{s.n}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* A-Z jump bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '36px', padding: '12px 16px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: 4 }}>Jump:</span>
          {letters.map(l => (
            <a key={l} href={`#letter-${l}`} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>

        {/* A-Z index */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '24px' }}>A–Z Tool Index</h2>
        {letters.map(letter => {
          const toolsForLetter = allSorted.filter(t => t.name[0].toUpperCase() === letter);
          return (
            <div key={letter} id={`letter-${letter}`} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>{letter}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '7px' }}>
                {toolsForLetter.map(tool => (
                  <Link key={`${tool.categoryId}-${tool.slug}`} href={lp(`/${tool.categoryId}/${tool.slug}`)} prefetch={false}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 11px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{tool.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.categoryName}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* By category */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '48px 0 24px' }}>Browse by Category</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {sortedCats.map(cat => (
            <div key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                <Link href={lp(`/${cat.id}`)} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>{cat.name}</Link>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', padding: '2px 7px', background: 'var(--bg-section)', borderRadius: 10, border: '1px solid var(--border-light)' }}>{cat.tools.length} tools</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '5px' }}>
                {cat.tools.map(tool => (
                  <Link key={tool.slug} href={lp(`/${cat.id}/${tool.slug}`)} prefetch={false}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 11px', background: 'var(--bg-section)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                    <span style={{ fontSize: '0.95rem' }}>{tool.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '56px', padding: '28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Can&apos;t find what you need?</h2>
          <p style={{ opacity: 0.88, marginBottom: '18px', fontSize: '0.92rem' }}>Suggest a new tool — we build based on user requests.</p>
          <Link href={lp('/contact')} style={{ display: 'inline-block', padding: '10px 26px', background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>
            Suggest a Tool →
          </Link>
        </div>
      </div>
    </>
  );
}
