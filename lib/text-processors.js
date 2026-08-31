// ═══════════════════════════════════════════════════════
// Text Processing Functions — Pure client-side
// ═══════════════════════════════════════════════════════

import CryptoJS from 'crypto-js';
import * as yaml from 'js-yaml';
import { xml2json, json2xml } from 'xml-js';
import { marked } from 'marked';
import TurndownService from 'turndown';
import * as toml from '@iarna/toml';

// ─── AI & DATA TOOLS ───

export const transcriptCleaner = (text) => {
  if (!text) return '';
  // Remove typical timestamps: [00:00], 00:00:00, (00:00)
  let cleaned = text.replace(/\[?\b\d{1,2}:\d{2}(:\d{2})?\b\]?/g, '');
  // Remove speaker names at start of line ending with colon (e.g. John Doe:)
  cleaned = cleaned.replace(/^[a-zA-Z0-9\s\-_()]+:\s*/gm, '');
  // Remove empty lines
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
  // Compress multiple spaces
  cleaned = cleaned.replace(/ +/g, ' ');
  return cleaned.trim();
};

export const aiPromptSanitizer = (text) => {
  if (!text) return '';
  // Strip basic markdown (bold, italic, headers, inline code)
  let cleaned = text.replace(/[*_~`#]/g, '');
  // Strip basic HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  // Replace smart quotes
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  // Remove zero-width spaces and BOM
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Compress multiple line breaks to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
};

export const secureEmailExtractor = (text) => {
  if (!text) return '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Unique emails only, lowercased, sorted
  const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))].sort();
  return uniqueEmails.join('\n');
};

// ─── Social Media Tools ───

// Tool 1: Instagram & TikTok Caption Spacer
export function instagramCaptionSpacer(text) {
  if (!text) return '';
  // Replace empty lines with zero-width space to preserve line breaks on Instagram/TikTok
  return text.replace(/\n\s*\n/g, '\n\u200B\n');
}

// Tool 2: Twitter/X Thread Splitter
export function twitterThreadSplitter(text, maxChars = 280, numberingStyle = 'fraction') {
  if (!text) return '';
  const words = text.split(/\s+/);
  const tweets = [];
  let current = '';

  for (const word of words) {
    // Reserve space for numbering suffix like " [1/10]" = ~7 chars
    const reserveChars = 8;
    const limit = maxChars - reserveChars;
    if ((current + ' ' + word).trim().length > limit) {
      if (current.trim()) tweets.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current.trim()) tweets.push(current.trim());

  const total = tweets.length;
  return tweets.map((tweet, i) => {
    const num = i + 1;
    let suffix = '';
    if (numberingStyle === 'fraction') suffix = ` [${num}/${total}]`;
    else if (numberingStyle === 'thread') suffix = ` 🧵 ${num}/${total}`;
    else if (numberingStyle === 'number') suffix = ` (${num})`;
    return `--- Tweet ${num} of ${total} ---\n${tweet}${suffix}`;
  }).join('\n\n');
}

// Tool 3: YouTube Timestamp & Chapter Generator
export function youtubeTimestampGenerator(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const formatted = [];
  
  for (const line of lines) {
    // Try to match existing timestamps like 1:30, 01:30, 1:30:00, or just numbers like "90"
    const match = line.match(/(\d{1,2}:?\d{0,2}:?\d{0,2})\s*[-–—:.]?\s*(.+)/);
    if (match) {
      let time = match[1].trim();
      let title = match[2].trim();
      // Normalize timestamp to MM:SS or HH:MM:SS
      const parts = time.split(':').map(Number);
      if (parts.length === 1) {
        // Just seconds, convert to MM:SS
        const mins = Math.floor(parts[0] / 60);
        const secs = parts[0] % 60;
        time = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else if (parts.length === 2) {
        time = `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
      } else if (parts.length === 3) {
        time = `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}:${String(parts[2]).padStart(2, '0')}`;
      }
      // Capitalize first letter of title
      title = title.charAt(0).toUpperCase() + title.slice(1);
      formatted.push(`${time} ${title}`);
    } else if (line.trim()) {
      // No timestamp found, just add the text as-is with 00:00 if first
      formatted.push(line.trim());
    }
  }

  // Ensure first line starts at 00:00 for YouTube chapters to work
  if (formatted.length > 0 && !formatted[0].startsWith('00:00')) {
    const hasTimestamp = formatted[0].match(/^\d{2}:\d{2}/);
    if (!hasTimestamp) {
      formatted[0] = '00:00 ' + formatted[0];
    }
  }

  return formatted.join('\n');
}

// Tool 4: Social Media Character Limit Checker (returns JSON stats)
export function socialMediaCharacterCounter(text) {
  if (!text) return JSON.stringify({ platforms: [] });
  const len = text.length;
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const platforms = [
    { name: 'Twitter/X Post', limit: 280, current: len, icon: '🐦', ok: len <= 280 },
    { name: 'Instagram Caption', limit: 2200, current: len, icon: '📸', ok: len <= 2200 },
    { name: 'Instagram Hashtags', limit: 30, current: hashtagCount, icon: '#️⃣', ok: hashtagCount <= 30, unit: 'tags' },
    { name: 'Instagram Bio', limit: 150, current: len, icon: '👤', ok: len <= 150 },
    { name: 'TikTok Caption', limit: 2200, current: len, icon: '🎵', ok: len <= 2200 },
    { name: 'LinkedIn Post', limit: 3000, current: len, icon: '💼', ok: len <= 3000 },
    { name: 'YouTube Title', limit: 100, current: len, icon: '▶️', ok: len <= 100 },
    { name: 'YouTube Description', limit: 5000, current: len, icon: '📝', ok: len <= 5000 },
    { name: 'Facebook Post', limit: 63206, current: len, icon: '📘', ok: len <= 63206 },
    { name: 'Pinterest Pin', limit: 500, current: len, icon: '📌', ok: len <= 500 },
    { name: 'Threads Post', limit: 500, current: len, icon: '🧵', ok: len <= 500 },
  ];

  return JSON.stringify({ platforms, charCount: len, wordCount, hashtagCount });
}

