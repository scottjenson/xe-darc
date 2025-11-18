# Clipboard History Pane - Design Document

## Overview

This document outlines the design for a new clipboard history feature in Darc Browser. The feature will capture every copy operation performed by the user and display the copied content in a dedicated sidebar pane, providing users with quick access to their clipboard history.

## Problem Statement

The clipboard history feature will capture every copy operation and store the copied content in a dedicated sidebar pane. While users can review and re-copy previously copied items, the long-term goal is to use this clipboard history to help users complete their browsing tasks more effectively. For now, the focus is on building the foundational capture and display functionality.

## Design Goals

1. **Non-intrusive**: Capture clipboard events without impacting browser performance
2. **Privacy-conscious**: Store clipboard data locally only, with user control over retention
3. **Seamless Integration**: Follow existing Darc UI patterns and architecture
4. **Resource-aware**: Balance between feature richness and storage constraints
5. **User-friendly**: Provide intuitive access and management of clipboard history

## Architecture Overview

### Component Structure

```
ClipboardHistory.svelte (New Component)
├── RightSidebar.svelte (Wrapper - existing)
└── ClipboardHistoryItem.svelte (New Component)
```

### Data Flow

```
User Copy Action
    ↓
Browser Clipboard API Event
    ↓
Clipboard Monitor (app/lib/clipboardMonitor.js)
    ↓
Data Store (PouchDB)
    ↓
ClipboardHistory Component
    ↓
UI Display
```

## Detailed Design

### 1. Data Model

#### Document Schema (PouchDB)

```javascript
{
  _id: 'clipboard:${timestamp}_${uuid}',
  type: 'clipboard',
  content: {
    text: 'copied text content',
    html: '<p>optional html content</p>', // if available
    richText: {...},  // optional structured data
  },
  metadata: {
    source: {
      url: 'https://example.com',
      origin: 'https://example.com',
      tabId: 'darc:tab_...',
      title: 'Page Title'
    },
    timestamp: 1234567890,
    contentType: 'text/plain', // or 'text/html', 'image/png', etc.
    contentLength: 123,
    preview: 'First 100 chars...' // truncated preview
  },
  userMetadata: {
    pinned: false,
    archived: false,
    tags: ['work', 'code'], // optional user tags
    category: 'code', // auto-detected or user-set
    favorite: false,
    notes: '' // optional user notes
  },
  created: 1234567890,
  modified: 1234567890
}
```

#### Database Index

Create a PouchDB index for efficient querying:
```javascript
db.createIndex({
  index: { 
    fields: ['type', 'metadata.timestamp', 'userMetadata.pinned', 'userMetadata.archived'] 
  }
})
```

### 2. Clipboard Monitor Service

**Location**: `app/lib/clipboardMonitor.js`

#### Responsibilities:
- Listen for clipboard events
- Extract clipboard content
- Store entries in PouchDB
- Handle different content types (text, HTML, images)
- Deduplicate identical consecutive copies
- Manage storage limits

#### Implementation Approach:

```javascript
class ClipboardMonitor {
  constructor(db, options = {}) {
    this.db = db
    this.enabled = options.enabled ?? true
    this.maxEntries = options.maxEntries ?? 1000
    this.maxEntrySize = options.maxEntrySize ?? 1024 * 1024 // 1MB
    this.deduplicateWindow = options.deduplicateWindow ?? 5000 // 5 seconds
    this.lastCopyHash = null
    this.lastCopyTime = 0
  }

  init() {
    // Use multiple detection methods for copy events
    this.attachEventListeners()
  }

  attachEventListeners() {
    // Method 1: Listen to copy events on document
    document.addEventListener('copy', this.handleCopyEvent.bind(this))
    
    // Method 2: Poll clipboard periodically (fallback)
    // Only if permissions allow
    this.startPolling()
    
    // Method 3: Listen to keyboard shortcuts
    this.attachKeyboardListener()
  }

  async handleCopyEvent(event) {
    // Get clipboard data from the event
    // Determine source context
    // Store in database
  }

  async pollClipboard() {
    // Read current clipboard content
    // Compare with last known content
    // If different, create new entry
  }

  async storeClipboardEntry(content, metadata) {
    // Create document
    // Check deduplication
    // Store in PouchDB
    // Trigger cleanup if needed
  }

  async cleanup() {
    // Remove old entries beyond maxEntries
    // Respect pinned items
  }
}
```

#### Detection Strategy:

