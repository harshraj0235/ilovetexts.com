'use client';
import { useState, useRef, useCallback } from 'react';

const PHOTO_SIZES = [
  { id: 'india-passport', label: '🇮🇳 India Passport', w: 35, h: 45, bg: '#ffffff', desc: '35×45mm, white background' },
  { id: 'india-visa', label: '🇮🇳 India Visa', w: 51, h: 51, bg: '#ffffff', desc: '51×51mm, white background' },
  { id: 'us-passport', label: '🇺🇸 US Passport/Visa', w: 51, h: 51, bg: '#ffffff', desc: '2×2 inch (51×51mm), white background' },
  { id: 'uk-passport', label: '🇬🇧 UK Passport', w: 35, h: 45, bg: '#ffffff', desc: '35×45mm, white/cream background' },
  { id: 'schengen', label: '🇪🇺 Schengen Visa', w: 35, h: 45, bg: '#ffffff', desc: '35×45mm, white background' },
  { id: 'australia', label: '🇦🇺 Australia Visa', w: 35, h: 45, bg: '#ffffff', desc: '35×45mm, white background' },
  { id: 'uae', label: '🇦🇪 UAE Visa', w: 43, h: 55, bg: '#ffffff', desc: '43×55mm, white background' },
  { id: 'custom', label: '✏️ Custom Size', w: 35, h: 45, bg: '#ffffff', desc: 'Set your own dimensions' },
];

const PPI = 300; // Print quality DPI
const MM_TO_PX = PPI / 25.4;

