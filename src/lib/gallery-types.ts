export type GalleryVisibility = "public" | "private";

export type GalleryPhoto = {
  id: string;
  url: string;
  title: string;
  album: string;
  uploadedAt: string;
  uploadedBy?: string;
  linkProvider?: string;
  visibility?: GalleryVisibility;
};

export function getGalleryVisibility(photo: GalleryPhoto): GalleryVisibility {
  return photo.visibility === "public" ? "public" : "private";
}

export function isMembersOnlyGalleryPhoto(photo: GalleryPhoto) {
  return getGalleryVisibility(photo) === "private";
}

export type GalleryDownloadRecord = {
  id: string;
  photoId: string;
  photoTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  downloadedAt: string;
  acceptedPolicy: boolean;
  policyVersion: string;
};

export const galleryAlbums = [
  "All",
  "Worship",
  "Community",
  "Events",
  "Youth",
  "Ministry",
] as const;

export type GalleryAlbum = (typeof galleryAlbums)[number];
