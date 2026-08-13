export function hasMediaRole(user: { role?: string } | null) {
  return user?.role === "media";
}

/** Role-only check for client hints; use gallery-access-server for full upload access. */
export function canUploadGalleryByRole(user: { role?: string } | null) {
  return hasMediaRole(user);
}

export function canManageGallery(user: { role?: string } | null) {
  return user?.role === "media" || user?.role === "leader";
}

export function canViewGalleryDownloadLog(user: { role?: string } | null) {
  return canManageGallery(user);
}
