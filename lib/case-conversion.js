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
