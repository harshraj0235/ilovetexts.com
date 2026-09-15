import assert from 'node:assert/strict';
import test from 'node:test';
import { convertToUppercase, getUppercaseStats } from '../lib/case-conversion.js';

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
