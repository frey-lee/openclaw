# Migration Checklist: Event Subscription Subsystem

Design doc: `openclaw-agent/design_docs/event-subscription.md`
Master matrix ref: `00-cross-cutting-decisions.md` Category 16 (Event Subscription)

---

## Migrate (Copy Verbatim)

These files contain the event subscription runtime. Copy from openclaw, then apply the Strip items below during Phase 5.

### Core subscription files (from File Reference table)

- [ ] `src/agents/pi-embedded-subscribe.ts` -- Main subscription function (`subscribeEmbeddedPiSession`), event handler creation, state management, compaction coordination, text delta/end handling, tool call/result routing, assistant text accumulation, deduplication
- [ ] `src/agents/pi-embedded-subscribe.types.ts` -- Type definitions for subscription params, return value, handler context, tool metadata, block chunking config
- [ ] `src/agents/pi-embedded-subscribe.tools.ts` -- Tool result sanitization (`sanitizeToolResult`), text extraction (`extractToolResultText`), error detection (`isToolResultError`), error message extraction (`extractToolErrorMessage`)
- [ ] `src/agents/pi-embedded-block-chunker.ts` -- `EmbeddedBlockChunker` class for batched text delivery, buffer management, force-drain on message end

### Handler files (from doc body, event handling sections)

- [ ] `src/agents/pi-embedded-subscribe.handlers.messages.ts` -- Message event handlers (text delta, text end, message end processing)
- [ ] `src/agents/pi-embedded-subscribe.handlers.lifecycle.ts` -- Lifecycle event handlers (session start/end, compaction events)

### Test files

- [ ] `src/agents/pi-embedded-subscribe.code-span-awareness.test.ts` -- Code span awareness in tag stripping (tags inside backticks are not stripped)
- [ ] `src/agents/pi-embedded-subscribe.reply-tags.test.ts` -- Reply tag processing tests
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.subscribeembeddedpisession.test.ts` -- Core subscription function tests
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.calls-onblockreplyflush-before-tool-execution-start-preserve.test.ts` -- Block reply flush ordering before tool execution
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-append-text-end-content-is.test.ts` -- Empty text end handling
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-call-onblockreplyflush-callback-is-not.test.ts` -- Flush callback guard
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-duplicate-text-end-repeats-full.test.ts` -- Text end deduplication
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-emit-duplicate-block-replies-text.test.ts` -- Block reply deduplication
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-block-replies-text-end-does-not.test.ts` -- Block reply emission on text end
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-reasoning-as-separate-message-enabled.test.ts` -- Reasoning stream routing
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.filters-final-suppresses-output-without-start-tag.test.ts` -- `enforceFinalTag` filtering
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.includes-canvas-action-metadata-tool-summaries.test.ts` -- Canvas action metadata in tool summaries
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-assistanttexts-final-answer-block-replies-are.test.ts` -- Assistant text preservation with block replies
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-indented-fenced-blocks-intact.test.ts` -- Indented fenced block preservation
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.reopens-fenced-blocks-splitting-inside-them.test.ts` -- Fenced block reopening on split
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.splits-long-single-line-fenced-blocks-reopen.test.ts` -- Long single-line fenced block splitting
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.streams-soft-chunks-paragraph-preference.test.ts` -- Soft chunk streaming with paragraph breaks
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.suppresses-message-end-block-replies-message-tool.test.ts` -- Message-end block reply suppression when message tool was used
- [ ] `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.waits-multiple-compaction-retries-before-resolving.test.ts` -- Multiple compaction retry coordination
- [ ] `src/agents/pi-embedded-subscribe.tools.test.ts` -- Tool result sanitization and error extraction tests
- [ ] `src/agents/pi-embedded-block-chunker.test.ts` -- Block chunker buffer and flush tests

### Functionality preserved after migration

| Feature | Source File | Notes |
|---|---|---|
| `subscribeEmbeddedPiSession` | `pi-embedded-subscribe.ts` | Main entry point, creates handler, returns accumulated state |
| Text delta/end handling | `pi-embedded-subscribe.ts`, `handlers.messages.ts` | Accumulation, tag stripping, deduplication, block chunking |
| Tool call/result handling | `pi-embedded-subscribe.ts` | Metadata capture, summary emission, error detection |
| `sanitizeToolResult` | `pi-embedded-subscribe.tools.ts` | Truncates text (8000 chars), strips image base64 |
| `extractToolResultText` | `pi-embedded-subscribe.tools.ts` | Joins text blocks from result content |
| `isToolResultError` | `pi-embedded-subscribe.tools.ts` | Checks details.status for error/timeout |
| `extractToolErrorMessage` | `pi-embedded-subscribe.tools.ts` | Multi-stage error extraction, truncates to 400 chars |
| Reasoning tag stripping | `pi-embedded-subscribe.ts` | Stateful `<think>`/`<final>` tag parsing across chunk boundaries |
| Block chunking | `pi-embedded-block-chunker.ts` | `EmbeddedBlockChunker` batches small text increments |
| Compaction coordination | `pi-embedded-subscribe.ts` | `isCompacting`, `waitForCompactionRetry`, `noteCompactionRetry`, `resolveCompactionRetry` |
| Last tool error tracking | `pi-embedded-subscribe.ts` | `getLastToolError()` for attempt result |

---

## Strip (Remove During Phase 5)

Remove these from the **copied** files during Phase 5 stripping.

### From `pi-embedded-subscribe.ts` (or related handler files) -- messaging tool deduplication state

- [ ] `messagingToolSentTexts` array and all accumulation logic
- [ ] `getMessagingToolSentTargets()` function
- [ ] `didSendViaMessagingTool()` function
- [ ] `trimMessagingToolSent()` function (caps arrays at 200 entries)

### From `pi-embedded-subscribe.tools.ts` -- messaging tool extraction

- [ ] `extractMessagingToolSend` function (extracts messaging intent from tool invocations)
- [ ] Channel plugin delegation for tool send extraction (provider-specific `extractToolSend` callbacks)
- [ ] `normalizeTargetForProvider` function

### From return value of `subscribeEmbeddedPiSession`

- [ ] `getMessagingToolSentTexts` property
- [ ] `getMessagingToolSentTargets` property
- [ ] `didSendViaMessagingTool` property

### Master matrix confirmation (Category 16)

| Feature | Decision | Source |
|---|---|---|
| Messaging tool deduplication (`messagingToolSentTexts`, etc.) | STRIP | event-subscription.md |
| Channel-specific tool send extraction | STRIP | event-subscription.md |
| `normalizeTargetForProvider` | STRIP | event-subscription.md |

---

## Skip (Do Not Copy)

Nothing -- all core subscription files are kept. The only non-subscription file in the File Reference table (`pi-embedded-runner/run/attempt.ts`) is a consumer of the subscription API and belongs to the session-management / error-handling subsystem checklists.

---

## Placeholder (Stub Implementations Needed)

None -- real implementations are copied for all subscription functionality.

---

## Dependencies

Cross-references to other subsystem checklists:

| Subsystem | Dependency | Direction |
|---|---|---|
| session-management | Subscription is created per attempt in `attempt.ts`; `assistantTexts` and `toolMetas` flow back to attempt result | event-subscription -> session-management |
| error-handling | Compaction coordination (`waitForCompactionRetry`, `noteCompactionRetry`, `resolveCompactionRetry`) integrates with the retry loop | event-subscription -> error-handling |
| tools | Tool call/result events originate from tool execution; `sanitizeToolResult` and error detection process tool output | tools -> event-subscription |
