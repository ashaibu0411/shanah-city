import assert from "node:assert/strict";
import { readJsonResponse } from "../src/lib/read-json-response";

function mockResponse(input: {
  status: number;
  contentType?: string;
  body?: string;
}): Response {
  const init: ResponseInit = { status: input.status };
  if (input.contentType) {
    init.headers = new Headers({ "content-type": input.contentType });
  }
  return new Response(input.body ?? "", init);
}

async function main() {
  await assert.rejects(
    () => readJsonResponse(mockResponse({ status: 500, body: "<html>error</html>" })),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Request failed \(500\)/);
      assert.doesNotMatch(error.message, /MP4|Upload failed/i);
      return true;
    },
  );

  const parsed = await readJsonResponse(
    mockResponse({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Database table missing." }),
    }),
  );
  assert.equal((parsed as { error?: string }).error, "Database table missing.");

  console.log("read-json-response.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
