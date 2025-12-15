import fs from 'fs/promises';
import path from 'path';

/**
 * ScreenshotManager handles screenshot capture and organization
 */
export class ScreenshotManager {
  constructor(testName) {
    this.testName = testName;
    this.baseDir = path.join('e2e-tests', 'reports', testName, 'screenshots');
  }
  
  /**
   * Initialize the screenshot directory
   */
  async initialize() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }
  
  /**
   * Capture a full page screenshot
   * @param {Page} page - Playwright page object
   * @param {string} stepName - Name for the screenshot
   * @param {Object} options - Screenshot options
   * @returns {Object} - Screenshot metadata
   */
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
  
  /**
   * Capture a screenshot of a specific element
   * @param {Page} page - Playwright page object
   * @param {string} selector - Element selector
   * @param {string} stepName - Name for the screenshot
   * @returns {Object} - Screenshot metadata
   */
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
  
  /**
   * Capture multiple screenshots in sequence
   * @param {Page} page - Playwright page object
   * @param {Array} steps - Array of step names
   * @returns {Array} - Screenshot metadata for each step
   */
  async captureSequence(page, steps) {
    const screenshots = [];
    
    for (const step of steps) {
      const screenshot = await this.capture(page, step);
      screenshots.push(screenshot);
    }
    
    return screenshots;
  }
}
