# Per-Doc Change Assessment

For each of the 11 design docs, assesses consistency with the master matrix (`00-cross-cutting-decisions.md`), flags any needed changes, and estimates migration complexity.

---

## 1. sandbox.md

### Consistency with Master Matrix

**Fully consistent.** All keep/strip/skip decisions align:
- Types, config, path validation, runtime status, tool policy, constants → KEEP (matches Category 7)
- Docker container lifecycle, browser provisioning, pruning → SKIP (matches Category 7)
- Sandbox resolver → PLACEHOLDER (matches Category 7)

### Changes Needed to Design Doc

**None.** The doc correctly identifies what's migrated, what's stubbed, and what's skipped. The "Container Lifecycle (Not Migrated)" section explicitly lists all skipped files.

### Migration Complexity: **Small**

Most files are already migrated per the doc's "Migration Status" table. The fresh copy will bring these back verbatim. Only the sandbox resolver stub needs to be maintained as a placeholder.

---

## 2. skills.md

### Consistency with Master Matrix

**Fully consistent.** All keep/strip/skip decisions align:
- Loading, filtering, env overrides, frontmatter, slash commands → KEEP (matches Category 8)
- Plugin skills → PLACEHOLDER (matches Category 5/8)
- Hot-reload, CLI, status → SKIP (matches Category 8)

### Changes Needed to Design Doc

**None.** The "Not migrated (OpenClaw-only)" table explicitly lists stripped items and reasons.

### Migration Complexity: **Small**

Well-scoped subsystem. ~13 files to copy, most are self-contained. Main dependency is on `markdown/frontmatter.ts` (also kept).

---

## 3. bootstrap.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- 8 file types, subagent filtering, truncation, workspace init → KEEP (matches Category 9)
- Bootstrap hooks → KEEP (real impl via internal hooks) (matches Categories 4/9)
- Git init → STRIP (matches Category 9)
- `stripThoughtSignatures`, `sanitizeGoogleTurnOrdering` → STRIP (correctly called out as unrelated)

### Changes Needed to Design Doc

**None.** The doc correctly distinguishes migrated vs not-migrated items.

### Migration Complexity: **Small**

4 core files. Already migrated in previous pass. Fresh copy will reset to verbatim, then Phase 5 strips git init and unrelated sanitization functions.

---

## 4. tools.md

### Consistency with Master Matrix

**Fully consistent.** The tool keep/exclude table in the doc matches Category 10 exactly:
- File, exec, process, session, gateway, agents_list, image, memory tools → KEEP
- Web, messaging, browser, canvas, nodes, cron → STRIP

Tool creation pipeline (6 stages), policy filtering (9-layer), groups, profiles, splitting, schema normalization, client tools → all KEEP per Category 10.

### Changes Needed to Design Doc

**None.** The "Include?" column in the Complete Tool List provides clear per-tool decisions.

### Migration Complexity: **Large**

The tool system spans many files:
- `pi-tools.ts` (main factory) — needs stripping of excluded tool creation
- `openclaw-tools.ts` — needs stripping of message, tts, web, browser, canvas, nodes, cron tool creation
- `tool-policy.ts` — keep as-is (groups/profiles include stripped tools for completeness)
- `pi-tools.schema.ts` — keep as-is
- `pi-tool-definition-adapter.ts` — keep as-is
- `tool-split.ts` — keep as-is
- `tool-summaries.ts` — keep as-is (summaries are data, not code)
- Individual tool files in `tools/` — copy kept tools, skip stripped tools
- `bash-tools.exec.ts`, `bash-tools.process.ts`, `bash-tools.shared.ts` — keep

The stripping in pi-tools.ts and openclaw-tools.ts is the most complex part — conditional tool creation branches need to be removed.

---

## 5. system-prompt.md

### Consistency with Master Matrix

**Fully consistent.** The Keep/Strip section in the doc matches Category 11 exactly:
- All kept section builders (skills, memory, time, docs, sandbox, runtime, reasoning, context files) → KEEP
- All stripped sections (messaging, voice, reply tags, user identity, self-update, model aliases, silent replies, heartbeats, reactions, inline buttons) → STRIP

### Changes Needed to Design Doc

**None.** The doc explicitly lists every section builder and its keep/strip status.

### Migration Complexity: **Large**

`system-prompt.ts` is ~554 lines with many section builders interleaved. Stripping requires removing ~10 section builders and their references in the main assembly function, while preserving ~10 others. The file has many conditional branches based on `isMinimal` and feature availability. Need to also copy `date-time.ts`, `tool-summaries.ts`, `system-prompt-params.ts`, `system-prompt-report.ts`.

---

## 6. session-management.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- Write lock, transcript policy, repair, guard, history, runs → KEEP (Category 12)
- Cache trace, payload logger, stream setup → KEEP (Category 12)
- Session manager cache (prewarm) → PLACEHOLDER (Category 12)
- Transcript events → KEEP (Category 12)

The doc mentions DM history limiting with channel config lookup — the logic is KEEP but the per-channel config paths would reference channel config that's stripped. This is a minor inconsistency.

### Changes Needed to Design Doc

**Minor note needed:** `getDmHistoryLimitFromSessionKey` references `config.channels[provider]` which is part of channel config (Category 18: STRIP). During Phase 5, this function may need adjustment — either simplify to a single config path, or keep the function but accept that channel config won't be populated. Not a doc change — handle during stripping.

### Migration Complexity: **Small**

