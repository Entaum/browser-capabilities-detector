/**
 * Gaming APIs Testing Suite
 * Tests gaming-related browser APIs including Gamepad, Audio, Fullscreen, etc.
 */

class GamingAPIsTests {
    constructor() {
        this.cleanupFunctions = [];
        this.gamepadListenerAdded = false;
    }

    /**
     * Get all Gaming API tests
     */
    getAllTests() {
        return [
            {
                name: 'Gamepad API',
                fn: () => this.testGamepadAPI(),
                category: 'gaming',
                priority: 10,
                description: 'Test gamepad detection and input handling'
            },
            {
                name: 'Web Audio API',
                fn: () => this.testWebAudioAPI(),
                category: 'gaming',
                priority: 9,
                description: 'Test audio context creation and capabilities'
            },
            {
                name: 'Pointer Lock API',
                fn: () => this.testPointerLockAPI(),
                category: 'gaming',
                priority: 8,
                description: 'Test mouse pointer lock functionality for FPS games'
            },
            {
                name: 'Fullscreen API',
                fn: () => this.testFullscreenAPI(),
                category: 'gaming',
                priority: 7,
                description: 'Test fullscreen mode capabilities'
            },
            {
                name: 'Visibility API',
                fn: () => this.testVisibilityAPI(),
                category: 'gaming',
                priority: 6,
                description: 'Test page visibility detection for game pause/resume'
            },
            {
                name: 'Performance API',
                fn: () => this.testPerformanceAPI(),
                category: 'gaming',
                priority: 5,
                description: 'Test high-resolution timing for game loops'
            },
            {
                name: 'Device Orientation',
                fn: () => this.testDeviceOrientationAPI(),
                category: 'gaming',
                priority: 4,
                description: 'Test device orientation for mobile gaming'
            },
            {
                name: 'Vibration API',
                fn: () => this.testVibrationAPI(),
                category: 'gaming',
                priority: 3,
                description: 'Test haptic feedback capabilities'
            }
        ];
    }