// Tool 5: Fancy Font / Aesthetic Text Generator (Unicode mapping)
export function fancyFontGenerator(text) {
  if (!text) return '';
  const fontMaps = {
    'Bold': { offset: 0x1D400, lower: 0x1D41A },
    'Italic': { offset: 0x1D434, lower: 0x1D44E },
    'Bold Italic': { offset: 0x1D468, lower: 0x1D482 },
    'Script': { offset: 0x1D49C, lower: 0x1D4B6 },
    'Bold Script': { offset: 0x1D4D0, lower: 0x1D4EA },
    'Fraktur': { offset: 0x1D504, lower: 0x1D51E },
    'Double-Struck': { offset: 0x1D538, lower: 0x1D552 },
    'Bold Fraktur': { offset: 0x1D56C, lower: 0x1D586 },
    'Sans-Serif': { offset: 0x1D5A0, lower: 0x1D5BA },
    'Sans Bold': { offset: 0x1D5D4, lower: 0x1D5EE },
    'Sans Italic': { offset: 0x1D608, lower: 0x1D622 },
    'Sans Bold Italic': { offset: 0x1D63C, lower: 0x1D656 },
    'Monospace': { offset: 0x1D670, lower: 0x1D68A },
  };

  // Special styles that use character-by-character mapping
  const specialStyles = {
    'Circled': (c) => {
      if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x24B6 + c.charCodeAt(0) - 65);
      if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x24D0 + c.charCodeAt(0) - 97);
      if (c >= '0' && c <= '9') return c === '0' ? '⓪' : String.fromCodePoint(0x2460 + c.charCodeAt(0) - 49);
      return c;
    },
    'Squared': (c) => {
      if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1F130 + c.charCodeAt(0) - 65);
      return c;
    },
    'Fullwidth': (c) => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xFEE0);
      if (c === ' ') return '\u3000';
      return c;
    },
    'Upside Down': (c) => {
      const flipMap = {'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','B':'q','C':'Ɔ','D':'p','E':'Ǝ','F':'Ⅎ','G':'פ','H':'H','I':'I','J':'ſ','K':'ʞ','L':'˥','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Q','R':'ɹ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0','.':'˙',',':'\'','\'':',','!':'¡','?':'¿','(':')',')':'(','{':'}','}':'{','[':']',']':'[','<':'>','>':'<','_':'‾'};
      return flipMap[c] || c;
    },
    'Tiny Superscript': (c) => {
      const supMap = {'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','A':'ᴬ','B':'ᴮ','D':'ᴰ','E':'ᴱ','G':'ᴳ','H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','R':'ᴿ','T':'ᵀ','U':'ᵁ','V':'ⱽ','W':'ᵂ','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
      return supMap[c] || c;
    },
    'Strikethrough': (c) => c + '\u0336',
    'Underline': (c) => c + '\u0332',
    'Wavy': (c) => c + '\u0330',
  };

  const results = [];

  // Unicode math font styles
  for (const [styleName, map] of Object.entries(fontMaps)) {
    let converted = '';
    for (const c of text) {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) { // A-Z
        converted += String.fromCodePoint(map.offset + (code - 65));
      } else if (code >= 97 && code <= 122) { // a-z
        converted += String.fromCodePoint(map.lower + (code - 97));
      } else if (code >= 48 && code <= 57) { // 0-9 (only some fonts support digits)
        if (styleName === 'Bold') converted += String.fromCodePoint(0x1D7CE + (code - 48));
        else if (styleName === 'Double-Struck') converted += String.fromCodePoint(0x1D7D8 + (code - 48));
        else if (styleName === 'Sans-Serif') converted += String.fromCodePoint(0x1D7E2 + (code - 48));
        else if (styleName === 'Sans Bold') converted += String.fromCodePoint(0x1D7EC + (code - 48));
        else if (styleName === 'Monospace') converted += String.fromCodePoint(0x1D7F6 + (code - 48));
        else converted += c;
      } else {
        converted += c;
      }
    }
    results.push(`【${styleName}】\n${converted}`);
  }

  // Special character map styles
  for (const [styleName, mapFn] of Object.entries(specialStyles)) {
    let converted = '';
    if (styleName === 'Upside Down') {
      // Reverse the text and then flip characters
      for (const c of [...text].reverse()) {
        converted += mapFn(c);
      }
    } else {
      for (const c of text) {
        converted += mapFn(c);
      }
    }
    results.push(`【${styleName}】\n${converted}`);
  }

  return results.join('\n\n');
}

