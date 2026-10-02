import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as CANNON from 'cannon-es';
import { createIcons, VolumeX, Volume2, Pause, ArrowUpRight, Maximize2, LogOut, Wrench, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, Keyboard, X, CarFront, Shuffle } from 'lucide';
import { CONTRACTS, readSave, advanceMission } from './game-state.js';
import { loadSelectedBrand, shuffledFleet } from './brands.js';
import { applyLivery, logosReady, logoStatus } from './liveries.js';
import { createGarage } from './garage.js';
import './style.css';
import './fleet.css';

const $ = (id) => document.getElementById(id);
const icons = { VolumeX, Volume2, Pause, ArrowUpRight, Maximize2, LogOut, Wrench, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, Keyboard, X, CarFront, Shuffle };
createIcons({ icons });
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
catch { $('loading-copy').textContent = 'WebGL is unavailable. Enable hardware acceleration and reload to play.'; throw new Error('WebGL unavailable'); }
const mobileQuality = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(mobileQuality ? 1 : Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !mobileQuality;
$('quality').value = mobileQuality ? 'low' : 'high';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
$('world').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9ebfba');
scene.fog = new THREE.Fog('#b8cdc0', 125, 470);
const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, .1, 800);
const hemi = new THREE.HemisphereLight('#e9f2dc', '#67826b', 2.8); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe4ba', 3.4); sun.position.set(-100, 140, 80); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, far: 400 }); sun.shadow.bias = -.0006; scene.add(sun);
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.defaultContactMaterial.friction = .03;
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }); groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(groundBody);
const materials = new Map();
function mat(color, roughness = .8) { const key = color + roughness; if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness })); return materials.get(key); }
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, color, x, y, z, parent = scene) { const o = new THREE.Mesh(boxGeo, mat(color)); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = h > .5; o.receiveShadow = true; parent.add(o); return o; }
function solid(w, h, d, x, y, z) { const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)) }); b.position.set(x, y, z); world.addBody(b); }
let seed = 42;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
box(450, .3, 450, '#719389', 0, -.25, 0);
box(1100, .15, 1100, '#559d9e', 0, -.8, 0);
box(40, .3, 450, '#ded7ac', 242, -.25, 0);
const roads = [-180, -90, 0, 90, 180];
const buildings = [];
for (const r of roads) {
  box(22, .06, 430, '#4d625f', r, .01, 0); box(430, .07, 22, '#4d625f', 0, .015, r);
  for (let i = -210; i < 210; i += 12) {
    if (!roads.some(v => Math.abs(v - i) < 16)) { box(.22, .03, 5, '#e8dfa5', r, .08, i); box(5, .03, .22, '#e8dfa5', i, .09, r); }
  }
}
for (let bx = -135; bx <= 135; bx += 90) for (let bz = -135; bz <= 135; bz += 90) {
  box(64, .55, 64, '#b5c6b2', bx, .2, bz);
  for (let k = 0; k < 4; k++) {
    const x = bx + (k % 2 ? 16 : -16), z = bz + (k > 1 ? 16 : -16);
    const h = 10 + rand() * (bx < 0 ? 47 : 21), w = 19 + rand() * 6, d = 21 + rand() * 5;
    const colors = ['#d9d9c0', '#b9d5c6', '#e4c7b7', '#a8c7c1', '#e8dfcc', '#9bb3b4'];
    box(w, h, d, colors[Math.floor(rand() * colors.length)], x, h / 2 + .6, z); solid(w, h, d, x, h / 2, z);
    buildings.push({ x, z, w, d });
    box(w + .8, .7, d + .8, '#edf0d9', x, h + .6, z);
    box(w * .5, 2, d * .5, '#819b92', x, h + 1.7, z);
    for (let yy = 4; yy < h - 1; yy += 4.4) {
      box(w + .08, 1.55, d + .08, '#648f91', x, yy, z);
      for (let xx = -w / 2 + 1; xx < w / 2; xx += 4) box(.35, 2, d + .15, '#d3d8be', x + xx, yy, z);
    }
    box(w + .5, .5, 3.5, k % 2 ? '#ed927c' : '#82bdaa', x, 3, z + d / 2 + 1.5);
  }
}
const palmTrunk = new THREE.CylinderGeometry(.28, .55, 9, 7);
const leafGeo = new THREE.ConeGeometry(1.5, 7, 4);
function palm(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  const t = new THREE.Mesh(palmTrunk, mat('#9e9370')); t.position.y = 4.5; t.rotation.z = .07; t.castShadow = true; g.add(t);
  for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(leafGeo, mat(i % 2 ? '#417d63' : '#60936c')); const angle = i * Math.PI * 2 / 7; leaf.position.set(Math.sin(angle) * 2, 9, Math.cos(angle) * 2); leaf.rotation.set(Math.cos(angle) * 1.2, angle, Math.sin(angle) * 1.2); leaf.scale.set(.65, 1, .22); leaf.castShadow = true; g.add(leaf); }
}
for (let z = -200; z <= 200; z += 20) { palm(200, z, 1.1); palm(16, z, .85); palm(-16, z, .85); box(1, .4, 3, '#ecdbc1', 214, .3, z); }
for (let x = -200; x <= 170; x += 25) { palm(x, -195, .9); palm(x, 105, .8); }
for (let z = -200; z < 200; z += 32) {
  box(.15, 7, .15, '#526e66', 12.5, 3.5, z); box(3, .16, .3, '#526e66', 11.3, 7, z); box(1.2, .1, .4, '#fff3be', 10.4, 6.9, z);
}
for (const r of roads) for (const q of roads) for (let i = -7; i < 9; i += 3) { box(1.6, .03, 4, '#cdd3bb', r + i, .11, q + 13); }
// Waterfront piers and sailboats make the coastline visible from the city.
for (let z = -150; z <= 150; z += 75) {
  box(45, .6, 5, '#aaac8c', 268, 0, z);
  box(4, 1.6, 10, '#f3efdb', 279, .2, z + 9); box(.14, 14, .14, '#d6ded3', 279, 7, z + 9);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(4, 11, 3), mat('#f6e9c8')); sail.scale.z = .04; sail.position.set(281, 8, z + 9); scene.add(sail);
}
function textSign(text, x, y, z, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d'); ctx.fillStyle = '#173c38'; ctx.fillRect(0, 0, 512, 128); ctx.fillStyle = color; ctx.font = 'bold 51px Arial'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 82);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(17, 4.25), new THREE.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, z); scene.add(mesh);
}
textSign('PALM HOTEL', -29, 10, -15.8, '#eeebad'); textSign('COAST CLUB', 29, 7, -15, '#ffbdac'); textSign('NEON COAST', -28, 26, 74, '#c6f7de');
// Batch the static city by material to keep draw calls low on mobile GPUs.
scene.updateMatrixWorld(true);
const batches = new Map(), staticMeshes = [];
scene.traverse(o => {
  if (!o.isMesh || o.material.map) return;
  if (!batches.has(o.material)) batches.set(o.material, []);
  batches.get(o.material).push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  staticMeshes.push(o);
});
staticMeshes.forEach(o => o.removeFromParent());
for (const [material, geometries] of batches) {
  const merged = mergeGeometries(geometries);
  const mesh = new THREE.Mesh(merged, material); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  geometries.forEach(g => g.dispose());
}
const wheelGeo = new THREE.CylinderGeometry(.55, .55, .36, 12);
function car(color, police = false) {
  const g = new THREE.Group();
  box(2.35, .6, 4.6, color, 0, .7, 0, g); box(2.25, .35, 4.25, color, 0, 1.05, 0, g);
  box(1.85, .7, 2.05, '#294c51', 0, 1.45, .2, g); box(1.9, .12, 1.3, color, 0, 1.85, .32, g);
  box(1.9, .07, .8, '#354e47', 0, 1.22, 1.85, g); box(2.4, .1, .5, color, 0, 1.45, 2.1, g);
  for (const x of [-1.16, 1.16]) for (const z of [-1.4, 1.45]) { const wheel = new THREE.Mesh(wheelGeo, mat('#243733')); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .55, z); g.add(wheel); const rim = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .38, 10), mat('#b7c3b9', .25)); rim.rotation.z = Math.PI / 2; rim.position.copy(wheel.position); g.add(rim); }
  for (const x of [-.75, .75]) { box(.55, .18, .06, '#fff2c6', x, .98, -2.32, g); box(.6, .15, .06, '#eb685c', x, .95, 2.32, g); }
  if (police) { box(2.38, .4, 2.1, '#edf0da', 0, .9, .2, g); box(1.2, .15, .35, '#364c48', 0, 1.96, .3, g); const light = box(.5, .18, .36, '#e76e69', -.35, 2.12, .3, g); const light2 = box(.5, .18, .36, '#81c8f3', .35, 2.12, .3, g); g.userData.lights = [light, light2]; }
  g.userData.paintParts = g.children.filter(part => part.material === mat(color));
  scene.add(g); return g;
}
let selectedBrand = loadSelectedBrand({ getItem: key => localStorage.getItem(key) });
const playerCar = car(selectedBrand.color);
applyLivery(playerCar, selectedBrand);
const body = new CANNON.Body({ mass: 1200, shape: new CANNON.Box(new CANNON.Vec3(1.15, .6, 2.25)), linearDamping: .1, fixedRotation: true }); body.position.set(5, 1, 42); world.addBody(body);
const person = new THREE.Group(); box(.65, .95, .4, '#efc174', 0, 1.2, 0, person); box(.42, .42, .42, '#d69f7b', 0, 1.95, 0, person); box(.25, .75, .3, '#254e51', -.2, .38, 0, person); box(.25, .75, .3, '#254e51', .2, .38, 0, person); scene.add(person); person.visible = false;
const walkBody = new CANNON.Body({ mass: 75, shape: new CANNON.Sphere(.6), fixedRotation: true }); walkBody.position.set(8, .7, 42); world.addBody(walkBody); walkBody.collisionFilterMask = 0;
const traffic = [];
const trafficBrands = shuffledFleet(20);
for (let i = 0; i < 20; i++) { const axis = i % 2, lane = roads[i % roads.length], dir = i % 3 ? 1 : -1; const mesh = car(trafficBrands[i].color); applyLivery(mesh, trafficBrands[i]); const b = new CANNON.Body({ type: CANNON.Body.KINEMATIC, shape: new CANNON.Box(new CANNON.Vec3(1.2, .8, 2.3)) }); const pos = -195 + rand() * 390; b.position.set(axis ? pos : lane + dir * 5, .85, axis ? lane + dir * 5 : pos); world.addBody(b); traffic.push({ mesh, body: b, axis, lane, dir, speed: 6 + rand() * 6 }); }
const cops = [];
for (let i = 0; i < 3; i++) { const mesh = car('#2e484b', true); mesh.visible = false; const b = new CANNON.Body({ mass: 1100, shape: new CANNON.Box(new CANNON.Vec3(1.2, .7, 2.3)), fixedRotation: true }); b.position.set(-180, 1, -180); b.collisionFilterMask = 0; world.addBody(b); cops.push({ mesh, body: b }); }
const marker = new THREE.Group(); scene.add(marker);
const ring = new THREE.Mesh(new THREE.TorusGeometry(7, .15, 8, 48), new THREE.MeshBasicMaterial({ color: '#f1ff8f' })); ring.rotation.x = Math.PI / 2; ring.position.y = .25; marker.add(ring);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 15, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#e9ff8d', transparent: true, opacity: .13, side: THREE.DoubleSide, depthWrite: false })); beam.position.y = 7.5; marker.add(beam); marker.visible = false;
let saved; try { saved = readSave(localStorage.getItem('neon-coast-v1')); } catch { saved = readSave(null); }
let cash = saved.cash, completed = saved.completed, mission = null, yaw = 0, speed = 0, health = 100, boost = 100, heat = 0, heatQuiet = 0, driving = true, paused = false, elapsed = 0, lastHit = -100, toastTime = 0, soundEnabled = false;
let audioContext, oscillator, volume;
const keys = new Set();
const garage = createGarage({
  buildCar: car,
  getSelected: () => selectedBrand,
  onOpen: () => { paused = true; keys.clear(); },
  onClose: () => { paused = false; keys.clear(); },
  onApply: brand => {
    selectedBrand = brand; applyLivery(playerCar, brand);
    try { localStorage.setItem('neon-coast-brand-v1', brand.id); }
    catch { $('save-status').textContent = 'SAVING UNAVAILABLE'; }
    updateVehicleName(); toast(`${brand.name} car selected.`);
  },
});
function updateVehicleName() { $('vehicle-name').textContent = driving ? selectedBrand.name.toUpperCase() : 'ON FOOT'; }
updateVehicleName();
function save() { try { localStorage.setItem('neon-coast-v1', JSON.stringify({ cash, completed })); $('save-status').textContent = 'PROGRESS SAVED LOCALLY'; } catch { $('save-status').textContent = 'SAVING UNAVAILABLE'; } }
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); toastTime = 4; }
function renderContract() {
  const contract = CONTRACTS[completed % CONTRACTS.length]; $('mission-title').textContent = contract.title; $('mission-copy').textContent = contract.copy; $('mission-kind').textContent = contract.kind; $('reward').textContent = '$' + contract.reward.toLocaleString(); $('mission-count').textContent = `${String(completed % 3 + 1).padStart(2, '0')} / 03`; $('start-mission').hidden = !!mission; $('start-mission').style.display = mission ? 'none' : 'flex'; $('progress-row').hidden = !mission;
}
function startMission() { if (mission) return; if (!driving) { toast('Get into your car to start a contract.'); return; } const contract = CONTRACTS[completed % 3]; mission = { contract, stage: 0, time: contract.seconds }; if (completed % 3 === 2) setHeat(3); renderContract(); toast('Contract accepted. Follow the yellow destination.'); updateMarker(); }
function updateMarker() { marker.visible = !!mission; if (mission) { const [x, z] = mission.contract.points[mission.stage]; marker.position.set(x, 0, z); $('objective').textContent = mission.contract.labels[mission.stage]; } }
function failMission(message) { mission = null; marker.visible = false; renderContract(); toast(message); }
function setHeat(value) {
  if (heat === 0 && value > 0) {
    const road = roads.reduce((a, b) => Math.abs(b - body.position.x) < Math.abs(a - body.position.x) ? b : a);
    const direction = body.position.z > 140 ? -1 : 1;
    cops.forEach((c, i) => { c.body.position.set(road + 5, 1, body.position.z + direction * (35 + i * 12)); c.body.velocity.setZero(); });
  }
  heat = Math.min(5, value); heatQuiet = 0;
  cops.forEach((c, i) => { c.mesh.visible = i < heat; c.body.collisionFilterMask = i < heat ? -1 : 0; });
}
body.addEventListener('collide', (event) => {
  if (!driving || elapsed - lastHit < .8 || event.body === groundBody) return;
  const impact = Math.abs(event.contact.getImpactVelocityAlongNormal());
  if (impact > 3) { lastHit = elapsed; health = Math.max(0, health - Math.min(30, impact * 1.2)); speed *= .35; if (traffic.some(t => t.body === event.body)) { setHeat(Math.max(heat, 1)); toast('Collision reported. Lose the police.'); } }
});
function toggleVehicle() {
  if (paused) return;
  if (driving) { if (Math.abs(speed) > 3) { toast('Stop the car before getting out.'); return; } driving = false; person.visible = true; walkBody.collisionFilterMask = -1; walkBody.position.set(body.position.x + 3.8 * Math.cos(yaw), 1, body.position.z - 3.8 * Math.sin(yaw)); walkBody.velocity.setZero(); }
  else if (walkBody.position.distanceTo(body.position) < 8) { driving = true; person.visible = false; walkBody.collisionFilterMask = 0; walkBody.velocity.setZero(); }
  else { toast('Move closer to your car to get in.'); return; }
  $('vehicle-button').querySelector('span').textContent = driving ? 'Exit vehicle' : 'Enter vehicle'; updateVehicleName();
}
function recover(penalty = true) { const pos = driving ? body.position : walkBody.position; const nearest = roads.reduce((a, b) => Math.abs(b - pos.x) < Math.abs(a - pos.x) ? b : a); body.position.set(nearest + 5, 1.2, Math.max(-195, Math.min(195, pos.z))); body.velocity.setZero(); speed = 0; yaw = 0; body.quaternion.setFromEuler(0, 0, 0); if (!driving) { walkBody.position.set(nearest + 9, 1, body.position.z); } if (penalty) { if (mission) failMission('Recovery cancelled the contract. Try again.'); else toast('Back on the road.'); } }
function repair() { if (!driving) { toast('Return to your car to repair it.'); return; } if (health >= 100) { toast('Your Comet is already in perfect condition.'); return; } if (Math.abs(speed) > 2 || heat > 0) { toast('Stop the car and lose the police before repairing.'); return; } if (cash < 150) { toast('You need $150 for a repair.'); return; } cash -= 150; health = 100; save(); toast('Comet repaired. Ready for another run.'); }
function setSound(enabled) {
  soundEnabled = enabled;
  if (enabled && !audioContext) { audioContext = new AudioContext(); oscillator = audioContext.createOscillator(); volume = audioContext.createGain(); oscillator.type = 'sawtooth'; oscillator.connect(volume); volume.connect(audioContext.destination); volume.gain.value = 0; oscillator.start(); }
  if (enabled) audioContext.resume().catch(() => {});
  if (volume) volume.gain.value = enabled && !paused ? .018 : 0;
  $('sound-setting').checked = enabled; $('sound').innerHTML = `<i data-lucide="${enabled ? 'volume-2' : 'volume-x'}"></i>`; createIcons({ icons });
}
function openMenu(help = false) { if ($('map-dialog').open) $('map-dialog').close(); paused = true; keys.clear(); $('menu-title').textContent = help ? 'Make your own way.' : 'Take a breather.'; $('menu-subtitle').textContent = help ? 'Your keys to the coast.' : 'The coast will be here.'; if (!$('menu').open) $('menu').showModal(); }
function closeMenu() { $('menu').close(); paused = false; keys.clear(); }
function openMap() { paused = true; keys.clear(); drawMap($('city-map'), true); $('map-dialog').showModal(); }
function closeMap() { $('map-dialog').close(); paused = false; keys.clear(); }
$('start-mission').onclick = startMission; $('vehicle-button').onclick = toggleVehicle; $('garage-button').onclick = repair; $('recover-button').onclick = () => recover(); $('sound').onclick = () => setSound(!soundEnabled); $('sound-setting').onchange = e => setSound(e.target.checked); $('pause').onclick = () => openMenu(); $('help-button').onclick = () => openMenu(true); $('close-menu').onclick = closeMenu; $('resume').onclick = closeMenu; $('map-button').onclick = openMap; $('close-map').onclick = closeMap;
$('menu').addEventListener('cancel', e => { e.preventDefault(); closeMenu(); }); $('map-dialog').addEventListener('cancel', e => { e.preventDefault(); closeMap(); });
$('quality').onchange = e => { renderer.setPixelRatio(e.target.value === 'low' ? 1 : Math.min(devicePixelRatio, 1.7)); renderer.shadowMap.enabled = e.target.value !== 'low'; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); };
$('reset').onclick = () => { if (!confirm('Reset your balance and completed contracts?')) return; cash = 500; completed = 0; mission = null; health = 100; boost = 100; setHeat(0); save(); renderContract(); updateMarker(); recover(false); closeMenu(); toast('A fresh start on the coast.'); };
const normalize = key => ({ ArrowUp: 'w', ArrowDown: 's', ArrowLeft: 'a', ArrowRight: 'd' }[key] || (key.length === 1 ? key.toLowerCase() : key));
addEventListener('keydown', e => { const key = normalize(e.key); if (['w', 's', 'a', 'd', ' ', 'Shift'].includes(key) && !paused) e.preventDefault(); if (!e.repeat) { if (key === 'Escape' && !$('menu').open && !$('map-dialog').open && !$('fleet-dialog').open) { e.preventDefault(); openMenu(); return; } if (!paused && key === 'e') toggleVehicle(); if (!paused && key === 'm') openMap(); if (!paused && key === 'g') garage.open(); } if (!paused) keys.add(key); });
addEventListener('keyup', e => keys.delete(normalize(e.key)));
addEventListener('blur', () => { keys.clear(); if (!paused) openMenu(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) openMenu(); });
document.querySelectorAll('[data-key]').forEach(button => { button.onpointerdown = e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.key); }; for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.key)); });
function drawMap(canvas, full = false) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#274c43'; ctx.fillRect(0, 0, w, h);
  const position = driving ? body.position : walkBody.position, scale = full ? w / 510 : .67;
  const cx = full ? 15 : position.x, cz = full ? 0 : position.z;
  const point = (x, z) => [w / 2 + (x - cx) * scale, h / 2 + (z - cz) * scale];
  ctx.save(); ctx.translate(w / 2 - cx * scale, h / 2 - cz * scale); ctx.scale(scale, scale);
  ctx.fillStyle = '#3c7979'; ctx.fillRect(226, -600, 600, 1200); ctx.fillStyle = '#8b9a72'; ctx.fillRect(220, -220, 15, 440);
  ctx.fillStyle = '#718774'; for (const r of roads) { ctx.fillRect(r - 11, -220, 22, 440); ctx.fillRect(-220, r - 11, 440, 22); }
  ctx.fillStyle = '#406557'; for (const b of buildings) ctx.fillRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d);
  ctx.restore();
  if (mission) { const [tx, tz] = mission.contract.points[mission.stage], [x, y] = point(tx, tz); const [px, py] = point(position.x, position.z); ctx.strokeStyle = '#edff92'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, py); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff9579'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
  for (const c of cops) if (c.mesh.visible) { const [x, y] = point(c.body.position.x, c.body.position.z); ctx.fillStyle = '#9edaff'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
  if (!driving) { const [x, y] = point(body.position.x, body.position.z); ctx.fillStyle = '#ec997e'; ctx.fillRect(x - 3, y - 3, 6, 6); }
  const [px, py] = point(position.x, position.z); ctx.save(); ctx.translate(px, py); ctx.rotate(-yaw); ctx.fillStyle = '#f0ff91'; ctx.strokeStyle = '#163f35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#dce9ca'; ctx.font = 'bold 10px Arial'; ctx.fillText('N', 10, 16);
  if (full) { ctx.fillStyle = '#d5dfbf'; ctx.font = '11px Arial'; ctx.fillText('DOWNTOWN', 70, 80); ctx.fillText('PALM DISTRICT', w / 2, 85); ctx.save(); ctx.translate(w - 35, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('CORAL BAY', 0, 0); ctx.restore(); }
}
function hud() {
  $('cash').textContent = '$' + Math.floor(cash).toLocaleString(); $('speed').textContent = String(Math.round(Math.abs(speed) * 3.6)).padStart(3, '0'); $('gear').textContent = !driving ? 'P' : speed < -1 ? 'R' : 'D'; $('health').textContent = Math.ceil(health) + '%'; $('health-bar').style.width = health + '%'; $('boost-bar').style.width = boost + '%'; $('stars').textContent = '★'.repeat(heat) + '☆'.repeat(5 - heat);
  const pos = driving ? body.position : walkBody.position; $('location').textContent = pos.x > 100 ? 'CORAL MARINA' : pos.x < -50 ? 'DOWNTOWN' : 'OCEAN DRIVE';
  $('target-label').textContent = mission ? mission.contract.labels[mission.stage] : $('location').textContent; $('distance').textContent = mission ? Math.round(Math.hypot(pos.x - marker.position.x, pos.z - marker.position.z)) + ' m' : '';
  if (mission) { const t = Math.max(0, Math.ceil(mission.time)); $('timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
  const minutes = 18 * 60 + 42 + Math.floor(elapsed / 8); $('clock').textContent = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; drawMap($('minimap'));
}
const cameraTarget = new THREE.Vector3(), desiredCamera = new THREE.Vector3(); let firstFrame = true;
const clock = new THREE.Clock(); let hudTime = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), .04);
  if (!paused) {
    elapsed += dt;
    if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('toast').classList.remove('visible'); }
    const forward = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0), turn = (keys.has('a') ? 1 : 0) - (keys.has('d') ? 1 : 0);
    if (driving) {
      const boosting = keys.has('Shift') && forward > 0 && boost > 0 && health > 0;
      const maxSpeed = boosting ? 49 : 32;
      speed += forward * (boosting ? 21 : 13) * dt;
      if (!forward) speed *= Math.exp(-dt * .65);
      if (keys.has(' ')) speed *= Math.exp(-dt * 4);
      speed = THREE.MathUtils.clamp(speed, -11, maxSpeed * (.5 + health / 200));
      if (Math.abs(speed) > .5) yaw += turn * Math.sign(speed) * Math.min(Math.abs(speed) / 9, 1) * (keys.has(' ') ? 2.5 : 1.5) * dt;
      body.quaternion.setFromEuler(0, yaw, 0); body.velocity.x = -Math.sin(yaw) * speed; body.velocity.z = -Math.cos(yaw) * speed;
      boost = THREE.MathUtils.clamp(boost + (boosting ? -32 : 13) * dt, 0, 100);
    } else {
      speed = forward * (keys.has('Shift') ? 9 : 4.5); yaw += turn * 2.4 * dt; walkBody.velocity.x = -Math.sin(yaw) * speed; walkBody.velocity.z = -Math.cos(yaw) * speed; body.velocity.x *= Math.exp(-dt * 4); body.velocity.z *= Math.exp(-dt * 4);
    }
    for (const t of traffic) {
      const p = t.body.position; if (t.axis ? Math.abs(p.x) > 213 : Math.abs(p.z) > 213) { if (t.axis) p.x = -Math.sign(p.x) * 211; else p.z = -Math.sign(p.z) * 211; }
      t.body.velocity.set(t.axis ? t.speed * t.dir : 0, 0, t.axis ? 0 : t.speed * t.dir); const angle = t.axis ? -t.dir * Math.PI / 2 : t.dir > 0 ? Math.PI : 0; t.body.quaternion.setFromEuler(0, angle, 0); t.mesh.rotation.y = angle;
    }
    if (heat > 0) {
      heatQuiet += dt;
      const pos = driving ? body.position : walkBody.position;
      for (const c of cops) if (c.mesh.visible) {
        const dx = pos.x - c.body.position.x, dz = pos.z - c.body.position.z, distance = Math.hypot(dx, dz);
        // Pursuers use street intersections instead of driving through city blocks.
        const nearestX = roads.reduce((a, b) => Math.abs(b - c.body.position.x) < Math.abs(a - c.body.position.x) ? b : a);
        const nearestZ = roads.reduce((a, b) => Math.abs(b - c.body.position.z) < Math.abs(a - c.body.position.z) ? b : a);
        let tx = pos.x, tz = pos.z;
        if (distance > 23) { if (Math.abs(dx) > Math.abs(dz)) { tz = nearestZ; if (Math.abs(c.body.position.z - nearestZ) > 8) tx = c.body.position.x; } else { tx = nearestX; if (Math.abs(c.body.position.x - nearestX) > 8) tz = c.body.position.z; } }
        const angle = Math.atan2(-(tx - c.body.position.x), -(tz - c.body.position.z)); c.body.quaternion.setFromEuler(0, angle, 0); c.body.velocity.x = -Math.sin(angle) * (14 + heat); c.body.velocity.z = -Math.cos(angle) * (14 + heat); c.mesh.rotation.y = angle;
        c.mesh.userData.lights.forEach((light, i) => light.visible = Math.floor(elapsed * 7 + i) % 2 === 0);
        if (distance < 5 && Math.abs(speed) < 3) { health -= 12 * dt; heatQuiet = 0; }
      }
      if (heatQuiet > 22 && cops.filter(c => c.mesh.visible).every(c => c.body.position.distanceTo(pos) > 35)) { setHeat(0); toast('You lost the police. Coast is clear.'); }
    }
    world.step(1 / 60, dt, 4);
    const pos = driving ? body.position : walkBody.position;
    if (Math.abs(pos.x) > 218 || Math.abs(pos.z) > 218 || pos.y < -5) { health = Math.max(0, health - 10); recover(); }
    if (health <= 0) { cash = Math.max(0, cash - 200); health = 100; setHeat(0); recover(false); if (mission) failMission('Run ended. Recovery fee: $200.'); else toast('Vehicle recovered. Recovery fee: $200.'); save(); }
    if (mission) {
      mission.time -= dt;
      if (mission.time <= 0) failMission('Time ran out. Accept the contract to retry.');
      else if (advanceMission(mission, body.position.x, body.position.z, driving)) {
        if (mission.stage >= mission.contract.points.length) { const reward = mission.contract.reward; cash += reward; completed++; mission = null; marker.visible = false; save(); renderContract(); toast(`Contract complete. +$${reward.toLocaleString()}`); }
        else { updateMarker(); toast('Checkpoint reached. Keep moving.'); }
      }
    }
    ring.rotation.z += dt; beam.material.opacity = .1 + Math.sin(elapsed * 2) * .04;
  }
  playerCar.position.set(body.position.x, body.position.y - .6, body.position.z); playerCar.quaternion.copy(body.quaternion);
  person.position.set(walkBody.position.x, walkBody.position.y - .6, walkBody.position.z); person.rotation.y = yaw;
  for (const t of traffic) t.mesh.position.set(t.body.position.x, t.body.position.y - .6, t.body.position.z);
  for (const c of cops) c.mesh.position.set(c.body.position.x, c.body.position.y - .6, c.body.position.z);
  const pos = driving ? body.position : walkBody.position;
  const distance = driving ? 12 + Math.abs(speed) * .13 : 8;
  desiredCamera.set(pos.x + Math.sin(yaw) * distance, pos.y + (driving ? 7 : 5), pos.z + Math.cos(yaw) * distance);
  const lookAhead = mobileQuality ? 1 : 9;
  cameraTarget.set(pos.x - Math.sin(yaw) * lookAhead, pos.y + 1.5, pos.z - Math.cos(yaw) * lookAhead);
  if (firstFrame) { camera.position.copy(desiredCamera); firstFrame = false; } else if (!paused) camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 5));
  camera.lookAt(cameraTarget);
  if (volume) { volume.gain.setTargetAtTime(soundEnabled && !paused ? .009 + Math.abs(speed) * .0004 : 0, audioContext.currentTime, .08); oscillator.frequency.setTargetAtTime(35 + Math.abs(speed) * 3, audioContext.currentTime, .1); }
  hudTime += dt; if (hudTime > .1) { hud(); hudTime = 0; }
  renderer.render(scene, camera);
  garage.render(dt);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
logosReady.then(() => { renderContract(); hud(); renderer.setAnimationLoop(tick); $('loading').remove(); });
// Read-only diagnostics for browser verification and support.
window.neonCoast = {
  snapshot: () => ({ position: { x: body.position.x, z: body.position.z }, speed, health, cash, completed, heat, driving, paused, mission: mission ? { stage: mission.stage, time: mission.time } : null, frames: renderer.info.render.frame, meshes: renderer.info.render.calls }),
  fleetSnapshot: () => ({ selected: selectedBrand.id, paint: playerCar.userData.paintParts[0].material.color.getHexString(), traffic: traffic.map(t => t.mesh.userData.brand), logos: { ...logoStatus }, garage: garage.snapshot(), decals: playerCar.userData.decals.length }),
  previewProbe: () => garage.canvasProbe(),
  canvasProbe: () => {
    renderer.render(scene, camera);
    const gl = renderer.getContext(), pixel = new Uint8Array(4), colors = new Set();
    for (let x = 1; x < 10; x++) for (let y = 1; y < 10; y++) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * x / 10), Math.floor(gl.drawingBufferHeight * y / 10), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      colors.add(`${pixel[0]},${pixel[1]},${pixel[2]}`);
    }
    return { colors: colors.size, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
  },
};
