# OpenClaw Error Handling Reference Map

## 1. Abort Handling

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-embedded-runner/abort.ts` | 8 | `isAbortError()` (1-8) | Detects abort errors by checking error name and message for "aborted" keyword |
| `pi-tools.abort.ts` | 40 | `throwAbortError()` (3-7), `combineAbortSignals()` (9-23), `wrapToolWithAbortSignal()` (25-40) | Wraps tools with abort signal support; combines multiple abort signals |
| `pi-embedded-runner/run/attempt.ts` | 884 | `runEmbeddedAttempt()` (133-884) | Main attempt execution. AbortController setup (138), abort timers (640-660), cleanup (834-840). Tracks `aborted` and `timedOut` flags (548-549). |

## 2. Timeout Infrastructure

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `timeout.ts` | 33 | `resolveAgentTimeoutSeconds()` (8-12), `resolveAgentTimeoutMs()` (14-33) | Resolves agent timeout configuration from config with fallback to defaults |
| `failover-error.ts` | 183 | `isTimeoutError()` (104-113), `TimeoutErrorCode` type (6-8) | Detects timeout errors from HTTP 408, NodeJS codes (ETIMEDOUT, ESOCKETTIMEDOUT, ECONNRESET), error names |
| `pi-embedded-runner/run/attempt.ts` | 884 | Timeout abort logic (640-660), `makeTimeoutAbortReason()` (552-556) | Runtime timeout via setTimeout, calls `abortRun(true)` at expiry, warning timer at +10s |

## 3. Failover Error Handling

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `failover-error.ts` | 183 | `FailoverError` class (6-35), `isFailoverError()` (37-39), `isTimeoutError()` (104-113), `resolveFailoverReasonFromError()` (115-133), `resolveFailoverStatus()` (41-56), `coerceToFailoverError()` (158-183), `describeFailoverError()` (135-156) | Core failover error class. Maps FailoverReason to HTTP status: 402=billing, 429=rate_limit, 401/403=auth, 408=timeout, 400=format |
| `model-fallback.ts` | 370 | `runWithModelFallback()` (193-298), `runWithImageModelFallback()` (301-370), `FallbackAttempt` type (12-19) | Model failover with retry. Tracks FallbackAttempt details. Returns first success or throws after all attempts exhausted. |
| `pi-embedded-runner/run.ts` | 679 | `runEmbeddedPiAgent()` (70-...) | Orchestrates agent run with failover via `runWithModelFallback()` wrapper |

### Failover Reason Classification

| Reason | Trigger Patterns | HTTP Status |
|--------|------------------|-------------|
| `rate_limit` | "rate_limit", "too many requests", "429", "quota exceeded" | 429 |
| `billing` | "402", "payment required", "insufficient credits" | 402 |
| `auth` | "401", "403", "unauthorized", "forbidden", "invalid api key" | 401/403 |
| `timeout` | "ETIMEDOUT", "ESOCKETTIMEDOUT", "408", "deadline exceeded" | 408 |
| `format` | "string should match pattern", "tool_use.id", "invalid request format" | 400 |
| `unknown` | Unclassified errors | 500 |

## 4. Context Overflow Detection & Handling

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `context-window-guard.ts` | 68 | `CONTEXT_WINDOW_HARD_MIN_TOKENS` (3), `CONTEXT_WINDOW_WARN_BELOW_TOKENS` (4), `resolveContextWindowInfo()` (19-44), `evaluateContextWindowGuard()` (51-68) | Guards context window from being too small. Hard block at 16K tokens, warn at 32K. |
| `pi-embedded-helpers/errors.ts` | 518 | `isContextOverflowError()` (7-26), `isLikelyContextOverflowError()` (32-37), `CONTEXT_OVERFLOW_HINT_RE` (29-30) | Detects context overflow via "request_too_large", "context length exceeded", "prompt too long", "413 too large" |

### Context Window Guard Thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| `CONTEXT_WINDOW_HARD_MIN_TOKENS` | 16,384 | Block run |
| `CONTEXT_WINDOW_WARN_BELOW_TOKENS` | 32,768 | Log warning |
| Default context window | 128,000 | Fallback if model spec unavailable |

## 5. Compaction Failure Handling

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `compaction.ts` | 345 | `estimateMessagesTokens()` (16-18), `splitMessagesByTokenShare()` (25-60), `chunkMessagesByMaxTokens()` (62-96), `computeAdaptiveChunkRatio()` (102-123), `pruneHistoryForContextShare()` (297-342) | Core message compaction: token-based chunking and pruning with adaptive chunk ratios |
| `pi-extensions/compaction-safeguard.ts` | 321 | Extension object (137-311), `collectToolFailures()` (66-101), `formatToolFailuresSection()` (103-113) | Safeguard extension: failure tracking, tool failure collection, retry coordination |
| `pi-extensions/compaction-safeguard-runtime.ts` | 34 | `setCompactionSafeguardRuntime()` (9-24), `getCompactionSafeguardRuntime()` (26-34) | Session-scoped runtime registry for compaction error state |
| `pi-embedded-runner/compact.ts` | 488 | `compactEmbeddedPiSessionDirect()` (109-475), `compactEmbeddedPiSession()` (478-488) | Direct compaction execution with error handling and safeguard runtime setup |
| `pi-embedded-helpers/errors.ts` | 518 | `isCompactionFailureError()` (39-49) | Detects compaction failure: context overflow + "summarization failed"/"auto-compaction"/"compaction" keywords |

## 6. Image Size Error Parsing

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-embedded-helpers/errors.ts` | 518 | `parseImageSizeError()` (471-483), `isImageSizeError()` (485-488), `parseImageDimensionError()` (448-465), `IMAGE_SIZE_ERROR_RE` (404), `IMAGE_DIMENSION_ERROR_RE` (401-402) | Parses image size/dimension errors, extracts max MB limits and pixel constraints |

