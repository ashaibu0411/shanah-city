import { del, list, put } from "@vercel/blob";
import type { PublicMember } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import type { GalleryDownloadRecord, GalleryPhoto, GalleryVisibility } from "@/lib/gallery-types";
import { getGalleryVisibility } from "@/lib/gallery-types";
import {
  isBlobPhotoUrl,
  isExternalPhotoUrl,
  isPrivatePhotoUrl,
} from "@/lib/gallery-utils";
import { useBlobStorage } from "@/lib/use-blob";
import * as galleryJson from "@/lib/stores/gallery-json";

function mapPhoto(record: {
  id: string;
  url: string;
  title: string;
  album: string;
  uploadedAt: Date;
  uploadedBy: string | null;
  linkProvider: string | null;
  visibility: string;
}): GalleryPhoto {
  return {
    id: record.id,
    url: record.url,
    title: record.title,
    album: record.album,
    uploadedAt: record.uploadedAt.toISOString(),
    visibility: getGalleryVisibility({ visibility: record.visibility } as GalleryPhoto),
    ...(record.uploadedBy ? { uploadedBy: record.uploadedBy } : {}),
    ...(record.linkProvider ? { linkProvider: record.linkProvider } : {}),
  };
}

function mapDownload(record: {
  id: string;
  photoId: string;
  photoTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  downloadedAt: Date;
  acceptedPolicy: boolean;
  policyVersion: string;
}): GalleryDownloadRecord {
  return {
    id: record.id,
    photoId: record.photoId,
    photoTitle: record.photoTitle,
    userId: record.userId,
    userName: record.userName,
    userEmail: record.userEmail,
    downloadedAt: record.downloadedAt.toISOString(),
    acceptedPolicy: record.acceptedPolicy,
    policyVersion: record.policyVersion,
  };
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const records = await prisma.galleryPhoto.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  return records.map(mapPhoto);
}

export async function getGalleryPhotoById(id: string) {
  const record = await prisma.galleryPhoto.findUnique({ where: { id } });
  return record ? mapPhoto(record) : null;
}

export async function addGalleryPhoto(photo: GalleryPhoto) {
  await prisma.galleryPhoto.create({
    data: {
      id: photo.id,
      url: photo.url,
      title: photo.title,
      album: photo.album,
      uploadedAt: new Date(photo.uploadedAt),
      uploadedBy: photo.uploadedBy ?? null,
      linkProvider: photo.linkProvider ?? null,
      visibility: getGalleryVisibility(photo),
    },
  });
}

export async function updateGalleryPhotoVisibility(
  id: string,
  visibility: GalleryVisibility,
) {
  const normalized = visibility === "public" ? "public" : "private";
  try {
    const record = await prisma.galleryPhoto.update({
      where: { id },
      data: { visibility: normalized },
    });
    return mapPhoto(record);
  } catch {
    return null;
  }
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
  if (isExternalPhotoUrl(photo.url)) {
    return;
  }

  if (isBlobPhotoUrl(photo.url)) {
    try {
      await del(photo.url);
    } catch {
      // Blob may already be missing.
    }
    return;
  }

  if (isPrivatePhotoUrl(photo.url)) {
    try {
      const filepath = await galleryJson.resolvePhotoFilePath(photo);
      const { promises: fs } = await import("fs");
      await fs.unlink(filepath);
    } catch {
      // File may already be missing.
    }
  }
}

export async function deleteGalleryAlbum(albumName: string) {
  const normalized = albumName.trim();
  if (!normalized || normalized === "All") {
    throw new Error("Invalid album name.");
  }

  const toRemove = await prisma.galleryPhoto.findMany({
    where: { album: normalized },
  });

  if (toRemove.length === 0) {
    return { album: normalized, deletedCount: 0 };
  }

  for (const photo of toRemove) {
    await deletePhotoFile(mapPhoto(photo));
  }

  await prisma.galleryPhoto.deleteMany({ where: { album: normalized } });

  return { album: normalized, deletedCount: toRemove.length };
}

export async function deleteGalleryPhoto(id: string) {
  const photo = await getGalleryPhotoById(id);
  if (!photo) {
    return null;
  }

  await deletePhotoFile(photo);
  await prisma.galleryPhoto.delete({ where: { id } });
  return photo;
}

export async function saveUploadedFile(file: File) {
  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    const pathname = `gallery/${Date.now()}-${safeName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type || undefined,
    });

    return blob.url;
  }

  return galleryJson.saveUploadedFile(file);
}

export async function resolvePhotoFilePath(photo: GalleryPhoto) {
  if (isBlobPhotoUrl(photo.url)) {
    throw new Error("Blob photos are fetched by URL.");
  }

  return galleryJson.resolvePhotoFilePath(photo);
}

export async function logGalleryDownload(
  photo: GalleryPhoto,
  user: PublicMember,
  acceptedPolicy: boolean,
  policyVersion: string,
) {
  await prisma.galleryDownload.create({
    data: {
      id: `dl-${Date.now()}`,
      photoId: photo.id,
      photoTitle: photo.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      downloadedAt: new Date(),
      acceptedPolicy,
      policyVersion,
    },
  });

  const excess = await prisma.galleryDownload.findMany({
    orderBy: { downloadedAt: "desc" },
    skip: 1000,
    select: { id: true },
  });

  if (excess.length > 0) {
    await prisma.galleryDownload.deleteMany({
      where: { id: { in: excess.map((record) => record.id) } },
    });
  }
}

export async function getGalleryDownloadLog(limit = 100) {
  const records = await prisma.galleryDownload.findMany({
    orderBy: { downloadedAt: "desc" },
    take: limit,
  });
  return records.map(mapDownload);
}
