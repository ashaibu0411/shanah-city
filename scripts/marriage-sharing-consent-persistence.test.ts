/**
 * Partner/counselor consent merge helpers (no database).
 * Run: npx tsx scripts/marriage-sharing-consent-persistence.test.ts
 */
import assert from "node:assert/strict";
import {
  buildCounselorConsentRevocationRecord,
  mergePartnerSharingConsentPatch,
} from "../src/lib/marriage-sharing-consent-persistence";
import type { MarriageSharingConsentRecord } from "../src/lib/marriage-counseling-types";

function run() {
  const existing: MarriageSharingConsentRecord = {
    journeyId: "j",
    moduleId: "m",
    questionId: "q",
    userId: "u",
    granted: true,
    counselorDisclosureGranted: true,
    updatedAt: "2020-01-01T00:00:00.000Z",
    consentedCounselorUserId: "counselor-1",
    generationAtGrant: 2,
    answerFingerprint: "abc",
    grantedAt: "2020-01-02T00:00:00.000Z",
  };

  const merged = mergePartnerSharingConsentPatch(existing, {
    journeyId: "j",
    moduleId: "m",
    questionId: "q",
    userId: "u",
    granted: false,
    updatedAt: "2020-01-03T00:00:00.000Z",
  });
  assert.equal(merged.granted, false);
  assert.equal(merged.consentedCounselorUserId, "counselor-1");
  assert.equal(merged.generationAtGrant, 2);
  assert.equal(merged.answerFingerprint, "abc");

  const partnerOnly: MarriageSharingConsentRecord = {
    journeyId: "j",
    moduleId: "m",
    questionId: "q2",
    userId: "u",
    granted: true,
    updatedAt: "2020-01-01T00:00:00.000Z",
  };
  assert.equal(
    buildCounselorConsentRevocationRecord(partnerOnly, partnerOnly, "2020-01-04T00:00:00.000Z"),
    null,
    "partner-only row unchanged by counselor invalidation helper",
  );

  const revoked = buildCounselorConsentRevocationRecord(
    existing,
    existing,
    "2020-01-04T00:00:00.000Z",
  );
  assert.ok(revoked);
  assert.equal(revoked!.granted, true, "partner granted preserved on counselor revoke");
  assert.equal(revoked!.counselorDisclosureGranted, false);
  assert.equal(revoked!.consentedCounselorUserId, null);
  assert.equal(revoked!.generationAtGrant, null);

  console.log("marriage-sharing-consent-persistence.test.ts: OK");
}

run();
