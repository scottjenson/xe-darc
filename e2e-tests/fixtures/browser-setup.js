/**
 * BrowserSetup provides utilities for browser configuration and setup
 */
export class BrowserSetup {
  /**
   * Configure browser context for testing
   * @param {BrowserContext} context - Playwright browser context
   */
  static async configureBrowserContext(context) {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Set extra HTTP headers if needed
    await context.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }
  
  /**
   * Wait for application to be ready
   * @param {Page} page - Playwright page object
   * @param {number} timeout - Timeout in milliseconds
   */
  static async waitForAppReady(page, timeout = 10000) {
    // Wait for the app to load
    await page.waitForLoadState('networkidle', { timeout });
    
    // Wait for database to be available
    await page.waitForFunction(() => {
      return window.db !== undefined && window.db !== null;
    }, { timeout });
    
    // Give a bit more time for any initialization
    await page.waitForTimeout(500);
  }
  
  /**
   * Setup clipboard monitoring in the page
   * @param {Page} page - Playwright page object
   */
  static async setupClipboardMonitoring(page) {
    await page.evaluate(() => {
      // Setup a global array to track clipboard events
      window._clipboardEvents = [];
      
      // Listen for copy events
      document.addEventListener('copy', (e) => {
        window._clipboardEvents.push({
          type: 'copy',
          timestamp: Date.now()
        });
      });
      
      // Listen for paste events
      document.addEventListener('paste', (e) => {
        window._clipboardEvents.push({
          type: 'paste',
          timestamp: Date.now()
        });
      });
    });
  }
  
  /**
   * Get clipboard events that occurred in the page
   * @param {Page} page - Playwright page object
   * @returns {Array} - Array of clipboard events
   */
  static async getClipboardEvents(page) {
    return await page.evaluate(() => {
      return window._clipboardEvents || [];
    });
  }
  
  /**
   * Clear clipboard events
   * @param {Page} page - Playwright page object
   */
  static async clearClipboardEvents(page) {
    await page.evaluate(() => {
      window._clipboardEvents = [];
    });
  }
  
  /**
   * Simulate a copy event programmatically
   * @param {Page} page - Playwright page object
   * @param {string} text - Text to copy
   */
  static async simulateCopy(page, text) {
    await page.evaluate((textToCopy) => {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.select();
      document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
    }, text);
  }
  
  /**
   * Get clipboard content
   * @param {Page} page - Playwright page object
   * @returns {string} - Clipboard content
   */
  static async getClipboardContent(page) {
    return await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        console.error('Error reading clipboard:', error);
        return '';
      }
    });
  }
  
  /**
   * Set clipboard content
   * @param {Page} page - Playwright page object
   * @param {string} text - Text to set in clipboard
   */
  static async setClipboardContent(page, text) {
    await page.evaluate(async (textToSet) => {
      try {
        await navigator.clipboard.writeText(textToSet);
      } catch (error) {
        console.error('Error writing to clipboard:', error);
      }
    }, text);
  }
}
