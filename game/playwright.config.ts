import { defineConfig, devices } from '@playwright/test'

// Skeleton config laid down in G0. The actual smoke spec (boot.smoke.spec.ts)
// arrives in G7. Browsers are NOT installed in G0; do not run `playwright test` yet.
export default defineConfig({
  testDir: './src/test/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
