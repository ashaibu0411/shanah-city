import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PREMARITAL_PROGRAM_SESSIONS,
  allPremaritalModuleIdsInProgram,
} from "../src/lib/marriage-premarital-eight-session-program";
import { DEFAULT_PROGRAM_TRACKS } from "../src/lib/marriage-counseling-program-tracks";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

assert.equal(PREMARITAL_PROGRAM_SESSIONS.length, 8, "eight sessions");

const orders = PREMARITAL_PROGRAM_SESSIONS.map((s) => s.order).sort((a, b) => a - b);
assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8]);

for (const session of PREMARITAL_PROGRAM_SESSIONS) {
  assert.ok(session.title.trim(), `${session.sessionKey} has title`);
  assert.ok(session.purpose.trim(), `${session.sessionKey} has purpose`);
  assert.ok(session.teachingSections.length >= 2, `${session.sessionKey} teaching depth`);
  assert.ok(session.discussionQuestions.length >= 3, `${session.sessionKey} discussion questions`);
  assert.ok(session.scriptures.length >= 2, `${session.sessionKey} scriptures`);
  assert.ok(session.completionChecklist.length >= 3, `${session.sessionKey} checklist`);
  assert.equal(session.homeworkTemplateKeys.length, 1, `${session.sessionKey} homework template`);
}

const premaritalRequired = new Set(
  DEFAULT_PROGRAM_TRACKS.premarital.filter((e) => e.required).map((e) => e.moduleId),
);
const mappedIds = allPremaritalModuleIdsInProgram();

const curriculum = readFileSync(
  join(root, "src/lib/marriage-counseling-curriculum.ts"),
  "utf8",
);
for (const id of mappedIds) {
  assert.match(curriculum, new RegExp(id.replace(/-/g, "\\-")), `curriculum defines ${id}`);
}
assert.ok(
  [...premaritalRequired].every((id) => mappedIds.includes(id)),
  "all required premarital track modules appear in the eight-session map",
);
assert.equal(new Set(mappedIds).size, mappedIds.length, "no duplicate module mappings");

const api = readFileSync(
  join(root, "src/app/api/marriage/premarital-program/route.ts"),
  "utf8",
);
assert.match(api, /getUserFromSession/, "premarital program API requires session");
assert.match(api, /updatePremaritalSessionStatus/, "counselor status updates server-side");

const guides = readFileSync(
  join(root, "src/lib/marriage-premarital-session-guides.ts"),
  "utf8",
);
assert.ok(guides.length > 12000, "substantial counselor teaching content");
assert.match(guides, /Opening and session objectives/, "guides include session openings");
assert.match(guides, /When partners answer differently/, "guides include disagreement guidance");

console.log("marriage-premarital-eight-session.test.ts: OK");
console.log(
  "Sessions:",
  PREMARITAL_PROGRAM_SESSIONS.map((s) => `${s.order}. ${s.title}`).join(" | "),
);