// Tool 6: Hashtag Shuffler & Mixer
export function hashtagShuffler(text, count = 30) {
  if (!text) return '';
  // Extract all hashtags from input
  let hashtags = text.match(/#[\w\u00C0-\u024F]+/g);
  if (!hashtags || hashtags.length === 0) {
    // Try treating each line/word as a hashtag
    hashtags = text.split(/[\n,\s]+/).filter(t => t.trim()).map(t => {
      t = t.trim();
      return t.startsWith('#') ? t : '#' + t;
    });
  }
  if (hashtags.length === 0) return '';

  // Remove duplicates
  const unique = [...new Set(hashtags)];

  // Shuffle using Fisher-Yates
  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick up to `count` hashtags
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return `Selected ${selected.length} of ${unique.length} unique hashtags:\n\n${selected.join(' ')}\n\n---\nCopy-paste ready block:\n${selected.join(' ')}`;
}

// Tool 7: YouTube Title & Description SEO Analyzer
export function youtubeTitleAnalyzer(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const title = lines[0] || '';
  const description = lines.slice(1).join('\n');

  const issues = [];
  const passes = [];

  // Title analysis
  if (title.length === 0) {
    issues.push('❌ No title provided. Enter your title on the first line.');
  } else {
    // Length check
    if (title.length > 100) issues.push(`❌ Title too long (${title.length}/100 chars) — will be truncated in search results.`);
    else if (title.length > 70) issues.push(`⚠️ Title length (${title.length}/100) — may be truncated on mobile. Aim for under 60 chars.`);
    else if (title.length < 20) issues.push(`⚠️ Title is too short (${title.length} chars). Longer titles tend to rank better.`);
    else passes.push(`✅ Title length is good (${title.length} chars).`);

    // Number in title
    if (/\d/.test(title)) passes.push('✅ Contains a number — boosts CTR (e.g., "7 Tips", "Top 10").');
    else issues.push('⚠️ Consider adding a number (e.g., "5 Ways to...", "Top 10...") to boost CTR.');

    // Power words
    const powerWords = ['free', 'best', 'ultimate', 'amazing', 'proven', 'secret', 'hack', 'how to', 'why', 'complete', 'guide', 'tutorial', 'review', 'easy', 'fast', 'new', 'top', 'must', 'never', 'always', 'mistake', 'tips', 'tricks'];
    const titleLower = title.toLowerCase();
    const foundPower = powerWords.filter(w => titleLower.includes(w));
    if (foundPower.length > 0) passes.push(`✅ Contains power word(s): ${foundPower.join(', ')}`);
    else issues.push('⚠️ No power words detected. Add words like "Best", "Ultimate", "How To", "Free" to boost engagement.');

    // Brackets/Parentheses (boosts CTR by 38%)
    if (/[\[\]()【】]/.test(title)) passes.push('✅ Uses brackets/parentheses — studies show this boosts CTR by up to 38%.');
    else issues.push('💡 Consider adding brackets, e.g., "[2024 Guide]" or "(Step by Step)" — boosts CTR by ~38%.');

    // Caps check
    if (title === title.toUpperCase() && title.length > 3) issues.push('⚠️ ALL CAPS title — can appear spammy. Use Title Case instead.');
    
    // Emoji in title
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/u;
    if (emojiRegex.test(title)) passes.push('✅ Contains emoji — can help your title stand out in search results.');
  }

  // Description analysis
  let descReport = '';
  if (description.trim()) {
    const descIssues = [];
    const descPasses = [];

    if (description.length < 200) descIssues.push(`⚠️ Description is short (${description.length} chars). Aim for 200+ characters for better SEO.`);
    else descPasses.push(`✅ Description length is good (${description.length} chars).`);

    // Check for links
    if (/https?:\/\//.test(description)) descPasses.push('✅ Contains links — good for driving traffic.');
    else descIssues.push('⚠️ No links found. Add relevant links in first 2 lines of description.');

    // Check for timestamps
    if (/\d{1,2}:\d{2}/.test(description)) descPasses.push('✅ Contains timestamps — enables YouTube chapters.');

    // Check for hashtags
    const descHashtags = (description.match(/#\w+/g) || []).length;
    if (descHashtags > 0 && descHashtags <= 15) descPasses.push(`✅ Contains ${descHashtags} hashtags (good for discoverability).`);
    else if (descHashtags > 15) descIssues.push(`⚠️ Too many hashtags (${descHashtags}). YouTube recommends 3-5 in description.`);

    descReport = `\n\n📝 DESCRIPTION ANALYSIS:\n${descPasses.join('\n')}\n${descIssues.join('\n')}`;
  } else {
    descReport = '\n\n📝 DESCRIPTION: Not provided. Add your description on lines 2+ for analysis.';
  }

  // Score calculation
  const totalChecks = passes.length + issues.length;
  const score = totalChecks > 0 ? Math.round((passes.length / totalChecks) * 100) : 0;
  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';

  return `🎬 YOUTUBE SEO SCORE: ${score}/100 (Grade: ${grade})\n${'█'.repeat(Math.floor(score / 5))}${'░'.repeat(20 - Math.floor(score / 5))}\n\n📌 TITLE: "${title}"\n\n✅ PASSED:\n${passes.length > 0 ? passes.join('\n') : '(none)'}\n\n❌ IMPROVEMENTS NEEDED:\n${issues.length > 0 ? issues.join('\n') : '(none — perfect!)'}${descReport}`;
}

// Tool 8: Emoji Translator
export function emojiTranslator(text) {
  if (!text) return '';
  const emojiMap = {
    'love': '❤️', 'heart': '❤️', 'like': '👍', 'happy': '😊', 'sad': '😢',
    'fire': '🔥', 'hot': '🔥', 'lit': '🔥', 'cool': '😎', 'great': '🙌',
    'good': '👍', 'bad': '👎', 'money': '💰', 'cash': '💵', 'rich': '🤑',
    'star': '⭐', 'sun': '☀️', 'moon': '🌙', 'rain': '🌧️', 'snow': '❄️',
    'dog': '🐕', 'cat': '🐈', 'food': '🍕', 'coffee': '☕', 'pizza': '🍕',
    'music': '🎵', 'dance': '💃', 'party': '🎉', 'celebrate': '🥳',
    'book': '📚', 'read': '📖', 'write': '✍️', 'pen': '🖊️',
    'phone': '📱', 'computer': '💻', 'email': '📧', 'camera': '📷',
    'car': '🚗', 'plane': '✈️', 'travel': '🧳', 'world': '🌍',
    'home': '🏠', 'house': '🏡', 'work': '💼', 'office': '🏢',
    'time': '⏰', 'clock': '🕐', 'sleep': '😴', 'night': '🌙',
    'morning': '🌅', 'hello': '👋', 'bye': '👋', 'thanks': '🙏',
    'please': '🙏', 'sorry': '😔', 'wow': '😮', 'amazing': '🤩',
    'beautiful': '😍', 'laugh': '😂', 'cry': '😭', 'angry': '😡',
    'think': '🤔', 'idea': '💡', 'brain': '🧠', 'strong': '💪',
    'run': '🏃', 'walk': '🚶', 'swim': '🏊', 'sport': '⚽',
    'win': '🏆', 'game': '🎮', 'play': '🎯', 'rocket': '🚀',
    'fast': '⚡', 'slow': '🐢', 'big': '🐘', 'small': '🐜',
    'new': '🆕', 'free': '🆓', 'hot': '🔥', 'cold': '🥶',
    'yes': '✅', 'no': '❌', 'stop': '🛑', 'go': '🟢',
    'warning': '⚠️', 'danger': '🚨', 'check': '✅', 'cross': '❌',
    'king': '👑', 'queen': '👑', 'diamond': '💎', 'gift': '🎁',
    'birthday': '🎂', 'christmas': '🎄', 'halloween': '🎃',
    'flower': '🌸', 'tree': '🌳', 'plant': '🌱', 'water': '💧',
    'wave': '🌊', 'mountain': '⛰️', 'earth': '🌍', 'sky': '🌤️',
    'rainbow': '🌈', 'sparkle': '✨', 'magic': '🪄', 'eyes': '👀',
    'smile': '😊', 'kiss': '😘', 'hug': '🤗', 'wink': '😉',
    'clap': '👏', 'pray': '🙏', 'point': '👉', 'muscle': '💪',
    'success': '🏆', 'fail': '💀', 'dead': '💀', 'ghost': '👻',
    'bomb': '💣', 'explosion': '💥', 'boom': '💥', 'crash': '💥',
    'art': '🎨', 'paint': '🖌️', 'photo': '📸', 'video': '🎥',
    'film': '🎬', 'mic': '🎤', 'speaker': '🔊', 'headphone': '🎧',
    'guitar': '🎸', 'drum': '🥁', 'piano': '🎹',
    'eat': '🍽️', 'drink': '🥤', 'wine': '🍷', 'beer': '🍺',
    'burger': '🍔', 'fries': '🍟', 'cake': '🎂', 'ice': '🍦',
    'fruit': '🍎', 'apple': '🍎', 'banana': '🍌', 'grape': '🍇',
    'hundred': '💯', 'percent': '💯', 'perfect': '💯', 'growth': '📈',
    'chart': '📊', 'target': '🎯', 'goal': '⚽', 'trophy': '🏆',
    'medal': '🥇', 'crown': '👑', 'gem': '💎', 'ring': '💍',
    'lock': '🔒', 'key': '🔑', 'door': '🚪', 'window': '🪟',
    'light': '💡', 'bulb': '💡', 'candle': '🕯️', 'lamp': '🏮',
    'cloud': '☁️', 'thunder': '⛈️', 'umbrella': '☂️', 'wind': '💨',
    'family': '👨‍👩‍👧‍👦', 'baby': '👶', 'boy': '👦', 'girl': '👧',
    'hero': '🦸', 'robot': '🤖', 'alien': '👽', 'monster': '👹',
    'link': '🔗', 'pin': '📌', 'clip': '📎', 'scissors': '✂️',
    'tool': '🔧', 'wrench': '🔧', 'hammer': '🔨', 'gear': '⚙️',
    'bug': '🐛', 'butterfly': '🦋', 'bee': '🐝', 'bird': '🐦',
    'fish': '🐟', 'whale': '🐳', 'shark': '🦈', 'lion': '🦁',
    'tiger': '🐯', 'bear': '🐻', 'panda': '🐼', 'monkey': '🐵',
    'chicken': '🐔', 'egg': '🥚', 'pig': '🐷', 'cow': '🐮',
  };

  let result = text;
  for (const [word, emoji] of Object.entries(emojiMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => `${match} ${emoji}`);
  }
  return result;
}

// Tool 9: Teleprompter Script Formatter
export function teleprompterFormatter(text) {
  if (!text) return '';
  // Strip markdown formatting
  let clean = text
    .replace(/#{1,6}\s*/g, '')  // Remove headings
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
    .replace(/\*(.*?)\*/g, '$1')  // Italic
    .replace(/`(.*?)`/g, '$1')  // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
    .replace(/^\s*[-*+]\s+/gm, '')  // List markers
    .replace(/^\s*\d+\.\s+/gm, '');  // Numbered lists

  // Split into short phrases for easy reading (every ~6-8 words)
  const words = clean.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = [];
  let wordCount = 0;

  for (const word of words) {
    currentLine.push(word);
    wordCount++;
    // Break at natural pauses or every 6-8 words
    const isBreakWord = /[.!?,;:]$/.test(word);
    if (wordCount >= 6 || (wordCount >= 4 && isBreakWord)) {
      lines.push(currentLine.join(' '));
      currentLine = [];
      wordCount = 0;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  // Build output with large spacing
  return lines.join('\n\n');
}

// Tool 10: UTM Link Builder for Creators
export function utmLinkBuilder(text) {
  if (!text) return '';
  // Parse input: first line = URL, subsequent lines = key:value pairs
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  let url = lines[0];
  // Ensure URL has protocol
  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  // Default UTM params
  const params = {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  };

  // Parse remaining lines as key:value
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(utm_\w+|source|medium|campaign|term|content)\s*[:=]\s*(.+)/i);
    if (match) {
      let key = match[1].toLowerCase().trim();
      if (!key.startsWith('utm_')) key = 'utm_' + key;
      params[key] = match[2].trim().replace(/\s+/g, '-').toLowerCase();
    }
  }

  // Auto-detect common presets from input
  const fullText = text.toLowerCase();
  if (!params.utm_source && !params.utm_medium) {
    if (fullText.includes('instagram') || fullText.includes('ig')) {
      params.utm_source = 'instagram';
      params.utm_medium = 'social';
    } else if (fullText.includes('youtube') || fullText.includes('yt')) {
      params.utm_source = 'youtube';
      params.utm_medium = 'video';
    } else if (fullText.includes('twitter') || fullText.includes('x.com')) {
      params.utm_source = 'twitter';
      params.utm_medium = 'social';
    } else if (fullText.includes('tiktok')) {
      params.utm_source = 'tiktok';
      params.utm_medium = 'social';
    } else if (fullText.includes('linkedin')) {
      params.utm_source = 'linkedin';
      params.utm_medium = 'social';
    } else if (fullText.includes('facebook') || fullText.includes('fb')) {
      params.utm_source = 'facebook';
      params.utm_medium = 'social';
    }
  }

  // Build query string
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = queryParts.length > 0 ? `${url}${separator}${queryParts.join('&')}` : url;

  // Generate preset URLs for convenience
  const presets = [];
  const baseClean = url.split('?')[0];
  const presetConfigs = [
    { label: '📸 Instagram Bio', source: 'instagram', medium: 'social', campaign: 'bio-link' },
    { label: '▶️ YouTube Description', source: 'youtube', medium: 'video', campaign: 'description' },
    { label: '🐦 Twitter/X Profile', source: 'twitter', medium: 'social', campaign: 'profile' },
    { label: '🎵 TikTok Bio', source: 'tiktok', medium: 'social', campaign: 'bio-link' },
    { label: '💼 LinkedIn Post', source: 'linkedin', medium: 'social', campaign: 'post' },
    { label: '📧 Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'weekly' },
  ];

  for (const preset of presetConfigs) {
    presets.push(`${preset.label}:\n${baseClean}?utm_source=${preset.source}&utm_medium=${preset.medium}&utm_campaign=${preset.campaign}`);
  }

  return `🔗 YOUR UTM LINK:\n${finalUrl}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 UTM PARAMETERS:\n• Source: ${params.utm_source || '(not set)'}\n• Medium: ${params.utm_medium || '(not set)'}\n• Campaign: ${params.utm_campaign || '(not set)'}\n• Term: ${params.utm_term || '(not set)'}\n• Content: ${params.utm_content || '(not set)'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🚀 QUICK PRESET LINKS:\n\n${presets.join('\n\n')}`;
}

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

export const countSentences = (text) => {
  if (!text) return 0;
  const matches = text.match(/[.!?]+(?=\s|$)/g);
  return matches ? matches.length : 0;
};

export const countSyllables = (text) => {
  if (!text) return 0;
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let totalSyllables = 0;
  words.forEach(word => {
    let syllables = 0;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    if (matches) syllables = matches.length;
    if (word.match(/(?:[^laeiouy]le)$/)) syllables += 1;
    if (syllables === 0) syllables = 1;
    totalSyllables += syllables;
  });
  return totalSyllables;
};

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

export function htmlToMarkdown(text) {
  try {
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    return turndownService.turndown(text);
  } catch (e) { return `Error: ${e.message}`; }
}

export function markdownToHtml(text) {
  try {
    return marked.parse(text);
  } catch (e) { return `Error: ${e.message}`; }
}

export const csvToJson = (text, options = { autoType: true, outputType: 'array' }) => {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return options.outputType === 'array' ? '[]' : '{}';
    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    
    const parseValue = (val) => {
      val = val.trim();
      if (!options.autoType) return val;
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      if (val === 'null') return null;
      if (val !== '' && !isNaN(val)) return Number(val);
      return val;
    };

    if (options.outputType === 'object') {
      const result = {};
      lines.slice(1).forEach((line, i) => {
        if (!line.trim()) return;
        const values = parseCsvLine(line);
        const obj = {};
        headers.forEach((h, j) => { obj[h] = parseValue(values[j] || ''); });
        const key = values[0] ? String(values[0]).trim() : `row${i+1}`;
        result[key] = obj;
      });
      return JSON.stringify(result, null, 2);
    } else {
      const result = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = parseCsvLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = parseValue(values[i] || ''); });
        return obj;
      });
      return JSON.stringify(result, null, 2);
    }
  } catch (e) { return `Error: ${e.message}`; }
};

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

export const tsvToCsv = (text, options = { delimiter: ',', forceQuote: false }) => {
  try {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      return line.split('\t').map(cell => {
        let val = cell.trim();
        if (options.forceQuote || val.includes(options.delimiter) || val.includes('\n') || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(options.delimiter);
    }).join('\n');
  } catch (e) { return `Error: ${e.message}`; }
};

export const csvToHtmlTable = (text, options = { hasHeader: true, addStyles: true }) => {
  try {
    const lines = text.trim().split('\n');
    if (lines.length === 0 || !lines[0]) return '';
    let html = options.addStyles ? `<table style="width:100%; border-collapse:collapse; font-family:sans-serif;">\n` : `<table>\n`;
    
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      const cells = parseCsvLine(line);
      const isHeader = options.hasHeader && i === 0;
      const tag = isHeader ? 'th' : 'td';
      const style = options.addStyles ? (isHeader ? ` style="border:1px solid #ddd; padding:8px; background-color:#f4f4f4; text-align:left;"` : ` style="border:1px solid #ddd; padding:8px;"`) : '';
      
      html += `  <tr>\n`;
      cells.forEach(cell => {
        html += `    <${tag}${style}>${cell}</${tag}>\n`;
      });
      html += `  </tr>\n`;
    });
    html += `</table>`;
    return html;
  } catch (e) { return `Error: ${e.message}`; }
};

