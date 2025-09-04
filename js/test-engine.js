/**
 * Test Engine Framework
 * Orchestrates browser compatibility tests with timeout handling
 */

class TestEngine {
    constructor(options = {}) {
        this.tests = new Map();
        this.results = new Map();
        this.listeners = new Map();
        
        // Configuration
        this.config = {
            timeoutMs: options.timeoutMs || 5000,
            totalTimeLimit: options.totalTimeLimit || 60000,
            parallelTests: options.parallelTests || 3,
            retryAttempts: options.retryAttempts || 1,
            ...options
        };
        
        // State
        this.isRunning = false;
        this.startTime = null;
        this.currentTest = null;
        this.completedTests = 0;
        this.totalTests = 0;
        
        console.log('🧪 Test Engine initialized with config:', this.config);
    }

    /**
     * Register a test function
     */
    registerTest(name, testFunction, options = {}) {
        const test = {
            name,
            fn: testFunction,
            category: options.category || 'general',
            priority: options.priority || 1,
            timeout: options.timeout || this.config.timeoutMs,
            retries: options.retries || this.config.retryAttempts,
            dependencies: options.dependencies || [],
            description: options.description || name,
            ...options
        };
        
        this.tests.set(name, test);
        console.log(`📝 Registered test: ${name} (${test.category})`);
        
        return this;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
        return this;
    }

    /**
     * Emit event to listeners
     */
    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Event listener error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Run all registered tests
     */
    async runAllTests() {
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }

        console.log('🚀 Starting compatibility test suite...');
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.completedTests = 0;
        this.totalTests = this.tests.size;
        this.results.clear();
        
        this.emit('testSuiteStart', {
            totalTests: this.totalTests,
            startTime: this.startTime
        });

