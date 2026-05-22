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
})
