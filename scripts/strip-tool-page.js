import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const p = path.join(__dirname, '../app/[lang]/[category]/[tool]/page.js');
let content = fs.readFileSync(p, 'utf-8');

// The marker where the objects start
const startMarker = '// UNIQUE CONTENT GENERATION ENGINE';
// The marker where we want to keep the code
const endMarker = 'export default async function ToolPage';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // We want to replace everything between startIndex and endIndex with the new generator functions
  const newGenerators = `
// ==========================================
// DYNAMIC CONTENT GENERATORS
// Pulls localized data from content JSONs
// ==========================================

function generateWhatIs(toolData, category) {
  return toolData.content?.whatIs || \`The \${toolData.name} is a free online tool to process text.\`;
}

function generateWhyChoose(toolData, category) {
  if (toolData.content?.whyChoose?.length > 0) return toolData.content.whyChoose;
  return [
    { icon: '🚀', title: 'Lightning Fast', description: 'Real-time processing in your browser.' },
    { icon: '🔒', title: '100% Private', description: 'Your data never leaves your device.' },
    { icon: '💻', title: 'No Installation', description: 'Works instantly on any device.' }
  ];
}

function generateUseCases(toolData, category) {
  return toolData.content?.useCases || [];
}

function generateFAQs(toolData, category) {
  if (toolData.content?.faqs?.length > 0) return toolData.content.faqs;
  return [
    { question: \`Is the \${toolData.name} free to use?\`, answer: 'Yes, it is 100% free with no limits.' },
    { question: 'Do you save my text?', answer: 'No, all processing happens locally in your browser. We never see or store your data.' }
  ];
}

function generateRelatedSearches(toolData) {
  return toolData.content?.relatedSearches || [];
}

function getSmartCrossLinks(categoryId, toolSlug, lang = 'en') {
  // Simple fallback for now
  const allTools = require('@/lib/tools-config').getAllTools(lang);
  return allTools.filter(t => t.categoryId !== categoryId).slice(0, 6);
}

`;

  const newContent = content.substring(0, startIndex) + newGenerators + content.substring(endIndex);
  fs.writeFileSync(p, newContent, 'utf-8');
  console.log('Successfully stripped out hardcoded english text from ToolPage.');
} else {
  console.log('Could not find markers');
}
