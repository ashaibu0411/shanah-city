/** Hybrid story music (authorized audio + licensed catalog). Off in production until rollout. */
export function storyMusicHybridEnabled() {
  return process.env.STORY_MUSIC_HYBRID_ENABLED?.trim() === "1";
}

/** Client hint — set alongside STORY_MUSIC_HYBRID_ENABLED for compose/viewer behavior. */
export function storyMusicHybridClientEnabled() {
  return process.env.NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED?.trim() === "1";
}
