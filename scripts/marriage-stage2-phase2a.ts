import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import { buildLearningSections } from "../src/lib/marriage-stage2-learning-sections";
import { allStage2ModuleDefinitions } from "../src/lib/marriage-stage2-module-registry";

async function main() {
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2a-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");
  const mods = allStage2ModuleDefinitions();
  assert.ok(mods.length >= 12, "twelve-module registry");

  const sections = buildLearningSections();
  assert.equal(sections.length, 7, "dashboard sections A–G");

  const fin = mods.find((m) => m.id === "s2-financial-workshop")!;
  const privateQ = fin.questions.find((q) => q.visibility === "private_financial_disclosure")!;
  const sharedQ = fin.questions.find((q) => q.visibility === "shared_after_both_submit")!;

  const withoutConsent = buildComparisonItemsWithConsent(
    fin.questions,
    { [privateQ.id]: "100", [sharedQ.id]: "save" },
    { [privateQ.id]: "200", [sharedQ.id]: "spend" },
    "u-a",
    "u-b",
    "j-1",
    fin.id,
    [],
  );
  assert.ok(!withoutConsent.some((i) => i.questionId === privateQ.id));

  await store.saveSharingConsent({
    journeyId: "j-1",
    moduleId: fin.id,
    questionId: sharedQ.id,
    userId: "u-a",
    granted: true,
    updatedAt: new Date().toISOString(),
  });
  await store.saveSharingConsent({
    journeyId: "j-1",
    moduleId: fin.id,
    questionId: sharedQ.id,
    userId: "u-b",
    granted: true,
    updatedAt: new Date().toISOString(),
  });

  const highSens = {
    ...sharedQ,
    sensitivity: "high" as const,
  };
  const withConsent = buildComparisonItemsWithConsent(
    [highSens],
    { [sharedQ.id]: "save" },
    { [sharedQ.id]: "spend" },
    "u-a",
    "u-b",
    "j-1",
    fin.id,
    await store.listSharingConsents("j-1", fin.id),
  );
  assert.equal(withConsent.length, 1);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_HUB_STAGE2_ENABLED;
  console.log("marriage-stage2-phase2a.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
