import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES } from '../lib/tools-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to extract a JS object from a file string
function extractObject(fileContent, varName) {
  const startRegex = new RegExp(`const ${varName}\\s*=\\s*{`);
  const match = fileContent.match(startRegex);
  if (!match) return {};
  
  const startIndex = match.index + match[0].length - 1; // points to the '{'
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') braceCount++;
    if (fileContent[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) return {};
  
  const objectString = fileContent.substring(startIndex, endIndex + 1);
  
  try {
    // Evaluate in a safe context
    return (new Function(`return ${objectString}`))();
  } catch (e) {
    console.error(`Error parsing ${varName}:`, e);
    return {};
  }
}

async function extractAll() {
  console.log('Extracting English content from codebase...');
  
  // 1. Read files
  const toolPageCode = fs.readFileSync(path.join(__dirname, '../app/[lang]/[category]/[tool]/page.js'), 'utf-8');
  const catPageCode = fs.readFileSync(path.join(__dirname, '../app/[lang]/[category]/page.js'), 'utf-8');
  
  // 2. Extract objects
  const TOOL_WHAT_IS = extractObject(toolPageCode, 'TOOL_WHAT_IS');
  const TOOL_WHY_CHOOSE = extractObject(toolPageCode, 'TOOL_WHY_CHOOSE');
  const TOOL_USE_CASES = extractObject(toolPageCode, 'TOOL_USE_CASES');
  const TOOL_FAQS = extractObject(toolPageCode, 'TOOL_FAQS');
  const TOOL_RELATED_SEARCHES = extractObject(toolPageCode, 'TOOL_RELATED_SEARCHES');
  const CATEGORY_SEO = extractObject(catPageCode, 'CATEGORY_SEO');
  
  // 3. Build the master JSON structure
  const content = {
    categories: {},
    tools: {}
  };
  
  // Map Categories
  for (const cat of CATEGORIES) {
    content.categories[cat.id] = {
      name: cat.name,
      description: cat.description,
      longDesc: CATEGORY_SEO[cat.id]?.longDesc || '',
      useCases: CATEGORY_SEO[cat.id]?.useCases || []
    };
    
    // Map Tools
    for (const tool of cat.tools) {
      let toolWhy = [];
      let toolUses = [];
      let toolFaq = [];
      let toolSearches = [];
      
      toolWhy = TOOL_WHY_CHOOSE[cat.id] || TOOL_WHY_CHOOSE['default'] || [];
      toolUses = TOOL_USE_CASES[cat.id] || TOOL_USE_CASES['default'] || [];
      toolFaq = TOOL_FAQS[cat.id] || TOOL_FAQS['default'] || [];
      toolSearches = TOOL_RELATED_SEARCHES[cat.id] || TOOL_RELATED_SEARCHES['default'] || [];
      
      const seoData = (await import('../lib/tools-seo-data.js')).getToolSEO(tool.slug);

      content.tools[tool.slug] = {
        name: tool.name,
        description: tool.description,
        metaTitle: seoData?.metaTitle || '',
        metaDescription: seoData?.metaDescription || '',
        keywords: seoData?.keywords ? (Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords) : tool.keywords,
        whatIs: TOOL_WHAT_IS[tool.slug] || seoData?.whatIs || '',
        whyChoose: toolWhy,
        useCases: toolUses,
        faqs: toolFaq,
        relatedSearches: toolSearches
      };
    }
  }
  
  // 4. Create directory and save
  const dir = path.join(__dirname, '../locales/content');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dir, 'en.json'), 
    JSON.stringify(content, null, 2),
    'utf-8'
  );
  
  console.log(`Successfully extracted ${CATEGORIES.length} categories and ${Object.keys(content.tools).length} tools into locales/content/en.json`);
}

extractAll();
