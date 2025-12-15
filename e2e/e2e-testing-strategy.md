# E2E Testing Strategy for Darc Browser

## Overview

This document outlines a comprehensive End-to-End (E2E) testing strategy for Darc Browser using Playwright. The strategy focuses on creating user story-based tests that validate functionality through step-by-step walkthroughs, internal data structure validation, and visual documentation through screenshots.

## Goals

1. **User-Centric Testing**: Tests should follow real user stories and workflows
2. **Visual Documentation**: Each test step should be captured as a screenshot for human validation
3. **Data Validation**: Verify internal data structures (PouchDB, state) at each critical step
4. **Maintainability**: Tests should be easy to understand, update, and extend
5. **Debuggability**: Failed tests should provide clear visual and data evidence
6. **Human-Readable Reports**: Generate README.md files that link screenshots and expectations

## Architecture

### High-Level Structure

```
e2e-tests/
├── tests/                          # Test files organized by feature
│   ├── 001-tab-management.spec.js
│   ├── 002-sidebar-navigation.spec.js
│   ├── 003-agent-interaction.spec.js
│   └── 004-clipboard-history.spec.js
├── fixtures/                       # Test data and setup utilities
│   ├── test-data.js
│   └── browser-setup.js
├── helpers/                        # Shared utilities
│   ├── data-validation.js         # PouchDB/state inspection helpers
│   ├── screenshot-manager.js      # Screenshot capture and organization
│   ├── report-generator.js        # README.md generation
│   └── test-context.js            # Extended Playwright context
├── reports/                        # Generated test reports
│   ├── 001-tab-management/
│   │   ├── README.md
│   │   └── screenshots/
│   │       ├── 001-screenshot.png
│   │       ├── 002-screenshot.png
│   │       └── 003-screenshot.png
│   └── 002-sidebar-navigation/
│       └── ...
├── playwright.config.js            # Playwright configuration
└── README.md                       # Overview and setup instructions
```

### Technology Stack

- **Playwright**: Primary E2E testing framework
- **Node.js**: Runtime environment (>=23.0.0)
- **Custom Helpers**: Data validation and reporting utilities
- **Screenshot Storage**: Organized by test suite and step

## Testing Methodology

### User Story Structure

Each test should follow a user story format:

```javascript
/**
 * User Story: As a user, I want to create a new tab so I can browse multiple sites
 * 
 * Acceptance Criteria:
 * - User can click the "New Tab" button
 * - A new tab appears in the tab list
 * - The new tab becomes the active tab
 * - The new tab has the correct default URL
 * - PouchDB contains the new tab document
 */
test('Create new tab', async ({ page, testContext }) => {
  // Test implementation
});
```

### Step-by-Step Testing Pattern

Each test should follow this pattern:

1. **Setup**: Prepare initial state
2. **Action**: Perform user action
3. **Visual Capture**: Take screenshot
4. **Data Validation**: Verify internal data structures
5. **Assertion**: Verify expected outcome
6. **Documentation**: Log step details for report

Example:

```javascript
test('Create and rename tab', async ({ page, testContext }) => {
  // Step 1: Initial State
  await testContext.captureStep('initial-state', {
    description: 'Application loaded with default tab',
    expectations: [
      'Tab sidebar is visible',
      'One default tab exists',
      'Default tab is active'
    ]
  });
  
  // Validate initial data
  const initialTabs = await testContext.validateData('tabs', async (db) => {
    const tabs = await db.allDocs({ include_docs: true });
    expect(tabs.rows).toHaveLength(1);
    return tabs.rows;
  });
  
  // Step 2: Click New Tab Button
  await page.click('[data-testid="new-tab-button"]');
  await page.waitForTimeout(500); // Wait for animation
  
  await testContext.captureStep('new-tab-created', {
    description: 'New tab created and activated',
    expectations: [
      'Two tabs visible in sidebar',
      'New tab is active',
      'New tab has default URL'
    ]
  });
  
  // Validate new tab in data
  await testContext.validateData('tabs', async (db) => {
    const tabs = await db.allDocs({ include_docs: true });
    expect(tabs.rows).toHaveLength(2);
    const newTab = tabs.rows[1].doc;
    expect(newTab.url).toBe('about:blank');
    expect(newTab.active).toBe(true);
  });
  
  // Step 3: Rename Tab
  await page.dblclick('[data-testid="tab-title"]');
  await page.fill('[data-testid="tab-title-input"]', 'My Custom Tab');
  await page.press('[data-testid="tab-title-input"]', 'Enter');
  
  await testContext.captureStep('tab-renamed', {
    description: 'Tab renamed successfully',
    expectations: [
      'Tab title displays "My Custom Tab"',
      'Tab title is no longer editable',
      'Changes persisted to PouchDB'
    ]
  });
  
  // Validate renamed tab
  await testContext.validateData('tabs', async (db) => {
    const tabs = await db.allDocs({ include_docs: true });
    const renamedTab = tabs.rows.find(row => row.doc.title === 'My Custom Tab');
    expect(renamedTab).toBeDefined();
  });
});
```

