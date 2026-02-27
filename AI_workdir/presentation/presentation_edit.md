# OpenClaw — Technical Deep Dive

Slide-by-slide presentation content for Gemini Slides generation. Each slide section includes speaker notes and key talking points.

---

## Slide 1: Title Slide

### Title
**OpenClaw: Under the hood**

### Footer
Jeffrey Lee, AI Programme, March 2026

---

## Slide 2: What is OpenClaw?

### Headline
An agent that lives where you already work

### Content

**OpenClaw is an always-on AI agent that:**

- **Interfaces with devices and channels** — WhatsApp, Telegram, Discord, Slack, CLI, iOS, Android
- **Operates via your daily channels** — send a WhatsApp message, get an agent response
- **Persistent memory** — remembers your preferences, past decisions, project context across sessions
- **Performs tasks on your behalf** — reads/writes files, runs commands, searches the web, spawns background tasks

---

## Slide 3: Anecdote — Voice Message Reading

### Content

Summarise this in just 4-5 short sentences in point form to have a very concise slide:

The story of OpenClaw and its creator, Peter Steinberger, 

The anecdote you’re referring to is a perfect example of "emergent agency." Peter was on a weekend trip to Marrakesh, Morocco, in November 2025.

The "Voice Message" Anecdote
At the time, OpenClaw was still a rough prototype (which he famously "vibe-coded" in about an hour). Peter was using it via a WhatsApp integration he'd hacked together to help him find local restaurants and manage his schedule.

Without thinking, he sent the agent a voice message—a feature he hadn't actually programmed yet. To his surprise, the agent replied accurately. When Peter asked the agent how it was able to "hear" him, OpenClaw gave a step-by-step technical breakdown of its "resourceful" behavior:

File Identification: It inspected the incoming file header and identified it as an audio format.

