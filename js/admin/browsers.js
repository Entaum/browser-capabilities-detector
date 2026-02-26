/**
 * Browser Management Module
 * Handles CRUD operations for browser entities
 */

class BrowserManager {
    constructor() {
        this.browsers = [];
        this.filteredBrowsers = [];
        this.currentBrowser = null;
        this.searchTerm = '';
        this.supportedEngines = ['Blink', 'WebKit', 'Gecko', 'Trident'];
    }

    async init() {
        await this.loadBrowsers();
        this.setupEventListeners();
        this.render();
    }

    async loadBrowsers() {
        try {
            this.browsers = await adminDB.getAllBrowsers();
            this.filteredBrowsers = [...this.browsers];
            this.updateCount();
            // Trigger render if we're on the browsers section
            if (window.adminApp && window.adminApp.currentSection === 'browsers') {
                this.render();
            }
        } catch (error) {
            console.error('Failed to load browsers:', error);
            UI.showToast('Failed to load browsers', 'error');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('browsers-search');
        if (searchInput) {
            // Check if listener already attached (avoid duplicates)
            if (searchInput.dataset.listenerAttached === 'true') {
                return;
            }
            
            // Mark as attached
            searchInput.dataset.listenerAttached = 'true';
            
            // Debounce search input for better performance
            let debounceTimeout;
            const handler = (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    this.filterBrowsers();
                }, 300);
            };
            
            // Store handler for potential removal later
            searchInput._browserSearchHandler = handler;
            searchInput.addEventListener('input', handler);
        }

