# OpenClaw — Technical Deep Dive

Slide-by-slide presentation content for Gemini Slides generation. Each slide section includes speaker notes and key talking points.

---

## Slide 1: Title Slide

### Title
**OpenClaw: Building an Agentic Platform**

### Subtitle
Architecture, Tools, Memory, and Subagents

### Footer
Technical Deep Dive — February 2026

### Speaker Notes
- Introduction to OpenClaw as an open-source agentic platform
- Focus on architecture and how things actually work under the hood
- Not a product demo — this is for engineers who want to understand the internals

---

## Slide 2: What is OpenClaw?

### Headline
An agent that lives where you already work

### Content

**OpenClaw is an agentic platform** — not just a chatbot. It's an always-on AI agent that:

- **Interfaces with devices and channels** — WhatsApp, Telegram, Discord, Slack, CLI, iOS, Android
- **Operates via your daily channels** — send a WhatsApp message, get an agent response
- **Has access to persistent memory** — remembers your preferences, past decisions, project context across sessions
- **Executes tools** — reads/writes files, runs commands, searches the web, spawns background tasks
- **Runs skills** — follows structured "recipe cards" (SKILL.md files) for complex workflows like GitHub PRs, code review, documentation

### Key Framing

Think of it as a **personal engineer** that:
1. You talk to through WhatsApp/Telegram/CLI
2. Has access to your codebase and tools
3. Remembers what you discussed last week
4. Can delegate work to background subagents
5. Runs inside a sandboxed Docker container for safety

### Diagram Concept

```
┌─────────────────────────────────────────────────┐
│                    OpenClaw                       │
│                                                   │
│  ┌─────────┐   ┌──────────┐   ┌──────────────┐  │
│  │ Channels │   │  Agent   │   │    Tools     │  │
│  │          │──▶│  Loop    │──▶│  & Skills    │  │
│  │ WhatsApp │   │          │   │              │  │
│  │ Telegram │   │ LLM call │   │ exec, read,  │  │
│  │ Discord  │   │ ────▶    │   │ write, spawn │  │
│  │ CLI      │   │ tools    │   │ memory, web  │  │
│  │ iOS/Droid│   │ ────▶    │   │              │  │
│  └─────────┘   │ response  │   └──────────────┘  │
│                 └──────────┘                      │
│                      │                            │
│                 ┌────┴────┐                       │
│                 │ Memory  │                       │
│                 │ MEMORY.md + SQLite + search     │
│                 └─────────┘                       │
└─────────────────────────────────────────────────┘
```

### Speaker Notes
- OpenClaw is open source (GitHub: openclaw)
- The key insight: it's a *platform*, not a single chatbot
- Multi-channel: same agent, different interfaces
- The agent has genuine autonomy — it decides which tools to use, when to search memory, when to delegate

---

## Slide 3: Anecdote — Voice Message Reading

### Headline
"Read me what David sent"

### Content

**[PLACEHOLDER: Personal anecdote about voice message reading]**

A real-world example of using OpenClaw through WhatsApp:
- User receives a voice message from a colleague
- User sends it to OpenClaw: "What did David say?"
- OpenClaw transcribes the audio, summarizes the content, and responds
- All via the same WhatsApp thread they use for everything else

### Why This Matters
- Zero friction — no new app, no context switching
- The agent meets you where you already are
- Shows the channel-agnostic nature: same agent, different frontends

### Speaker Notes
- Fill in with personal anecdote
- The point: agentic interfaces don't need to be fancy UIs
- Sometimes the best interface is the one you already have open

---

## Slide 4: Key Concepts / Flow

### Headline
Session → Run → Stream → Event → Subscription

### Content

The agent loop has five layers, from persistent to ephemeral:

