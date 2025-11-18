/**
 * Clipboard Monitor Service
 * Monitors clipboard copy events and stores copied text to the database
 */

let db = null
let lastCopiedContent = null
let lastCopiedTimestamp = 0

const DEBOUNCE_WINDOW = 1000 // 1 second
const MAX_CONTENT_SIZE = 100 * 1024 // 100KB limit for MVP

/**
 * Initialize the clipboard monitor
 * @param {PouchDB} database - The PouchDB instance
 */
export function initClipboardMonitor(database) {
    db = database
    
    // Listen for copy events
    document.addEventListener('copy', handleCopy)
    
    console.log('Clipboard monitor initialized')
}

/**
 * Handle copy events
 * @param {ClipboardEvent} event - The copy event
 */
async function handleCopy(event) {
    try {
        // Get the copied text from the clipboard
        const selection = window.getSelection()
        const copiedText = selection?.toString() || ''
        
        if (!copiedText || copiedText.trim().length === 0) {
            return // Ignore empty copies
        }
        
        // Check size limit
        if (copiedText.length > MAX_CONTENT_SIZE) {
            console.warn('Clipboard content too large, skipping:', copiedText.length)
            return
        }
        
        // Debounce: skip if same content was copied within the last second
        const now = Date.now()
        if (copiedText === lastCopiedContent && (now - lastCopiedTimestamp) < DEBOUNCE_WINDOW) {
            return
        }
        
        // Update last copied tracking
        lastCopiedContent = copiedText
        lastCopiedTimestamp = now
        
        // Store to database
        await storeClipboardEntry(copiedText, now)
        
    } catch (error) {
        console.error('Error handling copy event:', error)
    }
}

/**
 * Store a clipboard entry to the database
 * @param {string} content - The copied text
 * @param {number} timestamp - The timestamp when it was copied
 */
async function storeClipboardEntry(content, timestamp) {
    if (!db) {
        console.error('Database not initialized')
        return
    }
    
    try {
        const doc = {
            _id: `clipboard:${timestamp}`,
            type: 'clipboard',
            content: content,
            timestamp: timestamp,
            created: timestamp,
            modified: timestamp
        }
        
        await db.put(doc)
        console.log('Clipboard entry stored:', doc._id)
        
    } catch (error) {
        console.error('Error storing clipboard entry:', error)
    }
}

/**
 * Cleanup function to remove event listeners
 */
export function cleanupClipboardMonitor() {
    document.removeEventListener('copy', handleCopy)
    db = null
    lastCopiedContent = null
    lastCopiedTimestamp = 0
}
