# Channel Integration Architecture

## Overview
OpenClaw supports 20+ messaging channels through a modular plugin architecture with clear separation between abstractions and implementations.

## Core Channels (7)
1. **Telegram** - Bot API, topics/threads, block streaming
2. **WhatsApp** - QR-based web client, polls, reactions
3. **Discord** - Bot API, full threads, streaming
4. **Google Chat** - HTTP webhook, threads, reactions
5. **Slack** - Socket Mode, threads, native commands
6. **Signal** - signal-cli REST API, groups, reactions
7. **iMessage** - imsg service, macOS native, groups

## Channel Plugin Contract
```typescript
ChannelPlugin {
  id: ChannelId;
  meta: ChannelMeta;
  capabilities: ChannelCapabilities;

  // Adapters
  config: ChannelConfigAdapter;
  auth?: ChannelAuthAdapter;
  outbound?: ChannelOutboundAdapter;
  gateway?: ChannelGatewayAdapter;
  groups?: ChannelGroupAdapter;
  threading?: ChannelThreadingAdapter;
  actions?: ChannelMessageActionAdapter;
  status?: ChannelStatusAdapter;
  agentTools?: ChannelAgentToolFactory;
}
```

## Capabilities
```typescript
ChannelCapabilities {
  chatTypes: ["direct" | "group" | "channel" | "thread"];
  polls?: boolean;
  reactions?: boolean;
  edit?: boolean;
  unsend?: boolean;
  reply?: boolean;
  threads?: boolean;
  media?: boolean;
  nativeCommands?: boolean;
  blockStreaming?: boolean;
}
```

## Message Routing
```
Incoming Message
  → Channel Monitor
  → Normalize (from, to, chatType, messageId)
  → Resolve Route (channel + account + peer → sessionKey → agentId)
  → Route to Agent
  → Agent processes → messaging tools
  → Dispatch Message Actions
  → Channel Outbound Adapter
  → Send via Channel API
```

## Session Key Format
- Main session: `agent:main:main`
- Per-peer: `agent:main:dm:12345`
- Per-channel-peer: `agent:main:telegram:dm:12345`
- Group: `agent:main:telegram:group:group123`
- Threads: `agent:main:telegram:group:channel123:thread:456`

## Threading Modes
- `off` - No threading
- `first` - Reply to first message only
- `all` - Reply to all messages (full thread)

## Message Actions
- `send`, `reply`, `react`, `unreact`
- `edit`, `unsend`
- `thread-create`, `thread-reply`
- `poll`, `sendWithEffect`

## Channel Dock (Lightweight)
The "dock" holds lightweight metadata for shared code paths:
- Config readers
- Allowlist formatters
- Mention patterns
- Threading defaults
- Streaming configuration

## Extension Development
```typescript
// extensions/my-channel/index.ts
export default {
  id: "my-channel",
  register(api) {
    api.registerChannel({ plugin: myChannelPlugin });
  },
};
```
