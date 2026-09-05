'use client';
import { useState } from 'react';

const STATES_STAMP = {
  'Maharashtra': { rate: 0.25, max: 500, regFee: 1000 },
  'Delhi': { rate: 2, max: 50, regFee: 1100 },
  'Karnataka': { rate: 0.5, max: 500, regFee: 500 },
  'Tamil Nadu': { rate: 1, max: 20000, regFee: 1000 },
  'Uttar Pradesh': { rate: 4, max: 200, regFee: 1100 },
  'Rajasthan': { rate: 1, max: 500, regFee: 1000 },
  'Gujarat': { rate: 1.5, max: 10000, regFee: 500 },
  'West Bengal': { rate: 1, max: 100, regFee: 1000 },
  'Telangana': { rate: 0.5, max: 20000, regFee: 1000 },
  'Andhra Pradesh': { rate: 0.5, max: 20000, regFee: 1000 },
  'Punjab': { rate: 2, max: 500, regFee: 1100 },
  'Haryana': { rate: 3, max: 1000, regFee: 1100 },
  'Madhya Pradesh': { rate: 4, max: 20000, regFee: 500 },
  'Bihar': { rate: 1.5, max: 10000, regFee: 1000 },
  'Other': { rate: 1, max: 1000, regFee: 1000 },
};

const CLAUSES = [
  { id: 'maintenance', label: 'Maintenance clause — tenant responsible for minor repairs below ₹500' },
  { id: 'sublet', label: 'No subletting — tenant cannot sublet without written consent' },
  { id: 'pet', label: 'No pets allowed on the premises' },
  { id: 'alteration', label: 'No structural alterations without written permission' },
  { id: 'notice', label: '1-month notice period by either party before vacating' },
  { id: 'visitors', label: 'No guests staying for more than 7 continuous days without informing landlord' },
  { id: 'lockChange', label: 'Tenant not to change locks without landlord consent' },
  { id: 'earlyExit', label: 'Lock-in period of 6 months — early exit penalty of 1-month rent' },
];

const S = {
  wrap: { maxWidth: 960, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid var(--border-light)' },
  statBox: { background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'center' },
  preview: { background: '#fafafa', border: '2px solid #222', borderRadius: 'var(--radius-md)', padding: 24, fontFamily: 'Georgia, serif', fontSize: '0.82rem', lineHeight: 1.85, color: '#111', maxHeight: 600, overflowY: 'auto' },
};

const numberToWords = (n) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const c = n => n < 20 ? a[n] : n < 100 ? b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'') : n < 1000 ? a[Math.floor(n/100)]+' Hundred'+(n%100?' '+c(n%100):'') : n < 100000 ? c(Math.floor(n/1000))+' Thousand'+(n%1000?' '+c(n%1000):'') : c(Math.floor(n/100000))+' Lakh'+(n%100000?' '+c(n%100000):'');
  return n > 0 ? c(n) + ' Rupees Only' : '';
};