```
┌──────────────────────────────────────────────────────────┐
│  SESSION                                                  │
│  Persistent conversation state (JSONL file on disk)       │
│  Survives across runs — the long-lived record             │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │  RUN                                                  ││
│  │  Single agent loop invocation within a session        ││
│  │  User sends message → agent processes → responds      ││
│  │  One active run per session at a time                 ││
│  │                                                       ││
│  │  ┌──────────────────────────────────────────────────┐││
│  │  │  STREAM                                          │││
│  │  │  Incremental LLM response delivery (SSE)         │││
│  │  │  Tokens arrive one at a time                     │││
│  │  │                                                  │││
│  │  │  ┌──────────────────────────────────────────────┐│││
│  │  │  │  EVENT                                       ││││
│  │  │  │  Discrete occurrence during streaming         ││││
│  │  │  │  message_start, text_delta, tool_start, ...  ││││
│  │  │  └──────────────────────────────────────────────┘│││
│  │  │                                                  │││
│  │  │  ┌──────────────────────────────────────────────┐│││
│  │  │  │  SUBSCRIPTION                                ││││
│  │  │  │  Event listener that processes events         ││││
│  │  │  │  Accumulates state, fires callbacks           ││││
│  │  │  └──────────────────────────────────────────────┘│││
│  │  └──────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Also: Attempt

A sixth concept bridges run and stream:

- **Attempt** — a single try at calling the LLM. A run may have multiple attempts if auto-compaction triggers (context overflow → summarize → retry).

### Speaker Notes
- Session = the conversation file (JSONL, tree structure)
- Run = one invocation of the agent loop
- Stream = SSE connection to the LLM
- Events = typed occurrences (text_delta, tool_start, etc.)
- Subscription = the watcher that captures and processes events
- Only one run active per session — queuing enforced by the gateway
- Sessions survive forever; runs are ephemeral

---

## Slide 5: Tools

### Headline
How the Agent Takes Action

### Content

**Tools are fixed at run start.** They don't change mid-conversation. The LLM sees all tool definitions (name, description, JSON Schema) in its context and decides which to call.

### The Tool Call Cycle

```
   User message arrives
          │
          ▼
   ┌─────────────┐
   │   LLM sees   │
   │  all tools   │ ◀─── tool definitions in context
   │  in prompt   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  LLM emits   │
   │  tool_use    │ ◀─── { name: "exec", params: { command: "git status" } }
   │  block       │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Framework   │
   │  dispatches  │ ◀─── tool.execute(params)
   │  to tool     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Tool runs   │
   │  returns     │ ◀─── { content: "On branch main\nnothing to commit" }
   │  result      │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Result fed  │
   │  back to LLM │ ◀─── appended to transcript as toolResult
   └──────┬──────┘
          │
          ▼
   LLM decides: another tool call, or text response?
