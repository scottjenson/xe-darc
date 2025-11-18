// Simple script to verify clipboard button exists and capture screenshot
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });
  
  // Track network requests
  page.on('request', request => {
    if (request.url().includes('main.js') || request.url().includes('App.svelte')) {
      console.log('REQUEST:', request.url());
    }
  });
  page.on('response', async response => {
    if (response.url().includes('main.js')) {
      console.log('RESPONSE main.js:', response.status());
    }
  });
  
  try {
    console.log('Navigating to https://localhost:5194...');
    const response = await page.goto('https://localhost:5194');
    console.log('Response status:', response.status());
    
    console.log('Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    console.log('Network idle reached');
    
    // Get page title and HTML
    const title = await page.title();
    console.log('Page title:', title);
    
    const bodyText = await page.locator('body').textContent();
    console.log('Body has text:', bodyText ? bodyText.substring(0, 100) : 'EMPTY');
    
    // Check for specific elements
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML length:', bodyHTML.length);
    console.log('Body HTML sample:', bodyHTML.substring(0, 200));
    
    await page.waitForTimeout(5000); // Wait longer for Svelte to render
    console.log('Waited 5s for render');
    
    // Check for app root
    const appDiv = await page.locator('#app, [data-app], .app').count();
    console.log('App divs found:', appDiv);
    
    // Check for any divs
    const allDivs = await page.locator('div').count();
    console.log('Total divs:', allDivs);
    
    // Check if there's a JavaScript error preventing app mount
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });
    console.log('Window errors:', errors);
    
    // Try to check if App is actually imported
    const appMounted = await page.evaluate(() => {
      const appDiv = document.getElementById('app');
      return {
        hasAppDiv: !!appDiv,
        hasChildren: appDiv?.children.length || 0,
        innerHTML: appDiv?.innerHTML.substring(0, 200) || 'EMPTY'
      };
    });
    console.log('App mount check:', appMounted);
    
    // Check DOM structure for sidebars
    const sidebarElements = await page.evaluate(() => {
      const sidebars = document.querySelectorAll('[class*="sidebar"]');
      return Array.from(sidebars).map(el => ({
        className: el.className,
        visible: el.offsetParent !== null,
        hasButtons: el.querySelectorAll('button').length
      }));
    });
    console.log('Sidebar elements found:', JSON.stringify(sidebarElements, null, 2));
    
    // Try clicking the settings/gear icon in top right
    console.log('Looking for top-right buttons...');
    const topRightButtons = await page.locator('header button').all();
    console.log(`Found ${topRightButtons.length} buttons in header`);
    
    // Click the last button (likely settings/menu)
    if (topRightButtons.length > 0) {
      const lastButton = topRightButtons[topRightButtons.length - 1];
      const title = await lastButton.getAttribute('title');
      console.log(`Clicking last header button: "${title}"`);
      await lastButton.click();
      await page.waitForTimeout(2000); // Wait for sidebar to appear
      
      // Take screenshot after click
      await page.screenshot({ path: '/tmp/after-click.png' });
    }
    
    // Check sidebar-buttons specifically
    const sidebarButtons = await page.locator('.sidebar-buttons button').all();
    console.log(`Found ${sidebarButtons.length} buttons in .sidebar-buttons`);
    for (let i = 0; i < sidebarButtons.length; i++) {
      const title = await sidebarButtons[i].getAttribute('title');
      const visible = await sidebarButtons[i].isVisible();
      console.log(`  ${i+1}. title="${title}" visible=${visible}`);
    }
    
    // Take screenshot with sidebar open
    await page.screenshot({ path: '/tmp/sidebar-open.png' });
    console.log('Screenshot with sidebar open saved');
    
    console.log('Looking for Clipboard History button...');
    const button = await page.locator('button[title="Clipboard History"]');
    const count = await button.count();
    
    if (count > 0) {
      console.log('✅ Found Clipboard History button!');
      await button.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Button is visible!');
      
      // Capture screenshot
      await page.screenshot({ path: '/tmp/clipboard-button-visible.png' });
      console.log('✅ Screenshot saved to /tmp/clipboard-button-visible.png');
      
      // Also capture after hovering
      await button.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/clipboard-button-hover.png' });
      console.log('✅ Hover screenshot saved to /tmp/clipboard-button-hover.png');
      
    } else {
      console.log('❌ Clipboard History button NOT found!');
      console.log('Taking screenshot of what is visible...');
      await page.screenshot({ path: '/tmp/page-without-button.png' });
      
      // List all buttons on the page, especially in the right sidebar
      const rightSidebarButtons = await page.locator('.right-sidebar button, [class*="right"] button').all();
      console.log(`Found ${rightSidebarButtons.length} buttons in right sidebar area:`);
      for (let i = 0; i < rightSidebarButtons.length; i++) {
        const title = await rightSidebarButtons[i].getAttribute('title');
        const ariaLabel = await rightSidebarButtons[i].getAttribute('aria-label');
        const text = await rightSidebarButtons[i].textContent();
        console.log(`  ${i+1}. title="${title}" aria-label="${ariaLabel}" text="${text?.substring(0, 20)}"`);
      }
      
      // List all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`\nTotal buttons on page: ${allButtons.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
