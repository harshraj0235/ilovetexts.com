'use client';
import { useState, useRef, useCallback, useMemo } from 'react';

// ─── Transaction category detection ─────────────────────
const CATEGORY_RULES = [
  { cat: 'Food & Dining', icon: '🍔', color: '#f97316', keywords: ['restaurant','cafe','coffee','starbucks','mcdonald','kfc','pizza','uber eats','zomato','swiggy','dominos','subway','burger','taco','dining','food','eat','lunch','breakfast','dinner','bistro','kitchen','grille','bakery','donut','dunkin','chipotle','noodle','sushi','thai','chinese','italian'] },
  { cat: 'Groceries', icon: '🛒', color: '#22c55e', keywords: ['grocery','supermarket','walmart','tesco','kroger','sainsbury','aldi','lidl','costco','whole foods','trader joe','safeway','publix','market','rewe','edeka','iga','shoprite','food lion','giant','harris teeter','albertsons','meijer','big bazaar','reliance fresh','more supermarket','dmart','spencers','nature basket'] },
  { cat: 'Transport', icon: '🚗', color: '#3b82f6', keywords: ['uber','lyft','ola','rapido','taxi','metro','transit','transport','fuel','petrol','gas station','bp','shell','chevron','exxon','parking','toll','irctc','train','bus','airways','airline','flight','indigo','air india','spicejet','southwest','delta','american air','united airlines','ryanair','easyjet'] },
  { cat: 'Shopping', icon: '🛍️', color: '#8b5cf6', keywords: ['amazon','flipkart','myntra','meesho','snapdeal','ebay','shopify','etsy','target','macy\'s','h&m','zara','gap','nike','adidas','apple store','best buy','ikea','home depot','lowe\'s','uniqlo','primark','marks spencer','john lewis','argos','currys','pcworld','decathlon','sport','cloth','apparel','fashion','store','shop','mall','boutique'] },
  { cat: 'Entertainment', icon: '🎬', color: '#ec4899', keywords: ['netflix','spotify','youtube','prime video','disney','hulu','apple tv','hbo','peacock','paramount','hotstar','zee5','sony liv','gaana','jiosaavn','amazon music','apple music','google play','steam','xbox','playstation','ps5','nintendo','movie','cinema','theatre','pvr','inox','bookmyshow','ticket','concert','event','show','museum','park','game'] },
  { cat: 'Subscriptions', icon: '🔄', color: '#f59e0b', keywords: ['subscription','monthly','annual','membership','renewal','adobe','microsoft','office 365','dropbox','google one','icloud','1password','lastpass','nordvpn','expressvpn','canva','notion','slack','zoom','linkedin','medium','substack','patreon','onlyfans','duolingo','headspace','calm'] },
  { cat: 'Health & Medical', icon: '🏥', color: '#14b8a6', keywords: ['pharmacy','chemist','medical','hospital','clinic','doctor','health','dental','optician','lab','apollo','fortis','narayana','max healthcare','cvs','walgreens','boots','lloyds pharmacy','rite aid','gym','fitness','yoga','cult fit','gold\'s gym','anytime fitness','planet fitness','crossfit','physio'] },
  { cat: 'Utilities', icon: '💡', color: '#6366f1', keywords: ['electricity','electric','power','gas','water','internet','broadband','mobile','phone','airtel','jio','vi','bsnl','verizon','at&t','t-mobile','comcast','spectrum','xfinity','bt','virgin media','sky','ee','vodafone','o2','three','utility','bill','msedcl','bescom','tneb','bses','rent','maintenance','hoa'] },
  { cat: 'Income / Salary', icon: '💰', color: '#10b981', keywords: ['salary','wages','payroll','deposit','credit','neft','rtgs','imps','transfer in','payment received','income','freelance','invoice paid','client payment','refund','cashback','interest earned','dividend','bonus','commission','reimbursement'] },
  { cat: 'ATM / Cash', icon: '🏧', color: '#64748b', keywords: ['atm','cash withdrawal','cash deposit','cdm','passbook','cheque','check','demand draft','dd'] },
  { cat: 'Insurance', icon: '🛡️', color: '#0ea5e9', keywords: ['insurance','lic','hdfc life','sbi life','icici lombard','bajaj allianz','star health','policy','premium','cover','geico','state farm','allstate','progressive','nationwide','axa','aviva','zurich'] },
  { cat: 'Education', icon: '📚', color: '#7c3aed', keywords: ['school','college','university','tuition','course','udemy','coursera','skillshare','edx','byju','unacademy','vedantu','khan academy','book','library','education','student','fee','exam'] },
  { cat: 'Finance / Investment', icon: '📈', color: '#f43f5e', keywords: ['mutual fund','sip','stocks','shares','demat','zerodha','groww','robinhood','etrade','fidelity','vanguard','td ameritrade','schwab','emi','loan','mortgage','credit card','repayment','insurance premium'] },
];