    /**
     * Test Gamepad API support and functionality
     */
    async testGamepadAPI() {
        try {
            // Check basic API availability
            if (!('getGamepads' in navigator)) {
                return {
                    status: 'unsupported',
                    details: 'Gamepad API not supported',
                    reason: 'navigator.getGamepads not available'
                };
            }

            // Get current gamepad state
            const gamepads = navigator.getGamepads();
            const connectedGamepads = Array.from(gamepads).filter(gamepad => gamepad !== null);
            
            // Test gamepad connection events
            let eventSupport = {
                gamepadconnected: 'gamepadconnected' in window,
                gamepaddisconnected: 'gamepaddisconnected' in window
            };

            const gamepadInfo = connectedGamepads.map(gamepad => ({
                id: gamepad.id,
                index: gamepad.index,
                connected: gamepad.connected,
                mapping: gamepad.mapping,
                buttonsCount: gamepad.buttons.length,
                axesCount: gamepad.axes.length,
                timestamp: gamepad.timestamp
            }));

            // Test gamepad polling capability
            let pollingWorks = false;
            try {
                const testGamepads = navigator.getGamepads();
                pollingWorks = Array.isArray(testGamepads);
            } catch (error) {
                pollingWorks = false;
            }

            const score = connectedGamepads.length > 0 ? 100 : 
                         (pollingWorks && eventSupport.gamepadconnected) ? 80 : 
                         pollingWorks ? 60 : 30;

            let status;
            if (score >= 70) {
                status = 'supported';
            } else if (score >= 30) {
                status = 'partial';
            } else {
                status = 'unsupported';
            }

            return {
                status,
                details: `Gamepad API functional with ${connectedGamepads.length} connected gamepad(s)`,
                gamepadInfo,
                connectedCount: connectedGamepads.length,
                eventSupport,
                pollingSupport: pollingWorks,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Gamepad API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Web Audio API support and capabilities
     */
    async testWebAudioAPI() {
        try {
            // Check for AudioContext availability
            const AudioContextClass = window.AudioContext;
            
            if (!AudioContextClass) {
                return {
                    status: 'unsupported',
                    details: 'Web Audio API not supported',
                    reason: 'AudioContext not available'
                };
            }

            // Create audio context
            const audioContext = new AudioContextClass();
            this.cleanupFunctions.push(() => {
                if (audioContext.state !== 'closed') {
                    audioContext.close();
                }
            });

            // Test basic audio context properties
            const contextInfo = {
                sampleRate: audioContext.sampleRate,
                baseLatency: audioContext.baseLatency || 'unknown',
                outputLatency: audioContext.outputLatency || 'unknown',
                state: audioContext.state,
                maxChannelCount: audioContext.destination.maxChannelCount
            };

            // Test audio node creation
            const nodeTests = {
                oscillator: false,
                gain: false,
                analyser: false,
                biquadFilter: false,
                convolver: false,
                delay: false,
                panner: false,
                scriptProcessor: false,
                audioWorklet: false
            };

            try {
                const oscillator = audioContext.createOscillator();
                nodeTests.oscillator = !!oscillator;
                oscillator.disconnect();
            } catch (e) {}

            try {
                const gain = audioContext.createGain();
                nodeTests.gain = !!gain;
                gain.disconnect();
            } catch (e) {}

            try {
                const analyser = audioContext.createAnalyser();
                nodeTests.analyser = !!analyser;
                analyser.disconnect();
            } catch (e) {}

            try {
                const filter = audioContext.createBiquadFilter();
                nodeTests.biquadFilter = !!filter;
                filter.disconnect();
            } catch (e) {}

            try {
                const convolver = audioContext.createConvolver();
                nodeTests.convolver = !!convolver;
                convolver.disconnect();
            } catch (e) {}

            try {
                const delay = audioContext.createDelay();
                nodeTests.delay = !!delay;
                delay.disconnect();
            } catch (e) {}

            try {
                const panner = audioContext.createPanner();
                nodeTests.panner = !!panner;
                panner.disconnect();
            } catch (e) {}

            try {
                const scriptProcessor = audioContext.createScriptProcessor(256, 1, 1);
                nodeTests.scriptProcessor = !!scriptProcessor;
                scriptProcessor.disconnect();
            } catch (e) {}

            try {
                nodeTests.audioWorklet = !!audioContext.audioWorklet;
            } catch (e) {}

            const supportedNodes = Object.values(nodeTests).filter(Boolean).length;
            const totalNodes = Object.keys(nodeTests).length;
            const score = Math.round((supportedNodes / totalNodes) * 100);

            return {
                status: supportedNodes > 5 ? 'supported' : 'partial',
                details: `Web Audio API functional with ${supportedNodes}/${totalNodes} node types`,
                contextInfo,
                nodeSupport: nodeTests,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Web Audio API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Pointer Lock API support
     */
    async testPointerLockAPI() {
        try {
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            testElement.style.width = '1px';
            testElement.style.height = '1px';
            testElement.style.visibility = 'hidden';
            document.body.appendChild(testElement);

            this.cleanupFunctions.push(() => {
                if (testElement.parentNode) {
                    testElement.parentNode.removeChild(testElement);
                }
            });

            // Check for Pointer Lock API methods
            const methods = [
                'requestPointerLock',
                'webkitRequestPointerLock',
                'mozRequestPointerLock',
                'msRequestPointerLock'
            ];

            const supportedMethod = methods.find(method => method in testElement);

            if (!supportedMethod) {
                return {
                    status: 'unsupported',
                    details: 'Pointer Lock API not supported',
                    reason: 'requestPointerLock method not found'
                };
            }

            // Check for document-level API
            const documentMethods = {
                exitPointerLock: 'exitPointerLock' in document || 
                                'webkitExitPointerLock' in document ||
                                'mozExitPointerLock' in document ||
                                'msExitPointerLock' in document,
                pointerLockElement: 'pointerLockElement' in document ||
                                   'webkitPointerLockElement' in document ||
                                   'mozPointerLockElement' in document ||
                                   'msPointerLockElement' in document
            };

            // Check for pointer lock events
            const eventSupport = {
                pointerlockchange: 'onpointerlockchange' in document ||
                                  'onwebkitpointerlockchange' in document ||
                                  'onmozpointerlockchange' in document,
                pointerlockerror: 'onpointerlockerror' in document ||
                                 'onwebkitpointerlockerror' in document ||
                                 'onmozpointerlockerror' in document
            };

            const supportedFeatures = [
                supportedMethod,
                documentMethods.exitPointerLock,
                documentMethods.pointerLockElement,
                eventSupport.pointerlockchange,
                eventSupport.pointerlockerror
            ].filter(Boolean).length;

            const score = (supportedFeatures / 5) * 100;

            return {
                status: supportedFeatures >= 3 ? 'supported' : 'partial',
                details: `Pointer Lock API available with ${supportedFeatures}/5 features`,
                supportedMethod,
                documentMethods,
                eventSupport,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Pointer Lock API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Fullscreen API support
     */
    async testFullscreenAPI() {
        try {
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            testElement.style.width = '1px';
            testElement.style.height = '1px';
            testElement.style.visibility = 'hidden';
            document.body.appendChild(testElement);

            this.cleanupFunctions.push(() => {
                if (testElement.parentNode) {
                    testElement.parentNode.removeChild(testElement);
                }
            });

            // Check for Fullscreen API methods
            const requestMethods = [
                'requestFullscreen',
                'webkitRequestFullscreen',
                'webkitRequestFullScreen',
                'mozRequestFullScreen',
                'msRequestFullscreen'
            ];

            const supportedRequestMethod = requestMethods.find(method => method in testElement);

            if (!supportedRequestMethod) {
                return {
                    status: 'unsupported',
                    details: 'Fullscreen API not supported',
                    reason: 'requestFullscreen method not found'
                };
            }

            // Check document-level methods and properties
            const documentAPI = {
                exitFullscreen: 'exitFullscreen' in document ||
                               'webkitExitFullscreen' in document ||
                               'webkitCancelFullScreen' in document ||
                               'mozCancelFullScreen' in document ||
                               'msExitFullscreen' in document,
                
                fullscreenElement: 'fullscreenElement' in document ||
                                  'webkitFullscreenElement' in document ||
                                  'webkitCurrentFullScreenElement' in document ||
                                  'mozFullScreenElement' in document ||
                                  'msFullscreenElement' in document,
                
                fullscreenEnabled: 'fullscreenEnabled' in document ||
                                  'webkitFullscreenEnabled' in document ||
                                  'webkitCancelFullScreen' in document ||
                                  'mozFullScreenEnabled' in document ||
                                  'msFullscreenEnabled' in document
            };

            // Check for fullscreen events
            const eventSupport = {
                fullscreenchange: 'onfullscreenchange' in document ||
                                 'onwebkitfullscreenchange' in document ||
                                 'onmozfullscreenchange' in document ||
                                 'onMSFullscreenChange' in document,
                
                fullscreenerror: 'onfullscreenerror' in document ||
                                'onwebkitfullscreenerror' in document ||
                                'onmozfullscreenerror' in document ||
                                'onMSFullscreenError' in document
            };

            const supportedFeatures = [
                supportedRequestMethod,
                documentAPI.exitFullscreen,
                documentAPI.fullscreenElement,
                documentAPI.fullscreenEnabled,
                eventSupport.fullscreenchange,
                eventSupport.fullscreenerror
            ].filter(Boolean).length;

            const score = (supportedFeatures / 6) * 100;

            return {
                status: supportedFeatures >= 4 ? 'supported' : 'partial',
                details: `Fullscreen API available with ${supportedFeatures}/6 features`,
                supportedRequestMethod,
                documentAPI,
                eventSupport,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Fullscreen API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Page Visibility API
     */
    async testVisibilityAPI() {
        try {
            // Check for visibility properties
            const visibilityProperties = {
                hidden: 'hidden' in document ||
                       'webkitHidden' in document ||
                       'mozHidden' in document ||
                       'msHidden' in document,
                
                visibilityState: 'visibilityState' in document ||
                                'webkitVisibilityState' in document ||
                                'mozVisibilityState' in document ||
                                'msVisibilityState' in document
            };

            // Check for visibility change events
            const eventSupport = 'onvisibilitychange' in document ||
                                'onwebkitvisibilitychange' in document ||
                                'onmozvisibilitychange' in document ||
                                'onmsvisibilitychange' in document;

            if (!visibilityProperties.hidden && !visibilityProperties.visibilityState) {
                return {
                    status: 'unsupported',
                    details: 'Page Visibility API not supported',
                    reason: 'Neither hidden nor visibilityState properties available'
                };
            }

            // Test current visibility state
            let currentState = 'unknown';
            if (document.visibilityState) {
                currentState = document.visibilityState;
            } else if (document.webkitVisibilityState) {
                currentState = document.webkitVisibilityState;
            } else if (document.mozVisibilityState) {
                currentState = document.mozVisibilityState;
            } else if (document.msVisibilityState) {
                currentState = document.msVisibilityState;
            }

            const supportedFeatures = [
                visibilityProperties.hidden,
                visibilityProperties.visibilityState,
                eventSupport
            ].filter(Boolean).length;

            const score = (supportedFeatures / 3) * 100;

            return {
                status: supportedFeatures >= 2 ? 'supported' : 'partial',
                details: `Page Visibility API available with ${supportedFeatures}/3 features`,
                visibilityProperties,
                eventSupport,
                currentState,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Page Visibility API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Performance API for high-resolution timing
     */
    async testPerformanceAPI() {
        try {
            if (!('performance' in window)) {
                return {
                    status: 'unsupported',
                    details: 'Performance API not supported',
                    reason: 'window.performance not available'
                };
            }

            const performanceFeatures = {
                now: 'now' in performance,
                timing: 'timing' in performance,
                navigation: 'navigation' in performance,
                mark: 'mark' in performance,
                measure: 'measure' in performance,
                getEntries: 'getEntries' in performance,
                observer: 'PerformanceObserver' in window
            };

            // Test high-resolution timing
            let highResolution = false;
            if (performance.now) {
                const start = performance.now();
                const end = performance.now();
                // High-resolution timing should provide sub-millisecond precision
                highResolution = (end - start) !== Math.floor(end - start) || 
                                (start % 1 !== 0) || (end % 1 !== 0);
            }

            // Test timing precision
            let timingPrecision = 'unknown';
            if (performance.now) {
                const timestamps = [];
                for (let i = 0; i < 10; i++) {
                    timestamps.push(performance.now());
                }
                
                const deltas = timestamps.slice(1).map((t, i) => t - timestamps[i]);
                const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                
                if (avgDelta < 0.1) {
                    timingPrecision = 'high';
                } else if (avgDelta < 1) {
                    timingPrecision = 'medium';
                } else {
                    timingPrecision = 'low';
                }
            }

            const supportedFeatures = Object.values(performanceFeatures).filter(Boolean).length;
            const score = Math.min((supportedFeatures / 7) * 100, 100);

            return {
                status: supportedFeatures >= 4 ? 'supported' : 'partial',
                details: `Performance API available with ${supportedFeatures}/7 features`,
                features: performanceFeatures,
                highResolution,
                timingPrecision,
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
     * Test Device Orientation API
     */
    async testDeviceOrientationAPI() {
        try {
            // Check for device orientation events
            const orientationSupport = {
                deviceorientation: 'ondeviceorientation' in window,
                devicemotion: 'ondevicemotion' in window,
                orientationchange: 'onorientationchange' in window || 'orientation' in screen
            };

            if (!orientationSupport.deviceorientation && !orientationSupport.devicemotion) {
                return {
                    status: 'unsupported',
                    details: 'Device Orientation API not supported',
                    reason: 'Device orientation/motion events not available'
                };
            }

            // Check for screen orientation
            const screenOrientation = {
                angle: 'orientation' in screen || 'orientation' in window,
                lock: 'orientation' in screen && 'lock' in screen.orientation,
                unlock: 'orientation' in screen && 'unlock' in screen.orientation,
                type: 'orientation' in screen && 'type' in screen.orientation
            };

            // Test permission requirements (for modern browsers)
            let permissionRequired = false;
            if ('permissions' in navigator && 'query' in navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'accelerometer' });
                    permissionRequired = permission.state !== 'granted';
                } catch (e) {
                    // Permission API might not support accelerometer
                }
            }

            const supportedFeatures = [
                orientationSupport.deviceorientation,
                orientationSupport.devicemotion,
                orientationSupport.orientationchange,
                screenOrientation.angle,
                screenOrientation.lock
            ].filter(Boolean).length;

            const score = (supportedFeatures / 5) * 100;

            return {
                status: supportedFeatures >= 2 ? 'supported' : 'partial',
                details: `Device Orientation API available with ${supportedFeatures}/5 features`,
                orientationSupport,
                screenOrientation,
                permissionRequired,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Device Orientation API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Vibration API
     */
    async testVibrationAPI() {
        try {
            if (!('vibrate' in navigator)) {
                return {
                    status: 'unsupported',
                    details: 'Vibration API not supported',
                    reason: 'navigator.vibrate not available'
                };
            }

            // Test if vibrate method is callable (doesn't necessarily mean it will vibrate)
            let vibrateCallable = false;
            try {
                // Try a minimal vibration (0ms - should not actually vibrate)
                const result = navigator.vibrate(0);
                vibrateCallable = typeof result === 'boolean';
            } catch (e) {
                vibrateCallable = false;
            }

            // Test different vibration patterns support
            const patternTests = {
                singleValue: false,
                array: false,
                pattern: false
            };

            try {
                patternTests.singleValue = navigator.vibrate(0);
            } catch (e) {}

            try {
                patternTests.array = navigator.vibrate([]);
            } catch (e) {}

            try {
                patternTests.pattern = navigator.vibrate([100, 50, 100]);
            } catch (e) {}

            const supportedPatterns = Object.values(patternTests).filter(Boolean).length;
            const score = vibrateCallable ? (supportedPatterns / 3) * 100 : 0;

            let status;
            if (score >= 70) {
                status = 'supported';
            } else if (score >= 30) {
                status = 'partial';
            } else if (score > 0) {
                status = 'partial';
            } else {
                status = 'unsupported';
            }

            return {
                status,
                details: `Vibration API with ${supportedPatterns}/3 pattern types (callable: ${vibrateCallable})`,
                callable: vibrateCallable,
                patternSupport: patternTests,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Vibration API test failed',
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
                console.warn('Gaming API cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamingAPIsTests;
} else {
    window.GamingAPIsTests = GamingAPIsTests;
}