/**
 * Data Migration Script
 * Populates admin database with existing test data
 */

class DataMigration {
    constructor() {
        this.testClasses = [];
    }

    async init() {
        // Check if data already exists
        const existingBrowsers = await window.adminDB.getAllBrowsers();
        const existingTests = await window.adminDB.getAllTests();
        
        // Only migrate if database is empty
        if (existingBrowsers.length > 0 || existingTests.length > 0) {
            console.log('📦 Database already contains data, skipping migration');
            return;
        }
        
        console.log('🔄 Starting data migration...');
        
        // Initialize the admin database first
        await window.adminDB.init();
        
        // Load all test classes
        await this.loadTestClasses();
        
        // Migrate browsers
        await this.migrateBrowsers();
        
        // Migrate tests
        await this.migrateTests();
        
        console.log('✅ Data migration completed');
        
        // Show success message
        if (window.UI) {
            UI.showToast('Sample data loaded successfully!', 'success', 5000);
        }
        
        // Refresh all sections and update counters after migration
        if (window.adminApp) {
            // Small delay to ensure UI is ready
            setTimeout(async () => {
                // Update browsers counter and refresh if on browsers section
                if (window.browserManager) {
                    await window.browserManager.loadBrowsers();
                    if (window.adminApp.currentSection === 'browsers') {
                        window.browserManager.render();
                    }
                }
                
                // Update tests counter and refresh if on tests section
                if (window.testManager) {
                    await window.testManager.loadTests();
                    if (window.adminApp.currentSection === 'tests') {
                        window.testManager.render();
                    }
                }
                
                // Also refresh current section if it's browsers or tests
                const currentSection = window.adminApp.currentSection;
                if (currentSection === 'browsers' || currentSection === 'tests') {
                    await window.adminApp.loadSection(currentSection);
                }
            }, 100);
        }
    }

    async loadTestClasses() {
        // Initialize test classes that exist in your current app
        const testClasses = [
            { name: 'WebGL Tests', class: WebGLTests, category: 'graphics' },
            { name: 'WebGPU Tests', class: WebGPUTests, category: 'graphics' },
            { name: 'WebAssembly Tests', class: WebAssemblyTests, category: 'webassembly' },
            { name: 'Gaming APIs Tests', class: GamingAPIsTests, category: 'gaming' },
            { name: 'Communication Tests', class: CommunicationTests, category: 'communication' },
            { name: 'Performance Tests', class: PerformanceTests, category: 'performance' }
        ];

        for (const testClass of testClasses) {
            try {
                if (window[testClass.class.name]) {
                    const instance = new window[testClass.class.name]();
                    if (instance.getAllTests) {
                        const tests = instance.getAllTests();
                        this.testClasses.push({
                            name: testClass.name,
                            category: testClass.category,
                            tests: tests
                        });
                    }
                }
            } catch (error) {
                console.warn(`Could not load ${testClass.name}:`, error.message);
            }
        }
    }

