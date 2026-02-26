/**
 * Browser Detection and System Information Module
 * Detects browser, OS, and system capabilities for compatibility testing
 */

class BrowserDetector {
    constructor() {
        try {
            this.userAgent = navigator.userAgent;
            this.browserInfo = this.detectBrowser();
            this.systemInfo = this.detectSystem();
            this.capabilities = this.detectCapabilities();
            console.log('✅ Browser detector initialized successfully');
        } catch (error) {
            console.error('❌ Browser detector initialization failed:', error);
            // Provide fallback values
            this.userAgent = 'Unknown';
            this.browserInfo = { name: 'Unknown', version: '0', engine: 'Unknown', isSupported: false };
            this.systemInfo = { os: 'Unknown', version: '', mobile: false, touchEnabled: false };
            this.capabilities = {};
        }
    }

    /**
     * Detect browser name and version using User-Agent Client Hints + feature detection + UA parsing
     */
    detectBrowser() {
        const ua = this.userAgent;
        let browser = {
            name: 'Unknown',
            version: '0',
            engine: 'Unknown',
            isSupported: false
        };

        // First try User-Agent Client Hints API for accurate brand detection
        const brandInfo = this.getBrowserBrandFromClientHints();
        if (brandInfo.name && brandInfo.name !== 'Unknown') {
            browser.name = brandInfo.name;
            browser.version = brandInfo.version || this.extractVersionFromUA(ua, browser.name);
            browser.engine = this.getEngineFromBrowser(browser.name);
            browser.isSupported = this.isBrowserSupported(browser.name);
            // Store the original brand for potential fallback display
            browser.originalBrand = brandInfo.name;
            return browser;
        }

        // Fallback to traditional UA parsing
        // Chrome (including Chromium-based browsers)
        if (window.chrome && ua.includes('Chrome')) {
            const isEdge = ua.includes('Edg/');
            const isOpera = ua.includes('OPR/');
            const isBrave = window.navigator.brave;
            
            if (isEdge) {
                browser.name = 'Edge';
                browser.version = this.extractVersion(ua, /Edg\/(\d+[\.\d]*)/);
            } else if (isOpera) {
                browser.name = 'Opera';
                browser.version = this.extractVersion(ua, /OPR\/(\d+[\.\d]*)/);
            } else if (isBrave) {
                browser.name = 'Brave';
                browser.version = this.extractVersion(ua, /Chrome\/(\d+[\.\d]*)/);
            } else {
                browser.name = 'Chrome';
                browser.version = this.extractVersion(ua, /Chrome\/(\d+[\.\d]*)/);
            }
            browser.engine = 'Blink';
            browser.isSupported = true;
        }
        // Firefox
        else if (ua.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.version = this.extractVersion(ua, /Firefox\/(\d+[\.\d]*)/);
            browser.engine = 'Gecko';
            browser.isSupported = true;
        }
        // Safari
        else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser.name = 'Safari';
            browser.version = this.extractVersion(ua, /Version\/(\d+[\.\d]*)/);
            browser.engine = 'WebKit';
            browser.isSupported = true;
        }
        // Internet Explorer / Legacy Edge
        else if (ua.includes('MSIE') || ua.includes('Trident')) {
            browser.name = 'Internet Explorer';
            browser.version = this.extractVersion(ua, /(?:MSIE |rv:)(\d+[\.\d]*)/);
            browser.engine = 'Trident';
            browser.isSupported = false;
        }
        // Final fallback: if we still have Unknown, default to Chrome for Chromium-based browsers
        else if (browser.name === 'Unknown' && window.chrome) {
            console.log('🔍 Unknown Chromium-based browser detected, defaulting to Chrome');
            // Check if we have brand info from Client Hints
            const brandInfo = this.getBrowserBrandFromClientHints();
            if (brandInfo.name && brandInfo.name !== 'Unknown') {
                browser.name = `Chrome (${brandInfo.name})`;
                browser.originalBrand = brandInfo.name;
                console.log(`🎯 Showing as Chrome with brand: ${brandInfo.name}`);
            } else {
                browser.name = 'Chrome';
            }
            browser.version = this.extractVersion(ua, /Chrome\/(\d+[\.\d]*)/);
            browser.engine = 'Blink';
            browser.isSupported = true;
        }

