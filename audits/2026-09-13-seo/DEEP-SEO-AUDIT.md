# ilovetexts.com: technical SEO, indexation, search-performance, and user-experience audit

**Audit date:** September 13–14, 2026  
**Live crawl captured:** September 13, 2026  
**Search Console coverage snapshot:** through September 4, 2026  
**Search Console performance window:** “Last 3 months”; observed daily data through September 10, 2026

## Executive conclusion

ilovetexts.com is not suffering from a site-wide crawl block. Every one of the 1,944 URLs in the audit inventory returned HTTP 200, and the Search Console export reports 1,020 indexed URLs. The main problem is that the site is publishing far more URLs than it has differentiated, reviewed content for, while giving Google contradictory canonical, sitemap, language, and quality signals.

The most urgent defect is international SEO configuration. The live sitemaps contain 1,938 URLs, but 1,610 of those URLs do not canonicalize to themselves. Almost every Hindi, Portuguese, Spanish, German, and Indonesian tool/category page declares an English canonical, even when the localized page has a translated title. Separately, 100 non-English URLs appear in XML sitemaps while explicitly declaring `noindex`. Google recommends putting the canonical URLs that should appear in Search into sitemaps; a sitemap submission is only a hint, not a guarantee. [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

Search Console confirms that discovery and selection—not basic availability—are the central challenges: 553 URLs are “Discovered – currently not indexed,” 57 are “Crawled – currently not indexed,” 101 are alternate pages with proper canonical tags, 18 are duplicates where Google chose another canonical, 30 are 404s, and 12 are redirects. These categories total 771 excluded URLs in the supplied coverage sheet. “Validation started” does not mean the underlying issue is fixed.

No ethical SEO change can guarantee first-page rankings for every keyword or language. Google chooses canonical and ranking outcomes algorithmically, and rankings depend on intent satisfaction, competition, authority, links, quality, and page experience. The achievable goal is to remove contradictory signals, index only pages deserving independent search visibility, repair broken tools and lost URLs, and systematically improve pages already receiving impressions.

## Scope and method

- Crawled all 1,944 URLs formed from the live sitemap inventory and the repository’s declared tool/category/locale routes, using normal TLS validation and a bounded owner audit user agent.
- Parsed status, canonical, robots directives, hreflang, title, description, H1, structured-data syntax, HTML size, and internal link count.
- Compared ordinary browser and simulated Googlebot user-agent responses on representative English, Hindi, and Spanish pages. This checks response parity only; it is not Google’s URL Inspection tool and does not prove how Google rendered a URL.
- Reviewed the current repository configuration and representative tool implementations.
- Tested homepage search and the live Grammar Checker from a human-user perspective with benign test text.
- Analyzed the two supplied, public, view-only Search Console sheets without editing them.
- Did not claim manual functional verification of all 275 tools. Automated route checks cover the full URL inventory; hands-on UX checks are representative.

## Evidence dashboard

| Area | Result | Interpretation |
|---|---:|---|
| Declared/live URLs crawled | 1,944 | Complete audit inventory |
| HTTP 200 | 1,944 | No site-wide availability failure |
| Sitemap URLs | 1,938 | Six locale sitemaps |
| Sitemap URLs that are `noindex` | 100 | Directly contradictory sitemap/index signal |
| Sitemap URLs not self-canonical | 1,610 | Severe canonical/sitemap conflict |
| Missing H1 | 0 | Good baseline |
| Multiple H1 pages | 12 | Two templates repeated across six locales |
| Structured-data parse errors | 0 | Syntax parsed; truth/eligibility still requires review |
| Median raw HTML | 400,648 bytes | Excessive for simple utilities |
| Median links per page | 632 | Navigation/link overload |
| Titles over 60 characters | 1,561 | 80.3%; likely truncation and diluted messaging |
| Descriptions over 160 characters | 716 | 36.8%; likely truncation |
| Duplicate-title groups | 268 | Mostly identical metadata across language variants |
| Search Console indexed | 1,020 | 56.95% of the 1,791-URL population in that historical snapshot |
| Search Console excluded | 771 | 43.05% of that historical population |
| Performance-chart totals | 30 clicks / 4,487 impressions | Approx. 0.67% CTR |

The live crawl’s 1,944-URL population is newer/larger than the coverage chart’s 1,791 URLs, and the report dates differ. The percentages must not be treated as a same-day live index ratio.

## Critical findings

### P0 — Localized URLs are declared indexable but canonicalize to English

`lib/search-indexing.js` declares all six locales indexable. `lib/seo.js` then builds tool and category metadata using `PRIMARY_CONTENT_LOCALE` (`en`) as the canonical locale. The result is systematic:

| Locale | Crawled pages | Sitemap pages | Sitemap non-self-canonical | Sitemap `noindex` |
|---|---:|---:|---:|---:|
| English | 324 | 323 | 0 | 0 |
| Hindi | 324 | 323 | 322 | 20 |
| Portuguese | 324 | 323 | 322 | 20 |
| Spanish | 324 | 323 | 322 | 20 |
| German | 324 | 323 | 322 | 20 |
| Indonesian | 324 | 323 | 322 | 20 |

This tells Google both “index this localized URL” and “the preferred version is English.” A canonical is a hint rather than an absolute command, but repeated conflicting signals waste crawling and make independent localized rankings unlikely. Google advises that hreflang pages use reciprocal annotations and that canonicals within an hreflang cluster should normally point to the same-language canonical. [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) and [Google: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

**Fix:** introduce a per-page locale-readiness policy. Fully human-reviewed localized pages should be indexable, self-canonical, and participate in a reciprocal hreflang cluster. English-fallback or materially untranslated pages should not be promoted as independent search landing pages. Do not turn every localized page self-canonical until its visible content, metadata, controls, examples, FAQs, and claims are truly localized.

### P0 — Sitemaps contain 100 explicitly noindexed URLs

Each non-English sitemap includes 20 English-only routes: the blog index, workflows, office, nine English blog posts, About, Privacy, Contact, Terms, Resources, and Tools. Their metadata says `noindex`/canonical English, yet the sitemap asks search engines to consider them. Remove these noncanonical/noindex copies from locale sitemaps; include only URLs intended to be canonical search results.

### P0 — Core externally backed tools fail under the live Content Security Policy

The live CSP `connect-src` allows Google analytics/translation/TTS and unpkg, but not the origins used by multiple tools:

- Grammar Checker, Spell Checker, and Punctuation Checker call `api.languagetoolplus.com`.
- Rhyming Dictionary, Wordle Finder, and Anagram Generator call `api.datamuse.com`.
- Online Typing Tool calls `inputtools.google.com`.

In a live human-use test, Grammar Checker displayed “Failed to fetch” for intentionally incorrect text, while simultaneously displaying “No issues found! Your text looks good.” That is a trust and utility failure, not merely an SEO detail. The page also displays “Runs locally in your browser,” although it sends text to an external service. Broken primary functionality weakens engagement and makes supporting claims misleading.

**Fix:** decide a reviewed architecture per provider—narrow CSP allow-list, same-origin server proxy, or local implementation. Provide explicit consent/privacy disclosure before sending text externally. Failed/untested/clean states must be distinct; never show a success state after a network error. Add end-to-end tests that fail when the production CSP blocks a required origin.

### P0 — A Search Console opportunity now returns 404

`/blog/contador-palabras-online-gratis` has 34 impressions at average position 17.65 in the supplied performance sheet, but the live URL returns 404. The source schedules it for October 19, 2026 while the publication cutoff is fixed at September 12, 2026. A future-dated content row apparently received impressions before being withdrawn.

**Fix:** either publish a reviewed Spanish article now at the same URL, or 301 it to the closest Spanish word-counting page. Do not expose or internally link future content before it can remain live. Replace the hard-coded publication cutoff with a reliable release workflow and add a test that every historically performing URL resolves to useful content or a relevant redirect.

### P1 — Localization is incomplete and often nominal

The catalogue has 275 tools. English lacks dedicated locale records for 60 tools and `whatIs` content for 65. Every non-English locale lacks 83 records and 88 `whatIs` entries. Of the descriptions that exist, 151 Hindi and 151 Portuguese entries exactly equal the English text; Spanish, German, and Indonesian each have 36 exact-English entries. Identical titles occur across all six variants for many tools.

Google determines page language primarily from visible content, and warns that translated boilerplate surrounding untranslated main content does not create a useful localized page. [Google: managing multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

**Fix:** prioritize languages and clusters using real impressions, not a 275 × 6 bulk translation exercise. Translate the complete user journey; have a native reviewer verify terminology, examples, search intent, and tool output. Keep incomplete variants out of independent indexation until ready.

### P1 — Programmatic breadth exceeds demonstrated per-page value

Search Console reports 553 “Discovered – currently not indexed” and 57 “Crawled – currently not indexed” URLs. The site simultaneously exposes 1,938 sitemap URLs, 275 utilities, six locales, 27 categories, blog posts, GTA tools, government/legal utilities, and office/workflow pages. Many page titles/descriptions and supporting blocks follow generic patterns. This combination is consistent with Google discovering more URLs than it currently considers worth crawling/indexing; it does not prove a manual penalty.

Google’s people-first guidance asks whether pages add original value, show real expertise, serve an intended audience, and leave visitors satisfied; it explicitly warns against producing large amounts of content on many topics mainly to attract search traffic. [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [Google: spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

**Fix:** stop adding indexable URLs temporarily. Establish an index-quality gate: functional test, unique intent, differentiated content, accurate privacy/limit claims, owner/reviewer, search demand, internal-link placement, self-canonical, language review, and sitemap eligibility. Consolidate overlapping tools where one strong workspace can satisfy the intent better.

### P1 — Claims and privacy language are internally inconsistent

The global tool banner says tools run locally, while at least nine tools are explicitly listed elsewhere as using LanguageTool, Datamuse, Google Input, Google Translate/TTS, or related services. Generic tools store text in `localStorage` under `ilovetexts_tool_input`, while some copy says data is never stored. Local browser storage is not a server upload, but it is still persistence and must be described accurately. “100% private,” “unlimited,” “instant,” “verified,” or “no limits” claims need feature-specific evidence.

**Fix:** create a machine-readable processing manifest per tool: local only / local storage / external processing / server processing, data sent, provider, retention link, limits, supported browsers, and failure mode. Render badges and privacy copy from that manifest and test them against implementation.

### P1 — Navigation and HTML are excessively heavy

The median page contains 632 links and about 401 KB of raw HTML; the homepage contains roughly 870 links and 553 KB. Much of this comes from repeated all-tool navigation and broad cross-link blocks. Excessive templated links dilute task focus, create a visually demanding page, and increase render/transfer work. Deterministic pseudo-random “PageRank” links are not the same as useful topical architecture.

**Fix:** keep the global navigation compact, searchable, and category-led. On each tool page show a small set of genuinely adjacent tools and a workflow based on user intent. Move the full directory to `/tools`. Measure real-user LCP, INP, and CLS through Search Console or another RUM system; this crawl does not substitute for field Core Web Vitals. Google recommends evaluating page experience as a whole, not treating one metric as the only ranking factor. [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

### P1 — Metadata is overlong and duplicated

1,561 titles exceed 60 characters and 716 descriptions exceed 160. These are not hard Google limits, but the scale indicates templates are optimized around keyword accumulation rather than concise result presentation. There are 268 duplicate-title groups and 267 duplicate-description groups, largely caused by untranslated locale variants.

**Fix:** write titles for intent and differentiation, usually leading with the task and one meaningful benefit. Treat Search Console pages with impressions and low CTR as the first rewriting queue. Avoid mechanical keyword variants and promises not supported by the tool.

### P2 — Accessibility and semantic defects

Twelve pages have duplicate H1s: Job Application Auto-Pack and Bank Statement Financial Report across six locales. Tool pages also nest `main#tool-workspace` inside the layout’s `main.app-main`, producing two main landmarks. Use one main landmark and demote the embedded workspace wrapper to a section/div with an accessible label. These issues are primarily accessibility/quality concerns, not a proven index block.

### P2 — Host canonicalization is incomplete

HTTP correctly 301-redirects to HTTPS, `/en` correctly redirects to `/`, tracking parameters are stripped, and legacy `/word-counter/reading-time` redirects to the new category. However, `www.ilovetexts.com` did not resolve in the audit DNS lookup. Configure the `www` hostname and permanently redirect it to the chosen apex, or ensure no historical/marketing links use it.

### P2 — Internal audit script is not a reliable release gate

The existing `seo-audit.js` reports “Safe to deploy” despite the 100 sitemap/noindex conflicts, 1,610 sitemap/non-self-canonical conflicts, incomplete translations, and broken externally backed grammar flow. Its checks largely validate source-string presence, not rendered behavior or cross-system consistency.

**Fix:** make the audit fail on sitemap/noindex overlap, unintended non-self canonicals, hreflang reciprocity errors, locale readiness gaps, broken API flows under production CSP, duplicate landmarks/H1s, inaccessible historical URLs, and misleading privacy-state combinations.

## Search Console opportunity analysis

The performance chart totals 30 clicks and 4,487 impressions, an aggregate CTR of approximately 0.67%. Its daily, impression-weighted average position is approximately 59.7 using the sheet’s rounded daily positions. Page-dimension totals are 31 clicks and 4,665 impressions; query rows expose only 2 clicks and 2,225 impressions among the 999 rows reviewed. This mismatch is expected because Search Console can suppress anonymized queries and aggregate dimensions differently; totals from different tables must not be forced to reconcile. [Google: Performance report](https://support.google.com/webmasters/answer/7576553)

Highest-priority existing opportunities include:

| Query/page signal | Impressions | Avg. position | Recommended action |
|---|---:|---:|---|
| `contador de palabras online` | 35 | 15.49 | Restore the 404 Spanish guide; connect it to a strong Spanish counter tool |
| German sort-lines page | 17 | 12.29 | Native-review the German terminology and page; self-canonical only when complete |
| German DES page | 21 | 8.05 | Explain that DES is obsolete/insecure; avoid promoting unsafe usage |
| Teleprompter Formatter | 7 | 5.43 | Improve snippet and verify intent/task completion |
| Indonesian Square Text | 5 | 7.60 | Native-review content and consolidate if intent is too narrow |
| Hindi PDF page numbers | 12 | 5.08 | Verify tool on mobile and fully localize the workflow |
| English merge PDF | 12 | 17.50 | Improve task UX, examples, and internal links from PDF workflows |
| `bcrypt` | 8 | 9.25 | Clarify hash generation vs password verification and security limitations |
| “how can I add pages to a PDF online?” | 6 | 6.33 | Create/help content inside the relevant working tool, not a doorway page |
| AI prompt sanitizer page | 26 | 23.35 | Improve proof, examples, terminology, and trust rather than adding keyword copies |

These are small samples and early signals, not stable rankings. Several low-impression queries already show average positions under 10, demonstrating that the site is not universally absent from results.

Device data shows desktop generated 3,970 impressions and 20 clicks (0.50% CTR), mobile 496 impressions and 10 clicks (2.02% CTR), and tablet 21 impressions with no clicks. This does not prove that mobile UX is better; position and query mix differ. It does make desktop snippet/intent mismatch a priority while mobile usability remains mandatory.

## Human usability assessment

The homepage search is useful and typo-tolerant: `pdf compres` surfaced relevant compression tools. The strongest user promise is a fast path from intent to a working tool. That promise is weakened by:

- enormous navigation/link density and a homepage claim of “100+” while the catalogue contains 275 tools;
- generic trust badges that do not match each tool’s processing architecture;
- failure states that coexist with success messages;
- untranslated tool UI/content under localized URLs;
- repeated supporting copy and very long result titles;
- unrelated pseudo-random cross-links instead of task-based next steps;
- two nested main landmarks on tool pages.

The preferred product structure is: search/category discovery → focused tool workspace → clear privacy/processing disclosure → immediate result → useful next action. Editorial content should answer problems surfaced during use, not exist merely to add long-tail pages.

## Prioritized remediation plan

### First 72 hours

1. Remove all `noindex` and noncanonical URLs from XML sitemaps.
2. Define locale readiness page by page; keep incomplete localized copies out of indexation.
3. Fix CSP/external-processing tools and truthful error/success states.
4. Restore or relevantly redirect the Spanish word-counter article now receiving impressions.
5. Configure `www` DNS/redirect or eliminate all references to it.
6. Add automated production checks for the above.

### Weeks 1–2

1. Select 20–30 high-intent tools using impressions, task value, and implementation quality.
2. Test those tools on current Chrome, Safari/WebKit, Firefox, Android-width, and iPhone-width layouts.
3. Rewrite only their titles/descriptions after analyzing their actual queries.
4. Replace global generic claims with per-tool processing manifests.
5. Reduce global link/HTML volume and replace random links with intent-based related tools.
6. Fix duplicate H1/main landmarks and key keyboard/screen-reader flows.

### Weeks 3–8

1. Build complete clusters around proven intents: PDF workflow, writing/grammar, text cleanup, encoding/developer utilities, and selected localized clusters.
2. Add original value: benchmarks, edge cases, downloadable examples, browser compatibility, privacy architecture, and first-hand testing notes.
3. Earn relevant links through genuinely useful assets, integrations, templates, and community outreach—never purchased or automated spam links.
4. Use Search Console URL Inspection on representative templates to compare user-declared and Google-selected canonicals. The Page Indexing report documents why URLs may be excluded, but it does not guarantee indexing. [Google: Page indexing report](https://support.google.com/webmasters/answer/7440203)
5. Monitor field Core Web Vitals and conversion events such as successful tool runs, downloads, copies, saves, and return use.

## Measurement framework

Review monthly, but make changes based on page/query evidence:

- positions 4–20 with meaningful impressions: improve tool completion, coverage, trust, and internal links;
- high impressions/low CTR: improve title/description only after checking intent and rank distribution;
- queries without a satisfying destination: enhance an existing relevant tool first; create a new page only when it adds unique value;
- poor task completion or repeated errors: fix or consolidate the tool;
- indexed pages with no impressions after a reasonable test period: reassess demand, duplication, and quality;
- localized pages: track by language and country, not only site-wide totals.

Avoid keyword stuffing, mass city/language/keyword doorway pages, copied competitor copy, fake ratings, and fabricated expertise. Scale from a small set of excellent pages to proven clusters; traffic targets should be milestones, not guarantees. :codex-annotation{index="1"}

## Limitations

- Search Console exports are historical snapshots and end before this audit date.
- The crawl verifies response/index signals, not whether Google has selected each canonical. Use URL Inspection for that.
- A simulated Googlebot user-agent is not a verified Google crawl and was used only for response-parity checks.
- Raw HTML size and link count are diagnostic indicators, not Core Web Vitals.
- The crawler’s `mainWords` field extracts the first `main` region and is unreliable on pages with nested main landmarks; it was not used to label pages “thin.”
- Only representative tool flows were manually tested. Every tool requires a functional/privacy/browser test before being declared production-grade.

## Evidence files

- `summary.json`: top-level full-crawl counts.
- `live-pages.json`: per-URL crawl evidence for 1,944 pages.
- `crawl-analysis.json`: aggregate locale, canonical, metadata, size, and duplicate findings.
- `catalogue-and-localization.json`: per-tool locale coverage evidence.
- `sitemap-inventory.json` and `live-sitemap-*.xml`: captured sitemap evidence.
- `spot-checks.json`: redirects, 404s, CSP, and user-agent parity samples.
- `live-robots.txt`: captured robots policy.

## Sources

Accessed September 13–14, 2026:

1. Google Search Central, [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
2. Google Search Central, [Tell Google about localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).
3. Google Search Central, [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
4. Google Search Central, [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
5. Google Search Central, [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
6. Google Search Central, [Spam policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies).
7. Google Search Central, [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
8. Google Search Central, [Core Web Vitals and Google Search](https://developers.google.com/search/docs/appearance/core-web-vitals).
9. Google Search Console Help, [Page indexing report](https://support.google.com/webmasters/answer/7440203).
10. Google Search Console Help, [Performance report](https://support.google.com/webmasters/answer/7576553).
11. Owner-provided Search Console coverage sheet, [ilovetexts.com Coverage 2026-09-13](https://docs.google.com/spreadsheets/d/1DdRCjAgRLfgxK0WbfQrQgvDNZsA43rd2GrUH3nOiS5A/edit?usp=sharing).
12. Owner-provided Search Console performance sheet, [ilovetexts.com Performance 2026-09-13](https://docs.google.com/spreadsheets/d/1Vb1c4_9ZjpcPuJB1HKlb-CpIxbU1-bSH5QRGZs2er0M/edit?usp=sharing).
