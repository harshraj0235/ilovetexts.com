'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

// ─── Character sets ────────────────────────────────────────────────────────────
const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'lI1O0',
  brackets: '[]{}()',
  similar: 'il1Lo0O',
};

const WORD_LIST = [
  'apple','brave','cloud','dream','eagle','flame','grape','heart','ivory','jolly',
  'karma','lemon','magic','noble','ocean','pearl','quest','river','solar','tiger',
  'ultra','vivid','wheat','xenon','yacht','zebra','amber','blaze','coral','delta',
  'ember','frost','glyph','haven','index','jewel','knack','lunar','maple','nexus',
  'oasis','prism','quail','raven','storm','torch','unity','vapor','woven','xerox',
  'yield','zonal','arrow','bloom','charm','drift','elite','forge','gleam','haste',
  'indie','joust','kneel','leapt','morse','night','orbit','plumb','quirk','ridge',
  'shade','thorn','unify','vault','whirl','oxide','youth','zesty',
];

function generatePassword(options) {
  let charset = '';
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.digits) charset += CHARSETS.digits;
  if (options.symbols) charset += CHARSETS.symbols;

  if (options.excludeAmbiguous) {
    for (const ch of CHARSETS.ambiguous) {
      charset = charset.replace(ch, '');
    }
  }
  if (options.customExclude) {
    for (const ch of options.customExclude) {
      charset = charset.split(ch).join('');
    }
  }

  if (!charset) return '';

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, v => charset[v % charset.length]).join('');
}

