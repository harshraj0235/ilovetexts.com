'use client';
// RtiApplicationGenerator.jsx — RTI Application under RTI Act 2005
// Targets: "RTI application generator free" 25K/mo — near zero competition
import { useState, useRef, useCallback } from 'react';

const MINISTRIES = [
  'Ministry of Finance','Ministry of Home Affairs','Ministry of Railways','Ministry of Health & Family Welfare',
  'Ministry of Education','Ministry of External Affairs','Ministry of Defence','Ministry of Agriculture',
  'Ministry of Commerce & Industry','Ministry of Corporate Affairs','Ministry of Electronics & IT',
  'Ministry of Environment, Forest & Climate Change','Ministry of Housing & Urban Affairs',
  'Ministry of Labour & Employment','Ministry of Law & Justice','Ministry of Petroleum & Natural Gas',
  'Ministry of Power','Ministry of Road Transport & Highways','Ministry of Rural Development',
  'Ministry of Science & Technology','Ministry of Skill Development & Entrepreneurship',
  'Ministry of Social Justice & Empowerment','Ministry of Tourism','Ministry of Tribal Affairs',
  'Ministry of Women & Child Development','Ministry of Jal Shakti',
  'State Government — Andhra Pradesh','State Government — Bihar','State Government — Delhi',
  'State Government — Gujarat','State Government — Karnataka','State Government — Kerala',
  'State Government — Madhya Pradesh','State Government — Maharashtra','State Government — Punjab',
  'State Government — Rajasthan','State Government — Tamil Nadu','State Government — Telangana',
  'State Government — Uttar Pradesh','State Government — West Bengal',
  'Municipal Corporation / Local Body','Public Sector Undertaking (PSU)','Other Public Authority',
];

const QUESTION_TEMPLATES = [
  'Please provide the status of my application/complaint submitted on [DATE] with reference number [REF NO].',
  'Please provide copies of all documents/files related to [SUBJECT].',
  'Please provide the details of action taken on my complaint dated [DATE].',
  'Please provide the reasons for rejection/delay of my [APPLICATION TYPE].',
  'Please provide the names and designations of officials responsible for [SUBJECT].',
  'Please provide the budget allocated and expenditure incurred for [PROJECT/SCHEME].',
  'Please provide the policy/rules/guidelines governing [SUBJECT].',
  'Please provide the list of beneficiaries under [SCHEME NAME] in [AREA/DISTRICT].',
];

