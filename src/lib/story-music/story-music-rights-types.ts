export type StoryMusicRightsStatus =
  | "draft"
  | "proposed"
  | "rights_verified"
  | "published"
  | "revoked"
  | "expired"
  | "withdrawn";

import type { StoryMusicGenre } from "@/lib/story-music/types";

export type StoryMusicRightsRecord = {
  id: string;
  status: StoryMusicRightsStatus;
  artist: string;
  title: string;
  recordingOwner: string;
  compositionPublishing: string;
  documentReference: string;
  authorizedUses: string;
  streamingPermitted: boolean;
  storagePermitted: boolean;
  territory: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  revocationContact?: string;
  /** Stable catalog id — must match legacy id when remapping published stories. */
  catalogTrackId: string;
  audioPath?: string;
  country?: string;
  language?: string;
  genres?: StoryMusicGenre[];
  tags?: string[];
  startSeconds?: number;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  publishedAt?: string;
  revokedAt?: string;
  notes?: string;
};

export type StoryMusicLegacyMigrationEntry = {
  legacyTrackId: string;
  rightsRecordId?: string;
  audioPath?: string;
  status: "planned" | "ready" | "published" | "skipped";
  notes?: string;
};
