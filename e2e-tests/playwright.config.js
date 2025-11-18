// Playwright Configuration for Darc Browser E2E Tests

import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Maximum time for expect() assertions
  expect: {
    timeout: 10000
  },
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests
  workers: 1,
  
  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report') }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: 'https://localhost:5194',
    ignoreHTTPSErrors: true,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Browser viewport
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:5194',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    cwd: path.join(__dirname, '..'),
    ignoreHTTPSErrors: true
  },
});
