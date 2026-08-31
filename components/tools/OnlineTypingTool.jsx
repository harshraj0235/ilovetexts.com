'use client';

import React, { useState, useRef, useEffect } from 'react';

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'el', name: 'Greek (Ελληνικά)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'fa', name: 'Persian (فارسی)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)' },
  { code: 'si', name: 'Sinhala (සිංහල)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'am', name: 'Amharic (አማርኛ)' },
  { code: 'ti', name: 'Tigrinya (ትግርኛ)' }
];

const cache = new Map();

export default function OnlineTypingTool({ toolData, lang, t }) {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('hi'); // Default to Hindi
  const [isTranslating, setIsTranslating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    setCharCount(text.length);
    setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
  }, [text]);

  const fetchTransliteration = async (word, langCode) => {
    const cacheKey = `${langCode}:${word.toLowerCase()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${langCode}-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
      const data = await res.json();
      
      if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
        const suggestions = data[1][0][1];
        cache.set(cacheKey, suggestions);
        return suggestions;
      }
    } catch (e) {
      console.error('Transliteration error:', e);
    }
    
    // Fallback to the original word if fetching fails
    return [word];
  };

  const handleKeyDown = async (e) => {
    // Only trigger on Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
      const cursor = e.target.selectionStart;
      const textBefore = text.slice(0, cursor);
      
      // Match the last English word typed
      const match = textBefore.match(/([a-zA-Z]+)$/);
      
      if (match) {
        const word = match[1];
        
        // Prevent default space/enter so we can insert the transliterated word manually
        e.preventDefault(); 
        setIsTranslating(true);
        
        const suggestions = await fetchTransliteration(word, targetLang);
        const bestMatch = suggestions[0] || word; // Pick the top suggestion
        
        // Construct the new text with the transliterated word and the space/enter key
        const newTextBefore = textBefore.slice(0, -word.length) + bestMatch + (e.key === 'Enter' ? '\n' : ' ');
        const newText = newTextBefore + text.slice(cursor);
        
        setText(newText);
        setIsTranslating(false);
        
        // Restore cursor position exactly after the inserted word
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newTextBefore.length, newTextBefore.length);
          }
        }, 0);
      }
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const copyToClipboard = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const downloadText = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typed-document-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printText = () => {
    if (!text) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Document</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;padding:20px;font-size:16px;white-space:pre-wrap;}</style></head><body>');
    printWindow.document.write(text.replace(/\n/g, '<br>'));
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const shareText = () => {
    if (!text) return;
    const mailto = `mailto:?subject=My Typed Document&body=${encodeURIComponent(text)}`;
    window.location.href = mailto;
  };

  const clearText = () => {
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Main Editor Column */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          
          <div className="tool-card" style={{ flex: '1', border: '1px solid var(--border-light)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', padding: 0 }}>
            
            {/* Toolbar */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="tool-select"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid var(--brand-color)', fontSize: '1rem', fontWeight: '600', outline: 'none', cursor: 'pointer', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', minWidth: '200px' }}
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={copyToClipboard} className="btn btn-secondary" title={t.ui.typingTool.copy} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <span role="img" aria-label="copy">📋</span> {t.ui.typingTool.copy}
                </button>
                <button onClick={downloadText} className="btn btn-secondary" title={t.ui.typingTool.download} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <span role="img" aria-label="download">⬇️</span> {t.ui.typingTool.download}
                </button>
                <button onClick={printText} className="btn btn-secondary" title="Print" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <span role="img" aria-label="print">🖨️</span> Print
                </button>
                <button onClick={shareText} className="btn btn-secondary" title="Email" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <span role="img" aria-label="email">✉️</span> Email
                </button>
                <button onClick={clearText} className="btn btn-secondary" style={{ color: 'var(--error-color)', padding: '8px 12px', fontSize: '0.9rem' }} title={t.ui.typingTool.clear}>
                  <span role="img" aria-label="clear">🗑️</span>
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="tool-io-area" style={{ position: 'relative', padding: '0', border: 'none', display: 'flex', flexDirection: 'column' }}>
              <textarea
                ref={textareaRef}
                className="tool-textarea"
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={t.ui.typingTool.placeholder}
                spellCheck="false"
                style={{ 
                  minHeight: '400px', 
                  fontSize: '1.4rem',
                  lineHeight: '1.8',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  border: 'none',
                  padding: '24px',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  boxShadow: 'none',
                  resize: 'vertical',
                  width: '100%'
                }}
              />
              {isTranslating && (
                <div style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '0.85rem', color: 'var(--brand-color)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid var(--brand-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  {t.ui.typingTool.converting}
                </div>
              )}
            </div>
            
            {/* Footer / Analytics */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 24px', fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--brand-color)' }}>💡 {t.ui.typingTool.proTip}</strong> {t.ui.typingTool.tipText}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontWeight: '500', color: 'var(--text-main)' }}>
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
              </div>
            </div>

          </div>
        </div>
        
        {/* Sidebar */}
        <div style={{ width: '100%', maxWidth: '320px', flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="tool-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px', margin: 0 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span role="img" aria-label="keyboard">⌨️</span> {t.ui.typingTool.howToType}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: t.ui.typingTool.howToTypeDesc.replace('Space', '<strong>Space</strong>').replace('Enter', '<strong>Enter</strong>') }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>a</span>
                <strong style={{ color: 'var(--brand-color)' }}>अ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>aa</span>
                <strong style={{ color: 'var(--brand-color)' }}>आ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>i</span>
                <strong style={{ color: 'var(--brand-color)' }}>इ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ee</span>
                <strong style={{ color: 'var(--brand-color)' }}>ई</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ka</span>
                <strong style={{ color: 'var(--brand-color)' }}>क</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>kya</span>
                <strong style={{ color: 'var(--brand-color)' }}>क्या</strong>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.ui.typingTool.noteDesc}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
