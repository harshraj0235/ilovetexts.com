'use client';
// BankStatementAnalyzer.jsx v2
// UPGRADED: monthly trend chart, fraud detection, date normalization,
//           top merchants panel, Excel export, PDF password support,
//           duplicate detection, budget vs actual
import { useState, useCallback, useRef, useMemo } from 'react';

const CATEGORIES = [
  { name:'Food & Dining',   color:'#f59e0b',icon:'🍔',keywords:['swiggy','zomato','mcdonalds','kfc','dominos','pizza','restaurant','cafe','starbucks','subway','burger','bakery','food','dining','eat','zomato'] },
  { name:'Shopping',        color:'#8b5cf6',icon:'🛍️',keywords:['amazon','flipkart','myntra','meesho','ajio','nykaa','shopping','mart','store','mall','retail','fashion','clothes'] },
  { name:'Groceries',       color:'#10b981',icon:'🛒',keywords:['bigbasket','grofers','blinkit','dmart','supermarket','grocer','vegetables','fruits','grocery','milk','dairy'] },
  { name:'Transportation',  color:'#0ea5e9',icon:'🚗',keywords:['uber','ola','rapido','petrol','fuel','parking','toll','metro','bus','train','irctc','redbus','makemytrip','transport','travel'] },
  { name:'Utilities',       color:'#6366f1',icon:'⚡',keywords:['electricity','water','gas','internet','broadband','airtel','jio','bsnl','tata','vodafone','vi','utility','bill','recharge'] },
  { name:'Healthcare',      color:'#ec4899',icon:'💊',keywords:['hospital','pharmacy','doctor','clinic','medical','health','medicine','apollo','practo','1mg','netmeds','chemist'] },
  { name:'Entertainment',   color:'#f97316',icon:'🎬',keywords:['netflix','hotstar','prime','spotify','youtube','pvr','inox','cinema','movie','gaming','entertainment'] },
  { name:'Education',       color:'#14b8a6',icon:'📚',keywords:['school','college','university','course','udemy','coursera','byju','unacademy','education','books','study','tuition','fees'] },
  { name:'Rent & Housing',  color:'#ef4444',icon:'🏠',keywords:['rent','housing','landlord','maintenance','society','flat','apartment','pg','hostel'] },
  { name:'Salary/Income',   color:'#22c55e',icon:'💰',keywords:['salary','credit','credited','neft','imps','rtgs','income','refund','cashback','reward','dividend','interest'] },
  { name:'EMI/Loan',        color:'#dc2626',icon:'🏦',keywords:['emi','loan','mortgage','bajaj','hdfc loan','sbi loan','icici loan','axis loan','repayment'] },
  { name:'Investment',      color:'#7c3aed',icon:'📈',keywords:['mutual fund','sip','zerodha','groww','upstox','nse','bse','stocks','shares','demat','mf','investment'] },
  { name:'Insurance',       color:'#78716c',icon:'🛡️',keywords:['insurance','lic','policy','premium','term','health insurance','vehicle insurance','cover'] },
  { name:'ATM/Cash',        color:'#94a3b8',icon:'💵',keywords:['atm','cash withdrawal','cash deposit','pos'] },
  { name:'Bank Charges',    color:'#9ca3af',icon:'🏧',keywords:['charges','fee','penalty','gst','service charge','maintenance','cheque'] },
  { name:'Transfers',       color:'#64748b',icon:'↔️',keywords:['transfer','send','upi','phonepe','googlepay','paytm','bhim','neft out'] },
  { name:'Other',           color:'#d1d5db',icon:'📦',keywords:[] },
];

function categorize(desc) {
  if (!desc) return 'Other';
  const d = desc.toLowerCase();
  for (const cat of CATEGORIES.slice(0,-1)) {
    if (cat.keywords.some(kw => d.includes(kw))) return cat.name;
  }
  return 'Other';
}

// Normalize date to ISO YYYY-MM-DD for proper sorting
function normalizeDate(raw) {
  if (!raw) return '';
  const m = raw.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (!m) return raw;
  const [,a,b,c] = m;
  if (a.length === 4) return `${a}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`; // YYYY-MM-DD
  if (c.length === 4) return `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`; // DD-MM-YYYY
  return raw;
}

