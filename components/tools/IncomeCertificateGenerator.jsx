'use client';
import { useState } from 'react';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'];
const PURPOSES = ['Educational Scholarship','Admission to Government College','OBC/EWS Reservation Benefit','Government Job Application','Below Poverty Line (BPL) Benefit','Welfare Scheme Enrollment','Bank Loan / Credit','Ration Card Application','Fee Concession / Waiver','Government Housing Scheme','Judicial / Legal Purpose','Other'];
const INCOME_SOURCES = ['Agriculture','Service / Employment','Business / Trade','Labour / Daily Wages','Pension','Rental Income','Other'];
const DESIGNATIONS = ['Sub-Divisional Magistrate (SDM)','Tehsildar','Revenue Officer','Block Development Officer (BDO)','District Magistrate (DM)','Mamlatdar','Village Development Officer','Executive Magistrate','Mandal Revenue Officer (MRO)'];

const S = {
  wrap: { maxWidth: 900, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 },
  preview: { background: '#fafafa', border: '2px solid #333', borderRadius: 'var(--radius-md)', padding: 28, fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#111' },
  certNo: { fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border-light)' },
};

const numberToWords = (num) => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = n => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  return convert(num) + ' Rupees Only';
};

export default function IncomeCertificateGenerator({ t, lang }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const [form, setForm] = useState({
    applicantName: '', fatherName: '', dob: '', address: '', village: '', tehsil: '', district: '', state: 'Uttar Pradesh',
    annualIncome: '', incomeSource: 'Agriculture', otherSources: '',
    purpose: 'Educational Scholarship', otherPurpose: '',
    certNo: `INC/${new Date().getFullYear()}/${Math.floor(Math.random() * 90000 + 10000)}`,
    issueDate: today, validUpto: '',
    officerName: '', officerDesignation: 'Sub-Divisional Magistrate (SDM)', officerOffice: '',
    financialYear: `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const income = parseInt(form.annualIncome.replace(/,/g, '')) || 0;
  const incomeWords = income > 0 ? numberToWords(income) : '___________';
  const purpose = form.purpose === 'Other' ? form.otherPurpose : form.purpose;

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const el = document.getElementById('income-cert-preview');
    if (!el) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pW = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pW, (canvas.height * pW) / canvas.width);
    pdf.save(`Income-Certificate-${form.applicantName || 'certificate'}.pdf`);
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🆓 Free & Instant', '🏛️ All States', '📄 PDF Download', '💰 Amount in Words', '🔒 100% Private'].map(b => <span key={b} style={S.badge}>{b}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Personal Details */}
          <div style={S.card}>
            <div style={S.sectionTitle}>👤 Applicant Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Full Name *</label><input value={form.applicantName} onChange={e => set('applicantName', e.target.value)} placeholder="Ramesh Kumar" style={S.input} /></div>
                <div><label style={S.label}>Father's / Husband's Name *</label><input value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="Suresh Kumar" style={S.input} /></div>
                <div><label style={S.label}>Date of Birth</label><input value={form.dob} onChange={e => set('dob', e.target.value)} placeholder="01/01/1990" style={S.input} /></div>
                <div><label style={S.label}>Village / Town *</label><input value={form.village} onChange={e => set('village', e.target.value)} placeholder="Village Rampur" style={S.input} /></div>
                <div><label style={S.label}>Tehsil / Taluka</label><input value={form.tehsil} onChange={e => set('tehsil', e.target.value)} placeholder="Rampur Tehsil" style={S.input} /></div>
                <div><label style={S.label}>District *</label><input value={form.district} onChange={e => set('district', e.target.value)} placeholder="Lucknow" style={S.input} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>State</label><select value={form.state} onChange={e => set('state', e.target.value)} style={S.select}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
          </div>

          {/* Income Details */}
          <div style={S.card}>
            <div style={S.sectionTitle}>💰 Income Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.grid2}>
                <div><label style={S.label}>Annual Income (₹) *</label><input value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} placeholder="120000" style={S.input} /></div>
                <div><label style={S.label}>Financial Year</label><input value={form.financialYear} onChange={e => set('financialYear', e.target.value)} placeholder="2024-25" style={S.input} /></div>
                <div><label style={S.label}>Primary Source</label><select value={form.incomeSource} onChange={e => set('incomeSource', e.target.value)} style={S.select}>{INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={S.label}>Other Sources (if any)</label><input value={form.otherSources} onChange={e => set('otherSources', e.target.value)} placeholder="e.g. ₹20,000 from rental" style={S.input} /></div>
              </div>
              {income > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.82rem', color: '#15803d' }}>
                  💰 Amount in words: <strong>{incomeWords}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Purpose & Authority */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📋 Purpose & Issuing Authority</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={S.label}>Purpose of Certificate</label><select value={form.purpose} onChange={e => set('purpose', e.target.value)} style={S.select}>{PURPOSES.map(p => <option key={p}>{p}</option>)}</select></div>
              {form.purpose === 'Other' && <div><label style={S.label}>Specify Purpose</label><input value={form.otherPurpose} onChange={e => set('otherPurpose', e.target.value)} placeholder="Specify..." style={S.input} /></div>}
              <div style={S.grid2}>
                <div><label style={S.label}>Officer Name</label><input value={form.officerName} onChange={e => set('officerName', e.target.value)} placeholder="Shri Rajesh Kumar" style={S.input} /></div>
                <div><label style={S.label}>Designation</label><select value={form.officerDesignation} onChange={e => set('officerDesignation', e.target.value)} style={S.select}>{DESIGNATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Office Address</label><input value={form.officerOffice} onChange={e => set('officerOffice', e.target.value)} placeholder="Office of Sub-Divisional Magistrate, Lucknow" style={S.input} /></div>
                <div><label style={S.label}>Certificate No.</label><span style={S.certNo}>{form.certNo}</span></div>
                <div><label style={S.label}>Valid Upto</label><input value={form.validUpto} onChange={e => set('validUpto', e.target.value)} placeholder="31/03/2027" style={S.input} /></div>
              </div>
            </div>
          </div>

          <button onClick={downloadPDF} style={{ width: '100%', padding: '13px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            ⬇️ Download Income Certificate PDF
          </button>
        </div>

        {/* Live Certificate Preview */}
        <div>
          <div style={S.label}>Live Certificate Preview</div>
          <div id="income-cert-preview" style={S.preview}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#555' }}>Government of {form.state || '____________'}</div>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>Office of the {form.officerDesignation}</div>
              {form.officerOffice && <div style={{ fontSize: '0.75rem', color: '#555' }}>{form.officerOffice}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 12, borderBottom: '1px solid #ccc', paddingBottom: 8 }}>
              <span><strong>Certificate No:</strong> {form.certNo}</span>
              <span><strong>Date:</strong> {form.issueDate}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 800, marginBottom: 16, textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: 1 }}>
              INCOME CERTIFICATE
            </div>
            <p style={{ textAlign: 'justify', fontSize: '0.88rem', lineHeight: 2 }}>
              This is to certify that <strong>{form.applicantName || '________________'}</strong>{' '}
              Son/Daughter/Wife of <strong>{form.fatherName || '________________'}</strong>,{' '}
              Resident of Village/Town <strong>{form.village || '________________'}</strong>,{' '}
              Tehsil <strong>{form.tehsil || '________________'}</strong>,{' '}
              District <strong>{form.district || '________________'}</strong>,{' '}
              State <strong>{form.state}</strong>,{' '}
              has a total annual income of <strong>₹{form.annualIncome || '___________'} ({incomeWords})</strong>{' '}
              from all sources including {form.incomeSource.toLowerCase()}{form.otherSources ? ' and ' + form.otherSources : ''} for the Financial Year <strong>{form.financialYear}</strong>.
            </p>
            <p style={{ fontSize: '0.88rem', lineHeight: 2, marginTop: 10 }}>
              This certificate is issued for the purpose of <strong>{purpose || '________________'}</strong> and is valid {form.validUpto ? `up to ${form.validUpto}` : 'for one year from the date of issue'}.
            </p>
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', width: 180, marginBottom: 4 }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{form.officerName || '________________'}</div>
                <div style={{ fontSize: '0.75rem' }}>{form.officerDesignation}</div>
                {form.officerOffice && <div style={{ fontSize: '0.72rem', color: '#555' }}>{form.officerOffice}</div>}
                <div style={{ fontSize: '0.72rem', marginTop: 4 }}>(Seal &amp; Signature)</div>
              </div>
            </div>
            <div style={{ marginTop: 20, fontSize: '0.72rem', color: '#888', borderTop: '1px solid #ddd', paddingTop: 8 }}>
              Note: This certificate is subject to verification. Any false declaration is punishable under Indian Penal Code.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 14 }}>
        {[
          { icon: '📄', title: 'Official Format', desc: 'Standard income certificate format accepted across all states and government offices' },
          { icon: '💰', title: 'Amount in Words', desc: 'Automatically converts amount to words — mandatory for official certificates' },
          { icon: '🏛️', title: 'All States', desc: 'Format applicable across all Indian states — Tehsildar, SDM, BDO formats' },
          { icon: '🔒', title: '100% Private', desc: 'Your personal and income data never leaves your browser' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 5 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
