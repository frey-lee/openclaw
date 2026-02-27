# Migration Checklist: Session Management

Design doc: `openclaw-agent/design_docs/session-management.md`
Master matrix: Category 12 (Session Management)

---

## Migrate (Copy Verbatim)

### Core session management files

All 10 files from the design doc's "Current State" table:

- [ ] `src/agents/session-write-lock.ts` (176 lines) — `acquireSessionWriteLock`, file locking with stale eviction, reentrant counting, signal cleanup
- [ ] `src/agents/transcript-policy.ts` (133 lines) — `resolveTranscriptPolicy`, provider-based policy (Gemini, Anthropic, OpenAI, Mistral, OpenRouter)
- [ ] `src/agents/session-transcript-repair.ts` (195 lines) — `makeMissingToolResult`, `repairToolUseResultPairing`, `sanitizeToolUseResultPairing`
- [ ] `src/agents/session-tool-result-guard.ts` (133 lines) — `installSessionToolResultGuard`, monkey-patches appendMessage, tracks pending tool calls
- [ ] `src/agents/session-tool-result-guard-wrapper.ts` (55 lines) — `guardSessionManager`, applies guard exactly once, integrates with hook system
- [ ] `src/agents/pi-embedded-runner/session-manager-init.ts` (53 lines) — `prepareSessionManagerForRun`, handles SessionManager flush quirk
- [ ] `src/agents/pi-embedded-runner/history.ts` (85 lines) — `limitHistoryTurns`, `getDmHistoryLimitFromSessionKey`
- [ ] `src/agents/pi-embedded-runner/runs.ts` (131 lines) — `setActiveEmbeddedRun`, `clearActiveEmbeddedRun`, `queueEmbeddedPiMessage`, `abortEmbeddedPiRun`, `waitForEmbeddedPiRunEnd`
- [ ] `src/agents/pi-embedded-subscribe.ts` (25 lines, stub) — returns empty accumulators; full implementation deferred to event-subscription checklist
- [ ] `src/agents/pi-embedded-runner/session-manager-cache.ts` (7 lines, stub) — no-op `prewarmSessionFile`

### Supporting files referenced by design doc

- [ ] `src/sessions/transcript-events.ts` (24 lines) — event emitter for session transcript file updates (`emitSessionTranscriptUpdate`)
- [ ] `src/agents/cache-trace.ts` — `createCacheTrace`, diagnostic snapshot recording at each pipeline stage
- [ ] `src/agents/anthropic-payload-log.ts` — `createAnthropicPayloadLogger`, raw API request/response payload logging
- [ ] `src/agents/pi-embedded-runner/extra-params.ts` — `applyExtraParamsToAgent`, injects provider-specific parameters into stream function

### Test files (from openclaw source)

- [ ] `src/agents/session-write-lock.test.ts`
- [ ] `src/agents/session-tool-result-guard.test.ts`
- [ ] `src/agents/session-tool-result-guard.tool-result-persist-hook.test.ts`
- [ ] `src/agents/session-transcript-repair.test.ts`
- [ ] `src/agents/cache-trace.test.ts`
- [ ] `src/agents/pi-embedded-runner.guard.test.ts`
- [ ] `src/agents/pi-embedded-runner.sanitize-session-history.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.subscribeembeddedpisession.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-indented-fenced-blocks-intact.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.reopens-fenced-blocks-splitting-inside-them.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.splits-long-single-line-fenced-blocks-reopen.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.streams-soft-chunks-paragraph-preference.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.suppresses-message-end-block-replies-message-tool.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.waits-multiple-compaction-retries-before-resolving.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.calls-onblockreplyflush-before-tool-execution-start-preserve.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-append-text-end-content-is.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-call-onblockreplyflush-callback-is-not.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-duplicate-text-end-repeats-full.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-emit-duplicate-block-replies-text.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-block-replies-text-end-does-not.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-reasoning-as-separate-message-enabled.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.filters-final-suppresses-output-without-start-tag.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.includes-canvas-action-metadata-tool-summaries.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-assistanttexts-final-answer-block-replies-are.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.code-span-awareness.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.tools.test.ts`
- [ ] `src/agents/pi-embedded-subscribe.reply-tags.test.ts`

