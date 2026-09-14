import fs from 'node:fs';

const targets = [
  'https://ilovetexts.com/',
  'https://www.ilovetexts.com/',
  'http://ilovetexts.com/',
  'https://ilovetexts.com/en',
  'https://ilovetexts.com/en/writing-grammar-tools/grammar-checker',
  'https://ilovetexts.com/word-counter/reading-time',
  'https://ilovetexts.com/blog/contador-palabras-online-gratis',
  'https://ilovetexts.com/definitely-not-a-real-page-audit',
  'https://ilovetexts.com/fr',
  'https://ilovetexts.com/writing-grammar-tools/grammar-checker?utm_source=audit',
];

const userAgents = {
  standard: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36',
  simulatedGooglebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

async function request(url, userAgent) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 8; hop++) {
    const started = Date.now();
    let response;
    try {
      response = await fetch(current, { redirect: 'manual', headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' } });
    } catch (error) {
      chain.push({ url: current, error: error.cause?.code || error.message, elapsedMs: Date.now() - started });
      break;
    }
    const text = await response.text();
    const location = response.headers.get('location');
    chain.push({
      url: current,
      status: response.status,
      location,
      elapsedMs: Date.now() - started,
      contentType: response.headers.get('content-type'),
      contentLength: text.length,
      csp: response.headers.get('content-security-policy'),
      xRobots: response.headers.get('x-robots-tag'),
      canonical: [...text.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/gi)].map((match) => match[1]),
      robots: [...text.matchAll(/<meta[^>]+name=["'](?:robots|googlebot)["'][^>]+content=["']([^"']+)["']/gi)].map((match) => match[1]),
      title: text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '',
    });
    if (!location || response.status < 300 || response.status >= 400) break;
    current = new URL(location, current).href;
  }
  return chain;
}

const results = {};
for (const url of targets) {
  results[url] = await request(url, userAgents.standard);
}

const parityTargets = [
  'https://ilovetexts.com/',
  'https://ilovetexts.com/hi/writing-grammar-tools/grammar-checker',
  'https://ilovetexts.com/es/text-cleaner/sort-lines',
];
results.userAgentParity = {};
for (const url of parityTargets) {
  results.userAgentParity[url] = {
    standard: await request(url, userAgents.standard),
    simulatedGooglebot: await request(url, userAgents.simulatedGooglebot),
  };
}

fs.writeFileSync(new URL('./spot-checks.json', import.meta.url), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
