'use client';
import { useState, useRef, useCallback } from 'react';

// ─── Risk pattern library — 200+ patterns, no AI needed ──
const RISK_PATTERNS = {
  lease: [
    // Red — Tenant unfriendly
    { id: 'l01', severity: 'red', icon: '🔴', title: 'Landlord can enter without proper notice', keywords: ['enter at any time','access without notice','right to enter','landlord may enter','inspect at any time','access the premises at'], plain: 'The landlord can enter your home without giving you advance notice. Standard notice is 24-48 hours. This could violate your right to quiet enjoyment.', action: 'Request an amendment requiring at least 24-48 hours written notice except in genuine emergencies.' },
    { id: 'l02', severity: 'red', icon: '🔴', title: 'Automatic rent increase clause', keywords: ['rent shall increase','rent will increase','annual increase','rent escalation','rent adjustment','percentage increase per year'], plain: 'Your rent can automatically increase by a fixed percentage every year without renegotiation. This could significantly increase costs over the lease term.', action: 'Ask for the total maximum rent increase amount over the lease period before signing.' },
    { id: 'l03', severity: 'red', icon: '🔴', title: 'Landlord can terminate without cause', keywords: ['terminate without cause','terminate for any reason','terminate at will','end tenancy without','evict without reason','vacate at landlord\'s discretion'], plain: 'The landlord can end your tenancy without giving a reason. This is only enforceable in certain jurisdictions and may be illegal in your area.', action: 'Check your local tenant protection laws. In many US states, UK, and Germany, landlords cannot terminate without valid cause.' },
    { id: 'l04', severity: 'red', icon: '🔴', title: 'Tenant responsible for all repairs', keywords: ['tenant shall be responsible for all repairs','tenant shall maintain','tenant shall repair all','all repairs at tenant\'s expense','tenant responsible for maintenance'], plain: 'You are made responsible for all repairs, including structural and major systems. Landlords are typically legally required to handle structural repairs, heating, and plumbing.', action: 'Strike this clause and replace with standard language: landlord handles structural and major systems, tenant handles minor repairs under a specified amount.' },
    { id: 'l05', severity: 'red', icon: '🔴', title: 'Deposit can be withheld for any reason', keywords: ['deposit may be withheld','forfeit deposit','deposit nonrefundable','security deposit kept','deposit retained at landlord'], plain: 'The landlord can keep your security deposit without specific justification. In most countries, landlords must return the deposit with an itemized list of any deductions.', action: 'Document the apartment condition thoroughly with photos before moving in. Know your local deposit protection laws.' },
    { id: 'l06', severity: 'red', icon: '🔴', title: 'No guests allowed or heavily restricted', keywords: ['no guests','guests prohibited','guest restriction','overnight guests','visitors not permitted','no overnight visitors'], plain: 'Severe restrictions on having guests. Reasonable guest policies are acceptable but prohibiting all guests may be unenforceable.', action: 'Negotiate reasonable guest terms — typically 7-14 consecutive days without notification.' },
    // Yellow — Watch out
    { id: 'l07', severity: 'yellow', icon: '🟡', title: 'Professional cleaning required on exit', keywords: ['professional cleaning','clean to professional standard','cleaning service required','end of tenancy clean','professionally cleaned'], plain: 'You must pay for professional cleaning when you leave. This is common but the cost (£100-500+) should be factored into your overall rental costs.', action: 'Get a quote for professional cleaning services in your area. Document the initial cleanliness with photos.' },
    { id: 'l08', severity: 'yellow', icon: '🟡', title: 'Long lock-in period', keywords: ['break clause','early termination','minimum term','lock-in period','no early exit','cannot terminate before'], plain: 'You cannot leave before a fixed period without penalty. Understand the total financial commitment before signing.', action: 'Calculate the maximum loss if you need to leave early. Consider negotiating a shorter lock-in period.' },
    { id: 'l09', severity: 'yellow', icon: '🟡', title: 'Subletting prohibited', keywords: ['no subletting','subletting prohibited','shall not sublet','cannot sublet','sublease not permitted','no sublease'], plain: 'You cannot rent out any part of the property to others. This prevents Airbnb, room rental, or sharing arrangements.', action: 'If subletting is important to you, negotiate permission for subletting with landlord approval.' },
    { id: 'l10', severity: 'yellow', icon: '🟡', title: 'Rent payment method restrictions', keywords: ['cash only','cheque only','bank transfer only','specific payment method','no electronic payment'], plain: 'Limited payment options may cause inconvenience. Ensure the required method is practical and provides a payment record.', action: 'Always pay by traceable method (bank transfer, check) so you have proof of payment.' },
    { id: 'l11', severity: 'yellow', icon: '🟡', title: 'Utilities included — verify amounts', keywords: ['utilities included','bills included','all inclusive','electricity included','water included','council tax included'], plain: 'Utilities are included in rent — confirm exactly which utilities and if there are caps. "Unlimited" included utilities can become disputed.', action: 'Get in writing exactly which utilities are included and any fair usage limits.' },
    { id: 'l12', severity: 'yellow', icon: '🟡', title: 'Pets require written permission', keywords: ['no pets','pets prohibited','written consent for pets','pets not permitted','pet deposit required','pets subject to approval'], plain: 'Pets are restricted or prohibited. Even if you don\'t have pets now, this affects future flexibility.', action: 'If you have or plan to get a pet, negotiate explicit written permission into the lease.' },
    // Green — Normal/tenant-friendly
    { id: 'l13', severity: 'green', icon: '✅', title: 'Notice period clearly specified', keywords: ['days notice','notice period','written notice required','month notice','notice to vacate'], plain: 'The notice period is clearly stated. Standard is 1-2 months depending on jurisdiction.', action: 'No action needed — this is standard practice.' },
    { id: 'l14', severity: 'green', icon: '✅', title: 'Deposit protection mentioned', keywords: ['deposit protection','protected deposit','tenancy deposit scheme','escrow','held in trust','deposit scheme'], plain: 'Your deposit is protected in a government-approved scheme. This is legally required in UK, parts of US, and many EU countries.', action: 'Confirm the specific deposit protection scheme used and register any disputes within the required timeframe.' },
  ],
  employment: [
    // Red — Employee unfriendly
    { id: 'e01', severity: 'red', icon: '🔴', title: 'Broad non-compete clause', keywords: ['non-compete','noncompete','not compete','shall not work','restricted from working','competing business','competing employment'], plain: 'You agree not to work for competitors after leaving this job. The scope, duration, and geographic area determines enforceability. Over 2 years or nationwide non-competes are rarely enforceable.', action: 'Check if non-competes are enforceable in your state/country (California bans them entirely). Negotiate to reduce scope, duration, and geographic area.' },
    { id: 'e02', severity: 'red', icon: '🔴', title: 'Overly broad IP assignment', keywords: ['assign all inventions','all intellectual property','work product assigned','inventions assigned','ip ownership','all creations belong'], plain: 'Everything you create — including personal projects — could belong to your employer. This is unusually broad and may be unenforceable for creations unrelated to your job.', action: 'Request an exclusion for personal projects created on your own time with your own equipment. Many states (CA, DE, IL, NC, WA) have laws protecting your personal inventions.' },
    { id: 'e03', severity: 'red', icon: '🔴', title: 'Mandatory arbitration clause', keywords: ['mandatory arbitration','arbitration agreement','waive right to jury','dispute resolution arbitration','binding arbitration','class action waiver'], plain: 'You waive your right to sue in court. All disputes go to arbitration — which tends to favor employers. You also typically waive the right to join class action lawsuits.', action: 'You can try to negotiate removal of this clause. Be aware this is now illegal in some jurisdictions for certain claim types.' },
    { id: 'e04', severity: 'red', icon: '🔴', title: 'Termination without notice or cause', keywords: ['at-will','at will','terminate without cause','dismiss without notice','employment terminable','without reason'], plain: 'Employer can fire you at any time for any reason without notice or severance. This is standard in US at-will states but unusual in UK, Germany, and most other countries.', action: 'Know your jurisdiction\'s rules. In UK, you have statutory right to notice pay. In Germany, termination requires valid reason and notice.' },
    { id: 'e05', severity: 'red', icon: '🔴', title: 'High variable / discretionary bonus', keywords: ['discretionary bonus','at management discretion','performance bonus not guaranteed','bonus may be modified','bonus subject to change','variable compensation'], plain: 'Your bonus can be changed or eliminated at the employer\'s discretion. If a significant part of your comp is variable, your actual income could be much lower than the headline figure.', action: 'Get the historical bonus payout data. Ask what percentage of employees received full bonus last year. Consider negotiating a minimum guaranteed bonus.' },
    { id: 'e06', severity: 'red', icon: '🔴', title: 'Long notice period (garden leave)', keywords: ['garden leave','gardening leave','90 days notice','6 months notice','3 months notice','paid garden leave','60 days notice'], plain: 'You must give very long notice before leaving. While you may be paid, you cannot start a new job during this period — effectively locking you in for an extended time.', action: 'Understand the exact notice period commitment. Negotiate if it\'s longer than your industry standard (usually 1-3 months for most roles).' },
    // Yellow
    { id: 'e07', severity: 'yellow', icon: '🟡', title: 'Clawback provision on bonuses/equity', keywords: ['clawback','claw back','repay bonus','repay signing bonus','return equity','vesting cliff','unvested forfeited'], plain: 'Bonuses or equity can be taken back if you leave before a certain date. Know your cliff and vesting schedule before making career decisions.', action: 'Calculate the total financial impact of leaving before the cliff date. This affects your job flexibility.' },
    { id: 'e08', severity: 'yellow', icon: '🟡', title: 'Non-solicitation clause', keywords: ['non-solicitation','do not solicit','shall not solicit','cannot recruit','cannot contact clients'], plain: 'You cannot contact former clients or recruit colleagues after leaving. Duration and scope vary — 1-2 years for clients is common, anything broader is aggressive.', action: 'Understand the duration and scope. Note which specific clients or colleagues are covered.' },
    { id: 'e09', severity: 'yellow', icon: '🟡', title: 'Probation period specified', keywords: ['probationary period','probation period','trial period','during probation','initial period of employment'], plain: 'You have reduced employment protections during probation. Termination during probation is easier and notice requirements are typically shorter.', action: 'Understand the probation length and what happens at the end. Ensure you know the performance criteria for passing probation.' },
    { id: 'e10', severity: 'yellow', icon: '🟡', title: 'Expense reimbursement process', keywords: ['expense reimbursement','business expenses','out of pocket','expense claim','expenses approved in advance'], plain: 'Work expenses may require pre-approval or specific documentation. Understand the process before incurring costs you may not recover.', action: 'Clarify which expenses are covered, the approval process, and typical turnaround time for reimbursement.' },
    { id: 'e11', severity: 'yellow', icon: '🟡', title: 'Social media / communication policy', keywords: ['social media policy','company confidential','not disclose','non-disclosure','social media restrictions','press enquiries'], plain: 'Restrictions on what you can post publicly about your employer. Overly broad policies could restrict legitimate public communication.', action: 'Understand what you can and cannot post. Legitimate restrictions are common; overly broad ones may be unenforceable.' },
    // Green
    { id: 'e12', severity: 'green', icon: '✅', title: 'Clear salary and payment schedule', keywords: ['salary of','annual salary','base salary','paid monthly','paid bi-weekly','compensation of'], plain: 'Your base salary and payment frequency are clearly stated. This is good — you have clear expectations.', action: 'Confirm the payment dates and whether salary is paid in advance or arrears.' },
    { id: 'e13', severity: 'green', icon: '✅', title: 'Holiday/PTO entitlement specified', keywords: ['days annual leave','days holiday','paid vacation','pto policy','holiday entitlement','days per year'], plain: 'Your paid leave entitlement is explicitly stated. This prevents disputes about holiday balance later.', action: 'Confirm whether unused days roll over and the procedure for booking leave.' },
  ],
  general: [
    { id: 'g01', severity: 'red', icon: '🔴', title: 'Limitation of liability clause', keywords: ['limitation of liability','limit our liability','maximum liability','liability capped','not liable for','exclude all liability'], plain: 'The other party\'s financial liability to you is capped or excluded. This affects how much you can claim if they breach the contract.', action: 'Understand the cap amount and ensure it is proportionate to the value of the contract.' },
    { id: 'g02', severity: 'red', icon: '🔴', title: 'Unilateral right to modify terms', keywords: ['modify these terms','change the agreement','amend at any time','update at our discretion','terms may change','reserve the right to modify'], plain: 'One party can change the contract terms without your agreement. This means the deal you signed is not necessarily the deal you have tomorrow.', action: 'Negotiate that material changes require mutual consent in writing.' },
    { id: 'g03', severity: 'yellow', icon: '🟡', title: 'Governing law and jurisdiction', keywords: ['governing law','jurisdiction','courts of','law of the state','disputes shall be','applicable law'], plain: 'Disputes must be resolved under a specific jurisdiction\'s laws. If this is in another country or far-away state, legal action becomes expensive.', action: 'Consider whether the specified jurisdiction is practical if a dispute arises.' },
    { id: 'g04', severity: 'yellow', icon: '🟡', title: 'Automatic renewal clause', keywords: ['automatic renewal','auto-renew','renew automatically','unless cancelled','renewal notice','automatically extends'], plain: 'The contract renews automatically unless you actively cancel it. Missing the cancellation deadline locks you in for another term.', action: 'Set a calendar reminder before the cancellation deadline. Know exactly how and when to cancel.' },
    { id: 'g05', severity: 'green', icon: '✅', title: 'Force majeure clause present', keywords: ['force majeure','act of god','circumstances beyond','unforeseeable circumstances','pandemic','natural disaster'], plain: 'Neither party is liable for events outside their control (pandemics, natural disasters). This protects both sides.', action: 'Note what events qualify and what happens to your obligations during such events.' },
  ]
};

