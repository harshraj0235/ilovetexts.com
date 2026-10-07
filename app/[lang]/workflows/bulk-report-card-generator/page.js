import BulkReportCardGenerator from '@/components/workflows/bulk-generators/BulkReportCardGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-report-card-generator', 
    'Bulk Report Card Generator — Auto-Calculate Marks & Grades', 
    'Upload student marks in Excel and automatically generate individual report cards as printable PDFs. Calculates totals, percentages and GPA for schools and teachers.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkReportCardGenerator />
        <section className={s.seoSection}>
          <h2>How to Create Bulk Report Cards from Excel</h2>
          <p>
            Teachers and school administrators spend countless hours manually calculating student marks, percentages, and assigning grades. Our <strong>Free Bulk Report Card Generator</strong> eliminates this busywork. By uploading a single Excel (.xlsx or .csv) file containing your students' subject marks, you can generate professional, print-ready PDF report cards in seconds.
          </p>
          
          <h3>Features Tailored for Schools and Tuition Centres</h3>
          <ul>
            <li><strong>Automated Calculations:</strong> Automatically sums up total marks, calculates accurate percentages, and assigns grades or GPA.</li>
            <li><strong>Custom Grading Systems:</strong> Choose between standard Percentage, 10-point GPA, or Letter Grades based on your school's board requirements (CBSE, ICSE, State Boards).</li>
            <li><strong>Personalised Remarks:</strong> Include attendance percentages and custom teacher remarks for every individual student.</li>
            <li><strong>Data Privacy Guaranteed:</strong> Because the generation happens in your web browser, student data is never uploaded to any cloud server, ensuring absolute privacy compliance.</li>
            <li><strong>Batch ZIP Export:</strong> Download hundreds of student result PDFs grouped into a single ZIP file for easy distribution and printing.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>How should I format my Excel sheet for report cards?</summary>
              <p>Your Excel sheet should have columns for Student Name, Roll Number, and Class. Followed by columns for each subject name and the corresponding marks obtained. You can download the sample template within the tool to see the exact recommended structure.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Can I change the passing criteria?</summary>
              <p>Yes. By default, passing marks are set to 33 out of 100, but you can adjust the Maximum Marks and Passing Marks in the Template Settings to fit your specific examination rules.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Does it support different subjects for different students?</summary>
              <p>Yes, you can specify Subject 1 Name, Subject 2 Name, etc., dynamically for each student in the Excel rows, making it perfect for students taking elective subjects.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
