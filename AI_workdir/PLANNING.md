# Project Planning

## Repos

- **openclaw**: `C:\Users\User_DAIP\Work\Transcribe\Code\openclaw` (branch: `experimental`)
- **openclaw-agent**: `C:\Users\User_DAIP\Work\Transcribe\Code\openclaw-agent` (branch: `master`, merged from `feat--streamlit-bridge`)
  - Remotes: `origin` (personal gitlab), `team` (team gitlab)

## Current Status

All major work complete. Bridge is functionally complete, design docs cover all major subsystems (15 docs total), presentation delivered. See `COMPLETED.md` for full archive.

**Design docs** (`openclaw-agent/design_docs/`): bootstrap, error-handling, event-subscription, hooks, memory, prompts, sandbox, session-management, skills, subagents, system-prompt, tools, v2026-changelog (+ 2 legacy from initial extraction)

---

## Future Work: Plugin Hook Migration

### Problem

The bridge has no way to observe or intercept tool calls (e.g., logging tool status to the bridge console). The original openclaw has a plugin hook system with ~20 hook points (`before_tool_call`, `after_tool_call`, `before_agent_start`, etc.), but it was not migrated to the bridge.

### Current State — Two Hook Systems

**1. Plugin hooks (`plugins/hooks.ts`)** — Original openclaw's full hook system
- Rich hook points: `before_tool_call`, `after_tool_call`, `tool_result_persist`, `before_agent_start`, `agent_end`, etc.
- Loaded via `loadOpenClawPlugins()` → `initializeGlobalHookRunner(registry)`
- Custom hooks are separate plugin files discovered automatically by the loader
- **Status: NOT migrated.** Three broken links in the bridge:
  1. `bridge/server.ts` never calls `loadOpenClawPlugins()` — plugin registry never created
  2. `initializeGlobalHookRunner()` never called — `getGlobalHookRunner()` returns `null`
  3. Hook dispatch calls in `attempt.ts` are commented out (lines 71, 753-772)

**2. Internal hooks (`hooks/internal-hooks.ts`)** — Lightweight system we created
- Simple `Map<string, handler[]>` with `registerInternalHook()` / `triggerInternalHook()`
- No plugin loader needed — just import and call
- Only hook point wired: `agent:bootstrap` (fires when bootstrap files are loaded, in `bootstrap-hooks.ts`)
- **Status: Infrastructure only.** No production handler ever registered. Only used in tests.
- Event types: `command`, `session`, `agent`, `gateway` — no `tool_call` event type

### Migration Plan

**Goal:** Enable custom hooks (e.g., tool call logging) in the bridge without modifying original openclaw agent runner logic.

**Option A: Full plugin hook migration (recommended if we need the full hook ecosystem)**

| Step | File | Change | Touches original? |
|------|------|--------|--------------------|
| 1 | `bridge/server.ts` | Call `loadOpenClawPlugins()` + `initializeGlobalHookRunner()` at startup | No (bridge code) |
| 2 | `attempt.ts` | Uncomment existing hook dispatch calls (lines 71, 753-772) | Restore only (was active in original) |
| 3 | New plugin file | Write custom hook handler (e.g., `hooks/tool-logger/handler.ts`) | No (new file) |

- Pros: Full access to all ~20 hook points, custom hooks are separate files, matches original architecture
- Cons: Need to migrate plugin loader dependencies, potential compatibility issues

**Option B: Extend internal hook system (lighter, if we only need tool call logging)**

| Step | File | Change |
|------|------|--------|
| 1 | `hooks/internal-hooks.ts` | Add `"tool"` to `InternalHookEventType` |
| 2 | `attempt.ts` | Add `triggerInternalHook(createInternalHookEvent("tool", toolName, sessionKey, { input, result }))` around tool execution |
| 3 | `bridge/server.ts` or new file | Call `registerInternalHook("tool", handler)` at startup |

- Pros: No plugin loader needed, minimal code, already works in bridge
- Cons: Limited to our custom event types, no plugin discovery, must modify `attempt.ts`

### Key Files

| File | Role |
|------|------|
| `src/plugins/hooks.ts` | Plugin hook system — `HookRunner`, `runBeforeToolCall()`, etc. |
| `src/plugins/hook-runner-global.ts` | Singleton — `initializeGlobalHookRunner()`, `getGlobalHookRunner()` |
| `src/hooks/internal-hooks.ts` | Internal hook system — `registerInternalHook()`, `triggerInternalHook()` |
| `src/hooks/types.ts` | Hook metadata types, `HookEntry`, `OpenClawHookMetadata` |
| `src/config/types.hooks.ts` | Hook config types — `InternalHooksConfig`, `HookMappingConfig` |
| `src/agents/bootstrap-hooks.ts` | Only active internal hook trigger — `agent:bootstrap` |
| `src/agents/pi-embedded-runner/run/attempt.ts` | Tool execution path — commented-out hook dispatch (lines 71, 753-772) |
| `src/hooks/bundled/session-memory/handler.ts` | Bundled plugin hook — saves session context on `/new` (not wired in bridge) |

### Notes

- Both options require touching `attempt.ts` — there's no way around it since that's where tool execution happens
- Option A is "restore + extend" — uncomment what was already there, then add our plugin
- Option B is "build on what we have" — extend the internal system we already created
- The `session-memory` bundled hook would also start working with Option A (auto-saves session context on `/new`)
