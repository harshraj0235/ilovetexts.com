import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { BRANDS, loadSelectedBrand, shuffledFleet, randomBrand } from '../src/brands.js';

test('every brand has a local logo and a unique ID', async () => {
  assert.equal(new Set(BRANDS.map(b => b.id)).size, 14);
  for (const brand of BRANDS) await access(new URL(`../public${brand.logo}`, import.meta.url));
});
test('traffic includes every brand and reshuffles its order', () => {
  const first = shuffledFleet(20, () => .1), second = shuffledFleet(20, () => .9);
  assert.equal(first.length, 20);
  assert.equal(new Set(first.map(b => b.id)).size, BRANDS.length);
  assert.notDeepEqual(first, second);
  assert.notEqual(randomBrand('zomato', () => 0).id, 'zomato');
});
test('selection survives valid saves and recovers from blocked or invalid storage', () => {
  assert.equal(loadSelectedBrand({ getItem: () => 'zepto' }).id, 'zepto');
  assert.equal(loadSelectedBrand({ getItem: () => 'unknown' }).id, 'zomato');
  assert.equal(loadSelectedBrand({ getItem: () => { throw Error('blocked'); } }).id, 'zomato');
});
