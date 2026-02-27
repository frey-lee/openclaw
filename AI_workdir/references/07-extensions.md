# Extension/Plugin System

## Overview
30 bundled extensions providing channels, memory, capabilities, and authentication.

## Extension Categories
- **Channel Plugins (10)**: discord, slack, telegram, signal, imessage, whatsapp, googlechat, mattermost, line, nextcloud-talk
- **Communication (6)**: twitch, nostr, zalo, zalouser, bluebubbles, tlon
- **Capabilities (8)**: memory-core, memory-lancedb, llm-task, voice-call, copilot-proxy, diagnostics-otel, open-prose, lobster
- **Authentication (5)**: qwen-portal-auth, google-antigravity-auth, google-gemini-cli-auth

## Plugin Manifest (`openclaw.plugin.json`)
```json
{
  "id": "plugin-id",
  "name": "Display Name",
  "description": "Description",
  "version": "1.0.0",
  "kind": "memory",
  "channels": ["channel-id"],
  "providers": [],
  "skills": [],
  "configSchema": { "type": "object" }
}
```

## Plugin Loading Pipeline
1. **Discovery**: Scan config → workspace → global → bundled
2. **Manifest Loading**: Parse `openclaw.plugin.json`
3. **Enable Resolution**: Check allow/deny lists, memory slots
4. **Module Loading**: Dynamic import via jiti
5. **Activation**: Call `register(api)` function

## Plugin API (`OpenClawPluginApi`)
```typescript
{
  id, name, version, description;
  config: OpenClawConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;  // 150+ functions
  logger: PluginLogger;

  // Registration
  registerTool(tool | factory);
  registerHook(events, handler);
  registerChannel(plugin);
  registerGatewayMethod(method, handler);
  registerService(service);
  registerProvider(provider);
  registerCli(registrar);
}
```

## Hook System
- **Agent Hooks**: before_agent_start, agent_end, compaction
- **Message Hooks**: message_received, message_sending, message_sent
- **Tool Hooks**: before_tool_call, after_tool_call, tool_result_persist
- **Session Hooks**: session_start, session_end
- **Gateway Hooks**: gateway_start, gateway_stop

## Plugin Origins (Priority Order)
1. **Config** (`plugins.load.paths`) - highest
2. **Workspace** (`.openclaw/extensions/`)
3. **Global** (`~/.openclaw/extensions/`)
4. **Bundled** - lowest

## Memory Slot System
- Only one `kind: "memory"` plugin active
- Set via `plugins.slots.memory: "plugin-id"`
- Alternative memory plugins disabled

## Configuration
```json
{
  "plugins": {
    "enabled": true,
    "allow": ["plugin-id"],
    "deny": ["other-plugin"],
    "slots": { "memory": "memory-core" },
    "entries": {
      "plugin-id": { "enabled": true, "config": {} }
    }
  }
}
```
