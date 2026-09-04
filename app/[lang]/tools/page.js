// ═══════════════════════════════════════════════════════
// /tools — All Tools Directory
// Lists all 191+ tools alphabetically with search filter.
// Targets: "all text tools online", "list of online text tools",
//          "free online tools directory"
// Massive internal linking hub — every tool page linked from here.
// ═══════════════════════════════════════════════════════
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
    description: `Browse all ${allTools.length}+ free online text tools on ilovetexts.com. Sorted A–Z by category: text case converters, word counters, PDF editors, JSON formatters, grammar checkers, and more. No signup, 100% private.`,
    keywords: `all text tools online free, list of online text tools, free online tools directory, text processing tools, online utilities free no signup, best free text tools 2026`,
    alternates,
    openGraph: {
      title: `All ${allTools.length}+ Free Online Text Tools`,
      description: `Complete directory of every free tool on ilovetexts.com — sorted alphabetically by category.`,
      url: buildCanonical(lang, path),
      type: 'website',
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1 } },
  };
}

export default async function AllToolsPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const allTools = getAllTools(lang);

  // Group by category, sort categories A-Z
  const byCategory = {};
  for (const tool of allTools) {
    const catName = tool.categoryName || tool.categoryId;
    if (!byCategory[catName]) byCategory[catName] = { name: catName, icon: tool.categoryIcon, id: tool.categoryId, tools: [] };
    byCategory[catName].tools.push(tool);
  }
  const sortedCats = Object.values(byCategory).sort((a, b) => a.name.localeCompare(b.name));

  // A-Z index of all tools flat-sorted
  const allSorted = [...allTools].sort((a, b) => a.name.localeCompare(b.name));
  const letters = [...new Set(allSorted.map(t => t.name[0].toUpperCase()))].sort();

  // JSON-LD ItemList — all tools
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `All Free Online Text Tools — ilovetexts.com`,
    description: `Complete directory of ${allTools.length}+ free browser-based text processing tools`,
    numberOfItems: allTools.length,
    itemListElement: allSorted.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `${SITE.url}/${tool.categoryId}/${tool.slug}`,
      description: tool.description,
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'All Tools', item: `${SITE.url}/tools` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="container" style={{ padding: '60px 24px', maxWidth: '1100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <nav style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
            <Link href={lp('/')} style={{ color: 'var(--text-tertiary)' }}>Home</Link>
            <span style={{ margin: '0 6px' }}>/</span>
            <span>All Tools</span>
          </nav>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>
            🔧 All {allTools.length}+ Free Online Tools
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 680 }}>
            Every free tool on ilovetexts.com — {CATEGORIES.length} categories, all 100% browser-based.
            No signup, no file uploads, no limits. Updated {new Date(BUILD_DATE).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
          </p>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
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
        </div>

        {/* A-Z Jump bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '36px', padding: '14px 18px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: 4 }}>Jump:</span>
          {letters.map(letter => (
            <a key={letter} href={`#letter-${letter}`} style={{
              width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700,
              background: 'var(--bg-main)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', textDecoration: 'none',
              transition: 'all 0.15s',
            }}>{letter}</a>
          ))}
        </div>

        {/* ── A-Z Section ── */}
        <div style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>A–Z Tool Index</h2>
          {letters.map(letter => {
            const toolsForLetter = allSorted.filter(t => t.name[0].toUpperCase() === letter);
            return (
              <div key={letter} id={`letter-${letter}`} style={{ marginBottom: '28px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--accent), var(--brand-color,#6366f1))',
                  color: '#fff', fontWeight: 800, fontSize: '1rem',
                  marginBottom: '12px', boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>{letter}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                  {toolsForLetter.map(tool => (
                    <Link
                      key={`${tool.categoryId}-${tool.slug}`}
                      href={lp(`/${tool.categoryId}/${tool.slug}`)}
                      prefetch={false}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{tool.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.categoryName}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── By Category Section ── */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>Browse by Category</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sortedCats.map(cat => (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                  <Link href={lp(`/${cat.id}`)} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {cat.name}
                  </Link>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', padding: '2px 8px', background: 'var(--bg-section)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    {cat.tools.length} tools
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                  {cat.tools.map(tool => (
                    <Link
                      key={tool.slug}
                      href={lp(`/${cat.id}/${tool.slug}`)}
                      prefetch={false}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--bg-section)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{tool.icon}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '56px', padding: '32px', background: 'linear-gradient(135deg,var(--accent,#6366f1)15%,#8b5cf6)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
            Can&apos;t find what you need?
          </h2>
          <p style={{ opacity: 0.88, marginBottom: '20px', fontSize: '0.95rem' }}>
            Suggest a new tool via our contact page — we build tools based on user requests.
          </p>
          <Link href={lp('/contact')} style={{ display: 'inline-block', padding: '11px 28px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            Suggest a Tool →
          </Link>
        </div>
      </div>
    </>
  );
}