```

### Tool Policy: 9-Layer Cascade

Every tool passes through 9 filter layers before reaching the LLM:

1. Profile (minimal/coding/messaging/full)
2. Provider-specific profile
3. Global allow/deny
4. Global provider policy
5. Agent-specific allow/deny
6. Agent provider policy
7. Channel/group policy
8. Sandbox policy
9. Subagent deny list

### Speaker Notes
- Tools are frozen at run start — no dynamic injection
- The 9-layer policy cascade is the primary way tools are scoped
- Deny always wins over allow
- Each tool definition consumes tokens — policy filtering keeps the set lean
- Schema normalization flattens unions, strips unsupported keywords to save tokens

---

## Slide 6: Skills

### Headline
"Recipe Cards" the Agent Reads and Follows

### Content

A **skill** is a SKILL.md markdown file that teaches the agent how to accomplish a task using its existing tools. Skills are NOT tools — they're documentation the LLM reads on demand.

### What Happens When a Skill Runs

```
  ┌──────────────────────────────────────────────────┐
  │ Step 0: Setup (no LLM call)                       │
  │ Scan disk for SKILL.md files → filter by          │
  │ eligibility → inject env vars → build             │
  │ <available_skills> XML in system prompt            │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 1: LLM Call #1 — Skill Selection             │
  │ LLM sees skill names + descriptions               │
  │ LLM decides: "github skill applies"               │
  │ LLM responds: read("~/.openclaw/skills/github/    │
  │   SKILL.md")                                       │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 2: Tool Execution (no LLM call)              │
  │ read tool returns full SKILL.md content            │
  │ (frontmatter + instructions)                       │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 3: LLM Call #2 — Follow Instructions          │
  │ LLM reads skill body: "Use gh CLI"                │
  │ LLM responds: exec("gh auth status"),              │
  │   exec("gh issue create --title '...'")            │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 4-5: Tool execution + LLM Call #3+            │
  │ Tools return results → LLM generates response      │
  │ "Done — created GitHub issue #42."                 │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 6: Cleanup (no LLM call)                      │
  │ Undo env var overrides                             │
  └──────────────────────────────────────────────────┘
```

### Key Points
- Minimum 3 LLM calls per skill (decide + act + respond)
- Skill body is never pre-loaded — LLM must explicitly `read` it
- 8-gate eligibility filter: enabled, allowlist, OS, always, bins, anyBins, env, config
- Skills are discovered from 4 directories (extra < bundled < managed < workspace)

### Speaker Notes
- Skills are documentation, not code
- The LLM reads and follows them like a recipe
- No subagent spawned — the main agent does everything
- The skill is not cached across sessions — rebuilt from disk every time

---

## Slide 7: Slash Commands

### Headline
Explicit Invocation — Bypassing the LLM's Choice

### Content

**Slash commands** (`/github create issue`) let the user force a specific skill, bypassing the LLM's selection step.

### Two Dispatch Modes

```
User types: /github create issue

        ┌─────────────────────────────────┐
        │ resolveSkillCommandInvocation() │
        │ Match "/github" to skill        │
        └────────────┬────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐       ┌─────▼──────┐
    │  Mode A:    │       │  Mode B:    │
    │  Tool       │       │  Prompt     │
    │  Dispatch   │       │  Rewrite    │
    │             │       │             │
    │  No LLM     │       │  LLM sees:  │
    │  call!      │       │  "Use the   │
    │             │       │  github     │
    │  Call tool  │       │  skill..."  │
    │  directly   │       │             │
    └─────────────┘       └─────────────┘
```

**Mode A (Tool Dispatch):** Frontmatter has `command-dispatch: tool` → system calls the named tool directly. No LLM involved. Fast, deterministic.

**Mode B (Prompt Rewrite):** System rewrites user message to force the LLM to use the skill → same as normal skill flow but selection is predetermined.

### Speaker Notes
- Slash commands and skills share the same SKILL.md files and eligibility filtering
- The difference is WHO picks the skill: LLM (skills) vs system (commands)
- Mode A is rare but powerful — completely bypasses the LLM for deterministic actions

---

## Slide 8: Subagents — Architecture

### Headline
Background Agents for Parallel Work

### Content

Subagents are background runs spawned by the main agent. The main agent calls `sessions_spawn`, and a child executes in isolation with a restricted tool set.

### Spawning Flow

```
Main Agent: "Spawn 3 analysis tasks"
    │
    ├── sessions_spawn({ task: "Analyze gateway" })
    │       │
    │       ├─ Security: Is caller a subagent? → deny
    │       ├─ Depth: callerDepth < maxSpawnDepth? → allow
    │       ├─ Capacity: children < maxChildrenPerAgent?
    │       ├─ Auth: Cross-agent? Check allowAgents
    │       ├─ Model: resolve from config chain
    │       ├─ System prompt: buildSubagentSystemPrompt()
    │       ├─ Tool policy: hard deny list applied
    │       └─ Gateway: callGateway(lane: "subagent")
    │
    ├── sessions_spawn({ task: "Analyze memory" })
    │       └─ ... (same flow)
    │
    └── sessions_spawn({ task: "Analyze tools" })
            └─ ... (same flow)
```

### Tool Restrictions (Subagent Deny List)

| Denied | Reason |
|--------|--------|
| `sessions_spawn` | No recursive spawning (depth limit enforced separately) |
| `sessions_list/history/send` | Main agent orchestrates |
| `session_status` | Main agent coordinates |
| `gateway`, `agents_list` | System-level risk |
| `cron` | Scheduling stays with main |
| `memory_search/get` | Pass context in prompt instead |

### Speaker Notes
- Subagents are fire-and-forget from the main agent's perspective
- Results auto-announce back as user messages
- Lane-based queuing: main lane, subagent lane, separate
- Gateway enforces one active run per session — announcements queue

---

## Slide 9: Subagents — v2026.2.17 Enhancements

### Headline
From One-Level to Full Orchestration

### Content

### Hierarchical Spawning (New)

```
Depth 0: Main Agent
         ├── Depth 1: Subagent A (orchestrator)
         │       ├── Depth 2: Sub-subagent A1 (leaf)
         │       └── Depth 2: Sub-subagent A2 (leaf)
         └── Depth 1: Subagent B (leaf)
```

- `maxSpawnDepth: 2` enables nesting
- Orchestrators (depth < max) can spawn children
- Leaves (depth = max) cannot

### New Orchestration Tool (678 lines)

| Action | What It Does |
|--------|-------------|
| `subagents list` | Show active + recent subagents |
| `subagents kill <target>` | Cascade kill with descendant cleanup |
| `subagents steer <target> <msg>` | Interrupt and redirect mid-execution |

### Steer Mechanism

```
steer "research-agent" "Focus on authentication instead"
  │
  ├─ Mark original run as steer-restart
  ├─ Abort current execution
  ├─ Wait 5s for graceful settle
  ├─ Launch replacement run with new message
  └─ Track both run IDs
```

### Announce Delivery Resilience

```
Subagent completes → Direct delivery → (fail?) → Queue → (fail?) → Retry (3x, exponential backoff) → Give up after 5 min
```

### Speaker Notes
- v2026.2.17 makes subagents a real orchestration primitive
- Steer is the killer feature — redirect work without killing/restarting
- Cascade kill prevents orphaned sub-subagents
- Announce retry handles transient gateway failures

---

## Slide 10: Memory — How It Works

### Headline
Hybrid Search: Vectors + Keywords

### Content

### Storage

```
workspace/
  ├─ MEMORY.md              ← curated facts (always in system prompt)
  ├─ memory/
  │  ├─ 2026-01-15-api.md   ← auto-saved session summaries
  │  ├─ 2026-02-01.md       ← daily notes
  │  └─ ...
  └─ SQLite database         ← chunks + embeddings + FTS5 index
```

### Hybrid Search Pipeline

```
Query: "How did we handle authentication?"
         │
         ├──────────────────────────────┐
         ▼                              ▼
   Vector Search                  Keyword Search
   (embed query →                 (FTS5 → BM25
    cosine similarity)             relevance)
         │                              │
         ▼                              ▼
   Vector candidates             BM25 candidates
   (4× max results)              (4× max results)
         │                              │
         └──────────┬───────────────────┘
                    ▼
              Merge & Rank
    score = (vector × 0.7) + (BM25 × 0.3)
                    │
                    ▼
    Filter: score ≥ 0.35, take top 6
```

### Progressive Building

1. **Bootstrap:** `MEMORY.md` loaded into every prompt (always present)
2. **Session hook:** auto-saves session context when user starts `/new`
3. **Memory flush:** pre-compaction mechanism — agent saves facts before context summarization
4. **Agent writes:** agent writes to `MEMORY.md` or `memory/` during normal operation

### Speaker Notes
- 70% vector (semantic meaning) + 30% keyword (exact match)
- 4x candidate multiplier ensures good coverage before merging
- Memory tools denied to subagents — main agent passes context in spawn prompt
- Embedding providers: OpenAI, Gemini, Local (GGUF), Voyage AI

---

## Slide 11: Memory — v2026.2.17 Enhancements

### Headline
QMD Backend, Temporal Decay, MMR Re-Ranking

### Content

### QMD: Alternative Memory Backend

| Feature | Built-in (SQLite) | QMD |
|---------|-------------------|-----|
| Embedding provider | Required (API key) | Built-in (auto-downloads) |
| Search engine | Custom hybrid merge | BM25 + vectors + reranking |
| Runtime | In-process | External sidecar (Bun) |
| File management | OpenClaw manages | QMD manages |

### Temporal Decay

Older memories fade:

```
Score × exp(−λ × age_days)     where λ = ln(2) / halfLife

halfLife = 30 days:
  Today:      100% score
  15 days:     71% score
  30 days:     50% score
  60 days:     25% score
  90 days:     12% score
```

Evergreen files (`MEMORY.md`) are exempt — always full score.

### MMR Re-Ranking (Diversity)

Prevents redundant chunks:

```
MMR score = λ × relevance − (1−λ) × max_similarity_to_already_selected

λ = 0.7 (default):  balance relevance + diversity
λ = 1.0:            pure relevance (no diversity)
λ = 0.0:            pure diversity (ignore relevance)
```

Uses Jaccard similarity on token sets.

### New Pipeline

```
keyword search → vector search → merge → temporal decay → MMR → sort
```

### Speaker Notes
- QMD is a compelling alternative for users who don't want to manage API keys
- Temporal decay is opt-in (disabled by default)
- MMR addresses the common complaint of "I get 6 results from the same paragraph"
- Also new: Voyage AI embeddings, query expansion for FTS-only mode, citations

---

## Slide 12: Memory — Architecture Diagram

### Headline
The Complete Memory Pipeline

### Content

```
                ┌──────────────────────────────┐
                │       Agent Tools             │
                │  memory_search  memory_get    │
                └──────────┬───────────────────┘
                           │
                ┌──────────▼───────────────────┐
                │   MemorySearchManager         │
                │   (unified interface)          │
                │                               │
                │  ┌─────────┐  ┌────────────┐ │
                │  │ Built-in│  │    QMD     │ │
                │  │ (SQLite)│  │ (sidecar)  │ │
                │  └────┬────┘  └─────┬──────┘ │
                │       │             │         │
                │  FallbackMemoryManager        │
                │  (QMD fails → built-in)       │
                └──────────────────────────────┘
                           │
                ┌──────────▼───────────────────┐
                │   Hybrid Search               │
                │                               │
                │  Vector ──┐  ┌── Keyword      │
                │  (embed)  │  │  (FTS5/BM25)   │
                │           ▼  ▼                │
                │       Merge & Rank             │
                │           │                    │
                │    Temporal Decay (optional)   │
                │           │                    │
                │    MMR Re-Ranking (optional)   │
                └──────────────────────────────┘
                           │
                ┌──────────▼───────────────────┐
                │   Indexing Pipeline            │
                │                               │
                │  Files → Chunking (400 tok)   │
                │  → Hash check → Embed         │
                │  → SQLite (chunks + FTS5      │
                │    + sqlite-vec)              │
                │                               │
                │  Providers: OpenAI, Gemini,   │
                │  Local (GGUF), Voyage AI      │
                └──────────────────────────────┘
```

### Speaker Notes
- The MemorySearchManager interface makes backends swappable
- FallbackMemoryManager auto-falls back from QMD to built-in on subprocess failure
- The indexing pipeline is shared between both backends (for built-in)
- QMD manages its own indexing externally

---

## Slide 13: Sandbox

### Headline
Docker Isolation for Agent Execution

### Content

### Three Modes

| Mode | Who's Sandboxed | Use Case |
|------|-----------------|----------|
| `"off"` | Nobody | Development / trusted environments |
| `"non-main"` (default) | Subagents + secondary sessions | Production — main agent trusted, children isolated |
| `"all"` | Everyone including main | Maximum security |

### Three Access Levels

```
"rw" (read-write):
  Host /project  ───── rw mount ────▶  /workspace
  Agent reads + writes directly

"ro" (read-only):
  ~/.openclaw/sandboxes/  ── rw ──▶  /workspace  (agent works here)
  Host /project           ── ro ──▶  /agent      (read-only reference)

"none" (no access):
  ~/.openclaw/sandboxes/  ── rw ──▶  /workspace  (agent works here)
  (no host mount at all)
```

### Container Hardening

- `readOnlyRoot: true` — immutable base filesystem
- `capDrop: ["ALL"]` — minimal Linux capabilities
- `tmpfs: /tmp, /var/tmp` — ephemeral temp dirs
- Memory/CPU/PID limits — resource exhaustion prevention
- No symlink traversal — `assertSandboxPath` walks every path component

### Speaker Notes
- The default mode ("non-main") is the sweet spot: main agent has full access, but spawned subagents are sandboxed
- Path security is layered: path resolution + escape detection + symlink check
- Exec tool defaults to "deny" security in sandbox (all commands need approval)
- PTY disabled in sandbox — Docker exec doesn't reliably support it

---

## Slide 14: Hooks

### Headline
"When X Happens, Also Do Y"

### Content

### 7 Categories, ~20 Hook Points

| Category | Hook Points | Example |
|----------|-------------|---------|
| **Agent Lifecycle** | `before_agent_start`, `agent_end` | Inject git context before agent starts |
| **Tool Execution** | `before_tool_call`, `after_tool_call`, `tool_result_persist` | Block dangerous `exec` commands |
| **Session Lifecycle** | `session_start`, `session_end` | Load user preferences on session start |
| **Context Management** | `before_compaction`, `after_compaction`, `agent:bootstrap` | Add custom bootstrap files |
| **Gateway** | `gateway_start`, `gateway_stop` | Initialize external connections |
| **CLI Commands** | `command:new`, `command:reset`, `command:stop` | Save session context on `/new` |
| **Messaging** | `message_received`, `message_sending`, `message_sent` | URL shortening in outgoing messages |

### Three Execution Strategies

| Strategy | Behavior | Example |
|----------|----------|---------|
| `runVoidHook` | All handlers in parallel, fire-and-forget | `agent_end` |
| `runModifyingHook` | One at a time, priority-ordered, can modify | `before_agent_start` |
| `runToolResultPersist` | Synchronous only (hot path) | `tool_result_persist` |

### Key Design Choice
Hooks **never block execution**. If a hook fails, the error is logged but the agent continues.

### Speaker Notes
- Two hook systems: plugin hooks (external add-ons) and internal hooks (modules talking to each other)
- `before_agent_start` is the most powerful — can inject context into the prompt
- `tool_result_persist` is special: synchronous only, on the hot path of every tool call
- Hooks have priority ordering — higher priority runs first for modifying hooks

---

## Slide 15: Bootstrap

### Headline
8 Files That Give the Agent Its Identity

### Content

### Bootstrap File Types

| File | Purpose | Subagent? |
|------|---------|-----------|
| `AGENTS.md` | Agent instructions, project rules | Yes |
| `TOOLS.md` | Tool usage rules, constraints | Yes |
| `SOUL.md` | Persona, tone, communication style | No |
| `IDENTITY.md` | Agent name, version, branding | No |
| `USER.md` | User preferences, timezone | No |
| `HEARTBEAT.md` | Periodic task instructions | No |
| `BOOTSTRAP.md` | Workspace setup, git conventions | No |
| `MEMORY.md` | Persistent facts, learned preferences | No |

### Loading Pipeline

```
Step 0: Load files from disk (8 file types)
          │
Step 1: Filter for session type
          │   (subagent? → keep only AGENTS.md + TOOLS.md)
          │
Step 2: Apply hook overrides (plugins can add/modify/remove)
          │
Step 3: Truncate (70% head + 20% tail if > 20K chars)
          │
Step 4: Check workspace notes (BOOTSTRAP.md present?)
          │
Step 5: Inject into system prompt as "# Project Context"
```

### Speaker Notes
- Subagents only get AGENTS.md + TOOLS.md — keeps prompts lean, prevents context leakage
- Truncation preserves head (usually rules/identity) and tail (usually recent additions)
- Each file truncated independently to 20K chars
- The agent can always `read` the full file if it needs the middle
- SOUL.md gets special treatment: "embody its persona and tone"

---

## Slide 16: Q&A

### Headline
Questions?

### Content

### Resources
- **GitHub:** github.com/openclaw
- **Design Docs:** `design_docs/` in openclaw-agent repository
- **Architecture Reference:** `AI_workdir/references/` in openclaw repository

### Key Docs by Topic
| Topic | Design Doc |
|-------|-----------|
| Memory | `design_docs/memory.md` |
| Subagents | `design_docs/subagents.md` |
| Tools | `design_docs/tools.md` |
| Skills | `design_docs/skills.md` |
| Sandbox | `design_docs/sandbox.md` |
| Hooks | `design_docs/hooks.md` |
| Bootstrap | `design_docs/bootstrap.md` |
| Session Management | `design_docs/session-management.md` |
| System Prompt | `design_docs/system-prompt.md` |
| Error Handling | `design_docs/error-handling.md` |
| Event Subscription | `design_docs/event-subscription.md` |

### Speaker Notes
- Thank the audience
- Open for questions
- Point to design docs for deep dives
