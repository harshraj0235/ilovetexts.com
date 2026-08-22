// ═══════════════════════════════════════════════════════
// Text Processing Functions — Pure client-side
// ═══════════════════════════════════════════════════════

import CryptoJS from 'crypto-js';

// ─── Case Converters ───
export function toUpperCase(text) {
  return text.toUpperCase();
}

export function toLowerCase(text) {
  return text.toLowerCase();
}

export function toTitleCase(text) {
  const minorWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at',
    'to', 'by', 'in', 'of', 'up', 'as', 'is', 'it', 'so', 'if',
  ]);
  return text.replace(/\w\S*/g, (word, index) => {
    if (index !== 0 && minorWords.has(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
  });
}

export function toSentenceCase(text) {
  return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
}

export function toCamelCase(text) {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function toSnakeCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-\.]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

export function toKebabCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_\.]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

export function toAlternatingCase(text) {
  let upper = false;
  return text.replace(/[a-zA-Z]/g, (c) => {
    upper = !upper;
    return upper ? c.toLowerCase() : c.toUpperCase();
  });
}

export function toToggleCase(text) {
  return text.replace(/[a-zA-Z]/g, (c) =>
    c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
  );
}

export function toConstantCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-\.]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();
}

// ─── Text Counters ───
export function countWords(text) {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text) {
  return text.length;
}

export function countCharactersNoSpaces(text) {
  return text.replace(/\s/g, '').length;
}

export function countSentences(text) {
  if (!text.trim()) return 0;
  const matches = text.match(/[.!?]+[\s$]/g);
  return matches ? matches.length : (text.trim() ? 1 : 0);
}

export function countParagraphs(text) {
  if (!text.trim()) return 0;
  return text.split(/\n\s*\n/).filter(p => p.trim()).length;
}

export function countLines(text) {
  if (!text) return 0;
  return text.split('\n').length;
}

export function getWordFrequency(text, limit = 20) {
  if (!text.trim()) return [];
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, percentage: ((count / words.length) * 100).toFixed(1) }));
}

export function getReadingTime(text) {
  const wpm = 238; // average reading speed
  const words = countWords(text);
  const minutes = Math.ceil(words / wpm);
  return { minutes, seconds: Math.ceil((words / wpm) * 60), words };
}

export function getSpeakingTime(text) {
  const wpm = 150; // average speaking speed
  const words = countWords(text);
  const minutes = Math.floor(words / wpm);
  const seconds = Math.ceil(((words % wpm) / wpm) * 60);
  return { minutes, seconds, words };
}

export function getReadabilityScore(text) {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countSyllables(text);

  if (words === 0 || sentences === 0) return { score: 0, grade: 'N/A', level: 'N/A' };

  // Flesch Reading Ease
  const score = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));
  const clampedScore = Math.max(0, Math.min(100, score));

  let grade, level;
  if (clampedScore >= 90) { grade = '5th Grade'; level = 'Very Easy'; }
  else if (clampedScore >= 80) { grade = '6th Grade'; level = 'Easy'; }
  else if (clampedScore >= 70) { grade = '7th Grade'; level = 'Fairly Easy'; }
  else if (clampedScore >= 60) { grade = '8th-9th Grade'; level = 'Standard'; }
  else if (clampedScore >= 50) { grade = '10th-12th Grade'; level = 'Fairly Difficult'; }
  else if (clampedScore >= 30) { grade = 'College'; level = 'Difficult'; }
  else { grade = 'College Graduate'; level = 'Very Difficult'; }

  return { score: clampedScore, grade, level };
}

function countSyllables(text) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let total = 0;
  for (const word of words) {
    let syllables = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
    total += syllables ? Math.max(syllables.length, 1) : 1;
  }
  return total;
}

export function getKeywordDensity(text, limit = 10) {
  if (!text.trim()) return [];
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'this', 'that', 'was', 'are', 'be', 'has', 'had', 'have', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'not', 'no', 'so', 'if', 'as', 'from', 'i', 'my', 'me', 'we', 'you', 'he', 'she', 'they', 'them', 'us', 'our', 'your', 'his', 'her', 'its', 'am']);
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  const filtered = words.filter(w => !stopWords.has(w) && w.length > 2);
  const freq = {};
  for (const w of filtered) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, density: ((count / words.length) * 100).toFixed(2) }));
}

