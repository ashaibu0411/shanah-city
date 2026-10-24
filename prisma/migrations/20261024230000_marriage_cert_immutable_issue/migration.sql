-- AlterTable
ALTER TABLE "MarriagePremaritalFinalCertificate"
ADD COLUMN IF NOT EXISTS "signatureAssetPathAtIssue" TEXT,
ADD COLUMN IF NOT EXISTS "renderVersion" TEXT,
ADD COLUMN IF NOT EXISTS "issuedPdfAssetPath" TEXT;

-- One active final certificate per journey (PostgreSQL partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificate_one_active_per_journey"
ON "MarriagePremaritalFinalCertificate" ("journeyId")
WHERE "status" = 'active';
