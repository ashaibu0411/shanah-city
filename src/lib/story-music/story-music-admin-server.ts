import type { PublicMember } from "@/lib/auth-types";
import type { StoryMusicRightsRecord } from "@/lib/story-music/story-music-rights-types";
import { appendStoryMusicAdminAudit } from "@/lib/story-music/story-music-admin-audit";
import { assertStoryMusicAdminWriteEnabled } from "@/lib/story-music/story-music-admin-access";
import {
  listStoryMusicRightsRecords,
  loadAuthorizedProductionTracks,
  rightsRecordIsExpired,
  saveAuthorizedProductionCatalog,
  saveStoryMusicRightsRecords,
} from "@/lib/story-music/story-music-authorized-store";
import { isAllowedCatalogLocalAudioPath } from "@/lib/story-music/story-music-audio-security";
import { isStoryMusicTestTrackId } from "@/lib/story-music/story-music-audio-security";
import type { CreateIntakeInput } from "@/lib/story-music/story-music-admin-types";

export type { CreateIntakeInput };

function slugId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createStoryMusicIntake(
  actor: PublicMember,
  input: CreateIntakeInput,
): Promise<StoryMusicRightsRecord> {
  assertStoryMusicAdminWriteEnabled();

  const artist = input.artist.trim();
  const title = input.title.trim();
  if (!artist || !title) throw new Error("Artist and title are required.");

  const catalogTrackId =
    input.catalogTrackId?.trim() ||
    slugId(`${artist}-${title}`) ||
    `track-${Date.now().toString(36)}`;

  if (isStoryMusicTestTrackId(catalogTrackId)) {
    throw new Error("Catalog id cannot use poc- prefix.");
  }

  const now = new Date().toISOString();
  const record: StoryMusicRightsRecord = {
    id: `smr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "draft",
    artist,
    title,
    recordingOwner: input.recordingOwner.trim(),
    compositionPublishing: input.compositionPublishing.trim(),
    documentReference: input.documentReference.trim(),
    authorizedUses: input.authorizedUses.trim() || "In-app story background audio",
    streamingPermitted: Boolean(input.streamingPermitted),
    storagePermitted: Boolean(input.storagePermitted),
    territory: input.territory.trim() || "Worldwide",
    licenseStartDate: input.licenseStartDate?.trim(),
    licenseEndDate: input.licenseEndDate?.trim(),
    revocationContact: input.revocationContact?.trim(),
    catalogTrackId,
    audioPath: input.audioPath?.trim(),
    country: input.country?.trim(),
    language: input.language?.trim(),
    genres: input.genres,
    tags: input.tags,
    startSeconds: input.startSeconds,
    createdAt: now,
    updatedAt: now,
    notes: input.notes?.trim(),
  };

  const records = await listStoryMusicRightsRecords();
  records.push(record);
  await saveStoryMusicRightsRecords(records);

  await appendStoryMusicAdminAudit({
    actorUserId: actor.id,
    actorName: actor.name,
    action: "intake_create",
    targetId: record.id,
    summary: `Created intake draft for ${title} / ${artist}`,
    meta: { catalogTrackId },
  });

  return record;
}

export async function verifyStoryMusicIntake(actor: PublicMember, recordId: string) {
  assertStoryMusicAdminWriteEnabled();
  const records = await listStoryMusicRightsRecords();
  const record = records.find((r) => r.id === recordId);
  if (!record) throw new Error("Intake record not found.");

  if (!record.documentReference) {
    throw new Error("Document reference is required before verification.");
  }
  if (!record.streamingPermitted || !record.storagePermitted) {
    throw new Error("Streaming and storage permissions must be confirmed.");
  }
  if (!record.authorizedUses.toLowerCase().includes("story")) {
    throw new Error("Authorized uses must mention story background use.");
  }

  record.status = "rights_verified";
  record.verifiedAt = new Date().toISOString();
  record.verifiedByUserId = actor.id;
  record.updatedAt = record.verifiedAt;
  await saveStoryMusicRightsRecords(records);

  await appendStoryMusicAdminAudit({
    actorUserId: actor.id,
    actorName: actor.name,
    action: "intake_verify",
    targetId: record.id,
    summary: `Verified rights for ${record.title}`,
  });

  return record;
}

export async function publishStoryMusicIntake(actor: PublicMember, recordId: string) {
  assertStoryMusicAdminWriteEnabled();
  const records = await listStoryMusicRightsRecords();
  const record = records.find((r) => r.id === recordId);
  if (!record) throw new Error("Intake record not found.");

  if (record.status !== "rights_verified") {
    throw new Error("Only rights_verified records can be published.");
  }
  if (rightsRecordIsExpired(record)) {
    throw new Error("License end date has passed.");
  }

  const audioPath = record.audioPath?.trim();
  if (!audioPath || !isAllowedCatalogLocalAudioPath(audioPath)) {
    throw new Error("Audio path must point to an approved story-music/ file.");
  }

  record.status = "published";
  record.publishedAt = new Date().toISOString();
  record.updatedAt = record.publishedAt;
  await saveStoryMusicRightsRecords(records);

  const catalog = await loadAuthorizedProductionTracks();
  const without = catalog.filter((t) => t.id !== record.catalogTrackId);
  without.push({
    id: record.catalogTrackId,
    title: record.title,
    artist: record.artist,
    providerTrackId: pathBasename(audioPath),
    audioPath,
    country: record.country,
    language: record.language,
    genres: record.genres,
    tags: record.tags,
    startSeconds: record.startSeconds,
    rightsRecordId: record.id,
  });
  await saveAuthorizedProductionCatalog(without);

  await appendStoryMusicAdminAudit({
    actorUserId: actor.id,
    actorName: actor.name,
    action: "intake_publish",
    targetId: record.id,
    summary: `Published ${record.title} to authorized catalog`,
    meta: { catalogTrackId: record.catalogTrackId },
  });

  return record;
}

function pathBasename(audioPath: string) {
  const parts = audioPath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "track";
}

export async function revokeStoryMusicIntake(actor: PublicMember, recordId: string, reason?: string) {
  assertStoryMusicAdminWriteEnabled();
  const records = await listStoryMusicRightsRecords();
  const record = records.find((r) => r.id === recordId);
  if (!record) throw new Error("Intake record not found.");

  record.status = "revoked";
  record.revokedAt = new Date().toISOString();
  record.updatedAt = record.revokedAt;
  if (reason?.trim()) record.notes = `${record.notes ?? ""}\nRevoked: ${reason.trim()}`.trim();
  await saveStoryMusicRightsRecords(records);

  const catalog = await loadAuthorizedProductionTracks();
  await saveAuthorizedProductionCatalog(catalog.filter((t) => t.rightsRecordId !== record.id));

  await appendStoryMusicAdminAudit({
    actorUserId: actor.id,
    actorName: actor.name,
    action: "intake_revoke",
    targetId: record.id,
    summary: `Revoked ${record.title}`,
    meta: reason ? { reason: reason.slice(0, 200) } : undefined,
  });

  return record;
}
