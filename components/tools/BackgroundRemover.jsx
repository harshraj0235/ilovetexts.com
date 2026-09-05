'use client';
import { useState, useRef, useCallback } from 'react';

export default function BackgroundRemover({ t, lang }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState('transparent');
  const [tolerance, setTolerance] = useState(30);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState('auto'); // auto | color-pick
  const [pickedColor, setPickedColor] = useState(null);
  const fileRef = useRef();
  const canvasRef = useRef();
  const previewCanvasRef = useRef();
  const imgRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImage({ url, name: file.name, file });
    setResult(null);
    setProgress(0);
    setPickedColor(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // Smart background removal: edge detection + flood fill
  const removeBackground = useCallback(async () => {
    if (!image) return;
    setProcessing(true);
    setProgress(10);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setProgress(30);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample background color from corners
      const sampleBg = () => {
        if (pickedColor) return pickedColor;
        const corners = [
          [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
          [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
          [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
        ];
        let r = 0, g = 0, b = 0;
        corners.forEach(([x, y]) => {
          const i = (y * w + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2];
        });
        return [r / corners.length, g / corners.length, b / corners.length];
      };

      const [bgR, bgG, bgB] = sampleBg();
      setProgress(50);

      // Color distance
      const colorDist = (i, r, g, b) => {
        const dr = data[i] - r;
        const dg = data[i + 1] - g;
        const db = data[i + 2] - b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      // BFS flood fill from edges
      const visited = new Uint8Array(w * h);
      const queue = [];

      // Seed from all 4 edges
      for (let x = 0; x < w; x++) {
        queue.push(x, 0);
        queue.push(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        queue.push(0, y);
        queue.push(w - 1, y);
      }

      let qi = 0;
      const tol = tolerance * 2.5;

      while (qi < queue.length) {
        const x = queue[qi++];
        const y = queue[qi++];
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const idx = y * w + x;
        if (visited[idx]) continue;
        const pi = idx * 4;
        if (colorDist(pi, bgR, bgG, bgB) > tol) continue;
        visited[idx] = 1;
        queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }

      setProgress(75);

      // Apply transparency to visited (background) pixels + feather edges
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const pi = idx * 4;
          if (visited[idx]) {
            data[pi + 3] = 0; // fully transparent
          } else {
            // Check if near background (feathering)
            const dist = colorDist(pi, bgR, bgG, bgB);
            const featherZone = tol * 0.4;
            if (dist < tol + featherZone) {
              const alpha = Math.min(255, ((dist - tol) / featherZone) * 255);
              data[pi + 3] = Math.max(0, alpha);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProgress(90);

      // Apply background color if not transparent
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const fCtx = finalCanvas.getContext('2d');

      if (bgColor !== 'transparent') {
        fCtx.fillStyle = bgColor;
        fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      }
      fCtx.drawImage(canvas, 0, 0);

      setProgress(100);
      setResult(finalCanvas.toDataURL(bgColor === 'transparent' ? 'image/png' : 'image/jpeg', 0.95));
      setProcessing(false);
    };
    img.src = image.url;
  }, [image, tolerance, bgColor, pickedColor]);

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `bg-removed-${image.name.replace(/\.[^.]+$/, '')}.${bgColor === 'transparent' ? 'png' : 'jpg'}`;
    a.click();
  };

  const pickColorFromImage = (e) => {
    if (mode !== 'color-pick' || !image) return;
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (e.target.naturalWidth / rect.width);
    const y = (e.clientY - rect.top) * (e.target.naturalHeight / rect.height);
    const canvas = document.createElement('canvas');
    canvas.width = e.target.naturalWidth;
    canvas.height = e.target.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(e.target, 0, 0);
    const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    setPickedColor([px[0], px[1], px[2]]);
    setMode('auto');
  };

  const BG_PRESETS = [
    { label: 'Transparent', value: 'transparent', style: 'bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQoU2NkYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==")]' },
    { label: 'White', value: '#ffffff', style: 'bg-white border border-gray-200' },
    { label: 'Black', value: '#000000', style: 'bg-black' },
    { label: 'Red', value: '#ef4444', style: 'bg-red-500' },
    { label: 'Blue', value: '#3b82f6', style: 'bg-blue-500' },
    { label: 'Green', value: '#22c55e', style: 'bg-green-500' },
    { label: 'Yellow', value: '#eab308', style: 'bg-yellow-400' },
    { label: 'Purple', value: '#a855f7', style: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">🎭</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Background Remover</h1>
        <p className="text-gray-500 dark:text-gray-400">Remove image background instantly — 100% free, no signup, works offline</p>
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          <span>✅ No server upload</span>
          <span>✅ PNG with transparency</span>
          <span>✅ Custom background color</span>
        </div>
      </div>

      {/* Upload area */}
      {!image && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${dragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`}
        >
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Drop image here or click to upload</p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP, GIF — up to 20MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Workspace */}
      {image && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">Original</h3>
              <button
                onClick={() => setMode(mode === 'color-pick' ? 'auto' : 'color-pick')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${mode === 'color-pick' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'}`}
              >
                {mode === 'color-pick' ? '🎯 Click to pick color' : '🎨 Pick BG color'}
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img
                ref={imgRef}
                src={image.url}
                alt="Original"
                className={`w-full object-contain max-h-80 ${mode === 'color-pick' ? 'cursor-crosshair' : ''}`}
                onClick={pickColorFromImage}
              />
              {mode === 'color-pick' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold">Click on the background color to remove</span>
                </div>
              )}
            </div>
            {pickedColor && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: `rgb(${pickedColor.join(',')})` }} />
                Background color picked: rgb({pickedColor.join(', ')})
                <button onClick={() => setPickedColor(null)} className="text-red-400 hover:text-red-500 text-xs">✕ Reset</button>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Result</h3>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQoU2NkYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==')] bg-repeat min-h-[200px] flex items-center justify-center">
              {result ? (
                <img src={result} alt="Result" className="w-full object-contain max-h-80" />
              ) : (
                <div className="text-center text-gray-400 p-8">
                  {processing ? (
                    <div className="space-y-3">
                      <div className="text-3xl animate-pulse">⚙️</div>
                      <p className="text-sm font-medium">Removing background... {progress}%</p>
                      <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">✨</div>
                      <p className="text-sm">Result will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {image && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-5">
          {/* Tolerance */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between mb-2">
              <span>Edge Sensitivity</span>
              <span className="text-purple-600 font-bold">{tolerance}</span>
            </label>
            <input
              type="range" min={10} max={80} value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Precise (sharp edges)</span>
              <span>Aggressive (soft edges)</span>
            </div>
          </div>

          {/* Background color */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">New Background</label>
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map(({ label, value, style }) => (
                <button
                  key={value}
                  onClick={() => setBgColor(value)}
                  title={label}
                  className={`w-8 h-8 rounded-full transition-all ${style} ${bgColor === value ? 'ring-2 ring-purple-500 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                />
              ))}
              <input
                type="color"
                value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-300"
                title="Custom color"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={removeBackground}
              disabled={processing}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {processing ? `Processing... ${progress}%` : '✨ Remove Background'}
            </button>
            {result && (
              <button
                onClick={downloadResult}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                ⬇️ Download {bgColor === 'transparent' ? 'PNG' : 'JPG'}
              </button>
            )}
            <button
              onClick={() => { setImage(null); setResult(null); setProgress(0); }}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              🔄 New Image
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        {[
          { icon: '🎯', title: 'Best results', desc: 'Works best with solid or uniform backgrounds (white, blue, green)' },
          { icon: '🎨', title: 'Custom color', desc: 'Use the color picker to set any background color on the result' },
          { icon: '🔒', title: '100% private', desc: 'Your image never leaves your browser — no server upload ever' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</div>
            <div className="text-gray-500 dark:text-gray-400">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
