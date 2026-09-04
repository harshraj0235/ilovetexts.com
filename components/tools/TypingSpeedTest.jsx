'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Word banks ───────────────────────────────────────────────────────────────
const WORD_BANKS = {
  common: [
    'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
    'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
    'she','or','an','will','my','one','all','would','there','their','what','so','up',
    'out','if','about','who','get','which','go','me','when','make','can','like','time',
    'no','just','him','know','take','people','into','year','your','good','some','could',
    'them','see','other','than','then','now','look','only','come','its','over','think',
    'also','back','after','use','two','how','our','work','first','well','way','even',
    'new','want','because','any','these','give','day','most','us','great','between',
    'need','large','often','hand','high','place','hold','turn','help','move','live',
    'play','same','last','long','seem','feel','left','keep','call','right','become',
  ],
  sentences: [
    'the quick brown fox jumps over the lazy dog',
    'pack my box with five dozen liquor jugs',
    'how vexingly quick daft zebras jump',
    'the five boxing wizards jump quickly',
    'sphinx of black quartz judge my vow',
    'we promptly judged antique ivory buckles for the next prize',
    'a mad boxer shot a quick gloved jab to the jaw of his dizzy opponent',
    'the job requires extra pluck and zeal from every young wage earner',
    'jackdaws love my big sphinx of quartz',
    'fixing broken computers requires experience knowledge and patience',
    'programming is the art of telling another human what one wants the computer to do',
    'the best way to predict the future is to create it',
    'in the middle of every difficulty lies opportunity',
    'success is not final failure is not fatal it is the courage to continue that counts',
    'the only way to do great work is to love what you do',
  ],
  quotes: [
    'be yourself everyone else is already taken',
    'two things are infinite the universe and human stupidity and I am not sure about the universe',
    'so many books so little time',
    'a room without books is like a body without a soul',
    'you only live once but if you do it right once is enough',
    'in three words I can sum up everything I have learned about life it goes on',
    'if you tell the truth you do not have to remember anything',
    'a friend is someone who knows all about you and still loves you',
    'always forgive your enemies nothing annoys them so much',
    'to live is the rarest thing in the world most people just exist',
    'it is better to be hated for what you are than loved for what you are not',
    'we accept the love we think we deserve',
    'without music life would be a mistake',
    'I have not failed I have just found ten thousand ways that will not work',
    'the secret of getting ahead is getting started',
  ],
  code: [
    'const sum = (a, b) => a + b;',
    'function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }',
    'const arr = [1, 2, 3].map(x => x * 2);',
    'let obj = { name: "Alice", age: 30 };',
    'if (condition) { doSomething(); } else { doElse(); }',
    'for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }',
    'const promise = new Promise((resolve, reject) => { resolve(data); });',
    'import React, { useState, useEffect } from "react";',
    'export default function App() { return <div>Hello World</div>; }',
    'const fetch = async (url) => { const res = await fetch(url); return res.json(); };',
    'try { riskyOperation(); } catch (e) { console.error(e); }',
    'const filtered = items.filter(item => item.active === true);',
    'class Animal { constructor(name) { this.name = name; } }',
    'const [state, setState] = useState(null);',
    'document.querySelector(".btn").addEventListener("click", handler);',
  ],
};

const DURATIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
];

