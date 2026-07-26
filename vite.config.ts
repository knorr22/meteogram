import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/meteogram/ in production; root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/meteogram/' : '/',
  plugins: [react()],
  server: { host: true },
}))
