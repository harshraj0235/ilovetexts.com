const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const languages = ['en', 'hi', 'pt', 'es', 'de', 'id'];

  for (const lang of languages) {
    console.log(`\n=== Testing language: ${lang} ===`);
    let hydrationError = false;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Hydration failed') || text.includes('Text Case Converter')) {
        // We only care if we see hydration errors
        if (text.includes('Hydration failed')) {
           hydrationError = true;
           console.log(`[Hydration Error in ${lang}] ${text.substring(0, 100)}...`);
        }
      }
    });

    page.on('pageerror', error => {
      if (error.message.includes('Hydration')) {
        hydrationError = true;
        console.log(`[Page Error in ${lang}] Hydration failed!`);
      }
    });

    // Navigate to a tool page in the specific language
    const url = lang === 'en' 
      ? 'http://localhost:3000/text-cleaner/remove-duplicate-lines'
      : `http://localhost:3000/${lang}/text-cleaner/remove-duplicate-lines`;
      
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check if the title/navbar actually rendered in the correct language
    // We can just extract the first navCategories item text by executing script
    const firstCatName = await page.evaluate(() => {
      const el = document.querySelector('.nav-links li:first-child a span[aria-label]');
      return el ? el.getAttribute('aria-label') : null;
    });

    console.log(`[Result ${lang}] Hydration Error: ${hydrationError}`);
    console.log(`[Result ${lang}] First Nav Category Label: ${firstCatName}`);
    
    // Clear listeners for next iteration
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  await browser.close();
  process.exit(0);
})();
