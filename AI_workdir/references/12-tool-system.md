# Topic 2: Tool System

## What It Does

The Tool System creates, registers, configures, filters, and adapts the full set of agent tools that are passed to the pi-runner's `createAgentSession()`. It assembles tools from three sources: (1) **pi-coding-agent built-in tools** (read, write, edit), (2) **OpenClaw-specific tools** (browser, sessions, web, messaging, etc.), and (3) **plugin tools** (user-installed extensions). All tools pass through schema normalization, policy filtering, Claude Code compatibility patching, abort signal wiring, and provider-specific sanitization before reaching the LLM.

The central function is `createOpenClawCodingTools()` in `pi-tools.ts`.

---

## Key Types and Interfaces

### AgentTool (from `@mariozechner/pi-agent-core`)

The pi-runner's tool interface. All tools must conform to this shape:

```typescript
type AgentTool<TParams = any, TDetails = unknown> = {
  name: string;                    // Canonical lowercase name (e.g., "exec", "browser")
  label?: string;                  // Display label
  description?: string;            // Tool description for the LLM
  parameters?: TSchema;            // JSON Schema for params (TypeBox)
  execute: (
    toolCallId: string,            // Unique call identifier
    params: TParams,               // Parsed parameters from the LLM
    signal?: AbortSignal,          // Cancellation signal
    onUpdate?: AgentToolUpdateCallback<TDetails>,  // Progress updates
  ) => Promise<AgentToolResult<TDetails>>;
};
```

### AgentToolResult (from `@mariozechner/pi-agent-core`)

```typescript
type AgentToolResult<TDetails = unknown> = {
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  >;
  details?: TDetails;              // Structured metadata (not sent to LLM)
};
```

### AnyAgentTool (`pi-tools.types.ts:4` and `tools/common.ts:9`)

Convenience alias used throughout OpenClaw:
```typescript
type AnyAgentTool = AgentTool<any, unknown>;
```

### ToolDefinition (from `@mariozechner/pi-coding-agent`)

The pi-runner's custom tool interface (slightly different execute signature):
```typescript
type ToolDefinition = {
  name: string;
  label: string;
  description: string;
  parameters: any;
  execute: (
    toolCallId: string,
    params: unknown,
    onUpdate: AgentToolUpdateCallback<unknown> | undefined,
    ctx: unknown,
    signal?: AbortSignal,
  ) => Promise<AgentToolResult<unknown>>;
};
```

---

## Tool Inventory

### Pi-Coding-Agent Built-in Tools (from `codingTools` export)

| Tool | Source | Description |
|------|--------|-------------|
| `read` | `@mariozechner/pi-coding-agent` | Read files. OpenClaw wraps this with image normalization and Claude Code param aliases. |
| `write` | `@mariozechner/pi-coding-agent` | Write files. Wrapped with param normalization. |
| `edit` | `@mariozechner/pi-coding-agent` | Edit files (search/replace). Wrapped with param normalization. |

Note: `bash` is explicitly excluded from `codingTools` (`pi-tools.ts:237`) and replaced with OpenClaw's own `exec` tool.

### OpenClaw Core Tools (created in `pi-tools.ts:253-303`)

| Tool | Factory | Description |
|------|---------|-------------|
| `exec` | `createExecTool()` | Shell command execution with approval, sandbox, PTY support |
| `process` | `createProcessTool()` | Background process management (kill, list) |
| `apply_patch` | `createApplyPatchTool()` | OpenAI-style unified diff patches (gated to OpenAI providers) |

### OpenClaw Extension Tools (created in `openclaw-tools.ts:56-161`)