// ─── Text Cleaners ───
export function removeLineBreaks(text) {
  return text.replace(/(\r\n|\n|\r)/g, ' ').replace(/\s+/g, ' ').trim();
}

export function removeExtraSpaces(text) {
  return text.replace(/[^\S\n]+/g, ' ').replace(/^ +| +$/gm, '');
}

export function removeDuplicateLines(text) {
  const lines = text.split('\n');
  const seen = new Set();
  return lines.filter(line => {
    const trimmed = line.trim();
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  }).join('\n');
}

export function removeEmptyLines(text) {
  return text.split('\n').filter(line => line.trim() !== '').join('\n');
}

export function removeAllWhitespace(text) {
  return text.replace(/\s/g, '');
}

export function addLineNumbers(text) {
  const lines = text.split('\n');
  const pad = String(lines.length).length;
  return lines.map((line, i) => `${String(i + 1).padStart(pad, ' ')} | ${line}`).join('\n');
}

export function addPrefixSuffix(text, prefix = '', suffix = '') {
  return text.split('\n').map(line => `${prefix}${line}${suffix}`).join('\n');
}

export function sortLines(text, ascending = true) {
  const lines = text.split('\n');
  lines.sort((a, b) => ascending ? a.localeCompare(b) : b.localeCompare(a));
  return lines.join('\n');
}

export function reverseText(text) {
  return text.split('').reverse().join('');
}

export function reverseLines(text) {
  return text.split('\n').reverse().join('\n');
}

// ─── Encoders & Decoders ───
export function base64Encode(text) {
  try { return btoa(unescape(encodeURIComponent(text))); } catch { return 'Error: Invalid input for Base64 encoding'; }
}

export function base64Decode(text) {
  try { return decodeURIComponent(escape(atob(text.trim()))); } catch { return 'Error: Invalid Base64 string'; }
}

export function urlEncode(text) {
  return encodeURIComponent(text);
}

export function urlDecode(text) {
  try { return decodeURIComponent(text); } catch { return 'Error: Invalid URL-encoded string'; }
}

export function htmlEncode(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

export function htmlDecode(text) {
  const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'" };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#0?39;/g, c => map[c]);
}

export function textToBinary(text) {
  return [...text].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

export function binaryToText(text) {
  try {
    return text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
  } catch { return 'Error: Invalid binary string'; }
}

export function textToHex(text) {
  return [...text].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
}

export function hexToText(text) {
  try {
    return text.trim().split(/\s+/).map(h => String.fromCharCode(parseInt(h, 16))).join('');
  } catch { return 'Error: Invalid hex string'; }
}

export function textToOctal(text) {
  return [...text].map(c => c.charCodeAt(0).toString(8).padStart(3, '0')).join(' ');
}

export function octalToText(text) {
  try {
    return text.trim().split(/\s+/).map(o => String.fromCharCode(parseInt(o, 8))).join('');
  } catch { return 'Error: Invalid octal string'; }
}

export function textToAscii(text) {
  return [...text].map(c => c.charCodeAt(0)).join(' ');
}

export function asciiToText(text) {
  try {
    return text.trim().split(/\s+/).map(n => String.fromCharCode(parseInt(n, 10))).join('');
  } catch { return 'Error: Invalid ASCII codes'; }
}

export function rot13(text) {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function utf8Encode(text) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function utf8Decode(text) {
  try {
    const bytes = new Uint8Array(text.trim().split(/\s+/).map(h => parseInt(h, 16)));
    return new TextDecoder().decode(bytes);
  } catch { return 'Error: Invalid UTF-8 byte sequence'; }
}

const MORSE_MAP = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....',
  'I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.',
  'Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-',
  'Y':'-.--','Z':'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--',
  '?':'..--..','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',
  ';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-','_':'..--.-','"':'.-..-.','$':'...-..-',
  '@':'.--.-.',' ':' / '
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v]) => [v, k]));

export function textToMorse(text) {
  return text.toUpperCase().split('').map(c => MORSE_MAP[c] || c).join(' ');
}