    async migrateBrowsers() {
        console.log('🌐 Migrating browser data...');
        
        const browsers = [
            {
                name: 'Google Chrome',
                vendor: 'Google',
                engine: 'Blink',
                iconUrl: 'https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/chrome/chrome_64x64.png',
                downloadUrl: 'https://www.google.com/chrome/',
                uaMatchRules: [
                    { pattern: 'Chrome/', description: 'Standard Chrome identification' },
                    { pattern: 'Chromium/', description: 'Chromium-based browsers' }
                ],
                notes: 'Most widely used browser with excellent modern API support'
            },
            {
                name: 'Mozilla Firefox',
                vendor: 'Mozilla',
                engine: 'Gecko',
                iconUrl: 'https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/firefox/firefox_64x64.png',
                downloadUrl: 'https://www.mozilla.org/firefox/',
                uaMatchRules: [
                    { pattern: 'Firefox/', description: 'Firefox browser identification' }
                ],
                notes: 'Privacy-focused browser with strong developer tools'
            },
            {
                name: 'Safari',
                vendor: 'Apple',
                engine: 'WebKit',
                iconUrl: 'https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/safari/safari_64x64.png',
                downloadUrl: 'https://www.apple.com/safari/',
                uaMatchRules: [
                    { pattern: 'Safari/', description: 'Safari browser identification' },
                    { pattern: 'WebKit/', description: 'WebKit-based identification' }
                ],
                notes: 'Apple\'s browser with unique WebKit implementation'
            },
            {
                name: 'Microsoft Edge',
                vendor: 'Microsoft',
                engine: 'Blink',
                iconUrl: 'https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/edge/edge_64x64.png',
                downloadUrl: 'https://www.microsoft.com/edge/',
                uaMatchRules: [
                    { pattern: 'Edg/', description: 'Modern Edge identification' },
                    { pattern: 'Edge/', description: 'Legacy Edge identification' }
                ],
                notes: 'Microsoft\'s modern browser based on Chromium'
            },
            {
                name: 'Opera',
                vendor: 'Opera Software',
                engine: 'Blink',
                iconUrl: 'https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/opera/opera_64x64.png',
                downloadUrl: 'https://www.opera.com/',
                uaMatchRules: [
                    { pattern: 'OPR/', description: 'Opera browser identification' }
                ],
                notes: 'Feature-rich browser with built-in VPN and tools'
            }
        ];

        for (const browserData of browsers) {
            try {
                const browser = new Browser(browserData);
                await adminDB.saveBrowser(browser.toJSON());
                console.log(`✅ Migrated browser: ${browser.name}`);
            } catch (error) {
                console.error(`❌ Failed to migrate browser ${browserData.name}:`, error);
            }
        }
    }

    async migrateTests() {
        console.log('🧪 Migrating test data...');
        
        let testCount = 0;
        
        for (const testClass of this.testClasses) {
            console.log(`Processing ${testClass.name}...`);
            
            for (const testData of testClass.tests) {
                try {
                    // Convert existing test format to admin format
                    const test = new Test({
                        title: testData.name || testData.title,
                        category: testData.category || testClass.category || 'general',
                        description: testData.description || `Test ${testData.name}`,
                        detectorKey: this.generateDetectorKey(testData.name || testData.title),
                        severity: this.mapPriorityToSeverity(testData.priority),
                        links: this.generateLinks(testData)
                    });

                    // Check if test already exists
                    const existingTests = await adminDB.getAllTests();
                    const exists = existingTests.find(t => t.detectorKey === test.detectorKey);
                    
                    if (!exists) {
                        await adminDB.saveTest(test.toJSON());
                        testCount++;
                        console.log(`✅ Migrated test: ${test.title}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to migrate test ${testData.name}:`, error);
                }
            }
        }

        // Add some additional comprehensive tests
        await this.addAdditionalTests();

        console.log(`✅ Migrated ${testCount} tests total`);
    }

    generateDetectorKey(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '.')
            .replace(/^\.+|\.+$/g, '');
    }

    mapPriorityToSeverity(priority) {
        if (!priority) return 'info';
        if (priority >= 8) return 'fail';
        if (priority >= 5) return 'warn';
        return 'info';
    }

    generateLinks(testData) {
        const links = [];
        
        // Add relevant documentation links based on test name/category
        if (testData.name) {
            const name = testData.name.toLowerCase();
            
            if (name.includes('webgl')) {
                links.push({
                    label: 'WebGL Specification',
                    url: 'https://www.khronos.org/webgl/'
                });
                links.push({
                    label: 'MDN WebGL Guide',
                    url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API'
                });
            }
            
            if (name.includes('webgpu')) {
                links.push({
                    label: 'WebGPU Specification',
                    url: 'https://www.w3.org/TR/webgpu/'
                });
                links.push({
                    label: 'MDN WebGPU Guide',
                    url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'
                });
            }
            
            if (name.includes('webassembly') || name.includes('wasm')) {
                links.push({
                    label: 'WebAssembly Specification',
                    url: 'https://webassembly.org/'
                });
                links.push({
                    label: 'MDN WebAssembly Guide',
                    url: 'https://developer.mozilla.org/en-US/docs/WebAssembly'
                });
            }

            if (name.includes('service worker')) {
                links.push({
                    label: 'Service Worker Specification',
                    url: 'https://w3c.github.io/ServiceWorker/'
                });
            }

            if (name.includes('gamepad')) {
                links.push({
                    label: 'Gamepad API Specification',
                    url: 'https://w3c.github.io/gamepad/'
                });
            }
        }
        
        return links;
    }

