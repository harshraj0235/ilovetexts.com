import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const artifactsDir = 'C:/Users/harshraj/.gemini/antigravity-ide/brain/a7cf9b0e-f170-4f1a-a323-d2dbe9b27c80';
  const videoDir = path.join(artifactsDir, 'scratch', 'videos');
  
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log('Starting Playwright for video recording...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    }
  });

  const page = await context.newPage();
  
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  try {
    // 1. Homepage
    console.log('Visiting Homepage...');
    await page.goto('http://localhost:4115/en', { waitUntil: 'networkidle' });
    await sleep(2000);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 600);
      await sleep(1000);
    }
    await page.mouse.wheel(0, -3600); 
    await sleep(1000);

    // 2. Image Converter
    console.log('Visiting Image Converter...');
    await page.goto('http://localhost:4115/en/image-tools/convert-image', { waitUntil: 'networkidle' });
    await sleep(1000);
    await page.mouse.wheel(0, 300);
    await sleep(2500);

    // 3. Length Converter
    console.log('Visiting Length Converter...');
    await page.goto('http://localhost:4115/en/unit-converters/length-converter', { waitUntil: 'networkidle' });
    await sleep(1000);
    await page.mouse.wheel(0, 300);
    await sleep(1000);
    
    const inputs = await page.$$('input[type="number"]');
    if (inputs.length > 0) {
      await inputs[0].fill('');
      await inputs[0].type('1337', { delay: 150 });
      await sleep(2000);
    }

    // 4. JSON to XML Converter
    console.log('Visiting JSON to XML...');
    await page.goto('http://localhost:4115/en/text-converter/json-to-xml', { waitUntil: 'networkidle' });
    await sleep(1000);
    await page.mouse.wheel(0, 300);
    await sleep(1000);
    
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      const sampleJSON = '{\n  "app": "ilovetexts",\n  "status": "viral",\n  "tools": 275\n}';
      await textareas[0].fill('');
      for(let char of sampleJSON) {
        await textareas[0].type(char, { delay: 50 });
      }
      await sleep(3000);
    }

    // 5. Remove Extra Spaces
    console.log('Visiting Remove Extra Spaces...');
    await page.goto('http://localhost:4115/en/text-cleaner/remove-extra-spaces', { waitUntil: 'networkidle' });
    await sleep(1000);
    await page.mouse.wheel(0, 300);
    await sleep(1000);
    const textareas2 = await page.$$('textarea');
    if (textareas2.length > 0) {
      await textareas2[0].fill('');
      const dirtyText = "This    is   a    very    messy     text  !";
      for(let char of dirtyText) {
        await textareas2[0].type(char, { delay: 100 });
      }
      await sleep(2000);
    }

    // Final finish
    console.log('Finishing...');
    await page.goto('http://localhost:4115/en', { waitUntil: 'networkidle' });
    await sleep(3000);

  } catch(e) {
    console.error('Error during automation:', e);
  } finally {
    // Close context to ensure video is flushed/saved
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();
    
    // Move and rename the video to the root of artifacts folder
    const finalPath = path.join(artifactsDir, 'ilovetexts_viral_demo.webm');
    fs.renameSync(videoPath, finalPath);
    console.log('Browser closed. Video saved to:', finalPath);
  }
})();