        try {
            // Sort tests by priority and dependencies
            const sortedTests = this.sortTestsByPriorityAndDependencies();
            
            // Run tests
            for (const test of sortedTests) {
                // Check if we've exceeded the total time limit
                if (Date.now() - this.startTime > this.config.totalTimeLimit) {
                    console.warn('⏰ Total time limit exceeded, skipping remaining tests');
                    
                    // Mark remaining tests as skipped
                    const remainingTests = sortedTests.slice(sortedTests.indexOf(test));
                    for (const skippedTest of remainingTests) {
                        this.results.set(skippedTest.name, {
                            status: 'skipped',
                            reason: 'Time limit exceeded',
                            timestamp: Date.now(),
                            duration: 0
                        });
                    }
                    break;
                }
                
                await this.runSingleTest(test);
            }
            
            const duration = Date.now() - this.startTime;
            console.log(`✅ Test suite completed in ${duration}ms`);
            
            this.emit('testSuiteComplete', {
                results: this.results,
                duration,
                totalTests: this.totalTests,
                completedTests: this.completedTests
            });
            
            return this.getTestSummary();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.emit('testSuiteError', { error });
            throw error;
        } finally {
            this.isRunning = false;
            this.currentTest = null;
        }
    }

    /**
     * Run a single test with timeout and retry logic
     */
    async runSingleTest(test) {
        const testStartTime = Date.now();
        this.currentTest = test.name;
        
        console.log(`🧪 Running test: ${test.name}`);
        
        this.emit('testStart', {
            name: test.name,
            description: test.description,
            category: test.category
        });

        let lastError = null;
        let result = null;
        
        // Retry logic
        for (let attempt = 0; attempt <= test.retries; attempt++) {
            try {
                // Check dependencies
                if (!this.checkDependencies(test)) {
                    result = {
                        status: 'skipped',
                        reason: 'Dependencies not met',
                        dependencies: test.dependencies
                    };
                    break;
                }
                
                // Run test with timeout
                result = await this.runTestWithTimeout(test);
                
                // If successful, break out of retry loop
                if (result.status !== 'error') {
                    break;
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Test ${test.name} failed (attempt ${attempt + 1}):`, error.message);
                
                // If this was the last attempt, set error result
                if (attempt === test.retries) {
                    result = {
                        status: 'error',
                        error: error.message,
                        details: error.stack
                    };
                }
            }
        }
        
        // Finalize result
        const duration = Date.now() - testStartTime;
        const finalResult = {
            ...result,
            testName: test.name,
            category: test.category,
            duration,
            timestamp: Date.now(),
            attempts: lastError ? test.retries + 1 : 1
        };
        
        this.results.set(test.name, finalResult);
        this.completedTests++;
        
        console.log(`${result.status === 'error' ? '❌' : '✅'} Test ${test.name}: ${result.status}`);
        
        this.emit('testComplete', {
            name: test.name,
            result: finalResult,
            progress: this.completedTests / this.totalTests
        });
        
        return finalResult;
    }

    /**
     * Run test function with timeout protection
     */
    async runTestWithTimeout(test) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Test timeout after ${test.timeout}ms`));
            }, test.timeout);
            
            // Execute test function
            Promise.resolve(test.fn())
                .then(result => {
                    clearTimeout(timeoutId);
                    
                    // Normalize result format
                    if (typeof result === 'boolean') {
                        resolve({
                            status: result ? 'supported' : 'unsupported',
                            details: `Test returned ${result}`
                        });
                    } else if (typeof result === 'object' && result.status) {
                        resolve(result);
                    } else {
                        resolve({
                            status: 'supported',
                            details: result
                        });
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Check if test dependencies are satisfied
     */
    checkDependencies(test) {
        if (!test.dependencies || test.dependencies.length === 0) {
            return true;
        }
        
        for (const dependency of test.dependencies) {
            const depResult = this.results.get(dependency);
            if (!depResult || depResult.status !== 'supported') {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Sort tests by priority and dependencies
     */
    sortTestsByPriorityAndDependencies() {
        const testArray = Array.from(this.tests.values());
        
        // Topological sort for dependencies, then by priority
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (test) => {
            if (visiting.has(test.name)) {
                throw new Error(`Circular dependency detected: ${test.name}`);
            }
            
            if (!visited.has(test.name)) {
                visiting.add(test.name);
                
                // Visit dependencies first
                for (const depName of test.dependencies || []) {
                    const dependency = this.tests.get(depName);
                    if (dependency) {
                        visit(dependency);
                    }
                }
                
                visiting.delete(test.name);
                visited.add(test.name);
                sorted.push(test);
            }
        };
        
        // Sort by priority first, then perform topological sort
        const prioritySorted = testArray.sort((a, b) => b.priority - a.priority);
        
        for (const test of prioritySorted) {
            visit(test);
        }
        
        return sorted;
    }

    /**
     * Get test results summary
     */
    getTestSummary() {
        const summary = {
            totalTests: this.totalTests,
            completedTests: this.completedTests,
            results: Object.fromEntries(this.results),
            categories: {},
            statusCounts: {
                supported: 0,
                unsupported: 0,
                partial: 0,
                error: 0,
                skipped: 0
            },
            duration: this.startTime ? Date.now() - this.startTime : 0
        };
        
        // Calculate statistics
        for (const [name, result] of this.results) {
            const category = this.tests.get(name)?.category || 'general';
            
            if (!summary.categories[category]) {
                summary.categories[category] = {
                    total: 0,
                    supported: 0,
                    unsupported: 0,
                    partial: 0,
                    error: 0,
                    skipped: 0
                };
            }
            
            summary.categories[category].total++;
            summary.categories[category][result.status]++;
            summary.statusCounts[result.status]++;
        }
        
        return summary;
    }

    /**
     * Get detailed test result
     */
    getTestResult(testName) {
        return this.results.get(testName) || null;
    }

    /**
     * Check if tests are currently running
     */
    isTestRunning() {
        return this.isRunning;
    }

    /**
     * Get current progress
     */
    getProgress() {
        return {
            completed: this.completedTests,
            total: this.totalTests,
            percentage: this.totalTests > 0 ? (this.completedTests / this.totalTests) * 100 : 0,
            currentTest: this.currentTest,
            elapsedTime: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    /**
     * Cancel running tests
     */
    cancel() {
        if (this.isRunning) {
            this.isRunning = false;
            this.emit('testSuiteCancelled');
            console.log('🛑 Test suite cancelled');
        }
    }

    /**
     * Clear all results and registered tests
     */
    reset() {
        if (this.isRunning) {
            this.cancel();
        }
        
        this.tests.clear();
        this.results.clear();
        this.completedTests = 0;
        this.totalTests = 0;
        this.currentTest = null;
        this.startTime = null;
        
        console.log('🔄 Test engine reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestEngine;
} else {
    window.TestEngine = TestEngine;
}