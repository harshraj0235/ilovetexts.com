'use client';

import GrammarChecker from './GrammarChecker';

/**
 * The spelling workflow uses the shared multilingual review editor, but keeps
 * only LanguageTool findings explicitly classified as misspellings.
 */
export default function SpellChecker({ t = {} }) {
  return <GrammarChecker t={t} mode="spelling" />;
}
