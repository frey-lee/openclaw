# OpenClaw Session Management Reference Map

## 1. Session Creation and Initialization

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `agents/session-slug.ts` | 133 | `createSessionSlug()` (113-133) | Generates unique human-readable session slugs using adjective-noun combinations |
| `agents/pi-embedded-runner/session-manager-init.ts` | 53 | `prepareSessionManagerForRun()` (16-53) | Initializes and prepares SessionManager for a run; handles first user message persistence quirks |
| `agents/pi-embedded-runner/session-manager-cache.ts` | 60 | `trackSessionManagerAccess()` (25-32), `prewarmSessionFile()` (43-60) | Caches session file handles with TTL; prewarns OS page cache |

## 2. Session Keys and Routing

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `routing/session-key.ts` | 217 | `buildAgentMainSessionKey()` (101-108), `buildAgentPeerSessionKey()` (110-155), `resolveThreadSessionKeys()` (201-217), `normalizeAgentId()` (57-71), `normalizeMainKey()` (24-27), `normalizeAccountId()` (87-99) | Core session key builder and normalizer; handles main/peer/thread session formats |
| `sessions/session-key-utils.ts` | 53 | `parseAgentSessionKey()` (6-18), `isSubagentSessionKey()` (20-26), `isAcpSessionKey()` (28-35), `resolveThreadParentSessionKey()` (39-53) | Parses and identifies session key types (main, subagent, ACP, threaded) |
| `config/sessions/session-key.ts` | 37 | `deriveSessionKey()` (12-18), `resolveSessionKey()` (24-37) | Derives session bucket from message context; resolves canonical session key |
| `sessions/session-label.ts` | 18 | `parseSessionLabel()` (5-18), `SESSION_LABEL_MAX_LENGTH` (1) | Validates and parses session display labels (max 64 chars) |

## 3. Session Persistence and Storage

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `config/sessions/store.ts` | 440 | `loadSessionStore()` (99-163), `saveSessionStore()` (241-248), `updateSessionStore()` (250-261), `recordSessionMetaFromInbound()` (358-381), `updateLastRoute()` (383-440), `clearSessionStoreCacheForTest()` (91-93) | Session store cache and persistence; handles TTL-based caching and lock-based writes |
| `config/sessions/transcript.ts` | 133 | `appendAssistantMessageToSessionTranscript()` (70-133), `ensureSessionHeader()` (54-68) | Appends messages to session JSONL transcript; ensures session header exists |
| `config/sessions/paths.ts` | 73 | `resolveSessionTranscriptsDir()` (17-22), `resolveDefaultSessionStorePath()` (32-34), `resolveSessionTranscriptPath()` (36-50), `resolveSessionFilePath()` (52-59), `resolveStorePath()` (61-73) | Resolves paths for session files and transcripts; supports agent-specific and template-based paths |
| `config/sessions/types.ts` | 167 | `SessionEntry` type (26-97), `mergeSessionEntry()` (99-107), `SessionOrigin` type (15-24) | Session entry structure; includes session ID, metadata, delivery context, token usage |
| `memory/session-files.ts` | 106 | `listSessionFilesForAgent()` (19-31), `buildSessionEntry()` (62-106), `extractSessionText()` (44-60) | Lists and indexes session JSONL files for memory search |
| `sessions/transcript-events.ts` | 23 | `onSessionTranscriptUpdate()` (9-14), `emitSessionTranscriptUpdate()` (16-23) | Event listener for session transcript updates |

## 4. Session Metadata and Configuration

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `config/sessions/metadata.ts` | 122 | `deriveSessionMetaPatch()` (107-122), `deriveGroupSessionPatch()` (60-105), `deriveSessionOrigin()` (27-53) | Derives session metadata from message context; handles group/channel metadata |
| `config/sessions/main-session.ts` | 69 | `resolveMainSessionKey()` (11-22), `resolveMainSessionKeyFromConfig()` (24-26), `resolveAgentMainSessionKey()` (30-36), `canonicalizeMainSessionAlias()` (47-69) | Resolves main session key; canonicalizes aliases to single representation |
| `config/sessions/group.ts` | 100 | `resolveGroupSessionKey()` (53-100), `buildGroupDisplayName()` (22-51) | Identifies group sessions; builds display names from group metadata |
| `config/sessions/reset.ts` | 142 | `isThreadSessionKey()` (26-30), `resolveSessionResetType()` (32-42), `evaluateSessionFreshness()` (113-133), `resolveSessionResetPolicy()` (68-98) | Session reset policy and freshness evaluation; daily/idle reset modes |

## 5. Session Locking and Concurrency Control

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `agents/session-write-lock.ts` | 188 | `acquireSessionWriteLock()` (102-182) | Acquires exclusive file lock for session writes; handles stale lock eviction and process monitoring |

## 6. Session Manager and Runner

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `agents/pi-embedded-runner/history.ts` | 85 | `limitHistoryTurns()` (16-35), `getDmHistoryLimitFromSessionKey()` (41-85) | Limits conversation history by turn count; resolves per-DM and provider history limits |
| `agents/pi-embedded-runner/compact.ts` | 488 | `compactEmbeddedPiSessionDirect()` (109-471), `compactEmbeddedPiSession()` (478-488), `CompactEmbeddedPiSessionParams` type (73-103) | Core session compaction logic; manages context window and transcript cleanup |

