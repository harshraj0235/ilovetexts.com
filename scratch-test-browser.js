const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating...');
  await page.goto('http://localhost:4115/en/premium-pdf-tools/batch-pdf-processor');
  await page.waitForTimeout(2000);
  
  console.log('Uploading file...');
  const fileInput = page.locator('input[type="file"]');
  // Simple valid minimal PDF
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\ntrailer<</Root 1 0 R>>');
  await fileInput.setInputFiles({ name: 'test.pdf', mimeType: 'application/pdf', buffer: pdfBuffer });
  
  await page.waitForTimeout(1000);
  
  console.log('Clicking extract...');
  await page.click('text=Extract Text');
  
  await page.waitForTimeout(4000);
  await browser.close();
})();
