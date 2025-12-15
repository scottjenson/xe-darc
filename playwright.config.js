import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests/tests',
  
  // Test timeout
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Fail fast on CI
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: 'https://localhost:5193',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on first retry
    video: 'retain-on-failure',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Accept self-signed certificates for localhost
    ignoreHTTPSErrors: true,
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Browser context options
    contextOptions: {
      // Record video
      recordVideo: {
        dir: 'e2e-tests/videos/'
      }
    }
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable experimental features if needed
        launchOptions: {
          args: [
            '--enable-features=IsolatedWebApp',
            '--enable-experimental-web-platform-features'
          ]
        }
      },
    },
  ],
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:5193',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    ignoreHTTPSErrors: true,
  },
});
