import { upload } from "@vercel/blob/client";
import {
  COMMUNITY_AUDIO_MAX_BYTES,
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_VIDEO_MAX_BYTES,
  inferCommunityAudioContentType,
  inferCommunityImageContentType,
  inferCommunityMediaType,
  inferCommunityVideoContentType,
  isCommunityAudioFile,
  isCommunityImageFile,
  isCommunityVideoFile,
} from "@/lib/community-media-shared";
import { readJsonResponse } from "@/lib/read-json-response";

function uploadHandleUrl() {
  if (typeof window === "undefined") return "/api/community/media/upload";
  return `${window.location.origin}/api/community/media/upload`;
}

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

function uploadContentType(file: File, mediaType: "image" | "video" | "audio") {
  if (file.type) return file.type;
  if (mediaType === "video") return inferCommunityVideoContentType(file.name);
  if (mediaType === "audio") return inferCommunityAudioContentType(file.name);
  return inferCommunityImageContentType(file.name);
}

function uploadFolder(mediaType: "image" | "video" | "audio") {
  if (mediaType === "video") return "videos";
  if (mediaType === "audio") return "audio";
  return "images";
}

export async function uploadCommunityMediaClient(file: File) {
  const mediaType = inferCommunityMediaType(file);
  if (!mediaType) {
    throw new Error("Upload a photo, video, or audio file.");
  }
  if (mediaType === "image" && file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be under 12 MB.");
  }
  if (mediaType === "video" && file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    throw new Error("Video must be under 50 MB.");
  }
  if (mediaType === "audio" && file.size > COMMUNITY_AUDIO_MAX_BYTES) {
    throw new Error("Audio must be under 15 MB.");
  }

  const folder = uploadFolder(mediaType);
  const pathname = `community/${folder}/${Date.now()}-${safeFileName(file.name)}`;

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: uploadHandleUrl(),
      multipart: file.size > 8 * 1024 * 1024,
      contentType: uploadContentType(file, mediaType),
    });
    return { mediaUrl: blob.url, mediaType };
  } catch (blobError) {
    try {
      return await uploadCommunityMediaFallback(file, mediaType);
    } catch (fallbackError) {
      const blobMessage =
        blobError instanceof Error ? blobError.message : "Direct upload failed.";
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : "Upload failed.";
      throw new Error(fallbackMessage || blobMessage);
    }
  }
}

async function uploadCommunityMediaFallback(
  file: File,
  mediaType: "image" | "video" | "audio",
) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/community/media", { method: "POST", body: formData });
  const data = await readJsonResponse<{ mediaUrl?: string; mediaType?: string; error?: string }>(
    response,
  );
  if (!response.ok) {
    throw new Error(data.error ?? "Upload failed.");
  }
  if (data.mediaType !== mediaType || !data.mediaUrl) {
    throw new Error("Upload failed. Try MP3, MP4, or JPG.");
  }
  return { mediaUrl: data.mediaUrl, mediaType: data.mediaType as "image" | "video" | "audio" };
}

export function validateCommunityStoryFile(file: File) {
  if (!isCommunityImageFile(file) && !isCommunityVideoFile(file) && !isCommunityAudioFile(file)) {
    return "Upload a photo, video, or audio file.";
  }
  if (isCommunityImageFile(file) && file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    return "Image must be under 12 MB.";
  }
  if (isCommunityVideoFile(file) && file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    return "Video must be under 50 MB.";
  }
  if (isCommunityAudioFile(file) && file.size > COMMUNITY_AUDIO_MAX_BYTES) {
    return "Audio must be under 15 MB.";
  }
  return null;
}

/** Prayer/praise posts — photos and videos only (audio → use Moments). */
export function validateCommunityPostMediaFile(file: File) {
  if (!isCommunityImageFile(file) && !isCommunityVideoFile(file)) {
    return "Upload a photo or video file. For audio, use Moments (+ on Stories).";
  }
  if (isCommunityImageFile(file) && file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    return "Image must be under 12 MB.";
  }
  if (isCommunityVideoFile(file) && file.size > COMMUNITY_VIDEO_MAX_BYTES) {
    return "Video must be under 50 MB.";
  }
  return null;
}
