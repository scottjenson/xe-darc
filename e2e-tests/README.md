# Darc Browser E2E Tests

End-to-end tests for Darc Browser using Playwright, following the strategy outlined in `e2e-testing-strategy.md`.

## Overview

This test suite implements comprehensive E2E testing with:
- **User Story-based tests** that follow real user workflows
- **Visual documentation** with step-by-step screenshots
- **Data validation** of internal structures (PouchDB, state)
- **Human-readable reports** generated as README.md files

## Directory Structure

```
e2e-tests/
├── tests/                          # Test files
│   └── 004-clipboard-history.spec.js
├── fixtures/                       # Test data and setup utilities
├── helpers/                        # Shared utilities
│   ├── data-validation.js         # PouchDB/state inspection
│   ├── screenshot-manager.js      # Screenshot capture
│   ├── report-generator.js        # README.md generation
│   └── test-context.js            # Extended test context
├── reports/                        # Generated test reports
│   └── [test-name]/
│       ├── README.md              # Test report with screenshots
│       └── screenshots/           # Step-by-step screenshots
├── playwright.config.js            # Playwright configuration
└── package.json                    # Dependencies and scripts
```

## Setup

### Prerequisites
- Node.js >= 23.0.0
- npm or pnpm

### Installation

1. Navigate to the e2e-tests directory:
```bash
cd e2e-tests
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npm run install:playwright
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in headed mode (see browser):
```bash
npm run test:headed
```

### Run specific test (clipboard history):
```bash
npm run test:clipboard
```

### Debug tests:
```bash
npm run test:debug
```

### View test report:
```bash
npm run report
```

## Test Reports

After running tests, visual reports are generated in the `reports/` directory. Each test creates:
- `README.md` - Human-readable report with embedded screenshots
- `screenshots/` - Step-by-step visual documentation

Example report structure:
```
reports/
└── clipboard-history-copy-text-and-view-in-clipboard-history/
    ├── README.md
    └── screenshots/
        ├── 001-initial-state.png
        ├── 002-text-copied.png
        ├── 003-sidebar-opened.png
        └── 004-entry-visible.png
```

## Available Tests

### Clipboard History Tests (`004-clipboard-history.spec.js`)

1. **Copy text and view in clipboard history**
   - Tests basic clipboard capture
   - Verifies entry appears in sidebar
   - Validates PouchDB storage

2. **Copy multiple entries and verify all appear**
   - Tests handling of multiple clipboard entries
   - Verifies chronological ordering

3. **Delete clipboard entry**
   - Tests delete functionality
   - Verifies removal from UI and database

4. **Verify empty state**
   - Tests empty state UI
   - Verifies helpful messaging

5. **Persistence across page refresh**
   - Tests data persistence
   - Verifies PouchDB storage across sessions

## Test Strategy

Each test follows this pattern:

1. **Setup**: Prepare initial state
2. **Action**: Perform user action
3. **Visual Capture**: Take screenshot with `testContext.captureStep()`
4. **Data Validation**: Verify internal data with `testContext.validateData()`
5. **Assertion**: Verify expected outcome with Playwright assertions
6. **Documentation**: Auto-generate README.md with screenshots

### Example Test Structure

```javascript
test('Feature name', async ({ page }) => {
  // Step 1: Capture initial state
  await testContext.captureStep('initial-state', {
    description: 'Description of current state',
    expectations: [
      'Expected outcome 1',
      'Expected outcome 2'
    ]
  });

  // Step 2: Perform action
  await page.click('button');
  
  // Step 3: Capture result
  await testContext.captureStep('action-completed', {
    description: 'Result of action',
    expectations: ['Expected result']
  });

  // Step 4: Validate data
  await testContext.validateData('clipboard', async (validator) => {
    const docs = await validator.queryByType('clipboard');
    expect(docs.length).toBeGreaterThan(0);
    return { totalEntries: docs.length };
  });
});
```

## Helpers

### TestContext
Extended context providing:
- `captureStep()` - Capture screenshot with description
- `validateData()` - Validate PouchDB documents
- `getDataValidator()` - Access data validation utilities
- `generateReport()` - Generate README.md report

### DataValidator
Utilities for validating internal data:
- `queryByType()` - Query PouchDB documents by type
- `getDocument()` - Get specific document by ID
- `countDocuments()` - Count documents of a type
- `waitForDocumentCount()` - Wait for expected document count

### ScreenshotManager
Screenshot capture and organization:
- `capture()` - Capture full page screenshot
- `captureElement()` - Capture specific element

### ReportGenerator
Generate human-readable test reports:
- `generate()` - Create README.md with embedded screenshots
- Includes user story, acceptance criteria, and step-by-step results

## CI/CD Integration

The tests are configured to run in CI environments with:
- Automatic retries on failure
- Video recording on failure
- HTML report generation
- Screenshot capture on failure

## Troubleshooting

### Tests fail to run
- Ensure dev server is running on port 5193
- Check that Playwright browsers are installed
- Verify Node.js version >= 23.0.0

### Screenshots not captured
- Check permissions in `reports/` directory
- Verify `screenshotManager.initialize()` was called

### Data validation fails
- Ensure PouchDB is accessible via `window.db`
- Check browser console for errors
- Verify timing with `testContext.wait()`

## Contributing

When adding new tests:
1. Follow the user story format
2. Use `testContext.captureStep()` for each significant step
3. Validate data at critical points
4. Ensure report is generated with `testContext.generateReport()`
5. Document expected outcomes clearly

## Related Documentation

- `../e2e-testing-strategy.md` - Overall testing strategy
- `../clipboard-mvp.md` - Clipboard history MVP specification
- `playwright.config.js` - Playwright configuration
