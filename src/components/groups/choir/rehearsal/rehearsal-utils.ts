import { visiblePracticeStemsForUser, WORSHIP_PART_ROLES, type WorshipSong } from "@/lib/worship-types";

export type SongPrepStatus = "ready" | "not_started";

export function songPrepStatus(song: WorshipSong, userId?: string): SongPrepStatus {
  if (!userId) return "not_started";
  return song.preparedBy.includes(userId) ? "ready" : "not_started";
}

export function songPrepLabel(status: SongPrepStatus) {
  return status === "ready" ? "Ready" : "Not started";
}

export function vocalStemsForSong(
  song: WorshipSong,
  options?: { userId?: string; isManager?: boolean },
) {
  const stems = visiblePracticeStemsForUser(song.practiceStems, options?.userId, options?.isManager);
  const vocalRoles = new Set<string>(
    WORSHIP_PART_ROLES.filter((entry) => entry.kind === "vocal").map((entry) => entry.value),
  );
  vocalRoles.add("full");
  vocalRoles.add("vocals");
  vocalRoles.add("harmony");
  return stems.filter((stem) => vocalRoles.has(stem.role));
}

export function instrumentalStemsForSong(
  song: WorshipSong,
  options?: { userId?: string; isManager?: boolean },
) {
  const stems = visiblePracticeStemsForUser(song.practiceStems, options?.userId, options?.isManager);
  const instrumentRoles = new Set<string>(
    WORSHIP_PART_ROLES.filter((entry) => entry.kind === "instrument").map((entry) => entry.value),
  );
  instrumentRoles.add("instrumental");
  return stems.filter((stem) => instrumentRoles.has(stem.role));
}

export function hasApprovedPracticeAudio(
  song: WorshipSong,
  options?: { userId?: string; isManager?: boolean },
) {
  const stems = visiblePracticeStemsForUser(song.practiceStems, options?.userId, options?.isManager);
  return stems.length > 0 || Boolean(song.youtubeVideoId);
}

export function parseRehearsalNoteBullets(notes: string) {
  return notes
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, ""));
}