**Option A: Event-based (Preferred)**
- Listen to `copy` events on the document
- Use `event.clipboardData` to access copied content
- Most reliable and performant
- Works for Ctrl+C/Cmd+C and context menu copies

**Option B: Clipboard API Polling (Fallback)**
- Periodically check `navigator.clipboard.readText()`
- Useful when event-based detection fails
- Requires clipboard-read permission
- Higher resource usage

**Option C: Keyboard Shortcut Interception**
- Listen for Ctrl+C/Cmd+C keyboard events
- Trigger clipboard read after shortcut
- Complement to event-based approach
- Misses context menu copies

**Recommended**: Implement Option A primarily, with Option C as a complement for edge cases.

### 3. User Interface Mockups

#### Main Sidebar View

The clipboard history will appear as a right sidebar panel, matching the existing Darc sidebar aesthetic with a dark theme and clean typography.

```
┌─────────────────────────────────────────┐
│  CLIPBOARD HISTORY                  ✕   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Filter Buttons ─────────────────┐  │
│  │ [All] [Text] [Code] [URLs] [📌]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Settings ──────────────────────┐   │
│  │ ☑ Monitor clipboard              │   │
│  │ Max entries: [1000 ▾]            │   │
│  │ [Clear All History]              │   │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Today ──                            │
│  ┌───────────────────────────────────┐ │
│  │ 2:30 PM  github.com           📋 📌│ │
│  │ const handleCopy = async () => { │ │
│  │ await navigator.clipboard...     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 2:15 PM  example.com          📋 🗑│ │
│  │ Lorem ipsum dolor sit amet...    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ── Yesterday ──                        │
│  ┌───────────────────────────────────┐ │
│  │ 4:45 PM  stackoverflow.com    📋 📌│ │
│  │ function debounce(func, wait) {  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 11:20 AM docs.darc.io         📋 🗑│ │
│  │ https://docs.darc.io/api/...     │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Empty State View

When no clipboard history exists yet:

```
┌─────────────────────────────────────────┐
│  CLIPBOARD HISTORY                  ✕   │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              📋                         │
│                                         │
│      No clipboard history yet           │
│                                         │
│   Copy text to start building your      │
│           history                       │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Individual Clipboard Item

Each clipboard entry displays:

```
┌─────────────────────────────────────────┐
│ ⏰ 2:30 PM    🌐 github.com/user    📋 📌 🗑│
├─────────────────────────────────────────┤
│                                         │
│  const handleCopy = async () => {       │
│    const text = await navigator         │
│    .clipboard.readText()                │
│    console.log(text)                    │
│  }                                      │
│                                         │
│  #javascript #code                      │
└─────────────────────────────────────────┘
```

Visual elements:
- **Timestamp**: Relative time (e.g., "2:30 PM", "5 mins ago")
- **Source**: Favicon + origin/page title where content was copied
- **Actions**: Copy (primary), Pin, Delete
- **Content**: Truncated preview with smart formatting
- **Tags**: Auto-detected or user-added tags
- **Pinned indicator**: Gold pin icon for pinned items

#### Sidebar Button

The clipboard history button appears in the right sidebar button array:

```
Right Sidebar Buttons:
┌────┐
│ 🎤 │  Voice Agent
├────┤
│ ✨ │  AI Agent
├────┤
│ ⏰ │  Activity
├────┤
│ 🛡️ │  Resources
├────┤
│ 📋 │  Clipboard History ← NEW
├────┤
│ </> │ User Mods
├────┤
│ ⚙️ │  Settings
└────┘
```

#### Filter States

Filters change the displayed items:

- **All**: Shows all clipboard entries
- **Text**: Only plain text entries
- **Code**: Entries detected as code (syntax highlighting)
- **URLs**: Entries that are URLs
- **📌 (Pinned)**: Only pinned items shown at top

#### Interaction States

**Hover State**: Item background lightens, action buttons become visible
**Active/Selected**: Item has subtle highlight border
**Pinned Items**: Gold pin icon, always appear at top regardless of date
**Copy Success**: Brief flash animation + toast notification "Copied!"

### 4. Integration Points

#### 4.1 App.svelte
- Add clipboard history to `openSidebars` Set
- Create `switchToClipboardHistory()` function
- Add sidebar panel rendering with conditional display
- Add clipboard icon button to right sidebar button array

#### 4.2 data.svelte.js
- Import and initialize ClipboardMonitor service
- Add clipboard document type to PouchDB schema
- Create query functions for retrieving clipboard history
- Handle clipboard entries in refresh() function

