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
  for (const file of ['GrammarChecker.jsx']) {
    const component = read(`components/tools/${file}`);
    assert.match(component, /const API_URL = '\/api\/language-check'/);
    assert.doesNotMatch(component, /const API_URL = 'https:\/\/api\.languagetoolplus\.com/);
    assert.match(component, /Your text has not been verified/);
  }
  const spelling = read('components/tools/SpellChecker.jsx');
  const punctuation = read('components/tools/PunctuationChecker.jsx');
  assert.match(spelling, /GrammarChecker/);
  assert.match(spelling, /mode="spelling"/);
  assert.match(punctuation, /GrammarChecker/);
  assert.match(punctuation, /mode="punctuation"/);
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

test('spell checker reuses advanced editor but returns spelling findings only', () => {
  const shared = read('components/tools/GrammarChecker.jsx');
  const spelling = read('components/tools/SpellChecker.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['spell-checker'];

  assert.match(spelling, /mode="spelling"/);
  assert.match(shared, /mode === 'spelling'/);
  assert.match(shared, /issueType === 'misspelling'/);
  assert.match(content.metaDescription, /US or UK English/);
  assert.ok(content.seoSections.length >= 3);
  assert.doesNotMatch(JSON.stringify(content), /unlimited text/i);
  assert.doesNotMatch(JSON.stringify(content), /100% Private/i);
});

test('punctuation checker isolates typography findings in the advanced editor', () => {
  const shared = read('components/tools/GrammarChecker.jsx');
  const punctuation = read('components/tools/PunctuationChecker.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['punctuation-checker'];

  assert.match(punctuation, /mode="punctuation"/);
  assert.match(shared, /\['PUNCTUATION', 'TYPOGRAPHY'\]/);
  assert.match(shared, /Check Punctuation/);
  assert.match(content.keywords, /comma splice checker online/);
  assert.ok(content.seoSections.length >= 3);
  assert.doesNotMatch(JSON.stringify(content), /no word limits/i);
  assert.doesNotMatch(JSON.stringify(content), /completely anonymously/i);
});

test('online typing tool autosaves locally and exposes focused writing controls', () => {
  const component = read('components/tools/OnlineTypingTool.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['online-typing-tool'];

  assert.match(component, /localStorage\.setItem/);
  assert.match(component, /Focus mode/);
  assert.match(component, /replaceNext/);
  assert.match(component, /Word goal/);
  assert.match(component, /body\.textContent = text/);
  assert.match(content.metaTitle, /Autosave and Transliteration/);
  assert.ok(content.seoSections.length >= 3);
});

test('rhyming dictionary supports near rhymes, meter filters, and a writing shortlist', () => {
  const component = read('components/tools/RhymingDictionary.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['rhyming-dictionary'];

  assert.match(component, /rel_nry/);
  assert.match(component, /syllableFilter/);
  assert.match(component, /savedRhymes/);
  assert.match(component, /SpeechSynthesisUtterance/);
  assert.match(content.metaTitle, /Perfect and Near Rhymes/);
  assert.ok(content.seoSections.length >= 3);
});

test('anagram generator validates exact letters and offers filtered shortlists', () => {
  const component = read('components/tools/AnagramGenerator.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['anagram-generator'];

  assert.match(component, /replace\(\/\[\^a-z\]\/g, ''\)/);
  assert.match(component, /startsWith/);
  assert.match(component, /selected/);
  assert.match(component, /copyResults/);
  assert.match(component, /Dictionary lookup uses Datamuse/);
  assert.match(content.metaTitle, /Exact Letter Anagram Solver/);
  assert.ok(content.seoSections.length >= 3);
  assert.doesNotMatch(JSON.stringify(content), /100% Offline/i);
  assert.doesNotMatch(JSON.stringify(content), /all possible permutations/i);
});

test('five-letter finder handles position clues, repeats, and spoiler-safe shortlists', () => {
  const component = read('components/tools/WordleFinder.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['wordle-word-finder'];

  assert.match(component, /yellowLetters\.some/);
  assert.match(component, /requiredCounts/);
  assert.match(component, /ignoredGreys/);
  assert.match(component, /positionConflicts/);
  assert.match(component, /copyResults/);
  assert.match(component, /never reveals or stores a daily answer/);
  assert.match(content.metaDescription, /repeated letters/);
  assert.ok(content.seoSections.length >= 3);
  assert.match(JSON.stringify(content), /not the official Wordle/i);
  assert.doesNotMatch(JSON.stringify(content), /Find the answer instantly/i);
});

test('thesis builder creates editable, essay-specific drafts without false guarantees', () => {
  const component = read('components/tools/ThesisGenerator.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['thesis-statement-generator'];

  assert.match(component, /argumentative/);
  assert.match(component, /analytical/);
  assert.match(component, /expository/);
  assert.match(component, /counterargument/);
  assert.match(component, /updateDraft/);
  assert.match(component, /Your text stays in this browser/);
  assert.match(component, /Before submitting, ask:/);
  assert.ok(content.seoSections.length >= 3);
  assert.match(content.metaDescription, /processed in your browser/);
  assert.doesNotMatch(JSON.stringify(content), /perfect thesis/i);
  assert.doesNotMatch(JSON.stringify(content), /guarantee a strong thesis/i);
});

test('essay outliner provides editable evidence planning and exact word budgets', () => {
  const component = read('components/tools/EssayOutliner.jsx');
  const content = JSON.parse(read('locales/content/en.json')).tools['essay-outliner'];

  assert.match(component, /allocateWords/);
  assert.match(component, /comparison/);
  assert.match(component, /includeCounter/);
  assert.match(component, /updateItem/);
  assert.match(component, /moveSection/);
  assert.match(component, /downloadOutline/);
  assert.match(component, /never invents research, quotations, or citations/);
  assert.ok(content.seoSections.length >= 3);
  assert.match(content.metaDescription, /300–10,000-word/);
  assert.doesNotMatch(JSON.stringify(content), /perfectly structured/i);
});

test('direct text comparison separates transparent metrics from plagiarism judgment', () => {
  const component = read('components/tools/PlagiarismChecker.jsx');
  const engine = read('lib/text-similarity.js');
  const content = JSON.parse(read('locales/content/en.json')).tools['plagiarism-checker'];

  assert.match(engine, /jaccardScore/);
  assert.match(engine, /cosineScore/);
  assert.match(engine, /draftPhraseCoverage/);
  assert.match(component, /phraseSize/);
  assert.match(component, /downloadReport/);
  assert.match(component, /not a plagiarism verdict/i);
  assert.ok(content.seoSections.length >= 3);
  assert.match(content.metaDescription, /3–8-word phrase coverage/);
  assert.doesNotMatch(JSON.stringify(content), /score above 30%/i);
  assert.doesNotMatch(JSON.stringify(content), /detect heavy paraphrasing/i);
  assert.doesNotMatch(JSON.stringify(content), /any length/i);
});
