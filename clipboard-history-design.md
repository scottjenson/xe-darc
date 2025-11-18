# Clipboard History Pane - Design Document

## Overview

This document outlines the design for a new clipboard history feature in Darc Browser. The feature will capture every copy operation performed by the user and display the copied content in a dedicated sidebar pane, providing users with quick access to their clipboard history.

## Problem Statement

Users frequently need to reference previously copied text but lose access to it once a new item is copied to the clipboard. A clipboard history feature would allow users to:
- Review previously copied items
- Re-copy items from history
- Search through clipboard history
- Manage clipboard entries (delete, pin, categorize)

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
├── ClipboardHistoryItem.svelte (New Component)
└── ClipboardSearchBar.svelte (New Component)
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

### 3. User Interface

#### Sidebar Button

**Location**: `app/App.svelte` - right sidebar button array

Add a new button alongside existing sidebar buttons:
```svelte
<button class="sidebar-button" 
        class:active={openSidebars.has('clipboardHistory')}
        title="Clipboard History" 
        aria-label="Clipboard History"
        onmousedown={() => toggleSidebar('clipboardHistory')}>
    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
</button>
```

#### ClipboardHistory.svelte Component

**Location**: `app/components/ClipboardHistory.svelte`

##### Structure:
```svelte
<RightSidebar 
    title="Clipboard History"
    {onClose}
    {openSidebars}
    {switchToResources}
    {switchToSettings}
    ...
>
    <!-- Search and Filter Bar -->
    <div class="clipboard-controls">
        <input 
            type="search" 
            placeholder="Search clipboard history..."
            bind:value={searchQuery}
        />
        <div class="filter-buttons">
            <button class:active={filter === 'all'}>All</button>
            <button class:active={filter === 'text'}>Text</button>
            <button class:active={filter === 'code'}>Code</button>
            <button class:active={filter === 'urls'}>URLs</button>
            <button class:active={filter === 'pinned'}>Pinned</button>
        </div>
    </div>

    <!-- Settings and Actions -->
    <div class="clipboard-settings">
        <div class="setting-row">
            <label>
                <input type="checkbox" bind:checked={monitorEnabled} />
                Monitor clipboard
            </label>
        </div>
        <div class="setting-row">
            <label>Max entries: 
                <select bind:value={maxEntries}>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={5000}>5000</option>
                </select>
            </label>
        </div>
        <button class="clear-all-button" onclick={handleClearAll}>
            Clear All
        </button>
    </div>

    <!-- Clipboard Items List -->
    <div class="clipboard-items">
        {#if filteredItems.length === 0}
            <div class="empty-state">
                <svg>...</svg>
                <p>No clipboard history yet</p>
                <p class="subtitle">Copy text to start building your history</p>
            </div>
        {:else}
            <div class="items-list">
                {#each groupedItems as group (group.date)}
                    <div class="date-group">
                        <div class="date-header">{group.label}</div>
                        {#each group.items as item (item._id)}
                            <ClipboardHistoryItem 
                                {item}
                                onCopy={() => handleCopy(item)}
                                onPin={() => handlePin(item)}
                                onDelete={() => handleDelete(item)}
                                onEdit={() => handleEdit(item)}
                            />
                        {/each}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</RightSidebar>
```

##### Features:
- **Search**: Full-text search across all clipboard entries
- **Filters**: 
  - All items
  - Text only
  - Code (detected by syntax patterns)
  - URLs (detected by URL patterns)
  - Pinned items
- **Grouping**: Group items by date (Today, Yesterday, Last 7 Days, etc.)
- **Actions per item**:
  - Copy to clipboard (primary action)
  - Pin/Unpin
  - Delete
  - Add notes
  - View full content (for large items)

#### ClipboardHistoryItem.svelte Component

**Location**: `app/components/ClipboardHistoryItem.svelte`

