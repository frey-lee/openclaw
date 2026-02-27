# OpenClaw Tools Reference Map

## 1. Tool Definition Types & Schemas

### Core Type Definitions

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-tools.types.ts` | 4 | `AnyAgentTool` (4) | Type alias for AgentTool from pi-agent-core with any schema |
| `schema/typebox.ts` | 44 | `stringEnum()` (15-23), `optionalStringEnum()` (26-30), `channelTargetSchema()` (33-36), `channelTargetsSchema()` (39-42) | TypeBox helper functions for safe string enums and channel schemas avoiding anyOf patterns |
| `tools/common.ts` | 226 | `AnyAgentTool` (9), `readStringParam()` (33-59), `readNumberParam()` (80-101), `readStringArrayParam()` (104-141), `jsonResult()` (171-180), `imageResult()` (183-206), `imageResultFromFile()` (209-224), `createActionGate()` (23-30), `ActionGate` (18-21), `StringParamOptions` (11-16), `ReactionParams` (144-148) | Common utilities for tool parameter parsing and result formatting |
| `tools/browser-tool.schema.ts` | 113 | BrowserToolSchema export | Browser tool parameter schema with TypeBox definitions |
| `schema/clean-for-gemini.ts` | 310+ | `cleanSchemaForGemini()` (main), `GEMINI_UNSUPPORTED_SCHEMA_KEYWORDS` (5-29), `cleanSchemaForGeminiWithDefs()` (138-299) | Schema normalization for Gemini/Cloud Code Assist API compatibility, strips unsupported keywords |

### Tool Parameter/Schema Adaptation

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-tools.schema.ts` | 153 | `normalizeToolParameters()` (49-148), `cleanToolSchemaForGemini()` (151-152) | Normalizes tool parameters for provider quirks (OpenAI/Gemini); flattens union schemas into single object schema |
| `pi-tools.read.ts` | 285 | `CLAUDE_PARAM_GROUPS` (99-112), `normalizeToolParams()` (118-137), `patchToolSchemaForClaudeCompatibility()` (140-184), `wrapToolParamNormalization()` (213-230), `createOpenClawReadTool()` (265-284), `createSandboxedReadTool/WriteTool/EditTool()` (250-262), `assertRequiredParams()` (187-209) | Claude Code parameter normalization (file_path->path, old_string->oldText, new_string->newText); sandbox path guards |

## 2. Tool Creation & Registration Pipeline

### Primary Tool Factory

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-tools.ts` | 420 | `createOpenClawCodingTools()` (107-420), `__testing` export (99-105) | Main factory for creating agent tools; applies policy filtering, schema normalization, and provider-specific adaptations; assembles all coding + OpenClaw tools |

### Tool Composition & Assembly

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `openclaw-tools.ts` | 161 | `createOpenClawTools()` (22-160) | Creates OpenClaw-native tools (browser, canvas, nodes, cron, message, gateway, agents_list, sessions*, web_*, image, memory_*, tts); integrates plugin tools |
| `channel-tools.ts` | 103 | `listChannelAgentTools()` (45-54), `listChannelSupportedActions()` (16-24), `listAllChannelSupportedActions()` (30-42), `resolveChannelMessageToolHints()` (57-70) | Aggregates channel-plugin-provided tools and message actions from channels (Slack, Telegram, etc.) |
| `bash-tools.ts` | 9 | Re-exports from bash-tools.exec/process | Unified entry point for exec and process tools |

### Individual Tool Implementations

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `tools/agents-list-tool.ts` | - | `createAgentsListTool()` | Lists available agents in the system |
| `tools/browser-tool.ts` | 714 | `createBrowserTool()` | Browser automation tool (tabs, navigation, screenshots, PDF, dialogs, console messages) |
| `tools/canvas-tool.ts` | 179 | `createCanvasTool()` | Canvas drawing/rendering tool for UI sketches |
| `tools/cron-tool.ts` | 290 | `createCronTool()` | Cron job scheduling tool |
| `tools/gateway-tool.ts` | 247 | `createGatewayTool()` | Gateway tool for system-level operations |
| `tools/image-tool.ts` | 432 | `createImageTool()` | Image processing and analysis tool (vision-enabled) |
| `tools/memory-tool.ts` | 112 | `createMemorySearchTool()` | Semantic memory search and retrieval |
| `tools/message-tool.ts` | 403 | `createMessageTool()` | Send/receive messages with auto-threading for Slack |
| `tools/nodes-tool.ts` | - | `createNodesTool()` | Device/node management tool |
| `tools/sessions-list-tool.ts` | 248 | `createSessionsListTool()` | List active sessions |
| `tools/sessions-history-tool.ts` | 265 | `createSessionsHistoryTool()` | Query session message history |
| `tools/sessions-send-tool.ts` | 627 | `createSessionsSendTool()` | Send messages to other sessions with action support |
| `tools/sessions-spawn-tool.ts` | 269 | `createSessionsSpawnTool()` | Spawn new subagent sessions |
| `tools/session-status-tool.ts` | 452 | `createSessionStatusTool()` | Query current session status |
| `tools/tts-tool.ts` | 60 | `createTtsTool()` | Text-to-speech tool |
| `tools/web-tools.ts` | 2 | Re-export: `createWebSearchTool()`, `createWebFetchTool()` | Web search and fetch tool entry points |
| `tools/web-search.ts` | 489 | `createWebSearchTool()` | Web search via configured provider |
| `tools/web-fetch.ts` | 624 | `createWebFetchTool()` | HTTP fetch with SSRF protection and readability extraction |

### Bash/Exec Tools

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `bash-tools.exec.ts` | 1495 | `createExecTool()` (major), `execTool` constant, `ExecToolDefaults` type, `ExecProcessOutcome` type | Command execution tool with PTY support, shell approval, background jobs, sandbox integration |
| `bash-tools.process.ts` | 654 | `createProcessTool()`, `ProcessToolDefaults` type | Background process management tool (monitoring, termination, stream handling) |
| `bash-tools.shared.ts` | - | `BashSandboxConfig` type, utility functions for sandbox env, Docker args, path resolution | Shared utilities for exec/process tools |

### Adapter/Wrapper Functions

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-tool-definition-adapter.ts` | 103 | `toToolDefinitions()` (26-67), `toClientToolDefinitions()` (72-102) | Adapts AgentTool array to ToolDefinition format for pi-coding-agent; bridges tool execution callbacks |
| `pi-tools.abort.ts` | 40 | `wrapToolWithAbortSignal()` (25-39), `combineAbortSignals()` (9-22) | Wraps tools to respect AbortSignal cancellation tokens |
| `apply-patch.ts` | - | `createApplyPatchTool()` | Apply JSON patch operations (OpenAI-specific feature) |

