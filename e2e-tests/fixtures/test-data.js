/**
 * TestDataManager handles test data setup, seeding, and cleanup
 */
export class TestDataManager {
  constructor(page) {
    this.page = page;
  }
  
  /**
   * Reset database to clean state
   */
  async resetDatabase() {
    await this.page.evaluate(async () => {
      if (window.db) {
        try {
          // Get all docs
          const allDocs = await window.db.allDocs();
          
          // Delete all docs
          const docsToDelete = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
          }));
          
          if (docsToDelete.length > 0) {
            await window.db.bulkDocs(docsToDelete);
          }
        } catch (error) {
          console.error('Error resetting database:', error);
        }
      }
    });
  }
  
  /**
   * Seed database with test data
   * @param {Array} data - Array of documents to insert
   */
  async seedDatabase(data) {
    await this.page.evaluate(async (testData) => {
      if (window.db) {
        try {
          await window.db.bulkDocs(testData);
        } catch (error) {
          console.error('Error seeding database:', error);
        }
      }
    }, data);
  }
  
  /**
   * Create a test tab
   * @param {Object} properties - Tab properties
   * @returns {Object} - Created tab document
   */
  async createTestTab(properties = {}) {
    return await this.page.evaluate(async (props) => {
      const tab = {
        _id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'tab',
        title: 'Test Tab',
        url: 'about:blank',
        active: false,
        order: 0,
        ...props
      };
      
      const result = await window.db.put(tab);
      return { ...tab, _rev: result.rev };
    }, properties);
  }
  
  /**
   * Create a test clipboard entry
   * @param {string} content - Clipboard content
   * @param {Object} properties - Additional properties
   * @returns {Object} - Created clipboard document
   */
  async createTestClipboardEntry(content, properties = {}) {
    return await this.page.evaluate(async ({ text, props }) => {
      const timestamp = Date.now();
      const entry = {
        _id: `clipboard:${timestamp}`,
        type: 'clipboard',
        content: text,
        timestamp,
        created: timestamp,
        modified: timestamp,
        ...props
      };
      
      const result = await window.db.put(entry);
      return { ...entry, _rev: result.rev };
    }, { text: content, props: properties });
  }
  
  /**
   * Get all documents of a specific type
   * @param {string} type - Document type
   * @returns {Array} - Documents of specified type
   */
  async getDocumentsByType(type) {
    return await this.page.evaluate(async (docType) => {
      if (!window.db) return [];
      
      const result = await window.db.find({
        selector: { type: docType }
      });
      
      return result.docs;
    }, type);
  }
  
  /**
   * Delete all documents of a specific type
   * @param {string} type - Document type to delete
   */
  async deleteDocumentsByType(type) {
    await this.page.evaluate(async (docType) => {
      if (!window.db) return;
      
      const docs = await window.db.find({
        selector: { type: docType }
      });
      
      for (const doc of docs.docs) {
        await window.db.remove(doc);
      }
    }, type);
  }
  
  /**
   * Wait for database to be ready
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForDatabaseReady(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isReady = await this.page.evaluate(() => {
        return window.db !== undefined && window.db !== null;
      });
      
      if (isReady) return true;
      
      await this.page.waitForTimeout(100);
    }
    
    throw new Error('Database not ready within timeout');
  }
}
