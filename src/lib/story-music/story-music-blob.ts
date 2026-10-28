/**
 * Story music Blob credentials — isolated from public community BLOB_READ_WRITE_TOKEN.
 */

export function getStoryMusicAudioBlobToken(): string | null {
  return process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export function getStoryMusicEvidenceBlobToken(): string | null {
  return (
    process.env.STORY_MUSIC_EVIDENCE_BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() ||
    null
  );
}

export function getStoryMusicAudioBlobStoreId(): string | null {
  return process.env.STORY_MUSIC_BLOB_STORE_ID?.trim() || null;
}

export function getStoryMusicEvidenceBlobStoreId(): string | null {
  return (
    process.env.STORY_MUSIC_EVIDENCE_BLOB_STORE_ID?.trim() ||
    process.env.STORY_MUSIC_BLOB_STORE_ID?.trim() ||
    null
  );
}

export function isStoryMusicAudioBlobConfigured() {
  return Boolean(getStoryMusicAudioBlobToken());
}

export function storyMusicAudioBlobOptions(): { token: string; storeId?: string } | null {
  const token = getStoryMusicAudioBlobToken();
  if (!token) return null;
  const storeId = getStoryMusicAudioBlobStoreId();
  return storeId ? { token, storeId } : { token };
}

export function storyMusicEvidenceBlobOptions(): { token: string; storeId?: string } | null {
  const token = getStoryMusicEvidenceBlobToken();
  if (!token) return null;
  const storeId = getStoryMusicEvidenceBlobStoreId();
  return storeId ? { token, storeId } : { token };
}

export const STORY_MUSIC_AUDIO_BLOB_PREFIX = "story-music/audio/";
export const STORY_MUSIC_EVIDENCE_BLOB_PREFIX = "story-music/evidence/";
