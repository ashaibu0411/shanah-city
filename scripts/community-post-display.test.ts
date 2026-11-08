import assert from "node:assert/strict";
import test from "node:test";
import {
  communityPostVisualType,
  prepareCommunityPostDisplay,
  stripRepeatedLeadingAuthor,
  stripTestimonyMarker,
} from "../src/lib/community-post-display";

test("stripRepeatedLeadingAuthor removes colon prefix", () => {
  const out = stripRepeatedLeadingAuthor("Jane Doe", "Jane Doe: Please pray for my family.");
  assert.equal(out, "Please pray for my family.");
});

test("stripRepeatedLeadingAuthor removes dash prefix and first-name match", () => {
  assert.equal(
    stripRepeatedLeadingAuthor("Jane Doe", "Jane - heading to hospital"),
    "heading to hospital",
  );
  assert.equal(stripRepeatedLeadingAuthor("Jane Doe", "Jane pray for us"), "pray for us");
});

test("stripRepeatedLeadingAuthor leaves unrelated content", () => {
  const content = "Team update from the worship band";
  assert.equal(stripRepeatedLeadingAuthor("Jane Doe", content), content);
});

test("stripTestimonyMarker and visual type", () => {
  assert.equal(stripTestimonyMarker("[testimony] God is faithful"), "God is faithful");
  assert.equal(
    communityPostVisualType({ type: "praise", content: "[testimony] Amazing grace" }),
    "testimony",
  );
});

test("prepareCommunityPostDisplay splits title and body", () => {
  const parsed = prepareCommunityPostDisplay(
    "Jane Doe",
    "Jane Doe: Surgery today\nPlease pray for peace and skilled hands.",
  );
  assert.equal(parsed.title, "Surgery today");
  assert.match(parsed.body, /peace/);
});