export const jsonToXml = (text, options = { rootNode: 'root' }) => {
  try {
    const obj = JSON.parse(text);
    const wrap = { [options.rootNode || 'root']: obj };
    return json2xml(JSON.stringify(wrap), { compact: true, spaces: 2 });
  } catch (e) { return `Error: ${e.message}`; }
};

export const xmlToJson = (text, options = { parseAttributes: true }) => {
  try {
    return xml2json(text, { compact: true, spaces: 2, ignoreAttributes: !options.parseAttributes });
  } catch (e) { return `Error: ${e.message}`; }
};

export const yamlToJson = (text) => {
  try {
    const docs = yaml.loadAll(text);
    if (docs.length === 1) return JSON.stringify(docs[0], null, 2);
    return JSON.stringify(docs, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
};

export const jsonToYaml = (text, options = { indent: 2 }) => {
  try {
    const obj = JSON.parse(text);
    return yaml.dump(obj, { indent: Number(options.indent) || 2 });
  } catch (e) { return `Error: ${e.message}`; }
}

export const jsonToHtmlTable = (text, options = { addStyles: true }) => {
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr) || arr.length === 0) return 'Error: Input must be a non-empty JSON array of objects';
    const headers = Object.keys(arr[0]);
    
    let html = options.addStyles ? `<table style="width:100%; border-collapse:collapse; font-family:sans-serif;">\n` : `<table>\n`;
    const thStyle = options.addStyles ? ` style="border:1px solid #ddd; padding:8px; background-color:#f4f4f4; text-align:left;"` : '';
    const tdStyle = options.addStyles ? ` style="border:1px solid #ddd; padding:8px;"` : '';
    
    html += `  <tr>\n`;
    headers.forEach(h => { html += `    <th${thStyle}>${h}</th>\n`; });
    html += `  </tr>\n`;
    
    arr.forEach(row => {
      html += `  <tr>\n`;
      headers.forEach(h => {
        let val = row[h];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        html += `    <td${tdStyle}>${val ?? ''}</td>\n`;
      });
      html += `  </tr>\n`;
    });
    
    html += `</table>`;
    return html;
  } catch (e) { return `Error: ${e.message}`; }
};

