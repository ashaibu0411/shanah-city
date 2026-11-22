-- Separate volunteer self-attestation from leader-verified safeguarding.

ALTER TABLE "KidsVolunteerProfile" ADD COLUMN IF NOT EXISTS "safeguardingSelfAttestedAt" TIMESTAMP(3);
ALTER TABLE "KidsVolunteerProfile" ADD COLUMN IF NOT EXISTS "safeguardingLeaderVerifiedAt" TIMESTAMP(3);

UPDATE "KidsVolunteerProfile"
SET "safeguardingLeaderVerifiedAt" = "safeguardingCompletedAt"
WHERE "safeguardingCompletedAt" IS NOT NULL
  AND "safeguardingLeaderVerifiedAt" IS NULL;