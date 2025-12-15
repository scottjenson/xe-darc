import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';
import { DataValidator } from '../helpers/data-validation.js';
import { TestDataManager } from '../fixtures/test-data.js';
import { BrowserSetup } from '../fixtures/browser-setup.js';

/**
 * User Story: Clipboard History MVP
 * 
 * As a user, I want to copy text and have it automatically saved to a clipboard history
 * so that I can review and manage my copied content later.
 * 
 * Acceptance Criteria:
 * - User can copy text and it appears in clipboard history
 * - Clipboard history persists in PouchDB
 * - User can view clipboard history in sidebar
 * - User can delete individual clipboard entries
 * - Empty state displays when no history exists
 * - Multiple copies appear in chronological order
 */

test.describe('Clipboard History MVP', () => {
  let testContext;
  let dataValidator;
  let testDataManager;
  
  test.beforeEach(async ({ page, context }) => {
    // Setup browser context with permissions
    await BrowserSetup.configureBrowserContext(context);
    
    // Initialize test utilities
    testContext = new TestContext(page, '004-clipboard-history');
    dataValidator = new DataValidator(page);
    testDataManager = new TestDataManager(page);
    
    // Navigate to app
    await page.goto('https://localhost:5194');
    
    // Wait for app to be ready
    await BrowserSetup.waitForAppReady(page);
    
    // Setup clipboard monitoring
    await BrowserSetup.setupClipboardMonitoring(page);
    
    // Clear any existing clipboard history
    await dataValidator.clearClipboardHistory();
  });
  
  test.afterEach(async () => {
    // Generate report after each test
    await testContext.generateReport();
  });
  
  /**
   * Test: User copies text and views clipboard history
   */
  test('User copies text and it appears in clipboard history', async ({ page }) => {
    // Step 1: Capture initial state
    await testContext.captureStep('01-initial-state', {
      description: 'Application loaded with no clipboard history',
      expectations: [
        'Application is loaded',
        'Database is accessible',
        'No clipboard entries exist'
      ]
    });
    
    // Verify no clipboard entries initially
    const initialEntries = await dataValidator.getClipboardEntries();
    expect(initialEntries).toHaveLength(0);
    
    // Step 2: Simulate copying text
    const testText1 = 'const handleCopy = async () => { await navigator.clipboard.writeText("test"); }';
    await BrowserSetup.simulateCopy(page, testText1);
    
    // Wait for the clipboard entry to be stored
    await page.waitForTimeout(2000);
    
    await testContext.captureStep('02-text-copied', {
      description: `Copied test text: "${testText1.substring(0, 50)}..."`,
      expectations: [
        'Text is copied to system clipboard',
        'Clipboard monitor captures the copy event',
        'Entry is stored in PouchDB'
      ]
    });
    
    // Validate clipboard entry in database
    const entriesAfterCopy = await dataValidator.getClipboardEntries();
    expect(entriesAfterCopy.length).toBeGreaterThanOrEqual(1);
    
    const latestEntry = entriesAfterCopy[0];
    expect(latestEntry.type).toBe('clipboard');
    expect(latestEntry.content).toBe(testText1);
    expect(latestEntry.timestamp).toBeDefined();
    
    // Step 3: Copy second text
    const testText2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    await BrowserSetup.simulateCopy(page, testText2);
    
    // Wait for the second entry
    await page.waitForTimeout(2000);
    
    await testContext.captureStep('03-second-text-copied', {
      description: `Copied second text: "${testText2}"`,
      expectations: [
        'Second text is copied',
        'Second entry is stored',
        'Total of 2 entries in history'
      ]
    });
    
    // Validate both entries exist
    const allEntries = await dataValidator.getClipboardEntries();
    expect(allEntries.length).toBeGreaterThanOrEqual(2);
    
    // Verify entries are in chronological order (newest first)
    expect(allEntries[0].timestamp).toBeGreaterThan(allEntries[1].timestamp);
    
    await testContext.captureStep('04-verification-complete', {
      description: 'Verified clipboard entries in database',
      expectations: [
        '2 clipboard entries in PouchDB',
        'Entries are ordered by timestamp (newest first)',
        'Each entry has correct structure'
      ]
    });
  });
  
  /**
   * Test: User deletes clipboard entry
   */
  test('User can delete clipboard entries', async ({ page }) => {
    // Setup: Create test clipboard entries
    await testDataManager.createTestClipboardEntry('Test entry 1');
    await testDataManager.createTestClipboardEntry('Test entry 2');
    await testDataManager.createTestClipboardEntry('Test entry 3');
    
    // Wait for entries to be available
    await page.waitForTimeout(1000);
    
    await testContext.captureStep('01-entries-created', {
      description: 'Created 3 test clipboard entries',
      expectations: [
        '3 clipboard entries exist in database',
        'All entries have correct structure'
      ]
    });
    
    // Verify all entries exist
    const initialEntries = await dataValidator.getClipboardEntries();
    expect(initialEntries).toHaveLength(3);
    
    // Step 2: Delete one entry
    const entryToDelete = initialEntries[1]; // Delete middle entry
    
    await page.evaluate(async (entryId) => {
      const db = window.db;
      const doc = await db.get(entryId);
      await db.remove(doc);
    }, entryToDelete._id);
    
    // Wait for deletion to complete
    await page.waitForTimeout(1000);
    
    await testContext.captureStep('02-entry-deleted', {
      description: 'Deleted one clipboard entry',
      expectations: [
        'Entry is removed from database',
        '2 entries remain',
        'Deleted entry is no longer accessible'
      ]
    });
    
    // Verify entry was deleted
    const remainingEntries = await dataValidator.getClipboardEntries();
    expect(remainingEntries).toHaveLength(2);
    
    // Verify the correct entry was deleted
    const deletedEntryStillExists = remainingEntries.some(e => e._id === entryToDelete._id);
    expect(deletedEntryStillExists).toBe(false);
    
    await testContext.captureStep('03-verification-complete', {
      description: 'Verified entry deletion',
      expectations: [
        'Correct entry was deleted',
        '2 entries remain in database',
        'Remaining entries are intact'
      ]
    });
  });
  
  /**
   * Test: Clipboard history persists across page reloads
   */
  test('Clipboard history persists across sessions', async ({ page }) => {
    // Step 1: Create clipboard entries
    const testText1 = 'Persistent entry 1';
    const testText2 = 'Persistent entry 2';
    
    await testDataManager.createTestClipboardEntry(testText1);
    await testDataManager.createTestClipboardEntry(testText2);
    
    await page.waitForTimeout(1000);
    
    await testContext.captureStep('01-entries-created', {
      description: 'Created test clipboard entries before reload',
      expectations: [
        '2 clipboard entries created',
        'Entries stored in PouchDB'
      ]
    });
    
    const entriesBeforeReload = await dataValidator.getClipboardEntries();
    expect(entriesBeforeReload).toHaveLength(2);
    
    // Step 2: Reload the page
    await page.reload();
    await BrowserSetup.waitForAppReady(page);
    
    await page.waitForTimeout(1000);
    
    await testContext.captureStep('02-page-reloaded', {
      description: 'Page reloaded',
      expectations: [
        'Application reloaded successfully',
        'Database is accessible',
        'Clipboard entries should persist'
      ]
    });
    
    // Step 3: Verify entries still exist
    const entriesAfterReload = await dataValidator.getClipboardEntries();
    expect(entriesAfterReload).toHaveLength(2);
    
    // Verify content matches
    const contents = entriesAfterReload.map(e => e.content);
    expect(contents).toContain(testText1);
    expect(contents).toContain(testText2);
    
    await testContext.captureStep('03-persistence-verified', {
      description: 'Verified clipboard history persists after reload',
      expectations: [
        'All clipboard entries still exist',
        'Entry content is unchanged',
        'Entry metadata is preserved'
      ]
    });
  });
  
  /**
   * Test: Empty state when no clipboard history
   */
  test('Empty state displays when no clipboard history exists', async ({ page }) => {
    // Step 1: Ensure no clipboard entries exist
    await dataValidator.clearClipboardHistory();
    
    await page.waitForTimeout(500);
    
    await testContext.captureStep('01-empty-state', {
      description: 'Clipboard history is empty',
      expectations: [
        'No clipboard entries in database',
        'Database query returns empty array'
      ]
    });
    
    // Verify no entries exist
    const entries = await dataValidator.getClipboardEntries();
    expect(entries).toHaveLength(0);
    
    await testContext.captureStep('02-verification-complete', {
      description: 'Verified empty clipboard history',
      expectations: [
        'Clipboard history is empty',
        'Database is accessible and functional',
        'Ready to store new clipboard entries'
      ]
    });
  });
  
  /**
   * Test: Multiple copies appear in chronological order
   */
  test('Multiple clipboard entries appear in chronological order', async ({ page }) => {
    // Step 1: Create multiple entries with known timestamps
    const entries = [
      { content: 'First entry', delay: 0 },
      { content: 'Second entry', delay: 100 },
      { content: 'Third entry', delay: 200 },
      { content: 'Fourth entry', delay: 300 },
    ];
    
    for (const entry of entries) {
      await page.waitForTimeout(entry.delay);
      await testDataManager.createTestClipboardEntry(entry.content);
    }
    
    await page.waitForTimeout(1000);
    
    await testContext.captureStep('01-multiple-entries-created', {
      description: `Created ${entries.length} clipboard entries`,
      expectations: [
        `${entries.length} clipboard entries exist`,
        'Each entry has a timestamp',
        'Entries were created in sequence'
      ]
    });
    
    // Step 2: Retrieve and verify order
    const retrievedEntries = await dataValidator.getClipboardEntries();
    expect(retrievedEntries.length).toBeGreaterThanOrEqual(entries.length);
    
    // Verify chronological order (newest first)
    for (let i = 0; i < retrievedEntries.length - 1; i++) {
      expect(retrievedEntries[i].timestamp).toBeGreaterThanOrEqual(retrievedEntries[i + 1].timestamp);
    }
    
    await testContext.captureStep('02-order-verified', {
      description: 'Verified entries are in chronological order',
      expectations: [
        'Entries are ordered by timestamp',
        'Newest entries appear first',
        'All entries are accessible'
      ]
    });
    
    // Verify content order matches expected
    const contentOrder = retrievedEntries.slice(0, entries.length).map(e => e.content);
    expect(contentOrder[0]).toBe('Fourth entry'); // Newest
    expect(contentOrder[3]).toBe('First entry');  // Oldest
    
    await testContext.captureStep('03-content-order-verified', {
      description: 'Verified content order matches creation order',
      expectations: [
        'Content order is correct',
        'Latest entry is "Fourth entry"',
        'Oldest entry is "First entry"'
      ]
    });
  });
});
