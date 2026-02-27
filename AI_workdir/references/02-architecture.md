# OpenClaw Core Architecture

## High-Level Architecture

OpenClaw follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  (CLI, Control UI, WebChat, iOS, Android, Remote Nodes)     │
└─────────────────────────────────────────────────────────────┘
                            │
                    WebSocket/HTTP
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Server                            │
│  - HTTP/WebSocket server                                     │
│  - Request/Response routing (80+ RPC methods)               │
│  - Event broadcasting                                        │
│  - Session management                                        │
│  - Node registry                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Agent System                              │
│  - Model selection & failover                               │
│  - Auth profile rotation                                     │
│  - Tool execution                                            │
│  - Session/memory management                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Provider Layer                            │
│  - Anthropic, OpenAI, Google, Bedrock, Copilot, etc.       │
│  - Streaming responses                                       │
│  - Token management                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Channel Layer                             │
│  - WhatsApp, Telegram, Discord, Slack, etc.                 │
│  - Message routing & delivery                               │
│  - Platform-specific formatting                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Gateway Server (`src/gateway/`)
- Central HTTP/WebSocket server
- 80+ RPC methods for agent control, configuration, monitoring
- Event broadcasting with scope-based filtering
- Node registry for remote compute nodes
- Session state management
- Graceful lifecycle (startup, hot-reload, shutdown)

### 2. Agent System (`src/agents/`)
- Pi agent runner (main agent loop)
- Model selection with alias support
- Multi-profile authentication with cooldown
- Tool definition and policy enforcement
- Subagent spawning and lifecycle
- Memory search integration

### 3. Provider Integration
- Anthropic, OpenAI, Google, AWS Bedrock
- GitHub Copilot, MiniMax, Moonshot, Qwen
- Dynamic model discovery (Bedrock, Ollama, Venice)
- Failover with error classification
- Streaming response handling

### 4. Plugin/Extension System
- 29+ channel extensions
- Plugin-provided tools and methods
- Manifest-based configuration
- Hot-reload support

### 5. Skills System
- 50+ modular skills
- Built-in and workspace skills
- Plugin-provided skills
- Environment variable overrides

## Data Flow

1. **Inbound**: Channel → Gateway → Agent → Provider → Response
2. **Outbound**: Response → Agent → Gateway → Channel → User
3. **Events**: Gateway broadcasts to all connected clients

## Storage Locations
- Config: `~/.openclaw/config.yaml`
- Sessions: `~/.clawdbot/sessions/`
- Agent state: `~/.clawdbot/agents/{agentId}/`
- Memory: `~/.clawdbot/memory/{agentId}.sqlite`
- Auth profiles: `~/.clawdbot/agents/{agentId}/profiles.json`
