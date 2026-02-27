# Tasks

## Completed

- [x] Git cleanup — openclaw repo: deleted `feat--prune-and-subagents`, checked out `v2026.2.17`, cleaned `nul`
- [x] Git cleanup — openclaw-agent repo: committed and pushed to remote
- [x] Write `design_docs/v2026-changelog.md` — high-level architecture changes on v2026.2.17 branch (4,152 commits)
- [x] Update `design_docs/memory.md` — appended v2026.2.17 changes (temporal decay, QMD, sync modules, etc.)
- [x] Update `design_docs/subagents.md` — appended v2026.2.17 changes (subagents-tool.ts, access controls, cron, etc.)
- [x] Write presentation content — `AI_workdir/presentation/presentation.md` + `image-prompts.md` + v2 edits
- [x] Create actual Google Slides from presentation content (user-completed)

## Backlog (deferred from bridge work)

- [ ] Fix subagent agentId mismatch — LLM specifies "default" instead of "main"
- [ ] Verify synthesis debounce timing — 3s delay may cause Streamlit lag
- [ ] Fix test file compilation — 97 test files excluded from tsconfig
- [ ] Migrate plugin hook system — enable tool call hooks in bridge (see PLANNING.md "Future Work: Plugin Hook Migration")
- [ ] Re-enable vector memory search
- [ ] Extension paths — re-enable `pi-extensions/` subsystem