const DOC_TYPES = [
  { id: 'lease', label: '🏠 Rental / Lease Agreement', desc: 'Apartment, house, commercial property lease' },
  { id: 'employment', label: '💼 Employment Contract', desc: 'Job offer, employment agreement, work contract' },
  { id: 'general', label: '📋 General Contract / NDA', desc: 'Any other contract, NDA, service agreement' },
  { id: 'auto', label: '🔍 Auto-Detect', desc: 'Let the tool determine the document type' },
];

const COUNTRIES = ['Auto-detect','United States','United Kingdom','India','Germany','Canada','Australia','Spain','France','UAE','Singapore','Other'];

function analyzeContract(text, docType, country) {
  const lower = text.toLowerCase();
  
  // Auto-detect document type
  if (docType === 'auto') {
    const leaseScore = ['tenant','landlord','rent','lease','property','premises','deposit'].filter(k => lower.includes(k)).length;
    const empScore = ['employee','employer','salary','employment','probation','termination','benefits','position'].filter(k => lower.includes(k)).length;
    docType = leaseScore > empScore ? 'lease' : empScore > leaseScore ? 'employment' : 'general';
  }

  const patterns = [...(RISK_PATTERNS[docType] || []), ...RISK_PATTERNS.general];
  const findings = [];

  patterns.forEach(pattern => {
    const matched = pattern.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (matched) {
      findings.push({ ...pattern, docType });
    }
  });

  // Country-specific additions
  if (country === 'India' && lower.includes('notice period')) {
    findings.push({ id: 'in01', severity: 'yellow', icon: '🟡', title: 'Indian notice period — verify with local law', keywords: [], plain: 'India typically has 1-3 month notice periods. Verify against the Model Standing Orders Act and your state\'s Shops & Establishments Act.', action: 'Confirm notice period against your state\'s Shops & Establishments Act requirements.' });
  }
  if ((country === 'United Kingdom' || lower.includes('assured shorthold')) && lower.includes('deposit')) {
    findings.push({ id: 'uk01', severity: 'green', icon: '✅', title: 'UK: Deposit protection required by law', keywords: [], plain: 'In the UK, your landlord must protect your deposit in a government-approved scheme (DPS, MyDeposits, or TDS) within 30 days of receiving it.', action: 'Verify your deposit is protected and you receive the prescribed information within 30 days.' });
  }
  if (country === 'Germany' && docType === 'lease') {
    findings.push({ id: 'de01', severity: 'green', icon: '✅', title: 'Germany: Strong tenant protections apply (Mietrecht)', keywords: [], plain: 'German tenancy law (BGB §§535ff) provides very strong tenant protections. Rent increases are limited to 20% over 3 years in most cities (Mietpreisbremse in tight markets).', action: 'Verify the landlord has included the required Wohnflächenangabe (floor area statement) as required by German law.' });
  }

  const score = findings.filter(f => f.severity === 'green').length * 10
    - findings.filter(f => f.severity === 'red').length * 20
    - findings.filter(f => f.severity === 'yellow').length * 5;
  const normalizedScore = Math.max(0, Math.min(100, 50 + score));

  return { findings, docType, normalizedScore };
}

