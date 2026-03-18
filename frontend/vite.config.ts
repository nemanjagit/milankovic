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
      '/celestrak': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/celestrak/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      },
    },
  },
})
