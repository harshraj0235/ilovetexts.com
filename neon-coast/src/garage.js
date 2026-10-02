import * as THREE from 'three';
import { BRANDS, randomBrand } from './brands.js';
import { applyLivery } from './liveries.js';

export function createGarage({ buildCar, getSelected, onOpen, onClose, onApply }) {
  const dialog = document.getElementById('fleet-dialog');
  const grid = document.getElementById('fleet-grid');
  const previewHost = document.getElementById('fleet-preview');
  let pending = getSelected(), filter = 'All', previewRenderer, previewCar, previewCamera, previewScene;
  const cards = new Map();
  for (const brand of BRANDS) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'fleet-card'; button.dataset.brand = brand.id;
    button.setAttribute('aria-label', `Select ${brand.name}`);
    const image = document.createElement('img'); image.src = brand.logo; image.alt = ''; image.width = 48; image.height = 48;
    const name = document.createElement('strong'); name.textContent = brand.name;
    const category = document.createElement('small'); category.textContent = brand.category;
    const swatch = document.createElement('span'); swatch.className = 'paint-swatch'; swatch.style.backgroundColor = brand.color;
    button.append(image, name, category, swatch); grid.append(button); cards.set(brand.id, button);
    button.onclick = () => select(brand);
  }
  function select(brand) {
    pending = brand;
    if (previewCar) applyLivery(previewCar, brand);
    document.getElementById('fleet-name').textContent = brand.name;
    document.getElementById('fleet-category').textContent = `${brand.category.toUpperCase()} / COMET GT`;
    document.getElementById('fleet-paint').style.backgroundColor = brand.color;
    document.getElementById('fleet-choice').textContent = `Drive ${brand.name}`;
    for (const [id, button] of cards) button.setAttribute('aria-pressed', String(id === brand.id));
  }
  function resize() {
    if (!previewRenderer) return;
    const { width, height } = previewHost.getBoundingClientRect();
    if (!width || !height) return;
    previewRenderer.setSize(width, height); previewCamera.aspect = width / height; previewCamera.updateProjectionMatrix();
  }
  function preparePreview() {
    if (previewRenderer) return;
    previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    previewRenderer.setClearColor(0x000000, 0); previewRenderer.outputColorSpace = THREE.SRGBColorSpace; previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    previewHost.append(previewRenderer.domElement); previewScene = new THREE.Scene();
    previewScene.add(new THREE.HemisphereLight('#ffffff', '#c6d4ca', 3));
    const key = new THREE.DirectionalLight('#ffffff', 3); key.position.set(3, 8, 5); previewScene.add(key);
    previewCamera = new THREE.PerspectiveCamera(36, 1, .1, 50); previewCamera.position.set(5.8, 4.6, 6.7); previewCamera.lookAt(0, 1, 0);
    previewCar = buildCar(pending.color); previewScene.add(previewCar); applyLivery(previewCar, pending);
    new ResizeObserver(resize).observe(previewHost);
  }
  function open() {
    onOpen(); filter = 'All';
    dialog.showModal(); preparePreview(); resize(); select(getSelected()); updateFilter();
  }
  function close() { dialog.close(); onClose(); }
  function updateFilter() {
    for (const brand of BRANDS) cards.get(brand.id).hidden = filter !== 'All' && brand.category !== filter;
    dialog.querySelectorAll('[data-fleet-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fleetFilter === filter)));
  }
  dialog.querySelectorAll('[data-fleet-filter]').forEach(button => { button.onclick = () => { filter = button.dataset.fleetFilter; updateFilter(); }; });
  document.getElementById('fleet-random').onclick = () => {
    const choices = BRANDS.filter(brand => (filter === 'All' || brand.category === filter) && brand.id !== pending.id);
    select(choices.length ? choices[Math.floor(Math.random() * choices.length)] : randomBrand(pending.id));
    cards.get(pending.id).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  document.getElementById('fleet-apply').onclick = () => { onApply(pending); close(); };
  document.getElementById('close-fleet').onclick = close;
  document.getElementById('fleet-button').onclick = open;
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  select(pending);
  return {
    open,
    render(dt) { if (!dialog.open || !previewRenderer) return; previewCar.rotation.y += dt * .4; previewRenderer.render(previewScene, previewCamera); },
    snapshot: () => ({ open: dialog.open, pending: pending.id, previewBrand: previewCar?.userData.brand, previewPaint: previewCar?.userData.paintParts[0].material.color.getHexString(), rotation: previewCar?.rotation.y }),
    canvasProbe() {
      if (!previewRenderer) return 0;
      previewRenderer.render(previewScene, previewCamera);
      const gl = previewRenderer.getContext(), pixel = new Uint8Array(4), colors = new Set();
      for (let x = 1; x < 10; x++) for (let y = 1; y < 10; y++) {
        gl.readPixels(Math.floor(gl.drawingBufferWidth * x / 10), Math.floor(gl.drawingBufferHeight * y / 10), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        colors.add([...pixel].join(','));
      }
      return colors.size;
    },
  };
}
