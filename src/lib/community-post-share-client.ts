import type { CommunityPost } from "@/lib/member-types";
import { communityPostMediaItems } from "@/lib/community-post-media";

export function communityPostSharePageUrl(postId: string) {
  if (typeof window === "undefined") {
    return `/community#post-${postId}`;
  }
  return `${window.location.origin}/community#post-${encodeURIComponent(postId)}`;
}

export function communityPostShareCaption(post: Pick<CommunityPost, "author" | "content">) {
  const body = post.content.trim();
  if (body) {
    return `${post.author}: ${body}`;
  }
  return post.author;
}

export function communityPostShareText(
  post: Pick<CommunityPost, "author" | "content" | "id">,
  includeLink = true,
) {
  const caption = communityPostShareCaption(post);
  if (!includeLink) return caption.slice(0, 2000);
  const url = communityPostSharePageUrl(post.id);
  return `${caption}\n\n${url}`.slice(0, 2000);
}

export function communityPostImageUrls(post: Pick<CommunityPost, "mediaItems" | "mediaUrl" | "mediaType">) {
  return communityPostMediaItems(post)
    .filter((item) => item.type === "image")
    .map((item) => item.url);
}

export function communityPostVideoUrls(post: Pick<CommunityPost, "mediaItems" | "mediaUrl" | "mediaType">) {
  return communityPostMediaItems(post)
    .filter((item) => item.type === "video")
    .map((item) => item.url);
}

function resolveMediaFetchUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return url.startsWith("/") ? `${window.location.origin}${url}` : `${window.location.origin}/${url}`;
}

function extensionForBlob(blob: Blob, fallback: string) {
  if (blob.type.includes("png")) return "png";
  if (blob.type.includes("webp")) return "webp";
  if (blob.type.includes("gif")) return "gif";
  if (blob.type.includes("mp4")) return "mp4";
  if (blob.type.includes("webm")) return "webm";
  return fallback;
}

export async function fetchCommunityMediaBlob(
  url: string,
  kind: "image" | "video" = "image",
): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch(resolveMediaFetchUrl(url));
  if (!response.ok) {
    throw new Error("Could not load this file. Try again on Wi‑Fi or open the post in your browser.");
  }
  const blob = await response.blob();
  const ext = extensionForBlob(blob, kind === "video" ? "mp4" : "jpg");
  return { blob, fileName: `shanah-community-${Date.now()}.${ext}` };
}

export async function downloadCommunityMediaUrl(url: string, kind: "image" | "video" = "image") {
  const { blob, fileName } = await fetchCommunityMediaBlob(url, kind);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

export async function downloadAllCommunityImages(urls: string[]) {
  for (const url of urls) {
    await downloadCommunityMediaUrl(url, "image");
  }
}

function canShareWithFiles(files: File[]) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  if (!navigator.canShare) return files.length > 0;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareCommunityPostLink(post: Pick<CommunityPost, "author" | "content" | "id">) {
  const url = communityPostSharePageUrl(post.id);
  const text = communityPostShareCaption(post).slice(0, 500);
  if (navigator.share) {
    await navigator.share({ title: "Shanah City Community", text, url });
    return "shared" as const;
  }
  await navigator.clipboard.writeText(communityPostShareText(post));
  return "copied" as const;
}

export async function shareCommunityImageOnly(url: string) {
  const { blob, fileName } = await fetchCommunityMediaBlob(url, "image");
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  if (canShareWithFiles([file])) {
    await navigator.share({ files: [file], title: "Shanah City" });
    return "shared" as const;
  }
  await downloadCommunityMediaUrl(url, "image");
  return "downloaded" as const;
}

export async function shareCommunityImageWithCaption(
  url: string,
  post: Pick<CommunityPost, "author" | "content" | "id">,
) {
  const { blob, fileName } = await fetchCommunityMediaBlob(url, "image");
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  const caption = communityPostShareCaption(post).slice(0, 500);
  const link = communityPostSharePageUrl(post.id);
  const text = `${caption}\n\n${link}`.slice(0, 2000);

  if (canShareWithFiles([file])) {
    await navigator.share({
      files: [file],
      text,
      title: "Shanah City Community",
    });
    return "shared" as const;
  }

  await downloadCommunityMediaUrl(url, "image");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // download alone is still useful
  }
  return "downloaded" as const;
}

export async function copyCommunityPostLink(postId: string) {
  await navigator.clipboard.writeText(communityPostSharePageUrl(postId));
}

export async function copyCommunityPostCaption(post: Pick<CommunityPost, "author" | "content" | "id">) {
  await navigator.clipboard.writeText(communityPostShareText(post, false));
}
