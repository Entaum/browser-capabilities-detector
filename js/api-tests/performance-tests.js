/**
 * Performance APIs Testing Suite
 * Tests performance monitoring and optimization APIs
 */

class PerformanceTests {
    constructor() {
        this.cleanupFunctions = [];
    }

    /**
     * Get all Performance API tests
     */
    getAllTests() {
        return [
            {
                name: 'Performance API',
                fn: () => this.testPerformanceAPI(),
                category: 'performance',
                priority: 10,
                description: 'Test performance measurement and timing APIs'
            },
            {
                name: 'Performance Observer',
                fn: () => this.testPerformanceObserver(),
                category: 'performance',
                priority: 9,
                description: 'Test performance monitoring and observation capabilities'
            },
            {
                name: 'Intersection Observer',
                fn: () => this.testIntersectionObserver(),
                category: 'performance',
                priority: 8,
                description: 'Test intersection observation for lazy loading optimization'
            },
            {
                name: 'Resize Observer',
                fn: () => this.testResizeObserver(),
                category: 'performance',
                priority: 7,
                description: 'Test element resize observation for responsive design'
            },
            {
                name: 'Web Workers',
                fn: () => this.testWebWorkers(),
                category: 'performance',
                priority: 6,
                description: 'Test background thread processing capabilities'
            },
            {
                name: 'SharedArrayBuffer',
                fn: () => this.testSharedArrayBuffer(),
                category: 'performance',
                priority: 5,
                description: 'Test shared memory capabilities for multi-threading'
            }
        ];
    }

