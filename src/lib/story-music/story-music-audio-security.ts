import path from "path";
import { realpathSync, existsSync } from "fs";

/** Local public paths allowed for authorized hybrid catalog audio (under `public/`). */
export const STORY_MUSIC_LOCAL_AUDIO_PREFIXES = ["story-music/"] as const;

const STORY_MUSIC_TEST_FIXTURE_SUBDIR = "story-music-poc";

export function storyMusicPocCatalogEnabled() {
  return process.env.STORY_MUSIC_POC_CATALOG_ENABLED?.trim() === "1";
}

export function isStoryMusicTestTrackId(trackId: string) {
  return trackId.trim().toLowerCase().startsWith("poc-");
}

/** POC / QA entries must not appear in production search or attach unless explicitly enabled. */
export function storyMusicTestTrackVisible(trackId: string) {
  if (!isStoryMusicTestTrackId(trackId)) return true;
  return storyMusicPocCatalogEnabled();
}

export function allowedRemoteAudioHosts(): Set<string> {
  const fromEnv = (process.env.STORY_MUSIC_REMOTE_AUDIO_HOST_ALLOWLIST ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const defaults = ["blob.vercel-storage.com"];
  return new Set([...defaults, ...fromEnv]);
}

export function isAllowedRemoteAudioUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    const allowed = allowedRemoteAudioHosts();
    for (const entry of allowed) {
      if (host === entry || host.endsWith(`.${entry}`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isAllowedCatalogLocalAudioPath(audioPath: string): boolean {
  const normalized = audioPath.trim().replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\\")) return false;
  return STORY_MUSIC_LOCAL_AUDIO_PREFIXES.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix),
  );
}

/** Local `public/story-music/` paths or private Blob refs for authorized catalog audio. */
export function isAllowedCatalogAudioStorageRef(audioPath: string): boolean {
  const normalized = audioPath.trim();
  if (!normalized) return false;
  if (normalized.startsWith("story-music://blob/")) {
    const pathname = normalized.slice("story-music://blob/".length);
    return Boolean(pathname) && !pathname.includes("..") && pathname.startsWith("story-music/audio/");
  }
  return isAllowedCatalogLocalAudioPath(normalized);
}

/**
 * Resolve a catalog audioPath to a file under `public/`, or null if traversal / prefix violation.
 */
export function resolveCatalogLocalPublicFile(audioPath: string): string | null {
  if (!isAllowedCatalogLocalAudioPath(audioPath)) return null;
  const normalized = audioPath.trim().replace(/^\/+/, "");
  const absolute = path.join(process.cwd(), "public", normalized);
  if (!existsSync(absolute)) return null;
  try {
    const resolved = realpathSync(absolute);
    const publicRoot = realpathSync(path.join(process.cwd(), "public"));
    if (!resolved.startsWith(publicRoot + path.sep) && resolved !== publicRoot) return null;
    return resolved;
  } catch {
    return null;
  }
}

/**
 * QA synthesized WAVs live under `test-fixtures/` (never deployed as static gospel assets).
 * Only used when STORY_MUSIC_POC_CATALOG_ENABLED=1 (local/staging).
 */
export function resolveStoryMusicTestFixtureFile(relativePath: string): string | null {
  if (!storyMusicPocCatalogEnabled()) return null;
  const normalized = relativePath.trim().replace(/^\/+/, "").replace(/\\/g, "/");
  if (!normalized || normalized.includes("..")) return null;
  if (
    normalized !== STORY_MUSIC_TEST_FIXTURE_SUBDIR &&
    !normalized.startsWith(`${STORY_MUSIC_TEST_FIXTURE_SUBDIR}/`)
  ) {
    return null;
  }
  const absolute = path.join(process.cwd(), "test-fixtures", normalized);
  if (!existsSync(absolute)) return null;
  try {
    const resolved = realpathSync(absolute);
    const fixtureRoot = realpathSync(path.join(process.cwd(), "test-fixtures"));
    if (!resolved.startsWith(fixtureRoot + path.sep) && resolved !== fixtureRoot) return null;
    return resolved;
  } catch {
    return null;
  }
}
