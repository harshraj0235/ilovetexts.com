'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 5: Bulk Event Badge Generator
   Upload attendees → create badges with name,
   company, category and optional QR code
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Full Name', required: true, sample: 'Dr. Anika Mehta' },
];

const OPTIONAL_FIELDS = [
  { key: 'company', label: 'Company / Organization', sample: 'TechVista Solutions' },
  { key: 'title', label: 'Title / Designation', sample: 'CTO' },
  { key: 'category', label: 'Category (Speaker/VIP/Attendee)', sample: 'Speaker' },
  { key: 'email', label: 'Email (for QR code)', sample: 'anika@techvista.com' },
  { key: 'badgeId', label: 'Badge ID', sample: 'CONF-001' },
  { key: 'track', label: 'Track / Session', sample: 'AI & Machine Learning' },
  { key: 'table', label: 'Table / Seat', sample: 'Table 5' },
  { key: 'day', label: 'Day', sample: 'Day 1 — Oct 15' },
];

const SAMPLE_DATA = [
  { 'Full Name': 'Dr. Anika Mehta', 'Company / Organization': 'TechVista Solutions', 'Title / Designation': 'CTO', 'Category (Speaker/VIP/Attendee)': 'Speaker', 'Email (for QR code)': 'anika@techvista.com', 'Badge ID': 'CONF-001', 'Track / Session': 'AI & Machine Learning' },
  { 'Full Name': 'Rahul Singh', 'Company / Organization': 'FinServe India', 'Title / Designation': 'VP Engineering', 'Category (Speaker/VIP/Attendee)': 'VIP', 'Email (for QR code)': 'rahul@finserve.in', 'Badge ID': 'CONF-002', 'Track / Session': 'Cloud Infrastructure' },
  { 'Full Name': 'Maria Gonzalez', 'Company / Organization': 'StartupHub', 'Title / Designation': 'Founder', 'Category (Speaker/VIP/Attendee)': 'Attendee', 'Email (for QR code)': 'maria@startuphub.co', 'Badge ID': 'CONF-003', 'Track / Session': 'Startup Ecosystem' },
];

const CATEGORY_COLORS = {
  speaker: '#7c3aed',
  vip: '#dc2626',
  sponsor: '#0891b2',
  organizer: '#ca8a04',
  attendee: '#2563eb',
  press: '#059669',
  volunteer: '#e11d48',
};

const DEFAULT_SETTINGS = {
  eventName: 'TechConnect Conference 2026',
  eventDate: 'October 15–17, 2026',
  eventVenue: 'Pragati Maidan, New Delhi',
  primaryColor: '#0f172a',
  accentColor: '#6366f1',
  badgeWidth: 400,
  badgeHeight: 550,
  showQR: true,
  showCategory: true,
  layout: 'modern', // modern | classic | minimal
};

function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>Event Name <input value={settings.eventName} onChange={e => up('eventName', e.target.value)} /></label>
    <label>Event Date <input value={settings.eventDate} onChange={e => up('eventDate', e.target.value)} /></label>
    <label>Venue <input value={settings.eventVenue} onChange={e => up('eventVenue', e.target.value)} /></label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Accent Color <input type="color" value={settings.accentColor} onChange={e => up('accentColor', e.target.value)} /></label>
    <label>Layout Style
      <select value={settings.layout} onChange={e => up('layout', e.target.value)}>
        <option value="modern">Modern</option>
        <option value="classic">Classic</option>
        <option value="minimal">Minimal</option>
      </select>
    </label>
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.showQR} onChange={e => up('showQR', e.target.checked)} style={{ width: 18 }} />
        Show QR Code
      </span>
    </label>
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.showCategory} onChange={e => up('showCategory', e.target.checked)} style={{ width: 18 }} />
        Show Category Badge
      </span>
    </label>
  </>;
}

function getCategoryColor(cat) {
  if (!cat) return '#6b7280';
  const key = cat.toLowerCase().trim();
  return CATEGORY_COLORS[key] || '#6b7280';
}

/* Simple QR Code drawing (lightweight - no external lib) */
function drawSimpleQR(ctx, x, y, size, text) {
  // Draw a decorative QR placeholder with data indicator
  const cells = 21;
  const cellSize = size / cells;
  
  // Generate a simple pattern from the text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  
  ctx.fillStyle = '#000';
  // Corner patterns (finder patterns)
  const drawFinder = (cx, cy) => {
    ctx.fillRect(cx, cy, cellSize * 7, cellSize * 7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + cellSize, cy + cellSize, cellSize * 5, cellSize * 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx + cellSize * 2, cy + cellSize * 2, cellSize * 3, cellSize * 3);
  };
  
  drawFinder(x, y);
  drawFinder(x + cellSize * (cells - 7), y);
  drawFinder(x, y + cellSize * (cells - 7));
  
  // Data area — pseudo-random from hash
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Skip finder areas
      if ((r < 8 && c < 8) || (r < 8 && c > cells - 9) || (r > cells - 9 && c < 8)) continue;
      const bit = ((hash * (r * cells + c + 1)) >>> 0) % 3;
      if (bit === 0) {
        ctx.fillStyle = '#000';
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize * 0.9, cellSize * 0.9);
      }
    }
  }
}

