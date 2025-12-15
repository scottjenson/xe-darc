import fs from 'fs/promises';
import path from 'path';

/**
 * ReportGenerator creates human-readable markdown reports
 * with screenshots and test results
 */
export class ReportGenerator {
  constructor(testContext) {
    this.context = testContext;
  }
  
  /**
   * Generate the report
   * @returns {string} - Path to generated report
   */
  async generate() {
    const markdown = this.generateMarkdown();
    const reportPath = path.join(this.context.screenshotDir, 'README.md');
    
    await fs.mkdir(this.context.screenshotDir, { recursive: true });
    await fs.writeFile(reportPath, markdown, 'utf8');
    
    return reportPath;
  }
  
  /**
   * Generate markdown content
   * @returns {string} - Markdown content
   */
  generateMarkdown() {
    const { testName, steps } = this.context;
    
    let md = `# Test Report: ${testName}\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `**Total Steps**: ${steps.length}\n\n`;
    md += `## Test Overview\n\n`;
    md += `This report documents the step-by-step execution of the "${testName}" test suite.\n\n`;
    md += `---\n\n`;
    
    for (const step of steps) {
      md += this.generateStepSection(step);
    }
    
    md += `## Summary\n\n`;
    md += `- **Total Steps**: ${steps.length}\n`;
    md += `- **Test Name**: ${testName}\n`;
    md += `- **Status**: ✅ Completed\n\n`;
    
    return md;
  }
  
  /**
   * Generate markdown for a single step
   * @param {Object} step - Step object
   * @returns {string} - Markdown content for the step
   */
  generateStepSection(step) {
    let section = `## Step ${step.number}: ${step.name}\n\n`;
    section += `**Description**: ${step.description}\n\n`;
    section += `**Timestamp**: ${step.timestamp}\n\n`;
    
    section += `### Screenshot\n\n`;
    section += `![${step.name}](${step.screenshot})\n\n`;
    
    if (step.expectations && step.expectations.length > 0) {
      section += `### Expected Outcomes\n\n`;
      for (const expectation of step.expectations) {
        section += `- ✓ ${expectation}\n`;
      }
      section += `\n`;
    }
    
    if (step.dataValidation) {
      section += `### Data Validation\n\n`;
      section += '```json\n';
      section += JSON.stringify(step.dataValidation, null, 2);
      section += '\n```\n\n';
    }
    
    if (step.notes) {
      section += `### Notes\n\n`;
      section += `${step.notes}\n\n`;
    }
    
    section += `---\n\n`;
    
    return section;
  }
  
  /**
   * Generate a summary report for multiple tests
   * @param {Array} testContexts - Array of test contexts
   * @returns {string} - Summary markdown
   */
  static generateSummary(testContexts) {
    let md = `# E2E Test Suite Summary\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `**Total Tests**: ${testContexts.length}\n\n`;
    
    md += `## Test Results\n\n`;
    
    for (const context of testContexts) {
      md += `### ${context.testName}\n\n`;
      md += `- **Steps**: ${context.steps.length}\n`;
      md += `- **Report**: [View Details](${context.testName}/README.md)\n\n`;
    }
    
    return md;
  }
}