##### Structure:
```svelte
<div class="clipboard-item" class:pinned={item.userMetadata.pinned}>
    <!-- Item Header -->
    <div class="item-header">
        <div class="item-metadata">
            <span class="timestamp">{formatTimestamp(item.metadata.timestamp)}</span>
            {#if item.metadata.source}
                <span class="source">
                    <Favicon url={item.metadata.source.origin} />
                    {item.metadata.source.title || item.metadata.source.origin}
                </span>
            {/if}
        </div>
        <div class="item-actions">
            <button 
                class="action-button"
                title="Copy"
                onclick={() => onCopy()}>
                <svg><!-- copy icon --></svg>
            </button>
            <button 
                class="action-button"
                class:active={item.userMetadata.pinned}
                title={item.userMetadata.pinned ? 'Unpin' : 'Pin'}
                onclick={() => onPin()}>
                <svg><!-- pin icon --></svg>
            </button>
            <button 
                class="action-button"
                title="Delete"
                onclick={() => onDelete()}>
                <svg><!-- delete icon --></svg>
            </button>
        </div>
    </div>

    <!-- Content Preview -->
    <div class="item-content">
        {#if item.metadata.contentType.startsWith('text/')}
            <div class="text-preview" class:code={isCodeContent(item)}>
                {item.metadata.preview || item.content.text}
            </div>
        {:else if item.metadata.contentType.startsWith('image/')}
            <img src={item.content.dataUrl} alt="Clipboard image" />
        {/if}
    </div>

    <!-- Tags and Categories -->
    {#if item.userMetadata.tags?.length > 0}
        <div class="item-tags">
            {#each item.userMetadata.tags as tag}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}

    <!-- User Notes -->
    {#if item.userMetadata.notes}
        <div class="item-notes">
            {item.userMetadata.notes}
        </div>
    {/if}
</div>
```

### 4. Integration Points

#### 4.1 App.svelte Modifications

**Add state management**:
```javascript
// Add to openSidebars Set
// Line ~112
let openSidebars = $state(new Set())

// Add switch function
// Line ~1603
const switchToClipboardHistory = () => switchToSidebar('clipboardHistory')

// Add to toggleSidebar
// Ensure 'clipboardHistory' is handled like other sidebars
```

**Add sidebar rendering**:
```svelte
<!-- Line ~3894, in sidebar rendering section -->
{#if openSidebars.has('clipboardHistory')}
    <div class="sidebar-panel" 
         class:new-panel={openSidebars.has('clipboardHistory') && 
                         !prevOpenSidebars.has('clipboardHistory') && 
                         !isSwitchingSidebars && 
                         !isWindowResizing}>
        <ClipboardHistory 
            onClose={() => closeSidebar('clipboardHistory')}
            {openSidebars}
            {switchToResources} 
            {switchToSettings}
            {switchToUserMods}
            {switchToActivity}
            switchToAgent={switchToAIAgent}
            {switchToDevTools}
            switchToClipboardHistory={switchToClipboardHistory}
            {devModeEnabled} />
    </div>
{/if}
```

#### 4.2 data.svelte.js Modifications

**Add clipboard monitor initialization**:
```javascript
// After PouchDB initialization, line ~25
import ClipboardMonitor from './lib/clipboardMonitor.js'

// Initialize clipboard monitor, line ~100
const clipboardMonitor = new ClipboardMonitor(db, {
  enabled: localStorage.getItem('clipboardMonitorEnabled') !== 'false',
  maxEntries: parseInt(localStorage.getItem('clipboardMaxEntries') || '1000'),
  maxEntrySize: 1024 * 1024, // 1MB
  deduplicateWindow: 5000
})

clipboardMonitor.init()

// Export for external access
export { clipboardMonitor }
```

**Add clipboard-specific queries**:
```javascript
// Add function to query clipboard history
async function getClipboardHistory(options = {}) {
  const {
    limit = 50,
    skip = 0,
    filter = 'all',
    searchQuery = '',
    startDate = null,
    endDate = null
  } = options

  const selector = {
    type: 'clipboard',
    'userMetadata.archived': { $ne: true }
  }

  if (filter === 'pinned') {
    selector['userMetadata.pinned'] = true
  }

  if (startDate || endDate) {
    selector['metadata.timestamp'] = {}
    if (startDate) selector['metadata.timestamp'].$gte = startDate
    if (endDate) selector['metadata.timestamp'].$lte = endDate
  }

  const result = await db.find({
    selector,
    sort: [
      { 'userMetadata.pinned': 'desc' },
      { 'metadata.timestamp': 'desc' }
    ],
    limit,
    skip
  })

  // Apply client-side search filter if needed
  if (searchQuery) {
    result.docs = result.docs.filter(doc => 
      doc.content.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.metadata.source?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return result.docs
}
```

#### 4.3 RightSidebar.svelte Modifications

