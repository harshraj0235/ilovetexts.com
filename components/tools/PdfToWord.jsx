'use client';
import { useState, useRef } from 'react';

const S = {
  wrap: { maxWidth: 720, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropzone: (over) => ({ border: `2px dashed ${over ? 'var(--highlight)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '52px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(0,112,243,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  fmtBtn: (active) => ({ flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${active ? 'var(--highlight)' : 'var(--border-light)'}`, background: active ? 'rgba(0,112,243,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }),
  progressBar: (pct) => ({ height: 6, borderRadius: 3, background: 'var(--highlight)', width: `${pct}%`, transition: 'width 0.3s' }),
  successBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' },
  textarea: { width: '100%', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '0.8rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
};

export default function PdfToWord({ t, lang }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [wordContent, setWordContent] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [outputFormat, setOutputFormat] = useState('docx');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') { alert('Please upload a PDF file.'); return; }
    setFile(f); setStatus('idle'); setWordContent(''); setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setStatus('extracting'); setProgress(10);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      const ab = await file.arrayBuffer();
      setProgress(20);
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setPageCount(pdf.numPages); setProgress(30);
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let pageText = '', lastY = null;
        for (const item of content.items) {
          if (!item.str) continue;
          const y = item.transform?.[5] || 0;
          if (lastY !== null && Math.abs(lastY - y) > 5) pageText += '\n';
          pageText += item.str + (item.hasEOL ? '\n' : ' ');
          lastY = y;
        }
        fullText += `\n\n--- Page ${i} ---\n\n${pageText.trim()}`;
        setProgress(30 + Math.round((i / pdf.numPages) * 50));
      }
      setWordContent(fullText.trim());
      setProgress(85); setStatus('converting');
      if (outputFormat === 'docx') await generateDocx(fullText.trim());
      else downloadTxt(fullText.trim());
      setProgress(100); setStatus('done');
    } catch (err) { setStatus('error'); console.error(err); }
  };

  const generateDocx = async (text) => {
    const JSZip = (await import('jszip')).default;
    const paragraphs = text.split('\n').map(line => {
      const escaped = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (line.startsWith('--- Page')) return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
      return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
    }).join('');
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.file('_rels/.rels', relsXml);
    zip.file('word/document.xml', docXml);
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '.docx'); a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTxt = (text) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = file.name.replace('.pdf', '.txt'); a.click();
  };

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['🔒 No server upload', '∞ No page limit', '📄 Real .docx output', '⚡ Free forever'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
      </div>

      {!file && (
        <div onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()} style={S.dropzone(dragOver)}>
          <div style={{fontSize:52,marginBottom:16}}>📑</div>
          <h2 style={{fontSize:'1.3rem',fontWeight:700,marginBottom:8}}>Drop PDF here or click to upload</h2>
          <p style={{color:'var(--text-secondary)',marginBottom:16,fontSize:'0.9rem'}}>PDF files only — processed entirely in your browser</p>
          <button className="btn-primary" style={{padding:'10px 28px',cursor:'pointer'}} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
        </div>
      )}

      {file && (
        <div style={S.card}>
          {/* File info */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,padding:'12px 16px',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)'}}>
            <div style={{fontSize:32}}>📑</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:'0.95rem',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</div>
              <div style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>{(file.size/1024).toFixed(1)} KB {pageCount>0&&`• ${pageCount} pages extracted`}</div>
            </div>
            <button onClick={()=>{setFile(null);setStatus('idle');setWordContent('');}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:'1.2rem',padding:4}}>✕</button>
          </div>

          {/* Format choice */}
          <div style={{marginBottom:20}}>
            <label style={S.label}>Output Format</label>
            <div style={{display:'flex',gap:10}}>
              {[['docx','📝 Word (.docx)','Best for editing in MS Word / Google Docs'],['txt','📃 Plain Text (.txt)','Raw extracted text']].map(([val,label,desc])=>(
                <button key={val} onClick={()=>setOutputFormat(val)} style={S.fmtBtn(outputFormat===val)}>
                  <div style={{fontWeight:700,fontSize:'0.88rem',marginBottom:2,color:'var(--text-primary)'}}>{label}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(status==='extracting'||status==='converting') && (
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:6}}>
                <span>{status==='extracting'?'📖 Extracting text...':'⚙️ Building document...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{height:6,background:'var(--bg-tertiary)',borderRadius:3,overflow:'hidden'}}>
                <div style={S.progressBar(progress)} />
              </div>
            </div>
          )}

          {/* Action */}
          {status==='idle' && (
            <button onClick={convert} className="btn-primary" style={{width:'100%',padding:'12px',cursor:'pointer',fontSize:'1rem'}}>
              🔄 Convert to {outputFormat==='docx'?'Word (.docx)':'Text (.txt)'}
            </button>
          )}

          {status==='error' && (
            <div style={{...S.card,background:'#fef2f2',border:'1px solid #fca5a5',textAlign:'center'}}>
              <p style={{color:'#dc2626',marginBottom:8}}>❌ Conversion failed. The PDF may be encrypted or image-only.</p>
              <button onClick={()=>setStatus('idle')} style={{color:'var(--highlight)',background:'none',border:'none',cursor:'pointer',fontSize:'0.85rem'}}>Try again</button>
            </div>
          )}

          {status==='done' && (
            <>
              <div style={S.successBox}>
                <div style={{fontSize:28,marginBottom:4}}>✅</div>
                <div style={{fontWeight:700,color:'#15803d',marginBottom:4}}>Download started!</div>
                <div style={{fontSize:'0.82rem',color:'#16a34a'}}>{pageCount} pages converted — check your downloads</div>
              </div>
              {wordContent && (
                <div style={{marginTop:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={S.label}>Extracted Text Preview</span>
                    <button onClick={()=>navigator.clipboard.writeText(wordContent)} style={{fontSize:'0.78rem',color:'var(--highlight)',background:'none',border:'none',cursor:'pointer'}}>📋 Copy All</button>
                  </div>
                  <textarea style={S.textarea} readOnly value={wordContent} rows={10} />
                </div>
              )}
              <button onClick={()=>{setFile(null);setStatus('idle');setWordContent('');}}
                style={{marginTop:12,width:'100%',padding:'10px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.85rem'}}>
                🔄 Convert Another PDF
              </button>
            </>
          )}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:8}}>
        {[
          {icon:'🔒',title:'Fully private',desc:'PDF never leaves your browser. No server, no cloud.'},
          {icon:'📖',title:'Text PDFs',desc:'Works with any PDF that has selectable text.'},
          {icon:'🖼️',title:'Scanned PDF?',desc:'Use our Scanned PDF to Data tool with OCR instead.'},
        ].map(c=>(
          <div key={c.title} style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)',padding:16}}>
            <div style={{fontSize:24,marginBottom:6}}>{c.icon}</div>
            <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:4}}>{c.title}</div>
            <div style={{color:'var(--text-secondary)',fontSize:'0.82rem'}}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
