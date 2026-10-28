import { prisma } from "@/lib/db";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import type { StoryMusicSearchFilters, StoryMusicTrackRecord } from "@/lib/story-music/types";
import { mapDbCatalogToTrack, mapLegacyMigrationToTrack } from "@/lib/story-music/story-music-db-map";
import { matchesStoryMusicSearch } from "@/lib/story-music/search";

export async function findDbCatalogTrackById(
  trackId: string,
  viewerCountry?: string | null,
): Promise<StoryMusicTrackRecord | null> {
  const id = trackId.trim();
  if (!id) return null;

  const catalog = await prisma.storyMusicCatalogTrack.findUnique({
    where: { id },
    include: { rightsRecord: true },
  });
  if (catalog?.rightsRecord) {
    const mapped = mapDbCatalogToTrack(catalog, catalog.rightsRecord, viewerCountry);
    if (mapped) return mapped;
  }

  const migration = await prisma.storyMusicLegacyMigrationMap.findUnique({
    where: { legacyTrackId: id },
  });
  if (migration?.status === "published" && migration.audioStorageRef?.trim()) {
    const legacy = findCommunityStoryMusicTrack(id);
    if (legacy) {
      return mapLegacyMigrationToTrack({
        legacyTrackId: id,
        title: legacy.title,
        artist: legacy.artist,
        audioStorageRef: migration.audioStorageRef,
        startSeconds: legacy.startSeconds,
        tags: legacy.tags,
      });
    }
  }

  return null;
}

export async function searchDbCatalogTracks(
  filters: StoryMusicSearchFilters,
  viewerCountry?: string | null,
): Promise<StoryMusicTrackRecord[]> {
  const limit = filters.limit ?? 32;
  const catalogs = await prisma.storyMusicCatalogTrack.findMany({
    where: { playability: "playable", revokedAt: null },
    include: { rightsRecord: true },
    take: 200,
  });

  const tracks: StoryMusicTrackRecord[] = [];
  for (const catalog of catalogs) {
    if (!catalog.rightsRecord) continue;
    const mapped = mapDbCatalogToTrack(catalog, catalog.rightsRecord, viewerCountry);
    if (!mapped) continue;
    if (filters.attachableOnly && mapped.playability !== "playable") continue;
    if (!matchesStoryMusicSearch(mapped, filters)) continue;
    tracks.push(mapped);
  }

  return tracks.slice(0, limit);
}

export async function listDbRightsRecords() {
  return prisma.storyMusicRightsRecord.findMany({ orderBy: { updatedAt: "desc" } });
}
