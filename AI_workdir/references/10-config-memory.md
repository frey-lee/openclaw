# Configuration & Memory Systems

## Configuration System
**Location:** `src/config/` (16,717 lines)

### Configuration Paths
- State Directory: `~/.openclaw` (or `$OPENCLAW_STATE_DIR`)
- Config File: `~/.openclaw/openclaw.json` (JSON5)
- Legacy: `~/.clawdbot`, `~/.moltbot`, `~/.moldbot`

### Loading Pipeline
1. Read raw JSON5 file
2. Resolve `$include` directives (max depth: 10)
3. Substitute `${ENV_VAR}` patterns
4. Normalize paths (resolve `..`, `~`)
5. Apply built-in defaults
6. Apply runtime overrides
7. Validate against Zod schema
8. Post-validation transformations

### Include System
```json5
{
  "$include": "./base.json5",
  "$include": ["./a.json5", "./b.json5"]
}
```

### Validation Layers
1. Legacy config detection
2. Zod schema validation
3. Duplicate agent directory detection
4. Identity avatar path validation
5. Plugin validation
6. Custom issue reporting

### Model Aliases (Defaults)
- `opus` → `anthropic/claude-opus-4-5`
- `sonnet` → `anthropic/claude-sonnet-4-5`
- `gpt` → `openai/gpt-5.2`
- `gemini` → `google/gemini-3-pro-preview`

## Session Management
**Location:** `src/config/sessions/`

### Session Entry Structure
```typescript
{
  sessionId, updatedAt, spawnedBy?,
  chatType, channel, groupId, subject,
  deliveryContext, lastChannel, lastTo,
  modelProvider, model, modelOverride,
  authProfileOverride,
  reasoningLevel, thinkingLevel,
  queueMode, queueDebounceMs,
  inputTokens, outputTokens, contextTokens,
  compactionCount, memoryFlushAt
}
```

### Session Scopes
- `per-sender` - Separate per sender (default)
- `global` - Single shared session

### Reset Modes
- `daily` - Reset at specified hour
- `idle` - Reset after idle minutes

## Memory Search System
**Location:** `src/memory/` (6,801 lines)

### Architecture
```
File Discovery → Chunking → Embedding → SQLite Storage
  ↓
Hybrid Search (Vector + Keyword) → Results
```

### Memory Sources
1. `MEMORY.md` or `memory.md` (workspace root)
2. `memory/` directory (recursive)
3. Extra configured paths
4. Session transcripts (experimental)

### Embedding Providers
| Provider | Model | Type |
|----------|-------|------|
| OpenAI | text-embedding-3-small | Remote |
| Gemini | gemini-embedding-001 | Remote |
| Local | embeddinggemma-300M | Offline |

### Configuration
```json5
{
  memory: {
    enabled: true,
    provider: "openai",
    sources: ["memory", "sessions"],
    chunking: { tokens: 400, overlap: 80 },
    query: {
      maxResults: 6,
      minScore: 0.35,
      hybrid: { vectorWeight: 0.7, textWeight: 0.3 }
    }
  }
}
```

### Hybrid Search
- **Vector**: Cosine similarity (70% weight)
- **Keyword**: BM25 scoring (30% weight)
- **Threshold**: score >= 0.35

### Database Schema (SQLite)
- `files` - Tracked files with hashes
- `chunks` - Text chunks with embeddings
- `embedding_cache` - Avoid re-embedding
- `chunks_fts` - FTS5 keyword index
- `chunks_vec` - Vector index (sqlite-vec)

### Key Constants
- Chunk size: 400 tokens (~1600 chars)
- Chunk overlap: 80 tokens
- Watch debounce: 1500ms
- Max results: 6
- Min score: 0.35
- Session delta: 100KB / 50 messages