export default function RtiApplicationGenerator({ t, lang }) {
  const printRef = useRef(null);
  const [step, setStep] = useState(1); // 1=Applicant, 2=Authority, 3=Questions, 4=Preview

  const [applicant, setApplicant] = useState({ name:'', address:'', city:'', state:'', pincode:'', phone:'', email:'', isBPL: false });
  const [authority, setAuthority] = useState({ ministry:'', pioDept:'', address:'', subject:'' });
  const [questions, setQuestions] = useState(['']);
  const [period, setPeriod] = useState('');
  const [format, setFormat] = useState('certified_copies');
  const [language, setLanguage] = useState('English');
  const [copied, setCopied]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const fee = applicant.isBPL ? 0 : 10;

  const addQuestion = () => setQuestions(prev => [...prev, '']);
  const updateQ = (i,v) => setQuestions(prev => prev.map((q,idx)=>idx===i?v:q));
  const removeQ = (i) => setQuestions(prev => prev.filter((_,idx)=>idx!==i));
  const useTemplate = (i, tmpl) => updateQ(i, tmpl);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>RTI Application</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',serif;font-size:13px;color:#000;background:#fff;padding:30px;max-width:800px;margin:0 auto}
.header{text-align:center;margin-bottom:20px}
.title{font-size:16px;font-weight:bold;text-decoration:underline;margin-bottom:8px}
.to-section{margin-bottom:16px}
.body-text{line-height:1.8;margin-bottom:12px}
.questions{margin-left:20px;margin-bottom:16px}
.question-item{margin-bottom:8px}
.declaration{margin-top:20px;line-height:1.8;background:#f9f9f9;padding:12px;border:1px solid #ddd}
.signature{display:flex;justify-content:space-between;margin-top:40px}
.sig-block{text-align:center;width:200px}
.sig-line{border-top:1px solid #000;padding-top:4px;margin-top:30px}
.fee-note{background:#fff3cd;padding:8px;border:1px solid #ffc107;margin:10px 0;font-size:12px}
@media print{body{padding:10px}}
</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 500);
    showToast('Print dialog opened!');
  };

  const copyText = async () => {
    const text = printRef.current?.innerText;
    if (text) { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); showToast('RTI application copied!'); }
  };

  const isValid = applicant.name && applicant.address && authority.ministry && questions.some(q=>q.trim());

  const STEPS = ['Applicant Info','Authority Details','Your Questions','Preview & Download'];

  return (
    <div style={{ maxWidth:860, margin:'0 auto', width:'100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:'3rem', marginBottom:8 }}>📜</div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, margin:'0 0 6px' }}>RTI Application Generator</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Generate a proper RTI application under Section 6(1) of the Right to Information Act, 2005 · Free · No signup · PDF download</p>
      </div>

      {/* Info banner */}
      <div style={{ padding:'12px 16px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:'var(--radius-md)', marginBottom:16, fontSize:'0.82rem', color:'var(--text-secondary)' }}>
        ℹ️ <strong>How RTI works:</strong> Under the RTI Act 2005, every Indian citizen can request information from any public authority within 30 days. Fee: ₹10 (waived for BPL). First appeal: within 30 days if no reply.
      </div>

      {/* Step indicator */}
      <div style={{ display:'flex', gap:4, marginBottom:20 }}>
        {STEPS.map((s,i)=>(
          <div key={i} onClick={()=>setStep(i+1)} style={{ flex:1, textAlign:'center', padding:'8px 4px', borderRadius:'var(--radius-sm)', cursor:'pointer', background: step===i+1?'#dc2626':'var(--bg-section)', color: step===i+1?'#fff':'var(--text-secondary)', fontWeight: step===i+1?700:500, fontSize:'0.75rem', border:`1px solid ${step===i+1?'#dc2626':'var(--border-light)'}`, transition:'all 0.15s' }}>
            <span style={{ display:'block', fontWeight:800, marginBottom:2 }}>{i+1}</span>{s}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: step===4?'1fr 1fr':'1fr', gap:16 }}>
        <div>
          {/* Step 1: Applicant */}
          {step === 1 && (
            <div className="trust-card" style={{ padding:20 }}>
              <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:14, color:'#dc2626' }}>👤 Your (Applicant) Details</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Full Name *','name','text',true],['Complete Address *','address','text',true],['City/Town *','city','text',true],['State *','state','text',true],['PIN Code','pincode','text',false],['Mobile Number','phone','tel',false],['Email Address','email','email',false]].map(([l,k,tp,req])=>(
                  <div key={k} style={{ gridColumn: k==='address'?'span 2':'span 1' }}>
                    <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>{l}</label>
                    <input type={tp} value={applicant[k]} onChange={e=>setApplicant(p=>({...p,[k]:e.target.value}))} placeholder={l.replace(' *','')}
                      style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:`1px solid ${req&&!applicant[k]&&applicant.name?'#ef4444':'var(--border-light)'}`, background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, cursor:'pointer', fontSize:'0.85rem', fontWeight:600, padding:'10px 14px', background:'rgba(220,38,38,0.06)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(220,38,38,0.2)' }}>
                <input type="checkbox" checked={applicant.isBPL} onChange={e=>setApplicant(p=>({...p,isBPL:e.target.checked}))} style={{ accentColor:'#dc2626', width:16, height:16 }}/>
                <span>I am Below Poverty Line (BPL) — RTI fee waived (attach BPL card copy)</span>
              </label>
              <button onClick={()=>setStep(2)} disabled={!applicant.name||!applicant.address}
                style={{ width:'100%', marginTop:16, padding:12, background: applicant.name&&applicant.address?'#dc2626':'var(--border-light)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor: applicant.name&&applicant.address?'pointer':'not-allowed', fontSize:'0.9rem' }}>
                Next: Authority Details →
              </button>
            </div>
          )}

          {/* Step 2: Authority */}
          {step === 2 && (
            <div className="trust-card" style={{ padding:20 }}>
              <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:14, color:'#dc2626' }}>🏛️ Public Authority Details</h3>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Ministry / Department / Authority *</label>
                <select value={authority.ministry} onChange={e=>setAuthority(p=>({...p,ministry:e.target.value}))}
                  style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
                  <option value="">— Select Authority —</option>
                  {MINISTRIES.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {[['PIO Name & Department (if known)','pioDept'],['Authority Address (if known)','address']].map(([l,k])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>{l}</label>
                  <input value={authority[k]} onChange={e=>setAuthority(p=>({...p,[k]:e.target.value}))} placeholder={l}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Subject of RTI *</label>
                <input value={authority.subject} onChange={e=>setAuthority(p=>({...p,subject:e.target.value}))} placeholder="Brief subject (e.g. Status of pension application)"
                  style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Time Period for Information</label>
                  <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="e.g. 2023-24 or last 5 years"
                    style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:3 }}>Information Required In</label>
                  <select value={language} onChange={e=>setLanguage(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
                    {['English','Hindi','Marathi','Bengali','Tamil','Telugu','Gujarati','Kannada','Malayalam','Punjabi'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, padding:11, background:'var(--bg-section)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', fontWeight:600, cursor:'pointer', fontSize:'0.88rem' }}>← Back</button>
                <button onClick={()=>setStep(3)} disabled={!authority.ministry||!authority.subject}
                  style={{ flex:2, padding:11, background: authority.ministry&&authority.subject?'#dc2626':'var(--border-light)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor: authority.ministry&&authority.subject?'pointer':'not-allowed', fontSize:'0.9rem' }}>
                  Next: Add Questions →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Questions */}
          {step === 3 && (
            <div className="trust-card" style={{ padding:20 }}>
              <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:6, color:'#dc2626' }}>❓ Information Requested</h3>
              <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:14 }}>Be specific and precise. Each question should seek one piece of information. Vague questions may be rejected.</p>

              {/* Templates */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>📋 Question Templates (click to use)</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {QUESTION_TEMPLATES.map((tmpl,i)=>(
                    <button key={i} onClick={()=>{ const emptyIdx = questions.findIndex(q=>!q.trim()); if(emptyIdx>=0) useTemplate(emptyIdx,tmpl); else { setQuestions(prev=>[...prev,tmpl]); } }}
                      style={{ padding:'6px 10px', textAlign:'left', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-section)', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-secondary)', lineHeight:1.4 }}>
                      📌 {tmpl.slice(0,80)}…
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {questions.map((q,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontWeight:800, color:'#dc2626', paddingTop:8, flexShrink:0, minWidth:20 }}>{i+1}.</span>
                    <textarea value={q} onChange={e=>updateQ(i,e.target.value)} placeholder="Enter your question here... Be specific about what information you need."
                      rows={3}
                      style={{ flex:1, padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)', background:'var(--bg-main)', color:'var(--text-primary)', fontSize:'0.85rem', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                    {questions.length > 1 && (
                      <button onClick={()=>removeQ(i)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'#ef4444', padding:'6px 8px', flexShrink:0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addQuestion} style={{ marginTop:10, padding:'8px 16px', border:'2px dashed var(--border-light)', borderRadius:'var(--radius-sm)', background:'transparent', cursor:'pointer', color:'var(--text-secondary)', fontWeight:600, fontSize:'0.82rem', width:'100%' }}>
                + Add Another Question
              </button>

              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(220,38,38,0.05)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(220,38,38,0.2)', fontSize:'0.78rem' }}>
                <strong>💡 Tips for better RTI:</strong> Mention specific dates, reference numbers, document names. Avoid "why" questions — ask for copies of documents or records instead.
              </div>

              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button onClick={()=>setStep(2)} style={{ flex:1, padding:11, background:'var(--bg-section)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', fontWeight:600, cursor:'pointer' }}>← Back</button>
                <button onClick={()=>setStep(4)} disabled={!questions.some(q=>q.trim())}
                  style={{ flex:2, padding:11, background: questions.some(q=>q.trim())?'#dc2626':'var(--border-light)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:700, cursor: questions.some(q=>q.trim())?'pointer':'not-allowed', fontSize:'0.9rem' }}>
                  Preview RTI Application →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 form summary */}
          {step === 4 && (
            <div className="trust-card" style={{ padding:16 }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:12, color:'#dc2626' }}>📋 Application Summary</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:'0.82rem' }}>
                {[['Applicant',applicant.name],['Authority',authority.ministry],['Subject',authority.subject],['Questions',questions.filter(q=>q.trim()).length+' question(s)'],['RTI Fee',fee===0?'₹0 (BPL)':'₹10'],].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', gap:10, padding:'6px 10px', background:'var(--bg-section)', borderRadius:4 }}>
                    <span style={{ fontWeight:700, color:'var(--text-secondary)', minWidth:80 }}>{l}:</span>
                    <span style={{ color:'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                <button onClick={handlePrint} style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontWeight:800, cursor:'pointer', fontSize:'0.88rem', minWidth:140 }}>🖨️ Print / Save PDF</button>
                <button onClick={copyText} style={{ flex:1, padding:'10px', background:copied?'rgba(16,185,129,0.1)':'var(--bg-section)', border:`1px solid ${copied?'#10b981':'var(--border-light)'}`, borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', color:copied?'#10b981':'var(--text-primary)', minWidth:140 }}>{copied?'✓ Copied!':'📋 Copy Text'}</button>
                <button onClick={()=>setStep(3)} style={{ padding:'10px 14px', background:'var(--bg-section)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', fontWeight:600, cursor:'pointer', fontSize:'0.82rem' }}>← Edit</button>
              </div>
            </div>
          )}
        </div>

        {/* RTI Application Preview (step 4) */}
        {step === 4 && (
          <div>
            <div ref={printRef} style={{ fontFamily:'Times New Roman,serif', fontSize:'13px', color:'#000', lineHeight:1.7, background:'#fff', border:'1px solid #ccc', borderRadius:8, padding:20 }}>
              <div style={{ textAlign:'right', marginBottom:8 }}>Date: {today}</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:'bold' }}>To,</div>
                <div>The Public Information Officer (PIO),</div>
                <div>{authority.pioDept || '[Department Name]'}</div>
                <div>{authority.ministry}</div>
                {authority.address && <div>{authority.address}</div>}
              </div>
              <div style={{ textAlign:'center', fontWeight:'bold', textDecoration:'underline', marginBottom:14, fontSize:'14px' }}>
                APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005
              </div>
              <div style={{ marginBottom:14 }}>
                <div><strong>Subject:</strong> {authority.subject || '[Subject of RTI]'}</div>
                {period && <div><strong>Period:</strong> {period}</div>}
                <div><strong>Information required in:</strong> {language}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div><strong>Applicant Details:</strong></div>
                <div>Name: {applicant.name || '[Your Name]'}</div>
                <div>Address: {applicant.address || '[Your Address]'}{applicant.city?', '+applicant.city:''}{applicant.state?', '+applicant.state:''}{applicant.pincode?' - '+applicant.pincode:''}</div>
                {applicant.phone && <div>Phone: {applicant.phone}</div>}
                {applicant.email && <div>Email: {applicant.email}</div>}
              </div>
              <div style={{ marginBottom:14 }}>
                <div><strong>Respected Sir/Madam,</strong></div>
                <div style={{ marginTop:8 }}>Under the Right to Information Act, 2005, I hereby request the following information from your office. I am a citizen of India and am entitled to seek this information under the provisions of the said Act.</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div><strong>Information Requested:</strong></div>
                <div style={{ marginLeft:16, marginTop:6 }}>
                  {questions.filter(q=>q.trim()).map((q,i)=>(
                    <div key={i} style={{ marginBottom:8 }}>{i+1}. {q}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14, background:'#fffde7', padding:'8px 12px', border:'1px solid #ffc107' }}>
                <strong>RTI Fee:</strong> {fee === 0 ? 'No fee applicable (BPL applicant). BPL card copy enclosed.' : `₹10 (Ten Rupees) enclosed as application fee via Indian Postal Order / Court Fee Stamp / Demand Draft.`}
              </div>
              <div style={{ marginBottom:14, background:'#f9f9f9', padding:'10px 14px', border:'1px solid #ddd' }}>
                <div><strong>Declaration:</strong></div>
                <div style={{ marginTop:4 }}>I declare that the information sought does not fall within the exemptions listed under Section 8 of the RTI Act. I also undertake that the information sought is for personal use and not for commercial purposes. I agree to pay additional fees if applicable for the information/copies provided.</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:30 }}>
                <div>
                  <div>Yours faithfully,</div>
                  <div style={{ marginTop:30, borderTop:'1px solid #000', paddingTop:4 }}>{applicant.name || '[Applicant Name]'}</div>
                  <div style={{ fontSize:'11px', color:'#666' }}>Date: {today}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'11px', color:'#666' }}>Enclosures:</div>
                  <div style={{ fontSize:'11px', color:'#666' }}>1. RTI Fee {fee===0?'(BPL card)':'(₹10)'}</div>
                  {applicant.isBPL && <div style={{ fontSize:'11px', color:'#666' }}>2. BPL Certificate copy</div>}
                </div>
              </div>
              <div style={{ textAlign:'center', fontSize:'10px', color:'#999', marginTop:16, borderTop:'1px solid #eee', paddingTop:8 }}>
                Generated via ilovetexts.com — Free RTI Application Generator · Under RTI Act 2005, Section 6(1)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
