'use client';

import { useState, useMemo, useEffect } from 'react';

export default function CaptionFormatter({ t, lang }) {
  const [input, setInput] = useState('');
  
  const [wordsPerChunk, setWordsPerChunk] = useState(5);
  const [formatStyle, setFormatStyle] = useState('double-spaced'); // double-spaced, single-spaced, bullet-points
  const [uppercase, setUppercase] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_caption_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_caption_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const chunks = useMemo(() => {
    if (!input) return [];

    let text = input.replace(/\s+/g, ' ').trim();
    if (uppercase) text = text.toUpperCase();

    const words = text.split(' ');
    const chunkArray = [];

    for (let i = 0; i < words.length; i += parseInt(wordsPerChunk)) {
      chunkArray.push(words.slice(i, i + parseInt(wordsPerChunk)).join(' '));
    }

    return chunkArray;
  }, [input, wordsPerChunk, uppercase]);

  const formattedOutput = useMemo(() => {
    if (formatStyle === 'double-spaced') {
      return chunks.join('\n\n');
    }
    if (formatStyle === 'single-spaced') {
      return chunks.join('\n');
    }
    if (formatStyle === 'bullet-points') {
      return chunks.map(c => `• ${c}`).join('\n');
    }
    return chunks.join('\n\n');
  }, [chunks, formatStyle]);

  const handleCopy = async () => {
    if (!formattedOutput) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
      showToast('Copied formatted captions!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace">
      
      {/* SETTINGS */}
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>🎬</span> Caption Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Words Per Chunk</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="range" 
                min="2" max="15" 
                value={wordsPerChunk} 
                onChange={(e) => setWordsPerChunk(e.target.value)} 
                style={{ flex: '1', accentColor: 'var(--brand-color)' }}
              />
              <span style={{ fontWeight: 'bold', background: 'var(--bg-white)', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                {wordsPerChunk}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Tip: 3-5 words is best for fast-paced TikToks.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Output Format</label>
            <select 
              value={formatStyle} 
              onChange={(e) => setFormatStyle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
            >
              <option value="double-spaced">Double Spaced (Easy reading)</option>
              <option value="single-spaced">Single Spaced (Compact)</option>
              <option value="bullet-points">Bullet Points</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Styling</label>
            <label style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} /> 
              ALL CAPS (MrBeast Style)
            </label>
          </div>
        </div>
      </div>

      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* INPUT */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Script</span>
            <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>Clear</button>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your giant block of script text here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        {/* PHONE PREVIEW (UNIQUE UI) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--brand-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span> 
            Live Preview
          </div>
          <div style={{ 
            width: '280px', height: '500px', 
            background: 'url("https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80") center/cover', 
            borderRadius: '36px', border: '14px solid #111', 
            position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.5)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(1deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%)' }}></div>
            
            {/* Play Button Mock */}
            <div style={{ position: 'absolute', right: '16px', bottom: '100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}><span style={{color: 'white', fontSize: '1.2rem'}}>❤️</span></div>
              <div style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}><span style={{color: 'white', fontSize: '1.2rem'}}>💬</span></div>
            </div>

            {/* Simulated Caption */}
            <div style={{ 
              position: 'absolute', left: '0', right: '0', top: '55%', transform: 'translateY(-50%)', 
              display: 'flex', justifyContent: 'center', padding: '0 24px' 
            }}>
              {chunks.length > 0 ? (
                <div style={{ 
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: '#fff', 

                  fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '1.2rem', fontWeight: '800', 
                  padding: '8px 16px', borderRadius: '8px', textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)'
                }}>
                  {chunks[0]}
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Your caption will appear here...</div>
              )}
            </div>
            
            {/* Bottom Bar Mock */}
            <div style={{ position: 'absolute', bottom: '20px', left: '16px', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
              @username <br/><span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>Sound goes here...</span>
            </div>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Formatted Text</span>
            <button onClick={handleCopy} className="action-btn primary">
              📋 Copy All
            </button>
          </div>
          <textarea
            className="code-editor"
            value={formattedOutput}
            readOnly
            placeholder="Formatted caption chunks will appear here..."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical', background: 'var(--bg-section)' }}
          />
        </div>

      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
