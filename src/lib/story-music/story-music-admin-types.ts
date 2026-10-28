import type { StoryMusicGenre } from "@/lib/story-music/types";

export type CreateIntakeInput = {
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
  catalogTrackId?: string;
  audioPath?: string;
  country?: string;
  language?: string;
  genres?: StoryMusicGenre[];
  tags?: string[];
  startSeconds?: number;
  notes?: string;
};
