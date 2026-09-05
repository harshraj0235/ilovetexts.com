'use client';
import { useState, useRef } from 'react';

export default function HeicToJpg({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [quality, setQuality] = useState(92);
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const addFiles = (newFiles) => {
    const heicFiles = Array.from(newFiles).filter(f =>
      f.name.toLowerCase().endsWith('.heic') ||
      f.name.toLowerCase().endsWith('.heif') ||
      f.type === 'image/heic' ||
      f.type === 'image/heif' ||
      f.type.startsWith('image/')  // also accept other image types for demo
    );
    setFiles(prev => [...prev, ...heicFiles.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
    setResults([]);
  };

  const convertAll = async () => {
    if (files.length === 0) return;
    setConverting(true);
    setResults([]);
    const output = [];

    for (const { file, id } of files) {
      try {
        // Try to use createImageBitmap (works for HEIC in modern Chrome/Safari)
        // For HEIC files that aren't natively supported, we use a canvas-based approach
        let blob;

        // Check if browser can handle the format directly
        const canHandle = await checkBrowserHeicSupport();

        if (canHandle || !file.name.toLowerCase().endsWith('.heic')) {
          // Browser supports it natively or it's another image type
          const imageBitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = imageBitmap.width;
          canvas.height = imageBitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0);
          const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          const dataUrl = canvas.toDataURL(mimeType, quality / 100);
          blob = await (await fetch(dataUrl)).blob();
        } else {
          // HEIC not natively supported — use FileReader + Image fallback
          blob = await convertHeicFallback(file, outputFormat, quality);
        }

        const url = URL.createObjectURL(blob);
        const ext = outputFormat === 'jpg' ? 'jpg' : 'png';
        const name = file.name.replace(/\.(heic|heif)$/i, `.${ext}`);
        output.push({ id, url, name, size: blob.size, success: true });
      } catch (err) {
        output.push({ id, name: file.name, success: false, error: err.message });
      }
    }

    setResults(output);
    setConverting(false);
  };

  const checkBrowserHeicSupport = () => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = 'data:image/heic;base64,AAAAHGZ0eXBoZWljAAAAAG1pZjFoZWljAAAA';
      setTimeout(() => resolve(false), 500);
    });
  };

  const convertHeicFallback = (file, format, qual) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 800;
          canvas.height = img.height || 600;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), mimeType, qual / 100);
        };
        img.onerror = () => reject(new Error('Cannot decode HEIC in this browser. Try Chrome or Safari.'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const downloadAll = async () => {
    const successful = results.filter(r => r.success);
    if (successful.length === 1) {
      const a = document.createElement('a');
      a.href = successful[0].url;
      a.download = successful[0].name;
      a.click();
    } else if (successful.length > 1) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const r of successful) {
        const res = await fetch(r.url);
        zip.file(r.name, await res.blob());
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-images.zip`;
      a.click();
    }
  };

  const successCount = results.filter(r => r.success).length;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">📱➡️🖼️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HEIC to JPG Converter</h1>
        <p className="text-gray-500 dark:text-gray-400">Convert iPhone HEIC photos to JPG or PNG — free, bulk convert, no upload</p>
        <div className="flex justify-center gap-4 text-sm text-gray-400 flex-wrap">
          <span>✅ iPhone .heic photos</span>
          <span>✅ Bulk convert</span>
          <span>✅ No server upload</span>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Output Format</label>
            <div className="flex gap-2">
              {[['jpg', '🖼️ JPG (smaller file)'], ['png', '🖼️ PNG (lossless)']].map(([val, label]) => (
                <button key={val} onClick={() => setOutputFormat(val)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all
                    ${outputFormat === val ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex justify-between mb-2">
              <span>Quality</span>
              <span className="text-orange-600">{quality}%</span>
            </label>
            <input type="range" min={60} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full accent-orange-500 mt-1" />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${dragOver ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'}`}
      >
        <div className="text-4xl mb-3">📱</div>
        <p className="font-semibold text-gray-700 dark:text-gray-200">Drop HEIC files here or click to select</p>
        <p className="text-sm text-gray-400 mt-1">Supports .heic .heif — multiple files at once</p>
        <input ref={fileRef} type="file" accept=".heic,.heif,image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
            <button onClick={() => { setFiles([]); setResults([]); }} className="text-sm text-red-400 hover:text-red-500">Clear all</button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map(({ file, id }) => {
              const res = results.find(r => r.id === id);
              return (
                <div key={id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3">
                  <div className="text-2xl">📷</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {res && (
                    res.success ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 text-xs font-semibold">✅ {(res.size / 1024).toFixed(1)} KB</span>
                        <a href={res.url} download={res.name} className="text-xs text-blue-600 hover:underline">⬇️</a>
                      </div>
                    ) : (
                      <span className="text-red-400 text-xs">❌ Failed</span>
                    )
                  )}
                  {!res && (
                    <button onClick={() => setFiles(f => f.filter(x => x.id !== id))} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                  )}
                </div>
              );
            })}
          </div>

          {results.length === 0 && (
            <button onClick={convertAll} disabled={converting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors">
              {converting ? '⚙️ Converting...' : `🔄 Convert ${files.length} File${files.length > 1 ? 's' : ''} to ${outputFormat.toUpperCase()}`}
            </button>
          )}

          {successCount > 0 && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4 text-center">
                <p className="font-bold text-green-700 dark:text-green-400">✅ {successCount} file{successCount > 1 ? 's' : ''} converted successfully!</p>
              </div>
              <button onClick={downloadAll} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors">
                ⬇️ Download {successCount > 1 ? `All as ZIP` : outputFormat.toUpperCase()}
              </button>
              <button onClick={() => { setFiles([]); setResults([]); }} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                🔄 Convert more files
              </button>
            </div>
          )}
        </div>
      )}

      {/* Browser note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>📱 iPhone users:</strong> HEIC is the default iPhone photo format. This tool converts them to JPG/PNG so they work everywhere — WhatsApp, email, websites, Windows PCs.
        <br /><strong>Note:</strong> HEIC conversion works natively on Safari/Chrome. If it fails, try a different browser.
      </div>
    </div>
  );
}
