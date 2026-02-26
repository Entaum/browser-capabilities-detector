/**
 * Communication APIs Testing Suite
 * Tests communication-related browser APIs including WebRTC, WebSockets, etc.
 */

class CommunicationTests {
    constructor() {
        this.cleanupFunctions = [];
    }

    /**
     * Get all Communication API tests
     */
    getAllTests() {
        return [
            {
                name: 'WebSocket API',
                fn: () => this.testWebSocketAPI(),
                category: 'communication',
                priority: 10,
                description: 'Test WebSocket connection capabilities'
            },
            {
                name: 'WebRTC API',
                fn: () => this.testWebRTCAPI(),
                category: 'communication',
                priority: 9,
                description: 'Test peer-to-peer communication support'
            },
            {
                name: 'Server-Sent Events',
                fn: () => this.testServerSentEvents(),
                category: 'communication',
                priority: 8,
                description: 'Test server-sent events (EventSource) support'
            },
            {
                name: 'Fetch API',
                fn: () => this.testFetchAPI(),
                category: 'communication',
                priority: 7,
                description: 'Test modern HTTP request capabilities'
            },
            {
                name: 'WebRTC Data Channels',
                fn: () => this.testWebRTCDataChannels(),
                category: 'communication',
                priority: 6,
                description: 'Test WebRTC data channel functionality',
                dependencies: ['WebRTC API']
            }
        ];
    }