export const yamlToXml = (text, options = { rootNode: 'root' }) => {
  try {
    const obj = yaml.load(text);
    const wrap = { [options.rootNode || 'root']: obj };
    return json2xml(JSON.stringify(wrap), { compact: true, spaces: 2 });
  } catch (e) { return `Error: ${e.message}`; }
};

export const tomlToJson = (text) => {
  try {
    const obj = toml.parse(text);
    return JSON.stringify(obj, null, 2);
  } catch (e) { return `Error: ${e.message}`; }
};

export const jsonToToml = (text) => {
  try {
    const obj = JSON.parse(text);
    return toml.stringify(obj);
  } catch (e) { return `Error: ${e.message}`; }
};



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

// ═══════════════════════════════════════════════════════
// Phase 2: High-Traffic Tools (Client-Side)
// ═══════════════════════════════════════════════════════

export function mockingCase(text) {
  if (!text) return '';
  let result = '';
  let capitalize = true;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[a-zA-Z]/.test(char)) {
      result += capitalize ? char.toLowerCase() : char.toUpperCase();
      capitalize = !capitalize; // Flip for next letter
    } else {
      result += char; // Keep punctuation/spaces as is
    }
  }
  return result;
}

export function zalgoText(text) {
  if (!text) return '';
  const zalgoUp = ['\u030D', '\u030E', '\u0304', '\u0305', '\u033F', '\u0311', '\u0306', '\u0310', '\u0352', '\u0351', '\u0308', '\u034B', '\u0328', '\u0334', '\u0338'];
  const zalgoDown = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031C', '\u031D', '\u031E', '\u031F', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032A', '\u032B', '\u032C'];
  const zalgoMid = ['\u0315', '\u031B', '\u0340', '\u0341', '\u0358', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033A', '\u033B', '\u033C'];

  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += text[i];
    // Add 1-3 up marks
    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) result += zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
    // Add 1-2 mid marks
    for (let j = 0; j < Math.floor(Math.random() * 2) + 1; j++) result += zalgoMid[Math.floor(Math.random() * zalgoMid.length)];
    // Add 1-3 down marks
    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) result += zalgoDown[Math.floor(Math.random() * zalgoDown.length)];
  }
  return result;
}

export function binaryText(text, direction = 'encode') {
  if (!text) return '';
  if (direction === 'encode') {
    return text.split('').map(char => {
      const bin = char.charCodeAt(0).toString(2);
      return '00000000'.slice(bin.length) + bin;
    }).join(' ');
  } else {
    // decode
    return text.split(' ').map(bin => {
      if (bin.length > 0) return String.fromCharCode(parseInt(bin, 2));
      return '';
    }).join('');
  }
}

export function morseCode(text, direction = 'encode') {
  if (!text) return '';
  const map = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
  };
  const reverseMap = Object.entries(map).reduce((acc, [k, v]) => { acc[v] = k; return acc; }, {});

  if (direction === 'encode') {
    return text.toUpperCase().split('').map(char => map[char] || char).join(' ');
  } else {
    // decode (expecting spaces between letters, / between words)
    return text.split(' ').map(code => reverseMap[code] || code).join('').replace(/\//g, ' ');
  }
}

