'use client';

import { useState, useCallback, useRef } from 'react';

// ─── Humanization engine ───────────────────────────────────────────────────────
// These all run client-side, no API needed.

const CONTRACTIONS = [
  ['do not', "don't"], ['does not', "doesn't"], ['did not', "didn't"],
  ['is not', "isn't"], ['are not', "aren't"], ['was not', "wasn't"],
  ['were not', "weren't"], ['have not', "haven't"], ['has not', "hasn't"],
  ['had not', "hadn't"], ['will not', "won't"], ['would not', "wouldn't"],
  ['could not', "couldn't"], ['should not', "shouldn't"], ['cannot', "can't"],
  ['I am', "I'm"], ['I have', "I've"], ['I will', "I'll"], ['I would', "I'd"],
  ['you are', "you're"], ['you have', "you've"], ['you will', "you'll"],
  ['he is', "he's"], ['she is', "she's"], ['it is', "it's"],
  ['they are', "they're"], ['they have', "they've"], ['they will', "they'll"],
  ['we are', "we're"], ['we have', "we've"], ['we will', "we'll"],
  ['that is', "that's"], ['there is', "there's"], ['here is', "here's"],
  ['let us', "let's"], ['it will', "it'll"], ['that would', "that'd"],
];

// Formal → casual word swaps
const CASUAL_SWAPS = [
  ['utilize', 'use'], ['purchase', 'buy'], ['commence', 'start'], ['terminate', 'end'],
  ['demonstrate', 'show'], ['inquire', 'ask'], ['assist', 'help'],
  ['regarding', 'about'], ['endeavor', 'try'], ['sufficient', 'enough'],
  ['approximately', 'about'], ['consequently', 'so'], ['however', 'but'],
  ['therefore', 'so'], ['additionally', 'also'], ['subsequently', 'then'],
  ['prior to', 'before'], ['in order to', 'to'], ['as well as', 'and'],
  ['at this point in time', 'now'], ['in the event that', 'if'],
  ['due to the fact that', 'because'], ['it is important to note that', 'note that'],
  ['it should be noted that', 'note that'], ['in accordance with', 'following'],
  ['with regard to', 'about'], ['in terms of', 'for'],
];

// Formal → formal-but-natural (for formal mode)
const FORMAL_SWAPS = [
  ['very', 'particularly'], ['a lot', 'considerably'], ['big', 'significant'],
  ['small', 'minor'], ['good', 'favorable'], ['bad', 'unfavorable'],
  ['hard', 'challenging'], ['easy', 'straightforward'], ['fast', 'rapid'],
  ['slow', 'gradual'], ['show', 'demonstrate'], ['help', 'facilitate'],
  ['use', 'employ'], ['start', 'initiate'], ['end', 'conclude'],
];

// AI-isms to rewrite
const AI_ISMS = [
  ['As an AI language model,', ''],
  ['As an AI,', ''],
  ['I am an AI', 'I'],
  ["I don't have personal opinions", 'Here is a perspective'],
  ['It is important to note that', 'Note that'],
  ['It is worth noting that', 'Worth noting:'],
  ['In conclusion,', 'To wrap up,'],
  ['In summary,', 'In short,'],
  ['Furthermore,', 'Also,'],
  ['Moreover,', 'On top of that,'],
  ['In addition,', 'Plus,'],
  ['It can be seen that', 'Clearly,'],
  ['It is clear that', 'Clearly,'],
  ['It is evident that', 'Evidently,'],
  ['This is a complex topic', 'This topic has many angles'],
  ['There are several factors', 'Several things'],
  ['plays a crucial role in', 'is key for'],
  ['plays a pivotal role in', 'is central to'],
  ['is of paramount importance', 'is crucial'],
  ['ensure that', 'make sure'],
  ['is designed to', 'helps'],
  ['providing a comprehensive', 'giving a full'],
];

// Simple sentence variation - add filler phrases to some sentences
const CASUAL_FILLERS = [
  'Honestly, ', 'Look, ', 'Here\'s the thing: ', 'Real talk — ', 'Think about it: ',
  'The truth is, ', 'Here\'s what I mean: ', 'To be fair, ', 'Basically, ',
];

