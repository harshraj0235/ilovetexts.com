'use client';
// AgeCalculator.jsx — Exact age + government exam eligibility
// Targets: "age calculator" 400K/mo, "age calculator SSC UPSC" 80K/mo
import { useState, useCallback, useEffect } from 'react';

function calcAge(dob, asOf) {
  const birth = new Date(dob);
  const ref   = new Date(asOf);
  if (isNaN(birth) || isNaN(ref)) return null;
  if (birth > ref) return null;

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();

  if (days < 0) { months--; const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0); days += prevMonth.getDate(); }
  if (months < 0) { years--; months += 12; }

  const totalDays = Math.floor((ref - birth) / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = totalDays * 24;
  const nextBirthday = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= ref) nextBirthday.setFullYear(ref.getFullYear() + 1);
  const daysToNext = Math.floor((nextBirthday - ref) / 86400000);

  return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, daysToNext, nextBirthday, birth, ref };
}

const EXAMS = [
  { name: 'SSC CGL', minAge: 18, maxAge: 32, category: 'Central Govt', icon: '📋' },
  { name: 'SSC CHSL', minAge: 18, maxAge: 27, category: 'Central Govt', icon: '📋' },
  { name: 'UPSC CSE', minAge: 21, maxAge: 32, category: 'Civil Services', icon: '🏛️' },
  { name: 'IBPS PO', minAge: 20, maxAge: 30, category: 'Bank', icon: '🏦' },
  { name: 'IBPS Clerk', minAge: 20, maxAge: 28, category: 'Bank', icon: '🏦' },
  { name: 'SBI PO', minAge: 21, maxAge: 30, category: 'Bank', icon: '🏦' },
  { name: 'SBI Clerk', minAge: 20, maxAge: 28, category: 'Bank', icon: '🏦' },
  { name: 'RRB NTPC', minAge: 18, maxAge: 33, category: 'Railway', icon: '🚂' },
  { name: 'RRB Group D', minAge: 18, maxAge: 36, category: 'Railway', icon: '🚂' },
  { name: 'UPSC NDA', minAge: 16, maxAge: 19, category: 'Defence', icon: '⚔️' },
  { name: 'UPSC CDS', minAge: 19, maxAge: 25, category: 'Defence', icon: '⚔️' },
  { name: 'LIC AAO', minAge: 21, maxAge: 30, category: 'Insurance', icon: '🛡️' },
  { name: 'NEET UG', minAge: 17, maxAge: 25, category: 'Medical', icon: '🏥' },
  { name: 'JEE Main', minAge: 0, maxAge: 24, category: 'Engineering', icon: '🔬' },
];

function getEligibility(age, exams) {
  return exams.map(e => ({
    ...e,
    eligible: age >= e.minAge && age <= e.maxAge,
    tooYoung: age < e.minAge,
    tooOld: age > e.maxAge,
    yearsNeeded: age < e.minAge ? e.minAge - age : 0,
    yearsOver: age > e.maxAge ? age - e.maxAge : 0,
  }));
}

const ZODIAC = [
  { sign: 'Capricorn', emoji: '♑', start: [12,22], end: [1,19] },
  { sign: 'Aquarius', emoji: '♒', start: [1,20], end: [2,18] },
  { sign: 'Pisces', emoji: '♓', start: [2,19], end: [3,20] },
  { sign: 'Aries', emoji: '♈', start: [3,21], end: [4,19] },
  { sign: 'Taurus', emoji: '♉', start: [4,20], end: [5,20] },
  { sign: 'Gemini', emoji: '♊', start: [5,21], end: [6,20] },
  { sign: 'Cancer', emoji: '♋', start: [6,21], end: [7,22] },
  { sign: 'Leo', emoji: '♌', start: [7,23], end: [8,22] },
  { sign: 'Virgo', emoji: '♍', start: [8,23], end: [9,22] },
  { sign: 'Libra', emoji: '♎', start: [9,23], end: [10,22] },
  { sign: 'Scorpio', emoji: '♏', start: [10,23], end: [11,21] },
  { sign: 'Sagittarius', emoji: '♐', start: [11,22], end: [12,21] },
];

function getZodiac(date) {
  const d = new Date(date);
  const m = d.getMonth() + 1, day = d.getDate();
  for (const z of ZODIAC) {
    const [sm,sd] = z.start, [em,ed] = z.end;
    if ((m === sm && day >= sd) || (m === em && day <= ed)) return z;
    if (sm > em && (m === sm && day >= sd || m < em || (m === em && day <= ed))) return z;
  }
  return ZODIAC[0];
}

