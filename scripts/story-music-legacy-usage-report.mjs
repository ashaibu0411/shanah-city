/**
 * Read-only aggregate: story musicTrackId usage counts (no member ids).
 * Usage: node scripts/story-music-legacy-usage-report.mjs
 */
import { PrismaClient } from "@prisma/client";
import legacyCatalog from "../data/community-story-music.json" with { type: "json" };

const prisma = new PrismaClient();

function titleForTrackId(trackId) {
  const row = (legacyCatalog.tracks ?? []).find((t) => t.id === trackId);
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
      legacyCatalogLabel: titleForTrackId(row.musicTrackId),
    }))
    .sort((a, b) => b.totalStories - a.totalStories);

  const report = {
    generatedAt: now.toISOString(),
    note: "Aggregate counts only — no author or member identifiers.",
    distinctTrackIds: ranked.length,
    rows: ranked,
  };

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
