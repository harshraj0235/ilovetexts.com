import assert from 'node:assert/strict';
import test from 'node:test';
import { convertToLowercase, convertToTitleCase, convertToUppercase, getUppercaseStats } from '../lib/case-conversion.js';

test('uppercase conversion preserves whitespace, punctuation and Unicode', () => {
  assert.equal(convertToUppercase('Hello, café!\nκόσμος'), 'HELLO, CAFÉ!\nΚΌΣΜΟΣ');
});

test('locale-aware uppercase handles Turkish dotted and dotless i', () => {
  assert.equal(convertToUppercase('istanbul ızmir', { locale: 'tr' }), 'İSTANBUL IZMİR');
});

test('URL and email protection can be enabled independently', () => {
  const text = 'Visit https://Example.com/MyPath or Mail.Name@example.com today';
  assert.equal(
    convertToUppercase(text, { preserveUrls: true, preserveEmails: true }),
    'VISIT https://Example.com/MyPath OR Mail.Name@example.com TODAY',
  );
  assert.equal(
    convertToUppercase(text, { preserveUrls: false, preserveEmails: true }),
    'VISIT HTTPS://EXAMPLE.COM/MYPATH OR Mail.Name@example.com TODAY',
  );
});

test('conversion statistics describe the produced text', () => {
  assert.deepEqual(getUppercaseStats('Hello world', 'HELLO WORLD'), {
    characters: 11,
    words: 2,
    changed: 9,
    lines: 1,
  });
});

test('lowercase conversion supports Unicode, locale rules and protected tokens', () => {
  assert.equal(convertToLowercase('CAFÉ ΚΌΣΜΟΣ'), 'café κόσμος');
  assert.equal(convertToLowercase('I İ', { locale: 'tr' }), 'ı i');
  assert.equal(
    convertToLowercase('OPEN https://Example.com/CasePath AND Name@Example.com', { preserveUrls: true, preserveEmails: true }),
    'open https://Example.com/CasePath and Name@Example.com',
  );
});

test('title case capitalizes boundaries and handles style-dependent prepositions', () => {
  assert.equal(convertToTitleCase('the guide to working with data', { style: 'ap' }), 'The Guide to Working With Data');
  assert.equal(convertToTitleCase('the guide to working with data', { style: 'chicago' }), 'The Guide to Working with Data');
  assert.equal(convertToTitleCase('a story: the road home', { style: 'common' }), 'A Story: The Road Home');
});

test('title case processes each line and can preserve acronyms, brands and protected words', () => {
  assert.equal(convertToTitleCase('using NASA and iPhone\na note for openai'), 'Using NASA and iPhone\nA Note for Openai');
  assert.equal(convertToTitleCase('a note for openai', { protectedWords: ['OpenAI'] }), 'A Note for OpenAI');
  assert.equal(convertToTitleCase('NASA api', { preserveAcronyms: false }), 'Nasa Api');
});