## Helper Utilities

### Test Context Extension

Create a custom test context that extends Playwright's context:

```javascript
// helpers/test-context.js
import fs from 'fs/promises';

export class TestContext {
  constructor(page, testName) {
    this.page = page;
    this.testName = testName;
    this.steps = [];
    this.screenshotDir = `reports/${testName}`;
    this.stepCounter = 1;
  }
  
  async captureStep(stepName, details) {
    const stepNumber = String(this.stepCounter).padStart(3, '0');
    const step = {
      number: this.stepCounter++,
      name: stepName,
      description: details.description,
      expectations: details.expectations,
      timestamp: new Date().toISOString(),
      screenshot: `screenshots/${stepNumber}-screenshot.png`
    };
    
    // Create screenshots directory
    const screenshotPath = `${this.screenshotDir}/screenshots`;
    await fs.mkdir(screenshotPath, { recursive: true });
    
    // Capture screenshot
    await this.page.screenshot({
      path: `${this.screenshotDir}/${step.screenshot}`,
      fullPage: true
    });
    
    this.steps.push(step);
    
    return step;
  }
  
  async validateData(dataType, validationFn) {
    // Access PouchDB via page context
    const result = await this.page.evaluate(async (type) => {
      // Access the global data store
      if (window.db) {
        return await validationFn(window.db);
      }
      throw new Error('PouchDB not accessible');
    }, dataType);
    
    return result;
  }
  
  async generateReport() {
    // Generate README.md from steps
    const reportGenerator = new ReportGenerator(this);
    await reportGenerator.generate();
  }
}
```

### Data Validation Helper

```javascript
// helpers/data-validation.js
export class DataValidator {
  constructor(page) {
    this.page = page;
  }
  
  /**
   * Validate PouchDB documents
   */
  async validateDocuments(query, assertions) {
    const docs = await this.page.evaluate(async (q) => {
      const db = window.db;
      if (!db) throw new Error('PouchDB not available');
      
      const result = await db.allDocs({
        include_docs: true,
        ...q
      });
      
      return result.rows.map(row => row.doc);
    }, query);
    
    // Run assertions
    for (const assertion of assertions) {
      assertion(docs);
    }
    
    return docs;
  }
  
  /**
   * Validate reactive state
   */
  async validateState(stateKey) {
    const state = await this.page.evaluate((key) => {
      // Access Svelte stores or global state
      if (window.appState) {
        return window.appState[key];
      }
      throw new Error(`State ${key} not accessible`);
    }, stateKey);
    
    return state;
  }
  
  /**
   * Wait for data condition
   */
  async waitForDataCondition(conditionFn, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.page.evaluate(conditionFn);
      if (result) return true;
      await this.page.waitForTimeout(100);
    }
    
    throw new Error('Data condition not met within timeout');
  }
}
```

### Screenshot Manager

```javascript
// helpers/screenshot-manager.js
import fs from 'fs/promises';
import path from 'path';

export class ScreenshotManager {
  constructor(testName) {
    this.testName = testName;
    this.baseDir = path.join('e2e-tests', 'reports', testName);
  }
  
  async initialize() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }
  
  async capture(page, stepName, options = {}) {
    const filename = `${stepName}.png`;
    const filepath = path.join(this.baseDir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage ?? true,
      ...options
    });
    
    return {
      filename,
      filepath,
      relativePath: path.relative('e2e-tests/reports', filepath)
    };
  }
  
  async captureElement(page, selector, stepName) {
    const element = await page.locator(selector);
    const filename = `${stepName}-element.png`;
    const filepath = path.join(this.baseDir, filename);
    
    await element.screenshot({ path: filepath });
    
    return {
      filename,
      filepath,
      relativePath: path.relative('e2e-tests/reports', filepath)
    };
  }
}
```

