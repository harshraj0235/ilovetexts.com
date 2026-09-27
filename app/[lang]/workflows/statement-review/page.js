import Link from 'next/link';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import StatementWorkbench from '@/components/workflows/StatementWorkbench';
import { workflowMetadata } from '@/lib/workflow-metadata';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(lang, '/workflows/statement-review', 'Review Bank Statement PDF & CSV Rows — Export Excel Free', 'Convert supported bank statement PDF or CSV files into editable transaction rows. Review duplicate alerts, check balances and export Excel locally in your browser.');
}

export default function StatementReview() {
  return <><WorkspaceSwitch active="workflows" /><div className={s.page}>
    <div className={s.heroCopy}><Link href="/workflows" className={s.small}>← All workflows</Link><p className={s.eyebrow}>Free statement workspace</p><h1>A clearer statement.<br />A calmer review.</h1><p className={s.lead}>Bring your PDF or CSV, check the transactions, then take a clean spreadsheet with you. Your statement contents are processed in this browser, not uploaded by this workflow.</p></div>
    <StatementWorkbench />
    <section className={s.section}><h2>Before you use the result</h2>
      <details className={s.faq}><summary>Which bank statement files work?</summary><p>CSV files need a Date and Description column, plus either Debit/Credit columns or a signed Amount column. Balance is optional. Use decimal points for amounts and full four-digit years. The sample shows the supported structure. The PDF extractor works with selectable text and recognizable table headings; it is not a bank-specific or universal parser.</p></details>
      <details className={s.faq}><summary>How do I check duplicates and running balances?</summary><p>Rows with matching dates, descriptions, amounts and balances are flagged, never automatically deleted. Compare each with its source. Exclude only confirmed duplicates; restore a row if needed. Running-balance checks use consecutive rows within each file and do not verify account ownership, currency or completeness.</p></details>
      <details className={s.faq}><summary>Can I convert scanned PDFs or export directly to Tally?</summary><p>Not in this release. Scans need OCR first or a CSV downloaded from your bank. Exports are general Excel, CSV and JSON files—not certified Tally imports or accounting advice. Check the required columns in your accounting software before using them.</p></details>
      <details className={s.faq}><summary>Are my files saved?</summary><p>This workspace does not upload statement contents or save them to browser storage. Refreshing or leaving clears the workspace; downloaded exports remain on your device. Ordinary site analytics may record page visits, but this workflow does not send transaction values, file names or form text as analytics events.</p></details>
    </section>
  </div></>;
}
