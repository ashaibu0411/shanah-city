/**
 * Automated checks for marriage counseling configuration (no live auth).
 * Run: node scripts/marriage-counseling-workflow.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const curriculum = readFileSync(
  join(root, "src/lib/marriage-counseling-curriculum.ts"),
  "utf8",
);
const tracks = readFileSync(
  join(root, "src/lib/marriage-counseling-program-tracks.ts"),
  "utf8",
);

assert.match(curriculum, /mod-12-readiness/, "seed includes module 12");
assert.match(curriculum, /mod-20-celebration/, "seed includes module 20 for expanded curriculum");
assert.match(tracks, /premarital:/, "premarital track defined");
assert.match(tracks, /enrichment:/, "enrichment track defined");
assert.match(tracks, /mod-01-knowing-yourself/, "premarital includes legacy module ids");

const premaritalCount = (tracks.match(/moduleId:/g) ?? []).length;
assert.ok(premaritalCount >= 12, "premarital track has at least 12 entries");

console.log("marriage-counseling-workflow.test.mjs: OK");
