import { defineConfig } from 'vitest/config'

// The ported engine harnesses run headless in Node — no DOM, no jsdom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/**/*.{test,spec}.ts'],
    // Playwright owns the e2e specs (src/test/ui/*.spec.ts); keep them out of Vitest.
    exclude: ['src/test/ui/**', 'node_modules/**', 'dist/**'],
  },
})