### Report Generator

```javascript
// helpers/report-generator.js
import fs from 'fs/promises';
import path from 'path';

export class ReportGenerator {
  constructor(testContext) {
    this.context = testContext;
  }
  
  async generate() {
    const markdown = this.generateMarkdown();
    const reportPath = path.join(this.context.screenshotDir, 'README.md');
    
    await fs.writeFile(reportPath, markdown, 'utf8');
    
    return reportPath;
  }
  
  generateMarkdown() {
    const { testName, steps } = this.context;
    
    let md = `# Test Report: ${testName}\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `**Total Steps**: ${steps.length}\n\n`;
    
    for (const step of steps) {
      md += `## Step ${step.number}: ${step.name}\n\n`;
      md += `**Description**: ${step.description}\n\n`;
      
      md += `### Screenshot\n\n`;
      md += `![${step.name}](${step.screenshot})\n\n`;
      
      md += `### Expected Outcomes\n\n`;
      for (const expectation of step.expectations) {
        md += `- ✓ ${expectation}\n`;
      }
      md += `\n`;
      
      if (step.dataValidation) {
        md += `### Data Validation\n\n`;
        md += JSON.stringify(step.dataValidation, null, 2);
        md += '\n\n';
      }
    }
    
    return md;
  }
}
```

## Test Examples

### Example 1: Tab Management Test

```javascript
// e2e-tests/tests/001-tab-management.spec.js
import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';
import { DataValidator } from '../helpers/data-validation.js';

test.describe('Tab Management', () => {
  let testContext;
  let dataValidator;
  
  test.beforeEach(async ({ page }) => {
    testContext = new TestContext(page, '001-tab-management');
    dataValidator = new DataValidator(page);
    
    // Navigate to app
    await page.goto('https://localhost:5194');
    await page.waitForLoadState('networkidle');
    
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="app-ready"]');
  });
  
  test.afterEach(async () => {
    // Generate report
    await testContext.generateReport();
  });
  
  test('User creates a new tab', async ({ page }) => {
    // Step 1: Capture initial state
    await testContext.captureStep('initial-state', {
      description: 'Application loaded with default tab',
      expectations: [
        'Tab sidebar is visible',
        'Default tab is present',
        'New tab button is visible'
      ]
    });
    
    // Validate initial state
    const initialTabs = await dataValidator.validateDocuments(
      { include_docs: true },
      [
        (docs) => expect(docs.filter(d => d.type === 'tab')).toHaveLength(1)
      ]
    );
    
    // Step 2: Click new tab button
    await page.click('[data-testid="new-tab-button"]');
    
    // Wait for new tab animation
    await page.waitForTimeout(500);
    
    await testContext.captureStep('new-tab-created', {
      description: 'User clicked new tab button',
      expectations: [
        'Second tab appears in tab list',
        'New tab becomes active',
        'New tab has default URL'
      ]
    });
    
    // Validate new tab created
    await dataValidator.waitForDataCondition(async () => {
      const tabs = await window.db.allDocs({ include_docs: true });
      return tabs.rows.filter(r => r.doc.type === 'tab').length === 2;
    });
    
    const updatedTabs = await dataValidator.validateDocuments(
      { include_docs: true },
      [
        (docs) => {
          const tabs = docs.filter(d => d.type === 'tab');
          expect(tabs).toHaveLength(2);
          
          const newTab = tabs[1];
          expect(newTab.active).toBe(true);
          expect(newTab.url).toMatch(/about:blank|chrome:\/\/newtab/);
        }
      ]
    );
    
    // Step 3: Verify tab visible in UI
    const tabElements = await page.locator('[data-testid="tab-item"]').count();
    expect(tabElements).toBe(2);
    
    await testContext.captureStep('verification-complete', {
      description: 'Verified tab in UI and data store',
      expectations: [
        '2 tabs visible in sidebar',
        '2 tab documents in PouchDB',
        'New tab is marked as active'
      ]
    });
  });
  
  test('User closes a tab', async ({ page }) => {
    // Setup: Create multiple tabs
    await page.click('[data-testid="new-tab-button"]');
    await page.click('[data-testid="new-tab-button"]');
    await page.waitForTimeout(500);
    
    await testContext.captureStep('multiple-tabs-created', {
      description: 'Setup: Created 3 tabs total',
      expectations: [
        '3 tabs visible in sidebar',
        'Last tab is active'
      ]
    });
    
    // Get middle tab
    const middleTab = page.locator('[data-testid="tab-item"]').nth(1);
    
    // Hover to show close button
    await middleTab.hover();
    await page.waitForTimeout(200);
    
    await testContext.captureStep('hover-close-button', {
      description: 'Hover over middle tab to reveal close button',
      expectations: [
        'Close button is visible on hovered tab',
        'Close button has hover state'
      ]
    });
    
    // Click close button
    await middleTab.locator('[data-testid="tab-close-button"]').click();
    await page.waitForTimeout(500);
    
    await testContext.captureStep('tab-closed', {
      description: 'Clicked close button on middle tab',
      expectations: [
        '2 tabs remain in sidebar',
        'Tab was removed from PouchDB',
        'Active tab adjusted if necessary'
      ]
    });
    
    // Validate tab closed
    const remainingTabs = await dataValidator.validateDocuments(
      { include_docs: true },
      [
        (docs) => {
          const tabs = docs.filter(d => d.type === 'tab');
          expect(tabs).toHaveLength(2);
        }
      ]
    );
  });
});
```

### Example 2: Sidebar Navigation Test

```javascript
// e2e-tests/tests/002-sidebar-navigation.spec.js
import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';

