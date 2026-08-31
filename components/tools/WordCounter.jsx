'use client';

import React, { useState, useEffect } from 'react';
import { 
  countWords, countCharacters, countCharactersNoSpaces, 
  countSentences, countParagraphs, countSyllables, 
  getWordFrequency, getReadingTime, getSpeakingTime, 
  getReadabilityScore, getKeywordDensity 
} from '@/lib/text-processors';

export default function WordCounter({ t, lang }) {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0, chars: 0, charsNoSpaces: 0,
    sentences: 0, paragraphs: 0, syllables: 0,
    readingTime: { minutes: 0, seconds: 0 },
    speakingTime: { minutes: 0, seconds: 0 },
    readability: { score: 0, level: 'N/A' },
    density: []
  });

  useEffect(() => {
    const words = countWords(text);
    const chars = countCharacters(text);
    const charsNoSpaces = countCharactersNoSpaces(text);
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);
    const syllables = countSyllables(text);
    
    // Only compute heavy stats if there is text
    let density = [];
    let readingTime = { minutes: 0, seconds: 0 };
    let speakingTime = { minutes: 0, seconds: 0 };
    let readability = { score: 0, level: 'N/A' };
    
    if (text.trim().length > 0) {
      density = getKeywordDensity(text, 10);
      readingTime = getReadingTime(text);
      speakingTime = getSpeakingTime(text);
      readability = getReadabilityScore(text);
    }

    setStats({
      words, chars, charsNoSpaces,
      sentences, paragraphs, syllables,
      readingTime, speakingTime,
      readability, density
    });
  }, [text]);

  const handleClear = () => setText('');
  const handleCopy = () => navigator.clipboard.writeText(text);
  const handlePaste = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setText(clipboard);
    } catch (e) {
      console.error(e);
    }
  };

  const ProgressBar = ({ value, max, label, color }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const isOver = value > max;
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          <span>{label}</span>
          <span style={{ color: isOver ? 'var(--error, #ef4444)' : 'inherit', fontWeight: 600 }}>{value} / {max}</span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${percentage}%`, 
            background: isOver ? 'var(--error, #ef4444)' : color,
            transition: 'width 0.3s ease, background 0.3s ease'
          }}></div>
        </div>
      </div>
    );
  };

  const formatTime = (time) => {
    if (time.minutes > 0) return `${time.minutes}m ${time.seconds}s`;
    return `${time.seconds}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Top Stat Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div className="trust-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{stats.words}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Words</div>
        </div>
        <div className="trust-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{stats.chars}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Characters</div>
        </div>
        <div className="trust-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.sentences}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Sentences</div>
        </div>
        <div className="trust-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.paragraphs}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Paragraphs</div>
        </div>
      </div>

      <div className="word-counter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Editor Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="tool-actions">
            <button className="btn btn-secondary" onClick={handlePaste}>📋 Paste</button>
            <button className="btn btn-secondary" onClick={handleCopy}>📑 Copy</button>
            <button className="btn btn-secondary" onClick={handleClear}>🗑️ Clear</button>
          </div>
          <textarea
            className="tool-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to begin analyzing..."
            style={{ 
              height: '500px', 
              fontSize: '1rem', 
              lineHeight: 1.6, 
              padding: '20px',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)',
              resize: 'vertical',
              boxShadow: 'var(--shadow-sm)',
              width: '100%'
            }}
          />
        </div>

        {/* Dashboard Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Advanced Analytics */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>Analytics</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Reading Time</span>
              <span style={{ fontWeight: 600 }}>{formatTime(stats.readingTime)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Speaking Time</span>
              <span style={{ fontWeight: 600 }}>{formatTime(stats.speakingTime)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Readability Level</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{stats.readability.level}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Readability Score</span>
              <span style={{ fontWeight: 600 }}>{stats.readability.score}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Syllables</span>
              <span style={{ fontWeight: 600 }}>{stats.syllables}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Chars (No Spaces)</span>
              <span style={{ fontWeight: 600 }}>{stats.charsNoSpaces}</span>
            </div>
          </div>

          {/* Social Media Limits */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>Social Limits</h3>
            <ProgressBar value={stats.chars} max={280} label="X (Twitter)" color="#1DA1F2" />
            <ProgressBar value={stats.chars} max={2200} label="Instagram" color="#E1306C" />
            <ProgressBar value={stats.chars} max={3000} label="LinkedIn" color="#0A66C2" />
          </div>

          {/* Keyword Density */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>Keyword Density</h3>
            {stats.density.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.density.map((item, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.word}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.count}x ({item.density}%)</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, item.density * 5)}%`, background: 'var(--accent)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
                Type some text to see keywords...
              </div>
            )}
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .word-counter-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