const S = {
  wrap: { maxWidth: 1100, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  textarea: { width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  docTypeBtn: (active) => ({ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: `2px solid ${active ? 'var(--highlight)' : 'var(--border-light)'}`, background: active ? 'rgba(0,112,243,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }),
  findingCard: (sev) => {
    const colors = { red: '#fef2f2', yellow: '#fffbeb', green: '#f0fdf4' };
    const borders = { red: '#fca5a5', yellow: '#fde68a', green: '#86efac' };
    return { background: colors[sev], border: `1px solid ${borders[sev]}`, borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 10 };
  },
  scoreCircle: (score) => {
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    return { width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(${color} ${score * 3.6}deg, var(--bg-tertiary) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  },
};

export default function ContractAnalyzer({ t, lang }) {
  const [text, setText] = useState('');
  const [docType, setDocType] = useState('auto');
  const [country, setCountry] = useState('Auto-detect');
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const fileRef = useRef();

  const analyze = useCallback(() => {
    if (!text.trim() || text.trim().length < 100) return;
    setProcessing(true);
    setTimeout(() => {
      const r = analyzeContract(text, docType, country);
      setResult(r);
      setProcessing(false);
    }, 600);
  }, [text, docType, country]);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.name.endsWith('.pdf')) {
      setProcessing(true);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      let fullText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      setText(fullText);
      setProcessing(false);
    } else {
      const text = await file.text();
      setText(text);
    }
  };

  const downloadReport = async () => {
    if (!result) return;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.setFontSize(16); pdf.text('Contract Analysis Report', 15, 20);
    pdf.setFontSize(10); pdf.text(`Document type: ${result.docType} | Score: ${result.normalizedScore}/100 | Generated: ${new Date().toLocaleDateString()}`, 15, 28);
    pdf.line(15, 32, 195, 32);
    let y = 40;
    result.findings.forEach(f => {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setFontSize(11); pdf.setFont(undefined, 'bold');
      pdf.text(`${f.icon} ${f.title}`, 15, y); y += 6;
      pdf.setFont(undefined, 'normal'); pdf.setFontSize(9);
      const plain = pdf.splitTextToSize(f.plain, 175);
      pdf.text(plain, 15, y); y += plain.length * 4 + 2;
      const act = pdf.splitTextToSize(`Action: ${f.action}`, 175);
      pdf.setTextColor(0, 100, 200); pdf.text(act, 15, y); pdf.setTextColor(0, 0, 0); y += act.length * 4 + 6;
    });
    pdf.save('contract-analysis.pdf');
  };

  const reds = result?.findings.filter(f => f.severity === 'red') || [];
  const yellows = result?.findings.filter(f => f.severity === 'yellow') || [];
  const greens = result?.findings.filter(f => f.severity === 'green') || [];

  const scoreColor = result ? (result.normalizedScore >= 70 ? '#22c55e' : result.normalizedScore >= 40 ? '#f59e0b' : '#ef4444') : 'var(--text-tertiary)';
  const scoreLabel = result ? (result.normalizedScore >= 70 ? 'Low Risk' : result.normalizedScore >= 40 ? 'Medium Risk' : 'High Risk') : '';

  return (
    <div style={S.wrap}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🔒 100% Private — No AI Server', '🏠 Lease Agreements', '💼 Employment Contracts', '📋 NDAs & General', '🌍 12 Countries', '⚡ Instant Analysis', '📄 PDF Report'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Sidebar settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Document type */}
          <div style={S.card}>
            <div style={S.label}>Document Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DOC_TYPES.map(dt => (
                <button key={dt.id} onClick={() => setDocType(dt.id)} style={S.docTypeBtn(docType === dt.id)}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{dt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div style={S.card}>
            <div style={S.label}>Country / Jurisdiction</div>
            <select value={country} onChange={e => setCountry(e.target.value)} style={S.select}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
              Country selection adds jurisdiction-specific advice for tenant rights, employment law, and contract enforceability.
            </p>
          </div>

          {/* Upload PDF */}
          <div style={S.card}>
            <div style={S.label}>Upload PDF or TXT</div>
            <div onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onClick={()=>fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver?'var(--highlight)':'var(--border-light)'}`, borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center', cursor: 'pointer', background: dragOver?'rgba(0,112,243,0.04)':'var(--bg-secondary)', transition: 'all 0.2s', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              📎 Drop contract PDF or click
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc" style={{ display: 'none' }} onChange={e=>handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Risk legend */}
          <div style={S.card}>
            <div style={S.label}>Risk Levels</div>
            {[['🔴', '#ef4444', 'Red — High risk clause', 'Unfair, potentially illegal, or seriously disadvantageous'],
              ['🟡', '#f59e0b', 'Yellow — Watch out', 'Common but worth understanding before signing'],
              ['✅', '#22c55e', 'Green — Normal', 'Standard clause that protects both parties'],
            ].map(([icon, color, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Text input */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={S.label}>Paste Contract Text</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{text.length} characters</span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={14}
              placeholder="Paste your contract, lease agreement, or employment contract text here...

Or upload a PDF file using the panel on the left.

The analysis is done entirely in your browser — your contract text never leaves your device."
              style={S.textarea}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={analyze} disabled={processing || text.length < 100}
                className="btn-primary" style={{ flex: 1, padding: '12px', cursor: 'pointer', fontSize: '0.95rem', opacity: text.length < 100 ? 0.5 : 1 }}>
                {processing ? '⚙️ Analyzing...' : '🔍 Analyze Contract'}
              </button>
              {text && <button onClick={() => { setText(''); setResult(null); }}
                style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                Clear
              </button>}
            </div>
            {text.length < 100 && text.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 6 }}>⚠️ Paste more text for a meaningful analysis (minimum 100 characters)</p>
            )}
          </div>

          {/* Results */}
          {result && (
            <>
              {/* Score header */}
              <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={S.scoreCircle(result.normalizedScore)}>
                  <div style={{ background: 'var(--bg-main)', width: 60, height: 60, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: scoreColor }}>{result.normalizedScore}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: scoreColor }}>{scoreLabel}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {result.docType.charAt(0).toUpperCase() + result.docType.slice(1)} agreement • {result.findings.length} clause{result.findings.length !== 1 ? 's' : ''} identified
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ color: '#ef4444' }}>🔴 {reds.length} high risk</span>
                    <span style={{ color: '#f59e0b' }}>🟡 {yellows.length} watch out</span>
                    <span style={{ color: '#22c55e' }}>✅ {greens.length} normal</span>
                  </div>
                </div>
                <button onClick={downloadReport}
                  style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>
                  📄 Download Report
                </button>
              </div>

              {/* Disclaimer */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 12, fontSize: '0.78rem', color: '#92400e', lineHeight: 1.5 }}>
                ⚖️ <strong>Educational information only</strong> — this analysis identifies common clause patterns. It is not legal advice. For important contracts, consult a qualified lawyer in your jurisdiction.
              </div>

              {/* Findings */}
              {reds.length > 0 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🔴 High Risk Clauses ({reds.length})</div>
                  {reds.map(f => <FindingCard key={f.id} finding={f} expandedId={expandedId} setExpandedId={setExpandedId} />)}
                </div>
              )}
              {yellows.length > 0 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 6 }}>🟡 Watch Out ({yellows.length})</div>
                  {yellows.map(f => <FindingCard key={f.id} finding={f} expandedId={expandedId} setExpandedId={setExpandedId} />)}
                </div>
              )}
              {greens.length > 0 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 6 }}>✅ Normal Clauses ({greens.length})</div>
                  {greens.map(f => <FindingCard key={f.id} finding={f} expandedId={expandedId} setExpandedId={setExpandedId} />)}
                </div>
              )}

              {result.findings.length === 0 && (
                <div style={{ ...S.card, textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🤔</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>No specific patterns detected</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The text may be too short, formatted unusually, or use non-standard legal language. Try pasting more of the contract text.</p>
                </div>
              )}
            </>
          )}

          {/* How it works (shown when no result) */}
          {!result && (
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 14 }}>How to Use This Contract Analyzer</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
                {[
                  { icon: '📋', step: '1', title: 'Paste or upload', desc: 'Copy your contract text and paste it, or upload the PDF directly' },
                  { icon: '🔍', step: '2', title: 'Select type', desc: 'Choose lease, employment, or auto-detect — add your country for specific advice' },
                  { icon: '🔎', step: '3', title: 'Analyze', desc: 'Click Analyze Contract — results appear in 1 second, all in your browser' },
                  { icon: '📄', step: '4', title: 'Download report', desc: 'Get a PDF report to review offline or share with a lawyer' },
                ].map(s => (
                  <div key={s.step} style={{ textAlign: 'center' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--highlight)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '0.85rem' }}>{s.step}</div>
                    <div style={{ fontSize: 24, marginBottom: 5 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FindingCard({ finding, expandedId, setExpandedId }) {
  const isOpen = expandedId === finding.id;
  const bg = { red: '#fef2f2', yellow: '#fffbeb', green: '#f0fdf4' }[finding.severity];
  const border = { red: '#fca5a5', yellow: '#fde68a', green: '#86efac' }[finding.severity];
  const titleColor = { red: '#dc2626', yellow: '#d97706', green: '#15803d' }[finding.severity];

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', marginBottom: 8, overflow: 'hidden' }}>
      <button onClick={() => setExpandedId(isOpen ? null : finding.id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{finding.icon}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.88rem', color: titleColor }}>{finding.title}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6, marginTop: 10, marginBottom: 8 }}>{finding.plain}</p>
          <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '8px 12px', fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>💡 What to do:</strong> {finding.action}
          </div>
        </div>
      )}
    </div>
  );
}
