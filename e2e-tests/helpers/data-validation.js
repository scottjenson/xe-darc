// Data Validation Helper
// Validates internal data structures (PouchDB, state) during E2E tests

export class DataValidator {
  constructor(page) {
    this.page = page;
  }

  /**
   * Validate PouchDB documents
   */
  async validateDocuments(query = {}, assertions = []) {
    const docs = await this.page.evaluate(async (q) => {
      // Access the global db instance
      if (!window.db) throw new Error('PouchDB not available');

      const result = await window.db.allDocs({
        include_docs: true,
        ...q
      });

      return result.rows.map(row => row.doc);
    }, query);

    // Run assertions
    for (const assertion of assertions) {
      assertion(docs);
    }

    return docs;
  }

  /**
   * Query specific documents by type
   */
  async queryByType(type) {
    return await this.page.evaluate(async (docType) => {
      if (!window.db) throw new Error('PouchDB not available');

      const result = await window.db.allDocs({
        include_docs: true,
        startkey: `${docType}:`,
        endkey: `${docType}:\ufff0`
      });

      return result.rows.map(row => row.doc);
    }, type);
  }

  /**
   * Get specific document by ID
   */
  async getDocument(id) {
    return await this.page.evaluate(async (docId) => {
      if (!window.db) throw new Error('PouchDB not available');

      try {
        return await window.db.get(docId);
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }, id);
  }

  /**
   * Count documents by type
   */
  async countDocuments(type) {
    const docs = await this.queryByType(type);
    return docs.length;
  }

  /**
   * Validate reactive state (if accessible)
   */
  async validateState(stateKey) {
    const state = await this.page.evaluate((key) => {
      // Try to access global state
      if (window.appState) {
        return window.appState[key];
      }
      // Or try data from data.svelte.js exports
      if (window.data) {
        return window.data[key];
      }
      throw new Error(`State ${key} not accessible`);
    }, stateKey);

    return state;
  }

  /**
   * Wait for data condition
   */
  async waitForDataCondition(conditionFn, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.page.evaluate(conditionFn);
      if (result) return true;
      await this.page.waitForTimeout(100);
    }

    throw new Error('Data condition not met within timeout');
  }

  /**
   * Wait for document count
   */
  async waitForDocumentCount(type, expectedCount, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const count = await this.countDocuments(type);
      if (count === expectedCount) return true;
      await this.page.waitForTimeout(100);
    }

    const actualCount = await this.countDocuments(type);
    throw new Error(`Expected ${expectedCount} documents of type '${type}', but found ${actualCount}`);
  }
}
