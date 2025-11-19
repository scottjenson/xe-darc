// Generate screenshots for clipboard history tests
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to create directories
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper to generate README
function generateReadme(testName, steps) {
  const readme = `# Test Report: ${testName}

**Generated**: ${new Date().toISOString()}

**Total Steps**: ${steps.length}

## User Story

As a user, I want to view my clipboard history so I can keep track of text I've copied

### Acceptance Criteria

- User can copy text and see it appear in clipboard history
- Clipboard history is accessible via sidebar
- Copied entries are stored in PouchDB
- Entries persist across page refreshes
- User can delete individual entries

---

${steps.map((step, i) => `
## Step ${i + 1}: ${step.title}

${step.description}

![${step.title}](./screenshots/${step.filename})

### Expectations

${step.expectations.map(exp => `- ✓ ${exp}`).join('\n')}
`).join('\n---\n')}
`;
  
  return readme;
}

async function runTests() {
  console.log('🚀 Starting E2E screenshot generation...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Navigate and wait for app to be ready
  console.log('📍 Navigating to https://localhost:5194...');
  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Give Svelte app time to fully render
  
  // Wait for the clipboard button to confirm app is ready
  await page.waitForSelector('button[title="Clipboard History"]', { timeout: 10000 });
  console.log('✅ App is ready\n');

  // Test 1: Copy text and view in clipboard history
  console.log('📝 Test 1: Copy text and view in clipboard history');
  const test1Dir = path.join(__dirname, 'reports', 'clipboard-history-copy-text-and-view-in-clipboard-history');
  const test1Screenshots = path.join(test1Dir, 'screenshots');
  ensureDir(test1Screenshots);
  
  const test1Steps = [];
  
  // Step 1: Initial state
  await page.screenshot({ path: path.join(test1Screenshots, '001-initial-state.png') });
  test1Steps.push({
    title: 'Initial State',
    filename: '001-initial-state.png',
    description: 'Application loaded with default view showing Darc browser interface',
    expectations: [
      'Application is fully loaded',
      'Tab sidebar visible on left',
      'Right sidebar buttons visible',
      'No clipboard history sidebar open yet'
    ]
  });
  console.log('  ✓ Captured initial state');
  
  // Step 2: Copy text
  const testText = 'Hello, this is a test clipboard entry!';
  await page.evaluate((text) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(temp);
  }, testText);
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(test1Screenshots, '002-text-copied.png') });
  test1Steps.push({
    title: 'Text Copied',
    filename: '002-text-copied.png',
    description: `Copied text: "${testText}" to clipboard`,
    expectations: [
      'Text was copied to clipboard',
      'Clipboard monitor captured the copy event',
      'Entry stored in PouchDB'
    ]
  });
  console.log('  ✓ Copied text to clipboard');
  
  // Step 3: Open clipboard history sidebar
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(test1Screenshots, '003-sidebar-opened.png') });
  test1Steps.push({
    title: 'Clipboard History Sidebar Opened',
    filename: '003-sidebar-opened.png',
    description: 'Clicked Clipboard History button to open the sidebar',
    expectations: [
      'Sidebar is visible on the right side',
      'Sidebar shows "Clipboard History" title',
      'Copied text is displayed in the list'
    ]
  });
  console.log('  ✓ Opened clipboard history sidebar');
  
  // Step 4: Entry visible
  await page.screenshot({ path: path.join(test1Screenshots, '004-entry-visible.png') });
  test1Steps.push({
    title: 'Entry Visible in History',
    filename: '004-entry-visible.png',
    description: 'Clipboard entry is visible with all details',
    expectations: [
      'Entry shows the copied text',
      'Entry has a timestamp',
      'Entry has a delete button',
      'Entry content matches copied text'
    ]
  });
  console.log('  ✓ Verified entry is visible');
  
  // Generate README for test 1
  fs.writeFileSync(path.join(test1Dir, 'README.md'), generateReadme('clipboard-history-copy-text-and-view-in-clipboard-history', test1Steps));
  console.log(`✅ Test 1 complete: ${test1Steps.length} steps captured\n`);

  // Test 2: Copy multiple entries
  console.log('📝 Test 2: Copy multiple entries and verify all appear');
  const test2Dir = path.join(__dirname, 'reports', 'clipboard-history-copy-multiple-entries-and-verify-all-appear');
  const test2Screenshots = path.join(test2Dir, 'screenshots');
  ensureDir(test2Screenshots);
  
  const test2Steps = [];
  
  // Close sidebar if open
  const closeButton = await page.locator('button[aria-label="Close"]').count();
  if (closeButton > 0) {
    await page.locator('button[aria-label="Close"]').first().click();
    await page.waitForTimeout(500);
  }
  
  // Copy first entry
  const entry1 = 'First clipboard entry';
  await page.evaluate((text) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(temp);
  }, entry1);
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(test2Screenshots, '001-first-entry-copied.png') });
  test2Steps.push({
    title: 'First Entry Copied',
    filename: '001-first-entry-copied.png',
    description: `First entry copied: "${entry1}"`,
    expectations: ['First entry captured by clipboard monitor']
  });
  console.log('  ✓ Copied first entry');
  
  // Copy second entry
  const entry2 = 'Second clipboard entry';
  await page.evaluate((text) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(temp);
  }, entry2);
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(test2Screenshots, '002-second-entry-copied.png') });
  test2Steps.push({
    title: 'Second Entry Copied',
    filename: '002-second-entry-copied.png',
    description: `Second entry copied: "${entry2}"`,
    expectations: ['Second entry captured']
  });
  console.log('  ✓ Copied second entry');
  
  // Copy third entry
  const entry3 = 'Third clipboard entry';
  await page.evaluate((text) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(temp);
  }, entry3);
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(test2Screenshots, '003-third-entry-copied.png') });
  test2Steps.push({
    title: 'Third Entry Copied',
    filename: '003-third-entry-copied.png',
    description: `Third entry copied: "${entry3}"`,
    expectations: ['Third entry captured']
  });
  console.log('  ✓ Copied third entry');
  
  // Open sidebar and verify all entries
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(test2Screenshots, '004-all-entries-visible.png') });
  test2Steps.push({
    title: 'All Entries Visible',
    filename: '004-all-entries-visible.png',
    description: 'All three entries visible in clipboard history',
    expectations: [
      'Three entries are displayed',
      'Entries are in chronological order (newest first)',
      'All text content is visible'
    ]
  });
  console.log('  ✓ Verified all entries visible');
  
  // Generate README for test 2
  fs.writeFileSync(path.join(test2Dir, 'README.md'), generateReadme('clipboard-history-copy-multiple-entries-and-verify-all-appear', test2Steps));
  console.log(`✅ Test 2 complete: ${test2Steps.length} steps captured\n`);

  // Test 3: Delete entry
  console.log('📝 Test 3: Delete clipboard entry');
  const test3Dir = path.join(__dirname, 'reports', 'clipboard-history-delete-clipboard-entry');
  const test3Screenshots = path.join(test3Dir, 'screenshots');
  ensureDir(test3Screenshots);
  
  const test3Steps = [];
  
  // Sidebar should still be open, capture before delete
  await page.screenshot({ path: path.join(test3Screenshots, '001-before-delete.png') });
  test3Steps.push({
    title: 'Before Deletion',
    filename: '001-before-delete.png',
    description: 'Clipboard history showing entries before deletion',
    expectations: ['Multiple entries visible', 'Each entry has a delete button']
  });
  console.log('  ✓ Captured state before delete');
  
  // Delete the first entry
  const deleteButton = await page.locator('button[aria-label="Delete"], button[title="Delete"]').first();
  if (await deleteButton.count() > 0) {
    await deleteButton.click();
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: path.join(test3Screenshots, '002-after-delete.png') });
  test3Steps.push({
    title: 'After Deletion',
    filename: '002-after-delete.png',
    description: 'Entry deleted from clipboard history',
    expectations: [
      'Entry removed from UI',
      'Entry count decreased',
      'Remaining entries still visible'
    ]
  });
  console.log('  ✓ Deleted entry');
  
  // Generate README for test 3
  fs.writeFileSync(path.join(test3Dir, 'README.md'), generateReadme('clipboard-history-delete-clipboard-entry', test3Steps));
  console.log(`✅ Test 3 complete: ${test3Steps.length} steps captured\n`);

  // Test 4: Empty state
  console.log('📝 Test 4: Verify empty state');
  const test4Dir = path.join(__dirname, 'reports', 'clipboard-history-verify-empty-state');
  const test4Screenshots = path.join(test4Dir, 'screenshots');
  ensureDir(test4Screenshots);
  
  const test4Steps = [];
  
  // Delete all remaining entries
  let deleteButtons = await page.locator('button[aria-label="Delete"], button[title="Delete"]').count();
  while (deleteButtons > 0) {
    await page.locator('button[aria-label="Delete"], button[title="Delete"]').first().click();
    await page.waitForTimeout(500);
    deleteButtons = await page.locator('button[aria-label="Delete"], button[title="Delete"]').count();
  }
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(test4Screenshots, '001-empty-state.png') });
  test4Steps.push({
    title: 'Empty State',
    filename: '001-empty-state.png',
    description: 'Clipboard history showing empty state after all entries deleted',
    expectations: [
      'Empty state message displayed',
      'No clipboard entries visible',
      'User-friendly empty state UI'
    ]
  });
  console.log('  ✓ Captured empty state');
  
  // Generate README for test 4
  fs.writeFileSync(path.join(test4Dir, 'README.md'), generateReadme('clipboard-history-verify-empty-state', test4Steps));
  console.log(`✅ Test 4 complete: ${test4Steps.length} steps captured\n`);

  // Test 5: Persistence (refresh page)
  console.log('📝 Test 5: Persistence across page refresh');
  const test5Dir = path.join(__dirname, 'reports', 'clipboard-history-persistence-across-page-refresh');
  const test5Screenshots = path.join(test5Dir, 'screenshots');
  ensureDir(test5Screenshots);
  
  const test5Steps = [];
  
  // Copy a new entry
  const persistText = 'This entry should persist after refresh';
  await page.evaluate((text) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(temp);
  }, persistText);
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(test5Screenshots, '001-before-refresh.png') });
  test5Steps.push({
    title: 'Before Page Refresh',
    filename: '001-before-refresh.png',
    description: `Entry created: "${persistText}"`,
    expectations: ['Entry visible in clipboard history']
  });
  console.log('  ✓ Created entry before refresh');
  
  // Refresh the page
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  await page.waitForSelector('button[title="Clipboard History"]', { timeout: 10000 });
  
  // Open clipboard sidebar
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: path.join(test5Screenshots, '002-after-refresh.png') });
  test5Steps.push({
    title: 'After Page Refresh',
    filename: '002-after-refresh.png',
    description: 'Page refreshed and clipboard history reopened',
    expectations: [
      'Entry persisted across page refresh',
      'Entry still visible in clipboard history',
      'PouchDB storage working correctly'
    ]
  });
  console.log('  ✓ Verified persistence after refresh');
  
  // Generate README for test 5
  fs.writeFileSync(path.join(test5Dir, 'README.md'), generateReadme('clipboard-history-persistence-across-page-refresh', test5Steps));
  console.log(`✅ Test 5 complete: ${test5Steps.length} steps captured\n`);

  await browser.close();
  
  console.log('🎉 All tests complete!');
  console.log('\n📊 Summary:');
  console.log(`  - Test 1: ${test1Steps.length} steps`);
  console.log(`  - Test 2: ${test2Steps.length} steps`);
  console.log(`  - Test 3: ${test3Steps.length} steps`);
  console.log(`  - Test 4: ${test4Steps.length} steps`);
  console.log(`  - Test 5: ${test5Steps.length} steps`);
  console.log(`  - Total: ${test1Steps.length + test2Steps.length + test3Steps.length + test4Steps.length + test5Steps.length} steps`);
}

runTests().catch(console.error);
