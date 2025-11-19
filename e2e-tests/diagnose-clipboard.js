// Diagnostic script to check clipboard functionality
import { chromium } from '@playwright/test';

async function diagnose() {
  console.log('🔍 Diagnosing clipboard functionality...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  console.log('✅ Page loaded\n');

  // Check if clipboard monitor is working
  const testResult = await page.evaluate(async () => {
    const results = {
      clipboardMonitorExists: typeof window.getSelection === 'function',
      tests: []
    };

    // Test 1: Try textarea selection (current method)
    try {
      const testText = 'Test with textarea';
      const temp = document.createElement('textarea');
      temp.value = testText;
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      
      const selection = window.getSelection().toString();
      results.tests.push({
        method: 'textarea',
        text: testText,
        selectionResult: selection,
        works: selection === testText
      });
      
      document.body.removeChild(temp);
    } catch (e) {
      results.tests.push({
        method: 'textarea',
        error: e.message,
        works: false
      });
    }

    // Test 2: Try with actual DOM text
    try {
      const testText2 = 'Test with DOM text';
      const div = document.createElement('div');
      div.textContent = testText2;
      div.style.position = 'fixed';
      div.style.left = '-9999px';
      document.body.appendChild(div);
      
      const range = document.createRange();
      range.selectNodeContents(div);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      const selectionText = selection.toString();
      results.tests.push({
        method: 'DOM element',
        text: testText2,
        selectionResult: selectionText,
        works: selectionText === testText2
      });
      
      document.body.removeChild(div);
    } catch (e) {
      results.tests.push({
        method: 'DOM element',
        error: e.message,
        works: false
      });
    }

    // Test 3: Check database
    try {
      const dbExists = typeof PouchDB !== 'undefined';
      results.databaseExists = dbExists;
      
      if (dbExists) {
        const db = new PouchDB('darc', { adapter: 'idb' });
        const clipboardDocs = await db.find({
          selector: { type: 'clipboard' },
          limit: 10
        });
        results.existingClipboardDocs = clipboardDocs.docs.length;
      }
    } catch (e) {
      results.databaseError = e.message;
    }

    return results;
  });

  console.log('📊 Test Results:\n', JSON.stringify(testResult, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
}

diagnose().catch(console.error);
