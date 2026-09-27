import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePageSelection, parseSplitRanges, safePdfBaseName } from '../lib/split-pdf-utils.mjs';

test('split ranges are strict and retain separate output groups', () => {
  assert.deepEqual(parseSplitRanges('1-3, 5, 8-9', 10), [
    { label: '1-3', indices: [0, 1, 2] },
    { label: '5', indices: [4] },
    { label: '8-9', indices: [7, 8] },
  ]);
});

test('page extraction preserves requested order and removes duplicates', () => {
  assert.deepEqual(parsePageSelection('3, 1-2, 2', 4), [2, 0, 1]);
});

test('invalid, reversed, empty, and out-of-range selections explain the problem', () => {
  assert.throws(() => parseSplitRanges('', 5), /at least one/);
  assert.throws(() => parseSplitRanges('5-2', 5), /reversed/);
  assert.throws(() => parseSplitRanges('2, nope', 5), /not a valid/);
  assert.throws(() => parseSplitRanges('1-6', 5), /outside/);
});

test('download base names are safe and extension-independent', () => {
  assert.equal(safePdfBaseName('Report.PDF'), 'Report');
  assert.equal(safePdfBaseName('../client:report?.pdf'), '..-client-report-');
});
