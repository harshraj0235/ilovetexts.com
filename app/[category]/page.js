import { CATEGORIES, getCategory } from '@/lib/tools-config';
import { generateCategoryMeta, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    category: category.id,
  }));
}

export async function generateMetadata({ params }) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) return {};
  return generateCategoryMeta(category);
}

// Unique SEO content per category
const CATEGORY_SEO = {
  'text-case-converter': {
    longDesc: 'Need to change the case of your text? Our Text Case Converter tools offer 10 different case conversion formats including UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case, CONSTANT_CASE, alternating case, and toggle case. Whether you are a developer needing to convert variable names between naming conventions, a writer fixing capitalization mistakes, or a social media manager creating eye-catching posts — these tools handle it all instantly. Every conversion happens in your browser for complete privacy.',
    useCases: ['Fix accidentally typed CAPS LOCK text', 'Convert headlines to proper Title Case', 'Generate camelCase variable names for JavaScript', 'Create snake_case names for Python', 'Make SEO-friendly kebab-case URL slugs', 'Generate mocking SpongeBob text for memes'],
  },
  'word-counter': {
    longDesc: 'Count every aspect of your text with our comprehensive Word Counter & Analyzer suite. We offer 10 specialized counting and analysis tools: word counter, character counter, sentence counter, paragraph counter, line counter, word frequency analyzer, reading time calculator, speaking time calculator, readability score checker, and keyword density analyzer. Perfect for students checking essay requirements, bloggers optimizing content length, speakers timing presentations, and SEO professionals analyzing keyword usage.',
    useCases: ['Check essay word count for school assignments', 'Count characters for Twitter/Instagram limits', 'Calculate reading time for blog posts', 'Estimate speech duration for presentations', 'Analyze keyword density for SEO optimization', 'Check text readability with Flesch score'],
  },
  'text-cleaner': {
    longDesc: 'Clean up messy text with our powerful Text Cleaner tools. Remove unwanted line breaks, extra spaces, duplicate lines, empty lines, and all whitespace. Sort lines alphabetically, reverse text, add line numbers, and add custom prefixes or suffixes to every line. These tools are essential for data cleaning, formatting pasted content from PDFs and web pages, preparing text for databases, and organizing lists.',
    useCases: ['Remove line breaks from PDF-copied text', 'Delete double spaces and trailing whitespace', 'Remove duplicate entries from email lists', 'Sort text lines alphabetically A-Z or Z-A', 'Add line numbers to code or text', 'Add HTML tags as prefix/suffix to each line'],
  },
  'text-encoder-decoder': {
    longDesc: 'Encode and decode text between multiple formats with our Text Encoder & Decoder tools. Convert between Base64, URL encoding, HTML entities, Binary, Hexadecimal, Octal, ASCII codes, ROT13 cipher, UTF-8 bytes, and Morse code. These tools are indispensable for web developers, security researchers, students learning computer science, and anyone working with text encoding in software development.',
    useCases: ['Encode/decode Base64 for API development', 'URL-encode text for safe web addresses', 'Convert HTML special characters to entities', 'Translate text to Binary code for learning', 'Encode/decode Morse code messages', 'Apply ROT13 cipher for simple text obfuscation'],
  },
  'code-formatter': {
    longDesc: 'Format and beautify your code with our Code Formatter tools. Pretty-print JSON, XML, SQL, HTML, CSS, and JavaScript with proper indentation. Minify CSS and JavaScript to reduce file sizes. Validate JSON syntax with detailed error messages. Essential developer tools that every programmer, web developer, and data engineer needs in their daily workflow.',
    useCases: ['Beautify minified JSON from API responses', 'Format SQL queries before executing them', 'Validate JSON syntax and find errors', 'Minify CSS/JS for production deployment', 'Pretty-print XML configuration files', 'Format HTML code for better readability'],
  },
  'text-converter': {
    longDesc: 'Convert text between different data formats with our Text Converter tools. Transform between plain text and HTML, Markdown to HTML, CSV to JSON, JSON to CSV, TSV to CSV, JSON to XML, XML to JSON, YAML to JSON, and JSON to YAML. These converters are critical for data migration, API integration, content management, and format standardization across different systems.',
    useCases: ['Convert CSV spreadsheet data to JSON for APIs', 'Transform Markdown README files to HTML', 'Convert JSON to CSV for Excel import', 'Transform YAML configs to JSON format', 'Convert plain text to properly tagged HTML', 'Strip HTML tags to extract plain text content'],
  },
  'text-extractor': {
    longDesc: 'Extract specific data patterns from any text with our Text Extractor tools. Pull out email addresses, URLs, phone numbers, and numeric values from documents. Use regex pattern matching with live testing, compare two texts for differences, and perform bulk find-and-replace operations. These extraction tools save hours of manual data collection work.',
    useCases: ['Extract email addresses from documents', 'Find all URLs in web page source code', 'Pull phone numbers from contact lists', 'Test regular expressions with live matching', 'Compare two versions of a document', 'Bulk find and replace across text'],
  },
  'generators-randomizers': {
    longDesc: 'Generate random data with our Generators & Randomizers suite. Create UUIDs, strong passwords, Lorem Ipsum placeholder text, random numbers, random strings, fake names, fake addresses, MAC addresses, and combine strings. All random generation uses browser-native randomization. Perfect for developers needing test data, designers needing placeholder content, and anyone needing secure passwords.',
    useCases: ['Generate UUID v4 identifiers for databases', 'Create strong, secure passwords for accounts', 'Generate Lorem Ipsum for design mockups', 'Create random test data for development', 'Generate fake names for testing forms', 'Create random MAC addresses for networking'],
  },
  'text-hasher-cryptography': {
    longDesc: 'Hash and encrypt text with our comprehensive Hashing & Cryptography tools. Generate MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-3, and RIPEMD-160 hashes. Encrypt and decrypt text using AES and DES encryption. These tools are essential for verifying file integrity, generating checksums, creating password hashes, and learning about cryptography.',
    useCases: ['Generate SHA-256 hashes for security', 'Create MD5 checksums for file verification', 'Encrypt sensitive text with AES encryption', 'Compare hash values to verify data integrity', 'Learn about different hash algorithms', 'Generate RIPEMD-160 hashes for Bitcoin work'],
  },
  'list-array-tools': {
    longDesc: 'Manipulate lists and arrays with our List & Array Tools. Shuffle lists randomly, find common items between two lists (intersection), find unique items (difference), convert between comma-separated and line-separated formats, split and join text by delimiters, convert numbers to words, and add prefixes or suffixes. Essential for data processing and list management.',
    useCases: ['Randomize quiz questions or playlist order', 'Find common items between two mailing lists', 'Convert line-separated lists to comma-separated', 'Split CSV values into individual lines', 'Convert numbers to written words for checks', 'Add bullet points as prefix to every line'],
  },
  'web-developer-tools': {
    longDesc: 'Specialized tools for web developers. Decode JWT tokens for authentication debugging, convert between color formats (HEX, RGB, HSL), extract all colors from CSS code, parse URL query strings, generate SEO-friendly URL slugs, remove specific HTML tags, convert between BBCode and HTML, strip Markdown formatting, and escape SQL strings. A must-have toolkit for any web developer.',
    useCases: ['Decode JWT tokens for API debugging', 'Convert HEX colors to RGB for CSS', 'Extract all colors used in a stylesheet', 'Parse URL parameters to JSON format', 'Generate clean URL slugs from titles', 'Escape SQL strings to prevent injection'],
  },
};

