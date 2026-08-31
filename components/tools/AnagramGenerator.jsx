'use client';

import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function AnagramGenerator({ t = {}, lang = 'en' }) {
  const [word, setWord] = useState('');
  const [anagrams, setAnagrams] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState(null);

  const searchAnagrams = async (e) => {
    if (e) e.preventDefault();
    
    if (!word.trim() || word.trim().length > 15) {
      setToast({ message: 'Please enter a word up to 15 letters long.', type: 'warning' });
      return;
    }

    setIsSearching(true);
    setError(null);
    setAnagrams([]);
    setHasSearched(true);

    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${word.split('').sort().join('').replace(/./g, '?')}&max=1000`);
      
      if (!response.ok) {
        throw new Error('Failed to reach the dictionary service.');
      }

      const data = await response.json();
      
      const inputSorted = word.toLowerCase().trim().split('').sort().join('');
      const validAnagrams = data.filter(item => {
        if (!item.word || item.word.includes(' ')) return false;
        const itemSorted = item.word.toLowerCase().split('').sort().join('');
        return itemSorted === inputSorted && item.word.toLowerCase() !== word.toLowerCase().trim();
      });

      setAnagrams(validAnagrams);
      
      if (validAnagrams.length === 0) {
        setToast({ message: `No anagrams found for "${word}".`, type: 'warning' });
      } else {
        setToast({ message: `Found ${validAnagrams.length} anagrams.`, type: 'success' });
      }

    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, #F0F4FF, var(--bg-white))' }}>
          <div className="tool-panel-title" style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔀</span> ANAGRAM GENERATOR
          </div>
        </div>
        
        <form onSubmit={searchAnagrams} style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter letters (e.g. listen, silent)"
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
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
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
              background: '#4F46E5',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            {isSearching ? 'Generating...' : '✨ Generate'}
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
          {anagrams.length === 0 ? (
            <div className="tool-panel" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-section)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤔</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No anagrams found for "{word}". Try rearranging or using different letters!</h3>
            </div>
          ) : (
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-title">
                  Results for "{word}"
                  <span style={{ marginLeft: '12px', background: '#E0E7FF', color: '#4F46E5', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                    {anagrams.length} anagrams
                  </span>
                </div>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {anagrams.map((item, idx) => (
                    <span 
                      key={idx} 
                      style={{
                        padding: '10px 18px',
                        background: 'var(--bg-section)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'default',
                        transition: 'all 0.2s transform'
                      }}
                      onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = 'var(--shadow-card)'; e.target.style.borderColor = '#4F46E5'; }}
                      onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'var(--shadow-sm)'; e.target.style.borderColor = 'var(--border-light)'; }}
                    >
                      {item.word}
                    </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
