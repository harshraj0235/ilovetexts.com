import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '../page';
import { SITE } from '@/lib/tools-config';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';

export async function generateStaticParams() {
  const params = [];
  for (const lang of LANG_CODES) {
    for (const post of BLOG_POSTS) {
      params.push({ lang, slug: post.slug });
    }
  }
  return params;
}

import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  const path = `/blog/${post.slug}`;
  const alternates = generateAlternates(lang, path);
  if (lang !== 'en') {
    alternates.canonical = buildCanonical('en', path);
  }

  return {
    title: `${post.title} | ${SITE.name}`,
    description: post.description,
    alternates,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: buildCanonical(lang, `/blog/${post.slug}`),
      type: 'article',
      publishedTime: post.date,
      siteName: SITE.name,
    },
  };
}

// Simple markdown-like renderer for blog content
function renderContent(content, lp) {
  const lines = content.trim().split('\n');
  const elements = [];
  let i = 0;
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeContent = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-sm)', overflow: 'auto', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-light)', margin: '16px 0' }}>
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      i++;
      continue;
    }

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (!line.match(/^\|[\s\-:|]+\|$/)) {
        tableRows.push(line.trim().split('|').filter(Boolean).map(cell => cell.trim()));
      }
      i++;
      // Check if next line is not a table
      if (i >= lines.length || !lines[i]?.trim().startsWith('|')) {
        inTable = false;
        elements.push(
          <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '16px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  {tableRows[0]?.map((cell, ci) => (
                    <th key={ci} style={{ padding: '10px 12px', background: 'var(--bg-section)', borderBottom: '2px solid var(--border-dark)', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {renderInlineMarkdown(cell, lp)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) { i++; continue; }

    // Headers
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      elements.push(<h3 key={`h3-${i}`} id={id} style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '32px', marginBottom: '12px' }}>{renderInlineMarkdown(text, lp)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      elements.push(<h2 key={`h2-${i}`} id={id} style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '40px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>{renderInlineMarkdown(text, lp)}</h2>);
    }
    // List items
    else if (trimmed.startsWith('- ')) {
      const listItems = [trimmed.slice(2)];
      while (i + 1 < lines.length && lines[i + 1]?.trim().startsWith('- ')) {
        i++;
        listItems.push(lines[i].trim().slice(2));
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: '24px', margin: '12px 0', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          {listItems.map((item, li) => (
            <li key={li}>{renderInlineMarkdown(item, lp)}</li>
          ))}
        </ul>
      );
    }
    // Arrow links (ΓåÆ)
    else if (trimmed.startsWith('ΓåÆ')) {
      elements.push(
        <div key={`cta-${i}`} style={{ margin: '16px 0', padding: '16px 20px', background: 'var(--brand-light)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--brand-color)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-color)' }}>{renderInlineMarkdown(trimmed, lp)}</p>
        </div>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={`p-${i}`} style={{ color: 'var(--text-secondary)', lineHeight: '1.8', margin: '12px 0' }}>
          {renderInlineMarkdown(trimmed, lp)}
        </p>
      );
    }

    i++;
  }

  return elements;
}

// Render inline markdown (bold, code, links)
function renderInlineMarkdown(text, lp) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Links: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find earliest match
    const matches = [
      linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index } : null,
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index } : null,
      codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index } : null,
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const earliest = matches[0];
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    if (earliest.type === 'link') {
      let href = earliest.match[2];
      if (href.startsWith('/') && lp) {
        href = lp(href);
      }
      parts.push(
        <Link key={`link-${key++}`} href={href} style={{ color: 'var(--brand-color)', fontWeight: 500 }}>
          {earliest.match[1]}
        </Link>
      );
    } else if (earliest.type === 'bold') {
      parts.push(<strong key={`b-${key++}`}>{earliest.match[1]}</strong>);
    } else if (earliest.type === 'code') {
      parts.push(
        <code key={`c-${key++}`} style={{ background: 'var(--bg-section)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.85em', fontFamily: 'var(--font-mono)' }}>
          {earliest.match[1]}
        </code>
      );
    }

    remaining = remaining.slice(earliest.index + earliest.match[0].length);
  }

  return parts;
}

export default async function BlogPostPage({ params }) {
  const { lang, slug } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  // Use a recent modified date so Google treats the page as fresh content.
  // Each comparison post is kept updated with the latest tool landscape.
  const BUILD_DATE = '2026-09-04';
  const modifiedDate = post.date > BUILD_DATE ? post.date : BUILD_DATE;
  const wordCount = post.content.trim().split(/\s+/).length;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: modifiedDate,       // freshness signal — tells Google this is current
    wordCount,
    inLanguage: lang === 'en' ? 'en-US' : lang,
    author: {
      '@type': 'Person',
      name: 'Harsh Raj',
      url: 'https://www.linkedin.com/in/harshitpatel9/',
      sameAs: ['https://www.linkedin.com/in/harshitpatel9/', 'https://github.com/harshraj0235'],
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/favicon.ico` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE.url}/blog/${post.slug}`,
    },
    image: {
      '@type': 'ImageObject',
      url: `${SITE.url}/og-image.png`,
      width: 1200,
      height: 630,
    },
    keywords: post.toolLinks?.map(t => t.name).join(', '),
    articleSection: post.category,
    url: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <>
      <Script id="schema-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <article className="container" style={{ padding: '80px 24px', maxWidth: '800px' }}>
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href={lp('/')} style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href={lp('/blog')} style={{ color: 'var(--text-muted)' }}>Blog</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{post.title}</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--brand-light)', color: 'var(--brand-color)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              {post.category}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{post.readTime} read</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              🕒 Updated <time dateTime={modifiedDate}>{new Date(modifiedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</time>
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '12px' }}>{post.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>{post.description}</p>
        </div>

        {/* Content */}
        <div className="blog-content">
          {renderContent(post.content, lp)}
        </div>

        {/* Related Tools CTA */}
        <div style={{ marginTop: '48px', padding: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>≡ƒöº Tools Mentioned in This Article</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {post.toolLinks.map((tool) => (
              <Link
                key={tool.slug}
                href={lp(`/${tool.slug}`)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                {tool.name} ΓåÆ
              </Link>
            ))}
          </div>
        </div>

        {/* More Articles */}
        <div style={{ marginTop: '48px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>More Guides</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3).map((p) => (
              <Link key={p.slug} href={lp(`/blog/${p.slug}`)} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-white)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                <span style={{ background: 'var(--brand-light)', color: 'var(--brand-color)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>{p.category}</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
