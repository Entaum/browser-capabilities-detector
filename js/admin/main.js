/**
 * Main Admin Application
 * Initializes the admin interface and coordinates all modules
 */

class AdminApp {
    constructor() {
        this.currentSection = 'browsers';
        this.db = window.adminDB;
        this.i18n = null;
        this.autosaveTimer = null;
        this.isDirty = false;
        this.solutions = [];
        this.filteredSolutions = [];
        this.snippets = [];
        this.filteredSnippets = [];
        // Cache DOM elements for filter functions
        this._filterElements = null;
    }
    
    _getFilterElements() {
        if (!this._filterElements) {
            this._filterElements = {
                solutionsScopeFilter: document.getElementById('solutions-scope-filter'),
                solutionsBrowserFilter: document.getElementById('solutions-browser-filter'),
                snippetsTargetFilter: document.getElementById('snippets-target-filter')
            };
        }
        return this._filterElements;
    }

    async init() {
        try {
            // Initialize database
            await this.db.init();
            console.log('✅ Database initialized');

            // Load i18n settings
            const i18nData = await this.db.getI18n();
            this.i18n = new I18nManager(i18nData.locales || {});
            console.log('✅ i18n loaded');

            // Initialize UI
            this.initNavigation();
            this.initSectionHandlers();
            this.initGlobalActions();
            
            // Load initial data
            await this.loadSection(this.currentSection);
            
            // Start autosave if enabled
            const settings = await this.db.getSettings();
            if (settings.autosaveEnabled) {
                this.startAutosave(settings.autosaveInterval);
            }

            console.log('✅ Admin interface initialized');
            this.showToast('Admin interface ready', 'success');
            
        } catch (error) {
            console.error('Failed to initialize admin:', error);
            this.showToast('Failed to initialize admin interface', 'error');
        }
    }

