import * as THREE from 'three';
import { BRANDS } from './brands.js';

const liveries = new Map();
export const logoStatus = {};
function canvasTexture(width, height) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, ctx: canvas.getContext('2d'), texture };
}
function fitImage(ctx, image, x, y, width, height) {
  const ratio = Math.min(width / image.width, height / image.height);
  const w = image.width * ratio, h = image.height * ratio;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
function drawDecal(target, brand, image, kind) {
  const { canvas, ctx, texture } = target;
  ctx.fillStyle = brand.color; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (kind === 'badge') {
    if (image) fitImage(ctx, image, 16, 16, 480, 480);
  } else {
    if (image) fitImage(ctx, image, 20, 14, 228, 228);
    ctx.fillStyle = brand.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let size = 116;
    do { ctx.font = `bold ${size--}px Arial`; } while (ctx.measureText(brand.name).width > 720);
    ctx.fillText(brand.name, 276, 131);
  }
  texture.needsUpdate = true;
}
export const logosReady = Promise.all(BRANDS.map(brand => {
  const banner = canvasTexture(1024, 256), badge = canvasTexture(512, 512);
  drawDecal(banner, brand, null, 'banner'); drawDecal(badge, brand, null, 'badge');
  const decalMaterial = texture => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  liveries.set(brand.id, {
    paint: new THREE.MeshStandardMaterial({ color: brand.color, roughness: .42, metalness: .12 }),
    banner: decalMaterial(banner.texture), badge: decalMaterial(badge.texture),
  });
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => { drawDecal(banner, brand, image, 'banner'); drawDecal(badge, brand, image, 'badge'); logoStatus[brand.id] = 'loaded'; resolve(); };
    image.onerror = () => { logoStatus[brand.id] = 'unavailable'; console.error(`Unable to load logo: ${brand.id}`); resolve(); };
    image.src = brand.logo;
  });
}));

export function applyLivery(group, brand) {
  const livery = liveries.get(brand.id);
  for (const part of group.userData.paintParts) part.material = livery.paint;
  if (!group.userData.decals) {
    group.userData.decals = [];
    const decal = (w, h, x, y, z, rx, ry, kind = 'banner') => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), livery[kind]);
      mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, 0); mesh.userData.kind = kind; group.add(mesh); group.userData.decals.push(mesh);
    };
    decal(3.45, .63, 1.181, .78, 0, 0, Math.PI / 2);
    decal(3.45, .63, -1.181, .78, 0, 0, -Math.PI / 2);
    decal(2.1, .38, 0, .74, 2.309, 0, 0);
    decal(1.45, 1.25, 0, 1.229, -1.45, -Math.PI / 2, 0, 'badge');
    decal(1.6, 1.08, 0, 1.916, .32, -Math.PI / 2, 0, 'badge');
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.05, .58, .62), livery.paint);
    sign.position.set(0, 2.14, .32); group.add(sign); group.userData.paintParts.push(sign);
    decal(1.98, .5, 0, 2.14, .635, 0, 0);
    decal(1.98, .5, 0, 2.14, .005, 0, Math.PI);
  }
  for (const decal of group.userData.decals) decal.material = livery[decal.userData.kind];
  group.userData.brand = brand.id;
}
