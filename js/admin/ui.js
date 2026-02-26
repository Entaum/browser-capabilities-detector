/**
 * UI Utility Module
 * Handles modals, toasts, and common UI interactions
 */

class UIManager {
    constructor() {
        this.modalContainer = null;
        this.toastContainer = null;
    }

    init() {
        this.modalContainer = document.getElementById('modal-container');
        this.toastContainer = document.getElementById('toast-container');
    }

    /**
     * Create a modal dialog
     * @param {string} title - Modal title
     * @param {string} content - HTML content
     * @param {string} size - Modal size: 'small', 'medium', 'large'
     * @returns {Element} Modal element
     */
    createModal(title, content, size = 'medium') {
        if (!this.modalContainer) this.init();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-${size}">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="UI.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        this.modalContainer.appendChild(modal);

        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Add escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        return modal;
    }

    /**
     * Close the current modal
     */
    closeModal() {
        if (this.modalContainer) {
            this.modalContainer.innerHTML = '';
        }
    }

    /**
     * Show a confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Confirmation message
     * @param {string} confirmText - Text for confirm button
     * @param {string} cancelText - Text for cancel button
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    showConfirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = this.createModal(title, `
                <div class="confirm-dialog">
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
                        <button class="btn btn-danger" id="confirm-ok">${confirmText}</button>
                    </div>
                </div>
            `);

            const cancelBtn = modal.querySelector('#confirm-cancel');
            const confirmBtn = modal.querySelector('#confirm-ok');

            const cleanup = () => {
                this.closeModal();
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };

            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
        });
    }

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (default: 5000)
     */
    showToast(message, type = 'info', duration = 5000) {
        if (!this.toastContainer) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.remove();
        });
    }

    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {Element} Loading element
     */
    showLoading(message = 'Loading...') {
        const modal = this.createModal('', `
            <div class="loading-dialog">
                <div class="spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `);

        // Disable clicking outside to close for loading
        modal.onclick = null;

        return modal;
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        this.closeModal();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Validate URL
     * @param {string} string - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} True if successful
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }
}

// Create global instance
window.UI = new UIManager();