'use client';
import { useState } from 'react';

const REASONS = [
  { code: '01', label: 'Retirement on attaining age of 58 years' },
  { code: '02', label: 'Retirement on account of permanent and total incapacity' },
  { code: '03', label: 'Termination of service' },
  { code: '04', label: 'Migration from India for permanent settlement abroad' },
  { code: '05', label: 'Female member going out of employment on marriage' },
  { code: '06', label: 'Cessation of employment due to restructuring/winding up' },
  { code: '07', label: 'After 2 months from date of leaving service (unemployed)' },
];

const BANKS = ['State Bank of India','Punjab National Bank','Bank of Baroda','Canara Bank','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank','Union Bank of India','Bank of India','Indian Bank','Central Bank of India','UCO Bank','Indian Overseas Bank','Other'];

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'];

const S = {
  wrap: { maxWidth: 900, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 },
  formBox: { background: '#fff', border: '2px solid #333', borderRadius: 'var(--radius-md)', padding: 24, fontFamily: '"Courier New", monospace', fontSize: '0.82rem', lineHeight: 1.9, color: '#000' },
  radioRow: (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? '#2563eb' : 'var(--border-light)'}`, marginBottom: 5, cursor: 'pointer', background: active ? 'rgba(37,99,235,0.06)' : 'var(--bg-secondary)' }),
};

function FormField({ label, value, width = '80%' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ color: '#555', fontSize: '0.75rem' }}>{label}</span>
      <div style={{ borderBottom: '1px solid #333', width, minHeight: 22, paddingLeft: 4, fontSize: '0.85rem', fontWeight: 500 }}>{value || ''}</div>
    </div>
  );
}

export default function PfWithdrawalForm19({ t, lang }) {
  const [form, setForm] = useState({
    // Personal
    memberName: '', dob: '', sex: 'Male', fatherSpouseName: '',
    address: '', city: '', state: 'Maharashtra', pin: '',
    mobile: '', email: '', aadhar: '', pan: '',
    // PF Account
    uan: '', pfAccountNo: '', establishmentName: '', establishmentAddress: '',
    pfOfficeName: '', dateOfJoining: '', dateOfLeaving: '',
    // Reason
    reason: '07',
    // Bank
    bankName: 'State Bank of India', accountNo: '', ifsc: '', accountType: 'Savings',
    // Advance
    advanceType: 'none',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const el = document.getElementById('pf-form-preview');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff' });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pW, (canvas.height * pW) / canvas.width);
    pdf.save(`PF-Form-19-${form.memberName || 'withdrawal'}.pdf`);
  };

  const selectedReason = REASONS.find(r => r.code === form.reason);

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🆓 Free & Instant', '🏦 EPF Form 19', '📄 PDF Download', '📋 Full Form Format', '🔒 100% Private'].map(b => <span key={b} style={S.badge}>{b}</span>)}
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16, fontSize: '0.83rem', color: '#92400e', lineHeight: 1.6 }}>
        <strong>📋 Form 19 — EPF Final Settlement:</strong> This form is used to claim your entire Provident Fund balance after leaving employment. You need your UAN (Universal Account Number) and the reason for leaving. TDS @ 10% applies if total PF balance &gt; ₹50,000 and service &lt; 5 years (30% without PAN).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Form inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Personal Details */}
          <div style={S.card}>
            <div style={S.sectionTitle}>👤 Personal Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Full Name (as in PF records) *</label><input value={form.memberName} onChange={e => set('memberName', e.target.value)} placeholder="RAMESH KUMAR SHARMA" style={{ ...S.input, textTransform: 'uppercase' }} /></div>
                <div><label style={S.label}>Date of Birth</label><input value={form.dob} onChange={e => set('dob', e.target.value)} placeholder="DD/MM/YYYY" style={S.input} /></div>
                <div><label style={S.label}>Sex</label><select value={form.sex} onChange={e => set('sex', e.target.value)} style={S.select}>{['Male', 'Female', 'Other'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={S.label}>Father's / Spouse's Name</label><input value={form.fatherSpouseName} onChange={e => set('fatherSpouseName', e.target.value)} placeholder="SURESH KUMAR" style={{ ...S.input, textTransform: 'uppercase' }} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Address *</label><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House/Flat No., Street, Area" style={S.input} /></div>
                <div><label style={S.label}>City</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" style={S.input} /></div>
                <div><label style={S.label}>State</label><select value={form.state} onChange={e => set('state', e.target.value)} style={S.select}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={S.label}>PIN Code</label><input value={form.pin} onChange={e => set('pin', e.target.value)} placeholder="400001" maxLength={6} style={S.input} /></div>
                <div><label style={S.label}>Mobile Number *</label><input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 98765 43210" style={S.input} /></div>
                <div><label style={S.label}>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" style={S.input} /></div>
                <div><label style={S.label}>Aadhaar Number *</label><input value={form.aadhar} onChange={e => set('aadhar', e.target.value)} placeholder="1234 5678 9012" maxLength={14} style={S.input} /></div>
                <div><label style={S.label}>PAN Number</label><input value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} style={{ ...S.input, textTransform: 'uppercase' }} /></div>
              </div>
            </div>
          </div>

          {/* PF Account Details */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏛️ PF Account &amp; Employment Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>UAN (Universal Account Number) *</label><input value={form.uan} onChange={e => set('uan', e.target.value)} placeholder="100XXXXXXXXX" maxLength={12} style={S.input} /></div>
                <div><label style={S.label}>PF Account Number</label><input value={form.pfAccountNo} onChange={e => set('pfAccountNo', e.target.value)} placeholder="MH/BOM/12345/000/1234567" style={S.input} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Establishment / Employer Name</label><input value={form.establishmentName} onChange={e => set('establishmentName', e.target.value)} placeholder="ABC Technologies Private Limited" style={S.input} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Establishment Address</label><input value={form.establishmentAddress} onChange={e => set('establishmentAddress', e.target.value)} placeholder="Office address of last employer" style={S.input} /></div>
                <div><label style={S.label}>Date of Joining</label><input value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} placeholder="DD/MM/YYYY" style={S.input} /></div>
                <div><label style={S.label}>Date of Leaving *</label><input value={form.dateOfLeaving} onChange={e => set('dateOfLeaving', e.target.value)} placeholder="DD/MM/YYYY" style={S.input} /></div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📋 Reason for Leaving</div>
            {REASONS.map(r => (
              <label key={r.code} style={S.radioRow(form.reason === r.code)} onClick={() => set('reason', r.code)}>
                <input type="radio" checked={form.reason === r.code} onChange={() => set('reason', r.code)} style={{ accentColor: '#2563eb', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem' }}><strong>{r.code}.</strong> {r.label}</span>
              </label>
            ))}
          </div>

          {/* Bank Details */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏦 Bank Account Details (for NEFT)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Bank Name *</label><select value={form.bankName} onChange={e => set('bankName', e.target.value)} style={S.select}>{BANKS.map(b => <option key={b}>{b}</option>)}</select></div>
                <div><label style={S.label}>Account Type</label><select value={form.accountType} onChange={e => set('accountType', e.target.value)} style={S.select}>{['Savings', 'Current', 'Jan Dhan'].map(a => <option key={a}>{a}</option>)}</select></div>
                <div><label style={S.label}>Account Number *</label><input value={form.accountNo} onChange={e => set('accountNo', e.target.value)} placeholder="1234567890" style={S.input} /></div>
                <div><label style={S.label}>IFSC Code *</label><input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} placeholder="SBIN0001234" maxLength={11} style={{ ...S.input, textTransform: 'uppercase' }} /></div>
              </div>
              {form.ifsc.length === 11 && (
                <div style={{ fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                  ✅ IFSC format valid — Bank: {form.ifsc.slice(0, 4)} | Branch code: {form.ifsc.slice(5)}
                </div>
              )}
            </div>
          </div>

          <button onClick={downloadPDF} style={{ width: '100%', padding: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            ⬇️ Download Form 19 PDF
          </button>
        </div>

        {/* Form Preview */}
        <div>
          <div style={S.label}>Form 19 Preview</div>
          <div id="pf-form-preview" style={S.formBox}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: 2, fontFamily: 'Arial, sans-serif' }}>EMPLOYEES' PROVIDENT FUND ORGANISATION</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 4, textDecoration: 'underline' }}>FORM - 19</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>[Para 72 of E.P.F. Scheme, 1952]</div>
              <div style={{ fontSize: '0.72rem', color: '#444', marginTop: 2 }}>(Application for Final Settlement)</div>
            </div>
            <div style={{ borderBottom: '1px solid #ccc', marginBottom: 12 }} />
            <FormField label="1. Name of Member:" value={form.memberName} />
            <FormField label="2. Father's / Husband's Name:" value={form.fatherSpouseName} />
            <FormField label="3. Date of Birth:" value={form.dob} width="40%" />
            <FormField label="4. Sex:" value={form.sex} width="30%" />
            <FormField label="5. UAN:" value={form.uan} width="50%" />
            <FormField label="6. PF Account No.:" value={form.pfAccountNo} />
            <FormField label="7. Establishment Name:" value={form.establishmentName} />
            <FormField label="8. Date of Joining:" value={form.dateOfJoining} width="40%" />
            <FormField label="9. Date of Leaving:" value={form.dateOfLeaving} width="40%" />
            <FormField label="10. Reason for Leaving:" value={selectedReason ? `${selectedReason.code} - ${selectedReason.label}` : ''} />
            <div style={{ borderBottom: '1px solid #ccc', margin: '12px 0' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>BANK DETAILS FOR NEFT:</div>
            <FormField label="Bank Name:" value={form.bankName} />
            <FormField label="Account No.:" value={form.accountNo} width="60%" />
            <FormField label="IFSC Code:" value={form.ifsc} width="40%" />
            <FormField label="Account Type:" value={form.accountType} width="35%" />
            <div style={{ borderBottom: '1px solid #ccc', margin: '12px 0' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>KYC DETAILS:</div>
            <FormField label="Aadhaar Number:" value={form.aadhar ? `XXXX XXXX ${form.aadhar.slice(-4)}` : ''} width="50%" />
            <FormField label="PAN:" value={form.pan} width="35%" />
            <div style={{ marginTop: 20, fontSize: '0.75rem', fontStyle: 'italic', color: '#555', lineHeight: 1.6 }}>
              I hereby declare that the information given above is true to the best of my knowledge and I am entitled to claim EPF under Para 72(1) of the EPF Scheme, 1952.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <div>
                <div style={{ borderTop: '1px solid #333', width: 140, marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem' }}>Signature / Thumb Impression of Member</div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #333', width: 140, marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem' }}>Signature &amp; Seal of Employer</div>
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: '0.68rem', color: '#888', borderTop: '1px solid #ddd', paddingTop: 8 }}>
              Address: {form.address}{form.city ? ', ' + form.city : ''}{form.state ? ', ' + form.state : ''}{form.pin ? ' - ' + form.pin : ''}
            </div>
          </div>

          {/* TDS Note */}
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: 14, marginTop: 12, fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.6 }}>
            <strong>⚠️ TDS on PF Withdrawal:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
              <li>Service &lt; 5 years + PF &gt; ₹50,000: TDS @ 10% (with PAN) or 30% (without PAN)</li>
              <li>Service ≥ 5 years: No TDS</li>
              <li>Medical incapacity, employer shutdown: No TDS regardless</li>
              <li>Submit Form 15G/15H if income below taxable limit to avoid TDS</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 14 }}>
        {[
          { icon: '📱', title: 'UAN Mandatory', desc: 'UAN must be activated and linked to Aadhaar, PAN and bank account before filing' },
          { icon: '⏰', title: '20 Working Days', desc: 'EPFO processes Form 19 within 20 working days of submission' },
          { icon: '💻', title: 'Online Option', desc: 'You can also file online at epfindia.gov.in if UAN is KYC-verified' },
          { icon: '🔒', title: '100% Private', desc: 'Your PF and bank details never leave your browser' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.83rem', marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
