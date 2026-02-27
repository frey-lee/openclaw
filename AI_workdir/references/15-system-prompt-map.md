# OpenClaw System Prompt Reference Map

## 1. System Prompt Assembly - Main Builder

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/system-prompt.ts` | 591 | `buildAgentSystemPrompt()` (129-554), `buildRuntimeLine()` (556-591), `PromptMode` type (13) | Core system prompt builder. Orchestrates all sections. Supports three prompt modes: "full" (main agent), "minimal" (subagents), "none" (basic only). |

## 2. System Prompt Section Builders

All in `agents/system-prompt.ts`:

| Function | Lines | Description |
|----------|-------|-------------|
| `buildSkillsSection()` | 15-33 | Skills prompt injection |
| `buildMemorySection()` | 35-45 | Memory recall section |
| `buildUserIdentitySection()` | 47-50 | User identity (owner numbers) |
| `buildTimeSection()` | 52-55 | Current date/time |
| `buildReplyTagsSection()` | 57-68 | Reply tag formatting |
| `buildMessagingSection()` | 70-104 | Messaging tools and inline buttons |
| `buildVoiceSection()` | 106-111 | TTS hints |
| `buildDocsSection()` | 113-127 | Documentation path |

## 3. System Prompt Parameters & Types

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/system-prompt-params.ts` | 105 | `buildSystemPromptParams()` (34-59), `SystemPromptRuntimeParams` type (27-32), `RuntimeInfoInput` type (12-25), `resolveRepoRoot()` (61-88), `findGitRoot()` (90-105) | Builder that creates runtime system prompt params from config and environment. Resolves user timezone, time format, runtime info. |

## 4. System Prompt Report/Analytics

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/system-prompt-report.ts` | 149 | `buildSystemPromptReport()` (90-149), `buildInjectedWorkspaceFiles()` (33-53), `buildToolsEntries()` (55-79), `extractToolListText()` (81-88), `parseSkillBlocks()` (19-31), `extractBetween()` (7-17) | Generates diagnostic report about system prompt: char counts, injected files metadata, tool entries, skill blocks. |

## 5. Pi-Embedded System Prompt Assembly

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/pi-embedded-runner/system-prompt.ts` | 81 | `buildEmbeddedSystemPrompt()` (9-74), `createSystemPromptOverride()` (76-81) | Wrapper that adapts `buildAgentSystemPrompt()` for Pi-embedded agent. Creates system prompt override function for agent session. |

## 6. Bootstrap Context File Injection

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/bootstrap-files.ts` | 58 | `resolveBootstrapFilesForRun()` (19-39), `resolveBootstrapContextForRun()` (41-58), `makeBootstrapWarn()` (11-17) | Orchestrates loading and filtering of workspace bootstrap files. Returns both raw bootstrap files and injected context files (with truncation). |

## 7. Supporting Modules

| File | Lines | Key Exports | Description |
|------|-------|-------------|-------------|
| `agents/tool-summaries.ts` | 11 | `buildToolSummaryMap()` (3-11) | Maps AgentTool instances to summary strings for system prompt tool documentation |
| `agents/date-time.ts` | 164 | `formatUserTime()` (132-164), `resolveUserTimezone()` (8-20), `resolveUserTimeFormat()` (22-27) | Resolves user timezone and time format for "Current Date & Time" section |
| `auto-reply/tokens.ts` | 18 | `HEARTBEAT_TOKEN` (1), `SILENT_REPLY_TOKEN` (2), `isSilentReplyText()` (8-18) | Special reply tokens for "Silent Replies" and "Heartbeats" sections |
| `auto-reply/thinking.ts` | 148 | `ThinkLevel` type (1), `ReasoningLevel` type (6), `normalizeThinkLevel()` (34-48), `normalizeReasoningLevel()` (140-148) | Thinking/reasoning settings for "Reasoning Format" section |
| `agents/pi-embedded-helpers/types.ts` | 3 | `EmbeddedContextFile` type (1), `FailoverReason` type (3) | Type for context files injected into system prompt |
| `config/sessions/types.ts` | 167 | `SessionSystemPromptReport` type (123-163) | Stores analytics about generated system prompt per session |

## 8. System Prompt Flow

```
runEmbeddedAttempt() [attempt.ts:133]
  |-> resolveBootstrapContextForRun() [bootstrap-files.ts:41]
  |     |-> loadWorkspaceBootstrapFiles() [workspace.ts:224]
  |     |-> filterBootstrapFilesForSession() [workspace.ts:282]
  |     |-> buildBootstrapContextFiles() [pi-embedded-helpers/bootstrap.ts:150]
  |
  |-> buildSystemPromptParams() [system-prompt-params.ts:34]
  |     |-> resolveUserTimezone()
  |     |-> resolveUserTimeFormat()
  |     |-> resolveRepoRoot()
  |
  |-> buildEmbeddedSystemPrompt() [pi-embedded-runner/system-prompt.ts:9]
  |     |-> buildAgentSystemPrompt() [system-prompt.ts:129]
  |           |-> buildSkillsSection() [15]
  |           |-> buildMemorySection() [35]
  |           |-> buildUserIdentitySection() [47]
  |           |-> buildTimeSection() [52]
  |           |-> buildReplyTagsSection() [57]
  |           |-> buildMessagingSection() [70]
  |           |-> buildVoiceSection() [106]
  |           |-> buildDocsSection() [113]
  |           |-> buildRuntimeLine() [556]
  |
  |-> buildSystemPromptReport() [system-prompt-report.ts:90]
  |-> createSystemPromptOverride() [pi-embedded-runner/system-prompt.ts:76]