        return browser;
    }

    /**
     * Detect operating system and platform information
     */
    detectSystem() {
        const ua = this.userAgent;
        const platform = navigator.platform;
        
        let system = {
            os: 'Unknown',
            version: '',
            architecture: '',
            mobile: false,
            touchEnabled: false
        };

        // Mobile detection
        system.mobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        system.touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // OS Detection
        if (ua.includes('Windows NT')) {
            system.os = 'Windows';
            const version = this.extractVersion(ua, /Windows NT (\d+[\.\d]*)/);
            system.version = this.getWindowsVersion(version);
        } else if (ua.includes('Mac OS X') || ua.includes('macOS')) {
            system.os = 'macOS';
            system.version = this.extractVersion(ua, /Mac OS X (\d+[_\.\d]*)/);
        } else if (ua.includes('Linux')) {
            system.os = 'Linux';
            if (ua.includes('Ubuntu')) system.version = 'Ubuntu';
            else if (ua.includes('Android')) {
                system.os = 'Android';
                system.version = this.extractVersion(ua, /Android (\d+[\.\d]*)/);
                system.mobile = true;
            }
        } else if (ua.includes('iPhone OS') || ua.includes('OS ')) {
            system.os = 'iOS';
            system.version = this.extractVersion(ua, /OS (\d+[_\.\d]*)/);
            system.mobile = true;
        }

        // Architecture detection
        if (platform.includes('64') || ua.includes('x64') || ua.includes('Win64')) {
            system.architecture = 'x64';
        } else if (platform.includes('86') || ua.includes('i386')) {
            system.architecture = 'x86';
        } else if (ua.includes('ARM') || platform.includes('ARM')) {
            system.architecture = 'ARM';
        }

        return system;
    }

    /**
     * Detect basic browser capabilities for early compatibility assessment
     */
    detectCapabilities() {
        return {
            // JavaScript Features
            es6Support: this.checkES6Support(),
            webAssembly: typeof WebAssembly === 'object',
            serviceWorker: 'serviceWorker' in navigator,
            webGL: this.checkWebGLSupport(),
            
            // Storage
            localStorage: this.checkStorageSupport('localStorage'),
            sessionStorage: this.checkStorageSupport('sessionStorage'),
            indexedDB: 'indexedDB' in window,
            
            // Network
            fetch: 'fetch' in window,
            webSockets: 'WebSocket' in window,
            webRTC: 'RTCPeerConnection' in window,
            
            // Graphics & Audio
            canvas2D: this.checkCanvas2DSupport(),
            webAudio: 'AudioContext' in window,
            
            // Device Features
            gamepad: 'getGamepads' in navigator,
            geolocation: 'geolocation' in navigator,
            deviceMotion: 'DeviceMotionEvent' in window,
            
            // Performance
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: navigator.deviceMemory || 'unknown',
            connectionType: this.getConnectionType()
        };
    }

    /**
     * Extract version number from user agent string
     */
    extractVersion(ua, regex) {
        const match = ua.match(regex);
        return match ? match[1] : '0';
    }

    /**
     * Get browser brand information from User-Agent Client Hints API
     */
    getBrowserBrandFromClientHints() {
        let brandInfo = { name: 'Unknown', version: '' };
        
        try {
            // Check if User-Agent Client Hints API is available
            if (navigator.userAgentData && navigator.userAgentData.brands) {
                const brands = navigator.userAgentData.brands;
                
                // Find the most specific brand (usually the actual browser)
                // Skip generic brands like "Chromium" and "Not_A Brand"
                const specificBrand = brands.find(brand => 
                    brand.brand && 
                    !brand.brand.includes('Not') && 
                    !brand.brand.includes('Chromium') &&
                    brand.brand !== 'Google Chrome' // We'll handle Chrome specially
                );
                
                if (specificBrand) {
                    brandInfo.name = specificBrand.brand;
                    brandInfo.version = specificBrand.version;
                } else {
                    // Fallback to Chrome if only generic brands found and we detect Chrome features
                    const chromeBrand = brands.find(brand => 
                        brand.brand === 'Google Chrome' || 
                        brand.brand === 'Chrome'
                    );
                    if (chromeBrand && window.chrome) {
                        brandInfo.name = 'Chrome';
                        brandInfo.version = chromeBrand.version;
                    }
                    // If we still don't have a brand but this looks like a Chromium browser, return Unknown
                    // so the fallback logic can handle it properly
                }
                
                console.log('🔍 Client Hints brands detected:', brands);
                console.log('🎯 Selected brand:', brandInfo);
            }
            
            // Also check sec-ch-ua header if available
            if (brandInfo.name === 'Unknown' && navigator.userAgentData) {
                // Try to get high entropy values for more detailed info
                navigator.userAgentData.getHighEntropyValues(['brands', 'fullVersionList'])
                    .then(highEntropyData => {
                        if (highEntropyData.fullVersionList) {
                            console.log('🔍 High entropy brand data:', highEntropyData.fullVersionList);
                        }
                    })
                    .catch(error => {
                        console.log('ℹ️ High entropy client hints not available:', error.message);
                    });
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
            'Ray Browser': /Chrome\/(\d+[\.\d]*)/,
            'Arc': /Chrome\/(\d+[\.\d]*)/,
            'Brave': /Chrome\/(\d+[\.\d]*)/,
            'Vivaldi': /Vivaldi\/(\d+[\.\d]*)/,
            'Opera': /OPR\/(\d+[\.\d]*)/,
            'Edge': /Edg\/(\d+[\.\d]*)/,
            'Chrome': /Chrome\/(\d+[\.\d]*)/,
            'Firefox': /Firefox\/(\d+[\.\d]*)/,
            'Safari': /Version\/(\d+[\.\d]*)/
        };
        
        const pattern = patterns[browserName] || patterns['Chrome'];
        return this.extractVersion(ua, pattern);
    }

    /**
     * Get rendering engine based on browser name
     */
    getEngineFromBrowser(browserName) {
        const engines = {
            'Chrome': 'Blink',
            'Edge': 'Blink',
            'Opera': 'Blink',
            'Brave': 'Blink',
            'Vivaldi': 'Blink',
            'Arc': 'Blink',
            'Ray Browser': 'Blink',
            'Firefox': 'Gecko',
            'Safari': 'WebKit',
            'Internet Explorer': 'Trident'
        };
        
        return engines[browserName] || 'Blink'; // Default to Blink for Chromium-based browsers
    }

    /**
     * Check if browser is supported for gaming
     */
    isBrowserSupported(browserName) {
        const unsupportedBrowsers = ['Internet Explorer'];
        return !unsupportedBrowsers.includes(browserName);
    }

    /**
     * Convert Windows NT version to friendly name
     */
    getWindowsVersion(ntVersion) {
        const versions = {
            '10.0': '10',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
            '6.0': 'Vista',
            '5.1': 'XP',
            '5.0': '2000'
        };
        return versions[ntVersion] || ntVersion;
    }

    /**
     * Check ES6 support
     */
    checkES6Support() {
        try {
            // Test arrow functions and const/let
            new Function('() => {}');
            new Function('const x = 1; let y = 2;');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check Canvas 2D support
     */
    checkCanvas2DSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Check storage support
     */
    checkStorageSupport(type) {
        try {
            const storage = window[type];
            const testKey = '__test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get network connection information
     */
    getConnectionType() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }

    /**
     * Check if browser version meets minimum requirements
     */
    checkMinimumRequirements() {
        try {
            const browser = this.browserInfo || { name: 'Unknown', version: '0' };
            const browserVersion = parseInt(browser.version) || 0;

            // Define minimum versions by engine/browser family
            const minVersions = {
                // Chromium-based browsers (Chrome, Edge, Opera, Brave, Arc, Ray Browser, etc.)
                'Chrome': 80,
                'Edge': 80,
                'Opera': 67,
                'Brave': 80,
                'Vivaldi': 80,
                'Arc': 80,
                'Ray Browser': 80,
                
                // Other engines
                'Firefox': 75,
                'Safari': 13,
                
                // Unsupported
                'Internet Explorer': null
            };

            // Get minimum version for this browser
            let minVersion = minVersions[browser.name];
            
            // Handle "Chrome (Brand)" format - use Chrome requirements
            if (!minVersion && browser.name.startsWith('Chrome (')) {
                minVersion = minVersions['Chrome'];
                console.log(`🔍 Using Chrome requirements for branded browser: ${browser.name}`);
            }
            
            // If browser not found in list, check if it's a Chromium-based browser
            if (!minVersion && browser.engine === 'Blink') {
                console.log(`🔍 Unknown Chromium-based browser "${browser.name}", using Chrome requirements`);
                minVersion = minVersions['Chrome']; // Default to Chrome requirements for Chromium browsers
            }

            // Handle explicitly unsupported browsers
            if (minVersion === null) {
                return { supported: false, reason: `${browser.name} is not supported` };
            }

            // Handle unknown browsers
            if (!minVersion) {
                return { supported: false, reason: 'Unsupported browser' };
            }

            if (browserVersion < minVersion) {
                return { 
                    supported: false, 
                    reason: `${browser.name} ${minVersion}+ required (you have ${browserVersion})` 
                };
            }

            return { supported: true };
        } catch (error) {
            console.error('❌ Error checking minimum requirements:', error);
            return { supported: false, reason: 'Unable to check browser requirements' };
        }
    }

    /**
     * Generate a comprehensive browser/system report
     */
    generateReport() {
        try {
            const requirements = this.checkMinimumRequirements();
            
            return {
                browser: this.browserInfo || { name: 'Unknown', version: '0', engine: 'Unknown', isSupported: false },
                system: this.systemInfo || { os: 'Unknown', version: '', mobile: false, touchEnabled: false },
                capabilities: this.capabilities || {},
                requirements,
                timestamp: new Date().toISOString(),
                userAgent: this.userAgent || 'Unknown'
            };
        } catch (error) {
            console.error('❌ Error generating browser report:', error);
            return {
                browser: { name: 'Error', version: '0', engine: 'Unknown', isSupported: false },
                system: { os: 'Error', version: '', mobile: false, touchEnabled: false },
                capabilities: {},
                requirements: { supported: false, reason: 'Report generation failed' },
                timestamp: new Date().toISOString(),
                userAgent: 'Error',
                error: error.message
            };
        }
    }

    /**
     * Get a human-readable summary
     */
    getSummary() {
        try {
            const browser = this.browserInfo || { name: 'Unknown', version: '0' };
            const system = this.systemInfo || { os: 'Unknown', version: '' };
            return `${browser.name} ${browser.version} on ${system.os}${system.version ? ' ' + system.version : ''}`;
        } catch (error) {
            console.error('❌ Error generating browser summary:', error);
            return 'Browser information unavailable';
        }
    }

    /**
     * Check for common compatibility issues
     */
    detectPotentialIssues() {
        const issues = [];

        // Check for outdated browsers
        const requirements = this.checkMinimumRequirements();
        if (!requirements.supported) {
            issues.push({
                type: 'critical',
                category: 'browser-version',
                message: requirements.reason,
                recommendation: `Update to the latest version of ${this.browserInfo.name}`
            });
        }

        // Check for missing essential features
        if (!this.capabilities.webAssembly) {
            issues.push({
                type: 'critical',
                category: 'webassembly',
                message: 'WebAssembly not supported',
                recommendation: 'Update your browser to support WebAssembly'
            });
        }

        if (!this.capabilities.webGL) {
            issues.push({
                type: 'critical',
                category: 'webgl',
                message: 'WebGL not supported',
                recommendation: 'Enable hardware acceleration in browser settings'
            });
        }

        // Check for mobile limitations
        if (this.systemInfo.mobile) {
            issues.push({
                type: 'warning',
                category: 'mobile',
                message: 'Some gaming features may be limited on mobile devices',
                recommendation: 'Use a desktop browser for best compatibility'
            });
        }

        // Check for old Windows versions
        if (this.systemInfo.os === 'Windows' && ['Vista', 'XP', '2000'].includes(this.systemInfo.version)) {
            issues.push({
                type: 'warning',
                category: 'os-version',
                message: `Windows ${this.systemInfo.version} may have compatibility issues`,
                recommendation: 'Consider upgrading to a newer version of Windows'
            });
        }

        return issues;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserDetector;
} else {
    window.BrowserDetector = BrowserDetector;
}