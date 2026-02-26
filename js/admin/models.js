/**
 * Data Models for Admin Interface
 * Defines the structure and validation for each entity type
 */

class Browser {
    constructor(data = {}) {
        this.id = data.id || adminDB.slugify(data.name || 'new-browser');
        this.name = data.name || '';
        this.vendor = data.vendor || '';
        this.engine = data.engine || 'Blink';
        this.iconUrl = data.iconUrl || '';
        this.downloadUrl = data.downloadUrl || '';
        this.uaMatchRules = data.uaMatchRules || [];
        this.notes = data.notes || '';
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        
        // Localized fields
        this.nameLocalized = data.nameLocalized || {};
        this.vendorLocalized = data.vendorLocalized || {};
        this.notesLocalized = data.notesLocalized || {};
    }

    validate() {
        const errors = [];
        
        if (!this.name) {
            errors.push('Browser name is required');
        }
        
        if (!this.engine) {
            errors.push('Browser engine is required');
        } else if (!['Blink', 'WebKit', 'Gecko', 'Trident'].includes(this.engine)) {
            errors.push('Invalid browser engine');
        }
        
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            vendor: this.vendor,
            engine: this.engine,
            iconUrl: this.iconUrl,
            downloadUrl: this.downloadUrl,
            uaMatchRules: this.uaMatchRules,
            notes: this.notes,
            nameLocalized: this.nameLocalized,
            vendorLocalized: this.vendorLocalized,
            notesLocalized: this.notesLocalized,
            lastUpdated: this.lastUpdated
        };
    }
}

class Test {
    constructor(data = {}) {
        this.id = data.id || adminDB.slugify(data.title || 'new-test');
        this.title = data.title || '';
        this.category = data.category || 'general';
        this.description = data.description || '';
        this.detectorKey = data.detectorKey || '';
        this.severity = data.severity || 'info';
        this.links = data.links || [];
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        
        // Localized fields
        this.titleLocalized = data.titleLocalized || {};
        this.categoryLocalized = data.categoryLocalized || {};
        this.descriptionLocalized = data.descriptionLocalized || {};
    }

    validate() {
        const errors = [];
        
        if (!this.title) {
            errors.push('Test title is required');
        }
        
        if (!this.detectorKey) {
            errors.push('Detector key is required');
        }
        
        if (!['info', 'warn', 'fail'].includes(this.severity)) {
            errors.push('Invalid severity level');
        }
        
        // Validate links
        this.links.forEach((link, index) => {
            if (!link.label || !link.url) {
                errors.push(`Link ${index + 1} must have both label and URL`);
            }
        });
        
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            category: this.category,
            description: this.description,
            detectorKey: this.detectorKey,
            severity: this.severity,
            links: this.links,
            titleLocalized: this.titleLocalized,
            categoryLocalized: this.categoryLocalized,
            descriptionLocalized: this.descriptionLocalized,
            lastUpdated: this.lastUpdated
        };
    }
}

class Solution {
    constructor(data = {}) {
        this.id = data.id || adminDB.slugify(data.title || 'new-solution');
        this.title = data.title || '';
        // Support both old issueKey and new testIds for backward compatibility
        this.testIds = data.testIds || (data.issueKey ? [data.issueKey] : []);
        this.contentFormat = data.contentFormat || 'md';
        this.content = data.content || '';
        this.appliesTo = data.appliesTo || { scope: 'generic' };
        this.priority = data.priority || 0;
        this.tags = data.tags || [];
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        
        // Localized content
        this.contentLocalized = data.contentLocalized || {};
        this.titleLocalized = data.titleLocalized || {};
    }

