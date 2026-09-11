'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// ─── Simple protocol detection ────────────────────────────────────────────────
function getProtocol(url) {
  try {
    const urlObj = new URL(url);
    let proto = urlObj.protocol.replace(':', '');
    if (proto === 'http') return { label: 'HTTP', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (proto === 'https') return { label: 'HTTPS', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (proto === 'ftp') return { label: 'FTP', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (proto === 'mailto') return { label: 'MAIL', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    return { label: proto.toUpperCase(), color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  } catch {
    return { label: 'UNKNOWN', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  }
}

export default function ExtractUrls({ t, lang }) {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [format, setFormat] = useState('all'); // all, https, http, other
  const [separator, setSeparator] = useState('newline');
  const [viewMode, setViewMode] = useState('text');
  const [removeTracking, setRemoveTracking] = useState(true);
  const [groupByDomain, setGroupByDomain] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('ilovetexts_extract_urls_input');
      if (savedInput) setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovetexts_extract_urls_input', input);
    }
  }, [input]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractedData = useMemo(() => {
    if (!input.trim()) return { uniqueUrls: [], uniqueCount: 0, totalCount: 0, duplicateCount: 0, domains: {}, httpsCount: 0, trackingRemoved: 0, protocolCounts: {} };

    // Broad URL regex matching common protocols
    const regex = /(?:https?|ftp|mailto):\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const rawMatches = input.match(regex) || [];

    let trackingRemoved = 0;
    let cleaned = rawMatches.map(url => url.trim());

    if (removeTracking) {
      cleaned = cleaned.map(url => {
        try {
          const parsed = new URL(url);
          const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
          let removed = false;
          trackingParams.forEach(param => {
            if (parsed.searchParams.has(param)) {
              parsed.searchParams.delete(param);
              removed = true;
            }
          });
          if (removed) trackingRemoved++;
          return parsed.href;
        } catch {
          return url;
        }
      });
    }

    if (format === 'https') {
      cleaned = cleaned.filter(url => url.toLowerCase().startsWith('https:'));
    } else if (format === 'http') {
      cleaned = cleaned.filter(url => url.toLowerCase().startsWith('http:'));
    } else if (format === 'other') {
      cleaned = cleaned.filter(url => !url.toLowerCase().startsWith('http:') && !url.toLowerCase().startsWith('https:'));
    }

    const uniqueUrls = [...new Set(cleaned)].sort();
    const duplicateCount = cleaned.length - uniqueUrls.length;

    const domains = {};
    let httpsCount = 0;
    const protocolCounts = {};

    uniqueUrls.forEach(url => {
      try {
        const parsed = new URL(url);
        const domain = parsed.hostname.replace(/^www\./, '');
        if (!domains[domain]) domains[domain] = { count: 0, urls: [] };
        domains[domain].count++;
        domains[domain].urls.push(url);

        const proto = parsed.protocol.replace(':', '').toLowerCase();
        if (proto === 'https') httpsCount++;
        if (!protocolCounts[proto]) protocolCounts[proto] = 0;
        protocolCounts[proto]++;
      } catch {
        // Ignored
      }
    });

    const sortedDomains = Object.keys(domains).sort((a, b) => domains[b].count - domains[a].count).reduce((acc, key) => {
      acc[key] = domains[key];
      return acc;
    }, {});

    return { uniqueUrls, uniqueCount: uniqueUrls.length, totalCount: cleaned.length, duplicateCount, domains: sortedDomains, httpsCount, trackingRemoved, protocolCounts };
  }, [input, format, removeTracking]);

  const getOutputText = () => {
    if (extractedData.uniqueCount === 0) return '';
    const sepChar = separator === 'comma' ? ', ' : '\n';

    if (groupByDomain) {
      let result = '';
      for (const [domain, data] of Object.entries(extractedData.domains)) {
        result += `--- ${domain} (${data.count}) ---\n`;
        result += data.urls.join(sepChar) + '\n\n';
      }
      return result.trim();
    }
    return extractedData.uniqueUrls.join(sepChar);
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

  const handleOpenAll = () => {
    if (extractedData.uniqueCount === 0) return;
    if (extractedData.uniqueCount > 20) {
      if (!confirm(`Are you sure you want to open ${extractedData.uniqueCount} tabs? This might crash your browser.`)) return;
    }
    let opened = 0;
    extractedData.uniqueUrls.forEach(url => {
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
        opened++;
      }
    });
    if (opened > 0) showToast(`Opened ${opened} tabs!`);
    else showToast('No web links to open', 'warning');
  };

  const handleDownloadCSV = () => {
    if (extractedData.uniqueCount === 0) return;
    const csvContent = "URL,Domain,Protocol\n" + extractedData.uniqueUrls.map(url => {
      try {
        const parsed = new URL(url);
        return `"${url}","${parsed.hostname.replace(/^www\./, '')}","${parsed.protocol.replace(':', '')}"`;
      } catch {
        return `"${url}","",""`;
      }
    }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_urls_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  };

  const handleDownloadTXT = () => {
    if (extractedData.uniqueCount === 0) return;
    const blob = new Blob([extractedData.uniqueUrls.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_urls_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
    showToast('TXT downloaded!');
  };

  const handleDownloadJSON = () => {
    if (extractedData.uniqueCount === 0) return;
    const data = extractedData.uniqueUrls.map(url => {
      try {
        const parsed = new URL(url);
        return { url, domain: parsed.hostname.replace(/^www\./, ''), protocol: parsed.protocol.replace(':', '') };
      } catch {
        return { url, domain: '', protocol: '' };
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `extracted_urls_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    showToast('JSON downloaded!');
  };

  const domainChartData = useMemo(() => {
    const entries = Object.entries(extractedData.domains).slice(0, 6);
    if (entries.length === 0) return [];
    const max = entries[0][1].count;
    return entries.map(([domain, data]) => ({ domain, count: data.count, pct: max > 0 ? (data.count / max * 100) : 0 }));
  }, [extractedData]);

  return (
    <div className="tool-workspace">
      {/* ── Stats Dashboard ── */}
      {extractedData.uniqueCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Found', value: extractedData.totalCount, color: '#3b82f6', icon: '🔗' },
            { label: 'Unique', value: extractedData.uniqueCount, color: '#10b981', icon: '✅' },
            { label: 'Duplicates', value: extractedData.duplicateCount, color: '#f59e0b', icon: '🔁' },
            { label: 'Domains', value: Object.keys(extractedData.domains).length, color: '#8b5cf6', icon: '🌐' },
            { label: 'HTTPS', value: extractedData.httpsCount, color: '#10b981', icon: '🔒' },
            { label: 'Cleaned UTMs', value: extractedData.trackingRemoved, color: '#ec4899', icon: '🧹' },
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

      {/* ── Domain Chart ── */}
      {extractedData.uniqueCount > 0 && domainChartData.length > 0 && (
        <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Top Domains Extracted
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {domainChartData.map(d => (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=32`} alt="" style={{ width: '16px', height: '16px', borderRadius: '2px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', width: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={d.domain}>
                  {d.domain}
                </span>
                <div style={{ flex: 1, height: '16px', background: 'var(--bg-white)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${d.pct}%`, minWidth: '20px',
                    background: 'linear-gradient(90deg, #3b82f6cc, #3b82f6)',
                    borderRadius: '8px', transition: 'width 0.5s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
                  }}>
                    <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>{d.count}</span>
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
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter Protocol:</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-white)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="all">All URLs</option>
            <option value="https">HTTPS Only</option>
            <option value="http">HTTP Only</option>
            <option value="other">Other (FTP, Mailto)</option>
          </select>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={removeTracking} onChange={(e) => setRemoveTracking(e.target.checked)} style={{ width: '15px', height: '15px' }} />
          Remove UTM/Tracking
        </label>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={groupByDomain} onChange={(e) => setGroupByDomain(e.target.checked)} style={{ width: '15px', height: '15px' }} />
          Group by Domain
        </label>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setViewMode('text')} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${viewMode === 'text' ? '#8b5cf6' : 'var(--border-light)'}`, background: viewMode === 'text' ? 'rgba(139,92,246,0.1)' : 'transparent', color: viewMode === 'text' ? '#8b5cf6' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            📝 Text
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${viewMode === 'list' ? '#8b5cf6' : 'var(--border-light)'}`, background: viewMode === 'list' ? 'rgba(139,92,246,0.1)' : 'transparent', color: viewMode === 'list' ? '#8b5cf6' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            🔗 List
          </button>
        </div>
      </div>

      {/* ── Editor Grid ── */}
      <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Input */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Raw Text or HTML</span>
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
            placeholder="Paste raw HTML, messy text, or document content here…&#10;&#10;Links like https://example.com/page?utm_source=twitter will be automatically extracted and cleaned."
            spellCheck="false"
            style={{ height: '500px', resize: 'vertical' }}
          />
        </div>

        {/* Output */}
        <div className="editor-pane">
          <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '600' }}>Extracted URLs</span>
              {extractedData.uniqueCount > 0 && (
                <span style={{ fontSize: '0.78rem', background: 'var(--brand-color)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {extractedData.uniqueCount} Unique
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleOpenAll} className="action-btn" title="Open All Links" style={{ fontSize: '0.78rem', border: '1px solid #10b981', color: '#10b981' }}>↗️ Open All</button>
              <button onClick={handleDownloadCSV} className="action-btn" title="Download CSV" style={{ fontSize: '0.78rem' }}>⬇️ CSV</button>
              <button onClick={handleDownloadJSON} className="action-btn" title="Download JSON" style={{ fontSize: '0.78rem' }}>⬇️ JSON</button>
              <button onClick={handleCopy} className="action-btn primary" style={{ fontSize: '0.78rem' }}>📋 Copy</button>
            </div>
          </div>

          {viewMode === 'text' ? (
            <textarea
              className="code-editor"
              value={getOutputText()}
              readOnly
              placeholder="Extracted URLs will appear here…"
              spellCheck="false"
              style={{ height: '500px', resize: 'vertical', background: 'var(--bg-section)' }}
            />
          ) : (
            <div style={{
              height: '500px', overflowY: 'auto', background: 'var(--bg-section)',
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px',
            }}>
              {extractedData.uniqueCount === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Extracted URLs will appear here…
                </div>
              ) : (
                extractedData.uniqueUrls.map((url, i) => {
                  const protocol = getProtocol(url);
                  let domain = '';
                  try { domain = new URL(url).hostname; } catch {}
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
                      {domain && (
                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" style={{ width: '16px', height: '16px', flexShrink: 0, borderRadius: '2px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      )}
                      <a href={url.startsWith('http') ? url : `http://${url}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all', textDecoration: 'none' }} className="hover-underline">
                        {url}
                      </a>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '8px',
                        background: protocol.bg, color: protocol.color, fontWeight: 700, flexShrink: 0,
                      }}>{protocol.label}</span>
                      <button onClick={() => { navigator.clipboard.writeText(url); showToast('Copied!'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '2px', color: 'var(--text-tertiary)', flexShrink: 0 }}
                        title="Copy URL">📋</button>
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
