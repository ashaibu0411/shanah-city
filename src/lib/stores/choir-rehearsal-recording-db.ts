import { prisma } from "@/lib/db";
import type { ChoirRehearsalLibraryRecording } from "@/lib/choir-rehearsal-recording-types";

function mapRecord(record: {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  category: string;
  mediaType: string;
  audioUrl: string;
  fileName: string;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  visibility: string;
  uploadStatus: string;
  recordedBy: string;
  recordedByName: string;
  serviceDate: string | null;
  serviceTime: string | null;
  songId: string | null;
  vocalPart: string | null;
  instrumentRole: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ChoirRehearsalLibraryRecording {
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    description: record.description,
    category: record.category as ChoirRehearsalLibraryRecording["category"],
    mediaType: record.mediaType === "video" ? "video" : "audio",
    audioUrl: record.audioUrl,
    fileName: record.fileName,
    fileSizeBytes: record.fileSizeBytes,
    durationSeconds: record.durationSeconds,
    visibility: record.visibility as ChoirRehearsalLibraryRecording["visibility"],
    uploadStatus: record.uploadStatus as ChoirRehearsalLibraryRecording["uploadStatus"],
    recordedBy: record.recordedBy,
    recordedByName: record.recordedByName,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    songId: record.songId,
    vocalPart: record.vocalPart,
    instrumentRole: record.instrumentRole,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt?.toISOString() ?? null,
  };
}

export async function listChoirRehearsalLibraryRecordings(options: {
  groupId: string;
  recordedBy?: string;
  category?: string;
  mediaType?: "audio" | "video";
  includeDeleted?: boolean;
  limit?: number;
  cursorCreatedAt?: string;
}) {
  const where: {
    groupId: string;
    deletedAt?: null;
    recordedBy?: string;
    category?: string;
    mediaType?: string;
    createdAt?: { lt: Date };
  } = { groupId: options.groupId };

  if (!options.includeDeleted) where.deletedAt = null;
  if (options.recordedBy) where.recordedBy = options.recordedBy;
  if (options.category) where.category = options.category;
  if (options.mediaType) where.mediaType = options.mediaType;
  if (options.cursorCreatedAt) {
    where.createdAt = { lt: new Date(options.cursorCreatedAt) };
  }

  const records = await prisma.choirRehearsalLibraryRecording.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 50,
  });
  return records.map(mapRecord);
}

export async function getChoirRehearsalLibraryRecording(id: string) {
  const record = await prisma.choirRehearsalLibraryRecording.findUnique({ where: { id } });
  return record ? mapRecord(record) : null;
}

export async function upsertChoirRehearsalLibraryRecording(recording: ChoirRehearsalLibraryRecording) {
  const createdAt = new Date(recording.createdAt);
  const updatedAt = new Date(recording.updatedAt);
  const record = await prisma.choirRehearsalLibraryRecording.upsert({
    where: { id: recording.id },
    create: {
      id: recording.id,
      groupId: recording.groupId,
      title: recording.title,
      description: recording.description ?? null,
      category: recording.category,
      mediaType: recording.mediaType,
      audioUrl: recording.audioUrl,
      fileName: recording.fileName,
      fileSizeBytes: recording.fileSizeBytes ?? null,
      durationSeconds: recording.durationSeconds ?? null,
      visibility: recording.visibility,
      uploadStatus: recording.uploadStatus,
      recordedBy: recording.recordedBy,
      recordedByName: recording.recordedByName,
      serviceDate: recording.serviceDate ?? null,
      serviceTime: recording.serviceTime ?? null,
      songId: recording.songId ?? null,
      vocalPart: recording.vocalPart ?? null,
      instrumentRole: recording.instrumentRole ?? null,
      createdAt,
      updatedAt,
      deletedAt: recording.deletedAt ? new Date(recording.deletedAt) : null,
    },
    update: {
      title: recording.title,
      description: recording.description ?? null,
      category: recording.category,
      mediaType: recording.mediaType,
      audioUrl: recording.audioUrl,
      fileName: recording.fileName,
      fileSizeBytes: recording.fileSizeBytes ?? null,
      durationSeconds: recording.durationSeconds ?? null,
      visibility: recording.visibility,
      uploadStatus: recording.uploadStatus,
      serviceDate: recording.serviceDate ?? null,
      serviceTime: recording.serviceTime ?? null,
      songId: recording.songId ?? null,
      vocalPart: recording.vocalPart ?? null,
      instrumentRole: recording.instrumentRole ?? null,
      updatedAt,
      deletedAt: recording.deletedAt ? new Date(recording.deletedAt) : null,
    },
  });
  return mapRecord(record);
}

export async function softDeleteChoirRehearsalLibraryRecording(id: string) {
  const existing = await prisma.choirRehearsalLibraryRecording.findUnique({ where: { id } });
  if (!existing) return null;
  const record = await prisma.choirRehearsalLibraryRecording.update({
    where: { id },
    data: { deletedAt: new Date(), updatedAt: new Date() },
  });
  return mapRecord(record);
}
