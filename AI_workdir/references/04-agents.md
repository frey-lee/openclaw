# Agent System Architecture

## Overview
The agent system manages AI agent execution, including model selection, authentication, tool calling, and session management.

## Key Files
- `src/agents/agent-scope.ts` - Agent configuration resolution
- `src/agents/pi-embedded-runner/run.ts` - Main agent execution
- `src/agents/pi-tools.ts` - Tool creation
- `src/agents/model-selection.ts` - Model resolution
- `src/agents/model-fallback.ts` - Failover logic
- `src/agents/auth-profiles/` - Authentication management
- `src/agents/subagent-registry.ts` - Subagent lifecycle

## Agent Configuration
```typescript
AgentConfig {
  id: string;
  default?: boolean;
  name?: string;
  workspace?: string;
  agentDir?: string;
  model?: string | { primary, fallbacks[] };
  memorySearch?: MemorySearchConfig;
  humanDelay?: HumanDelayConfig;
  heartbeat?: HeartbeatConfig;
  identity?: IdentityConfig;
  groupChat?: GroupChatConfig;
  subagents?: { allowAgents[], model };
  sandbox?: SandboxConfig;
  tools?: AgentToolsConfig;
}
```

## Agent Execution Flow
1. **Resolve model** from catalog/config
2. **Check context window** constraints
3. **Resolve auth profiles** for provider
4. **Execute with fallback chain**
5. **Stream responses** via subscription

## Authentication Profiles
- Stored in `~/.clawdbot/agents/{agentId}/profiles.json`
- Types: `api-key`, `oauth`, `token`, `aws-sdk`
- Cooldown-based rotation after failures
- Usage tracking per profile

## Model Selection
- Format: `provider/model`
- Alias support via config
- Provider normalization (z.ai → zai, etc.)

## Failover Strategy
1. Try current auth profile
2. On failure → next profile
3. If all profiles fail → next fallback model
4. Error classification: auth, rate_limit, context_overflow, timeout, billing

## Tool System
- Coding tools (read, write, edit)
- Bash execution (exec, process)
- OpenClaw tools (sessions, messaging)
- Channel-specific tools
- Plugin tools

## Tool Policy (Layered)
1. Global policy
2. Agent-specific policy
3. Group chat policy
4. Profile policies
5. Provider-specific policies
6. Sub-agent policies

## Thinking Levels
- `off`, `minimal`, `low`, `medium`, `high`, `xhigh`
- Provider-specific support
- Automatic degradation on capacity issues

## Subagent System
- Cross-agent spawning via `sessions.spawn` tool
- Controlled by `subagents.allowAgents[]`
- Lifecycle: Created → Started → Ended → Announced
- Cleanup after `archiveAfterMinutes` (default: 60)

## Session Management
- Stored as JSONL files in `~/.clawdbot/sessions/`
- Session key format: `channel:provider:accountId:chatId`
- Write locking prevents concurrent modification
- Compaction for context window management
