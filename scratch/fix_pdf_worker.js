const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../components');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(componentsDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Pattern 1: https://unpkg.com/...
  content = content.replace(/(pdfjsLib|pdfjs)\.GlobalWorkerOptions\.workerSrc\s*=\s*`https:\/\/unpkg\.com\/[^`]+`;/g, "$1.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';");
  
  // Pattern 2: //cdnjs.cloudflare.com/...
  content = content.replace(/(pdfjsLib|pdfjs)\.GlobalWorkerOptions\.workerSrc\s*=\s*`\/\/cdnjs\.cloudflare\.com\/[^`]+`;/g, "$1.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';");
  
  // Pattern 3: '/pdf.worker.min.js'
  content = content.replace(/(pdfjsLib|pdfjs)\.GlobalWorkerOptions\.workerSrc\s*=\s*'\/pdf\.worker\.min\.js';/g, "$1.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
