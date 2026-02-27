# OpenClaw — Technical Deep Dive

Slide-by-slide presentation content for Gemini Slides generation.

---

## Slide 1: Title Slide

**OpenClaw: Under the hood**

Jeffrey Lee, AI Programme, March 2026

---

## Slide 2: Introduction — What is OpenClaw?

An agent that lives where you already work.

**OpenClaw is an always-on AI agent that:**

- **Interfaces with devices and channels** — WhatsApp, Telegram, Discord, Slack, CLI, iOS, Android
- **Operates via your daily channels** — send a WhatsApp message, get an agent response
- **Persistent memory** — remembers your preferences, past decisions, project context across sessions
- **Performs tasks on your behalf** — reads/writes files, runs commands, searches the web, spawns background tasks

---

## Slide 3: Introduction — What is OpenClaw?

- Peter Steinberger "vibe-coded" OpenClaw in about an hour as a rough prototype with a WhatsApp integration
- On a weekend trip to Marrakesh, he sent the agent a voice message — a feature he hadn't programmed
- The agent replied accurately: it inspected the file header, used `ffmpeg` to convert the audio, found an OpenAI API key in his env vars, and called the transcription endpoint via `curl`
- Peter: "These things are damn smart, resourceful beasts if you actually give them the power."

---

## Slide 4: Key Concepts — The Agent Loop

Session → Run → Stream → Event → Subscription + State

```
┌───────────────────────────────────────────────────────────┐
│  SESSION                                                   │
│  Persistent conversation state (JSONL file on disk)        |
|  Many exist across different channels simultaneously       │
│  Survives across runs — the long-lived record              │
│                                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  RUN                                                   │ │
│  │  Single agent loop invocation within a session         │ │
│  │  User sends message → agent processes → responds       │ │
│  │  One active run per session at a time                  │ │
│  │                                                        │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │  STREAM                                           │ │ │
│  │  │  Incremental LLM response delivery (SSE)          │ │ │
│  │  │  Tokens arrive one at a time                      │ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐  │ │ │
│  │  │  │  EVENT                                      │  │ │ │
│  │  │  │  Discrete occurrence during streaming        │  │ │ │
│  │  │  │  message_start, text_delta, tool_start, ... │  │ │ │
│  │  │  └─────────────────────────────────────────────┘  │ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐  │ │ │
│  │  │  │  SUBSCRIPTION                               │  │ │ │
│  │  │  │  Event listener that processes events        │  │ │ │
│  │  │  │  Accumulates state, fires callbacks          │  │ │ │
│  │  │  └─────────────────────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  STATE (ephemeral, lives inside the run)               │ │
│  │  Mutable in-memory tracking: text buffers, pending     │ │
│  │  tool calls, compaction status, think/final tag         │ │
│  │  parsing. Reset between runs, never persisted.          │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## Slide 5: Tools

```
   User message arrives
          │
          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 0 (No LLM Call): Setup                       │
   │  List all available tools in system prompt          │
   │  (~30-40 tools in "full" profile)                   │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 1 (LLM Call): Select tool                    │
   │  LLM emits JSON tool_use block:                    │
   │  { name: "exec", params: { command: "git status" }}│
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 2 (No LLM Call): Execute tool                │
   │  tool.execute(params)                              │
   │  Returns { content: "On branch main..." }          │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 3 (LLM Call): Decide next action             │
   │  LLM decides: another tool call, or text response? │
   └────────────────────────────────────────────────────┘
