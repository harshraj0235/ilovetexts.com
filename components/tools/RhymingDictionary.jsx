'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://api.datamuse.com/words';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function RhymingDictionary({ t = {}, lang = 'en' }) {
  const [word, setWord] = useState('');
  const [rhymes, setRhymes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState(null);

  const searchRhymes = async (e) => {
    if (e) e.preventDefault();
    
    if (!word.trim()) {
      setToast({ message: 'Please enter a word to find rhymes.', type: 'warning' });
      return;
    }

    setIsSearching(true);
    setError(null);
    setRhymes([]);
    setHasSearched(true);

    try {
      const vParam = (lang === 'es' || lang === 'pt') ? '&v=es' : '';
      const response = await fetch(`${API_URL}?rel_rhy=${encodeURIComponent(word.trim())}${vParam}`);

      if (!response.ok) {
        throw new Error('Failed to reach the dictionary service. Please try again.');
      }

      const data = await response.json();
      setRhymes(data || []);
      
      if (data && data.length === 0) {
        setToast({ message: `No rhymes found for "${word}".`, type: 'warning' });
      } else {
        setToast({ message: `Found ${data.length} rhymes.`, type: 'success' });
      }

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSearching(false);
    }
  };

  const groupedRhymes = rhymes.reduce((acc, rhyme) => {
    const syllables = rhyme.numSyllables || 1;
    if (!acc[syllables]) acc[syllables] = [];
    acc[syllables].push(rhyme);
    return acc;
  }, {});

  const sortedSyllables = Object.keys(groupedRhymes).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="tool-container-full">
      <div className="tool-panel">
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, var(--brand-light), var(--bg-white))' }}>
          <div className="tool-panel-title" style={{ color: 'var(--brand-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎵</span> RHYMING DICTIONARY
          </div>
        </div>
        
        <form onSubmit={searchRhymes} style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter a word (e.g. love, heart, star)"
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                fontSize: '1.1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '2px solid var(--border-light)', 
                background: 'var(--bg-section)',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'var(--font-sans)'
              }}
              disabled={isSearching}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching || !word.trim()}
            style={{ 
              padding: '0 32px', 
              fontSize: '1.1rem', 
              height: '58px', 
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(229, 50, 45, 0.2)'
            }}
          >
            {isSearching ? 'Searching...' : '🔍 Find Rhymes'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-md)', margin: '20px 0', border: '1px solid #F87171' }}>
          ⚠️ {error}
        </div>
      )}

      {hasSearched && !isSearching && !error && (
        <div style={{ marginTop: '24px' }}>
          {rhymes.length === 0 ? (
            <div className="tool-panel" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-section)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤷‍♂️</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No rhymes found for "{word}". Try another word!</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {sortedSyllables.map(syllableCount => (
                <div key={syllableCount} className="tool-panel">
                  <div className="tool-panel-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="tool-panel-title">
                      {syllableCount} Syllable{syllableCount !== '1' ? 's' : ''}
                      <span style={{ marginLeft: '12px', background: 'var(--brand-light)', color: 'var(--brand-color)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                        {groupedRhymes[syllableCount].length} words
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {groupedRhymes[syllableCount]
                      .sort((a, b) => b.score - a.score)
                      .map((rhyme, idx) => (
                        <span 
                          key={idx} 
                          style={{
                            padding: '8px 16px',
                            background: 'var(--bg-section)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            border: '1px solid var(--border-light)',
                            cursor: 'default',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.target.style.background = 'var(--brand-color)'; e.target.style.color = '#fff'; e.target.style.borderColor = 'var(--brand-color)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'var(--bg-section)'; e.target.style.color = 'inherit'; e.target.style.borderColor = 'var(--border-light)'; }}
                          title={`Score: ${rhyme.score}`}
                        >
                          {rhyme.word}
                        </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
