# Migration Checklist: System Prompt Subsystem

**Design doc:** `openclaw-agent/design_docs/system-prompt.md`
**Master matrix category:** 11 (System Prompt)
**Migration complexity:** Large
**Reason:** `system-prompt.ts` is ~554 lines with ~10 section builders to strip and ~10 to keep, many conditional branches based on `isMinimal` and feature availability. Multiple supporting files to copy.

---

## Migrate (Copy Verbatim)

Copy these files from OpenClaw into openclaw-agent without modification during Phase 4. All paths are relative to `src/agents/`.

- [ ] `src/agents/system-prompt.ts` -- Main builder (~554 lines). Contains `buildAgentSystemPrompt` and all section builders: `buildSkillsSection`, `buildMemorySection`, `buildTimeSection`, `buildDocsSection`, `buildRuntimeLine`, `buildUserIdentitySection`, `buildReplyTagsSection`, `buildMessagingSection`, `buildVoiceSection`. Also contains the full 24-step assembly order, tool list formatting, and prompt mode logic (full/minimal/none).
- [ ] `src/agents/pi-embedded-runner/system-prompt.ts` -- Pi-embedded wrapper. Contains `buildEmbeddedSystemPrompt` (extracts tool names, builds tool summaries, maps runtimeInfo, calls `buildAgentSystemPrompt`) and `createSystemPromptOverride` (closure for pi-coding-agent session). Currently a stub returning `extraSystemPrompt` or empty string.
- [ ] `src/agents/system-prompt-params.ts` -- Runtime parameter resolution. Contains `buildSystemPromptParams` which collects: `runtimeInfo` (agentId, host, os, arch, Node version, model, channel, capabilities), `repoRoot` (config -> git root -> cwd), `userTimezone`, `userTimeFormat`, `userTime` via `formatUserTime()`.
- [ ] `src/agents/system-prompt-report.ts` -- Diagnostic report. Contains `buildSystemPromptReport` which generates metadata, system prompt stats (total/project/non-project chars), injected workspace file details, skills prompt breakdown, and per-tool summary/schema stats.
- [ ] `src/agents/tool-summaries.ts` -- Tool summary map. Contains `buildToolSummaryMap` which creates a `{ [toolNameLowercase]: summary }` record from the `AgentTool[]` array. Used by both the system prompt tool list and the pi-embedded wrapper.
- [ ] `src/agents/date-time.ts` -- Timezone and time format resolution. Contains `resolveUserTimezone` (validates via `Intl.DateTimeFormat`, falls back to system timezone then UTC), `resolveUserTimeFormat` (platform-specific 12/24 detection: macOS `AppleICUForce24HourTime`, Windows PowerShell `ShortTimePattern`, fallback `Intl.DateTimeFormat`; caches result), and `formatUserTime`.

### Files referenced in assembly flow but owned by other subsystems (do not copy here)

These appear in the assembly flow diagram but belong to other migration checklists:

- `attempt.ts` -- Caller that invokes `resolveBootstrapContextForRun` and `buildEmbeddedSystemPrompt`. Owns the mode determination (`isSubagentSessionKey` check). Part of the retry/attempt subsystem.
- `bootstrap-files.ts`, `workspace.ts`, `bootstrap.ts` -- Bootstrap context file loading and injection. Already migrated. See checklist-bootstrap.
- `run/payloads.ts`, `usage.ts` -- Result collection and normalization. Part of retry-logic subsystem.

---

## Strip (Remove During Phase 5)

Remove these section builders, features, constants, and their references from `system-prompt.ts` and the main assembly function.

### Section builders (full function removal)

- [ ] `buildMessagingSection` -- Session routing, `sessions_send`, `message` tool guidance, inline buttons, silent reply token usage. Referenced at assembly step 16.
- [ ] `buildVoiceSection` -- TTS formatting hints. Referenced at assembly step 17.
- [ ] `buildReplyTagsSection` -- `[[reply_to_current]]` and `[[reply_to:<id>]]` tag formatting for native replies. Referenced at assembly step 15.
- [ ] `buildUserIdentitySection` -- Owner phone numbers and message source guidance. Referenced at assembly step 12.

### Conditional sections in the assembly function (code block removal)

- [ ] Self-update section -- Gateway self-update instructions (assembly step 7). Conditional on gateway tool availability and not minimal.
- [ ] Model aliases section -- Model name alias lines (assembly step 8). Conditional on alias lines provided and not minimal.
- [ ] Silent replies section -- `NO_REPLY` token instructions (assembly step 22). Conditional on not minimal.
- [ ] Heartbeats section -- `HEARTBEAT_OK` token instructions (assembly step 23). Conditional on not minimal.
- [ ] Reactions guidance -- Emoji reaction guidelines per channel, minimal or extensive (assembly step 19). Conditional per channel.
- [ ] Inline buttons -- Button UI guidance within `buildMessagingSection` (assembly step 16). Removed with messaging section.
- [ ] Channel capabilities references -- `resolveChannelCapabilities` and related capability fields in the runtime line and params.

