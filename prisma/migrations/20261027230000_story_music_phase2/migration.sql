-- Share Your Story music Phase 2 (church-authorized pilot)
-- Do not run against production until explicitly approved.

CREATE TABLE IF NOT EXISTS "StoryMusicRightsRecord" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recordingOwner" TEXT NOT NULL,
    "compositionPublishing" TEXT NOT NULL,
    "documentReference" TEXT NOT NULL,
    "evidenceSummary" TEXT,
    "authorizedUses" TEXT NOT NULL,
    "streamingPermitted" BOOLEAN NOT NULL DEFAULT false,
    "storagePermitted" BOOLEAN NOT NULL DEFAULT false,
    "territory" TEXT NOT NULL,
    "territoryCodesJson" TEXT,
    "licenseStartDate" TIMESTAMP(3),
    "licenseEndDate" TIMESTAMP(3),
    "revocationContact" TEXT,
    "catalogTrackId" TEXT NOT NULL,
    "country" TEXT,
    "language" TEXT,
    "genresJson" TEXT,
    "tagsJson" TEXT,
    "startSeconds" INTEGER,
    "audioStorageRef" TEXT,
    "audioContentType" TEXT,
    "audioByteLength" INTEGER,
    "proposedByUserId" TEXT,
    "proposedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revokeReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryMusicRightsRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoryMusicRightsRecord_catalogTrackId_key" ON "StoryMusicRightsRecord"("catalogTrackId");
CREATE INDEX IF NOT EXISTS "StoryMusicRightsRecord_status_idx" ON "StoryMusicRightsRecord"("status");

CREATE TABLE IF NOT EXISTS "StoryMusicCatalogTrack" (
    "id" TEXT NOT NULL,
    "rightsRecordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "providerKind" TEXT NOT NULL DEFAULT 'church_authorized',
    "audioStorageRef" TEXT NOT NULL,
    "audioContentType" TEXT,
    "startSeconds" INTEGER,
    "country" TEXT,
    "language" TEXT,
    "genresJson" TEXT,
    "tagsJson" TEXT,
    "playability" TEXT NOT NULL DEFAULT 'playable',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StoryMusicCatalogTrack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoryMusicCatalogTrack_rightsRecordId_key" ON "StoryMusicCatalogTrack"("rightsRecordId");
CREATE INDEX IF NOT EXISTS "StoryMusicCatalogTrack_playability_idx" ON "StoryMusicCatalogTrack"("playability");
CREATE INDEX IF NOT EXISTS "StoryMusicCatalogTrack_country_idx" ON "StoryMusicCatalogTrack"("country");

ALTER TABLE "StoryMusicCatalogTrack" DROP CONSTRAINT IF EXISTS "StoryMusicCatalogTrack_rightsRecordId_fkey";
ALTER TABLE "StoryMusicCatalogTrack" ADD CONSTRAINT "StoryMusicCatalogTrack_rightsRecordId_fkey" FOREIGN KEY ("rightsRecordId") REFERENCES "StoryMusicRightsRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StoryMusicRightsEvidence" (
    "id" TEXT NOT NULL,
    "rightsRecordId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteLength" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryMusicRightsEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoryMusicRightsEvidence_rightsRecordId_idx" ON "StoryMusicRightsEvidence"("rightsRecordId");

ALTER TABLE "StoryMusicRightsEvidence" DROP CONSTRAINT IF EXISTS "StoryMusicRightsEvidence_rightsRecordId_fkey";
ALTER TABLE "StoryMusicRightsEvidence" ADD CONSTRAINT "StoryMusicRightsEvidence_rightsRecordId_fkey" FOREIGN KEY ("rightsRecordId") REFERENCES "StoryMusicRightsRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StoryMusicAdminAuditEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metaJson" TEXT,
    "rightsRecordId" TEXT,

    CONSTRAINT "StoryMusicAdminAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoryMusicAdminAuditEvent_at_idx" ON "StoryMusicAdminAuditEvent"("at");
CREATE INDEX IF NOT EXISTS "StoryMusicAdminAuditEvent_actorUserId_idx" ON "StoryMusicAdminAuditEvent"("actorUserId");

ALTER TABLE "StoryMusicAdminAuditEvent" DROP CONSTRAINT IF EXISTS "StoryMusicAdminAuditEvent_rightsRecordId_fkey";
ALTER TABLE "StoryMusicAdminAuditEvent" ADD CONSTRAINT "StoryMusicAdminAuditEvent_rightsRecordId_fkey" FOREIGN KEY ("rightsRecordId") REFERENCES "StoryMusicRightsRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StoryMusicLegacyMigrationMap" (
    "legacyTrackId" TEXT NOT NULL,
    "rightsRecordId" TEXT,
    "catalogTrackId" TEXT,
    "audioStorageRef" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "StoryMusicLegacyMigrationMap_pkey" PRIMARY KEY ("legacyTrackId")
);
