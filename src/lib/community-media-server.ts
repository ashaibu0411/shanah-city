import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { useBlobStorage } from "@/lib/use-blob";

export const COMMUNITY_IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const COMMUNITY_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const COMMUNITY_STATUS_HOURS = 24;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
]);

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

function isImageFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    IMAGE_TYPES.has(file.type) ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif")
  );
}

function isVideoFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    VIDEO_TYPES.has(file.type) ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".3gp")
  );
}

async function savePublicFile(file: File, folder: string, fallbackType: string) {
  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const blob = await put(
      `community/${folder}/${Date.now()}-${safeFileName(file.name)}`,
      Buffer.from(bytes),
      {
        access: "public",
        contentType: file.type || fallbackType,
      },
    );
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "community", folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${Date.now()}-${safeFileName(file.name)}`;
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/community/${folder}/${fileName}`;
}

export async function saveCommunityImage(file: File) {
  if (!isImageFile(file)) {
    throw new Error("Upload a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be under 12 MB.");
  }
  return savePublicFile(file, "images", "image/jpeg");
}

export async function saveCommunityVideo(file: File) {
  if (!isVideoFile(file)) {
    throw new Error("Upload an MP4, MOV, or WEBM video.");
  }
  if (file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    throw new Error("Video must be under 50 MB.");
  }
  return savePublicFile(file, "videos", "video/mp4");
}

export async function saveCommunityMedia(file: File) {
  if (isImageFile(file)) {
    return { mediaUrl: await saveCommunityImage(file), mediaType: "image" as const };
  }
  if (isVideoFile(file)) {
    return { mediaUrl: await saveCommunityVideo(file), mediaType: "video" as const };
  }
  throw new Error("Upload a photo or video file.");
}

export function communityStatusExpiry() {
  return new Date(Date.now() + COMMUNITY_STATUS_HOURS * 60 * 60 * 1000);
}
