# E2E Tests for Darc Browser

This directory contains end-to-end tests for the Darc Browser, built using Playwright. The tests follow the strategy outlined in `/e2e/e2e-testing-strategy.md`.

## 📋 Current Status

**The E2E test infrastructure is complete and ready to use.** See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed status information.

The clipboard history tests are fully implemented but require the clipboard history feature to be built first. See the implementation status document for next steps.

## Directory Structure

```
e2e-tests/
├── tests/                          # Test files organized by feature
│   └── 004-clipboard-history.spec.js
├── helpers/                        # Shared utilities
│   ├── test-context.js            # Test context and step capture
│   ├── data-validation.js         # PouchDB/state validation helpers
│   ├── screenshot-manager.js      # Screenshot capture utilities
│   └── report-generator.js        # README.md report generation
├── fixtures/                       # Test data and setup utilities
│   ├── test-data.js               # Test data management
│   └── browser-setup.js           # Browser configuration
├── reports/                        # Generated test reports (created during test runs)
└── README.md                       # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

3. Ensure SSL certificates are generated:
```bash
cd certs && bash create.sh && cd ..
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test e2e-tests/tests/004-clipboard-history.spec.js
```

## Test Reports

After each test run, the following reports are generated:

### 1. Human-Readable Reports
- Location: `e2e-tests/reports/{test-name}/README.md`
- Contains: Step-by-step walkthrough with screenshots and expectations
- Format: Markdown with embedded images

### 2. Playwright HTML Report
- Location: `playwright-report/index.html`
- Open with: `npx playwright show-report`
- Contains: Detailed test execution results, traces, and videos

### 3. JSON Results
- Location: `test-results.json`
- Contains: Machine-readable test results

## Test Structure

Each test follows this pattern:

1. **Setup**: Initialize test context, validators, and data managers
2. **Action**: Perform user actions (copy, click, etc.)
3. **Capture**: Take screenshot with expectations
4. **Validate**: Verify internal data structures (PouchDB)
5. **Assert**: Check expected outcomes
6. **Report**: Generate human-readable documentation

## Clipboard History Tests

The clipboard history test suite (`004-clipboard-history.spec.js`) validates:

- ✅ Copying text and storing in clipboard history
- ✅ Deleting clipboard entries
- ✅ Persistence across page reloads
- ✅ Empty state handling
- ✅ Chronological ordering of entries

## Writing New Tests

To create a new E2E test:

1. Create a new spec file in `e2e-tests/tests/`
2. Import the helper utilities:
```javascript
import { TestContext } from '../helpers/test-context.js';
import { DataValidator } from '../helpers/data-validation.js';
import { TestDataManager } from '../fixtures/test-data.js';
import { BrowserSetup } from '../fixtures/browser-setup.js';
```

3. Follow the testing pattern from existing tests
4. Use `testContext.captureStep()` for each significant action
5. Validate data with `dataValidator` methods
6. Generate report in `afterEach` hook

## Best Practices

1. **Use data-testid**: Add `data-testid` attributes to components for reliable selectors
2. **Wait appropriately**: Use smart waits instead of fixed timeouts when possible
3. **Validate data**: Always check both UI state and internal data structures
4. **Capture steps**: Document each significant step with screenshots
5. **Clean up**: Reset test data between tests for isolation

## Troubleshooting

### Tests fail with "Database not ready"
- Increase timeout in `BrowserSetup.waitForAppReady()`
- Check if the app is starting correctly
- Verify SSL certificates are generated

### Screenshots are not captured
- Ensure directories exist (created automatically)
- Check file permissions
- Verify `fullPage: true` option is working

### Clipboard tests fail
- Verify clipboard permissions are granted
- Check if browser supports clipboard API
- Ensure HTTPS is being used (required for clipboard API)

## CI/CD Integration

Tests can be run in CI environments:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: e2e-test-reports
    path: e2e-tests/reports/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [E2E Testing Strategy](/e2e/e2e-testing-strategy.md)
- [Clipboard History MVP](/designs/clipboard-history/clipboard-mvp.md)
