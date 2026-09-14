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
  const [startsWith, setStartsWith] = useState('');
  const [contains, setContains] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [selected, setSelected] = useState([]);

  const letters = word.toLocaleLowerCase().replace(/[^a-z]/g, '').slice(0, 15);
  const visibleAnagrams = anagrams.filter((item) => item.word.toLocaleLowerCase().startsWith(startsWith.toLocaleLowerCase()) && item.word.toLocaleLowerCase().includes(contains.toLocaleLowerCase())).sort((a, b) => sortBy === 'alphabetical' ? a.word.localeCompare(b.word) : (b.score || 0) - (a.score || 0));

  const searchAnagrams = async (e) => {
    if (e) e.preventDefault();
    
    if (letters.length < 2) {
      setToast({ message: 'Enter between 2 and 15 English letters.', type: 'warning' });
      return;
    }

    setIsSearching(true);
    setError(null);
    setAnagrams([]);
    setHasSearched(true);

    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${'?'.repeat(letters.length)}&max=1000`);
      
      if (!response.ok) {
        throw new Error('Failed to reach the dictionary service.');
      }

      const data = await response.json();
      
      const inputSorted = letters.split('').sort().join('');
      const validAnagrams = data.filter(item => {
        if (!item.word || item.word.includes(' ')) return false;
        const itemSorted = item.word.toLowerCase().split('').sort().join('');
        return itemSorted === inputSorted && item.word.toLowerCase() !== letters;
      });

      setAnagrams(validAnagrams);
      setSelected([]);
      
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

  const toggleSelected = (value) => setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const copyResults = (values = visibleAnagrams.map((item) => item.word)) => {
    if (!values.length) return;
    navigator.clipboard.writeText(values.join(', ')).then(() => setToast({ message: 'Anagrams copied.', type: 'success' }));
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
        <div className="anagram-extras"><div className="letter-rack" aria-label="Normalized letter rack">{letters ? letters.toUpperCase().split('').map((letter,index)=><span key={`${letter}-${index}`}>{letter}</span>) : <small>Letters A–Z only · 15 maximum · every letter is used</small>}</div><div className="examples">Try: {['listen','earth','cinema','state'].map((item)=><button type="button" key={item} onClick={()=>setWord(item)}>{item}</button>)}</div><p>Dictionary lookup uses Datamuse. Your letters are sent only when you select Generate.</p></div>
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
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No exact dictionary anagrams found for &ldquo;{letters}&rdquo;.</h3>
            </div>
          ) : (
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-title">
                  Results for &ldquo;{letters}&rdquo;
                  <span style={{ marginLeft: '12px', background: '#E0E7FF', color: '#4F46E5', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                    {visibleAnagrams.length} of {anagrams.length}
                  </span>
                </div>
              </div>
              <div className="anagram-filters"><label>Starts with<input value={startsWith} maxLength={5} onChange={(e)=>setStartsWith(e.target.value.replace(/[^a-z]/gi,''))}/></label><label>Contains<input value={contains} maxLength={8} onChange={(e)=>setContains(e.target.value.replace(/[^a-z]/gi,''))}/></label><label>Sort<select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}><option value="score">Relevance</option><option value="alphabetical">A–Z</option></select></label><button type="button" onClick={()=>copyResults(selected.length?selected:visibleAnagrams.map((item)=>item.word))}>Copy {selected.length?'selected':'results'}</button></div>
              <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {visibleAnagrams.map((item, idx) => (
                    <button type="button"
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
                        cursor: 'pointer',
                        transition: 'all 0.2s transform'
                      }}
                      onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = 'var(--shadow-card)'; e.target.style.borderColor = '#4F46E5'; }}
                      onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'var(--shadow-sm)'; e.target.style.borderColor = 'var(--border-light)'; }}
                      onClick={()=>toggleSelected(item.word)}
                      aria-pressed={selected.includes(item.word)}
                    >
                      {item.word}
                    </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style jsx>{`.anagram-extras{display:grid;gap:12px;padding:0 24px 22px}.anagram-extras p{margin:0;color:var(--text-secondary);font-size:.75rem}.letter-rack,.examples{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.letter-rack span{display:grid;place-items:center;width:38px;height:42px;border:1px solid #c7d2fe;border-radius:8px;background:#eef2ff;color:#3730a3;font-weight:900}.examples button{min-height:34px;padding:0 11px;border:1px solid var(--border-light);border-radius:999px;background:var(--bg-white);cursor:pointer}.anagram-filters{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;padding:14px 24px;background:var(--bg-section);border-bottom:1px solid var(--border-light)}.anagram-filters label{display:grid;gap:4px;font-size:.72rem;font-weight:800}.anagram-filters input,.anagram-filters select,.anagram-filters button{min-width:0;min-height:40px;padding:0 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);color:var(--text-main)}.anagram-filters button{align-self:end;background:#4f46e5;color:white;font-weight:800;cursor:pointer}@media(max-width:700px){.anagram-filters{grid-template-columns:1fr 1fr;padding:12px}.anagram-filters button{grid-column:1/-1}.anagram-extras{padding-inline:16px}}`}</style>
    </div>
  );
}
