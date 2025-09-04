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
     * Detect browser name and version using feature detection + UA parsing
     */
    detectBrowser() {
        const ua = this.userAgent;
        let browser = {
            name: 'Unknown',
            version: '0',
            engine: 'Unknown',
            isSupported: false
        };

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
            const minVersions = {
                'Chrome': 80,
                'Firefox': 75,
                'Safari': 13,
                'Edge': 80
            };

            const browser = this.browserInfo || { name: 'Unknown', version: '0' };
            const browserVersion = parseInt(browser.version) || 0;
            const minVersion = minVersions[browser.name];

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