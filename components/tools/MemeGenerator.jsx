'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MEME_TEMPLATES = [
  { id: 'drake', name: 'Drake', emoji: '🦆', topText: '', bottomText: '', topY: 0.15, bottomY: 0.65, color: '#fff', stroke: '#000' },
  { id: 'distracted', name: 'Distracted BF', emoji: '👀', topText: '', bottomText: '', topY: 0.15, bottomY: 0.85, color: '#fff', stroke: '#000' },
  { id: 'success-kid', name: 'Success Kid', emoji: '✊', topText: '', bottomText: '', topY: 0.12, bottomY: 0.85, color: '#fff', stroke: '#000' },
  { id: 'change-mind', name: "Can't Change My Mind", emoji: '🧠', topText: '', bottomText: '', topY: 0.12, bottomY: 0.80, color: '#fff', stroke: '#000' },
  { id: 'two-buttons', name: 'Two Buttons', emoji: '🔴', topText: '', bottomText: '', topY: 0.10, bottomY: 0.85, color: '#fff', stroke: '#000' },
  { id: 'this-is-fine', name: 'This Is Fine 🔥', emoji: '🐶', topText: '', bottomText: '', topY: 0.10, bottomY: 0.85, color: '#fff', stroke: '#000' },
  { id: 'blank', name: 'Blank / Custom', emoji: '🖼️', topText: '', bottomText: '', topY: 0.12, bottomY: 0.85, color: '#fff', stroke: '#000' },
];

// Generate placeholder images using canvas for templates
const COLORS = {
  'drake': ['#1a1a2e', '#16213e'],
  'distracted': ['#2d3561', '#c05c7e'],
  'success-kid': ['#1a6b3c', '#2d8a56'],
  'change-mind': ['#2c3e50', '#3498db'],
  'two-buttons': ['#c0392b', '#e74c3c'],
  'this-is-fine': ['#d35400', '#e67e22'],
  'blank': ['#374151', '#4b5563'],
};

export default function MemeGenerator({ t, lang }) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [fontSize, setFontSize] = useState(42);
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [customImage, setCustomImage] = useState(null);
  const [templateImg, setTemplateImg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef();
  const fileRef = useRef();

  const generateTemplateBg = useCallback((templateId) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const [c1, c2] = COLORS[templateId] || ['#374151', '#4b5563'];
    const grad = ctx.createLinearGradient(0, 0, 600, 600);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    const template = MEME_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.emoji, 300, 320);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(template.name, 300, 380);
    }
    return canvas.toDataURL();
  }, []);

  useEffect(() => {
    if (!customImage) {
      const dataUrl = generateTemplateBg(selectedTemplate);
      const img = new Image();
      img.onload = () => setTemplateImg(img);
      img.src = dataUrl;
    }
  }, [selectedTemplate, customImage, generateTemplateBg]);

  useEffect(() => {
    drawMeme();
  }, [topText, bottomText, fontSize, textColor, strokeColor, templateImg, customImage]);

  const drawMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = customImage || templateImg;
    if (!img) return;

    canvas.width = img.width || 600;
    canvas.height = img.height || 600;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const drawText = (text, x, y, maxWidth) => {
      if (!text) return;
      ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = fontSize / 8;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = textColor;

      // Word wrap
      const words = text.toUpperCase().split(' ');
      const lines = [];
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      const lineH = fontSize * 1.15;
      let startY = y;
      if (y > canvas.height / 2) {
        startY = y - (lines.length - 1) * lineH;
      }
      lines.forEach((line, i) => {
        const lineY = startY + i * lineH;
        ctx.strokeText(line, x, lineY);
        ctx.fillText(line, x, lineY);
      });
    };

    const pad = 20;
    const template = MEME_TEMPLATES.find(t => t.id === selectedTemplate);
    const topY = template ? canvas.height * template.topY : canvas.height * 0.12;
    const bottomY = template ? canvas.height * template.bottomY : canvas.height * 0.9;

    drawText(topText, canvas.width / 2, topY + fontSize, canvas.width - pad * 2);
    drawText(bottomText, canvas.width / 2, bottomY, canvas.width - pad * 2);
  };

  const handleCustomImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setCustomImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'meme.png';
    a.click();
  };

  const copyMeme = async () => {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Meme copied to clipboard!');
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">😂</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meme Generator</h1>
        <p className="text-gray-500 dark:text-gray-400">Create memes instantly — upload any image or use templates. Free, no watermark.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Templates */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Template</label>
            <div className="grid grid-cols-4 gap-2">
              {MEME_TEMPLATES.map(tmpl => (
                <button key={tmpl.id} onClick={() => { setSelectedTemplate(tmpl.id); setCustomImage(null); }}
                  className={`p-2 rounded-xl border-2 text-center transition-all text-xs
                    ${selectedTemplate === tmpl.id && !customImage ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-yellow-400'}`}>
                  <div className="text-2xl">{tmpl.emoji}</div>
                  <div className="text-gray-600 dark:text-gray-400 truncate">{tmpl.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom image upload */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Or Upload Your Own Image</label>
            <div
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleCustomImage(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all text-sm
                ${dragOver ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 dark:border-gray-600 hover:border-yellow-400'}`}
            >
              {customImage ? (
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-semibold">✅ Custom image loaded</span>
                  <button onClick={(e) => { e.stopPropagation(); setCustomImage(null); }} className="text-red-400 hover:text-red-500 text-xs">✕ Remove</button>
                </div>
              ) : (
                <span className="text-gray-500">📁 Drop image here or click to upload</span>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleCustomImage(e.target.files[0])} />
            </div>
          </div>

          {/* Text inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Top Text</label>
              <input value={topText} onChange={e => setTopText(e.target.value)} placeholder="TOP TEXT"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-400 uppercase font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Bottom Text</label>
              <input value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="BOTTOM TEXT"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-400 uppercase font-bold" />
            </div>
          </div>

          {/* Style controls */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex justify-between mb-1">
                <span>Font Size</span><span className="text-yellow-600">{fontSize}px</span>
              </label>
              <input type="range" min={20} max={80} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-yellow-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Text Color</label>
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Outline Color</label>
              <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={downloadMeme} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors">
              ⬇️ Download PNG
            </button>
            <button onClick={copyMeme} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-colors">
              📋 Copy
            </button>
          </div>
        </div>

        {/* Canvas preview */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Live Preview</h3>
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full max-h-96 object-contain" style={{ imageRendering: 'auto' }} />
          </div>
          <p className="text-xs text-center text-gray-400">Changes update in real-time • Download is full resolution PNG</p>
        </div>
      </div>
    </div>
  );
}