        // Add browser button
        const addButton = document.getElementById('add-browser-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.openBrowserModal());
        }
    }

    filterBrowsers() {
        // Ensure we have data loaded
        if (!this.browsers || this.browsers.length === 0) {
            return;
        }
        
        if (!this.searchTerm) {
            this.filteredBrowsers = [...this.browsers];
        } else {
            const searchLower = this.searchTerm;
            this.filteredBrowsers = this.browsers.filter(browser => 
                browser.name.toLowerCase().includes(searchLower) ||
                browser.vendor.toLowerCase().includes(searchLower) ||
                browser.engine.toLowerCase().includes(searchLower)
            );
        }
        
        this.render();
    }

    updateCount() {
        const countElement = document.getElementById('browsers-count');
        if (countElement) {
            countElement.textContent = this.browsers.length;
        }
    }

    render() {
        const container = document.getElementById('browsers-list');
        if (!container) return;

        if (this.filteredBrowsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <h3>No browsers found</h3>
                    <p>${this.searchTerm ? 'Try adjusting your search terms' : 'Add your first browser to get started'}</p>
                    <button class="btn btn-primary" onclick="browserManager.openBrowserModal()">
                        <span class="icon">➕</span> Add Browser
                    </button>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Name</th>
                        <th>Vendor</th>
                        <th>Engine</th>
                        <th>UA Rules</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredBrowsers.map(browser => this.renderBrowserRow(browser)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderBrowserRow(browser) {
        const iconDisplay = browser.iconUrl ? 
            `<img src="${browser.iconUrl}" alt="${browser.name}" class="browser-icon">` : 
            '<div class="browser-icon-placeholder">🌐</div>';
        
        const uaRulesCount = browser.uaMatchRules ? browser.uaMatchRules.length : 0;
        
        return `
            <tr>
                <td>${iconDisplay}</td>
                <td>
                    <strong>${this.escapeHtml(browser.name)}</strong>
                    ${browser.nameLocalized && Object.keys(browser.nameLocalized).length > 0 ? 
                        '<span class="localized-indicator" title="Has translations">🌍</span>' : ''
                    }
                </td>
                <td>${this.escapeHtml(browser.vendor)}</td>
                <td><span class="engine-badge engine-${browser.engine.toLowerCase()}">${browser.engine}</span></td>
                <td>
                    <span class="ua-rules-count">${uaRulesCount} rule${uaRulesCount !== 1 ? 's' : ''}</span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="browserManager.openBrowserModal('${browser.id}')" title="Edit">
                        <span class="icon">✏️</span>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="browserManager.duplicateBrowser('${browser.id}')" title="Duplicate">
                        <span class="icon">📋</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="browserManager.deleteBrowser('${browser.id}')" title="Delete">
                        <span class="icon">🗑️</span>
                    </button>
                </td>
            </tr>
        `;
    }

    async openBrowserModal(browserId = null) {
        this.currentBrowser = browserId ? 
            this.browsers.find(b => b.id === browserId) : 
            new Browser();

        const isEdit = !!browserId;
        const modal = UI.createModal(`${isEdit ? 'Edit' : 'Add'} Browser`, this.getBrowserModalContent(), 'large');
        
        // Setup form event listeners
        this.setupBrowserForm(modal);
        
        // Load current values if editing
        if (isEdit) {
            this.populateBrowserForm();
        }
    }

    getBrowserModalContent() {
        return `
            <form id="browser-form" class="admin-form">
                <div class="form-sections">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="browser-name">Name <span class="required">*</span></label>
                                <input type="text" id="browser-name" required placeholder="Google Chrome">
                            </div>
                            <div class="form-group">
                                <label for="browser-vendor">Vendor</label>
                                <input type="text" id="browser-vendor" placeholder="Google">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="browser-engine">Engine <span class="required">*</span></label>
                                <select id="browser-engine" required>
                                    ${this.supportedEngines.map(engine => 
                                        `<option value="${engine}">${engine}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="browser-download-url">Download URL</label>
                                <input type="url" id="browser-download-url" placeholder="https://chrome.google.com/webstore">
                            </div>
                        </div>
                    </div>

                    <!-- Icon Upload -->
                    <div class="form-section">
                        <h3>Icon</h3>
                        <div class="icon-upload-section">
                            <div class="icon-preview" id="icon-preview">
                                <div class="icon-placeholder">🌐</div>
                            </div>
                            <div class="icon-controls">
                                <input type="file" id="icon-upload" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary" onclick="document.getElementById('icon-upload').click()">
                                    <span class="icon">📁</span> Choose Icon
                                </button>
                                <button type="button" class="btn btn-secondary" id="clear-icon-btn" style="display: none;">
                                    <span class="icon">🗑️</span> Clear
                                </button>
                                <input type="url" id="icon-url" placeholder="Or enter icon URL">
                            </div>
                        </div>
                    </div>

                    <!-- User Agent Matching Rules -->
                    <div class="form-section">
                        <h3>User Agent Matching Rules</h3>
                        <div class="ua-rules-section">
                            <div class="ua-rules-header">
                                <p class="form-help">Define patterns to identify this browser from user agent strings.</p>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-ua-rule-btn">
                                    <span class="icon">➕</span> Add Rule
                                </button>
                            </div>
                            <div id="ua-rules-list" class="ua-rules-list"></div>
                        </div>
                    </div>

                    <!-- Localization -->
                    <div class="form-section">
                        <h3>Localization</h3>
                        <div class="localization-section">
                            <div class="form-group">
                                <label>Localized Names</label>
                                <div id="localized-names" class="localized-fields"></div>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-name-locale-btn">
                                    <span class="icon">🌍</span> Add Locale
                                </button>
                            </div>
                            <div class="form-group">
                                <label>Localized Vendor Names</label>
                                <div id="localized-vendors" class="localized-fields"></div>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-vendor-locale-btn">
                                    <span class="icon">🌍</span> Add Locale
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="form-section">
                        <h3>Notes</h3>
                        <div class="form-group">
                            <label for="browser-notes">Notes</label>
                            <textarea id="browser-notes" rows="3" placeholder="Additional notes about this browser..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Localized Notes</label>
                            <div id="localized-notes" class="localized-fields"></div>
                            <button type="button" class="btn btn-secondary btn-sm" id="add-notes-locale-btn">
                                <span class="icon">🌍</span> Add Locale
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="icon">💾</span> Save Browser
                    </button>
                </div>
            </form>
        `;
    }

    setupBrowserForm(modal) {
        const form = modal.querySelector('#browser-form');
        if (!form) return;

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBrowser();
        });

        // Icon upload
        const iconUpload = modal.querySelector('#icon-upload');
        const iconUrl = modal.querySelector('#icon-url');
        const clearIconBtn = modal.querySelector('#clear-icon-btn');

        iconUpload?.addEventListener('change', (e) => this.handleIconUpload(e));
        iconUrl?.addEventListener('input', (e) => this.handleIconUrl(e));
        clearIconBtn?.addEventListener('click', () => this.clearIcon());

        // UA Rules
        const addUaRuleBtn = modal.querySelector('#add-ua-rule-btn');
        addUaRuleBtn?.addEventListener('click', () => this.addUaRule());

        // Localization buttons
        modal.querySelector('#add-name-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('names', 'localized-names'));
        modal.querySelector('#add-vendor-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('vendors', 'localized-vendors'));
        modal.querySelector('#add-notes-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('notes', 'localized-notes'));

        // Initialize UA rules and localization
        this.renderUaRules();
        this.renderLocalizationFields();
    }

    handleIconUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            UI.showToast('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            UI.showToast('Image must be smaller than 1MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentBrowser.iconUrl = e.target.result;
            this.updateIconPreview();
            document.getElementById('icon-url').value = '';
            document.getElementById('clear-icon-btn').style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    }

    handleIconUrl(event) {
        const url = event.target.value.trim();
        if (url && this.isValidUrl(url)) {
            this.currentBrowser.iconUrl = url;
            this.updateIconPreview();
            document.getElementById('icon-upload').value = '';
            document.getElementById('clear-icon-btn').style.display = 'inline-flex';
        } else if (!url) {
            this.clearIcon();
        }
    }

    clearIcon() {
        this.currentBrowser.iconUrl = '';
        document.getElementById('icon-upload').value = '';
        document.getElementById('icon-url').value = '';
        document.getElementById('clear-icon-btn').style.display = 'none';
        this.updateIconPreview();
    }

    updateIconPreview() {
        const preview = document.getElementById('icon-preview');
        if (!preview) return;

        if (this.currentBrowser.iconUrl) {
            preview.innerHTML = `<img src="${this.currentBrowser.iconUrl}" alt="Browser icon" class="icon-preview-img">`;
        } else {
            preview.innerHTML = '<div class="icon-placeholder">🌐</div>';
        }
    }

    addUaRule(pattern = '', description = '') {
        const rulesList = document.getElementById('ua-rules-list');
        if (!rulesList) return;

        const ruleIndex = rulesList.children.length;
        const ruleHTML = `
            <div class="ua-rule-item" data-index="${ruleIndex}">
                <div class="ua-rule-inputs">
                    <input type="text" class="ua-pattern" placeholder="Pattern (e.g., Chrome/)" value="${this.escapeHtml(pattern)}">
                    <input type="text" class="ua-description" placeholder="Description" value="${this.escapeHtml(description)}">
                    <button type="button" class="btn btn-sm btn-danger remove-ua-rule">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
        
        rulesList.insertAdjacentHTML('beforeend', ruleHTML);
        
        // Add event listener for remove button
        const removeBtn = rulesList.querySelector(`[data-index="${ruleIndex}"] .remove-ua-rule`);
        removeBtn?.addEventListener('click', (e) => {
            e.target.closest('.ua-rule-item').remove();
        });
    }

    renderUaRules() {
        const rulesList = document.getElementById('ua-rules-list');
        if (!rulesList) return;

        rulesList.innerHTML = '';
        
        if (this.currentBrowser.uaMatchRules && this.currentBrowser.uaMatchRules.length > 0) {
            this.currentBrowser.uaMatchRules.forEach(rule => {
                this.addUaRule(rule.pattern || '', rule.description || '');
            });
        } else {
            // Add one empty rule by default
            this.addUaRule();
        }
    }

    addLocaleField(type, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const fieldIndex = container.children.length;
        const fieldHTML = `
            <div class="locale-field" data-index="${fieldIndex}">
                <select class="locale-select">
                    <option value="">Select locale...</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="es-MX">Spanish (Mexico)</option>
                    <option value="fr-FR">French (France)</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese (Brazil)</option>
                    <option value="ru-RU">Russian</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                    <option value="zh-TW">Chinese (Traditional)</option>
                </select>
                <input type="text" class="locale-value" placeholder="Translated text">
                <button type="button" class="btn btn-sm btn-danger remove-locale-field">
                    <span class="icon">🗑️</span>
                </button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', fieldHTML);

        // Add event listener for remove button
        const removeBtn = container.querySelector(`[data-index="${fieldIndex}"] .remove-locale-field`);
        removeBtn?.addEventListener('click', (e) => {
            e.target.closest('.locale-field').remove();
        });
    }

    renderLocalizationFields() {
        // Render localized names
        this.renderLocaleFields('nameLocalized', 'localized-names');
        // Render localized vendors  
        this.renderLocaleFields('vendorLocalized', 'localized-vendors');
        // Render localized notes
        this.renderLocaleFields('notesLocalized', 'localized-notes');
    }

    renderLocaleFields(sourceField, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const localizedData = this.currentBrowser[sourceField] || {};
        Object.entries(localizedData).forEach(([locale, value]) => {
            this.addLocaleField();
            const lastField = container.lastElementChild;
            lastField.querySelector('.locale-select').value = locale;
            lastField.querySelector('.locale-value').value = value;
        });
    }

    populateBrowserForm() {
        if (!this.currentBrowser) return;

        // Basic fields
        this.setFieldValue('browser-name', this.currentBrowser.name);
        this.setFieldValue('browser-vendor', this.currentBrowser.vendor);
        this.setFieldValue('browser-engine', this.currentBrowser.engine);
        this.setFieldValue('browser-download-url', this.currentBrowser.downloadUrl);
        this.setFieldValue('browser-notes', this.currentBrowser.notes);
        this.setFieldValue('icon-url', this.currentBrowser.iconUrl);

        // Update icon preview
        this.updateIconPreview();
        if (this.currentBrowser.iconUrl) {
            document.getElementById('clear-icon-btn').style.display = 'inline-flex';
        }
    }

    async saveBrowser() {
        try {
            // Collect form data
            this.collectFormData();

            // Validate
            const errors = this.currentBrowser.validate();
            if (errors.length > 0) {
                UI.showToast(`Validation failed: ${errors.join(', ')}`, 'error');
                return;
            }

            // Save to database
            const savedBrowser = await adminDB.saveBrowser(this.currentBrowser.toJSON());
            
            // Update local data
            const existingIndex = this.browsers.findIndex(b => b.id === savedBrowser.id);
            if (existingIndex >= 0) {
                this.browsers[existingIndex] = savedBrowser;
            } else {
                this.browsers.push(savedBrowser);
            }

            // Refresh view
            this.filterBrowsers();
            this.updateCount();
            
            UI.closeModal();
            UI.showToast('Browser saved successfully', 'success');
            
        } catch (error) {
            console.error('Failed to save browser:', error);
            UI.showToast('Failed to save browser', 'error');
        }
    }

    collectFormData() {
        // Basic fields
        this.currentBrowser.name = this.getFieldValue('browser-name');
        this.currentBrowser.vendor = this.getFieldValue('browser-vendor');
        this.currentBrowser.engine = this.getFieldValue('browser-engine');
        this.currentBrowser.downloadUrl = this.getFieldValue('browser-download-url');
        this.currentBrowser.notes = this.getFieldValue('browser-notes');

        // UA matching rules
        this.currentBrowser.uaMatchRules = this.collectUaRules();

        // Localized fields
        this.currentBrowser.nameLocalized = this.collectLocaleFields('localized-names');
        this.currentBrowser.vendorLocalized = this.collectLocaleFields('localized-vendors');
        this.currentBrowser.notesLocalized = this.collectLocaleFields('localized-notes');
    }

    collectUaRules() {
        const rulesList = document.getElementById('ua-rules-list');
        if (!rulesList) return [];

        const rules = [];
        rulesList.querySelectorAll('.ua-rule-item').forEach(item => {
            const pattern = item.querySelector('.ua-pattern').value.trim();
            const description = item.querySelector('.ua-description').value.trim();
            
            if (pattern) {
                rules.push({ pattern, description });
            }
        });

        return rules;
    }

    collectLocaleFields(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return {};

        const localeData = {};
        container.querySelectorAll('.locale-field').forEach(field => {
            const locale = field.querySelector('.locale-select').value;
            const value = field.querySelector('.locale-value').value.trim();
            
            if (locale && value) {
                localeData[locale] = value;
            }
        });

        return localeData;
    }

    async duplicateBrowser(browserId) {
        const browser = this.browsers.find(b => b.id === browserId);
        if (!browser) return;

        try {
            const duplicate = new Browser({
                ...browser,
                id: null,
                name: `${browser.name} (Copy)`,
                lastUpdated: new Date().toISOString()
            });

            const savedBrowser = await adminDB.saveBrowser(duplicate.toJSON());
            this.browsers.push(savedBrowser);
            this.filterBrowsers();
            this.updateCount();
            
            UI.showToast('Browser duplicated successfully', 'success');
        } catch (error) {
            console.error('Failed to duplicate browser:', error);
            UI.showToast('Failed to duplicate browser', 'error');
        }
    }

    async deleteBrowser(browserId) {
        const browser = this.browsers.find(b => b.id === browserId);
        if (!browser) return;

        const confirmed = await UI.showConfirm(
            'Delete Browser',
            `Are you sure you want to delete "${browser.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await adminDB.deleteBrowser(browserId);
            this.browsers = this.browsers.filter(b => b.id !== browserId);
            this.filterBrowsers();
            this.updateCount();
            
            UI.showToast('Browser deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete browser:', error);
            UI.showToast('Failed to delete browser', 'error');
        }
    }

    // Utility methods
    getFieldValue(id) {
        const field = document.getElementById(id);
        return field ? field.value.trim() : '';
    }

    setFieldValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Create global instance
window.browserManager = new BrowserManager();