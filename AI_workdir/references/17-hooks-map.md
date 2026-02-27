# OpenClaw Hooks Reference Map

## 1. Core Hooks Infrastructure

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `hooks/internal-hooks.ts` | 175 | `registerInternalHook` (67-72), `triggerInternalHook` (123-143), `createInternalHookEvent` (153-167), `InternalHookEvent`, `InternalHookHandler`, `AgentBootstrapHookEvent` | Core event-driven hook system; manages registration and triggering with type-safe event handling |
| `hooks/hooks.ts` | 14 | `registerHook`, `unregisterHook`, `clearHooks`, `triggerHook`, `createHookEvent` (re-exports) | Public API barrel for hook system |
| `hooks/types.ts` | 67 | `Hook`, `HookEntry`, `HookSource`, `HookMetadata`, `OpenClawHookMetadata`, `HookInstallSpec`, `HookSnapshot` | Type definitions for hooks system |
| `hooks/config.ts` | 136 | `resolveHookConfig`, `shouldIncludeHook`, `isConfigPathTruthy`, `resolveConfigPath`, `hasBinary`, `resolveRuntimePlatform` | Hook eligibility and configuration resolution; checks OS, binaries, env vars, config requirements |
| `hooks/frontmatter.ts` | 128 | `parseFrontmatter`, `resolveOpenClawMetadata`, `resolveHookInvocationPolicy`, `resolveHookKey` | Parses HOOK.md frontmatter; extracts metadata, installation specs, invocation policies |
| `hooks/loader.ts` | 146 | `loadInternalHooks` | Dynamically loads and registers hook handlers from directories and config |
| `hooks/plugin-hooks.ts` | 115 | `registerPluginHooksFromDir`, `PluginHookLoadResult` | Loads hooks from plugin hook directories; normalizes entries and handles eligibility |

## 2. Hook Management & Installation

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `hooks/workspace.ts` | 272 | `loadWorkspaceHookEntries`, `loadHookEntriesFromDir`, `buildWorkspaceHookSnapshot` | Scans workspace, bundled, managed, and extra directories; merges hooks with proper precedence |
| `hooks/install.ts` | 438 | `installHooksFromPath`, `installHooksFromNpmSpec`, `installHooksFromArchive`, `resolveHookInstallDir`, `InstallHooksResult` | Installs hook packages from npm specs, archives, or local paths |
| `hooks/installs.ts` | 30 | `recordHookInstall`, `HookInstallUpdate` | Records hook installation metadata in config |
| `hooks/bundled-dir.ts` | 40 | `resolveBundledHooksDir` | Resolves bundled hooks directory; supports bun compile, npm, and dev environments |
| `hooks/hooks-status.ts` | 219 | `buildWorkspaceHookStatus`, `HookStatusEntry`, `HookStatusReport` | Analyzes hook eligibility and generates status reports |
| `hooks/llm-slug-generator.ts` | 84 | LLM-based slug generation | Helper for generating descriptive slugs from content using LLM |

## 3. Bundled Hook Handlers

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `hooks/bundled/boot-md/handler.ts` | 27 | `runBootChecklist` | Runs boot checklist on gateway startup; handles "gateway:startup" events |
| `hooks/bundled/command-logger/handler.ts` | 66 | Command logging handler | Logs command invocations; handles "command:*" events |
| `hooks/bundled/session-memory/handler.ts` | 182 | Session memory handler | Saves session context to memory on /new command |
| `hooks/bundled/soul-evil/handler.ts` | 40 | Soul-evil handler | Specialized handler for soul-evil feature |

## 4. Plugin Hook System

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `plugins/hooks.ts` | 460 | `createHookRunner`, `HookRunner`, `HookRunnerOptions`, lifecycle functions (runBeforeAgentStart, runMessageSending, runToolResultPersist, etc.) | Creates hook runners for plugins; executes lifecycle hooks with ordering and error handling; supports both void and modifying hooks |
| `plugins/hook-runner-global.ts` | 67 | `initializeGlobalHookRunner`, `getGlobalHookRunner`, `hasGlobalHooks`, `resetGlobalHookRunner` | Singleton global hook runner initialized during plugin load; accessible from anywhere |
| `plugins/registry.ts` | 511 | `PluginHookRegistration`, `PluginRecord` | Plugin registry managing hooks alongside tools, channels, services |
| `plugins/types.ts` | ~400 | `PluginHookRegistration`, `PluginHookName`, `OpenClawPluginHookOptions`, `PluginHookHandlerMap` | Type definitions for plugin hook system with all lifecycle hook types |

## 5. Agent Bootstrap Hooks

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `agents/bootstrap-hooks.ts` | 31 | `applyBootstrapHookOverrides` | Applies agent bootstrap hooks to modify workspace bootstrap files; triggers "agent:bootstrap" events |

## 6. Gateway Hooks (Webhook System)

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `gateway/hooks.ts` | 216 | `resolveHooksConfig`, `extractHookToken`, `readJsonBody`, `HooksConfigResolved` | HTTP webhook management; config resolution, bearer/header token extraction |
| `gateway/hooks-mapping.ts` | 387 | `resolveHookMappings`, `HookMappingResolved`, `HookAction` | Maps webhooks to agent actions ("wake" or "agent" modes); handles templates and transformations |
| `gateway/server/hooks.ts` | 116 | `createGatewayHooksRequestHandler` | HTTP request handler for webhooks; dispatches wake and agent actions |

