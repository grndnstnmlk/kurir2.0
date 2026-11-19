import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/kurir2.0/', // Mendukung hosting GitHub Pages di https://grndnstnmlk.github.io/kurir2.0/
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  }
})