const FORMAL_OPENERS = [
  'Indeed, ', 'Notably, ', 'Evidently, ', 'Importantly, ', 'In practice, ',
  'Broadly speaking, ', 'Strictly speaking, ', 'Upon reflection, ',
];

function applyCasualSwaps(text) {
  let result = text;
  for (const [from, to] of CASUAL_SWAPS) {
    const re = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(re, (m) => m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
  }
  return result;
}

function applyFormalSwaps(text) {
  let result = text;
  for (const [from, to] of FORMAL_SWAPS) {
    const re = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(re, (m) => m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
  }
  return result;
}

function stripAIisms(text) {
  let result = text;
  for (const [from, to] of AI_ISMS) {
    result = result.split(from).join(to);
  }
  return result;
}

function applyContractions(text) {
  let result = text;
  for (const [from, to] of CONTRACTIONS) {
    const re = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(re, (m) => {
      // Preserve capitalization of first char
      if (m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase()) {
        return to[0].toUpperCase() + to.slice(1);
      }
      return to;
    });
  }
  return result;
}

function varyFirstWords(text, fillers, probability = 0.18) {
  return text.replace(/(?:^|(?<=\n\n))([A-Z][^.!?\n]{20,})/gm, (match) => {
    if (Math.random() < probability) {
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      // Only add if sentence doesn't already start with a filler
      const startsWithFiller = fillers.some(f => match.startsWith(f));
      if (!startsWithFiller) return filler + match[0].toLowerCase() + match.slice(1);
    }
    return match;
  });
}

function varyParagraphLength(text) {
  // Merge very short (1-sentence) paragraphs with the next where possible
  return text.replace(/([^.!?]+[.!?])\n\n([A-Z])/g, (match, p1, p2) => {
    if (p1.split(/\s+/).length < 10 && Math.random() < 0.4) {
      return p1 + ' ' + p2;
    }
    return match;
  });
}

function addSimpleVariation(text) {
  // Occasionally split overly long sentences at "and" / "but"
  return text.replace(/([^.!?\n]{100,}?),?\s(and|but)\s/gi, (match, p1, conj) => {
    if (Math.random() < 0.35) {
      return p1 + '. ' + conj[0].toUpperCase() + conj.slice(1) + ' ';
    }
    return match;
  });
}

function simpleMode(text) {
  // Short sentences, plain words
  let result = stripAIisms(text);
  result = applyContractions(result);
  result = applyCasualSwaps(result);
  return result;
}

function creativeMode(text) {
  let result = stripAIisms(text);
  result = applyContractions(result);
  result = applyCasualSwaps(result);
  result = addSimpleVariation(result);
  // Add vivid adjective swaps
  result = result.replace(/\bgood\b/gi, m => ['excellent', 'strong', 'solid'][Math.floor(Math.random() * 3)]);
  result = result.replace(/\bbig\b/gi, m => ['substantial', 'major', 'large'][Math.floor(Math.random() * 3)]);
  result = result.replace(/\bimportant\b/gi, m => ['essential', 'critical', 'vital'][Math.floor(Math.random() * 3)]);
  return result;
}

function humanize(text, mode) {
  let result = text.trim();
  if (!result) return '';

  // Always strip AI-isms
  result = stripAIisms(result);
  // Normalize multiple spaces
  result = result.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  switch (mode) {
    case 'standard':
      result = applyContractions(result);
      result = applyCasualSwaps(result);
      result = addSimpleVariation(result);
      break;
    case 'casual':
      result = applyContractions(result);
      result = applyCasualSwaps(result);
      result = addSimpleVariation(result);
      result = varyFirstWords(result, CASUAL_FILLERS, 0.25);
      result = varyParagraphLength(result);
      break;
    case 'formal':
      result = applyFormalSwaps(result);
      result = varyFirstWords(result, FORMAL_OPENERS, 0.15);
      break;
    case 'creative':
      result = creativeMode(result);
      result = varyFirstWords(result, CASUAL_FILLERS, 0.2);
      break;
    case 'simple':
      result = simpleMode(result);
      break;
    default:
      result = applyContractions(result);
      result = applyCasualSwaps(result);
  }

  // Final cleanup
  result = result.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

// ─── Diff helper: word-level changes ─────────────────────────────────────────
function wordDiff(original, humanized) {
  const origWords = original.split(/(\s+)/);
  const humWords = humanized.split(/(\s+)/);
  // Simple LCS-based diff
  const result = [];
  let oi = 0, hi = 0;
  while (oi < origWords.length || hi < humWords.length) {
    const o = origWords[oi], h = humWords[hi];
    if (o === h) { result.push({ type: 'same', text: o }); oi++; hi++; }
    else if (o !== undefined && (h === undefined || origWords.slice(oi).indexOf(h) === -1)) {
      result.push({ type: 'removed', text: o }); oi++;
    } else if (h !== undefined) {
      result.push({ type: 'added', text: h }); hi++;
    }
  }
  return result;
}

const MODES = [
  { id: 'standard', label: '⚡ Standard', desc: 'Natural, clean, human-like' },
  { id: 'casual', label: '😊 Casual', desc: 'Friendly, conversational' },
  { id: 'formal', label: '👔 Formal', desc: 'Professional, polished' },
  { id: 'creative', label: '🎨 Creative', desc: 'Expressive, varied vocabulary' },
  { id: 'simple', label: '📖 Simple', desc: 'Plain language, short sentences' },
];

export default function AITextHumanizer({ t, lang }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [toast, setToast] = useState(null);
  const [diffResult, setDiffResult] = useState([]);
  const [stats, setStats] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleHumanize = useCallback(() => {
    if (!input.trim()) { showToast('Please paste some AI text first', 'warning'); return; }
    if (input.length > 12000) { showToast('Text is too long (max ~10,000 characters)', 'warning'); return; }

    setIsProcessing(true);
    setShowDiff(false);

    // Simulate small processing delay for UX
    setTimeout(() => {
      const result = humanize(input, mode);
      setOutput(result);

      // Diff
      const diff = wordDiff(input, result);
      setDiffResult(diff);

      // Stats
      const inWords = input.trim().split(/\s+/).length;
      const outWords = result.trim().split(/\s+/).length;
      const changes = diff.filter(d => d.type !== 'same' && !/^\s+$/.test(d.text)).length;
      setStats({ inWords, outWords, changes, changePct: Math.round((changes / (inWords * 2)) * 100) });

      setIsProcessing(false);
    }, 350);
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) { showToast('Nothing to copy', 'warning'); return; }
    navigator.clipboard.writeText(output);
    showToast('Humanized text copied!');
  };

  const handleClear = () => {
    setInput(''); setOutput(''); setDiffResult([]); setStats(null); setShowDiff(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      showToast('Pasted!');
    } catch { showToast('Use Ctrl+V to paste', 'warning'); }
  };

  const inputWords = input.trim() ? input.trim().split(/\s+/).length : 0;
  const outputWords = output.trim() ? output.trim().split(/\s+/).length : 0;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {/* ── Mode selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px', marginBottom: '20px' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{
              padding: '12px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              border: `2px solid ${mode === m.id ? '#8b5cf6' : 'var(--border-light)'}`,
              background: mode === m.id ? 'rgba(139,92,246,0.1)' : 'var(--bg-section)',
              color: mode === m.id ? '#8b5cf6' : 'var(--text-secondary)',
              textAlign: 'center', transition: 'all 0.15s',
            }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{m.label}</div>
            <div style={{ fontSize: '0.74rem', marginTop: '4px', opacity: 0.8 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Editor grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>🤖 AI-Generated Text</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>📋 Paste</button>
              <button onClick={handleClear} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>🗑 Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your AI-generated text here (ChatGPT, Gemini, Claude, etc.)…"
            style={{
              width: '100%', height: '380px', fontFamily: 'system-ui, sans-serif',
              fontSize: '0.95rem', lineHeight: 1.75, padding: '16px',
              border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)', color: 'var(--text-primary)',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {inputWords} words · {input.length} chars
          </div>
        </div>

        {/* Output */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>✍️ Humanized Text</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {output && <button onClick={() => setShowDiff(d => !d)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>{showDiff ? '📄 Text' : '🔍 Diff'}</button>}
              <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>📋 Copy</button>
            </div>
          </div>

          {showDiff && diffResult.length > 0 ? (
            <div style={{
              width: '100%', height: '380px', fontFamily: 'system-ui, sans-serif',
              fontSize: '0.95rem', lineHeight: 1.75, padding: '16px',
              border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)', overflow: 'auto', boxSizing: 'border-box',
            }}>
              {diffResult.map((d, i) => {
                if (/^\s+$/.test(d.text)) return <span key={i}>{d.text}</span>;
                if (d.type === 'same') return <span key={i}>{d.text}</span>;
                if (d.type === 'added') return <span key={i} style={{ background: 'rgba(16,185,129,0.2)', color: '#065f46', borderRadius: '2px', padding: '0 1px' }}>{d.text}</span>;
                if (d.type === 'removed') return <span key={i} style={{ background: 'rgba(239,68,68,0.15)', color: '#991b1b', textDecoration: 'line-through', borderRadius: '2px', padding: '0 1px' }}>{d.text}</span>;
                return null;
              })}
            </div>
          ) : (
            <textarea
              value={output}
              onChange={e => setOutput(e.target.value)}
              readOnly={!output}
              placeholder={isProcessing ? 'Humanizing…' : 'Humanized text will appear here…'}
              style={{
                width: '100%', height: '380px', fontFamily: 'system-ui, sans-serif',
                fontSize: '0.95rem', lineHeight: 1.75, padding: '16px',
                border: `1.5px solid ${output ? '#8b5cf6' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                opacity: isProcessing ? 0.5 : 1,
              }}
            />
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {outputWords} words · {output.length} chars
            {showDiff && <span style={{ marginLeft: '8px', color: '#8b5cf6' }}>🟢 added &nbsp; 🔴 removed</span>}
          </div>
        </div>
      </div>

      {/* ── Humanize button ── */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleHumanize}
          disabled={isProcessing || !input.trim()}
          style={{
            padding: '13px 40px', borderRadius: 'var(--radius-full, 9999px)',
            background: isProcessing ? 'var(--border-light)' : 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
            color: isProcessing ? 'var(--text-secondary)' : '#fff',
            border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '1rem', fontWeight: 700, letterSpacing: '0.02em',
            boxShadow: isProcessing ? 'none' : '0 4px 20px rgba(139,92,246,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {isProcessing ? '⏳ Humanizing…' : '✨ Humanize Text'}
        </button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '📥', label: 'Input Words', value: stats.inWords, color: 'var(--text-primary)' },
            { icon: '📤', label: 'Output Words', value: stats.outWords, color: 'var(--text-primary)' },
            { icon: '🔄', label: 'Word Changes', value: stats.changes, color: '#8b5cf6' },
            { icon: '📊', label: 'Change Rate', value: `~${stats.changePct}%`, color: '#10b981' },
          ].map(card => (
            <div key={card.label} className="trust-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{card.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── What gets changed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' }}>
        {[
          { icon: '✂️', title: 'Removes AI phrases', desc: 'Strips "As an AI…", "It is important to note…" and other telltale AI patterns.' },
          { icon: '🤝', title: 'Adds contractions', desc: 'Converts "do not" → "don\'t", "I am" → "I\'m" for natural flow.' },
          { icon: '💬', title: 'Swaps formal words', desc: 'Replaces "utilize" → "use", "commence" → "start" for readability.' },
          { icon: '📏', title: 'Varies sentence length', desc: 'Splits long sentences and merges short ones for a natural rhythm.' },
        ].map(({ icon, title, desc }, i) => (
          <div key={i} className="trust-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
