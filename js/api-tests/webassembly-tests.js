/**
 * WebAssembly API Testing Suite
 * Comprehensive WebAssembly compatibility and feature testing
 */

class WebAssemblyTests {
    constructor() {
        this.cleanupFunctions = [];
    }

    /**
     * Get all WebAssembly tests
     */
    getAllTests() {
        return [
            {
                name: 'WebAssembly Support',
                fn: () => this.testWebAssemblySupport(),
                category: 'webassembly',
                priority: 10,
                description: 'Test basic WebAssembly support and compilation'
            },
            {
                name: 'WASM Instantiation',
                fn: () => this.testWebAssemblyInstantiation(),
                category: 'webassembly',
                priority: 9,
                description: 'Test WebAssembly module instantiation and execution',
                dependencies: ['WebAssembly Support']
            },
            {
                name: 'WASM SIMD Support',
                fn: () => this.testWebAssemblySIMD(),
                category: 'webassembly',
                priority: 8,
                description: 'Test WebAssembly SIMD (Single Instruction, Multiple Data) support',
                dependencies: ['WebAssembly Support']
            },
            {
                name: 'WASM Threads Support',
                fn: () => this.testWebAssemblyThreads(),
                category: 'webassembly',
                priority: 7,
                description: 'Test WebAssembly threading capabilities',
                dependencies: ['WebAssembly Support']
            },
            {
                name: 'WASM Memory Management',
                fn: () => this.testWebAssemblyMemory(),
                category: 'webassembly',
                priority: 6,
                description: 'Test WebAssembly memory allocation and management',
                dependencies: ['WebAssembly Support']
            },
            {
                name: 'WASM Performance',
                fn: () => this.testWebAssemblyPerformance(),
                category: 'webassembly',
                priority: 5,
                description: 'Test WebAssembly execution performance',
                dependencies: ['WASM Instantiation']
            }
        ];
    }

    /**
     * Test basic WebAssembly support
     */
    async testWebAssemblySupport() {
        try {
            // Check if WebAssembly is available
            if (typeof WebAssembly === 'undefined') {
                return {
                    status: 'unsupported',
                    details: 'WebAssembly not available in this browser',
                    reason: 'WebAssembly global object undefined'
                };
            }

            // Check for required WebAssembly APIs
            const requiredAPIs = [
                'compile',
                'instantiate',
                'validate',
                'Module',
                'Instance',
                'Memory',
                'Table'
            ];

            const missingAPIs = requiredAPIs.filter(api => typeof WebAssembly[api] === 'undefined');
            
            if (missingAPIs.length > 0) {
                return {
                    status: 'partial',
                    details: `WebAssembly available but missing APIs: ${missingAPIs.join(', ')}`,
                    missingAPIs
                };
            }

            // Test basic compilation with minimal WASM module
            const wasmBytes = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // magic number
                0x01, 0x00, 0x00, 0x00, // version
                0x01, 0x04, 0x01, 0x60, // type section: function type
                0x00, 0x00,             // no params, no returns
                0x03, 0x02, 0x01, 0x00, // function section: one function
                0x0a, 0x04, 0x01, 0x02, // code section: function body
                0x00, 0x0b              // empty function body + end
            ]);

            const module = await WebAssembly.compile(wasmBytes);
            
            if (!(module instanceof WebAssembly.Module)) {
                return {
                    status: 'partial',
                    details: 'WebAssembly compile succeeded but returned invalid module'
                };
            }

