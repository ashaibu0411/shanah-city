import assert from "node:assert/strict";
import {
  callAskShepherdChat,
  resetAskShepherdAiFetchForTests,
  setAskShepherdAiFetchForTests,
} from "../src/lib/ask-shepherd-ai-server";

async function main() {
  process.env.ASK_SHEPHERD_AI_API_KEY = "test-key";

  setAskShepherdAiFetchForTests(
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: "General guidance — listen first, pray, schedule a private conversation." } },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  );

  const r = await callAskShepherdChat([
    { role: "system", content: "You are a test assistant." },
    { role: "user", content: "How do I correct someone without shaming them?" },
  ]);
  assert.ok(r.ok);
  assert.match(String(r.text), /listen first/);

  resetAskShepherdAiFetchForTests();
  delete process.env.ASK_SHEPHERD_AI_API_KEY;

  console.log("ask-shepherd-ai-mock.test.ts OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
