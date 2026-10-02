import { defineConfig } from 'vite';
import { mapsHandler } from './server/maps-api.mjs';

export default defineConfig({
  plugins: [{ name: 'india-map-api', configureServer(server) { server.middlewares.use(mapsHandler); }, configurePreviewServer(server) { server.middlewares.use(mapsHandler); } }],
  build: {
    rollupOptions: {
      input: { coast: 'index.html', india: 'india.html' },
      output: { manualChunks: { graphics: ['three'], physics: ['cannon-es'], maps: ['leaflet'] } },
    },
  },
});
