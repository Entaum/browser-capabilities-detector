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
    show() {
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.add('hidden');
        
        this.container.classList.remove('hidden');
        
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

        this.testQueue.forEach(test => {
            const container = categories[test.category];
            if (!container) return;

            const testItem = document.createElement('div');
            testItem.className = 'test-item pending';
            testItem.id = `test-${test.id}`;
            
            testItem.innerHTML = `
                <div class="test-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <span class="test-name">${test.name}</span>
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
            'WebGL Context': 'Enable hardware acceleration in your browser settings. For Chrome: chrome://settings/system → "Use hardware acceleration when available"',
            'WebGL Extensions': 'Update your graphics drivers. Visit your GPU manufacturer\'s website (NVIDIA, AMD, Intel) for the latest drivers.',
            'Canvas API': 'This is a core web standard. Consider updating your browser to a newer version.',
            
            // Audio
            'Web Audio API': 'Update your browser to a newer version. Web Audio API is supported in all modern browsers.',
            'Audio Context': 'Check if audio is blocked by your browser\'s autoplay policy. Try interacting with the page first.',
            
            // Communication
            'WebSocket API': 'Check your network configuration and firewall settings. WebSockets may be blocked by corporate networks.',
            'WebRTC API': 'Enable camera/microphone permissions if prompted. Some features require HTTPS connection.',
            
            // Storage
            'IndexedDB': 'Clear browser storage if full. Check browser privacy settings - private/incognito mode may disable IndexedDB.',
            'localStorage API': 'Disable private browsing mode. Check if third-party cookies are enabled.',
            
            // Performance
            'Web Workers': 'Update your browser. Web Workers are supported in all modern browsers since 2010.',
            'SharedArrayBuffer': 'This requires HTTPS and special security headers. SharedArrayBuffer was disabled in some browsers due to Spectre vulnerabilities.',
            
            // Gaming specific
            'Gamepad API': 'Connect a gamepad and try again. The Gamepad API only detects controllers when they\'re actively connected.',
            'Pointer Lock API': 'This requires user interaction. Click on the page and try again.',
            'Fullscreen API': 'This requires user interaction. Some browsers block fullscreen in certain contexts.',
            
            // Device
            'Device Motion API': 'Enable motion sensors in browser settings. This feature requires HTTPS on many browsers.',
            'Geolocation API': 'Enable location permissions when prompted. Check browser privacy settings.',
            
            // Default guidance
            'default': 'Update your browser to the latest version. This feature may not be supported in older browsers.'
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestingInterface;
} else {
    window.TestingInterface = TestingInterface;
}