import BulkEventBadgeGenerator from '@/components/workflows/bulk-generators/BulkEventBadgeGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-event-badge-generator', 
    'Bulk Event Badge Generator with QR Codes Free', 
    'Upload your attendee Excel list and create professional conference badges with names, categories, and QR codes instantly. Download a ZIP of ready-to-print PDFs.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkEventBadgeGenerator />
        <section className={s.seoSection}>
          <h2>Create Professional Conference Badges in Bulk</h2>
          <p>
            Organising an event, workshop, or conference? The <strong>Bulk Event Badge Generator</strong> is the fastest way to turn your attendee spreadsheet into beautiful, printable name badges. Skip the complicated design software and generate hundreds of categorised badges in a single click.
          </p>
          
          <h3>Why Event Organisers Love This Tool</h3>
          <ul>
            <li><strong>Auto-Generated QR Codes:</strong> Map an email address or unique ID column, and the tool will automatically generate a scannable QR code on every badge to facilitate networking and check-ins.</li>
            <li><strong>Colour-Coded Categories:</strong> Visually distinguish between Speakers, VIPs, Attendees, Sponsors, and Press with automatic colour-coding based on the Category column in your Excel file.</li>
            <li><strong>Print-Ready PDF Export:</strong> All badges are generated as individual PDFs and packaged into a neat ZIP file, making it easy to send to your local print shop or print on perforated badge paper.</li>
            <li><strong>Privacy First:</strong> Your guest list is valuable. Our tool runs entirely in your browser, meaning your attendee names and contact details never leave your computer.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>What size are the generated badges?</summary>
              <p>The badges are generated in a vertical format (portrait), standard 3" x 4" (or approximately 76mm x 101mm) which fits perfectly into standard conference lanyards and plastic holders.</p>
            </details>
            <details className={s.faqItem}>
              <summary>How do I customise the event branding?</summary>
              <p>You can use the Template Settings panel to input your Event Name, Date, Venue, and select Primary and Accent colours to match your brand identity.</p>
            </details>
            <details className={s.faqItem}>
              <summary>What data does the QR code hold?</summary>
              <p>By default, the QR code encodes the data mapped from the "Email (for QR code)" column. If attendees scan each other's badges, they will quickly see this contact information.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
