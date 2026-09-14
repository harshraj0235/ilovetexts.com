'use client';

import { useEffect, useRef, useState } from 'react';
import { formatFileSize, moveItem, validatePdfFiles } from '@/lib/pdf-merge-utils.mjs';
import styles from './MergePdfTool.module.css';

export default function MergePdfTool() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  async function addFiles(fileList) {
    const { accepted, rejected } = validatePdfFiles(fileList, items);
    setError(rejected.join(' '));
    if (!accepted.length) return;
    const additions = accepted.map((file) => ({ id: crypto.randomUUID(), file, pageCount: null }));
    setItems((current) => [...current, ...additions]);

    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    additions.forEach(async (item) => {
      try {
        const document = await pdfjs.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()) }).promise;
        const pageCount = document.numPages;
        await document.destroy();
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, pageCount } : entry));
      } catch {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, pageCount: 0 } : entry));
      }
    });
  }

  function resetResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  async function merge() {
    if (items.length < 2) return;
    setError('');
    resetResult();
    try {
      const { PDFDocument } = await import('pdf-lib');
      const output = await PDFDocument.create();
      let totalPages = 0;
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress(`Processing ${index + 1} of ${items.length}: ${item.file.name}`);
        let source;
        try {
          source = await PDFDocument.load(await item.file.arrayBuffer());
        } catch {
          throw new Error(`Could not read “${item.file.name}”. It may be damaged or password-protected.`);
        }
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
        totalPages += pages.length;
      }
      setProgress('Creating your download…');
      const bytes = await output.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ url: URL.createObjectURL(blob), pages: totalPages, size: blob.size });
    } catch (mergeError) {
      setError(mergeError.message || 'The PDFs could not be merged. Please try again.');
    } finally {
      setProgress('');
    }
  }

  const totalSize = items.reduce((sum, item) => sum + item.file.size, 0);
  const totalPages = items.reduce((sum, item) => sum + (item.pageCount || 0), 0);

  return <section className={styles.shell} aria-label="Merge PDF files">
    <div className={styles.privacy}><span aria-hidden="true">🔒</span><div><strong>Private by design</strong><span>Your PDFs are merged on this device and never uploaded to our servers.</span></div></div>
    <div className={`${styles.drop} ${dragging ? styles.dropActive : ''}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
      <div aria-hidden="true" style={{ fontSize: 42 }}>📚</div>
      <h2>Add PDFs in the order you want</h2>
      <p>Select two or more PDF files. You can change their order before merging.</p>
      <button className={styles.choose} type="button" onClick={() => inputRef.current?.click()}>Choose PDF files</button>
      <span className={styles.hint}>PDF only · up to 100 MB per file · 300 MB total</span>
    </div>
    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />

    {items.length > 0 && <div className={styles.queue}>
      <div className={styles.queueHeader}><div><strong>Merge order</strong><br/><span>{items.length} files · {totalPages ? `${totalPages} pages · ` : ''}{formatFileSize(totalSize)}</span></div><button type="button" className={styles.clear} onClick={() => { setItems([]); resetResult(); setError(''); }}>Clear all</button></div>
      <ol className={styles.list}>{items.map((item, index) => <li className={styles.item} key={item.id}>
        <span className={styles.order}>{index + 1}</span>
        <div><div className={styles.name} title={item.file.name}>{item.file.name}</div><div className={styles.meta}>{item.pageCount === null ? 'Checking pages…' : item.pageCount === 0 ? 'Unreadable PDF' : `${item.pageCount} page${item.pageCount === 1 ? '' : 's'}`} · {formatFileSize(item.file.size)}</div></div>
        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} disabled={index === 0} aria-label={`Move ${item.file.name} up`} onClick={() => setItems((current) => moveItem(current, index, index - 1))}>↑</button>
          <button type="button" className={styles.iconButton} disabled={index === items.length - 1} aria-label={`Move ${item.file.name} down`} onClick={() => setItems((current) => moveItem(current, index, index + 1))}>↓</button>
          <button type="button" className={`${styles.iconButton} ${styles.remove}`} aria-label={`Remove ${item.file.name}`} onClick={() => { setItems((current) => current.filter((entry) => entry.id !== item.id)); resetResult(); }}>×</button>
        </div>
      </li>)}</ol>
    </div>}

    {error && <div className={styles.error} role="alert">⚠ {error}</div>}
    {items.length > 0 && <div className={styles.footer}><button type="button" className={styles.add} onClick={() => inputRef.current?.click()}>+ Add more PDFs</button><button type="button" className={styles.merge} disabled={items.length < 2 || Boolean(progress)} onClick={merge}>{progress || `Merge ${items.length} PDFs`}</button></div>}
    {result && <div className={styles.result} role="status"><div><strong>✓ Your merged PDF is ready</strong><span>{result.pages} pages · {formatFileSize(result.size)}</span></div><a className={styles.download} href={result.url} download="merged-document.pdf">Download merged PDF</a></div>}
  </section>;
}
