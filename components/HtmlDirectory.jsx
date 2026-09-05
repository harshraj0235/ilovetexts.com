import Link from 'next/link';

export default function HtmlDirectory({ categories, lang }) {
  const lp = (path) => (lang === 'en' ? path : `/${lang}${path}`);

  return (
    <section
      className="container"
      style={{
        paddingBottom: '100px',
        borderTop: '1px solid var(--border-light)',
        paddingTop: '64px',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 800px',
      }}
    >
      <h2 style={{ marginBottom: '32px', textAlign: 'center', fontSize: '2rem' }}>Browse All Tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="directory-category">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: cat.color, borderBottom: '2px solid var(--border-light)', paddingBottom: '8px' }}>
              <span role="img" aria-hidden="true">{cat.icon}</span> {cat.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: '1.4' }}>
              {cat.description || `Browse our collection of free ${cat.name.toLowerCase()} tools.`}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={lp(`/${cat.id}/${tool.slug}`)}
                    prefetch={false}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', padding: '4px 0', transition: 'color 0.2s ease', fontSize: '0.95rem' }}
                    className="hover-text-primary"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
