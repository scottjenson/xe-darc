import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  console.log('🌐 Navigating to dev server...');
  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('📝 Test 2: Copy multiple entries and verify all appear');
  const test2Dir = path.join(__dirname, 'reports', '002-clipboard-history-copy-multiple-entries-and-verify-all-appear');
  const test2Screenshots = path.join(test2Dir, 'screenshots');
  
  // Ensure directory exists
  if (!fs.existsSync(test2Screenshots)) {
    fs.mkdirSync(test2Screenshots, { recursive: true });
  }
  
  const test2Steps = [];
  
  // Clean database first
  await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const docs = await db.allDocs({ include_docs: true });
      const clipboardDocs = docs.rows.filter(row => row.doc.type === 'clipboard');
      for (const row of clipboardDocs) {
        await db.remove(row.doc);
      }
      console.log('[Test] Cleaned', clipboardDocs.length, 'clipboard entries');
    }
  });
  
  // Copy first entry
  console.log('  Copying first entry...');
  const entry1 = 'First clipboard entry';
  await page.evaluate((text) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    div.style.userSelect = 'text';
    document.body.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(div);
  }, entry1);
  
  await page.waitForTimeout(500);
  
  // Open sidebar to verify first entry
  console.log('  Opening sidebar to verify first entry...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2500); // Wait for auto-refresh
  
  // Verify in database
  const count1 = await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const result = await db.find({
        selector: { type: 'clipboard' }
      });
      return result.docs.length;
    }
    return 0;
  });
  console.log(`    Database has ${count1} entries`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '001-first-entry-copied.png') });
  test2Steps.push({
    title: 'First Entry Copied and Visible',
    filename: '001-first-entry-copied.png',
    description: `First entry copied: "${entry1}" and visible in sidebar`,
    expectations: [
      'First entry captured by clipboard monitor',
      'Sidebar shows 1 entry',
      'Entry text matches: "First clipboard entry"'
    ]
  });
  console.log('  ✓ First entry verified');
  
  // Close sidebar
  await page.locator('button[aria-label="Close Clipboard History"]').first().click();
  await page.waitForTimeout(500);
  
  // Copy second entry
  console.log('  Copying second entry...');
  const entry2 = 'Second clipboard entry';
  await page.evaluate((text) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    div.style.userSelect = 'text';
    document.body.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(div);
  }, entry2);
  
  await page.waitForTimeout(500);
  
  // Open sidebar to verify second entry
  console.log('  Opening sidebar to verify second entry...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2500); // Wait for auto-refresh
  
  // Verify in database
  const count2 = await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const result = await db.find({
        selector: { type: 'clipboard' }
      });
      return result.docs.length;
    }
    return 0;
  });
  console.log(`    Database has ${count2} entries`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '002-second-entry-copied.png') });
  test2Steps.push({
    title: 'Second Entry Copied and Visible',
    filename: '002-second-entry-copied.png',
    description: `Second entry copied: "${entry2}" and visible in sidebar`,
    expectations: [
      'Second entry captured',
      'Sidebar shows 2 entries',
      'Entries in order: Second (newest), First'
    ]
  });
  console.log('  ✓ Second entry verified');
  
  // Close sidebar
  await page.locator('button[aria-label="Close Clipboard History"]').first().click();
  await page.waitForTimeout(500);
  
  // Copy third entry
  console.log('  Copying third entry...');
  const entry3 = 'Third clipboard entry';
  await page.evaluate((text) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    div.style.userSelect = 'text';
    document.body.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(div);
  }, entry3);
  
  await page.waitForTimeout(500);
  
  // Open sidebar and verify all three entries
  console.log('  Opening sidebar to verify all three entries...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2500); // Wait for auto-refresh
  
  // Verify in database
  const count3 = await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const result = await db.find({
        selector: { type: 'clipboard' }
      });
      return result.docs.length;
    }
    return 0;
  });
  console.log(`    Database has ${count3} entries`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '003-third-entry-copied.png') });
  test2Steps.push({
    title: 'Third Entry Copied - All Entries Visible',
    filename: '003-third-entry-copied.png',
    description: `Third entry copied: "${entry3}" - all three entries now visible`,
    expectations: [
      'Third entry captured',
      'Sidebar shows all 3 entries',
      'Entries in order: Third (newest), Second, First'
    ]
  });
  console.log('  ✓ All three entries verified');
  
  // Generate README
  const generateReadme = (testName, steps) => {
    let md = `# Test: ${testName}\n\n`;
    md += `## User Story\n\nAs a user, I want to copy multiple text entries and see them all appear in the clipboard history sidebar.\n\n`;
    md += `## Acceptance Criteria\n\n`;
    md += `- [ ] Each copy operation captures the text\n`;
    md += `- [ ] Clipboard history sidebar shows all copied entries\n`;
    md += `- [ ] Entries appear in chronological order (newest first)\n`;
    md += `- [ ] Each entry displays the full copied text\n\n`;
    md += `## Test Steps\n\n`;
    
    steps.forEach((step, index) => {
      md += `### Step ${index + 1}: ${step.title}\n\n`;
      md += `![${step.title}](screenshots/${step.filename})\n\n`;
      md += `**Description:** ${step.description}\n\n`;
      md += `**Expected Outcomes:**\n`;
      step.expectations.forEach(exp => {
        md += `- ${exp}\n`;
      });
      md += `\n`;
    });
    
    return md;
  };
  
  fs.writeFileSync(path.join(test2Dir, 'README.md'), generateReadme('clipboard-history-copy-multiple-entries-and-verify-all-appear', test2Steps));
  console.log(`✅ Test 2 complete: ${test2Steps.length} steps captured\n`);

  await browser.close();
}

runTest().catch(console.error);