test.describe('Sidebar Navigation', () => {
  let testContext;
  
  test.beforeEach(async ({ page }) => {
    testContext = new TestContext(page, '002-sidebar-navigation');
    await page.goto('https://localhost:5194');
    await page.waitForLoadState('networkidle');
  });
  
  test.afterEach(async () => {
    await testContext.generateReport();
  });
  
  test('User opens and closes right sidebar panels', async ({ page }) => {
    // Step 1: Initial state
    await testContext.captureStep('sidebar-closed', {
      description: 'Initial state with sidebar closed',
      expectations: [
        'Right sidebar is not visible',
        'Sidebar buttons are visible on right edge',
        'Main content area is full width'
      ]
    });
    
    // Step 2: Open Settings
    await page.click('[data-testid="sidebar-button-settings"]');
    await page.waitForTimeout(300);
    
    await testContext.captureStep('settings-opened', {
      description: 'Clicked settings button to open settings panel',
      expectations: [
        'Settings panel slides in from right',
        'Settings button is highlighted',
        'Settings content is visible',
        'Main content area is narrower'
      ]
    });
    
    // Verify settings panel visible
    await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();
    
    // Step 3: Switch to Agent panel
    await page.click('[data-testid="sidebar-button-agent"]');
    await page.waitForTimeout(300);
    
    await testContext.captureStep('agent-opened', {
      description: 'Clicked agent button to switch panels',
      expectations: [
        'Agent panel replaces settings panel',
        'Settings panel is no longer visible',
        'Agent button is highlighted',
        'Settings button is no longer highlighted'
      ]
    });
    
    // Verify panel switched
    await expect(page.locator('[data-testid="settings-panel"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();
    
    // Step 4: Close sidebar
    await page.click('[data-testid="sidebar-button-agent"]');
    await page.waitForTimeout(300);
    
    await testContext.captureStep('sidebar-closed-again', {
      description: 'Clicked agent button again to close sidebar',
      expectations: [
        'Sidebar slides out',
        'No buttons are highlighted',
        'Main content area returns to full width'
      ]
    });
    
    // Verify sidebar closed
    await expect(page.locator('[data-testid="agent-panel"]')).not.toBeVisible();
  });
});
```

### Example 3: Agent Interaction Test

```javascript
// e2e-tests/tests/003-agent-interaction.spec.js
import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';
import { DataValidator } from '../helpers/data-validation.js';

test.describe('Agent Interaction', () => {
  let testContext;
  let dataValidator;
  
  test.beforeEach(async ({ page }) => {
    testContext = new TestContext(page, '003-agent-interaction');
    dataValidator = new DataValidator(page);
    
    await page.goto('https://localhost:5194');
    await page.waitForLoadState('networkidle');
  });
  
  test.afterEach(async () => {
    await testContext.generateReport();
  });
  
  test('User sends message to AI agent', async ({ page }) => {
    // Step 1: Open agent panel
    await page.click('[data-testid="sidebar-button-agent"]');
    await page.waitForTimeout(300);
    
    await testContext.captureStep('agent-panel-opened', {
      description: 'Opened agent sidebar panel',
      expectations: [
        'Agent panel is visible',
        'Agent input field is empty',
        'Send button is visible',
        'No messages in history'
      ]
    });
    
    // Step 2: Type message
    const message = 'What is the weather today?';
    await page.fill('[data-testid="agent-input"]', message);
    
    await testContext.captureStep('message-typed', {
      description: `Typed message: "${message}"`,
      expectations: [
        'Input field contains message text',
        'Send button is enabled',
        'Character count updates if shown'
      ]
    });
    
    // Step 3: Send message
    await page.click('[data-testid="agent-send-button"]');
    await page.waitForTimeout(500);
    
    await testContext.captureStep('message-sent', {
      description: 'Sent message to agent',
      expectations: [
        'Message appears in chat history',
        'Input field is cleared',
        'Loading indicator appears',
        'Message stored in PouchDB'
      ]
    });
    
    // Validate message in UI
    await expect(page.locator('[data-testid="agent-message"]').last()).toContainText(message);
    
    // Validate message in data
    await dataValidator.waitForDataCondition(async () => {
      const messages = await window.db.find({
        selector: { type: 'agent-message' }
      });
      return messages.docs.length > 0;
    });
    
    // Step 4: Wait for response
    await page.waitForSelector('[data-testid="agent-response"]', { timeout: 10000 });
    
    await testContext.captureStep('response-received', {
      description: 'Received response from agent',
      expectations: [
        'Agent response appears in chat',
        'Loading indicator disappears',
        'Response is properly formatted',
        'Response stored in PouchDB'
      ]
    });
    
    // Validate response
    const responseText = await page.locator('[data-testid="agent-response"]').last().textContent();
    expect(responseText.length).toBeGreaterThan(0);
  });
});
```

## Configuration

### Playwright Configuration

```javascript
// e2e-tests/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
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
    baseURL: 'https://localhost:5194',
    
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
    
    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Web server configuration
  webServer: {
    command: 'pnpm run dev',
    url: 'https://localhost:5194',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    ignoreHTTPSErrors: true,
  },
});
```

## Best Practices

### 1. Test Organization

- **One user story per test**: Each test should validate one complete user journey
- **Descriptive names**: Use clear, action-oriented test names
- **Logical grouping**: Group related tests in describe blocks
- **Independent tests**: Tests should not depend on each other

### 2. Data Validation

- **Validate at critical points**: Check data after each major state change
- **Check both UI and data**: Verify UI reflects data and vice versa
- **Use specific selectors**: Prefer data-testid over CSS selectors
- **Wait for stability**: Use appropriate waits for animations and async operations

### 3. Screenshot Management

- **Consistent naming**: Use numbered files (001-screenshot.png, 002-screenshot.png, 003-screenshot.png) in a screenshots/ directory
- **Capture full context**: Use fullPage screenshots by default
- **Highlight key elements**: Use element screenshots for specific components
- **Organize by test**: Keep screenshots in test-specific directories (001-test-name/screenshots/)

### 4. Report Generation

- **Automated generation**: Generate reports automatically after each test
- **Clear expectations**: List all expected outcomes for each step
- **Visual evidence**: Include screenshots for every significant step
- **Data snapshots**: Include relevant data validation results

### 5. Debugging

- **Preserve artifacts**: Keep screenshots, videos, and traces on failure
- **Detailed errors**: Provide context in assertion messages
- **Step isolation**: Make it easy to re-run individual steps
- **Console logs**: Capture and review browser console output

### 6. Performance

- **Parallel execution**: Run independent tests in parallel
- **Efficient waits**: Use smart waits instead of fixed timeouts
- **Resource cleanup**: Clean up test data after each test
- **Selective screenshots**: Only capture screenshots when needed

### 7. Maintainability

- **Reusable helpers**: Extract common patterns into helper functions
- **Page objects**: Consider page object pattern for complex pages
- **Fixtures**: Use fixtures for common setup/teardown
- **Documentation**: Keep this design doc updated with patterns

## Test Data Management

### Setup and Teardown

```javascript
// e2e-tests/fixtures/test-data.js
export class TestDataManager {
  constructor(page) {
    this.page = page;
  }
  
