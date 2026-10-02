import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(process.env.GAME_URL || 'http://localhost:4173/india.html');
  await page.waitForFunction(() => window.indiaRoadTrip?.snapshot().planned);
  await page.locator('#pace').selectOption('1');
  await page.locator('#start-trip').click();
  await page.waitForFunction(() => window.indiaRoadTrip?.snapshot().world?.frames > 5);
  await page.keyboard.down('w');
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  const turned = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  await page.screenshot({ path: 'artifacts/steering-review.png' });
  await page.keyboard.down(' ');
  await page.waitForTimeout(1500);
  await page.keyboard.up(' ');
  const braked = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  console.log(JSON.stringify({ before: before.trip, turned: turned.trip, braked: braked.trip }, null, 2));
} finally { await browser.close(); }
