import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

// Read-only website audit. Outputs are research evidence, not production code.
const out = 'audits/2026-09-13-seo';
await mkdir(out, { recursive: true });
const origin = 'https://ilovetexts.com';
const langs = ['en', 'hi', 'pt', 'es', 'de', 'id'];
const source = await readFile('lib/tools-config.js', 'utf8');
const start = source.indexOf('export const CATEGORIES =');
const end = source.indexOf('// Helper to read content safely', start);
if (start < 0 || end < start) throw new Error('Unexpected catalogue structure');
const cats = vm.runInNewContext(source.slice(start, end).replace('export const CATEGORIES =', 'const CATEGORIES =') + '\nCATEGORIES', {}, { timeout: 1000 });
const tools = cats.flatMap(cat => cat.tools.map(tool => ({ ...tool, category: cat.id, path: `/${cat.id}/${tool.slug}` })));
const content = Object.fromEntries(await Promise.all(langs.map(async lang => [lang, JSON.parse(await readFile(`locales/content/${lang}.json`, 'utf8'))])));
const norm = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : JSON.stringify(value ?? '');
const coverage = langs.map(lang => ({ lang, tools: tools.map(tool => {
  const data = content[lang].tools[tool.slug] || {}, english = content.en.tools[tool.slug] || {};
  return { slug: tool.slug, path: tool.path, recordPresent: !!content[lang].tools[tool.slug],
    name: data.name || tool.name, metaTitle: data.metaTitle || '',
    missingFields: ['name','description','metaTitle','metaDescription','whatIs','howToSteps','faqs','useCases'].filter(key => !data[key] || (Array.isArray(data[key]) && !data[key].length)),
    equalEnglishFields: lang === 'en' ? [] : ['name','description','metaTitle','metaDescription','whatIs','howToSteps','faqs','useCases'].filter(key => data[key] && english[key] && norm(data[key]) === norm(english[key])),
  } }) }));
