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

export default function ClientTool({ categoryId, toolSlug }) {
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
  const inputRef = useRef(null);

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
      else if (categoryId === 'word-counter') {
        let resultStats = {};
        resultStats.chars = processors.countCharacters(input);
        resultStats.words = processors.countWords(input);
        switch (toolSlug) {
          case 'word-counter':
            resultStats.sentences = processors.countSentences(input);
            resultStats.paragraphs = processors.countParagraphs(input);
            break;
          case 'character-counter':
            resultStats.charsNoSpaces = processors.countCharactersNoSpaces(input);
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
            setOutput(mode === 'encode' ? processors.textToBinary(input) : processors.binaryToText(input)); break;
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
            setOutput(mode === 'encode' ? processors.textToMorse(input) : processors.morseToText(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'code-formatter') {
        switch (toolSlug) {
          case 'json-formatter': setOutput(processors.jsonFormat(input)); break;
          case 'json-validator': setOutput(processors.jsonValidate(input)); break;
          case 'json-minifier': setOutput(processors.jsonMinify(input)); break;
          case 'xml-formatter': setOutput(processors.xmlFormat(input)); break;
          case 'sql-formatter': setOutput(processors.sqlFormat(input)); break;
          case 'html-formatter': setOutput(processors.htmlFormat(input)); break;
          case 'css-formatter': setOutput(processors.cssFormat(input)); break;
          case 'css-minifier': setOutput(processors.cssMinify(input)); break;
          case 'js-formatter': setOutput(processors.jsFormat(input)); break;
          case 'js-minifier': setOutput(processors.jsMinify(input)); break;
          default: setOutput(input);
        }
      }
      else if (categoryId === 'text-converter') {
        switch (toolSlug) {
          case 'text-to-html': setOutput(processors.textToHtml(input)); break;
          case 'html-to-text': setOutput(processors.htmlToText(input)); break;
          case 'markdown-to-html': setOutput(processors.markdownToHtml(input)); break;
          case 'csv-to-json': setOutput(processors.csvToJson(input)); break;
          case 'json-to-csv': setOutput(processors.jsonToCsv(input)); break;
          case 'tsv-to-csv': setOutput(processors.tsvToCsv(input)); break;
          case 'json-to-xml': setOutput(processors.jsonToXml(input)); break;
          case 'xml-to-json': setOutput(processors.xmlToJson(input)); break;
          case 'yaml-to-json': setOutput(processors.yamlToJson(input)); break;
          case 'json-to-yaml': setOutput(processors.jsonToYaml(input)); break;
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
    } catch (e) {
      console.error(e);
      setOutput('Error processing text.');
    }
  }, [input, input2, categoryId, toolSlug, mode, findText, replaceText, regexPattern, regexFlags, prefix, suffix, cryptoPassword]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter = Copy output
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopy();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [output]);

  // ─── File Drop Handlers ───
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setInput(ev.target.result);
      reader.readAsText(file);
      setToast({ message: `Loaded "${file.name}" successfully!`, type: 'success' });
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setInput(ev.target.result);
      reader.readAsText(file);
      setToast({ message: `Loaded "${file.name}" successfully!`, type: 'success' });
    }
  };

  const handleCopy = () => {
    if (!output && categoryId !== 'word-counter') return;
    const textToCopy = categoryId === 'word-counter' ? input : output;
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
    if (!output && categoryId !== 'word-counter') return;
    const textToDownload = categoryId === 'word-counter' ? input : output;
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

  // ─── WORD COUNTER: Stats UI ───
  if (categoryId === 'word-counter') {
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
            <div className="tool-panel-title">TYPE OR PASTE YOUR TEXT</div>
            <div className="tool-panel-actions">
              <button className="btn btn-ghost btn-icon" onClick={handleClear} title="Clear">🗑️</button>
            </div>
          </div>
          <InputHelperBar />
          <textarea 
            ref={inputRef}
            className={`tool-textarea ${isDragging ? 'dragging' : ''}`} 
            placeholder="Type or paste your text here to analyze... (or drag & drop a .txt file)" 
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
          <div className="tool-panel-header"><div className="tool-panel-title">INPUT</div></div>
          <InputHelperBar />
          <textarea 
            ref={inputRef}
            className={`tool-textarea ${isDragging ? 'dragging' : ''}`} 
            placeholder="Type or paste your text here... (or drag & drop a .txt file)" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            spellCheck="false" 
          />
        </div>
        <div className="tool-panel">
          <div className="tool-panel-header"><div className="tool-panel-title">RESULT</div></div>
          {output ? (
            <div className="tool-output">{output}</div>
          ) : (
            <div className="tool-output empty">Your result will appear here...</div>
          )}
        </div>
      </div>
      
      <div className="tool-shortcut-hint">
        💡 <strong>Tip:</strong> Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to copy result. Drag & drop .txt files to load them.
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
