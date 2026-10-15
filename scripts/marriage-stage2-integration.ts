/**
 * Stage 2 store integration (isolated JSON, feature flag on).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-s2-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");
  const { STAGE2_MODULES } = await import("../src/lib/marriage-stage2-catalog");
  const { buildTemperamentInsights } = await import("../src/lib/marriage-stage2-temperament-insights");
  const { buildSharedComparisonItems } = await import("../src/lib/marriage-counseling-comparison-utils");

  assert.ok(STAGE2_MODULES.length >= 4, "stage2 catalog");

  const finMod = STAGE2_MODULES.find((m) => m.id === "s2-financial-workshop")!;
  const privateQ = finMod.questions.find((q) => q.visibility === "private_financial_disclosure")!;
  assert.ok(privateQ);

  const items = buildSharedComparisonItems(
    finMod.questions,
    { [privateQ.id]: "99999" },
    { [privateQ.id]: "11111" },
  );
  assert.ok(!items.some((i) => i.questionId === privateQ.id), "financial private excluded from compare");

  const { buildMod01TemperamentModule } = await import("../src/lib/marriage-stage2-content/mod-01-temperament");
  const tmpMod = buildMod01TemperamentModule();
  const insights = buildTemperamentInsights(tmpMod.questions, { "m01-soc-1": "5", "m01-soc-2": "5" }, { "m01-soc-1": "1", "m01-soc-2": "1" });
  assert.ok(insights.some((i) => i.note.includes("curiosity") || i.note.includes("Different")));

  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: "s2-financial-workshop",
    counselorUserId: null,
    createdBy: "u-a",
    pairingMode: "journey_invite",
    participantAId: "u-a",
    participantBId: "u-b",
  });

  await store.saveActionPlan({
    id: "plan-1",
    journeyId: journey.id,
    title: "Test plan",
    createdByUserId: "u-a",
    items: [{ id: "i1", text: "Pray weekly", done: false }],
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const plans = await store.listActionPlans(journey.id);
  assert.equal(plans.length, 1);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_HUB_STAGE2_ENABLED;
  console.log("marriage-stage2-integration.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
