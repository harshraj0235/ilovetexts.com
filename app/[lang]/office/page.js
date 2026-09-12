import Link from 'next/link';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import PilotRequest from '@/components/workflows/PilotRequest';
import { workflowMetadata } from '@/lib/workflow-metadata';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(lang, '/office', 'ilovetexts Office — Assisted Statement Workflow Pilot', 'Request an assisted pilot for recurring bank statement cleanup. Agree input formats, review steps and spreadsheet output before paying. Try the free workspace first.');
}

export default function Office() {
  return <><WorkspaceSwitch active="workflows" /><div className={s.page}>
    <section className={s.heroCopy}><p className={s.eyebrow}>ilovetexts Office · Assisted pilot</p><h1>Make the next month-end<br />a little less manual.</h1><p className={s.lead}>For small teams who repeat the same statement-cleanup task. Start with the free workspace, then ask us about a defined setup and review process for your office.</p><div className={s.actions}><Link href="/workflows/statement-review" className={s.secondary}>Try the free workspace first →</Link></div></section>
    <section className={s.section}><div className={s.grid}>
      <div className={s.card}><span className={s.badge}>Proposed 30-day pilot · Subject to fit</span><h2>A small, agreed starting point.</h2><p><strong className={s.price}>From ₹2,499</strong><br />for one pilot, not an automatic subscription</p><p>Final scope, volume, delivery dates, applicable taxes and price must be confirmed in writing before you pay. Sending an enquiry does not reserve a slot.</p><ul className={s.list}><li>Review one recurring statement format using a redacted or synthetic sample</li><li>Agree the spreadsheet columns your team actually needs</li><li>Document a correction and duplicate-review checklist</li><li>Define a small pilot volume and measure time saved together</li></ul><p className={s.note}>Not included: bookkeeping, tax advice, guaranteed extraction accuracy, live bank access or unlimited document processing. We do not ask for banking passwords.</p><h3>How it starts</h3><ol className={s.list}><li>Tell us about the task—without sending sensitive files.</li><li>We confirm feasibility, availability and written terms.</li><li>You decide whether to proceed. No charge on this page.</li></ol></div>
      <div className={s.card}><p className={s.eyebrow}>Let’s understand your task</p><h2>Request a pilot conversation.</h2><PilotRequest /></div>
    </div></section>
  </div></>;
}
