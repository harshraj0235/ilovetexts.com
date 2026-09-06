'use client';
import { useState, useCallback, useRef, useMemo } from 'react';

// ─── Category definitions (global keywords: US, UK, EU, IN) ─────────────────
const CATS = [
  { name: 'Salary / Income',    color: '#22c55e', icon: '💰', keywords: ['salary','payroll','direct deposit','credited','neft','imps','rtgs','income','refund','cashback','reward','dividend','interest earned','wages','stipend','freelance payment','transfer in','deposit'] },
  { name: 'Food & Dining',       color: '#f59e0b', icon: '🍔', keywords: ['swiggy','zomato','mcdonalds','kfc','dominos','pizza','restaurant','cafe','starbucks','subway','burger','bakery','food','dining','uber eats','doordash','deliveroo','just eat','grubhub','chipotle','wendys','taco bell','panera','chick-fil','popeyes','five guys','nandos','greggs','pret','costa','eat'] },
  { name: 'Groceries',           color: '#10b981', icon: '🛒', keywords: ['bigbasket','blinkit','dmart','supermarket','grocer','vegetables','grocery','walmart','tesco','sainsbury','asda','aldi','lidl','kroger','whole foods','trader joe','costco','target grocery','publix','safeway','morrisons','coop grocery','waitrose','spar','rewe','edeka','kaufland'] },
  { name: 'Shopping',            color: '#8b5cf6', icon: '🛍️', keywords: ['amazon','flipkart','myntra','meesho','ebay','etsy','zalando','h&m','zara','primark','asos','next clothing','argos','marks spencer','john lewis','nordstrom','macys','kohls','gap','old navy','forever 21','shein','wish','aliexpress','noon','lulu','ikea','home depot','lowes','b&q'] },
  { name: 'Transport',           color: '#0ea5e9', icon: '🚗', keywords: ['uber','lyft','ola','rapido','bolt transport','grab','gojek','petrol','fuel','gas station','shell','bp fuel','esso','exxon','chevron','parking','toll','metro','bus pass','train','irctc','redbus','national rail','oyster','translink','mta','bart','cta transit','tfl','transport for london','zipcar','hertz','enterprise rent'] },
  { name: 'Subscriptions',       color: '#ec4899', icon: '📺', keywords: ['netflix','spotify','amazon prime','apple','google one','youtube premium','disney','hulu','hbo','paramount','peacock','dazn','bbc','sky tv','now tv','crunchyroll','twitch','adobe','microsoft 365','office 365','dropbox','icloud','notion','figma','github','jetbrains','zoom','slack','monday.com','canva','semrush','ahrefs'] },
  { name: 'Utilities',           color: '#6366f1', icon: '⚡', keywords: ['electricity','water bill','gas bill','internet','broadband','airtel','jio','bsnl','vodafone','vi','ee mobile','bt broadband','virgin media','sky broadband','at&t','verizon','t-mobile','comcast','xfinity','spectrum','utility','council tax','rates','insurance','car insurance','home insurance','health insurance','phone bill','mobile bill'] },
  { name: 'Healthcare',          color: '#f43f5e', icon: '💊', keywords: ['hospital','pharmacy','doctor','clinic','medical','health','medicine','apollo','practo','1mg','netmeds','boots pharmacy','lloyds pharmacy','cvs','walgreens','rite aid','nhs','bupa','aetna','bluecross','humana','cigna','kaiser','optum','dental','dentist','physio','therapy','prescription'] },
  { name: 'EMI / Loan',          color: '#dc2626', icon: '🏦', keywords: ['emi','loan','mortgage','repayment','car loan','home loan','personal loan','credit card payment','bajaj','hdfc loan','sbi loan','icici loan','axis loan','barclays loan','lloyds loan','natwest loan','hsbc loan','chase loan','bank of america loan','wells fargo loan','capital one','discover','amex payment','visa payment','mastercard payment'] },
  { name: 'Investment',          color: '#7c3aed', icon: '📈', keywords: ['mutual fund','sip','zerodha','groww','upstox','nse','bse','demat','etf','stock','shares','robinhood','fidelity','schwab','vanguard','etrade','td ameritrade','degiro','freetrade','hargreaves lansdown','isa','pension','401k','roth','wealthfront','betterment','stash','acorns'] },
  { name: 'Entertainment',       color: '#f97316', icon: '🎬', keywords: ['cinema','movie','pvr','inox','odeon','vue cinema','regal cinema','amc theaters','bowling','gaming','steam','xbox','playstation','nintendo','concerts','tickets','eventbrite','ticketmaster','viagogo','stubhub','theme park','spa','gym','fitness','planet fitness','anytime fitness','david lloyd','virgin active','leisure'] },
  { name: 'Education',           color: '#14b8a6', icon: '📚', keywords: ['school','college','university','course','udemy','coursera','byjus','unacademy','skillshare','masterclass','duolingo','chegg','khan academy','edx','pluralsight','linkedin learning','tuition','fees','books','stationery','exam'] },
  { name: 'ATM / Cash',          color: '#94a3b8', icon: '💵', keywords: ['atm withdrawal','cash withdrawal','cash deposit','pos cash'] },
  { name: 'Bank Charges',        color: '#9ca3af', icon: '🏧', keywords: ['bank charge','service charge','maintenance fee','annual fee','overdraft','penalty','late fee','gst charge','interest charged','transaction fee'] },
  { name: 'Transfers Out',       color: '#64748b', icon: '↔️', keywords: ['transfer to','sent to','upi payment','phonepe','googlepay','paytm','bhim','neft out','wire transfer','bank transfer','paypal sent','wise transfer','revolut sent','cash app','venmo','zelle'] },
  { name: 'Rent & Housing',      color: '#ef4444', icon: '🏠', keywords: ['rent','housing','landlord','maintenance','society','flat','apartment','pg','hostel','hoa','property tax','letting agent'] },
  { name: 'Other',               color: '#d1d5db', icon: '📦', keywords: [] },
];

