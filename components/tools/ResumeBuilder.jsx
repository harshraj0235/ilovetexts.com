'use client';
import { useState, useRef } from 'react';

const TEMPLATES = [
  { id: 'classic', name: 'Classic', accent: '#1e3a5f' },
  { id: 'modern', name: 'Modern', accent: '#7c3aed' },
  { id: 'minimal', name: 'Minimal', accent: '#111827' },
  { id: 'creative', name: 'Creative', accent: '#dc2626' },
  { id: 'corporate', name: 'Corporate', accent: '#0369a1' },
];

const EMPTY_RESUME = {
  personal: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: '',
  experience: [{ company: '', role: '', duration: '', points: [''] }],
  education: [{ institution: '', degree: '', year: '', gpa: '' }],
  skills: [''],
  projects: [{ name: '', desc: '', tech: '' }],
  certifications: [''],
  languages: [''],
};

export default function ResumeBuilder({ t, lang }) {
  const [resume, setResume] = useState(EMPTY_RESUME);
  const [template, setTemplate] = useState('classic');
  const [activeTab, setActiveTab] = useState('personal');
  const [preview, setPreview] = useState(false);
  const previewRef = useRef();

  const accent = TEMPLATES.find(t => t.id === template)?.accent || '#1e3a5f';

  // Generic updaters
  const setField = (section, field, value) => setResume(r => ({ ...r, [section]: { ...r[section], [field]: value } }));
  const setSummary = (v) => setResume(r => ({ ...r, summary: v }));
  const addItem = (section) => setResume(r => ({ ...r, [section]: [...r[section], section === 'experience' ? { company: '', role: '', duration: '', points: [''] } : section === 'education' ? { institution: '', degree: '', year: '', gpa: '' } : section === 'projects' ? { name: '', desc: '', tech: '' } : ''] }));
  const removeItem = (section, idx) => setResume(r => ({ ...r, [section]: r[section].filter((_, i) => i !== idx) }));
  const updateItem = (section, idx, field, value) => setResume(r => {
    const arr = [...r[section]];
    if (typeof arr[idx] === 'string') arr[idx] = value;
    else arr[idx] = { ...arr[idx], [field]: value };
    return { ...r, [section]: arr };
  });
  const addExpPoint = (idx) => setResume(r => {
    const exp = [...r.experience];
    exp[idx] = { ...exp[idx], points: [...exp[idx].points, ''] };
    return { ...r, experience: exp };
  });
  const updateExpPoint = (idx, pi, val) => setResume(r => {
    const exp = [...r.experience];
    const pts = [...exp[idx].points];
    pts[pi] = val;
    exp[idx] = { ...exp[idx], points: pts };
    return { ...r, experience: exp };
  });

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = previewRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
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
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">📄</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Free Resume Builder</h1>
        <p className="text-gray-500 dark:text-gray-400">Professional resume in minutes — free PDF download, no watermark, no signup</p>
      </div>

      {/* Template selector */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {TEMPLATES.map(tmpl => (
          <button
            key={tmpl.id}
            onClick={() => setTemplate(tmpl.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all
              ${template === tmpl.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300'}`}
            style={template === tmpl.id ? { borderColor: tmpl.accent } : {}}
          >
            <span className="w-3 h-3 rounded-full inline-block mr-2" style={{ backgroundColor: tmpl.accent }} />
            {tmpl.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Tab nav */}
          <div className="flex gap-1 flex-wrap">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">

            {/* Personal */}
            {activeTab === 'personal' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['name', 'Full Name *', 'Harsh Raj'],
                  ['title', 'Job Title', 'Software Engineer'],
                  ['email', 'Email *', 'harsh@example.com'],
                  ['phone', 'Phone', '+91 98765 43210'],
                  ['location', 'Location', 'Mumbai, India'],
                  ['linkedin', 'LinkedIn URL', 'linkedin.com/in/harshitpatel9'],
                  ['website', 'Website / Portfolio', 'ilovetexts.com'],
                ].map(([field, label, placeholder]) => (
                  <div key={field} className={field === 'name' || field === 'title' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">{label}</label>
                    <input
                      value={resume.personal[field]}
                      onChange={e => setField('personal', field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {activeTab === 'summary' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Professional Summary</label>
                <textarea
                  value={resume.summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={6}
                  placeholder="Passionate software engineer with 3+ years experience building scalable web applications..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{resume.summary.length} characters</p>
              </div>
            )}

            {/* Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                {resume.experience.map((exp, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase">Experience {idx + 1}</span>
                      {resume.experience.length > 1 && (
                        <button onClick={() => removeItem('experience', idx)} className="text-red-400 hover:text-red-500 text-xs">✕ Remove</button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[['company', 'Company Name', 'Google India'], ['role', 'Job Title', 'Senior Engineer'], ['duration', 'Duration', 'Jan 2023 – Present']].map(([f, l, p]) => (
                        <input key={f} value={exp[f]} onChange={e => updateItem('experience', idx, f, e.target.value)}
                          placeholder={`${l} e.g. ${p}`}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500">Responsibilities / Achievements</label>
                      {exp.points.map((pt, pi) => (
                        <input key={pi} value={pt} onChange={e => updateExpPoint(idx, pi, e.target.value)}
                          placeholder={`• Achievement ${pi + 1}`}
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                      ))}
                      <button onClick={() => addExpPoint(idx)} className="text-xs text-purple-600 hover:underline">+ Add point</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('experience')} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-500 transition-colors">+ Add Experience</button>
              </div>
            )}

            {/* Education */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                {resume.education.map((edu, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Education {idx + 1}</span>
                      {resume.education.length > 1 && <button onClick={() => removeItem('education', idx)} className="text-red-400 text-xs">✕</button>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[['institution', 'Institution', 'IIT Bombay'], ['degree', 'Degree', 'B.Tech Computer Science'], ['year', 'Year', '2020 – 2024'], ['gpa', 'GPA / %', '8.5 / 10']].map(([f, l, p]) => (
                        <input key={f} value={edu[f]} onChange={e => updateItem('education', idx, f, e.target.value)}
                          placeholder={`${l} e.g. ${p}`}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('education')} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-500 transition-colors">+ Add Education</button>
              </div>
            )}

            {/* Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Skills (one per line or comma separated)</label>
                {resume.skills.map((skill, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input value={skill} onChange={e => updateItem('skills', idx, null, e.target.value)}
                      placeholder={`Skill ${idx + 1} e.g. React.js`}
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                    {resume.skills.length > 1 && <button onClick={() => removeItem('skills', idx)} className="text-red-400 hover:text-red-500 px-2">✕</button>}
                  </div>
                ))}
                <button onClick={() => addItem('skills')} className="text-sm text-purple-600 hover:underline">+ Add skill</button>
              </div>
            )}

            {/* Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {resume.projects.map((proj, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Project {idx + 1}</span>
                      {resume.projects.length > 1 && <button onClick={() => removeItem('projects', idx)} className="text-red-400 text-xs">✕</button>}
                    </div>
                    <input value={proj.name} onChange={e => updateItem('projects', idx, 'name', e.target.value)} placeholder="Project Name" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                    <textarea value={proj.desc} onChange={e => updateItem('projects', idx, 'desc', e.target.value)} placeholder="Brief description of the project..." rows={2} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 resize-none" />
                    <input value={proj.tech} onChange={e => updateItem('projects', idx, 'tech', e.target.value)} placeholder="Tech stack e.g. React, Node.js, MongoDB" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                  </div>
                ))}
                <button onClick={() => addItem('projects')} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm text-gray-500 hover:border-purple-400 transition-colors">+ Add Project</button>
              </div>
            )}

            {/* Certifications */}
            {activeTab === 'certifications' && (
              <div className="space-y-3">
                {resume.certifications.map((cert, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input value={cert} onChange={e => updateItem('certifications', idx, null, e.target.value)}
                      placeholder={`Certification e.g. AWS Solutions Architect 2024`}
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400" />
                    {resume.certifications.length > 1 && <button onClick={() => removeItem('certifications', idx)} className="text-red-400 px-2">✕</button>}
                  </div>
                ))}
                <button onClick={() => addItem('certifications')} className="text-sm text-purple-600 hover:underline">+ Add certification</button>
              </div>
            )}
          </div>

          <button onClick={downloadPDF} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
            ⬇️ Download PDF — Free, No Watermark
          </button>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Live Preview</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white">
            <div ref={previewRef} className="bg-white text-gray-900 font-sans" style={{ minHeight: '297mm', padding: '20mm 16mm' }}>

              {/* Header */}
              <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: '12px', marginBottom: '16px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: accent, margin: 0 }}>
                  {resume.personal.name || 'Your Name'}
                </h1>
                {resume.personal.title && (
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>{resume.personal.title}</p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#374151' }}>
                  {resume.personal.email && <span>✉ {resume.personal.email}</span>}
                  {resume.personal.phone && <span>📞 {resume.personal.phone}</span>}
                  {resume.personal.location && <span>📍 {resume.personal.location}</span>}
                  {resume.personal.linkedin && <span>🔗 {resume.personal.linkedin}</span>}
                  {resume.personal.website && <span>🌐 {resume.personal.website}</span>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <Section title="PROFESSIONAL SUMMARY" accent={accent}>
                  <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.6' }}>{resume.summary}</p>
                </Section>
              )}

              {/* Experience */}
              {resume.experience.some(e => e.company) && (
                <Section title="WORK EXPERIENCE" accent={accent}>
                  {resume.experience.filter(e => e.company).map((exp, i) => (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '12px', color: '#111827' }}>{exp.role}</strong>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{exp.duration}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: accent, fontWeight: '600' }}>{exp.company}</div>
                      {exp.points.filter(Boolean).map((pt, pi) => (
                        <div key={pi} style={{ fontSize: '10px', color: '#4b5563', marginTop: '3px' }}>• {pt}</div>
                      ))}
                    </div>
                  ))}
                </Section>
              )}

              {/* Education */}
              {resume.education.some(e => e.institution) && (
                <Section title="EDUCATION" accent={accent}>
                  {resume.education.filter(e => e.institution).map((edu, i) => (
                    <div key={i} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#111827' }}>{edu.degree}</strong>
                        <div style={{ fontSize: '11px', color: accent }}>{edu.institution}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>{edu.year}</div>
                        {edu.gpa && <div style={{ fontSize: '10px', color: '#6b7280' }}>{edu.gpa}</div>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Skills */}
              {resume.skills.some(Boolean) && (
                <Section title="SKILLS" accent={accent}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resume.skills.filter(Boolean).map((skill, i) => (
                      <span key={i} style={{ fontSize: '10px', background: accent + '15', color: accent, padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>{skill}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Projects */}
              {resume.projects.some(p => p.name) && (
                <Section title="PROJECTS" accent={accent}>
                  {resume.projects.filter(p => p.name).map((proj, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <strong style={{ fontSize: '12px', color: '#111827' }}>{proj.name}</strong>
                      {proj.tech && <span style={{ fontSize: '10px', color: accent, marginLeft: '8px' }}>({proj.tech})</span>}
                      {proj.desc && <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>{proj.desc}</div>}
                    </div>
                  ))}
                </Section>
              )}

              {/* Certifications */}
              {resume.certifications.some(Boolean) && (
                <Section title="CERTIFICATIONS" accent={accent}>
                  {resume.certifications.filter(Boolean).map((cert, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#374151', marginBottom: '3px' }}>• {cert}</div>
                  ))}
                </Section>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '11px', fontWeight: '800', color: accent, letterSpacing: '1.5px', borderBottom: `1px solid ${accent}30`, paddingBottom: '4px', marginBottom: '8px' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
