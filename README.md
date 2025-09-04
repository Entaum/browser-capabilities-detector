# Spawnd Browser Compatibility Test

A comprehensive browser compatibility checker for modern web game technologies. Tests WebGL, WebGPU, WebAssembly, and other gaming-critical APIs to ensure your browser is ready for high-performance web games.

## 🚀 Quick Start

### Running the Development Server

Choose one of the following methods:

#### Option 1: Python HTTP Server (Recommended)
```bash
# Start server on port 8080
npm start
# or
python3 -m http.server 8080
```

#### Option 2: Node.js Server (With additional features)
```bash
# Start Node.js server with proper MIME types and CORS
npm run server
# or
node server.js
```

#### Option 3: Custom Port
```bash
# Python server on custom port
python3 -m http.server 3000

# Node.js server on custom port
PORT=3000 node server.js
```

### Accessing the Application

Once the server is running, open your browser and navigate to:
- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080 (for testing on mobile devices)

## 🧪 Current Features (Phase 1)

✅ **Browser Detection**
- Automatic browser identification (Chrome, Firefox, Safari, Edge)
- Version detection and compatibility checking
- Operating system and architecture detection
- Basic capability assessment

✅ **Responsive UI**
- Mobile-first responsive design
- Dark theme with Spawnd branding
- Accessibility-compliant interface
- Offline status indication

✅ **Service Worker**
- Offline functionality with intelligent caching
- Network-first and cache-first strategies
- Graceful degradation for network failures

✅ **Test Engine Framework**
- Modular test registration system
- Timeout handling and retry logic
- Dependency management between tests
- Progress tracking and event emission

## 🔧 Technical Architecture

### File Structure
```
/
├── index.html              # Main landing page
├── sw.js                  # Service Worker for offline support
├── css/
│   ├── base.css          # CSS variables and reset
│   ├── components.css    # UI component styles
│   └── responsive.css    # Media queries and responsive design
├── js/
│   ├── main.js          # Main application controller
│   ├── browser-detect.js # Browser detection module
│   └── test-engine.js   # Test orchestration framework
├── server.js             # Node.js development server
└── package.json         # Project configuration
```

### Browser Support
- **Chrome**: 80+ (Full support)
- **Firefox**: 75+ (Full support)
- **Safari**: 13+ (Full support)
- **Edge**: 80+ (Full support)
- **Mobile browsers**: Limited support (core features only)

## 🧑‍💻 Development

### Phase 1 Status: ✅ COMPLETE
- [x] Static site structure with Service Worker
- [x] Browser detection and basic UI components
- [x] Test engine framework with timeout handling
- [x] Local development server setup
- [x] Responsive design with Spawnd branding

### Next: Phase 2 Development
- [ ] API testing suite implementation
- [ ] WebGL/WebGPU test modules
- [ ] WebAssembly testing (base + threads + SIMD)
- [ ] Gaming APIs (Gamepad, Pointer Lock, Fullscreen, Audio)
- [ ] Storage APIs testing

### Testing Phase 1

1. **Start the development server** using one of the methods above
2. **Open the application** in your browser
3. **Test basic functionality**:
   - Check if the page loads correctly
   - Verify browser detection works (check browser console)
   - Test the "Start Compatibility Test" button
   - Verify offline indicator works (disconnect internet)
   - Test responsiveness on different screen sizes

### Debug Information

Open browser console and run:
```javascript
// Get application debug info
getAppDebugInfo()

// Get browser detection details  
compatibilityApp.browserDetector.generateReport()

// Check Service Worker status
navigator.serviceWorker.getRegistration().then(reg => console.log('SW:', reg))
```

## 🎯 Upcoming Features

### Phase 2: API Testing Suite
- WebGL 1.0/2.0 comprehensive testing
- WebGPU support and feature detection
- WebAssembly compilation and feature tests
- WebRTC connection testing
- WebSocket connectivity tests

### Phase 3: User Experience
- Interactive results dashboard
- Personalized browser-specific recommendations
- Interference detection (extensions, antivirus)
- Test result export functionality

### Phase 4: Polish & Deployment
- Performance optimization (sub-60s test completion)
- Cross-browser compatibility testing
- Analytics integration
- CDN deployment to test.spawnd.gg

## 🚨 Known Issues

- **Phase 1 Limitation**: "Start Test" button currently shows placeholder - actual API testing will be implemented in Phase 2
- **Mobile Support**: Some gaming APIs are not available on mobile - will show appropriate warnings
- **Service Worker**: First load may not cache all assets - refresh page if issues occur

## 📝 Contributing

This is currently in active development. Phase 1 is complete and ready for testing.

### Development Commands
```bash
npm start         # Start Python development server
npm run server    # Start Node.js development server  
npm test         # Run tests (placeholder)
```

---

**Built with ❤️ by the Spawnd Team**