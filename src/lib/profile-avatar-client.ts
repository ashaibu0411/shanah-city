import { upload } from "@vercel/blob/client";
import {
  avatarFileExtension,
  inferAvatarContentType,
  normalizeAvatarFile,
} from "@/lib/avatar-image";
import { readJsonResponse } from "@/lib/read-json-response";

function uploadHandleUrl() {
  if (typeof window !== "undefined") {
    return new URL("/api/profile/avatar/upload", window.location.origin).toString();
  }
  return "/api/profile/avatar/upload";
}

export async function fetchProfileAvatarUploadConfig() {
  const response = await fetch("/api/profile/avatar/upload", { cache: "no-store" });
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

export async function uploadProfileAvatarClient(userId: string, file: File) {
  const normalized = normalizeAvatarFile(file);
  const ext = avatarFileExtension(normalized);
  const pathname = `avatars/${userId}${ext}`;

  await upload(pathname, normalized, {
    access: "public",
    handleUploadUrl: uploadHandleUrl(),
    contentType: inferAvatarContentType(normalized.name, normalized.type),
  });

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completedDirectUpload: true }),
  });
  const data = await readJsonResponse<{
    user?: import("@/lib/auth-types").PublicMember;
    avatarSrc?: string | null;
    error?: string;
  }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Could not save profile photo.");
  }

  return data;
}
