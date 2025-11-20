import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/get-latest-response': 'http://localhost:3001',
      '/get-ai-summary': 'http://localhost:3001',
      '/get-campaign': 'http://localhost:3001',
      '/dismiss-trait': 'http://localhost:3001',
      '/dismiss-statement': 'http://localhost:3001'
    }
  }
})