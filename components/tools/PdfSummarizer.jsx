'use client';
// ═══════════════════════════════════════════════════════
// PdfSummarizer.jsx — AI-powered extractive PDF summary
// Uses TF-IDF + positional scoring to extract key sentences.
// No server needed — all processing in browser.
// ═══════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { UsageBadge } from '@/components/ProGate';
import { checkUsage, recordUsage, checkFileSize } from '@/lib/subscription';

const TOOL_ID = 'pdf-summarizer';

// Extractive summarizer using TF-IDF + position + length scoring
function summarizeText(text, ratio = 0.3, mode = 'paragraph') {
  const sentences = text
    .replace(/\n{2,}/g, '\n')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.split(/\s+/).length > 4);

  if (sentences.length <= 3) return { summary: text, keyFindings: sentences, stats: { totalSentences: sentences.length, summarySentences: sentences.length } };

  // TF-IDF computation
  const stopWords = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','of','in','to','for','with','on','at','from','by','as','or','and','but','not','no','so','if','then','than','that','this','it','its','i','you','he','she','we','they','my','your','his','her','our','their','me','him','us','them','what','which','who','whom','how','when','where','why','all','each','every','both','few','more','most','some','any','other','into','through','during','before','after','above','below','between','out','off','over','under','again','further','once']);
  
  const wordFreq = {};
  const docFreq = {};
  
  sentences.forEach((sent, idx) => {
    const words = sent.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    const seen = new Set();
    words.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
      if (!seen.has(w)) { docFreq[w] = (docFreq[w] || 0) + 1; seen.add(w); }
    });
  });

  const N = sentences.length;
  const tfidf = {};
  Object.keys(wordFreq).forEach(w => {
    tfidf[w] = (wordFreq[w] / Object.keys(wordFreq).length) * Math.log(N / (docFreq[w] || 1));
  });

  // Score each sentence
  const scored = sentences.map((sent, idx) => {
    const words = sent.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    
    // TF-IDF score
    const tfidfScore = words.reduce((sum, w) => sum + (tfidf[w] || 0), 0) / Math.max(words.length, 1);
    
    // Position score (first and last sentences are more important)
    const posScore = idx < N * 0.2 ? 1.5 : idx > N * 0.8 ? 1.2 : 1.0;
    
    // Length score (prefer medium-length sentences)
    const lenScore = words.length > 8 && words.length < 30 ? 1.2 : 1.0;
    
    // Presence of key indicators
    const hasNumbers = /\d+/.test(sent) ? 1.1 : 1.0;
    const hasQuotes = /["']/.test(sent) ? 1.15 : 1.0;
    const startsWithCapital = /^[A-Z]/.test(sent) ? 1.05 : 1.0;

    const score = tfidfScore * posScore * lenScore * hasNumbers * hasQuotes * startsWithCapital;
    return { sent, idx, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const targetCount = Math.max(3, Math.round(N * ratio));
  const selected = scored.slice(0, targetCount);
  
  // Key findings = top 5 sentences
  const keyFindings = scored.slice(0, 5).sort((a, b) => a.idx - b.idx).map(s => s.sent);

  // Sort selected by original order for coherent summary
  selected.sort((a, b) => a.idx - b.idx);

  let summary;
  if (mode === 'bullets') {
    summary = selected.map(s => `• ${s.sent}`).join('\n');
  } else {
    summary = selected.map(s => s.sent).join(' ');
  }

  return {
    summary,
    keyFindings,
    stats: {
      totalSentences: N,
      summarySentences: selected.length,
      compressionRatio: Math.round((1 - selected.length / N) * 100),
      totalWords: text.split(/\s+/).length,
      summaryWords: summary.split(/\s+/).length,
    },
  };
}

const S = {
  wrap: { maxWidth: 860, margin: '0 auto', width: '100%' },
  card: { background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  dropzone: (over) => ({ border: `2px dashed ${over ? '#f59e0b' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: over ? 'rgba(245,158,11,0.04)' : 'var(--bg-secondary)', transition: 'all 0.2s' }),
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  stat: { flex: 1, minWidth: 100, padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-light)' },
};

export default function PdfSummarizer({ t, lang }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [summaryLength, setSummaryLength] = useState(0.3); // 0.25, 0.5, 0.75
  const [summaryMode, setSummaryMode] = useState('paragraph'); // paragraph | bullets
  const [result, setResult] = useState(null);
  const [activeView, setActiveView] = useState('summary'); // summary | key | full
  const [fullText, setFullText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (m, type = 'success') => { setToast({ m, type }); setTimeout(() => setToast(null), 3500); };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.pdf')) { showToast('Please upload a PDF', 'warning'); return; }
    const sizeCheck = checkFileSize(f.size);
    if (!sizeCheck.allowed) { showToast(`File exceeds ${sizeCheck.maxMB}MB limit`, 'warning'); return; }
    setFile(f); setStatus('idle'); setResult(null); setFullText('');
  };

  const summarize = useCallback(async () => {
    if (!file) return;
    const usage = checkUsage(TOOL_ID);
    if (!usage.allowed) { showToast('Daily limit reached. Upgrade to Pro.', 'warning'); return; }

    setStatus('extracting'); setProgress(10);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const ab = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(ab.slice(0)) }).promise;

      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n\n';
        setProgress(10 + Math.round((i / doc.numPages) * 60));
      }

      setFullText(text.trim());
      setStatus('summarizing'); setProgress(75);

      // Run summarization
      const res = summarizeText(text.trim(), summaryLength, summaryMode);
      setResult(res);
      recordUsage(TOOL_ID);
      setProgress(100); setStatus('done');
      showToast(`✅ Summary generated — ${res.stats.compressionRatio}% shorter`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('Failed: ' + err.message, 'error');
    }
  }, [file, summaryLength, summaryMode]);

  const copySummary = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.summary);
    showToast('Summary copied!');
  };

  const downloadSummary = () => {
    if (!result) return;
    const blob = new Blob([result.summary], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace('.pdf', '-summary.txt');
    a.click();
  };

  const lengths = [
    { value: 0.25, label: 'Short (25%)', icon: '📄' },
    { value: 0.5, label: 'Medium (50%)', icon: '📋' },
    { value: 0.75, label: 'Long (75%)', icon: '📖' },
  ];

  return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {['🤖 AI-powered summary', '📊 Key findings extraction', '🔒 100% offline'].map(b => (
          <span key={b} style={S.badge}>{b}</span>
        ))}
        <UsageBadge toolId={TOOL_ID} />
      </div>

      {/* Upload */}
      {!file && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={S.dropzone(dragOver)}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Drop PDF to summarize</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Get a concise summary of any long PDF — research papers, reports, legal documents
          </p>
          <button className="btn-primary" style={{ padding: '10px 28px', cursor: 'pointer' }}>Choose PDF</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {file && (
        <div style={S.card}>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 28 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <button onClick={() => { setFile(null); setStatus('idle'); setResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>✕</button>
          </div>

          {/* Settings */}
          {status === 'idle' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Summary Length</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {lengths.map(l => (
                      <button key={l.value} onClick={() => setSummaryLength(l.value)}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)', border: `2px solid ${summaryLength === l.value ? '#f59e0b' : 'var(--border-light)'}`, background: summaryLength === l.value ? 'rgba(245,158,11,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                        {l.icon} {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Output Format</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['paragraph', 'bullets'].map(m => (
                      <button key={m} onClick={() => setSummaryMode(m)}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)', border: `2px solid ${summaryMode === m ? '#f59e0b' : 'var(--border-light)'}`, background: summaryMode === m ? 'rgba(245,158,11,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        {m === 'paragraph' ? '📝 Paragraph' : '📋 Bullet Points'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={summarize} className="btn-primary" style={{ width: '100%', padding: 14, cursor: 'pointer', fontSize: '1rem' }}>
                🤖 Generate Summary
              </button>
            </>
          )}

          {/* Progress */}
          {(status === 'extracting' || status === 'summarizing') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>{status === 'extracting' ? '📄 Extracting text...' : '🤖 Generating summary...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: 6, borderRadius: 3, background: '#f59e0b', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'done' && result && (
            <>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ ...S.stat, background: 'rgba(245,158,11,0.06)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#d97706' }}>{result.stats.compressionRatio}%</div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706' }}>Shorter</div>
                </div>
                <div style={{ ...S.stat, background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{result.stats.totalWords.toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Original Words</div>
                </div>
                <div style={{ ...S.stat, background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{result.stats.summaryWords.toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Summary Words</div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={copySummary} style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  📋 Copy
                </button>
                <button onClick={downloadSummary} className="btn-primary" style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  📥 Download .txt
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid var(--border-light)' }}>
                {[{ id: 'summary', label: '📝 Summary' }, { id: 'key', label: '🔑 Key Findings' }, { id: 'full', label: '📄 Full Text' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveView(tab.id)}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      color: activeView === tab.id ? '#d97706' : 'var(--text-secondary)',
                      borderBottom: activeView === tab.id ? '2px solid #d97706' : '2px solid transparent', marginBottom: -2 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: 200, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxHeight: 500, overflowY: 'auto' }}>
                {activeView === 'summary' && (
                  <div style={{ lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {result.summary}
                  </div>
                )}
                {activeView === 'key' && (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {result.keyFindings.map((f, i) => (
                      <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.88rem', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                        <span style={{ color: '#d97706', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {activeView === 'full' && (
                  <div style={{ lineHeight: 1.6, fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                    {fullText}
                  </div>
                )}
              </div>

              <button onClick={() => { setFile(null); setStatus('idle'); setResult(null); }}
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.85rem', marginTop: 12 }}>
                🔄 Summarize Another PDF
              </button>
            </>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#16a34a', color: '#fff', fontSize: '0.88rem', fontWeight: 600, zIndex: 2000, boxShadow: 'var(--shadow-float)' }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
