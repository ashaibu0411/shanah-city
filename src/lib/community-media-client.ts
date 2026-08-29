import { upload } from "@vercel/blob/client";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_VIDEO_MAX_BYTES,
  inferCommunityMediaType,
  isCommunityImageFile,
  isCommunityVideoFile,
} from "@/lib/community-media-shared";

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadCommunityMediaClient(file: File) {
  const mediaType = inferCommunityMediaType(file);
  if (!mediaType) {
    throw new Error("Upload a photo or video file.");
  }
  if (mediaType === "image" && file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be under 12 MB.");
  }
  if (mediaType === "video" && file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    throw new Error("Video must be under 50 MB.");
  }

  const folder = mediaType === "video" ? "videos" : "images";
  const pathname = `community/${folder}/${Date.now()}-${safeFileName(file.name)}`;

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/community/media/upload",
      multipart: file.size > 8 * 1024 * 1024,
      contentType: file.type || undefined,
    });
    return { mediaUrl: blob.url, mediaType };
  } catch {
    return uploadCommunityMediaFallback(file, mediaType);
  }
}

async function uploadCommunityMediaFallback(file: File, mediaType: "image" | "video") {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/community/media", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Upload failed.");
  }
  if (data.mediaType !== mediaType) {
    throw new Error("Upload failed. Try an MP4 video or JPG photo.");
  }
  return { mediaUrl: data.mediaUrl as string, mediaType: data.mediaType as "image" | "video" };
}

export function validateCommunityStoryFile(file: File) {
  if (!isCommunityImageFile(file) && !isCommunityVideoFile(file)) {
    return "Upload a photo or video file.";
  }
  if (isCommunityImageFile(file) && file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    return "Image must be under 12 MB.";
  }
  if (isCommunityVideoFile(file) && file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    return "Video must be under 50 MB.";
  }
  return null;
}
