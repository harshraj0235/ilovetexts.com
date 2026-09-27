const COMMON_WORDS = new Set('a an and are as at be been but by for from had has have he her his i in is it its of on or she that the their them they this to was were will with you your'.split(' '));

export function tokenizeText(text, { caseSensitive = false, ignoreCommonWords = false } = {}) {
  const normalized = caseSensitive ? text.normalize('NFKC') : text.normalize('NFKC').toLocaleLowerCase();
  const words = normalized.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
  return ignoreCommonWords ? words.filter((word) => !COMMON_WORDS.has(word.toLocaleLowerCase())) : words;
}

export function createNgrams(words, size) {
  if (!words.length) return [];
  const width = Math.max(1, Math.min(size, words.length));
  return Array.from({ length: words.length - width + 1 }, (_, index) => words.slice(index, index + width).join(' '));
}

export function jaccardScore(first, second) {
  const a = new Set(first); const b = new Set(second);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  return [...a].filter((value) => b.has(value)).length / union.size;
}

export function cosineScore(first, second) {
  const frequencies = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
  const a = frequencies(first); const b = frequencies(second);
  const dot = [...a].reduce((sum, [word, count]) => sum + count * (b.get(word) || 0), 0);
  const magnitudeA = Math.sqrt([...a.values()].reduce((sum, count) => sum + count ** 2, 0));
  const magnitudeB = Math.sqrt([...b.values()].reduce((sum, count) => sum + count ** 2, 0));
  if (!magnitudeA || !magnitudeB) return 0;
  const score = dot / (magnitudeA * magnitudeB);
  return Math.abs(1 - score) < Number.EPSILON * 4 ? 1 : Math.min(1, score);
}

export function splitSentences(text) {
  if (!text.trim()) return [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].map(({ segment }) => segment).filter((sentence) => sentence.trim());
  }
  return text.match(/[^.!?]+(?:[.!?]+|$)/g)?.filter((sentence) => sentence.trim()) || [text];
}

export function compareTexts(sourceText, draftText, options = {}) {
  const phraseSize = Math.max(3, Math.min(8, Number(options.phraseSize) || 5));
  const phraseOptions = { caseSensitive: Boolean(options.caseSensitive), ignoreCommonWords: false };
  const metricOptions = { ...phraseOptions, ignoreCommonWords: Boolean(options.ignoreCommonWords) };
  const sourcePhraseWords = tokenizeText(sourceText, phraseOptions);
  const draftPhraseWords = tokenizeText(draftText, phraseOptions);
  const sourceWords = tokenizeText(sourceText, metricOptions);
  const draftWords = tokenizeText(draftText, metricOptions);
  const sourceNgrams = new Set(createNgrams(sourcePhraseWords, phraseSize));
  const draftNgrams = createNgrams(draftPhraseWords, phraseSize);
  const matchingPhraseCount = draftNgrams.filter((phrase) => sourceNgrams.has(phrase)).length;
  const sourceSentences = splitSentences(sourceText).map((text) => ({ text, words: tokenizeText(text, phraseOptions) }));
  const sentenceMatches = splitSentences(draftText).map((text) => {
    const words = tokenizeText(text, phraseOptions);
    let best = { score: 0, source: '' };
    sourceSentences.forEach((source) => {
      const width = Math.max(1, Math.min(phraseSize, words.length, source.words.length));
      const draftSet = createNgrams(words, width);
      const sourceSet = new Set(createNgrams(source.words, width));
      const score = draftSet.length ? draftSet.filter((phrase) => sourceSet.has(phrase)).length / draftSet.length : 0;
      if (score > best.score) best = { score, source: source.text.trim() };
    });
    return { text, score: best.score, source: best.source };
  });
  return {
    phraseSize,
    metrics: {
      draftPhraseCoverage: draftNgrams.length ? matchingPhraseCount / draftNgrams.length : 0,
      phraseJaccard: jaccardScore(sourceNgrams, draftNgrams),
      vocabularyJaccard: jaccardScore(sourceWords, draftWords),
      cosine: cosineScore(sourceWords, draftWords),
    },
    counts: { sourceWords: sourcePhraseWords.length, draftWords: draftPhraseWords.length, matchingPhrases: matchingPhraseCount, draftPhrases: draftNgrams.length },
    sentenceMatches,
  };
}
