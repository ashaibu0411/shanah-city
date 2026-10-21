/**
 * Canonical worship recording library URLs.
 * Run: npx.cmd tsx scripts/choir-recordings-links.test.ts
 */
import assert from "node:assert/strict";
import { choirRecordingsLibraryHref } from "../src/lib/choir-recordings-links";
import { SHANAH_WORSHIP_GROUP_ID } from "../src/lib/choir-group-constants";

function main() {
  assert.equal(
    choirRecordingsLibraryHref(SHANAH_WORSHIP_GROUP_ID),
    `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?tab=library`,
  );
  assert.equal(
    choirRecordingsLibraryHref(SHANAH_WORSHIP_GROUP_ID, { tab: "record" }),
    `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?tab=record`,
  );
  assert.equal(
    choirRecordingsLibraryHref(SHANAH_WORSHIP_GROUP_ID, { filter: "mine" }),
    `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?tab=library&filter=mine`,
  );
  console.log("choir-recordings-links.test.ts: all passed");
}

main();
