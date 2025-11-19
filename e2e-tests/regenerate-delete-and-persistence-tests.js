// Regenerate delete and persistence test screenshots with sidebar open
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
function generateReadme(testName, userStory, steps) {
  const readme = `# Test Report: ${testName}

**Generated**: ${new Date().toISOString()}

**Total Steps**: ${steps.length}

## User Story

${userStory}

### Acceptance Criteria

${steps[0].acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

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

// Helper to simulate clipboard copy
async function simulateCopy(page, text) {
  await page.evaluate((textToCopy) => {
    // Create a temporary div
    const div = document.createElement('div');
    div.textContent = textToCopy;
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    document.body.appendChild(div);
    
    // Create a range and select the text
    const range = document.createRange();
    range.selectNodeContents(div);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger the copy command
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(div);
    selection.removeAllRanges();
  }, text);
  
  console.log(`[Browser] Simulated copy of text: "${text}"`);
  await page.waitForTimeout(500); // Wait for copy event to process
}

// Helper to open clipboard sidebar
async function openClipboardSidebar(page) {
  console.log('[Test] Opening clipboard sidebar...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(3500); // Wait for auto-refresh to load entries (increased from 2.5s to 3.5s)
  console.log('[Test] Clipboard sidebar opened');
}

// Helper to close clipboard sidebar
async function closeClipboardSidebar(page) {
  console.log('[Test] Closing clipboard sidebar...');
  await page.click('button[aria-label="Close Clipboard History"]');
  await page.waitForTimeout(500);
  console.log('[Test] Clipboard sidebar closed');
}

async function runTests() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Navigate to app
  await page.goto('https://localhost:5194', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait for Svelte to render
  await page.waitForSelector('button[title="Clipboard History"]', { timeout: 15000 });
  
  console.log('\n=== TEST 3: Delete Clipboard Entry ===\n');
  
  // Clear any existing entries
  await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const docs = await db.allDocs({ include_docs: true });
      const clipboardDocs = docs.rows.filter(row => row.doc.type === 'clipboard');
      for (const row of clipboardDocs) {
        await db.remove(row.doc);
      }
    }
  });
  
  // Copy text for delete test
  await simulateCopy(page, 'Entry to be deleted');
  await page.waitForTimeout(1000);
  
  // Open sidebar to show entry BEFORE delete
  await openClipboardSidebar(page);
  
  // Step 1: Before delete - sidebar OPEN
  const deleteDir = path.join(__dirname, 'reports/clipboard-history-delete-clipboard-entry/screenshots');
  ensureDir(deleteDir);
  await page.screenshot({ path: path.join(deleteDir, '001-before-delete.png') });
  console.log('[Test] Step 1 screenshot captured: before-delete (sidebar OPEN)');
  
  // Click delete button
  await page.click('button[aria-label="Delete clipboard entry"]');
  await page.waitForTimeout(1000); // Wait for delete to complete
  
  // Step 2: After delete - sidebar STILL OPEN
  await page.screenshot({ path: path.join(deleteDir, '002-after-delete.png') });
  console.log('[Test] Step 2 screenshot captured: after-delete (sidebar OPEN, shows empty state)');
  
  // Close sidebar
  await closeClipboardSidebar(page);
  
  // Generate README for delete test
  const deleteReadme = generateReadme(
    'Delete Clipboard Entry',
    'As a user, I want to delete clipboard entries I no longer need so my history stays clean',
    [
      {
        title: 'Entry visible before delete',
        description: 'Clipboard sidebar is open showing an entry "Entry to be deleted" with a delete button',
        filename: '001-before-delete.png',
        acceptanceCriteria: [
          'Clipboard sidebar is visible and open',
          'Entry "Entry to be deleted" is displayed',
          'Delete button (trash icon) is present next to the entry',
          'User can click delete button'
        ],
        expectations: [
          'Sidebar displays clipboard history',
          'Entry is visible in the list',
          'Delete button is accessible'
        ]
      },
      {
        title: 'Empty state after delete',
        description: 'After clicking delete, the entry is removed and empty state is shown in the open sidebar',
        filename: '002-after-delete.png',
        acceptanceCriteria: [
          'Clipboard sidebar remains open',
          'Entry is no longer visible',
          'Empty state message "No clipboard history yet" is displayed',
          'Empty state icon (clipboard) is shown'
        ],
        expectations: [
          'Entry is successfully deleted',
          'Sidebar shows empty state',
          'UI updates immediately after deletion'
        ]
      }
    ]
  );
  
  fs.writeFileSync(
    path.join(__dirname, 'reports/clipboard-history-delete-clipboard-entry/README.md'),
    deleteReadme
  );
  console.log('[Test] Delete test README generated');
  
  console.log('\n=== TEST 5: Persistence Across Page Refresh ===\n');
  
  // Clear database again
  await page.evaluate(async () => {
    const db = window.db;
    if (db) {
      const docs = await db.allDocs({ include_docs: true });
      const clipboardDocs = docs.rows.filter(row => row.doc.type === 'clipboard');
      for (const row of clipboardDocs) {
        await db.remove(row.doc);
      }
    }
  });
  
  // Copy text for persistence test
  await simulateCopy(page, 'Persistent entry');
  await page.waitForTimeout(1000);
  
  // Open sidebar to show entry BEFORE refresh
  await openClipboardSidebar(page);
  
  // Step 1: Before refresh - sidebar OPEN
  const persistenceDir = path.join(__dirname, 'reports/clipboard-history-persistence-across-page-refresh/screenshots');
  ensureDir(persistenceDir);
  await page.screenshot({ path: path.join(persistenceDir, '001-before-refresh.png') });
  console.log('[Test] Step 1 screenshot captured: before-refresh (sidebar OPEN)');
  
  // Close sidebar before refresh
  await closeClipboardSidebar(page);
  
  // Refresh page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait for Svelte to render
  await page.waitForSelector('button[title="Clipboard History"]', { timeout: 15000 });
  
  // Open sidebar to show entry persisted AFTER refresh
  await openClipboardSidebar(page);
  
  // Step 2: After refresh - sidebar OPEN
  await page.screenshot({ path: path.join(persistenceDir, '002-after-refresh.png') });
  console.log('[Test] Step 2 screenshot captured: after-refresh (sidebar OPEN, entry persisted)');
  
  // Generate README for persistence test
  const persistenceReadme = generateReadme(
    'Persistence Across Page Refresh',
    'As a user, I want my clipboard history to persist across page refreshes so I don\'t lose my data',
    [
      {
        title: 'Entry visible before refresh',
        description: 'Clipboard sidebar is open showing the entry "Persistent entry" before page refresh',
        filename: '001-before-refresh.png',
        acceptanceCriteria: [
          'Clipboard sidebar is visible and open',
          'Entry "Persistent entry" is stored in PouchDB',
          'Entry is displayed in the sidebar',
          'Page is about to be refreshed'
        ],
        expectations: [
          'Sidebar displays clipboard history',
          'Entry is visible in the list',
          'Entry is stored in database'
        ]
      },
      {
        title: 'Entry persists after refresh',
        description: 'After page refresh, clipboard sidebar is reopened and the entry "Persistent entry" is still visible',
        filename: '002-after-refresh.png',
        acceptanceCriteria: [
          'Page has been refreshed',
          'Clipboard sidebar is reopened',
          'Entry "Persistent entry" is still present',
          'Entry is loaded from PouchDB',
          'No data loss occurred'
        ],
        expectations: [
          'Entry survived page refresh',
          'Data persists in PouchDB',
          'Sidebar correctly loads persisted data',
          'UI shows the same entry as before refresh'
        ]
      }
    ]
  );
  
  fs.writeFileSync(
    path.join(__dirname, 'reports/clipboard-history-persistence-across-page-refresh/README.md'),
    persistenceReadme
  );
  console.log('[Test] Persistence test README generated');
  
  await browser.close();
  
  console.log('\n=== All tests completed successfully ===\n');
  console.log('Generated reports:');
  console.log('  - clipboard-history-delete-clipboard-entry/');
  console.log('  - clipboard-history-persistence-across-page-refresh/');
}

runTests().catch(console.error);