await writeFile(`${out}/catalogue-and-localization.json`, JSON.stringify({ commit: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), categories: cats.length, toolCount: tools.length, tools, coverage }, null, 2));
const decode = text => text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3])]));
const hash = text => createHash('sha256').update(text).digest('hex');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, ua = 'ilovetexts-owner-readonly-audit/1.0') {
  const url = new URL(path, origin);
  if (url.origin !== origin) throw new Error('Only the requested site is in crawl scope');
  const started = Date.now();
  const response = await fetch(url, { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(25000), redirect: 'manual' });
  const text = await response.text();
  return { status: response.status, headers: Object.fromEntries(response.headers), text, elapsedMs: Date.now()-started, bytes: Buffer.byteLength(text) };
}
const robots = await request('/robots.txt');
await writeFile(`${out}/live-robots.txt`, robots.text);
const index = await request('/sitemap_index.xml');
await writeFile(`${out}/live-sitemap-index.xml`, index.text);
const sitemapUrls = [...index.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
const sitemapEntries = [], sitemapResponses = [];
for (const url of sitemapUrls) {
  const r = await request(url); sitemapResponses.push({url,status:r.status,headers:r.headers,bytes:r.bytes});
  const lang = url.match(/\/([a-z]+)\.xml$/)?.[1] || 'unknown';
  await writeFile(`${out}/live-sitemap-${lang}.xml`, r.text);
  for (const match of r.text.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const xml = match[1], loc = decode(xml.match(/<loc>(.*?)<\/loc>/)?.[1] || '');
    sitemapEntries.push({ url: loc, sitemap: lang, lastmod: xml.match(/<lastmod>(.*?)<\/lastmod>/)?.[1], alternates: [...xml.matchAll(/<xhtml:link\b[^>]*>/g)].map(m=>attrs(m[0])) });
  }
}
await writeFile(`${out}/sitemap-inventory.json`, JSON.stringify({sitemapResponses,entries:sitemapEntries},null,2));
const declared = langs.flatMap(lang => [ ...tools.map(t=>t.path), ...cats.map(c=>`/${c.id}`), '/', '/tools','/about','/contact','/privacy','/terms','/resources','/blog','/pricing','/workflows','/workflows/statement-review','/workflows/application-ready','/office'].map(path=>lang==='en'?path:`/${lang}${path==='/'?'':path}`));
const paths = [...new Set([...sitemapEntries.map(e=>new URL(e.url).pathname), ...declared])];
const listed = new Set(sitemapEntries.map(e=>new URL(e.url).pathname));
const results = [], links = new Set();
let cursor = 0, fatal = false;
function inspect(path, r) {
  const clean = r.text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  const meta = [...clean.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const linkTags = [...clean.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const title = decode(clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const robots = meta.filter(m=>['robots','googlebot'].includes(m.name?.toLowerCase())).map(m=>`${m.name}:${m.content}`).join(' | ');
  const canonical = linkTags.filter(l=>l.rel==='canonical').map(l=>l.href);
  const h1 = [...clean.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>decode(m[1].replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim());
  const main = clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || clean;
  const text = decode(main.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
  const hrefs = [...clean.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0]).href).filter(Boolean);
  for (const href of hrefs) { try { const u=new URL(href,origin+path); if(u.origin===origin && !u.search) links.add(u.pathname); } catch {} }
  const jsonLd = [...r.text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>{try{return JSON.parse(m[1]);}catch{return {parseError:true};}});
  return { path, inSitemap:listed.has(path), status:r.status, location:r.headers.location || '', robots, xRobots:r.headers['x-robots-tag'] || '', canonical,
    title, description:meta.find(m=>m.name==='description')?.content || '', htmlLang:attrs(clean.match(/<html\b[^>]*>/i)?.[0] || '').lang || '',
    hreflang:linkTags.filter(l=>l.hreflang).map(l=>({lang:l.hreflang,url:l.href})), h1, mainWords:text.split(/\s+/).length, mainTextHash:hash(text),
    htmlBytes:r.bytes, elapsedMs:r.elapsedMs, server:r.headers.server, cache:r.headers['cf-cache-status'] || r.headers['x-vercel-cache'] || '', linkCount:hrefs.length,
    schemaTypes:jsonLd.map(j=>j['@type']), schemaParseErrors:jsonLd.filter(j=>j.parseError).length, scriptCount:(r.text.match(/<script\b/g)||[]).length,
    hasMojibake:/Ã[\x80-\xBF]|Â[\x80-\xBF]|â€|ðŸ|Γò/.test(text), noindex:/\bnoindex\b/i.test(`${robots} ${r.headers['x-robots-tag'] || ''}`),
  };
}
console.log(`Crawling ${paths.length} declared/sitemap URLs, 3 concurrent requests, no mutations.`);
async function worker() {
  while (cursor < paths.length && !fatal) {
    const path = paths[cursor++];
    try {
      const r=await request(path);
      if (r.status===429) { fatal=true; results.push({path,status:429,error:'Rate limit: stopped crawl'}); break; }
      results.push(inspect(path,r));
    } catch(error) { results.push({path,error:error.message,cause:error.cause?.code}); }
    if(results.length % 50===0) { await writeFile(`${out}/live-pages.json`,JSON.stringify(results,null,2)); console.log(`Checked ${results.length}/${paths.length}`); }
    await pause(200);
  }
}
await Promise.all([worker(),worker(),worker()]);
await writeFile(`${out}/live-pages.json`,JSON.stringify(results,null,2));
const extraLinks = [...links].filter(path=>!paths.includes(path) && !/\.[a-z0-9]+$/i.test(path) && !path.startsWith('/embed/')).sort();
await writeFile(`${out}/additional-internal-links.json`,JSON.stringify(extraLinks,null,2));
const summary={checkedAt:new Date().toISOString(),catalogueTools:tools.length,categories:cats.length,declaredAndSitemapUrls:paths.length,crawled:results.length,sitemapEntries:sitemapEntries.length,
 statuses:results.reduce((a,r)=>(a[r.status || 'error']=(a[r.status || 'error']||0)+1,a),{}),noindex:results.filter(r=>r.noindex).length,
 sitemapNoindex:results.filter(r=>r.inSitemap&&r.noindex).length,sitemapNonSelfCanonical:results.filter(r=>r.inSitemap&&r.canonical?.length && r.canonical[0]!==origin+r.path && r.canonical[0]!==origin+r.path.replace(/\/$/,'')).length,
 multipleH1:results.filter(r=>r.h1?.length>1).length,missingH1:results.filter(r=>r.status===200&&!r.h1?.length).length,extraInternalLinks:extraLinks.length,
 coverage:coverage.map(c=>({lang:c.lang,missingRecords:c.tools.filter(t=>!t.recordPresent).length,sameEnglishWhatIs:c.tools.filter(t=>t.equalEnglishFields.includes('whatIs')).length,missingWhatIs:c.tools.filter(t=>t.missingFields.includes('whatIs')).length}))};
await writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
