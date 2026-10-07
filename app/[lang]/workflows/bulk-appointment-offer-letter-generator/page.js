import BulkLetterGenerator from '@/components/workflows/bulk-generators/BulkLetterGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-appointment-offer-letter-generator', 
    'Bulk Offer & Appointment Letter Generator Free', 
    'Automate HR onboarding. Upload employee data in Excel and generate bulk offer letters and appointment letters as PDFs. Free mail merge alternative for HR teams.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkLetterGenerator />
        <section className={s.seoSection}>
          <h2>Simplify HR Onboarding with Bulk Letter Generation</h2>
          <p>
            Writing individual offer letters or appointment letters for a large batch of new hires is prone to copy-paste errors and takes hours. Our <strong>Free Bulk Letter Generator</strong> acts as a secure, in-browser mail merge tool specifically designed for HR professionals and recruiters.
          </p>
          
          <h3>Why use this tool instead of Word Mail Merge?</h3>
          <ul>
            <li><strong>No Software Required:</strong> Works directly in your web browser without needing MS Word, Excel, or complicated mail merge setups.</li>
            <li><strong>Strict Privacy:</strong> Salary details and employee information are highly confidential. Our tool processes everything locally on your device, ensuring no sensitive HR data is leaked or stored.</li>
            <li><strong>Professional Layouts:</strong> Generates beautiful, formatted PDFs with a clean corporate design, your company name, and signatory details perfectly aligned.</li>
            <li><strong>Switchable Letter Types:</strong> Seamlessly toggle the template between a formal "Offer Letter" and a confirmed "Appointment Letter" depending on your onboarding stage.</li>
            <li><strong>Bulk Export:</strong> Get all individual PDFs neatly named and packaged in a ZIP file, ready to be emailed to candidates.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>Can I customise the Terms and Conditions?</summary>
              <p>Yes. The Template Editor allows you to paste your company's standard terms, conditions, probation policies, and confidentiality clauses, which will be appended to every generated letter.</p>
            </details>
            <details className={s.faqItem}>
              <summary>How is the date formatted?</summary>
              <p>You can set the official Letter Date globally in the settings, while the individual employee's "Joining Date" is mapped dynamically from your Excel sheet.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Can I include the employee's specific salary and location?</summary>
              <p>Absolutely. Map the optional "CTC / Salary", "Department", and "Work Location" columns to inject these specific details into each candidate's letter.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
