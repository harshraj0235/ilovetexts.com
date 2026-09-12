const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const BRAILLE_CELLS = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓',
  i: '⠊', j: '⠚', k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏',
  q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭',
  y: '⠽', z: '⠵', ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖',
  '?': '⠦', "'": '⠄', '-': '⠤', '/': '⠌', '(': '⠷', ')': '⠾', '"': '⠶',
};
const BRAILLE_REVERSE = Object.fromEntries(Object.entries(BRAILLE_CELLS).map(([key, value]) => [value, key]));
const NUMBER_CELLS = ['⠁', '⠃', '⠉', '⠙', '⠑', '⠋', '⠛', '⠓', '⠊', '⠚'];

const NATO_WORDS = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett',
  'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango',
  'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu',
];
const NATO_MAP = Object.fromEntries(LETTERS.split('').map((letter, index) => [letter, NATO_WORDS[index]]));
const NATO_REVERSE = Object.fromEntries(NATO_WORDS.map((word, index) => [word.toLowerCase().replace(/[^a-z]/g, ''), LETTERS[index]]));
Object.assign(NATO_REVERSE, { xray: 'x', juliet: 'j' });
const NATO_DIGITS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
NATO_DIGITS.forEach((word, digit) => { NATO_REVERSE[word.toLowerCase()] = String(digit); });

const WINGDING_SYMBOLS = {
  a: '✌', b: '👌', c: '👍', d: '👎', e: '☜', f: '☞', g: '☝', h: '☟', i: '☺', j: '😐',
  k: '☹', l: '💣', m: '☠', n: '⚐', o: '⚑', p: '✈', q: '☼', r: '💧', s: '❄', t: '🕆',
  u: '🕇', v: '🕈', w: '✠', x: '✡', y: '☪', z: '☯', 0: '📁', 1: '📂', 2: '📄', 3: '🗏',
  4: '🗐', 5: '🗄', 6: '⌛', 7: '🖮', 8: '🖰', 9: '🖲',
};
const WINGDING_REVERSE = Object.fromEntries(Object.entries(WINGDING_SYMBOLS).map(([key, value]) => [value, key]));

export const ALPHABET_TOOLS = {
  rot13: {
    label: 'ROT13', mark: '13', color: '#7c3aed', modeLabel: 'Apply ROT13',
    heading: 'A spoiler veil you can lift twice.',
    intro: 'ROT13 moves each English letter thirteen places. The same action encodes and decodes, while numbers, punctuation, and line breaks stay exactly where they are.',
    inputLabel: 'Your text', outputLabel: 'ROT13 result', sample: 'Meet me at noon — bring pizza!',
    helper: 'ROT13 only changes A–Z. It is a reversible obfuscation, not encryption.',
  },
  'braille-translator': {
    label: 'Braille', mark: '⠿', color: '#0f766e', modeLabel: 'Conversion direction',
    heading: 'Read the cells, not just the dots.',
    intro: 'Translate uncontracted English Grade 1 text to Unicode Braille cells, or read those cells back into text. Capital and number signs are shown instead of being hidden.',
    inputLabel: 'English text', outputLabel: 'Unicode Braille', sample: 'Hello 2026!',
    helper: 'This is English Grade 1 (uncontracted) Braille, not Grade 2 or a replacement for professional transcription.',
  },
  'nato-phonetic-translator': {
    label: 'NATO phonetic', mark: 'A–Z', color: '#0369a1', modeLabel: 'Conversion direction',
    heading: 'Spell it clearly, one word at a time.',
    intro: 'Turn a call sign, name, or code into the International Radiotelephony Spelling Alphabet—or decode a pasted sequence back to plain text.',
    inputLabel: 'Plain text', outputLabel: 'Phonetic words', sample: 'Gate B42',
    helper: 'Use a slash between words when decoding. “Juliett” and “X-ray” use the standard spellings.',
  },
  'wingdings-translator': {
    label: 'Wingdings', mark: '✦', color: '#b45309', modeLabel: 'Conversion direction',
    heading: 'Make the symbol message easy to inspect.',
    intro: 'Create a copyable Unicode-style symbol message or decode symbols produced by this tool. Keep the plain-text version when you need a true Wingdings font in a document.',
    inputLabel: 'Plain text', outputLabel: 'Unicode-style symbols', sample: 'HELLO 2026',
    helper: 'These are Unicode visual approximations—not the original proprietary font glyphs. Appearance can differ by device and font.',
  },
};

