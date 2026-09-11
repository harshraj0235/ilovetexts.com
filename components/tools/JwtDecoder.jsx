'use client';

import { useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

// ─── Known JWT claims with explanations ────────────────────────────────────────
const CLAIM_EXPLANATIONS = {
  iss: { label: 'Issuer', desc: 'Who issued this token' },
  sub: { label: 'Subject', desc: 'Who this token is about (user ID)' },
  aud: { label: 'Audience', desc: 'Who this token is intended for' },
  exp: { label: 'Expires At', desc: 'When this token expires', isTime: true },
  nbf: { label: 'Not Before', desc: 'Token not valid before this time', isTime: true },
  iat: { label: 'Issued At', desc: 'When this token was created', isTime: true },
  jti: { label: 'JWT ID', desc: 'Unique identifier for this token' },
  name: { label: 'Name', desc: 'User full name' },
  email: { label: 'Email', desc: 'User email address' },
  role: { label: 'Role', desc: 'User role or permission level' },
  roles: { label: 'Roles', desc: 'User roles or permission levels' },
  scope: { label: 'Scope', desc: 'Authorized scopes/permissions' },
  azp: { label: 'Authorized Party', desc: 'Party authorized to use this token' },
};

function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts * 1000);
    return d.toLocaleString();
  } catch { return String(ts); }
}

function getTimeRemaining(expTs) {
  if (!expTs) return null;
  const now = Math.floor(Date.now() / 1000);
  const diff = expTs - now;
  if (diff <= 0) return { expired: true, text: 'EXPIRED', seconds: diff };
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  let text = '';
  if (days > 0) text += `${days}d `;
  if (hours > 0) text += `${hours}h `;
  if (minutes > 0) text += `${minutes}m `;
  text += `${seconds}s`;
  return { expired: false, text: text.trim(), seconds: diff };
}

