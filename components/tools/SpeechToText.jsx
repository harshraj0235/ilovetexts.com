'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Language list for speech recognition ─────────────────────────────────────
const SPEECH_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'es-ES', label: 'Español (Spain)' },
  { code: 'es-MX', label: 'Español (Mexico)' },
  { code: 'pt-BR', label: 'Português (Brazil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'de-DE', label: 'Deutsch (German)' },
  { code: 'fr-FR', label: 'Français (French)' },
  { code: 'it-IT', label: 'Italiano (Italian)' },
  { code: 'id-ID', label: 'Bahasa Indonesia' },
  { code: 'ja-JP', label: '日本語 (Japanese)' },
  { code: 'ko-KR', label: '한국어 (Korean)' },
  { code: 'zh-CN', label: '中文 (Simplified)' },
  { code: 'zh-TW', label: '中文 (Traditional)' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
  { code: 'ru-RU', label: 'Русский (Russian)' },
  { code: 'nl-NL', label: 'Nederlands (Dutch)' },
  { code: 'pl-PL', label: 'Polski (Polish)' },
  { code: 'tr-TR', label: 'Türkçe (Turkish)' },
  { code: 'sv-SE', label: 'Svenska (Swedish)' },
  { code: 'da-DK', label: 'Dansk (Danish)' },
  { code: 'fi-FI', label: 'Suomi (Finnish)' },
  { code: 'nb-NO', label: 'Norsk (Norwegian)' },
  { code: 'uk-UA', label: 'Українська (Ukrainian)' },
  { code: 'cs-CZ', label: 'Čeština (Czech)' },
  { code: 'ro-RO', label: 'Română (Romanian)' },
  { code: 'hu-HU', label: 'Magyar (Hungarian)' },
  { code: 'el-GR', label: 'Ελληνικά (Greek)' },
  { code: 'he-IL', label: 'עברית (Hebrew)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'ur-PK', label: 'اردو (Urdu)' },
  { code: 'vi-VN', label: 'Tiếng Việt (Vietnamese)' },
  { code: 'th-TH', label: 'ภาษาไทย (Thai)' },
  { code: 'ms-MY', label: 'Bahasa Melayu (Malay)' },
  { code: 'ca-ES', label: 'Català (Catalan)' },
];

function getWordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function getCharCount(text) {
  return text.length;
}

export default function SpeechToText({ t, lang }) {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | listening | paused | error | unsupported
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [continuous, setContinuous] = useState(true);
  const [autoStop, setAutoStop] = useState(false);
  const [punctuate, setPunctuate] = useState(false);
  const [toast, setToast] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [langSearch, setLangSearch] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const textareaRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Check browser support ──
  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) setStatus('unsupported');
  }, [isSupported]);

  // ── Elapsed timer ──
  useEffect(() => {
    if (isListening) {
      startTimeRef.current = startTimeRef.current || Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      if (status === 'idle') {
        setElapsedTime(0);
        startTimeRef.current = null;
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isListening, status]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const applySentencePunctuation = (text) => {
    // Capitalize after periods, question marks, exclamation marks
    return text.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  };

  // ── Start recognition ──
  const startListening = useCallback(() => {
    if (!isSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = selectedLang;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setInterimText('');
    };

    rec.onresult = (event) => {
      let finalPart = '';
      let interimPart = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalPart += r[0].transcript;
        } else {
          interimPart += r[0].transcript;
        }
      }
      if (finalPart) {
        const toAdd = punctuate ? applySentencePunctuation(finalPart) : finalPart;
        setTranscript(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + toAdd.trim());
        setInterimText('');
      } else {
        setInterimText(interimPart);
      }
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech') return; // benign
      if (event.error === 'not-allowed') {
        setStatus('error');
        showToast('Microphone access denied. Please allow microphone access and retry.', 'error');
        setIsListening(false);
        return;
      }
      showToast(`Recognition error: ${event.error}`, 'warning');
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText('');
      if (status !== 'error' && status !== 'idle') {
        setStatus(prev => prev === 'listening' ? 'paused' : prev);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isSupported, selectedLang, continuous, punctuate, status, showToast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus('idle');
    setInterimText('');
    startTimeRef.current = null;
    setElapsedTime(0);
  }, []);

  const pauseListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus('paused');
  }, []);

  const resumeListening = useCallback(() => {
    setStatus('listening');
    startListening();
  }, [startListening]);

  // ── Handle toggle main button ──
  const handleMainButton = () => {
    if (status === 'idle' || status === 'paused') {
      startListening();
    } else if (status === 'listening') {
      pauseListening();
    }
  };

  const handleStop = () => stopListening();

  // ── Download ──
  const downloadTxt = () => {
    if (!transcript.trim()) { showToast('Nothing to download', 'warning'); return; }
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  };

  const handleCopy = () => {
    if (!transcript.trim()) { showToast('Nothing to copy', 'warning'); return; }
    navigator.clipboard.writeText(transcript);
    showToast('Copied to clipboard!');
  };

  const handleClear = () => {
    if (transcript && !confirm('Clear the transcript?')) return;
    setTranscript('');
    setElapsedTime(0);
    startTimeRef.current = null;
    setStatus('idle');
  };

  const filteredLangs = langSearch
    ? SPEECH_LANGUAGES.filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase()) || l.code.toLowerCase().includes(langSearch.toLowerCase()))
    : SPEECH_LANGUAGES;

  const selectedLangLabel = SPEECH_LANGUAGES.find(l => l.code === selectedLang)?.label || selectedLang;

  const wordCount = getWordCount(transcript);
  const charCount = getCharCount(transcript);

  if (status === 'unsupported') {
    return (
      <div className="trust-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌐</div>
        <h2 style={{ marginBottom: '12px' }}>Browser Not Supported</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          The Web Speech API requires <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or another Chromium-based browser on desktop or Android.
        </p>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Safari and Firefox have limited or no support for the Speech Recognition API.
        </p>
        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-section)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <strong>Tip:</strong> Open this page in Chrome or Edge to use Speech to Text.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {/* ── Settings row ── */}
      <div className="trust-card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Language picker */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <button
              onClick={() => setShowLangPicker(p => !p)}
              style={{
                width: '100%', padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-light)', background: 'var(--bg-section)',
                color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                fontSize: '0.88rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between',
              }}>
              🌍 {selectedLangLabel} <span>▾</span>
            </button>
            {showLangPicker && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 200,
                background: 'var(--bg-white, #fff)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                width: '260px', maxHeight: '280px', overflowY: 'auto',
              }}>
                <div style={{ padding: '8px' }}>
                  <input
                    autoFocus value={langSearch} onChange={e => setLangSearch(e.target.value)}
                    placeholder="Search language…"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.83rem', boxSizing: 'border-box' }}
                  />
                </div>
                {filteredLangs.map(l => (
                  <div key={l.code} onClick={() => { setSelectedLang(l.code); setShowLangPicker(false); setLangSearch(''); }}
                    style={{
                      padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem',
                      background: selectedLang === l.code ? 'rgba(139,92,246,0.1)' : 'transparent',
                      color: selectedLang === l.code ? '#8b5cf6' : 'var(--text-primary)',
                    }}>
                    {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          {[
            { label: 'Continuous', state: continuous, set: setContinuous, tip: 'Keep listening until you pause' },
            { label: 'Auto-Punctuate', state: punctuate, set: setPunctuate, tip: 'Capitalize after sentence endings' },
          ].map(toggle => (
            <label key={toggle.label} title={toggle.tip} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}>
              <div
                onClick={() => toggle.set(v => !v)}
                style={{
                  width: '38px', height: '20px', borderRadius: '10px', position: 'relative', cursor: 'pointer',
                  background: toggle.state ? '#8b5cf6' : 'var(--border-light)', transition: 'background 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: '2px', left: toggle.state ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{toggle.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Mic visualizer + controls ── */}
      <div className="trust-card" style={{ padding: '28px', marginBottom: '16px', textAlign: 'center' }}>
        {/* Animated mic button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleMainButton}
            disabled={status === 'error'}
            style={{
              width: '96px', height: '96px', borderRadius: '50%', border: 'none',
              background: isListening
                ? 'linear-gradient(135deg,#ef4444,#f87171)'
                : 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
              cursor: 'pointer', fontSize: '2.5rem', color: '#fff',
              boxShadow: isListening
                ? '0 0 0 8px rgba(239,68,68,0.15), 0 0 0 16px rgba(239,68,68,0.08)'
                : '0 4px 20px rgba(139,92,246,0.4)',
              transition: 'all 0.3s',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              position: 'relative',
            }}
            title={isListening ? 'Pause' : status === 'paused' ? 'Resume' : 'Start listening'}
          >
            {isListening ? '⏸' : status === 'paused' ? '▶️' : '🎤'}
          </button>
          <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 8px rgba(239,68,68,0.15),0 0 0 16px rgba(239,68,68,0.08)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0.2),0 0 0 24px rgba(239,68,68,0.04)} }`}</style>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: 600,
            background: isListening ? 'rgba(239,68,68,0.1)' : status === 'paused' ? 'rgba(245,158,11,0.1)' : 'var(--bg-section)',
            color: isListening ? '#ef4444' : status === 'paused' ? '#f59e0b' : 'var(--text-secondary)',
            border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : status === 'paused' ? 'rgba(245,158,11,0.3)' : 'var(--border-light)'}`,
          }}>
            {isListening && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
            {isListening ? `Listening… ${formatTime(elapsedTime)}` : status === 'paused' ? `Paused — ${formatTime(elapsedTime)} recorded` : 'Click the mic to start'}
          </div>
        </div>

        {/* Interim text preview */}
        {interimText && (
          <div style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)',
            color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic',
            marginBottom: '16px',
          }}>
            {interimText}
          </div>
        )}

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {status === 'listening' && (
            <button onClick={handleStop} className="btn btn-secondary">⏹ Stop</button>
          )}
          {status === 'paused' && (
            <>
              <button onClick={resumeListening} className="btn-primary" style={{ padding: '8px 20px' }}>▶ Resume</button>
              <button onClick={handleStop} className="btn btn-secondary">⏹ Stop</button>
            </>
          )}
          {status === 'idle' && transcript && (
            <button onClick={handleClear} className="btn btn-secondary">🗑 Clear</button>
          )}
        </div>
      </div>

      {/* ── Transcript area ── */}
      <div className="trust-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>📄 Transcript</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
              {wordCount} words · {charCount} chars
            </span>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>📋 Copy</button>
            <button onClick={downloadTxt} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>⬇ TXT</button>
            <button onClick={handleClear} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>🗑 Clear</button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Your speech will appear here. You can also edit this text directly."
          style={{
            width: '100%', minHeight: '200px', maxHeight: '480px',
            fontFamily: 'system-ui, sans-serif', fontSize: '1rem',
            lineHeight: 1.75, padding: '16px',
            border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-main)', color: 'var(--text-primary)',
            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Quick tips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px' }}>
        {[
          { icon: '🌍', tip: 'Select your language from the dropdown before starting.' },
          { icon: '✏️', tip: 'Click anywhere in the transcript to edit and correct words.' },
          { icon: '⏸', tip: 'Pause and resume without losing your transcript.' },
          { icon: '⬇️', tip: 'Download your transcript as a .txt file anytime.' },
        ].map(({ icon, tip }, i) => (
          <div key={i} className="trust-card" style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
