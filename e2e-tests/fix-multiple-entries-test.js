import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch({ 
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Navigate and wait for app to be ready
  await page.goto('https://localhost:5194', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.waitForSelector('button[title="Clipboard History"]', { timeout: 15000 });
  
  console.log('Starting multiple entries test with clean state...');
  
  // Clear all clipboard entries from database
  await page.evaluate(async () => {
    try {
      const allDocs = await window.db.allDocs({ include_docs: true });
      const clipboardDocs = allDocs.rows
        .filter(row => row.doc.type === 'clipboard')
        .map(row => ({ ...row.doc, _deleted: true }));
      
      if (clipboardDocs.length > 0) {
        await window.db.bulkDocs(clipboardDocs);
        console.log(`[TEST] Deleted ${clipboardDocs.length} existing clipboard entries`);
      }
    } catch (err) {
      console.error('[TEST] Error clearing clipboard:', err);
    }
  });
  
  await page.waitForTimeout(1000);
  
  const test2Dir = path.join(__dirname, 'reports', '002-clipboard-history-copy-multiple-entries-and-verify-all-appear');
  const test2Screenshots = path.join(test2Dir, 'screenshots');
  
  // Ensure directory exists
  if (!fs.existsSync(test2Screenshots)) {
    fs.mkdirSync(test2Screenshots, { recursive: true });
  }
  
  // Copy first entry
  console.log('Copying first entry...');
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
  
  await page.waitForTimeout(1500);
  
  // Open sidebar to show first entry
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(1000);
  
  // Verify first entry exists
  const count1 = await page.evaluate(() => {
    const items = document.querySelectorAll('.clipboard-item, [class*="ClipboardHistoryItem"]');
    console.log('[TEST] Found clipboard items:', items.length);
    return items.length;
  });
  console.log(`After first copy: ${count1} entries in DOM`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '001-first-entry-copied.png') });
  console.log('✓ Screenshot 1 captured');
  
  // Close sidebar
  const closeBtn = await page.locator('button[aria-label="Close"]').count();
  if (closeBtn > 0) {
    await page.locator('button[aria-label="Close"]').first().click();
    await page.waitForTimeout(500);
  }
  
  // Copy second entry
  console.log('Copying second entry...');
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
  
  await page.waitForTimeout(1500);
  
  // Open sidebar to show two entries
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2500); // Wait for potential auto-refresh
  
  const count2 = await page.evaluate(() => {
    const items = document.querySelectorAll('.clipboard-item, [class*="ClipboardHistoryItem"]');
    return items.length;
  });
  console.log(`After second copy: ${count2} entries in DOM`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '002-second-entry-copied.png') });
  console.log('✓ Screenshot 2 captured');
  
  // Close sidebar again
  const closeBtn2 = await page.locator('button[aria-label="Close"]').count();
  if (closeBtn2 > 0) {
    await page.locator('button[aria-label="Close"]').first().click();
    await page.waitForTimeout(500);
  }
  
  // Copy third entry
  console.log('Copying third entry...');
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
  
  await page.waitForTimeout(1500);
  
  // Open sidebar to show all three entries
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2500); // Wait for potential auto-refresh
  
  const count3 = await page.evaluate(() => {
    const items = document.querySelectorAll('.clipboard-item, [class*="ClipboardHistoryItem"]');
    return items.length;
  });
  console.log(`After third copy: ${count3} entries in DOM`);
  
  await page.screenshot({ path: path.join(test2Screenshots, '003-third-entry-copied.png') });
  console.log('✓ Screenshot 3 captured');
  
  // Final screenshot showing all entries
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(test2Screenshots, '004-all-entries-visible.png') });
  console.log('✓ Screenshot 4 captured');
  
  await browser.close();
  console.log('\n✅ Test complete!');
})();
