# Topic 1: Agent Loop & Pi Runner

## What It Does

The Agent Loop is the central execution spine of OpenClaw. It receives a user prompt, sends it to an LLM, processes tool calls, streams partial replies, and returns structured payloads. The entire flow is wrapped in concurrency control (lane-based queuing), auth profile rotation, thinking-level fallback, context overflow auto-compaction, and abort/timeout handling.

The key entry point is `runEmbeddedPiAgent()` which orchestrates a retry loop around `runEmbeddedAttempt()`, which in turn delegates the actual LLM call to `@mariozechner/pi-coding-agent`'s `createAgentSession()` + `session.prompt()`.

---

## Key Types and Interfaces

### RunEmbeddedPiAgentParams (`run/params.ts:20-98`)
The top-level input to the agent loop. Key fields:

```typescript
type RunEmbeddedPiAgentParams = {
  sessionId: string;              // Unique session identifier
  sessionKey?: string;            // Human-readable session key (e.g. "telegram:123")
  sessionFile: string;            // Path to session transcript file on disk
  workspaceDir: string;           // Working directory for tools
  config?: OpenClawConfig;        // Full OpenClaw configuration
  prompt: string;                 // User's message text
  images?: ImageContent[];        // Attached images for vision models
  provider?: string;              // LLM provider (e.g. "anthropic", "openai")
  model?: string;                 // Model ID (e.g. "claude-sonnet-4-20250514")
  authProfileId?: string;         // Preferred auth profile
  thinkLevel?: ThinkLevel;        // "off" | "low" | "medium" | "high"
  timeoutMs: number;              // Hard timeout for the entire run
  runId: string;                  // Unique identifier for this run
  abortSignal?: AbortSignal;      // External abort control
  // Streaming callbacks:
  onPartialReply?: (payload) => void;      // Streamed text fragments
  onBlockReply?: (payload) => void;        // Complete text blocks
  onBlockReplyFlush?: () => void;          // Block boundary signal
  onReasoningStream?: (payload) => void;   // Reasoning/thinking text
  onToolResult?: (payload) => void;        // Tool execution results
  onAgentEvent?: (evt) => void;            // Lifecycle events
  enforceFinalTag?: boolean;               // Enforce <final> tag extraction
};
```

### EmbeddedPiRunResult (`types.ts:36-52`)
The output of a complete agent run:

```typescript
type EmbeddedPiRunResult = {
  payloads?: Array<{
    text?: string;
    mediaUrl?: string;
    mediaUrls?: string[];
    replyToId?: string;
    isError?: boolean;
  }>;
  meta: EmbeddedPiRunMeta;       // Duration, usage, session ID, errors
  didSendViaMessagingTool?: boolean;  // Suppress duplicate replies
  messagingToolSentTexts?: string[];
  messagingToolSentTargets?: MessagingToolSend[];
};
```

### EmbeddedRunAttemptResult (`run/types.ts:91-108`)
The output of a single attempt (before retry logic):

```typescript
type EmbeddedRunAttemptResult = {
  aborted: boolean;
  timedOut: boolean;
  promptError: unknown;
  sessionIdUsed: string;
  assistantTexts: string[];           // Collected response text blocks
  toolMetas: Array<{ toolName: string; meta?: string }>;
  lastAssistant: AssistantMessage | undefined;
  lastToolError?: ToolErrorSummary;
  didSendViaMessagingTool: boolean;
  clientToolCall?: { name: string; params: Record<string, unknown> };
};
```

---

## Code Flow

### Phase 1: Entry & Concurrency Control (`run.ts:70-90`)

`runEmbeddedPiAgent()` is the public entry point.

1. **Lane resolution** (`run.ts:73-74`): Two lanes are resolved - a `sessionLane` (serializes requests per session) and a `globalLane` (serializes across all sessions). These use `enqueueCommandInLane()` from the process command queue.

