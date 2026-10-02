import { writeFile } from 'node:fs/promises';
import { fetchOSMScenery } from '../server/osm-scenery.mjs';
import { readFile } from 'node:fs/promises';
const route = JSON.parse(await readFile(new URL('../public/routes/delhi-rishikesh.json', import.meta.url)));
const start = route.coordinates[0];
const data = await fetchOSMScenery(...start);
await writeFile(new URL('../public/routes/delhi-rishikesh-scenery.json',import.meta.url),JSON.stringify(data));
console.log(`${data.elements.length} real map features saved at Delhi pickup`);