### Constants to remove

- [ ] `HEARTBEAT_TOKEN` constant -- Auto-reply token for periodic polls.
- [ ] `SILENT_REPLY_TOKEN` constant -- Auto-reply token for empty responses (`NO_REPLY`).

### References to stripped features in the main assembly function

- [ ] Remove the call to `buildMessagingSection` and its result insertion into the prompt lines array.
- [ ] Remove the call to `buildVoiceSection` and its result insertion.
- [ ] Remove the call to `buildReplyTagsSection` and its result insertion.
- [ ] Remove the call to `buildUserIdentitySection` and its result insertion.
- [ ] Remove self-update conditional block that checks for gateway tool.
- [ ] Remove model aliases conditional block that checks for alias lines.
- [ ] Remove silent replies conditional block.
- [ ] Remove heartbeats conditional block.
- [ ] Remove reactions guidance conditional block.
- [ ] Remove channel capabilities from `buildRuntimeLine` if referenced there.
- [ ] Remove any messaging tool hints embedded in the tool list section text.
- [ ] Remove `HEARTBEAT_TOKEN` and `SILENT_REPLY_TOKEN` from any exports or imports.

### Parameters to strip from the params object

- [ ] Remove `ownerLine` parameter (feeds `buildUserIdentitySection`).
- [ ] Remove `ttsHint` parameter (feeds `buildVoiceSection`).
- [ ] Remove `aliasLines` parameter (feeds model aliases section).
- [ ] Remove `channelCapabilities` parameter (feeds channel-specific content).
- [ ] Remove any messaging-related params (`sessionRouting`, inline button config, etc.) if present in the params type.

---

## Placeholder (Stub Implementations Needed)

No stubs are needed for the system prompt subsystem itself. The current stub in `pi-embedded-runner/system-prompt.ts` (returns `extraSystemPrompt` or empty string) will be replaced by the real implementation during Phase 4.

**Note:** The sandbox info section calls `buildEmbeddedSandboxInfo` from the sandbox subsystem. If the sandbox resolver is a placeholder (returns null per sandbox checklist), the sandbox section will be skipped by its conditional check -- no stub needed in the system prompt code.

---

## Skip (Do Not Copy)

No files in the system prompt subsystem are skipped. All 6 files listed in the Migrate section are needed. Files referenced in the assembly flow that belong to other subsystems are handled by their own checklists.

---

## Dependencies

Cross-references to other subsystem checklists that the system prompt assembly depends on or interacts with.

| Dependency | Direction | Detail |
|------------|-----------|--------|
| **checklist-bootstrap** | System prompt **consumes** bootstrap output | `resolveBootstrapContextForRun` provides context files injected at assembly step 14/21. Bootstrap subsystem is already migrated. |
| **checklist-skills** | System prompt **consumes** skills prompt | `buildSkillsSection` injects the skills prompt (available skills list, `<skill>...</skill>` blocks). Depends on skill loading being functional. |
| **checklist-memory** | System prompt **consumes** memory tool availability | `buildMemorySection` checks whether `memory_search` or `memory_get` tools are in the tool list. Memory is INACTIVE but the section builder should still work (will be skipped if tools absent). |
| **checklist-sandbox** | System prompt **consumes** sandbox info | Sandbox section (assembly step 11) calls `buildEmbeddedSandboxInfo`. Sandbox resolver is a PLACEHOLDER returning null, so this section will be skipped at runtime. |
| **checklist-tools** | System prompt **consumes** tool list | The tool list section (assembly step 2) and `buildToolSummaryMap` depend on the `AgentTool[]` array provided by the tool creation pipeline. |
| **checklist-tools** | `tool-summaries.ts` **shared** with tools subsystem | `buildToolSummaryMap` is defined in `tool-summaries.ts` (system prompt subsystem) but used by both system prompt assembly and the pi-embedded wrapper. Ensure it is copied exactly once. |

---

## Verification Criteria

After Phase 4 (copy) and Phase 5 (strip), verify:

1. [ ] `buildAgentSystemPrompt` compiles with the stripped params type.
2. [ ] Prompt mode "full" produces a prompt containing: identity, tool list, tool call style, skills section, memory section, time section, docs section, sandbox section (when enabled), reasoning format (when configured), runtime line, context files, extra system prompt.
3. [ ] Prompt mode "minimal" produces only: identity, tool list, tool call style, workspace, runtime line, context files.
4. [ ] Prompt mode "none" returns the single identity line.
5. [ ] No references to `buildMessagingSection`, `buildVoiceSection`, `buildReplyTagsSection`, `buildUserIdentitySection`, `HEARTBEAT_TOKEN`, `SILENT_REPLY_TOKEN`, model aliases, self-update, reactions, or inline buttons remain in the codebase.
6. [ ] `buildSystemPromptReport` still generates valid diagnostic output for the kept sections.
7. [ ] `buildEmbeddedSystemPrompt` calls the real `buildAgentSystemPrompt` instead of returning a stub.
