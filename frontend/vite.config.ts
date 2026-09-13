import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 核心：打包产物直接输出到后端 static 目录，由 FastAPI 直接托管
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
  // 本地开发代理：前端调 /api 会自动转发到 Python FastAPI 后端 (8000 端口)
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
