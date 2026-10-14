"use client";

import { upload } from "@vercel/blob/client";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { nativeRecordingPathToBlob } from "@/lib/shanah-native-recorder";
import { extensionForRecorderMime } from "@/lib/worship-audio-shared";
import type { PendingRehearsalUploadMeta } from "@/lib/rehearsal-recording-pending-upload";

export async function uploadRehearsalRecordingFile(options: {
  id: string;
  file: File;
  mimeType: string;
  onProgress?: (pct: number) => void;
}) {
  const ext = extensionForRecorderMime(options.mimeType || options.file.type);
  const path = `groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal-recordings/${options.id}/audio${ext}`;

  const blob = await upload(path, options.file, {
    access: "public",
    handleUploadUrl: "/api/groups/choir/rehearsal-recordings/upload",
    multipart: options.file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => options.onProgress?.(Math.round(percentage)),
  });

  return { audioUrl: blob.url, fileName: options.file.name };
}

export async function registerRehearsalRecording(meta: PendingRehearsalUploadMeta, audioUrl: string, fileName: string) {
  const response = await fetch("/api/groups/choir/rehearsal-recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: meta.id,
      groupId: meta.groupId,
      title: meta.title,
      description: meta.description ?? null,
      category: meta.category,
      visibility: meta.visibility,
      audioUrl,
      fileName,
      fileSizeBytes: meta.fileSizeBytes ?? null,
      durationSeconds: meta.durationSeconds,
      serviceDate: meta.serviceDate ?? null,
      serviceTime: meta.serviceTime ?? null,
      songId: meta.songId ?? null,
      vocalPart: meta.vocalPart ?? null,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Could not save recording details.");
  }
  return data.recording;
}

export async function pendingMetaToFile(meta: PendingRehearsalUploadMeta, blob?: Blob | null) {
  if (blob && blob.size > 0) {
    return new File([blob], meta.fileName, { type: meta.mimeType });
  }
  if (meta.nativePath) {
    const loaded = await nativeRecordingPathToBlob(meta.nativePath, meta.mimeType);
    return new File([loaded], meta.fileName, { type: meta.mimeType });
  }
  throw new Error("Recording file is missing on this device.");
}

export async function uploadAndRegisterPending(
  meta: PendingRehearsalUploadMeta,
  blob: Blob | null | undefined,
  onProgress?: (pct: number) => void,
) {
  const file = await pendingMetaToFile(meta, blob);
  meta.fileSizeBytes = file.size;
  const { audioUrl, fileName } = await uploadRehearsalRecordingFile({
    id: meta.id,
    file,
    mimeType: meta.mimeType,
    onProgress,
  });
  return registerRehearsalRecording(meta, audioUrl, fileName);
}
