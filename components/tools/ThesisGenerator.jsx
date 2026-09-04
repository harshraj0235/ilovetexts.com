'use client';

import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function ThesisGenerator({ t = {}, lang = 'en' }) {
  const [topic, setTopic] = useState('');
  const [argument, setArgument] = useState('');
  const [reasons, setReasons] = useState(['', '', '']);
  const [generatedTheses, setGeneratedTheses] = useState([]);
  const [toast, setToast] = useState(null);

  const handleReasonChange = (index, value) => {
    const newReasons = [...reasons];
    newReasons[index] = value;
    setReasons(newReasons);
  };

  const generateThesis = (e) => {
    if (e) e.preventDefault();

    if (!topic.trim() || !argument.trim() || !reasons[0].trim()) {
      setToast({ message: 'Please fill out the Topic, Argument, and at least Reason 1.', type: 'warning' });
      return;
    }

    const tTopic = topic.trim().toLowerCase();
    const tArg = argument.trim().toLowerCase();
    const validReasons = reasons.filter(r => r.trim() !== '').map(r => r.trim().toLowerCase());
    
    let reasonsStr = '';
    if (validReasons.length === 1) {
      reasonsStr = validReasons[0];
    } else if (validReasons.length === 2) {
      reasonsStr = `${validReasons[0]} and ${validReasons[1]}`;
    } else if (validReasons.length > 2) {
      const last = validReasons.pop();
      reasonsStr = `${validReasons.join(', ')}, and ${last}`;
    }

    const argumentative = `Although some may argue differently, ${tArg} regarding ${tTopic} is essential because it involves ${reasonsStr}.`;
    const analytical = `An analysis of ${tTopic} reveals that ${tArg}, primarily due to ${reasonsStr}.`;
    const expository = `The issue of ${tTopic} requires careful consideration of ${reasonsStr} in order to fully understand why ${tArg}.`;
    const direct = `Because of ${reasonsStr}, it is clear that ${tArg} when considering ${tTopic}.`;

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    setGeneratedTheses([
      { type: 'Argumentative', text: capitalize(argumentative), desc: 'Takes a strong stance and defends it.' },
      { type: 'Analytical', text: capitalize(analytical), desc: 'Breaks down the topic to evaluate it.' },
      { type: 'Expository', text: capitalize(expository), desc: 'Explains the subject to the audience.' },
      { type: 'Direct', text: capitalize(direct), desc: 'Straight to the point.' }
    ]);

    setToast({ message: 'Thesis statements generated successfully!', type: 'success' });
    
    setTimeout(() => {
      document.getElementById('thesis-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const clearForm = () => {
    setTopic('');
    setArgument('');
    setReasons(['', '', '']);
    setGeneratedTheses([]);
  };

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ border: '1px solid var(--brand-light)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        <div className="tool-panel-header" style={{ background: 'var(--brand-light)', padding: '24px' }}>
          <div className="tool-panel-title" style={{ color: 'var(--brand-color)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎓</span> BUILD YOUR THESIS
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
            Fill in the details below to generate 4 unique thesis statements instantly.
          </p>
        </div>
        
        <form onSubmit={generateThesis} style={{ padding: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                1. What is your Topic? <span style={{ color: 'var(--brand-color)' }}>*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Climate change"
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-white)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                2. What is your Main Argument? <span style={{ color: 'var(--brand-color)' }}>*</span>
              </label>
              <input
                type="text"
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                placeholder="e.g. We must transition to renewable energy"
                style={{
                  width: '100%', padding: '16px', fontSize: '1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-white)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
                required
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '32px', marginBottom: '32px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.1rem' }}>
              Why is your argument true? Provide up to 3 reasons.
            </h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              {reasons.map((reason, idx) => (
                <div key={idx}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Reason {idx + 1} {idx === 0 && <span style={{ color: 'var(--brand-color)' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => handleReasonChange(idx, e.target.value)}
                    placeholder={`e.g. ${idx === 0 ? 'Fossil fuels are depleting' : idx === 1 ? 'Carbon emissions are warming the planet' : 'Renewable energy is cheaper long-term'}`}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: '1rem',
                      border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-section)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'var(--font-sans)'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand-color)'; e.target.style.background = 'var(--bg-white)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.background = 'var(--bg-section)'; }}
                    required={idx === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: '1 1 200px', padding: '16px', fontSize: '1.2rem', background: 'var(--brand-color)' }}
            >
              ✨ Generate Statements
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {generatedTheses.length > 0 && (
        <div id="thesis-results" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Generated Options</h3>
            <span style={{ background: 'var(--brand-light)', color: 'var(--brand-color)', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>
              {generatedTheses.length} variations
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {generatedTheses.map((thesis, idx) => (
              <div key={idx} className="tool-panel" style={{ border: '1px solid var(--border-light)', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer' }}
                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                   onClick={() => copyToClipboard(thesis.text)}
              >
                <div style={{ background: 'var(--bg-section)', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{thesis.type}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{thesis.desc}</p>
                  </div>
                  <button className="btn btn-ghost btn-icon" title="Copy to clipboard" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-light)' }}>
                    📋
                  </button>
                </div>
                <div style={{ padding: '24px' }}>
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                    {thesis.text}
                  </p>
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
