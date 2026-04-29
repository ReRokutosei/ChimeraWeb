import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.PAGES_BASE || './',
  server: {
    port: 19234,
  },
  build: {
    outDir: 'dist',
  },
});
