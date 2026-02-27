import "dotenv/config";
import OpenAI from "openai";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

const client = new OpenAI({ apiKey, baseURL: baseUrl });

const tools = [{
  type: "function",
  function: {
    name: "read_file",
    description: "Read a file",
    parameters: { type: "object", required: ["path"], properties: { path: { type: "string" } } },
    strict: false,
  },
}];

async function makeCall(label) {
  try {
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      store: false,
      max_completion_tokens: 16384,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: "You are a helpful assistant. Be very brief." },
        { role: "user", content: `Say "${label}" and nothing else.` },
      ],
      tools,
    });
    let text = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    }
    console.log(`  ✓ ${label}: OK ("${text.trim().slice(0, 40)}")`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${label}: ${err.status} — ${err.message?.slice(0, 200)}`);
    return false;
  }
}

// Test 1: 2 concurrent calls
console.log("=== Test 1: 2 concurrent calls ===");
await Promise.all([makeCall("concurrent-1a"), makeCall("concurrent-1b")]);

// Test 2: 3 concurrent calls
console.log("\n=== Test 2: 3 concurrent calls ===");
await Promise.all([makeCall("concurrent-2a"), makeCall("concurrent-2b"), makeCall("concurrent-2c")]);

// Test 3: 5 concurrent calls
console.log("\n=== Test 3: 5 concurrent calls ===");
await Promise.all([
  makeCall("concurrent-3a"),
  makeCall("concurrent-3b"),
  makeCall("concurrent-3c"),
  makeCall("concurrent-3d"),
  makeCall("concurrent-3e"),
]);

// Test 4: Rapid sequential (no await between initiation)
console.log("\n=== Test 4: 5 rapid-fire sequential ===");
for (let i = 0; i < 5; i++) {
  await makeCall(`rapid-${i}`);
}

// Test 5: Mixed — 2 concurrent, then immediately 2 more concurrent
console.log("\n=== Test 5: 2 concurrent batches back-to-back ===");
await Promise.all([makeCall("batch1-a"), makeCall("batch1-b")]);
await Promise.all([makeCall("batch2-a"), makeCall("batch2-b")]);
await Promise.all([makeCall("batch3-a"), makeCall("batch3-b")]);

console.log("\nDone.");
