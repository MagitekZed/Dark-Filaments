import { defineConfig, devices } from '@playwright/test'

// Playwright config (scaffold plan §7 G7 / §9).
//
// The smoke validates the REAL PRODUCTION BUNDLE, not dev mode: webServer runs
// `npm run preview`, which serves the built dist/ artifact via `vite preview`.
// So the dev route (import.meta.env.DEV-gated) is tree-shaken out — the smoke
// drives the engine deterministically via a SEEDED localStorage save instead of
// any dev tooling (TIME_SKIP / tier-skip), which do not exist in the prod build.
//
// Port: vite preview defaults to 4173; we pin it explicitly so the webServer URL
// and the baseURL agree. reuseExistingServer locally (fast iteration); CI always
// boots a fresh preview server.
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
    // Serve the built artifact (dist/) — the production bundle, not dev mode.
    // CI runs `npm run build` immediately before `playwright test`, so dist/ is
    // fresh. `--port 4173` matches baseURL; `--strictPort` fails fast if the
    // port is taken rather than silently picking another.
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
