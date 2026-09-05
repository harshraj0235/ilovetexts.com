const fs = require('fs');

const LANGS = ['en','hi','es','pt','de','id'];

const EN_TOOLS = {
  'rupees-to-words': {
    name: 'Rupees to Words Converter — Amount in Words for Cheque',
    description: 'Convert numbers to Indian Rupees in words instantly. Supports Lakh/Crore system with Paise. Perfect for cheques, invoices and legal documents.',
    metaTitle: 'Rupees to Words Converter Free — Amount in Words for Cheque India',
    metaDescription: 'Convert any number to Indian Rupees in words free online. Lakh/Crore system with Paise. Cheque format, invoice format, legal document format. No signup required.',
    keywords: 'rupees to words converter free, amount in words for cheque India, number to words Indian rupees lakh crore, rupees in words for cheque free online, cheque amount words generator India',
    whatIs: 'Our Rupees to Words Converter instantly converts any numeric amount into its written word form in the Indian numbering system (Lakh, Crore) or the International system (Million, Billion). It supports Paise and produces the standard "Rupees Only" cheque format required by all Indian banks. This tool is essential for writing cheques, creating GST invoices, drafting legal agreements, and preparing financial documents where amounts must be stated in words.',
    whyChoose: [
      { icon: '🏦', title: 'Bank Cheque Format', description: 'Outputs in exact RBI-compliant cheque format: "Fifty Thousand Rupees Only".' },
      { icon: '💰', title: 'Lakh/Crore + Paise', description: 'Full Indian numbering system support including Paise for decimal amounts.' },
      { icon: '🌍', title: 'International System', description: 'Switch to Million/Billion system for international invoices and documents.' },
      { icon: '🔒', title: '100% Private', description: 'All conversion happens in your browser. No data sent to any server.' }
    ],
    useCases: [
      'Writing cheque amounts in words for bank transactions',
      'GST invoice amount in words (mandatory per GST rules)',
      'Legal agreements and affidavits requiring amount in words',
      'Salary slips showing net salary in words',
      'Property sale deeds and lease agreements'
    ],
    faqs: [
      { question: 'How to write 50000 in words for a cheque?', answer: 'Enter 50000 in our converter and it outputs: "Fifty Thousand Rupees Only" — the standard Indian cheque format.' },
      { question: 'How to write 1 lakh in words?', answer: '1,00,000 in words is "One Lakh Rupees Only" in the Indian system.' },
      { question: 'How to write 2.5 crore in words?', answer: '2,50,00,000 in words is "Two Crore Fifty Lakh Rupees Only".' },
      { question: 'How to write amount with paise in words?', answer: 'Enter 1500.75 and the tool outputs "One Thousand Five Hundred Rupees and Seventy Five Paise Only".' }
    ],
    relatedSearches: ['amount in words for cheque','rupees in words','number to words Indian','cheque writing tool free','lakh crore converter']
  },
  'age-calculator': {
    name: 'Age Calculator — Exact Age for Govt Exam Eligibility',
    description: 'Calculate exact age from date of birth in years, months and days. Check eligibility for SSC, UPSC, Railway, Bank exams. As-on-date calculator.',
    metaTitle: 'Age Calculator Free — Exact Age for SSC UPSC Railway Bank Exam Eligibility',
    metaDescription: 'Free age calculator that shows exact age in years, months and days from date of birth. Check government exam eligibility for SSC CGL, UPSC CSE, IBPS PO, RRB NTPC and more. Calculate as on any cut-off date.',
    keywords: 'age calculator for government exam, exact age calculator years months days, age calculator SSC UPSC railway bank 2026, DOB age calculator India free, exam eligibility age calculator cut-off date',
    whatIs: 'Our Age Calculator computes your exact age in years, months and days from your date of birth as on any specified date — not just today. This is critical for Indian government exam applications where eligibility is checked as on a specific cut-off date mentioned in the official notification. The calculator shows eligibility status for 14+ major government exams including SSC CGL, UPSC CSE, IBPS PO, SBI Clerk, RRB NTPC, and more. It also shows total days, weeks, months, hours, days until next birthday, and zodiac sign.',
    whyChoose: [
      { icon: '🏛️', title: '14+ Exam Eligibility', description: 'Instant eligibility check for SSC, UPSC, Railway, Bank, Defence and Insurance exams.' },
      { icon: '📅', title: 'As-On-Date Calculation', description: 'Calculate age as on any specific date — essential for exam cut-off date eligibility.' },
      { icon: '📊', title: 'Complete Stats', description: 'Age in years, months, days, total days, weeks, hours and days to next birthday.' },
      { icon: '🔒', title: '100% Private', description: 'No data sent to any server. All calculations in your browser.' }
    ],
    useCases: [
      'Checking age eligibility for SSC CGL, CHSL, MTS exam applications',
      'Verifying UPSC Civil Services age limit compliance',
      'IBPS PO, Clerk, RRB PO bank exam eligibility',
      'Railway RRB NTPC, Group D age verification',
      'School and college admission age requirements',
      'Passport and visa age-related requirements'
    ],
    faqs: [
      { question: 'How to calculate age for SSC CGL exam?', answer: 'Enter your DOB and set the "As On Date" to the SSC CGL cut-off date (usually August 1st of the notification year). The calculator shows if your age is within 18-32 years.' },
      { question: 'What is the age limit for UPSC CSE?', answer: 'UPSC CSE age limit is 21-32 years for General category, 21-35 for OBC, 21-37 for SC/ST. Enter your DOB and set as-on date to August 1st of the exam year.' },
      { question: 'How is exact age calculated?', answer: 'The calculator subtracts DOB from the reference date, counting full years then months then remaining days, accounting for leap years and varying month lengths.' }
    ],
    relatedSearches: ['age calculator SSC CGL 2026','UPSC age calculator','DOB age calculator','exam eligibility checker','government job age limit']
  },
  'salary-slip-generator': {
    name: 'Salary Slip Generator Free — Payslip Maker India',
    description: 'Generate professional salary slips with PF, ESI, HRA, DA, PT auto-calculation. Download PDF. No signup, no watermark, 100% free.',
    metaTitle: 'Salary Slip Generator Free India — Payslip Maker with PF ESI HRA Auto-Calculation',
    metaDescription: 'Free online salary slip generator for India. Auto-calculates PF (12%), ESI (0.75%), HRA (40% basic), Professional Tax by state. Download print-ready PDF. No signup, no watermark.',
    keywords: 'salary slip generator free India online, payslip maker free no signup no watermark, salary slip format India PDF, salary slip with PF ESI HRA auto calculation, free payslip generator 2026 India',
    whatIs: 'Our Salary Slip Generator creates professional, print-ready salary slips following standard Indian payroll formats. Enter employee details, company information, and salary components — the tool automatically calculates Employee PF (12% of basic, max ₹1800), Employee ESI (0.75% if gross ≤₹21,000), HRA (40% of basic for non-metro / 50% for metro), and Professional Tax by state. Loss of Pay (LOP) is calculated automatically based on working days. Download a clean PDF with no watermarks.',
    whyChoose: [
      { icon: '🧮', title: 'Auto PF/ESI/HRA Calculation', description: 'PF, ESI, HRA and Professional Tax calculated automatically per Indian labour law.' },
      { icon: '🖨️', title: 'Print-Ready PDF', description: 'Professional salary slip that prints cleanly on A4 paper. No watermarks.' },
      { icon: '📋', title: 'Complete Payslip', description: 'All components: Basic, HRA, DA, TA, Special, PF, ESI, PT, TDS, Advance, LOP.' },
      { icon: '🔒', title: '100% Private', description: 'Salary data never leaves your browser. No server processing.' }
    ],
    useCases: [
      'HR managers creating monthly salary slips for employees',
      'Small business owners generating payslips without payroll software',
      'Employees needing salary slips for visa, loan or rental applications',
      'Freelancers creating invoice-style income proofs',
      'Startups generating compliant payslips for team members'
    ],
    faqs: [
      { question: 'How is PF calculated in salary slip?', answer: 'Employee PF = 12% of Basic Salary, capped at ₹1800 per month (when basic ≤ ₹15,000). Our tool calculates this automatically.' },
      { question: 'How is ESI calculated?', answer: 'Employee ESI = 0.75% of Gross Salary, applicable only when gross salary ≤ ₹21,000 per month.' },
      { question: 'What is Professional Tax?', answer: 'Professional Tax varies by state. Maharashtra: ₹200/month, Karnataka: ₹200/month. Our tool has built-in rates for all states.' },
      { question: 'Is the salary slip legally valid?', answer: 'This tool generates a salary slip in the standard format. For legal validity as official proof, it should be on company letterhead with authorized signature and seal.' }
    ],
    relatedSearches: ['salary slip format India free','payslip maker online free','salary slip PDF download','PF ESI salary calculation','payslip generator India 2026']
  },
  'rti-application-generator': {
    name: 'RTI Application Generator Free — Right to Information India',
    description: 'Generate a properly formatted RTI application under Section 6(1) of RTI Act 2005. Guided form, instant PDF. Free, no signup.',
    metaTitle: 'RTI Application Generator Free Online India — Section 6(1) RTI Act 2005',
    metaDescription: 'Free RTI application generator for India. Create a properly formatted Right to Information application under Section 6(1) of RTI Act 2005. Step-by-step guided form. Download as PDF. No signup required.',
    keywords: 'RTI application generator free online India, RTI format generator Section 6 RTI Act 2005, right to information application draft India, RTI application sample format 2026, how to write RTI application India free generator',
    whatIs: 'Our RTI Application Generator guides Indian citizens through creating a legally compliant Right to Information application under Section 6(1) of the RTI Act, 2005. The step-by-step wizard helps you select the correct public authority (40+ Central Ministries + State Governments), draft precise questions, include mandatory declarations, and specify the RTI fee (₹10 for general citizens, free for BPL). The generated application follows the exact format accepted by rtionline.gov.in and all state RTI portals.',
    whyChoose: [
      { icon: '🏛️', title: 'Legally Compliant Format', description: 'Generated application follows the exact Section 6(1) format accepted by all government RTI portals.' },
      { icon: '📝', title: 'Question Templates', description: '8 pre-written question templates covering common RTI scenarios — status of application, document copies, action taken.' },
      { icon: '🌍', title: '40+ Authorities', description: 'All Central Ministries, Departments and major State Governments pre-listed.' },
      { icon: '🔒', title: 'Completely Private', description: 'Your RTI content never leaves your browser. Sensitive information stays with you.' }
    ],
    useCases: [
      'Checking status of pending government applications or complaints',
      'Requesting copies of government orders, tenders or policy documents',
      'Tracking action on roads, water, electricity or civic complaints',
      'Verifying government scheme beneficiary lists',
      'Obtaining records related to property, land records or registrations'
    ],
    faqs: [
      { question: 'What is the fee for filing an RTI?', answer: 'The application fee is ₹10 for Central Government departments. For state governments, fees vary (usually ₹10-₹50). BPL card holders are exempt from fees.' },
      { question: 'How many days does the government have to reply?', answer: 'The Public Information Officer (PIO) must reply within 30 days of receiving the RTI application. For life/liberty matters, the deadline is 48 hours.' },
      { question: 'What if I don\'t receive a reply?', answer: 'If no reply is received within 30 days, you can file a First Appeal with the First Appellate Authority (FAA) within 30 days of the deadline.' },
      { question: 'Can I file RTI online?', answer: 'Yes. Central Government RTIs can be filed at rtionline.gov.in. Many state governments also have online portals. You can also send this application by post.' }
    ],
    relatedSearches: ['RTI application format India','how to file RTI online','RTI application example','right to information India','RTI Section 6 format free']
  },
  'gst-invoice-generator': {
    name: 'GST Invoice Generator Free — Tax Invoice Maker India',
    description: 'Create GST-compliant tax invoices with CGST/SGST/IGST auto-split. HSN codes, amount in words. PDF download. Free, no signup, no watermark.',
    metaTitle: 'GST Invoice Generator Free Online India — CGST SGST IGST Tax Invoice Maker',
    metaDescription: 'Free GST invoice generator for India. Auto-calculates CGST/SGST for intra-state and IGST for inter-state supplies. HSN/SAC codes, amount in words, bank details. Download professional PDF invoice. No signup, no watermark.',
    keywords: 'GST invoice generator free India online, free GST bill maker no signup no watermark, tax invoice CGST SGST IGST generator, GST invoice PDF download free India, GST bill format small business India 2026',
    whatIs: 'Our GST Invoice Generator creates fully GST-compliant tax invoices for Indian businesses. It automatically determines whether to apply CGST+SGST (for intra-state supplies, when seller and buyer are in the same state) or IGST (for inter-state supplies) based on the states you select. It supports all 5 GST rates (0%, 5%, 12%, 18%, 28%), HSN/SAC codes, multiple line items with discount, and mandatory fields like GSTIN, place of supply, and amount in words. Download a professional PDF invoice with no watermarks.',
    whyChoose: [
      { icon: '🧾', title: 'CGST/SGST/IGST Auto-Split', description: 'Automatically applies CGST+SGST for intra-state and IGST for inter-state supplies.' },
      { icon: '📊', title: 'All GST Rates', description: 'Supports 0%, 5%, 12%, 18%, 28% rates. Mix multiple rates in one invoice.' },
      { icon: '📄', title: 'Amount in Words', description: 'Auto-generates amount in words as required by GST invoice rules.' },
      { icon: '🖨️', title: 'Professional PDF', description: 'Clean, professional invoice PDF with no watermarks — ready to send to customers.' }
    ],
    useCases: [
      'Small businesses creating GST invoices without accounting software',
      'Freelancers invoicing clients for services with GST',
      'Traders issuing tax invoices for goods sold',
      'Service providers generating GST bills for professional fees',
      'E-commerce sellers creating compliant invoices for orders'
    ],
    faqs: [
      { question: 'When to use CGST/SGST vs IGST?', answer: 'Use CGST+SGST when seller and buyer are in the same state (intra-state supply). Use IGST when seller and buyer are in different states (inter-state supply). Our tool detects this automatically.' },
      { question: 'Is a GSTIN mandatory to issue a GST invoice?', answer: 'Yes, the seller must have a GSTIN to issue a tax invoice. Buyers with GSTIN should include it for Input Tax Credit (ITC). Businesses below the GST threshold can issue bills of supply instead.' },
      { question: 'What is HSN/SAC code?', answer: 'HSN (Harmonized System of Nomenclature) codes apply to goods and SAC (Services Accounting Code) codes apply to services. Businesses with turnover above ₹5 crore must include 6-digit HSN codes on invoices.' },
      { question: 'Can I save this invoice and edit later?', answer: 'Currently the tool generates single invoices. Fill in the form, download the PDF, and keep it as your record. All data stays in your browser session.' }
    ],
    relatedSearches: ['GST invoice format free','tax invoice maker India','CGST SGST invoice generator','GST bill maker online','GST invoice PDF free download']
  }
};

