# Migration Checklist: Error Handling

Design doc: `openclaw-agent/design_docs/error-handling.md`
Master matrix: Category 13 (Error Handling), Category 3 (Model Infrastructure)

---

## Migrate (Copy Verbatim)

Source files to copy into openclaw-agent. Each file carries over its existing tests.

- [ ] `src/agents/pi-embedded-runner/run/run.ts` -- Retry loop (auto-compaction on context overflow, prompt sanitization via `scrubAnthropicRefusalMagic`)
- [ ] `src/agents/pi-embedded-runner/run/attempt.ts` -- Attempt lifecycle (abort infrastructure: `abortRun`, `abortable`, timeout timer, external abort signal wiring, compaction wait)
- [ ] `src/agents/pi-embedded-helpers/errors.ts` -- Error classifiers (`isContextOverflowError`, `isCompactionFailureError`, `parseImageSizeError`, `parseImageDimensionError`)
- [ ] `src/agents/failover-error.ts` -- Contains `isTimeoutError` (keep) mixed with failover code (strip; see Strip section below)
- [ ] `src/agents/pi-embedded-runner/timeout.ts` -- Timeout resolution (`resolveAgentTimeoutMs`: override -> config -> default -> floor)
- [ ] `src/agents/session-tool-result-guard.ts` -- Transcript guard (`installSessionToolResultGuard`, synthetic tool results, `flushPendingToolResults`, `getPendingIds`)
- [ ] `src/agents/pi-extensions/compaction-safeguard.ts` -- Compaction failure tracking extension (adaptive pruning, fallback summary, split-turn handling)
- [ ] `src/agents/pi-extensions/compaction-safeguard-runtime.ts` -- Per-session compaction state
- [ ] `src/agents/abort.ts` -- `isAbortError` type guard (if separate file)
- [ ] `src/agents/tool-call-id.ts` -- Provider-specific tool call ID sanitization (Mistral/Cloud Code Assist compatibility)
- [ ] `src/agents/compaction.ts` -- Core message compaction (chunking, pruning, token estimation; needed by compaction-safeguard)

### Test files

- [ ] Locate and copy tests for `run.ts` (retry loop, auto-compaction, prompt sanitization)
- [ ] Locate and copy tests for `attempt.ts` (abort, timeout, compaction wait)
- [ ] Locate and copy tests for `errors.ts` (classifier matching)
- [ ] Locate and copy tests for `failover-error.ts` (`isTimeoutError` coverage)
- [ ] Locate and copy tests for `timeout.ts` (resolution priority)
- [ ] Locate and copy tests for `session-tool-result-guard.ts` (synthetic results, flush)
- [ ] Locate and copy tests for `compaction-safeguard.ts` (adaptive pruning, fallback)
- [ ] Locate and copy tests for `compaction-safeguard-runtime.ts`
- [ ] Locate and copy tests for `abort.ts`
- [ ] Locate and copy tests for `tool-call-id.ts`
- [ ] Locate and copy tests for `compaction.ts`

---

## Strip (Remove During Phase 5)

These symbols and code paths exist in migrated files but must be deleted during stripping.

### From `failover-error.ts`

- [ ] `FailoverError` class
- [ ] `resolveFailoverStatus`
- [ ] `resolveFailoverReasonFromError`
- [ ] `coerceToFailoverError`
- [ ] `isRateLimitAssistantError`
- [ ] `isAuthAssistantError`
- [ ] `isFailoverAssistantError`
- [ ] `isRateLimitErrorMessage`, `isAuthErrorMessage`, `isOverloadedErrorMessage`
- [ ] `ERROR_PATTERNS`, `matchesErrorPatterns`
- [ ] `formatAssistantErrorText`, `sanitizeUserFacingText`

### From `run.ts`

- [ ] Model fallback logic (any model retry chain or alternate-model selection)
- [ ] Auth profile rotation
- [ ] Any failover retry code (code paths that catch rate-limit/auth/failover errors and retry with a different model or credential)

---

## Skip (Do Not Copy)

- [ ] `model-fallback.ts` -- Model failover with retry chain; no model failover in openclaw-agent

---

## Placeholder (Stub Implementations Needed)

None expected. All error handling subsystem components are either migrated verbatim or stripped.

---

## Dependencies

| This subsystem... | ...depends on | Direction | Notes |
|---|---|---|---|
| `session-tool-result-guard.ts` | session-management | shared | Guard is also referenced in session-management checklist; ensure single source of truth |
| `compaction-safeguard.ts` | event-subscription | consumes | Compaction coordination events (`session_before_compact`) originate from event-subscription |
| `run.ts` | `compaction.ts` | calls | Retry loop calls `compactEmbeddedPiSessionDirect` on context overflow |
| `attempt.ts` | `timeout.ts` | calls | Attempt reads resolved timeout via `resolveAgentTimeoutMs` |
| `attempt.ts` | `abort.ts` | calls | Uses `isAbortError` to distinguish cancellation from unexpected errors |
| `run.ts`, `attempt.ts` | `errors.ts` | calls | Uses `isContextOverflowError`, `isCompactionFailureError` |
| `run.ts`, `attempt.ts` | `failover-error.ts` (post-strip) | calls | Uses `isTimeoutError` (only surviving export after stripping) |
| `session-tool-result-guard.ts` | `session-transcript-repair.ts` | calls | Uses `makeMissingToolResult` for synthetic results |
| `tool-call-id.ts` | (standalone) | -- | No cross-subsystem dependencies |

### Cross-references to other checklists

- **session-management** -- `session-tool-result-guard.ts` is shared between error-handling and session-management; the guard wrapper (`session-tool-result-guard-wrapper.ts`) lives in session-management
- **event-subscription** -- Compaction coordination events flow from event-subscription into the compaction safeguard
