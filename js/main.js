/**
 * Main Application Controller
 * Handles UI interactions, navigation, and application state
 */

class CompatibilityTestApp {
    constructor() {
        this.browserDetector = null;
        this.testEngine = null;
        this.currentView = 'landing';
        this.testResults = new Map();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.initializeBrowserDetection();
        this.updateOnlineStatus();
        this.setupOfflineDetection();
        
        console.log('🎮 Spawnd Browser Compatibility Test initialized');
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Start test button
        const startButton = document.getElementById('start-test');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startCompatibilityTest();
            });
        }

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('cta-button')) {
                    e.preventDefault();
                    activeElement.click();
                }
            }
        });

        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.navigateToView(e.state.view, false);
            }
        });
    }

    /**
     * Initialize browser detection
     */
    initializeBrowserDetection() {
        try {
            this.browserDetector = new BrowserDetector();
            const summary = this.browserDetector.getSummary();
            console.log(`🌐 Detected: ${summary}`);

            // Check for immediate compatibility issues (saved for after testing)
            const issues = this.browserDetector.detectPotentialIssues();
            if (issues.length > 0) {
                console.warn('⚠️ Potential compatibility issues detected:', issues);
                // Note: Compatibility warnings will be shown after testing is complete
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize browser detection:', error);
            this.showError('Failed to detect browser information. Some features may not work correctly.');
        }
    }

    /**
     * Set up online/offline status detection
     */
    setupOfflineDetection() {
        const updateStatus = () => {
            this.updateOnlineStatus();
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
    }

    /**
     * Update online/offline status indicator
     */
    updateOnlineStatus() {
        // Online indicator removed from UI
        // Status checking still available via navigator.onLine
    }

    /**
     * Show compatibility warnings to the user
     */
    showCompatibilityWarnings(issues) {
        const criticalIssues = issues.filter(issue => issue.type === 'critical');
        
        if (criticalIssues.length > 0) {
            // Create warning banner
            const banner = document.createElement('div');
            banner.className = 'compatibility-warning';
            
            const content = document.createElement('div');
            content.className = 'warning-content';
            
            const icon = document.createElement('div');
            icon.className = 'warning-icon';
            icon.textContent = '⚠️';
            
            const text = document.createElement('div');
            text.className = 'warning-text';
            
            const h3 = document.createElement('h3');
            h3.textContent = 'Compatibility Issues Detected';
            
            const ul = document.createElement('ul');
            criticalIssues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue.message;
                ul.appendChild(li);
            });
            
            text.appendChild(h3);
            text.appendChild(ul);
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'warning-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => banner.remove();
            
            content.appendChild(icon);
            content.appendChild(text);
            content.appendChild(closeBtn);
            banner.appendChild(content);
            
            // Add styles for the warning banner
            if (!document.getElementById('warning-styles')) {
                const styles = document.createElement('style');
                styles.id = 'warning-styles';
                styles.textContent = `
                    .compatibility-warning {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                        background: linear-gradient(90deg, #dc2626, #ea580c);
                        color: white;
                        padding: 1rem;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .warning-content {
                        display: flex;
                        align-items: center;
                        max-width: 1200px;
                        margin: 0 auto;
                        gap: 1rem;
                    }
                    .warning-icon {
                        font-size: 1.5rem;
                        flex-shrink: 0;
                    }
                    .warning-text h3 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1rem;
                        font-weight: 600;
                    }
                    .warning-text ul {
                        margin: 0;
                        padding-left: 1.5rem;
                        font-size: 0.875rem;
                    }
                    .warning-close {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.25rem;
                        margin-left: auto;
                        border-radius: 0.25rem;
                    }
                    .warning-close:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    body.has-warning {
                        padding-top: 100px;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.insertBefore(banner, document.body.firstChild);
            document.body.classList.add('has-warning');
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                if (banner.parentElement) {
                    banner.remove();
                    document.body.classList.remove('has-warning');
                }
            }, 10000);
        }
    }

    /**
     * Start the compatibility test process
     */
    async startCompatibilityTest() {
        console.log('🚀 Starting compatibility test...');
        
        try {
            // Validate browser compatibility first
            if (!this.browserDetector) {
                throw new Error('Browser detection not available');
            }

            const requirements = this.browserDetector.checkMinimumRequirements();
            if (!requirements.supported) {
                console.warn(`⚠️ Browser compatibility warning: ${requirements.reason}`);
                // Note: Proceeding with test anyway - let the individual tests determine compatibility
            }

            // Add loading state to button
            const startButton = document.getElementById('start-test');
            if (startButton) {
                startButton.disabled = true;
                startButton.classList.add('loading');
                const originalText = startButton.querySelector('.button-text').textContent;
                startButton.querySelector('.button-text').textContent = 'Initializing...';
                
                // Restore button after a short delay (for better UX)
                setTimeout(() => {
                    startButton.disabled = false;
                    startButton.classList.remove('loading');
                    startButton.querySelector('.button-text').textContent = originalText;
                }, 2000);
            }

            // Navigate to test view (placeholder for now)
            await this.navigateToTestView();
            
        } catch (error) {
            console.error('❌ Failed to start compatibility test:', error);
            this.showError('Failed to start the compatibility test. Please try again.');
        }
    }

    /**
     * Navigate to test view - Phase 2 Implementation
     */
    async navigateToTestView() {
        console.log('📋 Navigating to test view...');
        
        try {
            // Initialize testing interface if not already created
            if (!window.testingInterface) {
                window.testingInterface = new TestingInterface();
            }
            
            // Show the testing interface
            await window.testingInterface.show();
            
            // Update current view
            this.navigateToView('testing');
            
            // Log browser info for development
            if (this.browserDetector) {
                try {
                    const summary = this.browserDetector.getSummary();
                    const report = this.browserDetector.generateReport();
                    console.log(`🌐 Browser: ${summary}`);
                    console.log('Browser Report:', report);
                } catch (detectorError) {
                    console.warn('⚠️ Browser detector error:', detectorError);
                }
            }
            
        } catch (error) {
            console.error('❌ Error in navigateToTestView:', error);
            this.showError('Unable to start test. Please refresh the page and try again.');
        }
    }

    /**
     * Navigate to a specific view
     */
    navigateToView(viewName, pushState = true) {
        this.currentView = viewName;
        
        if (pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }
        
        console.log(`📍 Navigated to view: ${viewName}`);
    }

    /**
     * Show success notification to user
     */
    showSuccessNotification(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = '✅';
        
        const text = document.createElement('div');
        text.className = 'notification-text';
        // Handle newlines by splitting and creating <br> elements
        const lines = message.split('\n');
        lines.forEach((line, index) => {
            if (index > 0) {
                text.appendChild(document.createElement('br'));
            }
            text.appendChild(document.createTextNode(line));
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => notification.remove();
        
        content.appendChild(icon);
        content.appendChild(text);
        content.appendChild(closeBtn);
        notification.appendChild(content);
        
        this.addNotificationStyles();
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = '❌';
        
        const text = document.createElement('div');
        text.className = 'notification-text';
        text.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => notification.remove();
        
        content.appendChild(icon);
        content.appendChild(text);
        content.appendChild(closeBtn);
        notification.appendChild(content);
        
        this.addNotificationStyles();
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Add notification styles to the page
     */
    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .error-notification, .success-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }
                .error-notification {
                    background: #dc2626;
                }
                .success-notification {
                    background: #10b981;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }
                .notification-icon {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .notification-text {
                    flex: 1;
                    font-size: 0.875rem;
                    line-height: 1.4;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    margin-left: 0.5rem;
                    flex-shrink: 0;
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Get current application state for debugging
     */
    getDebugInfo() {
        return {
            currentView: this.currentView,
            browserDetected: !!this.browserDetector,
            browserInfo: this.browserDetector?.browserInfo,
            systemInfo: this.browserDetector?.systemInfo,
            isOnline: navigator.onLine,
            testResults: Object.fromEntries(this.testResults)
        };
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.compatibilityApp = new CompatibilityTestApp();
});

// Make app available globally for debugging
window.getAppDebugInfo = () => {
    return window.compatibilityApp?.getDebugInfo() || 'App not initialized';
};

// Global notification function for use by other modules
window.showNotification = (message, type = 'info') => {
    if (window.compatibilityApp) {
        if (type === 'success') {
            window.compatibilityApp.showSuccessNotification(message);
        } else if (type === 'error') {
            window.compatibilityApp.showError(message);
        } else {
            // For info and other types, use success styling
            window.compatibilityApp.showSuccessNotification(message);
        }
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
};