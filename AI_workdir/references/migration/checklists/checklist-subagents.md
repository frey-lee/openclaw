# Migration Checklist: Subagents Subsystem

Design doc: `openclaw-agent/design_docs/subagents.md`
Master matrix ref: `00-cross-cutting-decisions.md` Category 14 (Subagents), Category 17 (Gateway), Category 19 (Process & Routing)

---

## Migrate (Copy Verbatim)

These files contain the subagent spawning, lifecycle, announcement, and policy machinery. Copy from openclaw, then apply the Strip items below during Phase 5.

### Spawning tool

- [ ] `src/agents/tools/sessions-spawn-tool.ts` -- `sessions_spawn` tool implementation: security check (no recursive spawning), cross-agent authorization, session key generation, model resolution cascade, system prompt building, tool policy application, gateway delegation

### Announcement flow and system prompt

- [ ] `src/agents/subagent-announce.ts` -- `runSubagentAnnounceFlow` (stats collection, announcement formatting, main agent invocation, cleanup) + `buildSubagentSystemPrompt` (focused task prompt with minimal mode, behavioral rules, output format, restrictions, session context)
- [ ] `src/agents/subagent-announce-queue.ts` -- Announcement queuing infrastructure

### Lifecycle tracking (registry)

- [ ] `src/agents/subagent-registry.ts` -- `SubagentRunRecord` lifecycle tracking: registration, event monitoring (`agent.lifecycle` events), lifecycle stages (created -> started -> ended -> announced -> cleaned up -> archived)
- [ ] `src/agents/subagent-registry.store.ts` -- Registry persistence to disk

### Tool policy

- [ ] `src/agents/pi-tools.policy.ts` -- `resolveSubagentToolPolicy` hard deny list (sessions_spawn, sessions_list, sessions_history, sessions_send, session_status, gateway, agents_list, cron, memory_search, memory_get); cumulative deny + configurable allow/deny via `tools.subagents.tools` (also referenced in tools checklist)

### Session key utilities

- [ ] `src/sessions/session-key-utils.ts` -- `isSubagentSessionKey()`: identifies subagent session keys by pattern (`subagent:*` and `agent:{id}:subagent:*`)

### Cross-agent authorization

- [ ] `src/agents/agent-scope.ts` -- `resolveAgentConfig()` used for cross-agent auth: `agents[requesterAgentId].subagents.allowAgents` resolution, wildcard (`["*"]`), allowlist, and default-deny behavior

### Test files

- [ ] `src/agents/subagent-announce.format.test.ts` -- Tests for announcement formatting
- [ ] `src/agents/subagent-registry.persistence.test.ts` -- Tests for registry persistence
- [ ] `src/agents/pi-tools.policy.test.ts` -- Tests for tool policy including subagent deny list
- [ ] `src/agents/agent-scope.test.ts` -- Tests for agent config resolution

---

## Strip (Remove During Phase 5)

Remove these from the **copied** files during Phase 5 stripping.

### From `pi-tools.policy.ts`

- [ ] `whatsapp_login` entry from the hard deny list in `resolveSubagentToolPolicy` -- no WhatsApp integration in openclaw-agent

### From `subagent-announce.ts`

- [ ] Channel-specific announcement routing -- replace with a single unified announcement path (no Telegram/Discord/Slack/WhatsApp routing logic)

### From `sessions-spawn-tool.ts`

- [ ] Group/space context inheritance (`...groupContext` in gateway delegation) -- simplify; no channel group/space concepts in openclaw-agent

---

## Skip (Do Not Copy)

Nothing explicit -- all subagent files are kept. Every file referenced in the design doc is included in the Migrate section above.

---

## Placeholder (Stub Implementations Needed)

None expected -- the real implementations (spawn tool, registry, announcement flow, tool policy, session key utils, agent scope) are all copied directly.

---

## Dependencies

Cross-references to other subsystem checklists:

| Subsystem | Dependency | Direction |
|---|---|---|
| tools | `resolveSubagentToolPolicy` in `pi-tools.policy.ts` enforces the hard deny list on subagent tool sets; `sessions_spawn` is itself a tool in the tools pipeline | subagents <-> tools |
| tools | `sessions_spawn` tool is registered via `createOpenClawCodingTools` pipeline | tools -> subagents |
| session-management | Session key utilities (`isSubagentSessionKey` in `session-key-utils.ts`) used by session management for subagent detection | subagents -> session-management |
| system-prompt | `buildSubagentSystemPrompt` sets prompt mode to `"minimal"` (tooling, workspace, runtime sections only; no skills, memory, docs, messaging, user identity) | subagents -> system-prompt |
| hooks | Subagent registry subscribes to `agent.lifecycle` events (phase: `"start"` / `"end"` / `"error"`) for lifecycle tracking; announcement flow triggers on completion events | subagents -> hooks |
| bootstrap | `isSubagentSessionKey` is used during bootstrap to apply subagent filtering (skip certain bootstrap files for subagent sessions) | subagents -> bootstrap |
| gateway | Gateway delegation via `callGateway` RPC with `lane: "subagent"` routes execution to subagent command lane | subagents -> gateway |
| config | `resolveAgentConfig` reads `agents.list[].subagents.allowAgents` and `agents.defaults.subagents.model` from `OpenClawConfig` | subagents -> config |