## 3. Tool Policy & Access Control

### Policy Resolution

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-tools.policy.ts` | 285 | `resolveEffectiveToolPolicy()` (182-224), `resolveGroupToolPolicy()` (227-277), `resolveSubagentToolPolicy()` (76-83), `isToolAllowedByPolicies()` (280-284), `isToolAllowedByPolicyName()` (86-88), `filterToolsByPolicy()` (91-94) | Resolves effective tool allow/deny policies across global, agent, group, provider, and sandbox contexts |
| `tool-policy.ts` | 234 | `normalizeToolName()` (78-80), `expandToolGroups()` (104-115), `resolveToolProfilePolicy()` (225-233), `stripPluginOnlyAllowlist()` (187-222), `expandPolicyWithPluginGroups()` (176-184), `buildPluginToolGroups()` (131-147), `collectExplicitAllowlist()` (118-128), `TOOL_GROUPS` (13-57), `TOOL_PROFILES` (59-75), `ToolProfileId`, `ToolPolicyLike`, `PluginToolGroups` | Core tool policy framework with groups and profiles |

### Sandbox Policy

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `sandbox/tool-policy.ts` | 124 | `resolveSandboxToolPolicyForAgent()` (53-123), `isToolAllowed()` (44-50), `expandToolGroups()` import/usage | Resolves sandbox-specific tool policies with defaults; agent-level override support |
| `sandbox/types.ts` | 86 | `SandboxToolPolicy`, `SandboxToolPolicySource`, `SandboxToolPolicyResolved`, `SandboxConfig`, `SandboxContext` types (5-80) | Type definitions for sandbox tool restrictions and context |
| `sandbox/constants.ts` | - | `DEFAULT_TOOL_ALLOW`, `DEFAULT_TOOL_DENY` | Sandbox tool policy defaults |

### Tool Groups (tool-policy.ts:13-57)

| Group | Tools |
|-------|-------|
| `group:fs` | read, write, edit, apply_patch |
| `group:runtime` | exec, process |
| `group:sessions` | sessions_list, sessions_history, sessions_send, sessions_spawn, session_status |
| `group:web` | web_search, web_fetch |
| `group:memory` | memory_search, memory_get |
| `group:messaging` | message |
| `group:ui` | browser, canvas |
| `group:automation` | cron, gateway |
| `group:nodes` | nodes |
| `group:openclaw` | All native OpenClaw tools (excludes plugins) |

### Tool Profiles

| Profile | Allowlist |
|---------|-----------|
| `minimal` | session_status only |
| `coding` | group:fs, group:runtime, group:sessions, group:memory, image |
| `messaging` | group:messaging, sessions_list/history/send/status |
| `full` | All (empty allowlist = unrestricted) |

## 4. Tool Execution & Result Handling

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-embedded-subscribe.tools.ts` | 151 | `sanitizeToolResult()` (45-66), `extractToolResultText()` (69-93), `truncateToolText()` (9-11) | Sanitizes and truncates tool result messages for embedding; removes sensitive image data |
| `session-tool-result-guard.ts` | 144 | `installSessionToolResultGuard()` (36-144) | Hooks into session manager to guard tool results; synthesizes missing tool results for strict providers |
| `tool-call-id.ts` | 188 | `sanitizeToolCallId()` (15-30), `isValidCloudCodeAssistToolId()` (33-39), `sanitizeToolCallIdsForCloudCodeAssist()` (144-188) | Sanitizes tool call IDs for provider compatibility (strict alphanumeric, Mistral 9-char requirement) |
| `tool-images.ts` | 208 | `sanitizeToolResultImages()` (main), `resizeImageBase64IfNeeded()` (42-120) | Downsizes oversized images in tool results to avoid API rejection (2000px max, 5MB limit) |
| `tool-display.ts` | 243 | `getToolDisplay()` (120-160), `ToolDisplay` type (24-30) | Provides emoji, title, label, and detail extraction for tool execution logging |
| `pi-embedded-runner/tool-split.ts` | 18 | Tool splitting utilities for streaming | Handles streaming tool execution in embedded agent mode |

