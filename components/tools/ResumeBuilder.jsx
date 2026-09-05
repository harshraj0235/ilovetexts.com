'use client';
import { useState, useRef } from 'react';

const TEMPLATES = [
  { id: 'classic', name: 'Classic', accent: '#1e3a5f' },
  { id: 'modern', name: 'Modern', accent: '#7c3aed' },
  { id: 'minimal', name: 'Minimal', accent: '#111827' },
  { id: 'creative', name: 'Creative', accent: '#dc2626' },
  { id: 'corporate', name: 'Corporate', accent: '#0369a1' },
];

const EMPTY = {
  personal: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: '',
  experience: [{ company: '', role: '', duration: '', points: [''] }],
  education: [{ institution: '', degree: '', year: '', gpa: '' }],
  skills: [''],
  projects: [{ name: '', desc: '', tech: '' }],
  certifications: [''],
};

const S = {
  wrap: { maxWidth: 1100, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' },
  tabBtn: (active) => ({ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: active ? 'var(--accent)' : 'var(--bg-secondary)', color: active ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }),
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 },
  addBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--highlight)', fontSize: '0.82rem', fontWeight: 600, padding: 0 },
};

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={S.input} />
    </div>
  );
}

function PrevSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: '1.5px', borderBottom: `1px solid ${accent}30`, paddingBottom: 3, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export default function ResumeBuilder({ t, lang }) {
  const [resume, setResume] = useState(EMPTY);
  const [template, setTemplate] = useState('classic');
  const [tab, setTab] = useState('personal');
  const previewRef = useRef();

  const accent = TEMPLATES.find(t => t.id === template)?.accent || '#1e3a5f';

  const setPersonal = (f, v) => setResume(r => ({ ...r, personal: { ...r.personal, [f]: v } }));
  const setSummary = v => setResume(r => ({ ...r, summary: v }));
  const addItem = (s) => setResume(r => ({ ...r, [s]: [...r[s], s === 'experience' ? { company: '', role: '', duration: '', points: [''] } : s === 'education' ? { institution: '', degree: '', year: '', gpa: '' } : s === 'projects' ? { name: '', desc: '', tech: '' } : ''] }));
  const removeItem = (s, i) => setResume(r => ({ ...r, [s]: r[s].filter((_, idx) => idx !== i) }));
  const updateItem = (s, i, f, v) => setResume(r => { const a = [...r[s]]; if (typeof a[i] === 'string') a[i] = v; else a[i] = { ...a[i], [f]: v }; return { ...r, [s]: a }; });
  const addExpPoint = i => setResume(r => { const e = [...r.experience]; e[i] = { ...e[i], points: [...e[i].points, ''] }; return { ...r, experience: e }; });
  const updateExpPoint = (i, pi, v) => setResume(r => { const e = [...r.experience]; const pts = [...e[i].points]; pts[pi] = v; e[i] = { ...e[i], points: pts }; return { ...r, experience: e }; });

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const el = previewRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pW, (canvas.height * pW) / canvas.width);
    pdf.save(`${resume.personal.name || 'resume'}.pdf`);
  };

  const TABS = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'summary', label: '📝 Summary' },
    { id: 'experience', label: '💼 Experience' },
    { id: 'education', label: '🎓 Education' },
    { id: 'skills', label: '⚡ Skills' },
    { id: 'projects', label: '🚀 Projects' },
    { id: 'certifications', label: '🏆 Certs' },
  ];

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['📄 Free PDF download', '🚫 No watermark', '5 templates', '🔒 No signup required'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {/* Template selector */}
      <div style={S.card}>
        <div style={S.label}>Template</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMPLATES.map(tmpl => (
            <button key={tmpl.id} onClick={() => setTemplate(tmpl.id)}
              style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${template === tmpl.id ? tmpl.accent : 'var(--border-light)'}`, background: template === tmpl.id ? `${tmpl.accent}15` : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: template === tmpl.id ? tmpl.accent : 'var(--text-secondary)', transition: 'all 0.15s' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: tmpl.accent, display: 'inline-block', marginRight: 6 }} />
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Form */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={S.tabBtn(tab === t.id)}>{t.label}</button>)}
          </div>

          <div style={S.card}>
            {/* Personal */}
            {tab === 'personal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1/-1' }}><Field label="Full Name *" value={resume.personal.name} onChange={v => setPersonal('name', v)} placeholder="Harsh Raj" /></div>
                <div style={{ gridColumn: '1/-1' }}><Field label="Job Title" value={resume.personal.title} onChange={v => setPersonal('title', v)} placeholder="Software Engineer" /></div>
                <Field label="Email *" value={resume.personal.email} onChange={v => setPersonal('email', v)} placeholder="harsh@example.com" />
                <Field label="Phone" value={resume.personal.phone} onChange={v => setPersonal('phone', v)} placeholder="+91 98765 43210" />
                <Field label="Location" value={resume.personal.location} onChange={v => setPersonal('location', v)} placeholder="Mumbai, India" />
                <Field label="LinkedIn" value={resume.personal.linkedin} onChange={v => setPersonal('linkedin', v)} placeholder="linkedin.com/in/..." />
                <div style={{ gridColumn: '1/-1' }}><Field label="Website" value={resume.personal.website} onChange={v => setPersonal('website', v)} placeholder="yourwebsite.com" /></div>
              </div>
            )}

            {/* Summary */}
            {tab === 'summary' && (
              <div>
                <label style={S.label}>Professional Summary</label>
                <textarea value={resume.summary} onChange={e => setSummary(e.target.value)} rows={6} placeholder="Passionate software engineer with 3+ years experience..." style={S.textarea} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{resume.summary.length} characters</p>
              </div>
            )}

            {/* Experience */}
            {tab === 'experience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {resume.experience.map((exp, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Experience {i + 1}</span>
                      {resume.experience.length > 1 && <button onClick={() => removeItem('experience', i)} style={S.removeBtn}>✕ Remove</button>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {[['Company', 'company', 'Google India'], ['Role', 'role', 'Senior Engineer'], ['Duration', 'duration', 'Jan 2023 – Present']].map(([l, f, p]) => (
                        <div key={f}><label style={S.label}>{l}</label><input value={exp[f]} onChange={e => updateItem('experience', i, f, e.target.value)} placeholder={p} style={S.input} /></div>
                      ))}
                    </div>
                    <label style={S.label}>Achievements</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {exp.points.map((pt, pi) => (
                        <input key={pi} value={pt} onChange={e => updateExpPoint(i, pi, e.target.value)} placeholder={`• Point ${pi + 1}`} style={S.input} />
                      ))}
                    </div>
                    <button onClick={() => addExpPoint(i)} style={{ ...S.addBtn, marginTop: 6 }}>+ Add point</button>
                  </div>
                ))}
                <button onClick={() => addItem('experience')} style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ Add Experience</button>
              </div>
            )}

            {/* Education */}
            {tab === 'education' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resume.education.map((edu, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Education {i + 1}</span>
                      {resume.education.length > 1 && <button onClick={() => removeItem('education', i)} style={S.removeBtn}>✕</button>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['Institution', 'institution', 'IIT Bombay'], ['Degree', 'degree', 'B.Tech CS'], ['Year', 'year', '2020–2024'], ['GPA / %', 'gpa', '8.5/10']].map(([l, f, p]) => (
                        <div key={f}><label style={S.label}>{l}</label><input value={edu[f]} onChange={e => updateItem('education', i, f, e.target.value)} placeholder={p} style={S.input} /></div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('education')} style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ Add Education</button>
              </div>
            )}

            {/* Skills */}
            {tab === 'skills' && (
              <div>
                <label style={S.label}>Skills (one per field)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {resume.skills.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input value={s} onChange={e => updateItem('skills', i, null, e.target.value)} placeholder={`Skill ${i + 1} e.g. React.js`} style={{ ...S.input, flex: 1 }} />
                      {resume.skills.length > 1 && <button onClick={() => removeItem('skills', i)} style={S.removeBtn}>✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => addItem('skills')} style={{ ...S.addBtn, marginTop: 8 }}>+ Add skill</button>
              </div>
            )}

            {/* Projects */}
            {tab === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resume.projects.map((proj, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Project {i + 1}</span>
                      {resume.projects.length > 1 && <button onClick={() => removeItem('projects', i)} style={S.removeBtn}>✕</button>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input value={proj.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} placeholder="Project Name" style={S.input} />
                      <textarea value={proj.desc} onChange={e => updateItem('projects', i, 'desc', e.target.value)} placeholder="Brief description..." rows={2} style={S.textarea} />
                      <input value={proj.tech} onChange={e => updateItem('projects', i, 'tech', e.target.value)} placeholder="Tech: React, Node.js..." style={S.input} />
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('projects')} style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ Add Project</button>
              </div>
            )}

            {/* Certifications */}
            {tab === 'certifications' && (
              <div>
                <label style={S.label}>Certifications</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {resume.certifications.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input value={c} onChange={e => updateItem('certifications', i, null, e.target.value)} placeholder="AWS Solutions Architect 2024" style={{ ...S.input, flex: 1 }} />
                      {resume.certifications.length > 1 && <button onClick={() => removeItem('certifications', i)} style={S.removeBtn}>✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => addItem('certifications')} style={{ ...S.addBtn, marginTop: 8 }}>+ Add</button>
              </div>
            )}
          </div>

          <button onClick={downloadPDF} className="btn-primary" style={{ width: '100%', padding: '13px', cursor: 'pointer', fontSize: '1rem', marginTop: 4 }}>
            ⬇️ Download PDF — Free, No Watermark
          </button>
        </div>

        {/* Live Preview */}
        <div>
          <div style={S.label}>Live Preview</div>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'auto', boxShadow: 'var(--shadow-sm)', maxHeight: 700 }}>
            <div ref={previewRef} style={{ background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif', padding: '18mm 14mm', minHeight: '297mm', fontSize: 11 }}>
              {/* Header */}
              <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{resume.personal.name || 'Your Name'}</div>
                {resume.personal.title && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{resume.personal.title}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 9, color: '#374151' }}>
                  {resume.personal.email && <span>✉ {resume.personal.email}</span>}
                  {resume.personal.phone && <span>📞 {resume.personal.phone}</span>}
                  {resume.personal.location && <span>📍 {resume.personal.location}</span>}
                  {resume.personal.linkedin && <span>🔗 {resume.personal.linkedin}</span>}
                  {resume.personal.website && <span>🌐 {resume.personal.website}</span>}
                </div>
              </div>
              {resume.summary && <PrevSection title="PROFESSIONAL SUMMARY" accent={accent}><p style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>{resume.summary}</p></PrevSection>}
              {resume.experience.some(e => e.company) && (
                <PrevSection title="WORK EXPERIENCE" accent={accent}>
                  {resume.experience.filter(e => e.company).map((exp, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 11 }}>{exp.role}</strong>
                        <span style={{ fontSize: 9, color: '#9ca3af' }}>{exp.duration}</span>
                      </div>
                      <div style={{ fontSize: 10, color: accent, fontWeight: 600 }}>{exp.company}</div>
                      {exp.points.filter(Boolean).map((pt, pi) => <div key={pi} style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>• {pt}</div>)}
                    </div>
                  ))}
                </PrevSection>
              )}
              {resume.education.some(e => e.institution) && (
                <PrevSection title="EDUCATION" accent={accent}>
                  {resume.education.filter(e => e.institution).map((edu, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div><strong style={{ fontSize: 11 }}>{edu.degree}</strong><div style={{ fontSize: 10, color: accent }}>{edu.institution}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: '#9ca3af' }}>{edu.year}</div>{edu.gpa && <div style={{ fontSize: 9, color: '#6b7280' }}>{edu.gpa}</div>}</div>
                    </div>
                  ))}
                </PrevSection>
              )}
              {resume.skills.some(Boolean) && (
                <PrevSection title="SKILLS" accent={accent}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {resume.skills.filter(Boolean).map((s, i) => (
                      <span key={i} style={{ fontSize: 9, background: `${accent}18`, color: accent, padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </PrevSection>
              )}
              {resume.projects.some(p => p.name) && (
                <PrevSection title="PROJECTS" accent={accent}>
                  {resume.projects.filter(p => p.name).map((proj, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: 11 }}>{proj.name}</strong>
                      {proj.tech && <span style={{ fontSize: 9, color: accent, marginLeft: 6 }}>({proj.tech})</span>}
                      {proj.desc && <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>{proj.desc}</div>}
                    </div>
                  ))}
                </PrevSection>
              )}
              {resume.certifications.some(Boolean) && (
                <PrevSection title="CERTIFICATIONS" accent={accent}>
                  {resume.certifications.filter(Boolean).map((c, i) => <div key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2 }}>• {c}</div>)}
                </PrevSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
