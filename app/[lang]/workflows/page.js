import Link from 'next/link';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import { workflowMetadata } from '@/lib/workflow-metadata';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(lang, '/workflows', 'Document Workflows — From Statement to Reviewed Spreadsheet', 'Guided document workflows for everyday office work. Review bank statement PDF or CSV rows, check duplicates and export Excel. Free workspace; optional paid setup help.');
}

export default function Workflows() {
  return <>
    <WorkspaceSwitch active="workflows" />
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>Less busywork. More breathing room.</p>
          <h1>From a pile of files<br />to a job well done.</h1>
          <p className={s.lead}>A tool helps with one step. A workflow guides you through the whole task—with room to check, correct and feel confident about the result.</p>
          <div className={s.actions}><Link className={s.primary} href="/workflows/statement-review">Try statement review <span aria-hidden="true">↗</span></Link><Link className={s.textButton} href="/">Explore free tools →</Link></div>
          <p className={s.small}>Start free. No account or payment card required.</p>
        </div>
        <div className={s.flowPreview} aria-label="Statement review workflow: import, review, export">
          <p className={s.eyebrow}>Your next task, made manageable</p>
          <div className={s.flowRow}><span>01</span><div><strong>Bring your statement</strong><small>Text-based PDF or CSV</small></div></div>
          <div className={s.connector} aria-hidden="true">↓</div>
          <div className={s.flowRow}><span>02</span><div><strong>Review with context</strong><small>Source references · Duplicate alerts</small></div></div>
          <div className={s.connector} aria-hidden="true">↓</div>
          <div className={s.flowRow}><span>03</span><div><strong>Leave with a spreadsheet</strong><small>Excel, CSV or JSON export</small></div></div>
          <p className={s.small}>You stay in control. Nothing is submitted to your bank or accounting software.</p>
        </div>
      </section>
      <section className={s.section} aria-labelledby="choose-workflow">
        <div className={s.sectionHeading}><h2 id="choose-workflow">Choose what you need today.</h2><span className={s.badge}>One workflow, thoughtfully built</span></div>
        <div className={s.grid}>
          <article className={s.card}>
            <span className={s.badge}>Free · Available now</span><h3>Statement → reviewed spreadsheet</h3>
            <p>Prepare bank transaction rows for your own reconciliation. Import files, inspect possible duplicates, correct amounts and export with source references.</p>
            <ul className={s.list}><li>Batch import up to 10 PDF or CSV files</li><li>Row editing and running-balance checks</li><li>Files processed locally in your browser</li></ul>
            <div className={s.actions}><Link href="/workflows/statement-review" className={s.primary}>Open free workflow →</Link></div>
          </article>
          <article className={s.card}>
            <span className={s.badge}>Optional paid help · By agreement</span><h3>A repeatable setup for your office</h3>
            <p>Have a recurring statement-cleanup task? Request an assisted pilot to agree your input format, review checklist and spreadsheet output with us.</p>
            <ul className={s.list}><li>Scope and price confirmed before work starts</li><li>No automatic renewal or card collection here</li><li>Start with a redacted or synthetic example</li></ul>
            <div className={s.actions}><Link href="/office" className={s.secondary}>Explore an assisted pilot →</Link></div>
          </article>
        </div>
      </section>
      <section className={s.section}><h2>Free tools are still right here.</h2><p>Use the Free Tools switch whenever you need a quick conversion, a writing helper or a calculator. Workflows add guidance; they don’t take existing free tools away.</p><p className={s.note}>Statement extraction is a draft, not an accounting certification. Scanned PDFs and unrecognized layouts are not supported by the automatic extractor. Always compare results with your original documents.</p></section>
    </div>
  </>;
}