| Tool | Factory | Source File |
|------|---------|-------------|
| `browser` | `createBrowserTool()` | `tools/browser-tool.ts` |
| `canvas` | `createCanvasTool()` | `tools/canvas-tool.ts` |
| `nodes` | `createNodesTool()` | `tools/nodes-tool.ts` |
| `cron` | `createCronTool()` | `tools/cron-tool.ts` |
| `message` | `createMessageTool()` | `tools/message-tool.ts` |
| `tts` | `createTtsTool()` | `tools/tts-tool.ts` |
| `gateway` | `createGatewayTool()` | `tools/gateway-tool.ts` |
| `agents_list` | `createAgentsListTool()` | `tools/agents-list-tool.ts` |
| `sessions_list` | `createSessionsListTool()` | `tools/sessions-list-tool.ts` |
| `sessions_history` | `createSessionsHistoryTool()` | `tools/sessions-history-tool.ts` |
| `sessions_send` | `createSessionsSendTool()` | `tools/sessions-send-tool.ts` |
| `sessions_spawn` | `createSessionsSpawnTool()` | `tools/sessions-spawn-tool.ts` |
| `session_status` | `createSessionStatusTool()` | `tools/session-status-tool.ts` |
| `web_search` | `createWebSearchTool()` | `tools/web-search.ts` |
| `web_fetch` | `createWebFetchTool()` | `tools/web-fetch.ts` |
| `image` | `createImageTool()` | `tools/image-tool.ts` |

### Channel-Provided Tools (from `channel-tools.ts:45-55`)

Channel plugins (Telegram, Discord, Slack, WhatsApp) can provide additional tools via the `agentTools` hook. These are aggregated by `listChannelAgentTools()` and injected at `pi-tools.ts:303`.

| Module | Tools Provided |
|--------|---------------|
| `tools/telegram-actions.ts` | Telegram-specific actions (send, pin, react, etc.) |
| `tools/discord-actions.ts` | Discord-specific actions (messaging, moderation, guild) |
| `tools/slack-actions.ts` | Slack-specific actions |
| `tools/whatsapp-actions.ts` | WhatsApp-specific actions |

### Plugin Tools (`plugins/tools.ts:37-80`)

Third-party tools loaded via `resolvePluginTools()`. These are:
- Loaded from the plugin registry (`loadOpenClawPlugins()`)
- Gated by explicit allowlists (must appear in tool policy `allow` list or `group:plugins`)
- Deduplicated against existing core tool names
- Tagged with `PluginToolMeta` (WeakMap) for identification during policy resolution

---

## Code Flow: Tool Assembly Pipeline

### Step 1: Tool Policy Resolution (`pi-tools.ts:156-213`)

Before any tools are created, the system resolves the effective tool policies from multiple layers:

```
resolveEffectiveToolPolicy()  →  globalPolicy, agentPolicy, profile, providerPolicy
resolveGroupToolPolicy()       →  channel/group-specific restrictions
resolveSubagentToolPolicy()    →  subagent deny list
resolveToolProfilePolicy()     →  profile-based allow/deny
```

Policy layers (from `pi-tools.policy.ts:182-225`):
- **Profile policy** - Named profiles (`minimal`, `coding`, `messaging`, `full`)
- **Provider profile policy** - Per-provider/model profile overrides
- **Global policy** - `config.tools.allow/deny`
- **Global provider policy** - `config.tools.byProvider[provider].allow/deny`
- **Agent policy** - `config.agents[agentId].tools.allow/deny`
- **Agent provider policy** - `config.agents[agentId].tools.byProvider[provider]`
- **Group policy** - Channel/group-level restrictions
- **Sandbox policy** - Sandbox-imposed tool restrictions
- **Subagent policy** - Default deny list for spawned subagents

### Step 2: Base Tool Assembly (`pi-tools.ts:229-251`)

The `codingTools` array from pi-coding-agent is iterated. Each tool is either:
- **Replaced**: `read` → `createOpenClawReadTool()` (with image normalization + Claude Code aliases)
- **Excluded**: `bash`/`exec` → replaced by OpenClaw's own `createExecTool()`
- **Wrapped**: `write`/`edit` → wrapped with `wrapToolParamNormalization()` for Claude Code compatibility
- **Passed through**: Other coding tools kept as-is

