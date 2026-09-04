import { SITE } from './tools-config';

// ═══════════════════════════════════════════════════════
// SUPPORTED LANGUAGES — Single Source of Truth
// WARNING: Language codes must NEVER match a category slug
// ═══════════════════════════════════════════════════════
export const LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English',    dir: 'ltr', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिंदी',       dir: 'ltr', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  dir: 'ltr', flag: '🇧🇷' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    dir: 'ltr', flag: '🇲🇽' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    dir: 'ltr', flag: '🇩🇪' },
  { code: 'id', name: 'Indonesian', nativeName: 'Indonesia',  dir: 'ltr', flag: '🇮🇩' },
];

export const LANG_CODES = LANGUAGES.map(l => l.code);
export const NON_EN_LANG_CODES = LANG_CODES.filter(c => c !== 'en');
export const DEFAULT_LANG = 'en';

/**
 * Get language config by code
 */
export function getLang(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

/**
 * Load translations for a language (build-time only — server components)
 */
export function getTranslations(lang) {
  try {
    return require(`@/locales/${lang}.json`);
  } catch {
    return require('@/locales/en.json');
  }
}

/**
 * Load massive tool content (descriptions, what-is, use cases)
 */
export function getToolContent(lang) {
  try {
    return require(`@/locales/content/${lang}.json`);
  } catch {
    return require('@/locales/content/en.json');
  }
}

/**
 * Build canonical URL for a page.
 * English pages → no /en/ prefix (matches existing URLs)
 * Other languages → with /xx/ prefix
 */
export function buildCanonical(lang, path = '') {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') {
    return `${SITE.url}${cleanPath}`;
  }
  
  // Prevent trailing slashes on locale root (e.g. /hi instead of /hi/)
  if (cleanPath === '/') {
    cleanPath = '';
  }
  
  return `${SITE.url}/${lang}${cleanPath}`;
}
