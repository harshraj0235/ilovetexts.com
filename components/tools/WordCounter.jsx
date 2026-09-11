'use client';

// ═══════════════════════════════════════════════════════
// Word Counter — Advanced SEO Text Analyzer
// Target keywords:
//   • "word counter online free" (~550K/mo)
//   • "character counter" (~450K/mo)
//   • "word count checker" (~110K/mo)
//   • "online word counter with keyword density" (long-tail)
//   • "readability score checker free" (long-tail)
//   • "free word counter for essays" (long-tail)
//   • "count words in text" (~90K/mo)
// Beats competitors: no signup, bi+trigrams, sentiment,
//   social limits, SEO score, goals, export — all free.
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  countWords, countCharacters, countCharactersNoSpaces,
  countSentences, countParagraphs, countSyllables,
  getReadingTime, getSpeakingTime,
  getReadabilityScore, getKeywordDensity, getSentimentAnalysis
} from '@/lib/text-processors';

// ─── Constants ────────────────────────────────────────
const SOCIAL_LIMITS = [
  { name: 'X / Twitter',   icon: '𝕏', limit: 280,   color: '#000' },
  { name: 'Instagram',     icon: '📸', limit: 2200,  color: '#E1306C' },
  { name: 'Instagram Bio', icon: '👤', limit: 150,   color: '#833AB4' },
  { name: 'LinkedIn Post', icon: '💼', limit: 3000,  color: '#0A66C2' },
  { name: 'Facebook',      icon: '📘', limit: 63206, color: '#1877F2' },
  { name: 'YouTube Title', icon: '▶️', limit: 100,   color: '#FF0000' },
  { name: 'Pinterest',     icon: '📌', limit: 500,   color: '#E60023' },
  { name: 'TikTok',        icon: '🎵', limit: 2200,  color: '#000' },
  { name: 'Meta Title',    icon: '🔍', limit: 60,    color: '#4285F4' },
  { name: 'Meta Desc.',    icon: '📝', limit: 160,   color: '#34A853' },
];

const READABILITY_COLORS = {
  'Very Easy':       '#22c55e',
  'Easy':            '#84cc16',
  'Fairly Easy':     '#a3e635',
  'Standard':        '#facc15',
  'Fairly Difficult':'#fb923c',
  'Difficult':       '#f87171',
  'Very Difficult':  '#ef4444',
};

const GOALS = [
  { label: 'Blog Post',          words: 1500, chars: 8000 },
  { label: 'Short Blog',         words: 800,  chars: 4500 },
  { label: 'Essay (500w)',        words: 500,  chars: 3000 },
  { label: 'Essay (1000w)',       words: 1000, chars: 5500 },
  { label: 'Tweet',              words: 50,   chars: 280  },
  { label: 'LinkedIn Post',      words: 300,  chars: 1800 },
  { label: 'Product Description',words: 200,  chars: 1200 },
  { label: 'Custom',             words: 0,    chars: 0    },
];

