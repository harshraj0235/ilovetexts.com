import * as THREE from "three";
import * as CANNON from "cannon-es";
import { applyLivery } from "../liveries.js";
import { shuffledFleet } from "../brands.js";
import { localPoint, sampleRoute, distance, vehicleCoordinate } from "./route.js";

export function createRoadWorld(host) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  const low = innerWidth <= 700 || matchMedia("(pointer:coarse)").matches;
  renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b9d9e4");
  scene.fog = new THREE.Fog("#c2dbe0", 260, 1450);
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 2200);
  scene.add(new THREE.HemisphereLight("#fff7e6", "#6d8451", 2.3));
  const sun = new THREE.DirectionalLight("#ffe7b7", 2.7);
  sun.position.set(-80, 140, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -80,
    right: 80,
    top: 80,
    bottom: -80,
    far: 400,
  });
  sun.shadow.bias = -0.001;
  scene.add(sun);
  scene.add(sun.target);
  const mats = new Map();
  function material(color) {
    if (!mats.has(color))
      mats.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      );
    return mats.get(color);
  }
  const unit = new THREE.BoxGeometry(1, 1, 1);
  function box(w, h, d, color, x, y, z, parent = scene) {
    const mesh = new THREE.Mesh(unit, material(color));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const ground = box(6000, 0.15, 6000, "#b5bd91", 0, -0.2, 0);
  ground.castShadow = false;
  const roadGroup = new THREE.Group(),
    featuresGroup = new THREE.Group();
  scene.add(roadGroup, featuresGroup);
  const wheels = new THREE.CylinderGeometry(0.53, 0.53, 0.35, 12);
  function makeCar(brand) {
    const g = new THREE.Group();
    g.userData.paintParts = [];
    g.userData.frontWheels = [];
    for (const spec of [
      [2.35, 0.6, 4.6, 0, 0.7, 0],
      [2.25, 0.35, 4.25, 0, 1.05, 0],
      [1.9, 0.12, 1.3, 0, 1.85, 0.32],
      [2.4, 0.1, 0.5, 0, 1.45, 2.1],
    ]) {
      const [w, h, d, x, y, z] = spec;
      g.userData.paintParts.push(box(w, h, d, brand.color, x, y, z, g));
    }
    box(1.85, 0.7, 2.05, "#284c56", 0, 1.45, 0.2, g);
    for (const x of [-1.16, 1.16])
      for (const z of [-1.4, 1.45]) {
        const wheel = new THREE.Mesh(wheels, material("#29372f"));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.55, z);
        g.add(wheel);
        if (z < 0) g.userData.frontWheels.push(wheel);
        box(0.03, 0.38, 0.38, "#c4ceca", x * 1.18, 0.55, z, g);
      }
    for (const x of [-0.75, 0.75]) {
      box(0.55, 0.18, 0.06, "#fff2c6", x, 0.98, -2.32, g);
      box(0.6, 0.15, 0.06, "#ed786b", x, 0.95, 2.32, g);
    }
    applyLivery(g, brand);
    scene.add(g);
    return g;
  }
  let car,
    route,
    origin,
    rebuiltAt = -Infinity,
    featureVersion = 0,
    builtVersion = -1,
    features = [],
    cameraMode = 0,
    cameraInitialized = false;
  const traffic = shuffledFleet(8).map((brand, i) => ({
    mesh: makeCar(brand),
    phase: i * 72 + 100,
    opposite: i % 3 === 0,
  }));
  const physics = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
  const carBody = new CANNON.Body({
    mass: 1100,
    shape: new CANNON.Box(new CANNON.Vec3(1.15, 0.7, 2.25)),
    fixedRotation: true,
  });
  physics.addBody(carBody);
  traffic.forEach((t) => {
    t.body = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Box(new CANNON.Vec3(1.15, 0.7, 2.25)),
    });
    physics.addBody(t.body);
  });
  let collided = false;
  carBody.addEventListener("collide", () => {
    collided = true;
  });
  function clear(group) {
    group.traverse((o) => {
      if (o.geometry && o.geometry !== unit) o.geometry.dispose();
      if (o.material?.map && o.userData.label) {
        o.material.map.dispose();
        o.material.dispose();
      }
    });
    group.clear();
  }
  function ribbon(coords, width, color, y, parent = roadGroup) {
    if (coords.length < 2) return;
    const points = coords.map((c) => localPoint(c, origin)),
      positions = [],
      indices = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)],
        dx = b.x - a.x,
        dz = b.z - a.z,
        length = Math.hypot(dx, dz) || 1,
        nx = ((-dz / length) * width) / 2,
        nz = ((dx / length) * width) / 2;
      positions.push(
        points[i].x + nx,
        y,
        points[i].z + nz,
        points[i].x - nx,
        y,
        points[i].z - nz,
      );
      if (i < points.length - 1) {
        const k = i * 2;
        indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.material.side = THREE.DoubleSide;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }
  function area(coords, color, height = 0) {
    if (coords.length < 3) return;
    const points = coords.map((c) => localPoint(c, origin));
    const shape = new THREE.Shape(
      points.map((p) => new THREE.Vector2(p.x, -p.z)),
    );
    const geometry = height
      ? new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
      : new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.y = height ? 0.13 : 0.04;
    mesh.receiveShadow = true;
    mesh.castShadow = !!height;
    featuresGroup.add(mesh);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 5, 6),
    crownGeo = new THREE.IcosahedronGeometry(2.6, 1);
  function tree(coordinate, id = 0) {
    const p = localPoint(coordinate, origin);
    const trunk = new THREE.Mesh(trunkGeo, material("#8c7953"));
    trunk.position.set(p.x, 2.5, p.z);
    trunk.castShadow = true;
    featuresGroup.add(trunk);
    const crown = new THREE.Mesh(
      crownGeo,
      material(id % 2 ? "#517d43" : "#6a9150"),
    );
    crown.position.set(p.x, 5.7, p.z);
    crown.castShadow = true;
    featuresGroup.add(crown);
  }
  function label(text, x, z, color = "#285e43") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#e7eee0";
    ctx.lineWidth = 7;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    let size = 40;
    do {
      ctx.font = `600 ${size--}px Arial`;
    } while (ctx.measureText(text).width > 460);
    ctx.fillText(text, 256, 78);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, depthTest: true }),
    );
    sprite.position.set(x, 3.5, z);
    sprite.scale.set(6, 1.5, 1);
    sprite.userData.label = true;
    featuresGroup.add(sprite);
    box(0.15, 3, 0.15, "#788578", x, 1.5, z, featuresGroup);
  }
  function rebuild(trip) {
    const nextOrigin = sampleRoute(route, trip.travelled).coordinate;
    if (origin && cameraInitialized) {
      const shift = localPoint(nextOrigin, origin);
      camera.position.x -= shift.x;
      camera.position.z -= shift.z;
    }
    origin = nextOrigin;
    rebuiltAt = trip.travelled;
    clear(roadGroup);
    // These shared tree geometries are retained between streamed scenery windows.
    featuresGroup.traverse((o) => {
      if (o.geometry && ![unit, trunkGeo, crownGeo].includes(o.geometry))
        o.geometry.dispose();
      if (o.userData.label) {
        o.material.map.dispose();
        o.material.dispose();
      }
    });
    featuresGroup.clear();
    const start = sampleRoute(route, Math.max(0, trip.travelled - 550)).index,
      end = Math.min(
        route.coordinates.length - 1,
        sampleRoute(route, Math.min(route.length, trip.travelled + 1800))
          .index + 2,
      ),
      coords = route.coordinates.slice(start, end + 1);
    ribbon(coords, 15, "#b2ad8a", 0.025);
    ribbon(coords, 11, "#505b59", 0.09);
    ribbon(coords, 10.2, "#ecedcf", 0.1);
    ribbon(coords, 9.85, "#505b59", 0.115);
    for (
      let s = Math.max(0, trip.travelled - 500);
      s < Math.min(route.length, trip.travelled + 1750);
      s += 18
    ) {
      const a = sampleRoute(route, s).coordinate,
        b = sampleRoute(route, s + 7).coordinate;
      ribbon([a, b], 0.16, "#ece5ab", 0.14);
    }
    for (const element of features) {
      const tags = element.tags || {},
        geometry = element.geometry
          ?.filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
          .map((p) => [p.lon, p.lat]);
      const coordinate =
        element.lon !== undefined ? [element.lon, element.lat] : geometry?.[0];
      if (!coordinate) continue;
      if (geometry) {
        const near = geometry.some((c) => distance(c, origin) < 2100);
        if (!near) continue;
        if (tags.building) {
          const h = Math.min(
            80,
            Math.max(
              3,
              parseFloat(tags.height) ||
                parseFloat(tags["building:levels"]) * 3 ||
                8,
            ),
          );
          area(geometry, ["#ddd3bb", "#c6c7b7", "#d1bba7"][element.id % 3], h);
        } else if (tags.waterway) {
          ribbon(
            geometry,
            tags.waterway === "river" ? 35 : 8,
            "#64b3c4",
            0.06,
            featuresGroup,
          );
        } else if (tags.natural === "water") {
          area(geometry, "#64b3c4");
        } else if (tags.natural === "wood" || tags.landuse === "forest") {
          area(geometry, "#72915c");
          for (
            let i = 0;
            i < geometry.length;
            i += Math.max(1, Math.floor(geometry.length / 25))
          )
            tree(geometry[i], i);
        } else if (tags.landuse) {
          area(geometry, tags.landuse === "farmland" ? "#c3c58a" : "#93ac70");
        } else if (tags.bridge === "yes") {
          ribbon(geometry, 13, "#afb6b0", 0.07, featuresGroup);
          if (tags.name)
            label(
              tags.name,
              localPoint(coordinate, origin).x + 12,
              localPoint(coordinate, origin).z,
            );
        } else if (tags.highway) {
          ribbon(
            geometry,
            tags.highway === "residential" ? 5 : 8,
            "#6c7670",
            0.05,
            featuresGroup,
          );
        }
      } else if (distance(coordinate, origin) < 1800) {
        if (tags.natural === "tree") tree(coordinate, element.id);
        else if (tags.name) {
          const p = localPoint(coordinate, origin);
          label(tags.name, p.x, p.z);
        }
      }
    }
    if (trip.travelled < 500) {
      const startSample = sampleRoute(route, 30),
        p = localPoint(startSample.coordinate, origin);
      label(
        route.from.name,
        p.x + Math.cos(startSample.yaw) * 13,
        p.z - Math.sin(startSample.yaw) * 13,
        "#27694b",
      );
    }
    if (route.length - trip.travelled < 1600) {
      const p = localPoint(route.coordinates.at(-1), origin);
      label(`${route.to.name} / DROP OFF`, p.x + 14, p.z, "#a94f32");
      box(9, 0.2, 12, "#dce991", p.x, 0.17, p.z, roadGroup);
    }
    builtVersion = featureVersion;
  }
  function setRoute(newRoute, brand) {
    route = newRoute;
    rebuiltAt = -Infinity;
    features = [];
    featureVersion++;
    if (!car) car = makeCar(brand);
    else applyLivery(car, brand);
    cameraInitialized = false;
    traffic.forEach((t) => { t.distance = null; });
  }
  function setFeatures(elements) {
    const dedupe = new Map(features.map((e) => [`${e.type}/${e.id}`, e]));
    elements.forEach((e) => dedupe.set(`${e.type}/${e.id}`, e));
    features = [...dedupe.values()].slice(-2500);
    featureVersion++;
  }
  function render(trip, dt, paused) {
    if (!route) return false;
    if (
      Math.abs(trip.travelled - rebuiltAt) > 280 ||
      featureVersion !== builtVersion
    )
      rebuild(trip);
    const here = sampleRoute(route, trip.travelled),
      p = localPoint(vehicleCoordinate(trip), origin),
      yaw = trip.scale === 1 ? trip.heading : here.yaw;
    car.position.set(
      p.x,
      0.15,
      p.z,
    );
    car.rotation.y = yaw;
    for (const wheel of car.userData.frontWheels) wheel.rotation.y = -(trip.steerAngle || 0);
    carBody.position.set(car.position.x, 0.85, car.position.z);
    carBody.quaternion.setFromEuler(0, yaw, 0);
    carBody.velocity.setZero();
    for (const [i, t] of traffic.entries()) {
      if (t.distance == null || t.distance < trip.travelled - 220 || t.distance > trip.travelled + 1300)
        t.distance = trip.travelled + 180 + i * 100;
      if (!paused) t.distance += (t.opposite ? -12 : 10) * dt;
      const d = t.distance;
      t.mesh.visible = d > 0 && d < route.length;
      t.body.collisionFilterMask = t.mesh.visible ? -1 : 0;
      const s = sampleRoute(route, d),
        v = localPoint(s.coordinate, origin),
        lane = t.opposite ? 2.4 : -2.2;
      t.mesh.position.set(
        v.x + Math.cos(s.yaw) * lane,
        0.15,
        v.z - Math.sin(s.yaw) * lane,
      );
      t.mesh.rotation.y = s.yaw + (t.opposite ? Math.PI : 0);
      t.body.position.set(t.mesh.position.x, 0.85, t.mesh.position.z);
      t.body.quaternion.setFromEuler(0, t.mesh.rotation.y, 0);
    }
    collided = false;
    if (!paused) physics.step(1 / 60, Math.min(dt, 0.04), 3);
    const pos = car.position;
    const lookAhead = low ? 8 : 16;
    const target = { x: pos.x - Math.sin(yaw) * lookAhead, z: pos.z - Math.cos(yaw) * lookAhead };
    const desired = cameraMode
      ? new THREE.Vector3(
          pos.x - Math.sin(yaw) * 0.8,
          1.65,
          pos.z - Math.cos(yaw) * 0.8,
        )
      : new THREE.Vector3(
          pos.x + Math.sin(yaw) * 14,
          7,
          pos.z + Math.cos(yaw) * 14,
        );
    if (!cameraInitialized || trip.scale > 1) camera.position.copy(desired);
    else camera.position.lerp(desired, 1 - Math.exp(-dt * 7));
    cameraInitialized = true;
    camera.lookAt(target.x, cameraMode ? 1.65 : 1.7, target.z);
    car.visible = !cameraMode;
    sun.position.set(pos.x - 80, 140, pos.z + 100);
    sun.target.position.copy(pos);
    ground.position.set(pos.x, -0.2, pos.z);
    renderer.render(scene, camera);
    return collided;
  }
  function resize() {
    const width = host.clientWidth || innerWidth,
      height = host.clientHeight || innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();
  return {
    setRoute,
    setFeatures,
    resetCamera: () => { cameraInitialized = false; },
    render,
    resize,
    camera: () => {
      cameraMode = 1 - cameraMode;
      cameraInitialized = false;
    },
    quality: (value) => {
      renderer.setPixelRatio(
        value === "low" ? 1 : Math.min(devicePixelRatio, 1.5),
      );
      renderer.shadowMap.enabled = value !== "low";
      scene.traverse((o) => {
        if (o.material) o.material.needsUpdate = true;
      });
    },
    snapshot: () => ({
      features: features.length,
      drawCalls: renderer.info.render.calls,
      frames: renderer.info.render.frame,
      car: car?.position.toArray(),
      cameraMode,
    }),
    probe: () => {
      renderer.render(scene, camera);
      const gl = renderer.getContext(),
        pixel = new Uint8Array(4),
        colors = new Set();
      for (let x = 1; x < 10; x++)
        for (let y = 1; y < 10; y++) {
          gl.readPixels(
            Math.floor((gl.drawingBufferWidth * x) / 10),
            Math.floor((gl.drawingBufferHeight * y) / 10),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel,
          );
          colors.add([...pixel].join(","));
        }
      return colors.size;
    },
  };
}
