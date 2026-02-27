import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;

if (!apiKey) {
  console.error("LLMAAS_API_KEY not set");
  process.exit(1);
}

async function test(label, model, extraFields = {}) {
  try {
    const body = {
      model,
      stream: true,
      messages: [{ role: "user", content: "Say hi in one word" }],
      ...extraFields,
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const status = res.status;
    if (status === 200) {
      // Consume just enough to confirm it's streaming
      const text = await res.text();
      const firstLine = text.split("\n")[0];
      console.log(`  ✓ ${label}: ${status} OK (first chunk: ${firstLine.slice(0, 80)}...)`);
    } else {
      const text = await res.text();
      console.log(`  ✗ ${label}: ${status} FAIL`);
      console.log(`    Body: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.log(`  ✗ ${label}: ERROR ${err.message}`);
  }
}

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
];

// ── Part A: gpt-4o tests ──
console.log("=== Part A: gpt-4o ===");
console.log("\n[A1] Minimal params:");
await test("gpt-4o minimal", "gpt-4o");

console.log("\n[A2] With max_tokens (documented param):");
await test("gpt-4o max_tokens=1000", "gpt-4o", { max_tokens: 1000 });

console.log("\n[A3] With max_completion_tokens (SDK sends this):");
await test("gpt-4o max_completion_tokens=16384", "gpt-4o", { max_completion_tokens: 16384 });

console.log("\n[A4] With store: false (SDK sends this):");
await test("gpt-4o store=false", "gpt-4o", { store: false });

console.log("\n[A5] With stream_options (SDK sends this):");
await test("gpt-4o stream_options", "gpt-4o", { stream_options: { include_usage: true } });

console.log("\n[A6] With tools:");
await test("gpt-4o tools", "gpt-4o", { tools });

console.log("\n[A7] Full SDK params (all combined):");
await test("gpt-4o full SDK", "gpt-4o", {
  max_completion_tokens: 16384,
  store: false,
  stream_options: { include_usage: true },
  tools,
});

// ── Part B: gpt-5.2 tests ──
console.log("\n\n=== Part B: gpt-5.2 ===");
console.log("\n[B1] Minimal params:");
await test("gpt-5.2 minimal", "gpt-5.2");

console.log("\n[B2] With max_tokens (documented param):");
await test("gpt-5.2 max_tokens=1000", "gpt-5.2", { max_tokens: 1000 });

console.log("\n[B3] With max_completion_tokens (SDK sends this):");
await test("gpt-5.2 max_completion_tokens=16384", "gpt-5.2", { max_completion_tokens: 16384 });

console.log("\n[B4] With store: false (SDK sends this):");
await test("gpt-5.2 store=false", "gpt-5.2", { store: false });

console.log("\n[B5] With stream_options (SDK sends this):");
await test("gpt-5.2 stream_options", "gpt-5.2", { stream_options: { include_usage: true } });

console.log("\n[B6] With tools:");
await test("gpt-5.2 tools", "gpt-5.2", { tools });

console.log("\n[B7] Full SDK params (all combined):");
await test("gpt-5.2 full SDK", "gpt-5.2", {
  max_completion_tokens: 16384,
  store: false,
  stream_options: { include_usage: true },
  tools,
});

// ── Part C: Sequential calls (test "2 work, 3rd fails" pattern) ──
console.log("\n\n=== Part C: Sequential gpt-4o calls (5x) ===");
for (let i = 1; i <= 5; i++) {
  await test(`gpt-4o call #${i}`, "gpt-4o", {
    max_completion_tokens: 16384,
    store: false,
    stream_options: { include_usage: true },
    tools,
  });
}

console.log("\n\n=== Part D: Sequential gpt-5.2 calls (5x) ===");
for (let i = 1; i <= 5; i++) {
  await test(`gpt-5.2 call #${i}`, "gpt-5.2", {
    max_completion_tokens: 16384,
    store: false,
    stream_options: { include_usage: true },
    tools,
  });
}

console.log("\n\nDone.");
