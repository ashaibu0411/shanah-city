import assert from "node:assert/strict";
import {
  listCounselorSessionTopicOptions,
  MARRIAGE_COUNSELOR_GENERAL_SESSION_TOPICS,
} from "../src/lib/marriage-counselor-session-topics";
import { MARRIAGE_COUNSELING_MODULES } from "../src/lib/marriage-counseling-curriculum";

async function main() {
  const topics = await listCounselorSessionTopicOptions();
  assert.ok(topics.length >= MARRIAGE_COUNSELING_MODULES.filter((m) => !m.archived).length);

  for (const general of MARRIAGE_COUNSELOR_GENERAL_SESSION_TOPICS) {
    assert.ok(topics.includes(general), `missing general topic: ${general}`);
  }

  const lower = topics.map((t) => t.toLowerCase());
  assert.equal(lower.length, new Set(lower).size, "duplicate topic titles");

  assert.ok(topics.every((a, i) => i === 0 || topics[i - 1].localeCompare(a) <= 0), "not sorted");

  console.log("marriage-counselor-session-topics.test.ts: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
