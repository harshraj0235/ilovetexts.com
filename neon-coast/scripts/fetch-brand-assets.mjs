import { mkdir, writeFile } from 'node:fs/promises';

const apps = {
  zomato: 'com.application.zomato', swiggy: 'in.swiggy.android', zepto: 'com.zeptoconsumerapp',
  blinkit: 'com.grofers.customerapp', eatsure: 'com.done.faasos', swish: 'com.swishapp',
  flipkart: 'com.flipkart.android', amazon: 'in.amazon.mShop.android.shopping',
  bigbasket: 'com.bigbasket.mobileapp', 'uber-eats': 'com.ubercab.eats',
  dominos: 'com.Dominos', doordash: 'com.dd.doordash',
};
const directory = new URL('../public/brands/', import.meta.url);
await mkdir(directory, { recursive: true });
const results = await Promise.allSettled(Object.entries(apps).map(async ([brand, id]) => {
  const source = `https://play.google.com/store/apps/details?id=${id}&hl=en_IN`;
  const page = await fetch(source, { signal: AbortSignal.timeout(20000) });
  if (!page.ok) throw new Error(`${brand}: page HTTP ${page.status}`);
  const html = await page.text();
  const url = html.match(/<meta property="og:image" content="([^"]+)/)?.[1]?.replaceAll('&amp;', '&');
  if (!url) throw new Error(`${brand}: missing app icon`);
  const asset = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!asset.ok || !asset.headers.get('content-type')?.startsWith('image/')) throw new Error(`${brand}: invalid image`);
  await writeFile(new URL(`${brand}.png`, directory), Buffer.from(await asset.arrayBuffer()));
  console.log(`${brand}: downloaded`);
  return { brand, source, asset: url, file: `${brand}.png` };
}));
const sources = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const direct = [
  { brand: 'flipkart-minutes', source: 'https://commons.wikimedia.org/wiki/File:Flipkart_Minutes_logo.png', asset: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Flipkart_Minutes_logo.png' },
  { brand: 'amazon-now', source: 'https://www.aboutamazon.in/news/retail/amazon-premium-beauty-brands-available-india', asset: 'https://amazon-blogs-brightspot.s3.amazonaws.com/3e/5c/10b3077a4642b92213f90b0a7da2/amazonnow-hero.png' },
];
for (const item of direct) {
  const response = await fetch(item.asset, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${item.brand}: HTTP ${response.status}`);
  await writeFile(new URL(`${item.brand}.png`, directory), Buffer.from(await response.arrayBuffer()));
  sources.push({ ...item, file: `${item.brand}.png` });
}
await writeFile(new URL('sources.json', directory), JSON.stringify(sources, null, 2) + '\n');
for (const result of results) if (result.status === 'rejected') console.error(result.reason.message);
if (sources.length !== Object.keys(apps).length + direct.length) process.exitCode = 1;
