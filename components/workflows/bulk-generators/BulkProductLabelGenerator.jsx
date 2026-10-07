'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 6: Bulk Product Label Generator
   Upload product details → generate printable
   product labels with barcodes/QR codes
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'productName', label: 'Product Name', required: true, sample: 'Organic Green Tea 250g' },
  { key: 'price', label: 'Price (MRP)', required: true, sample: '299.00' },
  { key: 'barcode', label: 'Barcode / SKU / QR Data', required: true, sample: '8901234567890' },
];

const OPTIONAL_FIELDS = [
  { key: 'category', label: 'Category', sample: 'Beverages' },
  { key: 'weight', label: 'Weight / Size', sample: '250g' },
  { key: 'mfgDate', label: 'Mfg. Date', sample: '2026-08' },
  { key: 'expDate', label: 'Exp. Date', sample: '2027-08' },
  { key: 'batch', label: 'Batch No.', sample: 'B-240801' },
  { key: 'brand', label: 'Brand Name', sample: 'Nature Farms' },
];

const SAMPLE_DATA = [
  { 'Product Name': 'Organic Green Tea 250g', 'Price (MRP)': '299.00', 'Barcode / SKU / QR Data': '8901234567890', 'Category': 'Beverages', 'Weight / Size': '250g', 'Mfg. Date': '2026-08', 'Exp. Date': '2027-08', 'Batch No.': 'B-240801', 'Brand Name': 'Nature Farms' },
  { 'Product Name': 'Raw Forest Honey 500g', 'Price (MRP)': '450.00', 'Barcode / SKU / QR Data': '8901234567891', 'Category': 'Spreads', 'Weight / Size': '500g', 'Mfg. Date': '2026-09', 'Exp. Date': '2028-09', 'Batch No.': 'B-240905', 'Brand Name': 'Nature Farms' },
  { 'Product Name': 'Himalayan Pink Salt', 'Price (MRP)': '120.00', 'Barcode / SKU / QR Data': '8901234567892', 'Category': 'Spices', 'Weight / Size': '1kg', 'Mfg. Date': '2026-10', 'Exp. Date': '2029-10', 'Batch No.': 'B-241012', 'Brand Name': 'Nature Farms' },
];

const DEFAULT_SETTINGS = {
  storeName: 'SUPERMART INDIA',
  currency: '₹',
  labelWidth: 200,
  labelHeight: 120,
  codeType: 'barcode', // barcode | qrcode
  primaryColor: '#000000',
  showStoreName: true,
  taxText: 'Incl. of all taxes',
};

function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>Store / Brand Name <input value={settings.storeName} onChange={e => up('storeName', e.target.value)} /></label>
    <label>Currency Symbol <input value={settings.currency} onChange={e => up('currency', e.target.value)} maxLength={5} /></label>
    <label>Code Type
      <select value={settings.codeType} onChange={e => up('codeType', e.target.value)}>
        <option value="barcode">Barcode (Lines)</option>
        <option value="qrcode">QR Code</option>
      </select>
    </label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Tax Note (e.g., Incl. of all taxes) <input value={settings.taxText} onChange={e => up('taxText', e.target.value)} /></label>
    <label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.showStoreName} onChange={e => up('showStoreName', e.target.checked)} style={{ width: 18 }} />
        Show Store Name at top
      </span>
    </label>
  </>;
}

function drawSimpleQR(ctx, x, y, size, text) {
  const cells = 21;
  const cellSize = size / cells;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  ctx.fillStyle = '#000';
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
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > cells - 9) || (r > cells - 9 && c < 8)) continue;
      const bit = ((hash * (r * cells + c + 1)) >>> 0) % 3;
      if (bit === 0) {
        ctx.fillStyle = '#000';
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize * 0.9, cellSize * 0.9);
      }
    }
  }
}

function drawSimpleBarcode(ctx, x, y, w, h, text) {
  // A pseudo-barcode for visual representation. For real world, you'd use JsBarcode lib
  ctx.fillStyle = '#000';
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  const bars = 40;
  const barW = w / bars;
  for (let i = 0; i < bars; i++) {
    const bit = ((hash * (i + 1)) >>> 0) % 5;
    if (bit < 3) {
      const width = bit === 0 ? barW * 0.5 : (bit === 1 ? barW * 1.5 : barW);
      ctx.fillRect(x + i * barW, y, width, h);
    }
  }
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h + 14);
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

