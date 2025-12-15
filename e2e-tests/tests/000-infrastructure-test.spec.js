import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';
import { DataValidator } from '../helpers/data-validation.js';
import { TestDataManager } from '../fixtures/test-data.js';
import { BrowserSetup } from '../fixtures/browser-setup.js';

/**
 * Basic Infrastructure Test
 * 
 * This test validates that the E2E testing infrastructure is working correctly.
 * It serves as a sanity check before running feature-specific tests.
 */

test.describe('E2E Infrastructure Validation', () => {
  let testContext;
  let dataValidator;
  let testDataManager;
  
  test.beforeEach(async ({ page, context }) => {
    // Setup browser context with permissions
    await BrowserSetup.configureBrowserContext(context);
    
    // Initialize test utilities
    testContext = new TestContext(page, '000-infrastructure-test');
    dataValidator = new DataValidator(page);
    testDataManager = new TestDataManager(page);
    
    // Navigate to app
    await page.goto('https://localhost:5194');
    
    // Wait for app to be ready
    await BrowserSetup.waitForAppReady(page);
  });
  
  test.afterEach(async () => {
    // Generate report after each test
    await testContext.generateReport();
  });
  
  test('Application loads successfully', async ({ page }) => {
    // Step 1: Verify application loaded
    await testContext.captureStep('01-app-loaded', {
      description: 'Application loaded successfully',
      expectations: [
        'Page loaded without errors',
        'Database is accessible',
        'Application is interactive'
      ]
    });
    
    // Verify page title or body exists
    const bodyExists = await page.locator('body').count();
    expect(bodyExists).toBeGreaterThan(0);
    
    // Verify database is accessible
    const dbExists = await page.evaluate(() => {
      return window.db !== undefined && window.db !== null;
    });
    expect(dbExists).toBe(true);
    
    await testContext.captureStep('02-verification-complete', {
      description: 'Infrastructure verification complete',
      expectations: [
        'Page DOM is accessible',
        'PouchDB is initialized',
        'Test utilities are working'
      ]
    });
  });
  
  test('Test utilities function correctly', async ({ page }) => {
    // Step 1: Test screenshot capture
    await testContext.captureStep('01-screenshot-test', {
      description: 'Testing screenshot capture functionality',
      expectations: [
        'Screenshot is captured successfully',
        'Screenshot is saved to correct location'
      ]
    });
    
    // Step 2: Test data validation
    const dbWorks = await page.evaluate(async () => {
      try {
        const allDocs = await window.db.allDocs();
        return { success: true, count: allDocs.rows.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(dbWorks.success).toBe(true);
    
    await testContext.captureStep('02-data-validation-test', {
      description: 'Testing data validation functionality',
      expectations: [
        'Can query PouchDB',
        'Data validation helpers work correctly'
      ]
    });
  });
});
