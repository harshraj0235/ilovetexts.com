'use client';

import { useState, useEffect, useRef } from 'react';

const API_URL = 'https://api.datamuse.com/words';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function WordleFinder({ t = {}, lang = 'en' }) {
  const [greenLetters, setGreenLetters] = useState(Array(5).fill(''));
  const [yellowLetters, setYellowLetters] = useState(Array(5).fill(''));
  const [greyLetters, setGreyLetters] = useState('');
  
  const [words, setWords] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState(null);

  const greenRefs = useRef([]);
  const yellowRefs = useRef([]);

  const handleBoxChange = (type, index, value) => {
    const letter = value.replace(/[^A-Za-z]/g, '').toLowerCase();
    if (type === 'green') {
      const newArr = [...greenLetters];
      newArr[index] = letter.slice(-1);
      setGreenLetters(newArr);
      if (letter && index < 4) greenRefs.current[index + 1].focus();
    } else {
      const newArr = [...yellowLetters];
      newArr[index] = letter.slice(-1);
      setYellowLetters(newArr);
      if (letter && index < 4) yellowRefs.current[index + 1].focus();
    }
  };

  const handleBoxKeyDown = (e, type, index) => {
    if (e.key === 'Backspace') {
      const currentArr = type === 'green' ? greenLetters : yellowLetters;
      if (!currentArr[index] && index > 0) {
        const refs = type === 'green' ? greenRefs : yellowRefs;
        refs.current[index - 1].focus();
      }
    }
  };

  const searchWords = async (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setError(null);
    setWords([]);
    setHasSearched(true);

    try {
      let pattern = '';
      for (let i = 0; i < 5; i++) {
        pattern += greenLetters[i] || '?';
      }

      if (pattern === '?????') {
        pattern = '?????';
      }

      const response = await fetch(`${API_URL}?sp=${pattern}&max=1000`);
      if (!response.ok) throw new Error('Failed to reach the dictionary service.');
      
      let data = await response.json();
      data = data.filter(item => item.word.length === 5 && !item.word.includes(' '));

      const yellows = yellowLetters.filter(l => l);
      if (yellows.length > 0) {
        data = data.filter(item => {
          const w = item.word;
          for (let i = 0; i < 5; i++) {
            if (yellowLetters[i] && w[i] === yellowLetters[i]) return false;
          }
          for (const y of yellows) {
            if (!w.includes(y)) return false;
          }
          return true;
        });
      }

      const greys = greyLetters.replace(/[^a-zA-Z]/g, '').toLowerCase().split('');
      if (greys.length > 0) {
        data = data.filter(item => {
          for (const g of greys) {
            if (item.word.includes(g)) {
              if (greenLetters.includes(g) || yellowLetters.includes(g)) {
                // Handle duplicate letters logic if needed
                continue;
              }
              return false; 
            }
          }
          return true;
        });
      }

      setWords(data);
      if (data.length === 0) {
        setToast({ message: 'No words found matching these criteria.', type: 'warning' });
      } else {
        setToast({ message: `Found ${data.length} possible words!`, type: 'success' });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearForm = () => {
    setGreenLetters(Array(5).fill(''));
    setYellowLetters(Array(5).fill(''));
    setGreyLetters('');
    setWords([]);
    setHasSearched(false);
  };

  const InputBox = ({ val, onChange, onKeyDown, bgClass, refCb }) => (
    <input
      ref={refCb}
      type="text"
      value={val}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={`wordle-box ${bgClass}`}
      style={{
        width: '56px', height: '56px',
        textAlign: 'center', fontSize: '2rem',
        fontWeight: 'bold', textTransform: 'uppercase',
        border: '2px solid rgba(0,0,0,0.1)',
        borderRadius: '8px', color: '#fff',
        outline: 'none', transition: 'transform 0.1s'
      }}
      onFocus={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.border = '2px solid #fff'; }}
      onBlur={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.border = '2px solid rgba(0,0,0,0.1)'; }}
    />
  );

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ border: 'none', boxShadow: 'var(--shadow-hover)' }}>
        <div style={{ background: '#111827', padding: '32px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', color: '#fff', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Wordle Solver</h2>
          <p style={{ color: '#9CA3AF', marginTop: '8px' }}>Enter the letters from your Wordle game to find the answer.</p>
        </div>
        
        <form onSubmit={searchWords} style={{ padding: '32px', background: 'var(--bg-white)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#16A34A' }}>🟩 CORRECT LETTERS (GREEN)</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', background: '#F0FDF4', padding: '24px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
              {greenLetters.map((l, i) => (
                <InputBox 
                  key={`g-${i}`} val={l} bgClass="bg-green"
                  onChange={(e) => handleBoxChange('green', i, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(e, 'green', i)}
                  refCb={(el) => (greenRefs.current[i] = el)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#D97706' }}>🟨 MISPLACED LETTERS (YELLOW)</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', background: '#FFFBEB', padding: '24px', borderRadius: '12px', border: '1px solid #FEF08A' }}>
              {yellowLetters.map((l, i) => (
                <InputBox 
                  key={`y-${i}`} val={l} bgClass="bg-yellow"
                  onChange={(e) => handleBoxChange('yellow', i, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(e, 'yellow', i)}
                  refCb={(el) => (yellowRefs.current[i] = el)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#4B5563' }}>⬛ WRONG LETTERS (GREY)</label>
            <input
              type="text"
              value={greyLetters}
              onChange={(e) => setGreyLetters(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
              placeholder="e.g. A, R, T, S..."
              style={{
                width: '100%', padding: '20px', fontSize: '1.2rem',
                border: '2px solid #E5E7EB', borderRadius: '12px',
                background: '#F9FAFB', letterSpacing: '4px', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)', outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#9CA3AF'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .bg-green { background-color: #22C55E !important; }
            .bg-yellow { background-color: #EAB308 !important; }
          `}} />

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
            >
              Clear Board
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSearching}
              style={{ flex: 2, padding: '16px', fontSize: '1.1rem', borderRadius: '12px', background: '#111827' }}
            >
              {isSearching ? 'Analyzing...' : '🔎 Find Possible Words'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-md)', margin: '20px 0' }}>
          ⚠️ {error}
        </div>
      )}

      {hasSearched && !isSearching && !error && (
        <div style={{ marginTop: '24px' }}>
          <div className="tool-panel">
            <div className="tool-panel-header">
              <div className="tool-panel-title">
                POSSIBLE ANSWERS 
                <span style={{ marginLeft: '12px', background: 'var(--bg-section)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem' }}>
                  {words.length} found
                </span>
              </div>
            </div>
            {words.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No words match this pattern. Check for typos!
              </div>
            ) : (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {words.map((w, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    textAlign: 'center',
                    background: 'var(--bg-section)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {w.word}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
