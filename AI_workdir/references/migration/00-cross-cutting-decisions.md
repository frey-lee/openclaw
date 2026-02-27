# Cross-Cutting Decisions — Master Matrix

This is the single source of truth for keep/strip/placeholder decisions across all 11 design docs.

Legend:
- **KEEP** — Copy verbatim from openclaw, no changes
- **STRIP** — Delete during Phase 5 stripping
- **PLACEHOLDER** — Replace with stub/no-op during Phase 5
- **SKIP** — Don't copy at all (not in manifest)
- **INACTIVE** — Copy for reference, but not executed (disabled by config)

---

## Category 1: Messaging

All messaging features are stripped. No channel message delivery in openclaw-agent.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `message` tool | STRIP | tools.md, system-prompt.md, event-subscription.md |
| `tts` tool | STRIP | tools.md, system-prompt.md |
| `sessions_send` tool | STRIP | tools.md, system-prompt.md, subagents.md |
| Channel actions (Telegram/Discord/Slack/WhatsApp) | SKIP | tools.md, hooks.md, event-subscription.md |
| Message tool hints in system prompt | STRIP | system-prompt.md, tools.md |
| Messaging hooks (`message_received`, `message_sending`, `message_sent`) | STRIP | hooks.md |
| Messaging tool deduplication (`messagingToolSentTexts`, etc.) | STRIP | event-subscription.md, session-management.md |
| Reply tags / `[[reply_to_current]]` | STRIP | system-prompt.md |
| Voice/TTS section in prompt | STRIP | system-prompt.md |
| Silent replies / `NO_REPLY` token | STRIP | system-prompt.md |
| Heartbeats / `HEARTBEAT_OK` token | STRIP | system-prompt.md |
| Inline buttons | STRIP | system-prompt.md |
| Reactions guidance | STRIP | system-prompt.md |
| Channel capabilities / `resolveChannelCapabilities` | STRIP | system-prompt.md, tools.md |

## Category 2: Channel Integrations

All channel integrations are skipped entirely (not copied).

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Telegram, Discord, Slack, Signal, iMessage, WhatsApp, Line dirs | SKIP | scope analysis |
| Channel-specific tool send extraction | STRIP | event-subscription.md |
| Channel-specific announcement routing | STRIP | subagents.md |
| Group/space context inheritance | STRIP (simplify) | subagents.md |
| `whatsapp_login` in deny list | STRIP | subagents.md |
| DM history limiting (channel config lookup) | KEEP (logic), STRIP (channel config) | session-management.md |
| Owner phone numbers / user identity section | STRIP | system-prompt.md |

## Category 3: Model Infrastructure

Model registry and failover are stripped. Models are constructed directly.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Model registry / discovery / models.json / z.ai compat | STRIP | scope analysis |
| `FailoverError` class | STRIP | error-handling.md |
| Failover status/reason (`resolveFailoverStatus`, etc.) | STRIP | error-handling.md |
| `ERROR_PATTERNS` / `matchesErrorPatterns` | STRIP | error-handling.md |
| `isRateLimitAssistantError` | STRIP | error-handling.md |
| `isAuthAssistantError` | STRIP | error-handling.md |
| `isFailoverAssistantError` | STRIP | error-handling.md |
| `isRateLimitErrorMessage`, `isAuthErrorMessage`, `isOverloadedErrorMessage` | STRIP | error-handling.md |
| `formatAssistantErrorText`, `sanitizeUserFacingText` | STRIP | error-handling.md |
| `model-fallback.ts` (failover retry chain) | STRIP | error-handling.md |
| Auth profile rotation | STRIP | error-handling.md |
| Model aliases section in prompt | STRIP | system-prompt.md |

## Category 4: Hooks

