import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    // Modern evergreen target — Three.js + R3F assume baseline modern browsers.
    // Bundle-size budget is enforced separately in CI (G7), not here.
    target: 'es2022',
  },
  // Allow Cloudflare quick-tunnel hosts so on-demand mobile device tests over a
  // *.trycloudflare.com URL aren't blocked by Vite's host check. Affects only the
  // local dev/preview servers — not the deployed build.
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    allowedHosts: ['.trycloudflare.com'],
  },
})
