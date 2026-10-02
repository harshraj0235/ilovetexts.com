import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  createIcons,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowDownUp,
  Search,
  Route,
  Map,
  Play,
  Camera,
  Pause,
  Package,
  PackageCheck,
  Navigation,
  LocateFixed,
  RotateCcw,
  X,
} from "lucide";
import { BRANDS, getBrand, loadSelectedBrand } from "../brands.js";
import { logosReady } from "../liveries.js";
import { CITIES, PRESETS } from "./cities.js";
import {
  prepareRoute,
  sampleRoute,
  distance,
  stepAt,
  rewardFor,
  restoreTrip,
  advanceTrip,
  recoverVehicle,
  vehicleCoordinate,
} from "./route.js";
import { createRoadWorld } from "./world.js";
import { createDrivingAudio } from "./audio.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
const drivingAudio = createDrivingAudio();
addEventListener('pointerdown', () => drivingAudio.unlock());
addEventListener('keydown', () => drivingAudio.unlock());
createIcons({
  icons: {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    ArrowDownUp,
    Search,
    Route,
    Map,
    Play,
    Camera,
    Pause,
    Package,
    PackageCheck,
    Navigation,
    LocateFixed,
    RotateCcw,
    X,
  },
});
const storage = { getItem: (key) => localStorage.getItem(key) };
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
let places = { from: CITIES[0], to: CITIES[1] },
  planned = null,
  trip = null,
  world = null,
  paused = false,
  currentBrand = loadSelectedBrand(storage),
  sceneryCenter = null,
  sceneryTime = 0,
  sceneryBusy = false,
  follow = true,
  session = 0,
  plannerRequest = 0;
let savedTrip = restoreTrip(read("neon-india-trip-v1"));
let wallet;
try {
  wallet = JSON.parse(read("neon-india-wallet-v1"));
} catch {}
if (
  !wallet ||
  !Number.isFinite(wallet.cash) ||
  wallet.cash < 0 ||
  !Array.isArray(wallet.receipts) ||
  !wallet.receipts.every((id) => typeof id === "string")
)
  wallet = { cash: 0, receipts: [] };
if (savedTrip && wallet.receipts.includes(savedTrip.id)) savedTrip.delivered = true;
const keys = new Set(),
  apiControllers = new Set();
const km = (value) =>
  `${(value / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`;
const money = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;
function time(value) {
  const m = Math.round(value / 60);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function status(message, error = false) {
  $("plan-status").textContent = message;
  $("plan-status").classList.toggle("error", error);
}
let toastUntil = 0;
function toast(message) {
  $("trip-toast").textContent = message;
  $("trip-toast").classList.add("visible");
  toastUntil = performance.now() + 4500;
}
function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    $("trip-save").textContent = "Saving unavailable";
    return false;
  }
}
function saveTrip() {
  if (!trip) return;
  const raw = {
    id: trip.id,
    route: {
      from: trip.route.from,
      to: trip.route.to,
      distance: trip.route.distance,
      duration: trip.route.duration,
      coordinates: trip.route.coordinates,
      steps: trip.route.steps,
      source: trip.route.source,
      fetchedAt: trip.route.fetchedAt,
    },
    travelled: trip.travelled,
    scale: trip.scale,
    delivered: trip.delivered,
    position: trip.position,
    heading: trip.heading,
  };
  if (persist("neon-india-trip-v1", raw))
    $("trip-save").textContent = "Progress saved locally";
  savedTrip = restoreTrip(JSON.stringify(raw));
}
async function api(path, params) {
  const controller = new AbortController();
  apiControllers.add(controller);
  const timeout = setTimeout(() => controller.abort(), 38000);
  try {
    const r = await fetch(`/api/india/${path}?${new URLSearchParams(params)}`, {
      signal: controller.signal,
    });
    let data;
    try {
      data = await r.json();
    } catch {
      throw Error(
        "Map service is unavailable. Start the game server and retry.",
      );
    }
    if (!r.ok) throw Error(data.error || "Map service unavailable");
    return data;
  } finally {
    clearTimeout(timeout);
    apiControllers.delete(controller);
  }
}

