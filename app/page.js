import Link from 'next/link';
import Script from 'next/script';
import { CATEGORIES, SITE, getAllTools } from '@/lib/tools-config';
import { generateWebSiteSchema, generateOrganizationSchema, generateFAQSchema } from '@/lib/seo';

export const metadata = {
  title: `${SITE.name} — 107+ Free Online Text Tools: Convert Case, Count Words, Format JSON & More`,
  description: 'ilovetexts offers 107+ free online text tools. Convert case, count words, format JSON, encode Base64, generate passwords, hash text with SHA-256, and more. All processing happens 100% in your browser — fast, private, no signup required.',
  keywords: 'free online text tools, text converter online, word counter, case converter, JSON formatter, Base64 encoder decoder, password generator, SHA-256 hash generator, text cleaner, online text editor, word count tool, character counter, text case converter, kebab case, camelCase converter, URL slug generator, regex tester online',
};

// Map category IDs to unique colors
const categoryColors = {
  'text-case-converter': { bg: '#E74C3C', light: '#FDEDEC' },
  'word-counter': { bg: '#3498DB', light: '#EBF5FB' },
  'text-cleaner': { bg: '#2ECC71', light: '#EAFAF1' },
  'text-encoder-decoder': { bg: '#9B59B6', light: '#F4ECF7' },
  'code-formatter': { bg: '#E67E22', light: '#FDF2E9' },
  'text-converter': { bg: '#1ABC9C', light: '#E8F8F5' },
  'text-extractor': { bg: '#8E44AD', light: '#F5EEF8' },
  'generators-randomizers': { bg: '#F39C12', light: '#FEF9E7' },
  'text-hasher-cryptography': { bg: '#E74C3C', light: '#FDEDEC' },
  'list-array-tools': { bg: '#27AE60', light: '#E9F7EF' },
  'web-developer-tools': { bg: '#2980B9', light: '#D6EAF8' },
};

// Homepage FAQ
const homeFAQs = [
  { question: 'Are all text tools on ilovetexts.com really free?', answer: 'Yes, every single one of our 107+ tools is completely free — no hidden fees, no usage limits, no premium tiers, and no registration required. You can use any tool as many times as you need, forever.' },
  { question: 'Is my text data safe and private on ilovetexts.com?', answer: 'Absolutely. All text processing happens 100% in your web browser using client-side JavaScript. We never send, store, save, or log your text on any server. Your data never leaves your device.' },
  { question: 'Do I need to create an account to use the tools?', answer: 'No! No account, no registration, no sign-up of any kind is required. Simply visit any tool page and start using it immediately. We believe essential text tools should be accessible without barriers.' },
  { question: 'Do the tools work on mobile phones and tablets?', answer: 'Yes! All 107+ tools are fully responsive and work perfectly on iPhones, Android phones, iPads, and all mobile browsers. No app installation is needed — they work directly in your mobile web browser.' },
  { question: 'What kinds of text tools does ilovetexts.com offer?', answer: 'We offer 11 categories of tools: Text Case Converters, Word Counter & Analyzers, Text Cleaners, Text Encoders/Decoders, Code Formatters, Text Converters, Text Extractors, Generators & Randomizers, Hashing & Cryptography, List & Array Tools, and Web Developer Tools.' },
  { question: 'Can I use the tools offline?', answer: 'Once a tool page is loaded in your browser, the core processing functionality works even without an internet connection — since all processing is done with client-side JavaScript. However, you need internet access to initially load the page.' },
];

