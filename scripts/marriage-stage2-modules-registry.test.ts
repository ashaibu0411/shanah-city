import assert from "node:assert/strict";
import { allStage2ModuleDefinitions } from "../src/lib/marriage-stage2-module-registry";

const CORE_STAGE2_MODULE_IDS = [
  "s2-temperament-discovery",
  "s2-mod-02-family-background",
  "s2-mod-03-communication",
  "s2-mod-04-conflict-lab",
  "s2-financial-workshop",
  "s2-mod-06-intimacy",
  "s2-mod-07-faith-values",
  "s2-mod-08-roles",
  "s2-mod-09-parenting",
  "s2-mod-10-trust-digital",
  "s2-mod-11-life-vision",
  "s2-mod-12-enrichment",
] as const;

const byId = new Map(allStage2ModuleDefinitions().map((m) => [m.id, m]));
assert.equal(byId.size >= 12, true);

for (const id of CORE_STAGE2_MODULE_IDS) {
  const mod = byId.get(id);
  assert.ok(mod, `missing ${id}`);
  assert.ok(mod!.lessons.length >= 3, `${id} lessons`);
  assert.ok(mod!.questions.length >= 6, `${id} questions (${mod!.questions.length})`);
  assert.ok(mod!.meta?.stage2Section, `${id} section meta`);
}

const intimacy = byId.get("s2-mod-06-intimacy");
assert.ok(intimacy?.meta?.pastoralGuide, "intimacy pastoral guide");

console.log("marriage-stage2-modules-registry.test.ts: OK");
