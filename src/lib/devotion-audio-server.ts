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
]);

const MAX_BYTES = 25 * 1024 * 1024;

export function isAllowedDevotionAudio(file: File) {
  if (file.size > MAX_BYTES) return false;
  if (AUDIO_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".mp3") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".webm")
  );
}

export async function saveDevotionAudioFile(file: File) {
  if (!isAllowedDevotionAudio(file)) {
    throw new Error("Upload an audio file under 25 MB (mp3, m4a, wav, ogg, webm).");
  }

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const pathname = `devotions/${Date.now()}-${safeName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type || "audio/mpeg",
    });
    return { url: blob.url, fileName: file.name };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "devotions");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
  const filePath = path.join(uploadsDir, safeName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
  return { url: `/uploads/devotions/${safeName}`, fileName: file.name };
}
