const EARTH = 6371008.8;
const rad = Math.PI / 180;
export function distance(a, b) {
  const dLat = (b[1] - a[1]) * rad,
    dLon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function localPoint(coordinate, origin) {
  return {
    x: (coordinate[0] - origin[0]) * rad * EARTH * Math.cos(origin[1] * rad),
    z: -(coordinate[1] - origin[1]) * rad * EARTH,
  };
}
export function validateRoute(data) {
  if (
    !data ||
    !Array.isArray(data.coordinates) ||
    data.coordinates.length < 2 ||
    data.coordinates.length > 150000 ||
    !Number.isFinite(data.distance) ||
    data.distance <= 0 ||
    !Number.isFinite(data.duration) ||
    data.duration <= 0
  )
    throw new Error("The routing service returned an invalid route.");
  if (
    !data.coordinates.every(
      (c) =>
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(c[0]) &&
        Number.isFinite(c[1]) &&
        c[0] >= 66 &&
        c[0] <= 100 &&
        c[1] >= 5 &&
        c[1] <= 39,
    )
  )
    throw new Error("Route is outside the supported India region.");
  return data;
}
export function prepareRoute(raw) {
  const data = validateRoute(raw),
    coordinates = data.coordinates.filter(
      (c, i, all) => !i || distance(c, all[i - 1]) > 0.05,
    );
  if (coordinates.length < 2) throw new Error("Choose two different places.");
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++)
    cumulative.push(
      cumulative[i - 1] + distance(coordinates[i - 1], coordinates[i]),
    );
  const length = cumulative.at(-1);
  let stepDistance = 0;
  const steps = (data.steps || []).map((step) => {
    const value = { ...step, start: (stepDistance / data.distance) * length };
    stepDistance += step.distance || 0;
    return value;
  });
  return { ...data, coordinates, cumulative, length, steps };
}
export function sampleRoute(route, travelled) {
  const d = Math.max(0, Math.min(route.length, travelled));
  let low = 0,
    high = route.cumulative.length - 1;
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (route.cumulative[mid] <= d) low = mid;
    else high = mid;
  }
  const a = route.coordinates[low],
    b = route.coordinates[high],
    span = route.cumulative[high] - route.cumulative[low];
  const t = span ? (d - route.cumulative[low]) / span : 0;
  const coordinate = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const direction = localPoint(b, a),
    yaw = Math.atan2(-direction.x, -direction.z);
  return { coordinate, yaw, index: low };
}
export function stepAt(route, travelled) {
  let index = 0;
  for (let i = 0; i < route.steps.length; i++) {
    if (route.steps[i].start > travelled) break;
    index = i;
  }
  return { current: route.steps[index], next: route.steps[index + 1] };
}
export function rewardFor(route) {
  return Math.round(300 + (route.distance / 1000) * 9);
}
export function offsetCoordinate(coordinate, x, z) {
  return [coordinate[0] + x / (rad * EARTH * Math.cos(coordinate[1] * rad)), coordinate[1] - z / (rad * EARTH)];
}
export function vehicleCoordinate(trip) {
  if (trip.scale === 1 && trip.position) return trip.position;
  const s = sampleRoute(trip.route, trip.travelled);
  return offsetCoordinate(s.coordinate, Math.cos(s.yaw) * trip.lane, -Math.sin(s.yaw) * trip.lane);
}
export function recoverVehicle(trip) {
  const s = sampleRoute(trip.route, trip.travelled);
  trip.lane = -2.1;
  trip.heading = s.yaw;
  trip.steerAngle = 0;
  trip.gear = 1;
  trip.speed = 0;
  trip.position = offsetCoordinate(s.coordinate, Math.cos(s.yaw) * trip.lane, -Math.sin(s.yaw) * trip.lane);
}
function projectVehicle(trip) {
  const route = trip.route, center = sampleRoute(route, trip.travelled).index;
  let best = Infinity, progress = trip.travelled, lane = trip.lane;
  // Search near the last road segment to avoid jumping to nearby parallel roads.
  for (let i = Math.max(0, center - 50); i < Math.min(route.coordinates.length - 1, center + 51); i++) {
    const a = localPoint(route.coordinates[i], trip.position), b = localPoint(route.coordinates[i + 1], trip.position);
    const dx = b.x - a.x, dz = b.z - a.z, length2 = dx * dx + dz * dz;
    if (!length2) continue;
    const t = Math.max(0, Math.min(1, -(a.x * dx + a.z * dz) / length2));
    const x = a.x + t * dx, z = a.z + t * dz, distance2 = x * x + z * z;
    if (distance2 < best) {
      best = distance2;
      progress = route.cumulative[i] + t * (route.cumulative[i + 1] - route.cumulative[i]);
      lane = (x * dz - z * dx) / Math.sqrt(length2);
    }
  }
  trip.travelled = progress;
  trip.lane = lane;
}
export function advanceTrip(trip, dt, throttle, brake, steering) {
  if (trip.delivered || trip.arrived) {
    trip.speed = 0;
    return;
  }
  if (trip.scale === 1) {
    if (!trip.position || !Number.isFinite(trip.heading)) recoverVehicle(trip);
    dt = Math.max(0, Math.min(dt, 0.05));
    const offroad = Math.abs(trip.lane) > 5.2;
    const maxSpeed = offroad ? 7 : trip.gear === -1 ? 6 : 31;
    const acceleration = throttle ? 4.8 * (1 - trip.speed / (maxSpeed + 6)) : -0.7 - trip.speed * 0.025;
    trip.speed = Math.max(0, Math.min(trip.gear === -1 ? 6 : 31, trip.speed + (acceleration - (brake ? 13 : 0) - (offroad && trip.speed > maxSpeed ? 8 : 0)) * dt));
    const target = Math.max(-1, Math.min(1, steering)) * 0.42 / (1 + trip.speed * 0.22);
    trip.steerAngle += (target - trip.steerAngle) * (1 - Math.exp(-dt * 9));
    const velocity = trip.speed * (trip.gear || 1);
    if (velocity === 0) return;
    trip.heading -= velocity / 2.7 * Math.tan(trip.steerAngle) * dt;
    trip.heading = Math.atan2(Math.sin(trip.heading), Math.cos(trip.heading));
    trip.position = offsetCoordinate(trip.position, -Math.sin(trip.heading) * velocity * dt, -Math.cos(trip.heading) * velocity * dt);
    projectVehicle(trip);
    if (trip.route.length - trip.travelled < 6 && distance(trip.position, trip.route.coordinates.at(-1)) < 8) {
      trip.arrived = true;
      trip.travelled = trip.route.length;
      trip.speed = 0;
    }
    return;
  }
  trip.speed = Math.max(
    0,
    Math.min(31, trip.speed + (throttle ? 6 : -2) * dt - (brake ? 16 * dt : 0)),
  );
  trip.lane = Math.max(
    -3.3,
    Math.min(3.3, trip.lane + steering * dt * Math.min(4, trip.speed / 4)),
  );
  trip.travelled = Math.min(
    trip.route.length,
    trip.travelled + trip.speed * dt * trip.scale,
  );
  if (trip.travelled >= trip.route.length) {
    trip.arrived = true;
    trip.speed = 0;
  }
}
export function restoreTrip(raw) {
  try {
    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data.id !== "string" ||
      data.id.length > 100 ||
      !data.route?.from?.name ||
      !data.route?.to?.name
    )
      return null;
    const route = prepareRoute(data.route);
    if (
      !Number.isFinite(data.travelled) ||
      data.travelled < 0 ||
      data.travelled > route.length + 1 ||
      ![1, 20, 60].includes(data.scale)
    )
      return null;
    const restored = {
      id: data.id,
      route,
      travelled: Math.min(route.length, data.travelled),
      scale: data.scale,
      lane: -2.1,
      speed: 0,
      arrived: data.travelled >= route.length,
      delivered: data.delivered === true,
    };
    recoverVehicle(restored);
    if (restored.scale === 1 && Array.isArray(data.position) && data.position.length === 2 && data.position.every(Number.isFinite) && distance(data.position, sampleRoute(route, restored.travelled).coordinate) < 500 && Number.isFinite(data.heading)) {
      restored.position = data.position;
      restored.heading = Math.atan2(Math.sin(data.heading), Math.cos(data.heading));
      projectVehicle(restored);
    }
    return restored;
  } catch {
    return null;
  }
}