## 7. CLI Commands

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `cli/hooks-cli.ts` | 838 | `registerHooksCli`, `formatHooksList`, `formatHookInfo`, `enableHook`, `disableHook` | CLI: list, info, check, enable, disable, install, update |

## 8. Configuration Types

| File Path | Lines | Key Exports | Description |
|-----------|-------|------------|-------------|
| `config/types.hooks.ts` | 125 | `HooksConfig`, `InternalHooksConfig`, `HookConfig`, `HookMappingConfig`, `HooksGmailConfig`, `InternalHookHandlerConfig` | Type definitions for all hooks configuration |

---

## Hook Event Types

### Internal Hook Events

```typescript
// Event types: "command", "session", "agent", "gateway"
// Event actions: "new", "reset", "stop", "bootstrap", "startup", etc.
// Registered with: registerInternalHook("type:action", handler)
```

### Plugin Hook Lifecycle

| Hook | Type | Description |
|------|------|-------------|
| `before_agent_start` | Sequential, modifying | Inject context into system prompt |
| `agent_end` | Parallel, fire-and-forget | Analyze completed conversations |
| `message_received` | Parallel | Process incoming messages |
| `message_sending` | Sequential, modifying | Modify outgoing messages |
| `message_sent` | Parallel | Handle sent messages |
| `before_tool_call` | Sequential, modifying | Block or modify tool calls |
| `after_tool_call` | Parallel | Analyze tool execution |
| `tool_result_persist` | Sequential, synchronous | Transform persisted tool results |
| `session_start` | Parallel | Session initialization |
| `session_end` | Parallel | Session cleanup |
| `before_compaction` | Parallel | Pre-compaction hook |
| `after_compaction` | Parallel | Post-compaction hook |
| `gateway_start` | Parallel | Gateway initialization |
| `gateway_stop` | Parallel | Gateway shutdown |

### Agent Bootstrap Hook Event

- Event: `agent:bootstrap`
- Context: `{ workspaceDir, bootstrapFiles, cfg, sessionKey, sessionId, agentId }`
- Allows modification of bootstrap files before agent initialization

## Hook Sources (Priority Order - Highest to Lowest)

1. **openclaw-workspace** — User-created hooks in workspace
2. **openclaw-managed** — Managed hooks in `~/.openclaw/hooks`
3. **openclaw-bundled** — Built-in bundled hooks
4. **openclaw-plugin** — Plugin-provided hooks

## Hook Eligibility Requirements

- `bins` — All listed binaries must be present
- `anyBins` — At least one binary must be present
- `env` — Environment variables must be set
- `config` — Config paths must be truthy
- `os` — Operating system restrictions
- `always` — Bypass all eligibility checks

## Two Parallel Hook Systems

1. **Plugin Hooks** (`plugins/hooks.ts`) — Lifecycle hooks for plugin integration (async, modifying)
2. **Internal Hooks** (`hooks/internal-hooks.ts`) — Event-driven agent hooks (async, fire-and-forget)

Plugin hook runner is initialized as singleton in `hook-runner-global.ts`. Internal hooks are loaded via `hooks/loader.ts` during agent bootstrap. Both systems are independently managed.

## Key File Relationships

```
plugins/hooks.ts (HookRunner)
    -> plugins/hook-runner-global.ts (Global access)
    -> agents/bootstrap-hooks.ts (Agent bootstrap)
    -> hooks/internal-hooks.ts (Event dispatch)
    -> hooks/loader.ts (Hook loading)
    -> hooks/workspace.ts (Hook discovery)
    -> hooks/config.ts (Eligibility)
    -> hooks/hooks-status.ts (Status)
    -> cli/hooks-cli.ts (User commands)
```

---

## Migration Status (openclaw vs openclaw-agent)

### Files Present in openclaw-agent
- `plugins/hook-runner-global.ts` (migrated)
- `plugins/tools.ts` (migrated)
- `agents/bootstrap-hooks.ts` (placeholder — passes files through unchanged)

### Files ONLY in openclaw (NOT Migrated)
- `hooks/internal-hooks.ts` (core event system)
- `hooks/hooks.ts` (public API barrel)
- `hooks/types.ts` (type definitions)
- `hooks/config.ts` (eligibility logic)
- `hooks/frontmatter.ts` (HOOK.md parsing)
- `hooks/loader.ts` (dynamic loading)
- `hooks/plugin-hooks.ts` (plugin integration)
- `hooks/workspace.ts` (hook discovery)
- `hooks/install.ts` (installation logic)
- `hooks/installs.ts` (installation tracking)
- `hooks/bundled-dir.ts` (bundled location resolver)
- `hooks/hooks-status.ts` (status reporting)
- `hooks/llm-slug-generator.ts` (LLM slug generation)
- `hooks/bundled/*/handler.ts` (4 bundled handlers)
- `plugins/hooks.ts` (HookRunner implementation)
- `plugins/registry.ts` (plugin registry)
- `plugins/types.ts` (plugin types)
- `gateway/hooks.ts` (webhook config)
- `gateway/hooks-mapping.ts` (webhook mapping)
- `gateway/server/hooks.ts` (webhook handler)
- `cli/hooks-cli.ts` (CLI commands)
- `config/types.hooks.ts` (configuration types)

### Note
The hooks system is the most complex and least-migrated topic. The `hook-runner-global.ts` placeholder exists in openclaw-agent but the entire `hooks/` directory (~20+ files) has not been migrated. The `bootstrap-hooks.ts` is a no-op placeholder. For the openclaw-agent extraction, a minimal hook system (just the internal event dispatch + bootstrap hooks) may be sufficient.
