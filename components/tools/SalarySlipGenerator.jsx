'use client';
// SalarySlipGenerator.jsx — Advanced salary slip with PF/ESI/PT auto-calculation
// Targets: "salary slip generator free" 90K/mo, "payslip maker India" 40K/mo
import { useState, useCallback, useRef } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATES_PT = { 'Andhra Pradesh':200,'Karnataka':200,'Maharashtra':200,'Tamil Nadu':208,'West Bengal':200,'Telangana':200,'Gujarat':200,'Madhya Pradesh':202,'Other':0 };

function calcPF(basic) { return Math.min(Math.round(basic * 0.12), 1800); }
function calcESI(gross) { return gross <= 21000 ? Math.round(gross * 0.0075) : 0; }

export default function SalarySlipGenerator({ t, lang }) {
  const printRef = useRef(null);

  const [company, setCompany] = useState({ name: '', logo: '', address: '', cin: '' });
  const [employee, setEmployee] = useState({ name:'', id:'', designation:'', department:'', pan:'', uan:'', bank:'', account:'', ifsc:'', doj:'', location:'' });
  const [period, setPeriod] = useState({ month: new Date().getMonth(), year: new Date().getFullYear(), workingDays: 26, presentDays: 26 });
  const [earnings, setEarnings] = useState({ basic:0, hra:0, da:0, ta:0, special:0, incentive:0, other:0 });
  const [deductions, setDeductions] = useState({ pf:0, esi:0, pt:0, tds:0, advance:0, other:0 });
  const [autoCalc, setAutoCalc] = useState({ pf:true, esi:true, hra:true });
  const [ptState, setPtState] = useState('Other');
  const [currency] = useState('₹');
  const [toast, setToast] = useState(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  // Auto-calculate when basic changes
  const handleBasicChange = useCallback((val) => {
    const basic = parseFloat(val) || 0;
    setEarnings(prev => ({
      ...prev, basic,
      hra: autoCalc.hra ? Math.round(basic * 0.4) : prev.hra,
    }));
    if (autoCalc.pf) setDeductions(prev => ({ ...prev, pf: calcPF(basic) }));
  }, [autoCalc]);

  const handleEarningsChange = useCallback((field, val) => {
    const v = parseFloat(val) || 0;
    setEarnings(prev => {
      const next = { ...prev, [field]: v };
      const gross = Object.values(next).reduce((s,x)=>s+x,0);
      if (autoCalc.esi) setDeductions(d => ({ ...d, esi: calcESI(gross) }));
      return next;
    });
  }, [autoCalc]);

  const grossEarnings = Object.values(earnings).reduce((s,x)=>s+(parseFloat(x)||0),0);
  const totalDeductions = Object.values(deductions).reduce((s,x)=>s+(parseFloat(x)||0),0);
  const netSalary = grossEarnings - totalDeductions;
  const lopDeduction = period.workingDays > 0 ? Math.round((grossEarnings / period.workingDays) * (period.workingDays - period.presentDays)) : 0;
  const finalNet = netSalary - lopDeduction;

  // Number to words for net salary
  const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function n2w(n) {
    n = Math.floor(n);
    if (!n) return 'Zero';
    const parts = [];
    if (n >= 10000000) { parts.push(n2w(Math.floor(n/10000000))+' Crore'); n%=10000000; }
    if (n >= 100000)   { parts.push(n2w(Math.floor(n/100000))+' Lakh'); n%=100000; }
    if (n >= 1000)     { parts.push(n2w(Math.floor(n/1000))+' Thousand'); n%=1000; }
    if (n >= 100)      { parts.push(ONES[Math.floor(n/100)]+' Hundred'); n%=100; }
    if (n >= 20)       { parts.push(TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:'')); }
    else if (n > 0)    { parts.push(ONES[n]); }
    return parts.join(' ');
  }

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Salary Slip - ${employee.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:20px}
.slip{max-width:800px;margin:0 auto;border:2px solid #333;padding:16px}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:10px}
.company-name{font-size:18px;font-weight:bold;color:#1a1a2e}
.slip-title{font-size:14px;font-weight:bold;background:#1a1a2e;color:white;padding:4px 10px;display:inline-block;margin:6px 0}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px;font-size:11px}
.info-row{display:flex;gap:4px}
.info-label{font-weight:bold;min-width:130px;color:#555}
table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px}
th{background:#1a1a2e;color:white;padding:5px 8px;text-align:left}
td{padding:4px 8px;border:1px solid #ddd}
tr:nth-child(even) td{background:#f9f9f9}
.total-row td{background:#e8f0fe !important;font-weight:bold}
.net-row td{background:#1a1a2e !important;color:white;font-weight:bold;font-size:13px}
.footer{font-size:10px;color:#666;text-align:center;border-top:1px solid #ccc;padding-top:8px;margin-top:10px}
.sig-row{display:flex;justify-content:space-between;margin-top:30px;font-size:11px}
@media print{body{padding:5px}}
</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    showToast('Print dialog opened!');
  };

  const c = (n) => currency + (parseFloat(n)||0).toLocaleString('en-IN');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:'3rem', marginBottom:8 }}>📋</div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, margin:'0 0 6px' }}>Salary Slip Generator</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Professional payslip with PF/ESI/HRA auto-calculation · Download PDF · No signup · No watermark</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* LEFT: Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Company */}
          <div className="trust-card" style={{ padding:16 }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:12, color:'#dc2626' }}>🏢 Company Details</h3>
            {[['Company Name','name'],['Address','address'],['CIN/GSTIN (optional)','cin']].map(([label,key])=>(
              <div key={key} style={{ marginBottom:8 }}>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>{label}</label>
                <input value={company[key]} onChange={e=>setCompany(p=>({...p,[key]:e.target.value}))} placeholder={label}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>

          {/* Employee */}
          <div className="trust-card" style={{ padding:16 }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:12, color:'#dc2626' }}>👤 Employee Details</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['Full Name','name'],['Employee ID','id'],['Designation','designation'],['Department','department'],['PAN Number','pan'],['UAN Number','uan'],['Bank Name','bank'],['Account No.','account'],['IFSC Code','ifsc'],['Date of Joining','doj'],['Location','location']].map(([label,key])=>(
                <div key={key} style={{ gridColumn: key==='name'||key==='designation'?'span 2':'span 1' }}>
                  <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>{label}</label>
                  <input value={employee[key]} onChange={e=>setEmployee(p=>({...p,[key]:e.target.value}))} placeholder={label} type={key==='doj'?'date':'text'}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.8rem', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Pay period */}
          <div className="trust-card" style={{ padding:16 }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:12, color:'#dc2626' }}>📅 Pay Period</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Month</label>
                <select value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
                  {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Year</label>
                <input type="number" value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))} min={2020} max={2030}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Working Days</label>
                <input type="number" value={period.workingDays} onChange={e=>setPeriod(p=>({...p,workingDays:+e.target.value}))} min={1} max={31}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Days Present</label>
                <input type="number" value={period.presentDays} onChange={e=>setPeriod(p=>({...p,presentDays:+e.target.value}))} min={0} max={period.workingDays}
                  style={{ width:'100%', padding:'7px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="trust-card" style={{ padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:700, color:'#10b981', margin:0 }}>💰 Earnings</h3>
              <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', cursor:'pointer' }}>
                <input type="checkbox" checked={autoCalc.hra} onChange={e=>setAutoCalc(p=>({...p,hra:e.target.checked}))} style={{ accentColor:'#10b981' }}/>
                Auto HRA (40% basic)
              </label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['Basic Salary','basic',true],['HRA','hra',false],['Dearness Allow.','da',false],['Transport Allow.','ta',false],['Special Allow.','special',false],['Incentive','incentive',false],['Other Earnings','other',false]].map(([label,key,isBasic])=>(
                <div key={key}>
                  <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>{label}</label>
                  <input type="number" value={earnings[key]} min={0}
                    onChange={e=>isBasic?handleBasicChange(e.target.value):handleEarningsChange(key,e.target.value)}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:`1px solid ${key==='hra'&&autoCalc.hra?'#10b981':'var(--border-light)'}`, background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(16,185,129,0.08)', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', color:'#10b981' }}>
              Gross Earnings: {c(grossEarnings)}
            </div>
          </div>

          {/* Deductions */}
          <div className="trust-card" style={{ padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:700, color:'#ef4444', margin:0 }}>📉 Deductions</h3>
              <div style={{ display:'flex', gap:10 }}>
                {[['PF','pf'],['ESI','esi']].map(([l,k])=>(
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.72rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={autoCalc[k]} onChange={e=>{ setAutoCalc(p=>({...p,[k]:e.target.checked})); if(e.target.checked&&k==='pf') setDeductions(d=>({...d,pf:calcPF(earnings.basic)})); if(e.target.checked&&k==='esi') setDeductions(d=>({...d,esi:calcESI(grossEarnings)})); }} style={{ accentColor:'#ef4444' }}/>
                    Auto {l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>PF (12% basic, max ₹1800)</label>
                <input type="number" value={deductions.pf} min={0} onChange={e=>setDeductions(p=>({...p,pf:+e.target.value}))}
                  disabled={autoCalc.pf} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:`1px solid ${autoCalc.pf?'#ef4444':'var(--border-light)'}`, background: autoCalc.pf?'var(--bg-section)':'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>ESI (0.75%, if gross ≤₹21K)</label>
                <input type="number" value={deductions.esi} min={0} onChange={e=>setDeductions(p=>({...p,esi:+e.target.value}))}
                  disabled={autoCalc.esi} style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:`1px solid ${autoCalc.esi?'#ef4444':'var(--border-light)'}`, background: autoCalc.esi?'var(--bg-section)':'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>Prof. Tax State</label>
                <select value={ptState} onChange={e=>{ setPtState(e.target.value); setDeductions(p=>({...p,pt:STATES_PT[e.target.value]||0})); }}
                  style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.8rem' }}>
                  {Object.keys(STATES_PT).map(s=><option key={s} value={s}>{s} (₹{STATES_PT[s]})</option>)}
                </select>
              </div>
              {[['TDS','tds'],['Advance','advance'],['Other Deductions','other']].map(([label,key])=>(
                <div key={key}>
                  <label style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:2 }}>{label}</label>
                  <input type="number" value={deductions[key]} min={0} onChange={e=>setDeductions(p=>({...p,[key]:+e.target.value}))}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', color:'#ef4444' }}>
              Total Deductions: {c(totalDeductions + lopDeduction)}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div>
          <div style={{ position:'sticky', top:80 }}>
            {/* Action buttons */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <button onClick={handlePrint}
                style={{ flex:1, padding:'11px', background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', boxShadow:'0 3px 12px rgba(220,38,38,0.35)' }}>
                🖨️ Print / Save PDF
              </button>
            </div>

            {/* Slip preview */}
            <div ref={printRef}>
              <div className="slip" style={{ fontFamily:'Arial,sans-serif', fontSize:'12px', border:'2px solid #1a1a2e', padding:16, borderRadius:8, background:'#fff', color:'#111' }}>
                {/* Header */}
                <div style={{ textAlign:'center', borderBottom:'2px solid #1a1a2e', paddingBottom:10, marginBottom:10 }}>
                  <div style={{ fontSize:'18px', fontWeight:'bold', color:'#1a1a2e' }}>{company.name || 'Company Name'}</div>
                  {company.address && <div style={{ fontSize:'11px', color:'#666', marginTop:2 }}>{company.address}</div>}
                  {company.cin && <div style={{ fontSize:'11px', color:'#666' }}>CIN/GSTIN: {company.cin}</div>}
                  <div style={{ display:'inline-block', background:'#1a1a2e', color:'white', padding:'3px 12px', borderRadius:3, fontWeight:'bold', fontSize:'13px', marginTop:6 }}>
                    SALARY SLIP — {MONTHS[period.month]} {period.year}
                  </div>
                </div>

                {/* Employee info */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', marginBottom:12, fontSize:'11px' }}>
                  {[['Employee Name',employee.name||'—'],['Employee ID',employee.id||'—'],['Designation',employee.designation||'—'],['Department',employee.department||'—'],['PAN',employee.pan||'—'],['UAN',employee.uan||'—'],['Bank',employee.bank||'—'],['A/C No.',employee.account||'—'],['IFSC',employee.ifsc||'—'],['DOJ',employee.doj||'—'],['Working Days',period.workingDays],['Days Present',period.presentDays]].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', gap:4 }}>
                      <span style={{ fontWeight:'bold', color:'#555', minWidth:110 }}>{l}:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Earnings & Deductions table */}
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px', marginBottom:8 }}>
                  <thead>
                    <tr>
                      <th style={{ background:'#1a1a2e', color:'white', padding:'5px 8px', textAlign:'left', width:'25%' }}>Earnings</th>
                      <th style={{ background:'#1a1a2e', color:'white', padding:'5px 8px', textAlign:'right', width:'25%' }}>Amount (₹)</th>
                      <th style={{ background:'#1a1a2e', color:'white', padding:'5px 8px', textAlign:'left', width:'25%' }}>Deductions</th>
                      <th style={{ background:'#1a1a2e', color:'white', padding:'5px 8px', textAlign:'right', width:'25%' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Basic Salary',earnings.basic,'PF (Emp)',deductions.pf],
                      ['HRA',earnings.hra,'ESI (Emp)',deductions.esi],
                      ['DA',earnings.da,'Prof. Tax',deductions.pt],
                      ['Transport Allow.',earnings.ta,'TDS',deductions.tds],
                      ['Special Allow.',earnings.special,'Advance',deductions.advance],
                      ['Incentive',earnings.incentive,'Other Deductions',deductions.other],
                      ['Other Earnings',earnings.other,'LOP Deduction',lopDeduction],
                    ].map(([el,ev,dl,dv],i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid #eee', background: i%2===0?'#fff':'#f9f9f9' }}>
                        <td style={{ padding:'4px 8px' }}>{el}</td>
                        <td style={{ padding:'4px 8px', textAlign:'right' }}>{ev>0?ev.toLocaleString('en-IN'):'-'}</td>
                        <td style={{ padding:'4px 8px' }}>{dl}</td>
                        <td style={{ padding:'4px 8px', textAlign:'right' }}>{dv>0?dv.toLocaleString('en-IN'):'-'}</td>
                      </tr>
                    ))}
                    <tr style={{ background:'#e8f5e9', fontWeight:'bold' }}>
                      <td style={{ padding:'5px 8px' }}>Gross Earnings</td>
                      <td style={{ padding:'5px 8px', textAlign:'right' }}>{grossEarnings.toLocaleString('en-IN')}</td>
                      <td style={{ padding:'5px 8px' }}>Total Deductions</td>
                      <td style={{ padding:'5px 8px', textAlign:'right' }}>{(totalDeductions+lopDeduction).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Net salary */}
                <div style={{ background:'#1a1a2e', color:'white', padding:'8px 12px', borderRadius:4, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:'bold', fontSize:'14px' }}>NET SALARY</span>
                    <span style={{ fontWeight:'bold', fontSize:'16px' }}>₹ {finalNet.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize:'10px', opacity:0.85, marginTop:3 }}>
                    Amount in Words: {n2w(finalNet)} Rupees Only
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:24, fontSize:'11px' }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ borderTop:'1px solid #333', paddingTop:4, width:140 }}>Employee Signature</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ borderTop:'1px solid #333', paddingTop:4, width:140 }}>HR/Authorised Signatory</div>
                  </div>
                </div>
                <div style={{ textAlign:'center', fontSize:'9px', color:'#999', marginTop:10, borderTop:'1px solid #eee', paddingTop:6 }}>
                  This is a computer-generated salary slip. Generated via ilovetexts.com — Free Salary Slip Generator.
                </div>
              </div>
            </div>

            {/* Net summary */}
            <div style={{ marginTop:14, padding:'12px 16px', background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(239,68,68,0.05))', borderRadius:'var(--radius-md)', border:'1px solid rgba(220,38,38,0.2)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center' }}>
                {[['Gross','var(--text-primary)',grossEarnings],['Deductions','#ef4444',totalDeductions+lopDeduction],['Net Take-Home','#10b981',finalNet]].map(([l,c,v])=>(
                  <div key={l}>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', fontWeight:700 }}>{l}</div>
                    <div style={{ fontSize:'1.1rem', fontWeight:800, color:c }}>₹{v.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