2. **Double-enqueue** (`run.ts:89-90`): The actual work is wrapped in `enqueueSession(() => enqueueGlobal(async () => { ... }))`. This means:
   - First, the task enters the session-specific queue (prevents concurrent prompts to the same session).
   - Then, within that, it enters the global lane queue (rate-limits overall LLM calls).

### Phase 2: Model & Auth Resolution (`run.ts:95-165`)

3. **Model resolution** (`run.ts:102-107`): Calls `resolveModel()` which looks up the model in the registry, returning the `Model` object, `authStorage`, and `modelRegistry`.

4. **Context window guard** (`run.ts:112-137`): Evaluates whether the model's context window meets minimum requirements. Warns below 16K tokens, blocks below a hard minimum.

5. **Auth profile ordering** (`run.ts:139-164`): Resolves the ordered list of auth profiles to try. If a user explicitly chose a profile (`authProfileIdSource === "user"`), it's locked. Otherwise, `resolveAuthProfileOrder()` returns profiles sorted by preference/health.

6. **Initial API key application** (`run.ts:267-293`): Iterates through `profileCandidates`, skipping those in cooldown, and calls `applyApiKeyInfo()` which:
   - Calls `getApiKeyForModel()` to retrieve the key
   - For GitHub Copilot, exchanges the GitHub token for a Copilot API token
   - Sets the key via `authStorage.setRuntimeApiKey()`

### Phase 3: Retry Loop (`run.ts:296-673`)

The core retry loop (`while (true)`) handles multiple failure modes:

7. **Prompt sanitization** (`run.ts:301-302`): For Anthropic, scrubs the magic refusal test string to prevent transcript poisoning.

8. **Attempt execution** (`run.ts:304-357`): Calls `runEmbeddedAttempt()` with all parameters. This is the "inner loop" that does the actual LLM work.

9. **Error classification and recovery** (`run.ts:361-511`):
   - **Context overflow** (`run.ts:363-420`): Attempts auto-compaction via `compactEmbeddedPiSessionDirect()`. If compaction succeeds, `continue` retries the prompt. If it fails, returns a user-friendly error payload.
   - **Role ordering errors** (`run.ts:422-443`): Returns a message suggesting `/new` to start fresh.
   - **Image size errors** (`run.ts:445-471`): Returns a message about image compression.
   - **Auth profile rotation** (`run.ts:482-488`): On failover errors (rate limits, auth failures), marks the profile as failed and calls `advanceAuthProfile()` to try the next one.
   - **Thinking level fallback** (`run.ts:489-499`): If the error suggests unsupported thinking level, tries `pickFallbackThinkingLevel()` and retries.
   - **FailoverError for model fallback** (`run.ts:502-510`): If fallbacks are configured and the error is failover-eligible, throws `FailoverError` which the caller can use to try a different model entirely.

10. **Post-attempt rotation** (`run.ts:553-611`): Even after a successful prompt, checks for auth/rate-limit/failover errors in the assistant response. If `shouldRotate` is true (failover failure or timeout), tries rotating auth profiles.

11. **Success path** (`run.ts:613-673`):
    - Normalizes usage stats
    - Builds payloads via `buildEmbeddedRunPayloads()`
    - Marks the auth profile as good/used
    - Returns the final `EmbeddedPiRunResult`

### Phase 4: The Attempt (`run/attempt.ts:133-884`)

`runEmbeddedAttempt()` is where the actual LLM interaction happens:

12. **Sandbox resolution** (`attempt.ts:147-157`): Resolves sandbox context, potentially redirecting the workspace directory.

13. **Skills & environment** (`attempt.ts:162-181`): Loads workspace skill entries, applies skill environment overrides, resolves skills prompt text.

14. **Bootstrap files** (`attempt.ts:184-196`): Loads workspace context files (e.g., `AGENTS.md`, project docs) via `resolveBootstrapContextForRun()`.

15. **Tool creation** (`attempt.ts:202-237`): Calls `createOpenClawCodingTools()` to build the full tool set, then sanitizes for Google models. Tools are split into `builtInTools` and `customTools` via `splitSdkTools()` (`attempt.ts:435-438`).