export function jsonToTypescript(text) {
  if (!text) return '';
  try {
    const obj = JSON.parse(text);
    let output = '';

    const generateInterface = (name, object) => {
      let intStr = `export interface ${name} {\n`;
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          const val = object[key];
          let type = typeof val;
          if (val === null) type = 'null';
          else if (Array.isArray(val)) {
            if (val.length > 0) {
              const elType = typeof val[0];
              if (elType === 'object' && val[0] !== null) {
                const subName = name + key.charAt(0).toUpperCase() + key.slice(1) + 'Item';
                generateInterface(subName, val[0]);
                type = subName + '[]';
              } else {
                type = elType + '[]';
              }
            } else {
              type = 'any[]';
            }
          } else if (type === 'object') {
            const subName = name + key.charAt(0).toUpperCase() + key.slice(1);
            generateInterface(subName, val);
            type = subName;
          }
          intStr += `  ${key}: ${type};\n`;
        }
      }
      intStr += `}\n\n`;
      output = intStr + output; // prepend dependencies
    };

    if (Array.isArray(obj)) {
      generateInterface('RootObjectItem', obj.length > 0 ? obj[0] : {});
      output += `export type RootObject = RootObjectItem[];\n`;
    } else {
      generateInterface('RootObject', obj);
    }
    return output;
  } catch (e) {
    return 'Error parsing JSON: ' + e.message;
  }
}

export function sqlFormatter(text) {
  if (!text) return '';
  // Basic beautifier
  const keywords = ['SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'AND', 'OR', 'AS', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'];
  let formatted = text.replace(/\s+/g, ' '); // collapse whitespace
  
  // Add newlines before major keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    if (['AND', 'OR', 'ON'].includes(kw)) {
      formatted = formatted.replace(regex, `\n  ${kw.toUpperCase()}`);
    } else {
      formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
    }
  });

  // Handle commas in SELECT
  formatted = formatted.replace(/,\s*/g, ',\n  ');
  
  return formatted.trim();
}

export function htmlTableToCsv(text) {
  if (!text) return '';
  // Strip everything outside <table> tags if present
  let tableMatch = text.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  let html = tableMatch ? tableMatch.join('') : text;
  
  // Find all rows
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rows.length === 0) return 'No HTML table rows (<tr>) found.';

  let csv = '';
  for (const row of rows) {
    // Find all cells (th or td)
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)];
    const rowCsv = cells.map(cell => {
      let content = cell[1]
        .replace(/<[^>]+>/g, '') // strip inner HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/\r?\n|\r/g, ' ') // replace newlines with spaces
        .trim();
      
      // Escape CSV quotes and wrap in quotes if contains comma
      if (content.includes(',') || content.includes('"')) {
        content = `"${content.replace(/"/g, '""')}"`;
      }
      return content;
    }).join(',');
    csv += rowCsv + '\n';
  }
  return csv.trim();
}

export function textSummarizer(text, percentage = 30) {
  if (!text) return '';
  
  // Very basic TF-IDF extractive summarization
  // Split into sentences (basic regex for English)
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length < 3) return 'Text is too short to summarize.';

  // Tokenize words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Calculate term frequency
  const termFreq = {};
  words.forEach(w => {
    termFreq[w] = (termFreq[w] || 0) + 1;
  });

  // Score sentences
  const scoredSentences = sentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    let score = 0;
    sWords.forEach(w => {
      score += termFreq[w] || 0;
    });
    // Normalize by length
    score = score / (sWords.length || 1);
    
    // Boost first and last sentence slightly
    if (index === 0 || index === sentences.length - 1) score *= 1.2;
    
    return { sentence: sentence.trim(), score, index };
  });

  // Pick top N sentences based on percentage
  const count = Math.max(1, Math.ceil(sentences.length * (percentage / 100)));
  
  // Sort by score descending, pick top count
  scoredSentences.sort((a, b) => b.score - a.score);
  const selected = scoredSentences.slice(0, count);
  
  // Sort back to original order
  selected.sort((a, b) => a.index - b.index);
  
  return selected.map(s => s.sentence).join(' ');
}

export function passwordStrengthAnalyzer(password) {
  if (!password) return JSON.stringify({ score: 0, feedback: ['Enter a password to analyze.'] });

  let score = 0;
  const feedback = [];
  let entropy = 0;
  let poolSize = 0;

  const length = password.length;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (length > 0 && poolSize > 0) {
    entropy = length * Math.log2(poolSize);
  }

  // Calculate generic score out of 100
  if (entropy > 100) score = 100;
  else if (entropy > 80) score = 80 + ((entropy - 80) * 0.5);
  else if (entropy > 60) score = 60 + ((entropy - 60) * 0.75);
  else if (entropy > 40) score = 40 + (entropy - 40);
  else score = entropy;

  score = Math.round(Math.min(100, Math.max(0, score)));

  // Give feedback
  if (length < 8) feedback.push('Password is too short (minimum 8 characters recommended).');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters to increase strength.');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters.');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers.');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters (e.g., !@#$%^&*).');

  let strengthLabel = 'Weak';
  let color = '#ef4444';
  if (score >= 80) { strengthLabel = 'Very Strong'; color = '#22c55e'; }
  else if (score >= 60) { strengthLabel = 'Strong'; color = '#84cc16'; }
  else if (score >= 40) { strengthLabel = 'Moderate'; color = '#f59e0b'; }

  // Crack time estimates (rough offline estimation)
  const combinations = Math.pow(poolSize, length);
  const guessesPerSecond = 10000000000; // 10 Billion per second
  const secondsToCrack = combinations / guessesPerSecond;

  let timeToCrack = '';
  if (secondsToCrack < 1) timeToCrack = 'Instantly';
  else if (secondsToCrack < 60) timeToCrack = `${Math.round(secondsToCrack)} seconds`;
  else if (secondsToCrack < 3600) timeToCrack = `${Math.round(secondsToCrack / 60)} minutes`;
  else if (secondsToCrack < 86400) timeToCrack = `${Math.round(secondsToCrack / 3600)} hours`;
  else if (secondsToCrack < 31536000) timeToCrack = `${Math.round(secondsToCrack / 86400)} days`;
  else if (secondsToCrack < 3153600000) timeToCrack = `${Math.round(secondsToCrack / 31536000)} years`;
  else timeToCrack = 'Centuries (Very Secure)';

  return JSON.stringify({
    score,
    label: strengthLabel,
    color,
    feedback: feedback.length > 0 ? feedback : ['Your password is well balanced.'],
    entropy: Math.round(entropy),
    timeToCrack
  });
}

// ─── AESTHETIC TEXT GENERATORS ───

