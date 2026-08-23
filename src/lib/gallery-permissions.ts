/** Legacy profile label only — media access is granted via Media Team group membership. */
export function hasMediaRole(user: { role?: string } | null) {
  return user?.role === "media";
}

/** @deprecated Use session permissions from gallery-access-server instead. */
export function canUploadGalleryByRole(user: { role?: string } | null) {
  return false;
}

/** @deprecated Use canManageGallery from gallery-access-server instead. */
export function canManageGallery(_user: { role?: string } | null) {
  return false;
}

/** @deprecated Use canViewGalleryDownloadLog from gallery-access-server instead. */
export function canViewGalleryDownloadLog(user: { role?: string } | null) {
  return canManageGallery(user);
}