function rot13(value) {
  return value.replace(/[a-z]/gi, (character) => {
    const base = character <= 'Z' ? 65 : 97;
    return String.fromCharCode(((character.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function encodeBraille(value) {
  let numberMode = false;
  const warnings = [];
  const output = [...value].map((character) => {
    if (/\d/.test(character)) {
      const cell = NUMBER_CELLS[Number(character) === 0 ? 9 : Number(character) - 1];
      const prefix = numberMode ? '' : '⠼';
      numberMode = true;
      return prefix + cell;
    }
    numberMode = false;
    const lower = character.toLowerCase();
    if (BRAILLE_CELLS[lower]) return `${character !== lower ? '⠠' : ''}${BRAILLE_CELLS[lower]}`;
    if (character === ' ' || character === '\n' || character === '\t') return character;
    warnings.push(`“${character}” has no Grade 1 cell in this tool and was preserved.`);
    return character;
  }).join('');
  return { output, warnings };
}

function decodeBraille(value) {
  let capital = false;
  let numberMode = false;
  const warnings = [];
  const output = [...value].map((cell) => {
    if (cell === '⠠') { capital = true; return ''; }
    if (cell === '⠼') { numberMode = true; return ''; }
    if (cell === ' ' || cell === '\n' || cell === '\t') { numberMode = false; return cell; }
    const letter = BRAILLE_REVERSE[cell];
    if (!letter) { warnings.push(`“${cell}” is not a supported Grade 1 cell.`); return cell; }
    if (numberMode) {
      const digit = NUMBER_CELLS.indexOf(cell);
      if (digit >= 0) return String((digit + 1) % 10);
      numberMode = false;
    }
    const result = capital ? letter.toUpperCase() : letter;
    capital = false;
    return result;
  }).join('');
  return { output, warnings };
}

function encodeNato(value) {
  const output = [...value].map((character) => {
    if (character === ' ') return '/';
    if (character === '\n') return '//';
    return NATO_MAP[character.toLowerCase()] || (/[0-9]/.test(character) ? NATO_DIGITS[Number(character)] : character);
  }).join(' ');
  return { output, warnings: [] };
}

function decodeNato(value) {
  const warnings = [];
  const output = value.trim().split(/\s+/).map((token) => {
    if (token === '/') return ' ';
    if (token === '//') return '\n';
    const normalized = token.toLowerCase().replace(/[^a-z]/g, '');
    if (NATO_REVERSE[normalized]) return NATO_REVERSE[normalized];
    warnings.push(`“${token}” is not a NATO spelling word.`);
    return token;
  }).join('');
  return { output, warnings };
}

function encodeWingdings(value) {
  const warnings = [];
  const output = [...value].map((character) => {
    const symbol = WINGDING_SYMBOLS[character.toLowerCase()];
    if (symbol) return symbol;
    if (character === ' ' || character === '\n') return character;
    warnings.push(`“${character}” has no symbol in this preview and was preserved.`);
    return character;
  }).join('');
  return { output, warnings };
}

function decodeWingdings(value) {
  const warnings = [];
  const output = [...value].map((symbol) => {
    if (WINGDING_REVERSE[symbol]) return WINGDING_REVERSE[symbol];
    if (symbol === ' ' || symbol === '\n') return symbol;
    warnings.push(`“${symbol}” is not in this tool’s preview mapping.`);
    return symbol;
  }).join('');
  return { output, warnings };
}

export function translateAlphabet(toolSlug, value, direction = 'encode') {
  if (!value) return { output: '', warnings: [] };
  if (toolSlug === 'rot13') return { output: rot13(value), warnings: [] };
  if (toolSlug === 'braille-translator') return direction === 'encode' ? encodeBraille(value) : decodeBraille(value);
  if (toolSlug === 'nato-phonetic-translator') return direction === 'encode' ? encodeNato(value) : decodeNato(value);
  if (toolSlug === 'wingdings-translator') return direction === 'encode' ? encodeWingdings(value) : decodeWingdings(value);
  return { output: value, warnings: [] };
}

export function referenceRows(toolSlug) {
  if (toolSlug === 'rot13') return LETTERS.split('').map((letter) => ({ from: letter.toUpperCase(), to: rot13(letter).toUpperCase(), note: `+13 from ${letter.toUpperCase()}` }));
  if (toolSlug === 'braille-translator') return LETTERS.split('').map((letter) => ({ from: letter.toUpperCase(), to: BRAILLE_CELLS[letter], note: `dots ${brailleDots(BRAILLE_CELLS[letter])}` }));
  if (toolSlug === 'nato-phonetic-translator') return LETTERS.split('').map((letter) => ({ from: letter.toUpperCase(), to: NATO_MAP[letter], note: 'ICAO spelling word' }));
  if (toolSlug === 'wingdings-translator') return Object.entries(WINGDING_SYMBOLS).map(([letter, symbol]) => ({ from: letter.toUpperCase(), to: symbol, note: `U+${symbol.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}` }));
  return [];
}

export function brailleDots(cell) {
  const code = cell.codePointAt(0);
  if (!code || code < 0x2800 || code > 0x28ff) return '';
  return [1, 2, 3, 4, 5, 6, 7, 8].filter((dot) => code & (1 << (dot - 1))).join('-') || 'none';
}
