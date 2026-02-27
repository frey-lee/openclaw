# Migration Checklist: Memory Subsystem

Source design doc: `openclaw-agent/design_docs/memory.md`
Master matrix ref: `00-cross-cutting-decisions.md` Category 15 (Memory), Category 6 (CLI & UI), Category 18 (Config)

---

## Migrate (Copy Verbatim -- INACTIVE)

These files are copied from openclaw to openclaw-agent with no functional changes. The entire memory system is present for reference but **not executed** -- disabled by config (`memorySearch.enabled: false`). All are marked INACTIVE in the master matrix.

### Core (`src/memory/`)

- [ ] `src/memory/manager.ts` -- Central `MemoryIndexManager` class: search, sync, status, warm
- [ ] `src/memory/index.ts` -- Module barrel exports
- [ ] `src/memory/search-manager.ts` -- Lazy factory for `MemoryIndexManager`
- [ ] `src/memory/internal.ts` -- File discovery, chunking, hashing, path validation
- [ ] `src/memory/memory-schema.ts` -- SQLite schema creation (5 tables)
- [ ] `src/memory/sync-memory-files.ts` -- File discovery -> hash check -> index pipeline
- [ ] `src/memory/manager-search.ts` -- Vector and keyword search implementations
- [ ] `src/memory/hybrid.ts` -- Hybrid result merging (BM25 + cosine)
- [ ] `src/memory/manager-cache-key.ts` -- Cache key generation
- [ ] `src/memory/sqlite.ts` -- SQLite binding
- [ ] `src/memory/sqlite-vec.ts` -- Vector extension loader
- [ ] `src/memory/session-files.ts` -- Session transcript indexing utilities
- [ ] `src/memory/provider-key.ts` -- Embedding provider API key resolution
- [ ] `src/memory/headers-fingerprint.ts` -- API header fingerprinting

### Embedding Providers (`src/memory/`)

- [ ] `src/memory/embeddings.ts` -- Provider factory (OpenAI / Gemini / local)
- [ ] `src/memory/embeddings-openai.ts` -- OpenAI embedding client
- [ ] `src/memory/embeddings-gemini.ts` -- Gemini embedding client
- [ ] `src/memory/batch-openai.ts` -- OpenAI batch API orchestration
- [ ] `src/memory/batch-gemini.ts` -- Gemini batch API orchestration
- [ ] `src/memory/node-llama.ts` -- Local model loader (node-llama-cpp)

### Agent Integration (`src/agents/`)

- [ ] `src/agents/tools/memory-tool.ts` -- `memory_search` and `memory_get` tool definitions
- [ ] `src/agents/memory-search.ts` -- Config resolution (`resolveMemorySearchConfig`)

### Other

- [ ] `src/hooks/bundled/session-memory/handler.ts` -- Session-memory hook handler
- [ ] `src/auto-reply/reply/memory-flush.ts` -- Pre-compaction memory flush

### Test files

- [ ] `src/memory/embeddings.test.ts`
- [ ] `src/memory/hybrid.test.ts`
- [ ] `src/memory/index.test.ts`
- [ ] `src/memory/internal.test.ts`
- [ ] `src/memory/manager.async-search.test.ts`
- [ ] `src/memory/manager.atomic-reindex.test.ts`
- [ ] `src/memory/manager.batch.test.ts`
- [ ] `src/memory/manager.embedding-batches.test.ts`
- [ ] `src/memory/manager.sync-errors-do-not-crash.test.ts`
- [ ] `src/memory/manager.vector-dedupe.test.ts`
- [ ] `src/agents/memory-search.test.ts`
- [ ] `src/agents/tools/memory-tool.does-not-crash-on-errors.test.ts`
- [ ] `src/hooks/bundled/session-memory/handler.test.ts`
- [ ] `src/auto-reply/reply/memory-flush.test.ts`
- [ ] `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.increments-compaction-count-flush-compaction-completes.test.ts`
- [ ] `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.runs-memory-flush-turn-updates-session-metadata.test.ts`
- [ ] `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.skips-memory-flush-cli-providers.test.ts`
- [ ] `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.skips-memory-flush-sandbox-workspace-is-read.test.ts`
- [ ] `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.uses-configured-prompts-memory-flush-runs.test.ts`

---

## Strip (Remove During Phase 5)

Nothing -- keep everything for reference. The design doc explicitly states: "Nothing -- keep everything for reference" under the Strip section. All memory code is inactive by config, not selectively stripped.

---

## Skip (Do Not Copy)

These files are explicitly excluded from the migration manifest:

- `src/cli/memory-cli.ts` -- CLI commands (status, index, search). Falls under CLI/UI skip (master matrix Category 6: "CLI memory commands = SKIP").

---

## Placeholder (Stub Implementations Needed)

None -- the system is disabled by config (`memorySearch.enabled: false`), not stubbed. When disabled, memory tools are not registered, the memory section is omitted from the system prompt, and all indexing/sync operations are skipped. No stub implementations are required.

---

## Dependencies

Cross-references to other subsystem checklists:

| Subsystem | Dependency | Direction |
|---|---|---|
| tools | `memory_search` and `memory_get` are in `group:memory`, included in `coding` profile. Tool definitions kept (inactive). | memory -> tools |
| system-prompt | `buildMemorySection()` adds memory guidance to system prompt when memory tools are in the tool list. | memory -> system-prompt |
| subagents | Memory tools (`memory_search`, `memory_get`) on the hard deny list in `resolveSubagentToolPolicy`. Already migrated. | memory -> subagents |
| bootstrap | `MEMORY.md` loaded as a bootstrap file into every prompt (always present if file exists). Already migrated in `workspace.ts`. | memory -> bootstrap |
| hooks | `session-memory` bundled hook handler fires on `command:new` to auto-save session context. Copied as inactive code. | memory -> hooks |
| config | `memorySearch` config block in `OpenClawConfig` / per-agent overrides. Memory search config types marked KEEP in master matrix (Category 18). | memory -> config |

---

## Notes

- All memory code is **INACTIVE** -- present for reference but not executed. The master matrix (Category 15) marks the core module, embedding providers, SQLite + sqlite-vec, session-memory hook handler, and memory flush as INACTIVE.
- Requires `memorySearch.enabled: false` in config to prevent tools from being registered and the indexing pipeline from running.
- May need stub type declarations for npm dependencies that are not installed in openclaw-agent: `better-sqlite3`, `sqlite-vec`, `node-llama-cpp`. These are build-time dependencies of the SQLite and local embedding code. If TypeScript compilation fails on imports, add minimal `.d.ts` stubs.
- `MEMORY.md` bootstrap loading is already migrated (`workspace.ts`).
- Tool policy definitions for `group:memory` are already migrated (`tool-policy.ts`, `pi-tools.policy.ts`).
- Subagent deny list for memory tools is already migrated.
- The design doc identifies a potential future enhancement: keyword-only mode (~4 changes across 3 files) to allow FTS5/BM25 search without an embedding provider. This is not required for the current migration but is documented for later activation.