// Hindi translations
const HI_TOOLS = {
  'rupees-to-words': {
    name: 'रुपये शब्दों में कनवर्टर — चेक के लिए राशि शब्दों में',
    description: 'किसी भी संख्या को भारतीय रुपयों में शब्दों में बदलें। लाख/करोड़ प्रणाली, पैसे सहित। चेक, इनवॉइस और कानूनी दस्तावेजों के लिए।',
    keywords: 'रुपये शब्दों में कनवर्टर, चेक के लिए राशि शब्दों में, अंको को शब्दों में बदलें, रुपये शब्दों में लाख करोड़, चेक लेखन उपकरण मुफ्त'
  },
  'age-calculator': {
    name: 'आयु कैलकुलेटर — सरकारी परीक्षा पात्रता',
    description: 'जन्म तिथि से सटीक आयु वर्ष, महीने और दिनों में। SSC, UPSC, रेलवे, बैंक परीक्षा पात्रता जांच।',
    keywords: 'आयु कैलकुलेटर सरकारी परीक्षा, SSC UPSC रेलवे बैंक उम्र कैलकुलेटर, जन्म तिथि आयु कैलकुलेटर भारत, परीक्षा पात्रता आयु जांच'
  },
  'salary-slip-generator': {
    name: 'सैलरी स्लिप जनरेटर — मुफ्त पेस्लिप मेकर',
    description: 'PF, ESI, HRA, DA, PT ऑटो-कैलकुलेशन के साथ पेशेवर वेतन पर्ची। PDF डाउनलोड। कोई साइनअप नहीं, कोई वॉटरमार्क नहीं।',
    keywords: 'सैलरी स्लिप जनरेटर मुफ्त भारत, पेस्लिप मेकर ऑनलाइन, वेतन पर्ची प्रारूप भारत PDF, PF ESI HRA के साथ सैलरी स्लिप'
  },
  'rti-application-generator': {
    name: 'आरटीआई आवेदन जनरेटर — सूचना का अधिकार भारत',
    description: 'RTI अधिनियम 2005 की धारा 6(1) के तहत सही प्रारूप में RTI आवेदन बनाएं। मुफ्त, तुरंत PDF।',
    keywords: 'RTI आवेदन जनरेटर मुफ्त, सूचना का अधिकार आवेदन प्रारूप, RTI धारा 6 आवेदन भारत, RTI आवेदन कैसे लिखें'
  },
  'gst-invoice-generator': {
    name: 'जीएसटी इनवॉइस जनरेटर — टैक्स इनवॉइस मेकर',
    description: 'CGST/SGST/IGST ऑटो-स्प्लिट के साथ GST-अनुपालन टैक्स इनवॉइस बनाएं। PDF डाउनलोड। मुफ्त, कोई साइनअप नहीं।',
    keywords: 'GST इनवॉइस जनरेटर मुफ्त भारत, CGST SGST IGST टैक्स इनवॉइस, GST बिल मेकर ऑनलाइन, जीएसटी इनवॉइस PDF डाउनलोड'
  }
};

