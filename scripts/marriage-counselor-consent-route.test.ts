/**
 * Counselor-consent API contract (mocked session wiring via participant layer + JSON store).
 * Not a full Next.js HTTP integration test.
 * Run: npx.cmd tsx scripts/marriage-counselor-consent-route.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
} from "../src/lib/marriage-counselor-consent-participant";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

/** Mirrors GET route response body shape from counselor-consent/route.ts */
async function routeGetStatus(user: PublicMember, journeyId: string, moduleId: string) {
  return listCounselorConsentStatusForModule(user, journeyId, moduleId);
}

/** Mirrors POST grant branch response fields (without NextResponse wrapper). */
async function routePostGrant(user: PublicMember, journeyId: string, moduleId: string, questionId: string) {
  const result = await grantCounselorAnswerConsent(user, journeyId, moduleId, questionId);
  const status = await listCounselorConsentStatusForModule(user, journeyId, moduleId);
  return { ...result, ok: true as const, status };
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-route-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c1",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
    guidedModuleIds: ["mod-02-family-background"],
  });
  const modId = "mod-02-family-background";
  const questionId = "fb-sensitive";
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: "Route test secret payload" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  await assert.rejects(
    () => routeGetStatus(member("u-stranger"), journey.id, modId),
    /not part of this journey/,
  );

  const getBody = await routeGetStatus(member("u-a"), journey.id, modId);
  assert.ok(Array.isArray(getBody.items));
  assert.equal(JSON.stringify(getBody).includes("Route test secret"), false);

  const postBody = await routePostGrant(member("u-a"), journey.id, modId, questionId);
  assert.equal(postBody.ok, true);
  assert.equal(JSON.stringify(postBody).includes("Route test secret"), false);
  assert.ok(postBody.status.items.some((i) => i.questionId === questionId && i.state === "shared_with_counselor"));

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  console.log("marriage-counselor-consent-route.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
