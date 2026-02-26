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
        
        // Get browser info
        const browserInfo = this.getBrowserInfo();
        
        this.container.innerHTML = `
            <div class="testing-header">
                <div class="header-top">
                    <h2>🧪 Browser Compatibility Testing</h2>
                    <div class="testing-controls">
                        <button id="pause-testing" class="btn-secondary" disabled>Pause</button>
                        <button id="stop-testing" class="btn-danger" disabled>Stop</button>
                    </div>
                </div>
            </div>
            
            <div class="testing-progress">
                <div class="browser-info-bar">
                    <div class="browser-icon">${browserInfo.icon}</div>
                    <div class="browser-details">
                        <span class="browser-name">${browserInfo.name} ${browserInfo.version}</span>
                        <span class="browser-engine">${browserInfo.engine}</span>
                        ${browserInfo.updateBadge}
                    </div>
                </div>
                <div class="final-score-container" id="final-score-container" style="display: none;">
                    <div class="final-score-card">
                        <div class="final-score-label">Browser Compatibility Score</div>
                        <div class="gauge-container">
                            <div class="gauge" id="compatibility-gauge">
                                <svg width="200" height="200" viewBox="0 0 200 200" class="gauge-svg">
                                    <defs>
                                        <linearGradient id="speedometer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                                            <stop offset="25%" style="stop-color:#f59e0b;stop-opacity:1" />
                                            <stop offset="50%" style="stop-color:#eab308;stop-opacity:1" />
                                            <stop offset="75%" style="stop-color:#10b981;stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                    
                                    <!-- Background track -->
                                    <circle cx="100" cy="100" r="85" fill="none" stroke="#374151" stroke-width="20" stroke-linecap="round" transform="rotate(135 100 100)" stroke-dasharray="401 534" class="gauge-bg" opacity="0.2"></circle>
                                    
                                    <!-- Animated gradient fill -->
                                    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#speedometer-gradient)" stroke-width="20" stroke-linecap="round" transform="rotate(135 100 100)" stroke-dasharray="0 534" stroke-dashoffset="0" class="gauge-fill" id="gauge-fill"></circle>
                                    
                                    <!-- Tick marks -->
                                    <g class="tick-marks" transform="rotate(135 100 100)">
                                        <line x1="100" y1="25" x2="100" y2="35" stroke="#ffffff" stroke-width="2" opacity="0.6" transform="rotate(0 100 100)" />
                                        <line x1="100" y1="25" x2="100" y2="40" stroke="#ffffff" stroke-width="3" opacity="0.8" transform="rotate(54 100 100)" />
                                        <line x1="100" y1="25" x2="100" y2="35" stroke="#ffffff" stroke-width="2" opacity="0.6" transform="rotate(108 100 100)" />
                                        <line x1="100" y1="25" x2="100" y2="40" stroke="#ffffff" stroke-width="3" opacity="0.8" transform="rotate(162 100 100)" />
                                        <line x1="100" y1="25" x2="100" y2="35" stroke="#ffffff" stroke-width="2" opacity="0.6" transform="rotate(216 100 100)" />
                                        <line x1="100" y1="25" x2="100" y2="40" stroke="#ffffff" stroke-width="3" opacity="0.8" transform="rotate(270 100 100)" />
                                    </g>
                                </svg>
                                <div class="gauge-cover">
                                    <div class="gauge-score" id="gauge-score">0</div>
                                    <div class="gauge-percent">%</div>
                                </div>
                            </div>
                        </div>
                        <div class="final-score-breakdown" id="final-score-breakdown"></div>
                        <div class="compatibility-status" id="compatibility-status"></div>
                    </div>
                </div>
                
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

            <div class="improvement-report" id="improvement-report">
                <h3>🚀 How to Improve Your Score</h3>
                <div class="improvement-content" id="improvement-report-content"></div>
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
    async show() {
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.add('hidden');
        
        this.container.classList.remove('hidden');
        
        // Update browser info with professional icons and version check
        await this.updateBrowserInfo();
        
        // Scroll to top and ensure progress is visible
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
        
        // Add some delay then scroll to testing header
        setTimeout(() => {
            const testingHeader = this.container.querySelector('.testing-header');
            if (testingHeader) {
                testingHeader.scrollIntoView({ 
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

        // Group tests by category and sort alphabetically within each category
        const testsByCategory = {};
        this.testQueue.forEach(test => {
            if (!testsByCategory[test.category]) {
                testsByCategory[test.category] = [];
            }
            testsByCategory[test.category].push(test);
        });

        // Sort tests within each category alphabetically
        Object.keys(testsByCategory).forEach(category => {
            testsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
        });

        // Render sorted tests
        Object.entries(testsByCategory).forEach(([categoryName, tests]) => {
            const container = categories[categoryName];
            if (!container) return;

            tests.forEach(test => {
                const testItem = document.createElement('div');
                testItem.className = 'test-item pending';
                testItem.id = `test-${test.id}`;
                
                const caniuseUrl = this.getCaniuseUrl(test.name);
                testItem.innerHTML = `
                    <div class="test-header" onclick="this.parentElement.classList.toggle('expanded')">
                        <span class="test-name">${test.name}</span>
                        <a href="${caniuseUrl}" target="_blank" class="test-help-link" onclick="event.stopPropagation()" title="View browser support on caniuse.com">?</a>
                        <span class="test-status">⏳ Pending</span>
                        <span class="test-expand-icon">▼</span>
                    </div>
                    <div class="test-details">
                        <div class="test-description">${test.description}</div>
                        <div class="test-result hidden"></div>
                    </div>
                `;

                container.appendChild(testItem);
            });
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
                    // Add skipped test to results so it's counted in scoring
                    const skippedResult = {
                        status: 'unsupported',  // Treat skipped as unsupported for scoring
                        details: 'Dependencies not met - API not available',
                        name: test.name,
                        category: test.category,
                        duration: 0
                    };
                    this.testResults.set(test.id, skippedResult);
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
        }
        
        // Add score if available - place it in the lower right of the test details
        if (result && typeof result.score === 'number' && (status !== 'running' && status !== 'pending')) {
            const testDetails = testElement.querySelector('.test-details');
            if (testDetails) {
                // Remove any existing score
                const existingScore = testDetails.querySelector('.test-score');
                if (existingScore) {
                    existingScore.remove();
                }
                
                const scoreElement = document.createElement('div');
                scoreElement.className = 'test-score';
                scoreElement.textContent = `${result.score}%`;
                testDetails.appendChild(scoreElement);
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
        const unsupported = results.filter(r => r.status === 'unsupported').length;
        const error = results.filter(r => r.status === 'error').length;
        const total = results.length;
        
        const score = total > 0 ? Math.round(((supported + partial * 0.5) / total) * 100) : 0;
        
        // Show final score in the progress area
        this.displayFinalScore(score, supported, partial, unsupported, error, total);
        
        // Still show toast notification for immediate feedback
        this.showNotification(
            `Testing Complete! Compatibility Score: ${score}% (${supported}/${total} fully supported)`,
            'success',
            3000
        );
    }

    /**
     * Display final score in progress area
     */
    displayFinalScore(score, supported, partial, unsupported, error, total) {
        const container = document.getElementById('final-score-container');
        const gaugeScore = document.getElementById('gauge-score');
        const gaugeFill = document.getElementById('gauge-fill');
        const scoreBreakdown = document.getElementById('final-score-breakdown');
        
        // Update gauge score
        gaugeScore.textContent = score;
        
        // Calculate gauge fill
        // Full circle circumference = 2 * π * r = 2 * π * 85 ≈ 534
        // We want 75% of the circle (270 degrees out of 360)
        const radius = 85;
        const fullCircumference = 2 * Math.PI * radius; // ≈ 534
        const gaugeArcLength = fullCircumference * 0.75; // 75% of circle = 270 degrees
        const fillLength = (score / 100) * gaugeArcLength;
        
        // Set initial fill state - start with 0 length
        gaugeFill.setAttribute('stroke-dasharray', `0 534`);
        gaugeFill.setAttribute('stroke-dashoffset', '0');
        
        // Create breakdown text
        const breakdownParts = [];
        if (supported > 0) breakdownParts.push(`${supported} fully supported`);
        if (partial > 0) breakdownParts.push(`${partial} partially supported`);
        if (unsupported > 0) breakdownParts.push(`${unsupported} unsupported`);
        if (error > 0) breakdownParts.push(`${error} errors`);
        
        scoreBreakdown.textContent = `${breakdownParts.join(' • ')} • Total: ${total} tests`;
        
        // Show the container and scroll to it
        container.style.display = 'block';
        
        // Scroll to the gauge area first
        setTimeout(() => {
            container.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 200);
        
        // Then animate the container appearance
        setTimeout(() => {
            container.classList.add('show');
            // Animate the gauge fill after everything is visible and scrolled to
            setTimeout(() => {
                gaugeFill.classList.add('animate');
                // Fill the gauge to show the score amount
                gaugeFill.setAttribute('stroke-dasharray', `${fillLength} 534`);
            }, 800); // Longer delay to allow scroll + appearance
        }, 500);
        
        // Dim progress info since testing is complete but keep it visible
        const progressInfo = document.querySelector('.progress-info');
        if (progressInfo) {
            progressInfo.style.opacity = '0.6';
        }

        // Update compatibility status message
        this.updateCompatibilityStatus(score, error, unsupported);
        
        // Generate improvement report
        this.generateImprovementReport();
    }

    /**
     * Get browser information including icon and update status
     */
    getBrowserInfo() {
        // First try to use the main browser detector if available
        if (window.compatibilityApp && window.compatibilityApp.browserDetector) {
            const detector = window.compatibilityApp.browserDetector;
            const browserInfo = detector.browserInfo;
            const name = browserInfo.name || 'Unknown';
            const version = browserInfo.version || '0';
            const engine = browserInfo.engine || 'Unknown';
            
            const icon = this.getBrowserIcon(name);
            const browserKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const updateStatus = this.checkBrowserUpdateFallback(browserKey, version);
            const updateBadge = updateStatus.badge;
            
            return {
                name,
                version,
                icon,
                engine: engine ? `(${engine})` : '',
                updateBadge
            };
        }
        
        // Fallback to manual detection if BrowserDetector not available
        const ua = navigator.userAgent;
        let name = 'Unknown';
        let version = '';
        let engine = '';
        
        // Try User-Agent Client Hints API first
        const brandInfo = this.getBrowserBrandFromClientHints();
        if (brandInfo.name && brandInfo.name !== 'Unknown') {
            name = brandInfo.name;
            version = brandInfo.version || this.extractVersionFromUA(ua, name);
            engine = this.getEngineFromBrowser(name);
        } else {
            // Fallback to traditional UA parsing
            if (ua.indexOf('Edg/') > -1) {
                name = 'Microsoft Edge';
                version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
                engine = 'Chromium';
            } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
                name = 'Chrome';
                version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
                engine = 'Chromium';
            } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
                name = 'Safari';
                version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
                engine = 'WebKit';
            } else if (ua.indexOf('Firefox') > -1) {
                name = 'Firefox';
                version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
                engine = 'Gecko';
            } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
                name = 'Opera';
                version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
                engine = 'Chromium';
            } else if (name === 'Unknown' && window.chrome) {
                // Final fallback for unknown Chromium-based browsers like Ray Browser
                console.log('🔍 Unknown Chromium-based browser detected in interface, defaulting to Chrome');
                // Check if we have brand info from Client Hints to show in parentheses
                const brandInfo = this.getBrowserBrandFromClientHints();
                if (brandInfo.name && brandInfo.name !== 'Unknown') {
                    name = `Chrome (${brandInfo.name})`;
                    console.log(`🎯 Showing as Chrome with brand: ${brandInfo.name}`);
                } else {
                    name = 'Chrome';
                }
                version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
                engine = 'Chromium';
            }
        }
        
        const icon = this.getBrowserIcon(name);
        const browserKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const updateStatus = this.checkBrowserUpdateFallback(browserKey, version);
        const updateBadge = updateStatus.badge;
        
        return {
            name,
            version,
            icon,
            engine: engine ? `(${engine})` : '',
            updateBadge
        };
    }

    /**
     * Get browser brand information from User-Agent Client Hints API
     */
    getBrowserBrandFromClientHints() {
        let brandInfo = { name: 'Unknown', version: '' };
        
        try {
            if (navigator.userAgentData && navigator.userAgentData.brands) {
                const brands = navigator.userAgentData.brands;
                
                // Find the most specific brand (usually the actual browser)
                const specificBrand = brands.find(brand => 
                    brand.brand && 
                    !brand.brand.includes('Not') && 
                    !brand.brand.includes('Chromium') &&
                    brand.brand !== 'Google Chrome'
                );
                
                if (specificBrand) {
                    brandInfo.name = specificBrand.brand;
                    brandInfo.version = specificBrand.version;
                } else {
                    const chromeBrand = brands.find(brand => 
                        brand.brand === 'Google Chrome' || 
                        brand.brand === 'Chrome'
                    );
                    if (chromeBrand) {
                        brandInfo.name = 'Chrome';
                        brandInfo.version = chromeBrand.version;
                    }
                }
                
                console.log('🔍 Client Hints brands detected:', brands);
                console.log('🎯 Selected brand for display:', brandInfo);
            }
        } catch (error) {
            console.log('ℹ️ User-Agent Client Hints not supported:', error.message);
        }
        
        return brandInfo;
    }

    /**
     * Extract version from UA based on browser name
     */
    extractVersionFromUA(ua, browserName) {
        const patterns = {
            'Ray Browser': /Chrome\/(\d+\.\d+)/,
            'Arc': /Chrome\/(\d+\.\d+)/,
            'Brave': /Chrome\/(\d+\.\d+)/,
            'Vivaldi': /Vivaldi\/(\d+\.\d+)/,
            'Opera': /OPR\/(\d+\.\d+)/,
            'Microsoft Edge': /Edg\/(\d+\.\d+)/,
            'Chrome': /Chrome\/(\d+\.\d+)/,
            'Firefox': /Firefox\/(\d+\.\d+)/,
            'Safari': /Version\/(\d+\.\d+)/
        };
        
        const pattern = patterns[browserName] || patterns['Chrome'];
        const match = ua.match(pattern);
        return match ? match[1] : '0';
    }

    /**
     * Get rendering engine based on browser name
     */
    getEngineFromBrowser(browserName) {
        const engines = {
            'Chrome': 'Chromium',
            'Microsoft Edge': 'Chromium',
            'Opera': 'Chromium',
            'Brave': 'Chromium',
            'Vivaldi': 'Chromium',
            'Arc': 'Chromium',
            'Ray Browser': 'Chromium',
            'Firefox': 'Gecko',
            'Safari': 'WebKit'
        };
        
        return engines[browserName] || 'Chromium';
    }

    /**
     * Get browser icon based on name
     */
    getBrowserIcon(name) {
        // Handle "Chrome (Brand)" format - extract the brand name for icon selection
        let iconName = name;
        const brandMatch = name.match(/^Chrome \((.+)\)$/);
        if (brandMatch) {
            iconName = brandMatch[1]; // Use the brand name for icon selection
        }

        const icons = {
            'Microsoft Edge': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.86 7.84c-.32-1.96-1.08-3.74-2.21-5.27C18.44.86 16.82 0 15.04 0c-1.86 0-3.54.92-4.86 2.45-1.32-1.53-3-2.45-4.86-2.45C3.5 0 1.88.86.67 2.57-.46 4.1-1.22 5.88-1.54 7.84c-.18.96-.18 1.96 0 2.92.36 2.64 1.44 5.04 3.15 6.96 1.89 2.13 4.32 3.28 6.93 3.28s5.04-1.15 6.93-3.28c1.71-1.92 2.79-4.32 3.15-6.96.18-.96.18-1.96 0-2.92z" fill="#0078d4"/></svg>',
            'Edge': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.86 7.84c-.32-1.96-1.08-3.74-2.21-5.27C18.44.86 16.82 0 15.04 0c-1.86 0-3.54.92-4.86 2.45-1.32-1.53-3-2.45-4.86-2.45C3.5 0 1.88.86.67 2.57-.46 4.1-1.22 5.88-1.54 7.84c-.18.96-.18 1.96 0 2.92.36 2.64 1.44 5.04 3.15 6.96 1.89 2.13 4.32 3.28 6.93 3.28s5.04-1.15 6.93-3.28c1.71-1.92 2.79-4.32 3.15-6.96.18-.96.18-1.96 0-2.92z" fill="#0078d4"/></svg>',
            'Chrome': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#chrome-gradient)"/><circle cx="12" cy="12" r="4" fill="#4285f4"/><path d="M12 2C8.13 2 4.79 4.24 3.11 7.5l4.33 7.5C8.59 16.65 10.13 17 12 17s3.41-.35 4.56-1l4.33-7.5C19.21 4.24 15.87 2 12 2z" fill="#ea4335"/><path d="M3.11 16.5C4.79 19.76 8.13 22 12 22s7.21-2.24 8.89-5.5l-4.33-7.5C15.41 7.35 13.87 7 12 7s-3.41.35-4.56 1L3.11 16.5z" fill="#34a853"/><defs><linearGradient id="chrome-gradient"><stop offset="0%" stop-color="#fdd663"/><stop offset="100%" stop-color="#f7931e"/></linearGradient></defs></svg>',
            'Safari': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#safari-gradient)"/><path d="M12 4l1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-1.5L12 4z" fill="white" stroke="#0066cc" stroke-width="0.5"/><defs><linearGradient id="safari-gradient"><stop offset="0%" stop-color="#00aaff"/><stop offset="100%" stop-color="#0066cc"/></linearGradient></defs></svg>',
            'Firefox': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0z" fill="url(#firefox-gradient)"/><path d="M19.5 7.5c-1.5-3-4.5-5-8-5-3.5 0-6.5 2-8 5 0 0 2.5-2 5.5-2s5.5 2 5.5 2c1 0 1.5.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5V7.5z" fill="#ff6611"/><defs><linearGradient id="firefox-gradient"><stop offset="0%" stop-color="#ff9500"/><stop offset="100%" stop-color="#ff6611"/></linearGradient></defs></svg>',
            'Opera': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff1b2d"/><path d="M12 4c-2.21 0-4 3.58-4 8s1.79 8 4 8 4-3.58 4-8-1.79-8-4-8z" fill="white"/></svg>',
            'Brave': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 0L8 8h8l-4-8z" fill="#fb542b"/><path d="M4 8l8 4-8 12V8z" fill="#fb542b"/><path d="M20 8v16l-8-12 8-4z" fill="#fb542b"/><circle cx="12" cy="16" r="2" fill="white"/></svg>',
            'Vivaldi': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ef3939"/><path d="M8 8h8v8H8z" fill="white"/><path d="M10 10h4v4h-4z" fill="#ef3939"/></svg>',
            'Arc': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#arc-gradient)"/><path d="M12 6a6 6 0 0 1 6 6" stroke="white" stroke-width="2" fill="none"/><path d="M12 6a6 6 0 0 0-6 6" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="white"/><defs><linearGradient id="arc-gradient"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#4ecdc4"/></linearGradient></defs></svg>',
            'Ray Browser': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#ray-gradient)"/><path d="M12 6L8 12l4 6 4-6-4-6z" fill="white"/><circle cx="12" cy="12" r="2" fill="#ff6b35"/><defs><linearGradient id="ray-gradient"><stop offset="0%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#f7931e"/></linearGradient></defs></svg>',
            'DuckDuckGo': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#de5833"/><path d="M8 10c0-2 2-4 4-4s4 2 4 4c0 1-1 2-2 2h-4c-1 0-2-1-2-2z" fill="white"/><circle cx="10" cy="9" r="1" fill="#de5833"/><circle cx="14" cy="9" r="1" fill="#de5833"/><path d="M12 14c-1 0-2-.5-2-1h4c0 .5-1 1-2 1z" fill="#de5833"/></svg>'
        };
        
        // Try to get icon for the detected name first, then try the iconName (brand), then fallback
        return icons[iconName] || icons[name] || icons['Chrome'] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#6b7280"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" stroke-width="1" fill="none"/></svg>';
    }
    
    /**
     * Load browser icon from SVG file
     */
    async loadBrowserIcon(iconPath) {
        try {
            const response = await fetch(iconPath);
            if (response.ok) {
                const svgText = await response.text();
                // Modify the SVG to have consistent sizing
                return svgText.replace('<svg', '<svg width="20" height="20"');
            }
        } catch (error) {
            console.warn('Failed to load browser icon:', iconPath, error);
        }
        
        // Fallback to a simple browser icon
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#6b7280"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" stroke-width="1" fill="none"/></svg>';
    }
    
    /**
     * Check browser update status using caniuse data
     */
    async checkBrowserUpdateStatus(browserKey, currentVersion) {
        if (!browserKey || !currentVersion) {
            return { badge: '', isUpToDate: false };
        }
        
        try {
            // Try server-side proxy first (avoids CORS), fallback to direct API
            let response;
            try {
                response = await fetch('/api/caniuse/browser-versions', {
                    method: 'GET',
                    cache: 'default'
                });
            } catch (proxyError) {
                // If proxy fails, try direct API (may fail due to CORS)
                response = await fetch('https://caniuse.com/api/browser-versions', {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
            }
            
            if (!response.ok) {
                // Fallback to static version checking if API fails
                return this.checkBrowserUpdateFallback(browserKey, currentVersion);
            }
            
            // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Response is not JSON (likely HTML error page)
                return this.checkBrowserUpdateFallback(browserKey, currentVersion);
            }
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // JSON parsing failed (response was not valid JSON)
                return this.checkBrowserUpdateFallback(browserKey, currentVersion);
            }
            const browserData = data[browserKey];
            
            if (!browserData || !browserData.versions) {
                return this.checkBrowserUpdateFallback(browserKey, currentVersion);
            }
            
            // Get the latest stable version
            const latestVersion = browserData.versions[browserData.versions.length - 1];
            const currentMajor = parseInt(currentVersion.split('.')[0]) || 0;
            const latestMajor = parseInt(latestVersion.split('.')[0]) || 0;
            
            if (currentMajor >= latestMajor) {
                return {
                    badge: '<span class="uptodate-badge">Up to Date</span>',
                    isUpToDate: true
                };
            } else if (latestMajor - currentMajor >= 5) {
                return {
                    badge: '<span class="update-badge">Update Available</span>',
                    isUpToDate: false
                };
            } else {
                return {
                    badge: '<span class="minor-update-badge">Minor Update Available</span>',
                    isUpToDate: false
                };
            }
            
        } catch (error) {
            // Silently fallback - CORS errors, network errors, and JSON parse errors are expected
            // Only log unexpected errors
            const isExpectedError = error.name === 'TypeError' || 
                                   error.name === 'SyntaxError' ||
                                   error.message.includes('CORS') || 
                                   error.message.includes('Failed to fetch') ||
                                   error.message.includes('Unexpected token');
            
            if (!isExpectedError) {
                console.warn('Failed to check browser version from caniuse:', error);
            }
            return this.checkBrowserUpdateFallback(browserKey, currentVersion);
        }
    }
    
    /**
     * Fallback browser version checking with static data
     */
    checkBrowserUpdateFallback(browserKey, currentVersion) {
        // Latest stable versions as of September 2025
        const latestVersions = {
            'chrome': 129,
            'firefox': 130,
            'safari': 18,
            'edge': 129,
            'opera': 112
        };
        
        const currentMajor = parseInt(currentVersion.split('.')[0]) || 0;
        const latestMajor = latestVersions[browserKey] || 0;
        
        if (currentMajor >= latestMajor) {
            return {
                badge: '<span class="uptodate-badge">Up to Date</span>',
                isUpToDate: true
            };
        } else if (latestMajor > 0 && (latestMajor - currentMajor) >= 5) {
            return {
                badge: '<span class="update-badge">Update Available</span>',
                isUpToDate: false
            };
        } else {
            return {
                badge: '<span class="minor-update-badge">Minor Update Available</span>',
                isUpToDate: false
            };
        }
    }

    /**
     * Get caniuse.com URL for a specific test
     */
    getCaniuseUrl(testName) {
        const caniuseMap = {
            // WebGL & Graphics
            'WebGL Context': 'https://caniuse.com/webgl',
            'WebGL 2.0': 'https://caniuse.com/webgl2',
            'WebGL Extensions': 'https://caniuse.com/webgl',
            'Canvas API': 'https://caniuse.com/canvas',
            'OffscreenCanvas': 'https://caniuse.com/offscreencanvas',
            
            // WebGPU
            'WebGPU Support': 'https://caniuse.com/webgpu',
            'WebGPU Adapter': 'https://caniuse.com/webgpu',
            'WebGPU Device': 'https://caniuse.com/webgpu',
            
            // WebAssembly
            'WebAssembly Support': 'https://caniuse.com/wasm',
            'WebAssembly Memory': 'https://caniuse.com/wasm',
            'WebAssembly Table': 'https://caniuse.com/wasm',
            'WebAssembly Global': 'https://caniuse.com/wasm',
            'WebAssembly Threads': 'https://caniuse.com/wasm-threads',
            'WebAssembly SIMD': 'https://caniuse.com/wasm-simd',
            'WebAssembly Streaming': 'https://caniuse.com/wasm',
            
            // Gaming APIs
            'Gamepad API': 'https://caniuse.com/gamepad',
            'Pointer Lock API': 'https://caniuse.com/pointerlock',
            'Fullscreen API': 'https://caniuse.com/fullscreen',
            'Screen Orientation API': 'https://caniuse.com/screen-orientation',
            'Wake Lock API': 'https://caniuse.com/wake-lock',
            'Keyboard Lock API': 'https://caniuse.com/?search=keyboard%20lock',
            'Vibration API': 'https://caniuse.com/vibration',
            
            // Communication
            'WebSocket API': 'https://caniuse.com/websockets',
            'WebRTC API': 'https://caniuse.com/rtcpeerconnection',
            'WebRTC Data Channels': 'https://caniuse.com/rtcdatachannel',
            'Server-Sent Events': 'https://caniuse.com/eventsource',
            'Fetch API': 'https://caniuse.com/fetch',
            
            // Performance
            'Performance API': 'https://caniuse.com/nav-timing',
            'Performance Observer': 'https://caniuse.com/mdn-api_performanceobserver',
            'Intersection Observer': 'https://caniuse.com/intersectionobserver',
            'Resize Observer': 'https://caniuse.com/resizeobserver',
            'Web Workers': 'https://caniuse.com/webworkers',
            'SharedArrayBuffer': 'https://caniuse.com/sharedarraybuffer',
            
            // Audio
            'Web Audio API': 'https://caniuse.com/audio-api',
            'Audio Context': 'https://caniuse.com/audio-api',
            
            // Storage
            'IndexedDB': 'https://caniuse.com/indexeddb',
            'localStorage': 'https://caniuse.com/namevalue-storage',
            
            // Device APIs
            'Device Motion API': 'https://caniuse.com/deviceorientation',
            'Geolocation API': 'https://caniuse.com/geolocation'
        };
        
        // Return the specific URL or a search URL if not found
        return caniuseMap[testName] || `https://caniuse.com/?search=${encodeURIComponent(testName)}`;
    }

    /**
     * Update compatibility status message based on score
     */
    updateCompatibilityStatus(score, errorCount, unsupportedCount) {
        const statusElement = document.getElementById('compatibility-status');
        if (!statusElement) return;

        let message = '';
        let className = '';

        if (score >= 80 && errorCount === 0) {
            message = "Your browser can run modern web games";
            className = 'status-excellent';
        } else if (score >= 60 && errorCount <= 2) {
            message = "Your browser can run most web games with good performance";
            className = 'status-good';
        } else if (score >= 40) {
            message = "Your browser may have issues running some modern web games";
            className = 'status-fair';
        } else {
            message = "Your browser may not be able to run many modern web games";
            className = 'status-poor';
        }

        // Create the status content with "Go To Report" link below the message
        const hasIssues = errorCount > 0 || unsupportedCount > 0;
        const reportLink = hasIssues ? '<div class="go-to-report-container"><a href="#" class="go-to-report-link" onclick="event.preventDefault(); document.getElementById(\'improvement-report\').scrollIntoView({behavior: \'smooth\', block: \'start\'}); return false;">Go To Report →</a></div>' : '';
        
        statusElement.innerHTML = '<div class="status-message">' + message + '</div>' + reportLink;
        statusElement.className = `compatibility-status ${className}`;
    }

    /**
     * Generate improvement report with actionable guidance
     */
    generateImprovementReport() {
        const reportContent = document.getElementById('improvement-report-content');
        if (!reportContent) return;

        const results = Array.from(this.testResults.values());
        const issues = results.filter(r => r.status === 'unsupported' || r.status === 'error');
        
        if (issues.length === 0) {
            reportContent.innerHTML = '<p class="no-issues">Great! Your browser supports all tested features. No improvements needed.</p>';
            return;
        }

        const reportSections = [];
        const categoryIssues = {};

        // Group issues by category
        issues.forEach(issue => {
            if (!categoryIssues[issue.category]) {
                categoryIssues[issue.category] = [];
            }
            categoryIssues[issue.category].push(issue);
        });

        // Generate recommendations for each category
        Object.keys(categoryIssues).forEach(category => {
            const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
            const categoryIssueList = categoryIssues[category];
            
            let sectionHTML = `<div class="report-section">
                <h4>${categoryTitle} Issues</h4>
                <div class="issue-list">`;

            categoryIssueList.forEach(issue => {
                const guidance = this.getImprovementGuidance(issue);
                sectionHTML += `
                    <div class="issue-item">
                        <div class="issue-name">${issue.name}</div>
                        <div class="issue-status status-${issue.status}">${issue.status}</div>
                        <div class="issue-guidance">${guidance}</div>
                    </div>`;
            });

            sectionHTML += '</div></div>';
            reportSections.push(sectionHTML);
        });

        reportContent.innerHTML = reportSections.join('');
    }

    /**
     * Get specific improvement guidance for an issue
     */
    getImprovementGuidance(issue) {
        const guidanceMap = {
            // Graphics & WebGL
            'WebGL Context': 'Enable hardware acceleration: Chrome → Settings → System → "Use hardware acceleration". Firefox → Settings → Performance → Uncheck "Use recommended" → Check "Use hardware acceleration"',
            'WebGL 2.0': 'WebGL 2.0 requires a modern browser and graphics drivers. Update both your browser and GPU drivers (NVIDIA/AMD/Intel).',
            'WebGL Extensions': 'Graphics driver update needed. Visit your GPU manufacturer website: NVIDIA (nvidia.com/drivers), AMD (amd.com/support), or Intel (intel.com/content/www/us/en/support)',
            'Canvas API': 'Canvas is universally supported. If failing, check: 1) Browser extensions blocking canvas fingerprinting, 2) Privacy settings, 3) Hardware acceleration',
            'OffscreenCanvas': 'Requires Chrome 69+, Firefox 105+, or Safari 16.4+. Update your browser or use a different browser for this feature.',
            
            // WebGPU
            'WebGPU Support': 'WebGPU is experimental. Enable in Chrome: chrome://flags/#enable-unsafe-webgpu. Firefox: about:config → dom.webgpu.enabled. Not yet supported in Safari.',
            'WebGPU Adapter': 'WebGPU requires modern GPU hardware and drivers. Update your graphics drivers and ensure WebGPU is enabled in browser flags.',
            'WebGPU Device': 'WebGPU device creation requires compatible hardware. Check GPU compatibility and ensure WebGPU flags are enabled.',
            
            // WebAssembly
            'WebAssembly Support': 'WebAssembly is supported in all modern browsers. Requires Chrome 57+, Firefox 52+, Safari 11+, or Edge 16+.',
            'WebAssembly Threads': 'Requires SharedArrayBuffer support. Enable COOP/COEP headers on your server or check browser security settings.',
            'WebAssembly SIMD': 'SIMD requires Chrome 91+, Firefox 89+, or Safari 16.4+. Update your browser for SIMD support.',
            'WebAssembly Streaming': 'Streaming compilation requires proper MIME type (application/wasm) and CORS headers if loading cross-origin.',
            
            // Audio
            'Web Audio API': 'Web Audio is widely supported. If failing: 1) Check browser autoplay policies, 2) Ensure page has user interaction, 3) Check audio permissions',
            'Audio Context': 'AudioContext may be blocked by autoplay policies. Ensure user interaction (click/tap) before creating audio context.',
            
            // Communication
            'WebSocket API': 'WebSockets may be blocked by: 1) Firewall/proxy settings, 2) Browser extensions, 3) Corporate network policies. Try disabling extensions.',
            'WebRTC API': 'WebRTC requires: 1) HTTPS connection (or localhost), 2) Camera/microphone permissions, 3) Not blocked by extensions',
            'WebRTC Data Channels': 'Data channels require WebRTC support. Check firewall settings for STUN/TURN servers and ensure WebRTC is not disabled.',
            'Server-Sent Events': 'SSE is widely supported. Check: 1) Network proxy settings, 2) Browser extensions blocking connections, 3) CORS policies',
            'Fetch API': 'Fetch is standard in modern browsers. Requires Chrome 42+, Firefox 39+, Safari 10.1+, or Edge 14+.',
            
            // Performance
            'Performance API': 'Performance API is core to modern browsers. If failing, check privacy extensions that might block timing APIs.',
            'Performance Observer': 'Requires Chrome 52+, Firefox 57+, or Safari 15+. Update your browser for PerformanceObserver support.',
            'Intersection Observer': 'Requires Chrome 51+, Firefox 55+, Safari 12.1+, or Edge 15+. Widely supported - update if needed.',
            'Resize Observer': 'Requires Chrome 64+, Firefox 69+, Safari 13.1+, or Edge 79+. Update browser for ResizeObserver support.',
            'Web Workers': 'Web Workers are universally supported. If failing: 1) Check Content Security Policy, 2) Ensure not in file:// protocol',
            'SharedArrayBuffer': 'Requires COOP/COEP headers: Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp',
            
            // Gaming specific
            'Gamepad API': 'Gamepad API requires: 1) Physical gamepad connected, 2) User interaction to activate, 3) Not all browsers support all controllers',
            'Pointer Lock API': 'Pointer Lock requires: 1) User gesture (click), 2) Fullscreen may be required in some browsers, 3) HTTPS connection',
            'Fullscreen API': 'Fullscreen requires: 1) User gesture (click/key), 2) Not blocked by iframe sandboxing, 3) Proper permissions',
            'Screen Orientation API': 'Orientation lock requires: 1) Fullscreen mode on mobile, 2) HTTPS connection, 3) Mobile device or responsive mode',
            'Wake Lock API': 'Wake Lock requires: 1) HTTPS connection, 2) Chrome 84+, Edge 84+, Safari 16.4+ (no Firefox support yet)',
            'Keyboard Lock API': 'Keyboard Lock is experimental. Chrome 68+ with fullscreen. Enable chrome://flags/#enable-experimental-web-platform-features',
            'Vibration API': 'Vibration requires: 1) Mobile device with vibration hardware, 2) User interaction, 3) Not in silent/vibrate mode',
            
            // Storage
            'IndexedDB': 'IndexedDB issues: 1) Private/incognito mode may limit storage, 2) Storage quota exceeded, 3) Browser storage settings',
            'localStorage': 'localStorage blocked by: 1) Private browsing mode, 2) Third-party cookie blocking, 3) Storage quota exceeded',
            
            // Device
            'Device Motion API': 'Motion APIs require: 1) Mobile device or laptop with sensors, 2) HTTPS connection, 3) iOS 13+ requires permission',
            'Geolocation API': 'Geolocation requires: 1) User permission grant, 2) HTTPS connection (or localhost), 3) Location services enabled',
            
            // Default guidance
            'default': 'Check browser compatibility at caniuse.com. Ensure: 1) Browser is updated, 2) Hardware acceleration enabled, 3) Privacy settings allow feature'
        };

        return guidanceMap[issue.name] || guidanceMap['default'];
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
        
        // Reset final score display
        const finalScoreContainer = document.getElementById('final-score-container');
        const gaugeFill = document.getElementById('gauge-fill');
        if (finalScoreContainer) {
            finalScoreContainer.style.display = 'none';
            finalScoreContainer.classList.remove('show');
        }
        if (gaugeFill) {
            gaugeFill.classList.remove('animate');
            gaugeFill.setAttribute('stroke-dasharray', '0 534');
            gaugeFill.setAttribute('stroke-dashoffset', '0');
        }
        
        // Reset progress info opacity
        const progressInfo = document.querySelector('.progress-info');
        if (progressInfo) {
            progressInfo.style.opacity = '';
        }
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

    /**
     * Update browser info with real-time version checking
     */
    async updateBrowserInfo() {
        try {
            const browserInfoBar = document.querySelector('.browser-info-bar');
            if (!browserInfoBar) return;

            const ua = navigator.userAgent;
            let name = 'Unknown';
            let version = '';
            let iconPath = 'assets/browser-icons/unknown.svg';
            let engine = '';
            let browserKey = '';

            // Detect browser and version
            if (ua.indexOf('Edg/') > -1) {
                name = 'Microsoft Edge';
                version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/edge.svg';
                engine = 'Chromium';
                browserKey = 'edge';
            } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
                name = 'Chrome';
                version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/chrome.svg';
                engine = 'Chromium';
                browserKey = 'chrome';
            } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
                name = 'Safari';
                version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/safari.svg';
                engine = 'WebKit';
                browserKey = 'safari';
            } else if (ua.indexOf('Firefox') > -1) {
                name = 'Firefox';
                version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/firefox.svg';
                engine = 'Gecko';
                browserKey = 'firefox';
            } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
                name = 'Opera';
                version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/opera.svg';
                engine = 'Chromium';
                browserKey = 'opera';
            } else if (ua.indexOf('Brave') > -1) {
                name = 'Brave';
                version = ua.match(/Brave\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/brave.svg';
                engine = 'Chromium';
                browserKey = 'chrome';
            } else if (ua.indexOf('Vivaldi') > -1) {
                name = 'Vivaldi';
                version = ua.match(/Vivaldi\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/vivaldi.svg';
                engine = 'Chromium';
                browserKey = 'chrome';
            } else if (ua.indexOf('DuckDuckGo') > -1) {
                name = 'DuckDuckGo';
                version = ua.match(/DuckDuckGo\/(\d+\.\d+)/)?.[1] || '';
                iconPath = 'assets/browser-icons/duckduckgo.svg';
                engine = 'WebKit';
                browserKey = 'safari';
            }

            // Load the SVG icon
            const icon = await this.loadBrowserIcon(iconPath);

            // Check if browser is up to date using caniuse data
            const updateStatus = await this.checkBrowserUpdateStatus(browserKey, version);

            // Update the browser info bar
            browserInfoBar.innerHTML = `
                <div class="browser-icon">${icon}</div>
                <div class="browser-details">
                    <span class="browser-name">${name} ${version}</span>
                    <span class="browser-engine">${engine ? `(${engine})` : ''}</span>
                    ${updateStatus.badge}
                </div>
            `;

        } catch (error) {
            console.warn('Failed to update browser info:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestingInterface;
} else {
    window.TestingInterface = TestingInterface;
}