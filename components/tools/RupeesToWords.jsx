'use client';
// RupeesToWords.jsx — Convert numbers to Indian Rupees in words
// Targets: "rupees to words" 110K/mo, "amount in words cheque" 40K/mo
// Better than: numbersinwords.in, writecheque.com
// Features: Lakh/Crore + International, Paise, cheque format, history
import { useState, useCallback, useEffect } from 'react';

// ─── Conversion engine ────────────────────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function threeDigits(n) {
  if (n === 0) return '';
  if (n < 100) return twoDigits(n);
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
}

function toWordsIndian(num) {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + toWordsIndian(-num);

  const parts = [];
  let n = Math.floor(num);

  if (n >= 10000000) { parts.push(threeDigits(Math.floor(n / 10000000)) + ' Crore'); n %= 10000000; }
  if (n >= 100000)   { parts.push(twoDigits(Math.floor(n / 100000)) + ' Lakh'); n %= 100000; }
  if (n >= 1000)     { parts.push(twoDigits(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
  if (n >= 100)      { parts.push(threeDigits(n)); n = 0; }
  if (n > 0)         { parts.push(twoDigits(n)); }

  return parts.join(' ');
}

function toWordsInternational(num) {
  if (num === 0) return 'Zero';
  const parts = [];
  let n = Math.floor(num);
  if (n >= 1000000000) { parts.push(threeDigits(Math.floor(n / 1000000000)) + ' Billion'); n %= 1000000000; }
  if (n >= 1000000)    { parts.push(threeDigits(Math.floor(n / 1000000)) + ' Million'); n %= 1000000; }
  if (n >= 1000)       { parts.push(threeDigits(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
  if (n > 0)           { parts.push(threeDigits(n)); }
  return parts.join(' ');
}

function convert(input, system, currency, includeOnly) {
  const raw = input.replace(/,/g, '').trim();
  if (!raw || isNaN(raw)) return { error: 'Please enter a valid number' };

  const num = parseFloat(raw);
  if (num > 999999999999) return { error: 'Number too large (max 999,999,999,999)' };
  if (num < 0) return { error: 'Negative numbers not supported for cheques' };

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100); // paise/cents

  const fn = system === 'indian' ? toWordsIndian : toWordsInternational;

  let words = fn(intPart);
  const currencyLabels = {
    INR: { main: 'Rupees', sub: 'Paise' },
    USD: { main: 'Dollars', sub: 'Cents' },
    EUR: { main: 'Euros', sub: 'Cents' },
    GBP: { main: 'Pounds', sub: 'Pence' },
  };
  const labels = currencyLabels[currency] || currencyLabels.INR;

  let result = words + ' ' + labels.main;
  if (decPart > 0) result += ' and ' + twoDigits(decPart) + ' ' + labels.sub;
  if (includeOnly) result += ' Only';

  // Formatted number
  const formatted = system === 'indian'
    ? num.toLocaleString('en-IN')
    : num.toLocaleString('en-US');

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

  return { words: result, formatted, symbol: symbols[currency] || '₹', intPart, decPart, labels };
}

const CURRENCIES = [
  { value: 'INR', label: '₹ Indian Rupee', flag: '🇮🇳' },
  { value: 'USD', label: '$ US Dollar', flag: '🇺🇸' },
  { value: 'EUR', label: '€ Euro', flag: '🇪🇺' },
  { value: 'GBP', label: '£ British Pound', flag: '🇬🇧' },
];

const QUICK_AMOUNTS = [
  { label: '₹500', value: '500' }, { label: '₹1,000', value: '1000' },
  { label: '₹5,000', value: '5000' }, { label: '₹10,000', value: '10000' },
  { label: '₹25,000', value: '25000' }, { label: '₹50,000', value: '50000' },
  { label: '₹1 Lakh', value: '100000' }, { label: '₹5 Lakh', value: '500000' },
  { label: '₹10 Lakh', value: '1000000' }, { label: '₹1 Crore', value: '10000000' },
];

export default function RupeesToWords({ t, lang }) {
  const [input, setInput]       = useState('');
  const [system, setSystem]     = useState('indian');
  const [currency, setCurrency] = useState('INR');
  const [includeOnly, setIncludeOnly] = useState(true);
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [copied, setCopied]     = useState('');
  const [toast, setToast]       = useState(null);

  const showToast = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    try { const h = JSON.parse(localStorage.getItem('ilt_r2w_history') || '[]'); setHistory(h); } catch {}
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) { showToast('Enter a number first', 'warning'); return; }
    const r = convert(input, system, currency, includeOnly);
    if (r.error) { showToast(r.error, 'warning'); return; }
    setResult(r);
    const entry = { input: input.replace(/,/g, ''), words: r.words, currency, ts: Date.now() };
    const newHistory = [entry, ...history.filter(h => h.input !== entry.input)].slice(0, 10);
    setHistory(newHistory);
    try { localStorage.setItem('ilt_r2w_history', JSON.stringify(newHistory)); } catch {}
  }, [input, system, currency, includeOnly, history]);

  useEffect(() => {
    if (input.replace(/,/g, '').trim()) handleConvert();
  }, [system, currency, includeOnly]);

  const handleInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setInput(clean);
    if (clean) {
      const r = convert(clean, system, currency, includeOnly);
      if (!r.error) setResult(r);
      else setResult(null);
    } else setResult(null);
  };

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 1500);
    showToast('Copied!');
  };

  const formatIndian = (n) => parseFloat(n).toLocaleString('en-IN');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t === 'success' ? '✅ ' : '⚠️ '}{toast.m}</div>}

      {/* Hero section */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>💰</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px' }}>Rupees to Words Converter</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Instant number-to-words for cheques, invoices &amp; legal documents · Indian (Lakh/Crore) &amp; International systems
        </p>
      </div>

      {/* Main converter card */}
      <div className="trust-card" style={{ padding: 28, marginBottom: 16 }}>
        {/* Currency + System row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Currency</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CURRENCIES.map(c => (
                <button key={c.value} onClick={() => setCurrency(c.value)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${currency === c.value ? '#dc2626' : 'var(--border-light)'}`, background: currency === c.value ? 'rgba(220,38,38,0.08)' : 'var(--bg-section)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: currency === c.value ? '#dc2626' : 'var(--text-secondary)' }}>
                  {c.flag} {c.value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Number System</label>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['indian', '🇮🇳 Indian (Lakh/Crore)'], ['international', '🌍 International (Million/Billion)']].map(([v, l]) => (
                <button key={v} onClick={() => setSystem(v)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${system === v ? '#dc2626' : 'var(--border-light)'}`, background: system === v ? 'rgba(220,38,38,0.08)' : 'var(--bg-section)', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', color: system === v ? '#dc2626' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>
            {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
          </div>
          <input
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConvert()}
            placeholder="Enter amount (e.g. 125000.50)"
            style={{ width: '100%', padding: '18px 16px 18px 44px', fontSize: '1.4rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#dc2626'}
            onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
          />
          {input && (
            <button onClick={() => { setInput(''); setResult(null); }} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>✕</button>
          )}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <input type="checkbox" checked={includeOnly} onChange={e => setIncludeOnly(e.target.checked)} style={{ accentColor: '#dc2626', width: 16, height: 16 }} />
            Add "Only" at end (cheque format)
          </label>
          {input && result && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              Formatted: {result.symbol}{formatIndian(input.replace(/,/g, ''))}
            </span>
          )}
        </div>

        {/* Convert button */}
        <button onClick={handleConvert}
          style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.35)', transition: 'all 0.2s' }}>
          💰 Convert to Words
        </button>
      </div>

      {/* Result card */}
      {result && (
        <div className="trust-card" style={{ padding: 22, marginBottom: 16, borderLeft: '4px solid #dc2626', background: 'rgba(220,38,38,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Amount in Words</div>

          {/* Main result */}
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 14, padding: '14px 16px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            {result.words}
          </div>

          {/* Copy buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'words', label: '📋 Copy Words', text: result.words },
              { key: 'cheque', label: '✉️ Copy Cheque Format', text: `${result.symbol}${formatIndian(input.replace(/,/g,''))}/-\n${result.words}` },
              { key: 'invoice', label: '📄 Copy Invoice Format', text: `Amount: ${result.symbol}${formatIndian(input.replace(/,/g,''))}\nIn Words: ${result.words}` },
            ].map(btn => (
              <button key={btn.key} onClick={() => copy(btn.text, btn.key)}
                style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${copied === btn.key ? '#10b981' : 'var(--border-light)'}`, background: copied === btn.key ? 'rgba(16,185,129,0.1)' : 'var(--bg-section)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: copied === btn.key ? '#10b981' : 'var(--text-primary)', transition: 'all 0.2s' }}>
                {copied === btn.key ? '✓ Copied!' : btn.label}
              </button>
            ))}
          </div>

          {/* Breakdown */}
          {result.intPart > 0 && (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
              {[
                { label: 'Rupees (words)', value: toWordsIndian(result.intPart) + ' ' + result.labels.main },
                ...(result.decPart > 0 ? [{ label: 'Paise (words)', value: ONES[result.decPart] || twoDigits(result.decPart) + ' ' + result.labels.sub }] : []),
                { label: 'Formatted Amount', value: result.symbol + formatIndian(input.replace(/,/g,'')) },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 12px', background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick amounts */}
      <div className="trust-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>⚡ Quick Amounts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {QUICK_AMOUNTS.map(q => (
            <button key={q.value} onClick={() => { setInput(q.value); const r = convert(q.value, system, currency, includeOnly); if (!r.error) setResult(r); }}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: input === q.value ? 'rgba(220,38,38,0.1)' : 'var(--bg-section)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: input === q.value ? '#dc2626' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="trust-card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>🕒 Recent Conversions</div>
            <button onClick={() => { setHistory([]); localStorage.removeItem('ilt_r2w_history'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.72rem' }}>Clear</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} onClick={() => { setInput(h.input); const r = convert(h.input, system, h.currency, includeOnly); if (!r.error) setResult(r); }}
                style={{ padding: '8px 12px', background: 'var(--bg-section)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', flexShrink: 0 }}>
                  {h.currency === 'INR' ? '₹' : h.currency}{parseFloat(h.input).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.words}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use cases info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
        {[
          { icon: '🏦', title: 'Bank Cheques', desc: 'Write cheque amounts in words — mandatory per RBI guidelines' },
          { icon: '📄', title: 'Legal Documents', desc: 'Affidavits, agreements and court documents require amount in words' },
          { icon: '🧾', title: 'GST Invoices', desc: 'Tax invoices must state total amount in words per GST rules' },
          { icon: '🏠', title: 'Property Deeds', desc: 'Sale deeds and lease agreements need words representation' },
        ].map(item => (
          <div key={item.title} className="trust-card" style={{ padding: 14 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