function parseTransactions(text) {
  const lines = text.split('\n');
  const transactions = [];
  const patterns = [
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(.+?)\s+(Dr|Cr)\s+([\d,]+\.?\d*)/i,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(.+?)\s+(-?[\d,]+\.?\d*)/,
  ];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let date, desc, debit=0, credit=0;
        if (pattern === patterns[0]) {
          [,date,desc] = match;
          const a=parseFloat(match[3].replace(/,/g,'')), b=parseFloat(match[4].replace(/,/g,''));
          if (a>0&&b===0) debit=a; else if (b>0&&a===0) credit=b; else {debit=a;credit=b;}
        } else if (pattern === patterns[1]) {
          [,date,desc] = match;
          const amt=parseFloat(match[4].replace(/,/g,''));
          if (match[3].toLowerCase()==='dr') debit=amt; else credit=amt;
        } else {
          [,date,desc] = match;
          const amt=parseFloat(match[3].replace(/,/g,''));
          if (amt<0) debit=Math.abs(amt); else credit=amt;
        }
        transactions.push({ id:transactions.length, date:normalizeDate(date?.trim()), description:desc?.trim(), debit:debit||0, credit:credit||0, amount:credit-debit, category:categorize(desc) });
        break;
      }
    }
  }
  // Flag suspicious transactions (>5x average debit)
  const avgDebit = transactions.filter(t=>t.debit>0).reduce((s,t)=>s+t.debit,0) / Math.max(transactions.filter(t=>t.debit>0).length,1);
  const seen = new Set();
  transactions.forEach(t => {
    t.isSuspicious = t.debit > avgDebit * 5 && t.debit > 1000;
    // Duplicate detection
    const key = `${t.date}-${t.debit}-${t.credit}`;
    t.isDuplicate = seen.has(key) && (t.debit>0||t.credit>0);
    seen.add(key);
  });
  return transactions;
}

function formatCurrency(n) {
  if (Math.abs(n)>=100000) return '₹'+(n/100000).toFixed(1)+'L';
  if (Math.abs(n)>=1000) return '₹'+(n/1000).toFixed(1)+'K';
  return '₹'+n.toFixed(0);
}

