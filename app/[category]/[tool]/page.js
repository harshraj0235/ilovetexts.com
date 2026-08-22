import { getAllTools, getTool, getRelatedTools, getCrossLinks, CATEGORIES } from '@/lib/tools-config';
import { generateToolMeta, generateFAQSchema, generateToolSchema, generateBreadcrumbSchema, generateHowToSchema, generateSoftwareAppSchema } from '@/lib/seo';
import { getToolSEO } from '@/lib/tools-seo-data';
import ToolLayout from '@/components/ToolLayout';
import ClientTool from '@/components/ClientTool';
import { notFound } from 'next/navigation';
import Script from 'next/script';

export async function generateStaticParams() {
  const allTools = getAllTools();
  return allTools.map((tool) => ({
    category: tool.categoryId,
    tool: tool.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { category, tool } = await params;
  const toolData = getTool(category, tool);
  if (!toolData) return {};
  return generateToolMeta(toolData, toolData.category);
}

// ─── Generate rich, UNIQUE SEO content using seo-data ───
function generateWhatIs(tool, category) {
  const seoData = getToolSEO(tool.slug);
  if (seoData?.whatIs) return seoData.whatIs;
  
  return `The ${tool.name} is a free online ${category.name.toLowerCase()} tool that allows you to ${tool.description.toLowerCase()} instantly. Simply paste your text into the input field and get results in real-time — no waiting, no uploads, no sign-ups required. This tool processes everything directly in your browser using client-side JavaScript, which means your text data is never sent to any external server. Whether you are working on a personal project, a professional task, or just exploring, the ${tool.name} on ilovetexts.com is designed to save you time while keeping your data 100% private and secure.`;
}

function generateWhyChoose(tool) {
  return [
    { icon: '⚡', title: 'Instant Real-Time Processing', description: `Get ${tool.name.toLowerCase()} results in real-time as you type. No waiting for server responses — everything processes instantly in your browser.` },
    { icon: '🔒', title: '100% Private & Secure', description: `Your text never leaves your browser. We never store, upload, or access your data. Complete privacy guaranteed — no cookies, no tracking.` },
    { icon: '📱', title: 'Works on All Devices', description: `Fully responsive design. Use the ${tool.name} on desktop, tablet, iPhone, Android — no app download or installation needed.` },
    { icon: '🆓', title: 'Unlimited & Free Forever', description: `Use the ${tool.name} as many times as you want with no limits. Completely free, forever. No account, no subscription, no hidden fees.` },
    { icon: '🌐', title: 'No Downloads Required', description: `Works directly in your web browser — Chrome, Firefox, Safari, Edge. No software to install, no plugins needed.` },
    { icon: '💾', title: 'Copy & Download Results', description: `One-click copy to clipboard or download results as a text file. Quick and easy to use your processed text anywhere.` },
  ];
}

function generateUseCases(tool, category) {
  const seoData = getToolSEO(tool.slug);
  if (seoData?.useCases) return seoData.useCases;

  const baseCases = [
    `Quickly ${tool.description.toLowerCase()} for work or school projects`,
    `Use in professional documents and email drafts`,
    `Preparing text data for spreadsheets or databases`,
    `Formatting content for blogs, articles, or social media`,
    `Processing text files before importing into other software`,
    `Students working on assignments and research papers`,
    `Freelancers processing client text data efficiently`,
    `Developers working with text in code and applications`,
  ];

  const categoryCases = {
    'text-case-converter': ['Converting headlines to title case for SEO optimization', 'Formatting variable names for programming projects'],
    'word-counter': ['Checking essay word count for school submission requirements', 'Analyzing text readability for content marketing strategy'],
    'text-cleaner': ['Cleaning up copied text from PDFs or web pages', 'Removing formatting artifacts from pasted content'],
    'text-encoder-decoder': ['Encoding sensitive data for safe URL transmission', 'Decoding Base64 strings from API responses and webhooks'],
    'code-formatter': ['Beautifying minified JSON from API responses', 'Formatting SQL queries before executing them in production'],
    'text-converter': ['Converting CSV data to JSON for web applications', 'Transforming Markdown documentation to HTML pages'],
    'text-extractor': ['Extracting email addresses from large document archives', 'Finding all URLs in a document for broken link checking'],
    'generators-randomizers': ['Generating cryptographically secure passwords for accounts', 'Creating unique identifiers for database records and APIs'],
    'text-hasher-cryptography': ['Verifying file integrity with checksum comparison', 'Encrypting sensitive text messages before sharing'],
    'list-array-tools': ['Removing duplicate items from email mailing lists', 'Combining product names with variant descriptions'],
    'web-developer-tools': ['Debugging JWT tokens from authentication systems', 'Converting hex color codes for CSS styling and design'],
  };

  return [...(categoryCases[category.id] || []), ...baseCases].slice(0, 8);
}

function generateFAQs(tool, category) {
  const seoData = getToolSEO(tool.slug);
  if (seoData?.faqs && seoData.faqs.length > 0) return seoData.faqs;

  return [
    {
      question: `What is the ${tool.name} and how does it work?`,
      answer: `The ${tool.name} is a free online tool that allows you to ${tool.description.toLowerCase()}. It works entirely in your web browser using JavaScript — you paste or type your text, and the tool processes it instantly without uploading anything to a server. Your data stays completely private.`
    },
    {
      question: `Is the ${tool.name} completely free to use?`,
      answer: `Yes, our ${tool.name} is 100% free to use with no limitations. There are no hidden fees, no usage limits, no premium tiers, and no registration required. You can use it as many times as you need, forever.`
    },
    {
      question: `Is my text data secure when using the ${tool.name}?`,
      answer: `Absolutely. Your privacy is our top priority. All text processing happens directly in your web browser using client-side JavaScript. We never send, store, save, or log your text on our servers. Your data stays on your device at all times.`
    },
    {
      question: `Does the ${tool.name} work on mobile phones and tablets?`,
      answer: `Yes! The ${tool.name} is fully responsive and works perfectly on all devices — iPhones, Android phones, iPads, tablets, laptops, and desktop computers. No app installation is required — just open it in your mobile browser.`
    },
    {
      question: `Can I use the ${tool.name} without creating an account?`,
      answer: `Yes! No account, registration, or sign-up is required. Simply visit the page and start using the tool immediately. We believe essential text tools should be accessible to everyone without barriers.`
    },
    {
      question: `How do I copy or download results from the ${tool.name}?`,
      answer: `After processing your text, click the "📋 Copy Result" button to copy the output to your clipboard instantly, or click "💾 Download" to save the result as a .txt file to your device.`
    },
  ];
}

// Generate "Related Searches" links for internal linking
function generateRelatedSearches(tool) {
  const seoData = getToolSEO(tool.slug);
  return seoData?.relatedSearches || [];
}

// Smart cross-category tool recommendations
function getSmartCrossLinks(categoryId, toolSlug) {
  const recommendations = {
    'text-case-converter': ['word-counter', 'remove-extra-spaces', 'text-to-html', 'url-slug-generator'],
    'word-counter': ['readability-score', 'keyword-density', 'reading-time', 'sentence-counter'],
    'text-cleaner': ['remove-duplicate-lines', 'sort-lines', 'find-replace', 'comma-separator'],
    'text-encoder-decoder': ['base64-encode-decode', 'url-encode-decode', 'md5-hash', 'sha256-hash'],
    'code-formatter': ['json-formatter', 'json-validator', 'json-minifier', 'css-minifier'],
    'text-converter': ['csv-to-json', 'json-to-csv', 'markdown-to-html', 'yaml-to-json'],
    'text-extractor': ['extract-emails', 'extract-urls', 'regex-tester', 'find-replace'],
    'generators-randomizers': ['password-generator', 'uuid-generator', 'lorem-ipsum', 'random-string'],
    'text-hasher-cryptography': ['sha256-hash', 'md5-hash', 'aes-encrypt-decrypt', 'sha512-hash'],
    'list-array-tools': ['shuffle-list', 'comma-separator', 'sort-lines', 'remove-duplicate-lines'],
    'web-developer-tools': ['jwt-decoder', 'json-formatter', 'color-converter', 'url-slug-generator'],
  };

  const allTools = getAllTools();
  const recSlugs = recommendations[categoryId] || [];
  
  return allTools
    .filter(t => recSlugs.includes(t.slug) && t.categoryId !== categoryId)
    .slice(0, 6);
}

export default async function ToolPage({ params }) {
  const { category: categoryId, tool } = await params;
  const toolData = getTool(categoryId, tool);
  
  if (!toolData) {
    notFound();
  }

  const category = toolData.category;
  // Show ALL related tools in same category (not just 5)
  const relatedTools = getRelatedTools(category.id, toolData.slug, 9);
  const crossLinks = getCrossLinks(category.id, 6);
  const smartCrossLinks = getSmartCrossLinks(category.id, toolData.slug);

  // Generate all SEO content — uses unique data when available
  const whatIs = generateWhatIs(toolData, category);
  const whyChoose = generateWhyChoose(toolData);
  const useCases = generateUseCases(toolData, category);
  const faqs = generateFAQs(toolData, category);
  const relatedSearches = generateRelatedSearches(toolData);

  const howToSteps = [
    {
      title: "Paste or type your text",
      description: `Enter your text in the input area. You can type directly, paste from clipboard (Ctrl+V), or drag and drop text content.`
    },
    {
      title: "Instant automatic processing",
      description: `The ${toolData.name} processes your text in real-time as you type. Results appear instantly — no buttons to click, no waiting for servers.`
    },
    {
      title: "Copy or download your results",
      description: `Click "📋 Copy Result" to copy to clipboard instantly, or "💾 Download" to save as a .txt file. Your processed text is ready to use anywhere.`
    }
  ];

  // Generate all structured data schemas
  const faqSchema = generateFAQSchema(faqs);
  const toolSchema = generateToolSchema(toolData, category);
  const softwareSchema = generateSoftwareAppSchema(toolData, category);
  const howToSchema = generateHowToSchema(toolData, howToSteps);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://ilovetexts.com' },
    { name: category.name, url: `https://ilovetexts.com/${category.id}` },
    { name: toolData.name, url: `https://ilovetexts.com/${category.id}/${toolData.slug}` }
  ]);

  return (
    <>
      <Script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-tool" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <Script id="schema-software" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <Script id="schema-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id="schema-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <ToolLayout 
        tool={toolData} 
        category={category} 
        relatedTools={relatedTools}
        crossLinks={[...smartCrossLinks, ...crossLinks].slice(0, 8)}
        faqs={faqs}
        howToSteps={howToSteps}
        whatIs={whatIs}
        whyChoose={whyChoose}
        useCases={useCases}
        relatedSearches={relatedSearches}
        allCategories={CATEGORIES}
      >
        <ClientTool categoryId={category.id} toolSlug={toolData.slug} />
      </ToolLayout>
    </>
  );
}
