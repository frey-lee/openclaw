# Migration Checklist: Hooks Subsystem

Design doc: `openclaw-agent/design_docs/hooks.md`
Master matrix ref: `00-cross-cutting-decisions.md` Category 4 (Hooks), Category 5 (Plugins)

---

## Migrate (Copy Verbatim)

These files contain the hook execution runtime. Copy from openclaw, then apply the Strip items below during Phase 5.

- [ ] `src/plugins/hooks.ts` -- HookRunner class (~460 lines), execution strategies (`runVoidHook`, `runModifyingHook`, `runToolResultPersist`), priority ordering, `catchErrors` wrapping
- [ ] `src/hooks/internal-hooks.ts` -- Internal event system (~175 lines): `registerInternalHook`, `triggerInternalHook`, event types (`"command"`, `"session"`, `"agent"`, `"gateway"`)
- [ ] `src/hooks/types.ts` -- Hook type definitions (`PluginHookRegistration`, hook event types)
- [ ] `src/plugins/hook-runner-global.ts` -- Global singleton (already exists as stub, needs update): `initializeGlobalHookRunner`, `getGlobalHookRunner`, `hasGlobalHooks`, `resetGlobalHookRunner`
- [ ] `src/agents/bootstrap-hooks.ts` -- Bootstrap hook overrides (already exists as pass-through, needs update): `applyBootstrapHookOverrides` wired to real internal hook trigger

### Hook points preserved after migration

| Hook Point | Execution Strategy | Category |
|---|---|---|
| `before_agent_start` | `runModifyingHook` (returns `{ prependContext }`) | Agent Lifecycle |
| `agent_end` | `runVoidHook` (fire-and-forget) | Agent Lifecycle |
| `before_tool_call` | `runModifyingHook` | Tool Execution |
| `after_tool_call` | `runVoidHook` | Tool Execution |
| `tool_result_persist` | `runToolResultPersist` (synchronous, hot-path) | Tool Execution |
| `session_start` | `runVoidHook` | Session Lifecycle |
| `session_end` | `runVoidHook` | Session Lifecycle |
| `before_compaction` | `runVoidHook` | Context Management |
| `after_compaction` | `runVoidHook` | Context Management |
| `gateway_start` | `runVoidHook` | Gateway Infrastructure |
| `gateway_stop` | `runVoidHook` | Gateway Infrastructure |
| `gateway:startup` | Internal hook | Gateway Infrastructure |
| `agent:bootstrap` | Internal hook | Context Management |
| `command:new` | Internal hook | CLI Commands |
| `command:reset` | Internal hook | CLI Commands |
| `command:stop` | Internal hook | CLI Commands |

### Wiring tasks (post-copy)

- [ ] Update `hook-runner-global.ts` to use real `createHookRunner` instead of stub returning `null`
- [ ] Update `bootstrap-hooks.ts` to call real internal hook trigger instead of pass-through
- [ ] Wire `before_agent_start` and `agent_end` in `attempt.ts` (call sites already exist, need real runner)

---

## Strip (Remove During Phase 5)

Remove these from the **copied** `plugins/hooks.ts` during Phase 5 stripping.

- [ ] Messaging hook support: `message_received` hook point
- [ ] Messaging hook support: `message_sending` hook point
- [ ] Messaging hook support: `message_sent` hook point
- [ ] Any channel-specific hook handling in the HookRunner

---

## Skip (Do Not Copy)

These files are **not** included in the migration manifest. They belong to hook discovery, loading, management, and UI infrastructure that openclaw-agent does not need.

### Hook discovery and loading
- [ ] `src/hooks/workspace.ts` -- Hook discovery (scans workspace, bundled, managed, extra directories for HOOK.md files)
- [ ] `src/hooks/bundled-dir.ts` -- Bundled hooks directory resolution

### Frontmatter and configuration
- [ ] `src/hooks/frontmatter.ts` -- HOOK.md frontmatter parsing
- [ ] `src/hooks/config.ts` -- Eligibility checking (bins, env, OS requirements)

### Dynamic loading
- [ ] `src/hooks/loader.ts` -- Dynamic hook loading from directories
- [ ] `src/hooks/plugin-hooks.ts` -- Plugin hook loading and registration

### Installation
- [ ] `src/hooks/install.ts` -- Hook installation (npm, git, local paths)
- [ ] `src/hooks/installs.ts` -- Install helpers

### Status and reporting
- [ ] `src/hooks/hooks-status.ts` -- Hook eligibility and status reports

### Bundled handlers
- [ ] `src/hooks/bundled/*/handler.ts` -- All bundled hook handlers (boot-md, command-logger, session-memory, soul-evil)

### Gateway webhooks
- [ ] `src/gateway/hooks.ts` -- Gateway webhook system (HTTP webhook mapping external events to agent actions)
- [ ] `src/gateway/hooks-mapping.ts` -- Webhook event-to-action mapping

### CLI commands
- [ ] `src/cli/hooks-cli.ts` -- CLI hook management (list, info, check, enable, disable, install, update)

---

## Placeholder (Stub Implementations Needed)

None -- the real implementations (`HookRunner`, internal hooks, hook-runner-global, bootstrap-hooks) are being copied and updated directly.

---

## Dependencies

Cross-references to other subsystem checklists:

| Subsystem | Dependency | Direction |
|---|---|---|
| session-management | `tool_result_persist` hook runs in session tool result guard wrapper | hooks -> session-management |
| bootstrap | `agent:bootstrap` internal hook modifies bootstrap file list via `applyBootstrapHookOverrides` | hooks -> bootstrap |
| error-handling | `before_compaction` / `after_compaction` hooks fire around compaction in retry loop | hooks -> error-handling |
| plugins (Category 5) | `initializeGlobalHookRunner` called during startup after plugins load | plugins -> hooks |