const CATEGORY_OTHER = { cat: 'Other', icon: '📋', color: '#94a3b8' };

function detectCategory(description) {
  const desc = (description || '').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => desc.includes(k))) return rule;
  }
  return CATEGORY_OTHER;
}

// ─── Recurring / subscription detection ─────────────────
function detectSubscriptions(transactions) {
  const map = {};
  transactions.forEach(tx => {
    if (tx.amount >= 0) return; // Only debits
    const key = tx.description.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 30);
    if (!map[key]) map[key] = [];
    map[key].push(tx);
  });
  return Object.entries(map)
    .filter(([, txs]) => txs.length >= 2)
    .map(([key, txs]) => {
      const amounts = txs.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isConsistent = Math.max(...amounts) - Math.min(...amounts) < avgAmount * 0.05;
      return { description: txs[0].description, count: txs.length, avgAmount, isConsistent, txs };
    })
    .filter(s => s.count >= 2)
    .sort((a, b) => b.avgAmount - a.avgAmount);
}

// ─── PDF text extraction ─────────────────────────────────
async function extractTransactionsFromPDF(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const totalPages = pdf.numPages;
  let allText = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress(10 + Math.round((i / totalPages) * 40));
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Get items with their x,y positions for column detection
    const items = content.items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
    })).filter(item => item.text.trim());
    allText.push(...items);
  }
  return allText;
}

// ─── Smart column & transaction parser ───────────────────
function parseTransactions(textItems) {
  if (!textItems.length) return [];

  // Group items by approximate Y position (same line)
  const lineMap = {};
  textItems.forEach(item => {
    const yKey = Math.round(item.y / 3) * 3;
    if (!lineMap[yKey]) lineMap[yKey] = [];
    lineMap[yKey].push(item);
  });

  const lines = Object.entries(lineMap)
    .sort((a, b) => b[0] - a[0]) // Sort top to bottom
    .map(([y, items]) => ({
      y: parseFloat(y),
      items: items.sort((a, b) => a.x - b.x),
      text: items.sort((a, b) => a.x - b.x).map(i => i.text).join(' '),
    }));

  // Date pattern detection
  const datePatterns = [
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/,
  ];

  // Amount pattern
  const amountPattern = /[-+]?[£$€₹]?\s*[\d,]+\.?\d{0,2}/g;
  const numberPattern = /^[-+]?[\d,]+\.?\d{0,2}$/;

  const transactions = [];

  lines.forEach(line => {
    const { text } = line;

    // Find date
    let date = null;
    for (const pat of datePatterns) {
      const m = text.match(pat);
      if (m) { date = m[1]; break; }
    }

    if (!date) return; // No date = not a transaction line

    // Find all numbers in line
    const numbers = [];
    let match;
    const numRegex = /[-+]?[£$€₹]?\s*([\d,]+\.?\d{0,2})/g;
    while ((match = numRegex.exec(text)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) numbers.push({ val, pos: match.index });
    }

    if (!numbers.length) return;

    // Extract description (text between date and numbers)
    const dateMatch = text.match(datePatterns[0]) || text.match(datePatterns[1]) || text.match(datePatterns[2]) || text.match(datePatterns[3]);
    let description = text;
    if (dateMatch) {
      description = text.replace(dateMatch[0], '').trim();
    }
    // Remove numbers from description
    description = description.replace(/[-+]?[£$€₹]?\s*[\d,]+\.?\d{0,2}/g, '').replace(/\s+/g, ' ').trim();
    // Limit description length
    description = description.slice(0, 80).trim();

    // Determine debit/credit
    // If 2 numbers: first is debit/credit, second is balance
    // If 3 numbers: debit, credit, balance (one will be 0)
    let amount = 0;
    let balance = null;

    if (numbers.length === 1) {
      amount = numbers[0].val;
    } else if (numbers.length === 2) {
      amount = numbers[0].val;
      balance = numbers[1].val;
    } else if (numbers.length >= 3) {
      // Try to detect debit/credit columns
      const [n1, n2, n3] = numbers;
      if (n1.val > 0 && n2.val === 0) { amount = -n1.val; balance = n3?.val; }
      else if (n1.val === 0 && n2.val > 0) { amount = n2.val; balance = n3?.val; }
      else { amount = -n1.val; balance = n3?.val ?? n2.val; }
    }

    // Detect if negative (debit) from text clues
    const isDebit = /\b(dr|debit|purchase|payment|paid|withdrawal|pos|atm|eft|chq|wire out|transfer out)\b/i.test(text);
    const isCredit = /\b(cr|credit|deposit|received|salary|refund|cashback|interest|transfer in)\b/i.test(text);
    if (isDebit && amount > 0) amount = -amount;
    if (isCredit && amount < 0) amount = Math.abs(amount);

    if (Math.abs(amount) < 0.01) return; // Skip zero amounts

    transactions.push({
      id: Math.random().toString(36).slice(2),
      date,
      description: description || 'Transaction',
      amount,
      balance,
      category: detectCategory(description),
      rawText: text,
    });
  });

  return transactions;
}