## 7. Error Types & Classification

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-embedded-helpers/errors.ts` | 518 | `classifyFailoverReason()` (499-509), `isRateLimitErrorMessage()` (414-416), `isTimeoutErrorMessage()` (418-420), `isBillingErrorMessage()` (422-433), `isAuthErrorMessage()` (440-442), `isOverloadedErrorMessage()` (444-446), `ERROR_PATTERNS` (357-399) | Comprehensive error classification with pattern matching for rate_limit, billing, auth, timeout, format, overloaded |
| `pi-embedded-helpers/errors.ts` | 518 | `formatAssistantErrorText()` (253-311), `formatRawAssistantErrorForUi()` (230-251), `sanitizeUserFacingText()` (313-348), `parseApiErrorInfo()` (186-228) | User-facing error formatting, API error payload parsing, text sanitization. Truncates to 600 chars. |

### Error Classification Decision Tree

```
classifyFailoverReason(errorMessage):
  1. isImageDimensionErrorMessage() -> null (not failover)
  2. isImageSizeError() -> null (not failover)
  3. isRateLimitErrorMessage() -> "rate_limit"
  4. isOverloadedErrorMessage() -> "rate_limit"
  5. isCloudCodeAssistFormatError() -> "format"
  6. isBillingErrorMessage() -> "billing"
  7. isTimeoutErrorMessage() -> "timeout"
  8. isAuthErrorMessage() -> "auth"
  9. Else -> null
```

## 8. Session Tool Result Guards

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `session-tool-result-guard.ts` | 144 | `installSessionToolResultGuard()` (36-144), `extractAssistantToolCalls()` (9-26), `extractToolResultId()` (28-34) | Guards tool results: tracks pending calls, synthesizes missing results to prevent transcript corruption |
| `session-tool-result-guard-wrapper.ts` | 54 | `guardSessionManager()` (15-54), `GuardedSessionManager` type (6-9) | Wraps SessionManager with guard, supports tool_result_persist hooks, exposes flush method |

## 9. Retry & Attempt Logic

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `pi-embedded-runner/run/attempt.ts` | 884 | `runEmbeddedAttempt()` (133-884) | Main single attempt execution with abort/timeout management, image injection, compaction retries, hook execution |
| `model-fallback.ts` | 370 | `runWithModelFallback()` (193-298), `runWithImageModelFallback()` (301-370), `FallbackAttempt` type (12-19) | Retry with model fallback chain. Returns first success or throws FailoverError after all attempts exhausted. |
| `pi-embedded-runner/run.ts` | 679 | `runEmbeddedPiAgent()` (70-...) | Orchestrates agent run with failover, calls compaction on retry for context recovery |

### Attempt Execution Flow

```
1. Setup Phase (attempt.ts:133-420)
   - Resolve workspace/sandbox, create AbortController, setup tools/system prompt