export const toCursive = (text) => {
  if (!text) return '';
  const map = {
    'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ', 'F': 'ℱ', 'G': '𝒢', 'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥', 'K': '𝒦', 'L': 'ℒ', 'M': 'ℳ', 'N': '𝒩', 'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰', 'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵',
    'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': 'ℯ', 'f': '𝒻', 'g': 'ℊ', 'h': '𝒽', 'i': '𝒾', 'j': '𝒿', 'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃', 'o': 'ℴ', 'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉', 'u': '𝓊', 'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏'
  };
  return text.split('').map(c => map[c] || c).join('');
};

export const toStrikethrough = (text) => {
  if (!text) return '';
  return text.split('').map(c => c + '\u0336').join('');
};

export const toUnderline = (text) => {
  if (!text) return '';
  return text.split('').map(c => c + '\u0332').join('');
};

export const toBubble = (text) => {
  if (!text) return '';
  const map = {
    'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ', 'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ', 'J': 'Ⓙ', 'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ', 'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ', 'S': 'Ⓢ', 'T': 'Ⓣ', 'U': 'Ⓤ', 'V': 'Ⓥ', 'W': 'Ⓦ', 'X': 'Ⓧ', 'Y': 'Ⓨ', 'Z': 'Ⓩ',
    'a': 'ⓐ', 'b': 'ⓑ', 'c': 'ⓒ', 'd': 'ⓓ', 'e': 'ⓔ', 'f': 'ⓕ', 'g': 'ⓖ', 'h': 'ⓗ', 'i': 'ⓘ', 'j': 'ⓙ', 'k': 'ⓚ', 'l': 'ⓛ', 'm': 'ⓜ', 'n': 'ⓝ', 'o': 'ⓞ', 'p': 'ⓟ', 'q': 'ⓠ', 'r': 'ⓡ', 's': 'ⓢ', 't': 'ⓣ', 'u': 'ⓤ', 'v': 'ⓥ', 'w': 'ⓦ', 'x': 'ⓧ', 'y': 'ⓨ', 'z': 'ⓩ',
    '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
  };
  return text.split('').map(c => map[c] || c).join('');
};

export const toSquare = (text) => {
  if (!text) return '';
  const map = {
    'A': '🄰', 'B': '🄱', 'C': '🄲', 'D': '🄳', 'E': '🄴', 'F': '🄵', 'G': '🄶', 'H': '🄷', 'I': '🄸', 'J': '🄹', 'K': '🄺', 'L': '🄻', 'M': '🄼', 'N': '🄽', 'O': '🄾', 'P': '🄿', 'Q': '🅀', 'R': '🅁', 'S': '🅂', 'T': '🅃', 'U': '🅄', 'V': '🅅', 'W': '🅆', 'X': '🅇', 'Y': '🅈', 'Z': '🅉',
    'a': '🄰', 'b': '🄱', 'c': '🄲', 'd': '🄳', 'e': '🄴', 'f': '🄵', 'g': '🄶', 'h': '🄷', 'i': '🄸', 'j': '🄹', 'k': '🄺', 'l': '🄻', 'm': '🄼', 'n': '🄽', 'o': '🄾', 'p': '🄿', 'q': '🅀', 'r': '🅁', 's': '🅂', 't': '🅃', 'u': '🅄', 'v': '🅅', 'w': '🅆', 'x': '🅇', 'y': '🅈', 'z': '🅉'
  };
  return text.split('').map(c => map[c] || c).join('');
};

export const toMirror = (text) => {
  if (!text) return '';
  const map = {
    'a': 'ɒ', 'b': 'd', 'c': 'ɔ', 'd': 'b', 'e': 'ɘ', 'f': 'Ꮈ', 'g': 'ǫ', 'h': 'ʜ', 'i': 'i', 'j': 'į', 'k': 'ʞ', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'q', 'q': 'p', 'r': 'ɿ', 's': 'ƨ', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
    'A': 'A', 'B': 'ᙠ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'ꟻ', 'G': 'Ә', 'H': 'H', 'I': 'I', 'J': 'Ⴑ', 'K': '⋊', 'L': '⅃', 'M': 'M', 'N': 'И', 'O': 'O', 'P': 'ꟼ', 'Q': 'Ọ', 'R': 'Я', 'S': 'Ƨ', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
    '1': '⇂', '2': '𝟚', '3': 'Ɛ', '4': 'ᔭ', '5': '𝟝', '6': '∂', '7': '⏋', '8': '8', '9': '९', '0': '0', '?': '⸮', '!': '¡', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<'
  };
  return text.split('').map(c => map[c] || c).reverse().join('');
};

export const toInvisible = (text) => {
  if (!text) return '';
  // Replaces all visible characters with the Braille Pattern Blank (U+2800) which is an invisible space that copies well
  return text.split('').map(c => (c === ' ' || c === '\n') ? c : '⠀').join('');
};

export const toDemonic = (text) => {
  if (!text) return '';
  const up = ['\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352', '\u0351', '\u0306', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b', '\u0346', '\u031a'];
  const down = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'];
  const mid = ['\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360', '\u0362', '\u0338', '\u0337', '\u0361', '\u0489'];
  
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      result += '\n';
      continue;
    }
    result += text[i];
    // Add 1-3 up characters
    const numUp = Math.floor(Math.random() * 3) + 1;
    for(let j=0; j<numUp; j++) result += rand(up);
    // Add 1-2 mid characters
    const numMid = Math.floor(Math.random() * 2) + 1;
    for(let j=0; j<numMid; j++) result += rand(mid);
    // Add 1-3 down characters
    const numDown = Math.floor(Math.random() * 3) + 1;
    for(let j=0; j<numDown; j++) result += rand(down);
  }
  return result;
};

export const toSmall = (text) => {
  if (!text) return '';
  const map = {
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'q': 'ᵠ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
    'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'Q': 'ᵠ', 'R': 'ᴿ', 'S': 'ˢ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'X': 'ˣ', 'Y': 'ʸ', 'Z': 'ᶻ',
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
  };
  return text.split('').map(c => map[c] || c).join('');
};

export const brailleTranslator = (text) => {
  if (!text) return '';
  const map = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓',
    'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏',
    'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
    'y': '⠽', 'z': '⠵', '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
    '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚', ' ': ' ',
    ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '?': '⠦'
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('');
};

