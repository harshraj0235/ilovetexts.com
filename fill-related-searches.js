const fs = require('fs');

const filePath = 'lib/tools-seo-data.js';
let data = fs.readFileSync(filePath, 'utf8');

data = data.replace(/(relatedSearches:\s*\[)([^\]]+)(\])/g, (match, p1, p2, p3) => {
  const items = p2.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(s => s !== '');
  if (items.length >= 5) return match;
  
  const baseKeyword = items[0] || 'online tool';
  
  const additional = [
    `${baseKeyword} free`,
    `${baseKeyword} online`,
    `best ${baseKeyword}`,
    `${baseKeyword} 2026`,
    `free ${baseKeyword} no signup`,
    `${baseKeyword} fast`,
    `${baseKeyword} private`,
    `how to use ${baseKeyword}`
  ];
  
  while (items.length < 5 && additional.length > 0) {
    const next = additional.shift();
    if (!items.includes(next)) items.push(next);
  }
  
  const newArrStr = items.map(i => `'${i.replace(/'/g, "\\'")}'`).join(', ');
  return `${p1}${newArrStr}${p3}`;
});

fs.writeFileSync(filePath, data);
console.log('Successfully updated tools-seo-data.js');
