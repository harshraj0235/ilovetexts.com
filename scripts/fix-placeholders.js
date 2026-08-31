import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_LANGS = ['hi', 'pt', 'es', 'de', 'id'];
const SOURCE_FILE = path.join(__dirname, '../locales/en.json');

function extractPlaceholders(str) {
  const matches = str.match(/\{[^}]+\}/g);
  return matches || [];
}

function fixPlaceholders(enStr, transStr) {
  const enPlaceholders = extractPlaceholders(enStr);
  if (enPlaceholders.length === 0) return transStr;

  let fixedStr = transStr;
  const transPlaceholders = extractPlaceholders(transStr);
  
  if (enPlaceholders.length === transPlaceholders.length) {
    // Replace 1 to 1
    for (let i = 0; i < enPlaceholders.length; i++) {
      fixedStr = fixedStr.replace(transPlaceholders[i], enPlaceholders[i]);
    }
  } else {
    console.log(`Mismatch! EN: ${enStr} | TRANS: ${transStr}`);
    // If there's only 1 EN placeholder, just brute force replace any {xxx}
    if (enPlaceholders.length === 1 && transPlaceholders.length > 0) {
      for (const p of transPlaceholders) {
         fixedStr = fixedStr.replace(p, enPlaceholders[0]);
      }
    }
  }
  return fixedStr;
}

const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));

for (const lang of TARGET_LANGS) {
  const langFile = path.join(__dirname, `../locales/${lang}.json`);
  if (!fs.existsSync(langFile)) continue;
  
  const langData = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
  
  function traverse(enObj, transObj) {
    for (const key in enObj) {
      if (typeof enObj[key] === 'string' && typeof transObj[key] === 'string') {
        transObj[key] = fixPlaceholders(enObj[key], transObj[key]);
      } else if (Array.isArray(enObj[key]) && Array.isArray(transObj[key])) {
        for (let i = 0; i < enObj[key].length; i++) {
          if (typeof enObj[key][i] === 'object' && typeof transObj[key][i] === 'object') {
            traverse(enObj[key][i], transObj[key][i]);
          }
        }
      } else if (typeof enObj[key] === 'object' && typeof transObj[key] === 'object') {
        traverse(enObj[key], transObj[key]);
      }
    }
  }
  
  traverse(sourceData, langData);
  fs.writeFileSync(langFile, JSON.stringify(langData, null, 2), 'utf-8');
  console.log(`Fixed placeholders for ${lang}`);
}