Conversion: It used ffmpeg (which happened to be installed on Peter's machine) to convert the audio into a compatible format.

Workaround: It checked for a local installation of Whisper (OpenAI's transcription model) but found it was missing.

API Call: It then searched Peter's environment variables, found his OpenAI API key, and used a curl command to send the audio to OpenAI’s transcription endpoint.

Execution: Once it got the text back, it processed the request as usual.

Peter described this as the moment it "clicked" for him: "These things are damn smart, resourceful beasts if you actually give them the power."

**[PLACEHOLDER: Personal anecdote about voice message reading]**

---

## Slide 4: Key Concepts / Flow

### Headline
Session → Run → Stream → Event → Subscription

### Content

The agent loop's key concepts

Mention that there are a lot of living sessions across different channels, give this session store example, but summarise concisely: agent:main:telegram:12345 (specific Telegram user), The session store maps keys to session IDs. When a message arrives on the same channel/user, it resolves to the same key
   → same session ID → same JSONL file. So the main session is persistent and long-lived — it's effectively "always on"
  for that key.
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

Add in a sixth concept of state:  It's the mutable in-memory
  tracking object during a run: text buffers, pending tool calls, compaction status, think/final tag parsing. But it's
  ephemeral — reset between runs, never persisted.

---

## Slide 5: Tools, Skills, Commands (Tools)

### Tool Call Flow: 
standardise format for blocks in all three slides (tools, skills, commands), i.e. Step 0 (No LLM Call):, Step 1 (LLM Call):..

```
   User message arrives
          │
          ▼ LLM Call blocks are in green, no llm call blocks are in blue
   ┌──────────────────────────┐
   │ Step 0 (No LLM Call): Setup  
   | List tools   │ 
   │  in system prompt (how many? Are there a lot?)   │
   └──────┬───────────────────┘
          │ 
          ▼          
   ┌─────────────┐
   │  Step 1 (LLM Call): Select tool, emits json block   │
   │  { name: "exec", params: { command: "git status" } }
   │
   └──────┬──────┘
          │
          ▼  
   ┌─────────────┐
   │  Step 2 (No LLM Call): execute tool   │
   │  tool.execute(params)  │ ◀─── 
   │  returns { content: "On branch main\nnothing to commit" }     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Step 3 (LLM Call):  │
   │  LLM decides: another tool call, or text response? │ 
   └────────────┘
   
```

- Can just summarise tool policy in one line? maybe just give one example to illustrate what this policy is and for. Is it just for defining which tools can or cannot be called? Don't list the whole 9-layer cascade.
- Tools are frozen at run start — no dynamic injection
- Schema normalization flattens unions, strips unsupported keywords to save tokens -> not clear what this is about

### Tool Policy: 9-Layer Cascade - REMOVE

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

---

## Slide 6: Tools, Skills, Commands (Skills)

### Run Skill Flow

```
  ┌──────────────────────────────────────────────────┐
  │ Step 0 (no LLM call): Setup                       │
  │ Scan and filter SKILL.md files, list in system   |
  | prompt                                           │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 1 (LLM Call): Selects relevant skill, SKILL.md file,
  | select only one skill at a time?             │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 2 (No LLM call) : Read Tool Execution            │
  │ returns full SKILL.md content            │
  │ (frontmatter + instructions)                       │
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 3 (LLM Call): Follow SKILL.md Instructions          │
  │ LLM reads skill body: "Use gh CLI"             │
  | can there be multiple tool calls?, 
  | what else can be done here apart from selecting tool?
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 4 (No LLM Call): Tool(s?) execution + LLM Call #3+            │
  │ exec("gh auth status"),              │
  │   exec("gh issue create --title '...'")
  └─────────────────────┬────────────────────────────┘
                        │
  ┌─────────────────────▼────────────────────────────┐
  │ Step 5 (LLM Call): Generates response      │
  │ "Done — created GitHub issue #42."                 │
  └─────────────────────┬────────────────────────────┘
  ```

### Key Points
- Tools are pre-loaded, Skill body is never pre-loaded — LLM must explicitly `read` it

---

## Slide 7: Tools, Skills, Commands (Commands)

**Slash commands** (`/github create issue`) let the user force a specific skill, bypassing the LLM's selection step.

### Run Command Flow: Two Dispatch Modes
```
User types: /github create issue

        ┌─────────────────────────────────┐
        │ resolveSkillCommandInvocation() │
        │ Match "/github" to skill        │
        └────────────┬────────────────────┘
                     │
          ┌──────────┴──────────┐
          │   
    copy over tool        copy over skill run
    call cycle block     cycle blocks from step 3 to 5
    (step 2 only? since    for mode B
    no LLM calls)
    for mode A                  │
    ┌─────▼──────┐       ┌─────▼──────┐
    │  Mode A:    │       │  Mode B:    │
    │  Tool       │       │  Prompt     │
    │  Dispatch   │       │  Rewrite (Step 0? No LLM Call, Setup)    │
    │             │       │             │
    │  Step 2     │       │  Step 3 (LLM Call): LLM sees:  │
    │  (No LLM    │       │  "Use the   │
    │  Call):     |       |             |
    |             │       │  github     │
    │  Call tool  │       │  skill..."  │
    │  directly   │       │             │
    └─────────────┘       └─────────────┘
```

**Mode A (Tool Dispatch):** system calls the named tool directly. No LLM involved. what happens to the output though? are you sure there are no tools that require LLM responses? if it requires LLM response then it's a skill (mode B)?

**Mode B (Prompt Rewrite):** System rewrites user message to force the LLM to use the skill → same as normal skill flow but selection is predetermined. No 

- Slash commands and skills share the same SKILL.md files and eligibility filtering
- The difference is WHO picks the skill: LLM (skills) vs system (commands)
- Mode A is rare but powerful — completely bypasses the LLM for deterministic actions

---

## Slide 8: Subagents

### Subagent orchestation
- subagent created via sessions_spawn tool call
- each subagent has its own session
- subagent response injected to main agent's session as a new user message
- lane queuing to deconflict responses from multiple parallel subagent session lanes, main session (real user message) lane
- tool policy restrictions - subagents cannot access past session transcripts and memory 

### v2026.2.17 changes
- hierarchical subagent calling, max_depth of 2 (i.e. main agent -> subagent -> subagent) 
   - maxChildrenPerAgent — active children per session
   - maxConcurrent — global subagent lane cap
- kill subagent - Cascade kill with descendant cleanup
- steer subagent - Interrupt and redirect mid-execution

---

## Slide 9: Bootstrap

### Headline
- 8 Files That Give the Agent Its Identity Context - loaded into every prompt (always present) 
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

- if any file exceeds size limit (20k chars), 70% from head + 20% from tail are kept, with  truncation marker inserted: [...truncated, read XXX.md for full content...]

---


## Slide 10: Memory

### Memory write

 ┌───────────┬─────────────────┬─────────────────────────────┬────────────────────┬───────────────────────────────┐
  │  Writer   │     Trigger     │           Target            │      Content       │          Automatic?           │
  ├───────────┼─────────────────┼─────────────────────────────┼────────────────────┼───────────────────────────────┤
  │ Session   │ User creates new session │ memory/YYYY-MM-DD-{slug}.md │ Last 15 messages   │ Yes                           │
  │ hook      │                 │                             │ verbatim           │                               │
  ├───────────┼─────────────────┼─────────────────────────────┼────────────────────┼───────────────────────────────┤
  │ Memory    │ Token threshold │ memory/YYYY-MM-DD.md        │ Agent-chosen facts │ Semi (auto-triggered, agent   │
  │ flush     │  reached        │                             │                    │ decides content)              │
  ├───────────┼─────────────────┼─────────────────────────────┼────────────────────┼───────────────────────────────┤
  │ Agent     │ Agent's         │ MEMORY.md (usually)         │ Curated durable    │ No (agent initiative)         │
  │ writes    │ judgment        │                             │ facts              │                               │
  └───────────┴─────────────────┴─────────────────────────────┴────────────────────┴───────────────────────────────┘

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

---


## Slide 11: Memory

### Memory Search
- Hybrid Search: 0.7 vector + 0.3 BM25 keyword
- v2026.2.17 changes
  - Temporal Decay - weights recent information higher
  - MMR Re-Ranking - balances between relevancy and diversity (reduces semantic duplication)
  - New pipeline: keyword search → vector search → merge → temporal decay → MMR → sort
  - Full Text Search (FTS) via Query expansion if no embedding API key provided (no semantic search): **Example:** `"That thing we discussed about the API"` → strips curated stopwords "that", "thing", "we", "about", "the" → keywords: `["discussed", "API"]` 


---


## Slide 12: Sandbox

### Headline
Docker Isolation for Agent Execution

### Content

### Three Modes

| Mode | Who's Sandboxed | Use Case |
|------|-----------------|----------|
| `"off"` | Nobody | Development / trusted environments |
| `"non-main"` (default) | Subagents + secondary sessions | Production — main agent trusted, children isolated |
| `"all"` | Everyone including main | Maximum security |

### Three Access Levels in sandbox

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

---

## Slide 13: Hooks

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

---

## Slide 16: Q&A

### Headline
Questions?
