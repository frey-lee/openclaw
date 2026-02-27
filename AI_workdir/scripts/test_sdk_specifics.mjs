import "dotenv/config";
import OpenAI from "openai";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

const client = new OpenAI({ apiKey, baseURL: baseUrl });

async function test(label, params) {
  try {
    const stream = await client.chat.completions.create({ model, stream: true, ...params });
    let chunks = 0;
    let text = "";
    for await (const chunk of stream) {
      chunks++;
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    }
    console.log(`  ✓ ${label}: OK (${chunks} chunks, "${text.trim().slice(0, 50)}")`);
  } catch (err) {
    console.log(`  ✗ ${label}: ${err.status} — ${err.message?.slice(0, 200)}`);
  }
}

// ============================================================
// TEST 1: Assistant content as ARRAY vs STRING
// The pi-ai SDK sends assistant content as [{type: "text", text: "..."}]
// instead of a plain string. This is the key suspect.
// ============================================================
console.log("=== Test 1: Assistant content format ===\n");

const toolCallId = "call_test123";
const toolDef = [{
  type: "function",
  function: {
    name: "list_files",
    description: "List files",
    parameters: { type: "object", required: ["dir"], properties: { dir: { type: "string" } } },
    strict: false,
  },
}];

// 1a: Assistant content as STRING (normal)
await test("1a: assistant content=string", {
  messages: [
    { role: "user", content: "List files then summarize" },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: toolCallId, type: "function", function: { name: "list_files", arguments: '{"dir":"."}' } }],
    },
    { role: "tool", tool_call_id: toolCallId, content: "file1.txt\nfile2.txt" },
    { role: "assistant", content: "I found file1.txt and file2.txt." },
    { role: "user", content: "What else is there?" },
  ],
  tools: toolDef,
});

// 1b: Assistant content as ARRAY of content blocks (SDK format)
await test("1b: assistant content=array [{type:'text'}]", {
  messages: [
    { role: "user", content: "List files then summarize" },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: toolCallId, type: "function", function: { name: "list_files", arguments: '{"dir":"."}' } }],
    },
    { role: "tool", tool_call_id: toolCallId, content: "file1.txt\nfile2.txt" },
    { role: "assistant", content: [{ type: "text", text: "I found file1.txt and file2.txt." }] },
    { role: "user", content: "What else is there?" },
  ],
  tools: toolDef,
});

// 1c: Multiple tool call rounds with array content (closer to real agent)
const toolCallId2 = "call_test456";
await test("1c: two tool rounds, array content", {
  messages: [
    { role: "user", content: "Read file1.txt and file2.txt" },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: toolCallId, type: "function", function: { name: "list_files", arguments: '{"dir":"."}' } }],
    },
    { role: "tool", tool_call_id: toolCallId, content: "file1.txt\nfile2.txt" },
    { role: "assistant", content: [{ type: "text", text: "Found the files. Let me read them." }] },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: toolCallId2, type: "function", function: { name: "list_files", arguments: '{"dir":"./src"}' } }],
    },
    { role: "tool", tool_call_id: toolCallId2, content: "index.ts\napp.ts" },
    { role: "assistant", content: [{ type: "text", text: "Here are the src files." }] },
    { role: "user", content: "Summarize everything" },
  ],
  tools: toolDef,
});

// ============================================================
// TEST 2: Large system prompt + many tools (payload size)
// ============================================================
console.log("\n=== Test 2: Large payload ===\n");

// Generate a ~3000 token system prompt (similar to the real agent)
const bigSystemPrompt = [
  "You are a personal assistant running inside OpenClaw.",
  "",
  "## Tooling",
  "Tool availability (filtered by policy):",
  ...Array.from({ length: 25 }, (_, i) => `- tool_${i}: Description of tool ${i} that does something useful for the user`),
  "",
  "## Tool Call Style",
  "Default: do not narrate routine, low-risk tool calls (just call the tool).",
  "Narrate only when it helps: multi-step work, complex/challenging problems.",
  "",
  "## Workspace",
  "Your working directory is: C:\\Users\\User\\Work\\Project",
  "Treat this directory as the single global workspace for file operations.",
  "",
  "## Runtime",
  "Runtime: agent=default | host=DESKTOP | os=Windows (x64) | node=22.12.0 | model=gpt-5.2 | thinking=off",
  "Reasoning: off",
].join("\n");

// Generate 20 tool definitions with detailed schemas
const manyTools = Array.from({ length: 20 }, (_, i) => ({
  type: "function",
  function: {
    name: `tool_${i}`,
    description: `Tool ${i} that performs operation ${i} on the workspace. This tool reads, writes, or modifies files and directories as needed by the user.`,
    parameters: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string", description: `The path for tool_${i} to operate on` },
        recursive: { type: "boolean", description: "Whether to recurse into subdirectories" },
        pattern: { type: "string", description: "A glob pattern to filter results" },
        maxDepth: { type: "integer", description: "Maximum depth for recursion" },
      },
    },
    strict: false,
  },
}));

await test("2a: large system prompt + 20 tools", {
  messages: [
    { role: "system", content: bigSystemPrompt },
    { role: "user", content: "Hello, say hi briefly" },
  ],
  tools: manyTools,
  store: false,
  max_completion_tokens: 16384,
  stream_options: { include_usage: true },
});

// 2b: Large payload + multi-turn with tool results
await test("2b: large payload + tool turn + array content", {
  messages: [
    { role: "system", content: bigSystemPrompt },
    { role: "user", content: "List the files" },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: "call_big1", type: "function", function: { name: "tool_0", arguments: '{"path":"."}' } }],
    },
    { role: "tool", tool_call_id: "call_big1", content: "src/\npackage.json\nREADME.md\ntsconfig.json\n.env\nnode_modules/" },
    { role: "assistant", content: [{ type: "text", text: "I found the following files in the workspace." }] },
    { role: "user", content: "Now read the README" },
  ],
  tools: manyTools,
  store: false,
  max_completion_tokens: 16384,
  stream_options: { include_usage: true },
});

// ============================================================
// TEST 3: Custom headers (X-Initiator, etc.)
// ============================================================
console.log("\n=== Test 3: Custom headers ===\n");

const clientWithHeaders = new OpenAI({
  apiKey,
  baseURL: baseUrl,
  defaultHeaders: {
    "X-Initiator": "agent",
    "Openai-Intent": "conversation-edits",
  },
});

try {
  const stream = await clientWithHeaders.chat.completions.create({
    model,
    stream: true,
    messages: [{ role: "user", content: "Say hi" }],
  });
  let chunks = 0;
  for await (const chunk of stream) { chunks++; }
  console.log(`  ✓ 3a: custom headers: OK (${chunks} chunks)`);
} catch (err) {
  console.log(`  ✗ 3a: custom headers: ${err.status} — ${err.message?.slice(0, 200)}`);
}

console.log("\nDone.");
