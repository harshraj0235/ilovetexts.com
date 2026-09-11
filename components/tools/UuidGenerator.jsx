'use client';

import { useState } from 'react';

// ─── UUID generators without external dependency ───────────────────────────────

function generateUUIDv4() {
  // Use browser's built-in crypto API
  return crypto.randomUUID();
}

function generateUUIDv7() {
  // RFC 9562 UUID v7: timestamp + random
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Set timestamp (48 bits) in first 6 bytes
  const ts = BigInt(now);
  bytes[0] = Number((ts >> 40n) & 0xFFn);
  bytes[1] = Number((ts >> 32n) & 0xFFn);
  bytes[2] = Number((ts >> 24n) & 0xFFn);
  bytes[3] = Number((ts >> 16n) & 0xFFn);
  bytes[4] = Number((ts >> 8n) & 0xFFn);
  bytes[5] = Number(ts & 0xFFn);
  
  // Set version (0111 = 7)
  bytes[6] = (bytes[6] & 0x0F) | 0x70;
  // Set variant (10xx)
  bytes[8] = (bytes[8] & 0x3F) | 0x80;
  
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function generateUUIDv1() {
  // Simplified v1-like UUID (time + node)
  const now = Date.now();
  const ticks = BigInt(now) * 10000n + 122192928000000000n; // Convert to 100-ns intervals since UUID epoch
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // time-low (4 bytes)
  const timeLow = Number(ticks & 0xFFFFFFFFn);
  bytes[0] = (timeLow >> 24) & 0xFF;
  bytes[1] = (timeLow >> 16) & 0xFF;
  bytes[2] = (timeLow >> 8) & 0xFF;
  bytes[3] = timeLow & 0xFF;
  // time-mid (2 bytes)
  const timeMid = Number((ticks >> 32n) & 0xFFFFn);
  bytes[4] = (timeMid >> 8) & 0xFF;
  bytes[5] = timeMid & 0xFF;
  // time-hi-and-version (2 bytes, version = 1)
  const timeHi = Number((ticks >> 48n) & 0x0FFFn);
  bytes[6] = ((timeHi >> 8) & 0x0F) | 0x10;
  bytes[7] = timeHi & 0xFF;
  // variant
  bytes[8] = (bytes[8] & 0x3F) | 0x80;
  
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// ─── UUID validator/decoder ────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(str) {
  return UUID_REGEX.test(str);
}

function getUUIDVersion(str) {
  if (!validateUUID(str)) return null;
  return parseInt(str.charAt(14), 16);
}

export default function UuidGenerator({ t, lang }) {
  const [toast, setToast] = useState(null);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState('v4');
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [format, setFormat] = useState('standard'); // standard, braces, urn
  const [uuids, setUuids] = useState([]);
  
  // Decoder state
  const [decodeInput, setDecodeInput] = useState('');
  const [decodedInfo, setDecodedInfo] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateUuids = () => {
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 1 || num > 50000) {
      showToast('Please enter a valid number between 1 and 50,000', 'warning');
      return;
    }

    const results = [];
    const genFn = version === 'v1' ? generateUUIDv1 : version === 'v7' ? generateUUIDv7 : generateUUIDv4;

    for (let i = 0; i < num; i++) {
      let uuid = genFn();
      if (uppercase) uuid = uuid.toUpperCase();
      if (noHyphens) uuid = uuid.replace(/-/g, '');
      if (format === 'braces') uuid = `{${uuid}}`;
      else if (format === 'urn') uuid = `urn:uuid:${uuid}`;
      results.push(uuid);
    }
    setUuids(results);
    showToast(`Generated ${num} UUIDs!`);
  };

  const handleCopy = async () => {
    if (uuids.length === 0) return;
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      showToast('Copied to clipboard!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleCopySingle = async (uuid) => {
    try {
      await navigator.clipboard.writeText(uuid);
      showToast('Copied!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleDownloadTXT = () => {
    if (uuids.length === 0) return;
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `uuids_${version}_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast('TXT downloaded!');
  };

  const handleDownloadCSV = () => {
    if (uuids.length === 0) return;
    const csv = "UUID\n" + uuids.map(u => `"${u}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `uuids_${version}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  };

  const handleDownloadJSON = () => {
    if (uuids.length === 0) return;
    const blob = new Blob([JSON.stringify(uuids, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `uuids_${version}_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('JSON downloaded!');
  };

  const handleDecode = (val) => {
    setDecodeInput(val);
    const cleanVal = val.trim().replace(/^urn:uuid:/i, '').replace(/^\{|\}$/g, '');
    
    if (!val.trim()) { setDecodedInfo(null); return; }
    if (!validateUUID(cleanVal)) { setDecodedInfo({ valid: false }); return; }

    const ver = getUUIDVersion(cleanVal);
    let timeInfo = null;

    if (ver === 7) {
      try {
        const hexTimestamp = cleanVal.replace(/-/g, '').substring(0, 12);
        const timestampMs = parseInt(hexTimestamp, 16);
        timeInfo = new Date(timestampMs).toISOString();
      } catch { timeInfo = 'Invalid timestamp'; }
    }

    setDecodedInfo({ valid: true, version: ver, variant: 'RFC 4122 / 9562', time: timeInfo });
  };

  return (
    <div className="tool-workspace uuid-workspace" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ─── Decoder Section ─── */}
      <div style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 Decode & Validate UUID
        </h3>
        <input 
          type="text" 
          value={decodeInput}
          onChange={(e) => handleDecode(e.target.value)}
          placeholder="Paste a UUID here to validate and decode (e.g., 018e...)"
          style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', fontFamily: 'monospace', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', marginBottom: '16px' }}
        />
        {decodedInfo && (
          <div style={{ 
            padding: '16px', borderRadius: 'var(--radius-md)', 
            background: decodedInfo.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${decodedInfo.valid ? '#10b981' : '#ef4444'}`
          }}>
            {decodedInfo.valid ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Valid</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Version:</span> <strong>v{decodedInfo.version}</strong> {decodedInfo.version === 4 && '(Random)'}{decodedInfo.version === 7 && '(Time-Ordered)'}{decodedInfo.version === 1 && '(MAC+Time)'}</div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Variant:</span> {decodedInfo.variant}</div>
                {decodedInfo.time && <div><span style={{ color: 'var(--text-secondary)' }}>Timestamp:</span> <strong>{decodedInfo.time}</strong></div>}
              </div>
            ) : (
              <div style={{ color: '#ef4444', fontWeight: 600 }}>❌ Invalid UUID format</div>
            )}
          </div>
        )}
      </div>

      {/* ─── Generator ─── */}
      <div className="tool-controls-panel" style={{ background: 'var(--bg-section)', padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>🆔</span> Bulk UUID Generator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Version</label>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-white)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              {['v4', 'v7', 'v1'].map(v => (
                <button key={v} onClick={() => setVersion(v)}
                  style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                    background: version === v ? 'var(--brand-color)' : 'transparent',
                    color: version === v ? '#fff' : 'var(--text-secondary)' }}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              {version === 'v4' && 'Fully random (RFC 4122). Most common.'}
              {version === 'v7' && 'Time-ordered (RFC 9562). Best for databases.'}
              {version === 'v1' && 'Time + random node. Legacy.'}
            </p>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Quantity</label>
            <input type="number" min="1" max="50000" value={count} onChange={(e) => setCount(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Max: 50,000</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}>
              <option value="standard">Standard</option>
              <option value="braces">Braces {'{...}'}</option>
              <option value="urn">URN (urn:uuid:...)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Uppercase (A-F)
              </label>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={noHyphens} onChange={(e) => setNoHyphens(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Remove Hyphens
              </label>
            </div>
          </div>
        </div>

        <button onClick={generateUuids} className="action-btn primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          🚀 Generate UUIDs
        </button>
      </div>

      {/* ─── Output ─── */}
      <div className="editor-pane" style={{ background: 'var(--bg-section)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="pane-header" style={{ padding: '16px 24px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Generated Output</span>
            {uuids.length > 0 && (
              <span style={{ fontSize: '0.85rem', background: 'var(--brand-color)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                {uuids.length.toLocaleString()} UUIDs
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadTXT} className="action-btn" title="Download TXT" style={{ fontSize: '0.82rem' }}>⬇️ TXT</button>
            <button onClick={handleDownloadCSV} className="action-btn" title="Download CSV" style={{ fontSize: '0.82rem' }}>⬇️ CSV</button>
            <button onClick={handleDownloadJSON} className="action-btn" title="Download JSON" style={{ fontSize: '0.82rem' }}>⬇️ JSON</button>
            <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.82rem' }}>📋 Copy All</button>
          </div>
        </div>
        <textarea
          className="code-editor"
          value={uuids.join('\n')}
          readOnly
          placeholder="Your UUIDs will appear here..."
          spellCheck="false"
          style={{ width: '100%', height: '400px', padding: '24px', fontSize: '1.05rem', fontFamily: 'monospace', border: 'none', background: 'transparent', resize: 'vertical' }}
        />
      </div>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : 'var(--brand-color)', color: '#fff', borderRadius: 'var(--radius-md)', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
