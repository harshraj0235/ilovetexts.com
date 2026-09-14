import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');

test('only reviewed tool locales are advertised as indexable', () => {
  const policy = read('lib/search-indexing.js');
  assert.match(policy, /INDEXABLE_TOOL_LOCALES\s*=\s*\['en'\]/);
});

test('English-only editorial pages are gated to the English sitemap', () => {
  const sitemap = read('app/sitemap-api/[lang]/route.js');
  assert.match(sitemap, /if \(lang === 'en'\) \{[\s\S]*addUrl\('\/blog'/);
  assert.match(sitemap, /post\.lang === lang && isPublishedDate\(post\.date\)/);
});

test('LanguageTool clients use the same-origin validated proxy', () => {
  for (const file of ['GrammarChecker.jsx', 'SpellChecker.jsx', 'PunctuationChecker.jsx']) {
    const component = read(`components/tools/${file}`);
    assert.match(component, /const API_URL = '\/api\/language-check'/);
    assert.doesNotMatch(component, /const API_URL = 'https:\/\/api\.languagetoolplus\.com/);
    assert.match(component, /Your text has not been verified/);
  }
});

test('external browser APIs required by tools are allowed by CSP', () => {
  const config = read('next.config.mjs');
  assert.match(config, /connect-src[^\n]+https:\/\/api\.datamuse\.com/);
  assert.match(config, /connect-src[^\n]+https:\/\/inputtools\.google\.com/);
});

test('tool workspace does not create a nested main landmark', () => {
  const layout = read('components/ToolLayout.jsx');
  assert.doesNotMatch(layout, /<main id="tool-workspace"/);
  assert.match(layout, /<section id="tool-workspace"[^>]+aria-label=/);
});

test('restored Spanish word counter article is published and date-aligned', () => {
  const blog = read('app/[lang]/blog/page.js');
  const sitemap = read('app/sitemap-api/[lang]/route.js');
  const expected = "slug: 'contador-palabras-online-gratis', date: '2026-09-14', lang: 'es'";
  assert.ok(sitemap.includes(expected));
  const articleBlock = blog.slice(blog.indexOf("slug: 'contador-palabras-online-gratis'"));
  assert.match(articleBlock.slice(0, 500), /date: '2026-09-14'/);
});

test('curated tool content reaches the rendered page instead of generic fallbacks', () => {
  const page = read('app/[lang]/[category]/[tool]/page.js');
  assert.match(page, /seoData\?\.whatIs/);
  assert.match(page, /seoData\?\.faqs/);
  assert.match(page, /seoData\?\.useCases/);
  assert.match(page, /seoData\?\.keywords/);
});

test('editor-reviewed long-tail sections reach tool pages', () => {
  const page = read('app/[lang]/[category]/[tool]/page.js');
  const layout = read('components/ToolLayout.jsx');
  const content = JSON.parse(read('locales/content/en.json'));
  const flipbook = content.tools['flipbook-maker'];

  assert.match(page, /const seoSections = toolData\.content\?\.seoSections \|\| \[\]/);
  assert.match(page, /seoSections=\{seoSections\}/);
  assert.match(layout, /seoSections\.map/);
  assert.match(flipbook.metaTitle, /Flipsnack Alternative/);
  assert.match(flipbook.keywords, /PDF flipbook maker for WordPress/i);
  assert.ok(flipbook.seoSections.length >= 4);
  assert.match(JSON.stringify(flipbook), /not affiliated with or endorsed by Flipsnack/i);
});

test('grammar checker exposes honest limits, multilingual controls, and advanced review actions', () => {
  const component = read('components/tools/GrammarChecker.jsx');
  const route = read('app/api/language-check/route.js');
  const content = JSON.parse(read('locales/content/en.json')).tools['grammar-checker'];

  assert.match(component, /Check language/);
  assert.match(component, /applyAllFixes/);
  assert.match(component, /issueFilter/);
  assert.match(component, /Download checked text/);
  assert.match(component, /Text is sent securely to LanguageTool/);
  assert.match(route, /const text = String\(formData\.get\('text'\) \|\| ''\);/);
  assert.match(content.metaDescription, /20,000 characters/);
  assert.ok(content.seoSections.length >= 3);
  assert.doesNotMatch(JSON.stringify(content), /unlimited words/i);
});
