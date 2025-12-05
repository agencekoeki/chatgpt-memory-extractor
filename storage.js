// ChatGPT Memory Extractor - Storage Module v1.0
// IndexedDB for persistent storage

const DB_NAME = 'MemoryExtractorDB';
const DB_VERSION = 1;

class StorageClass {
  constructor() {
    this.db = null;
  }

  // ========== INIT ==========
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Storage] IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Memories store
        if (!db.objectStoreNames.contains('memories')) {
          const memoriesStore = db.createObjectStore('memories', { keyPath: 'id', autoIncrement: true });
          memoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
          memoriesStore.createIndex('text', 'text', { unique: false });
        }

        // Labels store (for categorization)
        if (!db.objectStoreNames.contains('labels')) {
          const labelsStore = db.createObjectStore('labels', { keyPath: 'memoryId' });
          labelsStore.createIndex('labels', 'labels', { unique: false, multiEntry: true });
        }

        // Analysis results store
        if (!db.objectStoreNames.contains('analysis')) {
          db.createObjectStore('analysis', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('[Storage] Database schema created');
      };
    });
  }

  // ========== MEMORIES ==========
  async saveMemories(memories) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['memories'], 'readwrite');
      const store = transaction.objectStore('memories');

      // Clear existing memories
      store.clear();

      // Add new memories
      const timestamp = new Date().toISOString();
      memories.forEach((memory, index) => {
        store.add({
          text: memory.text,
          timestamp: memory.timestamp || timestamp,
          order: index
        });
      });

      transaction.oncomplete = () => {
        console.log(`[Storage] Saved ${memories.length} memories`);
        resolve({ success: true, count: memories.length });
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getMemories() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['memories'], 'readonly');
      const store = transaction.objectStore('memories');
      const request = store.getAll();

      request.onsuccess = () => {
        const memories = request.result.sort((a, b) => a.order - b.order);
        resolve(memories);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearMemories() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['memories', 'labels', 'analysis'], 'readwrite');
      transaction.objectStore('memories').clear();
      transaction.objectStore('labels').clear();
      transaction.objectStore('analysis').clear();

      transaction.oncomplete = () => resolve({ success: true });
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ========== LABELS ==========
  async saveLabels(memoryId, labels) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['labels'], 'readwrite');
      const store = transaction.objectStore('labels');

      store.put({ memoryId, labels, timestamp: new Date().toISOString() });

      transaction.oncomplete = () => resolve({ success: true });
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllLabels() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['labels'], 'readonly');
      const store = transaction.objectStore('labels');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== ANALYSIS RESULTS ==========
  async saveAnalysisResults(results) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analysis'], 'readwrite');
      const store = transaction.objectStore('analysis');

      store.put({
        id: 'latest',
        ...results,
        timestamp: new Date().toISOString()
      });

      transaction.oncomplete = () => {
        console.log('[Storage] Analysis results saved');
        resolve({ success: true });
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAnalysisResults() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analysis'], 'readonly');
      const store = transaction.objectStore('analysis');
      const request = store.get('latest');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SETTINGS & API KEYS ==========
  async saveApiKeys(keys) {
    return this.saveSetting('apiKeys', keys);
  }

  async getApiKeys() {
    const result = await this.getSetting('apiKeys');
    return result || { anthropic: '', openai: '', google: '' };
  }

  async saveSettings(settings) {
    return this.saveSetting('userSettings', settings);
  }

  async getSettings() {
    const result = await this.getSetting('userSettings');
    return result || {
      preferredProvider: 'anthropic',
      labelerModel: 'haiku',
      profilerModel: 'opus',
      autoAnalyze: false
    };
  }

  async saveSetting(key, value) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');

      store.put({ key, value, timestamp: new Date().toISOString() });

      transaction.oncomplete = () => resolve({ success: true });
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getSetting(key) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== EXPORT ==========
  async exportAll() {
    const memories = await this.getMemories();
    const labels = await this.getAllLabels();
    const analysis = await this.getAnalysisResults();

    return {
      exportDate: new Date().toISOString(),
      memories,
      labels,
      analysis
    };
  }
}

export const Storage = new StorageClass();
