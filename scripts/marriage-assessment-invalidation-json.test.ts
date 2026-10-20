/**
 * JSON store atomic invalidation (temp file, no DATABASE_URL).
 * Run: npx tsx scripts/marriage-assessment-invalidation-json.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-inv-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");

  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq1",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 0,
    answerFingerprint: "a".repeat(64),
    grantedAt: new Date().toISOString(),
  });

  await store.savePartnerSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "pq1",
    userId: "u1",
    granted: true,
    updatedAt: new Date().toISOString(),
  });

  await store.saveAssessmentResponseWithCounselorConsentInvalidation(
    {
      id: "r1",
      journeyId: "j1",
      moduleId: "mod1",
      contentVersion: "v1",
      userId: "u1",
      status: "draft",
      answers: { cq1: "updated" },
      lastSavedAt: new Date().toISOString(),
    },
    ["cq1"],
  );

  const counselorRow = (await store.listSharingConsents("j1", "mod1")).find(
    (c) => c.questionId === "cq1",
  );
  assert.equal(counselorRow?.counselorDisclosureGranted, false);
  assert.equal(counselorRow?.generationAtGrant, null);

  const partnerRow = (await store.listSharingConsents("j1", "mod1")).find(
    (c) => c.questionId === "pq1",
  );
  assert.equal(partnerRow?.granted, true);

  const gen = await store.getAnswerChangeGeneration("j1", "mod1", "cq1", "u1");
  assert.equal(gen, 1);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  console.log("marriage-assessment-invalidation-json.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