## 7. Session-Scoped Tool Result Guards

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `agents/session-tool-result-guard.ts` | 144 | `installSessionToolResultGuard()` (36-144) | Guarded append to session; ensures tool result/call pairing; synthesizes missing tool results |
| `agents/session-tool-result-guard-wrapper.ts` | 54 | `guardSessionManager()` (15-54), `GuardedSessionManager` type (6-9) | Wraps SessionManager with guard once; exposes flush method |
| `agents/session-transcript-repair.ts` | 206 | `repairToolUseResultPairing()` (71-206), `sanitizeToolUseResultPairing()` (59-61), `makeMissingToolResult()` (38-55) | Repairs malformed transcripts; moves orphaned tool results; inserts synthetic error results |

## 8. Gateway Session Utilities

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `gateway/session-utils.ts` | 644 | `loadSessionEntry()` (157-166), `classifySessionKey()` (168-178), `listSessionsFromStore()` (488-644), `resolveSessionStoreKey()` (308-334), `listAgentsForGateway()` (242-296), `loadCombinedSessionStoreForGateway()` (409-450) | Gateway session listing and filtering; cross-agent session aggregation |
| `gateway/session-utils.fs.ts` | 393 | `readFirstUserMessageFromTranscript()`, `readLastMessagePreviewFromTranscript()`, `readSessionMessages()`, `readSessionPreviewItemsFromTranscript()` | Reads session transcript files for preview and search |
| `gateway/session-utils.types.ts` | 87 | `GatewaySessionRow`, `GatewaySessionsDefaults`, `SessionsListResult` types | Type definitions for gateway session responses |

## 9. Agent Scope and Session Resolution

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `agents/agent-scope.ts` | 155 | `resolveSessionAgentIds()` (67-77), `resolveSessionAgentId()` (79-84), `resolveDefaultAgentId()` (55-65), `resolveAgentWorkspaceDir()` (136-147) | Resolves agent ID from session key; determines workspace and agent configuration |

## 10. Config Barrel Export

| File Path | Lines | Key Exports | Description |
|-----------|-------|-------------|-------------|
| `config/sessions.ts` | 9 | Re-exports from `./sessions/*` | Barrel export for all session-related config modules |

---

## Session File Format

Sessions are persisted as JSONL (JSON Lines) files with the following structure:

1. **Header Entry** (one per file):
   ```json
   {"type": "session", "version": N, "id": "uuid", "timestamp": "ISO-8601", "cwd": "path"}
   ```

2. **Message Entries** (one per line):
   ```json
   {"type": "message", "message": {"role": "user|assistant|toolResult", "content": [...], "timestamp": N}}
   ```

---

## Session Key Formats

| Format | Example | Description |
|--------|---------|-------------|
| **Main** | `agent:main:main` | Default session for main agent |
| **Per-Agent Main** | `agent:claude-dev:main` | Main session for specific agent |
| **Per-Peer DM** | `agent:main:telegram:dm:alice` | DM session with peer per-channel-peer scope |
| **Group** | `agent:main:telegram:group:group123` | Group chat session |
| **Channel** | `agent:main:discord:channel:general` | Channel chat session |
| **Thread** | `agent:main:telegram:dm:alice:thread:456` | Thread within a DM session |
| **Subagent** | `agent:main:subagent:worker-pool:worker-1` | Subagent spawned from main |

---

## Session Store Structure

The session store is a JSON file at `~/.openclaw/state/agents/{agentId}/sessions/sessions.json`:

```typescript
{
  "agent:main:main": {
    sessionId: "uuid",
    updatedAt: 1704067200000,
    sessionFile?: "path/to/uuid.jsonl",
    label?: "My Session",
    displayName?: "telegram:alice",
    channel?: "telegram",
    chatType?: "dm" | "group" | "channel",
    groupId?: "group123",
    subject?: "Group Name",
    thinkingLevel?: "extended",
    reasoningLevel?: "enabled",
    modelOverride?: "claude-opus-4-1",
    inputTokens?: 50000,
    outputTokens?: 30000,
    totalTokens?: 80000,
    compactionCount?: 3,
    spawnedBy?: "agent:main:main",
    origin?: { provider, surface, from, to, accountId, threadId },
    deliveryContext?: { channel, to, accountId, threadId }
  }
}
```

---

## Migration Status (openclaw vs openclaw-agent)

### Files Present in BOTH Repositories
- `agents/session-slug.ts` (full migration)
- `agents/session-write-lock.ts` (full migration)
- `agents/session-tool-result-guard-wrapper.ts` (full migration)
- `agents/pi-embedded-runner/session-manager-cache.ts` (full migration)
- `agents/pi-embedded-runner/session-manager-init.ts` (full migration)
- `routing/session-key.ts` (full migration)
- `config/sessions.ts` (full migration)
- `agents/tools/session-status-tool.ts` (full migration)
- `agents/tools/sessions-history-tool.ts` (full migration)
- `agents/tools/sessions-list-tool.ts` (full migration)
- `agents/tools/sessions-send-tool.ts` (full migration)
- `agents/tools/sessions-spawn-tool.ts` (full migration)

### Files ONLY in openclaw (NOT Migrated)
- `agents/session-tool-result-guard.ts` (core tool result guard logic)
- `agents/session-transcript-repair.ts` (transcript repair logic)
- `agents/pi-embedded-runner/history.ts` (DM history limits)
- `agents/pi-embedded-runner/compact.ts` (session compaction engine)
- `sessions/session-key-utils.ts` (session key parsing utilities)
- `sessions/session-label.ts` (session label validation)
- `sessions/transcript-events.ts` (transcript update events)
- `config/sessions/*.ts` (all session config modules except barrel)
- `gateway/session-utils*.ts` (gateway session utilities)
- `memory/session-files.ts` (session file indexing)
- `agents/agent-scope.ts` (agent scope resolution)