            return {
                status: 'supported',
                details: 'WebAssembly fully functional',
                apis: requiredAPIs,
                score: 100
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly support test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebAssembly module instantiation and execution
     */
    async testWebAssemblyInstantiation() {
        try {
            // WASM module that exports a simple add function
            const wasmBytes = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // magic
                0x01, 0x00, 0x00, 0x00, // version
                0x01, 0x07, 0x01, 0x60, // type section
                0x02, 0x7f, 0x7f, 0x01, // function type: (i32, i32) -> i32
                0x7f,                   // returns i32
                0x03, 0x02, 0x01, 0x00, // function section
                0x07, 0x07, 0x01, 0x03, // export section
                0x61, 0x64, 0x64, 0x00, // export "add" function 0
                0x0a, 0x09, 0x01, 0x07, // code section
                0x00, 0x20, 0x00, 0x20, // get local 0, get local 1
                0x01, 0x6a, 0x0b        // add, end
            ]);

            // Compile and instantiate
            const module = await WebAssembly.compile(wasmBytes);
            const instance = await WebAssembly.instantiate(module);

            if (!instance.exports.add) {
                return {
                    status: 'partial',
                    details: 'WebAssembly instantiation succeeded but exported function not found'
                };
            }

            // Test the exported function
            const result = instance.exports.add(5, 3);
            const expected = 8;

            if (result !== expected) {
                return {
                    status: 'partial',
                    details: `WebAssembly function executed but returned ${result}, expected ${expected}`,
                    actualResult: result,
                    expectedResult: expected
                };
            }

            return {
                status: 'supported',
                details: 'WebAssembly instantiation and execution successful',
                testResult: result,
                score: 100
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly instantiation test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebAssembly SIMD support
     */
    async testWebAssemblySIMD() {
        try {
            // Check if SIMD is supported through feature detection
            // This is a simple WASM module that uses v128 (SIMD) instructions
            const simdWasmBytes = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // magic
                0x01, 0x00, 0x00, 0x00, // version
                0x01, 0x05, 0x01, 0x60, // type section: function type
                0x00, 0x01, 0x7b,       // no params, returns v128
                0x03, 0x02, 0x01, 0x00, // function section
                0x07, 0x09, 0x01, 0x05, // export section
                0x74, 0x65, 0x73, 0x74, // export "test"
                0x00,                   // function 0
                0x0a, 0x0a, 0x01, 0x08, // code section
                0x00, 0xfd, 0x0c,       // v128.const
                0x01, 0x00, 0x00, 0x00, // constant data
                0x02, 0x00, 0x00, 0x00,
                0x03, 0x00, 0x00, 0x00,
                0x04, 0x00, 0x00, 0x00,
                0x0b                    // end
            ]);

            try {
                const isValid = WebAssembly.validate(simdWasmBytes);
                
                if (!isValid) {
                    return {
                        status: 'unsupported',
                        details: 'WebAssembly SIMD not supported - validation failed'
                    };
                }

                // Try to compile the SIMD module
                const module = await WebAssembly.compile(simdWasmBytes);
                const instance = await WebAssembly.instantiate(module);

                return {
                    status: 'supported',
                    details: 'WebAssembly SIMD fully supported',
                    score: 100
                };

            } catch (error) {
                if (error.message.includes('SIMD') || error.message.includes('v128')) {
                    return {
                        status: 'unsupported',
                        details: 'WebAssembly SIMD not supported',
                        reason: error.message
                    };
                }
                throw error;
            }

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly SIMD test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebAssembly threading support
     */
    async testWebAssemblyThreads() {
        try {
            // Check prerequisites for WASM threads
            const checks = {
                sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                atomics: typeof Atomics !== 'undefined',
                crossOriginIsolated: window.crossOriginIsolated === true
            };

            const missingPrerequisites = Object.entries(checks)
                .filter(([, supported]) => !supported)
                .map(([name]) => name);

            if (missingPrerequisites.length > 0) {
                return {
                    status: 'unsupported',
                    details: `WebAssembly threads not supported - missing: ${missingPrerequisites.join(', ')}`,
                    prerequisites: checks,
                    reason: 'SharedArrayBuffer and/or Atomics not available, or not cross-origin isolated'
                };
            }

            // Test SharedArrayBuffer creation and basic atomics
            try {
                const sharedBuffer = new SharedArrayBuffer(64);
                const sharedArray = new Int32Array(sharedBuffer);
                
                // Test atomic operations
                Atomics.store(sharedArray, 0, 42);
                const value = Atomics.load(sharedArray, 0);
                
                if (value !== 42) {
                    return {
                        status: 'partial',
                        details: 'SharedArrayBuffer available but atomic operations failed'
                    };
                }

                // Test basic threading WASM module (simplified)
                const threadWasmBytes = new Uint8Array([
                    0x00, 0x61, 0x73, 0x6d, // magic
                    0x01, 0x00, 0x00, 0x00, // version
                    0x01, 0x04, 0x01, 0x60, // type section
                    0x00, 0x00,             // no params, no returns
                    0x03, 0x02, 0x01, 0x00, // function section
                    0x05, 0x04, 0x01, 0x01, // memory section (shared memory)
                    0x01, 0x01,             // 1 page, max 1 page, shared
                    0x0a, 0x04, 0x01, 0x02, // code section
                    0x00, 0x0b              // empty function
                ]);

                const isValid = WebAssembly.validate(threadWasmBytes);
                
                return {
                    status: isValid ? 'supported' : 'partial',
                    details: isValid ? 
                        'WebAssembly threads fully supported' : 
                        'Threading prerequisites available but WASM threading validation failed',
                    prerequisites: checks,
                    sharedMemoryTest: value,
                    score: isValid ? 100 : 70
                };

            } catch (error) {
                return {
                    status: 'partial',
                    details: 'Threading prerequisites available but SharedArrayBuffer test failed',
                    prerequisites: checks,
                    error: error.message
                };
            }

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly threads test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebAssembly memory management
     */
    async testWebAssemblyMemory() {
        try {
            // Test WebAssembly.Memory creation and operations
            const initialPages = 1;
            const maxPages = 2;
            
            const memory = new WebAssembly.Memory({
                initial: initialPages,
                maximum: maxPages
            });

            if (!memory.buffer || !(memory.buffer instanceof ArrayBuffer)) {
                return {
                    status: 'partial',
                    details: 'WebAssembly.Memory created but buffer not accessible'
                };
            }

            const initialSize = memory.buffer.byteLength;
            const expectedInitialSize = initialPages * 65536; // 64KB per page

            if (initialSize !== expectedInitialSize) {
                return {
                    status: 'partial',
                    details: `Memory size mismatch: expected ${expectedInitialSize}, got ${initialSize}`
                };
            }

            // Test memory growth
            const growResult = memory.grow(1);
            if (growResult !== initialPages) {
                return {
                    status: 'partial',
                    details: `Memory grow returned ${growResult}, expected ${initialPages}`
                };
            }

            const newSize = memory.buffer.byteLength;
            const expectedNewSize = (initialPages + 1) * 65536;

            if (newSize !== expectedNewSize) {
                return {
                    status: 'partial',
                    details: `Memory size after grow: expected ${expectedNewSize}, got ${newSize}`
                };
            }

            // Test memory access
            const view = new Uint8Array(memory.buffer);
            view[0] = 255;
            view[1000] = 128;

            if (view[0] !== 255 || view[1000] !== 128) {
                return {
                    status: 'partial',
                    details: 'Memory access test failed'
                };
            }

            return {
                status: 'supported',
                details: 'WebAssembly memory management fully functional',
                memoryInfo: {
                    initialSize,
                    grownSize: newSize,
                    pageSize: 65536,
                    maxPages
                },
                score: 100
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly memory test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebAssembly performance
     */
    async testWebAssemblyPerformance() {
        try {
            // WASM module that performs a simple computation loop
            const fibWasmBytes = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // magic
                0x01, 0x00, 0x00, 0x00, // version
                0x01, 0x06, 0x01, 0x60, // type section
                0x01, 0x7f, 0x01, 0x7f, // (i32) -> i32
                0x03, 0x02, 0x01, 0x00, // function section
                0x07, 0x07, 0x01, 0x03, // export section
                0x66, 0x69, 0x62, 0x00, // export "fib"
                0x0a, 0x1f, 0x01, 0x1d, // code section
                0x00, 0x20, 0x00, 0x41, // fibonacci implementation
                0x02, 0x49, 0x04, 0x40,
                0x20, 0x00, 0x0f, 0x0b,
                0x20, 0x00, 0x41, 0x01,
                0x6b, 0x10, 0x00, 0x20,
                0x00, 0x41, 0x02, 0x6b,
                0x10, 0x00, 0x6a, 0x0b
            ]);

            const module = await WebAssembly.compile(fibWasmBytes);
            const instance = await WebAssembly.instantiate(module);

            if (!instance.exports.fib) {
                return {
                    status: 'partial',
                    details: 'Performance test module compiled but fib function not found'
                };
            }

            // Compare WASM vs JavaScript performance
            const testInput = 20;
            
            // JavaScript implementation
            function fibJS(n) {
                if (n < 2) return n;
                return fibJS(n - 1) + fibJS(n - 2);
            }

            // Warm up both implementations
            instance.exports.fib(10);
            fibJS(10);

            // Time WASM implementation
            const wasmStart = performance.now();
            const wasmResult = instance.exports.fib(testInput);
            const wasmTime = performance.now() - wasmStart;

            // Time JavaScript implementation
            const jsStart = performance.now();
            const jsResult = fibJS(testInput);
            const jsTime = performance.now() - jsStart;

            // Verify both give same result
            if (wasmResult !== jsResult) {
                return {
                    status: 'partial',
                    details: `Performance test failed: WASM result ${wasmResult} != JS result ${jsResult}`
                };
            }

            const speedup = jsTime / wasmTime;
            let performanceRating;
            let score;

            if (speedup > 2.0) {
                performanceRating = 'excellent';
                score = 100;
            } else if (speedup > 1.5) {
                performanceRating = 'good';
                score = 80;
            } else if (speedup > 1.0) {
                performanceRating = 'fair';
                score = 60;
            } else {
                performanceRating = 'poor';
                score = 30;
            }

            return {
                status: 'supported',
                details: `WebAssembly performance: ${performanceRating} (${speedup.toFixed(2)}x speedup)`,
                performance: {
                    wasmTime: wasmTime.toFixed(3),
                    jsTime: jsTime.toFixed(3),
                    speedup: speedup.toFixed(2),
                    rating: performanceRating,
                    testInput,
                    result: wasmResult
                },
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebAssembly performance test failed',
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
                console.warn('WebAssembly cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebAssemblyTests;
} else {
    window.WebAssemblyTests = WebAssemblyTests;
}