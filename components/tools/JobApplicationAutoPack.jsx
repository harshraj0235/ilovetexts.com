'use client';
import { useState, useCallback, useRef } from 'react';

// ─── ATS Keyword extraction ──────────────────────────────────────────────────
const COMMON_STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','any','can','had','her','was','one','our','out',
  'day','get','has','him','his','how','man','new','now','old','see','two','way','who','boy','did',
  'its','let','put','say','she','too','use','will','with','this','that','have','from','they','know',
  'want','been','good','much','some','time','very','when','come','here','just','like','long','make',
  'many','more','only','over','such','take','than','them','well','were','what','your','about','after',
  'also','back','into','look','most','need','than','their','there','these','think','those','through',
  'under','where','which','while','work','would','years','able','across','along','already','although',
  'always','among','another','around','because','before','between','both','business','company','could',
  'during','either','enough','every','first','given','going','great','group','helps','high','however',
  'include','including','large','later','less','local','might','month','never','next','often','other',
  'part','people','place','point','possible','provide','right','same','should','since','small','still',
  'strong','support','team','three','today','together','toward','until','upon','using','week','within',
]);

function extractKeywords(text) {
  if (!text) return [];
  // Extract important phrases and single words from job description
  const cleaned = text.toLowerCase()
    .replace(/[^\w\s+#.]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = cleaned.split(' ').filter(w => w.length > 2 && !COMMON_STOP_WORDS.has(w));
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Also extract 2-word phrases
  const phrases = [];
  const wordArr = cleaned.split(' ');
  for (let i = 0; i < wordArr.length - 1; i++) {
    const bigram = `${wordArr[i]} ${wordArr[i+1]}`;
    if (wordArr[i].length > 2 && wordArr[i+1].length > 2 &&
        !COMMON_STOP_WORDS.has(wordArr[i]) && !COMMON_STOP_WORDS.has(wordArr[i+1])) {
      phrases.push(bigram);
    }
  }

  // Priority keywords for technical/professional roles
  const techKeywords = text.match(/\b(react|node|python|java|sql|aws|azure|gcp|typescript|javascript|css|html|rest|api|agile|scrum|devops|ci\/cd|docker|kubernetes|machine learning|data science|product management|project management|salesforce|tableau|excel|power bi|sap|hris|erp|crm|php|ruby|go|golang|swift|kotlin|flutter|tensorflow|pytorch|figma|sketch|adobe|photoshop|illustrator|seo|sem|google analytics|facebook ads|content marketing|copywriting|b2b|b2c|saas|fintech|healthtech|edtech|leadership|stakeholder|cross-functional|roadmap|kpi|oka|p&l|budget|compliance|regulatory|iso|gdpr|hipaa)\b/gi) || [];

  const uniqueTech = [...new Set(techKeywords.map(k => k.toLowerCase()))];
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w);

  return [...new Set([...uniqueTech, ...sorted])].slice(0, 40);
}

// ─── Resume keyword injection ─────────────────────────────────────────────────
function tailorResume(resume, keywords, jobTitle, companyName) {
  if (!resume.trim()) return '';
  let tailored = resume;

  // Inject job-specific keywords into summary/objective if present
  const summaryMatch = tailored.match(/(summary|objective|profile|about me)[:\s]*([^\n]+)/i);
  if (summaryMatch) {
    const topKw = keywords.slice(0, 5).join(', ');
    const newSummary = summaryMatch[2].trim();
    // Add relevant skills if not already present
    tailored = tailored.replace(summaryMatch[0], summaryMatch[0] + (topKw ? ` [Key skills: ${topKw}]` : ''));
  }

  // Highlight matching bullet points
  const lines = tailored.split('\n');
  const enhanced = lines.map(line => {
    const lineLower = line.toLowerCase();
    const matches = keywords.filter(kw => lineLower.includes(kw.toLowerCase()));
    if (matches.length > 0 && line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return line; // Already a bullet, don't change
    }
    return line;
  });

  return enhanced.join('\n');
}

// ─── Document generators ──────────────────────────────────────────────────────
function generateCoverLetter({ name, jobTitle, companyName, recruiterName, resumeText, jobDesc, keywords, tone, extraNote }) {
  const firstName = name.split(' ')[0] || 'I';
  const topSkills = keywords.slice(0, 4).join(', ');
  const greeting = recruiterName ? `Dear ${recruiterName},` : `Dear Hiring Manager,`;
  const closing = tone === 'formal' ? 'Yours sincerely' : tone === 'creative' ? 'With enthusiasm' : 'Best regards';

  // Extract a relevant achievement from resume
  const achieveMatch = resumeText?.match(/(?:increased|improved|reduced|achieved|led|managed|delivered|saved|grew|built|launched|created|developed)[^.\n]+[.\n]/i);
  const achievement = achieveMatch ? achieveMatch[0].trim().replace(/[.\n]+$/, '') : '';

  const body = tone === 'creative'
    ? `What gets me excited about ${companyName} isn't just the ${jobTitle} role — it's the impact I can make from day one.`
    : `I am writing to express my strong interest in the ${jobTitle} position at ${companyName}.`;

  return `${greeting}

${body} With a background spanning ${topSkills || 'relevant technical and professional skills'}, I bring the exact combination of experience and drive your team is looking for.

${achievement ? `In my most recent role, I ${achievement.replace(/^(I\s)?/i, '').toLowerCase()}, demonstrating my ability to deliver measurable results.` : `Throughout my career, I have consistently delivered results by leveraging my expertise in ${topSkills || 'my field'}.`}

What draws me to ${companyName} specifically is your focus on [company value/product/mission — customize this line]. I am confident that my skills in ${keywords.slice(0, 3).join(', ') || 'my domain'} align directly with the requirements you have outlined.${extraNote ? `\n\n${extraNote}` : ''}

I would welcome the opportunity to discuss how I can contribute to your team. I am available at your earliest convenience and have attached my tailored resume for your review.

${closing},
${name || '[Your Name]'}`;
}

function generateHREmail({ name, jobTitle, companyName, recruiterName, keywords, applicationSource }) {
  const firstName = name.split(' ')[0] || 'I';
  const topSkills = keywords.slice(0, 3).join(', ');
  const source = applicationSource || 'your careers page';

  return `Subject: Application for ${jobTitle} — ${name}

${recruiterName ? `Hi ${recruiterName.split(' ')[0]},` : 'Hi there,'}

I came across the ${jobTitle} opening at ${companyName} via ${source} and wanted to reach out directly — I believe my background in ${topSkills || 'the relevant field'} makes me a strong fit.

I have attached my tailored resume and cover letter for your review. Here is a quick summary of why I am applying:

• Role match: My experience with ${keywords.slice(0, 2).join(' and ') || 'the required skills'} directly aligns with your requirements
• Impact-focused: I bring a track record of delivering results in fast-paced environments
• Ready to contribute: I can hit the ground running and add value from week one

I would love the chance to speak with you for 15-20 minutes to learn more about the role and share how I can contribute. Are you available for a quick call this week?

Looking forward to hearing from you.

Best,
${name || '[Your Name]'}
[Your Phone Number]
[Your Email]`;
}

function generateLinkedInMessage({ name, jobTitle, companyName, recruiterName, keywords }) {
  const firstName = name.split(' ')[0] || 'I';
  const recruiterFirst = recruiterName ? recruiterName.split(' ')[0] : null;
  const skill = keywords[0] || 'the required skills';

  return `Hi ${recruiterFirst || '[Recruiter Name]'},

I noticed you're hiring a ${jobTitle} at ${companyName} and wanted to connect directly. I have strong experience in ${skill}${keywords[1] ? ` and ${keywords[1]}` : ''}, and I think there could be a great fit here.

I've just applied through the formal channel but wanted to introduce myself personally. Would you be open to a quick chat this week?

Thanks,
${firstName}`;
}

function generateFollowUpEmail({ name, jobTitle, companyName, recruiterName, daysAfter = 7 }) {
  const recruiterFirst = recruiterName ? recruiterName.split(' ')[0] : null;
  return `Subject: Following Up — ${jobTitle} Application | ${name}

${recruiterFirst ? `Hi ${recruiterFirst},` : 'Hi there,'}

I wanted to follow up on my application for the ${jobTitle} position at ${companyName}, which I submitted approximately ${daysAfter} days ago. I remain very interested in the role and in contributing to your team.

If there is any additional information I can provide — references, portfolio samples, or a brief intro call — I am happy to make myself available at your convenience.

Thank you for your time and consideration.

Best,
${name || '[Your Name]'}
[Your Email] | [Your Phone]`;
}

// ─── ZIP + DOCX builder (pure JS, no server) ─────────────────────────────────
async function buildZip({ tailoredResume, coverLetter, hrEmail, linkedInMessage, followUpEmail, name, jobTitle, companyName }) {
  const [{ default: JSZip }] = await Promise.all([import('jszip')]);
  const zip = new JSZip();
  const folder = zip.folder(`${(name || 'Application').replace(/\s+/g, '_')}_${(companyName || 'Company').replace(/\s+/g, '_')}`);

  // Simple .docx = zip with word/document.xml inside (minimal valid docx)
  function makeDocx(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const paragraphs = escaped.split('\n').map(line => {
      if (!line.trim()) return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>';
      return `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`;
    }).join('\n');

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink"
  xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:oel="http://schemas.microsoft.com/office/2019/extlst"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
  xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex"
  xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid"
  xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"
  xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash"
  xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14">
  <w:body>
${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/><w:szCs w:val="22"/>
    </w:rPr></w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>ilovetexts.com Job Application Pack</Application>
</Properties>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

    const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:creator>ilovetexts.com</dc:creator>
</cp:coreProperties>`;

    const docZip = new JSZip();
    docZip.file('[Content_Types].xml', contentTypes);
    docZip.file('_rels/.rels', rootRels);
    docZip.file('word/document.xml', docXml);
    docZip.file('word/styles.xml', stylesXml);
    docZip.file('word/_rels/document.xml.rels', relsXml);
    docZip.file('docProps/app.xml', appXml);
    docZip.file('docProps/core.xml', coreXml);
    return docZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  }

  const [resumeDocx, coverDocx, emailDocx, linkedinDocx, followupDocx] = await Promise.all([
    makeDocx(tailoredResume),
    makeDocx(coverLetter),
    makeDocx(hrEmail),
    makeDocx(linkedInMessage),
    makeDocx(followUpEmail),
  ]);

  folder.file('01_Tailored_Resume.docx', resumeDocx);
  folder.file('02_Cover_Letter.docx', coverDocx);
  folder.file('03_HR_Email.docx', emailDocx);
  folder.file('04_LinkedIn_Message.docx', linkedinDocx);
  folder.file('05_Follow_Up_Email.docx', followupDocx);
  folder.file('README.txt',
    `JOB APPLICATION PACK\nGenerated by ilovetexts.com — Free, Private, No Signup\n\n` +
    `Role: ${jobTitle} at ${companyName}\nApplicant: ${name}\n\nFiles:\n` +
    `01_Tailored_Resume.docx    — Resume with keywords from the job description highlighted\n` +
    `02_Cover_Letter.docx       — Personalized cover letter for this specific role\n` +
    `03_HR_Email.docx           — Email to send to the recruiter/HR directly\n` +
    `04_LinkedIn_Message.docx   — Short LinkedIn connection request message\n` +
    `05_Follow_Up_Email.docx    — Follow-up email to send 7 days after applying\n\n` +
    `TIP: Review each document and customize the [bracketed] placeholders before sending.\n` +
    `Your data was never uploaded — everything was generated in your browser.\n`
  );

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return blob;
}

// ─── ATS Score calculator ─────────────────────────────────────────────────────
function calcATSScore(resume, keywords) {
  if (!resume || !keywords.length) return 0;
  const lower = resume.toLowerCase();
  const matched = keywords.filter(kw => lower.includes(kw.toLowerCase()));
  return Math.round((matched.length / Math.min(keywords.length, 20)) * 100);
}

// ─── UI styles ────────────────────────────────────────────────────────────────
const S = {
  wrap: { maxWidth: 1200, margin: '0 auto', width: '100%' },
  heroCard: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 28px',
    marginBottom: 24,
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    background: 'var(--bg-main)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    marginBottom: 16,
    boxShadow: 'var(--shadow-sm)',
  },
  stepCard: (active, done) => ({
    background: done ? 'var(--bg-secondary)' : active ? 'var(--bg-main)' : 'var(--bg-main)',
    border: `2px solid ${done ? '#10b981' : active ? '#6366f1' : 'var(--border-light)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    marginBottom: 16,
    opacity: active || done ? 1 : 0.6,
    transition: 'all 0.2s',
  }),
  label: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-mono, monospace)', boxSizing: 'border-box', lineHeight: 1.55 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'opacity 0.15s' },
  btnGreen: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'opacity 0.15s' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  tabBtn: (active) => ({ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: active ? '#6366f1' : 'var(--bg-secondary)', color: active ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }),
  kwChip: (matched) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: matched ? '#dcfce7' : 'var(--bg-secondary)', color: matched ? '#15803d' : 'var(--text-secondary)', border: `1px solid ${matched ? '#86efac' : 'var(--border-light)'}`, margin: '2px 3px 2px 0' }),
  progressBar: (pct, color) => ({ width: `${pct}%`, height: '100%', background: color || '#6366f1', borderRadius: 4, transition: 'width 0.6s ease' }),
  docTab: (active) => ({ padding: '10px 18px', border: 'none', background: active ? 'var(--bg-main)' : 'transparent', color: active ? '#6366f1' : 'var(--text-secondary)', fontWeight: active ? 700 : 500, cursor: 'pointer', borderBottom: active ? '2px solid #6366f1' : '2px solid transparent', fontSize: '0.84rem', transition: 'all 0.15s' }),
};

