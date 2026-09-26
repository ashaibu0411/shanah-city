import { prisma } from "@/lib/db";
import type { WorshipRehearsalRecording } from "@/lib/worship-types";

function mapRecording(record: {
  id: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
  audioUrl: string;
  fileName: string;
  durationSeconds: number | null;
  recordedBy: string;
  recordedByName: string;
  createdAt: Date;
}): WorshipRehearsalRecording {
  return {
    id: record.id,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    title: record.title,
    audioUrl: record.audioUrl,
    fileName: record.fileName,
    durationSeconds: record.durationSeconds ?? undefined,
    recordedBy: record.recordedBy,
    recordedByName: record.recordedByName,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listWorshipRehearsalRecordings(options: {
  serviceDate: string;
  serviceTime: string;
}) {
  const records = await prisma.worshipRehearsalRecording.findMany({
    where: {
      serviceDate: options.serviceDate,
      serviceTime: options.serviceTime,
    },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapRecording);
}

export async function addWorshipRehearsalRecording(recording: WorshipRehearsalRecording) {
  const createdAt = new Date(recording.createdAt);
  const record = await prisma.worshipRehearsalRecording.upsert({
    where: { id: recording.id },
    create: {
      id: recording.id,
      serviceDate: recording.serviceDate,
      serviceTime: recording.serviceTime,
      title: recording.title,
      audioUrl: recording.audioUrl,
      fileName: recording.fileName,
      durationSeconds: recording.durationSeconds ?? null,
      recordedBy: recording.recordedBy,
      recordedByName: recording.recordedByName,
      createdAt,
    },
    update: {
      serviceDate: recording.serviceDate,
      serviceTime: recording.serviceTime,
      title: recording.title,
      audioUrl: recording.audioUrl,
      fileName: recording.fileName,
      durationSeconds: recording.durationSeconds ?? null,
      recordedBy: recording.recordedBy,
      recordedByName: recording.recordedByName,
      createdAt,
    },
  });
  return mapRecording(record);
}

export async function deleteWorshipRehearsalRecording(id: string) {
  const existing = await prisma.worshipRehearsalRecording.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.worshipRehearsalRecording.delete({ where: { id } });
  return mapRecording(existing);
}

export async function getWorshipRehearsalRecording(id: string) {
  const record = await prisma.worshipRehearsalRecording.findUnique({ where: { id } });
  return record ? mapRecording(record) : null;
}
