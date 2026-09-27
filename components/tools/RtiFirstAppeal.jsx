'use client';
import { useState } from 'react';

const APPEAL_GROUNDS = [
  'The PIO failed to reply within 30 days as mandated under Section 7(1) of the RTI Act, 2005.',
  'The information provided was incomplete and did not address all the questions asked.',
  'The information provided was incorrect and misleading.',
  'The PIO rejected the application without valid grounds under Section 8 or 9.',
  'The PIO demanded excess fee beyond what is prescribed under the RTI Rules.',
  'The PIO failed to provide information in the requested format under Section 7(9).',
  'The PIO transferred the application incorrectly under Section 6(3).',
  'The information was denied on wrong grounds citing third-party information under Section 11.',
];

const MINISTRIES = [
  'Ministry of Finance', 'Ministry of Home Affairs', 'Ministry of Education',
  'Ministry of Health and Family Welfare', 'Ministry of Agriculture',
  'Ministry of Railways (Railway Board)', 'Ministry of Rural Development',
  'Ministry of Tribal Affairs', 'Ministry of Women and Child Development',
  'Central Board of Direct Taxes (CBDT)', 'Central Board of Indirect Taxes (CBIC)',
  'Department of Posts', 'EPFO (Employees Provident Fund Organisation)',
  'ESIC (Employees State Insurance Corporation)', 'UIDAI (Aadhaar)',
  'State Government (specify below)',
];

const RELIEF_OPTIONS = [
  'Supply the information asked in my original RTI application immediately.',
  'Provide complete and correct information as originally requested.',
  'Waive the excess fee demanded and provide the information.',
  'Provide information in the requested format.',
  'Impose penalty on the PIO under Section 20 of the RTI Act for no valid reason for delay/denial.',
  'Award compensation for the detriment suffered due to denial of information.',
];

