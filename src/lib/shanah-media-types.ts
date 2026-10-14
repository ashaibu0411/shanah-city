export type ShanahMediaKind =
  | "sermon-audio"
  | "devotion-audio"
  | "worship-practice"
  | "worship-rehearsal"
  | "academy"
  | "training"
  | "other";

export type ShanahMediaItem = {
  id: string;
  kind: ShanahMediaKind;
  title: string;
  artist: string;
  artworkUrl?: string;
  audioUrl: string;
  contentType?: string;
  href?: string;
  /** Stable key for resume position in local storage */
  resumeKey?: string;
};

export const SHANAH_MEDIA_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type ShanahMediaSpeed = (typeof SHANAH_MEDIA_SPEEDS)[number];
