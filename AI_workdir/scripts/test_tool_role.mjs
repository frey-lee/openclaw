import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = "gpt-4o";

async function test(label, body) {
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 200) {
      const text = await res.text();
      console.log(`  ✓ ${label}: ${res.status} OK`);
      console.log(`    First 120 chars: ${text.slice(0, 120)}`);
    } else {
      const text = await res.text();
      console.log(`  ✗ ${label}: ${res.status} FAIL`);
      console.log(`    Body: ${text.slice(0, 300) || "(empty)"}`);
    }
  } catch (err) {
    console.log(`  ✗ ${label}: ERROR ${err.message}`);
  }
}

// Simulate a conversation after a tool call:
// 1. user asks something
// 2. assistant responds with a tool_call
// 3. tool result comes back with role: "tool"
// 4. we ask the model to continue

const toolCallId = "call_abc123";

console.log("=== Test: Messages with role: tool ===\n");

await test("With role:tool message", {
  model,
  messages: [
    { role: "user", content: "What files are in the current directory?" },
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: toolCallId,
          type: "function",
          function: {
            name: "list_files",
            arguments: JSON.stringify({ path: "." }),
          },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: toolCallId,
      content: "file1.txt\nfile2.txt\nREADME.md",
    },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "list_files",
        description: "List files in a directory",
        parameters: {
          type: "object",
          required: ["path"],
          properties: { path: { type: "string" } },
        },
      },
    },
  ],
});

console.log("");

await test("Without role:tool (baseline)", {
  model,
  messages: [
    { role: "user", content: "What files are in the current directory?" },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "list_files",
        description: "List files in a directory",
        parameters: {
          type: "object",
          required: ["path"],
          properties: { path: { type: "string" } },
        },
      },
    },
  ],
});