export default function AgeCalculator({ t, lang }) {
  const [dob, setDob]       = useState('');
  const [asOf, setAsOf]     = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState(null);
  const [showExams, setShowExams] = useState(true);
  const [examFilter, setExamFilter] = useState('All');
  const [toast, setToast]   = useState(null);

  const showToast = (m, t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2000); };

  const calculate = useCallback(() => {
    if (!dob) { showToast('Please enter date of birth', 'warning'); return; }
    const r = calcAge(dob, asOf);
    if (!r) { showToast('Date of birth cannot be after the reference date', 'warning'); return; }
    setResult(r);
  }, [dob, asOf]);

  useEffect(() => { if (dob) calculate(); }, [dob, asOf]);

  const eligibility = result ? getEligibility(result.years, EXAMS) : [];
  const zodiac = dob ? getZodiac(dob) : null;
  const categories = ['All', ...new Set(EXAMS.map(e => e.category))];
  const filteredEligibility = examFilter === 'All' ? eligibility : eligibility.filter(e => e.category === examFilter);

  const copyAge = async () => {
    if (!result) return;
    const text = `Age: ${result.years} Years, ${result.months} Months, ${result.days} Days (Total: ${result.totalDays} days)`;
    await navigator.clipboard.writeText(text);
    showToast('Age copied!');
  };

  const LIFE_EXPECTANCY = 73.4;
  const lifePercent = result ? Math.min(100, Math.round((result.years / LIFE_EXPECTANCY) * 100)) : 0;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {toast && <div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎂</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px' }}>Age Calculator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Exact age in years, months &amp; days · SSC, UPSC, Railway, Bank exam eligibility · Zodiac sign</p>
      </div>

      {/* Input card */}
      <div className="trust-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>📅 Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} max={asOf}
              style={{ width: '100%', padding: '12px 14px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor='#dc2626'} onBlur={e => e.target.style.borderColor='var(--border-light)'} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>📅 Calculate As On Date</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor='#dc2626'} onBlur={e => e.target.style.borderColor='var(--border-light)'} />
              <button onClick={() => setAsOf(new Date().toISOString().split('T')[0])} style={{ padding: '12px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-section)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Today</button>
            </div>
          </div>
        </div>

        {dob && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
            💡 Change the "As On Date" to check eligibility for any past/future exam cut-off date
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Main age display */}
          <div className="trust-card" style={{ padding: 24, marginBottom: 14, background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.85, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Exact Age</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { value: result.years, label: 'Years' },
                  { value: result.months, label: 'Months' },
                  { value: result.days, label: 'Days' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={copyAge} style={{ display: 'block', margin: '0 auto', padding: '8px 20px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              📋 Copy Age
            </button>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { icon: '📅', label: 'Total Days', value: result.totalDays.toLocaleString('en-IN') },
              { icon: '📆', label: 'Total Weeks', value: result.totalWeeks.toLocaleString('en-IN') },
              { icon: '🗓️', label: 'Total Months', value: result.totalMonths.toLocaleString() },
              { icon: '⏰', label: 'Total Hours', value: result.totalHours.toLocaleString('en-IN') },
              { icon: '🎂', label: 'Next Birthday', value: result.daysToNext === 0 ? '🎉 Today!' : `In ${result.daysToNext} days` },
              { icon: zodiac ? zodiac.emoji : '⭐', label: 'Zodiac Sign', value: zodiac ? zodiac.sign : '—' },
            ].map(s => (
              <div key={s.label} className="trust-card" style={{ padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Life progress bar */}
          <div className="trust-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Life Progress ({result.years} years)</span>
              <span style={{ color: '#dc2626' }}>{lifePercent}% of avg. life expectancy (73.4 yrs)</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lifePercent}%`, background: 'linear-gradient(90deg,#dc2626,#f59e0b)', borderRadius: 5, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Exam eligibility */}
          <div className="trust-card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>🏛️ Government Exam Eligibility (Age: {result.years} years)</h3>
              <button onClick={() => setShowExams(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>{showExams ? 'Hide' : 'Show'}</button>
            </div>

            {showExams && (
              <>
                {/* Category filter */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setExamFilter(cat)}
                      style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${examFilter===cat?'#dc2626':'var(--border-light)'}`, background: examFilter===cat?'rgba(220,38,38,0.1)':'var(--bg-section)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: examFilter===cat?'#dc2626':'var(--text-secondary)' }}>
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                  {filteredEligibility.map(e => (
                    <div key={e.name} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${e.eligible?'#10b981':e.tooOld?'#ef4444':'var(--border-light)'}`, background: e.eligible?'rgba(16,185,129,0.06)':e.tooOld?'rgba(239,68,68,0.04)':'var(--bg-section)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{e.icon} {e.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{e.minAge}–{e.maxAge} years · {e.category}</div>
                        </div>
                        <span style={{ fontSize: '1.1rem' }}>{e.eligible ? '✅' : e.tooYoung ? '⏳' : '❌'}</span>
                      </div>
                      {!e.eligible && (
                        <div style={{ fontSize: '0.7rem', marginTop: 5, color: e.tooOld?'#ef4444':'#f59e0b', fontWeight: 600 }}>
                          {e.tooYoung ? `Need ${e.yearsNeeded} more year${e.yearsNeeded>1?'s':''}` : `Exceeded by ${e.yearsOver} year${e.yearsOver>1?'s':''}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  * Age limits shown for General category (UR). OBC/SC/ST relaxations apply. Verify with official notifications.
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Usage tips */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {[
            { icon: '🏛️', title: 'Govt Exam Eligibility', desc: 'SSC, UPSC, Railway, Bank — check if you qualify' },
            { icon: '📋', title: 'Job Applications', desc: 'Exact age as on a specific cut-off date' },
            { icon: '🏫', title: 'School Admissions', desc: 'Age as on 31st March or other admission cut-off' },
            { icon: '🛂', title: 'Passport/Visa', desc: 'Exact age for passport and visa age requirements' },
          ].map(item => (
            <div key={item.title} className="trust-card" style={{ padding: 14 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
