# Migration Checklist: Sandbox Subsystem

Source design doc: `openclaw-agent/design_docs/sandbox.md`
Master matrix reference: Category 7 in `00-cross-cutting-decisions.md`

---

## Migrate (Copy Verbatim)

These files are referenced in the design doc's File Reference and Migration Status tables with status "Fully preserved", "Fully migrated", or "Fully implemented". Copy from `openclaw/src/` to `openclaw-agent/src/`.

### Core sandbox module (`src/agents/sandbox/`)

- `src/agents/sandbox/types.ts` -- `SandboxContext`, `SandboxConfig`, access modes, browser/prune/tool policy types
- `src/agents/sandbox/types.docker.ts` -- `SandboxDockerConfig` (image, network, resource limits, security profiles)
- `src/agents/sandbox/constants.ts` -- Default tool allow/deny, image names, paths, ports, timeouts
- `src/agents/sandbox/config.ts` -- `resolveSandboxConfigForAgent` (merges global + agent Docker/browser/prune/tool config)
- `src/agents/sandbox/runtime-status.ts` -- `resolveSandboxRuntimeStatus`, `shouldSandboxSession`, `formatSandboxToolPolicyBlockedMessage`
- `src/agents/sandbox/tool-policy.ts` -- `isToolAllowed`, `resolveSandboxToolPolicyForAgent` (pattern matching + config resolution)
- `src/agents/sandbox/tool-policy.test.ts` -- Tests for tool policy logic

### Barrel and resolver stub

- `src/agents/sandbox.ts` -- Barrel re-exports all sandbox types + `resolveSandboxContext` resolver stub

### Path validation

- `src/agents/sandbox-paths.ts` -- `resolveSandboxPath`, `assertSandboxPath` (escape detection + symlink validation)

### Bash/exec tools (sandbox-aware)

- `src/agents/bash-tools.shared.ts` -- `BashSandboxConfig`, `buildDockerExecArgs`, `buildSandboxEnv`, `resolveSandboxWorkdir`
- `src/agents/bash-tools.exec.ts` -- Exec tool (host selection, Docker spawn, security modes, PTY handling)
- `src/agents/bash-tools.process.ts` -- Process tool (list, kill, tail, send-keys)
- `src/agents/bash-tools.test.ts` -- General bash tools tests
- `src/agents/bash-tools.exec.approval-id.test.ts` -- Exec approval ID tests
- `src/agents/bash-tools.exec.background-abort.test.ts` -- Exec background abort tests
- `src/agents/bash-tools.exec.path.test.ts` -- Exec path handling tests
- `src/agents/bash-tools.exec.pty-fallback.test.ts` -- Exec PTY fallback tests
- `src/agents/bash-tools.exec.pty.test.ts` -- Exec PTY tests
- `src/agents/bash-tools.process.send-keys.test.ts` -- Process send-keys tests

### Tool policy (top-level)

- `src/agents/tool-policy.ts` -- Tool groups, name normalization, profile resolution (used by sandbox tool policy)
- `src/agents/tool-policy.test.ts` -- Tests for tool groups/profiles
- `src/agents/tool-policy.plugin-only-allowlist.test.ts` -- Tests for plugin-only allowlist behavior

### System prompt integration

- `src/agents/pi-embedded-runner/sandbox-info.ts` -- `buildEmbeddedSandboxInfo` (converts SandboxContext to system prompt info)

### Agent config resolution

- `src/agents/agent-scope.ts` -- `resolveAgentConfig` (agent entry lookup for per-agent config)
- `src/agents/agent-scope.test.ts` -- Tests for agent config resolution

### Session key handling

- `src/config/sessions.ts` -- `resolveAgentMainSessionKey`, `canonicalizeMainSessionAlias`
- `src/config/sessions.test.ts` -- Tests for session key resolution
- `src/config/sessions.cache.test.ts` -- Tests for session cache behavior
- `src/routing/session-key.ts` -- `normalizeAgentId`, `normalizeMainKey`, `buildAgentMainSessionKey` (key primitives)

### CLI utility

- `src/cli/command-format.ts` -- `formatCliCommand` stub (returns command as-is)

### Orchestration (consumer)

- `src/agents/pi-embedded-runner/run/attempt.ts` -- Calls resolver, selects workspace, wires sandbox into tools/prompt/images
- `src/agents/pi-embedded-runner/run/attempt.test.ts` -- Tests for attempt orchestration

---

## Strip (Remove During Phase 5)

These are specific exports, functions, or code sections that need to be removed from the copied files because they reference not-migrated container lifecycle infrastructure.

