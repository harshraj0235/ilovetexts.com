'use client';
import { useState, useRef } from 'react';

export default function PdfToWord({ t, lang }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | extracting | converting | done | error
  const [progress, setProgress] = useState(0);
  const [wordContent, setWordContent] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [outputFormat, setOutputFormat] = useState('docx'); // docx | txt
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setStatus('idle');
    setWordContent('');
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setStatus('extracting');
    setProgress(10);

    try {
      // Load PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      setProgress(30);

      let fullText = '';
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Reconstruct text with layout preservation
        let pageText = '';
        let lastY = null;
        const items = textContent.items;

        for (const item of items) {
          if (item.str === '') continue;
          const y = item.transform ? item.transform[5] : 0;
          if (lastY !== null && Math.abs(lastY - y) > 5) {
            pageText += '\n';
          }
          pageText += item.str + (item.hasEOL ? '\n' : ' ');
          lastY = y;
        }

        fullText += `\n\n--- Page ${i} ---\n\n${pageText.trim()}`;
        setProgress(30 + Math.round((i / totalPages) * 50));
      }

      setWordContent(fullText.trim());
      setProgress(85);
      setStatus('converting');

      if (outputFormat === 'docx') {
        await generateDocx(fullText.trim());
      } else {
        downloadTxt(fullText.trim());
      }

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const generateDocx = async (text) => {
    // Build a minimal .docx using JSZip with proper OOXML structure
    const JSZip = (await import('jszip')).default;

    const paragraphs = text.split('\n').map(line => {
      const isPageHeader = line.startsWith('--- Page');
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (isPageHeader) {
        return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
      }
      return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
    }).join('');

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.file('_rels/.rels', relsXml);
    zip.file('word/document.xml', docXml);
    zip.file('word/_rels/document.xml.rels', wordRelsXml);

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '.docx');
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTxt = (text) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '.txt');
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = () => {
    navigator.clipboard.writeText(wordContent);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">📄➡️📝</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PDF to Word Converter</h1>
        <p className="text-gray-500 dark:text-gray-400">Convert PDF to editable Word document or text — free, no upload, 100% private</p>
        <div className="flex justify-center gap-4 text-sm text-gray-400 flex-wrap">
          <span>✅ No server upload</span>
          <span>✅ Preserves text layout</span>
          <span>✅ No page limit</span>
        </div>
      </div>

      {/* Upload */}
      {!file && (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all
            ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
        >
          <div className="text-5xl mb-3">📑</div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Drop your PDF here or click to upload</p>
          <p className="text-sm text-gray-400 mt-1">PDF files only — processed entirely in your browser</p>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* File loaded */}
      {file && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📑</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB {pageCount > 0 && `• ${pageCount} pages extracted`}</p>
            </div>
            <button onClick={() => { setFile(null); setStatus('idle'); setWordContent(''); }} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
          </div>

          {/* Output format */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Output Format</label>
            <div className="flex gap-3">
              {[['docx', '📝 Word (.docx)', 'Best for editing'], ['txt', '📃 Plain Text (.txt)', 'Just the raw text']].map(([val, label, desc]) => (
                <button key={val} onClick={() => setOutputFormat(val)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${outputFormat === val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{label}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(status === 'extracting' || status === 'converting') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{status === 'extracting' ? '📖 Extracting text from PDF...' : '⚙️ Building document...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Action */}
          {(status === 'idle' || status === 'error') && (
            <button onClick={convert} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
              🔄 Convert to {outputFormat === 'docx' ? 'Word (.docx)' : 'Text (.txt)'}
            </button>
          )}

          {status === 'error' && (
            <p className="text-red-500 text-sm text-center">Conversion failed. The PDF may be encrypted or image-only. Try the OCR tool for scanned PDFs.</p>
          )}

          {status === 'done' && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">✅</div>
                <p className="font-semibold text-green-700 dark:text-green-400">Download started!</p>
                <p className="text-sm text-green-600 dark:text-green-500">{pageCount} pages converted — check your downloads folder</p>
              </div>
              {wordContent && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extracted Text Preview</label>
                    <button onClick={copyText} className="text-xs text-blue-600 hover:underline">📋 Copy All</button>
                  </div>
                  <textarea
                    readOnly value={wordContent}
                    rows={10}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 resize-none font-mono"
                  />
                </div>
              )}
              <button onClick={() => { setFile(null); setStatus('idle'); setWordContent(''); }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                🔄 Convert another PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        {[
          { icon: '🔒', title: 'Fully private', desc: 'PDF never leaves your browser. No server, no cloud.' },
          { icon: '📖', title: 'Text PDF', desc: 'Works with any PDF that has selectable text.' },
          { icon: '🖼️', title: 'Scanned PDF?', desc: 'Use our Scanned PDF to Data tool with OCR instead.' },
        ].map(c => (
          <div key={c.title} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{c.title}</div>
            <div className="text-gray-500 dark:text-gray-400">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
