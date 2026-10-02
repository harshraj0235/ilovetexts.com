import { XMLParser } from "fast-xml-parser";
const list = (value) => (value ? (Array.isArray(value) ? value : [value]) : []);
export function parseOSM(xml) {
  const document = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    processEntities: false,
  }).parse(xml);
  if (!document.osm) throw new Error("Invalid OpenStreetMap response");
  const nodes = new Map(),
    elements = [];
  const tags = (entry) =>
    Object.fromEntries(list(entry.tag).map((tag) => [tag.k, String(tag.v)]));
  for (const node of list(document.osm.node)) {
    nodes.set(node.id, { lat: node.lat, lon: node.lon });
    const data = tags(node);
    if (
      data.natural === "tree" ||
      data.place ||
      ["fuel", "restaurant"].includes(data.amenity)
    )
      elements.push({
        type: "node",
        id: node.id,
        lat: node.lat,
        lon: node.lon,
        tags: data,
      });
  }
  for (const way of list(document.osm.way)) {
    const data = tags(way);
    if (
      !data.building &&
      !data.waterway &&
      !data.highway &&
      !["water", "wood"].includes(data.natural) &&
      !["forest", "grass", "farmland"].includes(data.landuse) &&
      data.bridge !== "yes"
    )
      continue;
    const geometry = list(way.nd)
      .map((nd) => nodes.get(nd.ref))
      .filter(Boolean);
    if (geometry.length > 1)
      elements.push({ type: "way", id: way.id, tags: data, geometry });
  }
  return elements;
}
export async function fetchOSMScenery(lon, lat) {
  const delta = 0.004,
    lonDelta = delta / Math.cos((lat * Math.PI) / 180);
  const bbox = `${lon - lonDelta},${lat - delta},${lon + lonDelta},${lat + delta}`;
  const source = `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`;
  const response = await fetch(source, {
    headers: {
      "User-Agent": "NeonCoastIndia/1.0 (local geographic visualization)",
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok)
    throw new Error(`Map scenery unavailable (${response.status})`);
  const xml = await response.text();
  if (xml.length > 12000000) throw new Error("Map scenery exceeds local limit");
  const elements = parseOSM(xml);
  return {
    elements: elements.slice(0, 1600),
    center: [lon, lat],
    source,
    fetchedAt: new Date().toISOString(),
    attribution: "OpenStreetMap contributors",
    truncated: elements.length > 1600,
  };
}
