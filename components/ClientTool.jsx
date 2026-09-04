'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as processors from '@/lib/text-processors';

// ─── Toast Notification ───
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

// ─── Sample text for trying tools ───
const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate the tool's functionality.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Contact us at support@example.com or info@test.org.
Visit https://example.com or call (555) 123-4567.

"Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill`;

export default function ClientTool({ categoryId, toolSlug, t = {} }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState('encode');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [regexFlags, setRegexFlags] = useState('g');
  const [input2, setInput2] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [cryptoPassword, setCryptoPassword] = useState('');
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jsonCsvOptions, setJsonCsvOptions] = useState({ delimiter: ',', flatten: false });
  const [csvJsonOptions, setCsvJsonOptions] = useState({ autoType: true, outputType: 'array' });
  const [jsonXmlOptions, setJsonXmlOptions] = useState({ rootNode: 'root' });
  const [xmlJsonOptions, setXmlJsonOptions] = useState({ parseAttributes: true });
  const [jsonYamlOptions, setJsonYamlOptions] = useState({ indent: 2 });
  const [tsvCsvOptions, setTsvCsvOptions] = useState({ delimiter: ',', forceQuote: false });
  const [csvHtmlOptions, setCsvHtmlOptions] = useState({ hasHeader: true, addStyles: true });
  const [jsonHtmlOptions, setJsonHtmlOptions] = useState({ addStyles: true });
  const [yamlXmlOptions, setYamlXmlOptions] = useState({ rootNode: 'root' });
  const inputRef = useRef(null);

  // ─── Text to Speech State ───
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [ttsProgress, setTtsProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ─── LocalStorage Persistence for Input ───
  // Load input on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_tool_input');
      if (savedInput) {
        setInput(savedInput);
      }
    }
  }, []);

  // Save input on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_tool_input', input);
    }
  }, [input]);

  const handlePlayAudio = () => {
    if (!input || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(input);
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCharIndex(event.charIndex);
        setTtsProgress(Math.min(100, (event.charIndex / input.length) * 100));
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(0);
      setTtsProgress(0);
    };
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(0);
      setTtsProgress(0);
    }
  };

  const handleDownloadAudio = async () => {
    if (!input) {
      setToast({ message: 'Please enter some text first.', type: 'warning' });
      return;
    }
    setIsDownloading(true);
    setToast({ message: 'Generating high-quality MP3 (this may take a moment)...', type: 'success' });
    try {
      const selectedVoice = voices[selectedVoiceIndex];
      const lang = selectedVoice ? selectedVoice.lang.split('-')[0] : 'en';

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, lang: lang })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      if (data.audioChunks && data.audioChunks.length > 0) {
        const byteArrays = [];
        for (const chunk of data.audioChunks) {
          const binaryString = window.atob(chunk.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          byteArrays.push(bytes);
        }

        const blob = new Blob(byteArrays, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ilovetexts-audio-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setToast({ message: 'Audio downloaded successfully!', type: 'success' });
      } else {
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('Download error:', error);
      setToast({ message: 'Error generating audio. Please try again.', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Processing Effect ───
  useEffect(() => {
    const noInputRequired = ['uuid-generator', 'password-generator', 'lorem-ipsum', 'random-number', 'random-string', 'fake-name-generator', 'fake-address-generator', 'mac-address-generator'];
    if (!input && categoryId !== 'text-extractor' && !noInputRequired.includes(toolSlug)) {
      setOutput('');
      setStats(null);
      return;
    }

    try {
      if (categoryId === 'text-case-converter') {
        switch (toolSlug) {
          case 'uppercase': setOutput(processors.toUpperCase(input)); break;
          case 'lowercase': setOutput(processors.toLowerCase(input)); break;
          case 'title-case': setOutput(processors.toTitleCase(input)); break;
          case 'sentence-case': setOutput(processors.toSentenceCase(input)); break;
          case 'camel-case': setOutput(processors.toCamelCase(input)); break;
          case 'snake-case': setOutput(processors.toSnakeCase(input)); break;
          case 'kebab-case': setOutput(processors.toKebabCase(input)); break;
          case 'alternating-case': setOutput(processors.toAlternatingCase(input)); break;
          case 'toggle-case': setOutput(processors.toToggleCase(input)); break;
          case 'constant-case': setOutput(processors.toConstantCase(input)); break;
          case 'mocking-case': setOutput(processors.mockingCase(input)); break;
          case 'cursive-text-generator': setOutput(processors.toCursive(input)); break;
          case 'strikethrough-text': setOutput(processors.toStrikethrough(input)); break;
          case 'underline-text-generator': setOutput(processors.toUnderline(input)); break;
          case 'bubble-text-generator': setOutput(processors.toBubble(input)); break;
          case 'square-text-generator': setOutput(processors.toSquare(input)); break;
          case 'mirror-text-generator': setOutput(processors.toMirror(input)); break;
          case 'invisible-text-generator': setOutput(processors.toInvisible(input)); break;
          case 'demonic-cursed-text': setOutput(processors.toDemonic(input)); break;
          case 'small-text-generator': setOutput(processors.toSmall(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'text-cleaner') {
        switch (toolSlug) {
          case 'remove-line-breaks': setOutput(processors.removeLineBreaks(input)); break;
          case 'remove-extra-spaces': setOutput(processors.removeExtraSpaces(input)); break;
          case 'remove-duplicate-lines': setOutput(processors.removeDuplicateLines(input)); break;
          case 'remove-empty-lines': setOutput(processors.removeEmptyLines(input)); break;
          case 'remove-whitespace': setOutput(processors.removeAllWhitespace(input)); break;
          case 'add-line-numbers': setOutput(processors.addLineNumbers(input)); break;
          case 'sort-lines': setOutput(processors.sortLines(input)); break;
          case 'reverse-text': setOutput(processors.reverseText(input)); break;
          case 'reverse-lines': setOutput(processors.reverseLines(input)); break;
          case 'add-prefix-suffix': setOutput(processors.addPrefixSuffix(input, prefix, suffix)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'word-counting-tools') {
        let resultStats = {};
        resultStats.chars = processors.countCharacters(input);
        resultStats.words = processors.countWords(input);
        switch (toolSlug) {
          case 'word-counting-tools':
            resultStats.sentences = processors.countSentences(input);
            resultStats.paragraphs = processors.countParagraphs(input);
            break;
          case 'character-counter':
            resultStats.charsNoSpaces = processors.countCharactersNoSpaces(input);
            break;
          case 'syllable-counter':
            resultStats.syllables = processors.countSyllables(input);
            break;
          case 'sentence-counter':
            resultStats.sentences = processors.countSentences(input);
            break;
          case 'paragraph-counter':
            resultStats.paragraphs = processors.countParagraphs(input);
            break;
          case 'line-counter':
            resultStats.lines = processors.countLines(input);
            break;
          case 'word-frequency':
            resultStats.frequency = processors.getWordFrequency(input);
            break;
          case 'reading-time':
            resultStats.reading = processors.getReadingTime(input);
            break;
          case 'speaking-time':
            resultStats.speaking = processors.getSpeakingTime(input);
            break;
          case 'readability-score':
            resultStats.readability = processors.getReadabilityScore(input);
            break;
          case 'keyword-density':
            resultStats.density = processors.getKeywordDensity(input);
            break;
          case 'text-summarizer':
            setOutput(processors.textSummarizer(input, parseInt(replaceText || 30)));
            setStats({ summaryMode: true });
            return;
        }
        setStats(resultStats);
        setOutput(input);
      }
      else if (categoryId === 'text-encoder-decoder') {
        switch (toolSlug) {
          case 'base64-encode-decode':
            setOutput(mode === 'encode' ? processors.base64Encode(input) : processors.base64Decode(input)); break;
          case 'url-encode-decode':
            setOutput(mode === 'encode' ? processors.urlEncode(input) : processors.urlDecode(input)); break;
          case 'html-encode-decode':
            setOutput(mode === 'encode' ? processors.htmlEncode(input) : processors.htmlDecode(input)); break;
          case 'binary-text':
            setOutput(processors.binaryText(input, mode)); break;
          case 'hex-text':
            setOutput(mode === 'encode' ? processors.textToHex(input) : processors.hexToText(input)); break;
          case 'octal-text':
            setOutput(mode === 'encode' ? processors.textToOctal(input) : processors.octalToText(input)); break;
          case 'ascii-text':
            setOutput(mode === 'encode' ? processors.textToAscii(input) : processors.asciiToText(input)); break;
          case 'rot13':
            setOutput(processors.rot13(input)); break;
          case 'utf8-encode-decode':
            setOutput(mode === 'encode' ? processors.utf8Encode(input) : processors.utf8Decode(input)); break;
          case 'morse-code':
            setOutput(processors.morseCode(input, mode)); break;
          case 'braille-translator':
            setOutput(processors.brailleTranslator(input)); break;
          case 'sign-language-translator':
            setOutput(processors.signLanguageTranslator(input)); break;
          case 'nato-phonetic-translator':
            setOutput(processors.natoPhoneticTranslator(input)); break;
          case 'wingdings-translator':
            setOutput(processors.wingdingsTranslator(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'code-formatter') {
        switch (toolSlug) {
          case 'json-formatter': setOutput(processors.jsonFormat(input)); break;
          case 'json-validator': setOutput(processors.jsonValidate(input)); break;
          case 'json-minifier': setOutput(processors.jsonMinify(input)); break;
          case 'xml-formatter': setOutput(processors.xmlFormat(input)); break;
          case 'sql-formatter': setOutput(processors.sqlFormatter(input)); break;
          case 'html-formatter': setOutput(processors.htmlFormat(input)); break;
          case 'css-formatter': setOutput(processors.cssFormat(input)); break;
          case 'css-minifier': setOutput(processors.cssMinify(input)); break;
          case 'js-formatter': setOutput(processors.jsFormat(input)); break;
          case 'js-minifier': setOutput(processors.jsMinify(input)); break;
          case 'json-to-typescript': setOutput(processors.jsonToTypescript(input)); break;
          case 'math-equation-latex': setOutput(processors.mathEquationLatex(input)); break;
          case 'rpg-stat-block-formatter': setOutput(processors.rpgStatBlockFormatter(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'text-converter') {
        switch (toolSlug) {
          case 'text-to-html': setOutput(processors.textToHtml(input)); break;
          case 'html-to-text': setOutput(processors.htmlToText(input)); break;
          case 'markdown-to-html': setOutput(processors.markdownToHtml(input)); break;
          case 'html-to-markdown': setOutput(processors.htmlToMarkdown(input)); break;
          case 'csv-to-json': setOutput(processors.csvToJson(input, csvJsonOptions)); break;
          case 'json-to-csv': setOutput(processors.jsonToCsv(input, jsonCsvOptions)); break;
          case 'tsv-to-csv': setOutput(processors.tsvToCsv(input, tsvCsvOptions)); break;
          case 'csv-to-html-table': setOutput(processors.csvToHtmlTable(input, csvHtmlOptions)); break;
          case 'json-to-xml': setOutput(processors.jsonToXml(input, jsonXmlOptions)); break;
          case 'xml-to-json': setOutput(processors.xmlToJson(input, xmlJsonOptions)); break;
          case 'yaml-to-json': setOutput(processors.yamlToJson(input)); break;
          case 'json-to-yaml': setOutput(processors.jsonToYaml(input, jsonYamlOptions)); break;
          case 'html-table-to-csv': setOutput(processors.htmlTableToCsv(input)); break;
          case 'json-to-html-table': setOutput(processors.jsonToHtmlTable(input, jsonHtmlOptions)); break;
          case 'yaml-to-xml': setOutput(processors.yamlToXml(input, yamlXmlOptions)); break;
          case 'toml-to-json': setOutput(processors.tomlToJson(input)); break;
          case 'json-to-toml': setOutput(processors.jsonToToml(input)); break;
          case 'bbcode-to-html': setOutput(processors.bbcodeToHtml(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'text-extractor') {
        switch (toolSlug) {
          case 'extract-emails': setOutput(input ? processors.extractEmails(input) : ''); break;
          case 'extract-urls': setOutput(input ? processors.extractUrls(input) : ''); break;
          case 'extract-numbers': setOutput(input ? processors.extractNumbers(input) : ''); break;
          case 'extract-phones': setOutput(input ? processors.extractPhones(input) : ''); break;
          case 'find-replace': setOutput(input ? processors.findReplace(input, findText, replaceText) : ''); break;
          case 'regex-tester': setOutput(input && regexPattern ? processors.regexTest(input, regexPattern, regexFlags) : ''); break;
          case 'text-compare': setOutput(processors.textCompare(input, input2)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'generators-randomizers') {
        switch (toolSlug) {
          case 'uuid-generator': setOutput(processors.uuidGenerator()); break;
          case 'password-generator': setOutput(processors.passwordGenerator()); break;
          case 'lorem-ipsum': setOutput(processors.loremIpsum()); break;
          case 'random-number': setOutput(processors.randomNumber().toString()); break;
          case 'random-string': setOutput(processors.randomString()); break;
          case 'string-repeater': setOutput(input ? processors.stringRepeater(input, 5) : ''); break;
          case 'fake-name-generator': setOutput(processors.fakeNameGenerator()); break;
          case 'fake-address-generator': setOutput(processors.fakeAddressGenerator()); break;
          case 'mac-address-generator': setOutput(processors.macAddressGenerator()); break;
          case 'string-combiner': setOutput(processors.stringCombiner(input, input2)); break;
          case 'zalgo-text': setOutput(processors.zalgoText(input)); break;
          case 'password-strength': {
            const pData = processors.passwordStrengthAnalyzer(input);
            setOutput(pData);
            try { setStats(JSON.parse(pData)); } catch(e) { setStats(null); }
            break;
          }
          default: setOutput(input);
        }
      }
      else if (categoryId === 'text-hasher-cryptography') {
        if (!input) return;
        switch (toolSlug) {
          case 'md5-hash': setOutput(processors.md5Hash(input)); break;
          case 'sha1-hash': setOutput(processors.sha1Hash(input)); break;
          case 'sha256-hash': setOutput(processors.sha256Hash(input)); break;
          case 'sha512-hash': setOutput(processors.sha512Hash(input)); break;
          case 'sha224-hash': setOutput(processors.sha224Hash(input)); break;
          case 'sha384-hash': setOutput(processors.sha384Hash(input)); break;
          case 'sha3-hash': setOutput(processors.sha3Hash(input)); break;
          case 'ripemd160-hash': setOutput(processors.ripemd160Hash(input)); break;
          case 'aes-encrypt-decrypt': setOutput(mode === 'encode' ? processors.aesEncrypt(input, cryptoPassword) : processors.aesDecrypt(input, cryptoPassword)); break;
          case 'des-encrypt-decrypt': setOutput(mode === 'encode' ? processors.desEncrypt(input, cryptoPassword) : processors.desDecrypt(input, cryptoPassword)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'list-array-tools') {
        if (!input) return;
        switch (toolSlug) {
          case 'shuffle-list': setOutput(processors.shuffleList(input)); break;
          case 'list-intersection': setOutput(processors.listIntersection(input, input2)); break;
          case 'list-difference': setOutput(processors.listDifference(input, input2)); break;
          case 'comma-separator': setOutput(processors.commaSeparator(input)); break;
          case 'split-text': setOutput(processors.splitText(input, replaceText || ',')); break;
          case 'join-text': setOutput(processors.joinText(input, replaceText || ',')); break;
          case 'number-to-words': setOutput(processors.numberToWords(input)); break;
          case 'words-to-numbers': setOutput(processors.wordsToNumbers(input)); break;
          case 'add-prefix': setOutput(processors.addPrefixList(input, prefix)); break;
          case 'add-suffix': setOutput(processors.addSuffixList(input, suffix)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'web-developer-tools') {
        if (!input) return;
        switch (toolSlug) {
          case 'jwt-decoder': setOutput(processors.jwtDecoder(input)); break;
          case 'color-converter': setOutput(processors.colorConverter(input)); break;
          case 'css-color-extractor': setOutput(processors.cssColorExtractor(input)); break;
          case 'query-string-parser': setOutput(processors.queryStringParser(input)); break;
          case 'url-slug-generator': setOutput(processors.urlSlugGenerator(input)); break;
          case 'html-tag-remover': setOutput(processors.htmlTagRemover(input, findText)); break;
          case 'bbcode-to-html': setOutput(processors.bbcodeToHtml(input)); break;
          case 'html-to-bbcode': setOutput(processors.htmlToBbcode(input)); break;
          case 'markdown-stripper': setOutput(processors.markdownStripper(input)); break;
          case 'sql-escaper': setOutput(processors.sqlEscaper(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'social-media-tools') {
        switch (toolSlug) {
          case 'instagram-caption-spacer': setOutput(processors.instagramCaptionSpacer(input)); break;
          case 'twitter-thread-splitter': setOutput(processors.twitterThreadSplitter(input)); break;
          case 'youtube-timestamp-generator': setOutput(processors.youtubeTimestampGenerator(input)); break;
          case 'social-media-character-counter': {
            const data = processors.socialMediaCharacterCounter(input);
            setOutput(data);
            try { setStats(JSON.parse(data)); } catch(e) { setStats(null); }
            break;
          }
          case 'fancy-font-generator': setOutput(processors.fancyFontGenerator(input)); break;
          case 'hashtag-shuffler': setOutput(processors.hashtagShuffler(input)); break;
          case 'youtube-title-analyzer': setOutput(processors.youtubeTitleAnalyzer(input)); break;
          case 'emoji-translator': setOutput(processors.emojiTranslator(input)); break;
          case 'teleprompter-formatter': setOutput(processors.teleprompterFormatter(input)); break;
          case 'utm-link-builder': setOutput(processors.utmLinkBuilder(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'ai-data-tools') {
        switch (toolSlug) {
          case 'transcript-cleaner': setOutput(processors.transcriptCleaner(input)); break;
          case 'ai-prompt-sanitizer': setOutput(processors.aiPromptSanitizer(input)); break;
          case 'secure-email-extractor': setOutput(processors.secureEmailExtractor(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'pdf-text-tools') {
        if (!input) return;
        if (toolSlug === 'pdf-line-break-remover') {
          let text = input.replace(/-\s*\n\s*/g, '');
          text = text.replace(/(?<!\n)\n(?!\n)/g, ' ');
          text = text.replace(/ +/g, ' ');
          setOutput(text);
        } else {
          setOutput(input);
        }
      }
    } catch (e) {
      console.error(e);
      setOutput('Error processing text.');
    }
  }, [input, input2, categoryId, toolSlug, mode, findText, replaceText, regexPattern, regexFlags, prefix, suffix, cryptoPassword, jsonCsvOptions, csvJsonOptions, jsonXmlOptions, xmlJsonOptions, jsonYamlOptions, tsvCsvOptions, csvHtmlOptions, jsonHtmlOptions, yamlXmlOptions]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter = Copy output
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+Shift+C = Clear input
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleClear();
      }
      // Ctrl+S = Download output
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [output, input]);

  // ─── File Drop Handlers ───
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const processPdfFile = async (file) => {
    try {
      setToast({ message: 'Extracting text from PDF (this might take a moment)...', type: 'success' });
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textObj = await page.getTextContent();
        
        let lastY = -1;
        for (const item of textObj.items) {
          if (lastY !== item.transform[5] && lastY !== -1) {
            textContent += '\n';
          }
          textContent += item.str;
          lastY = item.transform[5];
        }
        textContent += '\n\n';
      }

      setInput(textContent.trim());
      setToast({ message: 'PDF Text extracted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to read PDF. Ensure it is not encrypted or an image scan.', type: 'error' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      processPdfFile(file);
    } else if (file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setInput(ev.target.result);
      reader.readAsText(file);
      setToast({ message: `Loaded "${file.name}" successfully!`, type: 'success' });
    } else {
      setToast({ message: 'Unsupported file format.', type: 'warning' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      processPdfFile(file);
    } else if (file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setInput(ev.target.result);
      reader.readAsText(file);
      setToast({ message: `Loaded "${file.name}" successfully!`, type: 'success' });
    } else {
      setToast({ message: 'Unsupported file format.', type: 'warning' });
    }
  };

  const handleCopy = () => {
    if (!output && categoryId !== 'word-counting-tools') return;
    const textToCopy = categoryId === 'word-counting-tools' ? input : output;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const handleClear = () => {
    setInput('');
    setInput2('');
    setOutput('');
    setStats(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setToast({ message: 'Pasted from clipboard!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Could not access clipboard. Try Ctrl+V.', type: 'error' });
    }
  };

  const handleSample = () => {
    setInput(SAMPLE_TEXT);
  };

  const handleDownload = () => {
    if (!output && categoryId !== 'word-counting-tools') return;
    const textToDownload = categoryId === 'word-counting-tools' ? input : output;
    if (!textToDownload) return;
    const element = document.createElement('a');
    const file = new Blob([textToDownload], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${toolSlug}-output.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setToast({ message: 'File downloaded!', type: 'success' });
  };

  // Swap input ↔ output for encoder/decoder tools
  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const needsModeToggle = (categoryId === 'text-encoder-decoder' && toolSlug !== 'rot13') || (categoryId === 'text-hasher-cryptography' && (toolSlug === 'aes-encrypt-decrypt' || toolSlug === 'des-encrypt-decrypt'));
  const isTextCompare = categoryId === 'text-extractor' && toolSlug === 'text-compare';
  const isStringCombiner = categoryId === 'generators-randomizers' && toolSlug === 'string-combiner';
  const isListDiff = categoryId === 'list-array-tools' && (toolSlug === 'list-intersection' || toolSlug === 'list-difference');
  const isDualInput = isTextCompare || isStringCombiner || isListDiff;
  
  const isFindReplace = categoryId === 'text-extractor' && toolSlug === 'find-replace';
  const isSplitJoin = categoryId === 'list-array-tools' && (toolSlug === 'split-text' || toolSlug === 'join-text');
  const isRegex = categoryId === 'text-extractor' && toolSlug === 'regex-tester';
  const isPrefixSuffix = (categoryId === 'text-cleaner' && toolSlug === 'add-prefix-suffix') || (categoryId === 'list-array-tools' && (toolSlug === 'add-prefix' || toolSlug === 'add-suffix'));
  const isCrypto = categoryId === 'text-hasher-cryptography' && (toolSlug === 'aes-encrypt-decrypt' || toolSlug === 'des-encrypt-decrypt');
  const isHtmlTagRemover = categoryId === 'web-developer-tools' && toolSlug === 'html-tag-remover';
  const isGeneratorNoInput = categoryId === 'generators-randomizers' && ['uuid-generator', 'password-generator', 'lorem-ipsum', 'random-number', 'random-string', 'fake-name-generator', 'fake-address-generator', 'mac-address-generator'].includes(toolSlug);

  // Real-time character count for input
  const inputCharCount = input.length;
  const inputWordCount = input ? input.trim().split(/\s+/).filter(Boolean).length : 0;

  // ─── Input panel helper bar (paste, sample, upload, char count) ───
  const InputHelperBar = () => (
    <div className="tool-helper-bar">
      <div className="tool-helper-actions">
        <button className="btn-helper" onClick={handlePaste} title="Paste from clipboard">📋 Paste</button>
        <button className="btn-helper" onClick={handleSample} title="Load sample text">📝 Sample</button>
        <label className="btn-helper" title="Upload .txt file">
          📁 Upload
          <input type="file" accept=".txt,.csv,.json,.xml,.html,.css,.js,.md,.yml,.yaml,.log" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="tool-helper-stats">
        <span>{inputCharCount} chars</span>
        <span>{inputWordCount} words</span>
      </div>
    </div>
  );

  // ─── SOCIAL MEDIA CHARACTER COUNTER UI ───
  if (categoryId === 'social-media-tools' && toolSlug === 'social-media-character-counter') {
    let platforms = [];
    try { platforms = stats?.platforms || []; } catch(e) {}
    return (
      <div className="tool-container-full">
        {platforms.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {platforms.map((p, idx) => {
              const pct = Math.min((p.current / p.limit) * 100, 100);
              const color = p.ok ? (pct > 80 ? '#f59e0b' : '#22c55e') : '#ef4444';
              return (
                <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{p.icon} <strong>{p.name}</strong></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{p.current}/{p.limit} {p.unit || 'chars'}</span>
                  </div>
                  <div style={{ background: 'var(--bg-main)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.ok ? `${p.limit - p.current} remaining` : `Over by ${p.current - p.limit}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="tool-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="tool-panel-header">
            <div className="tool-panel-title">{t.ui?.pasteCaption || 'PASTE YOUR CAPTION OR POST'}</div>
            <div className="tool-panel-actions">
              <button className="btn btn-ghost btn-icon" onClick={handleClear} title={t.ui?.clear || 'Clear'}>🗑️</button>
            </div>
          </div>
          <InputHelperBar />
          <textarea
            ref={inputRef}
            className={`tool-textarea ${isDragging ? 'dragging' : ''}`}
            placeholder="Paste your social media caption here to check character limits for Instagram, Twitter, TikTok, LinkedIn, YouTube..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
          />
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── AUDIO SPEECH TOOLS UI ───
  if (categoryId === 'audio-speech-tools' && toolSlug === 'text-to-audio') {
    const getLanguageName = (langCode) => {
      if (!langCode) return 'Unknown';
      try {
        const [lang, region] = langCode.replace('_', '-').split('-');
        const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang);
        const regionName = region ? new Intl.DisplayNames(['en'], { type: 'region' }).of(region) : '';
        return regionName ? `${langName} (${regionName})` : langName;
      } catch (e) {
        return langCode; // fallback
      }
    };
    
    const groupedVoices = voices.reduce((acc, voice) => {
      const groupName = getLanguageName(voice.lang);
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(voice);
      return acc;
    }, {});

    const sortedGroups = Object.keys(groupedVoices).sort();

    // Word highlighting logic
    const renderHighlightedText = () => {
      if (charIndex === 0) return input;
      const before = input.slice(0, charIndex);
      const remaining = input.slice(charIndex);
      const match = remaining.match(/^(\S+)(.*)/s);
      
      if (match) {
        return (
          <>
            {before}
            <mark className="tts-highlight">{match[1]}</mark>
            {match[2]}
          </>
        );
      }
      return input;
    };

    return (
      <div className="tool-container-full">
        <div className="tts-dashboard">
          {/* Left Panel: Text & Highlighting */}
          <div className="tts-left-panel tool-panel"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="tool-panel-header">
              <div className="tool-panel-title">TEXT TO READ</div>
              <div className="tool-panel-actions">
                <button className="btn btn-ghost btn-icon" onClick={handleClear} title="Clear text">🗑️</button>
              </div>
            </div>
            
            {!isPlaying && !isPaused ? (
              <textarea 
                ref={inputRef}
                className={`tool-textarea ${isDragging ? 'dragging' : ''}`} 
                placeholder="Type or paste your text here to convert to speech... (or drag & drop a .txt file)" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                spellCheck="false" 
                style={{ height: '400px', fontSize: '1.1rem', lineHeight: '1.6' }}
              />
            ) : (
              <div className="tts-highlight-view" style={{ height: '400px', overflowY: 'auto', fontSize: '1.1rem', lineHeight: '1.6', padding: '1rem', whiteSpace: 'pre-wrap', background: 'var(--bg-white)', borderRadius: 'var(--radius-md)' }}>
                {renderHighlightedText()}
              </div>
            )}

            {(isPlaying || isPaused) && (
              <div className="tts-progress-container" style={{ marginTop: '1rem', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                <div className="tts-progress-bar" style={{ width: `${ttsProgress}%`, height: '100%', background: 'var(--brand-color)', transition: 'width 0.2s ease' }}></div>
              </div>
            )}
          </div>

          {/* Right Panel: Controls */}
          <div className="tts-right-panel tool-panel">
            <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.2rem' }}>Voice & Studio Controls</h3>
            
            <div className="tts-control-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Voice ({voices.length} available)</label>
              <select 
                value={selectedVoiceIndex} 
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                className="tts-voice-select"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', background: 'var(--bg-white)', fontFamily: 'var(--font-sans)', marginBottom: '1.5rem' }}
              >
                {voices.length === 0 && <option>Loading voices...</option>}
                {sortedGroups.map(group => (
                  <optgroup key={group} label={group}>
                    {groupedVoices[group].map((voice) => {
                      const idx = voices.findIndex(v => v.name === voice.name && v.lang === voice.lang);
                      return (
                        <option key={idx} value={idx}>
                          {voice.name} {voice.default ? '⭐' : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="tts-control-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quick Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setPitch(1); setRate(1); }}>📖 Normal</button>
                <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setPitch(1); setRate(1.5); }}>⚡ Fast</button>
                <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setPitch(1.4); setRate(1.1); }}>🎉 Excited</button>
                <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setPitch(0.6); setRate(0.9); }}>🎙️ Deep</button>
              </div>
            </div>

            <div className="tts-sliders" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span>Speech Speed (Rate)</span>
                  <span style={{ color: 'var(--brand-color)' }}>{rate}x</span>
                </label>
                <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span>Voice Pitch</span>
                  <span style={{ color: 'var(--brand-color)' }}>{pitch}</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>
            </div>

            <div className="tts-media-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {!isPlaying ? (
                <button className="btn btn-primary" onClick={handlePlayAudio} style={{ fontSize: '1.1rem', padding: '16px 0', gridColumn: 'span 2' }}>
                  ▶️ {isPaused ? 'Resume Playback' : 'Start Reading'}
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handlePauseAudio} style={{ fontSize: '1.1rem', padding: '16px 0', gridColumn: 'span 2' }}>
                  ⏸️ Pause
                </button>
              )}
              <button className="btn btn-ghost" onClick={handleStopAudio} disabled={!isPlaying && !isPaused} style={{ padding: '12px 0', border: '1px solid var(--border-light)' }}>
                ⏹️ Stop
              </button>
              <button className="btn btn-ghost" onClick={handleDownloadAudio} disabled={isDownloading} style={{ padding: '12px 0', border: '1px solid var(--border-light)' }}>
                {isDownloading ? '⏳' : '💾'} MP3
              </button>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── WORD COUNTER: Stats UI ───
  if (categoryId === 'word-counting-tools' && toolSlug !== 'text-summarizer') {
    return (
      <div className="tool-container-full">
        {stats && (
          <div className="tool-stats">
            <div className="tool-stat">
              <div className="tool-stat-value">{stats.chars || 0}</div>
              <div className="tool-stat-label">Characters</div>
            </div>
            <div className="tool-stat">
              <div className="tool-stat-value">{stats.words || 0}</div>
              <div className="tool-stat-label">Words</div>
            </div>
            {stats.syllables !== undefined && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.syllables}</div>
                <div className="tool-stat-label">Syllables</div>
              </div>
            )}
            {stats.charsNoSpaces !== undefined && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.charsNoSpaces}</div>
                <div className="tool-stat-label">Chars (No Spaces)</div>
              </div>
            )}
            {stats.sentences !== undefined && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.sentences}</div>
                <div className="tool-stat-label">Sentences</div>
              </div>
            )}
            {stats.paragraphs !== undefined && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.paragraphs}</div>
                <div className="tool-stat-label">Paragraphs</div>
              </div>
            )}
            {stats.lines !== undefined && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.lines}</div>
                <div className="tool-stat-label">Lines</div>
              </div>
            )}
            {stats.reading && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.reading.minutes}m {stats.reading.seconds % 60}s</div>
                <div className="tool-stat-label">Reading Time</div>
              </div>
            )}
            {stats.speaking && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.speaking.minutes}m {stats.speaking.seconds}s</div>
                <div className="tool-stat-label">Speaking Time</div>
              </div>
            )}
            {stats.readability && (
              <div className="tool-stat">
                <div className="tool-stat-value">{stats.readability.score}</div>
                <div className="tool-stat-label">{stats.readability.level}</div>
              </div>
            )}
          </div>
        )}
        {(stats?.frequency || stats?.density) && (
          <div className="tool-panel" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontWeight: 700 }}>
              {stats.frequency ? 'Word Frequency' : 'Keyword Density'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              {(stats.frequency || stats.density).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>{item.word}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.count}× ({item.percentage || item.density}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="tool-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="tool-panel-header">
            <div className="tool-panel-title">{t.ui?.input || 'TYPE OR PASTE YOUR TEXT'}</div>
            <div className="tool-panel-actions">
              <button className="btn btn-ghost btn-icon" onClick={handleClear} title={t.ui?.clear || 'Clear'}>🗑️</button>
            </div>
          </div>
          <InputHelperBar />
          <textarea 
            ref={inputRef}
            className={`tool-textarea ${isDragging ? 'dragging' : ''}`} 
            placeholder={t.ui?.pasteText || "Type or paste your text here to analyze... (or drag & drop a .txt file)"}
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            spellCheck="false" 
          />
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── DUAL INPUT UI (Compare, Combine, List Math) ───
  if (isDualInput) {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy Result</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="tool-panel-header"><div className="tool-panel-title">FIRST LIST / TEXT</div></div>
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste your first text here... (or drag & drop a file)" value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" />
          </div>
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">SECOND LIST / TEXT</div></div>
            <textarea className="tool-textarea" placeholder="Paste your second text here..." value={input2} onChange={(e) => setInput2(e.target.value)} spellCheck="false" />
          </div>
        </div>
        <div className="tool-panel" style={{ marginTop: 'var(--space-4)' }}>
          <div className="tool-panel-header"><div className="tool-panel-title">RESULT</div></div>
          {output ? (
            <div className="tool-output" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{output}</div>
          ) : (
            <div className="tool-output empty">Enter text in both panels to see results...</div>
          )}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── GENERATORS NO-INPUT UI ───
  if (isGeneratorNoInput) {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy Result</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download</button>
          <button className="btn btn-secondary" onClick={() => {
            // Re-trigger generation
            setOutput('');
            setTimeout(() => {
              try {
                switch (toolSlug) {
                  case 'uuid-generator': setOutput(processors.uuidGenerator()); break;
                  case 'password-generator': setOutput(processors.passwordGenerator()); break;
                  case 'lorem-ipsum': setOutput(processors.loremIpsum()); break;
                  case 'random-number': setOutput(processors.randomNumber().toString()); break;
                  case 'random-string': setOutput(processors.randomString()); break;
                  case 'fake-name-generator': setOutput(processors.fakeNameGenerator()); break;
                  case 'fake-address-generator': setOutput(processors.fakeAddressGenerator()); break;
                  case 'mac-address-generator': setOutput(processors.macAddressGenerator()); break;
                }
              } catch (e) { console.error(e); }
            }, 50);
          }}>🔄 Generate New</button>
        </div>
        <div className="tool-panel">
          <div className="tool-panel-header"><div className="tool-panel-title">GENERATED RESULT</div></div>
          {output ? (
            <div className="tool-output">{output}</div>
          ) : (
            <div className="tool-output empty">Generating...</div>
          )}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── JSON TO CSV UI ───
  if (categoryId === 'text-converter' && toolSlug === 'json-to-csv') {
    let previewHeaders = [];
    let previewRows = [];
    if (output && !output.startsWith('Error:')) {
      const lines = output.split('\n');
      if (lines.length > 0) {
        // Simple naive split for preview purposes
        previewHeaders = lines[0].split(jsonCsvOptions.delimiter).map(h => h.replace(/^"|"$/g, ''));
        previewRows = lines.slice(1, 10).map(l => l.split(jsonCsvOptions.delimiter).map(c => c.replace(/^"|"$/g, '')));
      }
    }

    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy CSV</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download CSV</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">JSON INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste JSON array here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">CSV OUTPUT & SETTINGS</div></div>
            
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Delimiter:</label>
                <select value={jsonCsvOptions.delimiter} onChange={(e) => setJsonCsvOptions({...jsonCsvOptions, delimiter: e.target.value})} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', background: 'var(--bg-white)', outline: 'none' }}>
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={jsonCsvOptions.flatten} onChange={(e) => setJsonCsvOptions({...jsonCsvOptions, flatten: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Flatten nested objects
              </label>
            </div>

            {previewHeaders.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border-light)' }}>
                      {previewHeaders.map((h, i) => <th key={i} style={{ padding: '10px', whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? 'var(--bg-white)' : 'var(--bg-card)' }}>
                        {row.map((cell, j) => <td key={j} style={{ padding: '8px 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {output.split('\n').length > 11 && (
                  <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
                    Showing first 10 rows. Download or copy to see all {output.split('\n').length - 1} rows.
                  </div>
                )}
              </div>
            ) : (
              <textarea className="tool-textarea" value={output} readOnly placeholder="CSV output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
            )}
            
            {previewHeaders.length > 0 && (
              <details style={{ marginTop: 'var(--space-3)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}>View Raw CSV Data</summary>
                <textarea className="tool-textarea" value={output} readOnly style={{ height: '200px', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-2)' }} />
              </details>
            )}
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── CSV TO JSON UI ───
  if (categoryId === 'text-converter' && toolSlug === 'csv-to-json') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy JSON</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download JSON</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">CSV INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste CSV data here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">JSON OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Output Format:</label>
                <select value={csvJsonOptions.outputType} onChange={(e) => setCsvJsonOptions({...csvJsonOptions, outputType: e.target.value})} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', background: 'var(--bg-white)', outline: 'none' }}>
                  <option value="array">JSON Array (List)</option>
                  <option value="object">JSON Object (Keyed by 1st Column)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={csvJsonOptions.autoType} onChange={(e) => setCsvJsonOptions({...csvJsonOptions, autoType: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Auto-detect numbers & booleans
              </label>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="JSON output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── JSON TO XML UI ───
  if (categoryId === 'text-converter' && toolSlug === 'json-to-xml') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy XML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download XML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">JSON INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste JSON here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">XML OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Root Node Name:</label>
                <input type="text" value={jsonXmlOptions.rootNode} onChange={(e) => setJsonXmlOptions({...jsonXmlOptions, rootNode: e.target.value})} placeholder="root" style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', outline: 'none' }} />
              </div>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="XML output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── XML TO JSON UI ───
  if (categoryId === 'text-converter' && toolSlug === 'xml-to-json') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy JSON</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download JSON</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">XML INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste XML data here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">JSON OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={xmlJsonOptions.parseAttributes} onChange={(e) => setXmlJsonOptions({...xmlJsonOptions, parseAttributes: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Parse XML Attributes (e.g. &lt;node id="1"&gt;)
              </label>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="JSON output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── TSV TO CSV UI ───
  if (categoryId === 'text-converter' && toolSlug === 'tsv-to-csv') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy CSV</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download CSV</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">TSV INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste TSV data here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">CSV OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Output Delimiter:</label>
                <select value={tsvCsvOptions.delimiter} onChange={(e) => setTsvCsvOptions({...tsvCsvOptions, delimiter: e.target.value})} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', background: 'var(--bg-white)', outline: 'none' }}>
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={tsvCsvOptions.forceQuote} onChange={(e) => setTsvCsvOptions({...tsvCsvOptions, forceQuote: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Force Quote All Fields
              </label>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="CSV output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── JSON TO YAML UI ───
  if (categoryId === 'text-converter' && toolSlug === 'json-to-yaml') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy YAML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download YAML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">JSON INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste JSON here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">YAML OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Indentation:</label>
                <select value={jsonYamlOptions.indent} onChange={(e) => setJsonYamlOptions({...jsonYamlOptions, indent: parseInt(e.target.value)})} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)', background: 'var(--bg-white)', outline: 'none' }}>
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="YAML output will appear here..." style={{ height: '300px', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── CSV TO HTML TABLE UI ───
  if (categoryId === 'text-converter' && toolSlug === 'csv-to-html-table') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy HTML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download HTML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">CSV INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste CSV data here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">HTML OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={csvHtmlOptions.hasHeader} onChange={(e) => setCsvHtmlOptions({...csvHtmlOptions, hasHeader: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                First Row is Header (&lt;th&gt;)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={csvHtmlOptions.addStyles} onChange={(e) => setCsvHtmlOptions({...csvHtmlOptions, addStyles: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Add Inline CSS Styles
              </label>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="HTML output will appear here..." style={{ height: '150px', fontFamily: 'var(--font-mono)' }} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Live Preview:</div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-white)', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', minHeight: '100px' }} dangerouslySetInnerHTML={{ __html: output || '<span style="color:#888;">Table preview will appear here...</span>' }} />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── MARKDOWN TO HTML UI ───
  if (categoryId === 'text-converter' && toolSlug === 'markdown-to-html') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy HTML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download HTML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">MARKDOWN INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Type or paste Markdown here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">HTML OUTPUT & PREVIEW</div></div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="HTML code will appear here..." style={{ height: '150px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Live Preview:</div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-white)', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', minHeight: '150px' }} dangerouslySetInnerHTML={{ __html: output || '<span style="color:#888;">Preview will appear here...</span>' }} />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── JSON TO HTML TABLE UI ───
  if (categoryId === 'text-converter' && toolSlug === 'json-to-html-table') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy HTML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download HTML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">JSON ARRAY INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Paste JSON array here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">HTML OUTPUT & SETTINGS</div></div>
            <div style={{ background: 'var(--bg-main)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <input type="checkbox" checked={jsonHtmlOptions.addStyles} onChange={(e) => setJsonHtmlOptions({...jsonHtmlOptions, addStyles: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-color)' }} />
                Add Inline CSS Styles
              </label>
            </div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="HTML output will appear here..." style={{ height: '150px', fontFamily: 'var(--font-mono)' }} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Live Preview:</div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-white)', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', minHeight: '100px' }} dangerouslySetInnerHTML={{ __html: output || '<span style="color:#888;">Table preview will appear here...</span>' }} />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── BBCODE TO HTML UI ───
  if (categoryId === 'text-converter' && toolSlug === 'bbcode-to-html') {
    return (
      <>
        <div className="tool-actions">
          <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCopy}>📋 Copy HTML</button>
          <button className="btn btn-secondary" onClick={handleDownload}>💾 Download HTML</button>
        </div>
        <div className="tool-container">
          <div className="tool-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="tool-panel-header"><div className="tool-panel-title">BBCODE INPUT</div></div>
            <InputHelperBar />
            <textarea className={`tool-textarea ${isDragging ? 'dragging' : ''}`} placeholder="Type or paste BBCode here..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          
          <div className="tool-panel">
            <div className="tool-panel-header"><div className="tool-panel-title">HTML OUTPUT & PREVIEW</div></div>
            <textarea className="tool-textarea" value={output} readOnly placeholder="HTML code will appear here..." style={{ height: '150px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Live Preview:</div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-white)', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', minHeight: '150px' }} dangerouslySetInnerHTML={{ __html: output || '<span style="color:#888;">Preview will appear here...</span>' }} />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ─── DEFAULT: Input/Output UI ───
  return (
    <>
      {needsModeToggle && (
        <div className="tool-actions">
          <button className={`btn ${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('encode')}>Encode</button>
          <button className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('decode')}>Decode</button>
          {needsModeToggle && !isCrypto && (
            <button className="btn btn-secondary" onClick={handleSwap} title="Swap: Use output as input">⇄ Swap</button>
          )}
        </div>
      )}
      
      {toolSlug === 'password-strength' && stats && (
        <div className="tool-panel" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)', border: `2px solid ${stats.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: stats.color }}>{stats.label} ({stats.score}/100)</h3>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Entropy: {stats.entropy} bits</div>
          </div>
          
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
            <div style={{ width: `${stats.score}%`, height: '100%', background: stats.color, transition: 'all 0.3s ease' }}></div>
          </div>
          
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
              <strong>Estimated Time to Crack:</strong>
              <span style={{ fontWeight: 600, color: stats.score > 60 ? 'var(--color-success)' : 'inherit' }}>{stats.timeToCrack}</span>
            </div>
            
            <div style={{ marginTop: 'var(--space-2)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-2)', color: 'var(--text-muted)' }}>Feedback:</h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.95rem' }}>
                {stats.feedback.map((msg, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {toolSlug === 'text-summarizer' && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'center', background: 'var(--bg-white)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dark)' }}>
          <strong style={{ minWidth: '150px' }}>Summary Length:</strong>
          <input type="range" min="10" max="90" step="10" value={replaceText || 30} onChange={(e) => setReplaceText(e.target.value)} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ width: '50px', textAlign: 'right', fontWeight: 600 }}>{replaceText || 30}%</span>
        </div>
      )}
      {isCrypto && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <input type="text" placeholder="Encryption / Decryption Password (Required)" value={cryptoPassword} onChange={(e) => setCryptoPassword(e.target.value)} style={{ flex: 1, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '1rem', background: 'var(--bg-white)' }} />
        </div>
      )}
      {(isFindReplace || isSplitJoin || isHtmlTagRemover) && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input type="text" placeholder={isHtmlTagRemover ? "HTML tag to remove (e.g. script)" : isSplitJoin ? "Delimiter (e.g. , or |)" : "Find..."} value={findText} onChange={(e) => setFindText(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '1rem', background: 'var(--bg-white)' }} />
          {isFindReplace && (
            <input type="text" placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '1rem', background: 'var(--bg-white)' }} />
          )}
        </div>
      )}
      {isRegex && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Regex pattern (e.g. \d+)" value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} style={{ flex: 2, minWidth: 250, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', background: 'var(--bg-white)' }} />
          <input type="text" placeholder="Flags (e.g. gi)" value={regexFlags} onChange={(e) => setRegexFlags(e.target.value)} style={{ width: 100, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', background: 'var(--bg-white)' }} />
        </div>
      )}
      {isPrefixSuffix && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Prefix (added before each line)" value={prefix} onChange={(e) => setPrefix(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '1rem', background: 'var(--bg-white)' }} />
          <input type="text" placeholder="Suffix (added after each line)" value={suffix} onChange={(e) => setSuffix(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '1rem', background: 'var(--bg-white)' }} />
        </div>
      )}

      <div className="tool-actions">
        <button className="btn btn-secondary" onClick={handleClear}>🗑️ {t.clear || "Clear"}</button>
        <button className="btn btn-primary" onClick={handleCopy}>📋 {t.copyResult || "Copy Result"}</button>
        <button className="btn btn-secondary" onClick={handleDownload}>💾 {t.download || "Download"}</button>
      </div>

      <div className="tool-container">
        <div className="tool-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="tool-panel-header"><div className="tool-panel-title">{t.input || "INPUT"}</div></div>
          <InputHelperBar />
          <textarea 
            ref={inputRef}
            className={`tool-textarea ${isDragging ? 'dragging' : ''}`} 
            placeholder={categoryId === 'pdf-text-tools' ? (t.pastePdf || "Paste PDF text here, or drag & drop a .pdf file...") : (t.pasteText || "Type or paste your text here... (or drag & drop a .txt file)")} 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            spellCheck="false" 
          />
        </div>
        <div className="tool-panel">
          <div className="tool-panel-header"><div className="tool-panel-title">{t.result || "RESULT"}</div></div>
          {output ? (
            <div className="tool-output">{output}</div>
          ) : (
            <div className="tool-output empty">{t.resultPlaceholder || "Your result will appear here..."}</div>
          )}
        </div>
      </div>
      
      <div className="tool-shortcut-hint">
        💡 <strong>Tip:</strong> Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to copy result. Drag & drop {categoryId === 'pdf-text-tools' ? '.pdf' : '.txt'} files to load them.
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