    async addAdditionalTests() {
        const additionalTests = [
            {
                title: 'JavaScript ES6+ Support',
                category: 'javascript',
                description: 'Tests support for modern JavaScript features like arrow functions, classes, and modules',
                detectorKey: 'javascript.es6.support',
                severity: 'warn',
                links: [
                    { label: 'ECMAScript Specifications', url: 'https://www.ecma-international.org/publications-and-standards/standards/ecma-262/' },
                    { label: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }
                ]
            },
            {
                title: 'CSS Grid Support',
                category: 'css',
                description: 'Tests browser support for CSS Grid Layout',
                detectorKey: 'css.grid.support',
                severity: 'warn',
                links: [
                    { label: 'CSS Grid Specification', url: 'https://www.w3.org/TR/css-grid-1/' },
                    { label: 'MDN CSS Grid Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout' }
                ]
            },
            {
                title: 'CSS Flexbox Support',
                category: 'css',
                description: 'Tests browser support for CSS Flexible Box Layout',
                detectorKey: 'css.flexbox.support',
                severity: 'warn',
                links: [
                    { label: 'CSS Flexbox Specification', url: 'https://www.w3.org/TR/css-flexbox-1/' },
                    { label: 'MDN Flexbox Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout' }
                ]
            },
            {
                title: 'HTML5 Semantic Elements',
                category: 'html5',
                description: 'Tests support for HTML5 semantic elements like article, section, nav',
                detectorKey: 'html5.semantic.support',
                severity: 'info',
                links: [
                    { label: 'HTML5 Specification', url: 'https://html.spec.whatwg.org/' },
                    { label: 'MDN HTML5 Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' }
                ]
            },
            {
                title: 'Local Storage Support',
                category: 'storage',
                description: 'Tests browser support for localStorage API',
                detectorKey: 'storage.localstorage.support',
                severity: 'warn',
                links: [
                    { label: 'Web Storage Specification', url: 'https://html.spec.whatwg.org/multipage/webstorage.html' },
                    { label: 'MDN Web Storage Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API' }
                ]
            },
            {
                title: 'Touch Events Support',
                category: 'mobile',
                description: 'Tests support for touch events on mobile devices',
                detectorKey: 'mobile.touch.support',
                severity: 'info',
                links: [
                    { label: 'Touch Events Specification', url: 'https://w3c.github.io/touch-events/' },
                    { label: 'MDN Touch Events Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Touch_events' }
                ]
            }
        ];

        for (const testData of additionalTests) {
            try {
                const test = new Test(testData);
                const existingTests = await adminDB.getAllTests();
                const exists = existingTests.find(t => t.detectorKey === test.detectorKey);
                
                if (!exists) {
                    await adminDB.saveTest(test.toJSON());
                    console.log(`✅ Added additional test: ${test.title}`);
                }
            } catch (error) {
                console.error(`❌ Failed to add test ${testData.title}:`, error);
            }
        }
    }
}

// Auto-run migration when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for admin interface to be ready
    setTimeout(async () => {
        try {
            if (window.adminDB && window.Browser && window.Test) {
                const migration = new DataMigration();
                await migration.init();
            } else {
                console.log('⏳ Admin interface not ready yet, skipping migration');
            }
        } catch (error) {
            console.error('Failed to run auto-migration:', error);
        }
    }, 2000);
});