// Test Context Extension
// Extends Playwright's context with screenshot capture, data validation, and reporting

import { ScreenshotManager } from './screenshot-manager.js';
import { DataValidator } from './data-validation.js';
import { ReportGenerator } from './report-generator.js';

export class TestContext {
  constructor(page, testName, userStory = null) {
    this.page = page;
    this.testName = testName;
    this.userStory = userStory;
    this.steps = [];
    this.stepCounter = 1;
    this.screenshotManager = new ScreenshotManager(testName);
    this.dataValidator = new DataValidator(page);
  }

  async initialize() {
    await this.screenshotManager.initialize();
  }

  /**
   * Capture a test step with screenshot and details
   */
  async captureStep(stepName, details) {
    const stepNumber = this.stepCounter++;
    const step = {
      number: stepNumber,
      name: stepName,
      description: details.description,
      expectations: details.expectations || [],
      timestamp: new Date().toISOString(),
      screenshot: null,
      dataValidation: null
    };

    // Capture screenshot
    const screenshotInfo = await this.screenshotManager.capture(
      this.page,
      stepNumber,
      stepName,
      details.screenshotOptions || {}
    );
    step.screenshot = screenshotInfo.relativePath;

    // Log step
    console.log(`\n📸 Step ${stepNumber}: ${stepName}`);
    console.log(`   ${details.description}`);

    this.steps.push(step);

    return step;
  }

  /**
   * Validate data and attach to most recent step
   */
  async validateData(dataType, validationFn) {
    let result;

    switch (dataType) {
      case 'documents':
        result = await this.dataValidator.validateDocuments();
        break;
      case 'clipboard':
        result = await this.dataValidator.queryByType('clipboard');
        break;
      default:
        // Custom validation function
        result = await validationFn(this.dataValidator);
    }

    // Attach to most recent step
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].dataValidation = result;
    }

    return result;
  }

  /**
   * Get the data validator for custom queries
   */
  getDataValidator() {
    return this.dataValidator;
  }

  /**
   * Generate the test report
   */
  async generateReport() {
    const reportGenerator = new ReportGenerator(this);
    return await reportGenerator.generate();
  }

  /**
   * Wait with optional description
   */
  async wait(ms, description = null) {
    if (description) {
      console.log(`   ⏱️  Waiting ${ms}ms: ${description}`);
    }
    await this.page.waitForTimeout(ms);
  }
}

/**
 * Fixture factory to create test context
 */
export function createTestContextFixture(testInfo) {
  return async ({ page }, use) => {
    const testName = testInfo.titlePath.join('_').replace(/\s+/g, '-').toLowerCase();
    const testContext = new TestContext(page, testName);
    await testContext.initialize();

    await use(testContext);

    // Generate report after test completion
    await testContext.generateReport();
  };
}
