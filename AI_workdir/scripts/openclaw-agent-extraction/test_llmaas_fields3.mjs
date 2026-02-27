import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

async function test(label, extraFields) {
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, stream: true, messages: [{ role: "user", content: "Say hi" }], ...extraFields }),
    });
    console.log(`${label}: ${res.status}`);
    if (res.status !== 200) { const t = await res.text(); console.log(`  Body: ${t.slice(0, 300)}`); }
  } catch (err) { console.log(`${label}: ERROR ${err.message}`); }
}

await test("max_completion_tokens=100", { max_completion_tokens: 100 });
await test("max_tokens=100", { max_tokens: 100 });
await test("max_completion_tokens=4096", { max_completion_tokens: 4096 });
await test("max_tokens=4096", { max_tokens: 4096 });
await test("no max tokens at all", {});
await test("max_completion_tokens=16384", { max_completion_tokens: 16384 });
await test("max_tokens=16384", { max_tokens: 16384 });
