import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { MEDIA_CLIP_MAX_BYTES } from "@/lib/media-clip-limits";
import { useBlobStorage } from "@/lib/use-blob";

export { MEDIA_CLIP_MAX_BYTES, MEDIA_CLIP_MAX_SECONDS } from "@/lib/media-clip-limits";

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg",
]);

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const MEDIA_CLIP_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
];

export const MEDIA_CLIP_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isVideoName(name: string) {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v")
  );
}

function isImageName(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
}

export function isAllowedMediaClipVideo(file: File) {
  if (file.size > MEDIA_CLIP_MAX_BYTES) return false;
  return VIDEO_TYPES.has(file.type) || isVideoName(file.name);
}

export function isAllowedMediaClipImage(file: File) {
  if (file.size > 6 * 1024 * 1024) return false;
  return IMAGE_TYPES.has(file.type) || isImageName(file.name);
}

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

async function savePublicFile(file: File, fallbackType: string) {
  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const blob = await put(`media/clips/${Date.now()}-${safeFileName(file.name)}`, Buffer.from(bytes), {
      access: "public",
      contentType: file.type || fallbackType,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "media");
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${Date.now()}-${safeFileName(file.name)}`;
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/media/${fileName}`;
}

export async function saveMediaClipVideoFile(file: File) {
  if (!isAllowedMediaClipVideo(file)) {
    throw new Error("Upload an MP4, MOV, or WEBM short under 80 MB.");
  }
  return savePublicFile(file, "video/mp4");
}

export async function saveMediaClipPosterFile(file: File) {
  if (!isAllowedMediaClipImage(file)) {
    throw new Error("Poster image must be a JPG, PNG, or WEBP under 6 MB.");
  }
  return savePublicFile(file, "image/jpeg");
}
