# Clipboard History MVP - Implementation Plan

## Overview

This document outlines the minimum viable product (MVP) implementation for the clipboard history feature in Darc Browser. The MVP focuses on core functionality: capturing clipboard events, storing them locally, and displaying them in a simple sidebar interface. This implementation serves as the foundation for the full design specified in `clipboard-history-design.md`.

## MVP Scope

The MVP will implement **Phase 1: Core Functionality** from the design document, with some simplifications to enable rapid development and validation:

### What's Included (MVP)
- ✅ Basic clipboard monitoring and text capture
- ✅ Local storage using PouchDB
- ✅ Simple sidebar UI for viewing history
- ✅ Copy-to-clipboard functionality from history
- ✅ Delete individual entries
- ✅ Basic empty state
- ✅ Integration with existing sidebar system

### What's Deferred (Post-MVP)
- ⏭️ Pin/unpin functionality
- ⏭️ Date grouping ("Today", "Yesterday", etc.)
- ⏭️ Source tracking (favicon, origin)
- ⏭️ Content preview truncation (show full content initially)
- ⏭️ Keyboard shortcuts
- ⏭️ Auto-cleanup of old entries
- ⏭️ Settings panel
- ⏭️ Image clipboard support
- ⏭️ Advanced visual design (animations, hover states)
- ⏭️ Tags and categorization

## Architecture

### Component Structure (Simplified)

```
ClipboardHistory.svelte (New Component)
├── RightSidebar.svelte (Modified - add button)
└── ClipboardHistoryItem.svelte (New Component - simplified)
```

### Data Flow

```
User Copy Action (Ctrl/Cmd+C)
    ↓
Clipboard API Event Listener
    ↓
clipboardMonitor.js (New Service)
    ↓
PouchDB Storage (data.svelte.js)
    ↓
ClipboardHistory Component
    ↓
UI Display
```

## Files to Create

### 1. `/app/lib/clipboardMonitor.js`

**Purpose**: Monitor clipboard events and store copied text to the database.

**Key Functions**:
- `initClipboardMonitor(db)` - Initialize event listeners
- `handleCopy(event)` - Process copy events
- `storeClipboardEntry(text)` - Save to database

**Implementation Details**:
```javascript
// Listen for copy events
document.addEventListener('copy', handleCopy)

// Store format
{
  _id: 'clipboard:timestamp',
  type: 'clipboard',
  content: 'copied text',
  timestamp: Date.now(),
  created: Date.now(),
  modified: Date.now()
}
```

**Considerations**:
- Debounce duplicate copies (within 1 second)
- Limit content size to 100KB for MVP
- Only store text/plain content (no images/HTML for MVP)

### 2. `/app/components/ClipboardHistory.svelte`

**Purpose**: Main sidebar component for displaying clipboard history.

**Props**:
- `openSidebars` - Set of open sidebars
- `switchTo*` functions - Navigation handlers

**UI Elements**:
- Header with title "Clipboard History"
- List of clipboard entries (no grouping in MVP)
- Empty state message
- Simple scrollable list

**State**:
- `clipboardEntries` - Array of clipboard documents from PouchDB
- `loading` - Loading state

**Actions**:
- Load entries on mount
- Subscribe to database changes
- Handle entry deletion
- Handle copy-to-clipboard