    initNavigation() {
        // Handle navigation clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(section) {
        // Update nav state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        // Update content visibility
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });
        
        this.currentSection = section;
        this.loadSection(section);
    }

    async loadSection(section) {
        try {
        switch (section) {
            case 'browsers':
                if (!window.browserManager) {
                    window.browserManager = new BrowserManager();
                await window.browserManager.init();
                } else {
                    // Reload data and re-render if manager already exists
                    await window.browserManager.loadBrowsers();
                    // Re-setup event listeners in case DOM was updated
                    window.browserManager.setupEventListeners();
                    window.browserManager.render();
                }
                break;
            case 'tests':
                if (!window.testManager) {
                    window.testManager = new TestManager();
                await window.testManager.init();
                } else {
                    // Reload data and re-render if manager already exists
                    await window.testManager.loadTests();
                    // Re-setup event listeners in case DOM was updated
                    window.testManager.setupEventListeners();
                    window.testManager.render();
                }
                break;
            case 'solutions':
                await this.loadSolutions();
                break;
            case 'snippets':
                await this.loadSnippets();
                break;
            case 'i18n':
                await this.loadI18n();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'validate':
                await this.loadValidation();
                break;
            }
        } catch (error) {
            console.error(`Failed to load section ${section}:`, error);
            this.showToast(`Failed to load ${section} section`, 'error');
        }
    }

    initSectionHandlers() {
        // Tests section handlers are managed by TestManager
        
        // Solutions section
        const addSolutionBtn = document.getElementById('add-solution-btn');
        if (addSolutionBtn) {
            addSolutionBtn.addEventListener('click', () => {
            this.showSolutionModal();
        });
        }
        
        const solutionsSearch = document.getElementById('solutions-search');
        if (solutionsSearch) {
            // Debounce search input for better performance
            let debounceTimeout;
            const adminApp = this; // Capture 'this' context
            solutionsSearch.addEventListener('input', (e) => {
                const value = e.target.value;
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    adminApp.filterSolutions(value);
                }, 300);
            });
        }
        
        const solutionsScopeFilter = document.getElementById('solutions-scope-filter');
        if (solutionsScopeFilter) {
            const adminApp = this; // Capture 'this' context
            solutionsScopeFilter.addEventListener('change', (e) => {
                const searchInput = document.getElementById('solutions-search');
                adminApp.filterSolutions(searchInput ? searchInput.value : '');
            });
        }
        
        const solutionsBrowserFilter = document.getElementById('solutions-browser-filter');
        if (solutionsBrowserFilter) {
            const adminApp = this; // Capture 'this' context
            solutionsBrowserFilter.addEventListener('change', (e) => {
                const searchInput = document.getElementById('solutions-search');
                adminApp.filterSolutions(searchInput ? searchInput.value : '');
            });
        }
        
        // Snippets section
        const addSnippetBtn = document.getElementById('add-snippet-btn');
        if (addSnippetBtn) {
            addSnippetBtn.addEventListener('click', () => {
            this.showSnippetModal();
        });
        }
        
        const snippetsSearch = document.getElementById('snippets-search');
        if (snippetsSearch) {
            // Debounce search input for better performance
            let debounceTimeout;
            const adminApp = this; // Capture 'this' context
            snippetsSearch.addEventListener('input', (e) => {
                const value = e.target.value;
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    adminApp.filterSnippets(value);
                }, 300);
            });
        }
        
        const snippetsTargetFilter = document.getElementById('snippets-target-filter');
        if (snippetsTargetFilter) {
            const adminApp = this; // Capture 'this' context
            snippetsTargetFilter.addEventListener('change', (e) => {
                const searchInput = document.getElementById('snippets-search');
                adminApp.filterSnippets(searchInput ? searchInput.value : '');
            });
        }
        
        // i18n section
        const addLocaleBtn = document.getElementById('add-locale-btn');
        if (addLocaleBtn) {
            addLocaleBtn.addEventListener('click', () => {
            this.showAddLocaleModal();
        });
        }
        
        // Validation section
        const validateBtn = document.getElementById('validate-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
            this.runValidation();
        });
        }
        
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
            this.exportDatabase();
        });
        }
        
        const previewJsonBtn = document.getElementById('preview-json-btn');
        if (previewJsonBtn) {
            previewJsonBtn.addEventListener('click', () => {
            this.previewExport();
        });
        }
    }

    initGlobalActions() {
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
            this.saveAll();
        });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
            this.exportDatabase();
        });
        }
        
        // Settings autosave
        const autosaveEnabled = document.getElementById('autosave-enabled');
        if (autosaveEnabled) {
            autosaveEnabled.addEventListener('change', (e) => {
            this.toggleAutosave(e.target.checked);
        });
        }
        
        const autosaveInterval = document.getElementById('autosave-interval');
        if (autosaveInterval) {
            autosaveInterval.addEventListener('change', (e) => {
            this.updateAutosaveInterval(e.target.value);
        });
        }
        
        // Migration button
        const migrateDataBtn = document.getElementById('migrate-data-btn');
        if (migrateDataBtn) {
            migrateDataBtn.addEventListener('click', () => {
            this.runDataMigration();
        });
        }
    }



    // Solutions section
    async loadSolutions() {
        const solutions = await this.db.getAllSolutions();
        this.solutions = solutions;
        // Only reset filteredSolutions if not already set (first load)
        if (!this.filteredSolutions || this.filteredSolutions.length === 0) {
            this.filteredSolutions = [...solutions];
        }
        const browsers = await this.db.getAllBrowsers();
        const countElement = document.getElementById('solutions-count');
        if (countElement) {
            countElement.textContent = solutions.length;
        }
        
        // Update browser filter
        const browserFilter = document.getElementById('solutions-browser-filter');
        browserFilter.innerHTML = '<option value="">All Browsers</option>';
        browsers.forEach(browser => {
            const option = document.createElement('option');
            option.value = this.escapeHtml(browser.id);
            option.textContent = browser.name; // textContent is safe
            browserFilter.appendChild(option);
        });
        
        const container = document.getElementById('solutions-list');
        container.innerHTML = '';
        
        if (solutions.length === 0) {
            container.innerHTML = this.getEmptyState('solutions');
            return;
        }
        
        const table = document.createElement('div');
        table.className = 'data-table';
        
        // Header
        table.innerHTML = `
            <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 100px 120px;">
                <div>Title</div>
                <div>Issue Key</div>
                <div>Scope</div>
                <div>Priority</div>
                <div>Actions</div>
            </div>
        `;
        
        // Use render function to display
        this.renderSolutions();
    }

    // Snippets section
    async loadSnippets() {
        const snippets = await this.db.getAllSnippets();
        this.snippets = snippets;
        // Only reset filteredSnippets if not already set (first load)
        if (!this.filteredSnippets || this.filteredSnippets.length === 0) {
            this.filteredSnippets = [...snippets];
        }
        const countElement = document.getElementById('snippets-count');
        if (countElement) {
            countElement.textContent = snippets.length;
        }
        
        const container = document.getElementById('snippets-list');
        container.innerHTML = '';
        
        // Use render function to display
        this.renderSnippets();
    }

    // i18n section
    async loadI18n() {
        const dashboard = document.getElementById('translation-dashboard');
        if (!dashboard) return;
        dashboard.innerHTML = '';
        
        // Default locale selector
        const defaultSelect = document.getElementById('default-locale-select');
        if (!defaultSelect) return;
        defaultSelect.innerHTML = '';
        this.i18n.supportedLocales.forEach(locale => {
            const option = document.createElement('option');
            option.value = this.escapeHtml(locale);
            option.textContent = locale;
            if (locale === this.i18n.defaultLocale) {
                option.selected = true;
            }
            defaultSelect.appendChild(option);
        });
        
        // Supported locales list
        const supportedList = document.getElementById('supported-locales-list');
        if (!supportedList) return;
        supportedList.innerHTML = '';
        this.i18n.supportedLocales.forEach(locale => {
            const completeness = this.i18n.getCompleteness(locale);
            const badge = document.createElement('div');
            badge.className = `locale-badge ${locale === this.i18n.defaultLocale ? 'default' : ''}`;
            badge.textContent = locale;
            
            if (locale !== this.i18n.defaultLocale) {
                const percentSpan = document.createElement('span');
                percentSpan.style.marginLeft = '8px';
                percentSpan.textContent = `${completeness}%`;
                badge.appendChild(percentSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.style.marginLeft = '8px';
                removeBtn.style.background = 'none';
                removeBtn.style.border = 'none';
                removeBtn.style.color = 'var(--error)';
                removeBtn.style.cursor = 'pointer';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => adminApp.removeLocale(this.escapeHtml(locale));
                badge.appendChild(removeBtn);
            }
            
            supportedList.appendChild(badge);
        });
        
        // Translation status
        this.i18n.supportedLocales.forEach(locale => {
            if (locale === this.i18n.defaultLocale) return;
            
            const completeness = this.i18n.getCompleteness(locale);
            const missing = this.i18n.getMissingKeys(locale);
            
            const panel = document.createElement('div');
            panel.className = 'panel';
            
            const h4 = document.createElement('h4');
            h4.textContent = locale;
            panel.appendChild(h4);
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.width = `${completeness}%`;
            progressBar.appendChild(progressFill);
            panel.appendChild(progressBar);
            
            const statusDiv = document.createElement('div');
            statusDiv.style.marginTop = '8px';
            statusDiv.style.fontSize = '14px';
            statusDiv.textContent = `${completeness}% complete${missing.length > 0 ? ` (${missing.length} missing keys)` : ''}`;
            panel.appendChild(statusDiv);
            
            dashboard.appendChild(panel);
        });
    }

    // Settings section
    async loadSettings() {
        const settings = await this.db.getSettings();
        
        document.getElementById('schema-version').value = settings.schemaVersion;
        document.getElementById('db-version').value = settings.dbVersion;
        document.getElementById('db-notes').value = settings.notes;
        document.getElementById('autosave-enabled').checked = settings.autosaveEnabled;
        document.getElementById('autosave-interval').value = settings.autosaveInterval;
    }

    // Validation section
    async loadValidation() {
        // Clear previous results
        const results = document.getElementById('validation-results');
        if (results) {
            results.innerHTML = '';
        }
    }

    async runValidation() {
        const results = document.getElementById('validation-results');
        if (!results) {
            console.error('Validation results container not found');
            return;
        }
        results.innerHTML = '<div class="spinner"></div> Running validation...';
        
        const errors = [];
        const warnings = [];
        const info = [];
        
        try {
            // Get all data
            const browsers = await this.db.getAllBrowsers();
            const tests = await this.db.getAllTests();
            const solutions = await this.db.getAllSolutions();
            const snippets = await this.db.getAllSnippets();
            
            // Check for unique IDs
            const allIds = new Set();
            [...browsers, ...tests, ...solutions, ...snippets].forEach(item => {
                if (allIds.has(item.id)) {
                    errors.push(`Duplicate ID found: ${item.id}`);
                }
                allIds.add(item.id);
            });
            
            // Validate solutions reference valid tests
            solutions.forEach(solution => {
                const test = tests.find(t => t.detectorKey === solution.issueKey);
                if (!test) {
                    warnings.push(`Solution "${solution.title}" references unknown issue key: ${solution.issueKey}`);
                }
                
                if (solution.appliesTo.browserId) {
                    const browser = browsers.find(b => b.id === solution.appliesTo.browserId);
                    if (!browser) {
                        errors.push(`Solution "${solution.title}" references unknown browser: ${solution.appliesTo.browserId}`);
                    }
                }
            });
            
            // Check snippet references in solutions
            solutions.forEach(solution => {
                const snippetRefs = solution.content.match(/\{\{snippet:([^}\s]+)/g) || [];
                snippetRefs.forEach(ref => {
                    const snippetId = ref.replace('{{snippet:', '');
                    const snippet = snippets.find(s => s.id === snippetId);
                    if (!snippet) {
                        warnings.push(`Solution "${solution.title}" references unknown snippet: ${snippetId}`);
                    }
                });
            });
            
            // Display results
            results.innerHTML = '';
            
            if (errors.length === 0 && warnings.length === 0) {
                const successItem = document.createElement('div');
                successItem.className = 'validation-item';
                const icon = document.createElement('span');
                icon.className = 'validation-icon success';
                icon.textContent = '✅';
                const message = document.createElement('div');
                message.className = 'validation-message';
                message.textContent = 'All validation checks passed!';
                successItem.appendChild(icon);
                successItem.appendChild(message);
                results.appendChild(successItem);
            } else {
                errors.forEach(error => {
                    const errorItem = document.createElement('div');
                    errorItem.className = 'validation-item';
                    const icon = document.createElement('span');
                    icon.className = 'validation-icon error';
                    icon.textContent = '❌';
                    const message = document.createElement('div');
                    message.className = 'validation-message';
                    message.textContent = error;
                    errorItem.appendChild(icon);
                    errorItem.appendChild(message);
                    results.appendChild(errorItem);
                });
                
                warnings.forEach(warning => {
                    const warningItem = document.createElement('div');
                    warningItem.className = 'validation-item';
                    const icon = document.createElement('span');
                    icon.className = 'validation-icon warning';
                    icon.textContent = '⚠️';
                    const message = document.createElement('div');
                    message.className = 'validation-message';
                    message.textContent = warning;
                    warningItem.appendChild(icon);
                    warningItem.appendChild(message);
                    results.appendChild(warningItem);
                });
            }
            
            info.push(`${browsers.length} browsers`);
            info.push(`${tests.length} tests`);
            info.push(`${solutions.length} solutions`);
            info.push(`${snippets.length} snippets`);
            
            const infoItem = document.createElement('div');
            infoItem.className = 'validation-item';
            const icon = document.createElement('span');
            icon.className = 'validation-icon success';
            icon.textContent = 'ℹ️';
            const message = document.createElement('div');
            message.className = 'validation-message';
            message.textContent = `Database contains: ${info.join(', ')}`;
            infoItem.appendChild(icon);
            infoItem.appendChild(message);
            results.appendChild(infoItem);
            
        } catch (error) {
            results.innerHTML = `
                <div class="validation-item">
                    <span class="validation-icon error">❌</span>
                    <div class="validation-message">Validation failed: ${error.message}</div>
                </div>
            `;
        }
    }

    async exportDatabase() {
        const options = {
            inlineSnippets: document.getElementById('export-inline-snippets')?.checked || false,
            embedIcons: document.getElementById('export-embed-icons')?.checked || false,
            minify: document.getElementById('export-minify')?.checked || false,
            checksum: document.getElementById('export-checksum')?.checked || false
        };
        
        try {
            const data = await this.db.exportData(options);
            const json = options.minify 
                ? JSON.stringify(data)
                : JSON.stringify(data, null, 2);
            
            // Download file
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'capability-admin-db.json';
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Database exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Export failed: ' + error.message, 'error');
        }
    }

    async previewExport() {
        const inlineSnippetsEl = document.getElementById('export-inline-snippets');
        const embedIconsEl = document.getElementById('export-embed-icons');
        const minifyEl = document.getElementById('export-minify');
        const checksumEl = document.getElementById('export-checksum');
        
        const options = {
            inlineSnippets: inlineSnippetsEl ? inlineSnippetsEl.checked : false,
            embedIcons: embedIconsEl ? embedIconsEl.checked : false,
            minify: minifyEl ? minifyEl.checked : false,
            checksum: checksumEl ? checksumEl.checked : false
        };
        
        try {
            const data = await this.db.exportData(options);
            const json = options.minify 
                ? JSON.stringify(data)
                : JSON.stringify(data, null, 2);
            
            // Show in modal
            this.showModal('Export Preview', `
                <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; max-height: 400px; overflow: auto;">
                    ${this.escapeHtml(json)}
                </pre>
            `);
        } catch (error) {
            console.error('Preview failed:', error);
            this.showToast('Preview failed: ' + error.message, 'error');
        }
    }

    // Modal management
    showModal(title, content, actions = null) {
        const container = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        const titleEl = document.createElement('h2');
        titleEl.className = 'modal-title';
        titleEl.textContent = title;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => adminApp.closeModal();
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        // Note: content is HTML string from caller - this is acceptable for admin panel
        // as it's trusted admin-generated content, not user input
        body.innerHTML = content;
        
        modalDiv.appendChild(header);
        modalDiv.appendChild(body);
        
        if (actions) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.innerHTML = actions; // Admin-generated HTML
            modalDiv.appendChild(footer);
        }
        
        modal.appendChild(modalDiv);
        container.appendChild(modal);
    }

    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'toast-icon';
        iconSpan.textContent = icons[type] || icons.info;
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;
        
        toast.appendChild(iconSpan);
        toast.appendChild(messageSpan);
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Utility methods
    getEmptyState(type) {
        const messages = {
            browsers: {
                icon: '🌐',
                title: 'No browsers configured',
                message: 'Add browsers to define compatibility targets'
            },
            tests: {
                icon: '🧪',
                title: 'No tests defined',
                message: 'Add tests to check browser capabilities'
            },
            solutions: {
                icon: '💡',
                title: 'No solutions created',
                message: 'Add solutions to help users fix compatibility issues'
            },
            snippets: {
                icon: '📝',
                title: 'No snippets available',
                message: 'Create reusable snippets for common solutions'
            }
        };
        
        const msg = messages[type] || messages.browsers;
        
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${msg.icon}</div>
                <div class="empty-state-title">${msg.title}</div>
                <div class="empty-state-message">${msg.message}</div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Autosave functionality
    startAutosave(interval = 30) {
        this.stopAutosave();
        this.autosaveTimer = setInterval(() => {
            if (this.isDirty) {
                this.saveAll(true);
            }
        }, interval * 1000);
    }

    stopAutosave() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    async saveAll(silent = false) {
        try {
            // Save settings
            const settings = {
                schemaVersion: parseInt(document.getElementById('schema-version')?.value) || 1,
                dbVersion: document.getElementById('db-version')?.value || '1.0.0',
                notes: document.getElementById('db-notes')?.value || '',
                autosaveEnabled: document.getElementById('autosave-enabled')?.checked || false,
                autosaveInterval: parseInt(document.getElementById('autosave-interval')?.value) || 30
            };
            await this.db.saveSettings(settings);
            
            // Save i18n
            await this.db.saveI18n({ id: 'main', locales: this.i18n.toJSON() });
            
            this.isDirty = false;
            
            if (!silent) {
                this.showToast('All changes saved', 'success');
            }
        } catch (error) {
            console.error('Save failed:', error);
            this.showToast('Save failed: ' + error.message, 'error');
        }
    }

    markDirty() {
        this.isDirty = true;
    }

    // Placeholder methods for CRUD operations
    // These will be implemented in separate modules
    
    async editBrowser(id) {
        if (window.browserManager) {
            window.browserManager.openBrowserModal(id);
        }
    }

    async deleteBrowser(id) {
        if (window.browserManager) {
            window.browserManager.deleteBrowser(id);
        }
    }

    async editTest(id) {
        if (window.testManager) {
            window.testManager.openTestModal(id);
        }
    }

    async deleteTest(id) {
        if (window.testManager) {
            window.testManager.deleteTest(id);
        }
    }

    async editSolution(id) {
        try {
            const solution = await this.db.getSolution(id);
            if (!solution) {
                this.showToast('Solution not found', 'error');
                return;
            }
            this.showSolutionModal(solution);
        } catch (error) {
            console.error('Failed to load solution:', error);
            this.showToast('Failed to load solution: ' + error.message, 'error');
        }
    }

    async deleteSolution(id) {
        const confirmed = await UI.showConfirm('Delete Solution', 'Are you sure you want to delete this solution? This action cannot be undone.', 'Delete', 'Cancel');
        if (confirmed) {
            try {
                await this.db.deleteSolution(id);
                this.showToast('Solution deleted successfully', 'success');
                await this.loadSolutions();
            } catch (error) {
                console.error('Failed to delete solution:', error);
                this.showToast('Failed to delete solution: ' + error.message, 'error');
            }
        }
    }

    async editSnippet(id) {
        try {
            const snippet = await this.db.getSnippet(id);
            if (!snippet) {
                this.showToast('Snippet not found', 'error');
                return;
            }
            this.showSnippetModal(snippet);
        } catch (error) {
            console.error('Failed to load snippet:', error);
            this.showToast('Failed to load snippet: ' + error.message, 'error');
        }
    }

    async deleteSnippet(id) {
        const confirmed = await UI.showConfirm('Delete Snippet', 'Are you sure you want to delete this snippet? This action cannot be undone.', 'Delete', 'Cancel');
        if (confirmed) {
            try {
                await this.db.deleteSnippet(id);
                this.showToast('Snippet deleted successfully', 'success');
                await this.loadSnippets();
            } catch (error) {
                console.error('Failed to delete snippet:', error);
                this.showToast('Failed to delete snippet: ' + error.message, 'error');
            }
        }
    }

    showBrowserModal() {
        if (window.browserManager) {
            window.browserManager.openBrowserModal();
        }
    }

    showTestModal() {
        if (window.testManager) {
            window.testManager.openTestModal();
        }
    }

    showSolutionModal(solution = null) {
        const isEdit = !!solution;
        const title = isEdit ? 'Edit Solution' : 'Add Solution';
        const adminApp = this;
        
        // Get browsers and tests for the dropdowns
        Promise.all([
            this.db.getAllBrowsers(),
            this.db.getAllTests()
        ]).then(([browsersList, testsList]) => {
            const browserOptions = browsersList.map(b => 
                `<option value="${adminApp.escapeHtml(b.id)}" ${solution && solution.appliesTo && solution.appliesTo.browserId === b.id ? 'selected' : ''}>${adminApp.escapeHtml(b.name)}</option>`
            ).join('');
            
            // Get selected test IDs
            const selectedTestIds = solution && solution.testIds ? solution.testIds : [];
            
            // Build test selector HTML
            const testOptionsHtml = testsList.map(test => {
                const isSelected = selectedTestIds.includes(test.id);
                return `
                    <div class="test-selector-item">
                        <label class="checkbox-label">
                            <input type="checkbox" class="test-checkbox" value="${adminApp.escapeHtml(test.id)}" ${isSelected ? 'checked' : ''}>
                            <span class="test-title">${adminApp.escapeHtml(test.title)}</span>
                            <span class="test-category">${adminApp.escapeHtml(test.category)}</span>
                        </label>
                    </div>
                `;
            }).join('');
            
            const content = `
                <form id="solution-form" class="admin-form">
                    <div class="form-sections">
                        <!-- Basic Information -->
                        <div class="form-section">
                            <h3>Basic Information</h3>
                            <div class="form-group">
                                <label for="solution-title">Title <span class="required">*</span></label>
                                <input type="text" id="solution-title" required value="${solution ? adminApp.escapeHtml(solution.title) : ''}" placeholder="e.g., Enable WebGL in Chrome">
                            </div>
                            <div class="form-group">
                                <label for="solution-tests">Related Tests <span class="required">*</span></label>
                                <div class="test-selector-container">
                                    <input type="text" id="test-search" class="test-search-input" placeholder="Search tests...">
                                    <div class="test-selector-list" id="test-selector-list">
                                        ${testOptionsHtml}
                                    </div>
                                    <small class="form-help">Select one or more tests that this solution addresses</small>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="solution-priority">Priority</label>
                                    <input type="number" id="solution-priority" min="0" max="100" value="${solution ? solution.priority : 0}">
                                    <small class="form-help">Higher priority solutions appear first (0-100)</small>
                                </div>
                                <div class="form-group">
                                    <label for="solution-content-format">Content Format</label>
                                    <select id="solution-content-format">
                                        <option value="md" ${solution && solution.contentFormat === 'md' ? 'selected' : 'selected'}>Markdown</option>
                                        <option value="html" ${solution && solution.contentFormat === 'html' ? 'selected' : ''}>HTML</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="solution-tags">Tags (comma-separated)</label>
                                <input type="text" id="solution-tags" value="${solution && solution.tags ? solution.tags.join(', ') : ''}" placeholder="webgl, chrome, graphics">
                                <small class="form-help">Tags help categorize and search solutions</small>
                            </div>
                        </div>

                        <!-- Applies To -->
                        <div class="form-section">
                            <h3>Applies To</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="solution-scope">Scope <span class="required">*</span></label>
                                    <select id="solution-scope" required>
                                        <option value="generic" ${solution && solution.appliesTo && solution.appliesTo.scope === 'generic' ? 'selected' : 'selected'}>Generic</option>
                                        <option value="browser" ${solution && solution.appliesTo && solution.appliesTo.scope === 'browser' ? 'selected' : ''}>Browser-specific</option>
                                        <option value="browserVersion" ${solution && solution.appliesTo && solution.appliesTo.scope === 'browserVersion' ? 'selected' : ''}>Version-specific</option>
                                    </select>
                                </div>
                                <div class="form-group" id="solution-browser-group" style="display: ${solution && solution.appliesTo && (solution.appliesTo.scope === 'browser' || solution.appliesTo.scope === 'browserVersion') ? 'block' : 'none'};">
                                    <label for="solution-browser-id">Browser</label>
                                    <select id="solution-browser-id">
                                        <option value="">Select Browser</option>
                                        ${browserOptions}
                                    </select>
                                </div>
                                <div class="form-group" id="solution-version-group" style="display: ${solution && solution.appliesTo && solution.appliesTo.scope === 'browserVersion' ? 'block' : 'none'};">
                                    <label for="solution-version-range">Version Range</label>
                                    <input type="text" id="solution-version-range" value="${solution && solution.appliesTo && solution.appliesTo.versionRange ? adminApp.escapeHtml(solution.appliesTo.versionRange) : ''}" placeholder="e.g., >=120.0.0 <125.0.0">
                                    <small class="form-help">Semver range (e.g., >=120.0.0 <125.0.0)</small>
                                </div>
                            </div>
                        </div>

                        <!-- Content Editor -->
                        <div class="form-section">
                            <h3>Content</h3>
                            <div class="editor-container">
                                <div class="editor-tabs">
                                    <button type="button" class="editor-tab active" data-tab="edit">Edit</button>
                                    <button type="button" class="editor-tab" data-tab="preview">Preview</button>
                                </div>
                                <div class="editor-content">
                                    <textarea id="solution-content" class="editor-textarea" rows="15" placeholder="Enter solution content in Markdown or HTML...">${solution ? adminApp.escapeHtml(solution.content) : ''}</textarea>
                                    <div id="solution-preview" class="editor-preview" style="display: none;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.adminApp.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <span class="icon">💾</span> ${isEdit ? 'Update' : 'Create'} Solution
                        </button>
                    </div>
                </form>
            `;
            
            adminApp.showModal(title, content);
            adminApp.setupSolutionForm(solution);
        });
    }

    setupSolutionForm(solution) {
        const form = document.getElementById('solution-form');
        if (!form) return;
        
        const adminApp = this;
        const isEdit = !!solution;
        const scopeSelect = document.getElementById('solution-scope');
        const browserGroup = document.getElementById('solution-browser-group');
        const versionGroup = document.getElementById('solution-version-group');
        const contentFormat = document.getElementById('solution-content-format');
        const contentTextarea = document.getElementById('solution-content');
        const previewDiv = document.getElementById('solution-preview');
        const editTab = document.querySelector('.editor-tab[data-tab="edit"]');
        const previewTab = document.querySelector('.editor-tab[data-tab="preview"]');
        
        // Handle scope change
        scopeSelect.addEventListener('change', (e) => {
            const scope = e.target.value;
            browserGroup.style.display = (scope === 'browser' || scope === 'browserVersion') ? 'block' : 'none';
            versionGroup.style.display = scope === 'browserVersion' ? 'block' : 'none';
        });
        
        // Handle editor tabs
        if (editTab && previewTab) {
            editTab.addEventListener('click', () => {
                editTab.classList.add('active');
                previewTab.classList.remove('active');
                contentTextarea.style.display = 'block';
                previewDiv.style.display = 'none';
            });
            
            previewTab.addEventListener('click', () => {
                previewTab.classList.add('active');
                editTab.classList.remove('active');
                contentTextarea.style.display = 'none';
                previewDiv.style.display = 'block';
                
                // Render preview
                const format = contentFormat.value;
                const content = contentTextarea.value;
                if (format === 'md' && typeof marked !== 'undefined') {
                    previewDiv.innerHTML = marked.parse(content);
                } else {
                    previewDiv.innerHTML = content;
                }
            });
        }
        
        // Test search functionality
        const testSearchInput = document.getElementById('test-search');
        const testSelectorList = document.getElementById('test-selector-list');
        if (testSearchInput && testSelectorList) {
            testSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const testItems = testSelectorList.querySelectorAll('.test-selector-item');
                testItems.forEach(item => {
                    const title = item.querySelector('.test-title').textContent.toLowerCase();
                    const category = item.querySelector('.test-category').textContent.toLowerCase();
                    if (title.includes(searchTerm) || category.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('solution-title').value.trim();
            
            // Get selected test IDs
            const selectedTests = Array.from(document.querySelectorAll('.test-checkbox:checked')).map(cb => cb.value);
            if (selectedTests.length === 0) {
                adminApp.showToast('Please select at least one related test', 'error');
                return;
            }
            
            const content = contentTextarea.value.trim();
            const contentFormatValue = contentFormat.value;
            const priority = parseInt(document.getElementById('solution-priority').value) || 0;
            const tags = document.getElementById('solution-tags').value.split(',').map(t => t.trim()).filter(t => t);
            const scope = scopeSelect.value;
            const browserId = document.getElementById('solution-browser-id').value;
            const versionRange = document.getElementById('solution-version-range').value.trim();
            
            const appliesTo = { scope };
            if (scope === 'browser' || scope === 'browserVersion') {
                appliesTo.browserId = browserId;
            }
            if (scope === 'browserVersion') {
                appliesTo.versionRange = versionRange;
            }
            
            const solutionData = {
                id: solution ? solution.id : adminApp.db.slugify(title),
                title,
                testIds: selectedTests,
                content,
                contentFormat: contentFormatValue,
                priority,
                tags,
                appliesTo,
                lastUpdated: new Date().toISOString()
            };
            
            // Validate
            const Solution = window.Solution;
            const solutionObj = new Solution(solutionData);
            const errors = solutionObj.validate();
            
            if (errors.length > 0) {
                adminApp.showToast('Validation errors: ' + errors.join(', '), 'error');
                return;
            }
            
            try {
                await adminApp.db.saveSolution(solutionData);
                adminApp.showToast(isEdit ? 'Solution updated successfully' : 'Solution created successfully', 'success');
                adminApp.closeModal();
                await adminApp.loadSolutions();
            } catch (error) {
                console.error('Failed to save solution:', error);
                adminApp.showToast('Failed to save solution: ' + error.message, 'error');
            }
        });
    }

    showSnippetModal(snippet = null) {
        const isEdit = !!snippet;
        const title = isEdit ? 'Edit Snippet' : 'Add Snippet';
        const adminApp = this;
        
        const variablesHtml = snippet && snippet.variables ? snippet.variables.map((v, i) => `
            <div class="variable-item" data-index="${i}">
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" class="variable-key" placeholder="Key (e.g., browserName)" value="${adminApp.escapeHtml(v.key)}" required>
                    </div>
                    <div class="form-group">
                        <input type="text" class="variable-label" placeholder="Label (e.g., Browser Name)" value="${adminApp.escapeHtml(v.label)}" required>
                    </div>
                    <div class="form-group">
                        <select class="variable-type">
                            <option value="string" ${v.type === 'string' ? 'selected' : ''}>String</option>
                            <option value="enum" ${v.type === 'enum' ? 'selected' : ''}>Enum</option>
                            <option value="url" ${v.type === 'url' ? 'selected' : ''}>URL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-secondary btn-sm remove-variable">Remove</button>
                    </div>
                </div>
                ${v.type === 'enum' ? `
                    <div class="form-group">
                        <input type="text" class="variable-options" placeholder="Options (comma-separated)" value="${v.options ? v.options.join(', ') : ''}">
                    </div>
                ` : ''}
            </div>
        `).join('') : '';
        
        const content = `
            <form id="snippet-form" class="admin-form">
                <div class="form-sections">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        <div class="form-group">
                            <label for="snippet-title">Title <span class="required">*</span></label>
                            <input type="text" id="snippet-title" required value="${snippet ? adminApp.escapeHtml(snippet.title) : ''}" placeholder="e.g., Chrome Settings Link">
                        </div>
                        <div class="form-group">
                            <label for="snippet-body-format">Body Format</label>
                            <select id="snippet-body-format">
                                <option value="md" ${snippet && snippet.bodyFormat === 'md' ? 'selected' : 'selected'}>Markdown</option>
                                <option value="html" ${snippet && snippet.bodyFormat === 'html' ? 'selected' : ''}>HTML</option>
                            </select>
                        </div>
                    </div>

                    <!-- Variables -->
                    <div class="form-section">
                        <h3>Variables</h3>
                        <p class="form-help">Define variables that can be used in the snippet body using {{variableKey}} syntax.</p>
                        <div id="variables-list">
                            ${variablesHtml}
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" id="add-variable-btn">
                            <span class="icon">➕</span> Add Variable
                        </button>
                    </div>

                    <!-- Targets -->
                    <div class="form-section">
                        <h3>Targets</h3>
                        <div class="form-group">
                            <label>Operating Systems</label>
                            <div class="checkbox-group">
                                ${['windows', 'macos', 'linux', 'android', 'ios'].map(os => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="target-os" value="${os}" ${snippet && snippet.targets && snippet.targets.os && snippet.targets.os.includes(os) ? 'checked' : ''}>
                                        ${os.charAt(0).toUpperCase() + os.slice(1)}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Body Editor -->
                    <div class="form-section">
                        <h3>Body</h3>
                        <div class="editor-container">
                            <div class="editor-tabs">
                                <button type="button" class="editor-tab active" data-tab="edit">Edit</button>
                                <button type="button" class="editor-tab" data-tab="preview">Preview</button>
                            </div>
                            <div class="editor-content">
                                <textarea id="snippet-body" class="editor-textarea" rows="15" placeholder="Enter snippet body in Markdown or HTML... Use {{variableKey}} for variables.">${snippet ? adminApp.escapeHtml(snippet.body) : ''}</textarea>
                                <div id="snippet-preview" class="editor-preview" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.adminApp.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="icon">💾</span> ${isEdit ? 'Update' : 'Create'} Snippet
                    </button>
                </div>
            </form>
        `;
        
        adminApp.showModal(title, content);
        adminApp.setupSnippetForm(snippet);
    }

    setupSnippetForm(snippet) {
        const form = document.getElementById('snippet-form');
        if (!form) return;
        
        const adminApp = this;
        const bodyFormat = document.getElementById('snippet-body-format');
        const bodyTextarea = document.getElementById('snippet-body');
        const previewDiv = document.getElementById('snippet-preview');
        const editTab = document.querySelector('.editor-tab[data-tab="edit"]');
        const previewTab = document.querySelector('.editor-tab[data-tab="preview"]');
        const variablesList = document.getElementById('variables-list');
        const addVariableBtn = document.getElementById('add-variable-btn');
        
        // Handle editor tabs
        if (editTab && previewTab) {
            editTab.addEventListener('click', () => {
                editTab.classList.add('active');
                previewTab.classList.remove('active');
                bodyTextarea.style.display = 'block';
                previewDiv.style.display = 'none';
            });
            
            previewTab.addEventListener('click', () => {
                previewTab.classList.add('active');
                editTab.classList.remove('active');
                bodyTextarea.style.display = 'none';
                previewDiv.style.display = 'block';
                
                // Render preview with variable placeholders
                const format = bodyFormat.value;
                let content = bodyTextarea.value;
                
                // Replace variables with placeholders for preview
                content = content.replace(/\{\{(\w+)\}\}/g, '<span style="background: #ffeb3b; padding: 2px 4px; border-radius: 3px;">{{$1}}</span>');
                
                if (format === 'md' && typeof marked !== 'undefined') {
                    previewDiv.innerHTML = marked.parse(content);
                } else {
                    previewDiv.innerHTML = content;
                }
            });
        }
        
        // Handle variable type changes
        variablesList.addEventListener('change', (e) => {
            if (e.target.classList.contains('variable-type')) {
                const variableItem = e.target.closest('.variable-item');
                const optionsInput = variableItem.querySelector('.variable-options');
                if (e.target.value === 'enum') {
                    if (!optionsInput) {
                        const optionsDiv = document.createElement('div');
                        optionsDiv.className = 'form-group';
                        optionsDiv.innerHTML = `<input type="text" class="variable-options" placeholder="Options (comma-separated)">`;
                        variableItem.appendChild(optionsDiv);
                    }
                } else if (optionsInput) {
                    optionsInput.parentElement.remove();
                }
            }
        });
        
        // Add variable
        addVariableBtn.addEventListener('click', () => {
            const index = variablesList.children.length;
            const variableItem = document.createElement('div');
            variableItem.className = 'variable-item';
            variableItem.dataset.index = index;
            variableItem.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" class="variable-key" placeholder="Key (e.g., browserName)" required>
                    </div>
                    <div class="form-group">
                        <input type="text" class="variable-label" placeholder="Label (e.g., Browser Name)" required>
                    </div>
                    <div class="form-group">
                        <select class="variable-type">
                            <option value="string">String</option>
                            <option value="enum">Enum</option>
                            <option value="url">URL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-secondary btn-sm remove-variable">Remove</button>
                    </div>
                </div>
            `;
            variablesList.appendChild(variableItem);
        });
        
        // Remove variable
        variablesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-variable')) {
                e.target.closest('.variable-item').remove();
            }
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('snippet-title').value.trim();
            const body = bodyTextarea.value.trim();
            const bodyFormatValue = bodyFormat.value;
            
            // Collect variables
            const variables = [];
            variablesList.querySelectorAll('.variable-item').forEach(item => {
                const key = item.querySelector('.variable-key').value.trim();
                const label = item.querySelector('.variable-label').value.trim();
                const type = item.querySelector('.variable-type').value;
                const optionsInput = item.querySelector('.variable-options');
                
                if (key && label) {
                    const variable = { key, label, type };
                    if (type === 'enum' && optionsInput) {
                        variable.options = optionsInput.value.split(',').map(o => o.trim()).filter(o => o);
                    }
                    variables.push(variable);
                }
            });
            
            // Collect targets
            const osTargets = [];
            document.querySelectorAll('.target-os:checked').forEach(cb => {
                osTargets.push(cb.value);
            });
            const targets = osTargets.length > 0 ? { os: osTargets } : {};
            
            const snippetData = {
                id: snippet ? snippet.id : adminApp.db.slugify(title),
                title,
                body,
                bodyFormat: bodyFormatValue,
                variables,
                targets,
                lastUpdated: new Date().toISOString()
            };
            
            // Validate
            const Snippet = window.Snippet;
            const snippetObj = new Snippet(snippetData);
            const errors = snippetObj.validate();
            
            if (errors.length > 0) {
                adminApp.showToast('Validation errors: ' + errors.join(', '), 'error');
                return;
            }
            
            try {
                await adminApp.db.saveSnippet(snippetData);
                adminApp.showToast(isEdit ? 'Snippet updated successfully' : 'Snippet created successfully', 'success');
                adminApp.closeModal();
                await adminApp.loadSnippets();
            } catch (error) {
                console.error('Failed to save snippet:', error);
                adminApp.showToast('Failed to save snippet: ' + error.message, 'error');
            }
        });
    }

    showAddLocaleModal() {
        this.showToast('Locale manager coming soon', 'info');
    }

    filterBrowsers(query) {
        if (window.browserManager) {
            window.browserManager.searchTerm = query.toLowerCase();
            window.browserManager.filterBrowsers();
        }
    }

    filterTests(query) {
        if (window.testManager) {
            window.testManager.searchTerm = query.toLowerCase();
            window.testManager.filterTests();
        }
    }

    filterSolutions(query) {
        // Ensure we have data loaded
        if (!this.solutions || this.solutions.length === 0) {
            return;
        }
        
        const searchTerm = (query || '').toLowerCase();
        const elements = this._getFilterElements();
        const scopeFilter = elements.solutionsScopeFilter?.value || '';
        const browserFilter = elements.solutionsBrowserFilter?.value || '';
        
        // Early return if no filters applied
        if (!searchTerm && !scopeFilter && !browserFilter) {
            this.filteredSolutions = [...this.solutions];
            this.renderSolutions();
            return;
        }
        
        this.filteredSolutions = this.solutions.filter(solution => {
            // Search filter
                // Support both old issueKey and new testIds format
                const issueKeyMatch = solution.issueKey ? solution.issueKey.toLowerCase().includes(searchTerm) : false;
                const testIdsMatch = solution.testIds ? solution.testIds.some(id => id.toLowerCase().includes(searchTerm)) : false;
                
                const matchesSearch = !searchTerm ||
                solution.title.toLowerCase().includes(searchTerm) ||
                issueKeyMatch ||
                testIdsMatch ||
                solution.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            // Scope filter
            const matchesScope = !scopeFilter || solution.appliesTo.scope === scopeFilter;
            
            // Browser filter
            const matchesBrowser = !browserFilter || 
                solution.appliesTo.browserId === browserFilter;
            
            return matchesSearch && matchesScope && matchesBrowser;
        });
        
        // Re-render solutions list without reloading from DB
        this.renderSolutions();
    }

    renderSolutions() {
        const browsers = this.db.getAllBrowsers ? null : []; // Will be loaded async if needed
        const container = document.getElementById('solutions-list');
        container.innerHTML = '';
        
        if (this.filteredSolutions.length === 0) {
            container.innerHTML = this.getEmptyState('solutions');
            return;
        }
        
        // Load browsers and tests for display
        Promise.all([
            this.db.getAllBrowsers(),
            this.db.getAllTests()
        ]).then(([browsers, tests]) => {
            const table = document.createElement('div');
            table.className = 'data-table';
            
            // Header
            table.innerHTML = `
                <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 100px 120px;">
                    <div>Title</div>
                    <div>Related Tests</div>
                    <div>Scope</div>
                    <div>Priority</div>
                    <div>Actions</div>
                </div>
            `;
            
            // Rows
            this.filteredSolutions.forEach(solution => {
                const row = document.createElement('div');
                row.className = 'table-row';
                row.style.gridTemplateColumns = '2fr 1fr 1fr 100px 120px';
                
                let scopeLabel = solution.appliesTo.scope;
                if (solution.appliesTo.browserId) {
                    const browser = browsers.find(b => b.id === solution.appliesTo.browserId);
                    scopeLabel = `${solution.appliesTo.scope} (${browser ? browser.name : solution.appliesTo.browserId})`;
                }
                
                // Create row safely using DOM methods
                const titleCell = document.createElement('div');
                titleCell.className = 'table-cell';
                const titleStrong = document.createElement('strong');
                titleStrong.textContent = solution.title;
                titleCell.appendChild(titleStrong);
                
                if (solution.tags.length > 0) {
                    const tagsDiv = document.createElement('div');
                    tagsDiv.style.marginTop = '4px';
                    solution.tags.forEach(tag => {
                        const tagSpan = document.createElement('span');
                        tagSpan.className = 'tag';
                        tagSpan.textContent = tag;
                        tagsDiv.appendChild(tagSpan);
                    });
                    titleCell.appendChild(tagsDiv);
                }
                
                // Display related tests
                const testsCell = document.createElement('div');
                testsCell.className = 'table-cell';
                const testIds = solution.testIds || (solution.issueKey ? [solution.issueKey] : []);
                if (testIds.length > 0) {
                    const testNames = testIds.map(testId => {
                        const test = tests.find(t => t.id === testId);
                        return test ? test.title : testId;
                    });
                    testsCell.textContent = testNames.join(', ');
                } else {
                    testsCell.textContent = '—';
                }
                
                const scopeCell = document.createElement('div');
                scopeCell.className = 'table-cell';
                scopeCell.textContent = scopeLabel;
                
                const priorityCell = document.createElement('div');
                priorityCell.className = 'table-cell';
                priorityCell.textContent = solution.priority;
                
                const actionsCell = document.createElement('div');
                actionsCell.className = 'table-cell table-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn';
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => adminApp.editSolution(this.escapeHtml(solution.id));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => adminApp.deleteSolution(this.escapeHtml(solution.id));
                
                actionsCell.appendChild(editBtn);
                actionsCell.appendChild(deleteBtn);
                
                row.appendChild(titleCell);
                row.appendChild(testsCell);
                row.appendChild(scopeCell);
                row.appendChild(priorityCell);
                row.appendChild(actionsCell);
                table.appendChild(row);
            });
            
            container.appendChild(table);
        }).catch(error => {
            console.error('Failed to load data for solutions display:', error);
            container.innerHTML = '<div class="error-message">Failed to load solution data</div>';
        });
    }

    filterSnippets(query) {
        // Ensure we have data loaded
        if (!this.snippets || this.snippets.length === 0) {
            return;
        }
        
        const searchTerm = (query || '').toLowerCase();
        const elements = this._getFilterElements();
        const targetFilter = elements.snippetsTargetFilter?.value || '';
        
        // Early return if no filters applied
        if (!searchTerm && !targetFilter) {
            this.filteredSnippets = [...this.snippets];
            this.renderSnippets();
            return;
        }
        
        this.filteredSnippets = this.snippets.filter(snippet => {
            // Search filter
            const matchesSearch = !searchTerm ||
                snippet.title.toLowerCase().includes(searchTerm) ||
                snippet.body.toLowerCase().includes(searchTerm);
            
            // Target filter (if implemented - for now just check if snippet has targets)
            const matchesTarget = !targetFilter || 
                (snippet.targets && Object.keys(snippet.targets).length > 0);
            
            return matchesSearch && matchesTarget;
        });
        
        // Re-render snippets list without reloading from DB
        this.renderSnippets();
    }

    renderSnippets() {
        const container = document.getElementById('snippets-list');
        container.innerHTML = '';
        
        if (this.filteredSnippets.length === 0) {
            container.innerHTML = this.getEmptyState('snippets');
            return;
        }
        
        this.filteredSnippets.forEach(snippet => {
            const item = document.createElement('div');
            item.className = 'panel';
            
            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'space-between';
            contentDiv.style.alignItems = 'start';
            
            const leftDiv = document.createElement('div');
            leftDiv.style.flex = '1';
            
            const title = document.createElement('h3');
            title.textContent = snippet.title;
            leftDiv.appendChild(title);
            
            const badgesDiv = document.createElement('div');
            badgesDiv.style.margin = '8px 0';
            
            const formatBadge = document.createElement('span');
            formatBadge.className = 'badge';
            formatBadge.textContent = snippet.bodyFormat;
            badgesDiv.appendChild(formatBadge);
            
            if (snippet.variables.length > 0) {
                const varBadge = document.createElement('span');
                varBadge.className = 'badge';
                varBadge.textContent = `${snippet.variables.length} variables`;
                badgesDiv.appendChild(varBadge);
            }
            
            leftDiv.appendChild(badgesDiv);
            
            const pre = document.createElement('pre');
            pre.style.background = 'var(--bg-tertiary)';
            pre.style.padding = '12px';
            pre.style.borderRadius = '4px';
            pre.style.marginTop = '12px';
            pre.style.whiteSpace = 'pre-wrap';
            pre.textContent = snippet.body;
            leftDiv.appendChild(pre);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => adminApp.editSnippet(this.escapeHtml(snippet.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => adminApp.deleteSnippet(this.escapeHtml(snippet.id));
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            contentDiv.appendChild(leftDiv);
            contentDiv.appendChild(actionsDiv);
            item.appendChild(contentDiv);
            container.appendChild(item);
        });
    }
    
    async runDataMigration() {
        const button = document.getElementById('migrate-data-btn');
        if (!button) {
            console.error('Migration button not found');
            return;
        }
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="icon">🔄</span> Loading...';
        button.disabled = true;
        
        try {
            // Check if migration class is available
            if (typeof DataMigration === 'undefined') {
                throw new Error('Migration script not loaded. Please refresh the page.');
            }
            
            const migration = new DataMigration();
            await migration.init();
            
            // Refresh current section to show new data
            await this.loadSection(this.currentSection);
            
            this.showToast('Sample data loaded successfully!', 'success');
        } catch (error) {
            console.error('Migration failed:', error);
            this.showToast('Migration failed: ' + error.message, 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
    window.adminApp.init();
});