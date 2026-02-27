# Migration Checklist: Skills Subsystem

Source design doc: `openclaw-agent/design_docs/skills.md`
Master matrix ref: `00-cross-cutting-decisions.md` Category 8 (Skills), Category 5 (Plugins), Category 6 (CLI & UI), Category 18 (Config), Category 20 (Infrastructure)

---

## Migrate (Copy Verbatim)

These files are copied from openclaw to openclaw-agent with no functional changes. All are marked KEEP in the master matrix.

### Core skills files

- [ ] `src/agents/skills.ts` -- Barrel re-exports + `resolveSkillsInstallPreferences()`
- [ ] `src/agents/skills/types.ts` -- `SkillEntry`, `SkillSnapshot`, `OpenClawSkillMetadata`, `SkillInstallSpec`, `SkillCommandSpec`, etc.
- [ ] `src/agents/skills/config.ts` -- `shouldIncludeSkill()` 8-gate filter, `hasBinary()`, `resolveSkillConfig()`
- [ ] `src/agents/skills/workspace.ts` -- `loadSkillEntries()`, filtering, `buildWorkspaceSkillSnapshot()`, prompt building, `buildWorkspaceSkillCommandSpecs()`, workspace sync
- [ ] `src/agents/skills/env-overrides.ts` -- `applySkillEnvOverrides()` env var injection and `restoreSkillEnv()` cleanup
- [ ] `src/agents/skills/frontmatter.ts` -- SKILL.md parsing, `resolveOpenClawMetadata()` metadata extraction
- [ ] `src/agents/skills/bundled-dir.ts` -- Bundled skills directory resolution
- [ ] `src/agents/skills/serialize.ts` -- Async serialization helper

### Slash commands

- [ ] `src/commands/skill-commands.ts` -- `resolveSkillCommandInvocation()`, `listSkillCommandsForWorkspace()`, `findSkillCommand()` fuzzy lookup

### Supporting utilities (shared with other subsystems)

- [ ] `src/markdown/frontmatter.ts` -- YAML + line-based frontmatter parser (`parseFrontmatter()`, `parseFrontmatterBlock()`)
- [ ] `src/utils/boolean.ts` -- `parseBooleanValue()`
- [ ] `src/compat/legacy-names.ts` -- `MANIFEST_KEY` ("openclaw") constant

### Config types

- [ ] `src/config/types.skills.ts` -- `SkillConfig`, `SkillsConfig` types

### Test files

- [ ] `src/agents/skills/frontmatter.test.ts` -- Tests for SKILL.md frontmatter parsing
- [ ] `src/markdown/frontmatter.test.ts` -- Tests for generic frontmatter parser
- [ ] `src/utils/boolean.test.ts` -- Tests for `parseBooleanValue()`

---

## Strip (Remove During Phase 5)

No code sections within the migrated files are marked for stripping. The skills subsystem's KEEP files are copied intact. Stripping applies only to files in the Skip section below (which are not copied at all) and to **other subsystems** that reference skills tangentially:

- Plugin manifest/discovery code that feeds into `plugin-skills.ts` (stripped in the plugins subsystem, not in skills files themselves)

---

## Placeholder (Stub Implementations Needed)

- [ ] `src/agents/skills/plugin-skills.ts` -- **Stub that returns `[]`**. The full plugin manifest registry is too heavy; this file already exists as a 10-line stub returning an empty array. Copy the stub as-is. (Master matrix: Category 5, `plugin-skills.ts` = PLACEHOLDER)

---

## Skip (Do Not Copy)

These files are explicitly listed as "Not migrated (OpenClaw-only)" in the design doc:

- `skills/refresh.ts` -- File watcher (chokidar) for hot-reload; not needed standalone
- `skills/plugin-skills.ts` (full implementation) -- Full plugin manifest registry; too heavy, replaced by stub above
- `skills-status.ts` -- CLI status reporting
- `infra/skills-remote.ts` -- Remote macOS node skill probing
- `cli/skills-cli.ts` -- CLI management interface

Test files for skipped modules:

- `src/agents/skills/refresh.test.ts` -- Tests for the skipped hot-reload watcher

---

## Dependencies

This checklist depends on or intersects with:

- **checklist-hooks** -- Hook runner kept (Category 4); plugin hook discovery stripped (Category 5). The `plugin-skills.ts` stub parallels the plugin hooks stripping.
- **checklist-system-prompt** -- `buildSkillsSection()` in `system-prompt.ts` consumes the `SkillSnapshot.prompt` produced by `workspace.ts`. The system prompt checklist must KEEP `buildSkillsSection`.
- **checklist-bootstrap** -- Bootstrap Step 0 calls `buildWorkspaceSkillSnapshot()` and `applySkillEnvOverrides()` before the first LLM call. Cleanup (`restoreSkillEnv`) is called from `attempt.ts`.
- **checklist-tools** -- Skills do not define tools themselves, but the `read` tool (kept) is what the LLM uses to load SKILL.md content at runtime.
- **checklist-config** -- `SkillConfig` and `SkillsConfig` types in `src/config/types.skills.ts` are consumed by the core config system. The master matrix (Category 18) marks skills config as KEEP.
- **checklist-sandbox** -- `buildWorkspaceSkillSnapshot()` populates `resolvedSkills` for sandbox copying; sandbox config resolution is in a separate checklist.
