import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

(async () => {
  const artifactsDir = 'C:/Users/harshraj/.gemini/antigravity-ide/brain/a7cf9b0e-f170-4f1a-a323-d2dbe9b27c80';
  const videoDir = path.join(artifactsDir, 'scratch', 'videos');
  
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log('Starting Playwright for long video recording...');
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
    const urls = [
      'http://localhost:4115/en',
      'http://localhost:4115/en/image-tools/convert-image',
      'http://localhost:4115/en/unit-converters/length-converter',
      'http://localhost:4115/en/text-converter/json-to-xml',
      'http://localhost:4115/en/text-cleaner/remove-extra-spaces',
      'http://localhost:4115/en/writing-grammar-tools/punctuation-checker',
      'http://localhost:4115/en/word-counting-tools/word-counter',
      'http://localhost:4115/en/text-converter/markdown-to-html',
      'http://localhost:4115/en/text-extractor/pii-and-privacy-redactor',
      'http://localhost:4115/en/social-media-tools/fancy-font-and-aesthetic-text-generator',
      'http://localhost:4115/en'
    ];

    for (let i = 0; i < urls.length; i++) {
      console.log(`Visiting ${urls[i]}...`);
      await page.goto(urls[i], { waitUntil: 'networkidle' });
      await sleep(2000);
      
      if (i === 0 || i === urls.length - 1) {
          for (let s = 0; s < 10; s++) {
            await page.mouse.wheel(0, 500);
            await sleep(500);
          }
          await page.mouse.wheel(0, -5000); 
      } else {
          await page.mouse.wheel(0, 300);
          await sleep(1500);
          
          const textareas = await page.$$('textarea');
          if (textareas.length > 0) {
              await textareas[0].fill('');
              await textareas[0].type('This is a live demo of the tool in action! It is extremely fast and completely private.', { delay: 30 });
              await sleep(1000);
          } else {
              const inputs = await page.$$('input[type="number"]');
              if (inputs.length > 0) {
                  await inputs[0].fill('');
                  await inputs[0].type('9000', { delay: 100 });
                  await sleep(1000);
              }
          }
      }
      await sleep(2000);
    }
  } catch(e) {
    console.error('Error during automation:', e);
  } finally {
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();
    
    console.log('Browser closed. Video saved to:', videoPath);
    
    const mp4Path = path.join(artifactsDir, 'ilovetexts_long_demo_viral.mp4');
    console.log(`Converting to MP4: ${mp4Path}...`);
    
    exec(`"${ffmpegStatic}" -y -i "${videoPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${mp4Path}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error converting video:', error);
            return;
        }
        console.log('Video successfully converted to MP4:', mp4Path);
        fs.unlinkSync(videoPath);
    });
  }
})();