// Spanish
const ES_TOOLS = {
  'rupees-to-words': { name: 'Conversor de Rupias a Palabras', description: 'Convierte números a rupias indias en palabras. Sistema Lakh/Crore con Paise. Para cheques, facturas y documentos legales.', keywords: 'convertir rupias a palabras, cantidad en palabras cheque India, número a palabras rupias indias' },
  'age-calculator': { name: 'Calculadora de Edad — Elegibilidad Examen Gobierno', description: 'Calcula la edad exacta en años, meses y días desde la fecha de nacimiento. Verificación de elegibilidad para exámenes gubernamentales.', keywords: 'calculadora de edad exacta, calculadora edad fecha de nacimiento, elegibilidad examen gobierno India' },
  'salary-slip-generator': { name: 'Generador de Nómina Gratis — Recibo de Salario India', description: 'Genera recibos de salario profesionales con cálculo automático de PF, ESI, HRA. Descarga PDF. Sin registro.', keywords: 'generador nómina gratis India, recibo salario PDF, calculadora sueldo India' },
  'rti-application-generator': { name: 'Generador de Solicitud RTI — Derecho a la Información India', description: 'Genera una solicitud RTI formateada bajo la Sección 6(1) de la Ley RTI 2005. Gratis, PDF instantáneo.', keywords: 'generador solicitud RTI India, derecho información aplicación, RTI sección 6 formato' },
  'gst-invoice-generator': { name: 'Generador de Factura GST Gratis — India', description: 'Crea facturas fiscales GST con división automática CGST/SGST/IGST. Descarga PDF. Gratis.', keywords: 'generador factura GST gratis India, factura tax CGST SGST, GST invoice maker India' }
};