In sandbox mode, `read`/`write`/`edit` are replaced with sandboxed variants that enforce path guards (`createSandboxedReadTool()`, etc. at `pi-tools.read.ts:250-263`).

### Step 3: Exec Tool Configuration (`pi-tools.ts:252-284`)

The `exec` tool is created with extensive configuration:
- `host` / `security` / `ask` - Approval levels from config
- `pathPrepend` / `safeBins` - Shell PATH and safe binary list
- `allowBackground` - Whether `process` tool is allowed (checked against all policy layers)
- `sandbox` - Docker container config if sandboxed
- `backgroundMs` / `timeoutSec` - Timeout configuration
- `scopeKey` - Process isolation key (typically `agent:{agentId}`)

### Step 4: OpenClaw Tools Creation (`pi-tools.ts:304-337`)

`createOpenClawTools()` assembles all OpenClaw-specific tools (browser, sessions, web, etc.). Key options passed through:
- `pluginToolAllowlist` - Collected from all policy layers via `collectExplicitAllowlist()`
- Channel/session context for messaging tools
- Sandbox configuration for web tools

### Step 5: Plugin Tool Integration (`openclaw-tools.ts:142-160`)

`resolvePluginTools()` loads plugin tools and filters them:
- Plugin IDs must not conflict with core tool names
- Optional tools must appear in the explicit allowlist
- Required tools are always included
- Each tool is tagged with `PluginToolMeta` for later identification

### Step 6: Policy Filtering Chain (`pi-tools.ts:345-408`)

All tools are filtered through a cascading policy chain:

```
tools
  → filterToolsByPolicy(profilePolicy)        // Profile-level
  → filterToolsByPolicy(providerProfile)      // Provider profile
  → filterToolsByPolicy(globalPolicy)         // Global allow/deny
  → filterToolsByPolicy(globalProviderPolicy) // Provider-specific global
  → filterToolsByPolicy(agentPolicy)          // Agent-specific
  → filterToolsByPolicy(agentProviderPolicy)  // Agent + provider
  → filterToolsByPolicy(groupPolicy)          // Group/channel
  → filterToolsByPolicy(sandboxPolicy)        // Sandbox restrictions
  → filterToolsByPolicy(subagentPolicy)       // Subagent deny list
```

Each `filterToolsByPolicy()` (`pi-tools.policy.ts:91-95`) uses a compiled pattern matcher:
- Compiles deny/allow patterns (supports `*` wildcards)
- First checks deny list (deny wins)
- Then checks allow list (if present, tool must match)
- Special case: `apply_patch` is allowed if `exec` is allowed

Before filtering, policies are expanded:
- `expandToolGroups()` - Expands `group:*` references (e.g., `group:web` → `["web_search", "web_fetch"]`)
- `expandPolicyWithPluginGroups()` - Expands `group:plugins` and plugin IDs to individual tool names
- `stripPluginOnlyAllowlist()` - If an allowlist contains only plugin tools (no core tools), it's stripped to prevent accidentally disabling all core tools

### Step 7: Schema Normalization (`pi-tools.ts:411`)

`normalizeToolParameters()` (`pi-tools.schema.ts:49-149`) normalizes each tool's JSON Schema:
- **Gemini compatibility**: Strips unsupported JSON Schema keywords via `cleanSchemaForGemini()`
- **OpenAI compatibility**: Forces `type: "object"` at root level (OpenAI rejects root unions)
- **Union flattening**: Merges `anyOf`/`oneOf` variants into a single flat object schema, preserving enum values

### Step 8: Abort Signal Wiring (`pi-tools.ts:412-414`)

`wrapToolWithAbortSignal()` (`pi-tools.abort.ts:25-40`) wraps each tool's execute function to combine the run's abort signal with any per-tool abort signal using `AbortSignal.any()`.

