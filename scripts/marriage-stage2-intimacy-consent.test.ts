/** Module 6 consent requirements: never gate on the UI alone. */
import assert from "node:assert/strict";
import {
  assertIntimacyCanSubmit,
  MARRIAGE_INTIMACY_MODULE_ID,
  MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID,
  intimacyOptInChoice,
  prepareIntimacyDraftPatch,
  visibleIntimacyAnswers,
  visibleIntimacyModule,
} from "../src/lib/marriage-stage2-intimacy-consent";
import { buildMod06IntimacyModule } from "../src/lib/marriage-stage2-content/mod-06-intimacy";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import { readFileSync } from "node:fs";

const mod = buildMod06IntimacyModule();
const ids = [MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID, "m06-boundary-private", "m06-share-phrase"];
const previous = { [ids[0]]: "yes", [ids[1]]: "a sensitive response", [ids[2]]: "shared phrase" };
const allQuestions = mod.questions;

assert.equal(mod.id, MARRIAGE_INTIMACY_MODULE_ID);
assert.equal(intimacyOptInChoice({}), null);
assert.equal(intimacyOptInChoice({ [ids[0]]: "no" }), "no");
assert.equal(visibleIntimacyModule(mod, {}).questions.length, 1);
assert.equal(visibleIntimacyModule(mod, {}).lessons?.length, 1);
assert.equal(visibleIntimacyModule(mod, { [ids[0]]: "no" }).questions.length, 1);
assert.equal(visibleIntimacyModule(mod, previous).questions.length, mod.questions.length);
assert.deepEqual(visibleIntimacyAnswers(mod.id, previous), previous);
assert.deepEqual(visibleIntimacyAnswers(mod.id, { [ids[0]]: "no", [ids[1]]: "legacy" }), { [ids[0]]: "no" });

assert.throws(
  () => prepareIntimacyDraftPatch(mod.id, {}, { [ids[1]]: "not allowed" }, allQuestions),
  /opt in and save/,
  "no saved consent: reject direct sensitive PATCH",
);
assert.throws(
  () => prepareIntimacyDraftPatch(mod.id, { [ids[0]]: "no" }, { [ids[1]]: "not allowed" }, allQuestions),
  /opt in and save/,
  "declined consent: reject direct sensitive PATCH",
);
assert.throws(
  () => prepareIntimacyDraftPatch(mod.id, {}, { [ids[0]]: "yes", [ids[1]]: "bypass" }, allQuestions),
  /opt in and save/,
  "same-request opt-in must not bypass previously persisted consent",
);
assert.throws(
  () => prepareIntimacyDraftPatch(mod.id, {}, { [ids[0]]: "invalid" }, allQuestions),
  /Choose Yes/,
);
assert.throws(
  () => prepareIntimacyDraftPatch(mod.id, previous, { unknown: "extra" }, allQuestions),
  /Unknown intimacy/,
);
const yesPatch = prepareIntimacyDraftPatch(mod.id, {}, { [ids[0]]: "yes" }, allQuestions);
assert.equal(yesPatch[ids[0]], "yes");
assert.equal(yesPatch[ids[1]], null, "fresh opt-in removes legacy answers that predate consent");
const permitted = prepareIntimacyDraftPatch(mod.id, previous, { [ids[1]]: "new sensitive response" }, allQuestions);
assert.deepEqual(permitted, { [ids[1]]: "new sensitive response" });
const declinePatch = prepareIntimacyDraftPatch(mod.id, previous, { [ids[0]]: "no" }, allQuestions);
assert.equal(declinePatch[ids[0]], "no");
assert.equal(declinePatch[ids[1]], null, "withdrawal clears sensitive drafts");
assert.equal(declinePatch[ids[2]], null, "withdrawal clears explicitly shared drafts");
assert.throws(() => assertIntimacyCanSubmit(mod.id, { [ids[0]]: "no" }), /optional/);
assert.throws(() => assertIntimacyCanSubmit(mod.id, {}), /optional/);
assert.doesNotThrow(() => assertIntimacyCanSubmit(mod.id, previous));
assert.doesNotThrow(() => assertIntimacyCanSubmit("s2-mod-02-family-background", {}));

const comparison = buildComparisonItemsWithConsent(
  allQuestions, previous, { [ids[0]]: "yes", [ids[1]]: "partner private" },
  "a", "b", "journey", mod.id, [],
);
assert.equal(comparison.some((item) => item.questionId === ids[1]), false, "private reflection excluded");
assert.equal(comparison.some((item) => item.questionId === ids[2]), false, "explicit consent required to share");

const server = readFileSync("src/lib/marriage-counseling-server.ts", "utf8");
const db = readFileSync("src/lib/stores/marriage-counseling-db.ts", "utf8");
const json = readFileSync("src/lib/stores/marriage-counseling-json.ts", "utf8");
const ui = readFileSync("src/components/marriage/MarriageStage2ModuleRunner.tsx", "utf8");
const review = readFileSync("src/components/marriage/MarriageModuleSubmitReview.tsx", "utf8");
assert.match(server, /assertIntimacyCanSubmit\(moduleId, existing\.answers\)/);
assert.match(server, /visibleIntimacyModule\(mod, myResponse\?\.answers\)/);
assert.match(server, /visibleIntimacyAnswers\(moduleId, myResponse\.answers\)/);
assert.match(server, /granted: false/);
assert.match(db, /prepareIntimacyDraftPatch\(moduleId, previousAnswers, patch, questions\)/);
assert.match(json, /prepareIntimacyDraftPatch\(moduleId, previousAnswers, patch, questions\)/);
assert.match(ui, /data-testid="intimacy-opt-in-gate"/);
assert.match(ui, /intimacyOptedIn &&/);
assert.match(review, /!intimateModuleDeclined/);
assert.match(review, /disabled=\{!canSubmit \|\| submitting\}/);
console.log("marriage-stage2-intimacy-consent.test.ts: OK");
