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
  const [rhymeType, setRhymeType] = useState('perfect');
  const [syllableFilter, setSyllableFilter] = useState('all');
  const [savedRhymes, setSavedRhymes] = useState([]);

  const searchRhymes = async (e) => {
    if (e) e.preventDefault();
    
    if (!word.trim()) {
      setToast({ message: 'Please enter a word to find rhymes.', type: 'warning' });
      return;
    }

    setIsSearching(true);
    setError(null);
    setRhymes([]);
    setSyllableFilter('all');
    setHasSearched(true);

    try {
      const vParam = (lang === 'es' || lang === 'pt') ? '&v=es' : '';
      const relation = rhymeType === 'near' ? 'rel_nry' : 'rel_rhy';
      const response = await fetch(`${API_URL}?${relation}=${encodeURIComponent(word.trim())}&max=200${vParam}`);

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

  const filteredRhymes = rhymes.filter((rhyme) => syllableFilter === 'all' || (syllableFilter === '4+' ? (rhyme.numSyllables || 1) >= 4 : (rhyme.numSyllables || 1) === Number(syllableFilter)));
  const groupedRhymes = filteredRhymes.reduce((acc, rhyme) => {
    const syllables = rhyme.numSyllables || 1;
    if (!acc[syllables]) acc[syllables] = [];
    acc[syllables].push(rhyme);
    return acc;
  }, {});

  const sortedSyllables = Object.keys(groupedRhymes).sort((a, b) => Number(a) - Number(b));
  const toggleSaved = (rhyme) => setSavedRhymes((current) => current.includes(rhyme) ? current.filter((item) => item !== rhyme) : [...current, rhyme].slice(0, 20));
  const copySaved = () => {
    if (!savedRhymes.length) return;
    navigator.clipboard.writeText(savedRhymes.join(', ')).then(() => setToast({ message: 'Rhyme shortlist copied.', type: 'success' }));
  };
  const speak = (value) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(value));
  };

  return (
    <div className="tool-container-full">
      <div className="tool-panel">
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, var(--brand-light), var(--bg-white))' }}>
          <div className="tool-panel-title" style={{ color: 'var(--brand-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎵</span> RHYMING DICTIONARY
          </div>
        </div>
        
        <form onSubmit={searchRhymes} className="rhyme-search">
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
        <div className="rhyme-options"><div role="group" aria-label="Rhyme type"><button type="button" className={rhymeType==='perfect'?'active':''} onClick={()=>{setRhymeType('perfect');setRhymes([]);setHasSearched(false)}}>Perfect rhymes</button><button type="button" className={rhymeType==='near'?'active':''} onClick={()=>{setRhymeType('near');setRhymes([]);setHasSearched(false)}}>Near rhymes</button></div><div className="popular">Try: {['love','time','light','dream','heart'].map((item)=><button type="button" key={item} onClick={()=>setWord(item)}>{item}</button>)}</div></div>
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
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No rhymes found for &ldquo;{word}&rdquo;. Try another word!</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              <div className="result-tools"><div role="group" aria-label="Filter by syllables">{['all','1','2','3','4+'].map((count)=><button type="button" key={count} className={syllableFilter===count?'active':''} onClick={()=>setSyllableFilter(count)}>{count==='all'?'All':`${count} syllable${count==='1'?'':'s'}`}</button>)}</div><span>{filteredRhymes.length} of {rhymes.length} {rhymeType} rhymes</span></div>
              {savedRhymes.length > 0 && <div className="rhyme-tray"><strong>Writing shortlist</strong><div>{savedRhymes.map((item)=><button type="button" key={item} onClick={()=>toggleSaved(item)} title="Remove from shortlist">{item} ×</button>)}</div><button type="button" className="copy-tray" onClick={copySaved}>Copy shortlist</button></div>}
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
                        <button type="button"
                          key={idx} 
                          style={{
                            padding: '8px 16px',
                            background: 'var(--bg-section)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.target.style.background = 'var(--brand-color)'; e.target.style.color = '#fff'; e.target.style.borderColor = 'var(--brand-color)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'var(--bg-section)'; e.target.style.color = 'inherit'; e.target.style.borderColor = 'var(--border-light)'; }}
                          onClick={() => toggleSaved(rhyme.word)}
                          onDoubleClick={() => speak(rhyme.word)}
                          aria-pressed={savedRhymes.includes(rhyme.word)}
                          title="Select for shortlist; double-click to hear pronunciation"
                        >
                          {rhyme.word}
                        </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style jsx>{`.rhyme-search{padding:24px;display:flex;flex-wrap:wrap;gap:16px}.rhyme-options,.result-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 24px 20px}.rhyme-options>div,.result-tools>div,.popular{display:flex;gap:7px;flex-wrap:wrap}.rhyme-options button,.result-tools button,.popular button,.rhyme-tray button{min-height:38px;padding:0 12px;border:1px solid var(--border-light);border-radius:999px;background:var(--bg-white);color:var(--text-main);cursor:pointer}.rhyme-options button.active,.result-tools button.active{border-color:var(--brand-color);background:var(--brand-light);color:var(--brand-color);font-weight:800}.result-tools{padding:14px;border:1px solid var(--border-light);border-radius:12px;background:var(--bg-section)}.result-tools span{font-size:.8rem;color:var(--text-secondary)}.rhyme-tray{display:grid;gap:10px;padding:16px;border:1px solid #c4b5fd;border-radius:12px;background:#f5f3ff}.rhyme-tray>div{display:flex;flex-wrap:wrap;gap:7px}.rhyme-tray .copy-tray{justify-self:start;border-color:#7c3aed;background:#7c3aed;color:white;font-weight:800}@media(max-width:640px){.rhyme-search{padding:16px}.rhyme-search>div,.rhyme-search>button{flex-basis:100%!important;width:100%}.rhyme-options,.result-tools{align-items:stretch;flex-direction:column;padding-inline:16px}.rhyme-options>div,.result-tools>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.result-tools button{padding-inline:6px}.popular{display:none}}`}</style>
    </div>
  );
}
