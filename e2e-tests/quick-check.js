// Quick check to see what's rendering
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Navigate
  console.log('Navigating to https://localhost:5194...');
  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Extra wait

  // Take a screenshot
  await page.screenshot({ path: '/tmp/quick-check.png', fullPage: false });
  console.log('Screenshot saved to /tmp/quick-check.png');

  // Check for clipboard button
  const clipboardButton = await page.locator('button[title="Clipboard History"]').count();
  console.log(`Clipboard History button count: ${clipboardButton}`);

  // Check all buttons
  const allButtons = await page.locator('button').all();
  console.log(`Total buttons: ${allButtons.length}`);
  
  // Check sidebar buttons specifically
  const sidebarButtons = await page.locator('.sidebar-button').all();
  console.log(`Sidebar buttons: ${sidebarButtons.length}`);
  for (let i = 0; i < sidebarButtons.length; i++) {
    const title = await sidebarButtons[i].getAttribute('title');
    console.log(`  - ${title}`);
  }

  await browser.close();
})();
