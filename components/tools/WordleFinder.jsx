'use client';

import { useMemo, useRef, useState } from 'react';

const API_URL = 'https://api.datamuse.com/words';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const cleanLetter = (value) => value.replace(/[^a-z]/gi, '').slice(-1).toLowerCase();
const countLetters = (letters) => letters.reduce((counts, letter) => {
  if (letter) counts[letter] = (counts[letter] || 0) + 1;
  return counts;
}, {});

function ClueRow({ type, values, label, hint, inputRefs, onChange, onKeyDown }) {
  return <fieldset className={`clue-card ${type}`}><legend>{label}</legend><p>{hint}</p><div className="tile-row">
    {values.map((value, index) => <input key={`${type}-${index}`} ref={(element) => { inputRefs.current[index] = element; }} value={value} onChange={(event) => onChange(type, index, event.target.value)} onKeyDown={(event) => onKeyDown(event, type, index)} aria-label={`${type === 'green' ? 'Correct' : 'Misplaced'} letter in position ${index + 1}`} maxLength={1} autoComplete="off" />)}
  </div></fieldset>;
}

export default function WordleFinder() {
  const [greenLetters, setGreenLetters] = useState(Array(5).fill(''));
  const [yellowLetters, setYellowLetters] = useState(Array(5).fill(''));
  const [greyLetters, setGreyLetters] = useState('');
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState('score');
  const [resultFilter, setResultFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const greenRefs = useRef([]);
  const yellowRefs = useRef([]);

  const knownLetters = [...greenLetters, ...yellowLetters].filter(Boolean);
  const activeGreys = [...new Set(greyLetters.toLowerCase().split('').filter((letter) => !knownLetters.includes(letter)))];
  const ignoredGreys = [...new Set(greyLetters.toLowerCase().split('').filter((letter) => knownLetters.includes(letter)))];
  const positionConflicts = greenLetters.flatMap((letter, index) => letter && letter === yellowLetters[index] ? [index + 1] : []);
  const visibleWords = useMemo(() => words
    .filter(({ word }) => word.includes(resultFilter.toLowerCase()))
    .sort((a, b) => sortBy === 'alphabetical' ? a.word.localeCompare(b.word) : (b.score || 0) - (a.score || 0)), [words, resultFilter, sortBy]);

  const updateBox = (type, index, value) => {
    const letter = cleanLetter(value);
    const setter = type === 'green' ? setGreenLetters : setYellowLetters;
    const current = type === 'green' ? greenLetters : yellowLetters;
    const refs = type === 'green' ? greenRefs : yellowRefs;
    setter(current.map((item, itemIndex) => itemIndex === index ? letter : item));
    if (letter && index < 4) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event, type, index) => {
    const current = type === 'green' ? greenLetters : yellowLetters;
    const refs = type === 'green' ? greenRefs : yellowRefs;
    if (event.key === 'Backspace' && !current[index] && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 4) refs.current[index + 1]?.focus();
  };

  const toggleGrey = (letter) => {
    const lower = letter.toLowerCase();
    setGreyLetters((current) => current.toLowerCase().includes(lower) ? current.toLowerCase().replaceAll(lower, '') : `${current}${lower}`);
  };

  const searchWords = async (event) => {
    event?.preventDefault();
    if (positionConflicts.length) {
      setError(`A letter cannot be both green and yellow in position ${positionConflicts.join(', ')}.`);
      return;
    }
    setIsSearching(true);
    setError('');
    setHasSearched(true);
    try {
      const pattern = greenLetters.map((letter) => letter || '?').join('');
      const response = await fetch(`${API_URL}?sp=${pattern}&max=1000`);
      if (!response.ok) throw new Error('The dictionary service did not respond.');
      const requiredCounts = countLetters([...greenLetters, ...yellowLetters]);
      const matches = (await response.json()).filter(({ word }) => {
        const candidate = word?.toLowerCase();
        if (!/^[a-z]{5}$/.test(candidate)) return false;
        if (yellowLetters.some((letter, index) => letter && candidate[index] === letter)) return false;
        if (activeGreys.some((letter) => candidate.includes(letter))) return false;
        const candidateCounts = countLetters(candidate.split(''));
        return Object.entries(requiredCounts).every(([letter, count]) => (candidateCounts[letter] || 0) >= count);
      });
      setWords(matches);
      setSelected([]);
    } catch (searchError) {
      setWords([]);
      setError(searchError instanceof Error ? searchError.message : 'Unable to search right now.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearBoard = () => {
    setGreenLetters(Array(5).fill('')); setYellowLetters(Array(5).fill('')); setGreyLetters('');
    setWords([]); setSelected([]); setResultFilter(''); setError(''); setHasSearched(false);
  };
  const toggleSelected = (word) => setSelected((current) => current.includes(word) ? current.filter((item) => item !== word) : [...current, word]);
  const copyResults = async () => {
    const values = selected.length ? selected : visibleWords.map(({ word }) => word);
    if (values.length) await navigator.clipboard.writeText(values.join(', '));
  };

  return <div className="word-finder">
    <section className="solver-card" aria-labelledby="solver-title">
      <header><span className="eyebrow">Spoiler-free five-letter finder</span><h2 id="solver-title">Turn tile clues into a focused shortlist</h2><p>Enter only the feedback you already have. This tool never reveals or stores a daily answer.</p></header>
      <form onSubmit={searchWords}>
        <div className="clue-grid"><ClueRow type="green" values={greenLetters} label="Correct positions" hint="Green letters stay in these exact slots." inputRefs={greenRefs} onChange={updateBox} onKeyDown={handleKeyDown} /><ClueRow type="yellow" values={yellowLetters} label="Wrong positions" hint="Yellow letters must appear, but not in these slots." inputRefs={yellowRefs} onChange={updateBox} onKeyDown={handleKeyDown} /></div>
        <fieldset className="keyboard-card"><legend>Excluded letters</legend><p>Tap letters confirmed absent. A duplicate grey letter that is also green or yellow is safely ignored.</p><div className="keyboard" aria-label="Excluded letter keyboard">{ALPHABET.map((letter) => <button type="button" key={letter} aria-pressed={activeGreys.includes(letter.toLowerCase())} onClick={() => toggleGrey(letter)}>{letter}</button>)}</div></fieldset>
        {ignoredGreys.length > 0 && <p className="notice">Ignored as exclusions because these letters are also green or yellow: <strong>{ignoredGreys.join(', ').toUpperCase()}</strong></p>}
        {positionConflicts.length > 0 && <p className="warning">Resolve the green/yellow conflict in position {positionConflicts.join(', ')} before searching.</p>}
        <p className="privacy">Dictionary lookup uses Datamuse. Your clue pattern is sent only when you select Find words.</p>
        <div className="actions"><button type="button" className="secondary" onClick={clearBoard}>Clear board</button><button type="submit" className="primary" disabled={isSearching || positionConflicts.length > 0}>{isSearching ? 'Searching…' : 'Find matching words'}</button></div>
      </form>
    </section>
    {error && <div className="error" role="alert">{error}</div>}
    {hasSearched && !isSearching && !error && <section className="results" aria-live="polite">
      <div className="results-head"><div><span className="eyebrow">Possible matches</span><h3>{visibleWords.length} of {words.length} words</h3></div><div className="result-controls"><label>Filter<input value={resultFilter} onChange={(event) => setResultFilter(event.target.value.replace(/[^a-z]/gi, '').slice(0, 5))} placeholder="Contains…" /></label><label>Sort<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="score">Relevance</option><option value="alphabetical">A–Z</option></select></label><button type="button" onClick={copyResults}>Copy {selected.length ? `${selected.length} selected` : 'results'}</button></div></div>
      {visibleWords.length ? <div className="word-grid">{visibleWords.map(({ word }) => <button type="button" key={word} onClick={() => toggleSelected(word)} aria-pressed={selected.includes(word)}>{word}</button>)}</div> : <p className="empty">No dictionary words match every clue. Remove the newest constraint and check repeated letters.</p>}
      <p className="limit">These are Datamuse dictionary candidates, not an official answer list. A listed word may be rejected by a particular game.</p>
    </section>}
    <style jsx>{`
      .word-finder{display:grid;gap:24px}.solver-card,.results{overflow:hidden;border:1px solid var(--border-light);border-radius:20px;background:var(--bg-white);box-shadow:var(--shadow-card)}header{padding:30px;background:linear-gradient(135deg,#172033,#26344f);color:white}header h2{margin:7px 0 8px;font-size:clamp(1.55rem,4vw,2.25rem);line-height:1.1}header p{max-width:700px;margin:0;color:#dbe4f2}.eyebrow{font-size:.74rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#55bca5}form{display:grid;gap:20px;padding:24px}.clue-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}fieldset{min-width:0;margin:0;border:0}.clue-card,.keyboard-card{padding:18px;border:1px solid var(--border-light);border-radius:16px}.clue-card.green{background:#effaf5}.clue-card.yellow{background:#fff9e8}.clue-card legend,.keyboard-card legend{padding:0 6px;font-weight:900}.clue-card p,.keyboard-card p{margin:0 0 14px;color:var(--text-secondary);font-size:.83rem}.tile-row{display:grid;grid-template-columns:repeat(5,minmax(0,54px));justify-content:center;gap:8px}.tile-row input{width:100%;aspect-ratio:1;border:2px solid rgba(0,0,0,.13);border-radius:10px;color:white;text-align:center;text-transform:uppercase;font-size:clamp(1.35rem,4vw,1.9rem);font-weight:900}.green input{background:#2f8f69}.yellow input{background:#a8790d}.tile-row input:focus{outline:3px solid #6c82db;outline-offset:2px}.keyboard{display:flex;flex-wrap:wrap;justify-content:center;gap:7px}.keyboard button{min-width:38px;min-height:42px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-weight:800;cursor:pointer}.keyboard button[aria-pressed=true]{background:#475569;color:white;border-color:#334155}.notice,.warning,.privacy{margin:0;padding:11px 13px;border-radius:10px;font-size:.82rem}.notice{background:#eff6ff;color:#1e40af}.warning,.error{background:#fff1f2;color:#9f1239}.privacy{padding:0;color:var(--text-secondary)}.actions{display:flex;gap:12px}.actions button,.result-controls button{min-height:46px;border-radius:11px;padding:0 18px;font-weight:900;cursor:pointer}.secondary{flex:1;border:1px solid var(--border-light);background:var(--bg-white)}.primary{flex:2;border:0;background:#26344f;color:white}.primary:disabled{opacity:.55;cursor:not-allowed}.error{padding:15px;border:1px solid #fecdd3;border-radius:12px}.results-head{display:flex;justify-content:space-between;gap:20px;align-items:end;padding:20px 24px;border-bottom:1px solid var(--border-light)}.results-head h3{margin:5px 0 0}.result-controls{display:flex;align-items:end;gap:8px}.result-controls label{display:grid;gap:4px;font-size:.7rem;font-weight:900}.result-controls input,.result-controls select{min-height:42px;max-width:140px;border:1px solid var(--border-light);border-radius:9px;padding:0 10px;background:var(--bg-white);color:var(--text-main)}.result-controls button{border:0;background:#26344f;color:white}.word-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:9px;padding:24px}.word-grid button{min-height:48px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-section);color:var(--text-main);font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.word-grid button[aria-pressed=true]{background:#dbeafe;border-color:#3b82f6;color:#1e3a8a}.empty,.limit{margin:0;padding:24px;color:var(--text-secondary)}.limit{padding-top:0;font-size:.78rem}@media(max-width:760px){header,form{padding:18px}.clue-grid{grid-template-columns:1fr}.tile-row{gap:6px}.results-head{align-items:stretch;flex-direction:column;padding:18px}.result-controls{display:grid;grid-template-columns:1fr 1fr}.result-controls input,.result-controls select{width:100%;max-width:none}.result-controls button{grid-column:1/-1}.word-grid{padding:18px}.actions{flex-direction:column}.actions button{width:100%}}@media(max-width:390px){.clue-card,.keyboard-card{padding:13px}.keyboard button{min-width:34px}.tile-row input{border-radius:8px}}
    `}</style>
  </div>;
}
