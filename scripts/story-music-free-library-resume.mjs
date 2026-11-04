import { readFileSync } from "fs";
import path from "path";
import { head } from "@vercel/blob";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "data", "story-music-authorized-catalog.json");
const RIGHTS_PATH = path.join(ROOT, "data", "story-music-rights-records.json");

export function blobPathFromAudioPath(audioPath) {
  const prefix = "story-music://blob/";
  if (!audioPath?.startsWith(prefix)) return null;
  return audioPath.slice(prefix.length);
}

export function loadFreeLibraryPublishState() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const rights = JSON.parse(readFileSync(RIGHTS_PATH, "utf8"));
  const publishedRights = new Map(
    (rights.records ?? [])
      .filter((r) => r.status === "published")
      .map((r) => [r.catalogTrackId, r]),
  );
  const tracks = new Map(
    (catalog.tracks ?? [])
      .filter((t) => t.tags?.includes("free-library"))
      .map((t) => [t.id, t]),
  );
  return { catalog, rights, publishedRights, tracks };
}

/**
 * Track is fully published when catalog + rights rows exist for catalogTrackId.
 */
export function isCatalogAndRightsPublished(catalogTrackId) {
  const { publishedRights, tracks } = loadFreeLibraryPublishState();
  const track = tracks.get(catalogTrackId);
  const record = publishedRights.get(catalogTrackId);
  if (!track || !record) return false;
  if (record.audioPath && track.audioPath && record.audioPath !== track.audioPath) return false;
  return true;
}

export async function isBlobObjectPresent(catalogTrackId, token) {
  const { tracks } = loadFreeLibraryPublishState();
  const track = tracks.get(catalogTrackId);
  if (!track?.audioPath || !token?.trim()) return false;
  const blobPath = blobPathFromAudioPath(track.audioPath);
  if (!blobPath) return false;
  try {
    await head(blobPath, { token: token.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip re-import when catalog, rights, and Blob object are all verified.
 */
export async function shouldSkipVerifiedImport(catalogTrackId, token, { force = false } = {}) {
  if (force) return { skip: false, reason: null };
  if (!isCatalogAndRightsPublished(catalogTrackId)) {
    return { skip: false, reason: "not published in catalog/rights" };
  }
  const blobOk = await isBlobObjectPresent(catalogTrackId, token);
  if (!blobOk) {
    return { skip: false, reason: "catalog published but Blob object missing" };
  }
  return { skip: true, reason: "verified catalog, rights, and Blob" };
}
