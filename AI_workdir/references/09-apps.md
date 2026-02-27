# Native Apps Architecture

## Overview
OpenClaw provides native apps for iOS, Android, and macOS that connect to the central Gateway and expose device capabilities.

## Shared Architecture (OpenClawKit)
**Location:** `apps/shared/OpenClawKit`

Three core libraries:
1. **OpenClawProtocol** - Shared types and constants
2. **OpenClawKit** - Gateway communication layer
3. **OpenClawChatUI** - Reusable chat interface

### Bridge Protocol
Bidirectional WebSocket communication:
- `BridgeInvokeRequest/Response` - Command invocation
- `BridgeEventFrame` - Async event streaming
- `BridgeHello/HelloOk` - Connection handshake
- `BridgePairRequest/PairOk` - Device pairing
- `BridgePing/Pong` - Keepalive

### Device Capabilities
- `canvas` - Web-based UI rendering
- `camera` - Photo/video capture
- `screen` - Screen recording
- `voiceWake` - Voice commands
- `location` - GPS/location access

## iOS Application
**Location:** `apps/ios`
**Framework:** SwiftUI 18+, MVVM + Observation

### Key Components
- `NodeAppModel` - Central state hub (962 lines)
- `GatewayConnectionController` - Discovery + connection
- `ScreenController` - WebView orchestration
- `CameraController` - AVFoundation camera
- `VoiceWakeManager` - Voice command detection
- `LocationService` - CLLocationManager wrapper

### UI Modes
- **Tab View**: Screen + Voice + Settings tabs
- **Canvas View**: Immersive full-screen canvas

## Android Application
**Location:** `apps/android`
**Framework:** Kotlin + Jetpack Compose, MVVM + StateFlow

### Key Components
- `MainActivity` - Compose-based entry point
- `NodeForegroundService` - Background connection service
- `MainViewModel` - StateFlow-based state
- `NodeRuntime` - Core orchestrator
- `CameraCaptureManager` - CameraX integration
- `ScreenRecordManager` - MediaProjection recording

### Permissions
- `NEARBY_WIFI_DEVICES` (Android 13+) - Discovery
- `CAMERA`, `RECORD_AUDIO` - Media capture
- `POST_NOTIFICATIONS` - Foreground service

## macOS Application
**Location:** `apps/macos`
**Framework:** SwiftUI + SPM, macOS 15+

### Components
- Menu bar app + windows
- CLI tool (`openclaw-mac`)
- Sparkle auto-updates
- OAuth authentication flows
- Agent workspace management

## Gateway Connection Flow
```
1. Discovery (Bonjour/mDNS: _openclaw-gw._tcp)
2. WebSocket Handshake
   ├─ BridgeHello (capabilities)
   ├─ BridgePairRequest (if new device)
   ├─ BridgeHelloOk (gateway info)
   └─ Connection established
3. Bidirectional RPC (invoke/event)
4. Ping/Pong keepalive
```

## Commands

### Canvas
- `canvas.present/hide/navigate/eval/snapshot`
- `canvas.a2ui.reset/push/push.jsonl`

### Camera
- `camera.list` - Enumerate cameras
- `camera.snap` - Photo (JPEG/PNG)
- `camera.clip` - Video (MP4)

### Screen
- `screen.record` - MP4 with optional audio

### Location
- `location.get` - Current position

## Security
- TLS certificate pinning
- Device pairing approval workflow
- Token-based authentication
- Capability negotiation
