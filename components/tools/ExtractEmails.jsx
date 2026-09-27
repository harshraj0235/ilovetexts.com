'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// ─── Known email providers with colors ─────────────────────────────────────────
const PROVIDERS = {
  'gmail.com':       { label: 'Gmail',       color: '#ea4335', bg: 'rgba(234,67,53,0.10)' },
  'googlemail.com':  { label: 'Gmail',       color: '#ea4335', bg: 'rgba(234,67,53,0.10)' },
  'yahoo.com':       { label: 'Yahoo',       color: '#6001d2', bg: 'rgba(96,1,210,0.10)' },
  'yahoo.co.in':     { label: 'Yahoo',       color: '#6001d2', bg: 'rgba(96,1,210,0.10)' },
  'outlook.com':     { label: 'Outlook',     color: '#0078d4', bg: 'rgba(0,120,212,0.10)' },
  'hotmail.com':     { label: 'Outlook',     color: '#0078d4', bg: 'rgba(0,120,212,0.10)' },
  'live.com':        { label: 'Outlook',     color: '#0078d4', bg: 'rgba(0,120,212,0.10)' },
  'icloud.com':      { label: 'iCloud',      color: '#3e3e3e', bg: 'rgba(62,62,62,0.10)' },
  'me.com':          { label: 'iCloud',      color: '#3e3e3e', bg: 'rgba(62,62,62,0.10)' },
  'protonmail.com':  { label: 'Proton',      color: '#6d4aff', bg: 'rgba(109,74,255,0.10)' },
  'proton.me':       { label: 'Proton',      color: '#6d4aff', bg: 'rgba(109,74,255,0.10)' },
  'aol.com':         { label: 'AOL',         color: '#ff6600', bg: 'rgba(255,102,0,0.10)' },
  'zoho.com':        { label: 'Zoho',        color: '#c8202b', bg: 'rgba(200,32,43,0.10)' },
};

