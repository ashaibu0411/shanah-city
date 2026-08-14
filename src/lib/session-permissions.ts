import { getAdminPermissions } from "@/lib/admin-access-server";
import { getDevotionWritePermissions } from "@/lib/devotion-access-server";
import { getGalleryUploadPermissions } from "@/lib/gallery-access-server";
import type { PublicMember } from "@/lib/auth-types";

const defaultPermissions = {
  canUploadGallery: false,
  canWriteDevotions: false,
  canManageAdmin: false,
};

export async function getSessionPermissions(user: PublicMember | null) {
  if (!user) {
    return defaultPermissions;
  }

  const [gallery, devotion, admin] = await Promise.all([
    getGalleryUploadPermissions(user),
    getDevotionWritePermissions(user),
    getAdminPermissions(user),
  ]);

  return {
    ...gallery,
    ...devotion,
    ...admin,
  };
}
