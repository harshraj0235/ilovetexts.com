'use client';

import GrammarChecker from './GrammarChecker';

/**
 * Punctuation mode shares the accessible multilingual review experience and
 * keeps only LanguageTool typography and punctuation findings.
 */
export default function PunctuationChecker({ t = {} }) {
  return <GrammarChecker t={t} mode="punctuation" />;
}