Hook execution kept; hook discovery/loading/management stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `getGlobalHookRunner` / `hasGlobalHooks` singleton | KEEP | hooks.md, session-management.md |
| Plugin hook runner (`plugins/hooks.ts` HookRunner) | KEEP | hooks.md |
| `before_agent_start` execution | KEEP | hooks.md |
| `agent_end` execution | KEEP | hooks.md |
| `before_tool_call` / `after_tool_call` | KEEP | hooks.md |
| `tool_result_persist` | KEEP | hooks.md, session-management.md |
| `before_compaction` / `after_compaction` | KEEP | hooks.md |
| `session_start` / `session_end` | KEEP | hooks.md |
| `gateway_start` / `gateway_stop` | KEEP | hooks.md |
| `command:new` / `command:reset` / `command:stop` | KEEP | hooks.md |
| Internal hooks system (`registerInternalHook`, `triggerInternalHook`) | KEEP | hooks.md, bootstrap.md |
| `applyBootstrapHookOverrides` (real impl) | KEEP | hooks.md, bootstrap.md |
| Hook types (`PluginHookRegistration`, event types) | KEEP | hooks.md |
| Hook discovery/loading (`hooks/workspace.ts`, `hooks/loader.ts`) | STRIP | hooks.md |
| Hook installation (`hooks/install.ts`) | STRIP | hooks.md |
| Hook eligibility checking (`hooks/config.ts`) | STRIP | hooks.md |
| HOOK.md frontmatter parsing (`hooks/frontmatter.ts`) | STRIP | hooks.md |
| Bundled handlers (`hooks/bundled/*/handler.ts`) | STRIP | hooks.md |
| Gateway webhooks (`gateway/hooks.ts`) | STRIP | hooks.md |
| CLI hook commands (`cli/hooks-cli.ts`) | STRIP | hooks.md |
| Hook status reporting (`hooks/hooks-status.ts`) | STRIP | hooks.md |

## Category 5: Plugins

Plugin hook runner kept; plugin discovery/manifest stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| HookRunner class and execution strategies | KEEP | hooks.md |
| `initializeGlobalHookRunner` | KEEP | hooks.md |
| Plugin manifest/discovery | STRIP | skills.md (plugin-skills.ts is a stub) |
| Plugin-provided skills (`plugin-skills.ts`) | PLACEHOLDER (returns []) | skills.md |
| Plugin-provided hooks | STRIP (discovery infra) | hooks.md |
| `runToolResultPersist` in HookRunner | KEEP | session-management.md |

## Category 6: CLI & UI

All CLI management interfaces and apps stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| CLI skills management | SKIP | skills.md |
| CLI hook commands | SKIP | hooks.md |
| CLI memory commands | SKIP | memory.md |
| Skills status reporting | SKIP | skills.md |
| Hook status reporting | SKIP | hooks.md |
| Self-update section in prompt | STRIP | system-prompt.md |
| macOS, TUI, terminal, browser apps | SKIP | scope analysis |
| Canvas host, web frontend | SKIP | scope analysis |

## Category 7: Sandbox

Core sandbox logic kept; container provisioning not migrated.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `SandboxContext`, `SandboxConfig` types | KEEP | sandbox.md |
| `SandboxDockerConfig` type | KEEP | sandbox.md |
| Path validation (`resolveSandboxPath`, `assertSandboxPath`) | KEEP | sandbox.md, tools.md |
| Runtime status (`resolveSandboxRuntimeStatus`) | KEEP | sandbox.md |
| Config resolution (`resolveSandboxConfigForAgent`) | KEEP | sandbox.md |
| Tool policy (`isToolAllowed`, `resolveSandboxToolPolicyForAgent`) | KEEP | sandbox.md, tools.md |
| Constants & defaults | KEEP | sandbox.md |
| System prompt info (`buildEmbeddedSandboxInfo`) | KEEP | sandbox.md, system-prompt.md |
| Docker exec args (`buildDockerExecArgs`, `buildSandboxEnv`) | KEEP | sandbox.md |
| Sandbox resolver (`sandbox.ts`) | PLACEHOLDER (returns null) | sandbox.md |
| Docker container lifecycle (`sandbox/docker.ts`, `manage.ts`) | SKIP | sandbox.md |
| Browser provisioning (`sandbox/browser.ts`) | SKIP | sandbox.md |
| Container pruning/registry | SKIP | sandbox.md |
| Workspace setup (`sandbox/workspace.ts`) | SKIP | sandbox.md |

