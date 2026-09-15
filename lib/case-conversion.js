const TOKEN_PATTERN = /(?:https?:\/\/[^\s<>'"]+|www\.[^\s<>'"]+)|(?:[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,})/giu;

function upper(text, locale) {
  if (!locale) return text.toUpperCase();
  try {
    return text.toLocaleUpperCase(locale);
  } catch {
    return text.toUpperCase();
  }
}

function lower(text, locale) {
  if (!locale) return text.toLowerCase();
  try {
    return text.toLocaleLowerCase(locale);
  } catch {
    return text.toLowerCase();
  }
}

export function convertToUppercase(text, options = {}) {
  const { locale = '', preserveUrls = false, preserveEmails = false } = options;
  if (!text) return '';
  if (!preserveUrls && !preserveEmails) return upper(text, locale);

  let cursor = 0;
  let result = '';
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const isEmail = token.includes('@') && !/^https?:\/\//i.test(token);
    const shouldPreserve = isEmail ? preserveEmails : preserveUrls;
    result += upper(text.slice(cursor, match.index), locale);
    result += shouldPreserve ? token : upper(token, locale);
    cursor = match.index + token.length;
  }
  return result + upper(text.slice(cursor), locale);
}

export function convertToLowercase(text, options = {}) {
  const { locale = '', preserveUrls = false, preserveEmails = false } = options;
  if (!text) return '';
  if (!preserveUrls && !preserveEmails) return lower(text, locale);

  let cursor = 0;
  let result = '';
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const isEmail = token.includes('@') && !/^https?:\/\//i.test(token);
    const shouldPreserve = isEmail ? preserveEmails : preserveUrls;
    result += lower(text.slice(cursor, match.index), locale);
    result += shouldPreserve ? token : lower(token, locale);
    cursor = match.index + token.length;
  }
  return result + lower(text.slice(cursor), locale);
}

export function getUppercaseStats(input, output) {
  const source = Array.from(input || '');
  const result = Array.from(output || '');
  let changed = 0;
  const comparable = Math.min(source.length, result.length);
  for (let index = 0; index < comparable; index += 1) {
    if (source[index] !== result[index]) changed += 1;
  }
  changed += Math.abs(source.length - result.length);
  return {
    characters: result.length,
    words: (output.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length,
    changed,
    lines: output ? output.split(/\r?\n/).length : 0,
  };
}

const ARTICLES = new Set(['a', 'an', 'the']);
const COORDINATING = new Set(['and', 'but', 'for', 'nor', 'or', 'so', 'yet']);
const COMMON_PREPOSITIONS = new Set(['as', 'at', 'by', 'for', 'from', 'in', 'into', 'near', 'of', 'off', 'on', 'onto', 'over', 'past', 'per', 'than', 'to', 'up', 'upon', 'via', 'with', 'within', 'without']);

function isMixedCase(word) {
  return /\p{Ll}/u.test(word) && /\p{Lu}/u.test(word) && !/^\p{Lu}\p{Ll}+$/u.test(word);
}

function capitalizeWord(word, locale) {
  const letters = Array.from(word);
  const firstLetter = letters.findIndex(char => /\p{L}/u.test(char));
  if (firstLetter < 0) return word;
  return `${letters.slice(0, firstLetter).join('')}${upper(letters[firstLetter], locale)}${lower(letters.slice(firstLetter + 1).join(''), locale)}`;
}

function isMinorWord(word, style) {
  const normalized = word.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
  if (!normalized) return false;
  if (ARTICLES.has(normalized) || COORDINATING.has(normalized) || normalized === 'to') return true;
  if (style === 'ap') return COMMON_PREPOSITIONS.has(normalized) && normalized.length <= 3;
  if (style === 'apa') return normalized.length <= 3 && COMMON_PREPOSITIONS.has(normalized);
  if (style === 'chicago' || style === 'mla') return COMMON_PREPOSITIONS.has(normalized);
  return ARTICLES.has(normalized) || COORDINATING.has(normalized) || ['at', 'by', 'in', 'of', 'on', 'to', 'up'].includes(normalized);
}

export function convertToTitleCase(text, options = {}) {
  const { style = 'common', locale = 'en', preserveAcronyms = true, preserveMixedCase = true, protectedWords = [] } = options;
  if (!text) return '';
  const protectedMap = new Map(protectedWords.filter(Boolean).map(word => [word.toLocaleLowerCase(locale), word]));

  return text.split(/(\r?\n)/).map(line => {
    if (/^\r?\n$/.test(line) || !line.trim()) return line;
    const matches = [...line.matchAll(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)];
    if (!matches.length) return line;
    let cursor = 0;
    let capitalizeNext = true;
    let result = '';
    matches.forEach((match, index) => {
      const word = match[0];
      const separator = line.slice(cursor, match.index);
      const key = word.toLocaleLowerCase(locale);
      const isBoundary = index === matches.length - 1 || capitalizeNext;
      let converted;
      if (protectedMap.has(key)) converted = protectedMap.get(key);
      else if (preserveAcronyms && /^\p{Lu}{2,}[\p{Lu}\p{N}.-]*$/u.test(word)) converted = word;
      else if (preserveMixedCase && isMixedCase(word)) converted = word;
      else if (!isBoundary && isMinorWord(word, style)) converted = lower(word, locale);
      else converted = word.split('-').map(part => capitalizeWord(part, locale)).join('-');
      result += separator + converted;
      cursor = match.index + word.length;
      capitalizeNext = /[:!?]\s*$/.test(line.slice(cursor, matches[index + 1]?.index ?? line.length));
    });
    return result + line.slice(cursor);
  }).join('');
}