**Add navigation button**:
```svelte
<!-- Line ~17, add after existing nav buttons -->
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

**Update component props**:
```svelte
<!-- Line ~2, add to props -->
let { 
    ...,
    switchToClipboardHistory
} = $props()
```

### 5. Settings Integration

Add clipboard history settings to the Settings component:

**Location**: `app/components/Settings.svelte`

```svelte
<!-- Add new settings section -->
<div class="setting-section">
    <h4>Clipboard History</h4>
    
    <div class="setting-row">
        <label>
            <input 
                type="checkbox" 
                bind:checked={clipboardMonitorEnabled}
                onchange={handleClipboardMonitorToggle}
            />
            Enable clipboard monitoring
        </label>
        <p class="setting-description">
            Automatically save copied text to clipboard history
        </p>
    </div>

    <div class="setting-row">
        <label for="clipboard-max-entries">Maximum entries</label>
        <select 
            id="clipboard-max-entries"
            bind:value={clipboardMaxEntries}
            onchange={handleMaxEntriesChange}
        >
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1,000</option>
            <option value="5000">5,000</option>
            <option value="10000">10,000</option>
        </select>
        <p class="setting-description">
            Older entries will be automatically deleted
        </p>
    </div>

    <div class="setting-row">
        <label for="clipboard-retention">Retention period</label>
        <select id="clipboard-retention" bind:value={clipboardRetention}>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="-1">Forever</option>
        </select>
    </div>

    <div class="setting-row">
        <button 
            class="danger-button"
            onclick={handleClearClipboardHistory}
        >
            Clear All Clipboard History
        </button>
    </div>
</div>
```

### 6. Performance Considerations

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

### 7. Privacy and Security

#### Privacy Features
- **Local Storage Only**: All clipboard data stays in IndexedDB
- **No Sync**: Clipboard history is not synced to cloud by default
- **User Control**: Easy toggle to disable monitoring
- **Clear History**: One-click to clear all history

#### Security Considerations
- **Sensitive Data**: Consider adding auto-detection for sensitive patterns (passwords, tokens)
- **Redaction Option**: Allow users to manually redact sensitive entries
- **Permissions**: Request clipboard-read permission explicitly
- **CSP Compliance**: Ensure all clipboard operations comply with Content Security Policy

### 8. User Experience

#### Visual Feedback
- **Copy Success**: Brief toast/notification when copying from history
- **Search Results**: Highlight search terms in results
- **Loading States**: Show skeleton loaders while fetching history
- **Empty States**: Helpful messaging when history is empty

#### Keyboard Shortcuts
- `Ctrl/Cmd + Shift + V`: Open clipboard history sidebar
- `Enter` on selected item: Copy to clipboard
- `Delete` on selected item: Delete entry
- `Ctrl/Cmd + P` on selected item: Pin/unpin entry
- `/` or `Ctrl/Cmd + F`: Focus search box

#### Accessibility
- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard support for all actions
- **Focus Management**: Proper focus handling when opening/closing
- **Screen Reader**: Announce state changes and actions

### 9. Future Enhancements

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

4. **Advanced Search**:
   - Regex search support
   - Filter by date range
   - Filter by source origin

5. **Sync and Backup**:
   - Optional cloud sync via CouchDB
   - Export/import clipboard history
   - Sync across Darc instances

6. **Integration**:
   - Share clipboard items with other tabs
   - Integration with agent for clipboard-aware actions
   - Clipboard item suggestions based on context

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
1. Add search functionality
2. Implement filters and grouping
3. Add keyboard shortcuts
4. Improve visual design
5. Add animations and transitions

### Phase 3: Advanced Features
1. Image clipboard support
2. Smart categorization
3. Advanced search
4. Export/import functionality

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
- Copy text from various sources
- Search and filter clipboard history
- Pin/unpin items
- Delete items
- Clear all history

### Manual Testing
- Test in different origins (HTTP, HTTPS, isolated-app://)
- Test with different content types
- Test with large clipboard histories
- Test performance with various entry counts
- Test privacy controls

## Success Metrics

- Clipboard entries successfully captured: >95%
- Search response time: <100ms for 1000 entries
- Memory overhead: <50MB for 1000 entries
- User adoption: Track usage via settings
- Performance: No noticeable impact on copy operations

## Conclusion

The clipboard history feature will enhance Darc Browser by providing users with persistent access to their clipboard history. By following the existing architectural patterns and leveraging PouchDB for storage, the implementation will integrate seamlessly with the current codebase while maintaining the browser's focus on UX innovation without resource constraints.
