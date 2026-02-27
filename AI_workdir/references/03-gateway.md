# Gateway Server Architecture

## Overview
The gateway server is the central hub of OpenClaw, providing HTTP/WebSocket interfaces for all client communications.

## Key Files
- `src/gateway/server.impl.ts` - Main entry point
- `src/gateway/server-http.ts` - HTTP request handlers
- `src/gateway/server/ws-connection.ts` - WebSocket connection handler
- `src/gateway/server-methods/` - 30+ RPC handler files
- `src/gateway/protocol/` - Protocol definitions and schemas

## HTTP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Control UI (browser dashboard) |
| `/a2ui/*` | GET | Canvas host (live editing) |
| `/v1/chat/completions` | POST | OpenAI API compatibility |
| `/v1/responses` | POST | Custom response format |
| `/hooks/*` | POST | Webhooks/external integrations |
| `/api/plugins/*` | POST | Plugin HTTP endpoints |
| `/api/tools/invoke` | POST | Direct tool execution |

## WebSocket Protocol

### Connection Flow
1. Client connects via HTTP upgrade
2. Server sends `connect.challenge` with nonce
3. Client sends `connect` request with auth
4. Server validates and registers client
5. Active request/response phase begins

### Frame Types
- **Request**: `{ type: "request", id, method, params }`
- **Response**: `{ type: "response", id, ok, payload }`
- **Event**: `{ type: "event", event, payload, seq }`

### Client Types
- `cli` - Command-line interface
- `control-ui` - Browser dashboard
- `webchat` - WebChat UI
- `ios` / `android` - Mobile apps
- `node` - Remote compute node

## RPC Methods (80+)

### Core Methods
- `health` - System health status
- `status` - Gateway status
- `config.get/set/patch` - Configuration management

### Agent Methods
- `agent` - Send message to agent
- `agent.wait` - Wait for response
- `agents.list` - List available agents

### Session Methods
- `sessions.list/preview/patch/reset/delete/compact`

### Chat Methods (WebChat)
- `chat.send` - Send chat message
- `chat.abort` - Abort chat run
- `chat.history` - Get chat history

### Node Methods
- `node.list/describe/invoke/pair/*`

### Channel Methods
- `channels.status/logout`

## Event Broadcasting
- Events broadcast to all connected clients
- Scope guards: `operator.admin`, `operator.approvals`, `operator.pairing`
- Slow client detection (>1.5MB buffered → disconnect)

## Maintenance Timers
- **Tick (30s)**: Keepalive broadcast
- **Health Refresh (60s)**: Update health snapshot
- **Dedupe Cleanup**: Remove expired cache entries (5min TTL)

## Authentication
- Token-based (Bearer or custom header)
- Password-based
- Tailscale identity
- Device certificates
- Local loopback bypass

## Key Constants
```
MAX_PAYLOAD_BYTES = 512 KB
MAX_BUFFERED_BYTES = 1.5 MB
HANDSHAKE_TIMEOUT = 10 seconds
TICK_INTERVAL = 30 seconds
HEALTH_REFRESH = 60 seconds
DEDUPE_TTL = 5 minutes
```
