'use client';

import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function EssayOutliner({ t = {}, lang = 'en' }) {
  const [topic, setTopic] = useState('');
  const [essayType, setEssayType] = useState('argumentative');
  const [thesis, setThesis] = useState('');
  const [bodyCount, setBodyCount] = useState(3);
  
  const [outline, setOutline] = useState(null);
  const [toast, setToast] = useState(null);

  const generateOutline = (e) => {
    if (e) e.preventDefault();

    if (!topic.trim()) {
      setToast({ message: 'Please provide a topic for your essay.', type: 'warning' });
      return;
    }

    let generated = [];

    // Introduction
    generated.push({
      section: 'I. Introduction',
      points: [
        { label: 'Hook', desc: `An engaging opening statement to grab the reader's attention about ${topic}.` },
        { label: 'Background Information', desc: `Brief context or history explaining the significance of ${topic}.` },
        { label: 'Thesis Statement', desc: thesis.trim() ? thesis : `Your main argument or purpose statement regarding ${topic}.` }
      ]
    });

    // Body Paragraphs
    for (let i = 1; i <= bodyCount; i++) {
      let title = `II. Body Paragraph ${i}`;
      if (i === 2) title = `III. Body Paragraph ${i}`;
      if (i === 3) title = `IV. Body Paragraph ${i}`;
      if (i === 4) title = `V. Body Paragraph ${i}`;
      if (i === 5) title = `VI. Body Paragraph ${i}`;

      let isCounter = false;
      // If argumentative and last body paragraph, make it a counterargument
      if (essayType === 'argumentative' && i === bodyCount) {
        isCounter = true;
        title += ' (Counterargument & Rebuttal)';
      }

      if (isCounter) {
        generated.push({
          section: title,
          points: [
            { label: 'Counterargument', desc: `Acknowledge a valid point from the opposing side regarding ${topic}.` },
            { label: 'Rebuttal', desc: `Explain why this opposing view is flawed or less significant than your main thesis.` },
            { label: 'Transition', desc: 'Smoothly lead into your conclusion.' }
          ]
        });
      } else {
        generated.push({
          section: title,
          points: [
            { label: 'Topic Sentence', desc: `Introduce the main idea of this paragraph ${essayType === 'narrative' ? '(Plot point or event)' : '(A supporting argument)'}.` },
            { label: 'Evidence/Details', desc: `Provide facts, quotes, or vivid details to support this paragraph's main idea.` },
            { label: 'Analysis', desc: `Explain how the evidence proves your point and connects back to your thesis.` },
            { label: 'Transition', desc: 'A concluding sentence that flows into the next paragraph.' }
          ]
        });
      }
    }

    // Conclusion
    const romanNumeral = bodyCount === 3 ? 'V' : bodyCount === 4 ? 'VI' : 'VII';
    
    let conclusionPoints = [
      { label: 'Restate Thesis', desc: 'Rephrase your thesis statement in a new, impactful way (do not just copy-paste it).' },
      { label: 'Summarize Main Points', desc: 'Briefly recap the key arguments made in your body paragraphs.' },
    ];

    if (essayType === 'narrative') {
      conclusionPoints.push({ label: 'Moral / Reflection', desc: 'What was learned from the experience?' });
    } else {
      conclusionPoints.push({ label: 'Final Thought / Call to Action', desc: `Leave the reader with a lasting impression or a broader implication about ${topic}.` });
    }

    generated.push({
      section: `${romanNumeral}. Conclusion`,
      points: conclusionPoints
    });

    setOutline(generated);
    setToast({ message: 'Essay outline generated successfully!', type: 'success' });
    
    setTimeout(() => {
      document.getElementById('outline-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copyToClipboard = () => {
    if (!outline) return;
    
    let text = `Essay Outline: ${topic}\nType: ${essayType.charAt(0).toUpperCase() + essayType.slice(1)}\n\n`;
    
    outline.forEach(section => {
      text += `${section.section}\n`;
      section.points.forEach(point => {
        text += `  - ${point.label}: ${point.desc}\n`;
      });
      text += '\n';
    });
    
    navigator.clipboard.writeText(text);
    setToast({ message: 'Outline copied to clipboard!', type: 'success' });
  };

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, #F0FDF4, var(--bg-white))', padding: '24px' }}>
          <div className="tool-panel-title" style={{ color: '#16A34A', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📋</span> ESSAY OUTLINER
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
            Generate a perfectly structured essay outline in seconds.
          </p>
        </div>
        
        <form onSubmit={generateOutline} style={{ padding: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Essay Topic <span style={{ color: 'var(--brand-color)' }}>*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The impact of social media"
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-white)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#16A34A'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Essay Type
              </label>
              <select
                value={essayType}
                onChange={(e) => setEssayType(e.target.value)}
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-white)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-sans)',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#16A34A'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
              >
                <option value="argumentative">Argumentative</option>
                <option value="analytical">Analytical</option>
                <option value="expository">Expository</option>
                <option value="narrative">Narrative</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Body Paragraphs
              </label>
              <select
                value={bodyCount}
                onChange={(e) => setBodyCount(Number(e.target.value))}
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-white)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-sans)',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#16A34A'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
              >
                <option value={3}>3 (Standard 5-Paragraph Essay)</option>
                <option value={4}>4 Paragraphs</option>
                <option value={5}>5 Paragraphs</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
             <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Thesis Statement (Optional)
              </label>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="Enter your thesis statement here, or leave blank and we'll add a placeholder."
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-section)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', 
                  fontFamily: 'var(--font-sans)', minHeight: '100px', resize: 'vertical'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.background = 'var(--bg-white)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.background = 'var(--bg-section)'; }}
              />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: '1 1 200px', padding: '16px', fontSize: '1.2rem', background: '#16A34A' }}
            >
              ✨ Generate Outline
            </button>
            <button
              type="button"
              onClick={() => { setTopic(''); setThesis(''); setOutline(null); }}
              className="btn btn-secondary"
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {outline && (
        <div id="outline-results" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Essay Outline</h3>
              <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>
                {outline.length} Sections
              </span>
            </div>
            <button onClick={copyToClipboard} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               📋 Copy to Clipboard
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '24px' }}>
            {outline.map((section, idx) => (
              <div key={idx} className="tool-panel" style={{ border: '1px solid var(--border-light)' }}>
                <div style={{ background: 'var(--bg-section)', padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{section.section}</h4>
                </div>
                <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
                   {section.points.map((point, pIdx) => (
                     <div key={pIdx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', 
                          marginTop: '8px', flexShrink: 0 
                        }}></div>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '4px' }}>{point.label}</strong>
                          <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{point.desc}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
