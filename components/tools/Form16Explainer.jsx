'use client';
import { useState } from 'react';

// FY 2025-26 Tax Slabs
const NEW_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 5 },
  { min: 800000, max: 1200000, rate: 10 },
  { min: 1200000, max: 1600000, rate: 15 },
  { min: 1600000, max: 2000000, rate: 20 },
  { min: 2000000, max: 2400000, rate: 25 },
  { min: 2400000, max: Infinity, rate: 30 },
];

const OLD_SLABS_BELOW60 = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

function calcTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate / 100;
  }
  return tax;
}

function addCess(tax) { return tax + tax * 0.04; }

const f = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

const S = {
  wrap: { maxWidth: 1000, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', textAlign: 'right' },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 },
  row: (highlight) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 4, background: highlight ? 'rgba(0,112,243,0.06)' : 'transparent', fontWeight: highlight ? 700 : 400 }),
  resultBox: (color) => ({ background: color + '10', border: `2px solid ${color}`, borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }),
};

function InputRow({ label, value, onChange, tooltip }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</div>
        {tooltip && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{tooltip}</div>}
      </div>
      <div style={{ width: 140 }}>
        <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} placeholder="0" style={S.input} min={0} />
      </div>
    </div>
  );
}

export default function Form16Explainer({ t, lang }) {
  const [data, setData] = useState({
    grossSalary: 0, hra: 0, lta: 0, otherAllow: 0, profTax: 0,
    rent80GG: 0,
    life80C: 0, ppf80C: 0, elss80C: 0, epf80C: 0, tuition80C: 0, homeLoan80C: 0, other80C: 0,
    medical80D: 0, parentMedical80D: 0,
    homeLoanInt: 0, homeLoanIntSelfOcc: 0,
    nps80CCD: 0, donation80G: 0, education80E: 0, disability80U: 0,
    tdsDeducted: 0, advanceTax: 0,
    age: 'below60',
  });
  const [regime, setRegime] = useState('both');

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  // ── OLD REGIME ──
  const hra_exempt = Math.min(data.hra, data.grossSalary * 0.5);
  const standardDeduction = 75000;
  const section80C = Math.min((data.life80C + data.ppf80C + data.elss80C + data.epf80C + data.tuition80C + data.homeLoan80C + data.other80C), 150000);
  const section80D = Math.min(data.medical80D, 25000) + Math.min(data.parentMedical80D, 25000);
  const section80CCD = Math.min(data.nps80CCD, 50000);
  const section24b = Math.min(data.homeLoanIntSelfOcc, 200000);

  const grossIncomeOld = data.grossSalary - hra_exempt - data.lta - data.otherAllow;
  const totalDeductionsOld = standardDeduction + data.profTax + section80C + section80D + section24b + section80CCD + data.donation80G + data.education80E + data.disability80U;
  const taxableOld = Math.max(0, grossIncomeOld - totalDeductionsOld);
  const taxOld_before_cess = calcTax(taxableOld, OLD_SLABS_BELOW60);
  // 87A rebate for old regime
  const rebate87A_old = taxableOld <= 500000 ? taxOld_before_cess : 0;
  const taxOld = addCess(Math.max(0, taxOld_before_cess - rebate87A_old));

  // ── NEW REGIME ──
  const taxableNew = Math.max(0, data.grossSalary - standardDeduction);
  const taxNew_before = calcTax(taxableNew, NEW_SLABS);
  const rebate87A_new = taxableNew <= 700000 ? taxNew_before : 0;
  const taxNew = addCess(Math.max(0, taxNew_before - rebate87A_new));

  const totalPaid = data.tdsDeducted + data.advanceTax;
  const refundOld = totalPaid - taxOld;
  const refundNew = totalPaid - taxNew;

  const betterRegime = taxNew < taxOld ? 'new' : 'old';
  const saving = Math.abs(taxOld - taxNew);

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['📊 FY 2025-26', '🆚 Old vs New Regime', '💰 Refund/Due Calculator', '🔒 100% Private', '⚡ Instant'].map(b => <span key={b} style={S.badge}>{b}</span>)}
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16, fontSize: '0.83rem', color: '#1e40af', lineHeight: 1.6 }}>
        <strong>📋 How to use:</strong> Enter values from your Form 16 Part A (TDS details) and Part B (salary breakup + deductions). The calculator shows your exact tax liability under both regimes and whether you get a refund or owe more tax.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Input sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Salary */}
          <div style={S.card}>
            <div style={S.sectionTitle}>💼 Part B — Salary Details (from Form 16)</div>
            <InputRow label="Gross Salary (before any deduction)" value={data.grossSalary} onChange={v => set('grossSalary', v)} tooltip="Total CTC received — from 'Gross Salary' in Form 16 Part B" />
            <InputRow label="HRA (House Rent Allowance)" value={data.hra} onChange={v => set('hra', v)} tooltip="HRA component in salary — for old regime exemption" />
            <InputRow label="LTA (Leave Travel Allowance)" value={data.lta} onChange={v => set('lta', v)} tooltip="LTA received and claimed — old regime" />
            <InputRow label="Other Allowances" value={data.otherAllow} onChange={v => set('otherAllow', v)} tooltip="Any other exempt allowances" />
            <InputRow label="Professional Tax Deducted" value={data.profTax} onChange={v => set('profTax', v)} tooltip="PT deducted by employer — shown in Form 16" />
          </div>

          {/* 80C */}
          <div style={S.card}>
            <div style={S.sectionTitle}>💰 Section 80C Investments (Max ₹1,50,000)</div>
            <InputRow label="Life Insurance Premium" value={data.life80C} onChange={v => set('life80C', v)} />
            <InputRow label="PPF Contribution" value={data.ppf80C} onChange={v => set('ppf80C', v)} />
            <InputRow label="ELSS Mutual Fund" value={data.elss80C} onChange={v => set('elss80C', v)} />
            <InputRow label="Employee PF (own contribution)" value={data.epf80C} onChange={v => set('epf80C', v)} />
            <InputRow label="Children's Tuition Fee" value={data.tuition80C} onChange={v => set('tuition80C', v)} />
            <InputRow label="Home Loan Principal Repaid" value={data.homeLoan80C} onChange={v => set('homeLoan80C', v)} />
            <InputRow label="Other 80C (NSC, FD, SCSS etc.)" value={data.other80C} onChange={v => set('other80C', v)} />
            <div style={{ marginTop: 8, padding: '8px 10px', background: section80C >= 150000 ? '#f0fdf4' : '#fffbeb', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, color: section80C >= 150000 ? '#15803d' : '#92400e' }}>
              Total 80C: {f(section80C)} / ₹1,50,000 {section80C >= 150000 ? '✅ Maximum claimed' : `(₹${(150000 - section80C).toLocaleString()} remaining)`}
            </div>
          </div>

          {/* Other deductions */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏥 Other Deductions (Old Regime)</div>
            <InputRow label="Medical Insurance — Self/Family (80D)" value={data.medical80D} onChange={v => set('medical80D', v)} tooltip="Max ₹25,000 (₹50,000 if senior citizen)" />
            <InputRow label="Medical Insurance — Parents (80D)" value={data.parentMedical80D} onChange={v => set('parentMedical80D', v)} tooltip="Max ₹25,000 (₹50,000 if parents are senior citizens)" />
            <InputRow label="Home Loan Interest — Self-occupied (24b)" value={data.homeLoanIntSelfOcc} onChange={v => set('homeLoanIntSelfOcc', v)} tooltip="Max ₹2,00,000 for self-occupied property" />
            <InputRow label="NPS Contribution (80CCD(1B))" value={data.nps80CCD} onChange={v => set('nps80CCD', v)} tooltip="Additional ₹50,000 over 80C limit" />
            <InputRow label="Donations (80G)" value={data.donation80G} onChange={v => set('donation80G', v)} tooltip="Donations to approved organizations" />
            <InputRow label="Education Loan Interest (80E)" value={data.education80E} onChange={v => set('education80E', v)} tooltip="Entire interest paid — no upper limit" />
          </div>

          {/* TDS */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🏦 Part A — TDS &amp; Tax Already Paid</div>
            <InputRow label="TDS Deducted by Employer" value={data.tdsDeducted} onChange={v => set('tdsDeducted', v)} tooltip="Total TDS from Form 16 Part A" />
            <InputRow label="Advance Tax Paid" value={data.advanceTax} onChange={v => set('advanceTax', v)} tooltip="If you paid advance tax directly" />
          </div>
        </div>

        {/* Results panel */}
        <div style={{ position: 'sticky', top: 80, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Regime toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            {[['both', 'Compare Both'], ['old', 'Old Regime'], ['new', 'New Regime']].map(([val, lbl]) => (
              <button key={val} onClick={() => setRegime(val)}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-sm)', border: 'none', background: regime === val ? 'var(--accent)' : 'transparent', color: regime === val ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{ background: betterRegime === 'new' ? '#eff6ff' : '#f0fdf4', border: `2px solid ${betterRegime === 'new' ? '#93c5fd' : '#86efac'}`, borderRadius: 'var(--radius-md)', padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>💡 Better for you</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: betterRegime === 'new' ? '#1d4ed8' : '#15803d', marginBottom: 4 }}>
              {betterRegime === 'new' ? '🆕 New Regime' : '📋 Old Regime'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Save {f(saving)} by choosing {betterRegime} regime
            </div>
          </div>

          {/* Old Regime */}
          {(regime === 'old' || regime === 'both') && (
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 12, color: '#15803d' }}>📋 Old Regime</div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>Gross Salary</span><span style={{ fontSize: '0.82rem' }}>{f(data.grossSalary)}</span></div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>HRA Exempt</span><span style={{ fontSize: '0.82rem', color: '#16a34a' }}>-{f(hra_exempt)}</span></div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>Standard Deduction</span><span style={{ fontSize: '0.82rem', color: '#16a34a' }}>-{f(standardDeduction)}</span></div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>80C + 80D + Others</span><span style={{ fontSize: '0.82rem', color: '#16a34a' }}>-{f(totalDeductionsOld - standardDeduction)}</span></div>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '6px 0' }} />
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>Taxable Income</span><span style={{ fontSize: '0.85rem' }}>{f(taxableOld)}</span></div>
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>Tax + 4% Cess</span><span style={{ fontSize: '0.85rem' }}>{f(taxOld)}</span></div>
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>TDS Paid</span><span style={{ fontSize: '0.85rem' }}>{f(totalPaid)}</span></div>
              <div style={{ borderTop: '2px solid var(--border-light)', margin: '8px 0' }} />
              <div style={{ ...S.row(true), background: refundOld >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 800 }}>{refundOld >= 0 ? '🎉 Refund' : '⚠️ Tax Due'}</span>
                <span style={{ fontWeight: 800, color: refundOld >= 0 ? '#15803d' : '#dc2626', fontSize: '1rem' }}>{f(Math.abs(refundOld))}</span>
              </div>
            </div>
          )}

          {/* New Regime */}
          {(regime === 'new' || regime === 'both') && (
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 12, color: '#1d4ed8' }}>🆕 New Regime (FY 2025-26)</div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>Gross Salary</span><span style={{ fontSize: '0.82rem' }}>{f(data.grossSalary)}</span></div>
              <div style={S.row(false)}><span style={{ fontSize: '0.82rem' }}>Standard Deduction</span><span style={{ fontSize: '0.82rem', color: '#16a34a' }}>-{f(standardDeduction)}</span></div>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '6px 0' }} />
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>Taxable Income</span><span style={{ fontSize: '0.85rem' }}>{f(taxableNew)}</span></div>
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>Tax + 4% Cess</span><span style={{ fontSize: '0.85rem' }}>{f(taxNew)}</span></div>
              <div style={S.row(true)}><span style={{ fontSize: '0.85rem' }}>TDS Paid</span><span style={{ fontSize: '0.85rem' }}>{f(totalPaid)}</span></div>
              <div style={{ borderTop: '2px solid var(--border-light)', margin: '8px 0' }} />
              <div style={{ ...S.row(true), background: refundNew >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 800 }}>{refundNew >= 0 ? '🎉 Refund' : '⚠️ Tax Due'}</span>
                <span style={{ fontWeight: 800, color: refundNew >= 0 ? '#15803d' : '#dc2626', fontSize: '1rem' }}>{f(Math.abs(refundNew))}</span>
              </div>
              {rebate87A_new > 0 && <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: 6, textAlign: 'center' }}>✅ 87A Rebate applied (income ≤ ₹7L)</div>}
            </div>
          )}

          {/* New regime slabs */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: 10 }}>FY 2025-26 New Regime Slabs</div>
            {NEW_SLABS.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 6px', background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent', borderRadius: 3 }}>
                <span>{s.max === Infinity ? `Above ₹${(s.min / 100000).toFixed(0)}L` : `₹${(s.min / 100000).toFixed(0)}L – ₹${(s.max / 100000).toFixed(0)}L`}</span>
                <span style={{ fontWeight: 700, color: s.rate > 0 ? '#dc2626' : '#15803d' }}>{s.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
