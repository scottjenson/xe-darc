// Simple test to see console logs
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Browser ${type.toUpperCase()}] ${text}`);
  });

  console.log('📍 Navigating to app...');
  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  console.log('✓ App loaded\n');
  
  console.log('📋 Copying text...');
  const testText = 'Test entry ' + Date.now();
  await page.evaluate((text) => {
    console.log('[COPY] Creating div with text:', text);
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
    
    console.log('[COPY] Dispatching copy event...');
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    document.body.removeChild(div);
    console.log('[COPY] Done');
  }, testText);

  await page.waitForTimeout(2000);
  console.log('✓ Text copied\n');

  console.log('🚪 Opening clipboard sidebar...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(3000);
  console.log('✓ Sidebar opened\n');

  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: './test-screenshot.png' });
  console.log('✓ Screenshot saved\n');

  console.log('Waiting for you to inspect...(10 seconds)');
  await page.waitForTimeout(10000);

  await browser.close();
})();
