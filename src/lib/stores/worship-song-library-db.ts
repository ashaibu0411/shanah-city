import { prisma } from "@/lib/db";
import type { WorshipLibrarySong } from "@/lib/worship-types";

function mapSong(record: {
  id: string;
  title: string;
  artist: string | null;
  defaultKey: string;
  bpm: number | null;
  ccliNumber: string | null;
  chartUrl: string | null;
  chartFileName: string | null;
  notes: string | null;
  tags: unknown;
  useCount: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): WorshipLibrarySong {
  return {
    id: record.id,
    title: record.title,
    artist: record.artist ?? undefined,
    defaultKey: record.defaultKey,
    bpm: record.bpm ?? undefined,
    ccliNumber: record.ccliNumber ?? undefined,
    chartUrl: record.chartUrl ?? undefined,
    chartFileName: record.chartFileName ?? undefined,
    notes: record.notes ?? undefined,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : undefined,
    useCount: record.useCount,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listWorshipLibrarySongs(query?: string) {
  const records = await prisma.worshipSongLibrary.findMany({
    orderBy: [{ useCount: "desc" }, { title: "asc" }],
  });

  let songs = records.map(mapSong);
  if (query?.trim()) {
    const needle = query.trim().toLowerCase();
    songs = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(needle) ||
        song.artist?.toLowerCase().includes(needle) ||
        song.tags?.some((tag) => tag.toLowerCase().includes(needle)),
    );
  }

  return songs;
}

export async function getWorshipLibrarySong(id: string) {
  const record = await prisma.worshipSongLibrary.findUnique({ where: { id } });
  return record ? mapSong(record) : null;
}

export async function saveWorshipLibrarySong(input: {
  id?: string;
  title: string;
  artist?: string;
  defaultKey: string;
  bpm?: number;
  ccliNumber?: string;
  chartUrl?: string;
  chartFileName?: string;
  notes?: string;
  tags?: string[];
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const data = {
    title: input.title.trim(),
    artist: input.artist?.trim() || null,
    defaultKey: input.defaultKey.trim() || "C",
    bpm: input.bpm ?? null,
    ccliNumber: input.ccliNumber?.trim() || null,
    chartUrl: input.chartUrl?.trim() || null,
    chartFileName: input.chartFileName?.trim() || null,
    notes: input.notes?.trim() || null,
    tags: input.tags ?? [],
    updatedAt: now,
  };

  if (input.id) {
    const record = await prisma.worshipSongLibrary.update({
      where: { id: input.id },
      data,
    });
    return mapSong(record);
  }

  const record = await prisma.worshipSongLibrary.create({
    data: {
      id: `worship-song-${Date.now()}`,
      useCount: 0,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
      ...data,
    },
  });

  return mapSong(record);
}

export async function incrementWorshipLibraryUseCount(id: string) {
  await prisma.worshipSongLibrary.update({
    where: { id },
    data: { useCount: { increment: 1 } },
  });
}

export async function deleteWorshipLibrarySong(id: string) {
  try {
    await prisma.worshipSongLibrary.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
