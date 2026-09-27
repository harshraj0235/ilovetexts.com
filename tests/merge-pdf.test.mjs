import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFileSize, moveItem, validatePdfFiles } from '../lib/pdf-merge-utils.mjs';

const pdf = (name, size, type = 'application/pdf') => ({ name, size, type });

test('PDF validation accepts PDFs and explains rejected files', () => {
  const result = validatePdfFiles([pdf('one.pdf', 50), pdf('notes.txt', 20, 'text/plain'), pdf('empty.pdf', 0)]);
  assert.deepEqual(result.accepted.map((file) => file.name), ['one.pdf']);
  assert.equal(result.rejected.length, 2);
  assert.match(result.rejected[0], /not a PDF/);
  assert.match(result.rejected[1], /empty/);
});

test('PDF validation enforces per-file and combined limits', () => {
  const megabyte = 1024 * 1024;
  assert.equal(validatePdfFiles([pdf('huge.pdf', 101 * megabyte)]).accepted.length, 0);
  const result = validatePdfFiles([pdf('overflow.pdf', 2 * megabyte)], [{ size: 299 * megabyte }]);
  assert.equal(result.accepted.length, 0);
  assert.match(result.rejected[0], /300 MB/);
});

test('merge order controls move items without mutating input', () => {
  const original = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(original, 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(original, ['a', 'b', 'c']);
  assert.equal(moveItem(original, 0, -1), original);
});

test('file sizes are readable', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2.0 MB');
});
