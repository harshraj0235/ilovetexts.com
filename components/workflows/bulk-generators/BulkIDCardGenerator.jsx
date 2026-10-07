'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 1: Bulk ID Card Generator
   Upload names, IDs and photos → front/back ID
   cards → print-ready PDF sheets
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Full Name', required: true, sample: 'Aarav Sharma' },
  { key: 'id', label: 'ID Number', required: true, sample: 'STU-2026-001' },
];

const OPTIONAL_FIELDS = [
  { key: 'designation', label: 'Designation / Class', sample: 'Class 10-A' },
  { key: 'department', label: 'Department / Section', sample: 'Science' },
  { key: 'dob', label: 'Date of Birth', sample: '2010-05-15' },
  { key: 'bloodGroup', label: 'Blood Group', sample: 'B+' },
  { key: 'phone', label: 'Phone / Emergency', sample: '+91 98765 43210' },
  { key: 'address', label: 'Address', sample: '12 MG Road, Delhi' },
  { key: 'photo', label: 'Photo URL (optional)', sample: '' },
  { key: 'validTill', label: 'Valid Till', sample: '2027-03-31' },
];

const SAMPLE_DATA = [
  { 'Full Name': 'Aarav Sharma', 'ID Number': 'STU-2026-001', 'Designation / Class': 'Class 10-A', 'Department / Section': 'Science', 'Date of Birth': '2010-05-15', 'Blood Group': 'B+', 'Phone / Emergency': '+91 98765 43210', 'Address': '12 MG Road, Delhi', 'Valid Till': '2027-03-31' },
  { 'Full Name': 'Priya Patel', 'ID Number': 'STU-2026-002', 'Designation / Class': 'Class 10-B', 'Department / Section': 'Commerce', 'Date of Birth': '2010-08-22', 'Blood Group': 'O+', 'Phone / Emergency': '+91 87654 32109', 'Address': '45 Park Street, Mumbai', 'Valid Till': '2027-03-31' },
  { 'Full Name': 'Rohan Gupta', 'ID Number': 'STU-2026-003', 'Designation / Class': 'Class 9-A', 'Department / Section': 'Arts', 'Date of Birth': '2011-01-10', 'Blood Group': 'A+', 'Phone / Emergency': '+91 76543 21098', 'Address': '78 Lake View, Bangalore', 'Valid Till': '2027-03-31' },
];

const DEFAULT_SETTINGS = {
  orgName: 'My School / Organization',
  orgSubtitle: 'Excellence in Education',
  primaryColor: '#1e3a5f',
  accentColor: '#e8b931',
  textColor: '#ffffff',
  cardWidth: 340,
  cardHeight: 215,
  showBack: true,
  backText: 'If found, please return to:\nMy School, 123 Main Road\nCity, State - 110001\nPhone: +91 11 2345 6789',
};

/* Template Editor for customizing look */
function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>Organization Name <input value={settings.orgName} onChange={e => up('orgName', e.target.value)} /></label>
    <label>Subtitle <input value={settings.orgSubtitle} onChange={e => up('orgSubtitle', e.target.value)} /></label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Accent Color <input type="color" value={settings.accentColor} onChange={e => up('accentColor', e.target.value)} /></label>
    <label>Text Color <input type="color" value={settings.textColor} onChange={e => up('textColor', e.target.value)} /></label>
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.showBack} onChange={e => up('showBack', e.target.checked)} style={{ width: 18 }} />
        Include Back Side
      </span>
    </label>
    {settings.showBack && (
      <label>Back Text <textarea rows={4} value={settings.backText} onChange={e => up('backText', e.target.value)} /></label>
    )}
  </>;
}

/* Render ID Card as Canvas for PDF export */
async function renderIDCardCanvas(row, mapping, settings, index) {
  const W = settings.cardWidth * 2.5;
  const H = settings.cardHeight * 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = settings.showBack ? H * 2 + 40 : H;
  const ctx = canvas.getContext('2d');

  // ── FRONT SIDE ──
  drawCardFront(ctx, row, settings, 0, 0, W, H);

  // ── BACK SIDE ──
  if (settings.showBack) {
    drawCardBack(ctx, row, settings, 0, H + 40, W, H);
  }

  return canvas;
}

