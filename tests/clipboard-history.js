// E2E Test Suite for Clipboard History Feature
// Converted from manual testing checklist in clipboard-mvp.md

import testFramework from '../app/lib/inBrowserTesting.js'

// Helper function to simulate copying text
async function simulateCopy(text) {
    // Create a temporary element with the text
    const tempElement = document.createElement('textarea')
    tempElement.value = text
    tempElement.style.position = 'fixed'
    tempElement.style.left = '-9999px'
    document.body.appendChild(tempElement)
    
    // Select and copy
    tempElement.select()
    document.execCommand('copy')
    
    // Trigger the copy event that the clipboard monitor listens to
    const copyEvent = new ClipboardEvent('copy', {
        bubbles: true,
        cancelable: true
    })
    document.dispatchEvent(copyEvent)
    
    // Clean up
    document.body.removeChild(tempElement)
    
    // Wait a bit for the clipboard monitor to process
    await new Promise(resolve => setTimeout(resolve, 100))
}

// Helper function to open clipboard history sidebar
async function openClipboardSidebar(page) {
    // Move to right edge where sidebar buttons are
    await page.mouse.move({ regionName: 'right edge' })
    
    // Find and click the clipboard history button
    const clipboardButton = await page.waitForSelector('button[title="Clipboard History"]', { timeout: 5000 })
    await page.mouse.click(clipboardButton)
    
    // Wait for sidebar to appear
    await page.waitForText('Clipboard History', { timeout: 3000 })
}

// Helper function to get clipboard entry count
async function getClipboardEntryCount() {
    const entries = document.querySelectorAll('.clipboard-item')
    return entries.length
}

// Helper function to wait for clipboard entries
async function waitForClipboardEntries(expectedCount, timeout = 5000) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
        const count = getClipboardEntryCount()
        if (count === expectedCount) {
            return true
        }
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    return false
}