  /**
   * Reset database to clean state
   */
  async resetDatabase() {
    await this.page.evaluate(async () => {
      if (window.db) {
        // Get all docs
        const allDocs = await window.db.allDocs();
        
        // Delete all docs
        const docsToDelete = allDocs.rows.map(row => ({
          _id: row.id,
          _rev: row.value.rev,
          _deleted: true
        }));
        
        await window.db.bulkDocs(docsToDelete);
      }
    });
  }
  
  /**
   * Seed database with test data
   */
  async seedDatabase(data) {
    await this.page.evaluate(async (testData) => {
      if (window.db) {
        await window.db.bulkDocs(testData);
      }
    }, data);
  }
  
  /**
   * Create a test tab
   */
  async createTestTab(properties = {}) {
    return await this.page.evaluate(async (props) => {
      const tab = {
        _id: `tab_${Date.now()}`,
        type: 'tab',
        title: 'Test Tab',
        url: 'about:blank',
        active: false,
        order: 0,
        ...props
      };
      
      const result = await window.db.put(tab);
      return { ...tab, _rev: result.rev };
    }, properties);
  }
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '23'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.13.1
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Generate certificates
        run: cd certs && bash create.sh && cd ..
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: pnpm exec playwright test
      
      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-reports
          path: e2e-tests/reports/
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Example Report Output

Here's what a generated README.md report would look like:

```markdown
# Test Report: 001-tab-management

**Generated**: 2024-11-18T04:58:58.513Z

**Total Steps**: 3

## Step 1: initial-state

**Description**: Application loaded with default tab

### Screenshot

![initial-state](screenshots/001-screenshot.png)

### Expected Outcomes

- ✓ Tab sidebar is visible
- ✓ Default tab is present
- ✓ New tab button is visible

### Data Validation

{
  "tabCount": 1,
  "tabs": [
    {
      "_id": "tab_default",
      "type": "tab",
      "title": "New Tab",
      "url": "about:blank",
      "active": true
    }
  ]
}

## Step 2: new-tab-created

**Description**: User clicked new tab button

### Screenshot

![new-tab-created](screenshots/002-screenshot.png)

### Expected Outcomes

- ✓ Second tab appears in tab list
- ✓ New tab becomes active
- ✓ New tab has default URL

### Data Validation

{
  "tabCount": 2,
  "activeTab": "tab_1234567890",
  "tabs": [
    {
      "_id": "tab_default",
      "type": "tab",
      "title": "New Tab",
      "url": "about:blank",
      "active": false
    },
    {
      "_id": "tab_1234567890",
      "type": "tab",
      "title": "New Tab",
      "url": "about:blank",
      "active": true
    }
  ]
}

## Step 3: verification-complete

**Description**: Verified tab in UI and data store

### Screenshot

![verification-complete](screenshots/003-screenshot.png)

### Expected Outcomes

- ✓ 2 tabs visible in sidebar
- ✓ 2 tab documents in PouchDB
- ✓ New tab is marked as active
```

## Implementation Guidelines for Agents

When implementing E2E tests following this strategy, agents should:

1. **Start with user stories**: Always begin by defining the user story and acceptance criteria
2. **Create helper utilities first**: Set up TestContext, DataValidator, and ScreenshotManager before writing tests
3. **Follow the step pattern**: Use the step-by-step pattern consistently across all tests
4. **Validate thoroughly**: Check both UI state and internal data structures
5. **Generate reports**: Always generate README.md reports with screenshots
6. **Use data-testid**: Add data-testid attributes to components for reliable selectors
7. **Handle timing**: Use appropriate waits for animations and async operations
8. **Keep tests independent**: Each test should set up its own state
9. **Document expectations**: Clearly list expected outcomes for each step
10. **Review generated reports**: Manually review the generated README.md and screenshots

## Practical Learnings from Implementation

This section captures key insights and lessons learned from building and debugging the E2E testing system. These practical tips can help avoid common pitfalls and accelerate future testing work across any feature.

### Environment Setup

Getting the development environment configured correctly is crucial for reliable E2E testing:

**Dev Server Setup**
- Start dev server in detached session for persistence: `dtach -A ./dtach/darc npm run dev`
- This allows the server to run continuously across multiple test sessions
- Reduces startup overhead and ensures consistent testing environment

**SSL Certificate Configuration**
- Generate SSL certs early in the process: `mkcert localhost 127.0.0.1`
- Self-signed certificates are required for HTTPS testing on localhost
- Many browser features (like advanced APIs) require secure contexts
- Don't wait until tests fail to set up certificates

**UI Validation Before Testing**
- Verify UI elements render and are interactive before writing tests
- Use browser DevTools to inspect element selectors and data-testid attributes
- Ensure animations complete before capturing screenshots
- Validate that target elements are visible and clickable

### Validating Internal State vs DOM

One of the most critical aspects of E2E testing is ensuring that internal data structures match what's displayed in the UI:

**Database-UI Synchronization**
- Database writes need 2.5-3.5 seconds before capturing screenshots
- IndexedDB operations are asynchronous and may not reflect immediately in UI
- Add explicit waits after user actions that trigger database updates
- Consider implementing auto-refresh in components (2-second interval recommended)

**Data Validation Strategy**
- Always validate both UI state AND internal data structures
- Check PouchDB documents after each significant user action
- Verify DOM elements reflect the current database state
- Use consistent selectors (data-testid) for reliable element identification

**Common Synchronization Issues**
- UI may update before database writes complete
- Database changes may not trigger UI updates without reactive patterns
- Test flakiness often indicates synchronization problems
- Wait for specific data conditions, not just arbitrary timeouts

### Database Query Patterns

PouchDB/IndexedDB require careful attention to index and query configuration:

**Index Field Matching**
- Index fields must match sort fields exactly - no exceptions
- Sort must include ALL index selector fields in the same order
- Partial index matching is not supported and will cause queries to fail

**Common Mistakes to Avoid**
- ❌ Sorting by only one field when index has multiple fields
- ❌ Sorting fields in different order than index definition
- ❌ Using fields in sort that aren't in the index
- ✅ Always match index fields exactly in sort clause

### Screenshot Strategies

Effective screenshot strategies for validation and debugging:

**Smart Waiting**
- Wait for specific UI elements, not just time delays
- Use `await page.waitForSelector('[data-testid="target-element"]')` instead of fixed timeouts
- Combine element waits with short timeouts for animations
- Wait for data to load before capturing screenshots

**Detecting Empty vs Populated States**
- Screenshot file size can indicate content presence
- Larger files (20KB+) typically indicate populated UI with content
- Smaller files (10-15KB) often indicate empty or minimal UI
- Use file size as a quick sanity check for data loading in automated tests

**Consistent UI State**
- Always show sidebar in consistent state (open/closed) for test screenshots
- Ensures consistent visual documentation
- Makes it easier to compare screenshots across test runs
- Helps identify UI regressions quickly

**Screenshot Organization**
- Capture before and after states for each operation
- Name screenshots descriptively (e.g., `01-initial-state.png`, `02-after-action.png`)
- Keep screenshots in test-specific directories
- Include timestamps in filenames for historical comparison

### Test Isolation and Debugging

**Test Isolation**
- Clear database state between tests to avoid data contamination
- Reset any modified application state before each test
- Use fresh browser contexts for each test suite
- Ensure tests can run independently in any order

**Debugging Strategies**
- Enable verbose logging for database operations
- Capture browser console logs during test execution
- Take screenshots on test failure for post-mortem analysis
- Use Playwright's trace viewer for detailed execution replay

**Performance Optimization**
- Reuse browser contexts where possible
- Parallelize independent tests
- Use headless mode in CI but headed mode for debugging
- Cache database indices to speed up queries

## Conclusion

This E2E testing strategy provides a comprehensive framework for validating Darc Browser functionality through user story-based tests with visual documentation. By following these guidelines, agents can create maintainable, debuggable, and well-documented tests that serve both as validation tools and as living documentation of the application's behavior.

The key principles are:
- **User-centric**: Tests follow real user workflows
- **Visual**: Screenshots provide clear evidence of behavior
- **Data-validated**: Internal state is verified at each step
- **Documented**: Generated reports are human-readable and reviewable
- **Maintainable**: Helper utilities and consistent patterns make tests easy to update

By adhering to this strategy, the test suite will provide confidence in the application's functionality while serving as valuable documentation for developers and stakeholders.