    /**
     * Test WebSocket API support
     */
    async testWebSocketAPI() {
        try {
            // Check basic WebSocket support
            if (!window.WebSocket) {
                return {
                    status: 'unsupported',
                    details: 'WebSocket API not available',
                    reason: 'Browser does not support WebSocket'
                };
            }

            // Test WebSocket constructor
            let testSocket = null;
            let connectionTest = false;
            
            try {
                // Use a test WebSocket echo service (non-blocking test)
                // Note: This may fail due to network issues - we handle it gracefully
                // WebSocket connection errors are expected and handled silently
                try {
                    testSocket = new WebSocket('wss://echo.websocket.events/');
                } catch (wsError) {
                    // Synchronous error during WebSocket creation
                    // This is rare but can happen in some environments
                    return {
                        status: 'partial',
                        details: 'WebSocket API available but connection test failed',
                        score: 40
                    };
                }
                
                const testPromise = new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        if (testSocket) {
                            try {
                                testSocket.close();
                            } catch (e) {
                                // Ignore close errors
                            }
                        }
                        resolve('timeout');
                    }, 3000);

                    testSocket.onopen = () => {
                        clearTimeout(timeout);
                        connectionTest = true;
                        try {
                            testSocket.send('test');
                        } catch (e) {
                            resolve('error');
                        }
                    };

                    testSocket.onmessage = (event) => {
                        clearTimeout(timeout);
                        if (event.data === 'test') {
                            resolve('success');
                        } else {
                            resolve('partial');
                        }
                    };

                    testSocket.onerror = (error) => {
                        clearTimeout(timeout);
                        // Suppress error - don't log or re-throw
                        resolve('error');
                    };
                    
                    testSocket.onclose = () => {
                        // Connection closed - this is normal
                    };
                });

                const result = await testPromise;
                
                // Always close the connection safely
                if (testSocket) {
                    try {
                        if (testSocket.readyState === WebSocket.OPEN || testSocket.readyState === WebSocket.CONNECTING) {
                            testSocket.close();
                        }
                    } catch (e) {
                        // Ignore close errors
                    }
                }

                const capabilities = {
                    binaryType: testSocket ? testSocket.binaryType : 'unknown',
                    extensions: testSocket ? testSocket.extensions : '',
                    protocol: testSocket ? testSocket.protocol : '',
                    readyState: testSocket ? testSocket.readyState : -1
                };

                if (result === 'success') {
                    return {
                        status: 'supported',
                        details: 'WebSocket API fully functional with echo test',
                        capabilities,
                        score: 100
                    };
                } else if (result === 'partial') {
                    return {
                        status: 'partial',
                        details: 'WebSocket API available but echo test partially failed',
                        capabilities,
                        score: 75
                    };
                } else if (result === 'timeout') {
                    return {
                        status: 'partial',
                        details: 'WebSocket API available but connection test timed out',
                        capabilities,
                        score: 60
                    };
                } else {
                    return {
                        status: 'partial',
                        details: 'WebSocket API available but connection test failed',
                        capabilities,
                        score: 40
                    };
                }

            } catch (constructorError) {
                return {
                    status: 'partial',
                    details: 'WebSocket API available but constructor test failed',
                    error: constructorError.message,
                    score: 20
                };
            }

        } catch (error) {
            return {
                status: 'error',
                details: 'WebSocket API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebRTC API support
     */
    async testWebRTCAPI() {
        try {
            // Check for WebRTC support
            const hasRTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
            const hasGetUserMedia = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices?.getUserMedia);

            if (!hasRTCPeerConnection) {
                return {
                    status: 'unsupported',
                    details: 'WebRTC PeerConnection not available',
                    reason: 'RTCPeerConnection not supported'
                };
            }

            // Test RTCPeerConnection creation
            const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            let peerConnection = null;

            try {
                peerConnection = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                // Test basic WebRTC capabilities
                const capabilities = {
                    canCreateOffer: typeof peerConnection.createOffer === 'function',
                    canCreateAnswer: typeof peerConnection.createAnswer === 'function',
                    canAddIceCandidate: typeof peerConnection.addIceCandidate === 'function',
                    canCreateDataChannel: typeof peerConnection.createDataChannel === 'function',
                    hasGetUserMedia,
                    connectionState: peerConnection.connectionState || 'unknown',
                    iceConnectionState: peerConnection.iceConnectionState || 'unknown'
                };

                // Test offer creation
                let offerTest = false;
                try {
                    const offer = await peerConnection.createOffer();
                    offerTest = !!(offer && offer.sdp);
                } catch (offerError) {
                    console.warn('WebRTC offer creation failed:', offerError);
                }

                peerConnection.close();

                const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
                const totalFeatures = Object.keys(capabilities).length;
                const score = Math.round((supportedFeatures / totalFeatures) * 100);

                return {
                    status: score > 60 ? 'supported' : 'partial',
                    details: `WebRTC API functional with ${supportedFeatures}/${totalFeatures} features`,
                    capabilities: {
                        ...capabilities,
                        offerCreationWorked: offerTest
                    },
                    score
                };

            } catch (peerConnectionError) {
                return {
                    status: 'partial',
                    details: 'WebRTC API available but PeerConnection creation failed',
                    error: peerConnectionError.message,
                    score: 25
                };
            }

        } catch (error) {
            return {
                status: 'error',
                details: 'WebRTC API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Server-Sent Events support
     */
    async testServerSentEvents() {
        try {
            // Check EventSource support
            if (!window.EventSource) {
                return {
                    status: 'unsupported',
                    details: 'Server-Sent Events (EventSource) not available',
                    reason: 'EventSource not supported by browser'
                };
            }

            // Test EventSource constructor and properties
            const capabilities = {
                hasEventSource: true,
                hasReadyState: 'readyState' in EventSource.prototype,
                hasUrl: 'url' in EventSource.prototype,
                hasWithCredentials: 'withCredentials' in EventSource.prototype,
                hasClose: 'close' in EventSource.prototype
            };

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const score = Math.round((supportedFeatures / Object.keys(capabilities).length) * 100);

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
                details: `Server-Sent Events API with ${supportedFeatures}/${Object.keys(capabilities).length} features`,
                capabilities,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Server-Sent Events test failed',
                error: error.message
            };
        }
    }

    /**
     * Test Fetch API support
     */
    async testFetchAPI() {
        try {
            // Check Fetch API support
            if (!window.fetch) {
                return {
                    status: 'unsupported',
                    details: 'Fetch API not available',
                    reason: 'Browser does not support fetch()'
                };
            }

            // Test basic fetch capabilities
            const capabilities = {
                hasFetch: true,
                hasRequest: !!(window.Request),
                hasResponse: !!(window.Response),
                hasHeaders: !!(window.Headers),
                hasAbortController: !!(window.AbortController),
                hasReadableStream: !!(window.ReadableStream)
            };

            // Test a simple fetch operation
            let fetchTest = false;
            try {
                // Test with a data URL to avoid network issues
                const response = await fetch('data:text/plain;base64,dGVzdA=='); // "test" in base64
                fetchTest = response.ok && response.status === 200;
            } catch (fetchError) {
                console.warn('Fetch test failed:', fetchError);
            }

            const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
            const score = Math.round((supportedFeatures / Object.keys(capabilities).length) * 100);

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
                details: `Fetch API functional with ${supportedFeatures}/${Object.keys(capabilities).length} features`,
                capabilities: {
                    ...capabilities,
                    basicFetchWorked: fetchTest
                },
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'Fetch API test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebRTC Data Channels
     */
    async testWebRTCDataChannels() {
        try {
            const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            
            if (!RTCPeerConnection) {
                return {
                    status: 'unsupported',
                    details: 'WebRTC not available for data channel testing'
                };
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            try {
                // Create a data channel
                const dataChannel = peerConnection.createDataChannel('test', {
                    ordered: true,
                    maxRetransmits: 3
                });

                const capabilities = {
                    canCreateDataChannel: true,
                    hasLabel: !!(dataChannel.label),
                    hasReadyState: 'readyState' in dataChannel,
                    hasOrdered: 'ordered' in dataChannel,
                    hasMaxRetransmits: 'maxRetransmits' in dataChannel,
                    hasSend: typeof dataChannel.send === 'function',
                    hasClose: typeof dataChannel.close === 'function'
                };

                dataChannel.close();
                peerConnection.close();

                const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
                const score = Math.round((supportedFeatures / Object.keys(capabilities).length) * 100);

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
                    details: `WebRTC Data Channels functional with ${supportedFeatures}/${Object.keys(capabilities).length} features`,
                    capabilities,
                    score
                };

            } catch (dataChannelError) {
                peerConnection.close();
                return {
                    status: 'partial',
                    details: 'WebRTC available but data channel creation failed',
                    error: dataChannelError.message,
                    score: 30
                };
            }

        } catch (error) {
            return {
                status: 'error',
                details: 'WebRTC Data Channels test failed',
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
                console.warn('Communication API cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationTests;
} else {
    window.CommunicationTests = CommunicationTests;
}