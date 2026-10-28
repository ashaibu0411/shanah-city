import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { StoryMusicRightsRecord } from "@/lib/story-music/story-music-rights-types";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import type { StoryMusicLegacyMigrationEntry } from "@/lib/story-music/story-music-rights-types";

const RIGHTS_PATH = path.join(process.cwd(), "data", "story-music-rights-records.json");
const CATALOG_PATH = path.join(process.cwd(), "data", "story-music-authorized-catalog.json");
const MIGRATION_PATH = path.join(process.cwd(), "data", "story-music-legacy-migration-map.json");

type RightsFile = { version: string; records: StoryMusicRightsRecord[] };
type CatalogFile = {
  version: string;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    providerTrackId: string;
    audioPath: string;
    country?: string;
    language?: string;
    genres?: StoryMusicTrackRecord["genres"];
    tags?: string[];
    startSeconds?: number;
    rightsRecordId: string;
    /** Omit or `active` for attach/search; `inactive` / `revoked` hide from picker but preserve story ids. */
    status?: "active" | "inactive" | "revoked";
  }>;
};
type MigrationFile = { version: string; mappings: StoryMusicLegacyMigrationEntry[] };

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function listStoryMusicRightsRecords() {
  const file = await readJson<RightsFile>(RIGHTS_PATH, { version: "1", records: [] });
  return file.records;
}

export async function saveStoryMusicRightsRecords(records: StoryMusicRightsRecord[]) {
  await writeJson(RIGHTS_PATH, { version: "1", records });
}

export async function loadAuthorizedProductionTracks() {
  const file = await readJson<CatalogFile>(CATALOG_PATH, { version: "1", tracks: [] });
  return file.tracks;
}

export async function saveAuthorizedProductionCatalog(
  tracks: CatalogFile["tracks"],
) {
  await writeJson(CATALOG_PATH, { version: "1", tracks });
}

export async function loadLegacyMigrationMappings() {
  const file = await readJson<MigrationFile>(MIGRATION_PATH, { version: "1", mappings: [] });
  return file.mappings;
}

export async function saveLegacyMigrationMappings(mappings: StoryMusicLegacyMigrationEntry[]) {
  await writeJson(MIGRATION_PATH, { version: "1", mappings });
}

export function rightsRecordIsExpired(record: StoryMusicRightsRecord): boolean {
  if (!record.licenseEndDate) return false;
  const end = Date.parse(record.licenseEndDate);
  if (!Number.isFinite(end)) return false;
  return Date.now() > end;
}

export function mapAuthorizedCatalogRow(
  row: Awaited<ReturnType<typeof loadAuthorizedProductionTracks>>[number],
): StoryMusicTrackRecord {
  const status = row.status?.trim().toLowerCase();
  const revoked = status === "inactive" || status === "revoked";
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    provider: "church_authorized",
    providerTrackId: row.providerTrackId,
    playability: !revoked && row.audioPath?.trim() ? "playable" : "unavailable",
    unavailableReason: revoked ? "This song is no longer available for new stories." : undefined,
    country: row.country,
    language: row.language,
    genres: row.genres,
    tags: row.tags,
    startSeconds: row.startSeconds,
    audioPath: row.audioPath,
  };
}
