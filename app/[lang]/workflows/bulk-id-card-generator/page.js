import BulkIDCardGenerator from '@/components/workflows/bulk-generators/BulkIDCardGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-id-card-generator', 
    'Bulk ID Card Generator — Create ID Cards from Excel Free', 
    'Upload names, IDs and photos in Excel and instantly generate hundreds of print-ready front and back ID cards. Free online bulk ID card maker for schools, events, and offices.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkIDCardGenerator />
        <section className={s.seoSection}>
          <h2>Why use our Bulk ID Card Maker?</h2>
          <p>
            Manually designing and filling out ID cards for a large number of students, employees, or event attendees is time-consuming. Our <strong>Bulk ID Card Generator</strong> automates this process directly in your browser. Just upload an Excel or CSV file containing names, ID numbers, and other details, and download a ZIP file containing print-ready PDF ID cards.
          </p>
          
          <h3>Key Features of the Free ID Card Generator</h3>
          <ul>
            <li><strong>Excel / CSV Upload:</strong> Easily map columns from your spreadsheet to the ID card fields.</li>
            <li><strong>Front and Back Design:</strong> Auto-generate dual-sided ID cards with emergency contact and return address details.</li>
            <li><strong>100% Secure & Private:</strong> All processing happens locally in your web browser. No data is uploaded or stored on our servers.</li>
            <li><strong>Customisable Templates:</strong> Adjust colours, organization name, and layout to match your branding.</li>
            <li><strong>ZIP Download:</strong> Get all individual PDF files neatly packed in a single ZIP archive, ready for bulk printing.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>How do I add photos to the bulk ID cards?</summary>
              <p>You can include a column in your Excel sheet with URLs to the photos. Ensure the images are publicly accessible. Alternatively, you can print the generated PDF templates and physically attach passport-size photos.</p>
            </details>
            <details className={s.faqItem}>
              <summary>What is the best paper size for printing ID cards?</summary>
              <p>The generated PDFs are designed to fit standard CR80 ID card dimensions (86mm x 54mm or 3.375" x 2.125"). You can print them directly onto PVC cards using an ID card printer, or print them on A4 paper and cut them out.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Is there a limit on how many cards I can generate?</summary>
              <p>Our free tool allows you to process up to 500 rows per Excel file at a time to ensure optimal browser performance without crashing.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
