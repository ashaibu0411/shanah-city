import { readFileSync, statSync } from "fs";
import path from "path";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import { mapAuthorizedCatalogRow } from "@/lib/story-music/story-music-authorized-store";
import type { StoryMusicLegacyMigrationEntry } from "@/lib/story-music/story-music-rights-types";
import { isAllowedCatalogLocalAudioPath } from "@/lib/story-music/story-music-audio-security";
import { STORY_MUSIC_BLOB_REF_SCHEME } from "@/lib/story-music/story-music-storage-ref";
import { trackVisibleInServerCatalog } from "@/lib/story-music/story-music-pilot-access";

function productionAudioPathAllowed(audioPath: string) {
  const normalized = audioPath.trim();
  if (!normalized) return false;
  if (normalized.startsWith(STORY_MUSIC_BLOB_REF_SCHEME)) return true;
  return isAllowedCatalogLocalAudioPath(normalized);
}

const CATALOG_PATH = path.join(process.cwd(), "data", "story-music-authorized-catalog.json");
const MIGRATION_PATH = path.join(process.cwd(), "data", "story-music-legacy-migration-map.json");

let catalogCache: { mtimeMs: number; tracks: StoryMusicTrackRecord[] } | null = null;
let migrationCache: { mtimeMs: number; mappings: StoryMusicLegacyMigrationEntry[] } | null = null;

function fileMtimeMs(filePath: string) {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

export function loadAuthorizedProductionTrackRecords(): StoryMusicTrackRecord[] {
  const mtimeMs = fileMtimeMs(CATALOG_PATH);
  if (catalogCache && catalogCache.mtimeMs === mtimeMs) return catalogCache.tracks;

  try {
    const raw = readFileSync(CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      tracks?: Array<
        Parameters<typeof mapAuthorizedCatalogRow>[0] & { status?: string }
      >;
    };
    const tracks = (parsed.tracks ?? [])
      .filter((row) => trackVisibleInServerCatalog(row))
      .map(mapAuthorizedCatalogRow)
      .filter((t) => {
        if (t.playability === "unavailable") return true;
        return Boolean(t.audioPath && productionAudioPathAllowed(t.audioPath));
      });
    catalogCache = { mtimeMs, tracks };
    return tracks;
  } catch {
    catalogCache = { mtimeMs, tracks: [] };
    return [];
  }
}

export function loadLegacyMigrationOverrides(): Map<string, StoryMusicLegacyMigrationEntry> {
  const mtimeMs = fileMtimeMs(MIGRATION_PATH);
  if (migrationCache && migrationCache.mtimeMs === mtimeMs) {
    return new Map(migrationCache.mappings.map((m) => [m.legacyTrackId, m]));
  }

  try {
    const raw = readFileSync(MIGRATION_PATH, "utf8");
    const parsed = JSON.parse(raw) as { mappings?: StoryMusicLegacyMigrationEntry[] };
    const mappings = parsed.mappings ?? [];
    migrationCache = { mtimeMs, mappings };
    return new Map(mappings.map((m) => [m.legacyTrackId, m]));
  } catch {
    migrationCache = { mtimeMs, mappings: [] };
    return new Map();
  }
}

export function legacyMigrationAudioPath(trackId: string): string | null {
  const entry = loadLegacyMigrationOverrides().get(trackId);
  if (!entry || entry.status !== "published") return null;
  const audioPath = entry.audioPath?.trim();
  if (!audioPath || !isAllowedCatalogLocalAudioPath(audioPath)) return null;
  return audioPath;
}
