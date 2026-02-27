# Migration Checklist: Tools Subsystem

Source design doc: `openclaw-agent/design_docs/tools.md`
Master matrix ref: `00-cross-cutting-decisions.md`, Category 10 (Tools)

---

## Migrate (Copy Verbatim)

### Core Pipeline Files

- [ ] `src/agents/pi-tools.ts` -- Main tool factory (`createOpenClawCodingTools`), 6-stage pipeline
- [ ] `src/agents/pi-tools.types.ts` -- Type definitions for tool pipeline params
- [ ] `src/agents/pi-tools.policy.ts` -- Policy resolution (`resolveSubagentToolPolicy`, `resolveEffectiveToolPolicy`, `resolveGroupToolPolicy`, `resolveToolProfilePolicy`)
- [ ] `src/agents/pi-tools.schema.ts` -- Schema normalization (`normalizeToolParameters`, `cleanToolSchemaForGemini`)
- [ ] `src/agents/pi-tools.abort.ts` -- Abort signal wrapping (`wrapToolWithAbortSignal`)
- [ ] `src/agents/pi-tools.read.ts` -- Read tool wrapper (`createOpenClawReadTool`, MIME sniffing, image normalization)
- [ ] `src/agents/openclaw-tools.ts` -- OpenClaw tool assembly (`createOpenClawTools`)
- [ ] `src/agents/tool-policy.ts` -- Tool groups, profiles, name normalization (`TOOL_GROUPS`, `TOOL_PROFILES`, `filterToolsByPolicy`)
- [ ] `src/agents/tool-summaries.ts` -- Tool summary map for system prompt
- [ ] `src/agents/pi-tool-definition-adapter.ts` -- Tool definition adapter (`toToolDefinitions`, `toClientToolDefinitions`)
- [ ] `src/agents/pi-embedded-runner/tool-split.ts` -- Tool splitting (`splitSdkTools`)

### Exec / Process Tools

- [ ] `src/agents/bash-tools.ts` -- Bash tools entry point
- [ ] `src/agents/bash-tools.exec.ts` -- Exec tool (`createExecTool`, security modes, ask modes, elevation)
- [ ] `src/agents/bash-tools.process.ts` -- Process tool (list, kill, tail background processes)
- [ ] `src/agents/bash-tools.shared.ts` -- Shared exec utilities (`resolveWorkdir`, `resolveSandboxWorkdir`)

### Sandbox Path Validation

- [ ] `src/agents/sandbox-paths.ts` -- Path validation (`resolveSandboxPath`, `assertSandboxPath`, `assertNoSymlink`)

### Agent Config

- [ ] `src/agents/agent-scope.ts` -- Agent config resolution (`resolveAgentConfig`)

### Individual Tool Files (Kept Tools)

- [ ] `src/agents/tools/sessions-spawn-tool.ts` -- `sessions_spawn` tool
- [ ] `src/agents/tools/sessions-list-tool.ts` -- `sessions_list` tool
- [ ] `src/agents/tools/sessions-history-tool.ts` -- `sessions_history` tool
- [ ] `src/agents/tools/session-status-tool.ts` -- `session_status` tool
- [ ] `src/agents/tools/sessions-helpers.ts` -- Shared session tool helpers
- [ ] `src/agents/tools/sessions-announce-target.ts` -- Announcement target resolution
- [ ] `src/agents/tools/agents-list-tool.ts` -- `agents_list` tool
- [ ] `src/agents/tools/gateway-tool.ts` -- `gateway` tool (infra control, required for subagent spawning)
- [ ] `src/agents/tools/gateway.ts` -- Gateway tool utilities
- [ ] `src/agents/tools/image-tool.ts` -- `image` tool (vision-capable models)
- [ ] `src/agents/tools/image-tool.helpers.ts` -- Image tool helpers
- [ ] `src/agents/tools/memory-tool.ts` -- `memory_search` and `memory_get` tools (inactive, kept for reference)
- [ ] `src/agents/tools/common.ts` -- Shared tool utilities
- [ ] `src/agents/tools/agent-step.ts` -- Agent step utilities

### Supporting Files

- [ ] `src/agents/tool-call-id.ts` -- Tool call ID utilities
- [ ] `src/agents/tool-display.ts` -- Tool display formatting
- [ ] `src/agents/tool-images.ts` -- Tool image handling

### Test Files

