import { promises as fs } from "fs";
import path from "path";
import type { PublicMember } from "@/lib/auth-types";
import type { GalleryDownloadRecord, GalleryPhoto, GalleryVisibility } from "@/lib/gallery-types";
import { getGalleryVisibility } from "@/lib/gallery-types";
import { isExternalPhotoUrl, isPrivatePhotoUrl } from "@/lib/gallery-utils";

const GALLERY_FILE = path.join(process.cwd(), "data", "gallery.json");
const SEED_FILE = path.join(process.cwd(), "data", "gallery.seed.json");
const DOWNLOADS_FILE = path.join(process.cwd(), "data", "gallery-downloads.json");
const PRIVATE_UPLOAD_DIR = path.join(process.cwd(), "data", "gallery", "files");
const PUBLIC_GALLERY_DIR = path.join(process.cwd(), "public", "gallery");

async function ensureGalleryFile() {
  try {
    await fs.access(GALLERY_FILE);
  } catch {
    await fs.mkdir(path.dirname(GALLERY_FILE), { recursive: true });
    const seed = await fs.readFile(SEED_FILE, "utf-8");
    await fs.writeFile(GALLERY_FILE, seed);
  }
}

async function readDownloads(): Promise<GalleryDownloadRecord[]> {
  try {
    const raw = await fs.readFile(DOWNLOADS_FILE, "utf-8");
    return JSON.parse(raw) as GalleryDownloadRecord[];
  } catch {
    return [];
  }
}

async function writeDownloads(records: GalleryDownloadRecord[]) {
  await fs.mkdir(path.dirname(DOWNLOADS_FILE), { recursive: true });
  await fs.writeFile(DOWNLOADS_FILE, JSON.stringify(records, null, 2));
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  await ensureGalleryFile();
  const raw = await fs.readFile(GALLERY_FILE, "utf-8");
  const photos = JSON.parse(raw) as GalleryPhoto[];
  return photos.map((photo) => ({
    ...photo,
    visibility: getGalleryVisibility(photo),
  }));
}

export async function getGalleryPhotoById(id: string) {
  const photos = await getGalleryPhotos();
  return photos.find((photo) => photo.id === id) ?? null;
}

export async function addGalleryPhoto(photo: GalleryPhoto) {
  const photos = await getGalleryPhotos();
  photos.unshift(photo);
  await fs.writeFile(GALLERY_FILE, JSON.stringify(photos, null, 2));
}

export async function updateGalleryPhotoVisibility(
  id: string,
  visibility: GalleryVisibility,
) {
  await ensureGalleryFile();
  const raw = await fs.readFile(GALLERY_FILE, "utf-8");
  const photos = JSON.parse(raw) as GalleryPhoto[];
  const index = photos.findIndex((photo) => photo.id === id);
  if (index === -1) {
    return null;
  }

  photos[index] = {
    ...photos[index],
    visibility: visibility === "public" ? "public" : "private",
  };
  await fs.writeFile(GALLERY_FILE, JSON.stringify(photos, null, 2));
  return photos[index];
}

export async function getGalleryAlbumCounts() {
  const photos = await getGalleryPhotos();
  const counts = new Map<string, number>();
  for (const photo of photos) {
    counts.set(photo.album, (counts.get(photo.album) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([album, count]) => ({ album, count }))
    .sort((a, b) => a.album.localeCompare(b.album));
}

async function deletePhotoFile(photo: GalleryPhoto) {
  if (!isPrivatePhotoUrl(photo.url) || isExternalPhotoUrl(photo.url)) {
    return;
  }
  try {
    const filepath = await resolvePhotoFilePath(photo);
    await fs.unlink(filepath);
  } catch {
    // File may already be missing.
  }
}

export async function deleteGalleryAlbum(albumName: string) {
  const normalized = albumName.trim();
  if (!normalized || normalized === "All") {
    throw new Error("Invalid album name.");
  }

  const photos = await getGalleryPhotos();
  const toRemove = photos.filter((photo) => photo.album === normalized);

  if (toRemove.length === 0) {
    return { album: normalized, deletedCount: 0 };
  }

  for (const photo of toRemove) {
    await deletePhotoFile(photo);
  }

  const remaining = photos.filter((photo) => photo.album !== normalized);
  await fs.writeFile(GALLERY_FILE, JSON.stringify(remaining, null, 2));

  return { album: normalized, deletedCount: toRemove.length };
}

export async function saveUploadedFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");

  const filename = `${Date.now()}-${safeName}`;
  await fs.mkdir(PRIVATE_UPLOAD_DIR, { recursive: true });
  const filepath = path.join(PRIVATE_UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);

  return `private/${filename}`;
}

export async function resolvePhotoFilePath(photo: GalleryPhoto) {
  if (isExternalPhotoUrl(photo.url)) {
    throw new Error("External photo links are not stored on the server.");
  }

  if (isPrivatePhotoUrl(photo.url)) {
    const filename = photo.url.replace(/^private\//, "");
    return path.join(PRIVATE_UPLOAD_DIR, filename);
  }

  if (photo.url.startsWith("/gallery/")) {
    return path.join(process.cwd(), "public", photo.url.replace(/^\//, ""));
  }

  return path.join(PUBLIC_GALLERY_DIR, photo.url.replace(/^\//, ""));
}

export async function logGalleryDownload(
  photo: GalleryPhoto,
  user: PublicMember,
  acceptedPolicy: boolean,
  policyVersion: string,
) {
  const records = await readDownloads();
  records.unshift({
    id: `dl-${Date.now()}`,
    photoId: photo.id,
    photoTitle: photo.title,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    downloadedAt: new Date().toISOString(),
    acceptedPolicy,
    policyVersion,
  });
  await writeDownloads(records.slice(0, 1000));
}

export async function getGalleryDownloadLog(limit = 100) {
  const records = await readDownloads();
  return records.slice(0, limit);
}
