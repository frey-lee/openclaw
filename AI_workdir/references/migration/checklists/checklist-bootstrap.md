# Migration Checklist: Bootstrap Subsystem

Cross-cutting category: **Category 9 (Bootstrap)** in `00-cross-cutting-decisions.md`
Design doc: `openclaw-agent/design_docs/bootstrap.md`
Status in openclaw-agent: **Fully migrated** (per design doc "Current State" section)

---

## Migrate (Copy Verbatim)

These files are copied from OpenClaw into openclaw-agent. Each entry lists the OpenClaw source path, what it does, and the changes applied during migration.

### Source Files

- `src/agents/workspace.ts` -- File discovery, types (`WorkspaceBootstrapFile`), subagent filtering (`filterBootstrapFilesForSession`, `SUBAGENT_BOOTSTRAP_ALLOWLIST`), workspace init (`ensureAgentWorkspace`), memory dedup (`resolveMemoryBootstrapEntries`), `loadWorkspaceBootstrapFiles`, `resolveUserPath`, `writeFileIfMissing`, `loadTemplate`. Changed: `ensureAgentWorkspace` takes `templateDir?` instead of `ensureBootstrapFiles?` flag.
- `src/agents/bootstrap-files.ts` -- Orchestrator: load -> filter -> hooks -> truncate. Re-exports `BootstrapFile` and `ContextFile` type aliases for backward compatibility.
- `src/agents/pi-embedded-helpers/bootstrap.ts` -- Truncation (`trimBootstrapContent`, `buildBootstrapContextFiles`), `EmbeddedContextFile` type, `resolveBootstrapMaxChars`, session header. Changed: `EmbeddedContextFile` defined here instead of separate `types.ts`.
- `src/agents/bootstrap-hooks.ts` -- Hook override pass-through. Migrated as a **placeholder** (passes files through unchanged). Full impl requires `hooks/internal-hooks.ts`.

### Test Files (from OpenClaw)

- `src/agents/workspace.test.ts` -- Tests for workspace file discovery, subagent filtering, workspace init, memory dedup
- `src/agents/bootstrap-files.test.ts` -- Tests for the load -> filter -> hooks -> truncate orchestration
- `src/agents/bootstrap-hooks.test.ts` -- Tests for bootstrap hook overrides

---

## Strip (Remove During Phase 5)

Functions and logic explicitly dropped during migration per the design doc and master matrix.

- `runCommandWithTimeout` / `ensureGitRepo` -- git init on new workspaces, dropped for simplicity (referenced in `workspace.ts:107-116`)
- `stripThoughtSignatures()` -- Claude/Gemini thought signature sanitization, unrelated to bootstrap (was co-located in `pi-embedded-helpers/bootstrap.ts`)
- `sanitizeGoogleTurnOrdering()` -- Google turn ordering fix, unrelated to bootstrap (was co-located in `pi-embedded-helpers/bootstrap.ts`)
- `ensureBootstrapFiles` boolean flag / `skipBootstrap` config field -- simplified; `ensureAgentWorkspace` always creates templates when `templateDir` is provided, no flag needed
- Call-site `skipBootstrap` checks in the following OpenClaw files (these patterns are removed, not copied):
  - `commands/agent.ts:99` -- `!agentCfg?.skipBootstrap`
  - `auto-reply/reply/get-reply.ts:67` -- `!agentCfg?.skipBootstrap && !isFastTestEnv`
  - `commands/onboard-helpers.ts:243` -- `!options?.skipBootstrap`
  - `commands/setup.ts:70` -- `!next.agents?.defaults?.skipBootstrap`
  - `cron/isolated-agent/run.ts:135` -- `!agentCfg?.skipBootstrap`
  - `agents/sandbox/workspace.ts:50` -- `!skipBootstrap`

---

## Placeholder (Stub Implementations Needed)

- `src/agents/bootstrap-hooks.ts` -- `applyBootstrapHookOverrides()` is a no-op pass-through that returns files unchanged. TODO comments show the wiring for when the internal hook system (`hooks/internal-hooks.ts`) is migrated. The master matrix says `applyBootstrapHookOverrides` (real impl) is KEEP via hooks.md, so the full implementation should be wired up when the hooks subsystem is available.

---

## Skip (Do Not Copy)

Files and modules not being copied into openclaw-agent.

- `src/agents/pi-embedded-helpers/types.ts` -- `EmbeddedContextFile` type was moved inline into `pi-embedded-helpers/bootstrap.ts` instead
- `src/agents/pi-embedded-helpers/google.ts` -- Contains `sanitizeGoogleTurnOrdering`, unrelated to bootstrap
- `src/hooks/internal-hooks.ts` -- Not migrated as part of bootstrap subsystem (belongs to hooks subsystem); bootstrap-hooks.ts stubs it out
- `docs/reference/templates/` -- Template files are referenced by `loadTemplate()` but the template content itself is workspace-specific, not part of the bootstrap code migration
- `commands/agent.ts`, `auto-reply/reply/get-reply.ts`, `commands/onboard-helpers.ts`, `commands/setup.ts`, `cron/isolated-agent/run.ts`, `agents/sandbox/workspace.ts` -- These are call sites that invoke `ensureAgentWorkspace` with `skipBootstrap` logic; they belong to other subsystems (CLI, cron, sandbox) and are not part of the bootstrap checklist

---

## Dependencies

Cross-references to other subsystems and checklists that the bootstrap subsystem touches.

| Dependency | Why | Direction |
|---|---|---|
| **Hooks** (`hooks/internal-hooks.ts`) | `applyBootstrapHookOverrides` needs `registerInternalHook`, `triggerInternalHook`, `createInternalHookEvent` for full implementation. Currently stubbed. | Bootstrap depends on Hooks |
| **System Prompt** (`src/agents/system-prompt.ts`) | Step 5 injects bootstrap context files into the system prompt via `buildAgentSystemPrompt`. The `# Project Context` section and SOUL.md directive are rendered there. | System Prompt depends on Bootstrap output |
| **Subagents** (`src/routing/session-key.ts`) | `isSubagentSessionKey()` is imported by `filterBootstrapFilesForSession()` for subagent detection. | Bootstrap depends on Subagents (session key utilities) |
| **Sandbox** (`src/agents/sandbox/workspace.ts`) | One of the call sites for `ensureAgentWorkspace` with `skipBootstrap`. | Sandbox depends on Bootstrap (workspace init) |
| **Memory** (`MEMORY.md` / `memory.md` loading) | Memory bootstrap file loading and dedup is part of `workspace.ts`. The master matrix confirms `Bootstrap MEMORY.md loading` is KEEP (already migrated). | Bootstrap includes Memory file loading |
| **Config** (`agents.defaults.bootstrapMaxChars`) | `resolveBootstrapMaxChars()` reads the truncation limit from agent config. | Bootstrap depends on Config |
