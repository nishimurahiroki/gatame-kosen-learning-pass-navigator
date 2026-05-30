import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoRoot = path.resolve(__dirname, '..')

/** ローカル API（dev / preview のみ。本番ビルドには含まれない） */
const localApiTarget =
  process.env.VITE_DEV_API_PROXY_TARGET?.trim() || 'http://localhost:8080'

const apiProxy = {
  '/api': {
    target: localApiTarget,
    changeOrigin: true,
  },
} as const

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
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