```

- Tools are frozen at run start — no dynamic injection mid-run
- **Tool policy** filters which tools are available before each run (e.g. subagents are denied `memory_search`, `sessions_spawn`)

---

## Slide 6: Skills

A **skill** is a SKILL.md markdown file that teaches the agent how to accomplish a task using its existing tools. Skills are NOT tools — they're documentation the LLM reads on demand.

```
   ┌────────────────────────────────────────────────────┐
   │  Step 0 (No LLM Call): Setup                       │
   │  Scan disk for SKILL.md files → filter by           │
   │  eligibility → list names + descriptions in         │
   │  system prompt as <available_skills> XML             │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 1 (LLM Call): Skill selection                │
   │  LLM picks exactly one skill from the list         │
   │  LLM calls: read("~/.openclaw/skills/github/       │
   │    SKILL.md")                                       │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 2 (No LLM Call): Read tool execution         │
   │  Returns full SKILL.md content                     │
   │  (frontmatter + instructions)                       │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 3 (LLM Call): Follow SKILL.md instructions   │
   │  LLM reads skill body, then acts with full agency: │
   │  - Call one or more tools                           │
   │  - Generate text responses                          │
   │  - Ask the user clarifying questions                │
   │  e.g. exec("gh auth status"),                       │
   │       exec("gh issue create --title '...'")         │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 4 (No LLM Call): Tool(s) execution           │
   │  Each tool runs and returns results                 │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 5 (LLM Call): Generate response              │
   │  LLM may call more tools or produce final text     │
   │  "Done — created GitHub issue #42."                 │
   └────────────────────────────────────────────────────┘
```

- Only one skill selected at a time (system prompt enforces this)
- Skill body is never pre-loaded — LLM must explicitly `read` it
- After reading, the LLM has full agency — multiple tool calls, text, questions

---

## Slide 7: Slash Commands

**Slash commands** (`/github create issue`) let the user force a specific skill, bypassing the LLM's selection step.

```
   User types: /github create issue
          │
          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 0 (No LLM Call): Resolve command             │
   │  resolveSkillCommandInvocation()                    │
   │  Match "/github" to a SKILL.md                      │
   └──────────────────────┬─────────────────────────────┘
                          │
               ┌──────────┴──────────┐
               ▼                     ▼
   ┌──────────────────┐   ┌──────────────────────────┐
   │  Mode A:          │   │  Mode B:                  │
   │  Tool Dispatch    │   │  Prompt Rewrite           │
   └────────┬─────────┘   └────────────┬──────────────┘
            │                          │
            ▼                          ▼
```

**Mode A: Tool Dispatch (No LLM)**

```
   ┌────────────────────────────────────────────────────┐
   │  Step 1 (No LLM Call): Execute tool directly       │
   │  System calls the named tool with raw args          │
   │  tool.execute(args)                                 │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 2 (No LLM Call): Return result to user       │
   │  Tool result text shown directly — no LLM          │
   │  processing. Falls back to "Done." if empty.        │
   └────────────────────────────────────────────────────┘
```

Fully deterministic — no LLM involvement. If a command needs LLM-generated responses, it should use Mode B instead.

**Mode B: Prompt Rewrite (Uses LLM)**

Same as Skill flow (Slide 7) from Step 3 — but skill selection is predetermined by the command, not the LLM.

```
   ┌────────────────────────────────────────────────────┐
   │  Step 1 (No LLM Call): Rewrite user message        │
   │  System injects: "Use the github skill to:         │
   │  create issue"                                      │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │  Step 2 (LLM Call): Follow SKILL.md instructions   │
   │  (Same as Skill flow Steps 3-5)                    │
   │  LLM reads skill, calls tools, generates response   │
   └────────────────────────────────────────────────────┘
```

- Slash commands and skills share the same SKILL.md files and eligibility filtering
- The difference is WHO picks the skill: LLM (skills) vs system (commands)
- Mode A is rare — completely bypasses the LLM for deterministic actions

---

## Slide 8: Subagents

Orchestration
- Subagent created via `sessions_spawn` tool call
- Each subagent has its own session
- Subagent response injected to main agent's session as a new user message
- Lane queuing to deconflict responses from multiple parallel subagent sessions and the main session (real user messages)
- Tool policy restrictions — subagents cannot access past session transcripts and memory

v2026.2.17 Changes
- **Hierarchical subagent calling** — `max_depth: 2` (main → subagent → subagent):
  - `maxChildrenPerAgent`: Active children per session
  - `maxConcurrent`: Global subagent lane cap

- **New orchestration actions:**
  - `subagents kill <target>`: Cascade kill with descendant cleanup
  - `subagents steer <target>`: Interrupt and redirect mid-execution

---

## Slide 9: Bootstrap

8 files loaded into every prompt that give the agent its identity context:

| File           | Purpose                               | Subagent? |
|----------------|---------------------------------------|-----------|
| `AGENTS.md`    | Agent instructions, project rules     | Yes       |
| `TOOLS.md`     | Tool usage rules, constraints         | Yes       |
| `SOUL.md`      | Persona, tone, communication style    | No        |
| `IDENTITY.md`  | Agent name, version, branding         | No        |
| `USER.md`      | User preferences, timezone            | No        |
| `HEARTBEAT.md` | Periodic task instructions            | No        |
| `BOOTSTRAP.md` | Workspace setup, git conventions      | No        |
| `MEMORY.md`    | Persistent facts, learned preferences | No        |

- If any file exceeds 20K chars: 70% from head + 20% from tail are kept, with truncation marker: `[...truncated, read XXX.md for full content...]`

---

## Slide 10: Memory

Memory Write

| Writer       | Trigger                  | Target                        | Content               | Automatic?                           |
|--------------|--------------------------|-------------------------------|-----------------------|--------------------------------------|
| Session hook | User creates new session | `memory/YYYY-MM-DD-{slug}.md` | Last 15 messages      | Yes                                  |
| Memory flush | Token threshold reached  | `memory/YYYY-MM-DD.md`        | Agent-chosen facts    | Semi (auto-triggered, agent decides) |
| Agent writes | Agent's judgment         | `MEMORY.md` (usually)         | Curated durable facts | No (agent initiative)                |

```
workspace/
  ├─ MEMORY.md                ← agent curated
  ├─ memory/
  │  ├─ 2026-01-15-api.md     ← session hook
  │  ├─ 2026-02-01.md         ← memory flush
  │  └─ ...
  └─ SQLite database           ← chunks + embeddings + FTS5 index
```

---

## Slide 11: Memory

Memory Search
- Hybrid search: 0.7 vector (semantic) + 0.3 BM25 keyword (exact match)

- **v2026.2.17 changes:**
 - Temporal Decay: Weights recent information higher (older memories fade)
 - MMR Re-Ranking: Balances relevance and diversity (reduces semantic duplication)
 - New pipeline: keyword search → vector search → merge → temporal decay → MMR → sort
 - Query Expansion: FTS fallback if no embedding API key: strips stopwords, uses remaining, e.g. `"That thing we discussed about the API"` → strips stopwords → keywords: `["discussed", "API"]`

---

## Slide 12: Sandbox

Docker isolation for agent execution.

**Three modes:**

| Mode                    | Who's Sandboxed                | Use Case                                           |
|-------------------------|--------------------------------|----------------------------------------------------|
| `"off"`                 | Nobody                         | Development / trusted environments                 |
| `"non-main"` (default) | Subagents + secondary sessions | Production — main agent trusted, children isolated  |
| `"all"`                 | Everyone including main        | Maximum security                                   |

**Two directories:**
- `agentWorkspaceDir` — the real host project directory
- `sandboxWorkspaceDir` — an isolated directory initialized with seeded bootstrap files (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, etc.) and synced skills. The agent works here freely.

**Three access levels:**

```
"rw" (read-write):
  agentWorkspaceDir  ── bind mount rw ──▶  /workspace
  Agent reads + writes host project directly

"ro" (read-only):
  sandboxWorkspaceDir  ── bind mount rw ──▶  /workspace  (agent works here)
  agentWorkspaceDir    ── bind mount ro ──▶  /agent      (read-only reference)

"none" (no access):
  sandboxWorkspaceDir  ── bind mount rw ──▶  /workspace  (agent works here)
  (no host mount at all)
```

---

## Slide 13: Hooks


| Category               | Hook Points                                                  | Example                                |
|------------------------|--------------------------------------------------------------|----------------------------------------|
| **Agent Lifecycle**    | `before_agent_start`, `agent_end`                            | Inject git context before agent starts |
| **Tool Execution**     | `before_tool_call`, `after_tool_call`, `tool_result_persist` | Block dangerous `exec` commands        |
| **Session Lifecycle**  | `session_start`, `session_end`                               | Load user preferences on session start |
| **Context Management** | `before_compaction`, `after_compaction`, `agent:bootstrap`   | Add custom bootstrap files             |
| **Gateway**            | `gateway_start`, `gateway_stop`                              | Initialize external connections        |
| **CLI Commands**       | `command:new`, `command:reset`, `command:stop`               | Save session context on `/new`         |
| **Messaging**          | `message_received`, `message_sending`, `message_sent`        | URL shortening in outgoing messages    |

---

## Slide 14: Q&A

Questions?
