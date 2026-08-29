import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_STATUS_HOURS,
  COMMUNITY_VIDEO_MAX_BYTES,
  inferCommunityImageContentType,
  inferCommunityVideoContentType,
  isCommunityImageFile,
  isCommunityVideoFile,
} from "@/lib/community-media-shared";
import { useBlobStorage } from "@/lib/use-blob";

export {
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_VIDEO_MAX_BYTES,
  COMMUNITY_STATUS_HOURS,
} from "@/lib/community-media-shared";

function safeFileName(name: string) {
  const base = (name || "upload")
    .normalize("NFKD")
    .replace(/[\u202f\u00a0]/g, "-")
    .trim();
  return base
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "upload";
}

async function savePublicFile(
  file: File,
  folder: "images" | "videos",
  fallbackType: string,
) {
  const contentType =
    folder === "videos"
      ? inferCommunityVideoContentType(file.name, file.type)
      : inferCommunityImageContentType(file.name, file.type);

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const blob = await put(
      `community/${folder}/${Date.now()}-${safeFileName(file.name)}`,
      Buffer.from(bytes),
      {
        access: "public",
        contentType: file.type || contentType || fallbackType,
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
  if (!isCommunityImageFile(file)) {
    throw new Error("Upload a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be under 12 MB.");
  }
  return savePublicFile(file, "images", "image/jpeg");
}

export async function saveCommunityVideo(file: File) {
  if (!isCommunityVideoFile(file)) {
    throw new Error("Upload an MP4, MOV, or WEBM video.");
  }
  if (file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    throw new Error("Video must be under 50 MB.");
  }
  return savePublicFile(file, "videos", "video/mp4");
}

export async function saveCommunityMedia(file: File) {
  if (isCommunityImageFile(file)) {
    return { mediaUrl: await saveCommunityImage(file), mediaType: "image" as const };
  }
  if (isCommunityVideoFile(file)) {
    return { mediaUrl: await saveCommunityVideo(file), mediaType: "video" as const };
  }
  throw new Error("Upload a photo or video file.");
}

export function communityStatusExpiry() {
  return new Date(Date.now() + COMMUNITY_STATUS_HOURS * 60 * 60 * 1000);
}
