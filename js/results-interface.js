/**
 * Results Dashboard Interface
 * Displays detailed compatibility test results with analysis and recommendations
 */

class ResultsInterface {
    constructor() {
        this.results = [];
        this.currentFilter = 'all';
        this.sortBy = 'category';
        
        this.initializeInterface();
        this.setupEventListeners();
    }

    /**
     * Initialize the results interface elements
     */
    initializeInterface() {
        // Create results interface container
        this.container = document.createElement('div');
        this.container.id = 'results-interface';
        this.container.className = 'results-interface hidden';
        
        this.container.innerHTML = `
            <div class="results-header">
                <h2>📊 Compatibility Test Results</h2>
                <div class="results-actions">
                    <button id="share-results" class="btn-secondary">📤 Share</button>
                    <button id="print-results" class="btn-secondary">🖨️ Print</button>
                    <button id="back-to-testing" class="btn-outline">← Back to Testing</button>
                </div>
            </div>

            <div class="results-summary">
                <div class="summary-card overall-score">
                    <h3>Overall Score</h3>
                    <div class="score-display">
                        <div class="score-circle" id="overall-score-circle">
                            <span id="overall-score-text">0%</span>
                        </div>
                        <div class="score-details" id="score-breakdown"></div>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>✅ Fully Supported</h4>
                        <div class="metric-value" id="supported-count">0</div>
                    </div>
                    <div class="summary-card">
                        <h4>⚠️ Partially Supported</h4>
                        <div class="metric-value" id="partial-count">0</div>
                    </div>
                    <div class="summary-card">
                        <h4>❌ Not Supported</h4>
                        <div class="metric-value" id="unsupported-count">0</div>
                    </div>
                    <div class="summary-card">
                        <h4>🚨 Errors</h4>
                        <div class="metric-value" id="error-count">0</div>
                    </div>
                </div>
            </div>

            <div class="results-controls">
                <div class="filter-controls">
                    <label for="filter-select">Filter by Status:</label>
                    <select id="filter-select">
                        <option value="all">All Tests</option>
                        <option value="supported">Fully Supported</option>
                        <option value="partial">Partially Supported</option>
                        <option value="unsupported">Not Supported</option>
                        <option value="error">Errors</option>
                    </select>
                </div>
                
                <div class="sort-controls">
                    <label for="sort-select">Sort by:</label>
                    <select id="sort-select">
                        <option value="category">Category</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                        <option value="score">Score</option>
                    </select>
                </div>
                
                <div class="view-controls">
                    <button id="toggle-view" class="btn-outline">📋 List View</button>
                </div>
            </div>

            <div class="category-analysis">
                <h3>📈 Category Analysis</h3>
                <div id="category-charts"></div>
            </div>

            <div class="results-content">
                <div id="results-list" class="results-list"></div>
            </div>

            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <div id="recommendations-content"></div>
            </div>

            <div class="system-info">
                <h3>🖥️ System Information</h3>
                <div id="system-info-content"></div>
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * Setup event listeners for results interface
     */
    setupEventListeners() {
        document.getElementById('share-results').addEventListener('click', () => this.shareResults());
        document.getElementById('print-results').addEventListener('click', () => this.printResults());
        document.getElementById('back-to-testing').addEventListener('click', () => this.backToTesting());
        document.getElementById('filter-select').addEventListener('change', (e) => this.filterResults(e.target.value));
        document.getElementById('sort-select').addEventListener('change', (e) => this.sortResults(e.target.value));
        document.getElementById('toggle-view').addEventListener('click', () => this.toggleView());
    }

    /**
     * Show results interface with test data
     */
    show(testResults) {
        this.results = testResults || [];
        
        // Hide other interfaces
        const testingInterface = document.getElementById('testing-interface');
        const landingPage = document.getElementById('landing-page');
        if (testingInterface) testingInterface.classList.add('hidden');
        if (landingPage) landingPage.classList.add('hidden');
        
        this.container.classList.remove('hidden');
        
        this.renderResults();
        this.renderSummary();
        this.renderCategoryAnalysis();
        this.renderRecommendations();
        this.renderSystemInfo();
    }

    /**
     * Hide results interface
     */
    hide() {
        this.container.classList.add('hidden');
    }

    /**
     * Render the main results summary
     */
    renderSummary() {
        const summary = this.calculateSummary();
        
        // Update overall score
        document.getElementById('overall-score-text').textContent = `${summary.overallScore}%`;
        this.updateScoreCircle(summary.overallScore);
        
        // Update count cards
        document.getElementById('supported-count').textContent = summary.supported;
        document.getElementById('partial-count').textContent = summary.partial;
        document.getElementById('unsupported-count').textContent = summary.unsupported;
        document.getElementById('error-count').textContent = summary.error;
        
        // Update score breakdown
        const breakdown = document.getElementById('score-breakdown');
        breakdown.innerHTML = `
            <div class="breakdown-item">
                <span class="breakdown-label">Supported:</span>
                <span class="breakdown-value">${summary.supported}/${summary.total}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Partial:</span>
                <span class="breakdown-value">${summary.partial}/${summary.total}</span>
            </div>
        `;
    }

    /**
     * Update the score circle visualization
     */
    updateScoreCircle(score) {
        const circle = document.getElementById('overall-score-circle');
        circle.className = 'score-circle';
        
        if (score >= 80) {
            circle.classList.add('excellent');
        } else if (score >= 60) {
            circle.classList.add('good');
        } else if (score >= 40) {
            circle.classList.add('fair');
        } else {
            circle.classList.add('poor');
        }
        
        // Animate the circular progress
        circle.style.setProperty('--progress', `${(score / 100) * 360}deg`);
    }

    /**
     * Render category analysis charts
     */
    renderCategoryAnalysis() {
        const categories = this.groupByCategory();
        const chartsContainer = document.getElementById('category-charts');
        
        chartsContainer.innerHTML = '';
        
        Object.entries(categories).forEach(([category, results]) => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            
            const summary = this.calculateCategorySummary(results);
            const score = Math.round(((summary.supported + summary.partial * 0.5) / summary.total) * 100);
            
            categoryCard.innerHTML = `
                <div class="category-header">
                    <h4>${this.getCategoryIcon(category)} ${this.formatCategoryName(category)}</h4>
                    <span class="category-score ${this.getScoreClass(score)}">${score}%</span>
                </div>
                <div class="category-bars">
                    <div class="status-bar">
                        <div class="bar-segment supported" style="width: ${(summary.supported/summary.total)*100}%"></div>
                        <div class="bar-segment partial" style="width: ${(summary.partial/summary.total)*100}%"></div>
                        <div class="bar-segment unsupported" style="width: ${(summary.unsupported/summary.total)*100}%"></div>
                        <div class="bar-segment error" style="width: ${(summary.error/summary.total)*100}%"></div>
                    </div>
                </div>
                <div class="category-details">
                    <span>✅ ${summary.supported} ⚠️ ${summary.partial} ❌ ${summary.unsupported} 🚨 ${summary.error}</span>
                </div>
            `;
            
            chartsContainer.appendChild(categoryCard);
        });
    }

    /**
     * Render the detailed results list
     */
    renderResults() {
        const resultsContainer = document.getElementById('results-list');
        let filteredResults = this.filterResultsByStatus(this.results, this.currentFilter);
        filteredResults = this.sortResultsBy(filteredResults, this.sortBy);
        
        resultsContainer.innerHTML = '';
        
        if (filteredResults.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No results match the current filter.</div>';
            return;
        }
        
        filteredResults.forEach(result => {
            const resultCard = document.createElement('div');
            resultCard.className = `result-card ${result.status}`;
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <div class="result-title">
                        <span class="result-name">${result.name}</span>
                        <span class="result-category">${this.formatCategoryName(result.category)}</span>
                    </div>
                    <div class="result-status ${result.status}">
                        ${this.getStatusIcon(result.status)} ${this.formatStatus(result.status)}
                        ${result.score ? `<span class="result-score">${result.score}%</span>` : ''}
                    </div>
                </div>
                <div class="result-details">
                    <div class="result-description">${result.details}</div>
                    ${result.duration ? `<div class="result-duration">⏱️ ${result.duration}ms</div>` : ''}
                </div>
                ${this.renderResultData(result)}
            `;
            
            resultsContainer.appendChild(resultCard);
        });
    }

    /**
     * Render additional result data based on test type
     */
    renderResultData(result) {
        let additionalData = '';
        
        // WebGL specific data
        if (result.capabilities && result.name.includes('WebGL')) {
            additionalData += `
                <div class="result-technical">
                    <strong>Technical Details:</strong>
                    <div class="tech-details">
                        <div>Renderer: ${result.capabilities.renderer || 'Unknown'}</div>
                        <div>Version: ${result.capabilities.version || 'Unknown'}</div>
                        ${result.capabilities.maxTextureSize ? `<div>Max Texture Size: ${result.capabilities.maxTextureSize}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        // WebGPU specific data
        if (result.adapterInfo && result.name.includes('WebGPU')) {
            additionalData += `
                <div class="result-technical">
                    <strong>Adapter Information:</strong>
                    <div class="tech-details">
                        <div>Vendor: ${result.adapterInfo.vendor}</div>
                        <div>Device: ${result.adapterInfo.device}</div>
                        <div>Architecture: ${result.adapterInfo.architecture}</div>
                    </div>
                </div>
            `;
        }
        
        // Performance data
        if (result.performance) {
            additionalData += `
                <div class="result-technical">
                    <strong>Performance:</strong>
                    <div class="tech-details">
                        ${result.performance.drawCallsPerSecond ? `<div>Draw Calls/sec: ${result.performance.drawCallsPerSecond}</div>` : ''}
                        ${result.performance.rating ? `<div>Rating: ${result.performance.rating}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        // Extensions/Features data
        if (result.extensions) {
            const supportedExtensions = Object.keys(result.extensions).filter(ext => result.extensions[ext].supported);
            if (supportedExtensions.length > 0) {
                additionalData += `
                    <div class="result-technical">
                        <strong>Supported Extensions:</strong>
                        <div class="extensions-list">
                            ${supportedExtensions.slice(0, 5).map(ext => `<span class="extension-tag">${ext}</span>`).join('')}
                            ${supportedExtensions.length > 5 ? `<span class="extension-more">+${supportedExtensions.length - 5} more</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }
        
        return additionalData;
    }

    /**
     * Render personalized recommendations
     */
    renderRecommendations() {
        const recommendations = this.generateRecommendations();
        const container = document.getElementById('recommendations-content');
        
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.type}">
                <div class="recommendation-header">
                    <span class="recommendation-icon">${rec.icon}</span>
                    <h4>${rec.title}</h4>
                    <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
                </div>
                <div class="recommendation-content">
                    <p>${rec.description}</p>
                    ${rec.actions ? `
                        <div class="recommendation-actions">
                            ${rec.actions.map(action => `<button class="btn-small">${action}</button>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render system information
     */
    renderSystemInfo() {
        const container = document.getElementById('system-info-content');
        
        container.innerHTML = `
            <div class="system-info-grid">
                <div class="info-item">
                    <label>Browser:</label>
                    <span>${this.getBrowserInfo()}</span>
                </div>
                <div class="info-item">
                    <label>Platform:</label>
                    <span>${navigator.platform}</span>
                </div>
                <div class="info-item">
                    <label>Screen Resolution:</label>
                    <span>${screen.width}×${screen.height}</span>
                </div>
                <div class="info-item">
                    <label>Viewport:</label>
                    <span>${window.innerWidth}×${window.innerHeight}</span>
                </div>
                <div class="info-item">
                    <label>Color Depth:</label>
                    <span>${screen.colorDepth}-bit</span>
                </div>
                <div class="info-item">
                    <label>Device Memory:</label>
                    <span>${navigator.deviceMemory || 'Unknown'} GB</span>
                </div>
                <div class="info-item">
                    <label>Hardware Concurrency:</label>
                    <span>${navigator.hardwareConcurrency || 'Unknown'} cores</span>
                </div>
                <div class="info-item">
                    <label>Test Date:</label>
                    <span>${new Date().toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    /**
     * Generate personalized recommendations based on results
     */
    generateRecommendations() {
        const recommendations = [];
        const summary = this.calculateSummary();
        
        // Overall score recommendations
        if (summary.overallScore < 50) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Limited Gaming Compatibility',
                priority: 'high',
                description: 'Your browser has limited support for modern gaming technologies. Consider updating your browser or using a more modern alternative.',
                actions: ['Update Browser', 'Try Chrome/Firefox']
            });
        }
        
        // WebGL recommendations
        const webglResults = this.results.filter(r => r.name.includes('WebGL'));
        if (webglResults.some(r => r.status === 'unsupported')) {
            recommendations.push({
                type: 'error',
                icon: '🎨',
                title: 'Graphics Support Issues',
                priority: 'high',
                description: 'WebGL is not supported, which will prevent most browser games from working. This may be due to hardware limitations or disabled graphics acceleration.',
                actions: ['Enable Hardware Acceleration', 'Update Graphics Drivers']
            });
        }
        
        // Performance recommendations
        const performanceIssues = this.results.filter(r => r.performance && r.performance.rating === 'poor');
        if (performanceIssues.length > 0) {
            recommendations.push({
                type: 'warning',
                icon: '⚡',
                title: 'Performance Optimization',
                priority: 'medium',
                description: 'Some graphics performance tests showed poor results. This may affect gaming performance.',
                actions: ['Close Other Tabs', 'Update Graphics Drivers']
            });
        }
        
        // Gaming API recommendations
        const gamingResults = this.results.filter(r => r.category === 'gaming');
        const unsupportedGaming = gamingResults.filter(r => r.status === 'unsupported').length;
        if (unsupportedGaming > gamingResults.length / 2) {
            recommendations.push({
                type: 'info',
                icon: '🎮',
                title: 'Enhanced Gaming Features',
                priority: 'low',
                description: 'Some advanced gaming APIs are not supported. While basic games will work, some features like gamepad input or advanced audio may not be available.',
                actions: ['Learn More About Gaming APIs']
            });
        }
        
        // Success recommendations
        if (summary.overallScore >= 80) {
            recommendations.push({
                type: 'success',
                icon: '🎉',
                title: 'Excellent Compatibility!',
                priority: 'info',
                description: 'Your browser has excellent support for modern gaming technologies. You should be able to play most browser games without issues.'
            });
        }
        
        return recommendations;
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary() {
        const total = this.results.length;
        const supported = this.results.filter(r => r.status === 'supported').length;
        const partial = this.results.filter(r => r.status === 'partial').length;
        const unsupported = this.results.filter(r => r.status === 'unsupported').length;
        const error = this.results.filter(r => r.status === 'error').length;
        
        const overallScore = total > 0 ? Math.round(((supported + partial * 0.5) / total) * 100) : 0;
        
        return { total, supported, partial, unsupported, error, overallScore };
    }

    /**
     * Calculate category-specific summary
     */
    calculateCategorySummary(results) {
        const total = results.length;
        const supported = results.filter(r => r.status === 'supported').length;
        const partial = results.filter(r => r.status === 'partial').length;
        const unsupported = results.filter(r => r.status === 'unsupported').length;
        const error = results.filter(r => r.status === 'error').length;
        
        return { total, supported, partial, unsupported, error };
    }

    /**
     * Group results by category
     */
    groupByCategory() {
        return this.results.reduce((acc, result) => {
            const category = result.category || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(result);
            return acc;
        }, {});
    }

    /**
     * Filter results by status
     */
    filterResults(status) {
        this.currentFilter = status;
        this.renderResults();
    }

    /**
     * Filter results array by status
     */
    filterResultsByStatus(results, status) {
        if (status === 'all') return results;
        return results.filter(r => r.status === status);
    }

    /**
     * Sort results
     */
    sortResults(sortBy) {
        this.sortBy = sortBy;
        this.renderResults();
    }

    /**
     * Sort results array by criteria
     */
    sortResultsBy(results, sortBy) {
        return [...results].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'status':
                    const statusOrder = { 'supported': 0, 'partial': 1, 'unsupported': 2, 'error': 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'score':
                    return (b.score || 0) - (a.score || 0);
                case 'category':
                default:
                    return a.category.localeCompare(b.category);
            }
        });
    }

    /**
     * Toggle between list and grid view
     */
    toggleView() {
        const button = document.getElementById('toggle-view');
        const resultsList = document.getElementById('results-list');
        
        if (resultsList.classList.contains('grid-view')) {
            resultsList.classList.remove('grid-view');
            button.textContent = '📋 List View';
        } else {
            resultsList.classList.add('grid-view');
            button.textContent = '📊 Grid View';
        }
    }

    /**
     * Share results
     */
    shareResults() {
        const summary = this.calculateSummary();
        const shareText = `I tested my browser compatibility for gaming: ${summary.overallScore}% compatible (${summary.supported}/${summary.total} fully supported)`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Browser Gaming Compatibility Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Results copied to clipboard!', 'success');
            });
        }
    }

    /**
     * Print results
     */
    printResults() {
        window.print();
    }

    /**
     * Go back to testing interface
     */
    backToTesting() {
        this.hide();
        
        const testingInterface = document.getElementById('testing-interface');
        if (testingInterface) {
            testingInterface.classList.remove('hidden');
        } else {
            const landingPage = document.getElementById('landing-page');
            if (landingPage) landingPage.classList.remove('hidden');
        }
    }

    /**
     * Utility functions
     */
    getCategoryIcon(category) {
        const icons = {
            graphics: '🎨',
            gaming: '🎮',
            communication: '📡',
            performance: '⚡',
            other: '📋'
        };
        return icons[category] || icons.other;
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    getStatusIcon(status) {
        const icons = {
            supported: '✅',
            partial: '⚠️',
            unsupported: '❌',
            error: '🚨'
        };
        return icons[status] || '❓';
    }

    formatStatus(status) {
        const labels = {
            supported: 'Fully Supported',
            partial: 'Partially Supported',
            unsupported: 'Not Supported',
            error: 'Error'
        };
        return labels[status] || status;
    }

    getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsInterface;
} else {
    window.ResultsInterface = ResultsInterface;
}