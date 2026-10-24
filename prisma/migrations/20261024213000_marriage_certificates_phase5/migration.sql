-- Phase 5: certificates, session completion timestamps, supplementary clinical records

ALTER TABLE "MarriagePremaritalProgramSession" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "MarriagePrepCertificateSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "seniorPastorSignatureAssetPath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,
    CONSTRAINT "MarriagePrepCertificateSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarriagePremaritalFinalCertificate" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "partnerADisplayName" TEXT NOT NULL,
    "partnerBDisplayName" TEXT NOT NULL,
    "seniorPastorName" TEXT NOT NULL,
    "seniorPastorTitle" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarriagePremaritalFinalCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificate_certificateNumber_key" ON "MarriagePremaritalFinalCertificate"("certificateNumber");
CREATE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificate_journeyId_status_idx" ON "MarriagePremaritalFinalCertificate"("journeyId", "status");
CREATE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificate_journeyId_issuedAt_idx" ON "MarriagePremaritalFinalCertificate"("journeyId", "issuedAt");

CREATE TABLE IF NOT EXISTS "MarriagePremaritalFinalCertificateAudit" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "note" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarriagePremaritalFinalCertificateAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificateAudit_journeyId_createdAt_idx" ON "MarriagePremaritalFinalCertificateAudit"("journeyId", "createdAt");
CREATE INDEX IF NOT EXISTS "MarriagePremaritalFinalCertificateAudit_certificateId_idx" ON "MarriagePremaritalFinalCertificateAudit"("certificateId");

CREATE TABLE IF NOT EXISTS "MarriagePremaritalSupplementaryClinical" (
    "appointmentId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "partnerAAttended" BOOLEAN,
    "partnerBAttended" BOOLEAN,
    "topicsCovered" TEXT,
    "followUpActions" TEXT,
    "privateObservations" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    CONSTRAINT "MarriagePremaritalSupplementaryClinical_pkey" PRIMARY KEY ("appointmentId")
);

CREATE INDEX IF NOT EXISTS "MarriagePremaritalSupplementaryClinical_journeyId_idx" ON "MarriagePremaritalSupplementaryClinical"("journeyId");
