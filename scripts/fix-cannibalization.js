const fs = require('fs');
const path = require('path');

const dir = 'd:\\New folder (24)\\ilovetexts.com';
const extensions = ['.js', '.jsx', '.json'];

function walk(currentDir) {
  let results = [];
  const list = fs.readdirSync(currentDir);
  list.forEach(file => {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (extensions.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk(dir);

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace category ID in tools-config.js
  if (file.endsWith('tools-config.js')) {
    newContent = newContent.replace(/id: 'word-counter',/g, "id: 'word-counting-tools',");
  }

  // Replace category references in page.js
  if (file.endsWith('page.js')) {
    newContent = newContent.replace(/'word-counter': \{ bg/g, "'word-counting-tools': { bg");
    newContent = newContent.replace(/cat: 'word-counter'/g, "cat: 'word-counting-tools'");
  }

  // Replace in ClientTool.jsx
  if (file.endsWith('ClientTool.jsx')) {
    newContent = newContent.replace(/categoryId === 'word-counter'/g, "categoryId === 'word-counting-tools'");
    newContent = newContent.replace(/categoryId !== 'word-counter'/g, "categoryId !== 'word-counting-tools'");
    newContent = newContent.replace(/case 'word-counter':/g, "case 'word-counting-tools':");
  }

  // Replace in lib/tools-seo-data.js
  if (file.endsWith('tools-seo-data.js')) {
    newContent = newContent.replace(/'word-counter': \{/g, "'word-counting-tools': {");
  }

  // Replace URL paths /word-counting-tools/... to /word-counting-tools/...
  // This affects Footer.jsx, page.js, blog/page.js, scripts, middleware.js
  newContent = newContent.replace(/\/word-counter\//g, '/word-counting-tools/');
  // Also handle exact string matches like slug references
  newContent = newContent.replace(/'word-counter\/word-counter'/g, "'word-counting-tools/word-counter'");
  newContent = newContent.replace(/'word-counter\/character-counter'/g, "'word-counting-tools/character-counter'");
  newContent = newContent.replace(/'word-counter\/reading-time'/g, "'word-counting-tools/reading-time'");

  // Replace JSON keys in locales/content/*.json
  if (file.includes('locales\\content\\') && file.endsWith('.json')) {
    newContent = newContent.replace(/"word-counter": \{/g, '"word-counting-tools": {');
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    totalReplaced++;
  }
});

console.log(`\nFinished! Updated ${totalReplaced} files.`);
