import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/dashboard-build/',
  build: {
    outDir: '../public/dashboard-build',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/admin': 'http://localhost:5001',
    },
  },
});
