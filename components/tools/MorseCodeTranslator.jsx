'use client';

import { useState, useMemo, useRef, useCallback } from 'react';

// ─── Morse Code Mapping ───────────────────────────────────────────────────────
const CHAR_TO_MORSE = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.', "'": '.----.',
};

const MORSE_TO_CHAR = Object.fromEntries(Object.entries(CHAR_TO_MORSE).map(([k, v]) => [v, k]));

function textToMorse(text) {
  return text.toUpperCase().split('').map(ch => {
    if (ch === ' ') return '/';
    return CHAR_TO_MORSE[ch] || '';
  }).filter(Boolean).join(' ');
}

function morseToText(morse) {
  return morse.split(' / ').map(word =>
    word.split(' ').map(code => MORSE_TO_CHAR[code] || '').join('')
  ).join(' ');
}

export default function MorseCodeTranslator({ t, lang }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text-to-morse'); // text-to-morse | morse-to-text
  const [toast, setToast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // WPM multiplier
  const audioCtxRef = useRef(null);
  const stopRef = useRef(false);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (mode === 'text-to-morse') return textToMorse(input);
    return morseToText(input);
  }, [input, mode]);

  const morseOutput = mode === 'text-to-morse' ? output : input;

  // Visual representation
  const visualMorse = useMemo(() => {
    if (!morseOutput) return [];
    return morseOutput.split(' ').map(code => {
      if (code === '/') return { type: 'space', display: '   ' };
      return { type: 'code', code, char: MORSE_TO_CHAR[code] || '?', symbols: code.split('') };
    });
  }, [morseOutput]);

  // Audio playback
  const playMorse = useCallback(async () => {
    if (!morseOutput || isPlaying) return;
    stopRef.current = false;
    setIsPlaying(true);

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const freq = 600;
    const dotDuration = 0.08 / speed;
    const dashDuration = dotDuration * 3;
    const symbolGap = dotDuration;
    const charGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    let time = ctx.currentTime + 0.1;

    for (const ch of morseOutput) {
      if (stopRef.current) break;
      if (ch === '.') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, time);
        osc.start(time); osc.stop(time + dotDuration);
        time += dotDuration + symbolGap;
      } else if (ch === '-') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, time);
        osc.start(time); osc.stop(time + dashDuration);
        time += dashDuration + symbolGap;
      } else if (ch === ' ') {
        time += charGap;
      } else if (ch === '/') {
        time += wordGap;
      }
    }

    // Wait for playback to finish
    const totalDuration = (time - ctx.currentTime) * 1000;
    await new Promise(resolve => setTimeout(resolve, Math.max(totalDuration, 100)));
    setIsPlaying(false);
  }, [morseOutput, isPlaying, speed]);

  const stopMorse = () => {
    stopRef.current = true;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      showToast('Copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'text-to-morse' ? 'morse-to-text' : 'text-to-morse');
  };

  return (
    <div className="tool-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-section)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button onClick={() => setMode('text-to-morse')}
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              background: mode === 'text-to-morse' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'text-to-morse' ? '#fff' : 'var(--text-secondary)' }}>
            ABC → ·−·
          </button>
          <button onClick={() => setMode('morse-to-text')}
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              background: mode === 'morse-to-text' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'morse-to-text' ? '#fff' : 'var(--text-secondary)' }}>
            ·−· → ABC
          </button>
        </div>

        {morseOutput && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={isPlaying ? stopMorse : playMorse}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: isPlaying ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: isPlaying ? '#ef4444' : '#10b981' }}>
              {isPlaying ? '⏹️ Stop' : '🔊 Play Audio'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Speed:</span>
              <input type="range" min="0.5" max="3" step="0.25" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '80px', accentColor: 'var(--brand-color)' }} />
              <span style={{ fontWeight: 600 }}>{speed}x</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Visual Morse ── */}
      {visualMorse.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {visualMorse.map((item, i) => (
            item.type === 'space' ? (
              <span key={i} style={{ width: '20px' }}></span>
            ) : (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {item.symbols.map((s, j) => (
                    <span key={j} style={{
                      display: 'inline-block',
                      width: s === '.' ? '8px' : '24px', height: '8px',
                      borderRadius: s === '.' ? '50%' : '4px',
                      background: 'var(--brand-color)',
                    }}></span>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{item.char}</span>
              </div>
            )
          ))}
        </div>
      )}

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'start' }}>
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'text-to-morse' ? '📝 Text' : '📡 Morse Code'}</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'text-to-morse' ? 'Type text to convert to Morse code...\n\nExample: HELLO WORLD' : 'Type Morse code (use . and - separated by spaces, / for word gaps)\n\nExample: .... . .-.. .-.. --- / .-- --- .-. .-.. -..'}
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', fontFamily: 'monospace', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' }}>
          <button onClick={handleSwap}
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--border-light)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            title="Swap"
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
          >⇄</button>
        </div>

        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{mode === 'text-to-morse' ? '📡 Morse Code' : '📝 Text'}</span>
            <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy</button>
          </div>
          <textarea
            className="code-editor"
            value={output}
            readOnly
            placeholder="Result will appear here..."
            spellCheck="false"
            style={{ height: '350px', resize: 'vertical', fontFamily: 'monospace', fontSize: '1rem', background: 'var(--bg-section)' }}
          />
        </div>
      </div>

      {/* ── Reference Chart ── */}
      <div style={{ marginTop: '24px', background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
          📖 Morse Code Reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1px', background: 'var(--border-light)', padding: '1px' }}>
          {Object.entries(CHAR_TO_MORSE).slice(0, 36).map(([char, code]) => (
            <div key={char} style={{ padding: '8px 12px', background: 'var(--bg-white)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-color)' }}>{char}</div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)', letterSpacing: '2px' }}>{code}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
