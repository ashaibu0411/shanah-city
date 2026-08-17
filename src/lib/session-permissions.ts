import { getAdminPermissions } from "@/lib/admin-access-server";
import { getDevotionWritePermissions } from "@/lib/devotion-access-server";
import { getFinancePermissions } from "@/lib/finance-access-server";
import { getGalleryUploadPermissions } from "@/lib/gallery-access-server";
import { getWorshipPermissions } from "@/lib/worship-access-server";
import type { PublicMember } from "@/lib/auth-types";

const defaultPermissions = {
  canUploadGallery: false,
  canWriteDevotions: false,
  canManageAdmin: false,
  canAccessFinance: false,
  canAccessWorshipPlanner: false,
  canManageWorshipPlan: false,
};

export async function getSessionPermissions(user: PublicMember | null) {
  if (!user) {
    return defaultPermissions;
  }

  const [gallery, devotion, admin, finance, worship] = await Promise.all([
    getGalleryUploadPermissions(user),
    getDevotionWritePermissions(user),
    getAdminPermissions(user),
    getFinancePermissions(user),
    getWorshipPermissions(user),
  ]);

  return {
    ...gallery,
    ...devotion,
    ...admin,
    ...finance,
    ...worship,
  };
}