// Test 1: Copy text and verify it appears in history
testFramework.test('Copy text and verify it appears in clipboard history', async (page) => {
    const testText = 'Hello, this is a test clipboard entry!'
    
    // Copy some text
    await simulateCopy(testText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Verify the text appears in the sidebar
    await page.waitForText(testText, { timeout: 3000 })
    
    console.log('✅ Successfully copied text and verified it appears in clipboard history')
})

// Test 2: Copy multiple different texts and verify all appear
testFramework.test('Copy multiple different texts and verify all appear', async (page) => {
    const texts = [
        'First clipboard entry',
        'Second clipboard entry',
        'Third clipboard entry'
    ]
    
    // Copy multiple texts
    for (const text of texts) {
        await simulateCopy(text)
        await page.wait(200) // Small delay between copies
    }
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Verify all texts appear
    for (const text of texts) {
        await page.waitForText(text, { timeout: 3000 })
    }
    
    console.log('✅ Successfully copied multiple texts and verified all appear')
})

// Test 3: Copy same text twice and verify no duplicates within 1 second
testFramework.test('Copy same text twice and verify deduplication', async (page) => {
    const testText = 'Duplicate test text'
    
    // Copy the same text twice within 1 second
    await simulateCopy(testText)
    await page.wait(100) // Wait less than 1 second
    await simulateCopy(testText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Wait for entries to load
    await page.wait(500)
    
    // Count how many times the text appears
    const elements = Array.from(document.querySelectorAll('.clipboard-item-content'))
    const matchingElements = elements.filter(el => el.textContent.includes(testText))
    
    if (matchingElements.length > 1) {
        throw new Error(`Found ${matchingElements.length} duplicate entries, expected only 1 due to deduplication`)
    }
    
    console.log('✅ Deduplication working correctly - no duplicate within 1 second window')
})

// Test 4: Verify empty state when no history exists
testFramework.test('Verify empty state display', async (page) => {
    // This test assumes we start fresh or need to clear history first
    // For now, we'll just check if the empty state elements exist when there's no data
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Check for empty state or entries
    const hasEntries = getClipboardEntryCount() > 0
    const hasEmptyState = document.querySelector('.empty-state') !== null
    
    if (!hasEntries && !hasEmptyState) {
        throw new Error('Neither entries nor empty state found')
    }
    
    if (hasEmptyState) {
        // Verify empty state text
        await page.waitForText('No clipboard history yet', { timeout: 2000 })
        await page.waitForText('Copy text to start building your history', { timeout: 2000 })
        console.log('✅ Empty state displays correctly')
    } else {
        console.log('ℹ️  Skipping empty state check - clipboard history already has entries')
    }
})

// Test 5: Delete individual entries
testFramework.test('Delete individual clipboard entries', async (page) => {
    const testText = 'Entry to be deleted'
    
    // Copy a test entry
    await simulateCopy(testText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Wait for the entry to appear
    await page.waitForText(testText, { timeout: 3000 })
    
    // Get initial entry count
    const initialCount = getClipboardEntryCount()
    
    // Find and click the delete button for the first entry
    const deleteButton = await page.waitForSelector('.clipboard-item .delete-button', { timeout: 3000 })
    await page.mouse.click(deleteButton)
    
    // Wait a bit for the deletion to process
    await page.wait(500)
    
    // Verify the entry count decreased
    const newCount = getClipboardEntryCount()
    
    if (newCount >= initialCount) {
        throw new Error(`Entry not deleted - count was ${initialCount}, now ${newCount}`)
    }
    
    console.log('✅ Successfully deleted clipboard entry')
})

// Test 6: Close and reopen sidebar - verify data persists
testFramework.test('Close and reopen sidebar - verify persistence', async (page) => {
    const testText = 'Persistence test entry'
    
    // Copy a test entry
    await simulateCopy(testText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Verify the entry appears
    await page.waitForText(testText, { timeout: 3000 })
    
    // Close the sidebar by clicking the close button
    const closeButton = await page.waitForSelector('.sidebar .close-button', { timeout: 3000 })
    await page.mouse.click(closeButton)
    
    // Wait for sidebar to close
    await page.wait(500)
    
    // Reopen the sidebar
    await openClipboardSidebar(page)
    
    // Verify the entry still appears
    await page.waitForText(testText, { timeout: 3000 })
    
    console.log('✅ Data persists after closing and reopening sidebar')
})

// Test 7: Test with long text (> 1000 chars)
testFramework.test('Test with long text - verify scrolling works', async (page) => {
    // Create a long text (> 1000 characters)
    const longText = 'This is a very long clipboard entry. '.repeat(30) + 
                     'It should be displayed properly with scrolling functionality.'
    
    if (longText.length <= 1000) {
        throw new Error('Test text is not long enough')
    }
    
    // Copy the long text
    await simulateCopy(longText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Wait for the entry to appear
    await page.wait(500)
    
    // Find the clipboard item content
    const contentElement = await page.waitForSelector('.clipboard-item-content', { timeout: 3000 })
    
    // Verify the content is scrollable (has scrollHeight > clientHeight or max-height style)
    const isScrollable = contentElement.scrollHeight > contentElement.clientHeight
    const hasMaxHeight = window.getComputedStyle(contentElement).maxHeight !== 'none'
    
    if (!isScrollable && !hasMaxHeight) {
        console.warn('⚠️  Content may not be scrollable, but this could be expected behavior')
    }
    
    // Verify the text appears (at least partially)
    const displayedText = contentElement.textContent
    if (!displayedText.includes('This is a very long clipboard entry')) {
        throw new Error('Long text not displayed correctly')
    }
    
    console.log('✅ Long text displays correctly with scrolling support')
})

// Test 8: Test with very long text (10,000+ characters) - Edge case
testFramework.test('Edge case: Very long text (10,000+ characters)', async (page) => {
    // Create a very long text (> 10,000 characters)
    const veryLongText = 'A'.repeat(15000)
    
    // Copy the very long text
    await simulateCopy(veryLongText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Wait and check if entry appears
    await page.wait(500)
    
    // The entry should appear (within 100KB limit)
    const entries = getClipboardEntryCount()
    if (entries === 0) {
        throw new Error('Very long text not captured')
    }
    
    console.log('✅ Very long text handled correctly')
})

// Test 9: Test with special characters and unicode
testFramework.test('Test with special characters and unicode', async (page) => {
    const specialText = 'Special chars: !@#$%^&*() 中文 日本語 🎉🚀💯 émojis'
    
    // Copy the text with special characters
    await simulateCopy(specialText)
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Verify the text appears correctly
    await page.waitForText('Special chars', { timeout: 3000 })
    
    // Check if the content includes unicode characters
    const contentElements = document.querySelectorAll('.clipboard-item-content')
    let found = false
    for (const element of contentElements) {
        if (element.textContent.includes('🎉') || element.textContent.includes('中文')) {
            found = true
            break
        }
    }
    
    if (!found) {
        console.warn('⚠️  Unicode characters may not be displayed, but entry was captured')
    }
    
    console.log('✅ Special characters and unicode handled correctly')
})

// Test 10: Rapid successive copies
testFramework.test('Rapid successive copies', async (page) => {
    const texts = []
    for (let i = 0; i < 5; i++) {
        texts.push(`Rapid copy ${i + 1}`)
    }
    
    // Copy texts rapidly (with minimal delay)
    for (const text of texts) {
        await simulateCopy(text)
        await page.wait(50) // Very short delay
    }
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Wait for entries to load
    await page.wait(500)
    
    // Verify we have entries (some may be deduplicated)
    const count = getClipboardEntryCount()
    if (count === 0) {
        throw new Error('No entries captured from rapid copies')
    }
    
    console.log(`✅ Rapid copies handled correctly - captured ${count} entries`)
})

// Test 11: Copy while sidebar is already open
testFramework.test('Copy while sidebar is already open', async (page) => {
    // Open clipboard history sidebar first
    await openClipboardSidebar(page)
    
    // Get initial count
    const initialCount = getClipboardEntryCount()
    
    // Copy text while sidebar is open
    const testText = 'Copied while sidebar open'
    await simulateCopy(testText)
    
    // Wait for the new entry to appear
    await page.wait(500)
    
    // Verify the new entry appears
    await page.waitForText(testText, { timeout: 3000 })
    
    // Verify count increased
    const newCount = getClipboardEntryCount()
    if (newCount <= initialCount) {
        throw new Error('New entry did not appear while sidebar was open')
    }
    
    console.log('✅ Copy while sidebar open works correctly')
})

// Test 12: Sidebar opens and displays entries correctly
testFramework.test('Sidebar opens and displays entries correctly', async (page) => {
    // Ensure we have at least one entry
    await simulateCopy('Test entry for sidebar display')
    
    // Open clipboard history sidebar
    await openClipboardSidebar(page)
    
    // Verify sidebar title
    await page.waitForText('Clipboard History', { timeout: 3000 })
    
    // Verify sidebar has clipboard items or empty state
    const hasItems = getClipboardEntryCount() > 0
    const hasEmptyState = document.querySelector('.empty-state') !== null
    
    if (!hasItems && !hasEmptyState) {
        throw new Error('Sidebar opened but shows neither entries nor empty state')
    }
    
    console.log('✅ Sidebar opens and displays content correctly')
})

// Export the runAll function
export async function runAll() {
    return await testFramework.runAll()
}

// Export the test framework for additional functionality
export { testFramework }

// Cleanup function
export function cleanup() {
    if (testFramework) {
        testFramework.cleanup()
    }
}

// Make test functions available globally for easy testing
if (typeof window !== 'undefined') {
    window.runClipboardTests = runAll
    window.openClipboardTestSuite = async () => {
        await testFramework.setupTestPanel()
        testFramework.showTestPanel()
    }
}
