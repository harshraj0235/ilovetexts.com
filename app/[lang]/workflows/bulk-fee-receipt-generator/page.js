import BulkFeeReceiptGenerator from '@/components/workflows/bulk-generators/BulkFeeReceiptGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-fee-receipt-generator', 
    'Bulk Fee Receipt Generator — Create Receipts from Excel', 
    'Generate hundreds of numbered fee receipts instantly. Upload payment data via Excel and export print-ready PDFs. Free bulk receipt maker with amount in words.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkFeeReceiptGenerator />
        <section className={s.seoSection}>
          <h2>Why use a Bulk Fee Receipt Maker?</h2>
          <p>
            Whether you run a coaching centre, a school, a residential society, or an NGO, issuing receipts for collected payments is a critical but repetitive administrative task. Our <strong>Free Bulk Fee Receipt Generator</strong> takes your Excel list of payments and instantly converts them into professional, numbered PDF receipts ready to be shared with payers.
          </p>
          
          <h3>Key Capabilities</h3>
          <ul>
            <li><strong>Automated Sequential Numbering:</strong> Automatically assign receipt numbers (e.g., REC-0001) or map your own custom invoice numbers from your Excel data.</li>
            <li><strong>Amount in Words:</strong> Built-in Indian numbering system automatically converts numerical amounts into words (e.g., "Five Thousand Only") to prevent fraud and meet accounting standards.</li>
            <li><strong>Outstanding Balance Tracking:</strong> Optionally map a 'Balance Due' column to clearly remind parents or students of pending fee amounts on their receipt.</li>
            <li><strong>100% Client-Side Processing:</strong> Financial data is sensitive. That's why our bulk generator runs entirely in your local browser. No payment amounts or student names are ever uploaded to our servers.</li>
            <li><strong>Bulk ZIP Export:</strong> Save hours of work by generating up to 500 PDF receipts in one click, packaged neatly into a single ZIP file.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>Can I change the currency symbol?</summary>
              <p>Yes. By default, the Indian Rupee (₹) symbol is used, but you can change this to $, €, £, or any other currency string in the Template Settings panel.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Do I need to sign every receipt manually?</summary>
              <p>While the template includes a space for an Authorized Signatory, you can also customise the footer text to state "This is a computer-generated receipt. No physical signature is required." to send them out digitally.</p>
            </details>
            <details className={s.faqItem}>
              <summary>What types of payments can this be used for?</summary>
              <p>It is versatile enough for school tuition fees, society maintenance charges, event registrations, club memberships, and donation receipts.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