// ─── Number formatting ───────────────────────────────────
const fmt = (n, currency = '') => {
  const abs = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency}${abs}`;
};

const CURRENCIES = ['₹', '$', '£', '€', 'CA$', 'AU$', 'AED'];

// ─── Styles ──────────────────────────────────────────────
const S = {
  wrap: { maxWidth: 1200, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '8px 10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  statCard: (color) => ({ background: color + '12', border: `1px solid ${color}40`, borderRadius: 'var(--radius-md)', padding: '14px 16px', flex: 1, minWidth: 120 }),
  tabBtn: (active) => ({ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', border: 'none', background: active ? 'var(--accent)' : 'transparent', color: active ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }),
  progressBar: (pct, color = 'var(--highlight)') => ({ height: 5, borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.4s' }),
  exportBtn: (color) => ({ padding: '9px 14px', background: color, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }),
  editInput: { width: '100%', padding: '3px 6px', border: '1px solid var(--highlight)', borderRadius: 4, background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' },
};

export default function BankStatementConverter({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('idle'); // idle|processing|done|error
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmt, setEditAmt] = useState('');
  const fileRef = useRef();

  // ── Process uploaded files ─────────────────────────────
  const processFiles = useCallback(async (newFiles) => {
    if (!newFiles.length) return;
    setFiles(newFiles.map(f => f.name));
    setStatus('processing');
    setProgress(5);
    setProgressMsg('Loading PDF engine...');
    let allTx = [];

    for (let fi = 0; fi < newFiles.length; fi++) {
      const file = newFiles[fi];
      setProgressMsg(`Reading ${file.name} (${fi + 1}/${newFiles.length})...`);
      try {
        let textItems;
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          textItems = await extractTransactionsFromPDF(file, p => setProgress(5 + p * 0.7));
          const txs = parseTransactions(textItems);
          allTx.push(...txs);
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          const text = await file.text();
          const rows = text.split('\n').slice(1);
          rows.forEach(row => {
            const cols = row.split(',').map(c => c.replace(/"/g, '').trim());
            if (cols.length < 3) return;
            const [date, desc, ...rest] = cols;
            if (!date || !desc) return;
            const amount = parseFloat(rest.find(c => !isNaN(parseFloat(c.replace(/[,$£€₹]/g, ''))))?.replace(/[,$£€₹]/g, '') || '0');
            if (!isNaN(amount) && amount !== 0) {
              allTx.push({ id: Math.random().toString(36).slice(2), date, description: desc, amount, balance: null, category: detectCategory(desc) });
            }
          });
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    }

    setProgress(90);
    setProgressMsg('Categorizing transactions...');

    // Sort by date descending
    allTx.sort((a, b) => {
      try { return new Date(b.date) - new Date(a.date); } catch { return 0; }
    });

    setTransactions(allTx);
    setProgress(100);
    setStatus(allTx.length > 0 ? 'done' : 'error');
    setProgressMsg(allTx.length > 0 ? '' : 'No transactions found. Try a different PDF or check if it is a scanned image.');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.(pdf|csv|txt)$/i));
    if (dropped.length) processFiles(dropped);
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.match(/\.(pdf|csv|txt)$/i));
    if (selected.length) processFiles(selected);
  };

  // ── Derived stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const debits = transactions.filter(t => t.amount < 0);
    const credits = transactions.filter(t => t.amount > 0);
    const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
    const netFlow = totalIncome - totalSpent;

    // Category breakdown
    const catMap = {};
    debits.forEach(tx => {
      const k = tx.category.cat;
      if (!catMap[k]) catMap[k] = { ...tx.category, total: 0, count: 0 };
      catMap[k].total += Math.abs(tx.amount);
      catMap[k].count++;
    });
    const catBreakdown = Object.values(catMap).sort((a, b) => b.total - a.total);

    // Subscriptions
    const subscriptions = detectSubscriptions(transactions);

    return { totalSpent, totalIncome, netFlow, txCount: transactions.length, catBreakdown, subscriptions };
  }, [transactions]);

  // ── Filtered & sorted transactions ────────────────────
  const filteredTx = useMemo(() => {
    let tx = [...transactions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tx = tx.filter(t => t.description.toLowerCase().includes(q) || t.date.includes(q) || String(t.amount).includes(q));
    }
    if (filterCat !== 'All') {
      tx = tx.filter(t => t.category.cat === filterCat);
    }
    if (sortBy === 'amount_desc') tx.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    else if (sortBy === 'amount_asc') tx.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    else if (sortBy === 'date') tx.sort((a, b) => { try { return new Date(b.date) - new Date(a.date); } catch { return 0; } });
    return tx;
  }, [transactions, searchQuery, filterCat, sortBy]);

  // ── Edit transaction ───────────────────────────────────
  const startEdit = (tx) => { setEditingId(tx.id); setEditDesc(tx.description); setEditAmt(String(tx.amount)); };
  const saveEdit = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, description: editDesc, amount: parseFloat(editAmt) || t.amount, category: detectCategory(editDesc) } : t));
    setEditingId(null);
  };

  // ── Export functions ───────────────────────────────────
  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const data = filteredTx.map(t => ({
      Date: t.date,
      Description: t.description,
      Amount: t.amount,
      Type: t.amount >= 0 ? 'Credit' : 'Debit',
      Category: t.category.cat,
      Balance: t.balance ?? '',
    }));
    const ws = utils.json_to_sheet(data);
    // Style header
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Transactions');
    // Summary sheet
    const summaryData = stats.catBreakdown.map(c => ({ Category: c.cat, Total: c.total.toFixed(2), Transactions: c.count }));
    const ws2 = utils.json_to_sheet(summaryData);
    utils.book_append_sheet(wb, ws2, 'Summary');
    writeFile(wb, 'bank-statement.xlsx');
  };

  const exportCSV = async () => {
    const { utils, writeFile } = await import('xlsx');
    const data = filteredTx.map(t => ({ Date: t.date, Description: t.description, Amount: t.amount, Type: t.amount >= 0 ? 'Credit' : 'Debit', Category: t.category.cat }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Transactions');
    writeFile(wb, 'bank-statement.csv', { bookType: 'csv' });
  };

  const exportJSON = () => {
    const data = filteredTx.map(({ id, rawText, ...t }) => ({ ...t, category: t.category.cat }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bank-statement.json'; a.click();
  };

  const allCategories = ['All', ...new Set(transactions.map(t => t.category.cat))];

  return (
    <div style={S.wrap}>
      {/* ── Badges ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🔒 Nothing uploaded to server', '🏦 500+ banks worldwide', '📊 Spending analytics', '🔄 Subscription detector', '📥 Excel / CSV / JSON', '✏️ Inline editing', '⚡ Free forever'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* ── Upload zone ────────────────────────────────── */}
      {status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? 'var(--highlight)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s', marginBottom: 16 }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏦</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 10 }}>Drop your bank statement here</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '0.95rem' }}>PDF, CSV, or TXT — from any bank worldwide</p>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 20, fontSize: '0.82rem' }}>Chase · HDFC · HSBC · Barclays · Wells Fargo · SBI · TD Bank · Deutsche Bank · 500+ more</p>
          <button className="btn-primary" style={{ padding: '12px 32px', cursor: 'pointer', fontSize: '1rem' }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
            Choose Bank Statement
          </button>
          <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>🔒 Your financial data never leaves your browser — zero server upload, verified</p>
          <input ref={fileRef} type="file" accept=".pdf,.csv,.txt" multiple style={{ display: 'none' }} onChange={handleFileInput} />
        </div>
      )}

      {/* ── Processing ─────────────────────────────────── */}
      {status === 'processing' && (
        <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid var(--highlight)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ilt-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{progressMsg}</div>
          <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={S.progressBar(progress)} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{progress}% — processing locally, nothing uploaded</div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────── */}
      {status === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
          <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>{progressMsg}</div>
          <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: 12 }}>
            This tool works best with <strong>text-based PDFs</strong> (downloaded from online banking). Scanned paper statements may have reduced accuracy.
          </p>
          <button onClick={() => { setStatus('idle'); setFiles([]); }} className="btn-primary" style={{ padding: '9px 20px', cursor: 'pointer' }}>Try Another File</button>
        </div>
      )}

      {/* ── Results ────────────────────────────────────── */}
      {status === 'done' && transactions.length > 0 && (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'Total Spent', value: fmt(stats.totalSpent, currency), color: '#ef4444', icon: '📤' },
              { label: 'Total Income', value: fmt(stats.totalIncome, currency), color: '#22c55e', icon: '📥' },
              { label: 'Net Flow', value: (stats.netFlow >= 0 ? '+' : '-') + fmt(Math.abs(stats.netFlow), currency), color: stats.netFlow >= 0 ? '#22c55e' : '#ef4444', icon: '📊' },
              { label: 'Transactions', value: stats.txCount, color: 'var(--highlight)', icon: '📋' },
              { label: 'Subscriptions', value: stats.subscriptions.length + ' detected', color: '#f59e0b', icon: '🔄' },
            ].map(s => (
              <div key={s.label} style={S.statCard(s.color)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Currency + export bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Currency:</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...S.input, padding: '6px 8px' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={exportExcel} style={S.exportBtn('#16a34a')}>📊 Excel</button>
              <button onClick={exportCSV} style={S.exportBtn('#0891b2')}>📃 CSV</button>
              <button onClick={exportJSON} style={S.exportBtn('#7c3aed')}>{ '{ }'} JSON</button>
              <button onClick={() => { setStatus('idle'); setFiles([]); setTransactions([]); }}
                style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
                🔄 New File
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 14 }}>
            {[['transactions', '📋 Transactions'], ['analytics', '📊 Analytics'], ['subscriptions', `🔄 Subscriptions (${stats.subscriptions.length})`]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={S.tabBtn(activeTab === id)}>{label}</button>
            ))}
          </div>

          {/* ── Tab: Transactions ───────────────────────── */}
          {activeTab === 'transactions' && (
            <div style={S.card}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search transactions..."
                  style={{ ...S.input, flex: 1, minWidth: 160 }} />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...S.input, minWidth: 140 }}>
                  {allCategories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...S.input, minWidth: 130 }}>
                  <option value="date">Sort: Date</option>
                  <option value="amount_desc">Sort: Largest first</option>
                  <option value="amount_asc">Sort: Smallest first</option>
                </select>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{filteredTx.length} of {transactions.length}</span>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Date', 'Description', 'Category', 'Amount', 'Balance', 'Edit'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.slice(0, 200).map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{tx.date}</td>
                        <td style={{ padding: '8px 12px', maxWidth: 280 }}>
                          {editingId === tx.id
                            ? <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={S.editInput} onBlur={() => saveEdit(tx.id)} autoFocus />
                            : <span style={{ color: 'var(--text-primary)' }}>{tx.description}</span>}
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: tx.category.color + '20', color: tx.category.color, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>
                            {tx.category.icon} {tx.category.cat}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontWeight: 700, color: tx.amount < 0 ? '#ef4444' : '#22c55e', textAlign: 'right' }}>
                          {editingId === tx.id
                            ? <input value={editAmt} onChange={e => setEditAmt(e.target.value)} style={{ ...S.editInput, width: 80, textAlign: 'right' }} />
                            : `${tx.amount < 0 ? '-' : '+'}${currency}${fmt(Math.abs(tx.amount))}`}
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--text-tertiary)', textAlign: 'right', fontSize: '0.75rem' }}>
                          {tx.balance != null ? `${currency}${fmt(tx.balance)}` : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <button onClick={() => editingId === tx.id ? saveEdit(tx.id) : startEdit(tx)}
                            style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-light)', background: editingId === tx.id ? '#16a34a' : 'var(--bg-secondary)', color: editingId === tx.id ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.72rem' }}>
                            {editingId === tx.id ? '✅' : '✏️'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTx.length > 200 && (
                  <div style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
                    Showing first 200 of {filteredTx.length} transactions — export to see all
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Analytics ──────────────────────────── */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Category breakdown */}
              <div style={S.card}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Spending by Category</div>
                {stats.catBreakdown.slice(0, 12).map(cat => {
                  const pct = stats.totalSpent > 0 ? (cat.total / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={cat.cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <span style={{ fontWeight: 600 }}>{cat.cat}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>({cat.count} txn)</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: cat.color }}>{currency}{fmt(cat.total)}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={S.progressBar(pct, cat.color)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Income vs Expense summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, color: '#ef4444' }}>📤 Top Expenses</div>
                  {filteredTx.filter(t => t.amount < 0).slice(0, 8).map(tx => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{tx.description}</span>
                      <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>{currency}{fmt(Math.abs(tx.amount))}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, color: '#22c55e' }}>📥 Top Credits</div>
                  {filteredTx.filter(t => t.amount > 0).slice(0, 8).map(tx => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{tx.description}</span>
                      <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>+{currency}{fmt(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Subscriptions ──────────────────────── */}
          {activeTab === 'subscriptions' && (
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>🔄 Recurring Charges Detected</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                These transactions appear multiple times with similar amounts — likely subscriptions or recurring bills.
              </p>
              {stats.subscriptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  No recurring charges detected in this statement period.
                </div>
              ) : (
                stats.subscriptions.map((sub, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 28 }}>🔄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sub.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Charged {sub.count}× · {sub.isConsistent ? '✅ Consistent amount' : '⚠️ Varying amount'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>{currency}{fmt(sub.avgAmount)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>avg / charge</div>
                    </div>
                  </div>
                ))
              )}
              {stats.subscriptions.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: 12, marginTop: 12, fontSize: '0.82rem', color: '#92400e' }}>
                  💡 Total recurring charges: <strong>{currency}{fmt(stats.subscriptions.reduce((s, sub) => s + sub.avgAmount, 0))}/month</strong>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── How It Works ──────────────────────────────── */}
      {status === 'idle' && (
        <>
          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 16 }}>How to Convert Your Bank Statement to Excel in 3 Steps</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
              {[
                { step: '1', icon: '📑', title: 'Download from your bank', desc: 'Log in to your bank\'s website or app. Download your statement as a PDF file (not a screenshot).' },
                { step: '2', icon: '⬆️', title: 'Upload here', desc: 'Drop the PDF on this page. Everything processes locally — your financial data never leaves your device.' },
                { step: '3', icon: '📊', title: 'Download Excel/CSV', desc: 'Review transactions, check spending categories, detect subscriptions, then export to Excel or CSV.' },
              ].map(s => (
                <div key={s.step} style={{ textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--highlight)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '0.9rem' }}>{s.step}</div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported banks */}
          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14 }}>Works with 500+ Banks Worldwide</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
              {[
                '🇺🇸 Chase','🇺🇸 Bank of America','🇺🇸 Wells Fargo','🇺🇸 Citi','🇺🇸 Capital One',
                '🇬🇧 Barclays','🇬🇧 HSBC','🇬🇧 Lloyds','🇬🇧 NatWest','🇬🇧 Monzo',
                '🇮🇳 SBI','🇮🇳 HDFC','🇮🇳 ICICI','🇮🇳 Axis Bank','🇮🇳 Kotak',
                '🇩🇪 Deutsche Bank','🇩🇪 Sparkasse','🇩🇪 Commerzbank','🇨🇦 TD Bank','🇨🇦 RBC',
                '🇦🇺 ANZ','🇦🇺 CommBank','🇸🇬 DBS','🇦🇪 Emirates NBD','🇿🇦 Standard Bank',
              ].map(b => (
                <div key={b} style={{ padding: '6px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>{b}</div>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 10 }}>
              No template matching required — column detection works from page layout for any bank format not listed above.
            </p>
          </div>

          {/* Privacy note */}
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6, fontSize: '0.9rem' }}>🔒 100% Private — Verified</div>
            <p style={{ fontSize: '0.82rem', color: '#166534', lineHeight: 1.6 }}>
              To verify: open this page, disconnect your internet, then drop your PDF — it still converts. That proves everything runs in your browser. No server receives your bank data, ever. Unlike Plaid, Perfios, or other tools that require bank credentials or upload your statements to their servers.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
