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
  } catch (err) { console.log(`${label}: ERROR ${err.message}`); }
}

await test("16384", { max_completion_tokens: 16384 });
await test("16385", { max_completion_tokens: 16385 });
await test("20000", { max_completion_tokens: 20000 });
await test("32000", { max_completion_tokens: 32000 });