## Category 8: Skills

Core skill system kept; management infra stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Skill loading/filtering/snapshot (`workspace.ts`) | KEEP | skills.md |
| Env overrides (`env-overrides.ts`) | KEEP | skills.md |
| Frontmatter parsing (`frontmatter.ts`) | KEEP | skills.md |
| Bundled dir resolution | KEEP | skills.md |
| Slash commands (`skill-commands.ts`) | KEEP | skills.md |
| Types (`types.ts`) | KEEP | skills.md |
| Config resolution (`config.ts`) | KEEP | skills.md |
| Serialize helper | KEEP | skills.md |
| Plugin skills (`plugin-skills.ts`) | PLACEHOLDER (returns []) | skills.md |
| Hot-reload (chokidar) (`refresh.ts`) | SKIP | skills.md |
| Remote probing (`infra/skills-remote.ts`) | SKIP | skills.md |
| CLI management (`cli/skills-cli.ts`) | SKIP | skills.md |
| Status reporting (`skills-status.ts`) | SKIP | skills.md |

## Category 9: Bootstrap

Fully kept with minor simplifications.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| All 8 bootstrap file types | KEEP | bootstrap.md |
| Subagent filtering | KEEP | bootstrap.md, system-prompt.md |
| Bootstrap hooks (`agent:bootstrap`) | KEEP (real impl via internal hooks) | bootstrap.md, hooks.md |
| Truncation | KEEP | bootstrap.md |
| Workspace init / templates | KEEP | bootstrap.md |
| Git init on new workspace | STRIP | bootstrap.md |
| `stripThoughtSignatures` | STRIP (unrelated) | bootstrap.md |
| `sanitizeGoogleTurnOrdering` | STRIP (unrelated) | bootstrap.md |

## Category 10: Tools

Core pipeline kept; excluded tools stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `createOpenClawCodingTools` pipeline | KEEP | tools.md |
| Policy filtering (9-layer cascade) | KEEP | tools.md |
| Tool groups and profiles | KEEP | tools.md |
| Tool splitting (`splitSdkTools`) | KEEP | tools.md |
| Schema normalization | KEEP | tools.md |
| Client tools | KEEP | tools.md |
| Exec tool (full security config) | KEEP | tools.md, sandbox.md |
| Process tool | KEEP | tools.md |
| File tools (read, write, edit, apply_patch) | KEEP | tools.md |
| Sessions tools (spawn, list, history, status) | KEEP | tools.md, subagents.md |
| Gateway tool | KEEP | tools.md, subagents.md |
| Agents list tool | KEEP | tools.md |
| Image tool | KEEP | tools.md |
| Memory tools (search, get) | KEEP (inactive) | tools.md, memory.md |
| `web_search` tool | STRIP | tools.md |
| `web_fetch` tool | STRIP | tools.md |
| `browser` tool | STRIP | tools.md |
| `canvas` tool | STRIP | tools.md |
| `nodes` tool | STRIP | tools.md |
| `cron` tool | STRIP | tools.md |
| `message` tool | STRIP | tools.md |
| `tts` tool | STRIP | tools.md |
| `sessions_send` tool | STRIP | tools.md |

## Category 11: System Prompt

