'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 4: Bulk Appointment & Offer Letter Generator
   Upload employee details → fill letter template
   → export individual PDFs
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Employee Name', required: true, sample: 'Ravi Kumar' },
  { key: 'designation', label: 'Designation / Position', required: true, sample: 'Software Engineer' },
  { key: 'joiningDate', label: 'Joining Date', required: true, sample: '2026-11-01' },
];

const OPTIONAL_FIELDS = [
  { key: 'department', label: 'Department', sample: 'Engineering' },
  { key: 'salary', label: 'CTC / Salary', sample: '₹8,00,000 per annum' },
  { key: 'location', label: 'Work Location', sample: 'Bangalore' },
  { key: 'reportingTo', label: 'Reporting Manager', sample: 'Ms. Anita Roy' },
  { key: 'employeeId', label: 'Employee ID', sample: 'EMP-2026-045' },
  { key: 'email', label: 'Email', sample: 'ravi.kumar@company.com' },
  { key: 'probation', label: 'Probation Period', sample: '6 months' },
  { key: 'address', label: 'Employee Address', sample: '42 MG Road, Bangalore 560001' },
];

const SAMPLE_DATA = [
  { 'Employee Name': 'Ravi Kumar', 'Designation / Position': 'Software Engineer', 'Joining Date': '2026-11-01', 'Department': 'Engineering', 'CTC / Salary': '₹8,00,000 per annum', 'Work Location': 'Bangalore', 'Reporting Manager': 'Ms. Anita Roy', 'Employee ID': 'EMP-2026-045', 'Probation Period': '6 months' },
  { 'Employee Name': 'Sneha Reddy', 'Designation / Position': 'Product Manager', 'Joining Date': '2026-11-15', 'Department': 'Product', 'CTC / Salary': '₹12,00,000 per annum', 'Work Location': 'Hyderabad', 'Reporting Manager': 'Mr. Vikram Singh', 'Employee ID': 'EMP-2026-046', 'Probation Period': '3 months' },
];

const DEFAULT_SETTINGS = {
  companyName: 'TechVista Solutions Pvt. Ltd.',
  companyAddress: 'Tower B, Floor 14, Cyber Hub\nGurugram, Haryana — 122002',
  letterType: 'offer', // offer | appointment
  letterDate: new Date().toISOString().split('T')[0],
  primaryColor: '#1a237e',
  accentColor: '#ffd600',
  signatoryName: 'Anita Roy',
  signatoryTitle: 'Head of Human Resources',
  showLogo: true,
  termsText: `1. This offer is subject to successful completion of background verification.\n2. You are required to serve a probation period as mentioned above.\n3. During employment, you shall maintain confidentiality of all proprietary information.\n4. Either party may terminate this agreement with 30 days written notice.\n5. You are expected to adhere to the company's code of conduct and policies.`,
};

