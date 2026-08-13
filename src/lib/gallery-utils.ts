import type { GalleryPhoto } from "@/lib/gallery-types";

export function isPrivatePhotoUrl(url: string) {
  return url.startsWith("private/");
}

export function isExternalPhotoUrl(url: string) {
  return url.startsWith("external:");
}

export function isBlobPhotoUrl(url: string) {
  return url.startsWith("https://") && url.includes(".blob.vercel-storage.com");
}

export function getExternalPhotoUrl(url: string) {
  return url.replace(/^external:/, "");
}

export function getPhotoDisplayUrl(photo: GalleryPhoto) {
  if (isPrivatePhotoUrl(photo.url)) {
    return `/api/gallery/download?id=${photo.id}&inline=1`;
  }
  if (isExternalPhotoUrl(photo.url)) {
    return getExternalPhotoUrl(photo.url);
  }
  if (isBlobPhotoUrl(photo.url)) {
    return photo.url;
  }
  return photo.url;
}

export function getPhotoDownloadUrl(photo: GalleryPhoto) {
  if (isExternalPhotoUrl(photo.url)) {
    return `/api/gallery/download?id=${photo.id}&agreed=1`;
  }
  return `/api/gallery/download?id=${photo.id}&agreed=1`;
}

export function getPhotoSourceLabel(photo: GalleryPhoto) {
  if (isExternalPhotoUrl(photo.url)) {
    return photo.linkProvider ?? "Cloud link";
  }
  if (isPrivatePhotoUrl(photo.url) || isBlobPhotoUrl(photo.url)) {
    return "Shanah City upload";
  }
  return "Gallery";
}