Core prompt assembly kept; channel/messaging sections stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `buildAgentSystemPrompt` | KEEP | system-prompt.md |
| Prompt modes (full/minimal/none) | KEEP | system-prompt.md, subagents.md |
| `buildSkillsSection` | KEEP | system-prompt.md, skills.md |
| `buildMemorySection` | KEEP | system-prompt.md, memory.md |
| `buildTimeSection` | KEEP | system-prompt.md |
| `buildDocsSection` | KEEP | system-prompt.md |
| `buildRuntimeLine` | KEEP | system-prompt.md |
| Tool list + summaries | KEEP | system-prompt.md |
| Sandbox section | KEEP | system-prompt.md, sandbox.md |
| Reasoning format section | KEEP | system-prompt.md |
| Extra system prompt injection | KEEP | system-prompt.md |
| Context file injection | KEEP | system-prompt.md, bootstrap.md |
| System prompt report | KEEP | system-prompt.md |
| Runtime parameter resolution | KEEP | system-prompt.md |
| `buildMessagingSection` | STRIP | system-prompt.md |
| `buildVoiceSection` | STRIP | system-prompt.md |
| `buildReplyTagsSection` | STRIP | system-prompt.md |
| `buildUserIdentitySection` | STRIP | system-prompt.md |
| Self-update section | STRIP | system-prompt.md |
| Model aliases section | STRIP | system-prompt.md |
| Silent replies section | STRIP | system-prompt.md |
| Heartbeats section | STRIP | system-prompt.md |
| Reactions guidance | STRIP | system-prompt.md |
| Inline buttons | STRIP | system-prompt.md |

## Category 12: Session Management

Almost entirely kept.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Session write lock | KEEP | session-management.md |
| Transcript policy | KEEP | session-management.md |
| Transcript repair (synthetic results) | KEEP | session-management.md |
| Tool result guard | KEEP | session-management.md, error-handling.md |
| History sanitization | KEEP | session-management.md |
| Turn limiting | KEEP | session-management.md |
| Active run registration | KEEP | session-management.md |
| Stream function setup | KEEP | session-management.md |
| Cache trace | KEEP | session-management.md |
| Anthropic payload logger | KEEP | session-management.md |
| Session manager init | KEEP | session-management.md |
| Transcript events | KEEP | session-management.md |
| Session manager cache (prewarm) | PLACEHOLDER (no-op) | session-management.md |

## Category 13: Error Handling

Retry loop and compaction kept; failover stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Retry loop with auto-compaction (`run.ts`) | KEEP | error-handling.md |
| Abort infrastructure (`abortRun`, `abortable`) | KEEP | error-handling.md |
| `isAbortError` | KEEP | error-handling.md |
| Timeout resolution | KEEP | error-handling.md |
| Compaction safeguard | KEEP | error-handling.md |
| `isContextOverflowError` | KEEP | error-handling.md |
| `isCompactionFailureError` | KEEP | error-handling.md |
| `isTimeoutError` | KEEP | error-handling.md |
| `parseImageSizeError` / `parseImageDimensionError` | KEEP | error-handling.md |
| `scrubAnthropicRefusalMagic` | KEEP | error-handling.md |
| `FailoverError` class | STRIP | error-handling.md |
| All failover classification functions | STRIP | error-handling.md |
| `ERROR_PATTERNS` / `matchesErrorPatterns` | STRIP | error-handling.md |
| Dead error classifiers (rate limit, auth, failover) | STRIP | error-handling.md |
| `model-fallback.ts` | STRIP | error-handling.md |
| Auth profile rotation | STRIP | error-handling.md |

## Category 14: Subagents

Fully kept with minor channel stripping.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `sessions_spawn` tool | KEEP | subagents.md, tools.md |
| `isSubagentSessionKey` | KEEP | subagents.md, bootstrap.md, session-management.md |
| Cross-agent authorization | KEEP | subagents.md |
| Session key generation | KEEP | subagents.md |
| Model resolution cascade | KEEP | subagents.md |
| `resolveSubagentToolPolicy` deny list | KEEP | subagents.md, tools.md |
| `buildSubagentSystemPrompt` | KEEP | subagents.md, system-prompt.md |
| Gateway delegation | KEEP | subagents.md |
| Subagent registry & lifecycle tracking | KEEP | subagents.md |
| Announcement flow | KEEP | subagents.md |
| `whatsapp_login` in deny list | STRIP | subagents.md |
| Channel-specific announcement routing | STRIP | subagents.md |

## Category 15: Memory