    /**
     * Test Performance API support
     */
    async testPerformanceAPI() {
        try {
            if (!window.performance) {
                return {
                    status: 'unsupported',
                    details: 'Performance API not available',
                    reason: 'Browser does not support Performance API'
                };
            }

            // Test performance measurement capabilities
            const capabilities = {
                hasNow: typeof performance.now === 'function',
                hasMark: typeof performance.mark === 'function',
                hasMeasure: typeof performance.measure === 'function',
                hasGetEntries: typeof performance.getEntries === 'function',
                hasGetEntriesByType: typeof performance.getEntriesByType === 'function',
                hasGetEntriesByName: typeof performance.getEntriesByName === 'function',
                hasClearMarks: typeof performance.clearMarks === 'function',
                hasClearMeasures: typeof performance.clearMeasures === 'function',
                hasNavigation: !!(performance.navigation || performance.getEntriesByType('navigation').length > 0),
                hasTiming: !!(performance.timing)
            };

            // Test basic performance operations
            let operationsTest = true;
            try {
                const startTime = performance.now();
                
                // Test mark and measure
                if (capabilities.hasMark && capabilities.hasMeasure) {
                    performance.mark('test-start');
                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 1));
                    performance.mark('test-end');
                    performance.measure('test-measure', 'test-start', 'test-end');
                    
                    const measures = performance.getEntriesByName('test-measure');
                    operationsTest = measures.length > 0 && measures[0].duration >= 0;
                    
                    // Cleanup
                    performance.clearMarks('test-start');
                    performance.clearMarks('test-end');
                    performance.clearMeasures('test-measure');
                }
                
                const endTime = performance.now();
                const timingAccuracy = endTime > startTime;
                
                capabilities.timingAccuracy = timingAccuracy;
                capabilities.operationsWork = operationsTest;
                
            } catch (operationError) {
                capabilities.operationsWork = false;
                console.warn('Performance operations test failed:', operationError);
            }

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const totalFeatures = Object.keys(capabilities).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: score > 70 ? 'supported' : 'partial',
                details: `Performance API functional with ${supportedFeatures}/${totalFeatures} features`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Performance API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Performance Observer support
     */
    async testPerformanceObserver() {
        try {
            if (!window.PerformanceObserver) {
                return {
                    status: 'unsupported',
                    details: 'PerformanceObserver not available',
                    reason: 'Browser does not support PerformanceObserver'
                };
            }

            // Test PerformanceObserver capabilities
            const capabilities = {
                hasPerformanceObserver: true,
                hasObserve: typeof PerformanceObserver.prototype.observe === 'function',
                hasDisconnect: typeof PerformanceObserver.prototype.disconnect === 'function',
                hasTakeRecords: typeof PerformanceObserver.prototype.takeRecords === 'function',
                hasSupportedEntryTypes: !!(PerformanceObserver.supportedEntryTypes)
            };

            // Test supported entry types
            let supportedEntryTypes = [];
            if (PerformanceObserver.supportedEntryTypes) {
                supportedEntryTypes = PerformanceObserver.supportedEntryTypes;
                capabilities.supportsNavigation = supportedEntryTypes.includes('navigation');
                capabilities.supportsMark = supportedEntryTypes.includes('mark');
                capabilities.supportsMeasure = supportedEntryTypes.includes('measure');
                capabilities.supportsPaint = supportedEntryTypes.includes('paint');
                capabilities.supportsResource = supportedEntryTypes.includes('resource');
            }

            // Test basic observer functionality
            let observerTest = false;
            try {
                const observer = new PerformanceObserver((list) => {
                    // Observer callback
                });
                
                // Test observe method
                if (supportedEntryTypes.includes('mark')) {
                    observer.observe({ entryTypes: ['mark'] });
                    observerTest = true;
                    observer.disconnect();
                }
                
            } catch (observerError) {
                console.warn('PerformanceObserver test failed:', observerError);
            }

            capabilities.basicObserverWorks = observerTest;
            capabilities.supportedEntryTypes = supportedEntryTypes;

            const supportedFeatures = Object.values(capabilities).filter(val => val === true).length;
            const totalFeatures = Object.keys(capabilities).filter(key => typeof capabilities[key] === 'boolean').length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: score > 60 ? 'supported' : 'partial',
                details: `PerformanceObserver functional with ${supportedEntryTypes.length} entry types`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'PerformanceObserver test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Intersection Observer support
     */
    async testIntersectionObserver() {
        try {
            if (!window.IntersectionObserver) {
                return {
                    status: 'unsupported',
                    details: 'IntersectionObserver not available',
                    reason: 'Browser does not support IntersectionObserver'
                };
            }

            // Test IntersectionObserver capabilities
            const capabilities = {
                hasIntersectionObserver: true,
                hasObserve: typeof IntersectionObserver.prototype.observe === 'function',
                hasUnobserve: typeof IntersectionObserver.prototype.unobserve === 'function',
                hasDisconnect: typeof IntersectionObserver.prototype.disconnect === 'function',
                hasTakeRecords: typeof IntersectionObserver.prototype.takeRecords === 'function'
            };

            // Test basic functionality
            let functionalTest = false;
            try {
                const observer = new IntersectionObserver((entries) => {
                    // Observer callback
                }, {
                    threshold: [0, 0.5, 1],
                    rootMargin: '10px'
                });

                // Create a test element
                const testElement = document.createElement('div');
                testElement.style.width = '1px';
                testElement.style.height = '1px';
                testElement.style.position = 'absolute';
                testElement.style.top = '-9999px';
                document.body.appendChild(testElement);

                observer.observe(testElement);
                functionalTest = true;
                observer.disconnect();
                document.body.removeChild(testElement);

            } catch (functionalError) {
                console.warn('IntersectionObserver functional test failed:', functionalError);
            }

            capabilities.functionalTest = functionalTest;

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const totalFeatures = Object.keys(capabilities).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: 'supported',
                details: `IntersectionObserver fully functional`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'IntersectionObserver test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Resize Observer support
     */
    async testResizeObserver() {
        try {
            if (!window.ResizeObserver) {
                return {
                    status: 'unsupported',
                    details: 'ResizeObserver not available',
                    reason: 'Browser does not support ResizeObserver'
                };
            }

            // Test ResizeObserver capabilities
            const capabilities = {
                hasResizeObserver: true,
                hasObserve: typeof ResizeObserver.prototype.observe === 'function',
                hasUnobserve: typeof ResizeObserver.prototype.unobserve === 'function',
                hasDisconnect: typeof ResizeObserver.prototype.disconnect === 'function'
            };

            // Test basic functionality
            let functionalTest = false;
            try {
                const observer = new ResizeObserver((entries) => {
                    // Observer callback
                });

                // Create a test element
                const testElement = document.createElement('div');
                testElement.style.width = '100px';
                testElement.style.height = '100px';
                testElement.style.position = 'absolute';
                testElement.style.top = '-9999px';
                document.body.appendChild(testElement);

                observer.observe(testElement);
                functionalTest = true;
                observer.disconnect();
                document.body.removeChild(testElement);

            } catch (functionalError) {
                console.warn('ResizeObserver functional test failed:', functionalError);
            }

            capabilities.functionalTest = functionalTest;

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const totalFeatures = Object.keys(capabilities).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: 'supported',
                details: `ResizeObserver fully functional`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'ResizeObserver test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Web Workers support
     */
    async testWebWorkers() {
        try {
            if (!window.Worker) {
                return {
                    status: 'unsupported',
                    details: 'Web Workers not available',
                    reason: 'Browser does not support Web Workers'
                };
            }

            // Test Web Worker capabilities
            const capabilities = {
                hasWorker: true,
                hasSharedWorker: !!(window.SharedWorker),
                hasServiceWorker: !!(navigator.serviceWorker),
                hasPostMessage: typeof Worker.prototype.postMessage === 'function',
                hasTerminate: typeof Worker.prototype.terminate === 'function'
            };

            // Test basic Web Worker functionality
            let workerTest = false;
            try {
                // Create a simple inline worker using Blob
                const workerScript = `
                    self.onmessage = function(e) {
                        if (e.data === 'test') {
                            self.postMessage('test-response');
                        }
                    };
                `;
                
                const blob = new Blob([workerScript], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);
                
                const workerPromise = new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve(false);
                    }, 1000);
                    
                    worker.onmessage = (e) => {
                        clearTimeout(timeout);
                        resolve(e.data === 'test-response');
                    };
                    
                    worker.onerror = () => {
                        clearTimeout(timeout);
                        resolve(false);
                    };
                });
                
                worker.postMessage('test');
                workerTest = await workerPromise;
                
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                
            } catch (workerError) {
                console.warn('Web Worker test failed:', workerError);
            }

            capabilities.basicWorkerTest = workerTest;

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const totalFeatures = Object.keys(capabilities).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: score > 60 ? 'supported' : 'partial',
                details: `Web Workers functional with ${supportedFeatures}/${totalFeatures} features`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Web Workers test failed',
                error: error.message
            };
        }
    }

    /**
     * Test SharedArrayBuffer support
     */
    async testSharedArrayBuffer() {
        try {
            if (!window.SharedArrayBuffer) {
                return {
                    status: 'unsupported',
                    details: 'SharedArrayBuffer not available',
                    reason: 'Browser does not support SharedArrayBuffer or COOP/COEP headers not set'
                };
            }

            // Test SharedArrayBuffer capabilities
            const capabilities = {
                hasSharedArrayBuffer: true,
                hasAtomics: !!(window.Atomics),
                canCreateBuffer: false,
                canUseAtomics: false
            };

            // Test basic SharedArrayBuffer functionality
            try {
                const buffer = new SharedArrayBuffer(1024);
                capabilities.canCreateBuffer = buffer.byteLength === 1024;
                
                if (window.Atomics) {
                    const view = new Int32Array(buffer);
                    Atomics.store(view, 0, 42);
                    const value = Atomics.load(view, 0);
                    capabilities.canUseAtomics = value === 42;
                }
                
            } catch (bufferError) {
                console.warn('SharedArrayBuffer test failed:', bufferError);
            }

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const totalFeatures = Object.keys(capabilities).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: score > 50 ? 'supported' : 'partial',
                details: `SharedArrayBuffer functional with ${supportedFeatures}/${totalFeatures} features`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'SharedArrayBuffer test failed',
                error: error.message
            };
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Execute any registered cleanup functions
        this.cleanupFunctions.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('Performance API cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTests;
} else {
    window.PerformanceTests = PerformanceTests;
}