export default function Home() {
  const allTools = getAllTools();
  
  // Popular tools to showcase — expanded list
  const popularTools = [
    { cat: 'text-case-converter', slug: 'uppercase', color: '#E74C3C' },
    { cat: 'word-counter', slug: 'word-counter', color: '#3498DB' },
    { cat: 'code-formatter', slug: 'json-formatter', color: '#E67E22' },
    { cat: 'text-encoder-decoder', slug: 'base64-encode-decode', color: '#9B59B6' },
    { cat: 'generators-randomizers', slug: 'password-generator', color: '#F39C12' },
    { cat: 'text-hasher-cryptography', slug: 'sha256-hash', color: '#E74C3C' },
    { cat: 'text-cleaner', slug: 'remove-duplicate-lines', color: '#2ECC71' },
    { cat: 'web-developer-tools', slug: 'jwt-decoder', color: '#2980B9' },
    { cat: 'text-converter', slug: 'csv-to-json', color: '#1ABC9C' },
    { cat: 'text-extractor', slug: 'regex-tester', color: '#8E44AD' },
    { cat: 'word-counter', slug: 'character-counter', color: '#3498DB' },
    { cat: 'text-case-converter', slug: 'title-case', color: '#E74C3C' },
  ];

  // Schema markup
  const webSiteSchema = generateWebSiteSchema();
  const orgSchema = generateOrganizationSchema();
  const faqSchema = generateFAQSchema(homeFAQs);

  return (
    <>
      <Script id="schema-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <Script id="schema-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <Script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            ♥ 107+ Free Online Text Tools
          </div>
          <h1>
            Every text tool you need,<br />
            in one <span>free</span> website.
          </h1>
          <p>
            Convert case, count words, format code, encode text, generate passwords, 
            and hash strings — all instantly in your browser. No signup. No data stored. 
            100% private and free forever.
          </p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">107+</div>
              <div className="hero-stat-label">Free Tools</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">0</div>
              <div className="hero-stat-label">Data Stored</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">⚡</div>
              <div className="hero-stat-label">Instant Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — HowTo Schema-worthy section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>How ilovetexts Works — 3 Simple Steps</h2>
            <p>Process any text in under 10 seconds. No signup, no downloads.</p>
          </div>
          <div className="howto-steps" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="howto-step">
              <div className="howto-step-number" style={{ background: 'var(--brand-color)' }}>1</div>
              <h4>Pick Your Tool</h4>
              <p>Browse 107+ tools across 11 categories. Use the search bar or browse categories to find exactly what you need.</p>
            </div>
            <div className="howto-step">
              <div className="howto-step-number" style={{ background: '#3498DB' }}>2</div>
              <h4>Paste or Type Your Text</h4>
              <p>Paste text from clipboard, drag & drop a .txt file, or type directly. Processing happens instantly in real-time.</p>
            </div>
            <div className="howto-step">
              <div className="howto-step-number" style={{ background: '#2ECC71' }}>3</div>
              <h4>Copy or Download Results</h4>
              <p>Click "Copy Result" or "Download" to get your processed text. Done! Your text never left your browser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Categories Grid */}
      <section id="all-tools" className="categories-section container">
        <div className="section-header">
          <h2>All Text Tool Categories</h2>
          <p>Pick a category to explore all available tools.</p>
        </div>
        
        <div className="categories-grid">
          {CATEGORIES.map((category) => {
            const colors = categoryColors[category.id] || { bg: '#E5322D', light: '#FCE8E7' };
            return (
              <Link
                key={category.id}
                href={`/${category.id}`}
                className="category-card"
                style={{
                  '--card-color': colors.bg,
                  '--card-color-light': colors.light,
                }}
              >
                <div className="category-card-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                
                <div className="category-card-count">
                  <span>{category.tools.length} Tools</span> →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose ilovetexts for Text Processing</h2>
            <p>The most trusted free online text processing platform.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>100% Private & Secure</h3>
              <p>
                All text processing happens directly in your browser using JavaScript. We never send, 
                store, or log your data on our servers. Your privacy is guaranteed — zero tracking, zero cookies.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast Real-Time Results</h3>
              <p>
                No loading screens, no server round-trips. Get instant results 
                as you type. Process thousands of lines in milliseconds with client-side processing.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🆓</div>
              <h3>Completely Free Forever — No Limits</h3>
              <p>
                No signups, no subscriptions, no paywalls, no daily usage limits. Every single 
                one of our 107+ tools is free to use — today, tomorrow, and always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools by Use Case — targeting "for developers", "for students" etc */}
      <section className="container" style={{ padding: '64px 24px' }}>
        <div className="section-header">
          <h2>Text Tools for Every Profession</h2>
          <p>Whether you are a developer, student, writer, or marketer — we have the right tools.</p>
        </div>
        <div className="why-grid" style={{ marginTop: '32px' }}>
          <div className="why-card">
            <div className="why-card-icon">💻</div>
            <h4>For Developers</h4>
            <p><Link href="/code-formatter/json-formatter">JSON Formatter</Link>, <Link href="/web-developer-tools/jwt-decoder">JWT Decoder</Link>, <Link href="/text-extractor/regex-tester">Regex Tester</Link>, <Link href="/text-case-converter/camel-case">camelCase Converter</Link>, <Link href="/web-developer-tools/color-converter">Color Converter</Link></p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">📚</div>
            <h4>For Students</h4>
            <p><Link href="/word-counter/word-counter">Word Counter</Link>, <Link href="/word-counter/readability-score">Readability Score</Link>, <Link href="/word-counter/reading-time">Reading Time</Link>, <Link href="/text-case-converter/sentence-case">Sentence Case</Link>, <Link href="/text-cleaner/remove-duplicate-lines">Remove Duplicates</Link></p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">✍️</div>
            <h4>For Writers</h4>
            <p><Link href="/text-case-converter/title-case">Title Case</Link>, <Link href="/word-counter/word-frequency">Word Frequency</Link>, <Link href="/word-counter/keyword-density">Keyword Density</Link>, <Link href="/text-cleaner/remove-extra-spaces">Remove Spaces</Link>, <Link href="/word-counter/speaking-time">Speaking Time</Link></p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">📈</div>
            <h4>For Marketers</h4>
            <p><Link href="/word-counter/character-counter">Character Counter</Link>, <Link href="/web-developer-tools/url-slug-generator">URL Slug Generator</Link>, <Link href="/text-extractor/extract-emails">Email Extractor</Link>, <Link href="/text-converter/csv-to-json">CSV to JSON</Link>, <Link href="/word-counter/keyword-density">Keyword Density</Link></p>
          </div>
        </div>
      </section>

      {/* Popular Tools Showcase — Expanded */}
      <section className="container" style={{ padding: '64px 24px' }}>
        <div className="section-header">
          <h2>Most Popular Free Text Tools</h2>
          <p>Jump directly to the tools people use most.</p>
        </div>
        
        <div className="related-tools-grid">
          {popularTools.map(({ cat, slug, color }) => {
            const toolData = allTools.find(t => t.categoryId === cat && t.slug === slug);
            if (!toolData) return null;
            return (
              <Link
                key={slug}
                href={`/${cat}/${slug}`}
                className="related-tool-card"
              >
                <div className="related-tool-icon">{toolData.icon}</div>
                <div className="related-tool-info">
                  <h4>{toolData.name}</h4>
                  <p>{toolData.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Homepage FAQ — Boosts SEO with FAQPage schema */}
      <section className="faq-section" style={{ maxWidth: 'var(--max-width)', margin: '0 auto 64px' }}>
        <h2>Frequently Asked Questions About ilovetexts</h2>
        <div className="faq-list">
          {homeFAQs.map((faq, idx) => (
            <details key={idx} className="faq-item" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <summary style={{ padding: '20px 0', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.question}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▼</span>
              </summary>
              <div style={{ paddingBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* SEO Content Block — Expanded with keyword-rich H2 headings */}
      <section className="seo-block" style={{ background: 'var(--bg-white)' }}>
        <div className="container">
          <div className="seo-block-inner">
            <h2>The Complete Free Online Text Toolkit — ilovetexts.com</h2>
            <p>
              ilovetexts.com is the ultimate free online text processing platform, offering over 107 
              powerful tools for anyone who works with text. Whether you are a developer who needs to 
              format JSON, a student counting words for an essay, a marketer analyzing keyword density, 
              or a security professional generating SHA-256 hashes — we have the right tool for you.
            </p>

            <h3>Free Online Text Case Converter Tools</h3>
            <p>
              Convert text between <Link href="/text-case-converter/uppercase">UPPERCASE</Link>, <Link href="/text-case-converter/lowercase">lowercase</Link>, <Link href="/text-case-converter/title-case">Title Case</Link>, <Link href="/text-case-converter/sentence-case">Sentence case</Link>, <Link href="/text-case-converter/camel-case">camelCase</Link>, <Link href="/text-case-converter/snake-case">snake_case</Link>, <Link href="/text-case-converter/kebab-case">kebab-case</Link>, <Link href="/text-case-converter/constant-case">CONSTANT_CASE</Link>, and more. Perfect for developers converting variable names and writers fixing capitalization.
            </p>

            <h3>Free Word Counter & Text Analyzer</h3>
            <p>
              Count <Link href="/word-counter/word-counter">words</Link>, <Link href="/word-counter/character-counter">characters</Link>, <Link href="/word-counter/sentence-counter">sentences</Link>, and <Link href="/word-counter/paragraph-counter">paragraphs</Link> instantly. Calculate <Link href="/word-counter/reading-time">reading time</Link>, <Link href="/word-counter/speaking-time">speaking time</Link>, <Link href="/word-counter/readability-score">readability score</Link>, and <Link href="/word-counter/keyword-density">keyword density</Link> for SEO optimization.
            </p>

            <h3>Free Code Formatters & Beautifiers</h3>
            <p>
              Format and beautify <Link href="/code-formatter/json-formatter">JSON</Link>, <Link href="/code-formatter/xml-formatter">XML</Link>, <Link href="/code-formatter/sql-formatter">SQL</Link>, <Link href="/code-formatter/html-formatter">HTML</Link>, <Link href="/code-formatter/css-formatter">CSS</Link>, and <Link href="/code-formatter/js-formatter">JavaScript</Link> with proper indentation. <Link href="/code-formatter/json-validator">Validate JSON</Link> syntax and <Link href="/code-formatter/css-minifier">minify CSS</Link>/<Link href="/code-formatter/js-minifier">JS</Link> for production.
            </p>

            <h3>Free Text Encoding & Decoding Tools</h3>
            <p>
              Encode and decode <Link href="/text-encoder-decoder/base64-encode-decode">Base64</Link>, <Link href="/text-encoder-decoder/url-encode-decode">URL encoding</Link>, <Link href="/text-encoder-decoder/html-encode-decode">HTML entities</Link>, <Link href="/text-encoder-decoder/binary-text">Binary</Link>, <Link href="/text-encoder-decoder/hex-text">Hexadecimal</Link>, <Link href="/text-encoder-decoder/morse-code">Morse Code</Link>, <Link href="/text-encoder-decoder/rot13">ROT13</Link>, and more. Essential for web development and data processing.
            </p>

            <h3>Privacy-First Text Processing</h3>
            <p>
              Every tool on ilovetexts.com processes text <strong>100% in your browser</strong>. Unlike many 
              other online tools, we never upload your text to a server. This means your sensitive data — 
              passwords, personal information, source code — stays completely private. Our tools work 
              offline too once the page is loaded, making them reliable even with unstable internet connections.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
