/**
 * Read-only aggregate: story musicTrackId usage counts (no member ids).
 */
import legacyCatalog from "../data/community-story-music.json";
import { prisma } from "../src/lib/db";

function titleForTrackId(trackId: string) {
  const tracks = (legacyCatalog as { tracks?: { id: string; title: string; artist: string }[] }).tracks ?? [];
  const row = tracks.find((t) => t.id === trackId);
  if (!row) return null;
  return `${row.title} · ${row.artist}`;
}

async function main() {
  const now = new Date();
  const all = await prisma.communityStatus.groupBy({
    by: ["musicTrackId"],
    where: { musicTrackId: { not: null } },
    _count: { _all: true },
  });

  const active = await prisma.communityStatus.groupBy({
    by: ["musicTrackId"],
    where: { musicTrackId: { not: null }, expiresAt: { gt: now } },
    _count: { _all: true },
  });

  const activeMap = new Map(active.map((row) => [row.musicTrackId, row._count._all]));

  const ranked = all
    .map((row) => ({
      musicTrackId: row.musicTrackId,
      totalStories: row._count._all,
      activeStories: activeMap.get(row.musicTrackId) ?? 0,
      legacyCatalogLabel: titleForTrackId(row.musicTrackId ?? ""),
    }))
    .sort((a, b) => b.totalStories - a.totalStories);

  const report = {
    generatedAt: now.toISOString(),
    note: "Aggregate counts only — no author or member identifiers.",
    distinctTrackIds: ranked.length,
    rows: ranked,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