// Portuguese
const PT_TOOLS = {
  'rupees-to-words': { name: 'Conversor de Rúpias para Palavras', description: 'Converta números para rúpias indianas em palavras. Sistema Lakh/Crore com Paise. Para cheques e documentos legais.', keywords: 'converter rúpias para palavras, valor por extenso cheque Índia, número para palavras rúpias' },
  'age-calculator': { name: 'Calculadora de Idade — Elegibilidade Exame Governo', description: 'Calcule a idade exata em anos, meses e dias. Verificação de elegibilidade para exames governamentais indianos.', keywords: 'calculadora de idade exata, calculadora idade data nascimento, elegibilidade exame governo Índia' },
  'salary-slip-generator': { name: 'Gerador de Holerite Grátis — Índia', description: 'Gere holerites profissionais com cálculo automático de PF, ESI, HRA. Download PDF. Sem cadastro.', keywords: 'gerador holerite grátis Índia, contracheque PDF, calculadora salário Índia' },
  'rti-application-generator': { name: 'Gerador de Pedido RTI — Direito à Informação Índia', description: 'Gera pedido RTI formatado sob a Seção 6(1) da Lei RTI 2005. Grátis, PDF instantâneo.', keywords: 'gerador pedido RTI Índia, direito informação pedido, RTI seção 6 formato' },
  'gst-invoice-generator': { name: 'Gerador de Fatura GST Grátis — Índia', description: 'Crie faturas fiscais GST com divisão automática CGST/SGST/IGST. Download PDF. Grátis.', keywords: 'gerador fatura GST grátis Índia, fatura fiscal CGST SGST, GST invoice Índia' }
};

