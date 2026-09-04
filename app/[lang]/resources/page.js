import Link from 'next/link';
import { SITE } from '@/lib/tools-config';
import { generateAlternates } from '@/lib/seo';
import { buildCanonical } from '@/lib/i18n';

const BUILD_DATE = '2026-09-04';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const path = '/resources';
  const alternates = generateAlternates(lang, path);
  if (lang !== 'en') alternates.canonical = buildCanonical('en', path);
  return {
    title: 'Free Cheat Sheets & Reference Guides — Download PDF | ilovetexts',
    description: 'Free printable cheat sheets for Regex, Markdown, JSON, Keyboard Shortcuts, Base64 encoding, and Text Cases. Press Ctrl+P to save as PDF — no login required.',
    keywords: 'regex cheat sheet free pdf, markdown cheat sheet, json cheat sheet, keyboard shortcuts cheat sheet, base64 encoding reference, text case formats',
    alternates,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1 } },
  };
}

const SHEETS = [
  {
    id: 'regex', icon: '🔍', title: 'Regex Cheat Sheet', color: '#6366f1',
    toolLink: { href: '/text-extractor/regex-tester', name: 'Regex Tester' },
    tags: ['Developer', 'Regex'],
    sections: [
      { heading: 'Anchors', rows: [['^ — start of string'], ['$ — end of string'], ['\\b — word boundary'], ['\\B — non-word boundary']] },
      { heading: 'Character Classes', rows: [['. — any char except newline'], ['\\d — digit (0-9)'], ['\\w — word char (a-z A-Z 0-9 _)'], ['\\s — whitespace'], ['[abc] — char class'], ['[^abc] — negated class'], ['[a-z] — range']] },
      { heading: 'Quantifiers', rows: [['* — 0 or more'], ['+ — 1 or more'], ['? — 0 or 1'], ['{n} — exactly n'], ['{n,m} — n to m'], ['*? +? — lazy versions']] },
      { heading: 'Groups', rows: [['(abc) — capturing group'], ['(?:abc) — non-capturing'], ['a|b — alternation'], ['(?=abc) — lookahead'], ['(?!abc) — neg. lookahead']] },
      { heading: 'Common Patterns', rows: [['Email: [\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}'], ['URL: https?://[^\\s]+'], ['Date: \\d{4}-\\d{2}-\\d{2}'], ['Phone: \\(?\\d{3}\\)?[-.\\s]\\d{3}[-.\\s]\\d{4}'], ['Hex: #[0-9a-fA-F]{3,6}']] },
    ],
  },
  {
    id: 'markdown', icon: '📝', title: 'Markdown Cheat Sheet', color: '#0070F3',
    toolLink: { href: '/productivity-tools/online-notepad', name: 'Online Notepad' },
    tags: ['Writing', 'Markdown'],
    sections: [
      { heading: 'Headings', rows: [['# H1  ## H2  ### H3  #### H4']] },
      { heading: 'Text Formatting', rows: [['**bold**  *italic*  ~~strike~~'], ['`inline code`  > blockquote'], ['--- horizontal rule']] },
      { heading: 'Lists', rows: [['- item (unordered)'], ['1. item (ordered)'], ['  - nested (2 spaces)'], ['- [x] checked task  - [ ] unchecked']] },
      { heading: 'Links & Images', rows: [['[text](url)  [text](url "title")'], ['![alt](src)  <url> auto-link']] },
      { heading: 'Code & Tables', rows: [['``` lang  (fenced code block)'], ['| H1 | H2 |  |---|---|  | v1 | v2 |']] },
    ],
  },
  {
    id: 'json', icon: '{}', title: 'JSON Cheat Sheet', color: '#f59e0b',
    toolLink: { href: '/code-formatter/json-formatter', name: 'JSON Formatter' },
    tags: ['Developer', 'JSON'],
    sections: [
      { heading: 'Data Types', rows: [['String: "hello world"'], ['Number: 42 or 3.14'], ['Boolean: true / false'], ['Null: null'], ['Array: [1, 2, 3]'], ['Object: {"key": "value"}']] },
      { heading: 'Syntax Rules', rows: [['Keys must be double-quoted strings'], ['No trailing commas allowed'], ['No comments allowed'], ['No Infinity or NaN values']] },
      { heading: 'JS Methods', rows: [['JSON.parse(str) → JS object'], ['JSON.stringify(obj) → string'], ['JSON.stringify(obj, null, 2) → pretty'], ['structuredClone(obj) → deep clone']] },
    ],
  },
  {
    id: 'keyboard', icon: '⌨️', title: 'ilovetexts Keyboard Shortcuts', color: '#10b981',
    toolLink: { href: '/word-counting-tools/word-counter', name: 'Word Counter' },
    tags: ['Productivity'],
    sections: [
      { heading: 'Universal Shortcuts', rows: [['Ctrl+Enter — copy result'], ['Ctrl+Shift+C — clear text'], ['Ctrl+S — download / export'], ['Ctrl+H — find & replace'], ['Ctrl+Z — undo  Ctrl+Y — redo'], ['Escape — close modal']] },
      { heading: 'PDF Editor', rows: [['1 — Edit Text tab  2 — Annotate'], ['3 — Draw tab  4 — Sign tab'], ['Ctrl+S — open Export dialog'], ['Ctrl+Shift+S — save text changes']] },
      { heading: 'Online Notepad', rows: [['Ctrl+S — download as TXT'], ['Ctrl+F — find & replace'], ['+ tab button — add new tab'], ['Double-click tab — rename it']] },
    ],
  },
  {
    id: 'base64', icon: '🔐', title: 'Base64 & URL Encoding Reference', color: '#8b5cf6',
    toolLink: { href: '/text-encoder-decoder/base64-encode-decode', name: 'Base64 Encoder' },
    tags: ['Developer', 'Encoding'],
    sections: [
      { heading: 'Base64 Rules', rows: [['Alphabet: A–Z + a–z + 0–9 + + /'], ['Padding: = or == when len % 3 ≠ 0'], ['Size: ceil(n/3) × 4 chars'], ['Example: "Hello" → "SGVsbG8="']] },
      { heading: 'JavaScript', rows: [['btoa("Hello") → "SGVsbG8="'], ['atob("SGVsbG8=") → "Hello"'], ['Buffer.from(s).toString("base64") Node'], ['Buffer.from(b64,"base64").toString() Node']] },
      { heading: 'URL Encoding', rows: [['Space → %20  & → %26  = → %3D'], ['+ → %2B  / → %2F  ? → %3F'], ['# → %23  @ → %40']] },
      { heading: 'Use Cases', rows: [['Data URLs: data:image/png;base64,...'], ['Basic Auth: base64(user:pass)'], ['JWT: Header.Payload.Signature'], ['Email MIME attachments']] },
    ],
  },
  {
    id: 'text-cases', icon: '✏️', title: 'Text Case Formats Reference', color: '#ef4444',
    toolLink: { href: '/text-case-converter/camel-case', name: 'Text Case Converter' },
    tags: ['Writing', 'Developer'],
    sections: [
      { heading: 'All Case Formats', rows: [['UPPERCASE — HELLO WORLD'], ['lowercase — hello world'], ['Title Case — Hello World'], ['Sentence case — Hello world'], ['camelCase — helloWorld'], ['PascalCase — HelloWorld'], ['snake_case — hello_world'], ['SCREAMING_SNAKE — HELLO_WORLD'], ['kebab-case — hello-world']] },
      { heading: 'When to Use', rows: [['JS variables — camelCase'], ['JS classes / React — PascalCase'], ['CSS classes — kebab-case'], ['Python vars — snake_case'], ['Env variables — SCREAMING_SNAKE'], ['URL slugs — kebab-case'], ['SQL columns — snake_case']] },
    ],
  },
];