for (const brand of BRANDS) {
  const option = document.createElement("option");
  option.value = brand.id;
  option.textContent = brand.name;
  $("brand-select").append(option);
}
$("brand-select").value = currentBrand.id;
$("brand-select").onchange = () => {
  currentBrand = getBrand($("brand-select").value);
  try {
    localStorage.setItem("neon-coast-brand-v1", currentBrand.id);
  } catch {}
};
const tileURL =
  import.meta.env.VITE_INDIA_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileAttribution =
  import.meta.env.VITE_INDIA_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const planningMap = L.map("planning-map", {
  zoomAnimation: false,
  zoomControl: true,
  preferCanvas: true,
}).setView([23.3, 79], 5);
const addTiles = (map) => {
  const layer = L.tileLayer(tileURL, {
    attribution: tileAttribution,
    maxZoom: 19,
    keepBuffer: 1,
    updateWhenIdle: true,
  });
  layer.on("tileerror", () => {
    $("map-status").textContent = "Map tiles unavailable · route still visible";
  });
  layer.addTo(map);
  return layer;
};
addTiles(planningMap);
let planLine,
  planMarkers = [],
  drivingMap,
  driveLine,
  driveMarker;
const icon = (end) =>
  L.divIcon({
    className: "",
    html: `<div class="route-point${end ? " end" : ""}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
function plotRoute(map, route, driving = false) {
  const coords = route.coordinates.map((c) => [c[1], c[0]]);
  if (driving) {
    driveLine?.remove();
    driveLine = L.polyline(coords, {
      color: "#e66c44",
      weight: 5,
      opacity: 0.85,
    }).addTo(map);
  } else {
    planLine?.remove();
    planMarkers.forEach((m) => m.remove());
    planLine = L.polyline(coords, { color: "#206e54", weight: 5 }).addTo(map);
    planMarkers = [
      L.marker(coords[0], { icon: icon(false) }).addTo(map),
      L.marker(coords.at(-1), { icon: icon(true) }).addTo(map),
    ];
    for (const [i, m] of planMarkers.entries()) {
      const label = document.createElement("strong");
      label.textContent = i ? route.to.name : route.from.name;
      m.bindPopup(label);
    }
    map.fitBounds(planLine.getBounds(), { padding: [35, 35], maxZoom: 12, animate: false });
  }
}
function invalidatePlan() {
  plannerRequest++;
  planned = null;
  $("route-summary").hidden = true;
  status("Select both places, then find a driving route.");
}
function selectPlace(field, place) {
  places[field] = place;
  $(`${field}-input`).value = place.name;
  $(`${field}-results`).hidden = true;
  invalidatePlan();
}
function renderPlaces(field, items) {
  const box = $(`${field}-results`);
  box.replaceChildren();
  box.hidden = false;
  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "No places found. Try a nearby town.";
    box.append(p);
  }
  for (const place of items) {
    const button = document.createElement("button");
    button.type = "button";
    const name = document.createElement("strong"),
      state = document.createElement("small");
    name.textContent = place.name;
    state.textContent = place.state;
    button.append(name, state);
    button.onclick = () => selectPlace(field, place);
    box.append(button);
  }
}
const searchTokens = { from: 0, to: 0 };
async function search(field) {
  const token = ++searchTokens[field],
    q = $(`${field}-input`).value.trim();
  if (q.length < 2) {
    status("Enter at least two characters.", true);
    return;
  }
  const button = $(`${field}-search`);
  button.disabled = true;
  status("Searching places in India...");
  try {
    const data = await api("search", { q });
    if (token !== searchTokens[field]) return;
    renderPlaces(field, data.places);
    status("Choose a search result to set the location.");
  } catch (error) {
    if (token === searchTokens[field]) {
      const local = CITIES.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase()),
      );
      renderPlaces(field, local);
      status(`${error.message} Showing saved city matches.`, true);
    }
  } finally {
    button.disabled = false;
  }
}
for (const field of ["from", "to"]) {
  $(`${field}-input`).oninput = () => {
    searchTokens[field]++;
    places[field] = null;
    invalidatePlan();
    const q = $(`${field}-input`).value.trim().toLowerCase();
    renderPlaces(
      field,
      CITIES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8),
    );
  };
  $(`${field}-input`).onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search(field);
    }
    if (e.key === "Escape") $(`${field}-results`).hidden = true;
  };
  $(`${field}-search`).onclick = () => search(field);
}
document.addEventListener("click", (e) => {
  for (const field of ["from", "to"])
    if (!e.target.closest(".place-field")) $(`${field}-results`).hidden = true;
});
$("swap").onclick = () => {
  const from = places.from,
    to = places.to;
  const fromText = $("from-input").value,
    toText = $("to-input").value;
  places = { from: to, to: from };
  $("from-input").value = toText;
  $("to-input").value = fromText;
  invalidatePlan();
};
function showPlan(route, snapshot = false) {
  planned = route;
  plotRoute(planningMap, route);
  $("route-km").textContent = km(route.distance);
  $("route-time").textContent = time(route.duration);
  $("route-reward").textContent = money(rewardFor(route));
  $("route-source").textContent =
    `${snapshot ? "Included route snapshot" : "Online road route"} · ${new Date(route.fetchedAt || Date.now()).toLocaleDateString("en-IN")} · OpenStreetMap / OSRM`;
  $("route-summary").hidden = false;
  status("Route ready. Your parcel is waiting at the pickup.");
}
async function plan() {
  if (!places.from || !places.to) {
    status("Choose a pickup and destination from the search results.", true);
    return;
  }
  if (distance(places.from.coordinates, places.to.coordinates) < 100) {
    status("Choose two different places, at least 100 metres apart.", true);
    return;
  }
  const token = ++plannerRequest,
    from = places.from,
    to = places.to;
  $("plan-route").disabled = true;
  $("route-summary").hidden = true;
  planned = null;
  status("Finding roads between your pickup and destination...");
  try {
    const data = await api("route", {
      fromLon: from.coordinates[0],
      fromLat: from.coordinates[1],
      toLon: to.coordinates[0],
      toLat: to.coordinates[1],
    });
    if (token !== plannerRequest) return;
    if (data.snapped?.some((p) => p.distance > 5000))
      throw Error(
        "One place is more than 5 km from a reachable road. Choose a nearby road or town.",
      );
    showPlan(prepareRoute({ ...data, from, to }));
  } catch (error) {
    if (token !== plannerRequest) return;
    if (distance(from.coordinates, CITIES[0].coordinates) < 100 && distance(to.coordinates, CITIES[1].coordinates) < 100) {
      try {
        const raw = await (await fetch(`${import.meta.env.BASE_URL}routes/delhi-rishikesh.json`)).json();
        if (token !== plannerRequest) return;
        showPlan(prepareRoute(raw), true);
        status(
          "Online routing unavailable. Using the dated Delhi–Rishikesh road snapshot.",
        );
      } catch {
        status(error.message, true);
      }
    } else status(error.message, true);
  } finally {
    $("plan-route").disabled = false;
  }
}
$("plan-route").onclick = plan;
for (const [from, to] of PRESETS) {
  const button = document.createElement("button");
  button.textContent = `${from} → ${to}`;
  button.onclick = () => {
    places = {
      from: CITIES.find((p) => p.name === from),
      to: CITIES.find((p) => p.name === to),
    };
    $("from-input").value = from;
    $("to-input").value = to;
    invalidatePlan();
    plan();
  };
  $("presets").append(button);
}
async function initialPlan() {
  const token = plannerRequest;
  try {
    const raw = await (await fetch(`${import.meta.env.BASE_URL}routes/delhi-rishikesh.json`)).json();
    if (token === plannerRequest) showPlan(prepareRoute(raw), true);
  } catch {
    status("Choose two places and find a driving route.");
  }
}
initialPlan();
if (savedTrip && !savedTrip.delivered) {
  $("resume-trip").hidden = false;
  $("resume-trip").textContent =
    `Resume ${savedTrip.route.from.name} → ${savedTrip.route.to.name}`;
}

async function startTrip(restored = null) {
  if (!restored && !planned) return;
  $("start-trip").disabled = true;
  try {
    await logosReady;
    if (!world) world = createRoadWorld($("trip-world"));
    session++;
    trip = restored || {
      id: crypto.randomUUID(),
      route: planned,
      travelled: 0,
      scale: Number($("pace").value),
      speed: 0,
      lane: -2.1,
      arrived: false,
      delivered: false,
    };
    if (wallet.receipts.includes(trip.id)) {
      trip.delivered = true;
      trip.arrived = true;
    }
    world.setRoute(trip.route, currentBrand);
    if (!trip.position) recoverVehicle(trip);
    $("drive-mode").textContent = trip.scale === 1 ? "MANUAL STEERING" : "ROUTE ASSIST";
    $("trip-gear").hidden = trip.scale !== 1;
    $("trip-gear").textContent = "D";
    sceneryCenter = null;
    sceneryTime = 0;
    sceneryBusy = false;
    paused = false;
    keys.clear();
    $("planner").hidden = true;
    $("trip-screen").hidden = false;
    document.body.style.overflow = "hidden";
    world.resize();
    $("trip-quality").value = matchMedia("(pointer:coarse)").matches
      ? "low"
      : "high";
    $("delivery-title").textContent =
      `${trip.route.from.name} → ${trip.route.to.name}`;
    $("trip-brand").textContent = currentBrand.name;
    $("trip-reward").textContent = money(rewardFor(trip.route));
    $("trip-pace").textContent =
      trip.scale === 1 ? "REAL DISTANCE · 1×" : `${trip.scale}× DISTANCE`;
    $("trip-cash").textContent = money(wallet.cash);
    $("nearest-place").textContent = trip.route.from.name.toUpperCase();
    $("scenery-status").textContent = "Loading nearby mapped features...";
    if (!drivingMap) {
      drivingMap = L.map("driving-map", {
        preferCanvas: true,
        zoomControl: false,
        attributionControl: true,
      });
      addTiles(drivingMap);
      drivingMap.on("dragstart", () => {
        follow = false;
      });
    }
    drivingMap.invalidateSize();
    plotRoute(drivingMap, trip.route, true);
    driveMarker?.remove();
    const coordinate = sampleRoute(trip.route, trip.travelled).coordinate;
    driveMarker = L.marker([coordinate[1], coordinate[0]], {
      icon: L.divIcon({
        className: "",
        html: '<div class="map-car"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(drivingMap);
    drivingMap.setView([coordinate[1], coordinate[0]], 14);
    follow = true;
    saveTrip();
    updateHUD();
    loadScenery(true);
    toast("Hold W / ↑ or the accelerator pedal to drive. A / D to steer.");
  } catch (error) {
    status(`Could not start the trip: ${error.message}`, true);
    $("planner").hidden = false;
    $("trip-screen").hidden = true;
    document.body.style.overflow = "";
    trip = null;
  } finally {
    $("start-trip").disabled = false;
  }
}
$("start-trip").onclick = () => startTrip();
$("resume-trip").onclick = () => startTrip(savedTrip);
function pause() {
  if (!trip || $("planner").hidden === false || $("arrival-dialog").open)
    return;
  paused = true;
  keys.clear();
  saveTrip();
  if (!$("trip-menu").open) $("trip-menu").showModal();
}
function unpause() {
  $("trip-menu").close();
  paused = false;
  keys.clear();
}
function planner() {
  saveTrip();
  session++;
  for (const controller of apiControllers) controller.abort();
  paused = true;
  keys.clear();
  $("trip-menu").close();
  $("arrival-dialog").close();
  $("trip-screen").hidden = true;
  $("planner").hidden = false;
  document.body.style.overflow = "";
  planningMap.invalidateSize();
  $("resume-trip").hidden = !savedTrip || savedTrip.delivered;
  if (savedTrip)
    $("resume-trip").textContent =
      `Resume ${savedTrip.route.from.name} → ${savedTrip.route.to.name}`;
}
$("trip-pause").onclick = pause;
$("close-trip-menu").onclick = unpause;
$("continue-trip").onclick = unpause;
$("trip-menu").addEventListener("cancel", (e) => {
  e.preventDefault();
  unpause();
});
$("return-planner").onclick = planner;
$("menu-planner").onclick = planner;
$("another-trip").onclick = planner;
$("trip-camera").onclick = () => world?.camera();
$("trip-sound").onclick = () => {
  const enabled = drivingAudio.toggle();
  $("trip-sound").textContent = enabled ? 'Sound on' : 'Sound off';
  $("trip-sound").setAttribute('aria-pressed', String(enabled));
};
$("trip-recover").onclick = () => {
  if (!trip || trip.delivered) return;
  keys.clear();
  recoverVehicle(trip);
  world.resetCamera();
  saveTrip();
  updateMap();
  toast("Car recovered on the road.");
};
$("trip-gear").onclick = () => {
  if (!trip || trip.scale !== 1 || trip.arrived) return;
  if (trip.speed > 0.3) return toast("Stop before changing gear.");
  trip.gear = trip.gear === -1 ? 1 : -1;
  $("trip-gear").textContent = trip.gear === -1 ? "R" : "D";
};
$("trip-quality").onchange = (e) => world?.quality(e.target.value);
$("follow-map").onclick = () => {
  follow = true;
  updateMap();
};
function deliver() {
  if (!trip?.arrived || trip.delivered || wallet.receipts.includes(trip.id))
    return;
  const reward = rewardFor(trip.route);
  wallet = {
    cash: wallet.cash + reward,
    receipts: [...wallet.receipts, trip.id],
  };
  if (!persist("neon-india-wallet-v1", wallet))
    toast("Delivery completed, but browser storage is unavailable.");
  trip.delivered = true;
  saveTrip();
  $("deliver").hidden = true;
  paused = true;
  $("trip-cash").textContent = money(wallet.cash);
  $("arrival-title").textContent = `Delivered in ${trip.route.to.name}.`;
  $("arrival-copy").textContent =
    `${currentBrand.name} parcel delivered from ${trip.route.from.name}. ${km(trip.route.distance)} of mapped roads travelled${trip.scale === 1 ? "" : ` at ${trip.scale}× distance`}.`;
  $("arrival-reward").textContent = `+${money(reward)}`;
  $("arrival-dialog").showModal();
}
$("deliver").onclick = deliver;
$("arrival-dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  planner();
});
let cachedFeatures = [];
async function loadScenery(initial = false) {
  if (
    !trip ||
    sceneryBusy ||
    (!initial && performance.now() - sceneryTime < 15000)
  )
    return;
  const coordinate = sampleRoute(trip.route, trip.travelled).coordinate;
  if (!initial && sceneryCenter && distance(coordinate, sceneryCenter) < 350)
    return;
  sceneryBusy = true;
  sceneryTime = performance.now();
  const generation = session;
  let usedSnapshot = false;
  try {
    if (
      initial &&
      distance(trip.route.coordinates[0], CITIES[0].coordinates) < 500 &&
      trip.travelled < 350
    ) {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}routes/delhi-rishikesh-scenery.json`);
        if (response.ok) {
          const data = await response.json();
          if (generation !== session) return;
          world.setFeatures(data.elements);
          cachedFeatures = data.elements;
          sceneryCenter = data.center;
          usedSnapshot = true;
          $("scenery-status").textContent =
            `${data.elements.length} mapped features · included snapshot · simplified shapes`;
        }
      } catch {}
    }
    if (usedSnapshot) return;
    $("scenery-status").textContent = "Loading nearby OpenStreetMap scenery...";
    const data = await api("scenery", {
      lon: coordinate[0].toFixed(3),
      lat: coordinate[1].toFixed(3),
    });
    if (generation !== session) return;
    world.setFeatures(data.elements);
    cachedFeatures = data.elements;
    sceneryCenter = data.center;
    $("scenery-status").textContent =
      `${data.elements.length} mapped features${data.truncated ? " (partial coverage)" : ""} · simplified shapes`;
    const names = data.elements.filter((e) => e.tags?.place && e.tags?.name);
    if (names.length) $("nearest-place").textContent = names[0].tags.name;
  } catch (error) {
    if (generation === session) {
      $("scenery-status").textContent =
        "Nearby scenery unavailable. Real route remains active; retrying as you drive.";
      sceneryCenter = null;
    }
  } finally {
    if (generation === session) sceneryBusy = false;
  }
}
function updateMap() {
  if (!trip || !drivingMap) return;
  const coordinate = vehicleCoordinate(trip),
    latlng = [coordinate[1], coordinate[0]];
  driveMarker.setLatLng(latlng);
  if (follow)
    drivingMap.setView(latlng, drivingMap.getZoom(), { animate: false });
}
function updateHUD() {
  if (!trip) return;
  $("trip-speed").textContent = Math.round(trip.speed * 3.6);
  $("trip-progress").value = trip.travelled / trip.route.length;
  $("trip-covered").textContent =
    `${km((trip.route.distance * trip.travelled) / trip.route.length)} travelled`;
  $("trip-remaining").textContent =
    `${km(trip.route.distance * (1 - trip.travelled / trip.route.length))} left`;
  $("deliver").hidden = !trip.arrived || trip.delivered;
  const { current, next } = stepAt(trip.route, trip.travelled);
  $("road-name").textContent = trip.arrived
    ? "Destination reached"
    : current?.name || current?.ref || "Local road";
  const modifier =
    next?.maneuver?.modifier || next?.maneuver?.type || "continue";
  $("next-turn").textContent = trip.arrived
    ? "Stop here and deliver your parcel."
    : next
      ? `${km(Math.max(0, next.start - trip.travelled))} · ${modifier.replaceAll("-", " ")}${next.name ? " onto " + next.name : ""}`
      : `Continue to ${trip.route.to.name}`;
}
const normalize = (key) =>
  ({ ArrowUp: "w", ArrowDown: "s", ArrowLeft: "a", ArrowRight: "d" })[key] ||
  (key.length === 1 ? key.toLowerCase() : key);
