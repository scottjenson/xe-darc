// Report Generator
// Generates README.md files with embedded screenshots for test reports

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ReportGenerator {
  constructor(testContext) {
    this.context = testContext;
  }

  async generate() {
    const markdown = this.generateMarkdown();
    const reportDir = path.join(__dirname, '..', 'reports', this.context.testName);
    const reportPath = path.join(reportDir, 'README.md');

    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(reportPath, markdown, 'utf8');

    console.log(`✅ Test report generated: ${reportPath}`);
    return reportPath;
  }

  generateMarkdown() {
    const { testName, userStory, steps } = this.context;

    let md = `# Test Report: ${testName}\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `**Total Steps**: ${steps.length}\n\n`;

    if (userStory) {
      md += `## User Story\n\n`;
      md += `${userStory.description}\n\n`;

      if (userStory.acceptanceCriteria && userStory.acceptanceCriteria.length > 0) {
        md += `### Acceptance Criteria\n\n`;
        for (const criterion of userStory.acceptanceCriteria) {
          md += `- ${criterion}\n`;
        }
        md += `\n`;
      }
    }

    md += `---\n\n`;

    for (const step of steps) {
      md += `## Step ${step.number}: ${step.name}\n\n`;
      md += `**Description**: ${step.description}\n\n`;

      if (step.screenshot) {
        md += `### Screenshot\n\n`;
        md += `![${step.name}](${step.screenshot})\n\n`;
      }

      if (step.expectations && step.expectations.length > 0) {
        md += `### Expected Outcomes\n\n`;
        for (const expectation of step.expectations) {
          md += `- ✓ ${expectation}\n`;
        }
        md += `\n`;
      }

      if (step.dataValidation) {
        md += `### Data Validation\n\n`;
        md += `\`\`\`json\n`;
        md += JSON.stringify(step.dataValidation, null, 2);
        md += '\n```\n\n';
      }

      md += `---\n\n`;
    }

    return md;
  }
}
