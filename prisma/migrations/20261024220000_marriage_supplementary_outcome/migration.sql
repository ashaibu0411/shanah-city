ALTER TABLE "MarriagePremaritalSupplementaryClinical" ADD COLUMN IF NOT EXISTS "outcome" TEXT;

CREATE TABLE IF NOT EXISTS "MarriagePrepCertificateSettingAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "note" TEXT,
    "previousPath" TEXT,
    "newPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarriagePrepCertificateSettingAudit_pkey" PRIMARY KEY ("id")
);
