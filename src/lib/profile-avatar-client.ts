import { upload } from "@vercel/blob/client";
import {
  avatarFileExtension,
  inferAvatarContentType,
  normalizeAvatarFile,
} from "@/lib/avatar-image";
import { readJsonResponse } from "@/lib/read-json-response";
import type { PublicMember } from "@/lib/auth-types";

/** Vercel serverless POST body limit — use direct blob upload above this when possible. */
const AVATAR_FORM_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

type AvatarUploadResult = {
  user?: PublicMember | null;
  avatarSrc?: string | null;
  error?: string;
};

function uploadHandleUrl() {
  if (typeof window !== "undefined") {
    return new URL("/api/profile/avatar/upload", window.location.origin).toString();
  }
  return "/api/profile/avatar/upload";
}

function friendlyProfileUploadError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("load failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed")
  ) {
    return "Upload could not reach the server. Check your connection and try again.";
  }
  if (
    lower.includes("access denied") ||
    lower.includes("blob_read_write_token") ||
    lower.includes("storage is not configured")
  ) {
    return "Photo storage is not configured on the server yet. Please try again later or contact the church team.";
  }
  if (lower.includes("sign in")) {
    return message;
  }
  return message;
}

export async function fetchProfileAvatarUploadConfig() {
  const response = await fetch("/api/profile/avatar/upload", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await readJsonResponse<{ directUpload?: boolean; maxBytes?: number; error?: string }>(
    response,
  );
  if (!response.ok) {
    throw new Error(data.error ?? "Could not start profile photo upload.");
  }
  return {
    directUpload: Boolean(data.directUpload),
    maxBytes: data.maxBytes ?? 10 * 1024 * 1024,
  };
}

async function completeDirectAvatarUpload(blobPathname: string) {
  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ completedDirectUpload: true, blobPathname }),
  });
  const data = await readJsonResponse<AvatarUploadResult>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Could not save profile photo.");
  }

  return data;
}

async function uploadProfileAvatarForm(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await readJsonResponse<AvatarUploadResult>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Could not upload photo.");
  }

  return data;
}

export async function uploadProfileAvatarClient(userId: string, file: File) {
  const normalized = normalizeAvatarFile(file);
  const ext = avatarFileExtension(normalized);
  const pathname = `avatars/${userId}${ext}`;

  try {
    const blob = await upload(pathname, normalized, {
      access: "public",
      handleUploadUrl: uploadHandleUrl(),
      contentType: inferAvatarContentType(normalized.name, normalized.type),
    });

    return await completeDirectAvatarUpload(blob.pathname);
  } catch (directError) {
    const directMessage =
      directError instanceof Error ? directError.message : "Direct upload failed.";

    if (normalized.size <= AVATAR_FORM_FALLBACK_MAX_BYTES) {
      try {
        return await uploadProfileAvatarForm(normalized);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message : "Upload failed.";
        throw new Error(
          friendlyProfileUploadError(fallbackMessage || directMessage),
        );
      }
    }

    throw new Error(friendlyProfileUploadError(directMessage));
  }
}

/** Upload profile photo (blob client when configured, with server form fallback). */
export async function uploadProfileAvatar(userId: string, file: File, directUpload: boolean) {
  if (directUpload) {
    return uploadProfileAvatarClient(userId, file);
  }
  return uploadProfileAvatarForm(normalizeAvatarFile(file));
}
