import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'google-translate-api-x';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_LANGS = ['hi', 'pt', 'es', 'de', 'id'];
const CONTENT_DIR = path.join(__dirname, '../locales/content');
const SOURCE_FILE = path.join(CONTENT_DIR, 'en.json');

// Helper to chunk arrays
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error('Source en.json not found!');
    return;
  }
  
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
  
  for (const lang of TARGET_LANGS) {
    console.log(`\n--- Starting Translation for [${lang}] ---`);
    
    const targetPath = path.join(CONTENT_DIR, `${lang}.json`);
    let targetData = { categories: {}, tools: {} };
    
    // We will extract all string values into an array, keeping track of their locations
    const textQueue = [];
    const setters = []; // functions to set the translated value back
    
    // Helper to enqueue a text string for translation
    function enqueue(text, setter) {
      if (!text || text.trim() === '') {
        setter(text); // empty strings don't need translation
        return;
      }
      textQueue.push(text);
      setters.push(setter);
    }
    
    // 1. Traverse Categories
    for (const [catId, catContent] of Object.entries(sourceData.categories)) {
      targetData.categories[catId] = { useCases: [] };
      enqueue(catContent.name, val => targetData.categories[catId].name = val);
      enqueue(catContent.description, val => targetData.categories[catId].description = val);
      enqueue(catContent.longDesc, val => targetData.categories[catId].longDesc = val);
      
      catContent.useCases.forEach((uc, idx) => {
        enqueue(uc, val => targetData.categories[catId].useCases[idx] = val);
      });
    }
    
    // 2. Traverse Tools
    for (const [toolSlug, toolContent] of Object.entries(sourceData.tools)) {
      targetData.tools[toolSlug] = {
        whyChoose: [],
        useCases: [],
        faqs: [],
        relatedSearches: []
      };
      
      const t = targetData.tools[toolSlug];
      enqueue(toolContent.name, val => t.name = val);
      enqueue(toolContent.description, val => t.description = val);
      enqueue(toolContent.metaTitle, val => t.metaTitle = val);
      enqueue(toolContent.metaDescription, val => t.metaDescription = val);
      enqueue(toolContent.keywords, val => t.keywords = val);
      enqueue(toolContent.whatIs, val => t.whatIs = val);
      
      toolContent.whyChoose.forEach((wc, idx) => {
        t.whyChoose[idx] = { icon: wc.icon }; // copy icon directly
        enqueue(wc.title, val => t.whyChoose[idx].title = val);
        enqueue(wc.description, val => t.whyChoose[idx].description = val);
      });
      
      toolContent.useCases.forEach((uc, idx) => {
        enqueue(uc, val => t.useCases[idx] = val);
      });
      
      toolContent.faqs.forEach((faq, idx) => {
        t.faqs[idx] = {};
        enqueue(faq.question, val => t.faqs[idx].question = val);
        enqueue(faq.answer, val => t.faqs[idx].answer = val);
      });
      
      toolContent.relatedSearches.forEach((rs, idx) => {
        enqueue(rs, val => t.relatedSearches[idx] = val);
      });
    }
    
    console.log(`Queued ${textQueue.length} strings for translation to ${lang}.`);
    
    // Batch Translate
    // google-translate-api-x supports array input. We chunk to 100 to avoid URI too long errors.
    const chunks = chunkArray(textQueue, 100);
    let completed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
      
      try {
        const res = await translate(chunk, { to: lang });
        // res is an array of objects
        res.forEach((r, idx) => {
          const globalIdx = completed + idx;
          setters[globalIdx](r.text);
        });
      } catch (err) {
        console.error(`Failed on chunk ${i + 1}: ${err.message}. Retrying individually...`);
        // Fallback to individual
        for (let j = 0; j < chunk.length; j++) {
          try {
            const indRes = await translate(chunk[j], { to: lang });
            setters[completed + j](indRes.text);
          } catch (e) {
            setters[completed + j](chunk[j]); // fallback to english
          }
          await delay(200);
        }
      }
      
      completed += chunk.length;
      await delay(1000); // Wait 1s between chunks to be safe
    }
    
    fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf-8');
    console.log(`Finished ${lang}.json!`);
  }
}

run().catch(console.error);
