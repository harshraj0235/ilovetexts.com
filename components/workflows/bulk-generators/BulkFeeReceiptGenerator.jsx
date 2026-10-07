'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 3: Bulk Fee Receipt Generator
   Upload recorded payments → generate numbered
   receipts with student name, amount & date
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Student / Payee Name', required: true, sample: 'Aarav Sharma' },
  { key: 'amount', label: 'Amount Paid', required: true, sample: '5000' },
  { key: 'paymentDate', label: 'Payment Date', required: true, sample: '2026-09-15' },
];

const OPTIONAL_FIELDS = [
  { key: 'receiptNo', label: 'Receipt Number', sample: 'REC-001' },
  { key: 'class', label: 'Class / Course', sample: '10-A' },
  { key: 'feeType', label: 'Fee Type', sample: 'Tuition Fee' },
  { key: 'paymentMode', label: 'Payment Mode', sample: 'Cash' },
  { key: 'parentName', label: 'Parent Name', sample: 'Mr. Rajesh Sharma' },
  { key: 'phone', label: 'Phone', sample: '+91 98765 43210' },
  { key: 'balance', label: 'Balance Due', sample: '0' },
  { key: 'period', label: 'Fee Period', sample: 'Oct 2026' },
];

const SAMPLE_DATA = [
  { 'Student / Payee Name': 'Aarav Sharma', 'Amount Paid': 5000, 'Payment Date': '2026-09-15', 'Receipt Number': 'REC-001', 'Class / Course': '10-A', 'Fee Type': 'Tuition Fee', 'Payment Mode': 'Cash', 'Parent Name': 'Mr. Rajesh Sharma', 'Balance Due': 0, 'Fee Period': 'Oct 2026' },
  { 'Student / Payee Name': 'Priya Patel', 'Amount Paid': 7500, 'Payment Date': '2026-09-16', 'Receipt Number': 'REC-002', 'Class / Course': '10-B', 'Fee Type': 'Tuition + Lab Fee', 'Payment Mode': 'UPI', 'Parent Name': 'Mrs. Meena Patel', 'Balance Due': 2500, 'Fee Period': 'Oct 2026' },
];

const DEFAULT_SETTINGS = {
  orgName: 'Vidya Bharati Public School',
  orgAddress: 'Sector 12, New Delhi — 110085\nPhone: +91 11 2345 6789',
  receiptTitle: 'FEE RECEIPT',
  currency: '₹',
  primaryColor: '#0d4f3c',
  accentColor: '#d4a843',
  autoNumber: true,
  startNumber: 1,
  showAmountInWords: true,
  footerText: 'This is a computer-generated receipt. No signature required.',
};

function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>Organization Name <input value={settings.orgName} onChange={e => up('orgName', e.target.value)} /></label>
    <label>Address <textarea rows={2} value={settings.orgAddress} onChange={e => up('orgAddress', e.target.value)} /></label>
    <label>Receipt Title <input value={settings.receiptTitle} onChange={e => up('receiptTitle', e.target.value)} /></label>
    <label>Currency Symbol <input value={settings.currency} onChange={e => up('currency', e.target.value)} maxLength={5} /></label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Accent Color <input type="color" value={settings.accentColor} onChange={e => up('accentColor', e.target.value)} /></label>
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.autoNumber} onChange={e => up('autoNumber', e.target.checked)} style={{ width: 18 }} />
        Auto-number receipts
      </span>
    </label>
    {settings.autoNumber && <label>Start Number <input type="number" value={settings.startNumber} onChange={e => up('startNumber', parseInt(e.target.value) || 1)} /></label>}
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.showAmountInWords} onChange={e => up('showAmountInWords', e.target.checked)} style={{ width: 18 }} />
        Show amount in words
      </span>
    </label>
    <label>Footer Text <input value={settings.footerText} onChange={e => up('footerText', e.target.value)} /></label>
  </>;
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const n = Math.abs(Math.floor(num));
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '');
  return numberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numberToWords(n % 10000000) : '');
}

