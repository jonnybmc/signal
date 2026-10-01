import { defineConfig, devices } from '@playwright/test';
import { REPORT_ORIGIN, SPIKE_ORIGIN } from './tests/e2e/server-origins';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    trace: 'on-first-retry',
    // Skip the landing entrance orchestration in e2e lanes so tests land in
    // final state immediately. `reducedMotion: 'reduce'` also zeros all
    // CSS transitions via the --sr-motion-* tokens → deterministic runs.
    contextOptions: { reducedMotion: 'reduce' }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: [
    {
      command: 'pnpm --filter @stroma-labs/signal-report-app dev --host 127.0.0.1 --port 44174 --strictPort',
      url: REPORT_ORIGIN,
      reuseExistingServer: false
    },
    {
      command: 'pnpm --filter @stroma-labs/signal-spike-lab dev --host 127.0.0.1 --port 44173 --strictPort',
      url: SPIKE_ORIGIN,
      env: { VITE_SIGNAL_REPORT_BASE_URL: `${REPORT_ORIGIN}/r` },
      reuseExistingServer: false
    }
  ]
});