function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>Company Name <input value={settings.companyName} onChange={e => up('companyName', e.target.value)} /></label>
    <label>Company Address <textarea rows={2} value={settings.companyAddress} onChange={e => up('companyAddress', e.target.value)} /></label>
    <label>Letter Type
      <select value={settings.letterType} onChange={e => up('letterType', e.target.value)}>
        <option value="offer">Offer Letter</option>
        <option value="appointment">Appointment Letter</option>
      </select>
    </label>
    <label>Letter Date <input type="date" value={settings.letterDate} onChange={e => up('letterDate', e.target.value)} /></label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Signatory Name <input value={settings.signatoryName} onChange={e => up('signatoryName', e.target.value)} /></label>
    <label>Signatory Title <input value={settings.signatoryTitle} onChange={e => up('signatoryTitle', e.target.value)} /></label>
    <label>Terms & Conditions <textarea rows={6} value={settings.termsText} onChange={e => up('termsText', e.target.value)} /></label>
  </>;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function renderLetterCanvas(row, mapping, settings, index) {
  const W = 850;
  const H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const M = 60; // margin

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Left accent bar
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(0, 0, 6, H);

  // Header
  ctx.fillStyle = settings.primaryColor;
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(settings.companyName, M, 55);

  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#666';
  const addrLines = (settings.companyAddress || '').split('\n');
  addrLines.forEach((line, i) => ctx.fillText(line.trim(), M, 75 + i * 16));

  // Accent underline
  ctx.fillStyle = settings.accentColor;
  ctx.fillRect(M, 82 + addrLines.length * 16, W - M * 2, 3);

  let Y = 100 + addrLines.length * 16 + 20;

  // Date and reference
  ctx.fillStyle = '#333';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillText(`Date: ${settings.letterDate}`, M, Y);
  if (row.employeeId) {
    ctx.textAlign = 'right';
    ctx.fillText(`Ref: ${row.employeeId}`, W - M, Y);
    ctx.textAlign = 'left';
  }
  Y += 30;

  // Recipient
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(`To,`, M, Y); Y += 18;
  ctx.font = 'bold 14px Inter, system-ui, sans-serif';
  ctx.fillText(row.name || '—', M, Y); Y += 18;
  if (row.address) {
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(row.address, M, Y); Y += 18;
  }
  Y += 10;

  // Subject
  const letterTitle = settings.letterType === 'appointment' ? 'APPOINTMENT LETTER' : 'OFFER LETTER';
  ctx.fillStyle = settings.primaryColor;
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText(`Subject: ${letterTitle}`, M, Y); Y += 28;

  // Greeting
  ctx.fillStyle = '#333';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(`Dear ${row.name || 'Candidate'},`, M, Y); Y += 24;

  // Body
  const bodyPrefix = settings.letterType === 'appointment'
    ? `We are pleased to confirm your appointment as`
    : `We are delighted to offer you the position of`;
  
  const bodyText = `${bodyPrefix} ${row.designation || '[Position]'} in the ${row.department || '[Department]'} department at ${settings.companyName}. Your joining date is ${row.joiningDate || '[Date]'}${row.location ? ', and your work location will be ' + row.location : ''}.`;

  const bodyLines = wrapText(ctx, bodyText, W - M * 2);
  bodyLines.forEach(line => {
    ctx.fillText(line, M, Y); Y += 18;
  });
  Y += 10;

  // Details table
  const details = [
    ['Designation', row.designation || '—'],
    ['Department', row.department || '—'],
    ['Joining Date', row.joiningDate || '—'],
    row.salary ? ['Compensation', row.salary] : null,
    row.location ? ['Location', row.location] : null,
    row.reportingTo ? ['Reporting To', row.reportingTo] : null,
    row.probation ? ['Probation Period', row.probation] : null,
  ].filter(Boolean);

  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(M, Y, W - M * 2, details.length * 26 + 8);
  ctx.strokeStyle = '#ddd';
  ctx.strokeRect(M, Y, W - M * 2, details.length * 26 + 8);
  Y += 6;

  details.forEach(([label, value]) => {
    Y += 22;
    ctx.fillStyle = '#666';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText(label + ':', M + 14, Y);
    ctx.fillStyle = '#111';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(value, M + 180, Y);
  });
  Y += 30;

  // Terms
  if (settings.termsText) {
    ctx.fillStyle = settings.primaryColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillText('Terms & Conditions:', M, Y); Y += 20;

    ctx.fillStyle = '#444';
    ctx.font = '11px Inter, system-ui, sans-serif';
    const terms = settings.termsText.split('\n');
    terms.forEach(term => {
      const tLines = wrapText(ctx, term.trim(), W - M * 2 - 10);
      tLines.forEach(line => {
        ctx.fillText(line, M + 10, Y); Y += 16;
      });
    });
    Y += 10;
  }

  // Closing
  ctx.fillStyle = '#333';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText('We look forward to your positive response and a long, fruitful association.', M, Y); Y += 30;
  ctx.fillText('Warm regards,', M, Y); Y += 30;

  // Signature
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(M, Y); ctx.lineTo(M + 160, Y);
  ctx.stroke();
  Y += 16;
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = settings.primaryColor;
  ctx.fillText(settings.signatoryName, M, Y); Y += 16;
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(settings.signatoryTitle, M, Y); Y += 14;
  ctx.fillText(settings.companyName, M, Y);

  // Footer
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(0, H - 35, W, 35);
  ctx.fillStyle = '#fff';
  ctx.font = '9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Confidential — For internal use only. Generated at ilovetexts.com', W / 2, H - 14);

  return canvas;
}

/* React Preview */
function LetterPreview({ row, settings }) {
  const isAppointment = settings.letterType === 'appointment';
  return (
    <div className={s.cardPreview} style={{ maxWidth: 500, fontSize: 12 }}>
      <div style={{ borderLeft: `4px solid ${settings.primaryColor}`, padding: '20px 24px', background: '#fff', color: '#333' }}>
        <div style={{ color: settings.primaryColor, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{settings.companyName}</div>
        <div style={{ fontSize: 10, color: '#888', whiteSpace: 'pre-line' }}>{settings.companyAddress}</div>
        <div style={{ height: 2, background: settings.accentColor, margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 12 }}>
          <span>Date: {settings.letterDate}</span>
          {row.employeeId && <span>Ref: {row.employeeId}</span>}
        </div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>To, {row.name || '—'}</div>
        <div style={{ color: settings.primaryColor, fontWeight: 700, fontSize: 14, margin: '10px 0', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {isAppointment ? 'Appointment Letter' : 'Offer Letter'}
        </div>
        <p style={{ fontSize: 11, lineHeight: 1.6, color: '#444' }}>
          Dear {row.name || 'Candidate'}, We are {isAppointment ? 'pleased to confirm your appointment' : 'delighted to offer you the position'} as <strong>{row.designation || '—'}</strong> in {row.department || '—'}, effective {row.joiningDate || '—'}.
        </p>
        <div style={{ background: '#f5f7fa', padding: '10px 14px', borderRadius: 6, margin: '10px 0', fontSize: 11 }}>
          {row.salary && <div><strong>Compensation:</strong> {row.salary}</div>}
          {row.location && <div><strong>Location:</strong> {row.location}</div>}
          {row.probation && <div><strong>Probation:</strong> {row.probation}</div>}
        </div>
        <div style={{ borderTop: '1px solid #ddd', paddingTop: 10, marginTop: 10, fontSize: 10 }}>
          <strong>{settings.signatoryName}</strong><br />{settings.signatoryTitle}
        </div>
      </div>
    </div>
  );
}

export default function BulkLetterGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>📝 Free Bulk Tool</span>
        <h1>Bulk Appointment & Offer Letter Generator</h1>
        <p>Upload employee details in Excel — generate personalised offer letters or appointment letters as professional PDFs. Customise your company template and download all as a ZIP.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk Appointment & Offer Letter Generator"
        toolIcon="📝"
        toolDescription="Generate offer & appointment letters in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderLetterCanvas}
        renderCard={(row, mapping, settings) => <LetterPreview row={row} settings={settings} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={500}
        filePrefix="letter"
      />
    </div>
  );
}
