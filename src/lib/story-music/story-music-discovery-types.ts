import type { StoryMusicGenre } from "@/lib/story-music/types";
import type { StoryMusicFreeLicenseClass } from "@/lib/story-music/story-music-free-license";

export type StoryMusicDiscoverySource = "openverse" | "fma_archive" | "wikimedia_commons";

export type StoryMusicDiscoveryReviewStatus =
  | "discovered"
  | "needs_review"
  | "rights_verified"
  | "audio_tested"
  | "approved"
  | "published"
  | "rejected"
  | "revoked"
  | "unavailable";

export type StoryMusicDiscoveryCandidate = {
  id: string;
  source: StoryMusicDiscoverySource;
  /** Stable id from the source API (Openverse id, IA identifier, Commons file title). */
  sourceStableId: string;
  dedupeKey: string;
  title: string;
  artist: string;
  category: StoryMusicGenre;
  sourcePageUrl: string;
  recordingUrl: string;
  licenseSlug: string;
  licenseUrl: string;
  licenseClass: StoryMusicFreeLicenseClass | "rejected";
  attributionStatement?: string;
  compositionRightsNote?: string;
  recordingRightsNote?: string;
  rightsEvidenceRef?: string;
  durationSec?: number;
  fileFormat?: string;
  reviewStatus: StoryMusicDiscoveryReviewStatus;
  rejectionReason?: string;
  discoveredAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  approvedAt?: string;
  publishedCatalogTrackId?: string;
  tags?: string[];
  searchQuery?: string;
};
