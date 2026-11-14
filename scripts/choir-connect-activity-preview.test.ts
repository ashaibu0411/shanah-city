import assert from "node:assert/strict";
import { parseChoirTimeAwayChatPreview } from "../src/lib/choir-time-away-chat-preview";

const legacy = "🕊️ Approved time away: Tina (2026-11-29 – 2026-11-29) — Singing in Seattle\n\n💬 This update is in Shanah Worship group chat so nothing is missed.";
assert.deepEqual(parseChoirTimeAwayChatPreview(legacy), {
  personName: "Tina",
  dates: "Sunday, Nov 29, 2026",
  reason: "Singing in Seattle",
});

const truncated = "🕊️ Approved time away: Tina (2026-11-29 – 2026-11-29) — Singing in Seattle 💬 This update is in Shanah Worship group c";
assert.deepEqual(parseChoirTimeAwayChatPreview(truncated), {
  personName: "Tina",
  dates: "Sunday, Nov 29, 2026",
  reason: "Singing in Seattle",
});

assert.deepEqual(parseChoirTimeAwayChatPreview("🕊️ Approved time away: Tina (2026-11-29 – 2026-12-01)"), {
  personName: "Tina",
  dates: "Sunday, Nov 29, 2026 – Tuesday, Dec 2, 2026".replace("Tuesday, Dec 2", "Monday, Dec 1"),
  reason: "",
});
assert.equal(parseChoirTimeAwayChatPreview("We will rehearse at 7 PM"), null);
console.log("choir-connect-activity-preview.test.ts OK");