// German
const DE_TOOLS = {
  'rupees-to-words': { name: 'Rupien in Worte Umrechner — Betrag in Worten', description: 'Wandle Zahlen in indische Rupien in Worten um. Lakh/Crore-System mit Paise. Für Schecks und Rechtsdokumente.', keywords: 'Rupien in Worte umrechnen, Betrag in Worten Scheck Indien, Zahlen zu Worten indische Rupien' },
  'age-calculator': { name: 'Altersrechner — Regierungsprüfung Berechtigung', description: 'Berechne das genaue Alter in Jahren, Monaten und Tagen. Berechtigungsprüfung für indische Regierungsprüfungen.', keywords: 'Altersrechner exakt, Geburtsdatum Altersrechner, Regierungsprüfung Berechtigung Indien' },
  'salary-slip-generator': { name: 'Gehaltszettel Generator Kostenlos — Indien', description: 'Erstelle professionelle Gehaltszettel mit PF, ESI, HRA Automatikberechnung. PDF-Download. Keine Anmeldung.', keywords: 'Gehaltszettel Generator kostenlos Indien, Lohnzettel PDF, Gehaltsberechnung Indien' },
  'rti-application-generator': { name: 'RTI-Antrag Generator — Informationsfreiheit Indien', description: 'Erstelle RTI-Antrag nach Abschnitt 6(1) des RTI-Gesetzes 2005. Kostenlos, sofortiges PDF.', keywords: 'RTI Antrag Generator Indien, Informationsfreiheit Antrag, RTI Abschnitt 6 Format' },
  'gst-invoice-generator': { name: 'GST-Rechnung Generator Kostenlos — Indien', description: 'Erstelle GST-konforme Steuerrechnungen mit automatischer CGST/SGST/IGST-Aufteilung. PDF-Download. Kostenlos.', keywords: 'GST Rechnung Generator kostenlos Indien, CGST SGST Steuerrechnung, GST Invoice Indien' }
};

