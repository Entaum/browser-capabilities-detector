#!/usr/bin/env node

/**
 * Simple Node.js development server for Spawnd Browser Compatibility Test
 * Provides proper MIME types and CORS headers for local development
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';

// MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Handle root request
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Service Worker headers
    if (pathname === '/sw.js') {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache');
    }
    
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`❌ File not found: ${filePath}`);
            
            // Try to serve index.html for SPA routing
            if (ext === '' || ext === '.html') {
                const indexPath = path.join(__dirname, 'index.html');
                fs.readFile(indexPath, (err, content) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content);
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                console.error(`❌ Error reading file ${filePath}:`, err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }
            
            console.log(`📄 Serving: ${pathname} (${contentType})`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
        console.error(`   PORT=3000 node server.js`);
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});

// Start server
server.listen(PORT, HOST, () => {
    console.log('🚀 Spawnd Browser Compatibility Test Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Server running at http://${HOST}:${PORT}/`);
    console.log(`🌐 Local:     http://localhost:${PORT}/`);
    console.log(`📱 Network:   http://${getNetworkIP()}:${PORT}/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Available endpoints:');
    console.log('   /           - Main application');
    console.log('   /sw.js      - Service Worker');
    console.log('   /css/       - Stylesheets');
    console.log('   /js/        - JavaScript files');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Helper function to get network IP
function getNetworkIP() {
    const nets = require('os').networkInterfaces();
    const results = {};
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    
    // Return the first available IP
    for (const name of Object.keys(results)) {
        if (results[name].length > 0) {
            return results[name][0];
        }
    }
    
    return HOST;
}