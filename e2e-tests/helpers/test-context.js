import fs from 'fs/promises';
import path from 'path';

/**
 * TestContext extends Playwright's context to provide step capture,
 * screenshot management, and report generation functionality.
 */
export class TestContext {
  constructor(page, testName) {
    this.page = page;
    this.testName = testName;
    this.steps = [];
    this.screenshotDir = path.join('e2e-tests', 'reports', testName);
    this.stepCounter = 1;
  }
  
  /**
   * Capture a test step with screenshot and expectations
   */
  async captureStep(stepName, details) {
    const stepNumber = String(this.stepCounter).padStart(3, '0');
    const step = {
      number: this.stepCounter++,
      name: stepName,
      description: details.description,
      expectations: details.expectations || [],
      timestamp: new Date().toISOString(),
      screenshot: `screenshots/${stepNumber}-${stepName}.png`
    };
    
    // Create screenshots directory
    const screenshotPath = path.join(this.screenshotDir, 'screenshots');
    await fs.mkdir(screenshotPath, { recursive: true });
    
    // Capture screenshot
    await this.page.screenshot({
      path: path.join(this.screenshotDir, step.screenshot),
      fullPage: true
    });
    
    this.steps.push(step);
    
    return step;
  }
  
  /**
   * Validate data in the page context
   * This allows accessing PouchDB or other data structures
   */
  async validateData(dataType, validationFn) {
    // Execute validation function in the page context
    const result = await this.page.evaluate(async (fnString) => {
      // Create a function from the string
      const fn = eval(`(${fnString})`);
      
      // Access the global data store
      if (window.db) {
        return await fn(window.db);
      }
      throw new Error('PouchDB not accessible');
    }, validationFn.toString());
    
    return result;
  }
  
  /**
   * Generate a README.md report with all captured steps
   */
  async generateReport() {
    const markdown = this.generateMarkdown();
    const reportPath = path.join(this.screenshotDir, 'README.md');
    
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.writeFile(reportPath, markdown, 'utf8');
    
    return reportPath;
  }
  
  /**
   * Generate markdown content for the report
   */
  generateMarkdown() {
    const { testName, steps } = this;
    
    let md = `# Test Report: ${testName}\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `**Total Steps**: ${steps.length}\n\n`;
    md += `---\n\n`;
    
    for (const step of steps) {
      md += `## Step ${step.number}: ${step.name}\n\n`;
      md += `**Description**: ${step.description}\n\n`;
      
      md += `### Screenshot\n\n`;
      md += `![${step.name}](${step.screenshot})\n\n`;
      
      if (step.expectations && step.expectations.length > 0) {
        md += `### Expected Outcomes\n\n`;
        for (const expectation of step.expectations) {
          md += `- ✓ ${expectation}\n`;
        }
        md += `\n`;
      }
      
      if (step.dataValidation) {
        md += `### Data Validation\n\n`;
        md += '```json\n';
        md += JSON.stringify(step.dataValidation, null, 2);
        md += '\n```\n\n';
      }
      
      md += `---\n\n`;
    }
    
    return md;
  }
}
