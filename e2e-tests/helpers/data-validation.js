/**
 * DataValidator provides utilities for validating PouchDB data
 * and reactive state during E2E tests.
 */
export class DataValidator {
  constructor(page) {
    this.page = page;
  }
  
  /**
   * Validate PouchDB documents
   * @param {Object} query - Query parameters for PouchDB
   * @param {Array} assertions - Array of assertion functions
   * @returns {Array} - Retrieved documents
   */
  async validateDocuments(query, assertions) {
    const docs = await this.page.evaluate(async (q) => {
      const db = window.db;
      if (!db) throw new Error('PouchDB not available');
      
      const result = await db.allDocs({
        include_docs: true,
        ...q
      });
      
      return result.rows.map(row => row.doc);
    }, query);
    
    // Run assertions
    if (assertions) {
      for (const assertion of assertions) {
        assertion(docs);
      }
    }
    
    return docs;
  }
  
  /**
   * Query documents using PouchDB find
   * @param {Object} selector - PouchDB selector object
   * @param {Object} options - Additional query options
   * @returns {Array} - Retrieved documents
   */
  async findDocuments(selector, options = {}) {
    const docs = await this.page.evaluate(async ({ sel, opts }) => {
      const db = window.db;
      if (!db) throw new Error('PouchDB not available');
      
      const result = await db.find({
        selector: sel,
        ...opts
      });
      
      return result.docs;
    }, { sel: selector, opts: options });
    
    return docs;
  }
  
  /**
   * Validate reactive state
   * @param {string} stateKey - Key to access in app state
   * @returns {*} - State value
   */
  async validateState(stateKey) {
    const state = await this.page.evaluate((key) => {
      // Access Svelte stores or global state
      if (window.appState) {
        return window.appState[key];
      }
      throw new Error(`State ${key} not accessible`);
    }, stateKey);
    
    return state;
  }
  
  /**
   * Wait for a data condition to be met
   * @param {Function} conditionFn - Function that returns true when condition is met
   * @param {number} timeout - Timeout in milliseconds
   * @returns {boolean} - True if condition met
   */
  async waitForDataCondition(conditionFn, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.page.evaluate(conditionFn);
        if (result) return true;
      } catch (error) {
        // Condition check failed, continue waiting
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error('Data condition not met within timeout');
  }
  
  /**
   * Get clipboard entries from PouchDB
   * @param {number} limit - Maximum number of entries to retrieve
   * @returns {Array} - Clipboard documents
   */
  async getClipboardEntries(limit = 100) {
    const entries = await this.page.evaluate(async (lim) => {
      const db = window.db;
      if (!db) throw new Error('PouchDB not available');
      
      try {
        const result = await db.find({
          selector: { type: 'clipboard' },
          sort: [{ timestamp: 'desc' }],
          limit: lim
        });
        return result.docs;
      } catch (error) {
        console.error('Error getting clipboard entries:', error);
        return [];
      }
    }, limit);
    
    return entries;
  }
  
  /**
   * Clear all clipboard entries from database
   */
  async clearClipboardHistory() {
    await this.page.evaluate(async () => {
      const db = window.db;
      if (!db) throw new Error('PouchDB not available');
      
      const entries = await db.find({
        selector: { type: 'clipboard' }
      });
      
      for (const entry of entries.docs) {
        await db.remove(entry);
      }
    });
  }
}