// Indonesian
const ID_TOOLS = {
  'rupees-to-words': { name: 'Konverter Rupee ke Kata — Jumlah dalam Kata', description: 'Konversi angka ke rupee India dalam kata. Sistem Lakh/Crore dengan Paise. Untuk cek dan dokumen hukum.', keywords: 'konverter rupee ke kata, jumlah dalam kata cek India, angka ke kata rupee India' },
  'age-calculator': { name: 'Kalkulator Usia — Kelayakan Ujian Pemerintah', description: 'Hitung usia tepat dalam tahun, bulan dan hari. Pemeriksaan kelayakan ujian pemerintah India.', keywords: 'kalkulator usia tepat, kalkulator usia tanggal lahir, kelayakan ujian pemerintah India' },
  'salary-slip-generator': { name: 'Generator Slip Gaji Gratis — India', description: 'Buat slip gaji profesional dengan perhitungan PF, ESI, HRA otomatis. Unduh PDF. Tanpa pendaftaran.', keywords: 'generator slip gaji gratis India, pembuat payslip online, slip gaji PDF India' },
  'rti-application-generator': { name: 'Generator Aplikasi RTI — Hak Informasi India', description: 'Buat aplikasi RTI berformat sesuai Pasal 6(1) UU RTI 2005. Gratis, PDF instan.', keywords: 'generator aplikasi RTI India, hak informasi aplikasi, RTI pasal 6 format' },
  'gst-invoice-generator': { name: 'Generator Faktur GST Gratis — India', description: 'Buat faktur pajak GST dengan pembagian CGST/SGST/IGST otomatis. Unduh PDF. Gratis.', keywords: 'generator faktur GST gratis India, faktur pajak CGST SGST, pembuat faktur GST India' }
};

const LANG_TOOLS = { en: EN_TOOLS, hi: HI_TOOLS, es: ES_TOOLS, pt: PT_TOOLS, de: DE_TOOLS, id: ID_TOOLS };

LANGS.forEach(lang => {
  const path = `locales/content/${lang}.json`;
  const obj = JSON.parse(fs.readFileSync(path, 'utf8'));
  const toolsData = LANG_TOOLS[lang];

  Object.entries(toolsData).forEach(([slug, data]) => {
    if (lang === 'en') {
      obj.tools[slug] = data;
    } else {
      // For non-English: merge with English base, override name/description/keywords
      const enBase = EN_TOOLS[slug];
      obj.tools[slug] = {
        ...enBase,
        name: data.name,
        description: data.description,
        keywords: data.keywords,
        // Keep English whatIs/faqs/useCases/whyChoose as fallback
      };
    }
  });

  fs.writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
  const count = Object.keys(LANG_TOOLS[lang]).filter(s => obj.tools[s]).length;
  console.log(`${lang}: ${count}/5 gov tools added`);
});

console.log('Done!');