export function morseToText(text) {
  return text.split(' / ').map(word =>
    word.split(' ').map(c => MORSE_REVERSE[c] || c).join('')
  ).join(' ');
}

// ─── Code Formatters ───
export function jsonFormat(text) {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
}

export function jsonValidate(text) {
  try {
    JSON.parse(text);
    return '✅ Valid JSON!\n\n' + JSON.stringify(JSON.parse(text), null, 2);
  } catch (e) { return `❌ Invalid JSON\n\nError: ${e.message}`; }
}

export function jsonMinify(text) {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch (e) { return `Error: ${e.message}`; }
}

export function xmlFormat(text) {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  text.replace(/>\s*</g, '><').split(/(<[^>]+>)/g).forEach(node => {
    if (!node.trim()) return;
    if (node.match(/^<\/\w/)) indent--;
    formatted += tab.repeat(Math.max(0, indent)) + node.trim() + '\n';
    if (node.match(/^<\w[^>]*[^/]>$/)) indent++;
  });
  return formatted.trim();
}

export function sqlFormat(text) {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'OUTER JOIN', 'ON', 'AS', 'LIMIT', 'OFFSET', 'UNION', 'CREATE TABLE',
    'ALTER TABLE', 'DROP TABLE', 'INDEX', 'NOT NULL', 'PRIMARY KEY', 'FOREIGN KEY'];
  let result = text;
  keywords.forEach(kw => {
    const regex = new RegExp('\\b' + kw + '\\b', 'gi');
    result = result.replace(regex, '\n' + kw.toUpperCase());
  });
  return result.trim().replace(/^\n/, '');
}

export function htmlFormat(text) {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
  text.replace(/>\s*</g, '><').split(/(<[^>]+>)/g).forEach(node => {
    if (!node.trim()) return;
    const tagMatch = node.match(/^<\/?(\w+)/);
    if (node.match(/^<\//)) indent--;
    formatted += tab.repeat(Math.max(0, indent)) + node.trim() + '\n';
    if (tagMatch && !voidTags.has(tagMatch[1].toLowerCase()) && node.match(/^<\w/) && !node.match(/\/>/)) indent++;
  });
  return formatted.trim();
}

export function cssFormat(text) {
  return text
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/\s*}\s*/g, '\n}\n\n')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/  }/g, '}')
    .trim();
}

export function cssMinify(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function jsFormat(text) {
  let indent = 0;
  const tab = '  ';
  let result = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      result += ch;
      if (ch === stringChar && text[i-1] !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      result += ch;
    } else if (ch === '{' || ch === '[') {
      indent++;
      result += ch + '\n' + tab.repeat(indent);
    } else if (ch === '}' || ch === ']') {
      indent--;
      result += '\n' + tab.repeat(Math.max(0, indent)) + ch;
    } else if (ch === ';') {
      result += ';\n' + tab.repeat(indent);
    } else if (ch === ',') {
      result += ',\n' + tab.repeat(indent);
    } else {
      result += ch;
    }
  }
  return result.replace(/\n\s*\n/g, '\n').trim();
}

export function jsMinify(text) {
  return text
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()[\];,=+\-*/<>!&|?:])\s*/g, '$1')
    .trim();
}

// ─── Text Converters ───
export function textToHtml(text) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = escaped.split(/\n\s*\n/).filter(p => p.trim());
  if (paragraphs.length <= 1) {
    return `<p>${escaped.replace(/\n/g, '<br>')}</p>`;
  }
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n\n');
}

export function htmlToText(text) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function markdownToHtml(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(?!<[hlo])(.*\S.*)$/gm, '<p>$1</p>')
    .replace(/\n/g, '\n');
}

export function csvToJson(text) {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return '[]';
    const headers = parseCsvLine(lines[0]);
    const result = lines.slice(1).filter(l => l.trim()).map(line => {
      const values = parseCsvLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() || ''; });
      return obj;
    });
    return JSON.stringify(result, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

export function jsonToCsv(text) {
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr) || arr.length === 0) return 'Error: Input must be a non-empty JSON array';
    const headers = Object.keys(arr[0]);
    const csvLines = [headers.join(',')];
    for (const obj of arr) {
      csvLines.push(headers.map(h => {
        const val = String(obj[h] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','));
    }
    return csvLines.join('\n');
  } catch (e) { return `Error: ${e.message}`; }
}

