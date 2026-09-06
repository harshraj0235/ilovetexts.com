// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ilovetexts.com â€” Tools Configuration
// All tool metadata, SEO data, and category definitions
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import enContent from '@/locales/content/en.json';
import hiContent from '@/locales/content/hi.json';
import esContent from '@/locales/content/es.json';
import ptContent from '@/locales/content/pt.json';
import deContent from '@/locales/content/de.json';
import idContent from '@/locales/content/id.json';

const localeContents = {
  en: enContent,
  hi: hiContent,
  es: esContent,
  pt: ptContent,
  de: deContent,
  id: idContent
};

export const SITE = {
  name: 'ilovetexts',
  domain: 'ilovetexts.com',
  url: 'https://ilovetexts.com',
  tagline: 'Free Online Text Tools â€” Fast, Private & No Signup',
  description: 'Every text tool you need in one place. Convert, format, clean, encode, and analyze text online for free. Your text never leaves your browser.',
};

export const CATEGORIES = [
  {
    id: 'writing-grammar-tools',
    name: 'Writing & Grammar Tools',
    description: 'Check grammar, spelling, punctuation, rewrite sentences, and analyze tone. Perfect for students and writers.',
    icon: 'âœï¸',
    color: '#f43f5e',
    tools: [
      { slug: 'grammar-checker', name: 'Grammar Checker', description: 'Free grammar and spelling checker', icon: 'âœ…', keywords: 'free grammar checker online no signup' },
      { slug: 'spell-checker', name: 'Spell Checker', description: 'Free online spell checker for essays and text', icon: 'ðŸ“', keywords: 'spell checker online free for essays' },
      { slug: 'punctuation-checker', name: 'Punctuation Checker', description: 'Free online punctuation checker to fix commas and periods', icon: 'âœðŸ¼', keywords: 'free online punctuation checker no signup fix commas' },
      { slug: 'online-typing-tool', name: 'Online Typing Tool', description: 'Type phonetically in 20+ languages using English keyboard', icon: 'âŒ¨ï¸', keywords: 'online typing tool phonetic transliteration keyboard hindi arabic russian gujarati marathi bengali english to hindi typing tool free online' },
      { slug: 'rhyming-dictionary', name: 'Rhyming Dictionary', description: 'Find words that rhyme with your word', icon: 'ðŸ“', keywords: 'find words that rhyme with my word online, rhyming dictionary free' },
      { slug: 'anagram-generator', name: 'Anagram Generator', description: 'Generate anagrams and word permutations', icon: 'ðŸ”€', keywords: 'anagram solver make words from letters, anagram generator free' },
      { slug: 'wordle-word-finder', name: 'Wordle Word Finder', description: 'Find 5-letter words to solve Wordle puzzles', icon: 'ðŸŸ©', keywords: 'wordle word finder 5 letters, cheat wordle today, wordle solver free' },
      { slug: 'thesis-statement-generator', name: 'Thesis Statement Generator', description: 'Generate a strong thesis statement for your essay', icon: 'ðŸŽ“', keywords: 'thesis statement generator free, essay thesis maker, write my thesis statement' },
      { slug: 'essay-outliner', name: 'Essay Outliner', description: 'Generate a structured outline for your essay instantly', icon: 'ðŸ“‹', keywords: 'free essay outline generator structure maker, how to outline an essay' },
      { slug: 'plagiarism-checker', name: 'Plagiarism Checker', description: 'Compare two texts for similarity and plagiarism', icon: 'ðŸ•µï¸', keywords: 'free plagiarism checker compare two texts, text similarity checker online' },
      { slug: 'active-passive-converter', name: 'Active/Passive Converter', description: 'Detect and convert sentences between active and passive voice', icon: 'ðŸ”„', keywords: 'convert active to passive voice sentence online, passive to active voice converter free online' },
      { slug: 'transition-word-generator', name: 'Transition Word Generator', description: 'Find the perfect transition words for essays and articles', icon: 'ðŸ”—', keywords: 'transition word generator for essays, connecting words list, linking words for writing' },
    ],
  },
  {
    id: 'text-case-converter',
    name: 'Text Case Converter',
    description: 'Convert text between uppercase, lowercase, title case, camelCase, snake_case and more. Instant, free, no signup.',
    icon: 'ðŸ”¤',
    color: '#6366f1',
    tools: [
      { slug: 'uppercase', name: 'Uppercase Converter', description: 'Convert text to UPPERCASE', icon: 'â¬†ï¸', keywords: 'convert text to uppercase online free' },
      { slug: 'lowercase', name: 'Lowercase Converter', description: 'Convert text to lowercase', icon: 'â¬‡ï¸', keywords: 'change text to lowercase online free' },
      { slug: 'title-case', name: 'Title Case Converter', description: 'Convert text to Title Case', icon: 'ðŸ“', keywords: 'convert sentence to title case online' },
      { slug: 'sentence-case', name: 'Sentence Case Converter', description: 'Convert text to Sentence case', icon: 'âœï¸', keywords: 'fix capitalization in text online' },
      { slug: 'camel-case', name: 'camelCase Converter', description: 'Convert text to camelCase', icon: 'ðŸª', keywords: 'convert text to camelCase for developers' },
      { slug: 'snake-case', name: 'snake_case Converter', description: 'Convert text to snake_case', icon: 'ðŸ', keywords: 'text to snake_case converter online' },
      { slug: 'kebab-case', name: 'kebab-case Converter', description: 'Convert text to kebab-case', icon: 'ðŸ¥™', keywords: 'convert string to kebab-case for URLs' },
      { slug: 'alternating-case', name: 'Alternating Case', description: 'Convert to aLtErNaTiNg CaSe', icon: 'ðŸ”€', keywords: 'sarcasm text generator copy paste' },
      { slug: 'toggle-case', name: 'Toggle / Inverse Case', description: 'Swap uppercase and lowercase', icon: 'ðŸ”ƒ', keywords: 'swap uppercase lowercase text online' },
      { slug: 'constant-case', name: 'CONSTANT_CASE Converter', description: 'Convert to CONSTANT_CASE', icon: 'ðŸ“Œ', keywords: 'convert text to constant case programming' },
      { slug: 'mocking-case', name: 'mOcKiNg cAsE Generator', description: 'Convert text to aLtErNaTiNg mocking meme case', icon: 'ðŸ¤ª', keywords: 'spongebob mocking text generator online copy paste alternate case' },
      { slug: 'cursive-text-generator', name: 'Cursive Text Generator', description: 'Convert text to beautiful cursive letters', icon: 'âœï¸', keywords: 'cursive text generator copy and paste letters' },
      { slug: 'strikethrough-text', name: 'Strikethrough Text', description: 'Cross out your text with strikethrough characters', icon: 'sÌ¶', keywords: 'strikethrough text generator cross out text' },
      { slug: 'underline-text-generator', name: 'Underline Text Generator', description: 'Add an underline to your text automatically', icon: 'uÌ²', keywords: 'underline text generator copy paste online' },
      { slug: 'bubble-text-generator', name: 'Bubble Text Generator', description: 'Convert text to encircled bubble letters', icon: 'â“„', keywords: 'bubble letters text generator circle text' },
      { slug: 'square-text-generator', name: 'Square Text Generator', description: 'Convert text to square-boxed letters', icon: 'ðŸ”²', keywords: 'square box text generator copy paste' },
      { slug: 'mirror-text-generator', name: 'Mirror Text Generator', description: 'Flip your text backwards and upside down', icon: 'ðŸªž', keywords: 'mirror text generator backwards flipped text' },
      { slug: 'invisible-text-generator', name: 'Invisible Text Generator', description: 'Generate blank/invisible space characters', icon: 'ðŸ‘»', keywords: 'invisible character blank space copy paste' },
      { slug: 'demonic-cursed-text', name: 'Demonic / Cursed Text', description: 'Generate glitchy, cursed Zalgo text', icon: 'ðŸ˜ˆ', keywords: 'cursed text generator scary creepy letters' },
      { slug: 'small-text-generator', name: 'Small Text Generator', description: 'Convert text to tiny superscript/subscript letters', icon: 'áµƒ', keywords: 'tiny text generator superscript subscript letters' },
    ],
  },
  {
    id: 'word-counting-tools',
    name: 'Word Counter & Analyzer',
    description: 'Count words, characters, sentences, and paragraphs. Check readability, keyword density, and more.',
    icon: 'ðŸ”¢',
    color: '#8b5cf6',
    tools: [
      { slug: 'word-counter', name: 'Word Counter', description: 'Count words and characters in text', icon: 'ðŸ“Š', keywords: 'word counter online with keyword density' },
      { slug: 'character-counter', name: 'Character Counter', description: 'Count characters with/without spaces', icon: 'ðŸ” ', keywords: 'character counter for instagram bio limit' },
      { slug: 'syllable-counter', name: 'Syllable Counter', description: 'Count syllables in your text', icon: 'ðŸ—£ï¸', keywords: 'how many syllables in a word counter online' },
      { slug: 'sentence-counter', name: 'Sentence Counter', description: 'Count sentences in your text', icon: 'ðŸ“', keywords: 'count sentences in paragraph online free' },
      { slug: 'paragraph-counter', name: 'Paragraph Counter', description: 'Count paragraphs in text', icon: 'ðŸ“ƒ', keywords: 'how many paragraphs in my text' },
      { slug: 'line-counter', name: 'Line Counter', description: 'Count lines in text', icon: 'ðŸ“‹', keywords: 'count lines in text file online' },
      { slug: 'word-frequency', name: 'Word Frequency Counter', description: 'Find most used words in text', icon: 'ðŸ“ˆ', keywords: 'find most used words in text online' },
      { slug: 'reading-time', name: 'Reading Time Calculator', description: 'Estimate reading time for text', icon: 'â±ï¸', keywords: 'how long to read my article calculator' },
      { slug: 'speaking-time', name: 'Speaking Time Calculator', description: 'Estimate speaking duration', icon: 'ðŸŽ¤', keywords: 'how long to speak 1000 words calculator' },
      { slug: 'readability-score', name: 'Readability Score', description: 'Check text readability level', icon: 'ðŸ“–', keywords: 'check readability score of text free' },
      { slug: 'keyword-density', name: 'Keyword Density Checker', description: 'Analyze keyword density for SEO', icon: 'ðŸŽ¯', keywords: 'keyword density checker for SEO free' },
      { slug: 'text-summarizer', name: 'Text Summarizer & Extractor', description: 'Automatically summarize long text into key sentences', icon: 'ðŸ“', keywords: 'text summarizer online free article summary generator' },
    ],
  },
  {
    id: 'text-cleaner',
    name: 'Text Cleaner & Manipulation',
    description: 'Remove line breaks, extra spaces, duplicate lines. Sort, reverse, and manipulate text easily.',
    icon: 'ðŸ§¹',
    color: '#ec4899',
    tools: [
      { slug: 'remove-line-breaks', name: 'Remove Line Breaks', description: 'Remove all line breaks from text', icon: 'â†©ï¸', keywords: 'remove line breaks from text online free' },
      { slug: 'remove-extra-spaces', name: 'Remove Extra Spaces', description: 'Remove extra whitespace', icon: 'â¬œ', keywords: 'remove extra spaces between words online' },
      { slug: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', description: 'Remove repeated lines from text', icon: 'ðŸš«', keywords: 'remove duplicate lines from text online' },
      { slug: 'remove-empty-lines', name: 'Remove Empty Lines', description: 'Delete blank lines from text', icon: 'ðŸ—‘ï¸', keywords: 'delete blank lines from text file online' },
      { slug: 'remove-whitespace', name: 'Remove All Whitespace', description: 'Strip all whitespace characters', icon: 'âœ‚ï¸', keywords: 'strip whitespace from text online tool' },
      { slug: 'add-line-numbers', name: 'Add Line Numbers', description: 'Add numbers to each line', icon: 'ðŸ”¢', keywords: 'add line numbers to text online free' },
      { slug: 'add-prefix-suffix', name: 'Add Prefix / Suffix', description: 'Add text before/after each line', icon: 'âž•', keywords: 'add prefix to each line of text online' },
      { slug: 'sort-lines', name: 'Sort Lines', description: 'Sort lines alphabetically', icon: 'ðŸ”¤', keywords: 'sort text alphabetically online free' },
      { slug: 'reverse-text', name: 'Reverse Text', description: 'Reverse text backwards', icon: 'ðŸ”„', keywords: 'reverse text online backwards generator' },
      { slug: 'reverse-lines', name: 'Reverse Lines Order', description: 'Reverse the order of lines', icon: 'â†•ï¸', keywords: 'reverse line order in text online' },
    ],
  },
  {
    id: 'text-encoder-decoder',
    name: 'Text Encoder & Decoder',
    description: 'Encode and decode text in Base64, URL, HTML, Binary, Hex, ASCII, Morse code and more.',
    icon: 'ðŸ”',
    color: '#f59e0b',
    tools: [
      { slug: 'base64-encode-decode', name: 'Base64 Encode / Decode', description: 'Encode or decode Base64 text', icon: 'ðŸ”‘', keywords: 'base64 encode decode text online free' },
      { slug: 'url-encode-decode', name: 'URL Encode / Decode', description: 'Encode or decode URL components', icon: 'ðŸ”—', keywords: 'url encode decode online tool free' },
      { slug: 'html-encode-decode', name: 'HTML Encode / Decode', description: 'Encode or decode HTML entities', icon: 'ðŸ·ï¸', keywords: 'html entity encode decode online' },
      { slug: 'binary-text', name: 'Binary â†” Text', description: 'Convert between binary and text', icon: 'ðŸ’»', keywords: 'convert text to binary code online' },
      { slug: 'hex-text', name: 'Hex â†” Text', description: 'Convert between hexadecimal and text', icon: 'ðŸ”¢', keywords: 'hexadecimal to text converter online' },
      { slug: 'octal-text', name: 'Octal â†” Text', description: 'Convert between octal and text', icon: 'ðŸ”Ÿ', keywords: 'octal to text converter online free' },
      { slug: 'ascii-text', name: 'ASCII â†” Text', description: 'Convert between ASCII codes and text', icon: 'ðŸ…°ï¸', keywords: 'ascii code to text converter online' },
      { slug: 'rot13', name: 'ROT13 Encoder / Decoder', description: 'Apply ROT13 cipher to text', icon: 'ðŸ”„', keywords: 'rot13 cipher encoder decoder online' },
      { slug: 'utf8-encode-decode', name: 'UTF-8 Encode / Decode', description: 'View UTF-8 byte representation', icon: 'ðŸŒ', keywords: 'utf8 encode decode text online tool' },
      { slug: 'morse-code', name: 'Morse Code Translator', description: 'Convert text to Morse code and back', icon: 'ðŸ“¡', keywords: 'text to morse code translator online' },
      { slug: 'braille-translator', name: 'Braille Translator', description: 'Translate text to Braille and back', icon: 'â ƒ', keywords: 'translate text to braille online free' },
      { slug: 'sign-language-translator', name: 'Sign Language Translator', description: 'Convert text to ASL hand emojis', icon: 'ðŸ¤Ÿ', keywords: 'text to sign language hand emojis translator' },
      { slug: 'nato-phonetic-translator', name: 'NATO Phonetic Translator', description: 'Convert text to NATO phonetic alphabet', icon: 'âœˆï¸', keywords: 'nato phonetic alphabet translator text' },
      { slug: 'wingdings-translator', name: 'Wingdings Translator', description: 'Convert text to Wingdings symbols', icon: 'ðŸ–³', keywords: 'wingdings font translator text to symbols' },
    ],
  },
  {
    id: 'code-formatter',
    name: 'Code Formatter & Beautifier',
    description: 'Format, beautify, minify, and validate JSON, XML, SQL, HTML, CSS, and JavaScript code online.',
    icon: 'ðŸ’»',
    color: '#10b981',
    tools: [
      { slug: 'json-formatter', name: 'JSON Formatter', description: 'Beautify and format JSON data', icon: 'ðŸ“‹', keywords: 'json formatter beautifier online free' },
      { slug: 'json-validator', name: 'JSON Validator', description: 'Validate JSON with error details', icon: 'âœ…', keywords: 'validate json online with error details' },
      { slug: 'json-minifier', name: 'JSON Minifier', description: 'Minify JSON by removing whitespace', icon: 'ðŸ“¦', keywords: 'minify json online remove whitespace' },
      { slug: 'xml-formatter', name: 'XML Formatter', description: 'Beautify and format XML data', icon: 'ðŸ“„', keywords: 'xml formatter beautifier online free' },
      { slug: 'sql-formatter', name: 'SQL Formatter', description: 'Format SQL queries for readability', icon: 'ðŸ—ƒï¸', keywords: 'sql query formatter beautifier online' },
      { slug: 'html-formatter', name: 'HTML Formatter', description: 'Beautify and indent HTML code', icon: 'ðŸŒ', keywords: 'html code beautifier online free' },
      { slug: 'css-formatter', name: 'CSS Formatter', description: 'Beautify and format CSS code', icon: 'ðŸŽ¨', keywords: 'css beautifier formatter online free' },
      { slug: 'css-minifier', name: 'CSS Minifier', description: 'Minify CSS code for production', icon: 'ðŸ—œï¸', keywords: 'minify css code online free tool' },
      { slug: 'js-formatter', name: 'JavaScript Formatter', description: 'Beautify JavaScript code', icon: 'âš¡', keywords: 'javascript beautifier formatter online' },
      { slug: 'js-minifier', name: 'JavaScript Minifier', description: 'Minify JavaScript code', icon: 'ðŸ“¦', keywords: 'minify javascript code online free' },
      { slug: 'json-to-typescript', name: 'JSON to TypeScript Interfaces', description: 'Generate TypeScript types from JSON', icon: 'ðŸ“˜', keywords: 'json to typescript interface converter generator online' },
      { slug: 'math-equation-latex', name: 'Math Equation Formatter', description: 'Format text into LaTeX equations', icon: 'ðŸ§®', keywords: 'convert math text to latex equation online' },
      { slug: 'rpg-stat-block-formatter', name: 'RPG Stat Block Formatter', description: 'Format D&D stat blocks from text', icon: 'ðŸ‰', keywords: 'dnd 5e stat block text formatter generator' },
    ],
  },
  {
    id: 'text-converter',
    name: 'Text Converter',
    description: 'Convert text to HTML, Markdown, CSV, JSON, PDF and more formats. Fast and free.',
    icon: 'ðŸ”„',
    color: '#3b82f6',
    tools: [
      { slug: 'text-to-html', name: 'Text to HTML', description: 'Convert plain text to HTML', icon: 'ðŸŒ', keywords: 'convert plain text to html online free' },
      { slug: 'html-to-text', name: 'HTML to Text', description: 'Strip HTML tags from text', icon: 'ðŸ“', keywords: 'strip html tags from text online free' },
      { slug: 'markdown-to-html', name: 'Markdown to HTML', description: 'Convert Markdown to HTML', icon: 'â¬‡ï¸', keywords: 'convert markdown to html preview online' },
      { slug: 'html-to-markdown', name: 'HTML to Markdown', description: 'Convert HTML code to Markdown', icon: 'ðŸ—ï¸', keywords: 'convert html code to markdown text online' },
      { slug: 'csv-to-json', name: 'CSV to JSON', description: 'Convert CSV data to JSON', icon: 'ðŸ“Š', keywords: 'csv to json converter online free' },
      { slug: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON array to CSV', icon: 'ðŸ“ˆ', keywords: 'convert json to csv online free download' },
      { slug: 'tsv-to-csv', name: 'TSV to CSV', description: 'Convert tab-separated to comma-separated', icon: 'ðŸ“‹', keywords: 'convert tsv to csv online free tool' },
      { slug: 'csv-to-html-table', name: 'CSV to HTML Table', description: 'Convert CSV data to HTML table code', icon: 'ðŸ•¸ï¸', keywords: 'convert csv data to html table code' },
      { slug: 'json-to-xml', name: 'JSON to XML', description: 'Convert JSON to XML format', icon: 'ðŸ”€', keywords: 'convert json to xml format online' },
      { slug: 'xml-to-json', name: 'XML to JSON', description: 'Convert XML to JSON format', icon: 'ðŸ”', keywords: 'xml to json converter online free' },
      { slug: 'yaml-to-xml', name: 'YAML to XML', description: 'Convert YAML to XML format', icon: 'ðŸ§©', keywords: 'yaml to xml converter free tool online' },
      { slug: 'yaml-to-json', name: 'YAML to JSON', description: 'Convert YAML to JSON format', icon: 'ðŸ“„', keywords: 'yaml to json converter online free' },
      { slug: 'json-to-yaml', name: 'JSON to YAML', description: 'Convert JSON to YAML format', icon: 'ðŸ“ƒ', keywords: 'json to yaml converter online' },
      { slug: 'toml-to-json', name: 'TOML to JSON', description: 'Convert TOML config to JSON', icon: 'âš™ï¸', keywords: 'convert toml file to json online' },
      { slug: 'json-to-toml', name: 'JSON to TOML', description: 'Convert JSON to TOML format', icon: 'ðŸ”§', keywords: 'json to toml converter online free' },
      { slug: 'html-table-to-csv', name: 'HTML Table to CSV', description: 'Extract and convert HTML tables to CSV format', icon: 'ðŸ§®', keywords: 'html table to csv converter extractor online free' },
      { slug: 'prompt-minifier', name: 'LLM Prompt Minifier', description: 'Minify text to save API tokens for ChatGPT', icon: 'ðŸ¤–', keywords: 'llm prompt minifier save tokens chatgpt prompt shortener' },
      { slug: 'caption-formatter', name: 'TikTok Caption Formatter', description: 'Format text chunks for video captions', icon: 'ðŸ“±', keywords: 'tiktok caption formatter youtube shorts script chunks' },
      { slug: 'json-to-markdown', name: 'JSON to Markdown Table', description: 'Convert JSON data to a Notion/Markdown table', icon: 'ðŸ“', keywords: 'json to markdown table converter notion paste' },
    ],
  },
  {
    id: 'text-extractor',
    name: 'Text Extractor & Parser',
    description: 'Extract emails, URLs, numbers, and phone numbers from text. Parse and filter data instantly.',
    icon: 'ðŸ”',
    color: '#8b5cf6',
    tools: [
      { slug: 'extract-emails', name: 'Extract Emails', description: 'Extract all email addresses from text', icon: 'ðŸ“§', keywords: 'extract email addresses from text online' },
      { slug: 'extract-urls', name: 'Extract URLs', description: 'Extract all links from text', icon: 'ðŸ”—', keywords: 'extract all links from text online free' },
      { slug: 'extract-numbers', name: 'Extract Numbers', description: 'Extract all numbers from text', icon: 'ðŸ”¢', keywords: 'extract only numbers from text online' },
      { slug: 'extract-phones', name: 'Extract Phone Numbers', description: 'Extract phone numbers from text', icon: 'ðŸ“±', keywords: 'extract phone numbers from text online' },
      { slug: 'pii-redactor', name: 'PII & Privacy Redactor', description: 'Redact sensitive data (emails, IPs, API keys) from text', icon: 'ðŸ›¡ï¸', keywords: 'pii redactor online redact sensitive data remove emails ip keys' },
      { slug: 'find-replace', name: 'Find and Replace', description: 'Find and replace text in bulk', icon: 'ðŸ”Ž', keywords: 'find and replace text online bulk' },
      { slug: 'regex-tester', name: 'Regex Tester', description: 'Test regular expressions with live matching', icon: 'ðŸ§ª', keywords: 'test regex pattern online with explanation' },
      { slug: 'text-compare', name: 'Text Compare / Diff', description: 'Compare two texts side by side', icon: 'âš–ï¸', keywords: 'compare two texts side by side online' },
    ],
  },
  {
    id: 'generators-randomizers',
    name: 'Generators & Randomizers',
    description: 'Generate passwords, UUIDs, random strings, mock data, and lorem ipsum text instantly.',
    icon: 'ðŸŽ²',
    color: '#f59e0b',
    tools: [
      { slug: 'uuid-generator', name: 'UUID Generator', description: 'Generate random UUID v4 strings', icon: 'ðŸ†”', keywords: 'uuid generator online v4 bulk random' },
      { slug: 'password-generator', name: 'Password Generator', description: 'Generate secure random passwords', icon: 'ðŸ”‘', keywords: 'strong password generator secure online free' },
      { slug: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder dummy text', icon: 'ðŸ“', keywords: 'lorem ipsum placeholder text generator' },
      { slug: 'random-number', name: 'Random Number Generator', description: 'Generate random numbers within a range', icon: 'ðŸ”¢', keywords: 'random number generator min max range' },
      { slug: 'random-string', name: 'Random String Generator', description: 'Generate random alphanumeric strings', icon: 'ðŸ” ', keywords: 'random string generator custom length' },
      { slug: 'string-repeater', name: 'String Repeater', description: 'Repeat a text string multiple times', icon: 'ðŸ”', keywords: 'repeat text string multiple times online' },
      { slug: 'fake-name-generator', name: 'Fake Name Generator', description: 'Generate random fake names', icon: 'ðŸ‘¤', keywords: 'random fake name generator online' },
      { slug: 'fake-address-generator', name: 'Fake Address Generator', description: 'Generate random fake addresses', icon: 'ðŸ ', keywords: 'random fake physical address generator' },
      { slug: 'mac-address-generator', name: 'MAC Address Generator', description: 'Generate random MAC addresses', icon: 'ðŸŒ', keywords: 'random mac address generator online' },
      { slug: 'string-combiner', name: 'String Combiner', description: 'Combine prefixes and suffixes with lists', icon: 'âž•', keywords: 'combine text string lists online' },
      { slug: 'password-strength', name: 'Password Strength Analyzer', description: 'Analyze password strength and entropy securely offline', icon: 'ðŸ›¡ï¸', keywords: 'password strength checker analyzer entropy secure offline' },
      { slug: 'zalgo-text', name: 'Zalgo / Glitch Text Generator', description: 'Generate corrupted, glitchy Zalgo text', icon: 'ðŸ‘ï¸', keywords: 'zalgo text generator glitch text creepy text copy paste' },
    ],
  },
  {
    id: 'text-hasher-cryptography',
    name: 'Text Hasher & Cryptography',
    description: 'Hash strings using MD5, SHA-256 or encrypt/decrypt text securely using AES/DES directly in the browser.',
    icon: 'ðŸ”',
    color: '#ef4444',
    tools: [
      { slug: 'md5-hash', name: 'MD5 Hash', description: 'Generate MD5 hash of text', icon: '#ï¸âƒ£', keywords: 'md5 hash generator online free' },
      { slug: 'sha1-hash', name: 'SHA-1 Hash', description: 'Generate SHA-1 hash of text', icon: '#ï¸âƒ£', keywords: 'sha1 hash generator online' },
      { slug: 'sha256-hash', name: 'SHA-256 Hash', description: 'Generate SHA-256 hash of text', icon: '#ï¸âƒ£', keywords: 'sha256 hash generator secure online' },
      { slug: 'sha512-hash', name: 'SHA-512 Hash', description: 'Generate SHA-512 hash of text', icon: '#ï¸âƒ£', keywords: 'sha512 hash generator online' },
      { slug: 'sha224-hash', name: 'SHA-224 Hash', description: 'Generate SHA-224 hash of text', icon: '#ï¸âƒ£', keywords: 'sha224 hash generator online' },
      { slug: 'sha384-hash', name: 'SHA-384 Hash', description: 'Generate SHA-384 hash of text', icon: '#ï¸âƒ£', keywords: 'sha384 hash generator online' },
      { slug: 'sha3-hash', name: 'SHA-3 Hash', description: 'Generate SHA-3 hash of text', icon: '#ï¸âƒ£', keywords: 'sha3 hash generator online' },
      { slug: 'ripemd160-hash', name: 'RIPEMD-160 Hash', description: 'Generate RIPEMD-160 hash of text', icon: '#ï¸âƒ£', keywords: 'ripemd160 hash generator online' },
      { slug: 'aes-encrypt-decrypt', name: 'AES Encrypt / Decrypt', description: 'Encrypt and decrypt text using AES', icon: 'ðŸ”’', keywords: 'aes text encrypt decrypt online' },
      { slug: 'des-encrypt-decrypt', name: 'DES Encrypt / Decrypt', description: 'Encrypt and decrypt text using DES', icon: 'ðŸ”', keywords: 'des text encrypt decrypt online' },
      { slug: 'bcrypt-generator', name: 'Bcrypt Generator & Checker', description: 'Generate and verify Bcrypt hashes securely in your browser', icon: 'ðŸ›¡ï¸', keywords: 'bcrypt generator online check verify bcrypt hash secure' },
    ],
  },
  {
    id: 'list-array-tools',
    name: 'List & Array Tools',
    description: 'Shuffle, combine, sort, or manipulate text lists and arrays effortlessly.',
    icon: 'ðŸ“‹',
    color: '#10b981',
    tools: [
      { slug: 'shuffle-list', name: 'Shuffle List', description: 'Randomize the order of items in a list', icon: 'ðŸ”€', keywords: 'shuffle list items random order online' },
      { slug: 'list-intersection', name: 'List Intersection', description: 'Find common items between two lists', icon: 'ðŸ¤', keywords: 'find common items list intersection online' },
      { slug: 'list-difference', name: 'List Difference', description: 'Find unique items between two lists', icon: 'â‰ ', keywords: 'find unique items list difference online' },
      { slug: 'comma-separator', name: 'Comma Separator', description: 'Convert list to comma-separated text', icon: 'ðŸ’¬', keywords: 'convert list to comma separated string' },
      { slug: 'split-text', name: 'Split Text', description: 'Split text into a list by delimiter', icon: 'âœ‚ï¸', keywords: 'split text string by delimiter online' },
      { slug: 'join-text', name: 'Join Text', description: 'Join list items with a delimiter', icon: 'ðŸ”—', keywords: 'join list items string array online' },
      { slug: 'number-to-words', name: 'Number to Words', description: 'Convert digits to written words', icon: 'ðŸ” ', keywords: 'convert numbers to words written out' },
      { slug: 'words-to-numbers', name: 'Words to Numbers', description: 'Convert written words to digits', icon: 'ðŸ”¢', keywords: 'convert words to numbers digits' },
      { slug: 'add-prefix', name: 'Add Prefix to List', description: 'Add prefix string to all list items', icon: 'âž¡ï¸', keywords: 'add prefix to all lines in list' },
      { slug: 'add-suffix', name: 'Add Suffix to List', description: 'Add suffix string to all list items', icon: 'â¬…ï¸', keywords: 'add suffix to all lines in list' },
    ],
  },
  {
    id: 'web-developer-tools',
    name: 'Web & Developer Tools',
    description: 'Tools for developers: decode JWTs, parse URLs, extract CSS colors, and format tags.',
    icon: 'ðŸ’»',
    color: '#0ea5e9',
    tools: [
      { slug: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode JSON Web Tokens instantly', icon: 'ðŸ”‘', keywords: 'decode jwt json web token online secure' },
      { slug: 'color-converter', name: 'Color Converter', description: 'Convert between HEX, RGB, HSL', icon: 'ðŸŽ¨', keywords: 'convert hex to rgb hsl color online' },
      { slug: 'css-color-extractor', name: 'CSS Color Extractor', description: 'Extract color codes from CSS', icon: 'ðŸ–Œï¸', keywords: 'extract hex rgb colors from css code' },
      { slug: 'query-string-parser', name: 'Query String Parser', description: 'Parse URL query string parameters', icon: 'ðŸ”—', keywords: 'parse url query string parameters to json' },
      { slug: 'url-slug-generator', name: 'URL Slug Generator', description: 'Convert text to a URL-friendly slug', icon: 'ðŸ”—', keywords: 'create seo url slug generator online' },
      { slug: 'html-tag-remover', name: 'HTML Tag Remover', description: 'Strip specific HTML tags from text', icon: 'ðŸ§¹', keywords: 'remove specific html tags strip code' },
      { slug: 'bbcode-to-html', name: 'BBCode to HTML', description: 'Convert forum BBCode to HTML', icon: 'ðŸ”', keywords: 'convert bbcode to html tag parser' },
      { slug: 'html-to-bbcode', name: 'HTML to BBCode', description: 'Convert HTML to forum BBCode', icon: 'ðŸ”„', keywords: 'convert html to bbcode forum tag parser' },
      { slug: 'markdown-stripper', name: 'Markdown Stripper', description: 'Remove markdown formatting from text', icon: 'ðŸ“', keywords: 'remove strip markdown formatting text' },
      { slug: 'sql-escaper', name: 'SQL Escaper', description: 'Escape quotes in SQL strings', icon: 'ðŸ›¡ï¸', keywords: 'escape sql quotes string injector' },
    ],
  },
  {
    id: 'ai-data-tools',
    name: 'AI & Data Cleaners',
    description: 'Clean transcripts, sanitize AI prompts, and extract emails securely. 100% private, no server uploads.',
    icon: 'ðŸ¤–',
    color: '#8b5cf6',
    tools: [
      { slug: 'transcript-cleaner', name: 'Zoom/Teams Transcript Cleaner', description: 'Remove timestamps and names from meeting transcripts', icon: 'ðŸŽ™ï¸', keywords: 'remove timestamps from zoom transcript clean teams transcript formatting text' },
      { slug: 'ai-prompt-sanitizer', name: 'AI Prompt Sanitizer', description: 'Clean text and remove markdown for ChatGPT to save tokens', icon: 'ðŸ§¹', keywords: 'clean text for chatgpt remove markdown save tokens format prompt' },
      { slug: 'secure-email-extractor', name: 'Secure Email Extractor', description: 'Extract emails locally from any text without server tracking', icon: 'ðŸ“§', keywords: 'extract emails from text online safe privacy no tracking client side' }
    ],
  },
  {
    id: 'pdf-text-tools',
    name: 'PDF Text Extract & Clean',
    description: 'Extract raw text from PDFs instantly in your browser. Remove line breaks, fix hyphens, and clean up PDF formatting for easy copying to ChatGPT or Word.',
    icon: 'ðŸ“„',
    color: '#ef4444',
    tools: [
      { slug: 'pdf-to-text', name: 'PDF to Raw Text', description: 'Extract raw text from any PDF file', icon: 'ðŸ“', keywords: 'extract text from pdf online free browser pdf.js' },
      { slug: 'pdf-line-break-remover', name: 'PDF Line Break Remover', description: 'Extract PDF text and remove broken line breaks automatically', icon: 'ðŸ”§', keywords: 'remove line breaks from pdf copy paste clean text chatgpt' },
      { slug: 'pdf-text-editor', name: 'PDF Editor', description: 'Edit text, annotate, sign and redact PDF files free online â€” no upload, 100% private', icon: 'âœï¸', keywords: 'edit pdf online free no upload, pdf editor browser free, free online pdf editor no watermark, edit text in pdf free' },
      { slug: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDF files into one â€” free, no upload, no limits', icon: 'ðŸ”—', keywords: 'merge pdf online free, combine pdf files free, join pdfs online no upload, merge pdf no watermark free' },
      { slug: 'annotate-pdf', name: 'Annotate PDF', description: 'Highlight, underline and add sticky notes to PDFs online free', icon: 'ðŸ–Šï¸', keywords: 'annotate pdf online free, highlight pdf online, add comments to pdf free, pdf annotation tool browser' },
      { slug: 'sign-pdf', name: 'Sign PDF', description: 'Add your signature to any PDF online free â€” draw, type or upload', icon: 'âœï¸', keywords: 'sign pdf online free, esign pdf free no signup, add signature to pdf free, electronic signature pdf browser' },
      { slug: 'redact-pdf', name: 'Redact PDF', description: 'Permanently black out sensitive text in PDFs â€” free, 100% private', icon: 'â¬›', keywords: 'redact pdf online free, black out text in pdf, pdf redaction tool free, remove sensitive info from pdf' },
      { slug: 'watermark-pdf', name: 'Watermark PDF', description: 'Add a watermark to all pages of your PDF â€” free, no signup', icon: 'ðŸ”–', keywords: 'add watermark to pdf free online, pdf watermark tool browser, stamp pdf confidential free, watermark all pages pdf' },
      { slug: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size online free â€” adjust quality, no upload required', icon: 'ðŸ“¦', keywords: 'compress pdf online free, reduce pdf file size free, shrink pdf no upload, pdf compressor browser' },
      { slug: 'protect-pdf', name: 'Password Protect PDF', description: 'Add a password to your PDF free â€” browser-based, no upload', icon: 'ðŸ”', keywords: 'password protect pdf free online, encrypt pdf online free, add password to pdf browser, lock pdf free' },
      { slug: 'split-pdf', name: 'Split PDF', description: 'Split a PDF into multiple files online free â€” extract pages or split by page range. No upload, no signup.', icon: 'âœ‚ï¸', keywords: 'split pdf online free, split pdf into pages free, extract pages from pdf online, divide pdf file free no signup, separate pdf pages online free' },
      { slug: 'pdf-page-numbers', name: 'Add Page Numbers to PDF', description: 'Add page numbers to PDF online free â€” choose position, font size and starting number. No upload, 100% private.', icon: 'ðŸ”¢', keywords: 'add page numbers to pdf free online, insert page numbers in pdf browser, number pdf pages free no signup, pdf page numbering tool free' },
      { slug: 'pdf-to-word', name: 'PDF to Word Converter', description: 'Convert PDF to editable Word document (.docx) or plain text free â€” no server upload, preserves text layout, no page limit.', icon: 'ðŸ“', keywords: 'pdf to word converter free online, convert pdf to docx free no signup, pdf to word free no watermark, extract text from pdf to word, pdf to editable document free browser' },
    ],
  },
  {
    id: 'audio-speech-tools',
    name: 'Audio & Speech Tools',
    description: 'Convert text to speech, listen to articles, and configure multiple voices, pitches, and speeds entirely in your browser.',
    icon: 'ðŸ”Š',
    color: '#eab308',
    tools: [
      { slug: 'text-to-audio', name: 'Text to Audio (TTS)', description: 'Convert text to spoken audio with 50+ languages', icon: 'ðŸ—£ï¸', keywords: 'text to audio converter text to speech tts online free multiple languages voices' },
    ],
  },
  {
    id: 'social-media-tools',
    name: 'Social Media Creator Tools',
    description: 'Format, optimize, and organize your text for Instagram, TikTok, Twitter, YouTube, and LinkedIn.',
    icon: 'ðŸ“±',
    color: '#d946ef',
    tools: [
      { slug: 'instagram-caption-spacer', name: 'Instagram & TikTok Caption Spacer', description: 'Fix line breaks and add invisible spaces for Instagram and TikTok captions', icon: 'ðŸ“', keywords: 'instagram caption spacer tool free invisible space for instagram tiktok line break fixer copy paste caption formatter' },
      { slug: 'twitter-thread-splitter', name: 'Twitter/X Thread Splitter', description: 'Split long text into perfectly sized tweet threads with auto-numbering', icon: 'ðŸ§µ', keywords: 'twitter thread maker online free split text into tweets tweet thread generator x thread splitter tool' },
      { slug: 'youtube-timestamp-generator', name: 'YouTube Timestamp & Chapter Generator', description: 'Format timestamps into YouTube chapter markers for video descriptions', icon: 'â±ï¸', keywords: 'youtube chapter generator free youtube timestamp formatter video description timestamp maker online' },
      { slug: 'social-media-character-counter', name: 'Social Media Character Limit Checker', description: 'Check text length against Instagram, Twitter, TikTok, LinkedIn, and YouTube limits', icon: 'ðŸ“Š', keywords: 'social media character counter instagram caption limit checker twitter character limit tiktok caption length linkedin post limit' },
      { slug: 'fancy-font-generator', name: 'Fancy Font & Aesthetic Text Generator', description: 'Generate stylish Unicode fonts for Instagram bios, TikTok names, and social media profiles', icon: 'âœ¨', keywords: 'instagram bio font generator aesthetic text generator fancy font copy paste unicode text converter cool fonts for social media' },
      { slug: 'hashtag-shuffler', name: 'Instagram Hashtag Shuffler & Mixer', description: 'Randomly shuffle and pick hashtags to avoid Instagram shadowban', icon: 'ðŸ”€', keywords: 'hashtag shuffler online free randomize instagram hashtags hashtag mixer avoid shadowban instagram tag randomizer' },
      { slug: 'youtube-title-analyzer', name: 'YouTube Title & Description SEO Analyzer', description: 'Analyze and optimize YouTube video titles and descriptions for higher CTR and SEO', icon: 'ðŸŽ¬', keywords: 'youtube title analyzer free youtube seo checker video title optimizer youtube description analyzer ctr optimizer' },
      { slug: 'emoji-translator', name: 'Emoji Translator & Text Enhancer', description: 'Auto-add relevant emojis to your text for engaging social media posts', icon: 'ðŸ˜€', keywords: 'text to emoji converter online emoji translator add emojis to text automatically emoji text enhancer for social media' },
      { slug: 'teleprompter-formatter', name: 'Teleprompter Script Formatter', description: 'Format scripts for easy teleprompter reading on mobile while recording Reels and TikToks', icon: 'ðŸ“œ', keywords: 'teleprompter text formatter free script reader format online mobile teleprompter for tiktok reels video script formatter' },
      { slug: 'utm-link-builder', name: 'UTM Link Builder for Creators', description: 'Build UTM tracking links for Instagram bio, YouTube descriptions, and social media campaigns', icon: 'ðŸ”—', keywords: 'utm link builder free simple utm generator social media tracking link creator instagram bio link tracker youtube link builder' },
    ],
  },
  {
    id: 'spreadsheet-tools',
    name: 'Excel & Spreadsheet Tools',
    description: 'Upload, view, edit, clean, sort, filter, and export Excel files online. No signup, fully private â€” all processing in your browser.',
    icon: 'ðŸ“Š',
    color: '#16a34a',
    tools: [
      { slug: 'excel-editor', name: 'Excel Editor & Viewer', description: 'Upload, edit, clean, sort, filter and export Excel & CSV files online', icon: 'ðŸ“Š', keywords: 'excel editor online free upload xlsx csv edit spreadsheet viewer no signup' },
      { slug: 'excel-to-csv', name: 'Excel to CSV Converter', description: 'Convert Excel XLSX files to CSV online free â€” instant, no upload to servers, no signup required.', icon: 'ðŸ“‹', keywords: 'excel to csv converter free online, xlsx to csv online free, convert excel to csv no upload, xlsx to csv free no signup, export excel as csv browser' },
      { slug: 'csv-to-excel', name: 'CSV to Excel Converter', description: 'Convert CSV files to Excel XLSX online free â€” instant download, no upload, no signup.', icon: 'ðŸ“Š', keywords: 'csv to excel converter free online, convert csv to xlsx free, csv to excel no upload, csv to spreadsheet online free' },
    ],
  },
  {
    id: 'gta-6-tools',
    name: 'GTA 6 Tools',
    description: 'Trending GTA 6 tools: generate Vice City news headlines, custom license plates, check PC specs, explore the map, and create rap sheets. Build hype for Grand Theft Auto VI!',
    icon: 'ðŸŒ´',
    color: '#f472b6',
    tools: [
      { slug: 'vice-city-headline-generator', name: 'Vice City News Headline Generator', description: 'Create a custom Florida Man / Vice City style breaking news graphic.', icon: 'ðŸ“°', keywords: 'gta 6 news generator vice city headline maker florida man meme generator grand theft auto 6 custom news breaking news generator gta vi meme tool' },
      { slug: 'vice-city-license-plate', name: 'Vice City License Plate Creator', description: 'Design a custom Leonida state license plate in GTA 6 style.', icon: 'ðŸš—', keywords: 'gta 6 license plate generator custom vice city plate maker leonida state plate creator grand theft auto 6 car plate design' },
      { slug: 'gta-6-pc-requirements', name: 'GTA 6 PC Requirements Checker', description: 'Check if your PC can run GTA 6 and get upgrade recommendations.', icon: 'ðŸ’»', keywords: 'can my pc run gta 6 system requirements checker gta vi specs test pc builder gta 6 minimum requirements recommended specs' },
      { slug: 'vice-city-speculation-map', name: 'Vice City Interactive Map', description: 'Explore and pin locations on the speculated GTA 6 Vice City map.', icon: 'ðŸ—ºï¸', keywords: 'gta 6 map interactive vice city map explorer leonida map gta vi locations points of interest speculation map' },
      { slug: 'vice-city-rap-sheet', name: 'Vice City Rap Sheet Generator', description: 'Generate your own VCPD criminal record and mugshot card.', icon: 'ðŸ”«', keywords: 'gta 6 mugshot generator vice city police record maker criminal rap sheet creator vcpd wanted poster generator gta vi character card' },
    ],
  },
  {
    id: 'file-editor-tools',
    name: 'File & Document Editor',
    description: 'Edit text in PDF, images, Word docs, and any file online â€” free, no watermark, no signup. OCR-powered, 100% private, all processing in your browser.',
    icon: 'ðŸ“„',
    color: '#0ea5e9',
    tools: [
      {
        slug: 'image-text-editor',
        name: 'Image Text Editor',
        description: 'Edit text in JPG, PNG, WEBP and any image online free â€” OCR-powered, instant, 100% private',
        icon: 'ðŸ–¼ï¸',
        keywords: 'edit text in image online free, change text in jpg png online, ocr image text editor free, extract text from image and edit, remove text from image online'
      },
      {
        slug: 'word-document-editor',
        name: 'Word Document Editor',
        description: 'Edit DOCX Word documents online free without Microsoft Word â€” instant, private, no signup',
        icon: 'ðŸ“',
        keywords: 'edit word document online free without microsoft, docx editor browser free, open docx file online edit, word document editor no signup'
      },
      {
        slug: 'text-file-editor',
        name: 'Text File Editor',
        description: 'Edit TXT, CSV, MD, HTML, XML, JSON and any text file online â€” full-screen, free, instant',
        icon: 'ðŸ“ƒ',
        keywords: 'edit text file online free, txt csv editor browser, online notepad open any file, edit txt file online, free text file editor no download'
      },
      {
        slug: 'universal-file-editor',
        name: 'Universal File Editor',
        description: 'Upload any file and edit all text â€” PDF, image, Word, CSV, JSON â€” free, no watermark, no signup',
        icon: 'ðŸ—‚ï¸',
        keywords: 'edit any file text online free, universal document editor browser, all file types text editor online, upload file edit text free'
      },
    ],
  },
  {
    id: 'productivity-tools',
    name: 'Productivity & Writing Tools',
    description: 'Boost your productivity with typing speed test, online notepad, speech to text, AI text humanizer, and text to handwriting converter. All free, no signup.',
    icon: 'âš¡',
    color: '#8b5cf6',
    tools: [
      {
        slug: 'typing-speed-test',
        name: 'Typing Speed Test',
        description: 'Free online typing speed test â€” check your WPM, accuracy, and errors in 1, 2 or 5 minutes. Works in 6 languages.',
        icon: 'âŒ¨ï¸',
        keywords: 'typing speed test online free wpm, typing test check my speed, how fast can i type test, words per minute test online, free typing test 1 minute no signup',
      },
      {
        slug: 'online-notepad',
        name: 'Online Notepad',
        description: 'Free online notepad with auto-save, multiple tabs, dark mode, word count, Markdown preview and export to TXT/HTML.',
        icon: 'ðŸ“’',
        keywords: 'online notepad free no signup, free notepad online auto save, online text editor notepad browser, open notepad online free, best free online notepad',
      },
      {
        slug: 'speech-to-text',
        name: 'Speech to Text',
        description: 'Free online speech to text converter â€” speak into your microphone and get instant text transcription. Works in 6 languages.',
        icon: 'ðŸŽ¤',
        keywords: 'speech to text online free no signup, voice to text converter free online, speak and type online free, free dictation software online, microphone to text online',
      },
      {
        slug: 'ai-text-humanizer',
        name: 'AI Text Humanizer',
        description: 'Free AI to human text converter â€” make AI-generated text sound natural and human. No signup, 100% private.',
        icon: 'ðŸ¤–',
        keywords: 'ai text humanizer free online, convert ai text to human text free, make chatgpt text sound human, ai to human text converter no signup, humanize ai written text free',
      },
      {
        slug: 'text-to-handwriting',
        name: 'Text to Handwriting',
        description: 'Convert typed text to realistic handwriting style online free â€” choose paper style, pen color, download as PNG.',
        icon: 'âœï¸',
        keywords: 'text to handwriting converter free online, convert text to handwriting online, make text look handwritten free, typing to handwriting generator, handwriting text converter download png',
      },
      {
        slug: 'resume-builder',
        name: 'Free Resume Builder',
        description: 'Build a professional resume online free â€” 5 templates, live preview, PDF download with no watermark. No signup required.',
        icon: 'ðŸ“„',
        keywords: 'free resume builder online no watermark, resume maker free PDF download, professional resume builder no signup, CV maker free online India, create resume online free download PDF',
      },
    ],
  }
  ,
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // IMAGE TOOLS â€” 500K+ monthly searches, all browser-based
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 'ai-document-tools',
    name: 'AI Document Tools',
    description: 'AI-powered document processing tools â€” compare PDFs, extract tables from screenshots, analyze bank statements, generate MCQs, and convert lecture PDFs to study notes. 100% private, browser-based.',
    icon: 'ðŸ¤–',
    color: '#7c3aed',
    tools: [
      {
        slug: 'pdf-diff-checker',
        name: 'PDF Difference Checker',
        description: 'Compare two PDF files and find every difference â€” word-level text diff with red/green highlights. Free, no upload, no signup.',
        icon: 'ðŸ”',
        keywords: 'compare two pdf files online free, pdf difference checker, pdf diff tool free no upload, find differences between pdfs, pdf comparison tool free, compare pdf documents online',
      },
      {
        slug: 'screenshot-to-excel',
        name: 'Screenshot to Excel',
        description: 'Convert screenshots and images of tables to Excel/CSV using OCR. Extract table data from photos instantly. No upload, free.',
        icon: 'ðŸ“¸',
        keywords: 'screenshot to excel free online, image to excel converter free, photo to spreadsheet ocr, table from screenshot to csv free, convert image table to excel no upload',
      },
      {
        slug: 'bank-statement-analyzer',
        name: 'Bank Statement Analyzer',
        description: 'Analyze bank statements â€” categorize transactions, spending insights, charts, export to CSV/Excel. Upload PDF or CSV. 100% private.',
        icon: 'ðŸ¦',
        keywords: 'bank statement analyzer free online, analyze bank statement pdf free, categorize bank transactions online, spending analysis bank statement free, bank statement reader free no signup',
      },
      {
        slug: 'scanned-pdf-to-data',
        name: 'Scanned PDF to Structured Data',
        description: 'Extract structured data from scanned PDFs using OCR â€” tables, text, key-value pairs. Export to JSON, CSV or Excel. Free, private.',
        icon: 'ðŸ“Š',
        keywords: 'scanned pdf to excel free, extract table from scanned pdf online free, pdf ocr table extractor, scanned document to structured data, pdf to json extractor free no upload',
      },
      {
        slug: 'screenshot-to-document',
        name: 'Screenshot to Editable Document',
        description: 'Convert screenshots and images to editable Word, PDF or text documents using OCR. Free, no upload to servers.',
        icon: 'ðŸ“„',
        keywords: 'screenshot to word document free, image to editable document free, ocr screenshot to text free, convert screenshot to docx free, photo to editable document no upload',
      },
      {
        slug: 'pdf-to-mcq',
        name: 'PDF to MCQ Generator',
        description: 'Generate multiple choice questions from any PDF, notes or text. AI creates MCQs with 4 options and answer key. Free, no signup.',
        icon: 'â“',
        keywords: 'pdf to mcq generator free, multiple choice question generator from pdf, mcq maker from document free, quiz generator from pdf free no signup, ai mcq generator from text free',
      },
      {
        slug: 'lecture-to-notes',
        name: 'Lecture PDF to Study Notes',
        description: 'Convert lecture PDFs and slides to organized study notes â€” bullet points, Cornell notes, mind map outline. Free, instant.',
        icon: 'ðŸ“',
        keywords: 'lecture pdf to notes free, pdf to study notes converter, convert lecture slides to notes free, ai notes from pdf free no signup, summarize lecture pdf free',
      },
      {
        slug: 'document-to-excel',
        name: 'Document to Excel Extractor',
        description: 'Extract all tables and structured data from any document â€” PDF, Word, image â€” into Excel or CSV. Free, browser-based, no signup.',
        icon: 'ðŸ“‹',
        keywords: 'extract table from pdf to excel free, document to excel extractor, pdf table to csv free online, extract data from document to spreadsheet free no upload',
      },
    ],
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    description: 'Compress, resize, convert and edit images online free. JPG, PNG, WebP, GIF â€” all processed in your browser, no upload to servers.',
    icon: 'ðŸ–¼ï¸',
    color: '#0ea5e9',
    tools: [
      {
        slug: 'compress-image',
        name: 'Image Compressor',
        description: 'Compress JPG, PNG and WebP images online free â€” reduce file size without losing quality. No upload, no signup.',
        icon: 'ðŸ“¦',
        keywords: 'compress image online free, reduce image file size free, jpg compressor online no upload, png compressor free, image size reducer online, compress photo free',
      },
      {
        slug: 'resize-image',
        name: 'Image Resizer',
        description: 'Resize images online free â€” change width, height or percentage. JPG, PNG, WebP. No upload, instant download.',
        icon: 'â†”ï¸',
        keywords: 'resize image online free, change image size online, image resizer free no signup, resize jpg png online, reduce image dimensions free, photo resizer online',
      },
      {
        slug: 'convert-image',
        name: 'Image Converter',
        description: 'Convert images between JPG, PNG, WebP and GIF online free â€” instant, no upload, no signup required.',
        icon: 'ðŸ”„',
        keywords: 'convert jpg to png free online, png to jpg converter free, webp to jpg converter free, jpg to webp converter online, image format converter free no signup',
      },
      {
        slug: 'jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert JPG, PNG or any image to PDF online free â€” combine multiple images into one PDF. No upload, no signup.',
        icon: 'ðŸ“„',
        keywords: 'jpg to pdf converter free online, image to pdf converter free, convert jpg png to pdf online no signup, multiple images to pdf free, photo to pdf converter',
      },
      {
        slug: 'remove-background',
        name: 'Background Remover',
        description: 'Remove image background instantly and free â€” PNG with transparency or custom color. No server upload, no signup, works offline.',
        icon: 'ðŸŽ­',
        keywords: 'remove background from image free online, background remover no signup, transparent background png maker free, remove bg from photo free, image background eraser online no upload',
      },
      {
        slug: 'heic-to-jpg',
        name: 'HEIC to JPG Converter',
        description: 'Convert iPhone HEIC photos to JPG or PNG free online â€” bulk convert, no upload, instant download.',
        icon: 'ðŸ“±',
        keywords: 'heic to jpg converter free online, convert iphone heic to jpg, heif to jpeg online free, heic to png converter no upload, iphone photo heic converter free',
      },
      {
        slug: 'passport-photo-maker',
        name: 'Passport Photo Maker',
        description: 'Make passport photos for India, US, UK, Schengen â€” 35x45mm, white background, 300 DPI, print-ready 4x6 sheet. Free, no signup.',
        icon: 'ðŸªª',
        keywords: 'passport photo maker free online India, passport size photo maker 35x45mm, make passport photo online free no signup, digital passport photo creator, visa photo maker free online',
      },
      {
        slug: 'meme-generator',
        name: 'Meme Generator',
        description: 'Create memes online free â€” upload any image or use templates, add top/bottom text, download PNG. No watermark, no signup.',
        icon: 'ðŸ˜‚',
        keywords: 'meme generator free online no watermark, create meme with any image, meme maker online free download, add text to image meme, funny meme creator free no signup',
      },
    ],
  {
    id: 'finance-tools',
    name: 'Finance & Document Tools',
    description: 'Free browser-based finance tools — convert bank statements to Excel, analyze spending, detect subscriptions. Works with 500+ banks worldwide. 100% private, no upload, no signup.',
    icon: '🏦',
    color: '#10b981',
    tools: [
      {
        slug: 'bank-statement-converter',
        name: 'Bank Statement to Excel Converter',
        description: 'Convert any bank statement PDF to clean Excel or CSV. Auto-detects 500+ banks, categorizes spending, detects subscriptions, balance verification. Free, nothing uploaded.',
        icon: '🏦',
        keywords: 'bank statement to excel converter free online, convert pdf bank statement to excel free, bank statement pdf to csv converter, bank statement analyzer free no upload, convert bank statement to spreadsheet online free',
      },
    ],
  },
  },
  {
    id: 'government-tools',
    name: 'Government & Finance Tools',
    description: 'Free tools for Indian citizens and government employees â€” rupees to words, age calculator, salary slip, RTI application, GST invoice. 100% private, browser-based, no signup.',
    icon: 'ðŸ›ï¸',
    color: '#dc2626',
    tools: [
      {
        slug: 'rupees-to-words',
        name: 'Rupees to Words Converter',
        description: 'Convert numbers to Indian Rupees in words for cheques, invoices and legal documents. Supports Lakh/Crore system with Paise. Instant copy.',
        icon: 'ðŸ’°',
        keywords: 'rupees to words converter free, amount in words for cheque India, number to words Indian rupees, rupees in words lakh crore paise, cheque amount words generator free',
      },
      {
        slug: 'age-calculator',
        name: 'Age Calculator',
        description: 'Calculate exact age from date of birth â€” years, months, days. SSC, UPSC, Railway, Bank exam eligibility checker with cut-off date support.',
        icon: 'ðŸŽ‚',
        keywords: 'age calculator for government exam free, age calculator SSC UPSC railway bank 2026, date of birth exact age calculator India, exam eligibility age calculator years months days, age calculator with cut-off date',
      },
      {
        slug: 'salary-slip-generator',
        name: 'Salary Slip Generator',
        description: 'Generate professional salary slips with PF, ESI, HRA, DA, PT auto-calculation. Download PDF instantly. No signup, no watermark, 100% free.',
        icon: 'ðŸ“‹',
        keywords: 'salary slip generator free India online, payslip maker free no signup no watermark, salary slip format India PDF download, free salary slip with PF ESI HRA calculation, payslip generator India 2026',
      },
      {
        slug: 'rti-application-generator',
        name: 'RTI Application Generator',
        description: 'Generate a properly formatted Right to Information (RTI) application under Section 6(1) of RTI Act 2005. Free, instant PDF, no signup.',
        icon: 'ðŸ“œ',
        keywords: 'RTI application generator free online India, RTI format generator Section 6 RTI Act, right to information application draft free, RTI application sample format 2026, how to write RTI application India free',
      },
      {
        slug: 'gst-invoice-generator',
        name: 'GST Invoice Generator',
        description: 'Create GST-compliant tax invoices with CGST/SGST/IGST split, HSN codes, amount in words. PDF download. Free, no signup, no watermark.',
        icon: 'ðŸ§¾',
        keywords: 'GST invoice generator free online India, free GST bill maker no signup no watermark, tax invoice format India CGST SGST IGST, GST invoice PDF download free, GST invoice generator small business India 2026',
      },
      {
        slug: 'gov-doc-translator',
        name: 'Government Document Translator',
        description: 'Translate any government PDF or scanned image to Hindi, Marathi, Tamil, Telugu and 13 more languages. OCR for scanned documents. Plain Hindi explanation for citizens. 100% private.',
        icon: 'ðŸ‡®ðŸ‡³',
        keywords: 'government document translator Hindi free online, translate PDF to Hindi Marathi Tamil free, OCR government document translation India, sarkari dastavez anuvad free, translate government order certificate Hindi online',
      },
      {
        slug: 'gov-doc-extractor',
        name: 'Government Document Data Extractor',
        description: 'Extract Name, DOB, Aadhaar, Address, District, Certificate No. from 100s of scanned government forms. Export to Excel, CSV, JSON. Duplicate detection. Free, 100% private.',
        icon: 'ðŸ“Š',
        keywords: 'government document data extractor OCR free India, extract data from scanned form to Excel free, OCR PDF form data extraction India, government form digitization tool free, bulk OCR government forms Excel CSV',
      },
      {
        slug: 'rti-first-appeal',
        name: 'RTI First Appeal Generator',
        description: 'Generate a legally correct RTI First Appeal under Section 19(1) of RTI Act 2005. 4-step wizard, select appeal grounds, relief sought, download PDF. Free, no signup.',
        icon: 'âš–ï¸',
        keywords: 'RTI first appeal generator free India, Section 19(1) RTI first appeal format, RTI appeal application draft India, how to file RTI first appeal India, RTI first appeal format PDF free',
      },
      {
        slug: 'income-certificate-generator',
        name: 'Income Certificate Generator',
        description: 'Generate income certificate in standard India format â€” all states, SDM/Tehsildar format, amount in words auto-generated, PDF download. Free, no signup, 100% private.',
        icon: 'ðŸ“œ',
        keywords: 'income certificate format India free online, income certificate generator all states India, SDM tehsildar income certificate PDF free, aay praman patra format India, income certificate download free',
      },
      {
        slug: 'rent-agreement-generator',
        name: 'Rent Agreement Generator',
        description: 'Generate 11-month rent agreement India with stamp duty calculator, all clauses, landlord/tenant details, witness section. PDF download. Free, no signup.',
        icon: 'ðŸ ',
        keywords: 'rent agreement format India free online, 11 month rent agreement generator India, rental agreement PDF download free India, kiraya agreement format India, stamp duty rent agreement calculator India',
      },
      {
        slug: 'pf-withdrawal-form-19',
        name: 'PF Withdrawal Form 19 Filler',
        description: 'Fill EPF Form 19 for final PF settlement â€” UAN, establishment, bank NEFT details, reason for leaving. Preview and download PDF. Free, 100% private.',
        icon: 'ðŸ¦',
        keywords: 'PF Form 19 filler online free, EPF withdrawal form 19 PDF India, PF final settlement form 19 fill online, EPF Form 19 download fill India, how to fill PF Form 19 online free',
      },
      {
        slug: 'form-16-explainer',
        name: 'Form 16 Tax Calculator â€” Old vs New Regime',
        description: 'Enter Form 16 data and instantly compare tax under Old vs New regime FY 2025-26. Shows exact refund or tax due. 80C/80D/HRA auto-calculated. Free, no signup.',
        icon: 'ðŸ’¼',
        keywords: 'Form 16 tax calculator India FY 2025-26 free, old vs new tax regime calculator Form 16, income tax calculator from Form 16, tax refund calculator India 2026, Form 16 Part B deductions calculator',
      },
    ],
  }
];

// Helper to read content safely
function getLocaleContent(lang) {
  const content = localeContents[lang];
  return content || localeContents['en'];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MEMOIZATION CACHES â€” Compute once per language, reuse everywhere
// This is critical for Cloudflare Workers CPU time limits
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const _allToolsCache = {};
const _categoryCache = {};

// Get all tools flat list (MEMOIZED)
export function getAllTools(lang = 'en') {
  if (_allToolsCache[lang]) return _allToolsCache[lang];

  const content = getLocaleContent(lang);
  const tools = [];
  for (const cat of CATEGORIES) {
    const catContent = content.categories[cat.id] || {};
    for (const tool of cat.tools) {
      const toolContent = content.tools[tool.slug] || {};
      tools.push({
        ...tool,
        name: toolContent.name || tool.name,
        description: toolContent.description || tool.description,
        categoryId: cat.id,
        categoryName: catContent.name || cat.name,
        categoryIcon: cat.icon,
        content: toolContent
      });
    }
  }
  _allToolsCache[lang] = tools;
  return tools;
}

// Helper: find tool by category + slug
export function getTool(categoryId, toolSlug, lang = 'en') {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;
  const tool = cat.tools.find(t => t.slug === toolSlug);
  if (!tool) return null;

  const content = getLocaleContent(lang);
  
  const toolContent = content.tools[toolSlug] || {};
  const catContent = content.categories[categoryId] || {};

  const mergedTool = {
    ...tool,
    name: toolContent.name || tool.name,
    description: toolContent.description || tool.description,
  };

  const mergedCat = {
    ...cat,
    name: catContent.name || cat.name,
  };

  return { ...mergedTool, category: mergedCat, content: toolContent };
}

// Helper: find category (MEMOIZED)
export function getCategory(categoryId, lang = 'en') {
  const cacheKey = `${categoryId}_${lang}`;
  if (_categoryCache[cacheKey]) return _categoryCache[cacheKey];

  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;

  const content = getLocaleContent(lang);
  const catContent = content.categories[categoryId] || {};
  const tools = cat.tools.map(t => {
    const toolContent = content.tools[t.slug] || {};
    return {
      ...t,
      name: toolContent.name || t.name,
      description: toolContent.description || t.description,
      content: toolContent
    };
  });
  
  const result = { 
    ...cat, 
    name: catContent.name || cat.name,
    description: catContent.description || cat.description,
    tools,
    content: catContent
  };
  _categoryCache[cacheKey] = result;
  return result;
}

// Helper: get related tools (same category, excluding current)
export function getRelatedTools(categoryId, currentSlug, lang = 'en', limit = 5) {
  const allTools = getAllTools(lang);
  return allTools
    .filter(t => t.categoryId === categoryId && t.slug !== currentSlug)
    .slice(0, limit);
}

// Helper: get tools from other categories for cross-linking
export function getCrossLinks(currentCategoryId, lang = 'en', limit = 4) {
  const allTools = getAllTools(lang);
  const otherCats = CATEGORIES.filter(c => c.id !== currentCategoryId);
  const links = [];
  const seenKeys = new Set();
  
  for (const cat of otherCats) {
    if (links.length >= limit) break;
    const firstToolInCat = allTools.find(t => t.categoryId === cat.id && !seenKeys.has(`${t.categoryId}-${t.slug}`));
    if (firstToolInCat) {
      seenKeys.add(`${firstToolInCat.categoryId}-${firstToolInCat.slug}`);
      links.push(firstToolInCat);
    }
  }
  return links;
}
