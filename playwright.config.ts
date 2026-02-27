import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
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
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Make browser visible
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
