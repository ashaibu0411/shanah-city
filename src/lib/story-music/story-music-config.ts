/** Hybrid story music (authorized audio + licensed catalog). Off in production until rollout. */
export function storyMusicHybridEnabled() {
  return process.env.STORY_MUSIC_HYBRID_ENABLED?.trim() === "1";
}

/** Client hint — set alongside STORY_MUSIC_HYBRID_ENABLED for compose/viewer behavior. */
export function storyMusicHybridClientEnabled() {
  return process.env.NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED?.trim() === "1";
}

/** Phase 2: Prisma-backed catalog, rights, audit (JSON fallback when off). */
export function storyMusicDbCatalogEnabled() {
  return process.env.STORY_MUSIC_DB_CATALOG?.trim() === "1";
}

/** Free licensed worship library (native audio). Requires hybrid + published authorized tracks. */
export function storyMusicFreeLibraryEnabled() {
  return process.env.STORY_MUSIC_FREE_LIBRARY_ENABLED?.trim() === "1";
}
