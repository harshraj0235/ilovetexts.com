import Link from 'next/link';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import ApplicationReady from '@/components/workflows/ApplicationReady';
import { APPLICATION_RECIPE } from '@/lib/application-ready.mjs';
import { workflowMetadata } from '@/lib/workflow-metadata';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(lang, '/workflows/application-ready', 'ApplicationReady — Organise Germany Application Documents', 'Free, local PDF preparation for Indian university graduates applying through uni-assist. Link documents to a sourced checklist and export unchanged originals with a preparation report.');
}

export default function ApplicationReadyPage() {
  return <><WorkspaceSwitch active="workflows" /><div className={s.page}>
    <header className={s.heroCopy}><Link href="/workflows" className={s.small}>← All workflows</Link><p className={s.eyebrow}>ApplicationReady by ilovetexts · Free preparation workspace</p><h1>Your next chapter.<br />Your documents, together.</h1><p className={s.lead}>Give scattered PDFs a little structure. Organise your originals, record what you have checked, and leave with a clear preparation pack for your German university application.</p><p className={s.small}>For Indian university graduates · No account · Documents processed locally · No admission guarantees</p></header>
    <ApplicationReady />
    <section className={s.section} aria-labelledby="application-faq"><h2 id="application-faq">Know what you’re relying on.</h2>
      <details className={s.faq}><summary>Is this an official uni-assist or APS service?</summary><p>No. ilovetexts is independent and has no university, uni-assist or APS affiliation. It does not evaluate qualifications, authenticate certificates or submit applications. Use the <a href={APPLICATION_RECIPE.source} target="_blank" rel="noopener noreferrer">official guidance</a> and your university’s instructions as the authority.</p></details>
      <details className={s.faq}><summary>Does this contain every requirement for my programme?</summary><p>No. The starting checklist covers general document organisation for completed Indian university studies. Add programme-specific requirements from their current official sources, including any applicable language or translation requirements. School-leaver routes, APS application procedures and visa applications are not supported workflows here.</p></details>
      <details className={s.faq}><summary>Will the app change my signed PDF or APS certificate?</summary><p>No. All accepted PDF contents are retained unchanged and checked again before export. The ZIP uses sanitised file names to keep its folder paths safe. The fingerprint verifies those file bytes, not the authenticity of a seal or certificate.</p></details>
      <details className={s.faq}><summary>What do the automatic checks prove?</summary><p>They check whether a supported PDF can be opened, count pages, identify low-text pages and find byte-identical files. They do not prove visual quality, detect every missing page, interpret grades or establish eligibility. A scanned page can be perfectly valid even when no text is extractable.</p></details>
      <details className={s.faq}><summary>Where are my documents stored?</summary><p>Only in this workspace’s memory until you download them. Refreshing, clearing or leaving loses the workspace; downloads remain on your device. The export is not encrypted. This workflow sends no document contents, file names or requirement entries to an upload or analytics endpoint. General site page analytics still apply.</p></details>
      <details className={s.faq}><summary>Can I pay for an expert to review my application?</summary><p>Not in this release. No expert review, checkout or delivery promise is offered. The free workflow is available without a payment card. A paid service would require an actual reviewer, confirmed scope, secure document handling and clear payment terms before launch.</p></details>
    </section>
    <p className={s.note}>General sources checked {APPLICATION_RECIPE.checked}. Requirements can change. Read the <a href={APPLICATION_RECIPE.generalSource} target="_blank" rel="noopener noreferrer">official document overview</a> and recheck your programme before using the export.</p>
  </div></>;
}