function drawCardFront(ctx, row, settings, x, y, W, H) {
  // Background
  ctx.fillStyle = settings.primaryColor;
  ctx.beginPath();
  roundRect(ctx, x, y, W, H, 24);
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = settings.accentColor;
  ctx.fillRect(x, y + 60, W, 6);

  // Org name
  ctx.fillStyle = settings.textColor;
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.orgName, x + W / 2, y + 40);

  // Subtitle
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(settings.orgSubtitle, x + W / 2, y + 56);
  ctx.globalAlpha = 1;

  // Photo placeholder
  const photoX = x + 30;
  const photoY = y + 85;
  const photoS = 120;
  ctx.fillStyle = '#ffffff22';
  ctx.beginPath();
  roundRect(ctx, photoX, photoY, photoS, photoS, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff88';
  ctx.font = '36px system-ui';
  ctx.fillText('👤', photoX + photoS / 2, photoY + photoS / 2 + 12);

  // Details
  ctx.textAlign = 'left';
  ctx.fillStyle = settings.textColor;
  const detailsX = photoX + photoS + 24;
  let detailsY = photoY + 8;

  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.fillText(truncate(row.name || 'Name', 22), detailsX, detailsY += 20);

  ctx.font = '15px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.9;
  if (row.designation) ctx.fillText(truncate(row.designation, 28), detailsX, detailsY += 24);
  if (row.department) ctx.fillText(truncate(row.department, 28), detailsX, detailsY += 22);
  ctx.globalAlpha = 1;

  // ID badge
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = settings.accentColor;
  ctx.fillText(`ID: ${row.id || '—'}`, detailsX, detailsY += 28);

  // Bottom row
  ctx.fillStyle = settings.textColor;
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.7;
  const bottomY = y + H - 20;
  ctx.textAlign = 'left';
  if (row.dob) ctx.fillText(`DOB: ${row.dob}`, x + 30, bottomY);
  if (row.bloodGroup) { ctx.textAlign = 'center'; ctx.fillText(`Blood: ${row.bloodGroup}`, x + W / 2, bottomY); }
  if (row.validTill) { ctx.textAlign = 'right'; ctx.fillText(`Valid: ${row.validTill}`, x + W - 30, bottomY); }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawCardBack(ctx, row, settings, x, y, W, H) {
  // Background
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  roundRect(ctx, x, y, W, H, 24);
  ctx.fill();

  // Accent top
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(x, y, W, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ID CARD — BACK', x + W / 2, y + 32);

  // Contact info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  ctx.font = '14px Inter, system-ui, sans-serif';
  const lines = (settings.backText || '').split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line.trim(), x + 30, y + 85 + i * 22);
  });

  // Emergency contact
  if (row.phone) {
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = settings.primaryColor;
    ctx.fillText(`Emergency: ${row.phone}`, x + 30, y + H - 55);
  }
  if (row.address) {
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(truncate(row.address, 45), x + 30, y + H - 30);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(str, max) {
  return str.length > max ? str.substring(0, max - 1) + '…' : str;
}

/* Visual preview card (React component) */
function IDCardPreview({ row, settings }) {
  const pc = settings.primaryColor;
  const ac = settings.accentColor;
  const tc = settings.textColor;
  return (
    <div className={s.cardPreview}>
      {/* Front */}
      <div style={{ background: pc, color: tc, padding: '20px 24px', borderRadius: '12px 12px 0 0', minHeight: 200 }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.orgName}</div>
          <div style={{ fontSize: 11, opacity: .7 }}>{settings.orgSubtitle}</div>
        </div>
        <div style={{ height: 3, background: ac, margin: '8px 0 14px', borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 72, height: 72, background: '#fff2', borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 28, flexShrink: 0 }}>👤</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{row.name || '—'}</div>
            {row.designation && <div style={{ fontSize: 12, opacity: .85 }}>{row.designation}</div>}
            {row.department && <div style={{ fontSize: 12, opacity: .85 }}>{row.department}</div>}
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: ac, marginTop: 8, fontSize: 13 }}>ID: {row.id || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 10, opacity: .6 }}>
          {row.dob && <span>DOB: {row.dob}</span>}
          {row.bloodGroup && <span>Blood: {row.bloodGroup}</span>}
          {row.validTill && <span>Valid: {row.validTill}</span>}
        </div>
      </div>
      {/* Back */}
      {settings.showBack && (
        <div style={{ background: '#f5f5f5', color: '#333', padding: '16px 24px', borderRadius: '0 0 12px 12px', borderTop: `3px solid ${pc}` }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: pc, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Back Side</div>
          <div style={{ fontSize: 11, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{settings.backText}</div>
          {row.phone && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: pc }}>Emergency: {row.phone}</div>}
        </div>
      )}
    </div>
  );
}

export default function BulkIDCardGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>🪪 Free Bulk Tool</span>
        <h1>Bulk ID Card Generator</h1>
        <p>Upload an Excel file with names, IDs and details — generate hundreds of professional ID cards as print-ready PDFs in one click. No signup required.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk ID Card Generator"
        toolIcon="🪪"
        toolDescription="Generate professional ID cards in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderIDCardCanvas}
        renderCard={(row, mapping, settings) => <IDCardPreview row={row} settings={settings} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={500}
        filePrefix="id_card"
      />
    </div>
  );
}
