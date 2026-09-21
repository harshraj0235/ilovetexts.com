const { SEO_DATA } = require('./lib/seo-data.js');

let toolsMissingSearches = 0;
let toolsWithEnoughSearches = 0;

for (const [slug, data] of Object.entries(SEO_DATA)) {
  if (!data.relatedSearches || data.relatedSearches.length < 5) {
    toolsMissingSearches++;
    console.log(`- ${slug} has ${data.relatedSearches ? data.relatedSearches.length : 0} searches.`);
  } else {
    toolsWithEnoughSearches++;
  }
}

console.log(`\nTools with >= 5 related searches: ${toolsWithEnoughSearches}`);
console.log(`Tools with < 5 related searches: ${toolsMissingSearches}`);
