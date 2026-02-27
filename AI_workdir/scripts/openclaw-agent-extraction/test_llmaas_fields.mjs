import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

async function test(label, extraFields) {
  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "user", content: "Say hi" }],
        ...extraFields,
      }),
    });
    console.log(`${label}: ${res.status}`);
    if (res.status !== 200) {
      const body = await res.text();
      console.log(`  Body: ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

await test("stream_options", { stream_options: { include_usage: true } });
await test("store=false", { store: false });
await test("both", { stream_options: { include_usage: true }, store: false });
await test("developer role", { messages: [{ role: "developer", content: "You are helpful" }, { role: "user", content: "Say hi" }] });
