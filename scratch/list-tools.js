const fs = require('fs');
const c = fs.readFileSync('lib/tools-config.js', 'utf8');
// Find category names
const catMatches = c.match(/name:\s*'[^']+',\s*\n\s*description/g);
if (catMatches) catMatches.forEach(m => console.log(m.split("'")[1]));

// Count tools (slug entries)
const slugs = c.match(/slug:\s*'[^']+'/g);
console.log('\nTotal tool slugs:', slugs ? slugs.length : 0);

// Find category blocks
const idMatches = c.match(/id:\s*'[^']+'/g);
if (idMatches) {
  console.log('\nCategories:');
  idMatches.forEach(m => console.log(' ', m));
}
