import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../neon-coast/', import.meta.url));
await build({
  configFile: false,
  root,
  base: '/india-trip-game/',
  build: {
    outDir: fileURLToPath(new URL('../public/india-trip-game/', import.meta.url)),
    emptyOutDir: false,
    rollupOptions: {
      input: { coast: path.join(root, 'index.html'), india: path.join(root, 'india.html') },
      output: { manualChunks: { graphics: ['three'], physics: ['cannon-es'], maps: ['leaflet'] } },
    },
  },
});
