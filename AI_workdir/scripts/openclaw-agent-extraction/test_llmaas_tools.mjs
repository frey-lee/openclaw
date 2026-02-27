import "dotenv/config";

const baseUrl = process.env.LLMAAS_BASE_URL || "https://llmaas.govtext.gov.sg/gateway";
const apiKey = process.env.LLMAAS_API_KEY;
const model = process.env.LLMAAS_MODEL || "gpt-4o";

// Test 1: Simple message (should work like Python)
console.log("--- Test 1: Simple message ---");
try {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say hi in one word" }],
    }),
  });
  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Body: ${body.slice(0, 300)}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
}

// Test 2: With streaming
console.log("\n--- Test 2: With streaming ---");
try {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: "Say hi in one word" }],
    }),
  });
  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Body: ${body.slice(0, 300)}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
}

// Test 3: With tools
console.log("\n--- Test 3: With tools ---");
try {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say hi in one word" }],
      tools: [{
        type: "function",
        function: {
          name: "read_file",
          description: "Read a file",
          parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
        },
      }],
    }),
  });
  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Body: ${body.slice(0, 300)}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
}

// Test 4: With tools + streaming
console.log("\n--- Test 4: With tools + streaming ---");
try {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: "Say hi in one word" }],
      tools: [{
        type: "function",
        function: {
          name: "read_file",
          description: "Read a file",
          parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
        },
      }],
    }),
  });
  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Body: ${body.slice(0, 300)}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
}