```

## 9. Prompt Mode Variations

### Mode: "full" (Main Agent)
- **When**: Default mode, non-subagent sessions
- **Includes**: All sections — Tooling, Skills, Memory, Model Aliases, Workspace, Documentation, User Identity, Time, Reply Tags, Messaging, Voice, Self-Update, Silent Replies, Heartbeats, Reactions, Reasoning Format, Runtime, Project Context

### Mode: "minimal" (Subagent)
- **When**: `isSubagentSessionKey(sessionKey) === true`
- **Includes**: Tooling, OpenClaw CLI Reference, Workspace, Runtime, Subagent Context
- **Excludes**: User Identity, Time, Skills, Memory, Docs, Reply Tags, Messaging, Voice, Silent Replies, Heartbeats

### Mode: "none" (Basic Only)
- **When**: Explicitly set
- **Includes**: Single line: `"You are a personal assistant running inside OpenClaw."`
- **Excludes**: Everything else

## 10. Key Parameters to System Prompt Builder

```typescript
buildAgentSystemPrompt({
  workspaceDir: string;
  ownerNumbers?: string[];
  defaultThinkLevel?: ThinkLevel;
  reasoningLevel?: ReasoningLevel;
  reasoningTagHint?: boolean;
  toolNames?: string[];
  toolSummaries?: Record<string, string>;
  userTimezone?: string;
  userTime?: string;
  userTimeFormat?: ResolvedTimeFormat;
  contextFiles?: EmbeddedContextFile[];
  skillsPrompt?: string;
  heartbeatPrompt?: string;
  docsPath?: string;
  workspaceNotes?: string[];
  ttsHint?: string;
  extraSystemPrompt?: string;
  modelAliasLines?: string[];
  runtimeInfo?: { agentId, host, os, arch, node, model, defaultModel, channel, capabilities, repoRoot };
  messageToolHints?: string[];
  reactionGuidance?: { level, channel };
  sandboxInfo?: { enabled, workspaceDir, workspaceAccess, ... };
  promptMode?: "full" | "minimal" | "none";
})
```

## 11. Key Constants

| Constant | Value | Usage |
|----------|-------|-------|
| `DEFAULT_BOOTSTRAP_MAX_CHARS` | 20,000 | Max chars for each bootstrap file before truncation |
| `BOOTSTRAP_HEAD_RATIO` | 0.7 | Keep 70% from start of truncated files |
| `BOOTSTRAP_TAIL_RATIO` | 0.2 | Keep 20% from end of truncated files |
| `SILENT_REPLY_TOKEN` | "NO_REPLY" | Special token for silent replies section |
| `HEARTBEAT_TOKEN` | "HEARTBEAT_OK" | Special token for heartbeat acknowledgment |
| `SUBAGENT_BOOTSTRAP_ALLOWLIST` | [AGENTS.md, TOOLS.md] | Files allowed in subagent bootstrap |

## Migration Status (openclaw vs openclaw-agent)

### Files Present in BOTH Repositories
- `agents/system-prompt-params.ts` (migrated)
- `agents/system-prompt-report.ts` (migrated)
- `agents/pi-embedded-runner/system-prompt.ts` (migrated)
- `auto-reply/thinking.ts` (migrated)

### Files ONLY in openclaw (NOT Migrated)
- `agents/system-prompt.ts` (core builder — 591 lines, the main system prompt assembly logic)
- `agents/tool-summaries.ts` (tool summary map builder)
- `agents/date-time.ts` (timezone/time format resolution)
- `auto-reply/tokens.ts` (HEARTBEAT_TOKEN, SILENT_REPLY_TOKEN)
- `config/sessions/types.ts` (SessionSystemPromptReport type — partial, session config not migrated)

### Note
The core `system-prompt.ts` builder (591 lines) is the main missing piece. The pi-embedded-runner wrapper exists but calls a stub or simplified version. The bootstrap injection chain is now fully migrated.
