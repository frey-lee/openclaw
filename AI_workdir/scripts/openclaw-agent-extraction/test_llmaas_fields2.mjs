import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

async function test(label, extraFields) {
  try {
    const body = {
      model,
      stream: true,
      messages: [{ role: "user", content: "Say hi" }],
      ...extraFields,
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    console.log(`${label}: ${res.status}`);
    if (res.status !== 200) {
      const text = await res.text();
      console.log(`  Body: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

await test("max_completion_tokens", { max_completion_tokens: 32000 });
await test("max_tokens", { max_tokens: 32000 });
await test("strict tool", {
  tools: [{ type: "function", function: { name: "test", description: "test", parameters: { type: "object", properties: {} }, strict: false } }],
});
await test("all combined (exact pi-ai request)", {
  stream_options: { include_usage: true },
  store: false,
  max_completion_tokens: 32000,
  tools: [{ type: "function", function: { name: "read", description: "Read file", parameters: { type: "object", required: ["path"], properties: { path: { type: "string" } } }, strict: false } }],
});
