import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':      { target: 'http://localhost:8080', changeOrigin: true },
      '/bodies':    { target: 'http://localhost:8080', changeOrigin: true },
      '/missions':  { target: 'http://localhost:8080', changeOrigin: true },
      '/agencies':  { target: 'http://localhost:8080', changeOrigin: true },
      '/rockets':   { target: 'http://localhost:8080', changeOrigin: true },
      '/targets':   { target: 'http://localhost:8080', changeOrigin: true },
      '/analytics': { target: 'http://localhost:8080', changeOrigin: true },
      '/threats':   { target: 'http://localhost:8080', changeOrigin: true },
      '/observers': { target: 'http://localhost:8080', changeOrigin: true },
      '/alerts':    { target: 'http://localhost:8080', changeOrigin: true },
      '/celestrak': { target: 'https://celestrak.org', changeOrigin: true, rewrite: (path) => path.replace(/^\/celestrak/, '') },
    },
  },
})
