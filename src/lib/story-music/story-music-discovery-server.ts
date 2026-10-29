import type { PublicMember } from "@/lib/auth-types";
import { assertStoryMusicAdminWriteEnabled } from "@/lib/story-music/story-music-admin-access";
import { appendStoryMusicAdminAudit } from "@/lib/story-music/story-music-admin-audit";
import { createStoryMusicIntake } from "@/lib/story-music/story-music-admin-server";
import type { StoryMusicDiscoveryReviewStatus } from "@/lib/story-music/story-music-discovery-types";
import {
  discoveryCandidateStats,
  loadStoryMusicDiscoveryCandidates,
  saveStoryMusicDiscoveryCandidates,
} from "@/lib/story-music/story-music-discovery-store";

const VALID_TRANSITIONS: Record<StoryMusicDiscoveryReviewStatus, StoryMusicDiscoveryReviewStatus[]> = {
  discovered: ["needs_review", "rejected", "unavailable"],
  needs_review: ["rights_verified", "rejected", "unavailable"],
  rights_verified: ["audio_tested", "rejected", "unavailable"],
  audio_tested: ["approved", "rejected", "unavailable"],
  approved: ["published", "rejected", "revoked"],
  published: ["revoked", "unavailable"],
  rejected: [],
  revoked: [],
  unavailable: ["needs_review"],
};

export async function getStoryMusicDiscoveryAdminPayload() {
  const candidates = await loadStoryMusicDiscoveryCandidates();
  return {
    candidates,
    stats: discoveryCandidateStats(candidates),
  };
}

export async function updateStoryMusicDiscoveryStatus(
  actor: PublicMember,
  candidateId: string,
  nextStatus: StoryMusicDiscoveryReviewStatus,
  notes?: string,
) {
  assertStoryMusicAdminWriteEnabled();
  const candidates = await loadStoryMusicDiscoveryCandidates();
  const row = candidates.find((c) => c.id === candidateId);
  if (!row) throw new Error("Discovery candidate not found.");

  const allowed = VALID_TRANSITIONS[row.reviewStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot move from ${row.reviewStatus} to ${nextStatus}.`);
  }

  if (nextStatus === "rights_verified" && row.licenseClass === "rejected") {
    throw new Error("Cannot verify rights on a rejected license.");
  }
  if (nextStatus === "approved" && !row.compositionRightsNote?.trim()) {
    throw new Error("Composition rights verification note is required before approval.");
  }
  if (nextStatus === "approved" && !row.recordingRightsNote?.trim()) {
    throw new Error("Recording rights verification note is required before approval.");
  }
  if (nextStatus === "approved" && !row.rightsEvidenceRef?.trim()) {
    throw new Error("Rights evidence reference is required before approval.");
  }

  const now = new Date().toISOString();
  row.reviewStatus = nextStatus;
  row.updatedAt = now;
  row.reviewedAt = now;
  row.reviewedByUserId = actor.id;
  if (notes?.trim()) {
    row.rejectionReason = nextStatus === "rejected" ? notes.trim() : row.rejectionReason;
  }
  if (nextStatus === "approved") row.approvedAt = now;

  await saveStoryMusicDiscoveryCandidates(candidates);

  await appendStoryMusicAdminAudit({
    actorUserId: actor.id,
    actorName: actor.name,
    action: "discovery_status",
    targetId: row.id,
    summary: `Discovery ${row.title}: ${nextStatus}`,
    meta: { source: row.source, nextStatus },
  });

  return row;
}

export async function promoteDiscoveryToIntakeDraft(actor: PublicMember, candidateId: string) {
  assertStoryMusicAdminWriteEnabled();
  const candidates = await loadStoryMusicDiscoveryCandidates();
  const row = candidates.find((c) => c.id === candidateId);
  if (!row) throw new Error("Discovery candidate not found.");
  if (row.reviewStatus !== "approved" && row.reviewStatus !== "published") {
    throw new Error("Only approved discovery rows can be promoted to intake.");
  }

  const record = await createStoryMusicIntake(actor, {
    artist: row.artist,
    title: row.title,
    recordingOwner: row.recordingRightsNote?.trim() || row.artist,
    compositionPublishing: row.compositionRightsNote?.trim() || "See discovery evidence",
    documentReference: row.rightsEvidenceRef?.trim() || row.sourcePageUrl,
    authorizedUses: "In-app user-generated story background audio (Shanah City Stories)",
    streamingPermitted: true,
    storagePermitted: true,
    territory: "Worldwide",
    genres: [row.category],
    tags: row.tags,
    notes: `Promoted from discovery ${row.id} (${row.source}). Source: ${row.sourcePageUrl}. License: ${row.licenseUrl}. ${row.attributionStatement ?? ""}`.trim(),
  });

  row.updatedAt = new Date().toISOString();
  await saveStoryMusicDiscoveryCandidates(candidates);

  return { candidate: row, intake: record };
}
