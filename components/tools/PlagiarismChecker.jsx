'use client';

import React, { useState, useMemo } from 'react';

export default function PlagiarismChecker({ t, lang }) {
  const [sourceText, setSourceText] = useState('');
  const [suspectText, setSuspectText] = useState('');
  const [results, setResults] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Helper to extract sentences
  const extractSentences = (text) => {
    if (!text) return [];
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  };

  // Helper to extract words, lowercased, no punctuation
  const extractWords = (text) => {
    return text.toLowerCase().replace(/[^\w\s]|_/g, "").split(/\s+/).filter(w => w.length > 0);
  };

  // N-gram generator
  const getNGrams = (words, n = 3) => {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  };

  const handleCheck = () => {
    setIsChecking(true);
    // Simulate slight delay for heavy processing illusion and UI feedback
    setTimeout(() => {
      if (!sourceText.trim() || !suspectText.trim()) {
        setResults({ score: 0, highlights: [], error: 'Please enter both texts.' });
        setIsChecking(false);
        return;
      }

      const sourceSentences = extractSentences(sourceText);
      const suspectSentences = extractSentences(suspectText);
      const sourceWords = extractWords(sourceText);
      const suspectWords = extractWords(suspectText);

      if (sourceWords.length === 0 || suspectWords.length === 0) {
        setResults({ score: 0, highlights: [], error: 'Texts must contain valid words.' });
        setIsChecking(false);
        return;
      }

      // 1. Overall Word Similarity (Jaccard Index)
      const sourceSet = new Set(sourceWords);
      const suspectSet = new Set(suspectWords);
      const intersection = new Set([...sourceSet].filter(x => suspectSet.has(x)));
      const union = new Set([...sourceSet, ...suspectSet]);
      const wordScore = union.size === 0 ? 0 : (intersection.size / union.size) * 100;

      // 2. Exact Phrase Match (3-grams)
      const source3Grams = new Set(getNGrams(sourceWords, 3));
      const suspect3Grams = getNGrams(suspectWords, 3);
      let matchCount = 0;
      suspect3Grams.forEach(gram => {
        if (source3Grams.has(gram)) matchCount++;
      });
      const phraseScore = suspect3Grams.length === 0 ? 0 : (matchCount / suspect3Grams.length) * 100;

      // Final Blended Score (Heavy weight on phrase matching for plagiarism)
      let finalScore = Math.round((wordScore * 0.3) + (phraseScore * 0.7));
      if (finalScore > 100) finalScore = 100;
      if (sourceText === suspectText) finalScore = 100;

      // 3. Sentence-level highlighting for the Suspect text
      const highlights = suspectSentences.map(sentence => {
        const sWords = extractWords(sentence);
        const s3Grams = getNGrams(sWords, 3);
        let sMatchCount = 0;
        
        s3Grams.forEach(gram => {
          if (source3Grams.has(gram)) sMatchCount++;
        });

        const sScore = s3Grams.length === 0 ? 
          (intersection.has(sWords[0]) ? 100 : 0) : 
          (sMatchCount / s3Grams.length) * 100;

        let status = 'unique'; // 0-20%
        if (sScore > 80) status = 'identical'; // 80-100%
        else if (sScore > 40) status = 'paraphrased'; // 40-80%

        return { text: sentence, status, score: Math.round(sScore) };
      });

      setResults({
        score: finalScore,
        highlights,
        metrics: {
          identicalPhrases: matchCount,
          totalWords: suspectWords.length,
          commonWords: intersection.size
        }
      });
      setIsChecking(false);
    }, 600);
  };

  const loadSample = () => {
    setSourceText("The mitochondria is the powerhouse of the cell. It is responsible for cellular respiration and energy production. Without it, complex life could not exist. This is a very important concept in biology and is widely taught in schools.");
    setSuspectText("The mitochondria is known as the powerhouse of the cell. It handles cellular respiration and energy production. Complex life needs it to survive. Students learn this concept all the time.");
  };

  const clearForm = () => {
    setSourceText('');
    setSuspectText('');
    setResults(null);
  };

  // Circular Progress Component
  const CircularProgress = ({ percentage }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    let color = '#10b981'; // Green (Safe)
    if (percentage > 70) color = '#ef4444'; // Red (High Plagiarism)
    else if (percentage > 30) color = '#f59e0b'; // Yellow (Moderate)

    return (
      <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle 
            cx="80" cy="80" r={radius} 
            fill="transparent" 
            stroke="var(--bg-secondary)" 
            strokeWidth="12" 
          />
          <circle 
            cx="80" cy="80" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{percentage}%</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>Match</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '700px', lineHeight: 1.6 }}>
          Compare a suspect text against an original source. We use advanced n-gram and Jaccard similarity algorithms running entirely in your browser to detect identical copying and heavy paraphrasing.
        </p>
        <div className="tool-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-secondary" onClick={loadSample}>📝 Load Sample</button>
          <button className="btn btn-secondary" onClick={clearForm}>🗑️ Clear</button>
          <button className="btn btn-primary" onClick={handleCheck} disabled={isChecking}>
            {isChecking ? '⏳ Analyzing...' : '🕵️ Check Plagiarism'}
          </button>
        </div>
      </div>

      <div className="plagiarism-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Source Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></span>
            Original Source Text
          </h3>
          <textarea
            className="tool-textarea"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste the original source material here..."
            style={{ 
              height: '350px', 
              fontSize: '1rem', 
              lineHeight: 1.6, 
              padding: '20px',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Suspect Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Suspect Text to Check
          </h3>
          <textarea
            className="tool-textarea"
            value={suspectText}
            onChange={(e) => setSuspectText(e.target.value)}
            placeholder="Paste the student essay or suspected copied text here..."
            style={{ 
              height: '350px', 
              fontSize: '1rem', 
              lineHeight: 1.6, 
              padding: '20px',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Results Dashboard */}
      {results && !results.error && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', marginTop: '16px' }} className="plagiarism-results-grid">
          
          {/* Score Card */}
          <div className="trust-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Similarity Report</h3>
            <CircularProgress percentage={results.score} />
            
            <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Identical Phrases</span>
                <span style={{ fontWeight: 600 }}>{results.metrics.identicalPhrases}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Common Words</span>
                <span style={{ fontWeight: 600 }}>{results.metrics.commonWords}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Words (Suspect)</span>
                <span style={{ fontWeight: 600 }}>{results.metrics.totalWords}</span>
              </div>
            </div>
          </div>

          {/* Detailed Highlight View */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Detailed Sentence Analysis</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#fecaca', border: '1px solid #ef4444' }}></span>
                  <span>Identical (&gt;80%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#fde68a', border: '1px solid #f59e0b' }}></span>
                  <span>Paraphrased (40-80%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'transparent', border: '1px solid var(--border-strong)' }}></span>
                  <span>Unique</span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '1.05rem', 
              lineHeight: 1.8, 
              color: 'var(--text-primary)',
              padding: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)'
            }}>
              {results.highlights.map((h, i) => {
                let bg = 'transparent';
                let color = 'inherit';
                let fw = 'normal';
                
                if (h.status === 'identical') {
                  bg = '#fecaca'; // light red
                  color = '#991b1b';
                  fw = '500';
                } else if (h.status === 'paraphrased') {
                  bg = '#fde68a'; // light yellow
                  color = '#92400e';
                }
                
                return (
                  <span 
                    key={i} 
                    title={`Similarity Score: ${h.score}%`}
                    style={{ 
                      backgroundColor: bg, 
                      color: color,
                      fontWeight: fw,
                      borderRadius: '4px',
                      padding: '2px 4px',
                      marginRight: '4px',
                      transition: 'background 0.2s',
                      cursor: 'help',
                      display: 'inline'
                    }}
                  >
                    {h.text}
                  </span>
                );
              })}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '16px', fontStyle: 'italic' }}>
              Hover over highlighted sentences to see their exact similarity score.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {results && results.error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', textAlign: 'center', fontWeight: 500 }}>
          {results.error}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .plagiarism-grid { grid-template-columns: 1fr !important; }
          .plagiarism-results-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