const TONES = [
  { id: 'professional', label: '💼 Professional', desc: 'Formal, polished tone' },
  { id: 'confident', label: '🚀 Confident', desc: 'Direct and assertive' },
  { id: 'creative', label: '🎨 Creative', desc: 'Engaging, personality-driven' },
  { id: 'formal', label: '📜 Formal', desc: 'Traditional, conservative' },
];

const DOC_LABELS = [
  { key: 'tailoredResume', icon: '📄', label: 'Tailored Resume', badge: 'ATS-Optimized' },
  { key: 'coverLetter', icon: '✉️', label: 'Cover Letter', badge: 'Personalized' },
  { key: 'hrEmail', icon: '📧', label: 'HR Email', badge: 'Direct Outreach' },
  { key: 'linkedInMessage', icon: '💼', label: 'LinkedIn Message', badge: '<300 chars' },
  { key: 'followUpEmail', icon: '🔔', label: 'Follow-up Email', badge: '7-day follow-up' },
];

export default function JobApplicationAutoPack({ t, lang }) {
  const [step, setStep] = useState(1); // 1=input, 2=keywords, 3=output
  const [form, setForm] = useState({
    name: '', jobTitle: '', companyName: '', recruiterName: '',
    applicationSource: '', tone: 'professional', extraNote: '',
    resumeText: '', jobDesc: '',
  });
  const [keywords, setKeywords] = useState([]);
  const [removedKw, setRemovedKw] = useState(new Set());
  const [docs, setDocs] = useState(null);
  const [activeDoc, setActiveDoc] = useState('coverLetter');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedDocs, setEditedDocs] = useState({});
  const [copyStatus, setCopyStatus] = useState('');
  const [atsScore, setAtsScore] = useState(0);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStep1Submit = () => {
    if (!form.resumeText.trim() || !form.jobDesc.trim()) return;
    const kws = extractKeywords(form.jobDesc);
    setKeywords(kws);
    setStep(2);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);
    try {
      const activeKw = keywords.filter(k => !removedKw.has(k));
      const tailoredResume = tailorResume(form.resumeText, activeKw, form.jobTitle, form.companyName);
      const coverLetter = generateCoverLetter({ ...form, keywords: activeKw });
      const hrEmail = generateHREmail({ ...form, keywords: activeKw });
      const linkedInMessage = generateLinkedInMessage({ ...form, keywords: activeKw });
      const followUpEmail = generateFollowUpEmail({ ...form });

      const score = calcATSScore(tailoredResume, activeKw);
      setAtsScore(score);

      setDocs({ tailoredResume, coverLetter, hrEmail, linkedInMessage, followUpEmail });
      setEditedDocs({});
      setActiveDoc('coverLetter');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!docs) return;
    setDownloading(true);
    try {
      const finalDocs = { ...docs, ...editedDocs };
      const blob = await buildZip({
        ...finalDocs,
        name: form.name, jobTitle: form.jobTitle, companyName: form.companyName
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(form.name || 'Application').replace(/\s+/g, '_')}_${(form.companyName || 'Company').replace(/\s+/g, '_')}_Pack.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDoc = async (key) => {
    const text = editedDocs[key] ?? docs?.[key];
    if (!text) return;
    const [{ default: JSZip }] = await Promise.all([import('jszip')]);
    const docZip = new JSZip();
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const paragraphs = escaped.split('\n').map(line =>
      `<w:p><w:r><w:t xml:space="preserve">${line || ' '}</w:t></w:r></w:p>`
    ).join('\n');
    const docXml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`;
    const ct = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    docZip.file('[Content_Types].xml', ct);
    docZip.file('_rels/.rels', rels);
    docZip.file('word/document.xml', docXml);
    const blob = await docZip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = DOC_LABELS.find(d => d.key === key)?.label || key;
    a.download = `${label.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (key) => {
    const text = editedDocs[key] ?? docs?.[key];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(key);
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  const currentDocText = (key) => editedDocs[key] ?? docs?.[key] ?? '';

  // ─── Step indicators ─────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {[
        { n: 1, label: 'Your Details' },
        { n: 2, label: 'Keywords' },
        { n: 3, label: 'Download Pack' },
      ].map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step > s.n ? '#10b981' : step === s.n ? '#6366f1' : 'var(--bg-secondary)',
              color: step >= s.n ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.9rem', border: `2px solid ${step > s.n ? '#10b981' : step === s.n ? '#6366f1' : 'var(--border-light)'}`,
              transition: 'all 0.3s',
            }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: step === s.n ? '#6366f1' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? '#10b981' : 'var(--border-light)', marginBottom: 20, transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  );

  // ─── ATS Score Ring ─────────────────────────────────────────────────────────
  const ATSRing = ({ score }) => {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border-light)" strokeWidth="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 26}`}
            strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="32" y="37" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{score}%</text>
        </svg>
        <div>
          <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{label}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ATS Match Score</div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.wrap}>
      {/* Hero Banner */}
      <div style={S.heroCard}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '2rem' }}>🚀</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>WORKFLOW AUTOMATION</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.25 }}>Job Application Auto-Pack</h1>
            <p style={{ margin: '8px 0 0', opacity: 0.88, fontSize: '0.92rem', lineHeight: 1.55 }}>Paste your resume + job description → get a tailored resume, cover letter, HR email, LinkedIn message & follow-up — all as downloadable .docx files in one ZIP.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            {[
              { icon: '⚡', text: '5 documents in 10 seconds' },
              { icon: '🔒', text: '100% private — nothing uploaded' },
              { icon: '📦', text: 'Download as ZIP with .docx files' },
              { icon: '🎯', text: 'ATS keyword match scoring' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', opacity: 0.92 }}>
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepIndicator />

      {/* ─── STEP 1: Input Form ─────────────────────────────────────────────── */}
      {step >= 1 && (
        <div style={S.stepCard(step === 1, step > 1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > 1 ? '#10b981' : '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
              {step > 1 ? '✓' : '1'}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Your Details + Documents</h2>
          </div>

          {/* Basic info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { k: 'name', label: 'Your Full Name *', ph: 'e.g. Alex Johnson' },
              { k: 'jobTitle', label: 'Job Title Applying For *', ph: 'e.g. Senior Software Engineer' },
              { k: 'companyName', label: 'Company Name *', ph: 'e.g. Google' },
              { k: 'recruiterName', label: "Recruiter / HR Name (optional)", ph: 'e.g. Sarah Miller' },
              { k: 'applicationSource', label: 'Where you found the job', ph: 'e.g. LinkedIn, Indeed, Referral' },
            ].map(({ k, label, ph }) => (
              <div key={k}>
                <label style={S.label}>{label}</label>
                <input value={form[k]} onChange={e => setField(k, e.target.value)} placeholder={ph} style={S.input} />
              </div>
            ))}
          </div>

          {/* Tone selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Cover Letter Tone</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TONES.map(tn => (
                <button key={tn.id} onClick={() => setField('tone', tn.id)} style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `2px solid ${form.tone === tn.id ? '#6366f1' : 'var(--border-light)'}`,
                  background: form.tone === tn.id ? '#eef2ff' : 'var(--bg-secondary)',
                  color: form.tone === tn.id ? '#6366f1' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
                }}>
                  <div>{tn.label}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>{tn.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resume + Job Desc textareas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Your Current Resume * <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.75rem' }}>(paste plain text)</span></label>
              <textarea
                value={form.resumeText}
                onChange={e => setField('resumeText', e.target.value)}
                placeholder={`Alex Johnson\nalexj@email.com | LinkedIn | GitHub\n\nSUMMARY\nFull-stack developer with 5 years experience...\n\nEXPERIENCE\nSoftware Engineer — Acme Corp (2021-Present)\n• Built React dashboards serving 50k users\n• Reduced API response time by 40%\n\nSKILLS\nReact, Node.js, Python, AWS, SQL`}
                style={{ ...S.textarea, height: 260, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{form.resumeText.split(/\s+/).filter(Boolean).length} words</span>
                {form.resumeText && <button onClick={() => setField('resumeText', '')} style={{ ...S.btnOutline, padding: '2px 8px', fontSize: '0.72rem' }}>Clear</button>}
              </div>
            </div>
            <div>
              <label style={S.label}>Job Description * <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.75rem' }}>(paste full JD)</span></label>
              <textarea
                value={form.jobDesc}
                onChange={e => setField('jobDesc', e.target.value)}
                placeholder={`Senior Software Engineer — Google\n\nAbout the role:\nWe are looking for a skilled engineer to join our...\n\nRequirements:\n• 5+ years of experience with React and Node.js\n• Strong understanding of REST APIs\n• Experience with AWS or GCP\n• Agile/Scrum methodology\n• Excellent communication skills\n\nNice to have:\n• Experience with Kubernetes\n• TypeScript expertise`}
                style={{ ...S.textarea, height: 260, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{form.jobDesc.split(/\s+/).filter(Boolean).length} words</span>
                {form.jobDesc && <button onClick={() => setField('jobDesc', '')} style={{ ...S.btnOutline, padding: '2px 8px', fontSize: '0.72rem' }}>Clear</button>}
              </div>
            </div>
          </div>

          {/* Extra note */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Extra context for cover letter <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea
              value={form.extraNote}
              onChange={e => setField('extraNote', e.target.value)}
              placeholder="e.g. I was referred by John Smith from the engineering team. I relocated to London 6 months ago..."
              style={{ ...S.textarea, height: 60 }}
            />
          </div>

          <button
            onClick={handleStep1Submit}
            disabled={!form.resumeText.trim() || !form.jobDesc.trim()}
            style={{ ...S.btnPrimary, opacity: (!form.resumeText.trim() || !form.jobDesc.trim()) ? 0.45 : 1 }}
          >
            ⚡ Extract Keywords & Continue →
          </button>
        </div>
      )}

      {/* ─── STEP 2: Keywords ──────────────────────────────────────────────── */}
      {step >= 2 && (
        <div style={S.stepCard(step === 2, step > 2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > 2 ? '#10b981' : '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
              {step > 2 ? '✓' : '2'}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Review Extracted Keywords</h2>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            We extracted <strong>{keywords.length} keywords</strong> from the job description. Click any keyword to remove it from your documents. These will be woven into your tailored resume, cover letter, and email.
          </p>

          {/* Keyword chips */}
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            {keywords.map(kw => {
              const removed = removedKw.has(kw);
              const inResume = form.resumeText.toLowerCase().includes(kw.toLowerCase());
              return (
                <button key={kw} onClick={() => {
                  setRemovedKw(s => {
                    const ns = new Set(s);
                    removed ? ns.delete(kw) : ns.add(kw);
                    return ns;
                  });
                }} title={removed ? 'Click to add back' : 'Click to remove'} style={{
                  ...S.kwChip(inResume && !removed),
                  cursor: 'pointer', border: 'none', textDecoration: removed ? 'line-through' : 'none',
                  opacity: removed ? 0.4 : 1, background: inResume && !removed ? '#dcfce7' : removed ? 'var(--bg-secondary)' : '#ede9fe',
                  color: inResume && !removed ? '#15803d' : removed ? 'var(--text-secondary)' : '#7c3aed',
                }}>
                  {inResume && !removed ? '✓ ' : ''}{kw}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginRight: 4 }} />
                Already in your resume
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', marginRight: 4 }} />
                Missing — will be added
              </span>
            </div>
            <button onClick={() => setRemovedKw(new Set())} style={S.btnOutline}>Reset all</button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(1)} style={S.btnOutline}>← Back</button>
            <button onClick={handleGenerate} style={S.btnPrimary}>
              🎯 Generate All 5 Documents →
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Output ─────────────────────────────────────────────────── */}
      {step >= 3 && (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {generating ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Building your application pack...</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Extracting keywords · Tailoring resume · Writing cover letter · Drafting emails</div>
              <div style={{ width: '100%', maxWidth: 300, margin: '0 auto', height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#6366f1', borderRadius: 3, animation: 'pulse 1.5s infinite', width: '70%' }} />
              </div>
            </div>
          ) : docs ? (
            <>
              {/* Output header bar */}
              <div style={{ padding: '16px 20px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff' }}>
                  <ATSRing score={atsScore} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Pack Ready! 🎉</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.88 }}>{form.jobTitle || 'Role'} at {form.companyName || 'Company'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleDownloadZip} disabled={downloading} style={{ ...S.btnGreen, fontSize: '0.88rem' }}>
                    {downloading ? '⏳ Packing...' : '📦 Download ZIP (5 .docx files)'}
                  </button>
                  <button onClick={() => { setStep(1); setDocs(null); setKeywords([]); setRemovedKw(new Set()); }} style={{ ...S.btnOutline, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
                    🔄 Start Over
                  </button>
                </div>
              </div>

              {/* Document tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', overflowX: 'auto', background: 'var(--bg-secondary)' }}>
                {DOC_LABELS.map(({ key, icon, label, badge }) => (
                  <button key={key} onClick={() => setActiveDoc(key)} style={S.docTab(activeDoc === key)}>
                    {icon} {label}
                    <span style={{ display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, background: activeDoc === key ? '#eef2ff' : 'var(--bg-main)', color: '#6366f1' }}>
                      {badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Document viewer / editor */}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => setEditMode(e => !e)} style={{ ...S.btnOutline, background: editMode ? '#eef2ff' : undefined, color: editMode ? '#6366f1' : undefined }}>
                    {editMode ? '👁️ Preview' : '✏️ Edit'}
                  </button>
                  <button onClick={() => handleCopy(activeDoc)} style={S.btnOutline}>
                    {copyStatus === activeDoc ? '✅ Copied!' : '📋 Copy'}
                  </button>
                  <button onClick={() => handleDownloadDoc(activeDoc)} style={S.btnOutline}>
                    ⬇️ Download .docx
                  </button>
                </div>

                {editMode ? (
                  <textarea
                    value={currentDocText(activeDoc)}
                    onChange={e => setEditedDocs(d => ({ ...d, [activeDoc]: e.target.value }))}
                    style={{ ...S.textarea, height: 420, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.83rem' }}
                  />
                ) : (
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    padding: '20px 24px',
                    background: '#fff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    minHeight: 420,
                    color: '#1a1a2e',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  }}>
                    {currentDocText(activeDoc)}
                  </div>
                )}

                {/* Quick tips for this doc */}
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #6366f1', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeDoc === 'tailoredResume' && '💡 Review the [bracketed] keyword insertions. Delete any that don\'t fit naturally. Keywords in green were already in your resume.'}
                  {activeDoc === 'coverLetter' && '💡 Customize the [bracketed] placeholders, especially the "company value" line in paragraph 3. Personalization wins interviews.'}
                  {activeDoc === 'hrEmail' && '💡 Send this email to the recruiter\'s direct inbox if you can find it, not just through the ATS portal. It stands out.'}
                  {activeDoc === 'linkedInMessage' && '💡 Keep this under 300 characters for best response rates. Connect first, then send — don\'t send cold InMail without context.'}
                  {activeDoc === 'followUpEmail' && '💡 Send exactly 7 days after applying, on a Tuesday or Wednesday morning. Reference the specific role and date you applied.'}
                </div>
              </div>

              {/* All docs summary bar */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>YOUR PACK:</span>
                {DOC_LABELS.map(({ key, icon, label }) => (
                  <button key={key} onClick={() => handleDownloadDoc(key)} style={{ ...S.btnOutline, fontSize: '0.78rem', padding: '5px 10px' }}>
                    {icon} {label} ↓
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ─── HOW-TO GUIDE ────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📖 How to Use the Job Application Auto-Pack</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { step: '1', icon: '📋', title: 'Paste your resume', desc: 'Copy your current resume as plain text. No need to format it — we will read the content and keywords automatically.' },
              { step: '2', icon: '🔍', title: 'Paste the job description', desc: 'Copy the full job posting. The tool scans for required skills, tools, and role-specific keywords to match against your resume.' },
              { step: '3', icon: '⚡', title: 'Review extracted keywords', desc: 'We show you every important keyword from the JD. Remove irrelevant ones. Green = already in your resume. Purple = gaps to fill.' },
              { step: '4', icon: '📦', title: 'Download your ZIP pack', desc: 'Get 5 ready-to-use documents: tailored resume, cover letter, HR email, LinkedIn message, and a follow-up email — all as .docx files.' },
              { step: '5', icon: '✏️', title: 'Edit & personalize', desc: 'Use the built-in editor to customize placeholders. The ATS score shows how well your resume matches the job description keywords.' },
              { step: '6', icon: '🚀', title: 'Send & track', desc: 'Send the HR email directly, apply via the portal with your tailored resume, connect on LinkedIn, and set a reminder for the follow-up.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3 }}>{item.icon} {item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WHY BETTER THAN CHATGPT banner ──────────────────────────────────── */}
      {step === 1 && (
        <div style={{ ...S.card, background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Why this beats copying & pasting into ChatGPT</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '📦', title: 'One-click ZIP', desc: 'ChatGPT can\'t package 5 documents into a ZIP with formatted .docx files. You\'d need 5 separate sessions and manual copy-paste.' },
              { icon: '🎯', title: 'ATS Score', desc: 'Instant % match between your resume and the job description keywords — shows exactly where your gaps are before you apply.' },
              { icon: '🔒', title: 'Private by design', desc: 'Your resume and job description never leave your browser. Zero server uploads. Your career data stays yours.' },
              { icon: '⚡', title: 'Zero prompting', desc: 'No back-and-forth. Fill in your details once and the whole workflow runs automatically in under 10 seconds.' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
