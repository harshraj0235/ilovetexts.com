'use client';

import { useState, useMemo } from 'react';

// ─── Classic Lorem Ipsum corpus ────────────────────────────────────────────────
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem'.split(' ');

const HIPSTER_WORDS = 'artisan craft vegan sustainable organic aesthetic brunch kombucha quinoa avocado matcha cold-brew sourdough fermented kale sriracha umami tattooed flannel biodiesel ethical bushwick microdosing mixtape pitchfork wayfarers authentic freegan gentrify brooklyn letterpress crucifix skateboard poutine tbh glossier selfies tumblr retro kinfolk mindfulness meditation yoga smoothie-bowl acai granola gluten-free farm-to-table foraged heirloom locally-sourced minimalist boho chic vintage thrift upcycled zero-waste'.split(' ');

const OFFICE_WORDS = 'synergy leverage paradigm bandwidth proactive scalable streamline deliverable stakeholder milestone roadmap pipeline agile sprint backlog workflow optimize analytics dashboard metrics KPI baseline benchmark alignment visibility transparency accountability initiative framework engagement ecosystem innovation disruption transformation strategy objective outcome ideation pivot iterate prototype deploy integrate'.split(' ');

const PIRATE_WORDS = 'ahoy matey scallywag buccaneer plunder treasure doubloon galleon cannon rum grog sailor anchor compass voyage sea ocean wave storm port starboard quartermaster captain deck mast rigging plank cutlass pistol jolly roger skull crossbones shipwreck island lagoon reef kraken parrot hook peg flag bounty mutiny chart sextant horizon'.split(' ');

function getWordPool(style) {
  switch(style) {
    case 'hipster': return HIPSTER_WORDS;
    case 'office': return OFFICE_WORDS;
    case 'pirate': return PIRATE_WORDS;
    default: return LOREM_WORDS;
  }
}

function generateWord(pool) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return pool[arr[0] % pool.length];
}

function generateSentence(pool, minWords = 6, maxWords = 15) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const wordCount = minWords + (arr[0] % (maxWords - minWords + 1));
  const words = [];
  for (let i = 0; i < wordCount; i++) words.push(generateWord(pool));
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function generateParagraph(pool, sentenceCount = 4) {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) sentences.push(generateSentence(pool));
  return sentences.join(' ');
}

function generateList(pool, count) {
  const items = [];
  for (let i = 0; i < count; i++) items.push(generateSentence(pool, 4, 10));
  return items;
}

export default function LoremIpsumGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  const [unit, setUnit] = useState('paragraphs'); // paragraphs, sentences, words, list
  const [count, setCount] = useState(3);
  const [style, setStyle] = useState('classic');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [htmlWrap, setHtmlWrap] = useState(false);
  const [generated, setGenerated] = useState('');
  const [listItems, setListItems] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generate = () => {
    const pool = getWordPool(style);
    let result = '';
    
    if (unit === 'paragraphs') {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        let p = generateParagraph(pool, 3 + Math.floor(Math.random() * 3));
        if (i === 0 && startWithLorem && style === 'classic') {
          p = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + p;
        }
        paragraphs.push(p);
      }
      result = htmlWrap ? paragraphs.map(p => `<p>${p}</p>`).join('\n\n') : paragraphs.join('\n\n');
      setListItems([]);
    } else if (unit === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) sentences.push(generateSentence(pool));
      if (startWithLorem && style === 'classic' && sentences.length > 0) {
        sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }
      result = sentences.join(' ');
      setListItems([]);
    } else if (unit === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) words.push(generateWord(pool));
      if (startWithLorem && style === 'classic' && words.length >= 2) {
        words[0] = 'Lorem'; words[1] = 'ipsum';
      }
      result = words.join(' ');
      setListItems([]);
    } else if (unit === 'list') {
      const items = generateList(pool, count);
      if (htmlWrap) {
        result = `<ul>\n${items.map(li => `  <li>${li}</li>`).join('\n')}\n</ul>`;
      } else {
        result = items.map((li, i) => `${i + 1}. ${li}`).join('\n');
      }
      setListItems(items);
    }

    setGenerated(result);
    showToast(`Generated ${count} ${unit}!`);
  };

  // Stats
  const stats = useMemo(() => {
    if (!generated) return { words: 0, chars: 0, sentences: 0, bytes: 0 };
    const text = generated.replace(/<[^>]*>/g, '');
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
      sentences: (text.match(/[.!?]+/g) || []).length,
      bytes: new Blob([text]).size,
    };
  }, [generated]);

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      showToast('Copied to clipboard!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleDownload = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `lorem_ipsum_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  };

  return (
    <div className="tool-workspace" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Stats Bar ── */}
      {generated && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Words', value: stats.words, icon: '📝' },
            { label: 'Characters', value: stats.chars.toLocaleString(), icon: '🔤' },
            { label: 'Sentences', value: stats.sentences, icon: '📏' },
            { label: 'Bytes', value: `${(stats.bytes / 1024).toFixed(1)} KB`, icon: '💾' },
          ].map(s => (
            <div key={s.label} style={{
              flex: '1 1 100px', padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-section)', border: '1px solid var(--border-light)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ background: 'var(--bg-section)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>

        {/* Style Picker */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Style</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'classic', label: '📜 Classic Latin', desc: 'Traditional Lorem Ipsum' },
              { id: 'hipster', label: '☕ Hipster', desc: 'Artisan craft vibes' },
              { id: 'office', label: '💼 Corporate', desc: 'Business buzzwords' },
              { id: 'pirate', label: '🏴‍☠️ Pirate', desc: 'Ahoy, placeholder!' },
            ].map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)}
                style={{
                  flex: '1 1 140px', padding: '12px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: style === s.id ? '2px solid var(--brand-color)' : '1px solid var(--border-light)',
                  background: style === s.id ? 'rgba(139,92,246,0.08)' : 'var(--bg-white)',
                  textAlign: 'left', transition: 'all 0.2s',
                }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: style === s.id ? 'var(--brand-color)' : 'var(--text-primary)' }}>{s.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Unit */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Generate</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)' }}>
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
              <option value="list">Bullet List</option>
            </select>
          </div>
          {/* Count */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Count</label>
            <input type="number" min="1" max="200" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)' }} />
          </div>
          {/* Options */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)} />
                Start with "Lorem ipsum..."
              </label>
              <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={htmlWrap} onChange={(e) => setHtmlWrap(e.target.checked)} />
                Wrap in HTML tags
              </label>
            </div>
          </div>
        </div>

        <button onClick={generate} className="action-btn primary"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          📝 Generate Lorem Ipsum
        </button>
      </div>

      {/* ── Output ── */}
      {generated && (
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Generated Text</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDownload} className="action-btn" style={{ fontSize: '0.82rem' }}>⬇️ Download</button>
              <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy</button>
            </div>
          </div>
          <textarea
            value={generated}
            readOnly
            spellCheck="false"
            style={{ width: '100%', height: '400px', padding: '24px', fontSize: '1rem', fontFamily: htmlWrap ? 'monospace' : 'inherit', lineHeight: '1.8', border: 'none', background: 'transparent', resize: 'vertical', color: 'var(--text-primary)' }}
          />
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
