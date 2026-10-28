import { STORY_IMAGE_MS, STORY_IMAGE_WITH_MUSIC_MS } from "@/lib/community-story-utils";

/** Photo/text story timer length (progress bar), capped for music and member overlay audio. */
export function storyProgressDurationMs(input: {
  mediaType: string;
  hasMusic: boolean;
  hasMemberOverlay: boolean;
  memberAudioDurationMs?: number | null;
}) {
  if (input.mediaType === "video") return null;
  if (input.mediaType !== "image" && input.mediaType !== "text") return STORY_IMAGE_MS;

  const withSoundtrack = input.hasMusic || input.hasMemberOverlay;
  if (!withSoundtrack) return STORY_IMAGE_MS;

  const cap = STORY_IMAGE_WITH_MUSIC_MS;
  if (input.hasMemberOverlay && input.memberAudioDurationMs != null && input.memberAudioDurationMs > 0) {
    return Math.min(cap, Math.max(STORY_IMAGE_MS, Math.ceil(input.memberAudioDurationMs)));
  }
  return cap;
}
