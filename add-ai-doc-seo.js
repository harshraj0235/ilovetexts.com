const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('locales/content/en.json','utf8'));

const newTools = {
  'pdf-diff-checker': {
    name: 'PDF Difference Checker — Compare Two PDFs Free',
    description: 'Compare two PDF files and find every difference with word-level highlighting. Free, no upload, no signup.',
    metaTitle: 'PDF Difference Checker Free — Compare Two PDFs Word by Word Online',
    metaDescription: 'Compare two PDF, TXT or DOCX files online for free. Word-level diff with red/green highlights. Unified and side-by-side views. Stats: similarity %, words added/removed. No upload, no signup.',
    keywords: 'compare two pdf files online free, pdf difference checker free, pdf diff tool no upload, find differences between pdfs online, compare pdf documents free, pdf comparison tool online',
    whatIs: 'Our PDF Difference Checker compares two PDF, TXT or Word documents side-by-side and highlights every word-level change — added words in green, removed words in red with strikethrough. Choose between unified view (single document with changes inline) or side-by-side view. Export a complete diff report as TXT or HTML. All processing uses pdfjs-dist locally in your browser — no file is uploaded to any server.',
    whyChoose: [
      { icon: '🔍', title: 'Word-Level Accuracy', description: 'Highlights individual changed words, not just lines — perfect for legal documents and contracts.' },
      { icon: '📊', title: 'Similarity Stats', description: 'Shows similarity percentage, words added, words removed, and total words compared.' },
      { icon: '📋', title: 'Two View Modes', description: 'Unified view (changes inline) and side-by-side view for different comparison preferences.' },
      { icon: '🔒', title: 'No Upload — 100% Private', description: 'pdfjs extracts text locally. Your confidential documents never leave your device.' }
    ],
    useCases: [
      'Compare two versions of a legal contract to find changed clauses',
      'Verify that a document has not been tampered with',
      'Track changes between draft and final version of reports',
      'Compare academic paper revisions before submitting',
      'Check if invoice amounts were changed between document versions'
    ],
    faqs: [
      { question: 'What file formats can I compare?', answer: 'PDF, TXT, and DOCX (Word) files. You can even compare a PDF against a TXT file.' },
      { question: 'Are my files uploaded to any server?', answer: 'No. pdfjs-dist and mammoth.js extract text in your browser. Your files never leave your device.' },
      { question: 'How does the similarity percentage work?', answer: 'Similarity = (unchanged words / total words) × 100. Two identical documents show 100%. Completely different documents show near 0%.' }
    ],
    relatedSearches: ['compare two pdf files free', 'pdf diff checker online', 'find changes in pdf', 'pdf comparison tool free', 'document difference finder free']
  },
  'screenshot-to-excel': {
    name: 'Screenshot to Excel Converter — Free OCR Table Extractor',
    description: 'Convert screenshots of tables to Excel/CSV using OCR. Extract table data from images instantly. No upload, free.',
    metaTitle: 'Screenshot to Excel Free — Extract Table from Image, No Upload',
    metaDescription: 'Convert screenshots, photos and scans of tables to Excel (XLSX), CSV or JSON using OCR. Edit extracted data before downloading. Tesseract.js runs in browser — no file upload. Free, no signup.',
    keywords: 'screenshot to excel free online, image to excel converter free, photo to spreadsheet ocr free, table from screenshot to csv, convert image table to excel no upload, jpg to excel free',
    whatIs: 'Our Screenshot to Excel tool uses Tesseract.js OCR (the same engine behind Google Docs OCR) to extract table data from any image — screenshots, mobile photos, scanned documents, or dashboard captures. The extracted data is automatically structured into rows and columns. Edit the table directly in the browser before downloading as Excel (XLSX), CSV, TSV, or JSON. Everything runs locally — your images are never uploaded.',
    whyChoose: [
      { icon: '📸', title: 'Works on Any Image', description: 'Screenshots, phone photos, scanned documents, dashboard captures — any image containing a table.' },
      { icon: '✏️', title: 'Edit Before Downloading', description: 'Fix OCR errors directly in the extracted table before exporting — add/remove rows and columns.' },
      { icon: '📊', title: '4 Export Formats', description: 'Download as Excel (XLSX), CSV, TSV, or JSON with headers optionally mapped as object keys.' },
      { icon: '🔒', title: 'No Upload — Tesseract.js Local', description: 'OCR runs in your browser using Tesseract.js WASM. Your images never leave your device.' }
    ],
    useCases: [
      'Extract a table from a screenshot of a financial report',
      'Convert a photo of a printed price list to Excel',
      'Extract data from a scanned form into CSV',
      'Convert a dashboard screenshot table to spreadsheet',
      'Extract competition pricing from a screenshot'
    ],
    faqs: [
      { question: 'What types of images work best?', answer: 'High-contrast images with clear text work best. Screenshots from screens are ideal. Blurry or low-light photos may have reduced accuracy.' },
      { question: 'Can I edit the extracted data?', answer: 'Yes. Click "Edit Table" to edit any cell, add rows/columns, or remove incorrect data before downloading.' },
      { question: 'What is the difference between CSV and XLSX output?', answer: 'CSV is plain text with commas and works in all tools. XLSX is an Excel file with proper formatting that opens directly in Microsoft Excel or Google Sheets.' }
    ],
    relatedSearches: ['screenshot to excel free', 'image to spreadsheet ocr free', 'table from photo to csv', 'convert screenshot to excel', 'extract table from image free no upload']
  },
  'bank-statement-analyzer': {
    name: 'Bank Statement Analyzer — Free PDF & CSV Analysis',
    description: 'Analyze bank statements — auto-categorize transactions, spending charts, export to Excel. PDF or CSV. 100% private.',
    metaTitle: 'Bank Statement Analyzer Free — Categorize Transactions, Charts, No Upload',
    metaDescription: 'Analyze your bank statement PDF or CSV for free. Auto-categorizes 30+ spending categories. Spending by category chart. Export transactions to CSV. Completely private — processed in your browser.',
    keywords: 'bank statement analyzer free online, analyze bank statement pdf free, categorize bank transactions online, spending analysis from bank statement, bank statement reader free, pdf bank statement analyzer no upload',
    whatIs: 'Our Bank Statement Analyzer reads your bank statement PDF or CSV file locally in your browser, extracts all transactions using pdfjs-dist, and automatically categorizes them into 30+ categories (Food, Shopping, Transport, Healthcare, EMI, Investment, etc.) using smart keyword matching. View spending charts, filter by category, search transactions, and export to CSV for accounting. Your bank data never leaves your device.',
    whyChoose: [
      { icon: '🏦', title: '30+ Auto Categories', description: 'Smart keyword matching categorizes transactions into Food, Shopping, Transport, EMI, Investment, and 25+ more categories automatically.' },
      { icon: '📊', title: 'Visual Spending Charts', description: 'Bar chart shows spending by category with amounts and transaction counts at a glance.' },
      { icon: '🔍', title: 'Search & Filter', description: 'Search transactions by keyword, filter by category, and sort by date, amount, or category.' },
      { icon: '🔒', title: 'Bank Data Never Uploaded', description: 'pdfjs processes PDF locally. Your financial data stays on your device — not on our servers.' }
    ],
    useCases: [
      'Analyze monthly spending patterns and find where your money goes',
      'Prepare categorized expense report for tax filing',
      'Identify recurring subscriptions and unused services',
      'Track income vs expenses for budgeting',
      'Export transactions to CSV for accounting software'
    ],
    faqs: [
      { question: 'Which banks are supported?', answer: 'Any bank that exports PDF or CSV statements — SBI, HDFC, ICICI, Axis, Kotak, PNB, BOI, and international banks. The tool auto-detects common bank statement formats.' },
      { question: 'Is my bank data sent to any server?', answer: 'No. pdfjs processes your PDF entirely in your browser. We never see or store your financial data.' },
      { question: 'How accurate is the categorization?', answer: 'The categorization uses keyword matching on transaction descriptions. It correctly categorizes most common merchants. You can filter by category to review any miscategorizations.' }
    ],
    relatedSearches: ['bank statement analyzer free', 'analyze pdf bank statement', 'categorize bank transactions free', 'bank statement spending analysis', 'pdf bank statement reader free no upload']
  },
  'scanned-pdf-to-data': {
    name: 'Scanned PDF to Structured Data — Free OCR Extractor',
    description: 'Extract structured data from scanned PDFs using OCR. Tables, key-value pairs, text. Export JSON, CSV, Excel.',
    metaTitle: 'Scanned PDF to Structured Data Free — OCR Table & Key-Value Extractor',
    metaDescription: 'Extract structured data from scanned PDFs and images using Tesseract.js OCR. Auto-detects tables, key-value pairs, and lists. Export as JSON, CSV, or TXT. No upload, no signup, 100% private.',
    keywords: 'scanned pdf to excel free, extract table from scanned pdf online free, pdf ocr table extractor free, scanned document to structured data, convert scanned pdf to csv free no upload',
    whatIs: 'Our Scanned PDF to Structured Data tool extracts text from scanned PDFs using Tesseract.js OCR running in your browser, then automatically identifies structured content — key-value pairs (Name: John, Date: 2026-01-01), table rows, and list items. Export all structured data as JSON (great for developers), CSV, or plain text. Handles both text-based and image-based (scanned) PDFs.',
    whyChoose: [
      { icon: '📊', title: 'Auto-Structure Detection', description: 'Automatically identifies key-value pairs, table data, and list items from raw OCR text.' },
      { icon: '🔍', title: 'Text + Scanned PDFs', description: 'Works on both text-based PDFs (no OCR needed) and scanned/image-based PDFs (Tesseract OCR).' },
      { icon: '📤', title: '3 Export Formats', description: 'Export as JSON (developer-friendly), CSV (spreadsheet-ready), or TXT (plain text).' },
      { icon: '🔒', title: 'Browser-Based OCR', description: 'Tesseract.js runs locally. Your documents never leave your device.' }
    ],
    useCases: ['Extract form data from scanned application forms', 'Convert scanned invoices to structured JSON', 'Extract table data from scanned reports', 'Parse scanned receipts into CSV format'],
    faqs: [
      { question: 'Does it work on password-protected PDFs?', answer: 'No. Password-protected PDFs need to be unlocked first using our Password Protect PDF tool.' },
      { question: 'How many pages can it process?', answer: 'Up to 10 pages. For larger documents, the first 10 pages are processed.' }
    ],
    relatedSearches: ['scanned pdf to excel free', 'ocr pdf table extractor', 'extract data from scanned pdf', 'pdf ocr structured data', 'scanned document to json free']
  },
  'screenshot-to-document': {
    name: 'Screenshot to Editable Document — Free OCR Converter',
    description: 'Convert screenshots and images to editable Word, HTML or TXT documents using OCR. Free, no upload.',
    metaTitle: 'Screenshot to Editable Document Free — OCR Image to Word/TXT Online',
    metaDescription: 'Convert screenshots, photos and scanned images to editable documents online for free. Tesseract.js OCR. Download as TXT, DOC or HTML. No file upload, no signup, 100% private browser-based.',
    keywords: 'screenshot to word document free, image to editable document free, ocr screenshot to text free, convert screenshot to docx free, photo to text document online free no upload',
    whatIs: 'Our Screenshot to Editable Document converter uses Tesseract.js OCR to extract all text from any image — screenshots, photos, or scanned documents — and lets you edit the extracted text before downloading as a TXT, DOC (Word-compatible), or HTML file. Perfect for making scanned documents editable, extracting text from screenshots, or converting photos of printed text to editable files.',
    whyChoose: [
      { icon: '📄', title: 'Edit Before Downloading', description: 'Full text editor lets you correct OCR errors before saving the document.' },
      { icon: '📁', title: 'TXT, DOC, HTML Output', description: 'Download as plain text, Word-compatible DOC, or printable HTML.' },
      { icon: '🔒', title: 'No Upload', description: 'Tesseract.js runs locally in your browser. Images never leave your device.' },
      { icon: '📋', title: 'Paste from Clipboard', description: 'Paste screenshots directly from clipboard without saving to disk first.' }
    ],
    useCases: ['Make a scanned PDF page editable by extracting text', 'Convert a screenshot of an article to editable text', 'Extract text from a photo of a whiteboard', 'Convert a printed document photo to Word'],
    faqs: [
      { question: 'How accurate is the OCR?', answer: 'Accuracy depends on image quality. Clear, high-contrast screenshots are typically 95%+ accurate. Blurry photos may have errors that you can correct in the editor.' },
      { question: 'Can I paste a screenshot directly?', answer: 'Yes. Click the Paste button and your clipboard screenshot is loaded automatically.' }
    ],
    relatedSearches: ['screenshot to word free', 'image to editable text free', 'ocr screenshot free', 'convert photo to document', 'screenshot to text converter free']
  },
  'pdf-to-mcq': {
    name: 'PDF to MCQ Generator — Free Multiple Choice Question Maker',
    description: 'Generate multiple choice questions from any PDF, text or lecture notes. 5 difficulty levels. Quiz mode with scoring.',
    metaTitle: 'PDF to MCQ Generator Free — Create Multiple Choice Quiz from PDF Online',
    metaDescription: 'Generate multiple choice questions from any PDF or text online for free. 4 question types (MCQ, True/False, Fill-in-blank, Mixed). 5 difficulty levels. Interactive quiz mode with scoring. No signup.',
    keywords: 'pdf to mcq generator free, multiple choice question generator from pdf, mcq maker from document free, quiz generator from pdf no signup, ai mcq generator from text, pdf to quiz maker free online',
    whatIs: 'Our PDF to MCQ Generator extracts key sentences from your PDF or pasted text using NLP (keyword frequency analysis, sentence scoring) and generates multiple choice questions entirely in your browser. No API calls, no server processing. Choose from 4 question types (MCQ with 4 options, True/False, Fill-in-the-blank, Mixed), 5 difficulty levels, and quantity from 5 to 30 questions. Take the quiz interactively with instant scoring, or download as TXT.',
    whyChoose: [
      { icon: '❓', title: '4 Question Types', description: 'MCQ with 4 options, True/False, Fill-in-the-blank, and Mixed mode.' },
      { icon: '🎯', title: 'Interactive Quiz Mode', description: 'Take the generated quiz interactively with instant scoring and correct answer reveal.' },
      { icon: '🆓', title: 'Free Unlimited', description: 'No daily limit, no signup, no word count cap. Generate as many MCQs as you need.' },
      { icon: '🔒', title: 'No Upload', description: 'NLP runs in your browser. Your study material never leaves your device.' }
    ],
    useCases: [
      'Teachers creating MCQ tests from textbook chapters',
      'Students self-testing on lecture notes before exams',
      'Corporate trainers generating assessment quizzes from manuals',
      'Coaches creating study cards from course material',
      'Researchers testing knowledge retention on papers'
    ],
    faqs: [
      { question: 'How does the MCQ generation work?', answer: 'The tool uses TF-IDF style keyword extraction and sentence scoring to identify the most important sentences, then creates fill-in-the-blank style questions using key terms as answers and other key terms as distractors.' },
      { question: 'What is the maximum text length?', answer: 'Up to 15,000 characters (~2,500 words) per session. For longer PDFs, the first 15,000 characters are used.' },
      { question: 'Can I use it offline?', answer: 'Yes. Once the page has loaded, the MCQ generation works without internet connection.' }
    ],
    relatedSearches: ['pdf to mcq free', 'mcq generator from text', 'quiz maker from pdf free', 'multiple choice question generator', 'pdf to quiz no signup', 'auto mcq generator free']
  },
  'lecture-to-notes': {
    name: 'Lecture PDF to Study Notes — Free AI Notes Generator',
    description: 'Convert lecture PDFs to organized study notes — bullet points, Cornell notes, outline or summary. Free, no signup.',
    metaTitle: 'Lecture PDF to Study Notes Free — Bullet, Cornell, Outline, Summary Online',
    metaDescription: 'Convert lecture PDFs and slides to organized study notes for free. Choose from Bullet Points, Cornell Notes, Outline, or Summary format. Key terms extracted automatically. Export TXT or HTML. No signup.',
    keywords: 'lecture pdf to notes free, pdf to study notes converter free, convert lecture slides to notes, ai notes from pdf free no signup, summarize lecture pdf free, lecture notes generator from pdf',
    whatIs: 'Our Lecture PDF to Study Notes converter uses extractive NLP (TF-IDF keyword extraction and sentence scoring) to convert lecture PDFs into structured study notes in 4 formats: Bullet Points (most important sentences as bullets), Cornell Notes (two-column format with cues and notes), Hierarchical Outline (organized by key topics), and Summary (prose paragraph). Key terms are highlighted separately. All processing runs in your browser.',
    whyChoose: [
      { icon: '📝', title: '4 Note Formats', description: 'Bullet points, Cornell notes (with cue column), topic outline, and prose summary.' },
      { icon: '🔑', title: 'Key Terms Extracted', description: 'Most important terms are highlighted separately for quick vocabulary review.' },
      { icon: '🖨️', title: 'Print-Ready HTML Export', description: 'Download as formatted HTML for printing or saving as PDF via browser.' },
      { icon: '🆓', title: 'Free Unlimited', description: 'No word count limit on processing, no daily caps, no signup required.' }
    ],
    useCases: [
      'Convert lecture slide PDFs to revision notes before exams',
      'Summarize textbook chapters for quick review',
      'Create Cornell notes from research papers',
      'Generate topic outlines from lecture recordings transcripts',
      'Condense meeting notes into key bullet points'
    ],
    faqs: [
      { question: 'Which note format should I choose?', answer: 'Bullet Points for quick revision. Cornell Notes for deep learning with self-testing. Outline for structured subjects like law or medicine. Summary for essay preparation.' },
      { question: 'What is the maximum text length?', answer: 'Up to 20,000 characters (~3,500 words). For longer PDFs, the first 30 pages are processed.' }
    ],
    relatedSearches: ['lecture to notes free', 'pdf to study notes', 'convert pdf to notes', 'summarize lecture notes free', 'cornell notes generator', 'pdf notes maker free']
  },
  'document-to-excel': {
    name: 'Document to Excel Extractor — Extract Tables Free',
    description: 'Extract all tables from PDF, Word, or image documents to Excel/CSV. Auto-detects tables. Free, no upload.',
    metaTitle: 'Document to Excel Extractor Free — Extract Tables from PDF, Word, Images',
    metaDescription: 'Extract all tables from PDF, Word (DOCX), TXT, CSV, JPG or PNG documents to Excel or CSV online for free. Auto-detects table structure. Select which tables to export. No file upload, no signup.',
    keywords: 'extract table from pdf to excel free, document to excel extractor free, pdf table to csv online free, extract tables from word to excel, table extractor from image free no upload',
    whatIs: 'Our Document to Excel Extractor automatically finds all table-like data in your PDF, Word, text, or image files and exports them as Excel (XLSX) or CSV. It detects tables by looking for multi-column rows separated by consistent whitespace or pipe characters. Each table gets its own Excel sheet. Select which tables to include before downloading. Supports PDF (pdfjs), DOCX (mammoth.js), and image files (Tesseract.js OCR).',
    whyChoose: [
      { icon: '📋', title: 'All Document Types', description: 'PDF, Word (DOCX), TXT, CSV, JPG, PNG — one tool handles all document formats.' },
      { icon: '🔍', title: 'Auto Table Detection', description: 'Finds all tables automatically — no need to specify page numbers or table positions.' },
      { icon: '✅', title: 'Select Which Tables', description: 'Preview all detected tables and choose which ones to include in the Excel export.' },
      { icon: '🔒', title: 'No Upload', description: 'All processing runs in your browser. Documents never leave your device.' }
    ],
    useCases: [
      'Extract financial tables from annual report PDFs',
      'Pull all data tables from a Word research document',
      'Convert a multi-table PDF to a multi-sheet Excel workbook',
      'Extract price tables from product catalog PDFs',
      'Get structured data from scanned document images'
    ],
    faqs: [
      { question: 'How many tables can it extract?', answer: 'There is no limit on the number of tables. Each table gets its own sheet in the Excel export.' },
      { question: 'What counts as a table?', answer: 'Rows with 2 or more columns separated by multiple spaces or | pipe characters are detected as table rows.' }
    ],
    relatedSearches: ['extract tables from pdf free', 'pdf to excel table extractor', 'document to spreadsheet free', 'word table to excel free', 'extract all tables from pdf free no upload']
  }
};

Object.assign(obj.tools, newTools);
fs.writeFileSync('locales/content/en.json', JSON.stringify(obj, null, 2), 'utf8');
const verify = JSON.parse(fs.readFileSync('locales/content/en.json','utf8'));
Object.keys(newTools).forEach(k => console.log((verify.tools[k]?'OK':'MISSING')+' '+k));
console.log('Total tools:', Object.keys(verify.tools).length);
