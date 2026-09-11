'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// ─── Country code detection ────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'US/CA' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+27',  flag: '🇿🇦', name: 'S. Africa' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+82',  flag: '🇰🇷', name: 'S. Korea' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
];

function detectCountry(phone) {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned.startsWith('+')) return { flag: '📱', name: 'Local', code: '' };
  // Sort by longest code first for accurate matching
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (cleaned.startsWith(cc.code)) return cc;
  }
  return { flag: '🌍', name: 'International', code: cleaned.match(/^\+\d{1,3}/)?.[0] || '' };
}

function normalizeToE164(phone) {
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

function toDigitsOnly(phone) {
  return phone.replace(/\D/g, '');
}

export default function ExtractPhones({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [format, setFormat] = useState('all');
  const [separator, setSeparator] = useState('newline');
  const [outputFormat, setOutputFormat] = useState('original'); // original, e164, digits
  const [viewMode, setViewMode] = useState('text');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_phones_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_phones_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { uniquePhones: [], uniqueCount: 0, totalCount: 0, duplicateCount: 0, countries: {}, intlCount: 0, localCount: 0 };

    // Comprehensive phone number regex — international + local formats
    const regex = /(?:\+?\d{1,4}[\s\-\.]?)?\(?\d{1,4}\)?[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,9}/g;
    const rawMatches = input.match(regex) || [];

    // Filter out very short matches (< 7 digits) which are likely not phone numbers
    const matches = rawMatches.filter(m => {
      const digits = m.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    });

    let cleaned = matches.map(phone => phone.trim());

    if (format === 'international') {
      cleaned = cleaned.filter(phone => phone.replace(/[\s\-\(\)\.]/g, '').startsWith('+'));
    } else if (format === 'local') {
      cleaned = cleaned.filter(phone => !phone.replace(/[\s\-\(\)\.]/g, '').startsWith('+'));
    }

    const uniquePhones = [...new Set(cleaned)].sort();
    const duplicateCount = cleaned.length - uniquePhones.length;

    // Country detection
    const countries = {};
    let intlCount = 0;
    let localCount = 0;
    uniquePhones.forEach(phone => {
      const country = detectCountry(phone);
      const key = country.name;
      if (!countries[key]) countries[key] = { ...country, count: 0, phones: [] };
      countries[key].count++;
      countries[key].phones.push(phone);
      if (phone.replace(/[\s\-\(\)\.]/g, '').startsWith('+')) intlCount++;
      else localCount++;
    });

    return { uniquePhones, uniqueCount: uniquePhones.length, totalCount: cleaned.length, duplicateCount, countries, intlCount, localCount };
  }, [input, format]);

  const getFormattedPhone = (phone) => {
    if (outputFormat === 'e164') return normalizeToE164(phone);
    if (outputFormat === 'digits') return toDigitsOnly(phone);
    return phone;
  };

  const formattedPhones = useMemo(() => extractedData.uniquePhones.map(getFormattedPhone), [extractedData, outputFormat]);

  const getOutputText = () => {
    if (formattedPhones.length === 0) return '';
    const sepChar = separator === 'comma' ? ', ' : '\n';
    return formattedPhones.join(sepChar);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(prev => prev ? prev + '\n' + text : text);
      showToast('Pasted from clipboard!');
    } catch { showToast('Use Ctrl+V to paste', 'warning'); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInput(prev => prev ? prev + '\n' + ev.target.result : ev.target.result);
      showToast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopy = async () => {
    const text = getOutputText();
    if (!text) { showToast('Nothing to copy!', 'warning'); return; }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch { showToast('Failed to copy', 'error'); }
  };

  const handleDownloadCSV = () => {
    if (formattedPhones.length === 0) return;
    const csvContent = "Phone Number,Country,Type\n" + extractedData.uniquePhones.map(phone => {
      const country = detectCountry(phone);
      const formatted = getFormattedPhone(phone);
      const type = phone.replace(/[\s\-\(\)\.]/g, '').startsWith('+') ? 'International' : 'Local';
      return `"${formatted}","${country.name}","${type}"`;
    }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_phones_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  };

  const handleDownloadTXT = () => {
    if (formattedPhones.length === 0) return;
    const blob = new Blob([formattedPhones.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_phones_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
    showToast('TXT downloaded!');
  };

  const handleDownloadJSON = () => {
    if (formattedPhones.length === 0) return;
    const data = extractedData.uniquePhones.map(phone => ({
      phone: getFormattedPhone(phone),
      original: phone,
      country: detectCountry(phone).name,
      type: phone.replace(/[\s\-\(\)\.]/g, '').startsWith('+') ? 'international' : 'local',
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_phones_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    showToast('JSON downloaded!');
  };

  // Country chart data
  const countryChartData = useMemo(() => {
    const entries = Object.entries(extractedData.countries).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
    if (entries.length === 0) return [];
    const max = entries[0][1].count;
    return entries.map(([name, data]) => ({ name, ...data, pct: max > 0 ? (data.count / max * 100) : 0 }));
  }, [extractedData]);

  return (
    <div className="tool-workspace">
      {/* ── Stats Dashboard ── */}
      {extractedData.uniqueCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Found', value: extractedData.totalCount, color: '#3b82f6', icon: '📱' },
            { label: 'Unique', value: extractedData.uniqueCount, color: '#10b981', icon: '✅' },
            { label: 'Duplicates', value: extractedData.duplicateCount, color: '#f59e0b', icon: '🔁' },
            { label: 'International', value: extractedData.intlCount, color: '#8b5cf6', icon: '🌍' },
            { label: 'Local', value: extractedData.localCount, color: '#0ea5e9', icon: '📞' },
            { label: 'Countries', value: Object.keys(extractedData.countries).length, color: '#ef4444', icon: '🏳️' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)', textAlign: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Country Breakdown ── */}
      {extractedData.uniqueCount > 0 && countryChartData.length > 0 && (
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Country / Region Breakdown
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            {countryChartData.map(c => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px',
                background: 'var(--bg-white)', border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>{c.count}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {countryChartData.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', width: '24px', textAlign: 'center', flexShrink: 0 }}>{c.flag}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: '80px', flexShrink: 0 }}>{c.name}</span>
                <div style={{ flex: 1, height: '16px', background: 'var(--bg-white)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${c.pct}%`, minWidth: '16px',
                    background: 'linear-gradient(90deg, #8b5cf6cc, #8b5cf6)',
                    borderRadius: '8px', transition: 'width 0.5s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
                  }}>
                    <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>{c.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls Panel ── */}
      <div className="tool-controls-panel" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--bg-section)', padding: '14px 16px', borderRadius: 'var(--radius-md)', alignItems: 'center', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Output:</label>
          <select value={separator} onChange={(e) => setSeparator(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
          </select>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter:</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="all">All Numbers</option>
            <option value="international">International (+ only)</option>
            <option value="local">Local (No +)</option>
          </select>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Format:</label>
          <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="original">Original</option>
            <option value="e164">E.164 Standard</option>
            <option value="digits">Digits Only</option>
          </select>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setViewMode('text')} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${viewMode === 'text' ? '#8b5cf6' : 'var(--border-light)'}`, background: viewMode === 'text' ? 'rgba(139,92,246,0.1)' : 'transparent', color: viewMode === 'text' ? '#8b5cf6' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            📝 Text
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${viewMode === 'list' ? '#8b5cf6' : 'var(--border-light)'}`, background: viewMode === 'list' ? 'rgba(139,92,246,0.1)' : 'transparent', color: viewMode === 'list' ? '#8b5cf6' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            📋 List
          </button>
        </div>
      </div>

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Input */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Text</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePaste} className="action-btn text-btn" style={{ fontSize: '0.82rem' }} title="Paste from clipboard">📋 Paste</button>
              <button onClick={() => fileInputRef.current?.click()} className="action-btn text-btn" style={{ fontSize: '0.82rem' }} title="Upload file">📁 File</button>
              <button onClick={() => setInput('')} className="action-btn text-btn" style={{ fontSize: '0.82rem' }}>Clear</button>
              <input ref={fileInputRef} type="file" accept=".txt,.csv,.html,.htm,.xml,.json,.md,.vcf" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste raw text, resumes, or documents containing phone numbers…\n\nExample:\nCall us at +1 (555) 123-4567 or +91 98765 43210\nOffice: (212) 555-0100, Mobile: +44 7700 900000"}
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        {/* Output */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '600' }}>Extracted Phones</span>
              {formattedPhones.length > 0 && (
                <span style={{ fontSize: '0.78rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {formattedPhones.length} Unique
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleDownloadCSV} className="action-btn" title="Download CSV" style={{ fontSize: '0.78rem' }}>⬇️ CSV</button>
              <button onClick={handleDownloadTXT} className="action-btn" title="Download TXT" style={{ fontSize: '0.78rem' }}>⬇️ TXT</button>
              <button onClick={handleDownloadJSON} className="action-btn" title="Download JSON" style={{ fontSize: '0.78rem' }}>⬇️ JSON</button>
              <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.78rem' }}>📋 Copy</button>
            </div>
          </div>

          {viewMode === 'text' ? (
            <textarea
              className="code-editor"
              value={getOutputText()}
              readOnly
              placeholder="Extracted phone numbers will appear here…"
              spellCheck="false"
              style={{ height: '500px', resize: 'vertical', background: 'var(--bg-section)' }}
            />
          ) : (
            <div style={{
              height: '500px', overflowY: 'auto', background: 'var(--bg-section)',
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px',
            }}>
              {formattedPhones.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Extracted phone numbers will appear here…
                </div>
              ) : (
                extractedData.uniquePhones.map((phone, i) => {
                  const country = detectCountry(phone);
                  const formatted = getFormattedPhone(phone);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-white)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-white)'}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', width: '28px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{country.flag}</span>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatted}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                        background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 600, flexShrink: 0,
                      }}>{country.name}</span>
                      <button onClick={() => { navigator.clipboard.writeText(formatted); showToast('Copied!'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '2px', color: 'var(--text-tertiary)', flexShrink: 0 }}
                        title="Copy number">📋</button>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
