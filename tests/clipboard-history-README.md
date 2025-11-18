# Clipboard History E2E Test Plan

This document describes the end-to-end test suite for the Clipboard History feature, converted from the manual testing checklist in `clipboard-mvp.md`.

## Test Framework

The tests use Darc's in-browser testing framework (`app/lib/inBrowserTesting.js`), which provides a Playwright-like API with visual feedback for test execution.

## Running the Tests

### Option 1: From Browser Console
```javascript
// Load and run clipboard history tests
await import('./tests/clipboard-history.js').then(m => m.runAll())
```

### Option 2: Using Global Functions
After loading the test file, you can use:
```javascript
window.runClipboardTests()           // Run all clipboard tests
window.openClipboardTestSuite()      // Open the test panel UI
```

### Option 3: Run Specific Test
```javascript
window.testFramework.restartTest('Test name here')
```

## Test Suite Overview

The test suite includes 12 comprehensive tests covering all aspects of the clipboard history MVP:

### Core Functionality Tests

1. **Copy text and verify it appears in clipboard history**
   - Tests basic clipboard monitoring
   - Verifies entries are captured and displayed
   - **Expected**: Text appears in sidebar after copying

2. **Copy multiple different texts and verify all appear**
   - Tests handling of multiple clipboard entries
   - Verifies chronological ordering
   - **Expected**: All copied texts appear in history

3. **Copy same text twice and verify deduplication**
   - Tests 1-second deduplication window
   - Verifies duplicate prevention
   - **Expected**: Only one entry for duplicate copies within 1 second

4. **Verify empty state display**
   - Tests empty state UI
   - Verifies helpful messaging
   - **Expected**: "No clipboard history yet" message when empty

5. **Delete individual clipboard entries**
   - Tests delete functionality
   - Verifies entry removal
   - **Expected**: Entry count decreases after deletion

6. **Close and reopen sidebar - verify persistence**
   - Tests data persistence
   - Verifies PouchDB storage
   - **Expected**: Entries remain after closing/reopening

### Edge Case Tests

7. **Test with long text (> 1000 chars)**
   - Tests scrolling functionality
   - Verifies long text display
   - **Expected**: Text displays with scrollbar

8. **Edge case: Very long text (10,000+ characters)**
   - Tests size limit handling
   - Verifies performance with large entries
   - **Expected**: Entry captured within 100KB limit

9. **Test with special characters and unicode**
   - Tests character encoding
   - Verifies emoji and international characters
   - **Expected**: Special characters display correctly

10. **Rapid successive copies**
    - Tests performance under stress
    - Verifies no data loss
    - **Expected**: All distinct entries captured

### Integration Tests

11. **Copy while sidebar is already open**
    - Tests real-time updates
    - Verifies reactive UI
    - **Expected**: New entries appear immediately

12. **Sidebar opens and displays entries correctly**
    - Tests sidebar integration
    - Verifies UI rendering
    - **Expected**: Sidebar shows title and entries/empty state

## Test Helper Functions

The test suite includes helper functions for common operations:

### `simulateCopy(text)`
Simulates copying text to the clipboard:
- Creates temporary textarea
- Executes copy command
- Triggers clipboard event
- Cleans up temporary element

### `openClipboardSidebar(page)`
Opens the clipboard history sidebar:
- Moves mouse to right edge
- Clicks clipboard button
- Waits for sidebar to appear

### `getClipboardEntryCount()`
Returns the current number of clipboard entries displayed

### `waitForClipboardEntries(expectedCount, timeout)`
Waits for a specific number of entries to appear

## Visual Testing

The in-browser testing framework provides visual feedback during test execution:

- **Mouse movements** - Red cursor indicator shows automated mouse movements
- **Clicks** - Ripple animation shows where clicks occur
- **Found elements** - Green highlight shows located elements
- **Test panel** - Real-time test status and progress display

## Test Validation Approach

Each test follows this pattern:

1. **Setup**: Prepare test data (e.g., copy text)
2. **Action**: Perform the operation being tested
3. **Verification**: Assert expected outcome
4. **Cleanup**: Implicit cleanup via test framework

Tests use the following verification methods:
- `page.waitForText()` - Wait for text to appear
- `page.waitForSelector()` - Wait for element to exist
- `getClipboardEntryCount()` - Count entries
- Element inspection - Direct DOM queries for complex checks

## Success Criteria

All tests should pass to validate the MVP:

- ✅ Clipboard monitoring captures copy events
- ✅ Entries are stored and persist across sessions
- ✅ Sidebar displays entries correctly
- ✅ Delete functionality works
- ✅ Empty state displays appropriately
- ✅ Deduplication prevents duplicates
- ✅ Long text and special characters are handled
- ✅ Real-time updates work when sidebar is open

## Known Limitations

Based on the MVP scope, the following are **not** tested:

- ❌ Copy-to-clipboard from history (deferred to post-MVP)
- ❌ Pin/unpin functionality (not implemented)
- ❌ Date grouping (not implemented)
- ❌ Source tracking with favicons (not implemented)
- ❌ Keyboard shortcuts (not implemented)
- ❌ Settings panel (not implemented)
- ❌ Image clipboard support (not implemented)

## Troubleshooting

### Tests fail to run
- Ensure you're on the correct page (Darc browser window)
- Check browser console for errors
- Verify clipboard monitor is initialized

### Clipboard entries don't appear
- Check that copy events are being triggered
- Verify PouchDB is accessible
- Check for JavaScript errors in console

### Tests timeout
- Increase timeout values in test options
- Check if UI elements have correct selectors
- Verify sidebar can be opened manually

## Future Enhancements

Potential additions to the test suite:

1. **Performance tests** - Measure time to capture/display entries
2. **Persistence tests** - Test database migration and upgrades
3. **Cross-browser tests** - Verify behavior across browsers
4. **Accessibility tests** - Validate keyboard navigation and screen readers
5. **Screenshot validation** - Capture visual states as mentioned in design doc

## Contributing

When adding new clipboard history features:

1. Update this test suite with new test cases
2. Ensure all existing tests still pass
3. Document any new helper functions
4. Update the Known Limitations section as features are added

## Related Documentation

- `clipboard-mvp.md` - MVP implementation plan and manual testing checklist
- `clipboard-history-design.md` - Full design specification
- `app/lib/inBrowserTesting.js` - Testing framework documentation
- `tests/main.js` - Example test suite
