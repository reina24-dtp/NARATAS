import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api ke backend (ubah port sesuai backend Anda) agar tidak perlu CORS saat dev.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