function generatePassphrase(wordCount, separator = '-') {
  const array = new Uint32Array(wordCount);
  crypto.getRandomValues(array);
  return Array.from(array, v => {
    const word = WORD_LIST[v % WORD_LIST.length];
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(separator);
}

function calculateEntropy(password, charsetSize) {
  if (!password || charsetSize <= 1) return 0;
  return Math.round(password.length * Math.log2(charsetSize));
}

function getStrengthInfo(entropy) {
  if (entropy >= 128) return { label: 'Excellent', color: '#10b981', pct: 100, emoji: '🟢' };
  if (entropy >= 80) return { label: 'Strong', color: '#22c55e', pct: 85, emoji: '🟢' };
  if (entropy >= 60) return { label: 'Good', color: '#eab308', pct: 65, emoji: '🟡' };
  if (entropy >= 40) return { label: 'Fair', color: '#f97316', pct: 45, emoji: '🟠' };
  return { label: 'Weak', color: '#ef4444', pct: 25, emoji: '🔴' };
}

function estimateCrackTime(entropy) {
  const guessesPerSecond = 1e12; // 1 trillion (modern GPU)
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSecond;
  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 365 * 1e6) return `${Math.round(seconds / (86400 * 365))} years`;
  if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(1)} million years`;
  return `${(seconds / (86400 * 365 * 1e9)).toFixed(1)} billion years`;
}

export default function PasswordGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('password'); // password | passphrase
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState([]);

  // Character options
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [customExclude, setCustomExclude] = useState('');

  // Passphrase options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Calculate charset size
  const charsetSize = useMemo(() => {
    let size = 0;
    if (uppercase) size += 26;
    if (lowercase) size += 26;
    if (digits) size += 10;
    if (symbols) size += CHARSETS.symbols.length;
    if (excludeAmbiguous) size -= CHARSETS.ambiguous.length;
    return Math.max(size, 1);
  }, [uppercase, lowercase, digits, symbols, excludeAmbiguous]);

  const generate = useCallback(() => {
    const num = Math.min(Math.max(parseInt(count, 10) || 1, 1), 500);
    const results = [];
    for (let i = 0; i < num; i++) {
      if (mode === 'passphrase') {
        results.push(generatePassphrase(wordCount, separator));
      } else {
        results.push(generatePassword({ length, uppercase, lowercase, digits, symbols, excludeAmbiguous, customExclude }));
      }
    }
    setPasswords(results);
    showToast(`Generated ${num} ${mode === 'passphrase' ? 'passphrase' : 'password'}${num > 1 ? 's' : ''}!`);
  }, [mode, length, count, uppercase, lowercase, digits, symbols, excludeAmbiguous, customExclude, wordCount, separator]);

  // Auto-generate on mount
  useEffect(() => { generate(); }, []);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(passwords.join('\n'));
      showToast('All passwords copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  // Entropy for first password
  const firstPw = passwords[0] || '';
  const entropy = mode === 'passphrase'
    ? Math.round(wordCount * Math.log2(WORD_LIST.length))
    : calculateEntropy(firstPw, charsetSize);
  const strength = getStrengthInfo(entropy);
  const crackTime = estimateCrackTime(entropy);

  return (
    <div className="tool-workspace" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Strength Dashboard ── */}
      {passwords.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: `${strength.color}12`, border: `1px solid ${strength.color}40`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Strength</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: strength.color }}>{strength.emoji} {strength.label}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Entropy</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>{entropy} bits</div>
          </div>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Crack Time</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>⏱️ {crackTime}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Charset Size</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{mode === 'passphrase' ? WORD_LIST.length : charsetSize}</div>
          </div>
        </div>
      )}

      {/* ── Strength Bar ── */}
      {passwords.length > 0 && (
        <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${strength.pct}%`, background: `linear-gradient(90deg, ${strength.color}, ${strength.color}cc)`, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ background: 'var(--bg-section)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-white)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button onClick={() => setMode('password')}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              background: mode === 'password' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'password' ? '#fff' : 'var(--text-secondary)' }}>
            🔑 Password
          </button>
          <button onClick={() => setMode('passphrase')}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              background: mode === 'passphrase' ? 'var(--brand-color)' : 'transparent',
              color: mode === 'passphrase' ? '#fff' : 'var(--text-secondary)' }}>
            📖 Passphrase
          </button>
        </div>

        {mode === 'password' ? (
          <>
            {/* Length Slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Length</label>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-color)', fontFamily: 'monospace' }}>{length}</span>
              </div>
              <input type="range" min="4" max="128" value={length} onChange={(e) => setLength(parseInt(e.target.value))}
                style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: 'var(--brand-color)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span>4</span><span>128</span>
              </div>
            </div>

            {/* Character Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {[
                { state: uppercase, set: setUppercase, label: 'Uppercase (A-Z)', icon: '🔠' },
                { state: lowercase, set: setLowercase, label: 'Lowercase (a-z)', icon: '🔡' },
                { state: digits, set: setDigits, label: 'Numbers (0-9)', icon: '🔢' },
                { state: symbols, set: setSymbols, label: 'Symbols (!@#$)', icon: '✳️' },
                { state: excludeAmbiguous, set: setExcludeAmbiguous, label: 'No Ambiguous', icon: '👁️' },
              ].map(opt => (
                <button key={opt.label} onClick={() => opt.set(!opt.state)}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: opt.state ? '2px solid var(--brand-color)' : '1px solid var(--border-light)',
                    background: opt.state ? 'rgba(139,92,246,0.08)' : 'var(--bg-white)',
                    color: opt.state ? 'var(--brand-color)' : 'var(--text-tertiary)',
                    fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                  }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Exclude */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Exclude Characters</label>
              <input type="text" value={customExclude} onChange={(e) => setCustomExclude(e.target.value)}
                placeholder="e.g. {}[]|" style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', marginTop: '6px' }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Word Count</label>
                <input type="number" min="2" max="12" value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value) || 4)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Separator</label>
                <select value={separator} onChange={(e) => setSeparator(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)' }}>
                  <option value="-">Hyphen (-)</option>
                  <option value=" ">Space</option>
                  <option value=".">Period (.)</option>
                  <option value="_">Underscore (_)</option>
                  <option value="">None</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Quantity */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 120px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Quantity</label>
            <input type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)' }} />
          </div>
          <button onClick={generate} className="action-btn primary"
            style={{ flex: 1, padding: '14px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            🎲 Generate
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      {passwords.length > 0 && (
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Generated {mode === 'passphrase' ? 'Passphrases' : 'Passwords'}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={generate} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>🔄 Regenerate</button>
              <button onClick={handleCopyAll} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy All</button>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {passwords.map((pw, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 20px', borderBottom: '1px solid var(--border-light)',
                background: i % 2 === 0 ? 'transparent' : 'var(--bg-white)',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', wordBreak: 'break-all', flex: 1, marginRight: '12px', letterSpacing: '0.5px' }}>{pw}</span>
                <button onClick={() => handleCopy(pw)}
                  style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
