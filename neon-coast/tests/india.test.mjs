import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  prepareRoute,
  sampleRoute,
  distance,
  advanceTrip,
  restoreTrip,
  stepAt,
  recoverVehicle,
  vehicleCoordinate,
} from "../src/india/route.js";
import { parseOSM } from "../server/osm-scenery.mjs";
const raw = JSON.parse(
  await readFile(
    new URL("../public/routes/delhi-rishikesh.json", import.meta.url),
  ),
);
test("real road snapshot has consistent endpoints, distance and navigation", () => {
  const route = prepareRoute(raw);
  assert.ok(route.coordinates.length > 3000);
  assert.ok(route.distance > 200000 && route.distance < 300000);
  assert.ok(Math.abs(route.length - route.distance) < route.distance * 0.03);
  assert.deepEqual(sampleRoute(route, 0).coordinate, route.coordinates[0]);
  assert.ok(
    distance(
      sampleRoute(route, route.length).coordinate,
      route.coordinates.at(-1),
    ) < 0.1,
  );
  assert.ok(
    distance(
      sampleRoute(route, route.length * 0.5).coordinate,
      route.coordinates[0],
    ) > 50000,
  );
  assert.equal(stepAt(route, 0).current.start, 0);
});
test("driving uses selected distance scale, brakes, stops at arrival, and never travels while stopped", () => {
  const route = prepareRoute(raw),
    trip = {
      route,
      travelled: route.length - 2,
      speed: 10,
      lane: -2,
      scale: 20,
      arrived: false,
      delivered: false,
    };
  advanceTrip(trip, 0.1, true, false, 0);
  assert.equal(trip.arrived, true);
  assert.equal(trip.travelled, route.length);
  assert.equal(trip.speed, 0);
  advanceTrip(trip, 10, true, false, 1);
  assert.equal(trip.travelled, route.length);
  const stopped = { route, travelled: 0, speed: 0, lane: -2, scale: 1 };
  advanceTrip(stopped, 1, false, false, 0);
  assert.equal(stopped.travelled, 0);
  for (let i = 0; i < 60; i++) advanceTrip(stopped, 1 / 60, true, false, 1);
  assert.ok(stopped.travelled > 0);
  assert.ok(Number.isFinite(stopped.heading));
});
test("manual steering changes heading and position, countersteers, brakes, reverses and recovers", () => {
  const route = prepareRoute(raw);
  const trip = { route, travelled: 30, scale: 1, speed: 0, lane: -2.1 };
  recoverVehicle(trip);
  const heading = trip.heading;
  for (let i = 0; i < 120; i++) advanceTrip(trip, 1 / 60, true, false, 0);
  const beforeTurn = vehicleCoordinate(trip);
  for (let i = 0; i < 30; i++) advanceTrip(trip, 1 / 60, true, false, 1);
  assert.ok(trip.heading < heading - 0.05, 'right input turns the actual car');
  assert.ok(distance(beforeTurn, vehicleCoordinate(trip)) > 2);
  const right = trip.heading;
  for (let i = 0; i < 50; i++) advanceTrip(trip, 1 / 60, false, false, -1);
  assert.ok(trip.heading > right, 'left input countersteers');
  for (let i = 0; i < 180; i++) advanceTrip(trip, 1 / 60, false, true, 0);
  assert.equal(trip.speed, 0);
  const stopped = [...trip.position];
  for (let i = 0; i < 60; i++) advanceTrip(trip, 1 / 60, false, false, 1);
  assert.deepEqual(trip.position, stopped, 'stationary steering does not move the car');
  recoverVehicle(trip);
  const progress = trip.travelled;
  trip.gear = -1;
  for (let i = 0; i < 120; i++) advanceTrip(trip, 1 / 60, true, false, 0);
  assert.ok(trip.travelled < progress, 'reverse drives backward');
  recoverVehicle(trip);
  assert.equal(trip.lane, -2.1);
  assert.equal(trip.gear, 1);
  assert.equal(trip.speed, 0);
  const saved = restoreTrip(JSON.stringify({ ...trip, id: 'manual' }));
  assert.ok(distance(saved.position, trip.position) < 0.01, 'manual position survives resume');
});
test("saved trips validate coordinates, bounds and pace", () => {
  assert.equal(restoreTrip("{bad"), null);
  assert.equal(
    restoreTrip(
      JSON.stringify({ id: "test", route: raw, travelled: -1, scale: 20 }),
    ),
    null,
  );
  const saved = restoreTrip(
    JSON.stringify({
      id: "test",
      route: raw,
      travelled: 100,
      scale: 20,
      delivered: false,
    }),
  );
  assert.equal(saved.travelled, 100);
  assert.equal(saved.speed, 0);
  assert.equal(
    restoreTrip(
      JSON.stringify({
        id: "test",
        route: {
          ...raw,
          coordinates: [
            [0, 0],
            [0, 0],
          ],
        },
        travelled: 0,
        scale: 1,
      }),
    ),
    null,
  );
});
test("OSM XML parsing uses actual node coordinates and way geometry", () => {
  const xml =
    '<osm><node id="1" lat="28.61" lon="77.2"><tag k="natural" v="tree"/></node><node id="2" lat="28.62" lon="77.21"/><way id="4"><nd ref="1"/><nd ref="2"/><tag k="waterway" v="river"/><tag k="name" v="River"/></way></osm>';
  const features = parseOSM(xml);
  assert.equal(features.length, 2);
  assert.equal(features[0].tags.natural, "tree");
  assert.equal(features[1].geometry[1].lat, 28.62);
});