function categorize(desc) {
  if (!desc) return 'Other';
  const d = desc.toLowerCase();
  for (const cat of CATS.slice(0, -1)) {
    if (cat.keywords.some(kw => d.includes(kw))) return cat.name;
  }
  return 'Other';
}

// ─── Date utilities ──────────────────────────────────────────────────────────
function normalizeDate(raw) {
  if (!raw) return '';
  const clean = raw.trim();
  const m1 = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2,'0')}-${m1[3].padStart(2,'0')}`;
  const m2 = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
  const m3 = clean.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/);
  if (m3) {
    const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
    const mo = months[m3[2].toLowerCase().slice(0,3)];
    if (mo) { const yr = m3[3].length===2 ? '20'+m3[3] : m3[3]; return `${yr}-${String(mo).padStart(2,'0')}-${m3[1].padStart(2,'0')}`; }
  }
  return clean;
}

function getMonth(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : 'Unknown';
}

// ─── Transaction parser — handles PDF text, CSV, TSV ────────────────────────
function parseTransactions(text) {
  const lines = text.split('\n');
  const txns = [];
  const patterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s{1,4}(.+?)\s{2,}([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s{1,4}(.+?)\s{2,}(Dr|Cr)\s+([\d,]+\.?\d*)/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s{1,4}(.+?)\s{2,}(-?[\d,]+\.?\d*)/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s{1,4}(.+?)\s{2,}(-?[\d,]+\.?\d*)/,
  ];
  // CSV detection
  const isCSV = lines.slice(0, 3).join('\n').includes(',');
  if (isCSV) {
    const rows = lines.map(l => l.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
    // Find header row
    let headerIdx = rows.findIndex(r => r.some(c => /date|transaction|amount|debit|credit/i.test(c)));
    if (headerIdx === -1) headerIdx = 0;
    const headers = rows[headerIdx].map(h => h.toLowerCase());
    const dateCol = headers.findIndex(h => /date|txn date|transaction date|value date|post date/.test(h));
    const descCol = headers.findIndex(h => /desc|narration|particular|merchant|payee|memo|detail|transaction|reference/.test(h));
    const debitCol = headers.findIndex(h => /debit|withdrawal|dr\.?$|debit amount/.test(h));
    const creditCol = headers.findIndex(h => /credit|deposit|cr\.?$|credit amount/.test(h));
    const amtCol = headers.findIndex(h => /^amount$|transaction amount/.test(h));
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2 || !row[0]) continue;
      const date = normalizeDate(row[dateCol] || row[0] || '');
      const desc = row[descCol] || row.slice(1).find(c => c && isNaN(parseFloat(c.replace(/,/g,'')))) || '';
      let debit = 0, credit = 0;
      if (debitCol >= 0 && creditCol >= 0) {
        debit = Math.abs(parseFloat((row[debitCol]||'').replace(/,/g,''))||0);
        credit = Math.abs(parseFloat((row[creditCol]||'').replace(/,/g,''))||0);
      } else if (amtCol >= 0) {
        const a = parseFloat((row[amtCol]||'').replace(/,/g,'')||0);
        if (a < 0) debit = Math.abs(a); else credit = a;
      }
      if (!date && !desc) continue;
      txns.push({ id: txns.length, date, description: desc.trim(), debit, credit, amount: credit - debit, category: categorize(desc) });
    }
    return txns;
  }
  // Plain text / PDF patterns
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 8) continue;
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let date, desc, debit = 0, credit = 0;
        if (pattern === patterns[0]) {
          [, date, desc] = match;
          const a = parseFloat(match[3].replace(/,/g, '')), b = parseFloat(match[4].replace(/,/g, ''));
          if (a > 0 && b === 0) debit = a;
          else if (b > 0 && a === 0) credit = b;
          else { debit = a; credit = b; }
        } else if (pattern === patterns[1]) {
          [, date, desc] = match;
          const amt = parseFloat(match[4].replace(/,/g, ''));
          if (match[3].toLowerCase() === 'dr') debit = amt; else credit = amt;
        } else {
          [, date, desc] = match;
          const amt = parseFloat(match[3].replace(/,/g, ''));
          if (amt < 0) debit = Math.abs(amt); else credit = amt;
        }
        txns.push({ id: txns.length, date: normalizeDate(date?.trim()), description: desc?.trim() || '', debit: debit || 0, credit: credit || 0, amount: (credit || 0) - (debit || 0), category: categorize(desc) });
        break;
      }
    }
  }
  return txns;
}

// ─── Subscription detector ───────────────────────────────────────────────────
function detectSubscriptions(txns) {
  const groups = {};
  txns.filter(t => t.debit > 0).forEach(t => {
    const desc = t.description.toLowerCase().trim();
    // Normalize: strip trailing numbers, dates, ref IDs
    const key = desc.replace(/\d{4,}/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (!key || key.length < 4) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  const subs = [];
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length < 2) continue;
    const amounts = [...new Set(entries.map(e => Math.round(e.debit * 100)))];
    const amountConsistent = amounts.length <= 2; // allow small variance
    const dates = entries.map(e => new Date(e.date || '2024-01-01')).filter(d => !isNaN(d)).sort((a,b)=>a-b);
    if (dates.length < 2) continue;
    // Check if payments are roughly monthly (25-35 days apart)
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i]-dates[i-1])/(1000*60*60*24));
    const avgGap = gaps.reduce((s,g)=>s+g,0)/gaps.length;
    const isMonthly = avgGap >= 25 && avgGap <= 40;
    const isWeekly = avgGap >= 6 && avgGap <= 9;
    const isAnnual = avgGap >= 340 && avgGap <= 390;
    if ((isMonthly || isWeekly || isAnnual) && amountConsistent) {
      const avgAmt = entries.reduce((s,e)=>s+e.debit,0)/entries.length;
      const monthlyEq = isMonthly ? avgAmt : isWeekly ? avgAmt*4.33 : avgAmt/12;
      const yearlyEq = monthlyEq * 12;
      subs.push({
        name: entries[0].description.slice(0, 50),
        count: entries.length,
        avgAmount: avgAmt,
        monthlyEquivalent: monthlyEq,
        yearlyEquivalent: yearlyEq,
        frequency: isMonthly ? 'Monthly' : isWeekly ? 'Weekly' : 'Annual',
        lastCharge: entries[entries.length - 1].date,
        category: entries[0].category,
      });
    }
  }
  return subs.sort((a, b) => b.yearlyEquivalent - a.yearlyEquivalent);
}

// ─── Anomaly / spike detector ─────────────────────────────────────────────────
function detectAnomalies(txns) {
  const debits = txns.filter(t => t.debit > 0);
  if (debits.length < 3) return [];
  const amounts = debits.map(t => t.debit);
  const mean = amounts.reduce((s,a)=>s+a,0)/amounts.length;
  const std = Math.sqrt(amounts.map(a=>(a-mean)**2).reduce((s,v)=>s+v,0)/amounts.length);
  return debits
    .filter(t => t.debit > mean + 2.5 * std && t.debit > mean * 3)
    .sort((a,b) => b.debit - a.debit)
    .slice(0, 10);
}

// ─── Currency formatter ───────────────────────────────────────────────────────
function fmt(n, currency = 'USD') {
  const abs = Math.abs(n);
  const sym = currency === 'INR' ? '₹' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (abs >= 1000000) return sym + (n/1000000).toFixed(2) + 'M';
  if (abs >= 1000) return sym + (n/1000).toFixed(1) + 'K';
  return sym + n.toFixed(2);
}

// ─── Excel builder ────────────────────────────────────────────────────────────
async function exportExcel(txns, summary, subs, currency) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const txRows = [['Date','Description','Category','Debit','Credit','Net']];
  txns.forEach(t => txRows.push([t.date, t.description, t.category, t.debit||'', t.credit||'', t.amount]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), 'Transactions');

  // Sheet 2: Category Summary
  const catRows = [['Category','Total Spent','% of Spending','Transactions']];
  summary.byCat.forEach(c => catRows.push([c.name, c.total, `${c.pct}%`, c.count]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), 'Category Summary');

  // Sheet 3: Monthly Trend
  const mRows = [['Month','Total Income','Total Expenses','Net Savings','Savings Rate %']];
  summary.monthly.forEach(m => mRows.push([m.month, m.income, m.expenses, m.net, `${m.savingsRate}%`]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mRows), 'Monthly Trend');

  // Sheet 4: Subscriptions Detected
  const subRows = [['Merchant','Frequency','Avg Charge','Monthly Equivalent','Annual Cost','Last Charge']];
  subs.forEach(s => subRows.push([s.name, s.frequency, s.avgAmount, s.monthlyEquivalent.toFixed(2), s.yearlyEquivalent.toFixed(2), s.lastCharge]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(subRows), 'Subscriptions');

  // Sheet 5: Summary Dashboard
  const dashRows = [
    ['FINANCIAL REPORT SUMMARY',''],
    ['Generated by','ilovetexts.com — Free, Private, No Signup'],
    ['',''],
    ['OVERVIEW',''],
    ['Total Transactions', txns.length],
    ['Total Income', summary.totalIncome],
    ['Total Expenses', summary.totalExpenses],
    ['Net Savings', summary.netSavings],
    ['Savings Rate', `${summary.savingsRate}%`],
    ['',''],
    ['TOP 5 SPENDING CATEGORIES',''],
    ...summary.byCat.slice(0,5).map(c => [c.name, c.total]),
    ['',''],
    ['SUBSCRIPTIONS FOUND', subs.length],
    ['Total Monthly Subscription Cost', subs.reduce((s,sub)=>s+sub.monthlyEquivalent,0).toFixed(2)],
    ['Total Annual Subscription Cost', subs.reduce((s,sub)=>s+sub.yearlyEquivalent,0).toFixed(2)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashRows), 'Summary');

  XLSX.writeFile(wb, 'Financial_Report_ilovetexts.xlsx');
}

// ─── SVG Donut chart ──────────────────────────────────────────────────────────
function DonutChart({ segments, size = 160, innerRadius = 52 }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 12;
  let cumPct = 0;
  const paths = segments.filter(s => s.pct > 0).map(seg => {
    const startAngle = (cumPct / 100) * 2 * Math.PI - Math.PI / 2;
    cumPct += seg.pct;
    const endAngle = (cumPct / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerRadius * Math.cos(startAngle), yi1 = cy + innerRadius * Math.sin(startAngle);
    const xi2 = cx + innerRadius * Math.cos(endAngle), yi2 = cy + innerRadius * Math.sin(endAngle);
    const largeArc = seg.pct > 50 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
    return { d, color: seg.color, pct: seg.pct, name: seg.name };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} opacity={0.9}>
          <title>{p.name}: {p.pct}%</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={innerRadius - 2} fill="var(--bg-main)" />
    </svg>
  );
}

// ─── SVG Bar chart (monthly) ──────────────────────────────────────────────────
function BarChart({ data, width = 460, height = 140 }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 1);
  const barW = Math.min(28, (width - 60) / (data.length * 2.5));
  const gap = (width - 60) / data.length;
  const scaleY = (v) => height - 30 - (v / maxVal) * (height - 50);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <line x1="40" y1="10" x2="40" y2={height - 25} stroke="var(--border-light)" strokeWidth="1" />
      <line x1="40" y1={height - 25} x2={width - 10} y2={height - 25} stroke="var(--border-light)" strokeWidth="1" />
      {data.map((d, i) => {
        const x = 44 + i * gap;
        const incH = (d.income / maxVal) * (height - 50);
        const expH = (d.expenses / maxVal) * (height - 50);
        return (
          <g key={d.month}>
            <rect x={x} y={height - 25 - incH} width={barW} height={Math.max(incH, 1)} fill="#22c55e" opacity={0.8} rx="2">
              <title>Income: {d.income.toFixed(0)}</title>
            </rect>
            <rect x={x + barW + 2} y={height - 25 - expH} width={barW} height={Math.max(expH, 1)} fill="#ef4444" opacity={0.8} rx="2">
              <title>Expenses: {d.expenses.toFixed(0)}</title>
            </rect>
            <text x={x + barW} y={height - 8} textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
              {d.month.slice(5)}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={width - 100} y={10} width={10} height={10} fill="#22c55e" rx="2" />
      <text x={width - 86} y={19} fontSize="9" fill="var(--text-secondary)">Income</text>
      <rect x={width - 100} y={26} width={10} height={10} fill="#ef4444" rx="2" />
      <text x={width - 86} y={35} fontSize="9" fill="var(--text-secondary)">Expenses</text>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#6366f1', w = 80, h = 32 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  wrap: { maxWidth: 1200, margin: '0 auto', width: '100%' },
  heroCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    borderRadius: 'var(--radius-lg)', padding: '32px 28px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden',
  },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  statCard: (color) => ({ background: 'var(--bg-main)', border: `1px solid var(--border-light)`, borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-lg)', padding: '16px 18px', flex: 1, minWidth: 130 }),
  label: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  tab: (a) => ({ padding: '9px 16px', border: 'none', background: a ? 'var(--bg-main)' : 'transparent', color: a ? '#10b981' : 'var(--text-secondary)', fontWeight: a ? 700 : 500, cursor: 'pointer', borderBottom: a ? '2px solid #10b981' : '2px solid transparent', fontSize: '0.84rem', transition: 'all 0.15s', whiteSpace: 'nowrap' }),
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  input: { padding: '9px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
};

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'categories', label: '🍩 Categories' },
  { id: 'monthly', label: '📈 Monthly Trend' },
  { id: 'subscriptions', label: '🔔 Subscriptions' },
  { id: 'anomalies', label: '⚠️ Anomalies' },
  { id: 'transactions', label: '📋 All Transactions' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: '$ USD' },
  { code: 'GBP', symbol: '£', label: '£ GBP' },
  { code: 'EUR', symbol: '€', label: '€ EUR' },
  { code: 'INR', symbol: '₹', label: '₹ INR' },
  { code: 'CAD', symbol: '$', label: 'CA$ CAD' },
  { code: 'AUD', symbol: '$', label: 'A$ AUD' },
];

export default function BankStatementReport({ t, lang }) {
  const [txns, setTxns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [dragging, setDragging] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // ─── File processing ────────────────────────────────────────────────────────
  const processFile = useCallback(async (file, password = '') => {
    setLoading(true);
    setTxns([]);
    setFileName(file.name);
    try {
      let text = '';
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        try {
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ab), password: password || undefined }).promise;
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
          }
        } catch (e) {
          if (e.message?.includes('password') || e.name === 'PasswordException') {
            setPendingFile(file);
            setNeedsPassword(true);
            setLoading(false);
            return;
          }
          throw e;
        }
      } else {
        text = new TextDecoder().decode(await file.arrayBuffer());
      }
      const parsed = parseTransactions(text);
      if (parsed.length === 0) {
        showToast('No transactions found. Try a CSV export from your bank instead.', 'error');
      } else {
        setTxns(parsed);
        setNeedsPassword(false);
        setPendingFile(null);
        showToast(`✅ Parsed ${parsed.length} transactions successfully`);
      }
    } catch (err) {
      showToast('Failed to read file. Try a CSV export from your bank portal.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  // ─── Analytics computations ─────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!txns.length) return null;
    const totalIncome = txns.reduce((s, t) => s + t.credit, 0);
    const totalExpenses = txns.reduce((s, t) => s + t.debit, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // By category
    const catMap = {};
    txns.filter(t => t.debit > 0).forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0 };
      catMap[t.category].total += t.debit;
      catMap[t.category].count += 1;
    });
    const byCat = Object.entries(catMap)
      .map(([name, v]) => {
        const catDef = CATS.find(c => c.name === name) || CATS[CATS.length - 1];
        return { name, total: v.total, count: v.count, color: catDef.color, icon: catDef.icon, pct: Math.round((v.total / totalExpenses) * 100) };
      })
      .sort((a, b) => b.total - a.total);

    // Monthly
    const monthMap = {};
    txns.forEach(t => {
      const mo = getMonth(t.date);
      if (!monthMap[mo]) monthMap[mo] = { income: 0, expenses: 0 };
      monthMap[mo].income += t.credit;
      monthMap[mo].expenses += t.debit;
    });
    const monthly = Object.entries(monthMap)
      .map(([month, v]) => ({
        month,
        income: v.income,
        expenses: v.expenses,
        net: v.income - v.expenses,
        savingsRate: v.income > 0 ? Math.round(((v.income - v.expenses) / v.income) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top merchants
    const merchantMap = {};
    txns.filter(t => t.debit > 0).forEach(t => {
      const key = t.description.slice(0, 35).trim();
      if (!merchantMap[key]) merchantMap[key] = { total: 0, count: 0 };
      merchantMap[key].total += t.debit;
      merchantMap[key].count += 1;
    });
    const topMerchants = Object.entries(merchantMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Subscriptions & anomalies
    const subscriptions = detectSubscriptions(txns);
    const anomalies = detectAnomalies(txns);

    // Financial health score (0-100)
    let healthScore = 50;
    if (savingsRate >= 20) healthScore += 20;
    else if (savingsRate >= 10) healthScore += 10;
    else if (savingsRate < 0) healthScore -= 20;
    if (subscriptions.length <= 5) healthScore += 10;
    else if (subscriptions.length > 10) healthScore -= 10;
    if (anomalies.length === 0) healthScore += 10;
    const subCost = subscriptions.reduce((s, sub) => s + sub.monthlyEquivalent, 0);
    if (totalExpenses > 0 && subCost / (totalExpenses / Math.max(monthly.length, 1)) > 0.15) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return { totalIncome, totalExpenses, netSavings, savingsRate, byCat, monthly, topMerchants, subscriptions, anomalies, healthScore };
  }, [txns]);

  // ─── Filtered transactions for table ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...txns];
    if (filterCat !== 'All') list = list.filter(t => t.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || String(t.debit || t.credit).includes(q));
    }
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'date') { av = av || ''; bv = bv || ''; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [txns, filterCat, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const f = (n) => fmt(n, currency);

  // ─── Upload zone ──────────────────────────────────────────────────────────
  const UploadZone = () => (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#10b981' : 'var(--border-light)'}`,
          borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)', transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Drop your bank statement here</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Supports PDF, CSV, TXT — from any bank worldwide</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          {['Chase', 'Bank of America', 'HDFC', 'SBI', 'Barclays', 'HSBC', 'Santander', 'TD Bank', 'RBC', 'Deutsche Bank', '+ 500 more'].map(b => (
            <span key={b} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg-main)', border: '1px solid var(--border-light)', fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{b}</span>
          ))}
        </div>
        <button style={S.btnPrimary}>📂 Choose File</button>
        <input ref={inputRef} type="file" accept=".pdf,.csv,.txt,.xls,.xlsx" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {/* Currency selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ ...S.label, margin: 0 }}>Your Currency:</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setCurrency(c.code)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${currency === c.code ? '#10b981' : 'var(--border-light)'}`,
              background: currency === c.code ? '#dcfce7' : 'var(--bg-secondary)',
              color: currency === c.code ? '#059669' : 'var(--text-secondary)',
              fontWeight: currency === c.code ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer',
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Password input */}
      {needsPassword && (
        <div style={{ padding: 16, background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fcd34d', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>🔒 PDF is password protected:</span>
          <input type="password" value={pdfPassword} onChange={e => setPdfPassword(e.target.value)} placeholder="Enter PDF password" style={{ ...S.input, flex: 1, minWidth: 160 }} />
          <button onClick={() => pendingFile && processFile(pendingFile, pdfPassword)} style={S.btnPrimary}>Unlock & Parse</button>
        </div>
      )}

      {/* Privacy badge */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
        {[
          { icon: '🔒', text: '100% private — processed in your browser' },
          { icon: '🚫', text: 'Never uploaded to any server' },
          { icon: '⚡', text: 'Works with 500+ bank formats' },
          { icon: '📦', text: 'Export to Excel with one click' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>{f.icon}</span><span>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Health score ring ────────────────────────────────────────────────────
  const HealthRing = ({ score }) => {
    const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
    const label = score >= 70 ? 'Healthy' : score >= 45 ? 'Moderate' : 'At Risk';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx={36} cy={36} r={28} fill="none" stroke="var(--border-light)" strokeWidth={7} />
          <circle cx={36} cy={36} r={28} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
            strokeLinecap="round" transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
          <text x={36} y={41} textAnchor="middle" fontSize={14} fontWeight={800} fill={color}>{score}</text>
        </svg>
        <div>
          <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{label}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Financial Health</div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.wrap}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 'var(--radius-sm)',
          background: toast.type === 'error' ? '#fef2f2' : toast.type === 'warning' ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : toast.type === 'warning' ? '#fcd34d' : '#86efac'}`,
          color: toast.type === 'error' ? '#dc2626' : toast.type === 'warning' ? '#92400e' : '#15803d',
          fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div style={S.heroCard}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '2rem' }}>💹</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>WORKFLOW AUTOMATION</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.25 }}>Bank Statement Financial Report</h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.55 }}>
              Upload any bank statement PDF or CSV → auto-categorizes every transaction, detects subscriptions, flags anomalies, shows monthly trends, and exports a complete financial report to Excel.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
            {[
              { icon: '🗂️', text: 'PDF + CSV from 500+ banks' },
              { icon: '🔔', text: 'Subscription & leak detector' },
              { icon: '📈', text: 'Visual charts & monthly trends' },
              { icon: '📦', text: 'Export full report to Excel' },
              { icon: '🔒', text: 'Never uploaded — 100% private' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', opacity: 0.92 }}>
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload zone if no data yet */}
      {!txns.length && !loading && <div style={S.card}><UploadZone /></div>}

      {/* Loading */}
      {loading && (
        <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⚙️</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Analyzing your statement...</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Parsing transactions · Categorizing · Detecting subscriptions</div>
        </div>
      )}

      {/* Dashboard */}
      {txns.length > 0 && analytics && (
        <>
          {/* Top action bar */}
          <div style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 0, borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>📄 {fileName}</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: '0.73rem', fontWeight: 700 }}>
                {txns.length} transactions
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={async () => { setExporting(true); try { await exportExcel(txns, analytics, analytics.subscriptions, currency); showToast('Excel report downloaded!'); } finally { setExporting(false); } }}
                disabled={exporting}
                style={S.btnPrimary}
              >
                {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
              </button>
              <button onClick={() => { setTxns([]); setFileName(''); setActiveTab('overview'); }} style={S.btnOutline}>
                🔄 New Statement
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, padding: '0 0 0 0' }}>
            {[
              { label: 'Total Income', value: f(analytics.totalIncome), color: '#22c55e', sub: `${analytics.monthly.length} month(s)`, spark: analytics.monthly.map(m => m.income) },
              { label: 'Total Expenses', value: f(analytics.totalExpenses), color: '#ef4444', sub: `${txns.filter(t => t.debit > 0).length} transactions`, spark: analytics.monthly.map(m => m.expenses) },
              { label: 'Net Savings', value: f(analytics.netSavings), color: analytics.netSavings >= 0 ? '#10b981' : '#ef4444', sub: `${analytics.savingsRate}% savings rate`, spark: analytics.monthly.map(m => m.net) },
              { label: 'Avg Monthly Spend', value: f(analytics.totalExpenses / Math.max(analytics.monthly.length, 1)), color: '#f59e0b', sub: `${analytics.byCat[0]?.name || 'N/A'} is top category`, spark: analytics.monthly.map(m => m.expenses) },
            ].map(stat => (
              <div key={stat.label} style={S.statCard(stat.color)}>
                <div style={S.label}>{stat.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, lineHeight: 1.1, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{stat.sub}</div>
                <Sparkline values={stat.spark} color={stat.color} />
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', overflowX: 'auto', background: 'var(--bg-secondary)' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={S.tab(activeTab === tab.id)}>
                  {tab.label}
                  {tab.id === 'subscriptions' && analytics.subscriptions.length > 0 && (
                    <span style={{ marginLeft: 5, padding: '1px 6px', borderRadius: 10, background: '#fce7f3', color: '#be185d', fontSize: '0.7rem', fontWeight: 700 }}>{analytics.subscriptions.length}</span>
                  )}
                  {tab.id === 'anomalies' && analytics.anomalies.length > 0 && (
                    <span style={{ marginLeft: 5, padding: '1px 6px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 700 }}>{analytics.anomalies.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px 22px' }}>

              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <div>
                  {/* Health score + top stats */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24, alignItems: 'flex-start' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <HealthRing score={analytics.healthScore} />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      {/* Savings rate bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Savings Rate</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: analytics.savingsRate >= 20 ? '#10b981' : analytics.savingsRate >= 10 ? '#f59e0b' : '#ef4444' }}>{analytics.savingsRate}%</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <div style={{ ...S.progressBar(Math.max(0, analytics.savingsRate), analytics.savingsRate >= 20 ? '#10b981' : analytics.savingsRate >= 10 ? '#f59e0b' : '#ef4444') }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                          {analytics.savingsRate >= 20 ? '🎯 Excellent! Above the recommended 20% target.' : analytics.savingsRate >= 10 ? '⚡ Getting there — aim for 20%.' : analytics.savingsRate < 0 ? '⚠️ Spending exceeds income this period.' : '📉 Low savings rate — review top expenses.'}
                        </div>
                      </div>

                      {/* Top 5 categories compact */}
                      {analytics.byCat.slice(0, 5).map(cat => (
                        <div key={cat.name} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: '0.78rem' }}>{cat.icon} {cat.name}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{f(cat.total)} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({cat.pct}%)</span></span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Merchants */}
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>🏆 Top 10 Merchants by Spending</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          {['#', 'Merchant', 'Total Spent', 'Transactions', 'Avg per Txn'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topMerchants.map((m, i) => (
                          <tr key={m.name} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>#{i + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, maxWidth: 240 }}>{m.name}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ef4444' }}>{f(m.total)}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.count}×</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{f(m.total / m.count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── CATEGORIES TAB ── */}
              {activeTab === 'categories' && (
                <div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <DonutChart segments={analytics.byCat.slice(0, 8)} size={180} innerRadius={60} />
                      {/* Legend */}
                      <div style={{ marginTop: 12 }}>
                        {analytics.byCat.slice(0, 8).map(c => (
                          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.icon} {c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      {analytics.byCat.map(cat => (
                        <div key={cat.name} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.icon} {cat.name}</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f(cat.total)}</span>
                              <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cat.pct}% · {cat.count} txns</span>
                            </div>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── MONTHLY TREND TAB ── */}
              {activeTab === 'monthly' && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>📊 Monthly Income vs Expenses</h3>
                    <BarChart data={analytics.monthly} width={560} height={160} />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          {['Month', 'Income', 'Expenses', 'Net Savings', 'Savings Rate', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.monthly.map(m => (
                          <tr key={m.month} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700 }}>{m.month}</td>
                            <td style={{ padding: '9px 12px', color: '#22c55e', fontWeight: 600 }}>{f(m.income)}</td>
                            <td style={{ padding: '9px 12px', color: '#ef4444', fontWeight: 600 }}>{f(m.expenses)}</td>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: m.net >= 0 ? '#10b981' : '#ef4444' }}>{f(m.net)}</td>
                            <td style={{ padding: '9px 12px' }}>{m.savingsRate}%</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, background: m.savingsRate >= 20 ? '#dcfce7' : m.savingsRate >= 0 ? '#fef9c3' : '#fee2e2', color: m.savingsRate >= 20 ? '#15803d' : m.savingsRate >= 0 ? '#854d0e' : '#dc2626' }}>
                                {m.savingsRate >= 20 ? '✅ Healthy' : m.savingsRate >= 0 ? '⚡ Break-even' : '⚠️ Deficit'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SUBSCRIPTIONS TAB ── */}
              {activeTab === 'subscriptions' && (
                <div>
                  {analytics.subscriptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                      <div style={{ fontWeight: 600 }}>No recurring subscriptions detected</div>
                    </div>
                  ) : (
                    <>
                      {/* Summary banner */}
                      <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: '#fdf2f8', border: '1px solid #f9a8d4', marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', marginBottom: 2 }}>Monthly Subscription Total</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#be185d' }}>
                            {f(analytics.subscriptions.reduce((s, sub) => s + sub.monthlyEquivalent, 0))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', marginBottom: 2 }}>Annual Subscription Total</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#be185d' }}>
                            {f(analytics.subscriptions.reduce((s, sub) => s + sub.yearlyEquivalent, 0))}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.82rem', color: '#9d174d', lineHeight: 1.55 }}>
                            💡 That's {f(analytics.subscriptions.reduce((s, sub) => s + sub.yearlyEquivalent, 0))} per year on {analytics.subscriptions.length} detected recurring charges. Review each one and cancel any you no longer use.
                          </div>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                              {['Merchant', 'Frequency', 'Avg Charge', 'Monthly Cost', 'Annual Cost', 'Last Charged', 'Occurrences'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.subscriptions.map((sub, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 220 }}>{sub.name}</td>
                                <td style={{ padding: '9px 12px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, background: '#fce7f3', color: '#be185d' }}>{sub.frequency}</span>
                                </td>
                                <td style={{ padding: '9px 12px' }}>{f(sub.avgAmount)}</td>
                                <td style={{ padding: '9px 12px', fontWeight: 700, color: '#ec4899' }}>{f(sub.monthlyEquivalent)}</td>
                                <td style={{ padding: '9px 12px', fontWeight: 700, color: '#be185d' }}>{f(sub.yearlyEquivalent)}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>{sub.lastCharge}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>{sub.count}×</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── ANOMALIES TAB ── */}
              {activeTab === 'anomalies' && (
                <div>
                  {analytics.anomalies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                      <div style={{ fontWeight: 600 }}>No unusual transactions detected</div>
                      <div style={{ fontSize: '0.82rem', marginTop: 4 }}>All transactions are within normal spending range.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fca5a5', marginBottom: 16 }}>
                        <strong style={{ color: '#dc2626' }}>⚠️ {analytics.anomalies.length} unusual transaction{analytics.anomalies.length > 1 ? 's' : ''} detected</strong>
                        <span style={{ color: '#7f1d1d', fontSize: '0.82rem', marginLeft: 8 }}>These are significantly higher than your average spending and may be worth reviewing.</span>
                      </div>
                      {analytics.anomalies.map((a, i) => (
                        <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{a.description}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{a.date} · {a.category}</div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#dc2626' }}>{f(a.debit)}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ── TRANSACTIONS TAB ── */}
              {activeTab === 'transactions' && (
                <div>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="🔍 Search transactions..."
                      style={{ ...S.input, flex: 1, minWidth: 160 }}
                    />
                    <select
                      value={filterCat}
                      onChange={e => setFilterCat(e.target.value)}
                      style={{ ...S.input, cursor: 'pointer' }}
                    >
                      <option value="All">All Categories</option>
                      {CATS.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{filtered.length} shown</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                          {[
                            { key: 'date', label: 'Date' },
                            { key: 'description', label: 'Description' },
                            { key: 'category', label: 'Category' },
                            { key: 'debit', label: 'Debit' },
                            { key: 'credit', label: 'Credit' },
                          ].map(col => (
                            <th key={col.key} onClick={() => toggleSort(col.key)} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                              {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.slice(0, 300).map(txn => {
                          const catDef = CATS.find(c => c.name === txn.category) || CATS[CATS.length - 1];
                          return (
                            <tr key={txn.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: txn.isDuplicate ? 0.5 : 1 }}>
                              <td style={{ padding: '7px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{txn.date}</td>
                              <td style={{ padding: '7px 12px', maxWidth: 280 }}>
                                <div style={{ fontWeight: 500, lineHeight: 1.35 }}>{txn.description}</div>
                                {txn.isSuspicious && <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700 }}>⚠️ Unusual amount</span>}
                                {txn.isDuplicate && <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}> · Possible duplicate</span>}
                              </td>
                              <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: catDef.color + '22', color: catDef.color }}>
                                  {catDef.icon} {txn.category}
                                </span>
                              </td>
                              <td style={{ padding: '7px 12px', fontWeight: txn.debit > 0 ? 700 : 400, color: txn.debit > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                                {txn.debit > 0 ? f(txn.debit) : '—'}
                              </td>
                              <td style={{ padding: '7px 12px', fontWeight: txn.credit > 0 ? 700 : 400, color: txn.credit > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                                {txn.credit > 0 ? f(txn.credit) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                        {filtered.length > 300 && (
                          <tr><td colSpan={5} style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Showing first 300 of {filtered.length}. Export to Excel to see all.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* How-to guide (only on upload screen) */}
      {!txns.length && !loading && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📖 How to Use the Bank Statement Financial Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { step: '1', icon: '📥', title: 'Export from your bank', desc: 'Log into your bank online portal and download your statement as PDF or CSV. Most banks offer this under "Download Statement" or "Export".' },
              { step: '2', icon: '📂', title: 'Drop or upload the file', desc: 'Drag and drop the file onto this page or click "Choose File". Select your currency first for accurate formatting.' },
              { step: '3', icon: '⚡', title: 'Automatic analysis runs', desc: 'Every transaction is extracted, categorized into 16 spending types, and analyzed for patterns — all in your browser in seconds.' },
              { step: '4', icon: '🔔', title: 'Review subscriptions', desc: 'The Subscriptions tab shows every recurring charge detected — Netflix, gym, SaaS tools — with monthly and annual cost totals.' },
              { step: '5', icon: '📊', title: 'Explore charts & trends', desc: 'The Monthly Trend tab shows income vs expenses month by month. The Categories tab breaks down exactly where your money goes.' },
              { step: '6', icon: '📦', title: 'Export to Excel', desc: 'Click "Export to Excel" to download a 5-sheet workbook: transactions, categories, monthly trend, subscriptions, and summary dashboard.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{item.step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3 }}>{item.icon} {item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why better card */}
      {!txns.length && !loading && (
        <div style={{ ...S.card, background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Why this beats every other bank analyzer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '📊', title: 'Full financial report — not just a table', desc: 'Charts, health score, monthly trends, and actionable insights in one view. Competitors only show raw transactions.' },
              { icon: '🔔', title: 'Subscription leak detector', desc: 'Automatically finds recurring charges — even if you forgot about them. Shows the total annual cost you might be wasting.' },
              { icon: '📦', title: '5-sheet Excel export', desc: 'Transactions, categories, monthly trend, subscriptions, and a summary dashboard — all in one Excel workbook.' },
              { icon: '🌍', title: 'Works globally', desc: 'USD, GBP, EUR, INR, CAD, AUD. Keywords cover US, UK, EU, Indian banks. CSV from any bank auto-detected.' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .progress-bar { transition: width 0.8s ease; }
      `}</style>
    </div>
  );
}

// helper used in statCard
const S_progressBar = (pct, color) => ({ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: color || '#10b981', borderRadius: 4, transition: 'width 0.6s ease' });
// patch S to include it
Object.assign(S, { progressBar: S_progressBar });