export const signLanguageTranslator = (text) => {
  if (!text) return '';
  const map = {
    'a': '✊', 'b': '✋', 'c': '🗜️', 'd': '☝️', 'e': '🤏', 'f': '🆗', 'g': '🫵', 'h': '👈',
    'i': '👆', 'j': '🤙', 'k': '✌️', 'l': '👆', 'm': '✊', 'n': '✊', 'o': '👌', 'p': '👇',
    'q': '👇', 'r': '🤞', 's': '✊', 't': '✊', 'u': '✌️', 'v': '✌️', 'w': '🖐️', 'x': '🪝',
    'y': '🤙', 'z': '🫵', ' ': '   '
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('');
};

export const natoPhoneticTranslator = (text) => {
  if (!text) return '';
  const map = {
    'a': 'Alpha', 'b': 'Bravo', 'c': 'Charlie', 'd': 'Delta', 'e': 'Echo', 'f': 'Foxtrot',
    'g': 'Golf', 'h': 'Hotel', 'i': 'India', 'j': 'Juliet', 'k': 'Kilo', 'l': 'Lima',
    'm': 'Mike', 'n': 'November', 'o': 'Oscar', 'p': 'Papa', 'q': 'Quebec', 'r': 'Romeo',
    's': 'Sierra', 't': 'Tango', 'u': 'Uniform', 'v': 'Victor', 'w': 'Whiskey', 'x': 'X-ray',
    'y': 'Yankee', 'z': 'Zulu', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '0': 'Zero', ' ': ' '
  };
  return text.toLowerCase().split('').map(c => map[c] ? map[c] + ' ' : c).join('').replace(/\s+/g, ' ').trim();
};

export const wingdingsTranslator = (text) => {
  if (!text) return '';
  const map = {
    'a': '✌', 'b': '👌', 'c': '👍', 'd': '👎', 'e': '☜', 'f': '☞', 'g': '☝', 'h': '☟',
    'i': '☺', 'j': '😐', 'k': '☹', 'l': '💣', 'm': '☠', 'n': '⚐', 'o': '⚑', 'p': '✈',
    'q': '☼', 'r': '💧', 's': '❄', 't': '🕆', 'u': '🕇', 'v': '🕈', 'w': '✠', 'x': '✡',
    'y': '☪', 'z': '☯', '0': '📁', '1': '📂', '2': '📄', '3': '🗏', '4': '🗐', '5': '🗄', 
    '6': '⌛', '7': '🖮', '8': '🖰', '9': '🖲', ' ': ' '
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('');
};

export const mathEquationLatex = (text) => {
  if (!text) return '';
  let latex = text;
  
  const greek = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
  greek.forEach(letter => {
    latex = latex.replace(new RegExp(`\\b${letter}\\b`, 'gi'), `\\${letter.toLowerCase()}`);
  });
  
  latex = latex.replace(/(\w+|\d+)\s*\/\s*(\w+|\d+)/g, '\\frac{$1}{$2}');
  latex = latex.replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  latex = latex.replace(/integral\s+from\s+(\w+)\s+to\s+(\w+)/gi, '\\int_{$1}^{$2}');
  latex = latex.replace(/integral/gi, '\\int');
  latex = latex.replace(/sum\s+from\s+(\w+)\s+to\s+(\w+)/gi, '\\sum_{$1}^{$2}');
  latex = latex.replace(/sum/gi, '\\sum');
  latex = latex.replace(/infinity/gi, '\\infty');
  latex = latex.replace(/inf/gi, '\\infty');
  latex = latex.replace(/<=/g, '\\leq');
  latex = latex.replace(/>=/g, '\\geq');
  latex = latex.replace(/!=/g, '\\neq');
  latex = latex.replace(/\*/g, '\\cdot');
  latex = latex.replace(/\+-/g, '\\pm');
  
  return latex;
};

export const rpgStatBlockFormatter = (text) => {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let name = 'Creature Name', size = 'Medium', type = 'humanoid', alignment = 'unaligned';
  let ac = '10', hp = '10 (3d8 - 3)', speed = '30 ft.';
  let str = '10 (+0)', dex = '10 (+0)', con = '10 (+0)', intel = '10 (+0)', wis = '10 (+0)', cha = '10 (+0)';
  let otherLines = [];
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (lower.startsWith('name:')) name = line.substring(5).trim();
    else if (lower.startsWith('size:')) size = line.substring(5).trim();
    else if (lower.startsWith('type:')) type = line.substring(5).trim();
    else if (lower.startsWith('alignment:')) alignment = line.substring(10).trim();
    else if (lower.startsWith('armor class:')) ac = line.substring(12).trim();
    else if (lower.startsWith('ac:')) ac = line.substring(3).trim();
    else if (lower.startsWith('hit points:')) hp = line.substring(11).trim();
    else if (lower.startsWith('hp:')) hp = line.substring(3).trim();
    else if (lower.startsWith('speed:')) speed = line.substring(6).trim();
    else if (lower.startsWith('str:')) str = line.substring(4).trim();
    else if (lower.startsWith('dex:')) dex = line.substring(4).trim();
    else if (lower.startsWith('con:')) con = line.substring(4).trim();
    else if (lower.startsWith('int:')) intel = line.substring(4).trim();
    else if (lower.startsWith('wis:')) wis = line.substring(4).trim();
    else if (lower.startsWith('cha:')) cha = line.substring(4).trim();
    else otherLines.push(line);
  });
  
  let md = `> ## ${name}\n> *${size} ${type}, ${alignment}*\n> ___\n> **Armor Class** ${ac}\n> **Hit Points** ${hp}\n> **Speed** ${speed}\n> ___\n> | STR | DEX | CON | INT | WIS | CHA |\n> |:---:|:---:|:---:|:---:|:---:|:---:|\n> | ${str} | ${dex} | ${con} | ${intel} | ${wis} | ${cha} |\n> ___\n`;
  if (otherLines.length > 0) {
    md += `> \n> **Actions / Traits**\n> \n`;
    otherLines.forEach(line => {
      const parts = line.split(':');
      if (parts.length > 1) {
        md += `> ***${parts[0]}*** ${parts.slice(1).join(':')}\n`;
      } else {
        md += `> ${line}\n`;
      }
    });
  }
  return md;
};

export const jsonToCsv = (text, options = { delimiter: ',', flatten: false }) => {
  if (!text) return '';
  try {
    let data = JSON.parse(text);
    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) data = [data];
      else return 'Error: JSON must be an array of objects or an object.';
    }
    if (data.length === 0) return '';

    const flattenObject = (obj, prefix = '') => {
      let result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value, `${prefix}${key}.`));
        } else {
          result[`${prefix}${key}`] = value;
        }
      }
      return result;
    };

    if (options.flatten) {
      data = data.map(item => typeof item === 'object' && item !== null ? flattenObject(item) : item);
    }

    const headersSet = new Set();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(k => headersSet.add(k));
      } else {
        headersSet.add('value');
      }
    });
    const headers = Array.from(headersSet);

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(options.delimiter) || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [headers.map(escapeCsv).join(options.delimiter)];
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        rows.push(headers.map(header => escapeCsv(item[header])).join(options.delimiter));
      } else {
        rows.push(escapeCsv(item));
      }
    });

    return rows.join('\n');
  } catch (e) {
    return `Error: Invalid JSON.\n${e.message}`;
  }
};
