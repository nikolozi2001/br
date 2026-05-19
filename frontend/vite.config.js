import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // target: 'https://br-api.geostat.ge',
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['echarts', 'echarts-for-react'],
          'vendor-map':    ['leaflet', 'react-leaflet'],
          'vendor-excel':  ['xlsx', 'exceljs', 'jszip'],
          'vendor-ui':     ['react-select', 'lucide-react', 'react-hot-toast'],
        },
      },
    },
  },
})
