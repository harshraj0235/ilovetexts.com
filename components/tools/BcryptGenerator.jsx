'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';

export default function BcryptGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('generator'); // generator, batch, checker
  
  // Generator State
  const [genInput, setGenInput] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [generatedHash, setGeneratedHash] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTime, setGenTime] = useState(0);

  // Batch State
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Checker State
  const [checkHash, setCheckHash] = useState('');
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState(null); // null, true, false
  const [isChecking, setIsChecking] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const estimateTime = (rounds) => {
    // Rough estimate for bcrypt execution time (in ms) on a modern browser
    const baseMs = 1; 
    return baseMs * Math.pow(2, rounds - 4);
  };

  const getDifficultyColor = (rounds) => {
    if (rounds < 8) return '#ef4444'; // Weak
    if (rounds < 12) return '#10b981'; // Good
    return '#f59e0b'; // Slow/High Security
  };

  const getDifficultyLabel = (rounds) => {
    if (rounds < 8) return 'Weak (Fast)';
    if (rounds < 12) return 'Standard (Recommended)';
    return 'High Security (Slow)';
  };

  const handleGenerate = () => {
    if (!genInput) {
      showToast('Please enter text to hash', 'warning');
      return;
    }
    setIsGenerating(true);
    const start = performance.now();
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(Number(saltRounds));
        const hash = bcrypt.hashSync(genInput, salt);
        setGeneratedHash(hash);
        setGenTime((performance.now() - start).toFixed(0));
      } catch (err) {
        showToast('Error generating hash', 'error');
      }
      setIsGenerating(false);
    }, 50);
  };

  const handleBatchGenerate = () => {
    if (!batchInput.trim()) {
      showToast('Please enter strings to hash', 'warning');
      return;
    }
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 100) {
      showToast('Max 100 lines for batch hashing to prevent browser freeze', 'warning');
      return;
    }
    setIsBatchGenerating(true);
    
    // Process in chunks to avoid blocking UI entirely
    setTimeout(() => {
      try {
        const results = [];
        const salt = bcrypt.genSaltSync(Number(saltRounds)); // use same salt for batch speed, or could gen per item
        // Better security: generate salt per item, but slower. We'll do per item.
        
        for (let i = 0; i < lines.length; i++) {
          const s = bcrypt.genSaltSync(Number(saltRounds));
          const h = bcrypt.hashSync(lines[i], s);
          results.push({ text: lines[i], hash: h });
        }
        setBatchResults(results);
        showToast(`Hashed ${lines.length} strings`);
      } catch (err) {
        showToast('Error in batch hashing', 'error');
      }
      setIsBatchGenerating(false);
    }, 50);
  };

  const handleCheck = () => {
    if (!checkHash || !checkText) {
      showToast('Please enter both hash and text', 'warning');
      return;
    }
    setIsChecking(true);
    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(checkText, checkHash);
        setCheckResult(match);
      } catch (err) {
        setCheckResult(false);
      }
      setIsChecking(false);
    }, 50);
  };

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  const handleDownloadBatch = () => {
    if (batchResults.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,Original String,Bcrypt Hash\n" + batchResults.map(r => `"${r.text.replace(/"/g, '""')}","${r.hash}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bcrypt_hashes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded!');
  };

  return (
    <div className="tool-workspace bcrypt-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border-light)', paddingBottom: '16px' }}>
        {[
          { id: 'generator', icon: '🛡️', label: 'Single Generator' },
          { id: 'batch', icon: '📦', label: 'Batch Generator' },
          { id: 'checker', icon: '✅', label: 'Hash Validator' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === tab.id ? 'var(--brand-color)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── GENERATOR SECTION ─── */}
      {activeTab === 'generator' && (
        <div className="bcrypt-section" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '32px', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>String to Hash</label>
              <input 
                type="text" 
                value={genInput} 
                onChange={(e) => setGenInput(e.target.value)}
                placeholder="Enter password or string..."
                style={{ width: '100%', padding: '14px 16px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', marginBottom: '16px' }}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="action-btn primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isGenerating ? 'Hashing...' : '🚀 Generate Bcrypt Hash'}
              </button>
            </div>
            
            <div style={{ background: 'var(--bg-white)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Salt Rounds: <span style={{ color: getDifficultyColor(saltRounds), fontSize: '1.2rem', marginLeft: '4px' }}>{saltRounds}</span>
              </label>
              <input 
                type="range" 
                min="4" max="16" 
                value={saltRounds} 
                onChange={(e) => setSaltRounds(Number(e.target.value))}
                style={{ width: '100%', marginTop: '10px', accentColor: getDifficultyColor(saltRounds) }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Security:</span>
                  <span style={{ fontWeight: 600, color: getDifficultyColor(saltRounds) }}>{getDifficultyLabel(saltRounds)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Est. Time:</span>
                  <span style={{ fontWeight: 600 }}>~{estimateTime(saltRounds).toFixed(0)} ms</span>
                </div>
              </div>
            </div>
          </div>

          {generatedHash && (
            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-white)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--brand-color)', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Generated Hash Result</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Took {genTime}ms</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={generatedHash} 
                  readOnly
                  style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontFamily: 'monospace', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-section)', color: 'var(--text-primary)' }}
                />
                <button onClick={() => handleCopy(generatedHash)} className="action-btn primary" style={{ padding: '0 24px' }}>📋 Copy</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── BATCH SECTION ─── */}
      {activeTab === 'batch' && (
        <div className="bcrypt-section" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Strings to Hash (One per line)</label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="password123&#10;admin2026&#10;supersecret"
                spellCheck="false"
                style={{ width: '100%', height: '200px', padding: '16px', fontSize: '1rem', fontFamily: 'monospace', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', resize: 'vertical' }}
              />
            </div>
            <div style={{ width: '250px', background: 'var(--bg-white)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Salt Rounds: <span style={{ color: getDifficultyColor(saltRounds), fontSize: '1.2rem', marginLeft: '4px' }}>{saltRounds}</span>
              </label>
              <input type="range" min="4" max="14" value={saltRounds} onChange={(e) => setSaltRounds(Number(e.target.value))} style={{ width: '100%', marginTop: '10px', accentColor: getDifficultyColor(saltRounds) }} />
              <button 
                onClick={handleBatchGenerate}
                disabled={isBatchGenerating || !batchInput}
                className="action-btn primary"
                style={{ width: '100%', padding: '12px', marginTop: '24px', fontSize: '1rem', fontWeight: '600' }}
              >
                {isBatchGenerating ? 'Hashing...' : '🚀 Batch Hash'}
              </button>
            </div>
          </div>

          {batchResults.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Results ({batchResults.length})</h3>
                <button onClick={handleDownloadBatch} className="action-btn" style={{ fontSize: '0.85rem' }}>⬇️ Download CSV</button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'var(--bg-white)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                {batchResults.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                    <div style={{ width: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.95rem' }} title={item.text}>{item.text}</div>
                    <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{item.hash}</div>
                    <button onClick={() => handleCopy(item.hash)} className="action-btn text-btn" style={{ fontSize: '0.85rem' }}>📋</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CHECKER SECTION ─── */}
      {activeTab === 'checker' && (
        <div className="bcrypt-section" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Bcrypt Hash to Check</label>
              <input 
                type="text" 
                value={checkHash} 
                onChange={(e) => { setCheckHash(e.target.value); setCheckResult(null); }}
                placeholder="$2a$10$..."
                style={{ width: '100%', padding: '14px 16px', fontSize: '1.1rem', fontFamily: 'monospace', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Original String to Compare</label>
              <input 
                type="text" 
                value={checkText} 
                onChange={(e) => { setCheckText(e.target.value); setCheckResult(null); }}
                placeholder="Enter original string..."
                style={{ width: '100%', padding: '14px 16px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button 
            onClick={handleCheck}
            disabled={isChecking || !checkHash || !checkText}
            className="action-btn"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '600', background: 'var(--text-primary)', color: 'var(--bg-white)' }}
          >
            {isChecking ? 'Verifying...' : '🔍 Verify Hash Match'}
          </button>

          {checkResult !== null && (
            <div style={{ 
              marginTop: '32px', padding: '32px', borderRadius: 'var(--radius-md)',
              background: checkResult ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              border: `2px solid ${checkResult ? '#10b981' : '#ef4444'}`, textAlign: 'center',
              animation: 'bounceIn 0.4s ease'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{checkResult ? '🎉' : '❌'}</div>
              <h3 style={{ fontSize: '1.5rem', color: checkResult ? '#10b981' : '#ef4444', margin: 0 }}>
                {checkResult ? 'Match! The string hashes correctly.' : 'No Match! The string is incorrect.'}
              </h3>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