16. **System prompt construction** (`attempt.ts:337-385`): Builds the system prompt via `buildEmbeddedSystemPrompt()`, incorporating workspace info, thinking level, skills, docs path, sandbox info, channel capabilities, etc.

17. **Session creation** (`attempt.ts:450-465`): Calls `createAgentSession()` from `@mariozechner/pi-coding-agent`:
    ```typescript
    ({ session } = await createAgentSession({
      cwd: resolvedWorkspace,
      agentDir,
      authStorage,
      modelRegistry,
      model,
      thinkingLevel: mapThinkingLevel(params.thinkLevel),
      systemPrompt,
      tools: builtInTools,
      customTools: allCustomTools,
      sessionManager,
      settingsManager,
      skills: [],
      contextFiles: [],
      additionalExtensionPaths,
    }));
    ```
    This is the delegation point to the pi-runner. The session object provides `.prompt()`, `.abort()`, `.steer()`, `.subscribe()`, `.messages`, `.isStreaming`, `.agent`, and `.dispose()`.

18. **Stream function override** (`attempt.ts:493`): Forces `activeSession.agent.streamFn = streamSimple` for a stable reference. Then wraps it with cache trace and payload logging if configured.

19. **History sanitization** (`attempt.ts:518-546`): Sanitizes existing session history:
    - `sanitizeSessionHistory()` - provider-specific cleanup
    - `validateGeminiTurns()` / `validateAnthropicTurns()` - structural validation
    - `limitHistoryTurns()` - caps history length per config
    - Replaces agent messages if modified

20. **Event subscription** (`attempt.ts:597-626`): Calls `subscribeEmbeddedPiSession()` which returns the streaming handler. This wires up all the `onBlockReply`, `onToolResult`, `onPartialReply` etc. callbacks.

21. **Active run registration** (`attempt.ts:636`): `setActiveEmbeddedRun()` registers the session in a global map so external code can queue messages (`steer`), check streaming status, or abort.

22. **Prompt execution** (`attempt.ts:782-785`): The core LLM call:
    ```typescript
    if (imageResult.images.length > 0) {
      await abortable(activeSession.prompt(effectivePrompt, { images: imageResult.images }));
    } else {
      await abortable(activeSession.prompt(effectivePrompt));
    }
    ```
    `activeSession.prompt()` triggers the pi-runner's internal loop: send to LLM -> receive response -> if tool calls, execute tools -> send results back to LLM -> repeat until done. The `abortable()` wrapper allows the timeout/abort system to interrupt.

23. **Hooks** (`attempt.ts:687-711, 814-833`): `before_agent_start` hooks can prepend context. `agent_end` hooks fire asynchronously after completion.

24. **Compaction retry wait** (`attempt.ts:794-802`): Waits for any in-flight auto-compaction retries triggered by the pi-runner.

25. **Result extraction** (`attempt.ts:842-873`): Extracts the last assistant message, normalizes tool metas, and returns the `EmbeddedRunAttemptResult`.

### Phase 5: Event Subscription & Streaming (`pi-embedded-subscribe.ts`)

The subscription system translates pi-runner events into OpenClaw's streaming model:

26. **State initialization** (`pi-embedded-subscribe.ts:34-68`): Creates `EmbeddedPiSubscribeState` tracking:
    - `assistantTexts[]` - collected response text blocks
    - `toolMetas[]` - tool execution metadata
    - `deltaBuffer` / `blockBuffer` - streaming text accumulators
    - `blockState` - tracks `<think>`/`<final>` tag nesting
    - Compaction state, messaging tool tracking

27. **Event handler creation** (`pi-embedded-subscribe.handlers.ts:22-63`): Routes events to specialized handlers:
    - `message_start` -> `handleMessageStart`
    - `message_update` -> `handleMessageUpdate`
    - `message_end` -> `handleMessageEnd`
    - `tool_execution_start` -> `handleToolExecutionStart`
    - `tool_execution_update` -> `handleToolExecutionUpdate`
    - `tool_execution_end` -> `handleToolExecutionEnd`
    - `agent_start` / `agent_end` -> lifecycle handlers
    - `auto_compaction_start` / `auto_compaction_end` -> compaction handlers