> **Note on pi-embedded-subscribe tests**: These tests belong to the full subscription implementation. Since `pi-embedded-subscribe.ts` is currently a stub in openclaw-agent, these tests will be relevant when the event-subscription checklist is executed. Copy them during that phase, not during initial session-management migration.

---

## Strip (Remove During Phase 5)

Per the master matrix (Category 2, Category 18):

- [ ] Channel-specific config references in `getDmHistoryLimitFromSessionKey` (`history.ts:41`) — the function reads `config.channels[provider].dmHistoryLimit` and `config.channels[provider].dms[userId].historyLimit`. The turn-limiting **logic** is KEEP; the **channel config lookup path** is STRIP. Replace with a simpler config resolution that does not depend on channel provider keys.
- [ ] Messaging tool deduplication (`messagingToolSentTexts`, etc.) referenced in the subscription system — STRIP per master matrix Category 1 and Category 16.
- [ ] Any messaging-specific code that leaks into session management (e.g., reply tag handling, `normalizeTargetForProvider`).

---

## Placeholder (Stub Implementations Needed)

- [ ] `prewarmSessionFile` in `session-manager-cache.ts` — already a no-op stub (7 lines). Copy as-is; no further work needed.
- [ ] `subscribeEmbeddedPiSession` in `pi-embedded-subscribe.ts` — already a stub (25 lines) returning empty accumulators. Copy as-is; full implementation deferred to the event-subscription checklist.

---

## Skip (Do Not Copy)

Nothing explicit. Session management is fully kept per the master matrix (Category 12). All 10 core files plus supporting files are migrated.

---

## Dependencies

Cross-references to other subsystem checklists:

| Dependency | Reason | Checklist |
|------------|--------|-----------|
| Error handling (compaction) | Retry loop with auto-compaction triggers `auto_compaction_start`/`auto_compaction_end` events; `isContextOverflowError` and `isCompactionFailureError` are used in the attempt loop alongside session management. | `checklist-error-handling.md` |
| Hooks (`tool_result_persist`) | `guardSessionManager` integrates with `getGlobalHookRunner().runToolResultPersist()` to transform tool results before persistence. The hook runner singleton must be available. | `checklist-hooks.md` |
| Event subscription (subscriber) | `subscribeEmbeddedPiSession` is currently a stub. The full implementation (event routing, text accumulation, compaction coordination, callbacks) is deferred to the event-subscription subsystem. | `checklist-event-subscription.md` |
| Config (`channels` key) | `getDmHistoryLimitFromSessionKey` reads `config.channels[provider]` for DM history limits. The `channels` field was added to `OpenClawConfig` in `config/config.ts`. | `checklist-config.md` (if separate) |
| Logging / diagnostics | `cache-trace.ts` and `anthropic-payload-log.ts` depend on diagnostic logging stubs (`logging/diagnostic.ts`). | N/A (already created as supporting file) |
| Plugins (`hook-runner-global.ts`) | `session-tool-result-guard-wrapper.ts` calls `getGlobalHookRunner()` from `plugins/hook-runner-global.ts`. The `HookRunner` type must include `runToolResultPersist`. | `checklist-hooks.md` |

---

## Migration Order Notes

1. Migrate the 10 core files and 4 supporting files first (all are already migrated per the design doc's "Current State" table).
2. Copy test files for the **fully implemented** modules (session-write-lock, session-tool-result-guard, session-transcript-repair, cache-trace, pi-embedded-runner guard/sanitize).
3. Defer `pi-embedded-subscribe` test files until the event-subscription checklist is executed.
4. During Phase 5 stripping, revisit `getDmHistoryLimitFromSessionKey` to simplify the channel config lookup path.
