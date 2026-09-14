import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStandaloneFlipbook, safeFlipbookTitle, safeHtmlFileName } from '../lib/flipbook-utils.mjs';

test('flipbook titles and download names are safe', () => {
  assert.equal(safeFlipbookTitle('  <My>   Catalog  '), 'My Catalog');
  assert.equal(safeHtmlFileName('Summer Catalog 2026!'), 'summer-catalog-2026.html');
});

test('standalone export escapes injected markup and clamps animation speed', () => {
  const html = buildStandaloneFlipbook({ title: '</title><script>alert(1)</script>', pages: ['data:image/jpeg;base64,abc</script>'], pageDuration: 9999 });
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /1500ms/);
  assert.match(html, /data:image\/jpeg;base64/);
  assert.match(html, /\\u003c\/script>/);
});
