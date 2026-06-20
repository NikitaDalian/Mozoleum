import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works whether served from the API server root,
// a subpath, or a static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
