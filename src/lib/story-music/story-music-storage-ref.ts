import {
  STORY_MUSIC_AUDIO_BLOB_PREFIX,
  STORY_MUSIC_EVIDENCE_BLOB_PREFIX,
} from "@/lib/story-music/story-music-blob";

export const STORY_MUSIC_BLOB_REF_SCHEME = "story-music://blob/";
export const STORY_MUSIC_EVIDENCE_REF_SCHEME = "story-music://evidence/";
/** Local test WAV only — not for production catalog. */
export const STORY_MUSIC_TEST_REF_SCHEME = "story-music://test/";

export function encodeAudioBlobRef(pathname: string) {
  const clean = pathname.replace(/^\/+/, "");
  if (!clean.startsWith(STORY_MUSIC_AUDIO_BLOB_PREFIX)) {
    throw new Error("Audio blob path must use story-music/audio/ prefix.");
  }
  if (clean.includes("..")) throw new Error("Invalid blob path.");
  return `${STORY_MUSIC_BLOB_REF_SCHEME}${clean}`;
}

export function encodeEvidenceBlobRef(pathname: string) {
  const clean = pathname.replace(/^\/+/, "");
  if (!clean.startsWith(STORY_MUSIC_EVIDENCE_BLOB_PREFIX)) {
    throw new Error("Evidence blob path must use story-music/evidence/ prefix.");
  }
  if (clean.includes("..")) throw new Error("Invalid blob path.");
  return `${STORY_MUSIC_EVIDENCE_REF_SCHEME}${clean}`;
}

export function decodeBlobPathname(ref: string): string | null {
  if (ref.startsWith(STORY_MUSIC_BLOB_REF_SCHEME)) {
    const pathname = ref.slice(STORY_MUSIC_BLOB_REF_SCHEME.length);
    if (!pathname || pathname.includes("..")) return null;
    return pathname;
  }
  if (ref.startsWith(STORY_MUSIC_EVIDENCE_REF_SCHEME)) {
    const pathname = ref.slice(STORY_MUSIC_EVIDENCE_REF_SCHEME.length);
    if (!pathname || pathname.includes("..")) return null;
    return pathname;
  }
  return null;
}

export function isStoryMusicTestRef(ref: string) {
  return ref.startsWith(STORY_MUSIC_TEST_REF_SCHEME);
}

/** Relative path under `test-fixtures/` (e.g. story-music-poc/ghana-worship-poc.wav). */
export function decodeTestFixtureRelativePath(ref: string): string | null {
  if (!isStoryMusicTestRef(ref)) return null;
  const rel = ref.slice(STORY_MUSIC_TEST_REF_SCHEME.length).replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  if (rel.startsWith("story-music-poc/")) return rel;
  return `story-music-poc/${rel}`;
}
