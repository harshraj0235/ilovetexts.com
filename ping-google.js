// Run after deployment: node ping-google.js
// Pings Google, Bing, and IndexNow to re-crawl your sitemaps and pages immediately
const https = require('https');

const SITE_URL = 'https://ilovetexts.com';
const INDEXNOW_KEY = 'ilovetexts-indexnow-key-2026';

const SITEMAPS = [
  'https://ilovetexts.com/sitemap_index.xml',
  'https://ilovetexts.com/sitemap/en.xml',
  'https://ilovetexts.com/sitemap/hi.xml',
  'https://ilovetexts.com/sitemap/es.xml',
  'https://ilovetexts.com/sitemap/pt.xml',
  'https://ilovetexts.com/sitemap/de.xml',
  'https://ilovetexts.com/sitemap/id.xml',
];

const IMPORTANT_URLS = [
  'https://ilovetexts.com/',
  'https://ilovetexts.com/hi',
  'https://ilovetexts.com/es',
  'https://ilovetexts.com/pt',
  'https://ilovetexts.com/de',
  'https://ilovetexts.com/id'
];

async function pingSitemap(url) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(url);
    const googleUrl = `https://www.google.com/ping?sitemap=${encoded}`;
    const bingUrl = `https://www.bing.com/ping?sitemap=${encoded}`;
    
    [googleUrl, bingUrl].forEach(pingUrl => {
      const req = https.get(pingUrl, res => {
        console.log(`✅ Pinged Sitemap: ${pingUrl.split('?')[0]} → ${res.statusCode}`);
        resolve();
      });
      req.on('error', () => console.log(`⚠️  Failed: ${pingUrl}`));
      req.end();
    });
  });
}

async function submitToIndexNow() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      host: 'ilovetexts.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://ilovetexts.com/${INDEXNOW_KEY}.txt`,
      urlList: IMPORTANT_URLS
    });

    const options = {
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`🚀 IndexNow API Status: ${res.statusCode}`);
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', (e) => {
      console.error(`⚠️ IndexNow Error: ${e.message}`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('🔔 Submitting to IndexNow...');
  await submitToIndexNow();
  
  console.log('\n🔔 Pinging Google & Bing with all sitemaps...\n');
  for (const sitemap of SITEMAPS) {
    await pingSitemap(sitemap);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n✅ Done! Search engines notified for fast indexing.');
})();
