import * as tls from "node:tls";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fetchOSMScenery } from "./osm-scenery.mjs";
if (existsSync(".env")) loadEnvFile(".env");
if (tls.setDefaultCACertificates && tls.getCACertificates)
  tls.setDefaultCACertificates([
    ...tls.getCACertificates("default"),
    ...tls.getCACertificates("system"),
  ]);

const cache = new Map(),
  pending = new Map(),
  requests = new Map();
let lastScenery = 0;
const agent =
  "NeonCoastIndia/1.0 (geographic driving game; development instance)";
function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}
function number(value, min, max) {
  if (value === null || value === "") throw fail("Missing coordinate.");
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    throw fail("Invalid India coordinate.");
  return n;
}
async function fetchJSON(url, timeout = 25000) {
  const response = await fetch(url, {
    headers: { "User-Agent": agent, Accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok)
    throw fail(
      `Map provider unavailable (HTTP ${response.status}). Try again later.`,
      503,
    );
  const text = await response.text();
  if (text.length > 12000000)
    throw fail("Map response is too large. Choose a shorter trip.", 502);
  try {
    return JSON.parse(text);
  } catch {
    throw fail("Map provider returned an unreadable response.", 502);
  }
}
export async function mapsHandler(
  req,
  res,
  next = () => {
    res.writeHead(404);
    res.end();
  },
) {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/api/india/")) return next();
  const send = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": status === 200 ? "private, max-age=300" : "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  };
  try {
    if (req.method !== "GET") throw fail("GET required.", 405);
    const ip = req.socket.remoteAddress || "local",
      now = Date.now();
    const rate = requests.get(ip);
    if (!rate || now - rate.start > 60000)
      requests.set(ip, { start: now, count: 1 });
    else if (++rate.count > 45)
      throw fail("Too many map requests. Wait a minute.", 429);
    if (requests.size > 1000)
      for (const [key, value] of requests)
        if (now - value.start > 60000) requests.delete(key);
    const key = url.pathname + url.search,
      cached = cache.get(key);
    if (cached && now - cached.time < 86400000) {
      send(200, cached.value);
      return;
    }
    if (!pending.has(key))
      pending.set(
        key,
        (async () => {
          if (url.pathname === "/api/india/search") {
            const q = url.searchParams.get("q")?.trim();
            if (!q || q.length < 2 || q.length > 100)
              throw fail("Enter a place name of 2 to 100 characters.");
            const base =
              process.env.INDIA_GEOCODER_URL || "https://photon.komoot.io/api/";
            const target = new URL(base);
            target.search = new URLSearchParams({
              q,
              limit: "8",
              lang: "en",
              bbox: "68,6,98,37",
            }).toString();
            const result = await fetchJSON(target);
            return {
              places: (result.features || [])
                .filter(
                  (f) =>
                    f.properties?.countrycode?.toUpperCase() === "IN" &&
                    f.geometry?.type === "Point",
                )
                .map((f) => ({
                  name: f.properties.name,
                  state: f.properties.state || f.properties.county || "India",
                  coordinates: f.geometry.coordinates,
                }))
                .filter((p) => p.name),
              source: "OpenStreetMap / Photon",
            };
          }
          if (url.pathname === "/api/india/route") {
            const from = [
                number(url.searchParams.get("fromLon"), 68, 98),
                number(url.searchParams.get("fromLat"), 6, 37),
              ],
              to = [
                number(url.searchParams.get("toLon"), 68, 98),
                number(url.searchParams.get("toLat"), 6, 37),
              ];
            const base = (
              process.env.INDIA_ROUTER_URL || "https://router.project-osrm.org"
            ).replace(/\/$/, "");
            const target = `${base}/route/v1/driving/${from.join(",")};${to.join(",")}?overview=full&geometries=geojson&steps=true`;
            const result = await fetchJSON(target, 35000);
            if (result.code !== "Ok" || !result.routes?.length)
              throw fail(
                "No drivable route found between these places. Try another pair.",
                422,
              );
            const route = result.routes[0];
            if (route.distance > 5000000)
              throw fail("This route exceeds the 5,000 km trip limit.", 422);
            return {
              distance: route.distance,
              duration: route.duration,
              coordinates: route.geometry.coordinates,
              steps: route.legs.flatMap((leg) =>
                leg.steps.map((s) => ({
                  distance: s.distance,
                  name: s.name,
                  ref: s.ref || "",
                  maneuver: s.maneuver,
                })),
              ),
              fetchedAt: new Date().toISOString(),
              source: "OpenStreetMap / OSRM",
              snapped: result.waypoints.map((w) => ({
                location: w.location,
                distance: w.distance,
              })),
            };
          }
          if (url.pathname === "/api/india/scenery") {
            const lat = number(url.searchParams.get("lat"), 6, 37),
              lon = number(url.searchParams.get("lon"), 68, 98);
            if (Date.now() - lastScenery < 12000)
              throw fail(
                "Scenery is cooling down. The road remains available.",
                429,
              );
            lastScenery = Date.now();
            if (!process.env.INDIA_SCENERY_URL)
              return fetchOSMScenery(lon, lat);
            const latDelta = 0.0135,
              lonDelta = 0.0135 / Math.cos((lat * Math.PI) / 180);
            const bounds = `${lat - latDelta},${lon - lonDelta},${lat + latDelta},${lon + lonDelta}`;
            const query = `[out:json][timeout:20];(way[building](${bounds});way[waterway~"river|canal|stream"](${bounds});way[natural~"water|wood"](${bounds});way[landuse~"forest|grass|farmland"](${bounds});way[bridge=yes](${bounds});way[highway~"motorway|trunk|primary|secondary|tertiary|residential"](${bounds});node[natural=tree](${bounds});node[place~"city|town|village"](${bounds});node[amenity~"fuel|restaurant"](${bounds}););out geom 650;`;
            const endpoint =
              process.env.INDIA_SCENERY_URL ||
              "https://overpass.private.coffee/api/interpreter";
            const result = await fetchJSON(
              `${endpoint}?data=${encodeURIComponent(query)}`,
              30000,
            );
            if (result.remark || !Array.isArray(result.elements))
              throw fail(
                "Scenery data is incomplete. Roads still work; retry later.",
                503,
              );
            return {
              elements: result.elements,
              center: [lon, lat],
              fetchedAt: new Date().toISOString(),
              source: "OpenStreetMap / Overpass",
              truncated: result.elements.length >= 650,
            };
          }
          throw fail("Unknown map request.", 404);
        })(),
      );
    try {
      const value = await pending.get(key);
      cache.set(key, { value, time: now });
      if (cache.size > 80) cache.delete(cache.keys().next().value);
      send(200, value);
    } finally {
      pending.delete(key);
    }
  } catch (error) {
    send(error.status || 503, {
      error:
        error.name === "TimeoutError"
          ? "Map service timed out. Try again."
          : error.status
            ? error.message
            : "Map service could not be reached. Check your connection and retry.",
    });
  }
}
