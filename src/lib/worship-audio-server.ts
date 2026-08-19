import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { useBlobStorage } from "@/lib/use-blob";

const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "video/webm",
]);

const MAX_BYTES = 25 * 1024 * 1024;

export function isAllowedWorshipAudio(file: File) {
  if (file.size > MAX_BYTES) return false;
  if (AUDIO_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".webm") ||
    lower.endsWith(".mp3") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".ogg")
  );
}

export async function saveWorshipAudioFile(file: File, folder = "rehearsals") {
  if (!isAllowedWorshipAudio(file)) {
    throw new Error("Upload an audio file under 25 MB (webm, mp3, m4a, wav).");
  }

  const safeFolder = folder.replace(/[^a-z0-9/-]/gi, "");

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const pathname = `worship/${safeFolder}/${Date.now()}-${safeName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type || "audio/webm",
    });
    return { url: blob.url, fileName: file.name };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "worship", safeFolder);
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
  const filePath = path.join(uploadsDir, safeName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
  return { url: `/uploads/worship/${safeFolder}/${safeName}`, fileName: file.name };
}

export async function saveWorshipPracticeStemFile(file: File) {
  return saveWorshipAudioFile(file, "practice");
}
