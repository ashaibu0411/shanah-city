-- Phase 2C: separate spouse partner-sharing from counselor disclosure (additive, no backfill).

ALTER TABLE "MarriageSharingConsent" ADD COLUMN "counselorDisclosureGranted" BOOLEAN NOT NULL DEFAULT false;
