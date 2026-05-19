import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoRoot = path.resolve(__dirname, '..')

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@image': path.join(repoRoot, 'image'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
