/**
 * Test Management Module
 * Handles CRUD operations for test entities
 */

class TestManager {
    constructor() {
        this.tests = [];
        this.filteredTests = [];
        this.currentTest = null;
        this.searchTerm = '';
        this.categoryFilter = '';
        this.severityLevels = ['info', 'warn', 'fail'];
        this.commonCategories = [
            'general', 'apis', 'css', 'javascript', 'html5', 'webgl', 'webgpu', 
            'performance', 'security', 'accessibility', 'mobile', 'gaming', 
            'communication', 'storage', 'media', 'webassembly'
        ];
    }

    async init() {
        await this.loadTests();
        this.setupEventListeners();
        this.render();
    }

    async loadTests() {
        try {
            this.tests = await adminDB.getAllTests();
            this.filteredTests = [...this.tests];
            this.updateCount();
            this.updateCategoryFilter();
            // Trigger render if we're on the tests section
            if (window.adminApp && window.adminApp.currentSection === 'tests') {
                this.render();
            }
        } catch (error) {
            console.error('Failed to load tests:', error);
            UI.showToast('Failed to load tests', 'error');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('tests-search');
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
                    this.filterTests();
                }, 300);
            };
            
            // Store handler for potential removal later
            searchInput._testSearchHandler = handler;
            searchInput.addEventListener('input', handler);
        }

        // Category filter
        const categoryFilter = document.getElementById('tests-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.categoryFilter = e.target.value;
                this.filterTests();
            });
        }

        // Add test button
        const addButton = document.getElementById('add-test-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.openTestModal());
        }
    }

    filterTests() {
        // Ensure we have data loaded
        if (!this.tests || this.tests.length === 0) {
            return;
        }
        
        const searchLower = this.searchTerm;
        const categoryFilter = this.categoryFilter;
        
        this.filteredTests = this.tests.filter(test => {
            const matchesSearch = !searchLower || 
                test.title.toLowerCase().includes(searchLower) ||
                test.description.toLowerCase().includes(searchLower) ||
                test.detectorKey.toLowerCase().includes(searchLower) ||
                test.category.toLowerCase().includes(searchLower);

            const matchesCategory = !categoryFilter || test.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        this.render();
    }

    updateCount() {
        const countElement = document.getElementById('tests-count');
        if (countElement) {
            countElement.textContent = this.tests.length;
        }
    }

    updateCategoryFilter() {
        const filterElement = document.getElementById('tests-category-filter');
        if (!filterElement) return;

        // Get unique categories from tests
        const categories = [...new Set(this.tests.map(t => t.category))];
        
        // Preserve current selection
        const currentValue = filterElement.value;
        
        filterElement.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            filterElement.innerHTML += `<option value="${category}">${this.formatCategoryName(category)}</option>`;
        });

        // Restore selection if it still exists
        if (categories.includes(currentValue)) {
            filterElement.value = currentValue;
        }
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
    }

    render() {
        const container = document.getElementById('tests-grid');
        if (!container) return;

        if (this.filteredTests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧪</div>
                    <h3>No tests found</h3>
                    <p>${this.searchTerm || this.categoryFilter ? 'Try adjusting your filters' : 'Add your first test to get started'}</p>
                    <button class="btn btn-primary" onclick="testManager.openTestModal()">
                        <span class="icon">➕</span> Add Test
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredTests.map(test => this.renderTestCard(test)).join('');
    }

    renderTestCard(test) {
        const severityClass = `severity-${test.severity}`;
        const linksCount = test.links ? test.links.length : 0;
        const hasLocalizations = test.titleLocalized && Object.keys(test.titleLocalized).length > 0;

        return `
            <div class="test-card ${severityClass}">
                <div class="test-card-header">
                    <div class="test-title-section">
                        <h3 class="test-title">${this.escapeHtml(test.title)}</h3>
                        ${hasLocalizations ? '<span class="localized-indicator" title="Has translations">🌍</span>' : ''}
                    </div>
                    <div class="test-badges">
                        <span class="severity-badge severity-${test.severity}">${test.severity.toUpperCase()}</span>
                        <span class="category-badge">${this.formatCategoryName(test.category)}</span>
                    </div>
                </div>
                
                <div class="test-description">
                    ${this.escapeHtml(test.description)}
                </div>
                
                <div class="test-meta">
                    <div class="meta-item">
                        <span class="meta-label">Detector Key:</span>
                        <code class="detector-key">${this.escapeHtml(test.detectorKey)}</code>
                    </div>
                    ${linksCount > 0 ? `
                        <div class="meta-item">
                            <span class="meta-label">Links:</span>
                            <span class="links-count">${linksCount} reference${linksCount !== 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-label">Updated:</span>
                        <span class="last-updated">${this.formatDate(test.lastUpdated)}</span>
                    </div>
                </div>
                
                <div class="test-actions">
                    <button class="btn btn-sm btn-secondary" onclick="testManager.openTestModal('${test.id}')" title="Edit">
                        <span class="icon">✏️</span> Edit
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="testManager.duplicateTest('${test.id}')" title="Duplicate">
                        <span class="icon">📋</span> Duplicate
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="testManager.deleteTest('${test.id}')" title="Delete">
                        <span class="icon">🗑️</span> Delete
                    </button>
                </div>
            </div>
        `;
    }

    async openTestModal(testId = null) {
        this.currentTest = testId ? 
            this.tests.find(t => t.id === testId) : 
            new Test();

        const isEdit = !!testId;
        const modal = UI.createModal(`${isEdit ? 'Edit' : 'Add'} Test`, this.getTestModalContent(), 'large');
        
        // Setup form event listeners
        this.setupTestForm(modal);
        
        // Load current values if editing
        if (isEdit) {
            this.populateTestForm();
        }
    }

    getTestModalContent() {
        return `
            <form id="test-form" class="admin-form">
                <div class="form-sections">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="test-title">Title <span class="required">*</span></label>
                                <input type="text" id="test-title" required placeholder="WebGL Support Test">
                            </div>
                            <div class="form-group">
                                <label for="test-detector-key">Detector Key <span class="required">*</span></label>
                                <input type="text" id="test-detector-key" required placeholder="webgl.support" pattern="[a-zA-Z0-9._-]+">
                                <small class="form-help">Unique identifier for the test (alphanumeric, dots, dashes, underscores only)</small>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="test-category">Category <span class="required">*</span></label>
                                <select id="test-category" required>
                                    <option value="">Select category...</option>
                                    ${this.commonCategories.map(cat => 
                                        `<option value="${cat}">${this.formatCategoryName(cat)}</option>`
                                    ).join('')}
                                </select>
                                <input type="text" id="test-custom-category" placeholder="Or enter custom category" style="margin-top: 8px;">
                            </div>
                            <div class="form-group">
                                <label for="test-severity">Severity <span class="required">*</span></label>
                                <select id="test-severity" required>
                                    ${this.severityLevels.map(level => 
                                        `<option value="${level}">${level.toUpperCase()}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="test-description">Description <span class="required">*</span></label>
                            <textarea id="test-description" rows="3" required placeholder="Describe what this test checks for..."></textarea>
                        </div>
                    </div>

                    <!-- Reference Links -->
                    <div class="form-section">
                        <h3>Reference Links</h3>
                        <div class="links-section">
                            <div class="links-header">
                                <p class="form-help">Add reference links to documentation, specifications, or related resources.</p>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-link-btn">
                                    <span class="icon">➕</span> Add Link
                                </button>
                            </div>
                            <div id="links-list" class="links-list"></div>
                        </div>
                    </div>

                    <!-- Localization -->
                    <div class="form-section">
                        <h3>Localization</h3>
                        <div class="localization-section">
                            <div class="form-group">
                                <label>Localized Titles</label>
                                <div id="localized-titles" class="localized-fields"></div>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-title-locale-btn">
                                    <span class="icon">🌍</span> Add Locale
                                </button>
                            </div>
                            <div class="form-group">
                                <label>Localized Categories</label>
                                <div id="localized-categories" class="localized-fields"></div>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-category-locale-btn">
                                    <span class="icon">🌍</span> Add Locale
                                </button>
                            </div>
                            <div class="form-group">
                                <label>Localized Descriptions</label>
                                <div id="localized-descriptions" class="localized-fields"></div>
                                <button type="button" class="btn btn-secondary btn-sm" id="add-description-locale-btn">
                                    <span class="icon">🌍</span> Add Locale
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="icon">💾</span> Save Test
                    </button>
                </div>
            </form>
        `;
    }

    setupTestForm(modal) {
        const form = modal.querySelector('#test-form');
        if (!form) return;

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTest();
        });

        // Custom category handling
        const categorySelect = modal.querySelector('#test-category');
        const customCategoryInput = modal.querySelector('#test-custom-category');
        
        categorySelect?.addEventListener('change', (e) => {
            if (e.target.value) {
                customCategoryInput.value = '';
                customCategoryInput.style.display = 'none';
            } else {
                customCategoryInput.style.display = 'block';
            }
        });

        customCategoryInput?.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                categorySelect.value = '';
            }
        });

        // Auto-generate detector key from title
        const titleInput = modal.querySelector('#test-title');
        const detectorKeyInput = modal.querySelector('#test-detector-key');
        
        titleInput?.addEventListener('input', (e) => {
            if (!detectorKeyInput.value || detectorKeyInput.dataset.autoGenerated === 'true') {
                const key = this.generateDetectorKey(e.target.value);
                detectorKeyInput.value = key;
                detectorKeyInput.dataset.autoGenerated = 'true';
            }
        });

        detectorKeyInput?.addEventListener('input', () => {
            delete detectorKeyInput.dataset.autoGenerated;
        });

        // Reference links
        const addLinkBtn = modal.querySelector('#add-link-btn');
        addLinkBtn?.addEventListener('click', () => this.addLink());

        // Localization buttons
        modal.querySelector('#add-title-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('titles', 'localized-titles'));
        modal.querySelector('#add-category-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('categories', 'localized-categories'));
        modal.querySelector('#add-description-locale-btn')?.addEventListener('click', () => 
            this.addLocaleField('descriptions', 'localized-descriptions'));

        // Initialize sections
        this.renderLinks();
        this.renderLocalizationFields();
    }

    generateDetectorKey(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '.')
            .replace(/^\.+|\.+$/g, '');
    }

    addLink(label = '', url = '') {
        const linksList = document.getElementById('links-list');
        if (!linksList) return;

        const linkIndex = linksList.children.length;
        const linkHTML = `
            <div class="link-item" data-index="${linkIndex}">
                <div class="link-inputs">
                    <input type="text" class="link-label" placeholder="Label" value="${this.escapeHtml(label)}">
                    <input type="url" class="link-url" placeholder="URL" value="${this.escapeHtml(url)}">
                    <button type="button" class="btn btn-sm btn-danger remove-link">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
        
        linksList.insertAdjacentHTML('beforeend', linkHTML);
        
        // Add event listener for remove button
        const removeBtn = linksList.querySelector(`[data-index="${linkIndex}"] .remove-link`);
        removeBtn?.addEventListener('click', (e) => {
            e.target.closest('.link-item').remove();
        });
    }

    renderLinks() {
        const linksList = document.getElementById('links-list');
        if (!linksList) return;

        linksList.innerHTML = '';
        
        if (this.currentTest.links && this.currentTest.links.length > 0) {
            this.currentTest.links.forEach(link => {
                this.addLink(link.label || '', link.url || '');
            });
        } else {
            // Add one empty link by default
            this.addLink();
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
        // Render localized titles
        this.renderLocaleFields('titleLocalized', 'localized-titles');
        // Render localized categories  
        this.renderLocaleFields('categoryLocalized', 'localized-categories');
        // Render localized descriptions
        this.renderLocaleFields('descriptionLocalized', 'localized-descriptions');
    }

    renderLocaleFields(sourceField, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const localizedData = this.currentTest[sourceField] || {};
        Object.entries(localizedData).forEach(([locale, value]) => {
            this.addLocaleField();
            const lastField = container.lastElementChild;
            lastField.querySelector('.locale-select').value = locale;
            lastField.querySelector('.locale-value').value = value;
        });
    }

    populateTestForm() {
        if (!this.currentTest) return;

        // Basic fields
        this.setFieldValue('test-title', this.currentTest.title);
        this.setFieldValue('test-detector-key', this.currentTest.detectorKey);
        this.setFieldValue('test-category', this.currentTest.category);
        this.setFieldValue('test-severity', this.currentTest.severity);
        this.setFieldValue('test-description', this.currentTest.description);

        // Handle custom category
        const categorySelect = document.getElementById('test-category');
        const customCategoryInput = document.getElementById('test-custom-category');
        
        if (categorySelect && !this.commonCategories.includes(this.currentTest.category)) {
            categorySelect.value = '';
            customCategoryInput.value = this.currentTest.category;
            customCategoryInput.style.display = 'block';
        }
    }

    async saveTest() {
        try {
            // Collect form data
            this.collectFormData();

            // Validate
            const errors = this.currentTest.validate();
            if (errors.length > 0) {
                UI.showToast(`Validation failed: ${errors.join(', ')}`, 'error');
                return;
            }

            // Check for duplicate detector keys
            const existing = this.tests.find(t => 
                t.detectorKey === this.currentTest.detectorKey && t.id !== this.currentTest.id
            );
            if (existing) {
                UI.showToast('Detector key already exists', 'error');
                return;
            }

            // Save to database
            const savedTest = await adminDB.saveTest(this.currentTest.toJSON());
            
            // Update local data
            const existingIndex = this.tests.findIndex(t => t.id === savedTest.id);
            if (existingIndex >= 0) {
                this.tests[existingIndex] = savedTest;
            } else {
                this.tests.push(savedTest);
            }

            // Refresh view
            this.filterTests();
            this.updateCount();
            this.updateCategoryFilter();
            
            UI.closeModal();
            UI.showToast('Test saved successfully', 'success');
            
        } catch (error) {
            console.error('Failed to save test:', error);
            UI.showToast('Failed to save test', 'error');
        }
    }

    collectFormData() {
        // Basic fields
        this.currentTest.title = this.getFieldValue('test-title');
        this.currentTest.detectorKey = this.getFieldValue('test-detector-key');
        this.currentTest.description = this.getFieldValue('test-description');
        this.currentTest.severity = this.getFieldValue('test-severity');
        
        // Category (custom or selected)
        const selectedCategory = this.getFieldValue('test-category');
        const customCategory = this.getFieldValue('test-custom-category');
        this.currentTest.category = selectedCategory || customCategory || 'general';

        // Reference links
        this.currentTest.links = this.collectLinks();

        // Localized fields
        this.currentTest.titleLocalized = this.collectLocaleFields('localized-titles');
        this.currentTest.categoryLocalized = this.collectLocaleFields('localized-categories');
        this.currentTest.descriptionLocalized = this.collectLocaleFields('localized-descriptions');
    }

    collectLinks() {
        const linksList = document.getElementById('links-list');
        if (!linksList) return [];

        const links = [];
        linksList.querySelectorAll('.link-item').forEach(item => {
            const label = item.querySelector('.link-label').value.trim();
            const url = item.querySelector('.link-url').value.trim();
            
            if (label && url) {
                links.push({ label, url });
            }
        });

        return links;
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

    async duplicateTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;

        try {
            const duplicate = new Test({
                ...test,
                id: null,
                title: `${test.title} (Copy)`,
                detectorKey: `${test.detectorKey}_copy_${Date.now()}`,
                lastUpdated: new Date().toISOString()
            });

            const savedTest = await adminDB.saveTest(duplicate.toJSON());
            this.tests.push(savedTest);
            this.filterTests();
            this.updateCount();
            this.updateCategoryFilter();
            
            UI.showToast('Test duplicated successfully', 'success');
        } catch (error) {
            console.error('Failed to duplicate test:', error);
            UI.showToast('Failed to duplicate test', 'error');
        }
    }

    async deleteTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;

        const confirmed = await UI.showConfirm(
            'Delete Test',
            `Are you sure you want to delete "${test.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await adminDB.deleteTest(testId);
            this.tests = this.tests.filter(t => t.id !== testId);
            this.filterTests();
            this.updateCount();
            this.updateCategoryFilter();
            
            UI.showToast('Test deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete test:', error);
            UI.showToast('Failed to delete test', 'error');
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Create global instance
window.testManager = new TestManager();