Full system kept for reference (inactive).

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Core memory module (20 files in src/memory/) | INACTIVE | memory.md |
| `memory_search` / `memory_get` tools | KEEP (inactive) | memory.md, tools.md |
| Config resolution | KEEP | memory.md |
| System prompt memory section | KEEP | memory.md, system-prompt.md |
| Bootstrap MEMORY.md loading | KEEP (already migrated) | memory.md, bootstrap.md |
| Subagent deny for memory tools | KEEP (already migrated) | memory.md, subagents.md |
| Embedding providers (OpenAI/Gemini/local) | INACTIVE | memory.md |
| SQLite + sqlite-vec | INACTIVE | memory.md |
| Session-memory hook handler | INACTIVE | memory.md, hooks.md |
| Memory flush (pre-compaction) | INACTIVE | memory.md |
| CLI memory commands | SKIP | memory.md |

## Category 16: Event Subscription

Core subscription kept; messaging dedup stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| `subscribeEmbeddedPiSession` | KEEP | event-subscription.md, session-management.md |
| Text delta/end handling | KEEP | event-subscription.md |
| Tool call/result handling | KEEP | event-subscription.md |
| Tool result sanitization | KEEP | event-subscription.md |
| Compaction coordination | KEEP | event-subscription.md |
| Reasoning tag stripping | KEEP | event-subscription.md |
| Block chunking | KEEP | event-subscription.md |
| Assistant text accumulation | KEEP | event-subscription.md |
| Tool metadata collection | KEEP | event-subscription.md |
| Last tool error tracking | KEEP | event-subscription.md |
| Messaging tool deduplication | STRIP | event-subscription.md |
| Channel-specific tool send extraction | STRIP | event-subscription.md |
| `normalizeTargetForProvider` | STRIP | event-subscription.md |

## Category 17: Gateway

RPC and tool kept; server and webhooks not copied.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Gateway RPC (`callGateway`) | KEEP | subagents.md |
| Gateway tool | KEEP | tools.md |
| Gateway types (for RPC) | KEEP | subagents.md |
| Gateway self-update section | STRIP | system-prompt.md |
| Gateway webhooks (`gateway/hooks.ts`) | SKIP | hooks.md |
| Gateway server infrastructure | SKIP | scope analysis |

## Category 18: Config

Core config types kept; channel-specific config stripped.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Core config types (`OpenClawConfig`, etc.) | KEEP | multiple docs |
| Per-agent config (`resolveAgentConfig`) | KEEP | sandbox.md, subagents.md |
| Tool config (allow/deny, profiles) | KEEP | tools.md |
| Skills config (`SkillConfig`, `SkillsConfig`) | KEEP | skills.md |
| Sandbox config | KEEP | sandbox.md |
| Memory search config | KEEP | memory.md |
| Channel config (per-channel DM limits, etc.) | STRIP | session-management.md |
| `getCustomProviderApiKey` | STRIP | scope analysis |
| `resolveEnvApiKey` | KEEP | scope analysis |

## Category 19: Process & Routing

Fully kept.

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Command queue / lanes | KEEP | subagents.md |
| Session lane queuing | KEEP | scope analysis |
| Process management (list, kill, tail) | KEEP | tools.md |
| Session key utilities | KEEP | sandbox.md, subagents.md, bootstrap.md |

## Category 20: Infrastructure (Misc)

| Feature | Decision | Referenced In |
|---------|----------|---------------|
| Env resolution, shell utilities | KEEP (subset) | scope analysis |
| System events | KEEP (subset) | scope analysis |
| cron / daemon | SKIP | scope analysis |
| test-helpers / test-utils | SKIP | scope analysis |
| acp, link-understanding, media-understanding | SKIP | scope analysis |
| pairing, providers, plugin-sdk, security | SKIP | scope analysis |
| Frontmatter parsing (`markdown/frontmatter.ts`) | KEEP | skills.md |
| `formatCliCommand` stub | KEEP | sandbox.md |
| `parseBooleanValue` | KEEP | skills.md |
| `MANIFEST_KEY` (`compat/legacy-names.ts`) | KEEP | skills.md |

---

## Summary Statistics

| Decision | Count |
|----------|-------|
| KEEP | ~95 features |
| STRIP | ~55 features |
| SKIP | ~25 directories/modules |
| PLACEHOLDER | ~5 stubs |
| INACTIVE | ~10 features (memory system) |