export default function JwtDecoder({ t, lang }) {
  const [token, setToken] = useState('');
  const [toast, setToast] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');

  const [decodedHeader, setDecodedHeader] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!token.trim()) {
      setHeader(''); setPayload(''); setSignature('');
      setDecodedHeader(null); setDecodedPayload(null); setIsValid(true);
      return;
    }

    const parts = token.trim().split('.');
    setHeader(parts[0] || '');
    setPayload(parts[1] || '');
    setSignature(parts[2] || '');

    try {
      if (parts.length >= 1 && parts[0]) setDecodedHeader(jwtDecode(token, { header: true }));
      if (parts.length >= 2 && parts[1]) setDecodedPayload(jwtDecode(token));
      setIsValid(true);
    } catch (err) {
      setIsValid(false);
      try { if (parts[0]) setDecodedHeader(JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))); } catch {}
      try { if (parts[1]) setDecodedPayload(JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))); } catch {}
    }
  }, [token]);

  // Expiry countdown timer
  useEffect(() => {
    if (!decodedPayload?.exp) { setTimeRemaining(null); return; }
    const update = () => setTimeRemaining(getTimeRemaining(decodedPayload.exp));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [decodedPayload]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatJson = (obj) => obj ? JSON.stringify(obj, null, 2) : '';

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied!`);
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
      showToast('Pasted from clipboard!');
    } catch { showToast('Use Ctrl+V to paste', 'warning'); }
  };

  // Payload claim entries for the table
  const claimEntries = useMemo(() => {
    if (!decodedPayload) return [];
    return Object.entries(decodedPayload).map(([key, value]) => {
      const info = CLAIM_EXPLANATIONS[key];
      return {
        key,
        value,
        label: info?.label || key,
        desc: info?.desc || 'Custom claim',
        isTime: info?.isTime || false,
      };
    });
  }, [decodedPayload]);

  // Algorithm info
  const algInfo = useMemo(() => {
    if (!decodedHeader?.alg) return null;
    const alg = decodedHeader.alg;
    if (alg === 'none') return { alg, color: '#ef4444', label: 'INSECURE — No signature!' };
    if (alg.startsWith('HS')) return { alg, color: '#f59e0b', label: `HMAC-SHA${alg.replace('HS', '')} (Symmetric)` };
    if (alg.startsWith('RS')) return { alg, color: '#10b981', label: `RSA-SHA${alg.replace('RS', '')} (Asymmetric)` };
    if (alg.startsWith('ES')) return { alg, color: '#3b82f6', label: `ECDSA-SHA${alg.replace('ES', '')} (Asymmetric)` };
    if (alg === 'EdDSA') return { alg, color: '#8b5cf6', label: 'EdDSA (Modern Asymmetric)' };
    return { alg, color: 'var(--text-secondary)', label: alg };
  }, [decodedHeader]);

  return (
    <div className="tool-workspace jwt-workspace">

      {/* ── Top Bar: Expiry + Algorithm ── */}
      {decodedPayload && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {timeRemaining && (
            <div style={{
              flex: 1, minWidth: '200px', padding: '16px 20px', borderRadius: 'var(--radius-md)',
              background: timeRemaining.expired ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${timeRemaining.expired ? '#ef4444' : '#10b981'}`,
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>{timeRemaining.expired ? '⏰' : '⏳'}</span>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {timeRemaining.expired ? 'Token Status' : 'Expires In'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: timeRemaining.expired ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {timeRemaining.text}
                </div>
              </div>
            </div>
          )}
          {algInfo && (
            <div style={{
              flex: 1, minWidth: '200px', padding: '16px 20px', borderRadius: 'var(--radius-md)',
              background: `${algInfo.color}10`, border: `1px solid ${algInfo.color}40`,
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>🔐</span>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Algorithm</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: algInfo.color }}>{algInfo.label}</div>
              </div>
            </div>
          )}
          {decodedPayload?.iat && (
            <div style={{
              flex: 1, minWidth: '200px', padding: '16px 20px', borderRadius: 'var(--radius-md)',
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issued At</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#8b5cf6' }}>{formatTimestamp(decodedPayload.iat)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

        {/* LEFT COLUMN: ENCODED TOKEN */}
        <div className="jwt-encoded-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Encoded Token</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>📋 Paste</button>
              <button onClick={() => setToken('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Paste a JWT to instantly decode its payload. 100% client-side.</p>

          <div style={{ position: 'relative', width: '100%', height: '460px' }}>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              spellCheck="false"
              style={{
                width: '100%', height: '100%', padding: '24px', fontSize: '1rem',
                fontFamily: 'monospace', lineHeight: '1.6', borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--border-light)', background: 'var(--bg-section)',
                color: 'transparent', caretColor: 'var(--text-primary)', resize: 'none',
                position: 'absolute', top: 0, left: 0, zIndex: 2, wordBreak: 'break-all'
              }}
            />
            {/* Color-coded overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              padding: '24px', fontSize: '1rem', fontFamily: 'monospace', lineHeight: '1.6',
              pointerEvents: 'none', zIndex: 1, wordBreak: 'break-all',
              color: 'var(--text-primary)', background: 'var(--bg-white)',
              borderRadius: 'var(--radius-lg)', border: '2px solid transparent', overflow: 'auto',
            }}>
              {!token && <span style={{ color: 'var(--text-tertiary)' }}>Paste token here...</span>}
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{header}</span>
              {payload && <span style={{ color: 'var(--text-primary)' }}>.</span>}
              <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{payload}</span>
              {signature && <span style={{ color: 'var(--text-primary)' }}>.</span>}
              <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{signature}</span>
            </div>
          </div>

          {/* Token anatomy legend */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {[
              { color: '#ef4444', label: 'Header' },
              { color: '#8b5cf6', label: 'Payload' },
              { color: '#0ea5e9', label: 'Signature' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, flexShrink: 0 }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
              </div>
            ))}
          </div>

          {!isValid && token.trim() && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: '600' }}>
              ⚠️ Invalid JWT format — attempting best-effort decode
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DECODED DATA */}
        <div className="jwt-decoded-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* HEADER */}
          <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', fontWeight: '600', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>HEADER: Algorithm & Token Type</span>
              {decodedHeader && <button onClick={() => handleCopy(formatJson(decodedHeader), 'Header')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>📋 Copy</button>}
            </div>
            <textarea
              value={formatJson(decodedHeader)}
              readOnly spellCheck="false"
              style={{ width: '100%', height: '100px', padding: '16px', fontSize: '0.95rem', fontFamily: 'monospace', border: 'none', background: 'transparent', color: 'var(--text-primary)', resize: 'none' }}
              placeholder="Decoded header..."
            />
          </div>

          {/* PAYLOAD */}
          <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#8b5cf6', color: '#fff', fontWeight: '600', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PAYLOAD: Data</span>
              {decodedPayload && <button onClick={() => handleCopy(formatJson(decodedPayload), 'Payload')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>📋 Copy</button>}
            </div>
            <textarea
              value={formatJson(decodedPayload)}
              readOnly spellCheck="false"
              style={{ width: '100%', height: '200px', padding: '16px', fontSize: '0.95rem', fontFamily: 'monospace', border: 'none', background: 'transparent', color: 'var(--text-primary)', resize: 'none' }}
              placeholder="Decoded payload..."
            />
          </div>

          {/* CLAIM-BY-CLAIM TABLE */}
          {claimEntries.length > 0 && (
            <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                📋 Claim-by-Claim Breakdown
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {claimEntries.map((claim, i) => (
                  <div key={claim.key} style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px',
                    padding: '10px 16px', borderBottom: '1px solid var(--border-light)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-white)',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#8b5cf6' }}>{claim.key}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{claim.desc}</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {claim.isTime ? (
                        <span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{formatTimestamp(claim.value)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({claim.value})</span>
                        </span>
                      ) : (
                        typeof claim.value === 'object' ? JSON.stringify(claim.value) : String(claim.value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIGNATURE */}
          <div style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#0ea5e9', color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
              SIGNATURE
            </div>
            <div style={{ padding: '16px', fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              {signature || "No signature found..."}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