const S = {
  wrap: { maxWidth: 900, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: 6, cursor: 'pointer', background: 'var(--bg-secondary)' },
  previewBox: { background: '#f8f8f4', border: '2px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: 24, fontFamily: 'Georgia, serif', fontSize: '0.88rem', lineHeight: 1.8, color: '#111', marginBottom: 14 },
};

function Field({ label, value, onChange, placeholder, type = 'text', cols }) {
  return (
    <div style={cols === 2 ? { gridColumn: '1/-1' } : {}}>
      <label style={S.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={S.input} />
    </div>
  );
}

export default function RtiFirstAppeal({ t, lang }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    appellantName: '', appellantAddress: '', appellantPhone: '', appellantEmail: '',
    authority: '', pioName: '', pioDesignation: '', originalDate: '', registrationNo: '',
    originalSubject: '', originalQuestions: '',
    grounds: [], customGround: '',
    reliefSought: [], customRelief: '',
    appealDate: new Date().toLocaleDateString('en-IN'),
    faaName: '', faaDesignation: '',
    declaration: true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] }));

  const generateText = () => {
    const grounds = [...form.grounds, form.customGround].filter(Boolean);
    const relief = [...form.reliefSought, form.customRelief].filter(Boolean);
    return `
To,
${form.faaName || 'The First Appellate Authority'},
${form.faaDesignation || ''},
${form.authority}

Subject: First Appeal under Section 19(1) of the Right to Information Act, 2005

Respected Sir/Madam,

I, ${form.appellantName}, residing at ${form.appellantAddress}, hereby file this First Appeal under Section 19(1) of the Right to Information Act, 2005, against the Public Information Officer (PIO), ${form.authority}.

1. DETAILS OF ORIGINAL RTI APPLICATION:
   Date of Original Application: ${form.originalDate}
   Registration/Acknowledgement No.: ${form.registrationNo}
   Subject of Information Sought: ${form.originalSubject}

2. INFORMATION/QUESTIONS ASKED:
${form.originalQuestions}

3. GROUNDS OF APPEAL:
${grounds.map((g, i) => `   ${i + 1}. ${g}`).join('\n')}

4. RELIEF SOUGHT:
   The Appellant respectfully prays that this Hon'ble First Appellate Authority may be pleased to:
${relief.map((r, i) => `   ${i + 1}. ${r}`).join('\n')}

5. DECLARATION:
   I hereby declare that the information given above is true and correct to the best of my knowledge and belief. I have not filed any earlier appeal in this matter before any other authority.

   Date: ${form.appealDate}
   Place: ${form.appellantAddress?.split(',').pop()?.trim() || '___________'}

                                                    Yours faithfully,

                                                    ${form.appellantName}
                                                    ${form.appellantAddress}
                                                    Phone: ${form.appellantPhone}
                                                    Email: ${form.appellantEmail}

Enclosures:
1. Copy of original RTI application
2. Copy of acknowledgement/registration slip
3. Copy of PIO's reply (if received)
`.trim();
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.setFontSize(11);
    const text = generateText();
    const lines = pdf.splitTextToSize(text, 180);
    let y = 15;
    lines.forEach(line => {
      if (y > 275) { pdf.addPage(); y = 15; }
      pdf.text(line, 15, y); y += 6;
    });
    pdf.save(`RTI-First-Appeal-${form.appellantName || 'application'}.pdf`);
  };

  const STEPS = ['Appellant', 'Original RTI', 'Grounds', 'Relief & Preview'];

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🆓 Free & Instant', '⚖️ Section 19(1) RTI Act', '📄 PDF Download', '🔒 100% Private'].map(b => <span key={b} style={S.badge}>{b}</span>)}
      </div>

      {/* Info banner */}
      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16, fontSize: '0.83rem', color: '#92400e', lineHeight: 1.6 }}>
        <strong>📋 When to file First Appeal:</strong> File within <strong>30 days</strong> of: (1) receiving an unsatisfactory reply, (2) receiving no reply within 30 days, or (3) receiving a rejection. The First Appellate Authority must reply within <strong>30 days</strong> (extendable to 45 days).
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-light)' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', border: 'none', background: step === i + 1 ? 'var(--accent)' : 'transparent', color: step === i + 1 ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step 1: Appellant */}
      {step === 1 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>👤 Your Details (Appellant)</div>
          <div style={S.grid2}>
            <Field label="Full Name *" value={form.appellantName} onChange={v => set('appellantName', v)} placeholder="Ramesh Kumar Sharma" />
            <Field label="Phone Number" value={form.appellantPhone} onChange={v => set('appellantPhone', v)} placeholder="+91 98765 43210" />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Complete Address *</label>
              <textarea value={form.appellantAddress} onChange={e => set('appellantAddress', e.target.value)} rows={3} placeholder="House No., Street, Village/Mohalla, District, State, PIN" style={S.textarea} />
            </div>
            <Field label="Email" value={form.appellantEmail} onChange={v => set('appellantEmail', v)} placeholder="your@email.com" type="email" />
            <Field label="Date of This Appeal" value={form.appealDate} onChange={v => set('appealDate', v)} placeholder="DD/MM/YYYY" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={S.sectionTitle}>🏛️ First Appellate Authority (FAA) Details</div>
            <div style={{ ...S.grid2, marginBottom: 12 }}>
              <Field label="FAA Name (if known)" value={form.faaName} onChange={v => set('faaName', v)} placeholder="Shri Rajesh Verma" />
              <Field label="FAA Designation" value={form.faaDesignation} onChange={v => set('faaDesignation', v)} placeholder="Deputy Secretary / Appellate Authority" />
            </div>
            <div style={S.grid2}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Public Authority (Ministry/Department) *</label>
                <select value={form.authority} onChange={e => set('authority', e.target.value)} style={S.select}>
                  <option value="">Select authority...</option>
                  {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '10px 24px', cursor: 'pointer' }}>Next: Original RTI →</button>
          </div>
        </div>
      )}

      {/* Step 2: Original RTI */}
      {step === 2 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>📑 Original RTI Application Details</div>
          <div style={S.grid2}>
            <Field label="Date of Original Application *" value={form.originalDate} onChange={v => set('originalDate', v)} placeholder="DD/MM/YYYY" />
            <Field label="Registration / Ack. Number" value={form.registrationNo} onChange={v => set('registrationNo', v)} placeholder="RTI/2026/0001234" />
            <Field label="PIO Name (if known)" value={form.pioName} onChange={v => set('pioName', v)} placeholder="Shri Anil Kumar" />
            <Field label="PIO Designation" value={form.pioDesignation} onChange={v => set('pioDesignation', v)} placeholder="CPIO / Public Information Officer" />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Subject of Information Sought *</label>
              <input value={form.originalSubject} onChange={e => set('originalSubject', e.target.value)} placeholder="Status of road construction work, details of fund utilization" style={S.input} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Original Questions Asked *</label>
              <textarea value={form.originalQuestions} onChange={e => set('originalQuestions', e.target.value)} rows={5}
                placeholder="1. Please provide the details of the contractor appointed for road construction work in village XYZ.&#10;2. Please provide the total amount sanctioned and utilised..." style={S.textarea} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => setStep(1)} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', fontSize: '0.88rem' }}>← Back</button>
            <button onClick={() => setStep(3)} className="btn-primary" style={{ padding: '10px 24px', cursor: 'pointer' }}>Next: Grounds →</button>
          </div>
        </div>
      )}

      {/* Step 3: Grounds */}
      {step === 3 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>⚖️ Grounds of Appeal (select all that apply)</div>
          {APPEAL_GROUNDS.map((g, i) => (
            <label key={i} style={{ ...S.checkRow, background: form.grounds.includes(g) ? '#f0fdf4' : 'var(--bg-secondary)', borderColor: form.grounds.includes(g) ? '#86efac' : 'var(--border-light)' }}>
              <input type="checkbox" checked={form.grounds.includes(g)} onChange={() => toggleArr('grounds', g)} style={{ accentColor: '#16a34a', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{g}</span>
            </label>
          ))}
          <div style={{ marginTop: 10 }}>
            <label style={S.label}>Additional / Custom Ground</label>
            <textarea value={form.customGround} onChange={e => set('customGround', e.target.value)} rows={3} placeholder="Describe any additional ground for appeal..." style={S.textarea} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', fontSize: '0.88rem' }}>← Back</button>
            <button onClick={() => setStep(4)} className="btn-primary" style={{ padding: '10px 24px', cursor: 'pointer' }}>Next: Relief & Preview →</button>
          </div>
        </div>
      )}

      {/* Step 4: Relief + Preview */}
      {step === 4 && (
        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>🙏 Relief Sought</div>
            {RELIEF_OPTIONS.map((r, i) => (
              <label key={i} style={{ ...S.checkRow, background: form.reliefSought.includes(r) ? '#eff6ff' : 'var(--bg-secondary)', borderColor: form.reliefSought.includes(r) ? '#93c5fd' : 'var(--border-light)' }}>
                <input type="checkbox" checked={form.reliefSought.includes(r)} onChange={() => toggleArr('reliefSought', r)} style={{ accentColor: 'var(--highlight)', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{r}</span>
              </label>
            ))}
            <div style={{ marginTop: 10 }}>
              <label style={S.label}>Additional Relief</label>
              <textarea value={form.customRelief} onChange={e => set('customRelief', e.target.value)} rows={2} placeholder="Any other specific relief..." style={S.textarea} />
            </div>
          </div>

          {/* Preview */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📄 Application Preview</div>
            <div style={S.previewBox}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '0.85rem', lineHeight: 1.8, margin: 0 }}>{generateText()}</pre>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={downloadPDF} style={{ flex: 1, padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                ⬇️ Download PDF
              </button>
              <button onClick={() => navigator.clipboard.writeText(generateText())}
                style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>
                📋 Copy Text
              </button>
              <button onClick={() => setStep(1)}
                style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>
                🔄 New Appeal
              </button>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: 14, fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>📮 How to submit:</strong> Send by post (Speed Post/Registered Post) to the First Appellate Authority at the concerned ministry/department. You can also file online at <strong>rtionline.gov.in</strong> for Central Government departments. Keep a copy with postal receipt.
          </div>
        </div>
      )}

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 14 }}>
        {[
          { icon: '⏰', title: '30-Day Deadline', desc: 'File within 30 days of unsatisfactory reply or no reply from PIO' },
          { icon: '📮', title: 'FAA Must Reply in 30 Days', desc: 'First Appellate Authority must reply within 30 days (up to 45 days)' },
          { icon: '🆓', title: 'No Fee Required', desc: 'First Appeal filing is completely free — no fee for RTI appeals' },
          { icon: '⚖️', title: 'Second Appeal to CIC/SIC', desc: 'If FAA also fails, file Second Appeal with Central/State Information Commission' },
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
