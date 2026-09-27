'use client';
// GstInvoiceGenerator.jsx — GST-compliant tax invoice generator
// Targets: "GST invoice generator free" 180K/mo
// Features: CGST/SGST/IGST, HSN codes, amount in words, PDF print
import { useState, useRef, useCallback } from 'react';

const GST_RATES = [0, 5, 12, 18, 28];
const INVOICE_TYPES = ['Tax Invoice','Proforma Invoice','Delivery Challan','Credit Note','Debit Note'];
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry','Andaman & Nicobar'];

const ONES=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function n2w(n){n=Math.floor(n);if(!n)return 'Zero';const p=[];if(n>=10000000){p.push(n2w(Math.floor(n/10000000))+' Crore');n%=10000000;}if(n>=100000){p.push(n2w(Math.floor(n/100000))+' Lakh');n%=100000;}if(n>=1000){p.push(n2w(Math.floor(n/1000))+' Thousand');n%=1000;}if(n>=100){p.push(ONES[Math.floor(n/100)]+' Hundred');n%=100;}if(n>=20){p.push(TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:''));}else if(n>0){p.push(ONES[n]);}return p.join(' ');}

const emptyItem = () => ({ desc:'', hsn:'', qty:1, unit:'Nos', rate:0, gstRate:18, discount:0 });