### Step 9: SDK Adapter (`tool-split.ts:9-18`)

`splitSdkTools()` converts all tools to the pi-coding-agent's `ToolDefinition` format via `toToolDefinitions()`:
- All tools go through `customTools` (none through `builtInTools`) - this ensures OpenClaw's policy filtering and sandbox integration apply consistently
- The adapter at `pi-tool-definition-adapter.ts:26-68` remaps the `execute()` signature (pi-agent-core's order differs from pi-coding-agent's)
- Wraps execution in try/catch, converting thrown errors to `{ status: "error" }` JSON results

---

## Claude Code Compatibility Layer

OpenClaw handles models trained on Claude Code conventions that use different parameter names:

### Parameter Aliases (`pi-tools.read.ts:99-138`)

| Claude Code Name | Pi-Coding-Agent Name | Tools |
|---|---|---|
| `file_path` | `path` | read, write, edit |
| `old_string` | `oldText` | edit |
| `new_string` | `newText` | edit |

`normalizeToolParams()` remaps these at execution time. `patchToolSchemaForClaudeCompatibility()` adds the alias properties to the JSON Schema so the LLM can use either convention.

### Required Parameter Assertion (`pi-tools.read.ts:187-210`)

`assertRequiredParams()` validates that at least one key from each param group is present, supporting both naming conventions.

---

## Tool Result Helpers (`tools/common.ts`)

### `jsonResult()` (`:171-181`)
Wraps any payload as a text content block with JSON serialization.

### `imageResult()` (`:183-207`)
Creates a tool result with both text label and base64 image content, sanitized via `sanitizeToolResultImages()`.

### `imageResultFromFile()` (`:209-225`)
Reads a file, detects MIME type, and creates an image result.

### Parameter Readers
- `readStringParam()` - Extract string with trim/required/allowEmpty options
- `readStringOrNumberParam()` - Accept string or numeric, return string
- `readNumberParam()` - Extract number with integer coercion
- `readStringArrayParam()` - Extract string array or single string as array
- `readReactionParams()` - Extract emoji + remove flag for reaction tools

### `createActionGate()` (`:23-31`)
Creates a gating function for channel tool actions. Given an actions config map, returns a function that checks if a specific action is enabled (defaulting to true if not explicitly set).

---

## Tool Profiles (`tool-policy.ts:1-76`)

Four predefined profiles control which tools are available:

