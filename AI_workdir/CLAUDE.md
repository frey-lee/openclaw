# OpenClaw Repository Analysis Project

## Objective
Systematically analyze and document the OpenClaw repository to provide a comprehensive understanding of:
- Architecture and design patterns
- Component interactions and data flow
- Extension/plugin mechanisms
- Channel integrations
- Configuration systems

## Important Safety Notes
**DO NOT EXECUTE** any scripts, commands, or code from this repository. This is an agent repo with potentially insecure scripts. Only read and analyze files.

## Repository Summary
OpenClaw is a personal AI assistant framework that runs on personal devices. It provides:
- Multi-channel messaging integration (20+ platforms)
- Plugin/extension architecture
- Mobile apps (iOS, Android, macOS)
- Gateway server for managing conversations
- CLI interface for management
- Skills system for agent capabilities
- Memory and session management

## Documentation Structure
All analysis documentation is stored in `AI_workdir/references/`:
- `01-overview.md` - High-level project summary
- `02-architecture.md` - Core architecture analysis
- `03-gateway.md` - Gateway server analysis
- `04-agents.md` - Agent system analysis
- `05-providers.md` - LLM provider integrations
- `06-channels.md` - Channel integrations
- `07-extensions.md` - Extension/plugin system
- `08-skills.md` - Skills system
- `09-apps.md` - Mobile/desktop apps
- `10-config-memory.md` - Configuration and memory systems

## Exploration Phases (ALL COMPLETED)
1. **Phase 1**: Root structure and overview ✓
2. **Phase 2**: Core architecture (gateway, agents, sessions) ✓
3. **Phase 3**: Channel integrations deep dive ✓
4. **Phase 4**: Extension/plugin system ✓
5. **Phase 5**: Skills system ✓
6. **Phase 6**: Apps (iOS, Android, macOS) ✓
7. **Phase 7**: Configuration and memory systems ✓

## Key Directories
| Directory | Purpose |
|-----------|---------|
| `src/` | Main TypeScript source (48+ subdirectories) |
| `extensions/` | 29+ platform integrations |
| `skills/` | 50+ agent skills |
| `apps/` | iOS, Android, macOS native apps |
| `packages/` | Additional packages (clawdbot, moltbot) |
| `ui/` | Web-based UI |
| `vendor/` | Third-party code |
| `docs/` | Documentation source |

## Tech Stack
- **Language**: TypeScript (ES2022)
- **Runtime**: Node.js >= 22.12.0
- **Package Manager**: pnpm 10.23.0
- **Testing**: Vitest
- **Build**: TypeScript compiler
- **Deployment**: Docker, Fly.io

---

## Reference Design Extraction Project (COMPLETED 2026-02-07)

### Objective
Extract agent design patterns from the OpenClaw repository and re-implement them as educational Python reference designs. Each design demonstrates specific mechanisms, follows the `agent-boilerplate/templates/single_agent` template structure, runs as a Streamlit app, and is self-contained.

**Source**: `C:\Users\User_DAIP\Work\Transcribe\Code\openclaw\` (read-only reference)
**Boilerplate**: `C:\Users\User_DAIP\Work\Transcribe\Code\agent-boilerplate\templates\single_agent\`

### Deliverables

| Design | Path | Topics | Files |
|--------|------|--------|-------|
| `openclaw-agent` | `C:\Users\User_DAIP\Work\Transcribe\Code\openclaw-agent\` | Tool System, Tool Policy, Thinking Levels, Subagent Spawning | 34 |
| `a2ui-agent` | `C:\Users\User_DAIP\Work\Transcribe\Code\a2ui-agent\` | Agent-to-UI Data Visualization (A2UI JSONL protocol) | 37 |
| `agent-skills` | `C:\Users\User_DAIP\Work\Transcribe\Code\agent-skills\` | Skills Discovery, Eligibility Gating, Prompt Injection | 50+ plus 52 reference skills |

### Design 1: openclaw-agent
- **Tool Policy** — `SandboxToolPolicy` with allow/deny glob patterns, `TOOL_GROUPS`, `TOOL_PROFILES` (minimal/coding/messaging/full), layered resolution
- **Thinking Levels** — `ThinkLevel` enum (off→xhigh), normalization, LLM parameter adjustment, fallback downgrade
- **Subagent Spawning** — Isolated child agents with restricted tools, `SubagentRegistry`, result announcement
- 4 notebooks, architecture docs, Streamlit UI with sidebar controls

### Design 2: a2ui-agent
- **A2UI Protocol** — JSONL-based agent-to-UI communication with SurfaceUpdate, BeginRendering, DataModelUpdate, UserAction messages
- **Component Model** — Chart (line/bar/scatter/area/pie), Table, Text, Widget (dropdown/slider/date_range), Column/Row layout
- **A2UIBuilder** — Fluent Python API for constructing JSONL messages
- **Canvas Host** — Chart.js-based JS renderer + Streamlit native component bridge
- Excel data analysis workflow (read → chart → interact → update)
- 3 notebooks, protocol docs, Streamlit UI with file uploader and canvas

### Design 3: agent-skills
- **Skills Engine** — 7 modules: types, frontmatter, loader, eligibility, prompt_builder, env_overrides, status
- **Multi-source Discovery** — reference_skills (52 from OpenClaw) → bundled_skills (10 curated) → extra_dirs → user_skills
- **8-gate Eligibility** — explicit disable → allowlist → OS → always flag → bins → any_bins → env → config paths
- **Prompt Injection** — `<available_skills>` XML block, on-demand `read_skill` tool
- **Scoped Env Overrides** — Context manager for API key injection during agent runs
- 4 notebooks, format reference + architecture docs, Streamlit UI with skills status panel

### Shared Infrastructure (per design)
Each design contains its own copies of:
- `llm/llm_client.py` — ChatOpenAI with LLMaaS endpoint
- `config/loader.py` — YAML config + manifest tool resolution (extended per-design)
- `observability/logger.py` — TrajectoryLogger
- `observability/tracing.py` — Conditional OTEL spans
