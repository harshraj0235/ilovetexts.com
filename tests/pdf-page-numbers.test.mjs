import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPageLabel, isWinAnsiText, mmToPoints, safeNumberedPdfName } from '../lib/pdf-page-number-utils.mjs';

test('millimetres are converted to PDF points', () => {
  assert.ok(Math.abs(mmToPoints(25.4) - 72) < 0.0001);
});

test('labels use the final sequence number when numbering starts above one', () => {
  assert.equal(buildPageLabel(0, 10, 5, 'n/total'), '5 / 14');
  assert.equal(buildPageLabel(9, 10, 5, 'n of total', 'Page ', '!'), 'Page 14 of 14!');
  assert.equal(buildPageLabel(0, 3, 1, 'Page n'), 'Page 1');
  assert.equal(buildPageLabel(1, 3, 1, 'Page n of total'), 'Page 2 of 3');
});

test('standard-font validation and output names fail safely', () => {
  assert.equal(isWinAnsiText('Exhibit A - '), true);
  assert.equal(isWinAnsiText('পৃষ্ঠা '), false);
  assert.equal(safeNumberedPdfName('../Report.PDF'), '..-Report-numbered.pdf');
});