**Simplified Layout**:
```
┌─────────────────────────────────────────┐
│  CLIPBOARD HISTORY                  ✕   │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 2:30 PM                      📋 🗑│ │
│  │ const handleCopy = async () => { │ │
│  │ await navigator.clipboard...     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 2:15 PM                      📋 🗑│ │
│  │ Lorem ipsum dolor sit amet...    │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 3. `/app/components/ClipboardHistoryItem.svelte`

**Purpose**: Individual clipboard entry display.

**Props**:
- `entry` - Clipboard document
- `onCopy` - Copy handler
- `onDelete` - Delete handler

**UI Elements**:
- Timestamp (simple time format)
- Content text (full text, scrollable)
- Copy button
- Delete button

**Simplified Item**:
```
┌─────────────────────────────────────────┐
│ 2:30 PM                          📋 🗑  │
│─────────────────────────────────────────│
│ const handleCopy = async () => {        │
│   const text = await navigator          │
│   .clipboard.readText()                 │
│ }                                       │
└─────────────────────────────────────────┘
```

## Files to Modify

### 1. `/app/App.svelte`

**Changes Required**:

1. Import ClipboardHistory component
```javascript
import ClipboardHistory from './components/ClipboardHistory.svelte'
```

2. Add clipboard to openSidebars tracking (already uses Set)

3. Add switchToClipboardHistory function
```javascript
function switchToClipboardHistory() {
    switchToSidebar('clipboardHistory')
}
```

4. Add clipboard sidebar rendering (after other sidebars)
```svelte
{#if openSidebars.has('clipboardHistory')}
    <div class="sidebar-panel right" bind:this={clipboardHistorySidebarElement}>
        <RightSidebar 
            title="Clipboard History"
            {openSidebars}
            {switchToResources}
            {switchToSettings}
            {switchToUserMods}
            {switchToActivity}
            {switchToAgent}
            {switchToClipboardHistory}
            onClose={() => openSidebars.delete('clipboardHistory')}>
            <ClipboardHistory />
        </RightSidebar>
    </div>
{/if}
```

### 2. `/app/components/RightSidebar.svelte`

**Changes Required**:

1. Add `switchToClipboardHistory` to props
```javascript
let { 
    // ... existing props
    switchToClipboardHistory
} = $props()
```

2. Add clipboard button to sidebar navigation (before Settings button)
```svelte
<button class="sidebar-nav-button" 
        class:active={openSidebars.has('clipboardHistory')}
        title="Clipboard History" 
        aria-label="Clipboard History"
        onmousedown={switchToClipboardHistory}>
    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
</button>
```

### 3. `/app/data.svelte.js`

**Changes Required**:

1. Import clipboardMonitor
```javascript
import { initClipboardMonitor } from './lib/clipboardMonitor.js'
```

2. Initialize clipboard monitoring after database setup
```javascript
// After db.bulkDocs(bootstrap) and index creation
initClipboardMonitor(db)
```

3. Add clipboard query function (export for components)
```javascript
export async function getClipboardHistory(limit = 100) {
    try {
        const result = await db.find({
            selector: { type: 'clipboard' },
            sort: [{ timestamp: 'desc' }],
            limit
        })
        return result.docs
    } catch (error) {
        console.error('Failed to get clipboard history:', error)
        return []
    }
}
```

4. Add delete clipboard entry function
```javascript
export async function deleteClipboardEntry(id) {
    try {
        const doc = await db.get(id)
        await db.remove(doc)
    } catch (error) {
        console.error('Failed to delete clipboard entry:', error)
    }
}
```

## Implementation Steps

### Step 1: Create Clipboard Monitor Service
1. Create `/app/lib/clipboardMonitor.js`
2. Implement copy event listener
3. Implement database storage logic
4. Add basic deduplication (check last entry timestamp/content)

### Step 2: Update Data Layer
1. Modify `/app/data.svelte.js`
2. Import and initialize clipboard monitor
3. Add query and delete functions
4. Export functions for component use

### Step 3: Create ClipboardHistoryItem Component
1. Create `/app/components/ClipboardHistoryItem.svelte`
2. Implement simple item display
3. Add copy and delete buttons
4. Style to match existing Darc design

### Step 4: Create ClipboardHistory Component
1. Create `/app/components/ClipboardHistory.svelte`
2. Implement entry loading from database
3. Add empty state
4. Connect to ClipboardHistoryItem
5. Handle copy and delete actions

### Step 5: Integrate with Sidebar System
1. Modify `/app/components/RightSidebar.svelte`
2. Add clipboard history button
3. Modify `/app/App.svelte`
4. Add sidebar panel rendering
5. Connect navigation functions

### Step 6: Testing
1. Manual testing of copy operations
2. Verify database storage
3. Test copy-from-history functionality
4. Test delete functionality
5. Test empty state
6. Test sidebar open/close

## Database Schema

### Clipboard Document Format
```javascript
{
  _id: 'clipboard:1700000000000',  // clipboard: + timestamp
  type: 'clipboard',                // Document type
  content: 'Copied text content',   // The actual copied text
  timestamp: 1700000000000,         // When it was copied
  created: 1700000000000,           // Creation timestamp
  modified: 1700000000000           // Last modified timestamp
}
```

### Database Index
```javascript
// Add to existing index creation in data.svelte.js
db.createIndex({
    index: { 
        fields: ['type', 'timestamp']
    }
})
```

## Testing Strategy (Simplified for MVP)

### Manual Testing Checklist
- [ ] Copy text from browser (Ctrl/Cmd+C) - verify it appears in history
- [ ] Copy multiple different texts - verify all appear
- [ ] Copy same text twice - verify no duplicates within 1 second
- [ ] Open clipboard history sidebar - verify entries display
- [ ] Click copy button on history item - verify copied to clipboard
- [ ] Click delete button - verify item removed
- [ ] Verify empty state when no history exists
- [ ] Close and reopen sidebar - verify data persists
- [ ] Refresh page - verify history persists
- [ ] Test with long text (> 1000 chars) - verify scrolling works

### Edge Cases to Test
- [ ] Very long text (10,000+ characters)
- [ ] Empty copy (whitespace only)
- [ ] Special characters and unicode
- [ ] Rapid successive copies
- [ ] Copy while sidebar is open
- [ ] Copy while sidebar is closed

### Browser Testing
- [ ] Test in main browser window
- [ ] Test with multiple tabs open
- [ ] Test after browser restart (persistence)

## Success Criteria

The MVP is complete when:
1. ✅ Clipboard monitor successfully captures copy events
2. ✅ Clipboard entries are stored in PouchDB
3. ✅ Clipboard history sidebar opens and displays entries
4. ✅ Users can copy items from history back to clipboard
5. ✅ Users can delete individual entries
6. ✅ Empty state displays when no history exists
7. ✅ Data persists across browser sessions
8. ✅ No console errors during normal operation
9. ✅ UI matches Darc design patterns

## Performance Targets (MVP)

- Clipboard capture latency: < 100ms
- Sidebar open time: < 500ms
- Memory usage: < 10MB for 100 entries
- No noticeable impact on copy operations

## Known Limitations (MVP)

1. **No image support** - Only text/plain clipboard content
2. **No rich text** - HTML formatting is not preserved
3. **No source tracking** - Origin/page title not captured
4. **No automatic cleanup** - Old entries remain until manually deleted
5. **No settings** - Fixed behavior, no user configuration
6. **No keyboard shortcuts** - Mouse interaction only
7. **No pinning** - All entries treated equally
8. **No grouping** - Simple chronological list
9. **Large content** - Full text always shown (no truncation/preview)
10. **No search/filter** - View all entries only

## Future Enhancements (Post-MVP)

After MVP validation, implement features from the full design:

### Phase 2: Enhanced UX
- Date grouping ("Today", "Yesterday", etc.)
- Source tracking with favicons
- Content preview/truncation
- Pin functionality
- Keyboard shortcuts
- Visual polish (animations, hover states)

### Phase 3: Advanced Features
- Image clipboard support
- Rich text/HTML support
- Automatic cleanup based on age/count
- Settings panel (retention, max entries, etc.)
- Search and filtering
- Tags and categorization
- Export functionality

## Migration Path

The MVP database schema is forward-compatible with the full design. Future enhancements will add fields without breaking existing entries:

```javascript
// MVP Schema
{
  _id: 'clipboard:timestamp',
  type: 'clipboard',
  content: 'text',
  timestamp: Date.now(),
  created: Date.now(),
  modified: Date.now()
}

// Future Schema (additive only)
{
  _id: 'clipboard:timestamp',
  type: 'clipboard',
  content: 'text',
  timestamp: Date.now(),
  created: Date.now(),
  modified: Date.now(),
  source: { origin: 'https://example.com', title: 'Page Title' },  // Added
  contentType: 'text/plain',  // Added
  preview: 'truncated...',    // Added
  pinned: false,              // Added
  tags: ['code', 'javascript'] // Added
}
```

## Implementation Timeline

Estimated effort for MVP implementation:

- **Step 1-2**: Clipboard monitor and data layer - 2-3 hours
- **Step 3-4**: Components development - 3-4 hours  
- **Step 5**: Integration - 1-2 hours
- **Step 6**: Testing and bug fixes - 2-3 hours

**Total MVP estimate**: 8-12 hours of development time

## Conclusion

This MVP provides a solid foundation for the clipboard history feature while minimizing complexity and development time. It delivers core value (persistent clipboard history with copy/delete functionality) while establishing patterns for future enhancements. The simplified scope allows for rapid iteration and user feedback before investing in advanced features.

Once the MVP is validated and in use, the full design from `clipboard-history-design.md` can be implemented incrementally, building on this foundation without requiring major refactoring.
