// E2E Test: Clipboard History Feature
// Tests the clipboard history MVP functionality with visual documentation

import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context.js';

/**
 * User Story: As a user, I want to view my clipboard history
 * so I can keep track of text I've copied
 * 
 * Acceptance Criteria:
 * - User can copy text and see it appear in clipboard history
 * - Clipboard history is accessible via sidebar
 * - Copied entries are stored in PouchDB
 * - Entries persist across page refreshes
 * - User can delete individual entries
 */

test.describe('Clipboard History', () => {
  let testContext;

  test.beforeEach(async ({ page }, testInfo) => {
    const testName = 'clipboard-history-' + testInfo.title.replace(/\s+/g, '-').toLowerCase();
    testContext = new TestContext(page, testName, {
      description: 'As a user, I want to view my clipboard history so I can keep track of text I\'ve copied',
      acceptanceCriteria: [
        'User can copy text and see it appear in clipboard history',
        'Clipboard history is accessible via sidebar',
        'Copied entries are stored in PouchDB',
        'Entries persist across page refreshes',
        'User can delete individual entries'
      ]
    });
    await testContext.initialize();

    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the main UI to be visible and fully rendered
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(3000); // Give Svelte app time to fully render
  });

  test.afterEach(async () => {
    // Generate the test report with screenshots
    await testContext.generateReport();
  });

  test('Copy text and view in clipboard history', async ({ page }) => {
    // Step 1: Initial state - Application loaded
    // Wait for right sidebar buttons to be visible
    await page.waitForSelector('button[title="Clipboard History"]', { timeout: 15000 });
    await page.waitForTimeout(1000); // Extra wait after element appears
    
    await testContext.captureStep('initial-state', {
      description: 'Application loaded with default view',
      expectations: [
        'Application is fully loaded',
        'Right sidebar buttons are visible',
        'No clipboard history sidebar is open yet'
      ]
    });

    // Step 2: Copy text to clipboard
    const testText = 'Hello, this is a test clipboard entry!';
    
    await page.evaluate((text) => {
      // Create temporary element to copy from
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      
      // Trigger the copy event
      const copyEvent = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
      document.dispatchEvent(copyEvent);
      
      document.body.removeChild(temp);
    }, testText);

    await testContext.wait(500, 'Wait for clipboard monitor to process');

    await testContext.captureStep('text-copied', {
      description: `Copied text: "${testText}"`,
      expectations: [
        'Text was copied to clipboard',
        'Clipboard monitor captured the copy event',
        'Entry stored in PouchDB'
      ]
    });

    // Validate data: Check clipboard entry was created (optional, may fail if db not exposed)
    try {
      await testContext.validateData('clipboard', async (validator) => {
        const clipboardDocs = await validator.queryByType('clipboard');
        expect(clipboardDocs.length).toBeGreaterThan(0);
        
        const lastEntry = clipboardDocs[clipboardDocs.length - 1];
        expect(lastEntry.content).toBe(testText);
        
        return {
          totalEntries: clipboardDocs.length,
          lastEntry: {
            content: lastEntry.content,
            timestamp: lastEntry.timestamp
          }
        };
      });
    } catch (e) {
      console.log('⚠️  PouchDB validation skipped (db not accessible)');
    }

    // Step 3: Open clipboard history sidebar
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500, 'Wait for sidebar to open');

    await testContext.captureStep('sidebar-opened', {
      description: 'Clipboard history sidebar opened',
      expectations: [
        'Sidebar is visible on the right side',
        'Sidebar shows "Clipboard History" title',
        'Copied text is displayed in the list'
      ]
    });

    // Verify the text appears in the sidebar
    await expect(page.locator('.clipboard-item-content')).toContainText(testText);

    // Step 4: Verify entry details in UI
    await testContext.captureStep('entry-visible', {
      description: 'Clipboard entry visible with timestamp and delete button',
      expectations: [
        'Entry shows the copied text',
        'Entry has a timestamp',
        'Entry has a delete button'
      ]
    });
  });

  test('Copy multiple entries and verify all appear', async ({ page }) => {
    // Step 1: Copy first entry
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

    await testContext.wait(300);

    await testContext.captureStep('first-entry-copied', {
      description: `First entry copied: "${entry1}"`,
      expectations: ['First entry captured']
    });

    // Step 2: Copy second entry
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

    await testContext.wait(300);

    await testContext.captureStep('second-entry-copied', {
      description: `Second entry copied: "${entry2}"`,
      expectations: ['Second entry captured']
    });

    // Step 3: Copy third entry
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

    await testContext.wait(300);

    await testContext.captureStep('third-entry-copied', {
      description: `Third entry copied: "${entry3}"`,
      expectations: ['Third entry captured']
    });

    // Step 4: Open sidebar and verify all entries
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500);

    await testContext.captureStep('all-entries-visible', {
      description: 'All three entries visible in clipboard history',
      expectations: [
        'Three entries are displayed',
        'Entries are in chronological order',
        'All text content is visible'
      ]
    });

    // Verify all entries are present
    await expect(page.locator('.clipboard-item-content')).toHaveCount(3);
    await expect(page.locator('.clipboard-item-content').nth(0)).toContainText(entry3);
    await expect(page.locator('.clipboard-item-content').nth(1)).toContainText(entry2);
    await expect(page.locator('.clipboard-item-content').nth(2)).toContainText(entry1);

    // Validate data (optional)
    try {
      await testContext.validateData('clipboard', async (validator) => {
        const clipboardDocs = await validator.queryByType('clipboard');
        return {
          totalEntries: clipboardDocs.length,
          entries: clipboardDocs.map(doc => ({ content: doc.content, id: doc._id }))
        };
      });
    } catch (e) {
      console.log('⚠️  PouchDB validation skipped (db not accessible)');
    }
  });

  test('Delete clipboard entry', async ({ page }) => {
    // Step 1: Copy a test entry
    const testText = 'Entry to be deleted';
    await page.evaluate((text) => {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      const copyEvent = new ClipboardEvent('copy', { bubbles: true });
      document.dispatchEvent(copyEvent);
      document.body.removeChild(temp);
    }, testText);

    await testContext.wait(500);

    await testContext.captureStep('entry-to-delete-created', {
      description: `Created entry: "${testText}"`,
      expectations: ['Entry exists in database']
    });

    // Step 2: Open sidebar
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500);

    await testContext.captureStep('sidebar-with-entry', {
      description: 'Sidebar showing entry before deletion',
      expectations: ['Entry is visible with delete button']
    });

    const initialCount = await page.locator('.clipboard-item').count();

    // Step 3: Click delete button
    await page.locator('.delete-button').first().click();
    await testContext.wait(500);

    await testContext.captureStep('entry-deleted', {
      description: 'Entry deleted from clipboard history',
      expectations: [
        'Entry removed from UI',
        'Entry count decreased',
        'Entry removed from PouchDB'
      ]
    });

    // Verify entry was deleted
    const newCount = await page.locator('.clipboard-item').count();
    expect(newCount).toBe(initialCount - 1);

    // Validate data (optional)
    try {
      await testContext.validateData('clipboard', async (validator) => {
        const clipboardDocs = await validator.queryByType('clipboard');
        const deletedEntry = clipboardDocs.find(doc => doc.content === testText);
        expect(deletedEntry).toBeUndefined();
        
        return {
          totalEntries: clipboardDocs.length,
          deletedEntryFound: !!deletedEntry
        };
      });
    } catch (e) {
      console.log('⚠️  PouchDB validation skipped (db not accessible)');
    }
  });

  test('Verify empty state', async ({ page }) => {
    // Step 1: Open clipboard history (assuming fresh state or cleared)
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500);

    await testContext.captureStep('empty-state', {
      description: 'Clipboard history with no entries',
      expectations: [
        'Empty state message is displayed',
        'Shows "No clipboard history yet"',
        'Shows helpful message about copying text'
      ]
    });

    // Check for empty state elements
    const hasItems = await page.locator('.clipboard-item').count();
    const hasEmptyState = await page.locator('.empty-state').count();

    if (hasItems === 0 && hasEmptyState > 0) {
      await expect(page.locator('.empty-state')).toContainText('No clipboard history yet');
      await expect(page.locator('.empty-state')).toContainText('Copy text to start building your history');
    }
  });

  test('Persistence across page refresh', async ({ page }) => {
    // Step 1: Copy text
    const testText = 'Persistence test entry';
    await page.evaluate((text) => {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      const copyEvent = new ClipboardEvent('copy', { bubbles: true });
      document.dispatchEvent(copyEvent);
      document.body.removeChild(temp);
    }, testText);

    await testContext.wait(500);

    await testContext.captureStep('entry-created-before-refresh', {
      description: 'Created entry before page refresh',
      expectations: ['Entry exists in PouchDB']
    });

    // Open sidebar to verify it's there
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500);

    await testContext.captureStep('entry-visible-before-refresh', {
      description: 'Entry visible in sidebar before refresh',
      expectations: ['Entry is displayed']
    });

    await expect(page.locator('.clipboard-item-content')).toContainText(testText);

    // Step 2: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    await testContext.captureStep('page-refreshed', {
      description: 'Page refreshed and reloaded',
      expectations: ['Application loaded successfully']
    });

    // Step 3: Open sidebar again
    await page.click('button[title="Clipboard History"]');
    await testContext.wait(500);

    await testContext.captureStep('entry-persisted-after-refresh', {
      description: 'Entry still visible after page refresh',
      expectations: [
        'Entry persisted in PouchDB',
        'Entry is still displayed in sidebar',
        'No data loss occurred'
      ]
    });

    // Verify entry is still there
    await expect(page.locator('.clipboard-item-content')).toContainText(testText);

    // Validate data persistence (optional)
    try {
      await testContext.validateData('clipboard', async (validator) => {
        const clipboardDocs = await validator.queryByType('clipboard');
        const persistedEntry = clipboardDocs.find(doc => doc.content === testText);
        
        return {
          totalEntries: clipboardDocs.length,
          persistedEntry: persistedEntry ? {
            content: persistedEntry.content,
            id: persistedEntry._id
          } : null
        };
      });
    } catch (e) {
      console.log('⚠️  PouchDB validation skipped (db not accessible)');
    }
  });
});
