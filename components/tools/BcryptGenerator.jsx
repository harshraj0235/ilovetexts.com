'use client';

import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';

export default function BcryptGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  
  // Generator State
  const [genInput, setGenInput] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [generatedHash, setGeneratedHash] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Checker State
  const [checkHash, setCheckHash] = useState('');
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState(null); // null, true, false
  const [isChecking, setIsChecking] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = () => {
    if (!genInput) {
      showToast('Please enter text to hash', 'warning');
      return;
    }
    setIsGenerating(true);
    // Use setTimeout to allow UI to render loading state before heavy crypto task
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(Number(saltRounds));
        const hash = bcrypt.hashSync(genInput, salt);
        setGeneratedHash(hash);
      } catch (err) {
        showToast('Error generating hash', 'error');
      }
      setIsGenerating(false);
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

  const handleCopyHash = async () => {
    if (!generatedHash) return;
    try {
      await navigator.clipboard.writeText(generatedHash);
      showToast('Hash copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="tool-workspace bcrypt-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* GENERATOR SECTION */}
      <div className="bcrypt-section" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span> Bcrypt Hash Generator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>String to Hash</label>
            <input 
              type="text" 
              value={genInput} 
              onChange={(e) => setGenInput(e.target.value)}
              placeholder="Enter password or string..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Salt Rounds: <span style={{ color: 'var(--brand-color)' }}>{saltRounds}</span></label>
            <input 
              type="range" 
              min="4" max="15" 
              value={saltRounds} 
              onChange={(e) => setSaltRounds(Number(e.target.value))}
              style={{ width: '100%', marginTop: '10px' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Higher = Slower/More Secure</p>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="action-btn primary"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isGenerating ? 'Hashing...' : 'Generate Bcrypt Hash'}
        </button>

        {generatedHash && (
          <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-white)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--brand-color)' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Generated Hash Result:</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={generatedHash} 
                readOnly
                style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontFamily: 'monospace', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-section)', color: 'var(--text-primary)' }}
              />
              <button onClick={handleCopyHash} className="action-btn primary" style={{ padding: '0 24px' }}>📋 Copy</button>
            </div>
          </div>
        )}
      </div>


      {/* CHECKER SECTION */}
      <div className="bcrypt-section" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>✅</span> Bcrypt Hash Validator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Bcrypt Hash to Check</label>
            <input 
              type="text" 
              value={checkHash} 
              onChange={(e) => {
                setCheckHash(e.target.value);
                setCheckResult(null); // reset
              }}
              placeholder="$2a$10$..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', fontFamily: 'monospace', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>String to Compare</label>
            <input 
              type="text" 
              value={checkText} 
              onChange={(e) => {
                setCheckText(e.target.value);
                setCheckResult(null); // reset
              }}
              placeholder="Enter original string..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <button 
          onClick={handleCheck}
          disabled={isChecking || !checkHash || !checkText}
          className="action-btn"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: '600', background: 'var(--text-primary)', color: 'var(--bg-white)' }}
        >
          {isChecking ? 'Verifying...' : 'Verify Hash Match'}
        </button>

        {checkResult !== null && (
          <div style={{ 
            marginTop: '24px', 
            padding: '24px', 
            borderRadius: 'var(--radius-md)',
            background: checkResult ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${checkResult ? '#10b981' : '#ef4444'}`,
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.5rem', color: checkResult ? '#10b981' : '#ef4444', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {checkResult ? (
                <><span style={{ fontSize: '2rem' }}>🎉</span> Match! The string hashes correctly.</>
              ) : (
                <><span style={{ fontSize: '2rem' }}>❌</span> No Match! The string is incorrect.</>
              )}
            </h3>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