export default function PassportPhotoMaker({ t, lang }) {
  const [image, setImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('india-passport');
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [printLayout, setPrintLayout] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const fileRef = useRef();
  const canvasRef = useRef();
  const previewRef = useRef();

  const size = PHOTO_SIZES.find(s => s.id === selectedSize) || PHOTO_SIZES[0];
  const photoW = selectedSize === 'custom' ? customW : size.w;
  const photoH = selectedSize === 'custom' ? customH : size.h;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImage({ url, name: file.name });
    setResult(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const generatePhoto = useCallback(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const pxW = Math.round(photoW * MM_TO_PX);
      const pxH = Math.round(photoH * MM_TO_PX);
      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, pxW, pxH);

      // Fit image to canvas preserving aspect ratio + apply zoom/pan
      const imgAspect = img.width / img.height;
      const canvasAspect = pxW / pxH;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawH = pxH * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = pxW * zoom;
        drawH = drawW / imgAspect;
      }
      drawX = (pxW - drawW) / 2 + panX * zoom;
      drawY = (pxH - drawH) / 2 + panY * zoom;

      ctx.save();
      // Clip to photo bounds
      ctx.beginPath();
      ctx.rect(0, 0, pxW, pxH);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      if (printLayout) {
        // 4×6 inch print layout with 6 photos (3×2 grid) + margin
        const printCanvas = document.createElement('canvas');
        const printW = Math.round(4 * PPI);   // 4 inches
        const printH = Math.round(6 * PPI);   // 6 inches
        printCanvas.width = printW;
        printCanvas.height = printH;
        const pCtx = printCanvas.getContext('2d');
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, printW, printH);

        const cols = 3;
        const rows = 2;
        const margin = Math.round(0.1 * PPI);
        const spacingX = Math.round((printW - margin * 2 - cols * pxW) / (cols - 1));
        const spacingY = Math.round((printH - margin * 2 - rows * pxH) / (rows - 1));

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = margin + c * (pxW + spacingX);
            const y = margin + r * (pxH + spacingY);
            pCtx.drawImage(canvas, x, y, pxW, pxH);
            // Border
            pCtx.strokeStyle = '#cccccc';
            pCtx.lineWidth = 1;
            pCtx.strokeRect(x, y, pxW, pxH);
          }
        }
        setResult({ url: printCanvas.toDataURL('image/jpeg', 0.95), type: 'print', name: `passport-photo-print-${photoW}x${photoH}mm.jpg` });
      } else {
        setResult({ url: canvas.toDataURL('image/jpeg', 0.95), type: 'single', name: `passport-photo-${photoW}x${photoH}mm.jpg` });
      }
    };
    img.src = image.url;
  }, [image, photoW, photoH, bgColor, zoom, panX, panY, printLayout]);

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">🪪</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Passport Photo Maker</h1>
        <p className="text-gray-500 dark:text-gray-400">Make passport photos for India, US, UK, Schengen — free, instant, print-ready</p>
        <div className="flex justify-center gap-4 text-sm text-gray-400 flex-wrap">
          <span>✅ 8 country standards</span>
          <span>✅ Print 6-on-one sheet</span>
          <span>✅ 300 DPI quality</span>
          <span>✅ No signup</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Size selector */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Photo Standard</label>
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_SIZES.map(s => (
                <button key={s.id} onClick={() => setSelectedSize(s.id)}
                  className={`p-2.5 text-left rounded-xl border-2 text-xs transition-all
                    ${selectedSize === s.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{s.label}</div>
                  <div className="text-gray-400">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom size */}
          {selectedSize === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Width (mm)</label>
                <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} min={10} max={100}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Height (mm)</label>
                <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} min={10} max={100}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
          )}

          {/* Background color */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Background Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#ffffff', '#f0f0e8', '#87ceeb', '#e8e8ff', '#000000'].map(c => (
                <button key={c} onClick={() => setBgColor(c)} title={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'border-gray-200 hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-300" title="Custom color" />
            </div>
          </div>

          {/* Upload */}
          {!image ? (
            <div
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
            >
              <div className="text-4xl mb-2">📷</div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">Upload your photo</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG — face clearly visible, neutral background preferred</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 max-h-48 flex items-center justify-center">
                <img src={image.url} alt="Source" className="max-h-48 object-contain" />
                <button onClick={() => { setImage(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">✕</button>
              </div>

              {/* Zoom/Pan controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex justify-between mb-1">
                    <span>Zoom</span><span className="text-indigo-600">{zoom.toFixed(1)}x</span>
                  </label>
                  <input type="range" min={0.5} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Position</label>
                  <div className="flex gap-1">
                    <button onClick={() => setPanX(p => p - 5)} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200">◀</button>
                    <button onClick={() => setPanY(p => p + 5)} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200">▼</button>
                    <button onClick={() => setPanY(p => p - 5)} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200">▲</button>
                    <button onClick={() => setPanX(p => p + 5)} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200">▶</button>
                  </div>
                </div>
              </div>

              {/* Print layout toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${printLayout ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  onClick={() => setPrintLayout(p => !p)}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${printLayout ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Print layout (6 photos on 4×6 sheet)</span>
              </label>

              <button onClick={generatePhoto}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                📸 Generate Passport Photo
              </button>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            Preview — {photoW}×{photoH}mm {size.id !== 'custom' ? size.label : ''}
          </h3>
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 min-h-64 flex items-center justify-center">
            {result ? (
              <img src={result.url} alt="Passport photo" className="max-w-full max-h-96 object-contain" />
            ) : (
              <div className="text-center text-gray-400 p-8">
                <div className="text-4xl mb-2">🪪</div>
                <p className="text-sm">Your passport photo will appear here</p>
              </div>
            )}
          </div>
          {result && (
            <div className="space-y-2">
              <button onClick={download} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
                ⬇️ Download {result.type === 'print' ? 'Print Sheet (4×6")' : `Photo (${photoW}×${photoH}mm)`}
              </button>
              <button onClick={() => setResult(null)} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                🔄 Adjust & Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3">📋 India Passport Photo Requirements</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-400">
          {['35×45mm size, white background', 'Face: 70-80% of frame height', 'No glasses (as per 2021 MEA rules)', 'Neutral expression, mouth closed', 'Taken within last 6 months', 'No shadows on face or background', 'Plain clothes, no uniform', 'Printed on matte photo paper'].map(req => (
            <div key={req} className="flex gap-2"><span>✅</span><span>{req}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
