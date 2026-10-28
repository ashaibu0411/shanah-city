import type { PublicMember } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import {
  assertStoryMusicAdmin,
  assertStoryMusicAdminWriteEnabled,
  assertStoryMusicCurator,
  storyMusicActorRole,
} from "@/lib/story-music/story-music-admin-access";
import { appendStoryMusicDbAudit } from "@/lib/story-music/story-music-db-audit";
import { territoryCodesToJson } from "@/lib/story-music/story-music-db-map";
import { storyUseAuthorized } from "@/lib/story-music/story-music-policy";
import { isStoryMusicTestTrackId } from "@/lib/story-music/story-music-audio-security";
// CreateIntakeInput shape shared with JSON admin server
import type { CreateIntakeInput } from "@/lib/story-music/story-music-admin-types";

function slugId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createStoryMusicIntakeDb(actor: PublicMember, input: CreateIntakeInput) {
  await assertStoryMusicCurator(actor);
  assertStoryMusicAdminWriteEnabled();

  const artist = input.artist.trim();
  const title = input.title.trim();
  if (!artist || !title) throw new Error("Artist and title are required.");

  const catalogTrackId =
    input.catalogTrackId?.trim() || slugId(`${artist}-${title}`) || `track-${Date.now().toString(36)}`;
  if (isStoryMusicTestTrackId(catalogTrackId)) throw new Error("Catalog id cannot use poc- prefix.");

  const now = new Date();
  const record = await prisma.storyMusicRightsRecord.create({
    data: {
      id: `smr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "draft",
      artist,
      title,
      recordingOwner: input.recordingOwner.trim(),
      compositionPublishing: input.compositionPublishing.trim(),
      documentReference: input.documentReference.trim(),
      authorizedUses: input.authorizedUses.trim() || "In-app user-generated story background audio",
      streamingPermitted: Boolean(input.streamingPermitted),
      storagePermitted: Boolean(input.storagePermitted),
      territory: input.territory.trim() || "Worldwide",
      territoryCodesJson: input.country ? territoryCodesToJson([input.country]) : null,
      licenseStartDate: input.licenseStartDate ? new Date(input.licenseStartDate) : null,
      licenseEndDate: input.licenseEndDate ? new Date(input.licenseEndDate) : null,
      revocationContact: input.revocationContact?.trim(),
      catalogTrackId,
      country: input.country?.trim(),
      language: input.language?.trim(),
      genresJson: input.genres ? JSON.stringify(input.genres) : null,
      tagsJson: input.tags ? JSON.stringify(input.tags) : null,
      startSeconds: input.startSeconds ?? null,
      audioStorageRef: input.audioPath?.trim() || null,
      proposedByUserId: actor.id,
      notes: input.notes?.trim(),
      updatedAt: now,
    },
  });

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: await storyMusicActorRole(actor),
    action: "intake_create",
    targetType: "rights",
    targetId: record.id,
    summary: `Created intake draft for ${title}`,
    rightsRecordId: record.id,
  });

  return record;
}

export async function proposeStoryMusicIntakeDb(actor: PublicMember, recordId: string) {
  await assertStoryMusicCurator(actor);
  assertStoryMusicAdminWriteEnabled();
  const record = await prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
  if (!record || record.status !== "draft") throw new Error("Only draft records can be proposed.");

  const updated = await prisma.storyMusicRightsRecord.update({
    where: { id: recordId },
    data: { status: "proposed", proposedAt: new Date(), proposedByUserId: actor.id },
  });

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: await storyMusicActorRole(actor),
    action: "intake_update",
    targetType: "rights",
    targetId: recordId,
    summary: `Proposed ${updated.title} for rights review`,
    rightsRecordId: recordId,
  });

  return updated;
}

export async function verifyStoryMusicIntakeDb(actor: PublicMember, recordId: string) {
  await assertStoryMusicAdmin(actor);
  assertStoryMusicAdminWriteEnabled();

  const record = await prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
  if (!record || record.status !== "proposed") {
    throw new Error("Only proposed records can be verified.");
  }
  if (!record.documentReference.trim()) throw new Error("Document reference required.");
  if (!record.streamingPermitted || !record.storagePermitted) {
    throw new Error("Streaming and storage must be permitted.");
  }
  if (!storyUseAuthorized(record.authorizedUses)) {
    throw new Error("Authorized uses must include story background language.");
  }

  const evidenceCount = await prisma.storyMusicRightsEvidence.count({ where: { rightsRecordId: recordId } });
  if (evidenceCount === 0) throw new Error("Upload at least one evidence file before verification.");

  const updated = await prisma.storyMusicRightsRecord.update({
    where: { id: recordId },
    data: {
      status: "rights_verified",
      verifiedAt: new Date(),
      verifiedByUserId: actor.id,
    },
  });

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: "admin",
    action: "intake_verify",
    targetType: "rights",
    targetId: recordId,
    summary: `Verified rights for ${updated.title}`,
    rightsRecordId: recordId,
  });

  return updated;
}

export async function publishStoryMusicIntakeDb(actor: PublicMember, recordId: string) {
  await assertStoryMusicAdmin(actor);
  assertStoryMusicAdminWriteEnabled();

  const record = await prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
  if (!record || record.status !== "rights_verified") {
    throw new Error("Only rights_verified records can be published.");
  }
  if (!record.audioStorageRef?.trim()) throw new Error("Audio storage ref required.");

  const now = new Date();
  await prisma.$transaction([
    prisma.storyMusicRightsRecord.update({
      where: { id: recordId },
      data: { status: "published", publishedAt: now, publishedByUserId: actor.id },
    }),
    prisma.storyMusicCatalogTrack.upsert({
      where: { id: record.catalogTrackId },
      create: {
        id: record.catalogTrackId,
        rightsRecordId: record.id,
        title: record.title,
        artist: record.artist,
        audioStorageRef: record.audioStorageRef,
        audioContentType: record.audioContentType,
        startSeconds: record.startSeconds,
        country: record.country,
        language: record.language,
        genresJson: record.genresJson,
        tagsJson: record.tagsJson,
        playability: "playable",
        publishedAt: now,
      },
      update: {
        title: record.title,
        artist: record.artist,
        audioStorageRef: record.audioStorageRef,
        audioContentType: record.audioContentType,
        startSeconds: record.startSeconds,
        playability: "playable",
        revokedAt: null,
        publishedAt: now,
      },
    }),
  ]);

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: "admin",
    action: "intake_publish",
    targetType: "catalog",
    targetId: record.catalogTrackId,
    summary: `Published ${record.title}`,
    rightsRecordId: recordId,
  });

  return prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
}

export async function revokeStoryMusicIntakeDb(
  actor: PublicMember,
  recordId: string,
  reason?: string,
) {
  await assertStoryMusicAdmin(actor);
  assertStoryMusicAdminWriteEnabled();

  const record = await prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new Error("Record not found.");

  const now = new Date();
  await prisma.$transaction([
    prisma.storyMusicRightsRecord.update({
      where: { id: recordId },
      data: {
        status: "revoked",
        revokedAt: now,
        revokedByUserId: actor.id,
        revokeReason: reason?.trim() || null,
      },
    }),
    prisma.storyMusicCatalogTrack.updateMany({
      where: { rightsRecordId: recordId },
      data: { playability: "unavailable", revokedAt: now },
    }),
  ]);

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: "admin",
    action: "intake_revoke",
    targetType: "rights",
    targetId: recordId,
    summary: `Revoked ${record.title}`,
    metaJson: reason ? JSON.stringify({ reason: reason.slice(0, 200) }) : undefined,
    rightsRecordId: recordId,
  });

  return prisma.storyMusicRightsRecord.findUnique({ where: { id: recordId } });
}

export async function upsertLegacyMigrationMapDb(
  actor: PublicMember,
  input: {
    legacyTrackId: string;
    audioStorageRef?: string;
    status: string;
    rightsRecordId?: string;
    notes?: string;
  },
) {
  await assertStoryMusicAdmin(actor);
  assertStoryMusicAdminWriteEnabled();

  const row = await prisma.storyMusicLegacyMigrationMap.upsert({
    where: { legacyTrackId: input.legacyTrackId },
    create: {
      legacyTrackId: input.legacyTrackId,
      catalogTrackId: input.legacyTrackId,
      audioStorageRef: input.audioStorageRef ?? null,
      status: input.status,
      rightsRecordId: input.rightsRecordId ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
      updatedByUserId: actor.id,
    },
    update: {
      audioStorageRef: input.audioStorageRef ?? null,
      status: input.status,
      rightsRecordId: input.rightsRecordId ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
      updatedByUserId: actor.id,
    },
  });

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: "admin",
    action: "migration_map_update",
    targetType: "migration",
    targetId: input.legacyTrackId,
    summary: `Updated legacy map for ${input.legacyTrackId}`,
  });

  return row;
}

export async function attachStoryMusicEvidenceDb(
  actor: PublicMember,
  input: { rightsRecordId: string; label: string; storageRef: string; contentType: string; byteLength: number },
) {
  await assertStoryMusicCurator(actor);
  assertStoryMusicAdminWriteEnabled();

  const record = await prisma.storyMusicRightsRecord.findUnique({ where: { id: input.rightsRecordId } });
  if (!record) throw new Error("Rights record not found.");
  if (record.status === "published" || record.status === "revoked") {
    throw new Error("Cannot add evidence to closed intake.");
  }
  if (!input.storageRef.startsWith("story-music://evidence/")) {
    throw new Error("Invalid evidence storage reference.");
  }

  const evidence = await prisma.storyMusicRightsEvidence.create({
    data: {
      id: `sme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rightsRecordId: input.rightsRecordId,
      label: input.label.trim() || "Rights evidence",
      storageRef: input.storageRef,
      contentType: input.contentType,
      byteLength: input.byteLength,
      uploadedByUserId: actor.id,
    },
  });

  await appendStoryMusicDbAudit({
    actorUserId: actor.id,
    actorRole: await storyMusicActorRole(actor),
    action: "evidence_upload",
    targetType: "evidence",
    targetId: evidence.id,
    summary: `Uploaded evidence for ${record.title}`,
    rightsRecordId: input.rightsRecordId,
  });

  return evidence;
}