export default async function CategoryPage({ params }) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  
  if (!category) {
    notFound();
  }

  const catSEO = CATEGORY_SEO[category.id] || {};
  const otherCategories = CATEGORIES.filter(c => c.id !== category.id);

  // Schema markup
  const itemListSchema = generateItemListSchema(category);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://ilovetexts.com' },
    { name: category.name, url: `https://ilovetexts.com/${category.id}` },
  ]);

  return (
    <div className="hub-page">
      <Script id="schema-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Script id="schema-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Colored Hero Banner */}
      <div className="hub-hero" style={{ '--tool-color': category.color }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator" aria-hidden="true">/</span>
            <span>{category.name}</span>
          </nav>
          
          <div className="hub-header">
            <div className="category-card-icon">
              {category.icon}
            </div>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="tools-grid animate-in">
        {category.tools.map((tool) => (
          <Link key={tool.slug} href={`/${category.id}/${tool.slug}`} className="tool-card">
            <div className="tool-card-icon">{tool.icon}</div>
            <div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Unique SEO Content for Category */}
      <div className="seo-block container" style={{ marginTop: '48px' }}>
        <div className="seo-block-inner">
          <h2>About {category.name} Tools</h2>
          <p>{catSEO.longDesc || `Our ${category.name.toLowerCase()} collection includes ${category.tools.length} powerful free online tools designed for speed, accuracy, and privacy.`}</p>
          
          {catSEO.useCases && (
            <>
              <h3 style={{ marginTop: '24px', fontSize: '1.2rem', fontWeight: 700 }}>What You Can Do</h3>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
                {catSEO.useCases.map((uc, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary)' }}>{uc}</li>
                ))}
              </ul>
            </>
          )}

          <p style={{ marginTop: '16px' }}>
            Available tools: {category.tools.map(t => t.name).join(', ')}. Each tool processes your text in real-time, with results appearing instantly. You can copy results to clipboard or download as a file. All processing happens 100% in your browser — your text is never sent to any server.
          </p>
        </div>
      </div>

      {/* Related Categories — Cross-linking */}
      <div className="explore-categories-section" style={{ margin: '48px auto', maxWidth: 'var(--max-width)', padding: '48px 24px' }}>
        <h2>Explore Other Tool Categories</h2>
        <div className="explore-categories-grid">
          {otherCategories.map(cat => (
            <Link key={cat.id} href={`/${cat.id}`} className="explore-category-card">
              <span className="explore-cat-icon">{cat.icon}</span>
              <div>
                <h4>{cat.name}</h4>
                <p>{cat.tools.length} free tools</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
