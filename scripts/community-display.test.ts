import assert from "node:assert/strict";
import { communityPostDisplayText, communityPostDisplayParts } from "../src/lib/community-ui-utils";

const example = "Shanah City URGENT: Glory Encounter\n\n7pm sharp, dinner will be served.";
assert.equal(
  communityPostDisplayText(example, "Shanah City"),
  "URGENT: Glory Encounter\n\n7pm sharp, dinner will be served.",
);
assert.deepEqual(communityPostDisplayParts(example, "Shanah City", true), {
  headline: "URGENT: Glory Encounter",
  body: "7pm sharp, dinner will be served.",
});
assert.equal(
  communityPostDisplayText("Shanah City is hosting the event.", "Shanah City"),
  "Shanah City is hosting the event.",
  "do not strip meaningful prose",
);
assert.equal(
  communityPostDisplayText("A testimony from Shanah City", "Shanah City"),
  "A testimony from Shanah City",
  "only strip a leading duplicate label",
);
assert.equal(
  communityPostDisplayText("Another author: Hello", "Shanah City"),
  "Another author: Hello",
);
assert.equal(
  communityPostDisplayText("Shanah City: Join us", "Shanah City"),
  "Join us",
);
assert.deepEqual(communityPostDisplayParts("Praise God for healing", "Ama", false), {
  headline: "",
  body: "Praise God for healing",
});
console.log("community-display.test.ts OK");
