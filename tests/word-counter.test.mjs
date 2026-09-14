import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countCharacters,
  countCharactersNoSpaces,
  countLines,
  countParagraphs,
  countSentences,
  countWords,
  getKeywordDensity,
  getReadabilityScore,
  getReadingTime,
  getSpeakingTime,
} from '../lib/text-processors.js';

test('word counter handles whitespace, punctuation and Unicode text', () => {
  const text = 'Hello, world!\n\nनमस्ते दुनिया 😀';
  assert.equal(countWords(text), 4);
  assert.equal(countCharacters('A😀e\u0301'), 3);
  assert.equal(countCharactersNoSpaces('A 😀 e\u0301'), 3);
  assert.equal(countParagraphs(text), 2);
  assert.equal(countLines(text), 3);
});

test('sentence, reading and speaking calculations are deterministic', () => {
  const text = 'One sentence. Another question? Final answer!';
  assert.equal(countSentences(text), 3);
  assert.deepEqual(getReadingTime(Array(239).fill('word').join(' ')), { minutes: 1, seconds: 1, words: 239 });
  assert.deepEqual(getSpeakingTime(Array(151).fill('word').join(' ')), { minutes: 1, seconds: 1, words: 151 });
});

test('readability and phrase analysis fail softly for empty input', () => {
  assert.deepEqual(getReadabilityScore(''), { score: 0, grade: 'N/A', level: 'N/A' });
  assert.deepEqual(getKeywordDensity(''), { single: [], biGrams: [], triGrams: [] });
});

test('keyword analysis reports repeated words and phrases without inventing an SEO score', () => {
  const result = getKeywordDensity('privacy first tools make privacy first writing easier', 5);
  assert.equal(result.single[0].word, 'privacy');
  assert.equal(result.single[0].count, 2);
  assert.ok(result.biGrams.some((entry) => entry.word === 'privacy first' && entry.count === 2));
});
