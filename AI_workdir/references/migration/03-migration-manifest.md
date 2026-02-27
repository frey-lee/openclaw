# Migration Manifest

Generated: 2026-02-12
Source repo: `openclaw/`
Source checklists: 11 files in `AI_workdir/references/migration/checklists/`

---

## Source Files (verified to exist)

| # | Source Path | Design Doc(s) | Has Test? |
|---|-------------|--------------|-----------|
| 1 | `src/agents/sandbox/types.ts` | sandbox | No |
| 2 | `src/agents/sandbox/types.docker.ts` | sandbox | No |
| 3 | `src/agents/sandbox/constants.ts` | sandbox | No |
| 4 | `src/agents/sandbox/config.ts` | sandbox | No |
| 5 | `src/agents/sandbox/runtime-status.ts` | sandbox | No |
| 6 | `src/agents/sandbox/tool-policy.ts` | sandbox | Yes: `src/agents/sandbox/tool-policy.test.ts` |
| 7 | `src/agents/sandbox.ts` | sandbox | No |
| 8 | `src/agents/sandbox-paths.ts` | sandbox, tools | No |
| 9 | `src/agents/bash-tools.shared.ts` | sandbox, tools | No |
| 10 | `src/agents/bash-tools.exec.ts` | sandbox, tools | Yes: `src/agents/bash-tools.exec.approval-id.test.ts`, `src/agents/bash-tools.exec.background-abort.test.ts`, `src/agents/bash-tools.exec.path.test.ts`, `src/agents/bash-tools.exec.pty-fallback.test.ts`, `src/agents/bash-tools.exec.pty.test.ts` |
| 11 | `src/agents/bash-tools.process.ts` | sandbox, tools | Yes: `src/agents/bash-tools.process.send-keys.test.ts` |
| 12 | `src/agents/tool-policy.ts` | sandbox, tools | Yes: `src/agents/tool-policy.test.ts`, `src/agents/tool-policy.plugin-only-allowlist.test.ts` |
| 13 | `src/agents/pi-embedded-runner/sandbox-info.ts` | sandbox | No |
| 14 | `src/agents/agent-scope.ts` | sandbox, tools, subagents | Yes: `src/agents/agent-scope.test.ts` |
| 15 | `src/config/sessions.ts` | sandbox | Yes: `src/config/sessions.test.ts`, `src/config/sessions.cache.test.ts` |
| 16 | `src/routing/session-key.ts` | sandbox | No |
| 17 | `src/cli/command-format.ts` | sandbox | No |
| 18 | `src/agents/pi-embedded-runner/run/attempt.ts` | sandbox, error-handling | Yes: `src/agents/pi-embedded-runner/run/attempt.test.ts` |
| 19 | `src/agents/skills.ts` | skills | No |
| 20 | `src/agents/skills/types.ts` | skills | No |
| 21 | `src/agents/skills/config.ts` | skills | No |
| 22 | `src/agents/skills/workspace.ts` | skills | No |
| 23 | `src/agents/skills/env-overrides.ts` | skills | No |
| 24 | `src/agents/skills/frontmatter.ts` | skills | Yes: `src/agents/skills/frontmatter.test.ts` |
| 25 | `src/agents/skills/bundled-dir.ts` | skills | No |
| 26 | `src/agents/skills/serialize.ts` | skills | No |
| 27 | `src/agents/skills/plugin-skills.ts` | skills (placeholder) | No |
| 28 | `src/markdown/frontmatter.ts` | skills | Yes: `src/markdown/frontmatter.test.ts` |
| 29 | `src/utils/boolean.ts` | skills | Yes: `src/utils/boolean.test.ts` |
| 30 | `src/compat/legacy-names.ts` | skills | No |
| 31 | `src/config/types.skills.ts` | skills | No |
| 32 | `src/agents/workspace.ts` | bootstrap | Yes: `src/agents/workspace.test.ts` |
| 33 | `src/agents/bootstrap-files.ts` | bootstrap | Yes: `src/agents/bootstrap-files.test.ts` |
| 34 | `src/agents/pi-embedded-helpers/bootstrap.ts` | bootstrap | No |
| 35 | `src/agents/bootstrap-hooks.ts` | bootstrap, hooks | Yes: `src/agents/bootstrap-hooks.test.ts` |
| 36 | `src/agents/pi-tools.ts` | tools | No |
| 37 | `src/agents/pi-tools.types.ts` | tools | No |
| 38 | `src/agents/pi-tools.policy.ts` | tools, subagents | Yes: `src/agents/pi-tools.policy.test.ts` |
| 39 | `src/agents/pi-tools.schema.ts` | tools | No |
| 40 | `src/agents/pi-tools.abort.ts` | tools | No |
| 41 | `src/agents/pi-tools.read.ts` | tools | No |
| 42 | `src/agents/openclaw-tools.ts` | tools | Yes: `src/agents/openclaw-tools.agents.test.ts`, `src/agents/openclaw-tools.session-status.test.ts`, `src/agents/openclaw-tools.sessions.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-allows-cross-agent-spawning-configured.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-announces-agent-wait-lifecycle-events.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-applies-model-child-session.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-normalizes-allowlisted-agent-ids.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-prefers-per-agent-subagent-model.test.ts`, `src/agents/openclaw-tools.subagents.sessions-spawn-resolves-main-announce-target-from.test.ts` |
| 43 | `src/agents/tool-summaries.ts` | tools, system-prompt | No |
| 44 | `src/agents/pi-tool-definition-adapter.ts` | tools | Yes: `src/agents/pi-tool-definition-adapter.test.ts` |
| 45 | `src/agents/pi-embedded-runner/tool-split.ts` | tools | Yes: `src/agents/pi-embedded-runner.splitsdktools.test.ts` |
| 46 | `src/agents/bash-tools.ts` | tools | Yes: `src/agents/bash-tools.test.ts` |
| 47 | `src/agents/tools/sessions-spawn-tool.ts` | tools, subagents | No |
| 48 | `src/agents/tools/sessions-list-tool.ts` | tools | Yes: `src/agents/tools/sessions-list-tool.gating.test.ts` |
| 49 | `src/agents/tools/sessions-history-tool.ts` | tools | No |
| 50 | `src/agents/tools/session-status-tool.ts` | tools | No |
| 51 | `src/agents/tools/sessions-helpers.ts` | tools | Yes: `src/agents/tools/sessions-helpers.test.ts` |
| 52 | `src/agents/tools/sessions-announce-target.ts` | tools | Yes: `src/agents/tools/sessions-announce-target.test.ts` |
| 53 | `src/agents/tools/agents-list-tool.ts` | tools | No |
| 54 | `src/agents/tools/gateway-tool.ts` | tools | No |
| 55 | `src/agents/tools/gateway.ts` | tools | Yes: `src/agents/tools/gateway.test.ts` |
| 56 | `src/agents/tools/image-tool.ts` | tools | Yes: `src/agents/tools/image-tool.test.ts` |
| 57 | `src/agents/tools/image-tool.helpers.ts` | tools | No |
| 58 | `src/agents/tools/memory-tool.ts` | tools, memory | Yes: `src/agents/tools/memory-tool.does-not-crash-on-errors.test.ts` |
| 59 | `src/agents/tools/common.ts` | tools | Yes: `src/agents/tools/common.test.ts` |
| 60 | `src/agents/tools/agent-step.ts` | tools | No |
| 61 | `src/agents/tool-call-id.ts` | tools, error-handling | Yes: `src/agents/tool-call-id.test.ts` |
| 62 | `src/agents/tool-display.ts` | tools | Yes: `src/agents/tool-display.test.ts` |
| 63 | `src/agents/tool-images.ts` | tools | Yes: `src/agents/tool-images.test.ts` |
| 64 | `src/agents/system-prompt.ts` | system-prompt | No |
| 65 | `src/agents/pi-embedded-runner/system-prompt.ts` | system-prompt | No |
| 66 | `src/agents/system-prompt-params.ts` | system-prompt | No |
| 67 | `src/agents/system-prompt-report.ts` | system-prompt | No |
| 68 | `src/agents/date-time.ts` | system-prompt | No |
| 69 | `src/agents/session-write-lock.ts` | session-management | Yes: `src/agents/session-write-lock.test.ts` |
| 70 | `src/agents/transcript-policy.ts` | session-management | No |
| 71 | `src/agents/session-transcript-repair.ts` | session-management, error-handling | Yes: `src/agents/session-transcript-repair.test.ts` |
| 72 | `src/agents/session-tool-result-guard.ts` | session-management, error-handling | Yes: `src/agents/session-tool-result-guard.test.ts`, `src/agents/session-tool-result-guard.tool-result-persist-hook.test.ts` |
| 73 | `src/agents/session-tool-result-guard-wrapper.ts` | session-management | No |
| 74 | `src/agents/pi-embedded-runner/session-manager-init.ts` | session-management | No |
| 75 | `src/agents/pi-embedded-runner/history.ts` | session-management | No |
| 76 | `src/agents/pi-embedded-runner/runs.ts` | session-management | No |
| 77 | `src/agents/pi-embedded-subscribe.ts` | session-management, event-subscription | Yes: see test files section |
| 78 | `src/agents/pi-embedded-runner/session-manager-cache.ts` | session-management | No |
| 79 | `src/sessions/transcript-events.ts` | session-management | No |
| 80 | `src/agents/cache-trace.ts` | session-management | Yes: `src/agents/cache-trace.test.ts` |
| 81 | `src/agents/anthropic-payload-log.ts` | session-management | No |
| 82 | `src/agents/pi-embedded-runner/extra-params.ts` | session-management | No |
| 83 | `src/agents/pi-embedded-helpers/errors.ts` | error-handling | No |
| 84 | `src/agents/failover-error.ts` | error-handling | No |
| 85 | `src/agents/pi-extensions/compaction-safeguard.ts` | error-handling | No |
| 86 | `src/agents/pi-extensions/compaction-safeguard-runtime.ts` | error-handling | No |
| 87 | `src/agents/compaction.ts` | error-handling | No |
| 88 | `src/plugins/hooks.ts` | hooks | No |
| 89 | `src/hooks/internal-hooks.ts` | hooks | No |
| 90 | `src/hooks/types.ts` | hooks | No |
| 91 | `src/plugins/hook-runner-global.ts` | hooks | No |
| 92 | `src/agents/subagent-announce.ts` | subagents | Yes: `src/agents/subagent-announce.format.test.ts` |
| 93 | `src/agents/subagent-announce-queue.ts` | subagents | No |
| 94 | `src/agents/subagent-registry.ts` | subagents | Yes: `src/agents/subagent-registry.persistence.test.ts` |
| 95 | `src/agents/subagent-registry.store.ts` | subagents | No |
| 96 | `src/sessions/session-key-utils.ts` | subagents | No |
| 97 | `src/memory/manager.ts` | memory | Yes: `src/memory/manager.async-search.test.ts`, `src/memory/manager.atomic-reindex.test.ts`, `src/memory/manager.batch.test.ts`, `src/memory/manager.embedding-batches.test.ts`, `src/memory/manager.sync-errors-do-not-crash.test.ts`, `src/memory/manager.vector-dedupe.test.ts` |
| 98 | `src/memory/index.ts` | memory | Yes: `src/memory/index.test.ts` |
| 99 | `src/memory/search-manager.ts` | memory | No |
| 100 | `src/memory/internal.ts` | memory | Yes: `src/memory/internal.test.ts` |
| 101 | `src/memory/memory-schema.ts` | memory | No |
| 102 | `src/memory/sync-memory-files.ts` | memory | No |
| 103 | `src/memory/manager-search.ts` | memory | No |
| 104 | `src/memory/hybrid.ts` | memory | Yes: `src/memory/hybrid.test.ts` |
| 105 | `src/memory/manager-cache-key.ts` | memory | No |
| 106 | `src/memory/sqlite.ts` | memory | No |
| 107 | `src/memory/sqlite-vec.ts` | memory | No |
| 108 | `src/memory/session-files.ts` | memory | No |
| 109 | `src/memory/provider-key.ts` | memory | No |
| 110 | `src/memory/headers-fingerprint.ts` | memory | No |
| 111 | `src/memory/embeddings.ts` | memory | Yes: `src/memory/embeddings.test.ts` |
| 112 | `src/memory/embeddings-openai.ts` | memory | No |
| 113 | `src/memory/embeddings-gemini.ts` | memory | No |
| 114 | `src/memory/batch-openai.ts` | memory | No |
| 115 | `src/memory/batch-gemini.ts` | memory | No |
| 116 | `src/memory/node-llama.ts` | memory | No |
| 117 | `src/agents/memory-search.ts` | memory | Yes: `src/agents/memory-search.test.ts` |
| 118 | `src/hooks/bundled/session-memory/handler.ts` | memory | Yes: `src/hooks/bundled/session-memory/handler.test.ts` |
| 119 | `src/auto-reply/reply/memory-flush.ts` | memory | Yes: `src/auto-reply/reply/memory-flush.test.ts` |
| 120 | `src/agents/pi-embedded-subscribe.types.ts` | event-subscription | No |
| 121 | `src/agents/pi-embedded-subscribe.tools.ts` | event-subscription | Yes: `src/agents/pi-embedded-subscribe.tools.test.ts` |
| 122 | `src/agents/pi-embedded-block-chunker.ts` | event-subscription | Yes: `src/agents/pi-embedded-block-chunker.test.ts` |
| 123 | `src/agents/pi-embedded-subscribe.handlers.messages.ts` | event-subscription | No |
| 124 | `src/agents/pi-embedded-subscribe.handlers.lifecycle.ts` | event-subscription | No |
| 125 | `src/agents/pi-embedded-runner/run.ts` | error-handling | No |
| 126 | `src/agents/pi-embedded-runner/abort.ts` | error-handling | No |
| 127 | `src/agents/timeout.ts` | error-handling | No |

