import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVoice, trySimplePastRewrite } from '../lib/voice-analysis.js';

test('explicit by-agent passive receives high confidence and a narrow rewrite', () => {
  const [result] = analyzeVoice('The report was written by Maya.');
  assert.equal(result.status, 'possible-passive');
  assert.equal(result.confidence, 'high');
  assert.equal(result.suggestion, 'Maya wrote the report.');
});

test('agentless passives are flagged without inventing an actor', () => {
  const [result] = analyzeVoice('The samples were stored overnight.');
  assert.equal(result.status, 'possible-passive');
  assert.equal(result.actorPresent, false);
  assert.equal(result.suggestion, '');
});

test('common participial adjectives are marked ambiguous', () => {
  const [result] = analyzeVoice('The team was interested in the outcome.');
  assert.equal(result.status, 'review');
  assert.equal(result.confidence, 'low');
});

test('active sentence remains unflagged and complex conversion fails safely', () => {
  assert.equal(analyzeVoice('Jordan reviews every result.')[0].status, 'no-pattern');
  assert.equal(trySimplePastRewrite('The report has been written by Maya.'), '');
});