function formatAmount(amt, currency) {
  const n = parseFloat(amt) || 0;
  return `${currency}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function renderReceiptCanvas(row, mapping, settings, index) {
  const W = 800;
  const H = 560;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = settings.primaryColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = settings.accentColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Header
  ctx.fillStyle = settings.primaryColor;
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.orgName, W / 2, 55);

  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#666';
  const addrLines = (settings.orgAddress || '').split('\n');
  addrLines.forEach((line, i) => ctx.fillText(line.trim(), W / 2, 74 + i * 16));

  // Receipt title
  ctx.fillStyle = settings.accentColor;
  ctx.fillRect(W / 2 - 80, 105 + addrLines.length * 8, 160, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Inter, system-ui, sans-serif';
  ctx.fillText(settings.receiptTitle, W / 2, 123 + addrLines.length * 8);

  // Receipt details
  const startY = 155 + addrLines.length * 8;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  ctx.font = '13px Inter, system-ui, sans-serif';

  const receiptNum = settings.autoNumber ? `REC-${String(settings.startNumber + index).padStart(4, '0')}` : (row.receiptNo || `REC-${index + 1}`);

  const fields = [
    ['Receipt No.', receiptNum, 'Date', row.paymentDate || '—'],
    ['Received from', row.name || '—', 'Class/Course', row.class || '—'],
    ['Fee Type', row.feeType || 'General Fee', 'Payment Mode', row.paymentMode || '—'],
    ['Parent/Guardian', row.parentName || '—', 'Phone', row.phone || '—'],
    ['Fee Period', row.period || '—', '', ''],
  ];

  fields.forEach((pair, i) => {
    const y = startY + i * 28;
    if (pair[0]) {
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText(pair[0] + ':', 40, y);
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#111';
      ctx.fillText(String(pair[1]), 160, y);
    }
    if (pair[2]) {
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText(pair[2] + ':', 430, y);
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#111';
      ctx.fillText(String(pair[3]), 550, y);
    }
  });

  // Amount box
  const amtY = startY + fields.length * 28 + 10;
  ctx.fillStyle = '#f8faf9';
  ctx.fillRect(40, amtY, W - 80, 44);
  ctx.strokeStyle = settings.primaryColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, amtY, W - 80, 44);

  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillStyle = settings.primaryColor;
  ctx.textAlign = 'left';
  ctx.fillText(`Amount Paid: ${formatAmount(row.amount, settings.currency)}`, 56, amtY + 29);

  const balance = parseFloat(row.balance);
  if (!isNaN(balance) && balance > 0) {
    ctx.textAlign = 'right';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`Balance Due: ${formatAmount(balance, settings.currency)}`, W - 56, amtY + 29);
  }

  // Amount in words
  if (settings.showAmountInWords) {
    ctx.textAlign = 'left';
    ctx.font = 'italic 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`Amount in words: ${numberToWords(parseFloat(row.amount) || 0)} Only`, 40, amtY + 66);
  }

  // Signature
  const sigY = H - 80;
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(40, sigY); ctx.lineTo(180, sigY);
  ctx.moveTo(W - 180, sigY); ctx.lineTo(W - 40, sigY);
  ctx.stroke();
  ctx.fillStyle = '#666';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("Receiver's Signature", 55, sigY + 14);
  ctx.textAlign = 'right';
  ctx.fillText('Authorized Signatory', W - 55, sigY + 14);

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '9px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText(settings.footerText, W / 2, H - 28);

  return canvas;
}

/* React Preview */
function FeeReceiptPreview({ row, settings, index = 0 }) {
  const receiptNum = settings.autoNumber ? `REC-${String(settings.startNumber + index).padStart(4, '0')}` : (row.receiptNo || `REC-${index + 1}`);
  return (
    <div className={s.cardPreview} style={{ maxWidth: 480, fontSize: 12 }}>
      <div style={{ background: settings.primaryColor, color: '#fff', padding: '14px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{settings.orgName}</div>
        <div style={{ fontSize: 10, opacity: .7, whiteSpace: 'pre-line' }}>{settings.orgAddress}</div>
        <div style={{ display: 'inline-block', background: settings.accentColor, padding: '3px 16px', borderRadius: 4, marginTop: 6, fontWeight: 700, fontSize: 11 }}>{settings.receiptTitle}</div>
      </div>
      <div style={{ padding: '14px 20px', background: '#fff', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 8 }}>
          <span><strong>Receipt:</strong> {receiptNum}</span>
          <span><strong>Date:</strong> {row.paymentDate || '—'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 11 }}>
          <div><strong>Name:</strong> {row.name || '—'}</div>
          <div><strong>Class:</strong> {row.class || '—'}</div>
          <div><strong>Fee Type:</strong> {row.feeType || 'General'}</div>
          <div><strong>Mode:</strong> {row.paymentMode || '—'}</div>
        </div>
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0fdf4', border: `2px solid ${settings.primaryColor}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: settings.primaryColor }}>{formatAmount(row.amount, settings.currency)}</div>
            {settings.showAmountInWords && <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>{numberToWords(parseFloat(row.amount) || 0)} Only</div>}
          </div>
          {parseFloat(row.balance) > 0 && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Due: {formatAmount(row.balance, settings.currency)}</div>}
        </div>
      </div>
    </div>
  );
}

export default function BulkFeeReceiptGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>🧾 Free Bulk Tool</span>
        <h1>Bulk Fee Receipt Generator</h1>
        <p>Upload payment records in Excel — generate numbered fee receipts with student name, amount, payment date and auto-numbering. Download all as a ZIP of print-ready PDFs.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk Fee Receipt Generator"
        toolIcon="🧾"
        toolDescription="Generate fee receipts in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderReceiptCanvas}
        renderCard={(row, mapping, settings, i) => <FeeReceiptPreview row={row} settings={settings} index={i} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={500}
        filePrefix="fee_receipt"
      />
    </div>
  );
}