// ─── Sub-components ────────────────────────────────────

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg-main)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      textAlign: 'center',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {icon && <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{icon}</div>}
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{
        height: '100%', borderRadius: '3px',
        width: `${pct}%`,
        background: over ? '#ef4444' : color,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

function SectionTitle({ children, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: 0 }}>{children}</h3>
      {badge && <span style={{ fontSize: '0.72rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-full)', padding: '2px 8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{badge}</span>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────
export default function WordCounter({ t, lang }) {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | seo | social | goals
  const [goalIndex, setGoalIndex] = useState(0);
  const [customGoalWords, setCustomGoalWords] = useState(500);
  const [customGoalChars, setCustomGoalChars] = useState(3000);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const textareaRef = useRef(null);
  const historyTimer = useRef(null);

  // ─── Computed stats (live, debounced for heavy ops) ───
  const words        = countWords(text);
  const chars        = countCharacters(text);
  const charsNoSpace = countCharactersNoSpaces(text);
  const sentences    = countSentences(text);
  const paragraphs   = countParagraphs(text);
  const syllables    = countSyllables(text);
  const lines        = text ? text.split('\n').length : 0;

  const [heavyStats, setHeavyStats] = useState({
    readingTime:   { minutes: 0, seconds: 0 },
    speakingTime:  { minutes: 0, seconds: 0 },
    readability:   { score: 0, level: 'N/A', grade: 'N/A' },
    density:       { single: [], biGrams: [], triGrams: [] },
    sentiment:     { sentiment: 'Neutral', score: 0, emoji: '😐' },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!text.trim()) {
        setHeavyStats({
          readingTime:  { minutes: 0, seconds: 0 },
          speakingTime: { minutes: 0, seconds: 0 },
          readability:  { score: 0, level: 'N/A', grade: 'N/A' },
          density:      { single: [], biGrams: [], triGrams: [] },
          sentiment:    { sentiment: 'Neutral', score: 0, emoji: '😐' },
        });
        return;
      }
      setHeavyStats({
        readingTime:  getReadingTime(text),
        speakingTime: getSpeakingTime(text),
        readability:  getReadabilityScore(text),
        density:      getKeywordDensity(text, 12),
        sentiment:    getSentimentAnalysis(text),
      });
    }, 120); // debounce heavy ops
    return () => clearTimeout(timer);
  }, [text]);

  // ─── Undo / Redo ──────────────────────────────────────
  const pushHistory = useCallback((val) => {
    clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      setHistory(prev => {
        const trimmed = prev.slice(0, historyIndex + 1);
        if (trimmed[trimmed.length - 1] === val) return prev;
        return [...trimmed, val].slice(-50); // keep max 50
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 400);
  }, [historyIndex]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    pushHistory(val);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setText(history[newIdx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setText(history[newIdx]);
    }
  };

  // ─── Keyboard shortcuts ───────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ─── File drag & drop ─────────────────────────────────
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        let out = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          out += tc.items.map(item => item.str).join(' ') + '\n\n';
        }
        setText(out.trim());
      } catch { /* ignore */ }
    } else {
      const reader = new FileReader();
      reader.onload = ev => setText(ev.target.result);
      reader.readAsText(file);
    }
  };

  // ─── File upload button ───────────────────────────────
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setText(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Actions ──────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setText('');
    setHistory(['']);
    setHistoryIndex(0);
  };

  const handlePaste = async () => {
    try { setText(await navigator.clipboard.readText()); } catch {}
  };

  const handleExport = () => {
    const { readingTime, speakingTime, readability, sentiment, density } = heavyStats;
    const report = [
      '=== ilovetexts.com — Word Count Report ===',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '── BASIC STATS ──',
      `Words:           ${words.toLocaleString()}`,
      `Characters:      ${chars.toLocaleString()}`,
      `Chars (no space):${charsNoSpace.toLocaleString()}`,
      `Sentences:       ${sentences}`,
      `Paragraphs:      ${paragraphs}`,
      `Lines:           ${lines}`,
      `Syllables:       ${syllables}`,
      '',
      '── TIMING ──',
      `Reading Time:  ${readingTime.minutes}m ${readingTime.seconds % 60}s  (@ 238 wpm)`,
      `Speaking Time: ${speakingTime.minutes}m ${speakingTime.seconds}s  (@ 150 wpm)`,
      '',
      '── READABILITY ──',
      `Score: ${readability.score}/100  Level: ${readability.level}  Grade: ${readability.grade}`,
      '',
      '── SENTIMENT ──',
      `${sentiment.sentiment} ${sentiment.emoji}  (score: ${sentiment.score > 0 ? '+' : ''}${sentiment.score})`,
      '',
      '── TOP KEYWORDS ──',
      ...(density.single.slice(0, 10).map(k => `  ${k.word.padEnd(20)} ${k.count}×  (${k.density}%)`)),
      '',
      '── 2-WORD PHRASES ──',
      ...(density.biGrams.slice(0, 5).map(k => `  ${k.word.padEnd(30)} ${k.count}×`)),
      '',
      '── 3-WORD PHRASES ──',
      ...(density.triGrams.slice(0, 5).map(k => `  ${k.word.padEnd(40)} ${k.count}×`)),
      '',
      '── TEXT ──',
      text,
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `word-count-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  // ─── Helpers ──────────────────────────────────────────
  const fmtTime = (t) => t.minutes > 0 ? `${t.minutes}m ${t.seconds % 60}s` : `${t.seconds}s`;

  const currentGoal = GOALS[goalIndex];
  const goalWords  = goalIndex === GOALS.length - 1 ? customGoalWords : currentGoal.words;
  const goalChars  = goalIndex === GOALS.length - 1 ? customGoalChars : currentGoal.chars;
  const wordPct    = goalWords  > 0 ? Math.min(100, (words / goalWords)   * 100) : 0;
  const charPct    = goalChars  > 0 ? Math.min(100, (chars / goalChars)   * 100) : 0;

  const readColor = READABILITY_COLORS[heavyStats.readability.level] || '#888';

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'seo',      label: '🔍 SEO' },
    { id: 'social',   label: '📱 Social' },
    { id: 'goals',    label: '🎯 Goals' },
  ];

  // ─── Render ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Live stat strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '12px',
      }}>
        <StatCard value={words}        label="Words"          icon="📝" color="var(--accent)" />
        <StatCard value={chars}        label="Characters"     icon="🔤" />
        <StatCard value={charsNoSpace} label="No-space Chars" icon="✂️" />
        <StatCard value={sentences}    label="Sentences"      icon="📖" />
        <StatCard value={paragraphs}   label="Paragraphs"     icon="¶" />
        <StatCard value={lines}        label="Lines"          icon="📋" />
        <StatCard
          value={heavyStats.readingTime.minutes > 0
            ? `${heavyStats.readingTime.minutes}m`
            : `${heavyStats.readingTime.seconds}s`}
          label="Read Time"
          sub="@ 238 wpm"
          icon="⏱️"
        />
        <StatCard
          value={heavyStats.speakingTime.minutes > 0
            ? `${heavyStats.speakingTime.minutes}m`
            : `${heavyStats.speakingTime.seconds}s`}
          label="Speak Time"
          sub="@ 150 wpm"
          icon="🎤"
        />
      </div>

      {/* ── Main layout ── */}
      <div className="wc-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* Left: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
          }}>
            <button onClick={handlePaste} style={btnStyle()}>📋 Paste</button>
            <label style={btnStyle()} title="Upload .txt, .md, .csv, .pdf">
              📁 Upload
              <input type="file" accept=".txt,.md,.csv,.json,.xml,.html,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={undo}   disabled={historyIndex <= 0}                    style={btnStyle(historyIndex <= 0)} title="Undo (Ctrl+Z)">↩ Undo</button>
            <button onClick={redo}   disabled={historyIndex >= history.length - 1}   style={btnStyle(historyIndex >= history.length - 1)} title="Redo (Ctrl+Y)">↪ Redo</button>
            <button onClick={handleCopy}   style={btnStyle(false, copied)}   title="Copy all text">{copied ? '✅ Copied' : '📑 Copy'}</button>
            <button onClick={handleExport} style={btnStyle(false, exported)} title="Download report">{exported ? '✅ Saved' : '💾 Export'}</button>
            <button onClick={handleClear}  style={{ ...btnStyle(), marginLeft: 'auto', color: '#ef4444' }} title="Clear all">🗑️ Clear</button>
          </div>

          {/* Textarea */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{ position: 'relative' }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              placeholder="Type or paste your text here to begin analyzing...

💡 Tips:
  • Drag & drop .txt or .pdf files
  • Ctrl+Z / Ctrl+Y for undo/redo
  • Use tabs above for SEO, social limits, and writing goals"
              style={{
                width: '100%',
                minHeight: '480px',
                fontSize: '1rem',
                lineHeight: 1.7,
                padding: '20px',
                border: `2px solid ${isDragging ? 'var(--highlight)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                background: isDragging ? 'rgba(0,112,243,0.04)' : 'var(--bg-main)',
                resize: 'vertical',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 0.2s',
                outline: 'none',
                color: 'var(--text-primary)',
              }}
            />
            {isDragging && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,112,243,0.07)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--highlight)',
                pointerEvents: 'none',
              }}>
                📂 Drop your file here
              </div>
            )}
          </div>

          {/* Bottom hint */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>⌨️ Ctrl+Z undo · Ctrl+Y redo</span>
            <span>📂 Drag & drop .txt .md .pdf</span>
            <span>💾 Export full report</span>
            <span>🔒 100% private — never uploaded</span>
          </div>
        </div>

        {/* Right: Analysis panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '3px',
            border: '1px solid var(--border-light)',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  background: activeTab === tab.id ? 'var(--bg-main)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Readability */}
              <div style={cardStyle()}>
                <SectionTitle>Readability</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: `conic-gradient(${readColor} ${heavyStats.readability.score}%, var(--bg-secondary) 0)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: 'var(--bg-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 800, color: readColor,
                    }}>
                      {heavyStats.readability.score}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: readColor }}>{heavyStats.readability.level}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{heavyStats.readability.grade}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Flesch Reading Ease</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Avg. sentence length', val: sentences > 0 ? `${(words / sentences).toFixed(1)} words` : '—' },
                    { label: 'Avg. word length',     val: words > 0 ? `${(charsNoSpace / words).toFixed(1)} chars` : '—' },
                    { label: 'Syllables/word',       val: words > 0 ? `${(syllables / words).toFixed(2)}` : '—' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment */}
              <div style={cardStyle()}>
                <SectionTitle>Sentiment</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{heavyStats.sentiment.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{heavyStats.sentiment.sentiment}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Score: {heavyStats.sentiment.score > 0 ? `+${heavyStats.sentiment.score}` : heavyStats.sentiment.score}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ width: 60, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${Math.min(100, Math.abs(heavyStats.sentiment.score) * 5)}%`,
                        background: heavyStats.sentiment.score >= 0 ? '#22c55e' : '#ef4444',
                        marginLeft: heavyStats.sentiment.score < 0 ? 'auto' : 0,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>Tone meter</div>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={cardStyle()}>
                <SectionTitle>All Stats</SectionTitle>
                {[
                  ['Words',            words.toLocaleString()],
                  ['Characters',       chars.toLocaleString()],
                  ['No-space chars',   charsNoSpace.toLocaleString()],
                  ['Sentences',        sentences],
                  ['Paragraphs',       paragraphs],
                  ['Lines',            lines],
                  ['Syllables',        syllables],
                  ['Reading time',     fmtTime(heavyStats.readingTime)],
                  ['Speaking time',    fmtTime(heavyStats.speakingTime)],
                  ['Unique words',     text ? new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size : 0],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: SEO ── */}
          {activeTab === 'seo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* SEO Score */}
              <div style={cardStyle()}>
                <SectionTitle>SEO Content Score</SectionTitle>
                {(() => {
                  const checks = [
                    { label: 'Word count ≥ 300',     pass: words >= 300     },
                    { label: 'Word count ≥ 1000',    pass: words >= 1000    },
                    { label: 'Sentences ≥ 5',         pass: sentences >= 5   },
                    { label: 'Paragraphs ≥ 3',        pass: paragraphs >= 3  },
                    { label: 'Readability ≥ Standard',pass: heavyStats.readability.score >= 50 },
                    { label: 'Avg sent ≤ 25 words',   pass: sentences > 0 && (words / sentences) <= 25 },
                  ];
                  const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
                  const col = score >= 80 ? '#22c55e' : score >= 50 ? '#facc15' : '#ef4444';
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: col }}>{score}%</div>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: col, borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {checks.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                            <span style={{ color: c.pass ? '#22c55e' : '#ef4444', flexShrink: 0, fontSize: '0.9rem' }}>{c.pass ? '✅' : '❌'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Keyword Density */}
              <div style={cardStyle()}>
                <SectionTitle badge={`${heavyStats.density.single.length} keywords`}>Top Keywords</SectionTitle>
                {heavyStats.density.single.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {heavyStats.density.single.slice(0, 8).map((k, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600 }}>{k.word}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>{k.count}× · {k.density}%</span>
                        </div>
                        <MiniBar value={Number(k.density)} max={5} color="var(--highlight)" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>Type some text to see keyword analysis</p>
                )}
              </div>

              {/* Bi-grams */}
              {heavyStats.density.biGrams.length > 0 && (
                <div style={cardStyle()}>
                  <SectionTitle>2-Word Phrases</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {heavyStats.density.biGrams.slice(0, 6).map((k, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                        <span style={{ fontWeight: 500 }}>{k.word}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{k.count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tri-grams */}
              {heavyStats.density.triGrams.length > 0 && (
                <div style={cardStyle()}>
                  <SectionTitle>3-Word Phrases</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {heavyStats.density.triGrams.slice(0, 5).map((k, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                        <span style={{ fontWeight: 500 }}>{k.word}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{k.count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SOCIAL ── */}
          {activeTab === 'social' && (
            <div style={cardStyle()}>
              <SectionTitle>Character Limits</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {SOCIAL_LIMITS.map((s) => {
                  const over = chars > s.limit;
                  const pct  = Math.min(100, (chars / s.limit) * 100);
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.83rem' }}>
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: over ? '#ef4444' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          {chars.toLocaleString()} / {s.limit.toLocaleString()}
                          {over && <span style={{ marginLeft: 4, color: '#ef4444' }}>-{(chars - s.limit).toLocaleString()} over</span>}
                        </div>
                      </div>
                      <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '3px', transition: 'width 0.3s',
                          width: `${pct}%`,
                          background: over ? '#ef4444' : pct > 85 ? '#facc15' : s.color,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: GOALS ── */}
          {activeTab === 'goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={cardStyle()}>
                <SectionTitle>Writing Goal</SectionTitle>
                <select
                  value={goalIndex}
                  onChange={e => setGoalIndex(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)', background: 'var(--bg-main)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
                    outline: 'none', marginBottom: '16px', cursor: 'pointer',
                  }}
                >
                  {GOALS.map((g, i) => (
                    <option key={i} value={i}>{g.label}{g.words ? ` (${g.words.toLocaleString()} words)` : ''}</option>
                  ))}
                </select>

                {goalIndex === GOALS.length - 1 && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Word goal</label>
                      <input type="number" value={customGoalWords} min={1} onChange={e => setCustomGoalWords(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Char goal</label>
                      <input type="number" value={customGoalChars} min={1} onChange={e => setCustomGoalChars(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                    </div>
                  </div>
                )}

                {/* Word progress */}
                {goalWords > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Words</span>
                      <span style={{ color: wordPct >= 100 ? '#22c55e' : 'var(--text-secondary)' }}>
                        {words.toLocaleString()} / {goalWords.toLocaleString()} ({Math.round(wordPct)}%)
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '5px', transition: 'width 0.3s',
                        width: `${wordPct}%`,
                        background: wordPct >= 100 ? '#22c55e' : wordPct > 70 ? '#facc15' : 'var(--highlight)',
                      }} />
                    </div>
                    {wordPct >= 100
                      ? <div style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>🎉 Goal reached! {words - goalWords} words over</div>
                      : <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{(goalWords - words).toLocaleString()} words remaining</div>
                    }
                  </div>
                )}

                {/* Char progress */}
                {goalChars > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Characters</span>
                      <span style={{ color: charPct >= 100 ? '#22c55e' : 'var(--text-secondary)' }}>
                        {chars.toLocaleString()} / {goalChars.toLocaleString()} ({Math.round(charPct)}%)
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '5px', transition: 'width 0.3s',
                        width: `${charPct}%`,
                        background: charPct >= 100 ? '#22c55e' : charPct > 70 ? '#facc15' : 'var(--highlight)',
                      }} />
                    </div>
                    {charPct >= 100
                      ? <div style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>🎉 Character goal reached!</div>
                      : <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{(goalChars - chars).toLocaleString()} characters remaining</div>
                    }
                  </div>
                )}
              </div>

              {/* Writing velocity estimate */}
              <div style={cardStyle()}>
                <SectionTitle>Time Estimate</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                  {[
                    { label: '📖 Reading (238 wpm)',  val: fmtTime(heavyStats.readingTime) },
                    { label: '🎤 Speaking (150 wpm)', val: fmtTime(heavyStats.speakingTime) },
                    { label: '⌨️ Avg typing time',    val: words > 0 ? `~${Math.ceil(words / 40)}m` : '—' },
                    { label: '✍️ Avg writing time',   val: words > 0 ? `~${Math.ceil(words / 25)}m` : '—' },
                  ].map(([l, v]) => typeof l === 'string' && (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .wc-layout { grid-template-columns: 1fr !important; }
        }
        textarea::placeholder { color: var(--text-tertiary); }
        textarea:focus { border-color: var(--highlight) !important; box-shadow: 0 0 0 3px rgba(0,112,243,0.08); }
      ` }} />
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────
function btnStyle(disabled = false, active = false) {
  return {
    padding: '7px 13px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    background: active ? 'var(--accent)' : 'var(--bg-main)',
    color: active ? 'var(--accent-text)' : disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.15s',
    fontFamily: 'var(--font-sans)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };
}

function cardStyle() {
  return {
    background: 'var(--bg-main)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    padding: '18px',
  };
}
