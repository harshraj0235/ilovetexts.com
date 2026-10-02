import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { prepareRoute } from "../src/india/route.js";
await mkdir("artifacts", { recursive: true });
const raw = JSON.parse(
  await readFile(
    new URL("../public/routes/delhi-rishikesh.json", import.meta.url),
  ),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--enable-webgl", "--enable-unsafe-swiftshader"],
});
const errors = [],
  base = process.env.GAME_URL || "http://localhost:4173";
const entry = process.env.GAME_PATH || "/india.html";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + entry);
  await page.waitForFunction(() => window.indiaRoadTrip?.snapshot().planned);
  assert.ok(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).planned
      .distance > 200000,
  );
  await page.screenshot({ path: "artifacts/india-planner.png" });
  assert.ok(
    (await page.locator("#planning-map .leaflet-tile-loaded").count()) > 0,
    "real map tiles loaded",
  );
  await page.locator("#brand-select").selectOption("zomato");
  assert.equal(await page.locator('#pace').inputValue(), '1');
  await page.locator('#start-trip').click();
  await page.waitForFunction(() => window.indiaRoadTrip?.snapshot().world?.frames > 5);
  const originalHeading = await page.evaluate(() => window.indiaRoadTrip.snapshot().trip.heading);
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.indiaRoadTrip.snapshot().trip.speed > 8);
  await page.keyboard.down('d');
  await page.waitForTimeout(500);
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  const steered = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  assert.ok(steered.trip.heading < originalHeading - 0.04, 'steering rotates the vehicle');
  await page.keyboard.down(' ');
  await page.waitForFunction(() => window.indiaRoadTrip.snapshot().trip.speed === 0);
  await page.keyboard.up(' ');
  await page.locator('#trip-recover').click();
  const recovered = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  assert.equal(recovered.trip.speed, 0);
  assert.ok(Math.abs(recovered.trip.lane + 2.1) < 0.1);
  await page.locator('#trip-gear').click();
  await page.keyboard.down('w');
  await page.waitForFunction(progress => window.indiaRoadTrip.snapshot().trip.travelled < progress - 2, recovered.trip.travelled);
  await page.keyboard.up('w');
  await page.screenshot({ path: 'artifacts/india-manual-steering.png' });
  await page.locator('#return-planner').click();
  await page.locator("#pace").selectOption("20");
  await page.locator("#start-trip").click();
  await page.waitForFunction(
    () => window.indiaRoadTrip?.snapshot().world?.frames > 4,
  );
  await page.waitForFunction(() => window.indiaRoadTrip.snapshot().scenery > 0);
  assert.ok(
    (await page.evaluate(() => window.indiaRoadTrip.canvasProbe())) > 12,
  );
  await page.screenshot({ path: "artifacts/india-driving.png" });
  const initial = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  await page.keyboard.down("w");
  await page.waitForFunction(
    () => window.indiaRoadTrip.snapshot().trip.travelled > 35,
  );
  await page.keyboard.up("w");
  const moved = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  assert.notDeepEqual(initial.trip.coordinate, moved.trip.coordinate);
  await page.keyboard.press("Escape");
  const stopped = await page.evaluate(() => window.indiaRoadTrip.snapshot());
  await page.waitForTimeout(300);
  assert.equal(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).trip.travelled,
    stopped.trip.travelled,
  );
  await page.locator("#continue-trip").click();
  await page.locator("#trip-camera").click();
  assert.equal(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).world
      .cameraMode,
    1,
  );
  await page.locator("#trip-camera").click();
  await page.locator("#return-planner").click();
  assert.ok(await page.locator("#resume-trip").isVisible());
  await page.reload();
  await page.locator("#resume-trip").click();
  await page.waitForFunction(
    () => window.indiaRoadTrip.snapshot().world?.frames > 3,
  );
  assert.ok(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).trip
      .travelled >= moved.trip.travelled,
  );
  await page.locator("#return-planner").click();
  // A saved trip two metres from the actual endpoint exercises arrival without a multi-hour test.
  await page.goto(base + entry);
  await page.evaluate(
    (saved) =>
      localStorage.setItem("neon-india-trip-v1", JSON.stringify(saved)),
    {
      id: "arrival-verification",
      route: raw,
      travelled: prepareRoute(raw).length - 2,
      scale: 20,
      delivered: false,
    },
  );
  await page.reload();
  await page.locator("#resume-trip").click();
  await page.waitForFunction(
    () => window.indiaRoadTrip.snapshot().world?.frames > 3,
  );
  await page.keyboard.down("w");
  await page.waitForFunction(
    () => window.indiaRoadTrip.snapshot().trip.arrived,
  );
  await page.keyboard.up("w");
  await page.locator("#deliver").click();
  await page.waitForFunction(
    () => window.indiaRoadTrip.snapshot().trip.delivered,
  );
  const rewarded = await page.evaluate(
    () => window.indiaRoadTrip.snapshot().wallet,
  );
  assert.ok(rewarded > 0);
  await page.screenshot({ path: "artifacts/india-delivered.png" });
  await page.locator("#another-trip").click();
  await page.reload();
  assert.equal(await page.locator("#resume-trip").isVisible(), false);
  assert.equal(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).wallet,
    rewarded,
  );
  await page.route("**/api/india/route?**", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Routing offline for test"}',
    }),
  );
  await page.locator("#presets button").filter({ hasText: "Mumbai" }).click();
  await page.waitForFunction(() =>
    document
      .getElementById("plan-status")
      .textContent.includes("Routing offline"),
  );
  assert.equal(await page.locator("#start-trip").isVisible(), false);
  await page.locator("#from-input").fill("Unselected town");
  assert.equal(
    (await page.evaluate(() => window.indiaRoadTrip.snapshot())).planned,
    null,
  );

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  mobile.setDefaultTimeout(60000);
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base + entry);
  await mobile.waitForFunction(() => window.indiaRoadTrip?.snapshot().planned);
  await mobile.screenshot({
    path: "artifacts/india-mobile-planner.png",
    fullPage: true,
  });
  await mobile.locator("#start-trip").tap();
  await mobile.waitForFunction(
    () => window.indiaRoadTrip?.snapshot().world?.frames > 3,
  );
  assert.ok(
    (await mobile.evaluate(() => window.indiaRoadTrip.canvasProbe())) > 12,
  );
  await mobile.screenshot({ path: "artifacts/india-mobile-driving.png" });
  const button = await mobile.locator('[data-drive="w"]').boundingBox();
  await mobile.mouse.move(button.x + 25, button.y + 25);
  await mobile.mouse.down();
  await mobile.waitForFunction(
    () => window.indiaRoadTrip.snapshot().trip.speed > 1,
  );
  await mobile.mouse.up();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        checks: [
          "real route and map tiles",
          "mapped pickup scenery",
          "3D nonblank desktop/mobile",
          "throttle advances real coordinates",
          "pause",
          "camera switch",
          "save and resume",
          "arrival and reward",
          "no duplicate reward after reload",
          "route failure state",
          "invalidated edited locations",
          "mobile throttle",
          "manual steering and braking",
          "road recovery and reverse gear",
        ],
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