    validate() {
        const errors = [];
        
        if (!this.title) {
            errors.push('Solution title is required');
        }
        
        if (!this.testIds || this.testIds.length === 0) {
            errors.push('At least one related test is required');
        }
        
        if (!this.content) {
            errors.push('Solution content is required');
        }
        
        if (!['html', 'md'].includes(this.contentFormat)) {
            errors.push('Invalid content format');
        }
        
        // Validate appliesTo
        if (!this.appliesTo.scope) {
            errors.push('Scope is required');
        }
        
        if (!['generic', 'browser', 'browserVersion'].includes(this.appliesTo.scope)) {
            errors.push('Invalid scope');
        }
        
        if (this.appliesTo.scope === 'browser' && !this.appliesTo.browserId) {
            errors.push('Browser ID is required for browser-specific solutions');
        }
        
        if (this.appliesTo.scope === 'browserVersion') {
            if (!this.appliesTo.browserId) {
                errors.push('Browser ID is required for version-specific solutions');
            }
            if (!this.appliesTo.versionRange) {
                errors.push('Version range is required for version-specific solutions');
            }
        }
        
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            testIds: this.testIds,
            contentFormat: this.contentFormat,
            content: this.content,
            contentLocalized: this.contentLocalized,
            titleLocalized: this.titleLocalized,
            appliesTo: this.appliesTo,
            priority: this.priority,
            tags: this.tags,
            lastUpdated: this.lastUpdated
        };
    }
}

class Snippet {
    constructor(data = {}) {
        this.id = data.id || adminDB.slugify(data.title || 'new-snippet');
        this.title = data.title || '';
        this.bodyFormat = data.bodyFormat || 'md';
        this.body = data.body || '';
        this.variables = data.variables || [];
        this.targets = data.targets || {};
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        
        // Localized fields
        this.bodyLocalized = data.bodyLocalized || {};
        this.titleLocalized = data.titleLocalized || {};
    }

    validate() {
        const errors = [];
        
        if (!this.title) {
            errors.push('Snippet title is required');
        }
        
        if (!this.body) {
            errors.push('Snippet body is required');
        }
        
        if (!['html', 'md'].includes(this.bodyFormat)) {
            errors.push('Invalid body format');
        }
        
        // Validate variables
        this.variables.forEach((variable, index) => {
            if (!variable.key) {
                errors.push(`Variable ${index + 1} must have a key`);
            }
            
            if (!variable.label) {
                errors.push(`Variable ${index + 1} must have a label`);
            }
            
            if (!['string', 'enum', 'url'].includes(variable.type)) {
                errors.push(`Variable ${index + 1} has invalid type`);
            }
            
            if (variable.type === 'enum' && (!variable.options || variable.options.length === 0)) {
                errors.push(`Enum variable ${variable.key} must have options`);
            }
        });
        
        // Validate targets
        if (this.targets.os) {
            const validOS = ['windows', 'macos', 'linux', 'android', 'ios'];
            this.targets.os.forEach(os => {
                if (!validOS.includes(os)) {
                    errors.push(`Invalid OS target: ${os}`);
                }
            });
        }
        
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            bodyFormat: this.bodyFormat,
            body: this.body,
            bodyLocalized: this.bodyLocalized,
            titleLocalized: this.titleLocalized,
            variables: this.variables,
            targets: this.targets,
            lastUpdated: this.lastUpdated
        };
    }
}

class I18nManager {
    constructor(data = {}) {
        this.defaultLocale = data.defaultLocale || 'en-US';
        this.supportedLocales = data.supportedLocales || ['en-US'];
        this.messages = data.messages || {};
        
        // Ensure default locale is in supported list
        if (!this.supportedLocales.includes(this.defaultLocale)) {
            this.supportedLocales.push(this.defaultLocale);
        }
    }

    addLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            this.supportedLocales.push(locale);
            this.messages[locale] = {};
        }
    }

    removeLocale(locale) {
        if (locale === this.defaultLocale) {
            throw new Error('Cannot remove default locale');
        }
        
        const index = this.supportedLocales.indexOf(locale);
        if (index > -1) {
            this.supportedLocales.splice(index, 1);
            delete this.messages[locale];
        }
    }

    setDefaultLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            this.addLocale(locale);
        }
        this.defaultLocale = locale;
    }

    getMessage(key, locale = null) {
        const targetLocale = locale || this.defaultLocale;
        
        // Try exact locale
        if (this.messages[targetLocale] && this.messages[targetLocale][key]) {
            return this.messages[targetLocale][key];
        }
        
        // Try language without region (e.g., 'pt' from 'pt-BR')
        const language = targetLocale.split('-')[0];
        for (const loc of this.supportedLocales) {
            if (loc.startsWith(language) && this.messages[loc] && this.messages[loc][key]) {
                return this.messages[loc][key];
            }
        }
        
        // Fall back to default locale
        if (this.messages[this.defaultLocale] && this.messages[this.defaultLocale][key]) {
            return this.messages[this.defaultLocale][key];
        }
        
        // Return key if no translation found
        return key;
    }

    setMessage(key, value, locale = null) {
        const targetLocale = locale || this.defaultLocale;
        
        if (!this.messages[targetLocale]) {
            this.messages[targetLocale] = {};
        }
        
        this.messages[targetLocale][key] = value;
    }

    getCompleteness(locale) {
        if (!this.messages[locale] || !this.messages[this.defaultLocale]) {
            return 0;
        }
        
        const defaultKeys = Object.keys(this.messages[this.defaultLocale]);
        const localeKeys = Object.keys(this.messages[locale]);
        
        if (defaultKeys.length === 0) {
            return 100;
        }
        
        const translatedCount = defaultKeys.filter(key => localeKeys.includes(key)).length;
        return Math.round((translatedCount / defaultKeys.length) * 100);
    }

    getMissingKeys(locale) {
        if (!this.messages[this.defaultLocale]) {
            return [];
        }
        
        const defaultKeys = Object.keys(this.messages[this.defaultLocale]);
        const localeKeys = Object.keys(this.messages[locale] || {});
        
        return defaultKeys.filter(key => !localeKeys.includes(key));
    }

    exportLocale(locale) {
        return {
            locale: locale,
            messages: this.messages[locale] || {}
        };
    }

    importLocale(locale, messages) {
        if (!this.supportedLocales.includes(locale)) {
            this.addLocale(locale);
        }
        
        this.messages[locale] = { ...this.messages[locale], ...messages };
    }

    toJSON() {
        return {
            default: this.defaultLocale,
            supported: this.supportedLocales,
            messages: this.messages
        };
    }
}

// Version range utilities
class VersionRange {
    static parse(range) {
        if (!range) return null;
        
        // Handle simple operators: >=17, <18, =15
        const simpleMatch = range.match(/^([><=]+)(\d+(?:\.\d+)*)$/);
        if (simpleMatch) {
            const [, operator, version] = simpleMatch;
            return { operator, version: this.parseVersion(version) };
        }
        
        // Handle range: >=17 <18
        const rangeMatch = range.match(/^([><=]+)(\d+(?:\.\d+)*)\s+([><=]+)(\d+(?:\.\d+)*)$/);
        if (rangeMatch) {
            const [, op1, v1, op2, v2] = rangeMatch;
            return {
                min: { operator: op1, version: this.parseVersion(v1) },
                max: { operator: op2, version: this.parseVersion(v2) }
            };
        }
        
        return null;
    }

    static parseVersion(versionString) {
        const parts = versionString.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    }

    static matches(browserVersion, range) {
        const parsed = this.parse(range);
        if (!parsed) return true;
        
        const version = this.parseVersion(browserVersion);
        
        if (parsed.operator) {
            return this.compareVersion(version, parsed.operator, parsed.version);
        }
        
        if (parsed.min && parsed.max) {
            return this.compareVersion(version, parsed.min.operator, parsed.min.version) &&
                   this.compareVersion(version, parsed.max.operator, parsed.max.version);
        }
        
        return true;
    }

    static compareVersion(v1, operator, v2) {
        const comp = this.versionCompare(v1, v2);
        
        switch (operator) {
            case '>': return comp > 0;
            case '>=': return comp >= 0;
            case '<': return comp < 0;
            case '<=': return comp <= 0;
            case '=': 
            case '==': return comp === 0;
            default: return false;
        }
    }

    static versionCompare(v1, v2) {
        if (v1.major !== v2.major) return v1.major - v2.major;
        if (v1.minor !== v2.minor) return v1.minor - v2.minor;
        return v1.patch - v2.patch;
    }
}

// Export models
window.Browser = Browser;
window.Test = Test;
window.Solution = Solution;
window.Snippet = Snippet;
window.I18nManager = I18nManager;
window.VersionRange = VersionRange;