- In `src/agents/sandbox.ts` (openclaw original): strip the re-exports from `sandbox/context.js` (`ensureSandboxWorkspaceForSession`, `resolveSandboxContext`), from `sandbox/docker.js` (`buildSandboxCreateArgs`), and from `sandbox/manage.js` (`listSandboxBrowsers`, `listSandboxContainers`, `removeSandboxBrowserContainer`, `removeSandboxContainer`, `SandboxBrowserInfo`, `SandboxContainerInfo`). The openclaw-agent version already has these stripped and replaced with a local stub.
- In `src/agents/sandbox/constants.ts`: nothing to strip (defaults are all KEEP per master matrix)
- In `src/agents/sandbox/types.ts`: nothing to strip (all types are KEEP)
- In `src/agents/sandbox/types.docker.ts`: nothing to strip (all types are KEEP)
- In `src/agents/sandbox/config.ts`: nothing to strip (config resolution is KEEP)
- In `src/agents/sandbox/runtime-status.ts`: nothing to strip (runtime status is KEEP)
- In `src/agents/sandbox/tool-policy.ts`: nothing to strip (tool policy logic is KEEP)
- In `src/agents/sandbox-paths.ts`: nothing to strip (path validation is KEEP)
- In `src/agents/bash-tools.shared.ts`: nothing to strip (Docker exec args, sandbox env, workdir resolution are all KEEP)
- In `src/agents/bash-tools.exec.ts`: nothing to strip (exec tool with full security config is KEEP)
- In `src/agents/bash-tools.process.ts`: nothing to strip (process tool is KEEP)
- In `src/agents/tool-policy.ts`: nothing to strip (tool groups and profiles are KEEP)
- In `src/agents/pi-embedded-runner/sandbox-info.ts`: nothing to strip
- In `src/agents/agent-scope.ts`: nothing to strip
- In `src/config/sessions.ts`: nothing to strip
- In `src/routing/session-key.ts`: nothing to strip
- In `src/cli/command-format.ts`: nothing to strip (already a stub)
- In `src/agents/pi-embedded-runner/run/attempt.ts`: nothing sandbox-specific to strip; the sandbox wiring at lines 168-178, 221, 240, 344, 561 is all KEEP

---

## Placeholder (Stub Implementations Needed)

- `resolveSandboxContext` in `src/agents/sandbox.ts` -- returns `null` (already a stub in openclaw-agent). The full implementation would provision a Docker container and assemble a `SandboxContext` from config, but that depends on the not-migrated container lifecycle (`sandbox/context.ts`, `sandbox/docker.ts`, `sandbox/manage.ts`). The stub signature accepts `{ config?, sessionKey, workspaceDir }` and returns `Promise<SandboxContext | null>`.
- `ensureSandboxWorkspaceForSession` -- not needed in openclaw-agent (references `sandbox/context.ts` which is skipped). The barrel file in openclaw-agent does not export it.
- `buildSandboxCreateArgs` -- not needed in openclaw-agent (references `sandbox/docker.ts` which is skipped). The barrel file in openclaw-agent does not export it.
- `formatCliCommand` in `src/cli/command-format.ts` -- already a stub (returns command as-is). No container CLI formatting needed without Docker provisioning.

---

## Skip (Do Not Copy)

These files are explicitly listed in the design doc's "Container Lifecycle (Not Migrated)" section or marked as "Not migrated" in the Migration Status table. They have heavy dependencies on the Docker CLI, browser bridge system, and channel registry.

- `src/agents/sandbox/context.ts` -- Resolves `SandboxContext` from config + session state (requires Docker)
- `src/agents/sandbox/docker.ts` -- Creates, starts, stops Docker containers; applies volume mounts
- `src/agents/sandbox/manage.ts` -- Container lifecycle management (create-if-missing, health checks)
- `src/agents/sandbox/workspace.ts` -- Creates sandbox workspace directories, copies skills
- `src/agents/sandbox/prune.ts` -- Cleans up idle/expired containers and workspaces
- `src/agents/sandbox/registry.ts` -- Tracks active containers in `~/.openclaw/sandbox/containers.json`
- `src/agents/sandbox/browser.ts` -- Provisions browser containers with CDP bridge
- `src/agents/sandbox/browser-bridges.ts` -- Manages browser bridge URLs and noVNC proxies
- `src/agents/sandbox/shared.ts` -- Shared utilities for sandbox context/docker (referenced in design doc line 104: "not migrated, logic described here for reference")
- `src/agents/sandbox/config-hash.ts` -- Config hashing for container cache invalidation (listed in openclaw-agent stub comment as not copied)

---

## Dependencies

Cross-references to other subsystem checklists that this sandbox checklist depends on or that depend on it.

### This checklist depends on:

- **tools.md** -- Sandbox tool policy feeds into the tool creation pipeline (`createOpenClawCodingTools`). The `isToolAllowed` check in `sandbox/tool-policy.ts` is consumed by tool filtering in `pi-tools.policy.ts`. Tool groups and profiles from `tool-policy.ts` are resolved by `resolveSandboxToolPolicyForAgent`.
- **system-prompt.md** -- `buildEmbeddedSandboxInfo` in `sandbox-info.ts` produces `EmbeddedSandboxInfo` that is injected into the system prompt by `buildAgentSystemPrompt`. The sandbox section in the prompt depends on system prompt assembly.
- **bootstrap.md** -- `attempt.ts` is the orchestration point that calls the sandbox resolver alongside bootstrap file loading. Skills are copied into the sandbox workspace in full OpenClaw (skipped here, but the config still references it).
- **session-management.md** -- Session keys (`config/sessions.ts`, `routing/session-key.ts`) determine whether a session is sandboxed. `canonicalizeMainSessionAlias` and `resolveAgentMainSessionKey` are shared with session management.
- **error-handling.md** -- `attempt.ts` contains the retry loop and abort infrastructure that wraps sandbox-aware execution.

### Other checklists that depend on this one:

- **tools.md** -- Tool creation in `openclaw-tools.ts` receives `SandboxContext` and passes it to exec/process tools. Tool splitting in `tool-split.ts` uses `sandboxEnabled` flag.
- **subagents.md** -- Subagent sessions may be sandboxed in `"non-main"` mode. `resolveSubagentToolPolicy` applies deny lists that interact with sandbox tool policy.
- **event-subscription.md** -- Tool result handling in `pi-embedded-subscribe.ts` processes results from sandboxed tool executions.
