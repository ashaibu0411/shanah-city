import path from "path";
import type { PublicMember } from "@/lib/auth-types";
import type { GalleryPhoto } from "@/lib/gallery-types";
import {
  canManageGallery,
  canUploadGalleryByRole,
  canViewGalleryDownloadLog,
  hasMediaRole,
} from "@/lib/gallery-permissions";
import { useDatabase } from "@/lib/use-database";
import * as galleryDb from "@/lib/stores/gallery-db";
import * as galleryJson from "@/lib/stores/gallery-json";

const store = () => (useDatabase() ? galleryDb : galleryJson);

export const getGalleryPhotos = () => store().getGalleryPhotos();
export const getGalleryPhotoById = (id: string) => store().getGalleryPhotoById(id);
export const addGalleryPhoto = (photo: GalleryPhoto) => store().addGalleryPhoto(photo);
export const getGalleryAlbumCounts = () => store().getGalleryAlbumCounts();
export const deleteGalleryAlbum = (albumName: string) => store().deleteGalleryAlbum(albumName);
export const saveUploadedFile = (file: File) => store().saveUploadedFile(file);
export const resolvePhotoFilePath = (photo: GalleryPhoto) => store().resolvePhotoFilePath(photo);
export const logGalleryDownload = (
  photo: GalleryPhoto,
  user: PublicMember,
  acceptedPolicy: boolean,
  policyVersion: string,
) => store().logGalleryDownload(photo, user, acceptedPolicy, policyVersion);
export const getGalleryDownloadLog = (limit?: number) => store().getGalleryDownloadLog(limit);

export function isAllowedImage(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  return allowed.includes(file.type) && file.size <= 10 * 1024 * 1024;
}

export { canUploadGalleryByRole, canManageGallery, canViewGalleryDownloadLog, hasMediaRole };

export function guessContentType(filepath: string) {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export function guessDownloadFilename(photo: GalleryPhoto, filepath: string) {
  const ext = path.extname(filepath) || ".jpg";
  const base = photo.title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `${base || "photo"}${ext}`;
}

const ALLOWED_LINK_HOSTS = [
  "photos.google.com",
  "photos.app.goo.gl",
  "googleusercontent.com",
  "drive.google.com",
  "docs.google.com",
  "onedrive.live.com",
  "1drv.ms",
  "sharepoint.com",
  "dropbox.com",
  "dl.dropboxusercontent.com",
  "icloud.com",
  "box.com",
];

function detectLinkProvider(hostname: string) {
  const host = hostname.toLowerCase();
  if (host.includes("google") || host.includes("goo.gl")) return "Google Photos / Drive";
  if (host.includes("onedrive") || host.includes("1drv") || host.includes("sharepoint")) {
    return "OneDrive";
  }
  if (host.includes("dropbox")) return "Dropbox";
  if (host.includes("icloud")) return "iCloud";
  if (host.includes("box.com")) return "Box";
  return "Cloud link";
}

function isAllowedLinkHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_LINK_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function normalizeExternalPhotoUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Enter a valid https link.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Photo links must start with https://");
  }

  if (!isAllowedLinkHost(url.hostname)) {
    throw new Error(
      "Use a share link from Google Photos, Google Drive, OneDrive, Dropbox, iCloud, or Box.",
    );
  }

  if (
    url.hostname.includes("dropbox.com") &&
    !url.hostname.includes("dl.dropboxusercontent.com")
  ) {
    url.searchParams.set("dl", "1");
  }

  if (
    url.hostname.includes("sharepoint.com") ||
    url.hostname === "onedrive.live.com"
  ) {
    url.searchParams.set("download", "1");
  }

  const provider = detectLinkProvider(url.hostname);
  return {
    storedUrl: `external:${url.toString()}`,
    provider,
  };
}