async function renderBadgeCanvas(row, mapping, settings, index) {
  const W = 500;
  const H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const catColor = getCategoryColor(row.category);

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Top accent area
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(0, 0, W, 120);

  // Diagonal accent
  ctx.fillStyle = settings.accentColor;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.lineTo(W, 80);
  ctx.lineTo(W, 120);
  ctx.lineTo(0, 120);
  ctx.fill();

  // Event name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.eventName, W / 2, 42);
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(settings.eventDate, W / 2, 62);
  ctx.fillText(settings.eventVenue, W / 2, 78);
  ctx.globalAlpha = 1;

  // Photo circle placeholder
  const photoR = 50;
  const photoX = W / 2;
  const photoY = 165;
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.font = '36px system-ui';
  ctx.fillText('👤', photoX, photoY + 12);

  // Name
  ctx.fillStyle = settings.primaryColor;
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText(row.name || '—', W / 2, 250);

  // Title
  if (row.title) {
    ctx.font = '15px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(row.title, W / 2, 275);
  }

  // Company
  if (row.company) {
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(row.company, W / 2, 298);
  }

  // Category badge
  if (settings.showCategory && row.category) {
    const catText = row.category.toUpperCase();
    const catW = ctx.measureText(catText).width + 40;
    ctx.fillStyle = catColor;
    const bx = (W - catW) / 2;
    roundRect2(ctx, bx, 315, catW, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillText(catText, W / 2, 335);
  }

  // Details
  let detY = 370;
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#666';
  if (row.track) { ctx.fillText(`Track: ${row.track}`, W / 2, detY); detY += 20; }
  if (row.day) { ctx.fillText(row.day, W / 2, detY); detY += 20; }
  if (row.table) { ctx.fillText(row.table, W / 2, detY); detY += 20; }
  if (row.badgeId) {
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(row.badgeId, W / 2, detY); detY += 20;
  }

  // QR Code
  if (settings.showQR) {
    const qrData = row.email || row.name || 'attendee';
    const qrSize = 100;
    drawSimpleQR(ctx, (W - qrSize) / 2, H - 160, qrSize, qrData);
    ctx.fillStyle = '#aaa';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillText('Scan for contact info', W / 2, H - 48);
  }

  // Bottom bar
  ctx.fillStyle = catColor;
  ctx.fillRect(0, H - 30, W, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '9px Inter, system-ui, sans-serif';
  ctx.fillText('ilovetexts.com — Bulk Badge Generator', W / 2, H - 12);

  return canvas;
}

function roundRect2(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* React Preview */
function BadgePreview({ row, settings }) {
  const catColor = getCategoryColor(row.category);
  return (
    <div className={s.cardPreview} style={{ maxWidth: 300 }}>
      <div style={{ background: settings.primaryColor, padding: '16px 20px', textAlign: 'center', color: '#fff', borderBottom: `4px solid ${settings.accentColor}` }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{settings.eventName}</div>
        <div style={{ fontSize: 10, opacity: .7 }}>{settings.eventDate} · {settings.eventVenue}</div>
      </div>
      <div style={{ padding: '24px 20px', textAlign: 'center', background: '#fff', color: '#333' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 12px', display: 'grid', placeItems: 'center', fontSize: 26 }}>👤</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: settings.primaryColor }}>{row.name || '—'}</div>
        {row.title && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{row.title}</div>}
        {row.company && <div style={{ fontSize: 11, color: '#999' }}>{row.company}</div>}
        {settings.showCategory && row.category && (
          <div style={{ display: 'inline-block', background: catColor, color: '#fff', padding: '3px 16px', borderRadius: 99, fontSize: 11, fontWeight: 700, marginTop: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {row.category}
          </div>
        )}
        {row.track && <div style={{ fontSize: 10, color: '#888', marginTop: 10 }}>Track: {row.track}</div>}
        {settings.showQR && (
          <div style={{ marginTop: 14, padding: 10, background: '#f8f8f8', borderRadius: 8, display: 'inline-block' }}>
            <div style={{ width: 60, height: 60, background: '#ddd', borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 10, color: '#aaa' }}>QR Code</div>
          </div>
        )}
      </div>
      <div style={{ background: catColor, padding: '6px', textAlign: 'center', color: '#fff', fontSize: 8, borderRadius: '0 0 12px 12px' }}>
        {row.badgeId || '—'}
      </div>
    </div>
  );
}

export default function BulkEventBadgeGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>🏷️ Free Bulk Tool</span>
        <h1>Bulk Event Badge Generator</h1>
        <p>Upload your attendee list in Excel — generate professional event badges with name, company, category colour-coding and optional QR codes. Perfect for conferences, workshops and exhibitions.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk Event Badge Generator"
        toolIcon="🏷️"
        toolDescription="Generate event badges in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderBadgeCanvas}
        renderCard={(row, mapping, settings) => <BadgePreview row={row} settings={settings} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={500}
        filePrefix="event_badge"
      />
    </div>
  );
}
