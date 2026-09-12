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

  // Pattern 1: { data: ab }
  content = content.replace(/\{ data:\s*ab\s*\}/g, "{ data: ab.slice(0) }");
  // Pattern 2: { data: new Uint8Array(ab) }
  content = content.replace(/\{\s*data:\s*new Uint8Array\(ab\)\s*\}/g, "{ data: new Uint8Array(ab.slice(0)) }");
  // Pattern 3: { data: buf }
  content = content.replace(/\{ data:\s*buf\s*\}/g, "{ data: buf.slice(0) }");
  // Pattern 4: { data: arrayBuffer }
  content = content.replace(/\{ data:\s*arrayBuffer\s*\}/g, "{ data: arrayBuffer.slice(0) }");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