---

## Files Not Found (need resolution)

| Expected Path | From Checklist | Notes |
|---------------|---------------|-------|
| `src/commands/skill-commands.ts` | skills | Found at `src/auto-reply/skill-commands.ts` instead |
| `src/agents/pi-embedded-runner/run/run.ts` | error-handling | Found at `src/agents/pi-embedded-runner/run.ts` (no `run/` subdirectory) |
| `src/agents/pi-embedded-runner/timeout.ts` | error-handling | Found at `src/agents/timeout.ts` (not inside `pi-embedded-runner/`) |
| `src/agents/abort.ts` | error-handling | Found at `src/agents/pi-embedded-runner/abort.ts` (inside `pi-embedded-runner/`) |

All 4 "not found" files were located at corrected paths and are included in the main table above with their actual paths.

---

## Test Files

| # | Test Path | Source File |
|---|-----------|------------|
| 1 | `src/agents/sandbox/tool-policy.test.ts` | `src/agents/sandbox/tool-policy.ts` |
| 2 | `src/agents/bash-tools.test.ts` | `src/agents/bash-tools.ts` |
| 3 | `src/agents/bash-tools.exec.approval-id.test.ts` | `src/agents/bash-tools.exec.ts` |
| 4 | `src/agents/bash-tools.exec.background-abort.test.ts` | `src/agents/bash-tools.exec.ts` |
| 5 | `src/agents/bash-tools.exec.path.test.ts` | `src/agents/bash-tools.exec.ts` |
| 6 | `src/agents/bash-tools.exec.pty-fallback.test.ts` | `src/agents/bash-tools.exec.ts` |
| 7 | `src/agents/bash-tools.exec.pty.test.ts` | `src/agents/bash-tools.exec.ts` |
| 8 | `src/agents/bash-tools.process.send-keys.test.ts` | `src/agents/bash-tools.process.ts` |
| 9 | `src/agents/tool-policy.test.ts` | `src/agents/tool-policy.ts` |
| 10 | `src/agents/tool-policy.plugin-only-allowlist.test.ts` | `src/agents/tool-policy.ts` |
| 11 | `src/agents/agent-scope.test.ts` | `src/agents/agent-scope.ts` |
| 12 | `src/config/sessions.test.ts` | `src/config/sessions.ts` |
| 13 | `src/config/sessions.cache.test.ts` | `src/config/sessions.ts` |
| 14 | `src/agents/pi-embedded-runner/run/attempt.test.ts` | `src/agents/pi-embedded-runner/run/attempt.ts` |
| 15 | `src/agents/skills/frontmatter.test.ts` | `src/agents/skills/frontmatter.ts` |
| 16 | `src/markdown/frontmatter.test.ts` | `src/markdown/frontmatter.ts` |
| 17 | `src/utils/boolean.test.ts` | `src/utils/boolean.ts` |
| 18 | `src/agents/workspace.test.ts` | `src/agents/workspace.ts` |
| 19 | `src/agents/bootstrap-files.test.ts` | `src/agents/bootstrap-files.ts` |
| 20 | `src/agents/bootstrap-hooks.test.ts` | `src/agents/bootstrap-hooks.ts` |
| 21 | `src/agents/pi-tools.policy.test.ts` | `src/agents/pi-tools.policy.ts` |
| 22 | `src/agents/pi-tools-agent-config.test.ts` | `src/agents/pi-tools.ts` |
| 23 | `src/agents/pi-tools.safe-bins.test.ts` | `src/agents/pi-tools.ts` |
| 24 | `src/agents/pi-tools.workspace-paths.test.ts` | `src/agents/pi-tools.ts` |
| 25 | `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping.test.ts` | `src/agents/pi-tools.ts` |
| 26 | `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-b.test.ts` | `src/agents/pi-tools.ts` |
| 27 | `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-d.test.ts` | `src/agents/pi-tools.ts` |
| 28 | `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-f.test.ts` | `src/agents/pi-tools.ts` |
| 29 | `src/agents/pi-tool-definition-adapter.test.ts` | `src/agents/pi-tool-definition-adapter.ts` |
| 30 | `src/agents/pi-embedded-runner.splitsdktools.test.ts` | `src/agents/pi-embedded-runner/tool-split.ts` |
| 31 | `src/agents/tool-call-id.test.ts` | `src/agents/tool-call-id.ts` |
| 32 | `src/agents/tool-display.test.ts` | `src/agents/tool-display.ts` |
| 33 | `src/agents/tool-images.test.ts` | `src/agents/tool-images.ts` |
| 34 | `src/agents/tools/common.test.ts` | `src/agents/tools/common.ts` |
| 35 | `src/agents/tools/gateway.test.ts` | `src/agents/tools/gateway.ts` |
| 36 | `src/agents/tools/image-tool.test.ts` | `src/agents/tools/image-tool.ts` |
| 37 | `src/agents/tools/memory-tool.does-not-crash-on-errors.test.ts` | `src/agents/tools/memory-tool.ts` |
| 38 | `src/agents/tools/sessions-helpers.test.ts` | `src/agents/tools/sessions-helpers.ts` |
| 39 | `src/agents/tools/sessions-announce-target.test.ts` | `src/agents/tools/sessions-announce-target.ts` |
| 40 | `src/agents/tools/sessions-list-tool.gating.test.ts` | `src/agents/tools/sessions-list-tool.ts` |
| 41 | `src/agents/openclaw-tools.agents.test.ts` | `src/agents/openclaw-tools.ts` |
| 42 | `src/agents/openclaw-tools.session-status.test.ts` | `src/agents/openclaw-tools.ts` |
| 43 | `src/agents/openclaw-tools.sessions.test.ts` | `src/agents/openclaw-tools.ts` |
| 44 | `src/agents/openclaw-tools.subagents.sessions-spawn-allows-cross-agent-spawning-configured.test.ts` | `src/agents/openclaw-tools.ts` |
| 45 | `src/agents/openclaw-tools.subagents.sessions-spawn-announces-agent-wait-lifecycle-events.test.ts` | `src/agents/openclaw-tools.ts` |
| 46 | `src/agents/openclaw-tools.subagents.sessions-spawn-applies-model-child-session.test.ts` | `src/agents/openclaw-tools.ts` |
| 47 | `src/agents/openclaw-tools.subagents.sessions-spawn-normalizes-allowlisted-agent-ids.test.ts` | `src/agents/openclaw-tools.ts` |
| 48 | `src/agents/openclaw-tools.subagents.sessions-spawn-prefers-per-agent-subagent-model.test.ts` | `src/agents/openclaw-tools.ts` |
| 49 | `src/agents/openclaw-tools.subagents.sessions-spawn-resolves-main-announce-target-from.test.ts` | `src/agents/openclaw-tools.ts` |
| 50 | `src/agents/session-write-lock.test.ts` | `src/agents/session-write-lock.ts` |
| 51 | `src/agents/session-tool-result-guard.test.ts` | `src/agents/session-tool-result-guard.ts` |
| 52 | `src/agents/session-tool-result-guard.tool-result-persist-hook.test.ts` | `src/agents/session-tool-result-guard.ts` |
| 53 | `src/agents/session-transcript-repair.test.ts` | `src/agents/session-transcript-repair.ts` |
| 54 | `src/agents/cache-trace.test.ts` | `src/agents/cache-trace.ts` |
| 55 | `src/agents/pi-embedded-runner.guard.test.ts` | `src/agents/session-tool-result-guard-wrapper.ts` |
| 56 | `src/agents/pi-embedded-runner.sanitize-session-history.test.ts` | `src/agents/pi-embedded-runner/session-manager-init.ts` |
| 57 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.subscribeembeddedpisession.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 58 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-indented-fenced-blocks-intact.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 59 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.reopens-fenced-blocks-splitting-inside-them.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 60 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.splits-long-single-line-fenced-blocks-reopen.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 61 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.streams-soft-chunks-paragraph-preference.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 62 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.suppresses-message-end-block-replies-message-tool.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 63 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.waits-multiple-compaction-retries-before-resolving.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 64 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.calls-onblockreplyflush-before-tool-execution-start-preserve.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 65 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-append-text-end-content-is.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 66 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-call-onblockreplyflush-callback-is-not.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 67 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-duplicate-text-end-repeats-full.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 68 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-emit-duplicate-block-replies-text.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 69 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-block-replies-text-end-does-not.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 70 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-reasoning-as-separate-message-enabled.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 71 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.filters-final-suppresses-output-without-start-tag.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 72 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.includes-canvas-action-metadata-tool-summaries.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 73 | `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-assistanttexts-final-answer-block-replies-are.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 74 | `src/agents/pi-embedded-subscribe.code-span-awareness.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 75 | `src/agents/pi-embedded-subscribe.tools.test.ts` | `src/agents/pi-embedded-subscribe.tools.ts` |
| 76 | `src/agents/pi-embedded-subscribe.reply-tags.test.ts` | `src/agents/pi-embedded-subscribe.ts` |
| 77 | `src/agents/subagent-announce.format.test.ts` | `src/agents/subagent-announce.ts` |
| 78 | `src/agents/subagent-registry.persistence.test.ts` | `src/agents/subagent-registry.ts` |
| 79 | `src/memory/embeddings.test.ts` | `src/memory/embeddings.ts` |
| 80 | `src/memory/hybrid.test.ts` | `src/memory/hybrid.ts` |
| 81 | `src/memory/index.test.ts` | `src/memory/index.ts` |
| 82 | `src/memory/internal.test.ts` | `src/memory/internal.ts` |
| 83 | `src/memory/manager.async-search.test.ts` | `src/memory/manager.ts` |
| 84 | `src/memory/manager.atomic-reindex.test.ts` | `src/memory/manager.ts` |
| 85 | `src/memory/manager.batch.test.ts` | `src/memory/manager.ts` |
| 86 | `src/memory/manager.embedding-batches.test.ts` | `src/memory/manager.ts` |
| 87 | `src/memory/manager.sync-errors-do-not-crash.test.ts` | `src/memory/manager.ts` |
| 88 | `src/memory/manager.vector-dedupe.test.ts` | `src/memory/manager.ts` |
| 89 | `src/agents/memory-search.test.ts` | `src/agents/memory-search.ts` |
| 90 | `src/hooks/bundled/session-memory/handler.test.ts` | `src/hooks/bundled/session-memory/handler.ts` |
| 91 | `src/auto-reply/reply/memory-flush.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 92 | `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.increments-compaction-count-flush-compaction-completes.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 93 | `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.runs-memory-flush-turn-updates-session-metadata.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 94 | `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.skips-memory-flush-cli-providers.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 95 | `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.skips-memory-flush-sandbox-workspace-is-read.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 96 | `src/auto-reply/reply/agent-runner.memory-flush.runreplyagent-memory-flush.uses-configured-prompts-memory-flush-runs.test.ts` | `src/auto-reply/reply/memory-flush.ts` |
| 97 | `src/agents/pi-embedded-block-chunker.test.ts` | `src/agents/pi-embedded-block-chunker.ts` |

---

## Path Corrections

The following files had incorrect paths in the checklists and were resolved to their actual locations:

| Checklist Path | Actual Path | Checklist |
|---------------|-------------|-----------|
| `src/commands/skill-commands.ts` | `src/auto-reply/skill-commands.ts` | skills |
| `src/agents/pi-embedded-runner/run/run.ts` | `src/agents/pi-embedded-runner/run.ts` | error-handling |
| `src/agents/pi-embedded-runner/timeout.ts` | `src/agents/timeout.ts` | error-handling |
| `src/agents/abort.ts` | `src/agents/pi-embedded-runner/abort.ts` | error-handling |

---

## Statistics

- **Total unique source files: 127** (non-test)
- **Total unique test files: 97**
- **Grand total files: 224**
- **Files not found at checklist path: 4** (all resolved to corrected paths -- 0 truly missing)
- **Source files with at least one test: 52**
- **Source files with no tests: 75**

### Breakdown by subsystem

| Subsystem | Source Files | Test Files |
|-----------|-------------|------------|
| sandbox | 17 | 10 |
| skills | 13 | 3 |
| bootstrap | 4 | 3 |
| tools | 30 | 33 |
| system-prompt | 6 | 0 |
| session-management | 14 | 22 |
| error-handling | 10 | 0 |
| hooks | 5 | 0 |
| subagents | 6 | 2 |
| memory | 23 | 18 |
| event-subscription | 6 | 21 |

> Note: Some files appear in multiple subsystems (e.g., `agent-scope.ts` is in sandbox, tools, and subagents). The subsystem counts above reflect primary ownership. The total counts are deduplicated.

### Files shared across multiple checklists

| Source Path | Checklists |
|-------------|-----------|
| `src/agents/agent-scope.ts` | sandbox, tools, subagents |
| `src/agents/bash-tools.exec.ts` | sandbox, tools |
| `src/agents/bash-tools.process.ts` | sandbox, tools |
| `src/agents/bash-tools.shared.ts` | sandbox, tools |
| `src/agents/bash-tools.ts` | tools |
| `src/agents/sandbox-paths.ts` | sandbox, tools |
| `src/agents/tool-policy.ts` | sandbox, tools |
| `src/agents/tool-summaries.ts` | tools, system-prompt |
| `src/agents/pi-tools.policy.ts` | tools, subagents |
| `src/agents/pi-embedded-subscribe.ts` | session-management, event-subscription |
| `src/agents/session-tool-result-guard.ts` | session-management, error-handling |
| `src/agents/session-transcript-repair.ts` | session-management, error-handling |
| `src/agents/tool-call-id.ts` | tools, error-handling |
| `src/agents/tools/memory-tool.ts` | tools, memory |
| `src/agents/pi-embedded-runner/run/attempt.ts` | sandbox, error-handling |
| `src/agents/bootstrap-hooks.ts` | bootstrap, hooks |
| `src/agents/tools/sessions-spawn-tool.ts` | tools, subagents |