- [ ] `src/agents/pi-tools.policy.test.ts` -- Policy resolution tests
- [ ] `src/agents/pi-tools-agent-config.test.ts` -- Agent config tests
- [ ] `src/agents/pi-tools.safe-bins.test.ts` -- Safe binary allowlist tests
- [ ] `src/agents/pi-tools.workspace-paths.test.ts` -- Workspace path tests
- [ ] `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping.test.ts` -- Schema alias tests (4 variants)
- [ ] `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-b.test.ts`
- [ ] `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-d.test.ts`
- [ ] `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-f.test.ts`
- [ ] `src/agents/pi-tool-definition-adapter.test.ts` -- Tool definition adapter tests
- [ ] `src/agents/pi-embedded-runner.splitsdktools.test.ts` -- `splitSdkTools` tests
- [ ] `src/agents/bash-tools.test.ts` -- Bash tools tests
- [ ] `src/agents/bash-tools.exec.approval-id.test.ts` -- Exec approval ID tests
- [ ] `src/agents/bash-tools.exec.background-abort.test.ts` -- Exec background abort tests
- [ ] `src/agents/bash-tools.exec.path.test.ts` -- Exec path resolution tests
- [ ] `src/agents/bash-tools.exec.pty-fallback.test.ts` -- PTY fallback tests
- [ ] `src/agents/bash-tools.exec.pty.test.ts` -- PTY tests
- [ ] `src/agents/bash-tools.process.send-keys.test.ts` -- Process send-keys tests
- [ ] `src/agents/tool-policy.test.ts` -- Tool policy tests
- [ ] `src/agents/tool-policy.plugin-only-allowlist.test.ts` -- Plugin-only allowlist tests
- [ ] `src/agents/tool-call-id.test.ts` -- Tool call ID tests
- [ ] `src/agents/tool-display.test.ts` -- Tool display tests
- [ ] `src/agents/tool-images.test.ts` -- Tool image tests
- [ ] `src/agents/tools/common.test.ts` -- Common tool utility tests
- [ ] `src/agents/tools/gateway.test.ts` -- Gateway tool tests
- [ ] `src/agents/tools/image-tool.test.ts` -- Image tool tests
- [ ] `src/agents/tools/memory-tool.does-not-crash-on-errors.test.ts` -- Memory tool error handling tests
- [ ] `src/agents/tools/sessions-helpers.test.ts` -- Session helpers tests
- [ ] `src/agents/tools/sessions-announce-target.test.ts` -- Announce target tests
- [ ] `src/agents/tools/sessions-list-tool.gating.test.ts` -- Sessions list gating tests
- [ ] `src/agents/openclaw-tools.agents.test.ts` -- Agents list tool tests
- [ ] `src/agents/openclaw-tools.session-status.test.ts` -- Session status tool tests
- [ ] `src/agents/openclaw-tools.sessions.test.ts` -- Sessions tools tests
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-allows-cross-agent-spawning-configured.test.ts`
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-announces-agent-wait-lifecycle-events.test.ts`
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-applies-model-child-session.test.ts`
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-normalizes-allowlisted-agent-ids.test.ts`
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-prefers-per-agent-subagent-model.test.ts`
- [ ] `src/agents/openclaw-tools.subagents.sessions-spawn-resolves-main-announce-target-from.test.ts`
- [ ] `src/agents/agent-scope.test.ts` -- Agent scope tests

---

## Strip (Remove During Phase 5)

Code to remove from `pi-tools.ts` and `openclaw-tools.ts` during Phase 5 stripping:

### Tool Creation Code in `openclaw-tools.ts`

- [ ] `web_search` tool creation -- remove call to create web search tool
- [ ] `web_fetch` tool creation -- remove call to create web fetch tool
- [ ] `browser` tool creation -- remove call to create browser tool
- [ ] `message` tool creation -- remove call to create message/messaging tool
- [ ] `tts` tool creation -- remove call to create text-to-speech tool
- [ ] `sessions_send` tool creation -- remove call to create sessions send tool
- [ ] `canvas` tool creation -- remove call to create canvas tool
- [ ] `nodes` tool creation -- remove call to create nodes tool
- [ ] `cron` tool creation -- remove call to create cron tool

### Channel-Specific Tool Code

- [ ] Channel agent tools integration in `pi-tools.ts` -- Stage 4 collects "channel agent tools (from channel docking)"; remove this
- [ ] `resolveChannelCapabilities` references -- any channel capability checks used in tool assembly
- [ ] Channel-specific imports in tool files -- any imports from channel integration modules

### Tool Policy Entries

- [ ] `group:web` entries in `tool-policy.ts` -- strip or leave inert (web_search, web_fetch)
- [ ] `group:ui` entries in `tool-policy.ts` -- strip or leave inert (browser, canvas)
- [ ] `group:messaging` entries in `tool-policy.ts` -- strip or leave inert (message)
- [ ] `group:nodes` entries in `tool-policy.ts` -- strip or leave inert (nodes)
- [ ] `group:automation` `cron` entry in `tool-policy.ts` -- strip cron from group (keep gateway)
- [ ] `messaging` profile in `tool-policy.ts` -- strip or leave inert
- [ ] `sessions_send` from `group:sessions` in `tool-policy.ts` -- strip
- [ ] `whatsapp_login` from subagent deny list in `pi-tools.policy.ts` -- strip

### Tool Summaries

- [ ] Entries for stripped tools in `tool-summaries.ts` -- remove summary entries for web_search, web_fetch, browser, message, tts, sessions_send, canvas, nodes, cron

---

## Placeholder (Stub Implementations Needed)

- [ ] `createOpenClawCodingTools` in `pi-tools.ts` -- currently a stub returning `[]`; will be filled during migration by copying the real implementation and stripping excluded tools
- [ ] Memory tools activation -- `memory_search` and `memory_get` are KEEP (inactive); the tools are copied but remain non-functional until memory infrastructure is enabled (per master matrix: Category 15, INACTIVE)

---

## Skip (Do Not Copy)

### Excluded Tool Implementation Files

- [ ] `src/agents/tools/web-search.ts` -- web_search tool implementation
- [ ] `src/agents/tools/web-fetch.ts` -- web_fetch tool implementation
- [ ] `src/agents/tools/web-fetch-utils.ts` -- web fetch utilities
- [ ] `src/agents/tools/web-shared.ts` -- shared web tool utilities
- [ ] `src/agents/tools/web-tools.ts` -- web tools assembly
- [ ] `src/agents/tools/browser-tool.ts` -- browser tool implementation
- [ ] `src/agents/tools/browser-tool.schema.ts` -- browser tool schema
- [ ] `src/agents/tools/message-tool.ts` -- message tool implementation
- [ ] `src/agents/tools/tts-tool.ts` -- TTS tool implementation
- [ ] `src/agents/tools/sessions-send-tool.ts` -- sessions_send tool implementation
- [ ] `src/agents/tools/sessions-send-tool.a2a.ts` -- sessions_send A2A variant
- [ ] `src/agents/tools/sessions-send-helpers.ts` -- sessions_send helpers
- [ ] `src/agents/tools/canvas-tool.ts` -- canvas tool implementation
- [ ] `src/agents/tools/nodes-tool.ts` -- nodes tool implementation
- [ ] `src/agents/tools/nodes-utils.ts` -- nodes tool utilities
- [ ] `src/agents/tools/cron-tool.ts` -- cron tool implementation

### Excluded Channel Action Files

- [ ] `src/agents/tools/telegram-actions.ts` -- Telegram channel actions
- [ ] `src/agents/tools/discord-actions.ts` -- Discord channel actions (and sub-files: guild, messaging, moderation)
- [ ] `src/agents/tools/discord-actions-guild.ts`
- [ ] `src/agents/tools/discord-actions-messaging.ts`
- [ ] `src/agents/tools/discord-actions-moderation.ts`
- [ ] `src/agents/tools/slack-actions.ts` -- Slack channel actions
- [ ] `src/agents/tools/whatsapp-actions.ts` -- WhatsApp channel actions

### Excluded Test Files

- [ ] `src/agents/tools/web-search.test.ts`
- [ ] `src/agents/tools/web-fetch.ssrf.test.ts`
- [ ] `src/agents/tools/web-tools.enabled-defaults.test.ts`
- [ ] `src/agents/tools/web-tools.fetch.test.ts`
- [ ] `src/agents/tools/web-tools.readability.test.ts`
- [ ] `src/agents/tools/browser-tool.test.ts`
- [ ] `src/agents/tools/message-tool.test.ts`
- [ ] `src/agents/tools/cron-tool.test.ts`
- [ ] `src/agents/tools/discord-actions.test.ts`
- [ ] `src/agents/tools/telegram-actions.test.ts`
- [ ] `src/agents/tools/slack-actions.test.ts`
- [ ] `src/agents/tools/whatsapp-actions.test.ts`
- [ ] `src/agents/tools/sessions-send-tool.gating.test.ts`
- [ ] `src/agents/openclaw-tools.camera.test.ts` -- camera-specific test (channel feature)

---

## Dependencies

Cross-references to other subsystem checklists:

| Dependency | Reason | Direction |
|-----------|--------|-----------|
| **Sandbox** | `sandbox-paths.ts` path validation used by sandboxed file tools and exec; `resolveSandboxConfigForAgent`, `resolveSandboxToolPolicyForAgent` used in policy filtering (Stage 1, Stage 5) | Tools depends on Sandbox |
| **Subagents** | `sessions_spawn` tool delegates to gateway; `resolveSubagentToolPolicy` creates the subagent deny list (Stage 1); `buildSubagentSystemPrompt` used by spawn tool | Tools depends on Subagents |
| **Memory** | `memory_search` and `memory_get` tools require memory infrastructure (inactive); memory config resolution needed | Tools depends on Memory |
| **System Prompt** | `tool-summaries.ts` feeds into system prompt assembly; tool list included in prompt context | System Prompt depends on Tools |
| **Session Management** | Tool results flow through event subscription and transcript persistence; `tool_result_persist` hook | Session Management depends on Tools |
| **Hooks** | `before_tool_call` / `after_tool_call` hooks fire around tool execution | Hooks depends on Tools |
| **Bootstrap** | `agent-scope.ts` resolves agent config used across bootstrap and tool assembly | Shared dependency |
| **Error Handling** | Tool execution errors feed into retry loop; abort infrastructure wraps tools | Error Handling depends on Tools |
| **Config** | Tool policy config (`tools.allow`, `tools.deny`, `tools.byProvider`) read from `OpenClawConfig` | Tools depends on Config |
| **pi-embedded-runner** | `tool-split.ts` lives inside `pi-embedded-runner/`; `attempt.ts` calls `createOpenClawCodingTools` | Runner depends on Tools |