export default async function ResourcesPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free Developer & Writing Cheat Sheets — ilovetexts.com',
    numberOfItems: SHEETS.length,
    dateModified: BUILD_DATE,
    itemListElement: SHEETS.map((s, i) => ({
      '@type': 'ListItem', position: i + 1,
      name: s.title, url: `${SITE.url}/resources#${s.id}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <div className="container" style={{ padding: '60px 24px', maxWidth: '1000px' }}>

        {/* Hero */}
        <nav style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          <Link href={lp('/')} style={{ color: 'var(--text-tertiary)' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span>Free Resources</span>
        </nav>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px' }}>📚 Free Cheat Sheets</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 640, marginBottom: '18px' }}>
          {SHEETS.length} printable reference guides for developers and writers.
          Press <kbd style={{ padding: '1px 6px', background: 'var(--bg-section)', border: '1px solid var(--border-light)', borderRadius: 4, fontSize: '0.8rem' }}>Ctrl+P</kbd> on any sheet to save as PDF — no login, no download button.
        </p>

        {/* Jump links */}
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '36px' }}>
          {SHEETS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{ padding: '5px 12px', borderRadius: 20, background: `${s.color}15`, border: `1px solid ${s.color}40`, color: s.color, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              {s.icon} {s.title.split(' ').slice(0, 2).join(' ')}
            </a>
          ))}
        </div>

        {/* How to print tip */}
        <div style={{ padding: '14px 18px', marginBottom: '32px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>To download as PDF:</strong> Click <strong>🖨️ Print</strong> on any sheet, or press Ctrl+P → set destination to <strong>Save as PDF</strong> → Margins: Minimal.
          </div>
        </div>

        {/* Sheets */}
        {SHEETS.map(sheet => (
          <article key={sheet.id} id={sheet.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '36px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ background: sheet.color, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{sheet.icon}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{sheet.title}</h2>
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {sheet.tags.map(t => <span key={t} style={{ padding: '1px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>{t}</span>)}
                </div>
              </div>
              <button onClick={() => window.print()}
                style={{ padding: '6px 13px', background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 7, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.77rem', flexShrink: 0 }}>
                🖨️ Print
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '18px 22px', background: 'var(--bg-main)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                {sheet.sections.map((sec, si) => (
                  <div key={si}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: sheet.color, marginBottom: '8px', paddingBottom: '5px', borderBottom: `2px solid ${sheet.color}25` }}>{sec.heading}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sec.rows.map((row, ri) => (
                        <div key={ri} style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', padding: '3px 6px', background: 'var(--bg-section)', borderRadius: 4, fontFamily: row[0].includes('→') || row[0].match(/^[\\[(]|^[A-Z]/) ? 'monospace' : 'inherit', lineHeight: 1.5 }}>
                          {row[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Related tool */}
              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem' }}>🔧</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Try it live:</span>
                <Link href={lp(sheet.toolLink.href)} style={{ fontSize: '0.83rem', fontWeight: 700, color: sheet.color, textDecoration: 'none' }}>{sheet.toolLink.name} →</Link>
              </div>
            </div>
          </article>
        ))}

        {/* CTA */}
        <div style={{ marginTop: '16px', padding: '28px', textAlign: 'center', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Want more cheat sheets?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', fontSize: '0.9rem' }}>We add new guides regularly. Suggest a topic.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={lp('/tools')} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>🔧 All Tools</Link>
            <Link href={lp('/blog')} style={{ padding: '9px 20px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>📖 Blog</Link>
          </div>
        </div>
      </div>
      <style>{`@media print { nav,[class*="share"],[class*="navbar"],[class*="footer"],[class*="sidebar"],button{display:none!important} article{page-break-after:always;border:none!important;box-shadow:none!important} }`}</style>
    </>
  );
}
