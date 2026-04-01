import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 38767,
    proxy: {
      '/api': {
        target: 'http://localhost:38766',
        changeOrigin: true,
      },
    },
  },
})
