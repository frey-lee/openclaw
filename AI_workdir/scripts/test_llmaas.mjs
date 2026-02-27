import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

console.log(`Testing: ${baseUrl}/v1/chat/completions`);
console.log(`Model: ${model}`);
console.log(`API key: ${apiKey ? apiKey.slice(0, 8) + "..." : "MISSING"}`);

try {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Say hi in one word" },
      ],
    }),
  });
  console.log(`Status: ${res.status} ${res.statusText}`);
  const body = await res.text();
  console.log(`Response: ${body.slice(0, 500)}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  console.error(`Cause: ${err.cause?.message || "none"}`);
}