2. Pre-Prompt Phase (attempt.ts:517-546)
   - Sanitize session history, validate turns, limit history, repair orphans
3. Prompt Phase (attempt.ts:682-792)
   - Run before_agent_start hooks, detect images, execute prompt
4. Compaction Retry Phase (attempt.ts:794-802)
   - Wait for compaction retries, catch abort errors
5. Completion Phase (attempt.ts:804-833)
   - Capture messages, run agent_end hooks, cleanup timers/subscriptions/locks
```

## 10. Context Window Guard (Prevention)

| File Path | Lines | Key Exports (Line Ranges) | Description |
|-----------|-------|--------------------------|-------------|
| `context-window-guard.ts` | 68 | `resolveContextWindowInfo()` (19-44), `evaluateContextWindowGuard()` (51-68), `ContextWindowGuardResult` type (46-49) | Guards context window. Resolution priority: model.contextWindow -> config override -> default 128K |

## 11. Supporting Types

| File Path | Lines | Key Types | Description |
|-----------|-------|-----------|-------------|
| `pi-embedded-runner/types.ts` | 80 | `EmbeddedPiRunMeta` (17-34), `EmbeddedRunAttemptResult` (36-52), `EmbeddedSandboxInfo` (67-79) | Error kinds: "context_overflow", "compaction_failure", "role_ordering", "image_size" |
| `pi-embedded-helpers/types.ts` | 4 | `FailoverReason` (3) | Union: "auth" | "format" | "rate_limit" | "billing" | "timeout" | "unknown" |
| `failover-error.ts` | 183 | `TimeoutErrorCode` (6-8), `FailoverError` class (6-35) | Timeout error codes; FailoverError with reason and status resolution |

## File Dependency Graph

```
runEmbeddedPiAgent (run.ts)
  +- runWithModelFallback (model-fallback.ts)
  |  +- runEmbeddedAttempt (run/attempt.ts)
  |  |  +- guardSessionManager (session-tool-result-guard-wrapper.ts)
  |  |  |  +- installSessionToolResultGuard (session-tool-result-guard.ts)
  |  |  +- subscribeEmbeddedPiSession (pi-embedded-subscribe.ts)
  |  |  |  +- compaction-safeguard.ts
  |  |  |     +- compaction-safeguard-runtime.ts
  |  |  +- isAbortError (pi-embedded-runner/abort.ts)
  |  |  +- isTimeoutError (failover-error.ts)
  |  +- isFailoverError (failover-error.ts)
  |  |  +- coerceToFailoverError -> resolveFailoverReasonFromError
  |  |     +- classifyFailoverReason (pi-embedded-helpers/errors.ts)
  |  +- compactEmbeddedPiSession (pi-embedded-runner/compact.ts)
  +- resolveAgentTimeoutMs (timeout.ts)
  +- evaluateContextWindowGuard (context-window-guard.ts)
  +- formatAssistantErrorText (pi-embedded-helpers/errors.ts)
```

## Migration Status (openclaw vs openclaw-agent)

### Files Present in BOTH Repositories
- `failover-error.ts` (migrated)
- `context-window-guard.ts` (migrated)
- `pi-embedded-helpers/errors.ts` (migrated)
- `pi-embedded-runner/abort.ts` (migrated — in pi-embedded-runner dir)
- `pi-tools.abort.ts` (migrated)
- `session-tool-result-guard-wrapper.ts` (migrated)
- `pi-embedded-runner/run/attempt.ts` (migrated)
- `pi-embedded-runner/compact.ts` (migrated)

### Files ONLY in openclaw (NOT Migrated)
- `timeout.ts` (agent timeout config resolution)
- `model-fallback.ts` (model failover with retry chain)
- `session-tool-result-guard.ts` (core guard logic — wrapper migrated but not the guard)
- `compaction.ts` (core message compaction: chunking, pruning, token estimation)
- `pi-extensions/compaction-safeguard.ts` (compaction failure tracking extension)
- `pi-extensions/compaction-safeguard-runtime.ts` (per-session compaction state)
- `pi-embedded-runner/run.ts` (run orchestration with failover)
- `tool-call-id.ts` (provider-specific tool call ID sanitization)