const MODES = [
  { label: 'Common Words', value: 'common' },
  { label: 'Sentences', value: 'sentences' },
  { label: 'Famous Quotes', value: 'quotes' },
  { label: 'Code', value: 'code' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePassage(mode, count = 60) {
  const bank = WORD_BANKS[mode];
  if (mode === 'sentences' || mode === 'quotes' || mode === 'code') {
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    const joined = shuffled.join(' ');
    return joined.split(' ').slice(0, count).join(' ');
  }
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(bank[Math.floor(Math.random() * bank.length)]);
  }
  return result.join(' ');
}

function calcStats(passage, typed, elapsed) {
  const words = passage.trim().split(' ');
  const typedWords = typed.trim().split(' ');
  let correct = 0, incorrect = 0;
  const errorMap = {}; // char → error count

  typedWords.forEach((w, i) => {
    const target = words[i] || '';
    if (w === target) {
      correct++;
    } else {
      incorrect++;
      // track which chars were wrong
      for (let ci = 0; ci < Math.max(w.length, target.length); ci++) {
        const ch = target[ci] || w[ci];
        if (w[ci] !== target[ci]) errorMap[ch] = (errorMap[ch] || 0) + 1;
      }
    }
  });

  const totalChars = typed.length;
  const correctChars = typedWords.reduce((acc, w, i) => {
    const t = words[i] || '';
    let c = 0;
    for (let ci = 0; ci < Math.min(w.length, t.length); ci++) {
      if (w[ci] === t[ci]) c++;
    }
    return acc + c;
  }, 0);

  const minutes = elapsed / 60;
  const grossWPM = minutes > 0 ? Math.round(totalChars / 5 / minutes) : 0;
  const netWPM = minutes > 0 ? Math.max(0, Math.round((correct) / minutes)) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  return { grossWPM, netWPM, accuracy, correct, incorrect, totalChars, errorMap };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TypingSpeedTest({ t, lang }) {
  const [mode, setMode] = useState('common');
  const [duration, setDuration] = useState(60);
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState('idle'); // idle | running | finished
  const [timeLeft, setTimeLeft] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [finalStats, setFinalStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ilt_typing_history') || '[]');
      setHistory(saved);
    } catch { /* ignore */ }
  }, []);

  // Build passage on mode change or reset
  useEffect(() => {
    const p = generatePassage(mode, 80);
    setPassage(p);
    setTyped('');
    setStatus('idle');
    setTimeLeft(duration);
    setElapsed(0);
    setFinalStats(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode, duration]);

  // Countdown timer
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStatus('finished');
            return 0;
          }
          return prev - 1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Compute stats when finished
  useEffect(() => {
    if (status === 'finished') {
      const stats = calcStats(passage, typed, elapsed || duration);
      setFinalStats(stats);
      // save to history
      const entry = {
        date: new Date().toLocaleDateString(),
        mode,
        duration,
        netWPM: stats.netWPM,
        grossWPM: stats.grossWPM,
        accuracy: stats.accuracy,
      };
      const updated = [entry, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('ilt_typing_history', JSON.stringify(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    if (status === 'idle') setStatus('running');
    if (status === 'finished') return;
    setTyped(val);
    // auto finish if passage complete
    const words = passage.trim().split(' ');
    const typedWords = val.trim().split(' ');
    if (typedWords.length >= words.length && val.endsWith(' ')) {
      clearInterval(timerRef.current);
      setStatus('finished');
      setElapsed(duration - timeLeft);
    }
  }, [status, passage, duration, timeLeft]);

  const handleReset = () => {
    clearInterval(timerRef.current);
    const p = generatePassage(mode, 80);
    setPassage(p);
    setTyped('');
    setStatus('idle');
    setTimeLeft(duration);
    setElapsed(0);
    setFinalStats(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Live stats during typing
  const liveStats = useMemo(() => {
    if (status === 'idle' || !typed) return null;
    return calcStats(passage, typed, elapsed || 1);
  }, [passage, typed, elapsed, status]);

  // Render passage with per-character coloring
  const renderedPassage = useMemo(() => {
    const passageChars = passage.split('');
    const typedChars = typed.split('');
    return passageChars.map((ch, i) => {
      let color = 'var(--text-tertiary, #9ca3af)';
      let bg = 'transparent';
      if (i < typedChars.length) {
        color = typedChars[i] === ch ? 'var(--text-primary)' : '#ef4444';
        if (typedChars[i] !== ch) bg = 'rgba(239,68,68,0.12)';
      } else if (i === typedChars.length) {
        bg = 'rgba(139,92,246,0.25)'; // cursor position
      }
      return { ch, color, bg };
    });
  }, [passage, typed]);

  const progressPct = Math.round(((duration - timeLeft) / duration) * 100);
  const bestWPM = history.length ? Math.max(...history.map(h => h.netWPM)) : 0;
  const avgWPM = history.length ? Math.round(history.reduce((a, h) => a + h.netWPM, 0) / history.length) : 0;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅ ' : '⚠️ '}{toast.message}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="trust-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mode selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode:</span>
            {MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                disabled={status === 'running'}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                  borderColor: mode === m.value ? '#8b5cf6' : 'var(--border-light)',
                  background: mode === m.value ? 'rgba(139,92,246,0.12)' : 'var(--bg-section)',
                  color: mode === m.value ? '#8b5cf6' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >{m.label}</button>
            ))}
          </div>
          {/* Duration selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time:</span>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                disabled={status === 'running'}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                  borderColor: duration === d.value ? '#8b5cf6' : 'var(--border-light)',
                  background: duration === d.value ? 'rgba(139,92,246,0.12)' : 'var(--bg-section)',
                  color: duration === d.value ? '#8b5cf6' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >{d.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main typing area ── */}
      {status !== 'finished' && (
        <div className="trust-card" style={{ padding: '28px', marginBottom: '20px' }}>
          {/* Timer bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '2.4rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#8b5cf6',
                lineHeight: 1,
              }}>{timeLeft}s</span>
              {status === 'idle' && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Start typing to begin…
                </span>
              )}
            </div>
            {/* Live WPM badge */}
            {liveStats && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', lineHeight: 1 }}>{liveStats.netWPM}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WPM</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: liveStats.accuracy >= 95 ? '#10b981' : liveStats.accuracy >= 80 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{liveStats.accuracy}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accuracy</div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', borderRadius: '2px', transition: 'width 1s linear' }} />
          </div>

          {/* Rendered passage */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '1.18rem', lineHeight: 1.85, letterSpacing: '0.02em',
              padding: '20px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-section)', border: '1px solid var(--border-light)',
              cursor: 'text', userSelect: 'none', marginBottom: '16px',
              maxHeight: '180px', overflow: 'hidden',
            }}
          >
            {renderedPassage.map(({ ch, color, bg }, i) => (
              <span key={i} style={{ color, background: bg, borderRadius: '2px' }}>
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>

          {/* Hidden textarea for input capture */}
          <textarea
            ref={inputRef}
            value={typed}
            onChange={handleInput}
            disabled={status === 'finished'}
            placeholder={status === 'idle' ? 'Click here and start typing...' : ''}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            style={{
              width: '100%', minHeight: '90px', fontFamily: '"Courier New", Courier, monospace',
              fontSize: '1.05rem', lineHeight: 1.7, padding: '14px 16px',
              borderRadius: 'var(--radius-md)', border: '2px solid',
              borderColor: status === 'running' ? '#8b5cf6' : 'var(--border-light)',
              background: 'var(--bg-main)', color: 'var(--text-primary)',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={handleReset} className="btn btn-secondary">
              🔄 Reset
            </button>
            <button
              onClick={() => { setStatus('finished'); clearInterval(timerRef.current); }}
              disabled={status === 'idle' || typed.length < 5}
              className="btn btn-secondary"
            >
              ⏹ Stop Early
            </button>
          </div>
        </div>
      )}

      {/* ── Results panel ── */}
      {status === 'finished' && finalStats && (
        <div style={{ marginBottom: '20px' }}>
          {/* Score cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Net WPM', value: finalStats.netWPM, icon: '⚡', color: '#8b5cf6', desc: 'Speed' },
              { label: 'Gross WPM', value: finalStats.grossWPM, icon: '⌨️', color: '#6366f1', desc: 'Raw Speed' },
              { label: 'Accuracy', value: `${finalStats.accuracy}%`, icon: '🎯', color: finalStats.accuracy >= 95 ? '#10b981' : finalStats.accuracy >= 80 ? '#f59e0b' : '#ef4444', desc: 'Precision' },
              { label: 'Correct', value: finalStats.correct, icon: '✅', color: '#10b981', desc: 'Words' },
              { label: 'Errors', value: finalStats.incorrect, icon: '❌', color: '#ef4444', desc: 'Words' },
            ].map(card => (
              <div key={card.label} className="trust-card" style={{ padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{card.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>{card.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Performance rating */}
          <div className="trust-card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>
                {finalStats.netWPM >= 100 ? '🏆' : finalStats.netWPM >= 70 ? '🌟' : finalStats.netWPM >= 50 ? '👍' : finalStats.netWPM >= 30 ? '📈' : '🌱'}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {finalStats.netWPM >= 100 ? 'Expert Typist!' : finalStats.netWPM >= 70 ? 'Above Average!' : finalStats.netWPM >= 50 ? 'Average — Keep Practicing' : finalStats.netWPM >= 30 ? 'Beginner — You\'re Improving' : 'Just Starting — Practice Daily'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Global average is ~40–60 WPM. Professional typists hit 70–100 WPM.
                  {bestWPM > 0 && ` Your personal best: ${bestWPM} WPM.`}
                </div>
              </div>
            </div>
          </div>

          {/* Error heatmap */}
          {Object.keys(finalStats.errorMap).length > 0 && (
            <div className="trust-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '14px', fontSize: '0.95rem', fontWeight: 700 }}>🔥 Error Heatmap — Characters You Struggled With</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(finalStats.errorMap)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 20)
                  .map(([ch, count]) => (
                    <div key={ch} style={{
                      padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                      background: `rgba(239,68,68,${Math.min(0.8, count * 0.15 + 0.2)})`,
                      color: '#fff', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem',
                      minWidth: '36px', textAlign: 'center',
                    }}>
                      {ch === ' ' ? '⎵' : ch}
                      <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{count}x</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleReset} className="btn-primary" style={{ padding: '10px 24px' }}>
              🔄 Try Again
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="btn btn-secondary">
              📊 {showHistory ? 'Hide' : 'Show'} History
            </button>
            <button
              onClick={() => {
                const text = `I scored ${finalStats.netWPM} WPM with ${finalStats.accuracy}% accuracy on ilovetexts.com Typing Speed Test!`;
                navigator.clipboard.writeText(text);
                showToast('Score copied!');
              }}
              className="btn btn-secondary"
            >
              📋 Share Score
            </button>
          </div>
        </div>
      )}

      {/* ── History ── */}
      {showHistory && history.length > 0 && (
        <div className="trust-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>📊 Your History (last 20 tests)</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
              <span>Best: <strong style={{ color: '#8b5cf6' }}>{bestWPM} WPM</strong></span>
              <span>Avg: <strong style={{ color: '#6366f1' }}>{avgWPM} WPM</strong></span>
            </div>
          </div>
          {/* Mini chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px', marginBottom: '16px' }}>
            {[...history].reverse().map((h, i) => {
              const maxWPM = Math.max(...history.map(x => x.netWPM), 1);
              const pct = (h.netWPM / maxWPM) * 100;
              return (
                <div key={i} title={`${h.netWPM} WPM (${h.date})`} style={{
                  flex: 1, background: `rgba(139,92,246,${0.4 + (pct / 100) * 0.6})`,
                  borderRadius: '3px 3px 0 0', height: `${Math.max(8, pct)}%`,
                  transition: 'height 0.3s', cursor: 'default',
                }} />
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem', border: '1px solid var(--border-light)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{h.date} · {h.mode} · {h.duration}s</span>
                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{h.netWPM} WPM <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>/ {h.accuracy}%</span></span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setHistory([]); localStorage.removeItem('ilt_typing_history'); }}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            🗑 Clear History
          </button>
        </div>
      )}

      {/* ── Tips ── */}
      {status === 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
          {[
            { icon: '👆', tip: 'Use all 10 fingers with proper home row position (ASDF JKL;)' },
            { icon: '👀', tip: 'Keep your eyes on the passage, not your keyboard' },
            { icon: '🎯', tip: 'Aim for accuracy first — speed follows naturally' },
            { icon: '⏰', tip: 'Practice 10–15 minutes daily for steady improvement' },
          ].map(({ icon, tip }, i) => (
            <div key={i} className="trust-card" style={{ padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