## 5. Tool Validation & Compatibility

### Provider-Specific Adaptation

- **Anthropic**: Full feature support, OAuth tool name blocking quirks
- **OpenAI**: Requires `type: "object"` at schema root, applies-patch support
- **Google Gemini**: Strips unsupported JSON Schema keywords via `clean-for-gemini.ts`
- **Mistral**: 9-character alphanumeric tool call IDs

### Schema Normalization Flow

1. **Union Flattening** (`pi-tools.schema.ts`): anyOf/oneOf -> single object schema
2. **Gemini Scrubbing** (`schema/clean-for-gemini.ts`): Removes patternProperties, additionalProperties, $ref, etc.
3. **Parameter Adaptation** (`pi-tools.read.ts`): Claude Code -> pi-coding-agent parameter naming
4. **Type Enforcement** (`pi-tools.ts:410-411`): `normalizeToolParameters()` applied uniformly

## 6. Configuration

### Tool Policy Configuration Structure

```
config.tools:
  - allow?: string[]         # Global allowlist (tool names, groups)
  - deny?: string[]          # Global denylist
  - profile?: string         # Profile (minimal|coding|messaging|full)
  - alsoAllow?: string[]     # Additive allowlist for plugins
  - byProvider: {
      [provider]: {
        allow?, deny?, profile?, alsoAllow?
      }
    }
  - sandbox?.tools: { allow?, deny? }
  - exec: { host, security, ask, node, pathPrepend, safeBins, ... }

agents[].tools:
  - allow?, deny?, profile?, alsoAllow?
  - byProvider: { [provider]: { ... } }
  - sandbox?.tools: { allow?, deny? }
```

## Migration Status (openclaw vs openclaw-agent)

### Files Present in openclaw-agent

| openclaw-agent File | Status |
|---------------------|--------|
| `pi-tools.ts` | Migrated |
| `pi-tools.types.ts` | Migrated |
| `pi-tools.schema.ts` | Migrated |
| `pi-tools.read.ts` | Migrated |
| `pi-tools.abort.ts` | Migrated |
| `pi-tools.policy.ts` | Migrated |
| `pi-tool-definition-adapter.ts` | Migrated |
| `tool-policy.ts` | Migrated |
| `tool-images.ts` | Migrated |
| `openclaw-tools.ts` | Migrated |
| `channel-tools.ts` | Migrated |
| `bash-tools.ts` | Migrated |
| `bash-tools.exec.ts` | Migrated |
| `bash-tools.process.ts` | Migrated |
| `bash-tools.shared.ts` | Migrated |
| `apply-patch.ts` | Migrated |
| `apply-patch-update.ts` | Migrated |
| `sandbox/tool-policy.ts` | Migrated |
| `sandbox/types.ts` | Migrated |
| `sandbox/constants.ts` | Migrated |
| `session-tool-result-guard-wrapper.ts` | Migrated |
| `schema/clean-for-gemini.ts` | Migrated |
| `tools/common.ts` | Migrated |
| `tools/browser-tool.ts` | Migrated |
| `tools/browser-tool.schema.ts` | Migrated |
| `tools/canvas-tool.ts` | Migrated |
| `tools/cron-tool.ts` | Migrated |
| `tools/gateway-tool.ts` | Migrated |
| `tools/image-tool.ts` | Migrated |
| `tools/message-tool.ts` | Migrated |
| `tools/nodes-tool.ts` | Migrated |
| `tools/sessions-*.ts` | Migrated (all 5) |
| `tools/tts-tool.ts` | Migrated |
| `tools/web-tools.ts` | Migrated |

### Files ONLY in openclaw (NOT Migrated)

| File | Notes |
|------|-------|
| `session-tool-result-guard.ts` | Core guard logic (wrapper exists but not the guard itself) |
| `tool-call-id.ts` | Provider-specific tool call ID sanitization |
| `tool-display.ts` | Tool display metadata for logging |
| `tool-display.json` | Tool display config |
| `pi-embedded-subscribe.tools.ts` | Tool result sanitization for streaming |
| `pi-embedded-runner/tool-split.ts` | Streaming tool execution |
| `tools/web-search.ts` | Full web search implementation |
| `tools/web-fetch.ts` | Full web fetch implementation |
| `tools/memory-tool.ts` | Memory search tool |
| `tools/agents-list-tool.ts` | Agents list tool |
