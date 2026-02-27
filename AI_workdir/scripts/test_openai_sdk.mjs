import "dotenv/config";
import OpenAI from "openai";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

console.log(`Using model: ${model}`);
console.log(`Using baseUrl: ${baseUrl}`);

const client = new OpenAI({
  apiKey,
  baseURL: baseUrl,
});

const tools = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a file from disk",
      parameters: {
        type: "object",
        required: ["path"],
        properties: { path: { type: "string", description: "File path" } },
      },
      strict: false,
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files in a directory",
      parameters: {
        type: "object",
        required: ["dir"],
        properties: { dir: { type: "string", description: "Directory path" } },
      },
      strict: false,
    },
  },
];

// Test 1: Simple streaming with SDK (like pi-ai does)
console.log("\n=== Test 1: SDK streaming, simple message ===");
try {
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    store: false,
    max_completion_tokens: 16384,
    stream_options: { include_usage: true },
    messages: [{ role: "user", content: "Say hi in one word" }],
    tools,
  });
  let chunks = 0;
  for await (const chunk of stream) {
    chunks++;
    if (chunks === 1) {
      console.log(`  First chunk: ${JSON.stringify(chunk).slice(0, 120)}...`);
    }
  }
  console.log(`  ✓ OK — ${chunks} chunks`);
} catch (err) {
  console.log(`  ✗ FAIL: ${err.status} ${err.message?.slice(0, 200)}`);
}

// Test 2: SDK streaming with tool result messages (multi-turn)
console.log("\n=== Test 2: SDK streaming, multi-turn with tool results ===");
try {
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    store: false,
    max_completion_tokens: 16384,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: "You are a helpful coding assistant with access to file tools." },
      { role: "user", content: "What files are in the current directory?" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_abc123",
            type: "function",
            function: { name: "list_files", arguments: '{"dir":"."}' },
          },
        ],
      },
      {
        role: "tool",
        tool_call_id: "call_abc123",
        content: "file1.txt\nfile2.txt\nREADME.md\nsrc/\npackage.json",
      },
    ],
    tools,
  });
  let chunks = 0;
  for await (const chunk of stream) {
    chunks++;
    if (chunks === 1) {
      console.log(`  First chunk: ${JSON.stringify(chunk).slice(0, 120)}...`);
    }
  }
  console.log(`  ✓ OK — ${chunks} chunks`);
} catch (err) {
  console.log(`  ✗ FAIL: ${err.status} ${err.message?.slice(0, 200)}`);
}

// Test 3: SDK streaming, 3 sequential turns (simulate the "2 succeed, 3rd fails" pattern)
console.log("\n=== Test 3: SDK streaming, 3 sequential calls ===");
const messages = [
  { role: "system", content: "You are a helpful coding assistant. Be very brief." },
];

for (let turn = 1; turn <= 3; turn++) {
  messages.push({ role: "user", content: `Turn ${turn}: Say "ok ${turn}" and nothing else.` });
  try {
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      store: false,
      max_completion_tokens: 16384,
      stream_options: { include_usage: true },
      messages: [...messages],
      tools,
    });
    let text = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    }
    messages.push({ role: "assistant", content: text });
    console.log(`  ✓ Turn ${turn} OK: "${text.trim().slice(0, 60)}"`);
  } catch (err) {
    console.log(`  ✗ Turn ${turn} FAIL: ${err.status} ${err.message?.slice(0, 200)}`);
    break;
  }
}

// Test 4: SDK streaming, simulate tool-calling loop (the actual agent pattern)
console.log("\n=== Test 4: SDK tool-calling loop (5 turns) ===");
const msgs2 = [
  { role: "system", content: "You are a helpful coding assistant. When asked to read a file, use the read_file tool." },
  { role: "user", content: "Read file1.txt, then file2.txt, then file3.txt, then tell me what's in them." },
];

for (let turn = 1; turn <= 5; turn++) {
  try {
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      store: false,
      max_completion_tokens: 16384,
      stream_options: { include_usage: true },
      messages: [...msgs2],
      tools,
    });

    let assistantMsg = { role: "assistant", content: null, tool_calls: [] };
    let text = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) text += delta.content;
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!assistantMsg.tool_calls[tc.index]) {
            assistantMsg.tool_calls[tc.index] = { id: "", type: "function", function: { name: "", arguments: "" } };
          }
          const existing = assistantMsg.tool_calls[tc.index];
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.function.name += tc.function.name;
          if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
        }
      }
    }

    if (text) {
      // Model gave a text response (final answer)
      console.log(`  ✓ Turn ${turn} OK (text): "${text.trim().slice(0, 80)}"`);
      msgs2.push({ role: "assistant", content: text });
      break;
    } else if (assistantMsg.tool_calls.length > 0) {
      // Model made tool calls
      const callNames = assistantMsg.tool_calls.map(tc => tc.function.name).join(", ");
      console.log(`  ✓ Turn ${turn} OK (tool_calls: ${callNames})`);
      msgs2.push(assistantMsg);
      // Add fake tool results
      for (const tc of assistantMsg.tool_calls) {
        msgs2.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Contents of ${JSON.parse(tc.function.arguments || "{}").path || "file"}: Hello world line 1\nHello world line 2`,
        });
      }
    } else {
      console.log(`  ? Turn ${turn}: no content or tool calls`);
      break;
    }
  } catch (err) {
    console.log(`  ✗ Turn ${turn} FAIL: ${err.status} ${err.message?.slice(0, 300)}`);
    break;
  }
}

console.log("\nDone.");
