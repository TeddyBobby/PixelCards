import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PixelCards/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    open: true,
  },
});