8 of 10 files are already migrated. The fresh copy replaces them with verbatim originals. Only the subscription stub and cache stub need attention (handled by event-subscription doc).

---

## 7. error-handling.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- Retry loop, abort, timeout, compaction safeguard → KEEP (Category 13)
- Kept classifiers (context overflow, compaction failure, timeout, image size) → KEEP
- `scrubAnthropicRefusalMagic` → KEEP
- FailoverError, failover classification, ERROR_PATTERNS, dead classifiers → STRIP
- model-fallback.ts, auth profile rotation → STRIP

### Changes Needed to Design Doc

**None.** The Keep/Strip sections are explicit and complete.

### Migration Complexity: **Medium**

The error classifiers file (`failover-error.ts`) has both kept and stripped content — `isTimeoutError` is kept while the failover functions are stripped. `errors.ts` similarly has kept classifiers mixed with stripped ones. The retry loop (`run.ts`) likely references failover logic that needs removal. Compaction safeguard files need to be copied.

---

## 8. hooks.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- All 7 kept hook categories → KEEP (Category 4)
- Messaging hooks → STRIP (Category 1)
- Hook execution (HookRunner, internal hooks) → KEEP (Categories 4/5)
- Discovery/loading/installation/CLI → STRIP (Category 4)

### Changes Needed to Design Doc

**None.** The doc has clear "Summary: What We Keep" and "Scoping Decisions" tables.

### Migration Complexity: **Medium**

Need to copy:
- `plugins/hooks.ts` (~460 lines) — strip messaging hook support
- `hooks/internal-hooks.ts` (~175 lines) — keep event system
- `hooks/types.ts` — type definitions
- Update stubs in `hook-runner-global.ts` and `bootstrap-hooks.ts`

The hooks.ts file is large and interleaves messaging and non-messaging hook handling. Careful stripping needed.

---

## 9. subagents.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- Spawn tool, key gen, authorization, model resolution, tool policy → KEEP (Category 14)
- System prompt, gateway delegation, registry, announcement → KEEP
- `whatsapp_login` in deny list → STRIP (Category 14)
- Channel-specific announcement routing → STRIP (Category 2/14)
- Group/space context inheritance → STRIP/simplify (Category 2/14)

### Changes Needed to Design Doc

**None.** The Keep/Strip sections are clear.

### Migration Complexity: **Medium**

The spawn tool exists but registry and announcement flow don't. Need to copy:
- `subagent-announce.ts` (announcement + system prompt)
- `subagent-registry.ts` (lifecycle tracking)
- Dependencies on gateway RPC and agent lifecycle events

The announcement flow references messaging delivery which needs stripping.

---

## 10. memory.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- Full memory system → INACTIVE (Category 15)
- Tools, config, system prompt section → KEEP (Categories 10/15)
- Bootstrap MEMORY.md, subagent deny → KEEP (already migrated)
- CLI commands → SKIP (Category 6)

The doc explicitly recommends `memorySearch.enabled: false` for inactive deployment.

### Changes Needed to Design Doc

**None.** The doc's "Scoping Decisions" section explicitly says "Nothing — keep everything for reference" under Strip, and the note about INACTIVE deployment is clear.

### Migration Complexity: **Large** (but low risk since inactive)

32 files to copy, including SQLite bindings, embedding providers, and batch processing. All are INACTIVE — they'll be present in the codebase but never executed. The main risk is compilation errors from missing npm dependencies (`better-sqlite3`, `sqlite-vec`, `node-llama-cpp`), which may need stub type declarations or package.json additions.

---

## 11. event-subscription.md

### Consistency with Master Matrix

**Fully consistent.** All decisions align:
- Core subscription, text/tool handling, tag stripping, chunking, compaction coord → KEEP (Category 16)
- Messaging deduplication, channel tool extraction → STRIP (Categories 1/16)

### Changes Needed to Design Doc

**None.** Keep/Strip sections are explicit.

### Migration Complexity: **Medium**

The subscription files (`pi-embedded-subscribe.ts` and helpers) interleave messaging dedup with core event handling. Need to strip:
- `messagingToolSentTexts` tracking
- `extractMessagingToolSend` function
- `normalizeTargetForProvider`
- `shouldSkipAssistantText` messaging dedup logic

While preserving the core event handler, tag stripping, tool result sanitization, and compaction coordination.

---

## Summary

| Doc | Consistent? | Doc Changes Needed | Complexity |
|-----|-------------|-------------------|------------|
| sandbox.md | Yes | None | Small |
| skills.md | Yes | None | Small |
| bootstrap.md | Yes | None | Small |
| tools.md | Yes | None | Large |
| system-prompt.md | Yes | None | Large |
| session-management.md | Yes | None (minor note) | Small |
| error-handling.md | Yes | None | Medium |
| hooks.md | Yes | None | Medium |
| subagents.md | Yes | None | Medium |
| memory.md | Yes | None | Large (inactive) |
| event-subscription.md | Yes | None | Medium |

**All 11 docs are consistent with the master matrix.** No design doc changes are needed. The previous design work was thorough and internally consistent.

### Complexity Distribution
- **Small (3):** sandbox, skills, bootstrap, session-management
- **Medium (4):** error-handling, hooks, subagents, event-subscription
- **Large (3):** tools, system-prompt, memory (memory is large but low-risk since inactive)

The hardest Phase 5 stripping work will be in `system-prompt.ts` (~554 lines with many conditional sections) and `pi-tools.ts` / `openclaw-tools.ts` (tool creation pipeline with conditional tool assembly).