export default function RentAgreementGenerator({ t, lang }) {
  const today = new Date();
  const endDate = new Date(today); endDate.setMonth(endDate.getMonth() + 11);
  const fmt = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const [form, setForm] = useState({
    landlordName: '', landlordFather: '', landlordAddress: '', landlordPhone: '', landlordAadhaar: '',
    tenantName: '', tenantFather: '', tenantAddress: '', tenantPhone: '', tenantAadhaar: '',
    propertyAddress: '', propertyType: 'Residential Flat', bhk: '2 BHK',
    monthlyRent: '', deposit: '', maintenanceCharges: '0',
    startDate: fmt(today), endDate: fmt(endDate), duration: '11',
    state: 'Maharashtra', city: '',
    selectedClauses: CLAUSES.map(c => c.id),
    customClause: '',
    witness1Name: '', witness1Address: '',
    witness2Name: '', witness2Address: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleClause = (id) => setForm(f => ({ ...f, selectedClauses: f.selectedClauses.includes(id) ? f.selectedClauses.filter(x => x !== id) : [...f.selectedClauses, id] }));

  const rent = parseInt(form.monthlyRent) || 0;
  const deposit = parseInt(form.deposit) || 0;
  const stampInfo = STATES_STAMP[form.state] || STATES_STAMP['Other'];
  const totalRentForStamp = rent * parseInt(form.duration || 11);
  const stampDuty = Math.min(Math.round(totalRentForStamp * stampInfo.rate / 100), stampInfo.max);

  const generateText = () => {
    const clauses = form.selectedClauses.map(id => CLAUSES.find(c => c.id === id)?.label).filter(Boolean);
    return `RENT AGREEMENT
(For Residential/Commercial Premises)

This Rent Agreement is executed on ${form.startDate} at ${form.city || form.state}.

PARTIES:

LANDLORD:
Name: ${form.landlordName || '______________'}
S/o, D/o, W/o: ${form.landlordFather || '______________'}
Address: ${form.landlordAddress || '______________'}
Phone: ${form.landlordPhone || '______________'}
Aadhaar No.: ${form.landlordAadhaar ? 'XXXX XXXX ' + form.landlordAadhaar.slice(-4) : '____'}
(Hereinafter called "The Landlord")

TENANT:
Name: ${form.tenantName || '______________'}
S/o, D/o, W/o: ${form.tenantFather || '______________'}
Current Address: ${form.tenantAddress || '______________'}
Phone: ${form.tenantPhone || '______________'}
Aadhaar No.: ${form.tenantAadhaar ? 'XXXX XXXX ' + form.tenantAadhaar.slice(-4) : '____'}
(Hereinafter called "The Tenant")

PROPERTY DETAILS:
Property: ${form.propertyType} — ${form.bhk}
Address: ${form.propertyAddress || '______________'}

TERMS AND CONDITIONS:

1. DURATION: This agreement is for ${form.duration} months commencing from ${form.startDate} to ${form.endDate}. After expiry, it shall be renewed by mutual consent.

2. RENT: The monthly rent is ₹${form.monthlyRent || '__________'} (${rent > 0 ? numberToWords(rent) : '___________'}), payable on or before the 7th of each month.

3. SECURITY DEPOSIT: The Tenant has paid a refundable security deposit of ₹${form.deposit || '__________'} (${deposit > 0 ? numberToWords(deposit) : '___________'}) to the Landlord. This shall be refunded within 30 days of vacating, subject to deductions for damages.

${form.maintenanceCharges !== '0' && form.maintenanceCharges ? `4. MAINTENANCE: Monthly maintenance charges of ₹${form.maintenanceCharges} shall be paid by the Tenant in addition to rent.\n\n` : ''}${clauses.map((c, i) => `${(form.maintenanceCharges !== '0' ? 5 : 4) + i}. ${c.toUpperCase().charAt(0) + c.slice(1)}.`).join('\n\n')}

${form.customClause ? `SPECIAL CLAUSE: ${form.customClause}` : ''}

UTILITIES: The Tenant shall pay all electricity, water, gas, and other utility bills directly to the respective authorities.

JURISDICTION: Any disputes shall be settled under the jurisdiction of courts in ${form.city || form.state}.

SIGNATURES:

Landlord: ____________________        Tenant: ____________________
${form.landlordName || '(Landlord Name)'}                    ${form.tenantName || '(Tenant Name)'}
Date: _________________               Date: _________________

WITNESSES:

1. Name: ${form.witness1Name || '____________________'}
   Address: ${form.witness1Address || '____________________'}
   Signature: ____________________

2. Name: ${form.witness2Name || '____________________'}
   Address: ${form.witness2Address || '____________________'}
   Signature: ____________________

(This agreement should be executed on stamp paper of appropriate value as per ${form.state} Stamp Act)`;
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(generateText(), 180);
    let y = 15;
    lines.forEach(line => { if (y > 277) { pdf.addPage(); y = 15; } pdf.text(line, 15, y); y += 5.5; });
    pdf.save(`Rent-Agreement-${form.tenantName || 'tenant'}.pdf`);
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🆓 Free PDF', '🏠 11-Month Format', '📊 Stamp Duty Calculator', '🔒 100% Private', '⚡ Instant'].map(b => <span key={b} style={S.badge}>{b}</span>)}
      </div>

      {/* Stamp duty alert */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6 }}>
        <strong>💡 Why 11 months?</strong> Rental agreements up to 11 months in India are typically not required to be registered (varies by state), saving registration costs. Agreements of 12 months or more require mandatory registration under the Registration Act, 1908.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Form Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Landlord */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏠 Landlord Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Full Name *</label><input value={form.landlordName} onChange={e => set('landlordName', e.target.value)} placeholder="Suresh Kumar Sharma" style={S.input} /></div>
                <div><label style={S.label}>Father's / Husband's Name</label><input value={form.landlordFather} onChange={e => set('landlordFather', e.target.value)} placeholder="Mahesh Kumar" style={S.input} /></div>
                <div><label style={S.label}>Phone</label><input value={form.landlordPhone} onChange={e => set('landlordPhone', e.target.value)} placeholder="+91 98765 43210" style={S.input} /></div>
                <div><label style={S.label}>Aadhaar (last 4 digits)</label><input value={form.landlordAadhaar} onChange={e => set('landlordAadhaar', e.target.value)} placeholder="1234" maxLength={12} style={S.input} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Address</label><input value={form.landlordAddress} onChange={e => set('landlordAddress', e.target.value)} placeholder="Permanent address" style={S.input} /></div>
              </div>
            </div>
          </div>

          {/* Tenant */}
          <div style={S.card}>
            <div style={S.sectionTitle}>👤 Tenant Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Full Name *</label><input value={form.tenantName} onChange={e => set('tenantName', e.target.value)} placeholder="Rajesh Verma" style={S.input} /></div>
                <div><label style={S.label}>Father's / Husband's Name</label><input value={form.tenantFather} onChange={e => set('tenantFather', e.target.value)} placeholder="Suresh Verma" style={S.input} /></div>
                <div><label style={S.label}>Phone</label><input value={form.tenantPhone} onChange={e => set('tenantPhone', e.target.value)} placeholder="+91 87654 32109" style={S.input} /></div>
                <div><label style={S.label}>Aadhaar (last 4 digits)</label><input value={form.tenantAadhaar} onChange={e => set('tenantAadhaar', e.target.value)} placeholder="5678" maxLength={12} style={S.input} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Current Address</label><input value={form.tenantAddress} onChange={e => set('tenantAddress', e.target.value)} placeholder="Current residential address" style={S.input} /></div>
              </div>
            </div>
          </div>

          {/* Property + Terms */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏗️ Property &amp; Rent Terms</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={S.label}>Property Address *</label><input value={form.propertyAddress} onChange={e => set('propertyAddress', e.target.value)} placeholder="Flat No. 302, Building Name, Street, City" style={S.input} /></div>
              <div style={S.grid2}>
                <div><label style={S.label}>Property Type</label><select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} style={S.select}>{['Residential Flat','House / Bungalow','Commercial Shop','Office Space','PG Room','Warehouse'].map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label style={S.label}>BHK / Size</label><select value={form.bhk} onChange={e => set('bhk', e.target.value)} style={S.select}>{['1 RK','1 BHK','2 BHK','3 BHK','4 BHK','Entire Floor','Single Room'].map(b => <option key={b}>{b}</option>)}</select></div>
                <div><label style={S.label}>Monthly Rent (₹) *</label><input value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)} placeholder="15000" style={S.input} /></div>
                <div><label style={S.label}>Security Deposit (₹)</label><input value={form.deposit} onChange={e => set('deposit', e.target.value)} placeholder="45000" style={S.input} /></div>
                <div><label style={S.label}>Maintenance (₹/month)</label><input value={form.maintenanceCharges} onChange={e => set('maintenanceCharges', e.target.value)} placeholder="0" style={S.input} /></div>
                <div><label style={S.label}>Duration (months)</label><input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="11" style={S.input} /></div>
                <div><label style={S.label}>Start Date</label><input value={form.startDate} onChange={e => set('startDate', e.target.value)} placeholder="01 June 2026" style={S.input} /></div>
                <div><label style={S.label}>State</label><select value={form.state} onChange={e => set('state', e.target.value)} style={S.select}>{Object.keys(STATES_STAMP).map(s => <option key={s}>{s}</option>)}</select></div>
              </div>

              {/* Stamp duty box */}
              {rent > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, textAlign: 'center' }}>
                  <div><div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Approx. Stamp Duty</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#15803d' }}>₹{stampDuty.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Registration Fee</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#15803d' }}>₹{stampInfo.regFee.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Total Cost</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#15803d' }}>₹{(stampDuty + stampInfo.regFee).toLocaleString()}</div></div>
                </div>
              )}
            </div>
          </div>

          {/* Clauses */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📋 Agreement Clauses</div>
            {CLAUSES.map(c => (
              <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 8px', borderRadius: 'var(--radius-sm)', marginBottom: 5, cursor: 'pointer', background: form.selectedClauses.includes(c.id) ? '#f0fdf4' : 'var(--bg-secondary)', border: `1px solid ${form.selectedClauses.includes(c.id) ? '#86efac' : 'var(--border-light)'}` }}>
                <input type="checkbox" checked={form.selectedClauses.includes(c.id)} onChange={() => toggleClause(c.id)} style={{ accentColor: '#16a34a', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{c.label}</span>
              </label>
            ))}
            <div style={{ marginTop: 8 }}>
              <label style={S.label}>Custom Clause</label>
              <input value={form.customClause} onChange={e => set('customClause', e.target.value)} placeholder="Add any special condition..." style={S.input} />
            </div>
          </div>

          {/* Witnesses */}
          <div style={S.card}>
            <div style={S.sectionTitle}>👥 Witnesses</div>
            <div style={S.grid2}>
              <div><label style={S.label}>Witness 1 Name</label><input value={form.witness1Name} onChange={e => set('witness1Name', e.target.value)} placeholder="Witness name" style={S.input} /></div>
              <div><label style={S.label}>Witness 1 Address</label><input value={form.witness1Address} onChange={e => set('witness1Address', e.target.value)} placeholder="Address" style={S.input} /></div>
              <div><label style={S.label}>Witness 2 Name</label><input value={form.witness2Name} onChange={e => set('witness2Name', e.target.value)} placeholder="Witness name" style={S.input} /></div>
              <div><label style={S.label}>Witness 2 Address</label><input value={form.witness2Address} onChange={e => set('witness2Address', e.target.value)} placeholder="Address" style={S.input} /></div>
            </div>
          </div>

          <button onClick={downloadPDF} style={{ width: '100%', padding: '13px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            ⬇️ Download Rent Agreement PDF
          </button>
        </div>

        {/* Preview */}
        <div>
          <div style={S.label}>Live Agreement Preview</div>
          <div style={S.preview}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '0.8rem', lineHeight: 1.85, margin: 0 }}>{generateText()}</pre>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => navigator.clipboard.writeText(generateText())}
              style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
              📋 Copy Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
