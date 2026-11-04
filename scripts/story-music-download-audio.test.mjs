import assert from "node:assert/strict";
import { parseRetryAfterMs } from "./story-music-download-audio.mjs";

assert.equal(parseRetryAfterMs("120"), 120_000);
assert.equal(parseRetryAfterMs(null), null);

const future = new Date(Date.now() + 5000).toUTCString();
const fromDate = parseRetryAfterMs(future);
assert.ok(fromDate !== null && fromDate >= 4000 && fromDate <= 6000);

console.log("story-music-download-audio.test.mjs OK");