#### 4.3 RightSidebar.svelte
- Add clipboard history navigation button
- Pass switchToClipboardHistory prop
- Update icon set with clipboard icon

#### 4.4 Components to Create
- `app/components/ClipboardHistory.svelte` - Main sidebar component
- `app/components/ClipboardHistoryItem.svelte` - Individual entry display
- `app/lib/clipboardMonitor.js` - Clipboard monitoring service

### 5. Performance Considerations

#### Storage Management
- **Max Entry Size**: Limit individual clipboard entries to 1MB
- **Max Total Entries**: Default to 1000 entries (configurable)
- **Automatic Cleanup**: Remove oldest entries when limit is reached
- **Respect Pinned Items**: Never auto-delete pinned entries

#### Memory Management
- **Lazy Loading**: Only load clipboard items when sidebar is opened
- **Virtual Scrolling**: For large histories, render only visible items
- **Content Preview**: Store truncated previews (100 chars) for quick display
- **Full Content**: Load on demand when user expands an item

#### Database Optimization
- **Indexes**: Create efficient indexes for common queries
- **Bulk Operations**: Use bulkDocs for batch operations
- **Debouncing**: Debounce clipboard monitoring to avoid excessive writes

### 6. User Experience

#### Visual Feedback
- **Copy Success**: Brief toast/notification when copying from history
- **Loading States**: Show skeleton loaders while fetching history
- **Empty States**: Helpful messaging when history is empty

#### Keyboard Shortcuts
- `Ctrl/Cmd + Shift + V`: Open clipboard history sidebar
- `Enter` on selected item: Copy to clipboard
- `Delete` on selected item: Delete entry
- `Ctrl/Cmd + P` on selected item: Pin/unpin entry

#### Accessibility
- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard support for all actions
- **Focus Management**: Proper focus handling when opening/closing
- **Screen Reader**: Announce state changes and actions

### 7. Future Enhancements

#### Phase 2 Features
1. **Rich Content Support**:
   - Image clipboard support with thumbnails
   - HTML formatting preservation
   - File clipboard support

2. **Smart Features**:
   - Auto-categorization (code, URLs, emails, etc.)
   - Duplicate detection and merging
   - Clipboard templates/snippets

3. **Organization**:
   - User-defined categories/folders
   - Tags and labels
   - Favorites/starred items

4. **Task Completion Assistance** (Long-term goal):
   - Use clipboard history to understand user intent
   - Suggest next steps based on copied content
   - Context-aware recommendations
   - Integration with agent for clipboard-aware actions

5. **Sync and Backup**:
   - Optional cloud sync via CouchDB
   - Export/import clipboard history
   - Sync across Darc instances

## Implementation Plan

### Phase 1: Core Functionality (MVP)
1. Create ClipboardMonitor service
2. Implement data model and storage
3. Create ClipboardHistory.svelte component
4. Create ClipboardHistoryItem.svelte component
5. Integrate with App.svelte sidebar system
6. Add basic settings
7. Implement copy event detection

### Phase 2: Enhanced UX
1. Implement filters and grouping
2. Add keyboard shortcuts
3. Improve visual design
4. Add animations and transitions

### Phase 3: Advanced Features
1. Image clipboard support
2. Smart categorization
3. Export/import functionality

## Testing Strategy

### Unit Tests
- ClipboardMonitor service
- Data queries and filtering
- Content type detection
- Deduplication logic

### Integration Tests
- Event detection across different copy methods
- PouchDB storage and retrieval
- Sidebar open/close behavior
- Settings persistence

### E2E Tests

E2E tests will use Playwright to capture screenshots of the feature in action, which will be linked in a README.md for easy validation. This will create a visual user story showing:
- Copy text from various sources
- Filter clipboard history
- Pin/unpin items
- Delete items
- Clear all history

A detailed end-to-end testing document will be created in the future specifying the complete screenshot-based validation process.

### Manual Testing
- Test in different origins (HTTP, HTTPS, isolated-app://)
- Test with different content types
- Test with large clipboard histories
- Test performance with various entry counts
- Test privacy controls

## Success Metrics

- Clipboard entries successfully captured: >95%
- Memory overhead: <50MB for 1000 entries
- User adoption: Track usage via settings
- Performance: No noticeable impact on copy operations

## Conclusion

The clipboard history feature will enhance Darc Browser by providing users with persistent access to their clipboard history. By following the existing architectural patterns and leveraging PouchDB for storage, the implementation will integrate seamlessly with the current codebase while maintaining the browser's focus on UX innovation without resource constraints.