addEventListener("keydown", (e) => {
  if (!trip || !$("planner").hidden) return;
  const key = normalize(e.key);
  if (["w", "a", "s", "d", " "].includes(key) && !paused) e.preventDefault();
  if (key === "Escape" && !paused) {
    e.preventDefault();
    pause();
    return;
  }
  if (!paused) {
    keys.add(key);
    if (key === "c" && !e.repeat) world.camera();
  }
});
addEventListener("keyup", (e) => keys.delete(normalize(e.key)));
addEventListener("blur", () => {
  keys.clear();
  pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
addEventListener("pagehide", saveTrip);
document.querySelectorAll("[data-drive]").forEach((button) => {
  button.onpointerdown = (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    if (!trip || paused || trip.arrived) return;
    keys.add(button.dataset.drive);
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(event, () => keys.delete(button.dataset.drive));
});
let last = performance.now(),
  hudTime = 0,
  mapTime = 0,
  saveTime = 0,
  lastCollision = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.25, (now - last) / 1000));
  last = now;
  drivingAudio.update(trip, trip && $("planner").hidden && !paused && !trip.arrived, keys.has('w'));
  if (trip && $("planner").hidden) {
    if (!paused) {
      const wasArrived = trip.arrived;
      // Substeps preserve real-time movement on slower devices without unstable steering.
      for (let remaining = dt; remaining > 0; remaining -= 1 / 60) advanceTrip(
        trip,
        Math.min(remaining, 1 / 60),
        keys.has("w"),
        keys.has("s") || keys.has(" "),
        (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0),
      );
      trip.braking = keys.has("s") || keys.has(" ");
      document.querySelectorAll('[data-drive]').forEach(button => {
        button.classList.toggle('pressed', keys.has(button.dataset.drive));
      });
      if (!wasArrived && trip.arrived) {
        toast("You made it. Deliver the parcel to collect your reward.");
        saveTrip();
      }
      if (now > toastUntil) $("trip-toast").classList.remove("visible");
    }
    const collision = world.render(trip, dt, paused);
    if (collision && !paused && now - lastCollision > 1500) {
      trip.speed *= 0.4;
      lastCollision = now;
      toast("Traffic ahead. Change lane and slow down.");
    }
    hudTime += dt;
    mapTime += dt;
    saveTime += dt;
    if (hudTime > 0.1) {
      updateHUD();
      hudTime = 0;
    }
    if (mapTime > 0.15) {
      updateMap();
      mapTime = 0;
      if (!paused) loadScenery();
    }
    if (saveTime > 3) {
      saveTrip();
      saveTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.indiaRoadTrip = {
  snapshot: () => ({
    planned: planned
      ? {
          distance: planned.distance,
          coordinates: planned.coordinates.length,
          from: planned.from.name,
          to: planned.to.name,
        }
      : null,
    trip: trip
      ? {
          id: trip.id,
          travelled: trip.travelled,
          length: trip.route.length,
          speed: trip.speed,
          lane: trip.lane,
          heading: trip.heading,
          steerAngle: trip.steerAngle,
          gear: trip.gear,
          scale: trip.scale,
          arrived: trip.arrived,
          delivered: trip.delivered,
          coordinate: vehicleCoordinate(trip),
        }
      : null,
    paused,
    wallet: wallet.cash,
    world: world?.snapshot(),
    scenery: cachedFeatures.length,
  }),
  canvasProbe: () => world?.probe(),
};
