import assert from 'node:assert/strict';
import test from 'node:test';
import { referenceRows, translateAlphabet } from '../lib/alphabet-translator.mjs';

test('ROT13 is its own inverse and preserves non-letters', () => {
  const encoded = translateAlphabet('rot13', 'Meet @ 5:30! 👋').output;
  assert.equal(encoded, 'Zrrg @ 5:30! 👋');
  assert.equal(translateAlphabet('rot13', encoded).output, 'Meet @ 5:30! 👋');
});

test('Grade 1 Braille writes and reads capital and number signs', () => {
  const encoded = translateAlphabet('braille-translator', 'Hello 2026!').output;
  assert.equal(encoded, '⠠⠓⠑⠇⠇⠕ ⠼⠃⠚⠃⠋⠖');
  assert.equal(translateAlphabet('braille-translator', encoded, 'decode').output, 'Hello 2026!');
});

test('Braille warns rather than inventing unsupported cells', () => {
  const result = translateAlphabet('braille-translator', 'café');
  assert.equal(result.output, '⠉⠁⠋é');
  assert.equal(result.warnings.length, 1);
});

test('NATO encoding preserves word and line separators', () => {
  const encoded = translateAlphabet('nato-phonetic-translator', 'A B\nC').output;
  assert.equal(encoded, 'Alpha / Bravo // Charlie');
  assert.equal(translateAlphabet('nato-phonetic-translator', encoded, 'decode').output, 'a b\nc');
  assert.equal(translateAlphabet('nato-phonetic-translator', 'Juliet Xray / Two', 'decode').output, 'jx 2');
});

test('NATO decoder flags unsupported words', () => {
  const result = translateAlphabet('nato-phonetic-translator', 'Alpha NotAWord', 'decode');
  assert.equal(result.output, 'aNotAWord');
  assert.equal(result.warnings.length, 1);
});

test('Wingdings preview mapping round-trips supported symbols', () => {
  const encoded = translateAlphabet('wingdings-translator', 'Az 20!').output;
  assert.equal(encoded, '✌☯ 📄📁!');
  assert.equal(translateAlphabet('wingdings-translator', encoded, 'decode').output, 'az 20!');
});

test('reference tables contain the expected core mappings', () => {
  assert.equal(referenceRows('rot13').length, 26);
  assert.deepEqual(referenceRows('nato-phonetic-translator')[9], { from: 'J', to: 'Juliett', note: 'ICAO spelling word' });
  assert.equal(referenceRows('braille-translator')[0].to, '⠁');
});
