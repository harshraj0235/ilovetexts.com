import Link from 'next/link';
import { CATEGORIES, SITE } from '@/lib/tools-config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">♥</div>
            <span>ilovetexts</span>
          </Link>
          <p>
            The most comprehensive free online text toolkit with 107+ tools. Convert case, count words, 
            format code, encode text, generate passwords, and hash strings — all processing happens 
            100% in your browser. No data is ever sent to servers. Completely free, no signup required.
          </p>
        </div>
        
        <div className="footer-col">
          <h4>All Categories</h4>
          <ul>
            {CATEGORIES.map(cat => (
              <li key={cat.id}>
                <Link href={`/${cat.id}`}>{cat.icon} {cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Popular Tools</h4>
          <ul>
            <li><Link href="/text-case-converter/uppercase">Uppercase Converter</Link></li>
            <li><Link href="/text-case-converter/lowercase">Lowercase Converter</Link></li>
            <li><Link href="/text-case-converter/title-case">Title Case Converter</Link></li>
            <li><Link href="/word-counter/word-counter">Word Counter</Link></li>
            <li><Link href="/word-counter/character-counter">Character Counter</Link></li>
            <li><Link href="/word-counter/reading-time">Reading Time Calculator</Link></li>
            <li><Link href="/text-encoder-decoder/base64-encode-decode">Base64 Encoder</Link></li>
            <li><Link href="/code-formatter/json-formatter">JSON Formatter</Link></li>
            <li><Link href="/code-formatter/json-validator">JSON Validator</Link></li>
            <li><Link href="/generators-randomizers/password-generator">Password Generator</Link></li>
            <li><Link href="/generators-randomizers/uuid-generator">UUID Generator</Link></li>
            <li><Link href="/text-hasher-cryptography/sha256-hash">SHA-256 Hash</Link></li>
            <li><Link href="/text-hasher-cryptography/md5-hash">MD5 Hash Generator</Link></li>
            <li><Link href="/text-extractor/regex-tester">Regex Tester</Link></li>
            <li><Link href="/web-developer-tools/jwt-decoder">JWT Decoder</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>More Tools</h4>
          <ul>
            <li><Link href="/text-cleaner/remove-duplicate-lines">Remove Duplicate Lines</Link></li>
            <li><Link href="/text-cleaner/remove-line-breaks">Remove Line Breaks</Link></li>
            <li><Link href="/text-cleaner/sort-lines">Sort Lines Alphabetically</Link></li>
            <li><Link href="/text-converter/csv-to-json">CSV to JSON Converter</Link></li>
            <li><Link href="/text-converter/markdown-to-html">Markdown to HTML</Link></li>
            <li><Link href="/text-converter/yaml-to-json">YAML to JSON Converter</Link></li>
            <li><Link href="/text-extractor/extract-emails">Extract Emails</Link></li>
            <li><Link href="/text-extractor/find-replace">Find and Replace</Link></li>
            <li><Link href="/text-encoder-decoder/morse-code">Morse Code Translator</Link></li>
            <li><Link href="/web-developer-tools/color-converter">Color Converter</Link></li>
            <li><Link href="/web-developer-tools/url-slug-generator">URL Slug Generator</Link></li>
          </ul>
          <h4 style={{ marginTop: '24px' }}>Resources</h4>
          <ul>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      
      {/* SEO-rich footer content */}
      <div className="footer-seo">
        <p>
          ilovetexts.com offers 107+ free online text tools including <Link href="/text-case-converter/uppercase">uppercase converter</Link>, <Link href="/word-counter/word-counter">word counter</Link>, <Link href="/code-formatter/json-formatter">JSON formatter</Link>, <Link href="/text-encoder-decoder/base64-encode-decode">Base64 encoder/decoder</Link>, <Link href="/generators-randomizers/password-generator">password generator</Link>, <Link href="/text-hasher-cryptography/sha256-hash">SHA-256 hash generator</Link>, <Link href="/text-extractor/regex-tester">regex tester</Link>, <Link href="/web-developer-tools/jwt-decoder">JWT decoder</Link>, and many more. All tools process text 100% in your browser for complete privacy.
        </p>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {SITE.domain}. All rights reserved.</p>
        <p>107+ free, private, browser-based text tools — no signup, no limits, free forever.</p>
      </div>
    </footer>
  );
}
