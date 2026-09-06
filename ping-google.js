// Run after deployment: node ping-google.js
// Pings Google and Bing to re-crawl your sitemaps immediately
const https = require('https');

const SITEMAPS = [
  'https://ilovetexts.com/sitemap_index.xml',
  'https://ilovetexts.com/sitemap/en.xml',
  'https://ilovetexts.com/sitemap/hi.xml',
  'https://ilovetexts.com/sitemap/es.xml',
  'https://ilovetexts.com/sitemap/pt.xml',
  'https://ilovetexts.com/sitemap/de.xml',
  'https://ilovetexts.com/sitemap/id.xml',
];

async function ping(url) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(url);
    const googleUrl = `https://www.google.com/ping?sitemap=${encoded}`;
    const bingUrl = `https://www.bing.com/ping?sitemap=${encoded}`;
    
    [googleUrl, bingUrl].forEach(pingUrl => {
      const req = https.get(pingUrl, res => {
        console.log(`✅ Pinged: ${pingUrl.split('?')[0]} → ${res.statusCode}`);
        resolve();
      });
      req.on('error', () => console.log(`⚠️  Failed: ${pingUrl}`));
      req.end();
    });
  });
}

(async () => {
  console.log('🔔 Pinging Google & Bing with all sitemaps...\n');
  for (const sitemap of SITEMAPS) {
    await ping(sitemap);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n✅ Done! Google and Bing will re-crawl your sitemaps within 24 hours.');
  console.log('📊 Check status at: https://search.google.com/search-console');
})();
