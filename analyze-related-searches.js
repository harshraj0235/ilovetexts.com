const fs = require('fs');

const data = fs.readFileSync('lib/tools-seo-data.js', 'utf8');

// Use regex to count occurrences of relatedSearches with fewer than 5 items.
// A simple way is to match `relatedSearches: [ ... ]`
const regex = /relatedSearches:\s*\[(.*?)\]/g;
let match;
let missing = 0;
let enough = 0;
let noSearches = 0; // count tools that don't have it at all if possible?

// Let's just find all matches and count them
while ((match = regex.exec(data)) !== null) {
  const arrContent = match[1];
  const items = arrContent.split(',').filter(i => i.trim() !== '');
  if (items.length < 5) {
    missing++;
  } else {
    enough++;
  }
}

console.log(`Tools with >= 5 related searches: ${enough}`);
console.log(`Tools with < 5 related searches: ${missing}`);
