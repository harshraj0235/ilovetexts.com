import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTexts, cosineScore, jaccardScore, tokenizeText } from '../lib/text-similarity.js';

test('identical passages produce complete overlap on every metric', () => {
  const result = compareTexts('Alpha beta gamma delta epsilon.', 'Alpha beta gamma delta epsilon.', { phraseSize: 3 });
  assert.equal(result.metrics.draftPhraseCoverage, 1);
  assert.equal(result.metrics.phraseJaccard, 1);
  assert.equal(result.metrics.vocabularyJaccard, 1);
  assert.equal(result.metrics.cosine, 1);
});

test('directional phrase coverage distinguishes a short excerpt from its source', () => {
  const source = 'one two three four five six seven eight';
  const excerpt = 'three four five six';
  const forward = compareTexts(source, excerpt, { phraseSize: 3 });
  const reverse = compareTexts(excerpt, source, { phraseSize: 3 });
  assert.equal(forward.metrics.draftPhraseCoverage, 1);
  assert.ok(reverse.metrics.draftPhraseCoverage < 1);
});

test('tokenization supports Unicode words and optional common-word removal', () => {
  assert.deepEqual(tokenizeText('Café naïve 東京'), ['café', 'naïve', '東京']);
  assert.deepEqual(tokenizeText('The fox and the dog', { ignoreCommonWords: true }), ['fox', 'dog']);
});

test('empty vectors return zero instead of NaN', () => {
  assert.equal(jaccardScore([], []), 0);
  assert.equal(cosineScore([], []), 0);
});