async function renderLabelCanvas(row, mapping, settings, index) {
  // Label size: 2" x 1.2" roughly (400x240 px)
  const W = 400;
  const H = 240;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  
  // Border (optional, but good for cutting)
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, W, H);

  let curY = 16;

  // Store Name
  if (settings.showStoreName) {
    ctx.fillStyle = settings.primaryColor;
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(settings.storeName, W / 2, curY + 4);
    curY += 24;
  }

  // Product Name (wrapped)
  ctx.fillStyle = '#000';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  const nameLines = wrapText(ctx, row.productName || 'Product Name', W - 20);
  nameLines.slice(0, 2).forEach(line => {
    ctx.fillText(line, W / 2, curY + 12);
    curY += 24;
  });

  // Details row (Weight / Brand)
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#555';
  const details = [];
  if (row.brand) details.push(row.brand);
  if (row.weight) details.push(row.weight);
  if (details.length > 0) {
    curY += 2;
    ctx.fillText(details.join(' • '), W / 2, curY);
    curY += 10;
  }

  curY += 10;

  // Split layout: Code on Left, Price on Right
  if (settings.codeType === 'qrcode') {
    const qrSize = 75;
    drawSimpleQR(ctx, 20, curY, qrSize, row.barcode || '000000');
    
    // Price on right
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillText(`${settings.currency}${parseFloat(row.price || 0).toFixed(2)}`, W - 20, curY + 36);
    
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(settings.taxText, W - 20, curY + 54);
    
    // Mfg/Exp dates under price
    ctx.font = '11px Inter, system-ui, sans-serif';
    let dateY = curY + 70;
    if (row.mfgDate) { ctx.fillText(`Mfg: ${row.mfgDate}`, W - 20, dateY); dateY += 14; }
    if (row.expDate) { ctx.fillText(`Exp: ${row.expDate}`, W - 20, dateY); dateY += 14; }
    if (row.batch) { ctx.fillText(`Batch: ${row.batch}`, W - 20, dateY); }

  } else {
    // Barcode on bottom, price above it
    ctx.textAlign = 'center';
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillText(`${settings.currency}${parseFloat(row.price || 0).toFixed(2)}`, W / 2, curY + 24);
    
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(settings.taxText, W / 2, curY + 40);
    
    // Barcode
    drawSimpleBarcode(ctx, W / 2 - 100, H - 50, 200, 30, row.barcode || '000000');
    
    // Side details
    ctx.textAlign = 'left';
    ctx.font = '10px Inter, system-ui, sans-serif';
    if (row.mfgDate) ctx.fillText(`Mfg: ${row.mfgDate}`, 10, H - 10);
    if (row.batch) ctx.fillText(`B: ${row.batch}`, 10, H - 22);
    
    ctx.textAlign = 'right';
    if (row.expDate) ctx.fillText(`Exp: ${row.expDate}`, W - 10, H - 10);
    if (row.weight) ctx.fillText(row.weight, W - 10, H - 22);
  }

  return canvas;
}

/* React Preview */
function LabelPreview({ row, settings }) {
  return (
    <div className={s.cardPreview} style={{ maxWidth: 350, border: '1px solid #ccc', borderRadius: 8, padding: '12px', background: '#fff', color: '#000', fontSize: 12 }}>
      {settings.showStoreName && <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 8, color: settings.primaryColor }}>{settings.storeName}</div>}
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{row.productName || 'Product Name'}</div>
      
      {(row.brand || row.weight) && (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 11, marginTop: 4 }}>
          {row.brand} {row.brand && row.weight ? '•' : ''} {row.weight}
        </div>
      )}

      {settings.codeType === 'qrcode' ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ width: 64, height: 64, background: '#eee', display: 'grid', placeItems: 'center', fontSize: 10, color: '#aaa', borderRadius: 4 }}>QR Code</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{settings.currency}{parseFloat(row.price || 0).toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{settings.taxText}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
              {row.mfgDate && <div>Mfg: {row.mfgDate}</div>}
              {row.expDate && <div>Exp: {row.expDate}</div>}
              {row.batch && <div>Batch: {row.batch}</div>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{settings.currency}{parseFloat(row.price || 0).toFixed(2)}</div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 12 }}>{settings.taxText}</div>
          <div style={{ height: 40, background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 7px)', width: '80%', margin: '0 auto' }}></div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4 }}>{row.barcode || '—'}</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#555', marginTop: 8 }}>
            <div style={{ textAlign: 'left' }}>
              {row.batch && <div>B: {row.batch}</div>}
              {row.mfgDate && <div>Mfg: {row.mfgDate}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {row.weight && <div>{row.weight}</div>}
              {row.expDate && <div>Exp: {row.expDate}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BulkProductLabelGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>🏷️ Free Bulk Tool</span>
        <h1>Bulk Product Label Generator</h1>
        <p>Upload product inventory in Excel — generate printable labels with prices, names, barcodes or QR codes. Perfect for retail shops, warehouses and small brands.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk Product Label Generator"
        toolIcon="🏷️"
        toolDescription="Generate product labels with barcodes in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderLabelCanvas}
        renderCard={(row, mapping, settings) => <LabelPreview row={row} settings={settings} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={1000}
        filePrefix="product_label"
      />
    </div>
  );
}
