import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  fullyParallel: false, // Run tests sequentially for better visibility
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run one test at a time for visual testing
  reporter: 'list',
  timeout: 60000, // 60s per test (Turbopack first-compile can be slow)

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slow down for visual testing
    launchOptions: {
      slowMo: 500, // Slow down by 500ms per action
    },
  },

  projects: [
    {
      name: 'integration',
      testDir: './tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      timeout: 600000,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],

  // Don't start server automatically - we'll do it manually
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  // },
});
