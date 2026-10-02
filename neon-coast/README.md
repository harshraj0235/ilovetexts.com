# Neon Coast

## India Road Trip

Open `/india.html` for the new intercity parcel game. Choose pickup and destination cities, select one of 14 delivery liveries, plan an actual driving route, then collect and deliver the parcel. Includes real OpenStreetMap tiles, OSRM road geometry, turn guidance, mapped scenery, third-person/cockpit cameras, touch controls, pause, local trip resume, and delivery rewards. Delhi to Rishikesh includes a dated real-route snapshot and pickup scenery for provider outages. Other routes require an online routing service.

Manual driving at real distance is now the default: W accelerates, S/Space brakes, A/D directly steers the front wheels and vehicle heading. Steering is speed-sensitive and eases back to center; off-road ground slows the car. Stop and use the D/R gear button to reverse. The recovery icon returns the car to the nearby road without restarting the delivery. C changes camera and Escape pauses. Optional Assisted 20x/60x modes follow the route with lane control for long journeys. Progress and rewards are browser-local, not secure multiplayer currency.

### Main Website Integration

The parent Next.js website serves the game at `/india-trip`, with isolated assets at `/india-trip-game/` and same-origin map APIs under `/api/india/`. The parent `npm run build` builds the game automatically before Next. For parent development, run `npm run build:india-trip` before `npm run dev`. No separate game server is needed in the website deployment. Keep attribution enabled; changing the tile provider also requires updating the site's image CSP allowlist. Browser verification against the integrated site uses `GAME_URL=http://localhost:4000 GAME_PATH=/india-trip npm run test:india` from this directory.

The 3D view is an approximation, not Street View: flat terrain, generic buildings, representative trees, simulated traffic, and streamed mapped water/roads/places. Unmapped objects, accurate elevations, imagery, road widths, and every real-world tree or business are not reproduced. Scenery coverage is partial and depends on provider availability; the HUD reports failures. India-wide search does not guarantee a drivable route between every pair of locations, especially islands.

### Server Deployment

Use Node.js 22.12+ (Node 24 recommended). Run `npm ci`, `npm test`, `npm run build`, then `npm start`. The production server serves India Road Trip at `/`, the original coastal game at `/index.html`, and the map API under `/api/india/`. Default port is 4174; set `PORT` and `HOST` as needed. `/health` is a basic process health endpoint.

Copy `.env.example` to `.env` and configure map services before a public launch. Server variables load at startup; `VITE_*` settings require rebuilding. The bundled OSRM, Photon, OpenStreetMap tiles and small-window OSM API defaults are for low-volume development, have no uptime guarantees, and must not be treated as a production backend. Use contracted/self-hosted routing, geocoding, scenery and tile services, preserve attribution and comply with their usage policies. Do not bulk-download standard OSM tiles.

This remains a playable prototype, not a production-ready recreation of India. Public release additionally needs HTTPS, durable/shared caching and rate limits, monitoring, security/load/device testing, and appropriate rights for commercial logo use. No accounts, multiplayer or anti-cheat backend is included.

Run `npm run test:india` with the dev server on 4173 for desktop/mobile browser checks. Set `CHROME_PATH` to use an installed Chrome. Tests cover map/route loading, rendered pixels, movement, pause/camera, save/resume, arrival and reward deduplication, provider failures, and touch input. `scripts/fetch-india-demo.mjs` refreshes the route snapshot; `scripts/fetch-demo-scenery.mjs` refreshes its pickup scenery.

An original, single-player browser driving game built with Three.js and cannon-es. This is a compact playable prototype, not a GTA 6 replica or a AAA production release.

## Run

Requires Node.js 20.19+ or 22.12+ and a browser with WebGL enabled.

```sh
npm install
npm run dev -- --port 4173
```

Open the URL printed by Vite. To build static hosting files:

```sh
npm test
npm run build
npm run preview -- --port 4173
```

The original coastal game can run on static hosting; the India game requires the included map API server. Google Fonts is optional; local fallback fonts remain usable offline.

Browser verification: start the dev server on port 4173, run `npx playwright install chromium`, then `npm run test:browser`. An existing Chrome executable can instead be selected with the `CHROME_PATH` environment variable. Screenshots are written to `artifacts/`.

## Play

- WASD or arrow keys: drive or move on foot.
- Shift: boost or sprint. Space: handbrake.
- E: exit a stopped car or enter your nearby car.
- M: map. Escape: pause. Touch controls appear on touch devices.
- G or the car button: delivery garage. Pick a brand or shuffle, then apply with the Drive button. The garage pauses the game; cancelling keeps the previous car.
- Accept contracts in the dispatch panel and drive through the yellow checkpoint rings in order.
- Vehicle collisions cause damage; collisions with traffic attract police. Put distance between yourself and pursuers to clear your heat.
- Repairs cost $150 and require stopping with no police heat. Recovery cancels an active contract. Destruction costs up to $200.
- Balance and completed contracts save locally in this browser. Current mission, car position, and vehicle condition reset between sessions.

Includes a procedural coastal district, 20 traffic cars, three repeatable contracts, police pursuit, on-foot movement, boost, damage, repairs, minimap, city map, sound toggle, graphics setting, pause, and local progression.

## Delivery Fleet

14 selectable liveries: Zomato, Swiggy, Zepto, Amazon, Flipkart, Swish, Flipkart Minutes, Amazon Now, Blinkit, EatSure, BigBasket, Uber Eats, Domino's, and DoorDash. Each has matching body paint and locally bundled logo decals. Traffic shuffles all 14 brands into 20 cars each session. Selecting a brand changes the player car without changing vehicle condition, cash, or mission progress. The selected brand saves separately in browser storage.

The garage includes food/grocery/shopping filters, a rotating 3D preview, and a random choice button. `npm run test:fleet` verifies logos, paint, selection, persistence, cancellation, and mobile layout with the dev server running on port 4173.

Logo provenance is recorded in `public/brands/sources.json`. Images come from publisher app listings, Amazon's official imagery, and Wikimedia's Flipkart Minutes image. `scripts/fetch-brand-assets.mjs` refreshes those assets. Brand names and logos belong to their respective owners; this game is unaffiliated with them.

## Limits

No multiplayer, combat, interiors, story campaign, licensed assets, or AAA world simulation. Police and traffic use simplified navigation. Browser/device compatibility and long-session balancing require broader testing before a commercial release.
