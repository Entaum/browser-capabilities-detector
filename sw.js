/**
 * Service Worker for Spawnd Browser Compatibility Checker
 * Provides offline functionality and caching for better performance
 */

const CACHE_NAME = 'spawnd-compatibility-v1.0.0';
const CACHE_VERSION = 1;

// Static assets to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/components.css', 
    '/css/responsive.css',
    '/js/main.js',
    '/js/browser-detect.js',
    '/spawnd_logo.png'
];

// Network-dependent resources (will be cached but not essential)
const NETWORK_ASSETS = [
    // These will be added in later phases
    '/js/test-engine.js',
    '/js/api-tests/',
    '/data/caniuse-fallback.json'
];

// URLs that should bypass the cache (external APIs)
const BYPASS_CACHE = [
    'echo.websocket.events',
    'caniuse.com',
    'raw.githubusercontent.com',
    'analytics.spawnd.gg'
];

/**
 * Service Worker Installation
 * Pre-cache static assets for offline functionality
 */
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached successfully');
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

/**
 * Service Worker Activation  
 * Clean up old caches and take control
 */
self.addEventListener('activate', event => {
    console.log('⚡ Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activated and ready');
        })
    );
});

/**
 * Fetch Event Handler
 * Implements cache-first strategy with network fallback
 */
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    const url = new URL(event.request.url);
    
    // Handle different types of requests
    if (shouldBypassCache(url)) {
        // Network-only for external APIs and analytics
        event.respondWith(handleNetworkOnly(event.request));
    } else if (isStaticAsset(url)) {
        // Cache-first for static assets
        event.respondWith(handleCacheFirst(event.request));
    } else {
        // Network-first for dynamic content
        event.respondWith(handleNetworkFirst(event.request));
    }
});

/**
 * Check if URL should bypass cache
 */
function shouldBypassCache(url) {
    return BYPASS_CACHE.some(domain => url.hostname.includes(domain));
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
    const pathname = url.pathname;
    return pathname.endsWith('.css') || 
           pathname.endsWith('.js') || 
           pathname.endsWith('.png') || 
           pathname.endsWith('.svg') || 
           pathname.endsWith('.ico') ||
           pathname === '/' ||
           pathname.endsWith('.html');
}

/**
 * Cache-first strategy: Try cache, then network
 */
async function handleCacheFirst(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Return cached version
            console.log('📋 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        console.log('🌐 Fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Cache-first strategy failed:', error);
        
        // Return offline fallback for HTML pages
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        // Return error response for other assets
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network-first strategy: Try network, then cache
 */
async function handleNetworkFirst(request) {
    try {
        console.log('🌐 Network-first request:', request.url);
        const networkResponse = await fetch(request, { timeout: 5000 });
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('📋 Network failed, trying cache:', request.url);
        
        // Try cache as fallback
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(JSON.stringify({
            offline: true,
            message: 'This feature requires an internet connection',
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Network-only strategy: Always try network
 */
async function handleNetworkOnly(request) {
    try {
        console.log('🌐 Network-only request:', request.url);
        return await fetch(request);
        
    } catch (error) {
        console.log('❌ Network-only request failed:', request.url);
        
        // Return specific offline responses for different types
        if (request.url.includes('websocket') || request.url.includes('webrtc')) {
            return new Response(JSON.stringify({
                offline: true,
                test: 'skipped',
                reason: 'Network connection required',
                status: 'unavailable'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generic offline response
        return new Response('Network unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_VERSION,
                cacheName: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME)
                .then(success => {
                    event.ports[0].postMessage({ success });
                });
            break;
            
        case 'GET_CACHE_STATUS':
            caches.open(CACHE_NAME)
                .then(cache => cache.keys())
                .then(keys => {
                    event.ports[0].postMessage({
                        cacheSize: keys.length,
                        cachedUrls: keys.map(request => request.url)
                    });
                });
            break;
            
        default:
            console.log('Unknown message type:', type);
    }
});

/**
 * Handle errors
 */
self.addEventListener('error', event => {
    console.error('🚨 Service Worker error:', event.error);
});

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', event => {
    console.error('🚨 Service Worker unhandled promise rejection:', event.reason);
});

console.log('🚀 Service Worker script loaded successfully');