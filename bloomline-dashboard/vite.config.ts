import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend on :5173 proxies /api to the Express backend on :4001 (spec §6.1)
      '/api': 'http://localhost:4001',
    },
  },
})