28. **Message streaming** (`handlers.messages.ts:39-156`):
    - On `message_update` with `text_delta`: appends to `deltaBuffer`, feeds block chunker, strips `<think>`/`<final>` tags, emits partial replies and agent events.
    - On `text_end` with `blockReplyBreak === "text_end"`: drains the block chunker, emitting complete text blocks via `onBlockReply`.
    - On `message_end`: finalizes assistant texts, handles reasoning emission, emits final block reply, resets state.

29. **Tool event handling** (`handlers.tools.ts`):
    - `tool_execution_start` (`handlers.tools.ts:30-105`): Flushes block reply buffer (preserves boundaries), extracts meta, emits tool summary, tracks messaging tool sends as pending.
    - `tool_execution_end` (`handlers.tools.ts:139-220`): Records tool meta, commits/discards pending messaging texts based on success/error, emits agent events.

30. **Tag stripping** (`pi-embedded-subscribe.ts:257-339`):
    - Strips `<think>`/`<thinking>`/`<thought>`/`<antthinking>` tags and their content (stateful across chunks).
    - Handles `<final>` tags: when `enforceFinalTag` is true, only content inside `<final>` blocks is returned; everything outside is suppressed. When false, tags are stripped but content passes through.

31. **Duplicate suppression** (`pi-embedded-subscribe.ts:359-400`): Block chunks are checked against:
    - Previously sent messaging tool texts (committed only, not pending)
    - Previously emitted assistant texts (normalized comparison)
    This prevents the agent from echoing messages it already sent via tools.

---

## Configuration

Key configuration paths in `config.json5`:

| Config Path | Effect |
|---|---|
| `agents.defaults.model.fallbacks` | Array of fallback models for `FailoverError` |
| `agents.defaults.heartbeat.prompt` | Heartbeat prompt for default agent |
| `agents.defaults.contextPruning.mode` | `"cache-ttl"` enables timestamp tracking |
| Context window limits | Hard min + warn-below thresholds in `context-window-guard.ts` |
| Auth profiles | In auth profile store (agentDir), ordered by config |

---

## Key Design Decisions

### 1. Double Lane Queuing
Requests are serialized at two levels: per-session (prevents concurrent prompts corrupting transcript) and globally (rate-limits total LLM calls). The session lane uses the session key/ID; the global lane defaults to `CommandLane.Main`.

### 2. Auth Profile Rotation
On rate limits or auth errors, the system rotates through configured auth profiles before giving up. Profiles in cooldown are skipped. This enables multi-account setups for throughput.

### 3. Thinking Level Fallback
If a model rejects a thinking level (e.g., `"high"` not supported), the system tries lower levels automatically before failing.

### 4. Delegation to pi-runner
The actual LLM call + tool execution loop lives entirely inside `activeSession.prompt()` from `@mariozechner/pi-coding-agent`. OpenClaw doesn't implement the tool-call loop itself; it configures the session and subscribes to events.

### 5. Streaming Model
OpenClaw uses a two-tier streaming model:
- **Partial replies** (`onPartialReply`): Raw incremental text for typing indicators
- **Block replies** (`onBlockReply`): Complete, cleaned text blocks ready for delivery to messaging channels

Block replies are chunked via `EmbeddedBlockChunker` and gated by `blockReplyBreak` mode (`"text_end"` vs `"message_end"`).

### 6. Active Run Registry
Each running session is registered globally (`ACTIVE_EMBEDDED_RUNS` in `runs.ts`). This allows:
- `steer()` - inject additional messages mid-run
- `abort()` - cancel from external code
- `isStreaming()` / `isCompacting()` - status checks
- `waitForEmbeddedPiRunEnd()` - synchronization

