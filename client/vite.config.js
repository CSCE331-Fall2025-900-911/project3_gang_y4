import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 3000,
    host: true // Important for Render deployment
  },
  build: {
    outDir: 'dist' // Vite default, but good to be explicit
  }
})