import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://br-api.geostat.ge',
        // target: 'http://localhost:5001',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