function getProvider(domain) {
  const d = domain.toLowerCase();
  if (PROVIDERS[d]) return PROVIDERS[d];
  return { label: 'Custom', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' };
}

// ─── Simple email format validator ─────────────────────────────────────────────
function validateEmail(email) {
  // Basic format checks beyond just regex match
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid';
  const [local, domain] = parts;
  if (local.length === 0 || local.length > 64) return 'suspicious';
  if (domain.length < 3 || !domain.includes('.')) return 'invalid';
  const tld = domain.split('.').pop();
  if (tld.length < 2) return 'suspicious';
  // Check for suspicious patterns
  if (/^[0-9]+@/.test(email)) return 'suspicious';
  if (/\.{2,}/.test(email)) return 'suspicious';
  return 'valid';
}

export default function ExtractEmails({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [groupByDomain, setGroupByDomain] = useState(false);
  const [separator, setSeparator] = useState('newline');
  const [showValidation, setShowValidation] = useState(false);
  const [filterProvider, setFilterProvider] = useState('all');
  const [viewMode, setViewMode] = useState('text'); // text, list
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_emails_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_emails_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { all: [], uniqueEmails: [], uniqueCount: 0, totalCount: 0, duplicateCount: 0, domains: {}, providers: {}, validationMap: {} };

    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = input.match(regex) || [];
    const cleaned = matches.map(e => e.toLowerCase().trim());
    const uniqueEmails = [...new Set(cleaned)].sort();
    const duplicateCount = cleaned.length - uniqueEmails.length;

    // Domain grouping
    const domains = {};
    uniqueEmails.forEach(email => {
      const domain = email.split('@')[1];
      if (!domains[domain]) domains[domain] = [];
      domains[domain].push(email);
    });
    const sortedDomains = Object.keys(domains).sort((a, b) => domains[b].length - domains[a].length).reduce((acc, key) => {
      acc[key] = domains[key];
      return acc;
    }, {});

    // Provider grouping
    const providers = {};
    uniqueEmails.forEach(email => {
      const domain = email.split('@')[1];
      const provider = getProvider(domain);
      if (!providers[provider.label]) providers[provider.label] = { count: 0, color: provider.color, bg: provider.bg };
      providers[provider.label].count++;
    });

    // Validation
    const validationMap = {};
    uniqueEmails.forEach(email => {
      validationMap[email] = validateEmail(email);
    });

    return {
      all: cleaned,
      uniqueEmails,
      uniqueCount: uniqueEmails.length,
      totalCount: cleaned.length,
      duplicateCount,
      domains: sortedDomains,
      providers,
      validationMap,
      domainCount: Object.keys(sortedDomains).length,
    };
  }, [input]);

  // Filtered emails by provider
  const filteredEmails = useMemo(() => {
    if (filterProvider === 'all') return extractedData.uniqueEmails;
    return extractedData.uniqueEmails.filter(email => {
      const domain = email.split('@')[1];
      const provider = getProvider(domain);
      return provider.label === filterProvider;
    });
  }, [extractedData, filterProvider]);

  const getOutputText = () => {
    if (filteredEmails.length === 0) return '';
    const sepChar = separator === 'comma' ? ', ' : separator === 'semicolon' ? '; ' : '\n';
    if (groupByDomain) {
      const grouped = {};
      filteredEmails.forEach(email => {
        const domain = email.split('@')[1];
        if (!grouped[domain]) grouped[domain] = [];
        grouped[domain].push(email);
      });
      let result = '';
      for (const [domain, emails] of Object.entries(grouped)) {
        result += `--- @${domain} (${emails.length}) ---\n`;
        result += emails.join(sepChar) + '\n\n';
      }
      return result.trim();
    }
    return filteredEmails.join(sepChar);
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
    if (filteredEmails.length === 0) return;
    const csvContent = "Email,Domain,Provider,Status\n" + filteredEmails.map(email => {
      const domain = email.split('@')[1];
      const provider = getProvider(domain).label;
      const status = extractedData.validationMap[email] || 'valid';
      return `"${email}","${domain}","${provider}","${status}"`;
    }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `extracted_emails_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  };

  const handleDownloadTXT = () => {
    if (filteredEmails.length === 0) return;
    const blob = new Blob([filteredEmails.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `extracted_emails_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast('TXT downloaded!');
  };

  const handleDownloadJSON = () => {
    if (filteredEmails.length === 0) return;
    const data = filteredEmails.map(email => ({
      email,
      domain: email.split('@')[1],
      provider: getProvider(email.split('@')[1]).label,
      status: extractedData.validationMap[email] || 'valid',
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `extracted_emails_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('JSON downloaded!');
  };

  // Domain chart — top 6 domains
  const domainChartData = useMemo(() => {
    const entries = Object.entries(extractedData.domains).slice(0, 6);
    if (entries.length === 0) return [];
    const max = entries[0][1].length;
    return entries.map(([domain, emails]) => ({
      domain,
      count: emails.length,
      pct: max > 0 ? (emails.length / max * 100) : 0,
      provider: getProvider(domain),
    }));
  }, [extractedData]);

  const validCount = useMemo(() => Object.values(extractedData.validationMap).filter(v => v === 'valid').length, [extractedData]);
  const suspiciousCount = useMemo(() => Object.values(extractedData.validationMap).filter(v => v === 'suspicious').length, [extractedData]);

  return (
    <div className="tool-workspace">
      {/* ── Stats Dashboard ── */}
      {extractedData.uniqueCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Found', value: extractedData.totalCount, color: '#3b82f6', icon: '📧' },
            { label: 'Unique', value: extractedData.uniqueCount, color: '#10b981', icon: '✅' },
            { label: 'Duplicates', value: extractedData.duplicateCount, color: '#f59e0b', icon: '🔁' },
            { label: 'Domains', value: extractedData.domainCount, color: '#8b5cf6', icon: '🌐' },
            { label: 'Valid', value: validCount, color: '#10b981', icon: '✓' },
            { label: 'Suspicious', value: suspiciousCount, color: '#ef4444', icon: '⚠️' },
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

      {/* ── Provider Badges + Domain Chart (side by side) ── */}
      {extractedData.uniqueCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Provider badges */}
          <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Email Providers
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(extractedData.providers).sort((a, b) => b[1].count - a[1].count).map(([label, data]) => (
                <button key={label} onClick={() => setFilterProvider(filterProvider === label ? 'all' : label)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                    border: filterProvider === label ? `2px solid ${data.color}` : '1px solid var(--border-light)',
                    background: filterProvider === label ? data.bg : 'var(--bg-white)',
                    color: data.color, fontSize: '0.85rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: data.color, flexShrink: 0 }}></span>
                  {label}
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({data.count})</span>
                </button>
              ))}
              {filterProvider !== 'all' && (
                <button onClick={() => setFilterProvider('all')}
                  style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
                  ✕ Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Domain bar chart */}
          <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top Domains
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {domainChartData.map(d => (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={d.domain}>
                    @{d.domain}
                  </span>
                  <div style={{ flex: 1, height: '18px', background: 'var(--bg-white)', borderRadius: '9px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${d.pct}%`, minWidth: '18px',
                      background: `linear-gradient(90deg, ${d.provider.color}cc, ${d.provider.color})`,
                      borderRadius: '9px', transition: 'width 0.5s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
                    }}>
                      <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>{d.count}</span>
                    </div>
                  </div>
                </div>
              ))}
              {domainChartData.length === 0 && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No domains extracted yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls Panel ── */}
      <div className="tool-controls-panel" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--bg-section)', padding: '14px 16px', borderRadius: 'var(--radius-md)', alignItems: 'center', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="separator" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Output:</label>
          <select id="separator" value={separator} onChange={(e) => setSeparator(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
            <option value="semicolon">Semicolon (;)</option>
          </select>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={groupByDomain} onChange={(e) => setGroupByDomain(e.target.checked)} style={{ width: '15px', height: '15px' }} />
          Group by Domain
        </label>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showValidation} onChange={(e) => setShowValidation(e.target.checked)} style={{ width: '15px', height: '15px' }} />
          Show Validation
        </label>
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
              <input ref={fileInputRef} type="file" accept=".txt,.csv,.html,.htm,.xml,.json,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </div>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your messy text here… (from a PDF, document, webpage, HTML, or email thread)&#10;&#10;Example:&#10;Contact us at hello@example.com or support@company.io&#10;Send resumes to hr@acme.co, careers@startup.com"
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        {/* Output */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '600' }}>Extracted Emails</span>
              {filteredEmails.length > 0 && (
                <span style={{ fontSize: '0.78rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {filteredEmails.length}{filterProvider !== 'all' ? ` ${filterProvider}` : ' Unique'}
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
              placeholder="Extracted email addresses will appear here…"
              spellCheck="false"
              style={{ height: '500px', resize: 'vertical', background: 'var(--bg-section)' }}
            />
          ) : (
            <div style={{
              height: '500px', overflowY: 'auto', background: 'var(--bg-section)',
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
              padding: '8px',
            }}>
              {filteredEmails.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Extracted emails will appear here…
                </div>
              ) : (
                filteredEmails.map((email, i) => {
                  const domain = email.split('@')[1];
                  const provider = getProvider(domain);
                  const status = extractedData.validationMap[email];
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
                      <span style={{ flex: 1, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{email}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                        background: provider.bg, color: provider.color, fontWeight: 600, flexShrink: 0,
                      }}>{provider.label}</span>
                      {showValidation && (
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', flexShrink: 0,
                          background: status === 'valid' ? 'rgba(16,185,129,0.1)' : status === 'suspicious' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: status === 'valid' ? '#10b981' : status === 'suspicious' ? '#f59e0b' : '#ef4444',
                          fontWeight: 600,
                        }}>
                          {status === 'valid' ? '✓' : status === 'suspicious' ? '⚠' : '✕'}
                        </span>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(email); showToast('Copied!'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '2px', color: 'var(--text-tertiary)', flexShrink: 0 }}
                        title="Copy email">📋</button>
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
