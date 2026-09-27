'use client';

import { useState, useMemo } from 'react';

// ─── Common password lists (top 100 most common) ──────────────────────────────
const COMMON_PASSWORDS = new Set([
  'password','123456','12345678','qwerty','abc123','monkey','1234567','letmein','trustno1',
  'dragon','baseball','iloveyou','master','sunshine','ashley','bailey','shadow','123123',
  'password1','654321','superman','qazwsx','michael','football','password123','1234',
  '12345','1234567890','000000','11111111','admin','login','welcome','solo','princess',
  'starwars','charlie','donald','lovely','batman','666666','azerty','123456789','qwerty123',
]);

// Pattern checks
function hasSequentialChars(pw) {
  const sequences = ['abcdefghijklmnopqrstuvwxyz','0123456789','qwertyuiop','asdfghjkl','zxcvbnm'];
  const lower = pw.toLowerCase();
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      if (lower.includes(seq.substring(i, i + 3))) return true;
    }
  }
  return false;
}

function hasRepeatedChars(pw) {
  return /(.)\1{2,}/.test(pw);
}

function hasYearPattern(pw) {
  return /(?:19|20)\d{2}/.test(pw);
}

function hasDictionaryWord(pw) {
  const common = ['password','admin','login','welcome','master','dragon','monkey','shadow','sunshine'];
  const lower = pw.toLowerCase();
  return common.some(w => lower.includes(w));
}

function getCharsetSize(pw) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
  return size;
}

function calculateEntropy(pw) {
  const charsetSize = getCharsetSize(pw);
  if (charsetSize === 0 || pw.length === 0) return 0;
  return Math.round(pw.length * Math.log2(charsetSize));
}

function estimateCrackTime(entropy) {
  const guessesPerSec = 1e12;
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSec;
  if (seconds < 0.001) return 'Instant';
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 365 * 1e6) return `${Math.round(seconds / (86400 * 365))} years`;
  if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(1)} million years`;
  return `${(seconds / (86400 * 365 * 1e9)).toFixed(1)} billion years`;
}

export default function PasswordStrengthAnalyzer({ t, lang }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const analysis = useMemo(() => {
    if (!password) return null;

    const checks = {
      length: { pass: password.length >= 12, label: 'At least 12 characters', detail: `${password.length} characters` },
      uppercase: { pass: /[A-Z]/.test(password), label: 'Contains uppercase letters' },
      lowercase: { pass: /[a-z]/.test(password), label: 'Contains lowercase letters' },
      digits: { pass: /[0-9]/.test(password), label: 'Contains numbers' },
      symbols: { pass: /[^a-zA-Z0-9]/.test(password), label: 'Contains special characters' },
      noCommon: { pass: !COMMON_PASSWORDS.has(password.toLowerCase()), label: 'Not a common password', severity: 'critical' },
      noSequential: { pass: !hasSequentialChars(password), label: 'No sequential patterns (abc, 123, qwerty)' },
      noRepeated: { pass: !hasRepeatedChars(password), label: 'No repeated characters (aaa, 111)' },
      noYear: { pass: !hasYearPattern(password), label: 'No year patterns (1990, 2024)' },
      noDictionary: { pass: !hasDictionaryWord(password), label: 'No dictionary words' },
    };

    const passedCount = Object.values(checks).filter(c => c.pass).length;
    const totalChecks = Object.keys(checks).length;
    const entropy = calculateEntropy(password);
    const charsetSize = getCharsetSize(password);
    const crackTime = estimateCrackTime(entropy);

    // Score 0-100
    let score = Math.min(100, Math.round((passedCount / totalChecks) * 60 + Math.min(40, entropy * 0.4)));
    if (COMMON_PASSWORDS.has(password.toLowerCase())) score = Math.min(score, 5);

    let strength, color;
    if (score >= 90) { strength = 'Excellent'; color = '#10b981'; }
    else if (score >= 70) { strength = 'Strong'; color = '#22c55e'; }
    else if (score >= 50) { strength = 'Good'; color = '#eab308'; }
    else if (score >= 30) { strength = 'Fair'; color = '#f97316'; }
    else { strength = 'Weak'; color = '#ef4444'; }

    return { checks, passedCount, totalChecks, entropy, charsetSize, crackTime, score, strength, color };
  }, [password]);

  return (
    <div className="tool-workspace" style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* ── Input ── */}
      <div style={{ background: 'var(--bg-section)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <label style={{ fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '12px' }}>🔐 Enter Password to Analyze</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type or paste your password here..."
            autoComplete="off"
            style={{ width: '100%', padding: '16px 60px 16px 16px', fontSize: '1.2rem', fontFamily: 'monospace', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
          />
          <button onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
          🔒 100% client-side — your password never leaves your browser.
        </p>
      </div>

      {analysis && (
        <>
          {/* ── Score Dashboard ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: `${analysis.color}12`, border: `1px solid ${analysis.color}40`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Strength</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: analysis.color }}>{analysis.strength}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Score: {analysis.score}/100</div>
            </div>
            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Entropy</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{analysis.entropy} bits</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Charset: {analysis.charsetSize}</div>
            </div>
            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Crack Time</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>⏱️ {analysis.crackTime}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>@ 1 trillion/sec</div>
            </div>
          </div>

          {/* ── Strength Bar ── */}
          <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${analysis.score}%`, background: `linear-gradient(90deg, ${analysis.color}, ${analysis.color}cc)`, borderRadius: '4px', transition: 'width 0.5s ease, background 0.5s ease' }}></div>
          </div>

          {/* ── Security Checks ── */}
          <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
              🛡️ Security Checks ({analysis.passedCount}/{analysis.totalChecks} passed)
            </div>
            <div>
              {Object.entries(analysis.checks).map(([key, check]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 20px', borderBottom: '1px solid var(--border-light)',
                  background: check.pass ? 'transparent' : (check.severity === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)'),
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{check.pass ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.9rem', color: check.pass ? 'var(--text-primary)' : '#ef4444', fontWeight: check.pass ? 400 : 600 }}>
                      {check.label}
                    </span>
                    {check.detail && <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({check.detail})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recommendations ── */}
          {analysis.score < 70 && (
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#f59e0b' }}>💡 Recommendations</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                {password.length < 12 && <li>Increase password length to at least 12 characters</li>}
                {!/[A-Z]/.test(password) && <li>Add uppercase letters (A-Z)</li>}
                {!/[^a-zA-Z0-9]/.test(password) && <li>Include special characters (!@#$%^&*)</li>}
                {hasSequentialChars(password) && <li>Avoid sequential patterns like "abc", "123", or "qwerty"</li>}
                {hasRepeatedChars(password) && <li>Avoid repeating the same character three or more times</li>}
                {COMMON_PASSWORDS.has(password.toLowerCase()) && <li style={{ color: '#ef4444', fontWeight: 600 }}>This is one of the most common passwords — change it immediately!</li>}
                <li>Consider using a passphrase: combine 4+ random words with separators</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