| Profile | Allowed Tools |
|---------|--------------|
| `minimal` | `session_status` only |
| `coding` | `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | Everything (no restrictions) |

### Tool Groups (`tool-policy.ts:13-57`)

Named groups that expand to lists of tool names:

| Group | Tools |
|-------|-------|
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `web_fetch` |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:runtime` | `exec`, `process` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:openclaw` | All OpenClaw-native tools (excludes plugins) |

### Tool Name Normalization (`tool-policy.ts:78-81`)

Aliases ensure consistent naming:
- `bash` → `exec`
- `apply-patch` → `apply_patch`

---

## Subagent Tool Restrictions (`pi-tools.policy.ts:57-84`)

Subagents have a default deny list (`DEFAULT_SUBAGENT_TOOL_DENY`):

```
sessions_list, sessions_history, sessions_send, sessions_spawn  (main orchestrates)
gateway, agents_list                                            (admin tools)
whatsapp_login                                                  (interactive setup)
session_status, cron                                            (coordination)
memory_search, memory_get                                       (pass in spawn prompt instead)
```

This is combined with any user-configured `tools.subagents.tools.deny` list.

---

## Provider-Specific Handling

### Apply Patch Gating (`pi-tools.ts:59-79`)
`apply_patch` tool is only enabled when:
1. `config.tools.exec.applyPatch.enabled` is true
2. Provider is OpenAI or OpenAI Codex
3. Model ID matches `allowModels` list (if configured)

### Google/Gemini Tool Sanitization
- `sanitizeToolsForGoogle()` at `attempt.ts:236` - Provider-specific tool cleanup
- `cleanSchemaForGemini()` - Strips unsupported JSON Schema keywords
- `logToolSchemasForGoogle()` - Logs schemas for debugging

### OpenAI Schema Fix
Root-level union schemas (`anyOf`/`oneOf` without `type`) are flattened to `type: "object"` because OpenAI rejects them.

---

## Configuration

| Config Path | Effect |
|---|---|
| `tools.allow` | Global tool allowlist |
| `tools.deny` | Global tool deny list |
| `tools.alsoAllow` | Additive allowlist (merged with profile) |
| `tools.profile` | Named profile (`minimal`, `coding`, `messaging`, `full`) |
| `tools.byProvider[provider].allow/deny` | Per-provider tool restrictions |
| `tools.exec.host/security/ask/node` | Exec tool approval and shell config |
| `tools.exec.pathPrepend` | PATH prefix for shell commands |
| `tools.exec.safeBins` | Safe binary list (skip approval) |
| `tools.exec.backgroundMs/timeoutSec` | Exec timeout configuration |
| `tools.exec.applyPatch.enabled` | Enable `apply_patch` tool |
| `tools.exec.applyPatch.allowModels` | Model allowlist for `apply_patch` |
| `tools.subagents.tools.allow/deny` | Subagent tool restrictions |
| `agents[id].tools.allow/deny/profile` | Per-agent tool config |
| `agents[id].tools.byProvider[provider]` | Per-agent per-provider config |

---

## Key Design Decisions

### 1. All Tools as customTools
`splitSdkTools()` passes ALL tools through `customTools`, leaving `builtInTools` empty. This ensures OpenClaw's policy filtering, sandbox integration, and schema normalization apply uniformly. The pi-runner would bypass these wrappers for built-in tools.

### 2. Layered Policy Filtering
Nine policy layers are applied in sequence, each able to further restrict (never expand) the tool set. This creates a defense-in-depth approach where profiles, global config, agent config, group config, sandbox, and subagent restrictions all compose.

### 3. Claude Code Compatibility
Rather than requiring all models to use pi-coding-agent's parameter names, the system accepts Claude Code conventions (`file_path`, `old_string`, `new_string`) and remaps them. Schemas are also patched to include both naming variants.

### 4. Error-to-Result Conversion
The `toToolDefinitions()` adapter catches all execution errors and converts them to `{ status: "error", tool, error }` JSON results rather than throwing. This prevents tool failures from crashing the agent loop. Only abort errors are re-thrown.

### 5. Plugin Tool Safety
Plugin tools are:
- Gated by explicit allowlists (must be named in policy or use `group:plugins`)
- Prevented from shadowing core tool names
- Tracked via WeakMap metadata for policy expansion

---

## Interaction with Other Topics

| Topic | Interaction |
|---|---|
| **Agent Loop** (Topic 1) | `createOpenClawCodingTools()` is called at `attempt.ts:202-235`. Tools are split via `splitSdkTools()` at `attempt.ts:435-438` and passed to `createAgentSession()`. |
| **Tool Policy** (Topic 3) | Policy resolution happens inline at `pi-tools.ts:156-213`, pattern matching at `pi-tools.policy.ts`. Detailed in Topic 3. |
| **Subagent Spawning** (Topic 5) | `sessions_spawn` tool (`tools/sessions-spawn-tool.ts`) triggers subagent creation. Subagent tool restrictions are applied via `resolveSubagentToolPolicy()`. |
| **System Prompt** (Topic 8) | Tool list is passed to `buildEmbeddedSystemPrompt()` for inclusion in the system prompt's tool documentation. |
| **Skills** (Topic 9) | Skills don't directly interact with tools, but skill env overrides can affect tool behavior (e.g., API keys). |
