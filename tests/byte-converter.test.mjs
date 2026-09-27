import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeText, parseBytes, decodeBytes, formatBytes, inspectCharacters, byteReportCsv, MAX_TEXT_BYTES } from '../lib/byte-converter.mjs';

test('known UTF-8 vectors match bytes, including emoji and multi-byte text', () => {
  assert.equal(formatBytes(encodeText('A é € 😀'), 'hex'), '41 20 C3 A9 20 E2 82 AC 20 F0 9F 98 80');
  assert.equal(formatBytes(encodeText('Hi'), 'binary'), '01001000 01101001');
  assert.equal(formatBytes(encodeText('Hi'), 'octal'), '110 151');
  assert.equal(formatBytes(encodeText('Hi'), 'decimal'), '72 105');
});

test('all formats round-trip international text, whitespace, NUL, BOM, and CRLF', () => {
  const samples = ['', ' ', '\n\r\t', '\u0000A\uFEFF', '\uFEFFHi', 'नमस्ते 你好 😀', 'e\u0301', 'one\r\ntwo'];
  for (const text of samples) {
    for (const format of ['binary', 'hex', 'octal', 'decimal']) {
      for (const separator of ['space', 'comma', 'newline', 'compact']) {
        for (const prefix of [true, false]) {
          const encoded = formatBytes(encodeText(text), format, { separator, prefix });
          assert.equal(decodeBytes(parseBytes(encoded, format)), text, `${format} ${separator} ${text}`);
        }
      }
    }
  }
});

test('compact, prefixed, escaped, and delimited inputs decode correctly', () => {
  for (const input of ['4869', '0x4869', '48, 69', '0x48;0x69', '\\x48\\x69', '48\n69']) {
    assert.equal(decodeBytes(parseBytes(input, 'hex')), 'Hi');
  }
  assert.equal(decodeBytes(parseBytes('0100100001101001', 'binary')), 'Hi');
  assert.equal(decodeBytes(parseBytes('110151', 'octal')), 'Hi');
});

test('invalid digits, partial bytes, overflows and ambiguous decimal fail visibly', () => {
  for (const [input, format] of [['010000012', 'binary'], ['010000011', 'binary'], ['4g', 'hex'], ['123', 'hex'], ['08', 'octal'], ['400', 'octal'], ['256', 'decimal'], ['72105', 'decimal'], ['65abc', 'decimal'], ['\\x4', 'hex'], ['0x48junk', 'hex'], [' , ; ', 'hex']]) {
    assert.throws(() => parseBytes(input, format), { name: 'ByteConversionError' }, input);
  }
  try { parseBytes('48 ZZ 69', 'hex'); } catch (error) {
    assert.equal(error.start, 3);
    assert.equal(error.end, 5);
  }
});

test('strict UTF-8 rejects truncation, surrogate encodings, overlong and out-of-range values', () => {
  for (const input of ['FF', 'C0 AF', 'E2 82', 'ED A0 80', 'F4 90 80 80', '80', 'E9']) {
    assert.throws(() => decodeBytes(parseBytes(input, 'hex')), /valid UTF-8/);
  }
  assert.throws(() => encodeText('\uD800'), /unpaired Unicode/);
});

test('ASCII is strict instead of mislabeled Unicode', () => {
  assert.equal(decodeBytes(parseBytes('0 9 10 13 32 127', 'decimal'), 'ascii'), '\0\t\n\r \x7f');
  assert.throws(() => encodeText('é', 'ascii'), /ASCII cannot represent/);
  assert.throws(() => decodeBytes(parseBytes('195 169', 'decimal'), 'ascii'), /ASCII only/);
  assert.equal(decodeBytes(parseBytes('195 169', 'decimal'), 'utf8'), 'é');
});

test('large input is bounded; no argument-spread stack overflow', () => {
  const text = 'a'.repeat(MAX_TEXT_BYTES);
  assert.equal(decodeBytes(parseBytes(formatBytes(encodeText(text), 'binary'), 'binary')), text);
  assert.throws(() => encodeText(text + 'a'), /128 KiB/);
});

test('inspection distinguishes code points from byte offsets and preserves all bytes in CSV', () => {
  const rows = inspectCharacters('A😀\n');
  assert.equal(rows[1].hex, 'F0 9F 98 80');
  assert.equal(rows[1].codePoint, 'U+1F600');
  assert.equal(rows[2].offset, 5);
  assert.equal(rows[2].label, 'LF');
  assert.equal(inspectCharacters('a'.repeat(150)).length, 120);
  assert.equal(byteReportCsv(encodeText('A')), 'byte_offset,decimal,hex,binary,octal\r\n0,65,41,01000001,101');
});
