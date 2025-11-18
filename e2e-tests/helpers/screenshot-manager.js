// Screenshot Manager
// Handles screenshot capture and organization for E2E tests

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ScreenshotManager {
  constructor(testName) {
    this.testName = testName;
    this.baseDir = path.join(__dirname, '..', 'reports', testName, 'screenshots');
  }

  async initialize() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async capture(page, stepNumber, stepName, options = {}) {
    const filename = `${String(stepNumber).padStart(3, '0')}-${stepName}.png`;
    const filepath = path.join(this.baseDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage ?? true,
      ...options
    });

    return {
      filename,
      filepath,
      relativePath: `screenshots/${filename}`
    };
  }

  async captureElement(page, selector, stepNumber, stepName) {
    const element = await page.locator(selector);
    const filename = `${String(stepNumber).padStart(3, '0')}-${stepName}-element.png`;
    const filepath = path.join(this.baseDir, filename);

    await element.screenshot({ path: filepath });

    return {
      filename,
      filepath,
      relativePath: `screenshots/${filename}`
    };
  }
}
