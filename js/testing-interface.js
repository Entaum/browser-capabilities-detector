/**
 * Testing Progress Interface
 * Manages the UI for running compatibility tests and showing progress
 */

class TestingInterface {
    constructor() {
        this.testResults = new Map();
        this.currentTest = null;
        this.testQueue = [];
        this.isRunning = false;
        
        this.initializeInterface();
        this.setupEventListeners();
    }

    /**
     * Initialize the testing interface elements
     */
    initializeInterface() {
        // Create testing interface container
        this.container = document.createElement('div');
        this.container.id = 'testing-interface';
        this.container.className = 'testing-interface hidden';
        
        this.container.innerHTML = `
            <div class="testing-header">
                <h2>🧪 Browser Compatibility Testing</h2>
                <div class="testing-controls">
                    <button id="pause-testing" class="btn-secondary" disabled>Pause</button>
                    <button id="stop-testing" class="btn-danger" disabled>Stop</button>
                </div>
            </div>
            
            <div class="testing-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" id="overall-progress">
                        <div class="progress-fill"></div>
                        <span class="progress-text">0%</span>
                    </div>
                </div>
                <div class="progress-info">
                    <span id="current-test-info">Initializing...</span>
                    <span id="test-count">0 / 0</span>
                </div>
            </div>

            <div class="test-categories">
                <div class="category-section" id="graphics-section">
                    <h3>🎨 Graphics APIs</h3>
                    <div class="test-items" id="graphics-tests"></div>
                </div>
                
                <div class="category-section" id="gaming-section">
                    <h3>🎮 Gaming APIs</h3>
                    <div class="test-items" id="gaming-tests"></div>
                </div>
                
                <div class="category-section" id="communication-section">
                    <h3>📡 Communication APIs</h3>
                    <div class="test-items" id="communication-tests"></div>
                </div>
                
                <div class="category-section" id="performance-section">
                    <h3>⚡ Performance APIs</h3>
                    <div class="test-items" id="performance-tests"></div>
                </div>
            </div>

            <div class="testing-actions">
                <button id="view-results" class="btn-primary" disabled>View Detailed Results</button>
                <button id="export-results" class="btn-secondary" disabled>Export Results</button>
                <button id="back-to-home" class="btn-outline">← Back to Home</button>
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * Setup event listeners for testing controls
     */
    setupEventListeners() {
        // Control buttons
        document.getElementById('pause-testing').addEventListener('click', () => this.pauseTesting());
        document.getElementById('stop-testing').addEventListener('click', () => this.stopTesting());
        document.getElementById('view-results').addEventListener('click', () => this.showResults());
        document.getElementById('export-results').addEventListener('click', () => this.exportResults());
        document.getElementById('back-to-home').addEventListener('click', () => this.backToHome());
    }

    /**
     * Show the testing interface and hide landing page
     */
    show() {
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.add('hidden');
        
        this.container.classList.remove('hidden');
        
        // Scroll to top and ensure progress is visible
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
        
        // Add some delay then scroll to progress section
        setTimeout(() => {
            const progressSection = this.container.querySelector('.testing-progress');
            if (progressSection) {
                progressSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }, 500);
        
        this.prepareTests();
    }

    /**
     * Hide testing interface and show landing page
     */
    hide() {
        this.container.classList.add('hidden');
        
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.remove('hidden');
    }

    /**
     * Prepare all tests for execution
     */
    async prepareTests() {
        try {
            // Initialize all test modules
            const testModules = [
                { name: 'WebGL Tests', module: new WebGLTests(), category: 'graphics' },
                { name: 'WebGPU Tests', module: new WebGPUTests(), category: 'graphics' },
                { name: 'WebAssembly Tests', module: new WebAssemblyTests(), category: 'performance' },
                { name: 'Gaming APIs Tests', module: new GamingAPIsTests(), category: 'gaming' },
                { name: 'Communication Tests', module: new CommunicationTests(), category: 'communication' },
                { name: 'Performance Tests', module: new PerformanceTests(), category: 'performance' }
            ];

            // Build test queue with all individual tests
            this.testQueue = [];
            let testId = 0;
            
            for (const testModule of testModules) {
                try {
                    const tests = testModule.module.getAllTests();
                    for (const test of tests) {
                        this.testQueue.push({
                            id: testId++,
                            name: test.name,
                            description: test.description,
                            category: test.category || testModule.category,
                            priority: test.priority || 5,
                            fn: test.fn,
                            dependencies: test.dependencies || [],
                            module: testModule.name
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load tests from ${testModule.name}:`, error);
                }
            }

            // Sort by priority (higher priority first)
            this.testQueue.sort((a, b) => b.priority - a.priority);

            // Create test UI elements
            this.createTestItems();
            this.updateProgress(0, this.testQueue.length);
            
            // Start testing automatically
            setTimeout(() => this.startTesting(), 500);
            
        } catch (error) {
            console.error('Failed to prepare tests:', error);
            this.showError('Failed to initialize tests. Please refresh and try again.');
        }
    }

    /**
     * Create UI elements for each test
     */
    createTestItems() {
        const categories = {
            graphics: document.getElementById('graphics-tests'),
            gaming: document.getElementById('gaming-tests'),
            communication: document.getElementById('communication-tests'),
            performance: document.getElementById('performance-tests')
        };

        // Clear existing items
        Object.values(categories).forEach(container => {
            if (container) container.innerHTML = '';
        });

        this.testQueue.forEach(test => {
            const container = categories[test.category];
            if (!container) return;

            const testItem = document.createElement('div');
            testItem.className = 'test-item pending';
            testItem.id = `test-${test.id}`;
            
            testItem.innerHTML = `
                <div class="test-header">
                    <span class="test-name">${test.name}</span>
                    <span class="test-status">⏳ Pending</span>
                </div>
                <div class="test-description">${test.description}</div>
                <div class="test-result hidden"></div>
            `;

            container.appendChild(testItem);
        });
    }

    /**
     * Start running all tests
     */
    async startTesting() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('pause-testing').disabled = false;
        document.getElementById('stop-testing').disabled = false;
        
        document.getElementById('current-test-info').textContent = 'Running compatibility tests...';
        
        let completedTests = 0;
        
        for (let i = 0; i < this.testQueue.length && this.isRunning; i++) {
            const test = this.testQueue[i];
            
            // Check dependencies
            if (test.dependencies.length > 0) {
                const dependencyMet = test.dependencies.every(dep => {
                    const depResult = Array.from(this.testResults.values()).find(r => r.name === dep);
                    return depResult && depResult.status === 'supported';
                });
                
                if (!dependencyMet) {
                    this.updateTestStatus(test.id, 'skipped', 'Dependencies not met');
                    completedTests++;
                    continue;
                }
            }

            // Run the test
            this.currentTest = test;
            this.updateTestStatus(test.id, 'running');
            document.getElementById('current-test-info').textContent = `Testing: ${test.name}`;
            
            try {
                const startTime = performance.now();
                const result = await Promise.race([
                    test.fn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 10000))
                ]);
                
                const duration = Math.round(performance.now() - startTime);
                result.duration = duration;
                result.name = test.name;
                result.category = test.category;
                
                this.testResults.set(test.id, result);
                this.updateTestStatus(test.id, result.status, result.details, result);
                
            } catch (error) {
                const errorResult = {
                    status: 'error',
                    details: error.message,
                    name: test.name,
                    category: test.category,
                    duration: 0
                };
                
                this.testResults.set(test.id, errorResult);
                this.updateTestStatus(test.id, 'error', error.message);
            }
            
            completedTests++;
            this.updateProgress(completedTests, this.testQueue.length);
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        this.finishTesting();
    }

    /**
     * Update test status in UI
     */
    updateTestStatus(testId, status, details = '', result = null) {
        const testElement = document.getElementById(`test-${testId}`);
        if (!testElement) return;

        testElement.className = `test-item ${status}`;
        
        const statusElement = testElement.querySelector('.test-status');
        const resultElement = testElement.querySelector('.test-result');
        
        const statusIcons = {
            pending: '⏳ Pending',
            running: '🔄 Running...',
            supported: '✅ Supported',
            partial: '⚠️ Partial',
            unsupported: '❌ Unsupported',
            error: '🚨 Error',
            skipped: '⏭️ Skipped'
        };
        
        statusElement.textContent = statusIcons[status] || `📋 ${status}`;
        
        if (details && (status !== 'running' && status !== 'pending')) {
            resultElement.textContent = details;
            resultElement.classList.remove('hidden');
            
            // Add score if available
            if (result && typeof result.score === 'number') {
                const scoreElement = document.createElement('div');
                scoreElement.className = 'test-score';
                scoreElement.textContent = `Score: ${result.score}%`;
                resultElement.appendChild(scoreElement);
            }
        }
    }

    /**
     * Update overall progress
     */
    updateProgress(completed, total) {
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const testCount = document.getElementById('test-count');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
        testCount.textContent = `${completed} / ${total}`;
        
        // Update progress bar color based on completion
        progressFill.className = 'progress-fill';
        if (percentage === 100) {
            progressFill.classList.add('complete');
        } else if (percentage > 50) {
            progressFill.classList.add('halfway');
        }
    }

    /**
     * Pause testing
     */
    pauseTesting() {
        this.isRunning = false;
        document.getElementById('current-test-info').textContent = 'Testing paused...';
        document.getElementById('pause-testing').textContent = 'Resume';
        document.getElementById('pause-testing').onclick = () => this.resumeTesting();
    }

    /**
     * Resume testing
     */
    resumeTesting() {
        this.isRunning = true;
        document.getElementById('pause-testing').textContent = 'Pause';
        document.getElementById('pause-testing').onclick = () => this.pauseTesting();
        this.startTesting();
    }

    /**
     * Stop testing
     */
    stopTesting() {
        this.isRunning = false;
        this.finishTesting(true);
    }

    /**
     * Finish testing and enable result actions
     */
    finishTesting(stopped = false) {
        this.isRunning = false;
        this.currentTest = null;
        
        document.getElementById('pause-testing').disabled = true;
        document.getElementById('stop-testing').disabled = true;
        document.getElementById('view-results').disabled = false;
        document.getElementById('export-results').disabled = false;
        
        const statusText = stopped ? 'Testing stopped by user' : 'Testing completed!';
        document.getElementById('current-test-info').textContent = statusText;
        
        // Show summary notification
        this.showSummary();
    }

    /**
     * Show testing summary
     */
    showSummary() {
        const results = Array.from(this.testResults.values());
        const supported = results.filter(r => r.status === 'supported').length;
        const partial = results.filter(r => r.status === 'partial').length;
        const total = results.length;
        
        const score = total > 0 ? Math.round(((supported + partial * 0.5) / total) * 100) : 0;
        
        this.showNotification(
            `Testing Complete! Compatibility Score: ${score}% (${supported}/${total} fully supported)`,
            'success',
            5000
        );
    }

    /**
     * Show detailed results
     */
    showResults() {
        // This will be handled by the results dashboard
        window.resultsInterface = window.resultsInterface || new ResultsInterface();
        window.resultsInterface.show(Array.from(this.testResults.values()));
        this.hide();
    }

    /**
     * Export results to JSON
     */
    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            results: Array.from(this.testResults.values()),
            summary: this.generateSummary()
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-compatibility-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Results exported successfully!', 'success');
    }

    /**
     * Generate summary statistics
     */
    generateSummary() {
        const results = Array.from(this.testResults.values());
        const categories = {};
        
        results.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { supported: 0, partial: 0, unsupported: 0, error: 0, total: 0 };
            }
            categories[result.category][result.status]++;
            categories[result.category].total++;
        });
        
        return {
            overall: {
                total: results.length,
                supported: results.filter(r => r.status === 'supported').length,
                partial: results.filter(r => r.status === 'partial').length,
                unsupported: results.filter(r => r.status === 'unsupported').length,
                error: results.filter(r => r.status === 'error').length
            },
            categories
        };
    }

    /**
     * Go back to home page
     */
    backToHome() {
        this.hide();
        
        // Reset state
        this.testResults.clear();
        this.testQueue = [];
        this.isRunning = false;
        this.currentTest = null;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error', 5000);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Reuse existing notification system from main.js
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestingInterface;
} else {
    window.TestingInterface = TestingInterface;
}