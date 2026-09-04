'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function JwtDecoder({ t, lang }) {
  const [token, setToken] = useState('');
  const [toast, setToast] = useState(null);
  
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  
  const [decodedHeader, setDecodedHeader] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setSignature('');
      setDecodedHeader(null);
      setDecodedPayload(null);
      setIsValid(true);
      return;
    }

    const parts = token.split('.');
    
    if (parts.length >= 1) setHeader(parts[0]);
    else setHeader('');
    
    if (parts.length >= 2) setPayload(parts[1]);
    else setPayload('');
    
    if (parts.length >= 3) setSignature(parts[2]);
    else setSignature('');

    try {
      if (parts.length >= 1 && parts[0]) {
        setDecodedHeader(jwtDecode(token, { header: true }));
      }
      if (parts.length >= 2 && parts[1]) {
        setDecodedPayload(jwtDecode(token));
      }
      setIsValid(true);
    } catch (err) {
      setIsValid(false);
      // Attempt manual fallback decode for malformed but readable parts
      try {
        if (parts[0]) setDecodedHeader(JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))));
      } catch (e) {}
      try {
        if (parts[1]) setDecodedPayload(JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))));
      } catch (e) {}
    }
  }, [token]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatJson = (obj) => {
    if (!obj) return '';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="tool-workspace jwt-workspace" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: ENCODED TOKEN */}
      <div className="jwt-encoded-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Encoded Token</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Paste a JWT to instantly decode its payload.</p>
        
        <div style={{ position: 'relative', width: '100%', height: '500px' }}>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            spellCheck="false"
            style={{ 
              width: '100%', 
              height: '100%', 
              padding: '24px', 
              fontSize: '1.1rem', 
              fontFamily: 'monospace', 
              lineHeight: '1.6', 
              borderRadius: 'var(--radius-lg)', 
              border: '2px solid var(--border-light)', 
              background: 'var(--bg-section)', 
              color: 'transparent', // Hide actual text, show via color-coded div underneath
              caretColor: 'var(--text-primary)',
              resize: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              wordBreak: 'break-all'
            }}
          />
          {/* Color-coded overlay (simulates jwt.io) */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: '24px',
            fontSize: '1.1rem',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            pointerEvents: 'none',
            zIndex: 1,
            wordBreak: 'break-all',
            color: 'var(--text-primary)',
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid transparent'
          }}>
            {!token && <span style={{ color: 'var(--text-tertiary)' }}>Paste token here...</span>}
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{header}</span>
            {payload && <span style={{ color: 'var(--text-primary)' }}>.</span>}
            <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{payload}</span>
            {signature && <span style={{ color: 'var(--text-primary)' }}>.</span>}
            <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{signature}</span>
          </div>
        </div>

        {!isValid && token.trim() && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: '600' }}>
            ⚠️ Invalid JWT Format
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DECODED DATA */}
      <div className="jwt-decoded-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* HEADER */}
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#ef4444', color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
            HEADER: Algorithm & Token Type
          </div>
          <textarea
            value={formatJson(decodedHeader)}
            readOnly
            spellCheck="false"
            style={{ width: '100%', height: '120px', padding: '16px', fontSize: '1rem', fontFamily: 'monospace', border: 'none', background: 'transparent', color: 'var(--text-primary)', resize: 'none' }}
            placeholder="Decoded header..."
          />
        </div>

        {/* PAYLOAD */}
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#8b5cf6', color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
            PAYLOAD: Data
          </div>
          <textarea
            value={formatJson(decodedPayload)}
            readOnly
            spellCheck="false"
            style={{ width: '100%', height: '250px', padding: '16px', fontSize: '1rem', fontFamily: 'monospace', border: 'none', background: 'transparent', color: 'var(--text-primary)', resize: 'none' }}
            placeholder="Decoded payload..."
          />
        </div>

        {/* SIGNATURE */}
        <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#0ea5e9', color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
            SIGNATURE
          </div>
          <div style={{ padding: '16px', fontSize: '0.95rem', fontFamily: 'monospace', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
            {signature || "No signature found..."}
          </div>
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