### 7. Anthropic Refusal Magic Scrubbing
The string `ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL` is scrubbed from user prompts to prevent poisoning session transcripts with Anthropic's automated refusal test triggers.

---

## Interaction with Other Topics

| Topic | Interaction |
|---|---|
| **Tool System** (Topic 2) | `createOpenClawCodingTools()` is called at `attempt.ts:203-235` to build the tool set passed to `createAgentSession()`. |
| **Tool Policy** (Topic 3) | Tool names are normalized via `normalizeToolName()` in event handlers; policy is applied inside the tools themselves. |
| **Thinking Levels** (Topic 4) | `thinkLevel` is passed through and mapped via `mapThinkingLevel()`. Fallback logic in the retry loop uses `pickFallbackThinkingLevel()`. |
| **Subagent Spawning** (Topic 5) | Subagent sessions use the same `runEmbeddedPiAgent()` entry point with different `sessionKey` prefixes. `isSubagentSessionKey()` check at `attempt.ts:328` switches to `"minimal"` prompt mode. |
| **Model Selection** (Topic 6) | `resolveModel()` at `run.ts:102-107` and `resolveDefaultModelForAgent()` at `attempt.ts:305-308` bridge into the model selection system. |
| **Sessions** (Topic 7) | Session file locking (`acquireSessionWriteLock` at `attempt.ts:387`), `SessionManager.open()` at `attempt.ts:406`, history management throughout. |
| **System Prompt** (Topic 8) | `buildEmbeddedSystemPrompt()` at `attempt.ts:337-362` and `createSystemPromptOverride()` at `attempt.ts:385` construct the full system prompt. |
| **Skills** (Topic 9) | Skills are loaded at `attempt.ts:162-181` and injected into the system prompt. `skillsSnapshot` can be passed from the caller. |

---

## Sequence Diagram (Simplified)

```
Caller
  |
  v
runEmbeddedPiAgent()
  |-- resolveSessionLane() + resolveGlobalLane()
  |-- enqueueSession(enqueueGlobal(async () => {
  |     |-- resolveModel()
  |     |-- resolveContextWindowInfo() + evaluateContextWindowGuard()
  |     |-- resolveAuthProfileOrder() + applyApiKeyInfo()
  |     |
  |     |-- while(true) {  // RETRY LOOP
  |     |     |
  |     |     +-- runEmbeddedAttempt()
  |     |     |     |-- resolveSandboxContext()
  |     |     |     |-- loadWorkspaceSkillEntries() + resolveSkillsPromptForRun()
  |     |     |     |-- resolveBootstrapContextForRun()
  |     |     |     |-- createOpenClawCodingTools()
  |     |     |     |-- buildEmbeddedSystemPrompt()
  |     |     |     |-- acquireSessionWriteLock()
  |     |     |     |-- SessionManager.open()
  |     |     |     |-- createAgentSession()  <-- pi-runner
  |     |     |     |-- subscribeEmbeddedPiSession()
  |     |     |     |     |-- subscribe(eventHandler)
  |     |     |     |     |     handles: message_start/update/end
  |     |     |     |     |     handles: tool_execution_start/update/end
  |     |     |     |     |     handles: agent_start/end
  |     |     |     |     |     handles: auto_compaction_start/end
  |     |     |     |
  |     |     |     |-- activeSession.prompt(effectivePrompt)
  |     |     |     |     |
  |     |     |     |     |  [pi-runner internal loop]
  |     |     |     |     |  LLM call -> tool calls -> LLM call -> ...
  |     |     |     |     |  Events emitted via subscription
  |     |     |     |
  |     |     |     +-- return EmbeddedRunAttemptResult
  |     |     |
  |     |     |-- [error handling: overflow, auth, thinking fallback]
  |     |     |-- [on error: continue (retry) or break]
  |     |     +-- [on success: break]
  |     |
  |     +-- buildEmbeddedRunPayloads()
  |     +-- return EmbeddedPiRunResult
  |
  v
Caller receives result
```