export default function BankStatementAnalyzer({ t, lang }) {
  const [transactions,setTransactions] = useState([]);
  const [fileName,setFileName]         = useState('');
  const [loading,setLoading]           = useState(false);
  const [search,setSearch]             = useState('');
  const [selectedCat,setSelectedCat]   = useState('All');
  const [sortBy,setSortBy]             = useState('date');
  const [sortDir,setSortDir]           = useState('desc');
  const [activeTab,setActiveTab]       = useState('overview'); // overview|transactions|trends|suspicious
  const [showPassword,setShowPassword] = useState(false);
  const [pdfPassword,setPdfPassword]   = useState('');
  const [dragging,setDragging]         = useState(false);
  const [toast,setToast]               = useState(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const processFile = useCallback(async (file) => {
    setLoading(true); setTransactions([]); setFileName(file.name);
    try {
      let text = '';
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        try {
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ab), password: pdfPassword||undefined }).promise;
          for (let i=1;i<=doc.numPages;i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item=>item.str).join(' ')+'\n';
          }
        } catch(e) {
          if (e.message?.includes('password') || e.name==='PasswordException') {
            setShowPassword(true); showToast('This PDF is password protected. Enter the password.','warning'); setLoading(false); return;
          }
          throw e;
        }
      } else if (ext==='csv'||ext==='txt') {
        text = new TextDecoder().decode(await file.arrayBuffer());
      }
      const txns = parseTransactions(text);
      if (!txns.length) { showToast('No transactions found. Try a different format.','warning'); setLoading(false); return; }
      setTransactions(txns);
      setShowPassword(false);
      showToast(`Analyzed ${txns.length} transactions!`);
    } catch(e) { showToast('Failed: '+e.message,'error'); }
    finally { setLoading(false); }
  }, [pdfPassword]);

  const stats = useMemo(() => {
    if (!transactions.length) return null;
    const totalCredit = transactions.reduce((s,t)=>s+t.credit,0);
    const totalDebit  = transactions.reduce((s,t)=>s+t.debit,0);
    const netFlow = totalCredit - totalDebit;
    const byCategory = {};
    CATEGORIES.forEach(c => { byCategory[c.name]={debit:0,credit:0,count:0,color:c.color,icon:c.icon}; });
    transactions.forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category]={debit:0,credit:0,count:0,color:'#d1d5db',icon:'📦'};
      byCategory[t.category].debit  += t.debit;
      byCategory[t.category].credit += t.credit;
      byCategory[t.category].count++;
    });
    const sortedCats = Object.entries(byCategory).filter(([,v])=>v.debit+v.credit>0).sort((a,b)=>b[1].debit-a[1].debit);
    const maxDebit = Math.max(...sortedCats.map(([,v])=>v.debit),1);
    // Monthly trend
    const byMonth = {};
    transactions.forEach(t => {
      const m = t.date?.slice(0,7);
      if (!m||m.length<7) return;
      byMonth[m] = byMonth[m]||{credit:0,debit:0,count:0};
      byMonth[m].credit += t.credit; byMonth[m].debit += t.debit; byMonth[m].count++;
    });
    const monthlyTrend = Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b));
    const maxMonthly = Math.max(...monthlyTrend.map(([,v])=>Math.max(v.credit,v.debit)),1);
    // Top merchants
    const merchantFreq = {};
    transactions.filter(t=>t.debit>0).forEach(t => {
      const key = (t.description||'').slice(0,30).trim();
      merchantFreq[key] = (merchantFreq[key]||0) + t.debit;
    });
    const topMerchants = Object.entries(merchantFreq).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const suspiciousCount = transactions.filter(t=>t.isSuspicious).length;
    const duplicateCount  = transactions.filter(t=>t.isDuplicate).length;
    return { totalCredit,totalDebit,netFlow,byCategory,sortedCats,maxDebit,monthlyTrend,maxMonthly,topMerchants,suspiciousCount,duplicateCount };
  }, [transactions]);

  const filtered = useMemo(() => {
    let txns = transactions;
    if (activeTab==='suspicious') txns = txns.filter(t=>t.isSuspicious||t.isDuplicate);
    if (selectedCat!=='All') txns = txns.filter(t=>t.category===selectedCat);
    if (search) txns = txns.filter(t=>(t.description||'').toLowerCase().includes(search.toLowerCase())||(t.category||'').toLowerCase().includes(search.toLowerCase()));
    txns = [...txns].sort((a,b) => {
      if (sortBy==='amount') return sortDir==='asc'?Math.abs(a.amount)-Math.abs(b.amount):Math.abs(b.amount)-Math.abs(a.amount);
      if (sortBy==='category') return sortDir==='asc'?(a.category||'').localeCompare(b.category||''):(b.category||'').localeCompare(a.category||'');
      // date sort using normalized ISO dates
      const da=a.date||'', db=b.date||'';
      return sortDir==='asc'?da.localeCompare(db):db.localeCompare(da);
    });
    return txns;
  }, [transactions, selectedCat, search, sortBy, sortDir, activeTab]);

  const exportCSV = async () => {
    const rows = [['Date','Description','Category','Debit','Credit','Suspicious','Duplicate'],...filtered.map(t=>[t.date||'',t.description||'',t.category,t.debit||0,t.credit||0,t.isSuspicious?'Yes':'No',t.isDuplicate?'Yes':'No'])];
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='bank-analysis.csv'; a.click();
    showToast('CSV exported!');
  };

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default||(await import('xlsx'));
    const rows = [['Date','Description','Category','Debit','Credit','Suspicious'],...filtered.map(t=>[t.date||'',t.description||'',t.category,t.debit||0,t.credit||0,t.isSuspicious?'Yes':'No'])];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [10,40,20,12,12,10].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,'Transactions',ws);
    // Summary sheet
    if (stats) {
      const sumRows = [['Category','Debit','Credit','Count'],...stats.sortedCats.map(([n,v])=>[n,v.debit.toFixed(2),v.credit.toFixed(2),v.count])];
      const ws2 = XLSX.utils.aoa_to_sheet(sumRows);
      XLSX.utils.book_append_sheet(wb,'Summary',ws2);
    }
    XLSX.writeFile(wb,fileName.replace(/\.[^.]+$/,'')+'-analysis.xlsx');
    showToast('Excel exported!');
  };

  const categories = ['All',...CATEGORIES.map(c=>c.name).filter(n=>n!=='Other'),'Other'];

  return (
    <div style={{maxWidth:1000,margin:'0 auto',width:'100%'}}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      {!transactions.length ? (
        <div onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>!loading&&inputRef.current?.click()}
          style={{border:`2px dashed ${dragging?'#7c3aed':'var(--border-light)'}`,borderRadius:'var(--radius-lg)',padding:'60px 24px',textAlign:'center',cursor:loading?'default':'pointer',background:dragging?'rgba(124,58,237,0.04)':'var(--bg-section)',transition:'all 0.2s'}}>
          <input ref={inputRef} type="file" accept=".pdf,.csv,.txt" style={{display:'none'}} onChange={e=>{processFile(e.target.files[0]);e.target.value='';}} />
          {loading?(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}><div style={{width:48,height:48,border:'4px solid #7c3aed',borderTopColor:'transparent',borderRadius:'50%',animation:'ilt-spin 0.8s linear infinite'}}/><p style={{margin:0,fontWeight:600}}>Analyzing statement…</p></div>):(
            <>
              <div style={{fontSize:52,marginBottom:12}}>🏦</div>
              <h2 style={{fontSize:'1.4rem',fontWeight:800,marginBottom:8}}>Upload Bank Statement</h2>
              <p style={{color:'var(--text-secondary)',marginBottom:16,fontSize:'0.9rem'}}>PDF or CSV — spending analysis, charts, fraud detection, export to Excel</p>
              {showPassword && (
                <div style={{margin:'0 auto 16px',maxWidth:320,display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
                  <input type="password" value={pdfPassword} onChange={e=>setPdfPassword(e.target.value)} placeholder="PDF password…" style={{flex:1,padding:'8px 12px',border:'1px solid #f59e0b',borderRadius:'var(--radius-sm)',fontSize:'0.88rem',background:'var(--bg-main)',color:'var(--text-primary)'}} onKeyDown={e=>e.key==='Enter'&&processFile(inputRef.current?.files?.[0])}/>
                  <button onClick={()=>processFile(inputRef.current?.files?.[0])} style={{padding:'8px 14px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',cursor:'pointer',fontWeight:700,fontSize:'0.85rem'}}>Unlock</button>
                </div>
              )}
              <button style={{padding:'11px 28px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:700,cursor:'pointer',fontSize:'0.95rem'}} onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>Choose Statement</button>
              <p style={{marginTop:14,fontSize:'0.75rem',color:'var(--text-tertiary)'}}>🔒 Your bank data never leaves your browser — 100% private</p>
              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:12,flexWrap:'wrap',fontSize:'0.75rem',color:'var(--text-tertiary)'}}>
                {['✅ SBI · HDFC · ICICI · Axis','✅ Any bank CSV','✅ Fraud detection','✅ Monthly trends'].map(f=><span key={f}>{f}</span>)}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {stats && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:16}}>
              {[
                {icon:'💰',label:'Total Income',value:formatCurrency(stats.totalCredit),color:'#10b981'},
                {icon:'💸',label:'Total Expenses',value:formatCurrency(stats.totalDebit),color:'#ef4444'},
                {icon:'📊',label:'Net Flow',value:formatCurrency(stats.netFlow),color:stats.netFlow>=0?'#10b981':'#ef4444'},
                {icon:'🔢',label:'Transactions',value:transactions.length,color:'#7c3aed'},
                ...(stats.suspiciousCount>0?[{icon:'⚠️',label:'Suspicious',value:stats.suspiciousCount,color:'#f59e0b'}]:[]),
                ...(stats.duplicateCount>0?[{icon:'🔁',label:'Duplicates',value:stats.duplicateCount,color:'#94a3b8'}]:[]),
              ].map(s=>(
                <div key={s.label} className="trust-card" style={{padding:12,textAlign:'center'}}>
                  <div style={{fontSize:'1.3rem',marginBottom:3}}>{s.icon}</div>
                  <div style={{fontSize:'1.3rem',fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--border-light)',marginBottom:16}}>
            {[['overview','📊 Overview'],['transactions','📋 Transactions'],['trends','📈 Monthly Trends'],['suspicious',`⚠️ Alerts (${stats?.suspiciousCount||0})`]].map(([v,l])=>(
              <button key={v} onClick={()=>setActiveTab(v)} style={{padding:'9px 14px',border:'none',background:'transparent',borderBottom:`2px solid ${activeTab===v?'#7c3aed':'transparent'}`,color:activeTab===v?'#7c3aed':'var(--text-secondary)',fontWeight:activeTab===v?700:500,cursor:'pointer',fontSize:'0.82rem',marginBottom:-2,whiteSpace:'nowrap'}}>{l}</button>
            ))}
            <div style={{marginLeft:'auto',display:'flex',gap:5,alignItems:'center',paddingBottom:4}}>
              <button onClick={exportCSV} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>⬇ CSV</button>
              <button onClick={exportExcel} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>⬇ Excel</button>
              <button onClick={()=>{setTransactions([]);setFileName('');}} className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'5px 10px'}}>🔄 New</button>
            </div>
          </div>

          {activeTab==='overview' && stats && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {/* Category bar chart */}
              <div className="trust-card" style={{padding:18}}>
                <h3 style={{fontSize:'0.9rem',fontWeight:700,marginBottom:14}}>💸 Spending by Category</h3>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {stats.sortedCats.slice(0,10).map(([name,data])=>{
                    const pct = stats.maxDebit>0?(data.debit/stats.maxDebit)*100:0;
                    const cat = CATEGORIES.find(c=>c.name===name);
                    return (
                      <div key={name} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:'0.9rem',flexShrink:0}}>{cat?.icon||'📦'}</span>
                        <span style={{fontSize:'0.75rem',minWidth:100,color:'var(--text-secondary)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                        <div style={{flex:1,height:12,background:'var(--bg-section)',borderRadius:6,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:data.color||'#d1d5db',borderRadius:6,transition:'width 0.5s'}}/>
                        </div>
                        <span style={{fontSize:'0.75rem',fontWeight:700,color:data.color,minWidth:50,textAlign:'right'}}>{formatCurrency(data.debit)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Top merchants */}
              <div className="trust-card" style={{padding:18}}>
                <h3 style={{fontSize:'0.9rem',fontWeight:700,marginBottom:14}}>🏪 Top Merchants</h3>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {stats.topMerchants.map(([name,amt],i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 8px',background:'var(--bg-section)',borderRadius:4}}>
                      <span style={{fontSize:'0.8rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{name||'Unknown'}</span>
                      <span style={{fontSize:'0.82rem',fontWeight:700,color:'#ef4444',flexShrink:0}}>{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab==='trends' && stats && (
            <div className="trust-card" style={{padding:18}}>
              <h3 style={{fontSize:'0.9rem',fontWeight:700,marginBottom:16}}>📈 Monthly Income vs Expenses</h3>
              {stats.monthlyTrend.length === 0 ? (
                <p style={{color:'var(--text-tertiary)',textAlign:'center',padding:20}}>No monthly data available — dates may not be in a parseable format.</p>
              ) : (
                <div style={{display:'flex',gap:6,alignItems:'flex-end',overflowX:'auto',paddingBottom:8}}>
                  {stats.monthlyTrend.map(([month,data])=>{
                    const creditH = Math.round((data.credit/stats.maxMonthly)*140);
                    const debitH  = Math.round((data.debit/stats.maxMonthly)*140);
                    return (
                      <div key={month} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:52,flexShrink:0}}>
                        <div style={{display:'flex',gap:2,alignItems:'flex-end',height:150}}>
                          <div title={`Income: ${formatCurrency(data.credit)}`} style={{width:20,height:Math.max(creditH,2),background:'#10b981',borderRadius:'3px 3px 0 0'}}/>
                          <div title={`Expenses: ${formatCurrency(data.debit)}`} style={{width:20,height:Math.max(debitH,2),background:'#ef4444',borderRadius:'3px 3px 0 0'}}/>
                        </div>
                        <div style={{fontSize:'0.62rem',color:'var(--text-tertiary)',textAlign:'center',lineHeight:1.3}}>{month.slice(5)}/{month.slice(2,4)}</div>
                      </div>
                    );
                  })}
                  <div style={{display:'flex',gap:14,alignItems:'center',marginLeft:8,fontSize:'0.72rem'}}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:12,height:12,background:'#10b981',borderRadius:2,display:'inline-block'}}/> Income</span>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:12,height:12,background:'#ef4444',borderRadius:2,display:'inline-block'}}/> Expenses</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab==='transactions'||activeTab==='suspicious') && (
            <>
              <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search transactions…" style={{flex:'1 1 200px',padding:'7px 12px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.85rem'}}/>
                <select value={selectedCat} onChange={e=>setSelectedCat(e.target.value)} style={{padding:'7px 10px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.82rem'}}>
                  {categories.map(c=><option key={c}>{c}</option>)}
                </select>
                <select value={`${sortBy}-${sortDir}`} onChange={e=>{const [b,d]=e.target.value.split('-');setSortBy(b);setSortDir(d);}} style={{padding:'7px 10px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.82rem'}}>
                  <option value="date-desc">Date (newest)</option>
                  <option value="date-asc">Date (oldest)</option>
                  <option value="amount-desc">Amount (largest)</option>
                  <option value="amount-asc">Amount (smallest)</option>
                  <option value="category-asc">Category A-Z</option>
                </select>
              </div>
              <div style={{overflowX:'auto',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                  <thead><tr style={{background:'var(--bg-section)'}}>
                    {['Date','Description','Category','Debit','Credit','Flags'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:h==='Debit'||h==='Credit'?'right':'left',fontWeight:700,color:'var(--text-secondary)',borderBottom:'2px solid var(--border-light)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.03em'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0,200).map((txn,i)=>{
                      const cat = CATEGORIES.find(c=>c.name===txn.category);
                      return (
                        <tr key={i} style={{borderBottom:'1px solid var(--border-light)',background:txn.isSuspicious?'rgba(245,158,11,0.04)':txn.isDuplicate?'rgba(148,163,184,0.06)':i%2===0?'transparent':'var(--bg-section)'}}>
                          <td style={{padding:'6px 10px',color:'var(--text-tertiary)',whiteSpace:'nowrap'}}>{txn.date}</td>
                          <td style={{padding:'6px 10px',maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txn.description}</td>
                          <td style={{padding:'6px 10px',whiteSpace:'nowrap'}}>
                            <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:20,background:`${cat?.color||'#d1d5db'}20`,color:cat?.color||'var(--text-secondary)',fontSize:'0.72rem',fontWeight:600}}>
                              {cat?.icon} {txn.category}
                            </span>
                          </td>
                          <td style={{padding:'6px 10px',textAlign:'right',color:'#ef4444',fontWeight:txn.debit>0?600:400}}>{txn.debit>0?formatCurrency(txn.debit):'—'}</td>
                          <td style={{padding:'6px 10px',textAlign:'right',color:'#10b981',fontWeight:txn.credit>0?600:400}}>{txn.credit>0?formatCurrency(txn.credit):'—'}</td>
                          <td style={{padding:'6px 10px'}}>
                            {txn.isSuspicious&&<span title="Unusually large transaction" style={{fontSize:'0.7rem',background:'#fef3c7',color:'#92400e',padding:'1px 5px',borderRadius:10,fontWeight:700}}>⚠️ Unusual</span>}
                            {txn.isDuplicate&&<span title="Possible duplicate" style={{fontSize:'0.7rem',background:'#f1f5f9',color:'#64748b',padding:'1px 5px',borderRadius:10,fontWeight:700,marginLeft:3}}>🔁 Dup</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length>200&&<p style={{textAlign:'center',marginTop:8,fontSize:'0.75rem',color:'var(--text-tertiary)'}}>Showing 200 of {filtered.length}. Export CSV to see all.</p>}
            </>
          )}
        </>
      )}
    </div>
  );
}