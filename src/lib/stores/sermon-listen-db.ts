import { prisma } from "@/lib/db";

export type SermonListenRecord = {
  youtubeVideoId: string;
  title: string | null;
  audioUrl: string;
  audioFileName: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRecord(record: {
  youtubeVideoId: string;
  title: string | null;
  audioUrl: string;
  audioFileName: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SermonListenRecord {
  return {
    youtubeVideoId: record.youtubeVideoId,
    title: record.title,
    audioUrl: record.audioUrl,
    audioFileName: record.audioFileName,
    uploadedById: record.uploadedById,
    uploadedByName: record.uploadedByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getSermonListenAudioUrl(youtubeVideoId: string): Promise<string | null> {
  const row = await prisma.sermonListenAudio.findUnique({
    where: { youtubeVideoId },
    select: { audioUrl: true },
  });
  return row?.audioUrl?.trim() || null;
}

export async function listSermonListenRecords(limit = 40): Promise<SermonListenRecord[]> {
  const rows = await prisma.sermonListenAudio.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(mapRecord);
}

export async function upsertSermonListenRecord(input: {
  youtubeVideoId: string;
  title?: string;
  audioUrl: string;
  audioFileName?: string;
  uploadedById?: string;
  uploadedByName?: string;
}) {
  const record = await prisma.sermonListenAudio.upsert({
    where: { youtubeVideoId: input.youtubeVideoId },
    create: {
      youtubeVideoId: input.youtubeVideoId,
      title: input.title?.trim() || null,
      audioUrl: input.audioUrl,
      audioFileName: input.audioFileName ?? null,
      uploadedById: input.uploadedById ?? null,
      uploadedByName: input.uploadedByName ?? null,
    },
    update: {
      title: input.title?.trim() || null,
      audioUrl: input.audioUrl,
      audioFileName: input.audioFileName ?? null,
      uploadedById: input.uploadedById ?? null,
      uploadedByName: input.uploadedByName ?? null,
    },
  });
  return mapRecord(record);
}
