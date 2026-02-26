/**
 * IndexedDB Database Module for Admin Interface
 * Handles local storage and persistence of configuration data
 */

class AdminDatabase {
    constructor() {
        this.dbName = 'BrowserCapabilityAdminDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            browsers: 'browsers',
            tests: 'tests',
            solutions: 'solutions',
            snippets: 'snippets',
            settings: 'settings',
            i18n: 'i18n'
        };
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                Object.values(this.stores).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        
                        // Add indexes for common queries
                        if (storeName === 'solutions') {
                            store.createIndex('issueKey', 'issueKey', { unique: false });
                            store.createIndex('scope', 'appliesTo.scope', { unique: false });
                        }
                        if (storeName === 'tests') {
                            store.createIndex('detectorKey', 'detectorKey', { unique: true });
                            store.createIndex('category', 'category', { unique: false });
                        }
                        if (storeName === 'snippets') {
                            store.createIndex('title', 'title', { unique: false });
                        }
                    }
                });
            };
        });
    }

    /**
     * Generic CRUD operations
     */
    async create(storeName, data) {
        if (!data.id) {
            data.id = this.generateId();
        }
        data.lastUpdated = new Date().toISOString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async read(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        data.lastUpdated = new Date().toISOString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Specialized methods for each entity type
     */
    async saveBrowser(browser) {
        return browser.id 
            ? this.update(this.stores.browsers, browser)
            : this.create(this.stores.browsers, browser);
    }

    async getBrowser(id) {
        return this.read(this.stores.browsers, id);
    }

    async getAllBrowsers() {
        return this.getAll(this.stores.browsers);
    }

    async deleteBrowser(id) {
        return this.delete(this.stores.browsers, id);
    }

    async saveTest(test) {
        return test.id
            ? this.update(this.stores.tests, test)
            : this.create(this.stores.tests, test);
    }

    async getTest(id) {
        return this.read(this.stores.tests, id);
    }

    async getAllTests() {
        return this.getAll(this.stores.tests);
    }

    async getTestsByCategory(category) {
        return this.getAllByIndex(this.stores.tests, 'category', category);
    }

    async deleteTest(id) {
        return this.delete(this.stores.tests, id);
    }

    async saveSolution(solution) {
        return solution.id
            ? this.update(this.stores.solutions, solution)
            : this.create(this.stores.solutions, solution);
    }

    async getSolution(id) {
        return this.read(this.stores.solutions, id);
    }

    async getAllSolutions() {
        return this.getAll(this.stores.solutions);
    }

    async getSolutionsByIssue(issueKey) {
        return this.getAllByIndex(this.stores.solutions, 'issueKey', issueKey);
    }

    async deleteSolution(id) {
        return this.delete(this.stores.solutions, id);
    }

    async saveSnippet(snippet) {
        return snippet.id
            ? this.update(this.stores.snippets, snippet)
            : this.create(this.stores.snippets, snippet);
    }

    async getSnippet(id) {
        return this.read(this.stores.snippets, id);
    }

    async getAllSnippets() {
        return this.getAll(this.stores.snippets);
    }

    async deleteSnippet(id) {
        return this.delete(this.stores.snippets, id);
    }

    async saveSettings(settings) {
        settings.id = 'main'; // Single settings object
        return this.update(this.stores.settings, settings);
    }

    async getSettings() {
        const settings = await this.read(this.stores.settings, 'main');
        return settings || this.getDefaultSettings();
    }

    async saveI18n(i18nData) {
        i18nData.id = 'main'; // Single i18n object
        return this.update(this.stores.i18n, i18nData);
    }

    async getI18n() {
        const i18n = await this.read(this.stores.i18n, 'main');
        return i18n || this.getDefaultI18n();
    }

    /**
     * Export all data as JSON
     */
    async exportData(options = {}) {
        const browsers = await this.getAllBrowsers();
        const tests = await this.getAllTests();
        const solutions = await this.getAllSolutions();
        const snippets = await this.getAllSnippets();
        const settings = await this.getSettings();
        const i18n = await this.getI18n();

        const exportData = {
            schemaVersion: settings.schemaVersion || 1,
            generatedAt: new Date().toISOString(),
            locales: i18n.locales || this.getDefaultI18n().locales,
            browsers: browsers,
            tests: tests,
            solutions: solutions,
            snippets: snippets,
            meta: {
                version: settings.dbVersion || '1.0.0',
                notes: settings.notes || ''
            }
        };

        // Process export options
        if (options.inlineSnippets) {
            exportData.solutions = this.inlineSnippetsInSolutions(solutions, snippets);
        }

        if (options.embedIcons) {
            exportData.browsers = await this.embedIconsInBrowsers(browsers);
        }

        if (options.checksum) {
            exportData.meta.checksum = await this.calculateChecksum(exportData);
        }

        return exportData;
    }

    /**
     * Import data from JSON
     */
    async importData(jsonData) {
        try {
            // Clear existing data
            await this.clearAllStores();

            // Import browsers
            if (jsonData.browsers) {
                for (const browser of jsonData.browsers) {
                    await this.saveBrowser(browser);
                }
            }

            // Import tests
            if (jsonData.tests) {
                for (const test of jsonData.tests) {
                    await this.saveTest(test);
                }
            }

            // Import solutions
            if (jsonData.solutions) {
                for (const solution of jsonData.solutions) {
                    await this.saveSolution(solution);
                }
            }

            // Import snippets
            if (jsonData.snippets) {
                for (const snippet of jsonData.snippets) {
                    await this.saveSnippet(snippet);
                }
            }

            // Import settings
            if (jsonData.meta) {
                const settings = await this.getSettings();
                settings.schemaVersion = jsonData.schemaVersion || 1;
                settings.dbVersion = jsonData.meta.version || '1.0.0';
                settings.notes = jsonData.meta.notes || '';
                await this.saveSettings(settings);
            }

            // Import i18n
            if (jsonData.locales) {
                const i18n = {
                    id: 'main',
                    locales: jsonData.locales
                };
                await this.saveI18n(i18n);
            }

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    getDefaultSettings() {
        return {
            id: 'main',
            schemaVersion: 1,
            dbVersion: '1.0.0',
            notes: '',
            autosaveEnabled: true,
            autosaveInterval: 30
        };
    }

    getDefaultI18n() {
        return {
            id: 'main',
            locales: {
                default: 'en-US',
                supported: ['en-US'],
                messages: {
                    'en-US': {
                        'ui.save': 'Save',
                        'ui.export': 'Export',
                        'ui.import': 'Import',
                        'ui.delete': 'Delete',
                        'ui.cancel': 'Cancel',
                        'ui.confirm': 'Confirm',
                        'ui.add': 'Add',
                        'ui.edit': 'Edit',
                        'ui.search': 'Search',
                        'ui.filter': 'Filter'
                    }
                }
            }
        };
    }

    async clearAllStores() {
        const storeNames = Object.values(this.stores);
        for (const storeName of storeNames) {
            await this.clearStore(storeName);
        }
    }

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    inlineSnippetsInSolutions(solutions, snippets) {
        const snippetMap = new Map(snippets.map(s => [s.id, s]));
        
        return solutions.map(solution => {
            let content = solution.content;
            
            // Replace snippet references
            const snippetRegex = /\{\{snippet:([^}\s]+)(?:\s+([^}]+))?\}\}/g;
            content = content.replace(snippetRegex, (match, snippetId, params) => {
                const snippet = snippetMap.get(snippetId);
                if (!snippet) return match;
                
                let snippetContent = snippet.body;
                
                // Replace variables if params provided
                if (params) {
                    const paramPairs = params.match(/(\w+)="([^"]+)"/g) || [];
                    paramPairs.forEach(pair => {
                        const [key, value] = pair.split('=');
                        const cleanKey = key.trim();
                        const cleanValue = value.replace(/"/g, '').trim();
                        snippetContent = snippetContent.replace(new RegExp(`\\{\\{${cleanKey}\\}\\}`, 'g'), cleanValue);
                    });
                }
                
                return snippetContent;
            });
            
            return { ...solution, content };
        });
    }

    async embedIconsInBrowsers(browsers) {
        return Promise.all(browsers.map(async browser => {
            if (browser.iconUrl && !browser.iconUrl.startsWith('data:')) {
                // Convert to data URL if it's a file path
                try {
                    const dataUrl = await this.fileToDataUrl(browser.iconUrl);
                    return { ...browser, iconUrl: dataUrl };
                } catch (error) {
                    console.warn(`Failed to embed icon for ${browser.name}:`, error);
                    return browser;
                }
            }
            return browser;
        }));
    }

    async fileToDataUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    async calculateChecksum(data) {
        const text = JSON.stringify(data);
        const encoder = new TextEncoder();
        const data_encoded = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data_encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Create global instance
window.adminDB = new AdminDatabase();