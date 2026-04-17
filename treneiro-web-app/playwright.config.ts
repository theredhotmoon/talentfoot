import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for TalentFoot / Trenejro.
 *
 * Pre-requisites (run before tests):
 *   - Backend: php artisan serve --port=8000
 *   - Frontend: npm run dev (port 5173)
 *
 * Auth credentials (seed must exist):
 *   - Admin : admin@admin.com / 1234
 *   - User  : testuser@talentfoot.com / Password1!  (created by global setup if missing)
 */
export default defineConfig({
  testDir: './playwright/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // keep sequential — shared DB state
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  globalSetup: './playwright/global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
