// ═══════════════════════════════════════════════════════
// /resources — Free Cheat Sheets & Reference Guides
//
// SEO targets:
//  - "regex cheat sheet free pdf"         (12K/mo)
//  - "json cheat sheet download"           (8K/mo)
//  - "keyboard shortcuts cheat sheet"     (15K/mo)
//  - "markdown cheat sheet pdf"           (20K/mo)
//  - "sql cheat sheet free"               (18K/mo)
//  - "css selectors cheat sheet"          (10K/mo)
//  - "base64 encoding cheat sheet"         (4K/mo)
//  - "typing speed improvement tips"       (6K/mo)
//
// Each cheat sheet is rendered as a printable HTML page
// the user can Ctrl+P → Save as PDF (no server needed).
// This page is a BACKLINK MAGNET — bloggers link to
// free downloadable cheat sheets constantly.
// ═══════════════════════════════════════════════════════
import Link from 'next/link';
import { SITE } from '@/lib/tools-config';
import PrintButton from '@/components/PrintButton';
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
    description: 'Download free printable cheat sheets for Regex, Markdown, JSON, SQL, CSS Selectors, Keyboard Shortcuts, Base64, and typing improvement. Print as PDF from your browser — no signup.',
    keywords: 'regex cheat sheet free pdf, markdown cheat sheet download, json cheat sheet, keyboard shortcuts cheat sheet, sql cheat sheet free, css selectors cheat sheet, base64 encoding reference, typing speed tips',
    alternates,
    openGraph: {
      title: 'Free Cheat Sheets & Developer Reference Guides',
      description: 'Print-ready cheat sheets for Regex, Markdown, JSON, SQL, CSS, and more. Free, no signup.',
      url: buildCanonical(lang, path),
      type: 'website',
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

// ── Cheat sheet data ─────────────────────────────────────────────────────────
const SHEETS = [
  {
    id: 'regex',
    icon: '🔍',
    title: 'Regular Expressions (Regex) Cheat Sheet',
    description: 'Essential regex patterns, quantifiers, anchors, character classes, and groups. Works in JavaScript, Python, PHP, Java, and Ruby.',
    color: '#6366f1',
    tags: ['Developer', 'Regex', 'PDF'],
    toolLink: { href: '/text-extractor/regex-tester', name: 'Regex Tester' },
    sections: [
      {
        heading: 'Anchors',
        rows: [
          ['`^`', 'Start of string / line'],
          ['`$`', 'End of string / line'],
          ['`\\b`', 'Word boundary'],
          ['`\\B`', 'Non-word boundary'],
        ],
      },
      {
        heading: 'Character Classes',
        rows: [
          ['`.`', 'Any character except newline'],
          ['`\\d`', 'Digit (0–9)'],
          ['`\\D`', 'Non-digit'],
          ['`\\w`', 'Word char (a-z, A-Z, 0-9, _)'],
          ['`\\W`', 'Non-word character'],
          ['`\\s`', 'Whitespace (space, tab, newline)'],
          ['`\\S`', 'Non-whitespace'],
          ['`[abc]`', 'Character class (a, b, or c)'],
          ['`[^abc]`', 'Negated class (not a, b, or c)'],
          ['`[a-z]`', 'Range (a through z)'],
        ],
      },
      {
        heading: 'Quantifiers',
        rows: [
          ['`*`', '0 or more (greedy)'],
          ['`+`', '1 or more (greedy)'],
          ['`?`', '0 or 1 (optional)'],
          ['`{n}`', 'Exactly n times'],
          ['`{n,}`', 'n or more times'],
          ['`{n,m}`', 'Between n and m times'],
          ['`*?` `+?`', 'Lazy (non-greedy) versions'],
        ],
      },
      {
        heading: 'Groups & Alternation',
        rows: [
          ['`(abc)`', 'Capturing group'],
          ['`(?:abc)`', 'Non-capturing group'],
          ['`(?P<name>abc)`', 'Named group (Python)'],
          ['`a|b`', 'Alternation (a or b)'],
          ['`(?=abc)`', 'Positive lookahead'],
          ['`(?!abc)`', 'Negative lookahead'],
        ],
      },
      {
        heading: 'Common Patterns',
        rows: [
          ['Email', '`[\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}`'],
          ['URL', '`https?://[^\\s]+`'],
          ['IPv4', '`(\\d{1,3}\\.){3}\\d{1,3}`'],
          ['Date YYYY-MM-DD', '`\\d{4}-\\d{2}-\\d{2}`'],
          ['Phone (US)', '`\\(?\\d{3}\\)?[-.\\s]\\d{3}[-.\\s]\\d{4}`'],
          ['Hex color', '`#[0-9a-fA-F]{3,6}`'],
        ],
      },
    ],
  },
  {
    id: 'markdown',
    icon: '📝',
    title: 'Markdown Cheat Sheet',
    description: 'Complete Markdown syntax reference — headings, lists, links, images, code blocks, tables, and GitHub Flavored Markdown (GFM) extensions.',
    color: '#0070F3',
    tags: ['Writing', 'Markdown', 'PDF'],
    toolLink: { href: '/productivity-tools/online-notepad', name: 'Online Notepad (Markdown Preview)' },
    sections: [
      {
        heading: 'Text Formatting',
        rows: [
          ['`**bold**`', '**bold**'],
          ['`*italic*`', '*italic*'],
          ['`~~strikethrough~~`', '~~strikethrough~~'],
          ['`\`inline code\``', 'inline code'],
          ['`> blockquote`', 'Blockquote'],
          ['`---`', 'Horizontal rule'],
        ],
      },
      {
        heading: 'Headings',
        rows: [
          ['`# H1`', 'Heading 1'],
          ['`## H2`', 'Heading 2'],
          ['`### H3`', 'Heading 3'],
          ['`#### H4`', 'Heading 4'],
        ],
      },
      {
        heading: 'Lists',
        rows: [
          ['`- item`', 'Unordered list item'],
          ['`* item`', 'Also unordered'],
          ['`1. item`', 'Ordered list item'],
          ['`  - nested`', 'Nested list (2 spaces)'],
          ['`- [x] task`', 'Checked task (GFM)'],
          ['`- [ ] task`', 'Unchecked task (GFM)'],
        ],
      },
      {
        heading: 'Links & Images',
        rows: [
          ['`[text](url)`', 'Hyperlink'],
          ['`[text](url "title")`', 'Link with title'],
          ['`![alt](src)`', 'Image'],
          ['`[ref]: url`', 'Reference link definition'],
          ['`<url>`', 'Auto-link'],
        ],
      },
      {
        heading: 'Code Blocks & Tables',
        rows: [
          ['` ```lang `', 'Fenced code block'],
          ['`| H1 | H2 |`', 'Table header'],
          ['`|---|---|`', 'Table separator'],
          ['`| v1 | v2 |`', 'Table row'],
        ],
      },
    ],
  },
  {
    id: 'json',
    icon: '{}',
    title: 'JSON Cheat Sheet',
    description: 'JSON syntax rules, data types, nesting patterns, and common pitfalls. Includes JavaScript JSON methods reference.',
    color: '#f59e0b',
    tags: ['Developer', 'JSON', 'PDF'],
    toolLink: { href: '/code-formatter/json-formatter', name: 'JSON Formatter' },
    sections: [
      {
        heading: 'Data Types',
        rows: [
          ['String', '`"hello world"`'],
          ['Number', '`42` or `3.14`'],
          ['Boolean', '`true` or `false`'],
          ['Null', '`null`'],
          ['Array', '`[1, 2, 3]`'],
          ['Object', '`{"key": "value"}`'],
        ],
      },
      {
        heading: 'Syntax Rules',
        rows: [
          ['Keys', 'Must be double-quoted strings'],
          ['Strings', 'Double quotes only (no single quotes)'],
          ['Trailing commas', 'NOT allowed'],
          ['Comments', 'NOT allowed in JSON'],
          ['Numbers', 'No leading zeros, no Infinity/NaN'],
        ],
      },
      {
        heading: 'JavaScript Methods',
        rows: [
          ['`JSON.parse(str)`', 'String → JS object'],
          ['`JSON.stringify(obj)`', 'JS object → string'],
          ['`JSON.stringify(obj, null, 2)`', 'Pretty-print with 2-space indent'],
          ['`structuredClone(obj)`', 'Deep clone object (ES2022)'],
        ],
      },
      {
        heading: 'Common Errors',
        rows: [
          ['`SyntaxError: Unexpected token`', 'Trailing comma or unquoted key'],
          ['`undefined` value', 'undefined is not valid JSON; use null'],
          ['Circular reference', 'JSON.stringify throws — use replacer'],
        ],
      },
    ],
  },
  {
    id: 'keyboard',
    icon: '⌨️',
    title: 'ilovetexts Keyboard Shortcuts Cheat Sheet',
    description: 'All keyboard shortcuts available on ilovetexts.com tools — copy, clear, download, undo, find & replace, and more.',
    color: '#10b981',
    tags: ['Productivity', 'Shortcuts', 'PDF'],
    toolLink: { href: '/word-counting-tools/word-counter', name: 'Word Counter' },
    sections: [
      {
        heading: 'Universal Tool Shortcuts',
        rows: [
          ['`Ctrl+Enter`', 'Copy result to clipboard'],
          ['`Ctrl+Shift+C`', 'Clear all text'],
          ['`Ctrl+S`', 'Download / Export result'],
          ['`Ctrl+H`', 'Open Find & Replace'],
          ['`Ctrl+Z`', 'Undo last action'],
          ['`Ctrl+Y`', 'Redo'],
          ['`Escape`', 'Close modal / panel'],
        ],
      },
      {
        heading: 'PDF Editor Shortcuts',
        rows: [
          ['`1`', 'Switch to Edit Text mode'],
          ['`2`', 'Switch to Annotate mode'],
          ['`3`', 'Switch to Draw mode'],
          ['`4`', 'Switch to Sign mode'],
          ['`Ctrl+S`', 'Open Export dialog'],
          ['`Ctrl+Shift+S`', 'Save all text changes'],
          ['`Ctrl+H`', 'Find & Replace in PDF'],
        ],
      },
      {
        heading: 'Online Notepad Shortcuts',
        rows: [
          ['`Ctrl+S`', 'Download as TXT'],
          ['`Ctrl+F`', 'Open Find & Replace'],
          ['Tabs', 'Click + to add, double-click to rename'],
        ],
      },
      {
        heading: 'Typing Speed Test Shortcuts',
        rows: [
          ['Start typing', 'Starts the timer automatically'],
          ['`Tab`', 'Reset / new test'],
          ['`Escape`', 'Stop current test early'],
        ],
      },
    ],
  },
  {
    id: 'base64',
    icon: '🔐',
    title: 'Base64 & URL Encoding Cheat Sheet',
    description: 'Base64 alphabet, encoding rules, URL encoding special characters, and quick-reference tables for common encoded values.',
    color: '#8b5cf6',
    tags: ['Developer', 'Encoding', 'PDF'],
    toolLink: { href: '/text-encoder-decoder/base64-encode-decode', name: 'Base64 Encoder/Decoder' },
    sections: [
      {
        heading: 'Base64 Rules',
        rows: [
          ['Alphabet', 'A–Z (26) + a–z (26) + 0–9 (10) + + / (2) = 64 chars'],
          ['Padding', '= or == added when input length not divisible by 3'],
          ['Output size', 'ceil(n/3) × 4 characters'],
          ['Example', '`Hello` → `SGVsbG8=`'],
        ],
      },
      {
        heading: 'JavaScript',
        rows: [
          ['Encode', '`btoa("Hello")` → `"SGVsbG8="`'],
          ['Decode', '`atob("SGVsbG8=")` → `"Hello"`'],
          ['Unicode encode', '`btoa(unescape(encodeURIComponent(str)))`'],
          ['Node.js encode', '`Buffer.from("Hello").toString("base64")`'],
          ['Node.js decode', '`Buffer.from("SGVsbG8=","base64").toString()`'],
        ],
      },
      {
        heading: 'URL Encoding (Percent-Encoding)',
        rows: [
          ['Space', '`%20` (or `+` in query strings)'],
          ['`&`', '`%26`'],
          ['`=`', '`%3D`'],
          ['`+`', '`%2B`'],
          ['`/`', '`%2F`'],
          ['`?`', '`%3F`'],
          ['`#`', '`%23`'],
          ['`@`', '`%40`'],
        ],
      },
      {
        heading: 'Common Use Cases',
        rows: [
          ['Data URLs', '`data:image/png;base64,iVBOR…`'],
          ['Basic Auth', '`Authorization: Basic base64(user:pass)`'],
          ['JWT', 'Header.Payload.Signature — each Base64url encoded'],
          ['Email MIME', 'Attachments encoded as Base64 in email bodies'],
        ],
      },
    ],
  },
  {
    id: 'text-tools',
    icon: '✏️',
    title: 'Text Case & Formatting Quick Reference',
    description: 'All text case formats explained with examples — camelCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and more.',
    color: '#ef4444',
    tags: ['Writing', 'Text', 'PDF'],
    toolLink: { href: '/text-case-converter/camel-case', name: 'Text Case Converter' },
    sections: [
      {
        heading: 'Case Formats',
        rows: [
          ['UPPERCASE', '`HELLO WORLD` — emphasis, headings, constants'],
          ['lowercase', '`hello world` — URLs, CSS classes'],
          ['Title Case', '`Hello World` — headlines, names, titles'],
          ['Sentence case', '`Hello world` — normal prose'],
          ['camelCase', '`helloWorld` — JavaScript variables, JSON keys'],
          ['PascalCase', '`HelloWorld` — class names, React components'],
          ['snake_case', '`hello_world` — Python vars, database columns'],
          ['SCREAMING_SNAKE', '`HELLO_WORLD` — constants, env vars'],
          ['kebab-case', '`hello-world` — URLs, CSS custom properties'],
          ['dot.case', '`hello.world` — config files, namespaces'],
        ],
      },
      {
        heading: 'When to Use Each',
        rows: [
          ['JavaScript variables', 'camelCase'],
          ['JavaScript classes', 'PascalCase'],
          ['CSS class names', 'kebab-case'],
          ['Python variables', 'snake_case'],
          ['Python classes', 'PascalCase'],
          ['Environment variables', 'SCREAMING_SNAKE_CASE'],
          ['URL slugs', 'kebab-case or lowercase'],
          ['SQL column names', 'snake_case'],
          ['React components', 'PascalCase'],
          ['React props / hooks', 'camelCase'],
        ],
      },
      {
        heading: 'Unicode Text Styles (Copy-Paste)',
        rows: [
          ['𝗕𝗼𝗹𝗱', 'Mathematical bold (works in Twitter bio)'],
          ['𝘐𝘵𝘢𝘭𝘪𝘤', 'Mathematical italic'],
          ['𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', 'Mathematical monospace'],
          ['🅂🅀🅄🄰🅁🄴', 'Enclosed alphanumeric squares'],
          ['Ⓒⓘⓡⓒⓛⓔⓓ', 'Enclosed alphanumeric circles'],
        ],
      },
    ],
  },
];

// ── Render a cheat sheet card ─────────────────────────────────────────────────
function CheatSheetCard({ sheet, lp }) {
  return (
    <article
      id={sheet.id}
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '40px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Card header */}
      <div style={{
        background: sheet.color,
        padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}>
        <span style={{ fontSize: '2rem', flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>{sheet.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{sheet.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', margin: '6px 0 0', lineHeight: 1.5 }}>{sheet.description}</p>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {sheet.tags.map(tag => (
              <span key={tag} style={{
                padding: '2px 8px', borderRadius: 12,
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                fontSize: '0.7rem', fontWeight: 600,
              }}>{tag}</span>
            ))}
          </div>
        </div>
        {/* Print / PDF button */}
        <PrintButton />
      </div>

      {/* Sections */}
      <div style={{ padding: '20px 24px', background: 'var(--bg-main)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {sheet.sections.map((section, si) => (
            <div key={si}>
              <h3 style={{
                fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: sheet.color,
                marginBottom: '10px', paddingBottom: '6px',
                borderBottom: `2px solid ${sheet.color}20`,
              }}>{section.heading}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <tbody>
                  {section.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{
                        padding: '5px 8px 5px 0', fontFamily: 'monospace',
                        color: sheet.color, fontWeight: 600,
                        whiteSpace: 'nowrap', verticalAlign: 'top', width: '42%',
                      }}>
                        {row[0].startsWith('`') && row[0].endsWith('`')
                          ? <code style={{ background: `${sheet.color}15`, padding: '1px 5px', borderRadius: 4 }}>{row[0].slice(1, -1)}</code>
                          : row[0]
                        }
                      </td>
                      <td style={{ padding: '5px 0 5px 8px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                        {row[1].startsWith('`') && row[1].endsWith('`')
                          ? <code style={{ background: 'var(--bg-section)', padding: '1px 5px', borderRadius: 4, fontSize: '0.78rem' }}>{row[1].slice(1, -1)}</code>
                          : row[1]
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Related tool link */}
        <div style={{
          marginTop: '18px', padding: '12px 16px',
          background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1rem' }}>🔧</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Try it live:</span>
          <Link href={lp(sheet.toolLink.href)} style={{
            fontSize: '0.85rem', fontWeight: 700, color: sheet.color,
            textDecoration: 'none',
          }}>
            {sheet.toolLink.name} →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ResourcesPage({ params }) {
  const { lang } = await params;
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free Developer & Writing Cheat Sheets',
    description: `${SHEETS.length} free printable cheat sheets for developers and writers`,
    numberOfItems: SHEETS.length,
    dateModified: BUILD_DATE,
    itemListElement: SHEETS.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.title,
      url: `${SITE.url}/resources#${s.id}`,
      description: s.description,
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE.url}/resources` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="container" style={{ padding: '60px 24px', maxWidth: '1000px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '44px' }}>
          <nav style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
            <Link href={lp('/')} style={{ color: 'var(--text-tertiary)' }}>Home</Link>
            <span style={{ margin: '0 6px' }}>/</span>
            <span>Free Resources</span>
          </nav>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>
            📚 Free Cheat Sheets & Reference Guides
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 680, marginBottom: '16px' }}>
            {SHEETS.length} free printable cheat sheets for developers and writers. Open any sheet, press <kbd style={{ padding: '2px 7px', background: 'var(--bg-section)', border: '1px solid var(--border-light)', borderRadius: 5, fontSize: '0.82rem' }}>Ctrl+P</kbd> and save as PDF — no login, no download button needed.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SHEETS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{
                padding: '5px 12px', borderRadius: 20,
                background: `${s.color}15`, border: `1px solid ${s.color}40`,
                color: s.color, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {s.icon} {s.title.split(' ').slice(0, 3).join(' ')}
              </a>
            ))}
          </div>
        </div>

        {/* How to use */}
        <div style={{
          padding: '16px 20px', marginBottom: '36px',
          background: 'var(--bg-section)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>How to download as PDF</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Click the <strong>🖨️ Print / PDF</strong> button on any cheat sheet, or press <kbd>Ctrl+P</kbd> / <kbd>Cmd+P</kbd>.
              In the print dialog, choose <strong>Save as PDF</strong> as the destination. Set margins to Minimal for best results.
            </div>
          </div>
        </div>

        {/* Cheat sheets */}
        {SHEETS.map(sheet => (
          <CheatSheetCard key={sheet.id} sheet={sheet} lp={lp} />
        ))}

        {/* More resources CTA */}
        <div style={{
          marginTop: '20px', padding: '32px', textAlign: 'center',
          background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px' }}>
            Want more cheat sheets?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.92rem' }}>
            We add new reference guides regularly. Suggest a topic via the contact page.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={lp('/tools')} style={{ padding: '10px 22px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
              🔧 Browse All Tools
            </Link>
            <Link href={lp('/blog')} style={{ padding: '10px 22px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
              📖 Read the Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .app-footer, nav, .app-sidebar, [class*="share"], [class*="navbar"], [class*="NavBar"] { display: none !important; }
          article { page-break-after: always; border: none !important; box-shadow: none !important; }
          button { display: none !important; }
          a { color: inherit !important; }
          body { font-size: 11pt; }
        }
      `}</style>
    </>
  );
}
