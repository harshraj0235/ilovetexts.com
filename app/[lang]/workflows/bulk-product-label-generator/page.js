import BulkProductLabelGenerator from '@/components/workflows/bulk-generators/BulkProductLabelGenerator';
import { workflowMetadata } from '@/lib/workflow-metadata';
import WorkspaceSwitch from '@/components/WorkspaceSwitch';
import s from '@/components/workflows/Workflows.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return workflowMetadata(
    lang, 
    '/workflows/bulk-product-label-generator', 
    'Bulk Product Label & Barcode Generator Free', 
    'Upload your product inventory Excel and generate bulk product labels with prices, barcodes, and QR codes instantly. Perfect for retail shops, warehouses, and small brands.'
  );
}

export default function Page() {
  return (
    <>
      <WorkspaceSwitch active="workflows" />
      <div className={s.page}>
        <BulkProductLabelGenerator />
        <section className={s.seoSection}>
          <h2>Generate Retail Product Labels in Bulk</h2>
          <p>
            Whether you are managing a small retail shop, running a boutique brand, or organising a warehouse, ticketing your inventory can be tedious. Our <strong>Free Bulk Product Label Generator</strong> lets you upload your inventory Excel list and instantly generate hundreds of printable labels complete with product names, prices, and barcodes.
          </p>
          
          <h3>Key Features for Retailers & Warehouses</h3>
          <ul>
            <li><strong>Barcode & QR Code Support:</strong> Choose between a classic linear barcode layout or a modern QR code layout to encode your SKUs, batch numbers, or web links.</li>
            <li><strong>Dynamic Currency & Pricing:</strong> Automatically formats the price from your Excel data with your selected currency symbol (₹, $, €, £, etc.) and a custom tax note (e.g., 'Incl. of all taxes').</li>
            <li><strong>Compliance Details:</strong> Map optional columns for Manufacturing Date (Mfg), Expiry Date (Exp), Weight, and Batch Numbers to ensure your packaging meets local retail compliance.</li>
            <li><strong>Browser-Based Privacy:</strong> Your pricing and inventory data is highly sensitive. The label generation happens securely within your own browser without sending data to any servers.</li>
            <li><strong>ZIP Archive Output:</strong> Downloads a ZIP file containing high-quality PDFs for every product, ready to be sent to a label printer or standard A4 printer.</li>
          </ul>

          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>What type of barcode is generated?</summary>
              <p>The visual barcode in the PDF preview provides a standard linear representation based on the data in your 'Barcode / SKU' column, designed to simulate standard retail formats like EAN-13 or Code 128.</p>
            </details>
            <details className={s.faqItem}>
              <summary>How do I print these labels?</summary>
              <p>The output PDFs are sized appropriately for standard thermal label printers (roughly 2" x 1.2"). You can print them directly using a barcode printer (like Zebra or TSC) or arrange them on A4 sticker sheets.</p>
            </details>
            <details className={s.faqItem}>
              <summary>Can I add my shop name to every label?</summary>
              <p>Yes. Enter your Store or Brand Name in the Template Settings panel and toggle "Show Store Name at top" to prominently display your branding on every printed sticker.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