export function tsvToCsv(text) {
  return text.split('\n').map(line => {
    return line.split('\t').map(cell => {
      return cell.includes(',') ? `"${cell}"` : cell;
    }).join(',');
  }).join('\n');
}

export function jsonToXml(text) {
  try {
    const obj = JSON.parse(text);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + objToXml(obj, 'root');
  } catch (e) { return `Error: ${e.message}`; }
}

function objToXml(obj, tagName, indent = '') {
  if (typeof obj !== 'object' || obj === null) return `${indent}<${tagName}>${obj}</${tagName}>\n`;
  if (Array.isArray(obj)) return obj.map(item => objToXml(item, 'item', indent)).join('');
  let xml = `${indent}<${tagName}>\n`;
  for (const [key, val] of Object.entries(obj)) {
    xml += objToXml(val, key, indent + '  ');
  }
  xml += `${indent}</${tagName}>\n`;
  return xml;
}

export function xmlToJson(text) {
  try {
    // Simple XML parser via DOMParser approach (text-based fallback)
    const result = {};
    const tagRegex = /<(\w+)(?:\s[^>]*)?>([^<]*)<\/\1>/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      result[match[1]] = match[2];
    }
    return JSON.stringify(result, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
}

export function yamlToJson(text) {
  try {
    const result = {};
    const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    for (const line of lines) {
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (match) {
        const key = match[2].trim();
        let val = match[3].trim();
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null') val = null;
        else if (!isNaN(val) && val !== '') val = Number(val);
        else if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        result[key] = val;
      }
    }
    return JSON.stringify(result, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
}

export function jsonToYaml(text) {
  try {
    const obj = JSON.parse(text);
    return toYamlString(obj, 0);
  } catch (e) { return `Error: ${e.message}`; }
}

function toYamlString(obj, indent) {
  const pad = '  '.repeat(indent);
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') return `"${obj}"`;
    return String(obj);
  }
  if (Array.isArray(obj)) {
    return '\n' + obj.map(item => `${pad}- ${toYamlString(item, indent + 1).trimStart()}`).join('\n');
  }
  const entries = Object.entries(obj);
  return '\n' + entries.map(([key, val]) => {
    const valStr = toYamlString(val, indent + 1);
    if (typeof val === 'object' && val !== null) return `${pad}${key}:${valStr}`;
    return `${pad}${key}: ${valStr}`;
  }).join('\n');
}

// ─── Extractors ───
export function extractEmails(text) {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return 'No email addresses found.';
  const unique = [...new Set(matches)];
  return `Found ${unique.length} email(s):\n\n${unique.join('\n')}`;
}

export function extractUrls(text) {
  const matches = text.match(/https?:\/\/[^\s<>"']+/g);
  if (!matches) return 'No URLs found.';
  const unique = [...new Set(matches)];
  return `Found ${unique.length} URL(s):\n\n${unique.join('\n')}`;
}

export function extractNumbers(text) {
  const matches = text.match(/-?\d+\.?\d*/g);
  if (!matches) return 'No numbers found.';
  return `Found ${matches.length} number(s):\n\n${matches.join('\n')}`;
}

export function extractPhones(text) {
  const matches = text.match(/(\+?\d{1,4}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g);
  if (!matches) return 'No phone numbers found.';
  const unique = [...new Set(matches.map(p => p.trim()).filter(p => p.replace(/\D/g, '').length >= 7))];
  if (unique.length === 0) return 'No phone numbers found.';
  return `Found ${unique.length} phone number(s):\n\n${unique.join('\n')}`;
}

export function findReplace(text, find, replace) {
  if (!find) return text;
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'g');
  const count = (text.match(regex) || []).length;
  const result = text.replace(regex, replace);
  return result;
}

export function regexTest(text, pattern, flags = 'g') {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [...text.matchAll(regex)];
    if (matches.length === 0) return 'No matches found.';
    let result = `Found ${matches.length} match(es):\n\n`;
    matches.forEach((m, i) => {
      result += `Match ${i + 1}: "${m[0]}" at index ${m.index}\n`;
      if (m.length > 1) {
        for (let g = 1; g < m.length; g++) {
          result += `  Group ${g}: "${m[g]}"\n`;
        }
      }
    });
    return result;
  } catch (e) { return `Error: ${e.message}`; }
}

export function textCompare(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const maxLen = Math.max(lines1.length, lines2.length);
  let result = '';
  let diffs = 0;

  for (let i = 0; i < maxLen; i++) {
    const l1 = lines1[i] ?? '';
    const l2 = lines2[i] ?? '';
    if (l1 === l2) {
      result += `  ${i + 1} | ${l1}\n`;
    } else {
      diffs++;
      result += `- ${i + 1} | ${l1}\n`;
      result += `+ ${i + 1} | ${l2}\n`;
    }
  }

  return `${diffs} difference(s) found:\n\n${result}`;
}

// ═══════════════════════════════════════════════════════
// PHASE 3/4: GENERATORS & CRYPTOGRAPHY & WEB TOOLS
// ═══════════════════════════════════════════════════════

// ─── Generators & Randomizers ───
export function uuidGenerator() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function passwordGenerator(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export function loremIpsum() {
  return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
}

export function randomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export function stringRepeater(text, times = 5) {
  if (times < 1 || times > 10000) return 'Number of times must be between 1 and 10000.';
  return text.repeat(times);
}

export function fakeNameGenerator() {
  const firsts = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen"];
  const lasts = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin"];
  let res = [];
  for(let i=0; i<10; i++){
    res.push(firsts[Math.floor(Math.random()*firsts.length)] + " " + lasts[Math.floor(Math.random()*lasts.length)]);
  }
  return res.join('\n');
}

export function fakeAddressGenerator() {
  const streets = ["Main St", "Oak St", "Pine St", "Maple Ave", "Cedar Ln", "Elm St", "Washington Blvd", "Lake Rd", "Hill St", "Park Ave"];
  const cities = ["Springfield", "Riverside", "Dayton", "Franklin", "Greenville", "Bristol", "Clinton", "Fairview", "Salem", "Madison"];
  const states = ["CA","TX","FL","NY","PA","IL","OH","GA","NC","MI"];
  let res = [];
  for(let i=0; i<5; i++){
    res.push(`${Math.floor(Math.random()*9000)+100} ${streets[Math.floor(Math.random()*streets.length)]}\n${cities[Math.floor(Math.random()*cities.length)]}, ${states[Math.floor(Math.random()*states.length)]} ${Math.floor(Math.random()*90000)+10000}`);
  }
  return res.join('\n\n');
}

export function macAddressGenerator() {
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, function() {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
  });
}

export function stringCombiner(text1, text2) {
  const l1 = text1.split('\n').map(l => l.trim()).filter(l => l);
  const l2 = text2.split('\n').map(l => l.trim()).filter(l => l);
  if (!l1.length || !l2.length) return "Need two lists of text to combine.";
  let res = [];
  l1.forEach(a => {
    l2.forEach(b => {
      res.push(`${a}${b}`);
    });
  });
  return res.join('\n');
}

// ─── Text Hasher & Cryptography ───
export function md5Hash(text) { return CryptoJS.MD5(text).toString(); }
export function sha1Hash(text) { return CryptoJS.SHA1(text).toString(); }
export function sha256Hash(text) { return CryptoJS.SHA256(text).toString(); }
export function sha512Hash(text) { return CryptoJS.SHA512(text).toString(); }
export function sha224Hash(text) { return CryptoJS.SHA224(text).toString(); }
export function sha384Hash(text) { return CryptoJS.SHA384(text).toString(); }
export function sha3Hash(text) { return CryptoJS.SHA3(text).toString(); }
export function ripemd160Hash(text) { return CryptoJS.RIPEMD160(text).toString(); }

export function aesEncrypt(text, pass) {
  if (!pass) return "Error: Password required.";
  return CryptoJS.AES.encrypt(text, pass).toString();
}
export function aesDecrypt(text, pass) {
  if (!pass) return "Error: Password required.";
  try {
    const bytes = CryptoJS.AES.decrypt(text, pass);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || "Error: Incorrect password or malformed ciphertext.";
  } catch (e) { return "Error: Decryption failed."; }
}

export function desEncrypt(text, pass) {
  if (!pass) return "Error: Password required.";
  return CryptoJS.DES.encrypt(text, pass).toString();
}
export function desDecrypt(text, pass) {
  if (!pass) return "Error: Password required.";
  try {
    const bytes = CryptoJS.DES.decrypt(text, pass);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || "Error: Incorrect password or malformed ciphertext.";
  } catch (e) { return "Error: Decryption failed."; }
}

// ─── List & Array Tools ───
export function shuffleList(text) {
  let lines = text.split('\n');
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  return lines.join('\n');
}

export function listIntersection(t1, t2) {
  const set1 = new Set(t1.split('\n').map(l=>l.trim()).filter(l=>l));
  const set2 = new Set(t2.split('\n').map(l=>l.trim()).filter(l=>l));
  return [...set1].filter(x => set2.has(x)).join('\n');
}

export function listDifference(t1, t2) {
  const set1 = new Set(t1.split('\n').map(l=>l.trim()).filter(l=>l));
  const set2 = new Set(t2.split('\n').map(l=>l.trim()).filter(l=>l));
  const diff1 = [...set1].filter(x => !set2.has(x));
  const diff2 = [...set2].filter(x => !set1.has(x));
  return diff1.concat(diff2).join('\n');
}

export function commaSeparator(text) {
  return text.split('\n').map(l=>l.trim()).filter(l=>l).join(', ');
}

export function splitText(text, delim = ',') {
  return text.split(delim).map(s=>s.trim()).filter(s=>s).join('\n');
}

export function joinText(text, delim = ',') {
  return text.split('\n').map(l=>l.trim()).filter(l=>l).join(delim);
}

export function numberToWords(text) {
  let num = parseInt(text.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return 'Enter a valid positive number.';
  if (num === 0) return 'zero';
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

export function wordsToNumbers(text) {
  return "Note: This is a complex NLP operation. For a basic implementation, replace words with digits manually, e.g., 'one' -> 1.";
}

export function addPrefixList(text, pre) {
  if (!pre) return text;
  return text.split('\n').map(l => l ? `${pre}${l}` : l).join('\n');
}
export function addSuffixList(text, suf) {
  if (!suf) return text;
  return text.split('\n').map(l => l ? `${l}${suf}` : l).join('\n');
}

// ─── Web & Developer Tools ───
export function jwtDecoder(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.stringify(JSON.parse(jsonPayload), null, 2);
  } catch(e) { return "Invalid JWT Token."; }
}

export function colorConverter(text) {
  text = text.trim();
  if (text.startsWith('#')) {
    let hex = text.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `RGB: rgb(${r}, ${g}, ${b})`;
  }
  return "Currently supports basic HEX to RGB. E.g. #FF0000";
}

export function cssColorExtractor(text) {
  const colors = text.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi);
  if (!colors) return "No colors found.";
  return [...new Set(colors)].join('\n');
}

export function queryStringParser(url) {
  try {
    const queryString = url.split('?')[1];
    if (!queryString) return "No query string found.";
    const params = new URLSearchParams(queryString);
    const res = {};
    for (const [key, value] of params.entries()) { res[key] = value; }
    return JSON.stringify(res, null, 2);
  } catch(e) { return "Invalid URL."; }
}

export function urlSlugGenerator(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function htmlTagRemover(text, tag) {
  if (!tag) return text;
  const regex = new RegExp(`<\/?${tag}[^>]*>`, 'gi');
  return text.replace(regex, '');
}

export function bbcodeToHtml(text) {
  return text
    .replace(/\[b\](.*?)\[\/b\]/gi, '<b>$1</b>')
    .replace(/\[i\](.*?)\[\/i\]/gi, '<i>$1</i>')
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    .replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1">$1</a>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" />');
}

export function htmlToBbcode(text) {
  return text
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '[b]$1[/b]')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '[b]$1[/b]')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '[i]$1[/i]')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '[i]$1[/i]')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '[u]$1[/u]')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[url=$1]$2[/url]')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '[img]$1[/img]');
}

export function markdownStripper(text) {
  return text
    .replace(/[#_*~`>]/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1');
}

export function sqlEscaper(text) {
  return text.replace(/'/g, "''").replace(/\\/g, "\\\\");
}