export default function GstInvoiceGenerator({ t, lang }) {
  const printRef = useRef(null);

  const [invoiceType, setInvoiceType] = useState('Tax Invoice');
  const [seller, setSeller] = useState({ name:'', gstin:'', address:'', city:'', state:'Maharashtra', pin:'', phone:'', email:'' });
  const [buyer, setBuyer]   = useState({ name:'', gstin:'', address:'', city:'', state:'Maharashtra', pin:'', phone:'', email:'' });
  const [invoice, setInvoice] = useState({ number:'', date: new Date().toISOString().split('T')[0], dueDate:'', poNumber:'', placeOfSupply:'' });
  const [items, setItems]   = useState([emptyItem()]);
  const [bank, setBank]     = useState({ name:'', account:'', ifsc:'', branch:'' });
  const [notes, setNotes]   = useState('');
  const [terms, setTerms]   = useState('Payment due within 30 days. Subject to jurisdiction of local courts.');
  const [template, setTemplate] = useState('modern'); // modern | classic
  const [toast, setToast]   = useState(null);

  const showToast=(m,t='success')=>{setToast({m,t});setTimeout(()=>setToast(null),2500);};

  const isIGST = seller.state !== buyer.state;

  const addItem = () => setItems(p=>[...p, emptyItem()]);
  const removeItem = (i) => setItems(p=>p.filter((_,idx)=>idx!==i));
  const updateItem = (i, key, val) => setItems(p=>p.map((item,idx)=>idx===i?{...item,[key]:val}:item));

  const calcItem = (item) => {
    const taxable = ((parseFloat(item.qty)||0) * (parseFloat(item.rate)||0)) * (1 - (parseFloat(item.discount)||0)/100);
    const gst = taxable * (parseFloat(item.gstRate)||0) / 100;
    return { taxable, gst, total: taxable + gst };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    return { taxable: acc.taxable+c.taxable, gst: acc.gst+c.gst, total: acc.total+c.total };
  }, { taxable:0, gst:0, total:0 });

  const roundOff = Math.round(totals.total) - totals.total;
  const grandTotal = totals.total + roundOff;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) { showToast('Fill at least company name and one item','warning'); return; }
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>GST Invoice - ${invoice.number||'Draft'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#111;background:#fff;padding:20px}
.inv{max-width:820px;margin:0 auto;border:1px solid #333}
.inv-header{background:#1a1a2e;color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
.inv-title{font-size:18px;font-weight:bold}
.inv-type{background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:3px;font-size:12px}
.parties{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #ddd}
.party{padding:12px 14px}
.party-title{font-weight:bold;font-size:11px;text-transform:uppercase;color:#666;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:6px}
.party-name{font-size:13px;font-weight:bold;color:#1a1a2e}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #ddd}
.meta-cell{padding:8px 14px;font-size:11px}
.meta-label{color:#666;font-weight:bold}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f0f4ff;padding:6px 8px;text-align:left;border:1px solid #ddd;font-weight:bold}
td{padding:5px 8px;border:1px solid #eee}
tr:nth-child(even) td{background:#fafafa}
.total-row td{background:#f0f4ff!important;font-weight:bold}
.grand-total td{background:#1a1a2e!important;color:white!important;font-weight:bold;font-size:13px}
.footer-section{padding:12px 14px;border-top:1px solid #ddd;font-size:11px}
.amount-words{background:#fff8e1;padding:8px 12px;border:1px solid #ffc107;margin:8px 0;font-size:11px}
.bank-details{background:#f5f5f5;padding:8px 12px;margin-top:8px}
.sig-section{display:flex;justify-content:space-between;padding:12px 14px;border-top:1px solid #ddd}
.sig-box{text-align:center;width:160px}
.sig-line{border-top:1px solid #333;padding-top:4px;margin-top:28px;font-size:11px}
@media print{body{padding:5px}}
</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),500);
    showToast('Print dialog opened!');
  };

  const c=(n)=>'₹'+parseFloat(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', width:'100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      <div style={{ textAlign:'center', marginBottom:22 }}>
        <div style={{ fontSize:'3rem', marginBottom:8 }}>🧾</div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, margin:'0 0 6px' }}>GST Invoice Generator</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Create GST-compliant tax invoices with CGST/SGST/IGST auto-split · No signup · No watermark · Free PDF download</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* LEFT: Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Invoice type + number */}
          <div className="trust-card" style={{ padding:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Invoice Type</label>
                <select value={invoiceType} onChange={e=>setInvoiceType(e.target.value)} style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem' }}>
                  {INVOICE_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Invoice Number *</label>
                <input value={invoice.number} onChange={e=>setInvoice(p=>({...p,number:e.target.value}))} placeholder="INV-2026-001"
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Invoice Date *</label>
                <input type="date" value={invoice.date} onChange={e=>setInvoice(p=>({...p,date:e.target.value}))}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
            </div>
          </div>

          {/* Seller + Buyer */}
          {[['🏢 Seller / From',seller,setSeller,'seller'],['🛒 Buyer / Bill To',buyer,setBuyer,'buyer']].map(([title,party,setParty])=>(
            <div key={title} className="trust-card" style={{ padding:14 }}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:10, color:'#dc2626' }}>{title}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[['Business Name *','name','text'],['GSTIN *','gstin','text'],['Address *','address','text'],['City','city','text'],['State','state','select'],['PIN Code','pin','text'],['Phone','phone','tel'],['Email','email','email']].map(([l,k,tp])=>(
                  <div key={k} style={{ gridColumn: k==='address'||k==='name'?'span 2':'span 1' }}>
                    <label style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>{l}</label>
                    {tp==='select'?(
                      <select value={party[k]} onChange={e=>setParty(p=>({...p,[k]:e.target.value}))} style={{ width:'100%', padding:'6px 6px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.8rem' }}>
                        {STATES.map(s=><option key={s}>{s}</option>)}
                      </select>
                    ):(
                      <input type={tp} value={party[k]} onChange={e=>setParty(p=>({...p,[k]:e.target.value}))} placeholder={l.replace(' *','')}
                        style={{ width:'100%', padding:'6px 6px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.8rem', boxSizing:'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Items */}
          <div className="trust-card" style={{ padding:14 }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:10, color:'#dc2626' }}>📦 Items / Services</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.75rem', minWidth:580 }}>
                <thead>
                  <tr style={{ background:'var(--bg-section)' }}>
                    {['Description','HSN/SAC','Qty','Unit','Rate','Disc%','GST%','Amount'].map(h=>(
                      <th key={h} style={{ padding:'5px 6px', border:'1px solid var(--border-light)', fontWeight:700, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ padding:'5px 6px', border:'1px solid var(--border-light)', width:24 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item,i)=>{
                    const {taxable, gst, total} = calcItem(item);
                    return (
                      <tr key={i}>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <input value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)} placeholder="Item description"
                            style={{ width:'100%', border:'none', background:'transparent', fontSize:'0.78rem', color:'var(--text-primary)', outline:'none' }} />
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <input value={item.hsn} onChange={e=>updateItem(i,'hsn',e.target.value)} placeholder="HSN" style={{ width:60, border:'none', background:'transparent', fontSize:'0.78rem', outline:'none' }} />
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <input type="number" value={item.qty} onChange={e=>updateItem(i,'qty',e.target.value)} min={0} style={{ width:48, border:'none', background:'transparent', fontSize:'0.78rem', outline:'none' }} />
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <select value={item.unit} onChange={e=>updateItem(i,'unit',e.target.value)} style={{ border:'none', background:'transparent', fontSize:'0.75rem', width:50 }}>
                            {['Nos','Kg','Ltr','Mtr','Box','Pcs','Hrs','Days','Months'].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <input type="number" value={item.rate} onChange={e=>updateItem(i,'rate',e.target.value)} min={0} style={{ width:70, border:'none', background:'transparent', fontSize:'0.78rem', outline:'none' }} />
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <input type="number" value={item.discount} onChange={e=>updateItem(i,'discount',e.target.value)} min={0} max={100} style={{ width:44, border:'none', background:'transparent', fontSize:'0.78rem', outline:'none' }} />
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)' }}>
                          <select value={item.gstRate} onChange={e=>updateItem(i,'gstRate',+e.target.value)} style={{ border:'none', background:'transparent', fontSize:'0.75rem', width:46 }}>
                            {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)', fontWeight:700, textAlign:'right', color:'#10b981' }}>
                          {total.toFixed(2)}
                        </td>
                        <td style={{ padding:'3px 4px', border:'1px solid var(--border-light)', textAlign:'center' }}>
                          {items.length>1&&<button onClick={()=>removeItem(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'0.85rem' }}>✕</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={addItem} style={{ marginTop:8, padding:'6px 14px', border:'2px dashed var(--border-light)', borderRadius:'var(--radius-sm)', background:'transparent', cursor:'pointer', color:'var(--text-secondary)', fontWeight:600, fontSize:'0.8rem' }}>+ Add Item</button>

            {/* Totals */}
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
              {[['Taxable Amount',totals.taxable],
                ...(isIGST?[['IGST',totals.gst]]:items.reduce((acc,it)=>{const g=calcItem(it).gst/2; return g>0?[...acc]:acc;},[]).length>=0?[['CGST',totals.gst/2],['SGST',totals.gst/2]]:[]),
                ['Round Off',roundOff],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', gap:20, fontSize:'0.82rem' }}>
                  <span style={{ color:'var(--text-secondary)' }}>{l}:</span>
                  <span style={{ fontWeight:700, minWidth:90, textAlign:'right' }}>{c(v)}</span>
                </div>
              ))}
              <div style={{ padding:'8px 12px', background:'#1a1a2e', color:'white', borderRadius:'var(--radius-sm)', display:'flex', gap:20 }}>
                <span style={{ fontWeight:700 }}>Grand Total:</span>
                <span style={{ fontWeight:900, fontSize:'1.1rem' }}>{c(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank + Notes */}
          <div className="trust-card" style={{ padding:14 }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:10, color:'#dc2626' }}>🏦 Bank Details & Notes</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              {[['Bank Name','name'],['Account No.','account'],['IFSC Code','ifsc'],['Branch','branch']].map(([l,k])=>(
                <div key={k}>
                  <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>{l}</label>
                  <input value={bank[k]} onChange={e=>setBank(p=>({...p,[k]:e.target.value}))} placeholder={l}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for buyer..." rows={2}
              style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:6 }} />
            <textarea value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Terms & Conditions..." rows={2}
              style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>

          <button onClick={handlePrint}
            style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'1rem', cursor:'pointer', boxShadow:'0 4px 16px rgba(220,38,38,0.35)' }}>
            🖨️ Print / Save PDF Invoice
          </button>
        </div>

        {/* RIGHT: Invoice Preview */}
        <div>
          <div style={{ position:'sticky', top:80 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:8 }}>📄 Live Invoice Preview</div>
            <div ref={printRef}>
              <div className="inv" style={{ fontFamily:'Arial,sans-serif', fontSize:'11px', border:'1px solid #333', borderRadius:4, overflow:'hidden', background:'#fff', color:'#111' }}>
                {/* Header */}
                <div style={{ background:'#1a1a2e', color:'white', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:'bold' }}>{seller.name||'Your Company Name'}</div>
                    <div style={{ fontSize:'10px', opacity:0.8 }}>GSTIN: {seller.gstin||'29AAAAA0000A1Z5'}</div>
                    <div style={{ fontSize:'10px', opacity:0.8 }}>{seller.address}{seller.city?', '+seller.city:''}, {seller.state} - {seller.pin}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:3, fontSize:'12px', fontWeight:'bold', marginBottom:4 }}>{invoiceType.toUpperCase()}</div>
                    <div style={{ fontSize:'11px', opacity:0.9 }}>No: {invoice.number||'INV-001'}</div>
                    <div style={{ fontSize:'11px', opacity:0.9 }}>Date: {invoice.date?new Date(invoice.date).toLocaleDateString('en-IN'):'-'}</div>
                  </div>
                </div>

                {/* Parties */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #ddd' }}>
                  {[['Bill To',buyer],['Ship To',buyer]].map(([title,p],pi)=>(
                    <div key={pi} style={{ padding:'8px 12px', borderLeft: pi>0?'1px solid #ddd':'none' }}>
                      <div style={{ fontWeight:'bold', fontSize:'10px', textTransform:'uppercase', color:'#666', borderBottom:'1px solid #eee', paddingBottom:3, marginBottom:5 }}>{title}</div>
                      <div style={{ fontWeight:'bold', color:'#1a1a2e' }}>{p.name||'Buyer Name'}</div>
                      <div style={{ fontSize:'10px', color:'#555' }}>GSTIN: {p.gstin||'-'}</div>
                      <div style={{ fontSize:'10px', color:'#555' }}>{p.address||''}{p.city?', '+p.city:''}</div>
                      <div style={{ fontSize:'10px', color:'#555' }}>{p.state} {p.pin?'- '+p.pin:''}</div>
                    </div>
                  ))}
                </div>

                {/* Items table */}
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'10px' }}>
                  <thead>
                    <tr>
                      {['#','Description','HSN/SAC','Qty','Rate','Disc','Taxable',...(isIGST?['IGST']:['CGST','SGST']),'Total'].map(h=>(
                        <th key={h} style={{ background:'#f0f4ff', padding:'4px 6px', border:'1px solid #ddd', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item,i)=>{
                      const {taxable,gst,total}=calcItem(item);
                      return (
                        <tr key={i}>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{i+1}</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.desc||'-'}</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.hsn||'-'}</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.qty} {item.unit}</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{parseFloat(item.rate||0).toFixed(2)}</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.discount}%</td>
                          <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{taxable.toFixed(2)}</td>
                          {isIGST
                            ? <td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.gstRate}% ({gst.toFixed(2)})</td>
                            : <><td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.gstRate/2}% ({(gst/2).toFixed(2)})</td><td style={{ padding:'3px 6px', border:'1px solid #eee' }}>{item.gstRate/2}% ({(gst/2).toFixed(2)})</td></>
                          }
                          <td style={{ padding:'3px 6px', border:'1px solid #eee', fontWeight:'bold' }}>{total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background:'#f0f4ff', fontWeight:'bold' }}>
                      <td colSpan={isIGST?7:6} style={{ padding:'4px 6px', border:'1px solid #ddd', textAlign:'right' }}>Taxable Amount:</td>
                      <td colSpan={isIGST?2:3} style={{ padding:'4px 6px', border:'1px solid #ddd' }}>{c(totals.taxable)}</td>
                      <td style={{ padding:'4px 6px', border:'1px solid #ddd', fontWeight:'bold' }}>{c(totals.taxable)}</td>
                    </tr>
                    {!isIGST&&<>
                      <tr><td colSpan={8} style={{ padding:'3px 6px', border:'1px solid #eee', textAlign:'right' }}>CGST:</td><td colSpan={2} style={{ padding:'3px 6px', border:'1px solid #eee' }}>{c(totals.gst/2)}</td></tr>
                      <tr><td colSpan={8} style={{ padding:'3px 6px', border:'1px solid #eee', textAlign:'right' }}>SGST:</td><td colSpan={2} style={{ padding:'3px 6px', border:'1px solid #eee' }}>{c(totals.gst/2)}</td></tr>
                    </>}
                    {isIGST&&<tr><td colSpan={8} style={{ padding:'3px 6px', border:'1px solid #eee', textAlign:'right' }}>IGST:</td><td colSpan={2} style={{ padding:'3px 6px', border:'1px solid #eee' }}>{c(totals.gst)}</td></tr>}
                    {Math.abs(roundOff)>0.001&&<tr><td colSpan={8} style={{ padding:'3px 6px', border:'1px solid #eee', textAlign:'right' }}>Round Off:</td><td colSpan={2} style={{ padding:'3px 6px', border:'1px solid #eee' }}>{roundOff.toFixed(2)}</td></tr>}
                    <tr style={{ background:'#1a1a2e', color:'white' }}>
                      <td colSpan={isIGST?8:9} style={{ padding:'5px 8px', fontWeight:'bold', fontSize:'12px', textAlign:'right' }}>GRAND TOTAL:</td>
                      <td colSpan={2} style={{ padding:'5px 8px', fontWeight:'bold', fontSize:'13px' }}>{c(grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount in words */}
                <div style={{ margin:'8px 12px', padding:'6px 10px', background:'#fff8e1', border:'1px solid #ffc107', fontSize:'10px' }}>
                  <strong>Amount in Words:</strong> {n2w(Math.floor(grandTotal))} Rupees{(grandTotal%1)>0?' and '+Math.round((grandTotal%1)*100)+' Paise':''} Only
                </div>

                {/* Bank + notes */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', margin:'0 12px 10px', gap:10, fontSize:'10px' }}>
                  {(bank.name||bank.account) && (
                    <div style={{ background:'#f5f5f5', padding:'6px 8px' }}>
                      <div style={{ fontWeight:'bold', marginBottom:3 }}>Bank Details:</div>
                      {bank.name&&<div>Bank: {bank.name}</div>}
                      {bank.account&&<div>A/C: {bank.account}</div>}
                      {bank.ifsc&&<div>IFSC: {bank.ifsc}</div>}
                      {bank.branch&&<div>Branch: {bank.branch}</div>}
                    </div>
                  )}
                  <div>
                    {notes&&<div style={{ marginBottom:4 }}><strong>Notes:</strong> {notes}</div>}
                    {terms&&<div style={{ fontSize:'9px', color:'#666' }}><strong>Terms:</strong> {terms}</div>}
                  </div>
                </div>

                {/* Signature */}
                <div style={{ display:'flex', justifyContent:'space-between', margin:'0 12px 12px', fontSize:'10px' }}>
                  <div style={{ textAlign:'center', width:140 }}>
                    <div style={{ borderTop:'1px solid #333', paddingTop:3, marginTop:24 }}>Authorised Signatory</div>
                    <div style={{ color:'#666' }}>{seller.name||'Company Name'}</div>
                  </div>
                  <div style={{ textAlign:'center', width:140 }}>
                    <div style={{ borderTop:'1px solid #333', paddingTop:3, marginTop:24 }}>Receiver's Signature</div>
                    <div style={{ color:'#666' }}>With Stamp</div>
                  </div>
                </div>
                <div style={{ textAlign:'center', fontSize:'9px', color:'#999', borderTop:'1px solid #eee', padding:'6px', background:'#fafafa' }}>
                  {isIGST?'Inter-state supply — IGST applicable':'Intra-state supply — CGST + SGST applicable'} · Generated via ilovetexts.com — Free GST Invoice Generator
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
