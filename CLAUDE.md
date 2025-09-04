# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Browser Game Compatibility Checker** - a web tool that tests browser compatibility with modern web game technologies used in platforms like spawnd. The tool runs real JavaScript-based API tests and provides personalized recommendations to end-users, including non-technical gamers.

## Core Architecture

The project follows a **client-side only approach** with no backend required:

### Key Components
- **Feature Detection Engine**: JavaScript-based real API testing (not user-agent string based)
- **Browser & System Identification**: Detects browser name/version, OS, rendering engine
- **Test Suite**: Comprehensive testing of gaming-critical APIs
- **Report Generation**: Visual results with actionable recommendations
- **Interference Detection**: Heuristics to detect extension/antivirus blocking

### Critical APIs to Test
The tool must test these gaming-essential APIs using real detection:
- **WebAssembly** (including SIMD/Threads via `wasm-feature-detect`)
- **WebGL 1.0/2.0** via canvas context creation
- **WebGPU** via `navigator.gpu` + command submission
- **WebRTC** via `RTCPeerConnection` + ICE candidates
- **WebSockets** via connection to `wss://echo.websocket.events`
- **Storage APIs** (IndexedDB, localStorage, sessionStorage)
- **Gaming APIs** (Pointer Lock, Fullscreen, Gamepad, AudioContext)
- **SharedArrayBuffer** with COOP/COEP considerations

### Result States
Each test returns one of three states:
- ✅ **Fully supported**
- ⚠️ **Partially supported** 
- ❌ **Not supported**

## Recommended Tech Stack

- **Frontend**: HTML + CSS (Tailwind suggested) + Vanilla JavaScript or React
- **Feature Detection**: Vanilla JavaScript preferred for maximum compatibility
- **Browser Compatibility Data**: Optional integration with caniuse.com raw data: https://raw.githubusercontent.com/Fyrd/caniuse/refs/heads/main/fulldata-json/data-2.0.json
- **No Backend Required**: Static site deployment

## Development Guidelines

### Testing Approach
- Use **real API detection** rather than user-agent parsing
- Implement **progressive testing** with fallbacks for each API
- Include **heuristic interference detection** for blocked APIs
- Test on multiple browsers during development

### UI/UX Requirements
- **Simple landing page** with "Start Test" button
- **Visual progress indicator** during testing
- **Clear results table** with color-coded status icons
- **Personalized recommendations** in plain language
- **Browser-specific guidance** (e.g., Chrome flags, Firefox settings)

### Interference Detection Heuristics
Include checks for:
- Missing or undefined APIs (extensions/antivirus blocking)
- SharedArrayBuffer blocked (COOP/COEP issues)
- Spoofed user agents (privacy extensions)
- DOM modifications (password managers, adblockers)
- External resource blocking (firewalls, adblockers)

## Target Output Format

The tool should generate reports like:
```
🖥️ Browser: Chrome 117.0.5938 / Windows 10

✅ WebGL 1.0: Supported  
✅ WebGL 2.0: Supported  
⚠️ WebGPU: Partial support (enable via chrome://flags)  
✅ WASM: Supported  
❌ SharedArrayBuffer: Not available  
✅ Gamepad API: Supported, but no controller detected  

📋 Recommendations:
- Enable WebGPU in chrome://flags
- Use Chrome or Edge for better compatibility
- Connect your gamepad before launching the game
```

## Future Enhancements (Optional)
- PDF/clipboard export of reports
- Developer mode with raw JSON output
- Integration with spawnd support diagnostics